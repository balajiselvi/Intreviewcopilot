const assert = require("node:assert/strict");
const { consumeChatStream } = require("../lib/chatStream");
const { historyForGeneration } = require("../lib/liveSessionOperator");
const encoder = new TextEncoder();
let checks = 0;
function response(chunks, { open = false } = {}) {
  let cancelled = false;
  const body = new ReadableStream({
    start(controller) { chunks.forEach(chunk => controller.enqueue(chunk)); if (!open) controller.close(); },
    cancel() { cancelled = true; }
  });
  return { body, wasCancelled: () => cancelled };
}
async function read(chunks, options) {
  let text = "";
  const events = [];
  const res = response(chunks, options);
  const result = await consumeChatStream(res, {
    onText(chunk) { text += chunk; }, onEvent(name, payload) { events.push([name, payload]); }
  });
  assert.equal(res.body.locked, false);
  checks++;
  return { text, events, result, res };
}
async function main() {
  const wire = ': heartbeat\r\nevent: admission\r\ndata: {"decision":"ANSWER"}\r\n\r\ndata:{"text":"SAP café 🔐"}\r\n\r\nevent: analysis\r\ndata: {"findings":["Keep context"]}\r\n\r\nevent: generation\r\ndata: {"finish_reason":"stop"}\r\n\r\ndata: [DONE]\r\n\r\n';
  const bytes = encoder.encode(wire);
  // Every possible byte boundary, including inside CRLF and multi-byte UTF-8.
  for (let i = 0; i <= bytes.length; i++) {
    const result = await read([bytes.slice(0, i), bytes.slice(i)]);
    assert.equal(result.text, "SAP café 🔐", `text at split ${i}`);
    assert.deepEqual(result.events[1], ["analysis", { findings: ["Keep context"] }], `metadata at split ${i}`);
    assert.equal(result.result.generation.finish_reason, "stop");
  }
  assert.equal((await read([...bytes].map(byte => Uint8Array.of(byte)))).text, "SAP café 🔐");
  for (const newline of ["\n", "\r", "\r\n"]) {
    const multiline = ['data: {"text":', 'data: "Joined"}', '', 'data: [DONE]', '', ''].join(newline);
    assert.equal((await read([encoder.encode(multiline)])).text, "Joined");
  }
  const held = await read([encoder.encode('data: {"text":"Done"}\n\ndata: [DONE]\n\n')], { open: true });
  assert.equal(held.res.wasCancelled(), true, "DONE must stop without waiting for socket EOF");
  for (const reason of ["length", "max_tokens", "MAX_TOKENS", "content_filter", "SAFETY"]) {
    await assert.rejects(read([encoder.encode(`data: {"text":"Partial"}\n\nevent: generation\ndata: ${JSON.stringify({ finish_reason: reason })}\n\ndata: [DONE]\n\n`)]), e => e.classified?.code === "incomplete");
    checks++;
  }
  for (const wire of [
    'data: {"text":"Partial"}\n\n',
    'data: {broken}\n\ndata: [DONE]\n\n',
    'data: {"text":42}\n\ndata: [DONE]\n\n'
  ]) {
    const res = response([encoder.encode(wire)]);
    await assert.rejects(consumeChatStream(res), e => e.classified?.code === "incomplete");
    assert.equal(res.body.locked, false);
    checks++;
  }
  let partial = "";
  await assert.rejects(consumeChatStream(response([encoder.encode('data: {"text":"Keep this"}\n\nevent: error\ndata: {"error":"network failure"}\n\n')]), { onText(t) { partial += t; } }), e => e.classified?.retryable);
  assert.equal(partial, "Keep this");
  assert.equal((await read([encoder.encode('event: admission\ndata: {"decision":"DEFER"}\n\ndata: [DONE]\n\n')])).text, "");
  assert.equal((await read([encoder.encode('event: extension\ndata: not-json\n\ndata: [DONE]\n\n')])).text, "");
  await assert.rejects(consumeChatStream({ body: null }), e => e.classified?.code === "empty");
  assert.deepEqual(historyForGeneration([
    { type: "response", status: "interrupted", text: "Partial answer" },
    { type: "response", status: "completed", text: "Complete answer" }
  ]).map(x => x.text), ["Complete answer"]);
  console.log(`chatStreamAssert: PASS (${checks} stream checks plus failure/history controls)`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
