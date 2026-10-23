/**
 * Offline / failure-path verification for the 5-layer live reliability architecture.
 * Does not call real LLM providers. Confirms local KB fallback always returns a
 * Senior Principal Architect Decision/Mechanism/Governance/Validation answer.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  LLM_REQUEST_TIMEOUT_MS,
  MAX_RETRIES,
  RETRY_BACKOFF_MS,
  isRetryableLlmError,
  runWithExponentialRetry,
  runWithLlmTimeout,
  resolveProviderFailoverChain,
  generateWithReliability,
  buildLocalKnowledgeFallback,
  formatArchitectFallback,
  topMatchingChunk,
  resetKnowledgeCache
} = require("../lib/liveReliability");
const { consumeChatStream } = require("../lib/chatStream");

let passed = 0;

function check(label, fn) {
  fn();
  passed += 1;
  console.log(`  ✓ ${label}`);
}

async function checkAsync(label, fn) {
  await fn();
  passed += 1;
  console.log(`  ✓ ${label}`);
}

function assertArchitectFormat(answer) {
  assert.match(answer, /\*\s*\*\*Decision:\*\*/i, "must include Decision bullet");
  assert.match(answer, /\*\s*\*\*Mechanism:\*\*/i, "must include Mechanism bullet");
  assert.match(answer, /\*\s*\*\*Governance:\*\*/i, "must include Governance bullet");
  assert.match(answer, /\*\s*\*\*Validation:\*\*/i, "must include Validation bullet");
  assert.doesNotMatch(answer, /Generation failed|temporary error|You can Retry/i);
}

