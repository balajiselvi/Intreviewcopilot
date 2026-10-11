const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { publicLlmError } = require("../lib/generationGuard");
const source = fs.readFileSync(path.join(__dirname, "../pages/api/chat.js"), "utf8");
const functions = source.slice(source.indexOf("async function streamGeminiResponse"), source.indexOf("function setSSEHeaders"));
let checks = 0;

function harness(events, { failAfter = false, failFirst = false } = {}) {
  let calls = 0;
  const options = [];
  async function* stream() { for (const event of events) yield event; if (failAfter) throw new Error("network failure"); }
  async function create() { calls++; if (failFirst && calls === 1) throw Object.assign(new Error("network failure"), { status: 503 }); return stream(); }
  class OpenAI { constructor(opts) { options.push(opts); this.chat = { completions: { create } }; } }
  class Anthropic { constructor(opts) { options.push(opts); this.messages = { create }; } }
  class GoogleGenerativeAI { getGenerativeModel() { return { startChat() { return { async sendMessageStream() { return { stream: await create() }; } }; } }; } }
  const api = new Function("OpenAI", "Anthropic", "GoogleGenerativeAI", "publicLlmError", "stripStreamMarkdown", "writeSSEChunk", `${functions}; return { streamOpenAIResponse, streamOpenRouterResponse, streamGroqResponse, streamClaudeResponse, streamGeminiResponse };`)(
    OpenAI, Anthropic, GoogleGenerativeAI, publicLlmError, t => String(t || "").replace(/\*/g, ""), (res, t) => res.chunks.push(t)
  );
  return { api, options, calls: () => calls };
}
const openai = [
  { choices: [{ delta: { content: "Partial text" } }] },
  { choices: [{ delta: {}, finish_reason: "length" }] }
];
const providers = [
  ["streamOpenAIResponse", [...openai, { choices: [], usage: { prompt_tokens: 10, completion_tokens: 3, total_tokens: 13 } }]],
  ["streamOpenRouterResponse", openai],
  ["streamGroqResponse", openai],
  ["streamClaudeResponse", [
    { type: "content_block_delta", delta: { type: "text_delta", text: "Partial text" } },
    { type: "message_delta", delta: { stop_reason: "max_tokens" } }
  ]],
  ["streamGeminiResponse", [{ text: () => "Partial text", candidates: [{ finishReason: "MAX_TOKENS" }] }]]
];
function args(controller = new AbortController()) {
  const chunks = [];
  let recorded = "";
  let usage = {};
  return {
    input: { apiKey: "local-test-only", model: "test", systemPrompt: "test", recentHistory: [], question: "test", maxTokens: 50,
      res: { chunks }, signal: controller.signal, onChunk(t) { recorded += t; }, onUsage(u) { usage = { ...usage, ...u }; } },
    result: () => ({ recorded, usage, chunks })
  };
}
async function main() {
  for (const [name, events] of providers) {
    const h = harness(events);
    const a = args();
    assert.equal(await h.api[name](a.input), "Partial text");
    assert.equal(a.result().recorded, "Partial text", `${name} must preserve partial text`);
    assert.ok(a.result().usage.finish_reason, `${name} must expose provider finish reason`);
    assert.deepEqual(a.result().chunks, ["Partial text"]);
    if (name !== "streamGeminiResponse") assert.equal(h.options[0].maxRetries, 0);
    const aborted = new AbortController(); aborted.abort();
    await assert.rejects(h.api[name](args(aborted).input), e => e.name === "AbortError");
    const failing = harness(events.slice(0, 1), { failAfter: true });
    const partial = args();
    await assert.rejects(failing.api[name](partial.input), /network failure/);
    assert.equal(partial.result().recorded, "Partial text");
    checks += 3;
  }
  const retry = harness(openai, { failFirst: true });
  await retry.api.streamOpenAIResponse(args().input);
  assert.equal(retry.calls(), 2, "one application retry, SDK retries disabled");
  console.log(`providerStreamAssert: PASS (${checks} provider controls plus bounded retry; no API calls)`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
