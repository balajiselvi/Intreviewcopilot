/**
 * Diagnose whether LIVE OpenAI returns usable text for PFCG through /api/chat,
 * and capture latency + answerKind. Forced LIVE. No MOCK.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function loadDotEnvLocal() {
  const p = path.join(ROOT, ".env.local");
  const text = fs.readFileSync(p, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m || line.trim().startsWith("#")) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}
loadDotEnvLocal();
process.env.LLM_PROVIDER_MODE = "live";
process.env.INTERVIEW_SAFE_MODE = "0";
delete process.env.LIVE_AUDIT_LIMIT;
delete process.env.INTERVIEW_ACCEPTANCE_LOCK;

const { LLM_REQUEST_TIMEOUT_MS } = require("../../../lib/liveReliability.js");
const { resolveProviderMode, getProviderStats, resetProviderStats } = require("../../../lib/providerMode.js");
console.log("mode", resolveProviderMode(process.env), "timeoutMs", LLM_REQUEST_TIMEOUT_MS, "key", Boolean(process.env.OPENAI_API_KEY));

// Direct OpenAI sanity (bypass chat pipeline)
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0 });
const t0 = Date.now();
const direct = await client.chat.completions.create({
  model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  temperature: 0.1,
  max_tokens: 400,
  messages: [
    { role: "system", content: "You are a senior SAP security architect. Answer briefly in spoken interview prose." },
    { role: "user", content: "Explain how do you use PFCG?" }
  ]
});
const directText = direct.choices?.[0]?.message?.content || "";
console.log("DIRECT_OPENAI_MS", Date.now() - t0, "chars", directText.length);
console.log("DIRECT_PREVIEW", directText.slice(0, 300));
if (!directText.trim()) {
  console.error("ABORT: direct OpenAI returned empty — refuse to treat pipeline as LIVE.");
  process.exit(3);
}

// Pipeline path
const { default: handler } = await import("../../../pages/api/chat.js");
function createCaptureRes() {
  const events = [];
  const dataChunks = [];
  return {
    writable: true, writableEnded: false, statusCode: 200, headersSent: false, headers: {},
    setHeader(k, v) { this.headers[k] = v; this.headersSent = true; },
    status(code) { this.statusCode = code; return this; },
    json(body) { events.push({ name: "json", data: body }); return this; },
    end() { this.writableEnded = true; }, once() {}, on() {},
    write(payload) {
      const text = String(payload || "");
      if (text.startsWith("event:")) {
        const name = text.match(/^event:\s*(\S+)/)?.[1] || "";
        const dataLine = text.split("\n").find((l) => l.startsWith("data:"));
        let data = null;
        try { data = JSON.parse((dataLine || "").replace(/^data:\s*/, "")); } catch { data = dataLine; }
        events.push({ name, data });
      } else if (text.startsWith("data:")) {
        const raw = text.replace(/^data:\s*/, "").replace(/\n\n$/, "").trim();
        if (raw !== "[DONE]") {
          try {
            const parsed = JSON.parse(raw);
            if (parsed?.text) dataChunks.push(String(parsed.text));
            events.push({ name: "data", data: parsed });
          } catch { /* ignore */ }
        }
      }
      return true;
    },
    events, dataChunks, substantive() { return dataChunks.join(""); }
  };
}

resetProviderStats("live");
const res = createCaptureRes();
const t1 = Date.now();
await handler({
  method: "POST",
  body: {
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY,
    safeMode: false,
    question: "Explain how do you use PFCG?",
    history: [],
    source: "v23-live-raw-diag"
  }
}, res);
console.log("PIPELINE_MS", Date.now() - t1);
console.log("stats", getProviderStats());
console.log("admission", res.events.find((e) => e.name === "admission")?.data);
console.log("answer_final", res.events.find((e) => e.name === "answer_final")?.data);
console.log("FINAL", res.substantive().slice(0, 500));
console.log("FINAL_CHARS", res.substantive().length);