async function main() {
  console.log("liveReliabilityAssert:");

  check("timeout constant is 4000ms", () => {
    assert.equal(LLM_REQUEST_TIMEOUT_MS, 4000);
  });

  check("retry budget is max 3 with backoff schedule", () => {
    assert.equal(MAX_RETRIES, 3);
    assert.deepEqual([...RETRY_BACKOFF_MS], [300, 800, 1500]);
  });

  check("429/5xx/network classify as retryable", () => {
    assert.equal(isRetryableLlmError({ status: 429, message: "rate limit" }), true);
    assert.equal(isRetryableLlmError({ status: 503, message: "unavailable" }), true);
    assert.equal(isRetryableLlmError({ message: "fetch failed" }), true);
    assert.equal(isRetryableLlmError({ status: 401, message: "invalid api key" }), false);
  });

  await checkAsync("exponential retry succeeds after transient failures", async () => {
    let calls = 0;
    const sleeps = [];
    const result = await runWithExponentialRetry(async () => {
      calls += 1;
      if (calls < 3) {
        throw Object.assign(new Error("busy"), { status: 503 });
      }
      return "ok";
    }, {
      maxRetries: 3,
      sleepFn: async (ms) => { sleeps.push(ms); }
    });
    assert.equal(result, "ok");
    assert.equal(calls, 3);
    assert.equal(sleeps.length, 2);
    assert.ok(sleeps[0] >= 300 && sleeps[0] < 600);
    assert.ok(sleeps[1] >= 800 && sleeps[1] < 1100);
  });

  await checkAsync("hard 4s timeout aborts slow provider call", async () => {
    const started = Date.now();
    await assert.rejects(
      () => runWithLlmTimeout(
        (signal) => new Promise((resolve, reject) => {
          const timer = setTimeout(() => resolve("late"), 8000);
          signal.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
          }, { once: true });
        }),
        { timeoutMs: 80 }
      ),
      (err) => err.name === "AbortError" || err.code === "LLM_TIMEOUT"
    );
    assert.ok(Date.now() - started < 2000, "must not wait for the slow provider");
  });

  await checkAsync("provider failover switches on primary auth failure", async () => {
    const calls = [];
    const result = await generateWithReliability(async (target) => {
      calls.push(target.provider);
      if (target.provider === "openai") {
        throw Object.assign(new Error("invalid api key"), { status: 401 });
      }
      return `from-${target.provider}`;
    }, {
      chain: [
        { provider: "openai", model: "gpt-4o", apiKey: "bad" },
        { provider: "anthropic", model: "claude-haiku", apiKey: "good" }
      ],
      maxRetries: 0,
      timeoutMs: 500,
      sleepFn: async () => {}
    });
    assert.equal(result.text, "from-anthropic");
    assert.equal(result.usedFailover, true);
    assert.deepEqual(calls, ["openai", "anthropic"]);
  });

  check("failover chain includes secondary keys when present", () => {
    const chain = resolveProviderFailoverChain({
      primaryModel: "gpt-4o",
      primaryApiKey: "sk-primary",
      apiKeys: {
        openai: "sk-primary",
        anthropic: "anth-key",
        groq: "groq-key"
      },
      env: {
        FALLBACK_OPENAI_MODEL: "gpt-4o-mini",
        FALLBACK_ANTHROPIC_MODEL: "claude-haiku-4-5-20251001",
        FALLBACK_GROQ_MODEL: "llama-3.1-8b-instant"
      }
    });
    assert.ok(chain.length >= 3);
    assert.equal(chain[0].provider, "openai");
    assert.ok(chain.some((c) => c.provider === "anthropic"));
    assert.ok(chain.some((c) => c.provider === "groq"));
  });

  resetKnowledgeCache();
  check("local KB fallback formats architect answer from knowledgeIndex", () => {
    const fb = buildLocalKnowledgeFallback(
      "How would you design SAP IAS authentication boundaries with IPS provisioning?"
    );
    assert.equal(fb.route, "LOCAL_KNOWLEDGE_FALLBACK");
    assertArchitectFormat(fb.answer);
    assert.ok(fb.chunk && (fb.chunk.content || fb.heading));
  });

  check("topMatchingChunk prefers query-aligned content", () => {
    const chunk = topMatchingChunk("MSMP workflow BRF plus initiator rule configuration");
    assert.ok(chunk.content || chunk.heading);
    const answer = formatArchitectFallback(chunk, "Explain MSMP");
    assertArchitectFormat(answer);
  });

  check("chat.js wires reliability helpers and zero-crash fallback", () => {
    const chat = fs.readFileSync(path.join(__dirname, "../pages/api/chat.js"), "utf8");
    assert.match(chat, /liveReliability/);
    assert.match(chat, /LLM_REQUEST_TIMEOUT_MS/);
    assert.match(chat, /generateWithReliability/);
    assert.match(chat, /LOCAL_KNOWLEDGE_FALLBACK/);
    assert.match(chat, /streamLocalKnowledgeFallback/);
    assert.match(chat, /missing_api_key_fallback|forceLocalFallback/);
    assert.doesNotMatch(
      chat,
      /return res\.status\(400\)\.json\(\{\s*error:\s*"An API key is required for production mode/
    );
  });

  await checkAsync("simulated SSE offline fallback never emits error event", async () => {
    const fallback = buildLocalKnowledgeFallback(
      "How do you enforce SoD in SAP GRC Access Control during role design?"
    );
    assertArchitectFormat(fallback.answer);

    const encoder = new TextEncoder();
    const payload = [
      `event: admission\ndata: ${JSON.stringify({ decision: "ANSWER", route: "LOCAL_KNOWLEDGE_FALLBACK" })}\n\n`,
      `data: ${JSON.stringify({ text: fallback.answer })}\n\n`,
      "data: [DONE]\n\n"
    ].join("");

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(payload));
        controller.close();
      }
    });
    const response = {
      body: stream,
      ok: true,
      status: 200
    };

    let text = "";
    let sawError = false;
    const events = [];
    await consumeChatStream(response, {
      onText(chunk) { text += chunk; },
      onEvent(name, payloadObj) {
        events.push(name);
        if (name === "error" || payloadObj?.error) sawError = true;
      }
    });
    assert.equal(sawError, false);
    assertArchitectFormat(text);
    assert.ok(events.includes("admission"));
  });

  console.log(`liveReliabilityAssert: PASS (${passed} checks; 0 errors)`);
}

main().catch((error) => {
  console.error("liveReliabilityAssert: FAIL");
  console.error(error);
  process.exitCode = 1;
});
