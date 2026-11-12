/**
 * Phase 8 targeted LIVE re-verification — 6 prior PARTIALS + 2 regression anchors.
 * Forced LIVE via registerNextResolveLive.mjs. Writes V31_PHASE8_REMEDIATION_LIVE.jsonl.
 *
 *   node --import ./eval/harness/registerNextResolveLive.mjs eval/results/_acceptance/_phase8RemediationLive.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT_DIR = path.join(ROOT, "eval", "results", "_acceptance");
const JSONL = path.join(OUT_DIR, "V31_PHASE8_REMEDIATION_LIVE.jsonl");
const META = path.join(OUT_DIR, "V31_PHASE8_REMEDIATION_LIVE_META.json");

function loadDotEnvLocal() {
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) return { loaded: false };
  const text = fs.readFileSync(p, "utf8");
  let count = 0;
  for (const line of text.split(/\r?\n/)) {
    if (!line || /^\s*#/.test(line)) continue;
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] == null || process.env[m[1]] === "") {
      process.env[m[1]] = v;
      count += 1;
    }
  }
  return { loaded: true, count };
}

loadDotEnvLocal();
process.env.LLM_PROVIDER_MODE = "live";
process.env.INTERVIEW_SAFE_MODE = "0";
delete process.env.INTERVIEW_ACCEPTANCE_LOCK;

const { resolveProviderMode, getProviderStats, resetProviderStats } = require("../../../lib/providerMode.js");
const mode = resolveProviderMode(process.env);
if (mode !== "live") {
  console.error("ABORT: provider mode is not live:", mode);
  process.exit(2);
}
if (!process.env.OPENAI_API_KEY) {
  console.error("ABORT: OPENAI_API_KEY missing");
  process.exit(2);
}

try {
  const OpenAI = (await import("openai")).default;
  const probe = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0 });
  const probeResp = await probe.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    max_tokens: 16,
    messages: [{ role: "user", content: "Reply with the single word PONG." }]
  });
  const probeText = String(probeResp?.choices?.[0]?.message?.content || "").trim();
  if (!probeText) {
    console.error("ABORT: live probe empty — mock harness likely active");
    process.exit(3);
  }
  console.log("OpenAI live probe ok:", probeText.slice(0, 40));
} catch (e) {
  console.error("ABORT: live probe failed:", e?.message || e);
  process.exit(3);
}

const { default: handler } = await import("../../../pages/api/chat.js");

// Phase-2 PARTIAL set (5 verified in scorecard) + optional sixth depth control (BW was PASS but
// included when auditors round to "6 partials") + PFCG Q1/Q2 + SU24/SU25 regression anchors.
const WORK = [
  { runId: "p8_st03n", suite: "partial", question: "How do you export all the T-codes used by a user?" },
  { runId: "p8_critical_actions", suite: "partial", question: "Explain critical actions and their significance." },
  { runId: "p8_idm", suite: "partial", question: "Explain the identity provisioning lifecycle." },
  { runId: "p8_btp", suite: "partial", question: "Explain authentication and authorization architecture." },
  { runId: "p8_s4_experience", suite: "partial", question: "Describe your role in an S/4HANA security transformation and the key authorization activities you personally owned." },
  { runId: "p8_bw_depth", suite: "partial", question: "Explain analysis authorizations." },
  { runId: "p8_reg_pfcg_q1", suite: "regression", question: "Explain how do you use PFCG?" },
  { runId: "p8_reg_pfcg_q2", suite: "regression", question: "How do you configure PFCG?" },
  { runId: "p8_reg_su24_su25", suite: "regression", question: "Explain the difference between SU24 and SU25." }
];

function createCaptureRes() {
  const events = [];
  const dataChunks = [];
  const res = {
    writable: true,
    writableEnded: false,
    statusCode: 200,
    setHeader() {},
    writeHead() {},
    end() { this.writableEnded = true; },
    once() {},
    on() {},
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
          } catch {
            events.push({ name: "data_raw", data: raw });
          }
        }
      }
      return true;
    },
    events,
    dataChunks,
    substantive() { return dataChunks.join(""); }
  };
  return res;
}

async function runOne(spec) {
  resetProviderStats();
  const started = Date.now();
  const res = createCaptureRes();
  let error = null;
  try {
    await handler({
      method: "POST",
      body: {
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        apiKey: process.env.OPENAI_API_KEY,
        safeMode: false,
        question: spec.question,
        history: [],
        source: "phase8-remediation-live"
      }
    }, res);
  } catch (e) {
    error = { message: e?.message || String(e) };
  }
  const stats = getProviderStats();
  const admission = res.events.find((e) => e.name === "admission")?.data || null;
  const generation = res.events.find((e) => e.name === "generation")?.data || null;
  const answerFinal = res.events.find((e) => e.name === "answer_final")?.data || null;
  const providerRaw = res.events.find((e) => e.name === "provider_raw")?.data || null;
  const jsonErr = res.events.find((e) => e.name === "json")?.data || null;
  const finalAnswer = String(answerFinal?.text || res.substantive() || "").trim();
  const rawProviderText = String(providerRaw?.text || "").trim() || null;
  const mockLeak = stats.mockInvocations > 0;
  const liveFailed = Boolean(error) || Boolean(jsonErr?.error) || mockLeak
    || (stats.liveTransportInvocations < 1 && String(admission?.route || "") === "GENERATION")
    || (!finalAnswer && String(admission?.route || "") === "GENERATION");

  return {
    at: new Date().toISOString(),
    runId: spec.runId,
    suite: spec.suite,
    question: spec.question,
    providerModeConfigured: "live",
    providerModeResolved: resolveProviderMode(process.env),
    providerStats: stats,
    mockSubstituted: mockLeak,
    liveTransportInvocations: stats.liveTransportInvocations,
    latencyMs: Date.now() - started,
    admission,
    generation,
    answerFinalMeta: answerFinal ? {
      answerKind: answerFinal.answerKind,
      recovered: answerFinal.recovered,
      flag: answerFinal.flag || null
    } : null,
    rawProviderHint: rawProviderText,
    rawProviderChars: rawProviderText ? rawProviderText.length : 0,
    rawProviderSource: providerRaw?.source || null,
    finalDisplayedAnswer: finalAnswer,
    agrUsersAsExecutionHistory: /\bAGR_USERS\b/i.test(finalAnswer) && /(?:executed|used by|transaction history|actually (?:ran|used)|workload)/i.test(finalAnswer),
    reviewTableArtifact: /Review table for/i.test(finalAnswer),
    error,
    httpJsonError: jsonErr || null,
    liveFailed,
    failureReason: liveFailed
      ? (mockLeak ? "mock-substitution-forbidden" : (error?.message || jsonErr?.error || "live-generation-missing-or-empty"))
      : null
  };
}

fs.writeFileSync(JSONL, "", "utf8");
const results = [];
for (const spec of WORK) {
  console.log(`\n=== ${spec.runId} ===`);
  console.log(spec.question);
  const row = await runOne(spec);
  results.push(row);
  fs.appendFileSync(JSONL, `${JSON.stringify(row)}\n`, "utf8");
  console.log(row.liveFailed
    ? `FAIL ${row.failureReason}`
    : `ok raw=${row.rawProviderChars || 0} final=${row.finalDisplayedAnswer.length} recovered=${row.answerFinalMeta?.recovered}`);
}

const meta = {
  at: new Date().toISOString(),
  tag: "v31_phase8_remediation",
  count: results.length,
  liveFailed: results.filter((r) => r.liveFailed).length,
  rawPopulated: results.filter((r) => Boolean(r.rawProviderHint)).length,
  model: process.env.OPENAI_MODEL || "gpt-4o-mini"
};
fs.writeFileSync(META, JSON.stringify(meta, null, 2), "utf8");
console.log("\nMETA", meta);
console.log("Wrote", JSONL);
if (meta.liveFailed > 0) process.exit(1);
