/**
 * E2E: real pages/api/chat.js under LLM_PROVIDER_MODE=mock|disabled.
 * Proves liveTransportInvocations===0 and no OpenAI SDK mock-hook calls in those modes.
 *
 *   node --import ./eval/harness/registerNextResolve.mjs eval/providerModeChatE2eAssert.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "eval", "results", "_acceptance");
fs.mkdirSync(OUT_DIR, { recursive: true });

const {
  resetMockOpenai,
  enqueueMockCompletion,
  getMockOpenaiCalls
} = await import("./harness/mockOpenai.mjs");

const { getProviderStats, resetProviderStats } = require("../lib/providerMode.js");
const { default: handler } = await import("../pages/api/chat.js");

const Q = "What are Critical Actions?";
const LIVE_BAIT =
  "LIVE_PROVIDER_BAIT: Six stages. At Dover that was 1,650 PFCG roles — this must never appear from mock mode.";

function createCaptureRes() {
  const writes = [];
  const events = [];
  const dataChunks = [];
  const res = {
    writable: true,
    writableEnded: false,
    statusCode: 200,
    headersSent: false,
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
      this.headersSent = true;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      writes.push({ type: "json", body });
      return this;
    },
    end() {
      this.writableEnded = true;
      writes.push({ type: "end" });
    },
    once() {},
    on() {},
    write(payload) {
      const text = String(payload || "");
      writes.push({ type: "write", text });
      if (text.startsWith("event:")) {
        const name = text.match(/^event:\s*(\S+)/)?.[1] || "";
        const dataLine = text.split("\n").find((l) => l.startsWith("data:"));
        let data = null;
        try {
          data = JSON.parse((dataLine || "").replace(/^data:\s*/, ""));
        } catch {
          data = dataLine;
        }
        events.push({ name, data });
      } else if (text.startsWith("data:")) {
        const raw = text.replace(/^data:\s*/, "").replace(/\n\n$/, "").trim();
        if (raw === "[DONE]") events.push({ name: "done", data: null });
        else {
          try {
            const parsed = JSON.parse(raw);
            if (parsed?.text) dataChunks.push(String(parsed.text));
            events.push({ name: "data", data: parsed });
          } catch {
            events.push({ name: "data_raw", data: raw });
          }
        }
      }
      return true;
    },
    writes,
    events,
    dataChunks,
    substantiveText() {
      return dataChunks.join("");
    }
  };
  return res;
}

async function invoke(mode, bodyExtra = {}) {
  process.env.LLM_PROVIDER_MODE = mode;
  resetProviderStats(mode);
  resetMockOpenai();
  enqueueMockCompletion(LIVE_BAIT);

  const res = createCaptureRes();
  const req = {
    method: "POST",
    body: {
      model: "gpt-4o-mini",
      apiKey: "sk-live-bait-must-be-stripped-in-mock",
      safeMode: false,
      question: Q,
      history: [],
      source: "provider-mode-e2e",
      // Client spoof attempts — server must ignore for mode selection
      providerMode: "live",
      llmProviderMode: "live",
      forceLocalFallback: true,
      ...bodyExtra
    }
  };
  await handler(req, res);
  const generation = res.events.find((e) => e.name === "generation")?.data || null;
  const admission = res.events.find((e) => e.name === "admission")?.data || null;
  return {
    stats: getProviderStats(),
    mockOpenaiCalls: getMockOpenaiCalls().length,
    substantive: res.substantiveText(),
    generation,
    admission,
    events: res.events.map((e) => e.name)
  };
}

const report = { at: new Date().toISOString(), cases: {} };

{
  const out = await invoke("mock");
  assert.equal(out.stats.liveTransportInvocations, 0, "MOCK must not hit live transport");
  assert.ok(out.stats.mockInvocations >= 1 || out.generation?.model === "mock-deterministic"
    || /Critical Action|ruleset|ARA/i.test(out.substantive),
  "MOCK should use deterministic mock or emit technical answer");
  assert.equal(out.mockOpenaiCalls, 0, "MOCK must not call OpenAI SDK (even harness)");
  assert.doesNotMatch(out.substantive, /LIVE_PROVIDER_BAIT|1,?650|Six stages/);
  assert.ok(out.substantive.length > 20 || out.admission?.route);
  report.cases.mock = {
    ok: true,
    liveTransportInvocations: out.stats.liveTransportInvocations,
    mockInvocations: out.stats.mockInvocations,
    mockOpenaiCalls: out.mockOpenaiCalls,
    generation: out.generation,
    route: out.admission?.route || out.generation?.route || null,
    preview: out.substantive.slice(0, 200),
    events: out.events
  };
  console.log("PASS MOCK E2E liveTransportInvocations=0 openaiCalls=0");
}

{
  const out = await invoke("disabled");
  assert.equal(out.stats.liveTransportInvocations, 0, "DISABLED must not hit live transport");
  assert.equal(out.mockOpenaiCalls, 0, "DISABLED must not call OpenAI SDK");
  assert.doesNotMatch(out.substantive, /LIVE_PROVIDER_BAIT|1,?650|Six stages/);
  report.cases.disabled = {
    ok: true,
    liveTransportInvocations: out.stats.liveTransportInvocations,
    disabledBlocked: out.stats.disabledBlocked,
    mockOpenaiCalls: out.mockOpenaiCalls,
    generation: out.generation,
    route: out.admission?.route || out.generation?.route || null,
    preview: out.substantive.slice(0, 200),
    events: out.events
  };
  console.log("PASS DISABLED E2E liveTransportInvocations=0 openaiCalls=0");
}

delete process.env.LLM_PROVIDER_MODE;
fs.writeFileSync(path.join(OUT_DIR, "provider-mode-chat-e2e.json"), JSON.stringify(report, null, 2));
console.log("providerModeChatE2e: PASS → provider-mode-chat-e2e.json");
