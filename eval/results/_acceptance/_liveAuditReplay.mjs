/**
 * V2.3 LIVE interview quality audit — historical replay + defect probes + benchmark.
 * FORCED LIVE. Never substitutes MOCK. Failures recorded as LIVE_EXECUTION_FAILED.
 *
 *   node --import ./eval/harness/registerNextResolve.mjs eval/results/_acceptance/_liveAuditReplay.mjs
 *
 * Optional: LIVE_AUDIT_LIMIT=N to cap questions (budget gate already passed at ~$0.13 for full set).
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT_DIR = path.join(ROOT, "eval", "results", "_acceptance");
const DATASET = JSON.parse(fs.readFileSync(path.join(OUT_DIR, "V23_HISTORICAL_REPLAY_DATASET.json"), "utf8"));
const RUN_TAG = String(process.env.LIVE_AUDIT_TAG || "baseline").trim() || "baseline";
const JSONL = path.join(OUT_DIR, RUN_TAG === "baseline" ? "V23_LIVE_REPLAY_RESULTS.jsonl" : `V23_LIVE_REPLAY_RESULTS_${RUN_TAG}.jsonl`);
const RUN_META = path.join(OUT_DIR, RUN_TAG === "baseline" ? "V23_LIVE_REPLAY_RUN_META.json" : `V23_LIVE_REPLAY_RUN_META_${RUN_TAG}.json`);

function loadDotEnvLocal() {
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) return { loaded: false };
  const text = fs.readFileSync(p, "utf8");
  let loaded = 0;
  for (const line of text.split(/\r?\n/)) {
    if (!line || /^\s*#/.test(line)) continue;
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] == null || process.env[m[1]] === "") {
      process.env[m[1]] = v;
      loaded += 1;
    }
  }
  return { loaded: true, count: loaded };
}

const envLoad = loadDotEnvLocal();
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
  console.error("ABORT: OPENAI_API_KEY missing after .env.local load — cannot run LIVE audit.");
  process.exit(2);
}

// Hard refuse the mock openai harness (registerNextResolve.mjs redirects openai → empty mock).
try {
  const OpenAI = (await import("openai")).default;
  const probe = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0 });
  const probeStart = Date.now();
  const probeResp = await probe.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    max_tokens: 16,
    messages: [{ role: "user", content: "Reply with the single word PONG." }]
  });
  const probeText = String(probeResp?.choices?.[0]?.message?.content || "").trim();
  const probeMs = Date.now() - probeStart;
  if (!probeText || probeMs < 50) {
    console.error("ABORT: OpenAI probe empty/too-fast — mock harness likely active. Use registerNextResolveLive.mjs");
    process.exit(3);
  }
  console.log(`OpenAI live probe ok (${probeMs}ms): ${probeText.slice(0, 40)}`);
} catch (e) {
  console.error("ABORT: OpenAI live probe failed:", e?.message || e);
  process.exit(3);
}

const { default: handler } = await import("../../../pages/api/chat.js");

const DEFECT_PROBES = [
  { id: "defect_pfcg_use", suite: "defect", question: "Explain how do you use PFCG?" },
  { id: "defect_pfcg_configure", suite: "defect", question: "How do you configure PFCG?" },
  { id: "defect_st03n_export", suite: "defect", question: "How do you export all the T-codes used by a user?" }
];

const BENCHMARK = [
  { id: "bench_brm", suite: "benchmark", question: "Why do organizations implement BRM?" },
  { id: "bench_pfcg", suite: "benchmark", question: "Explain how do you use PFCG?" },
  { id: "bench_su24_su25", suite: "benchmark", question: "Explain the difference between SU24 and SU25." },
  { id: "bench_msmp", suite: "benchmark", question: "Explain MSMP architecture." },
  { id: "bench_critical_actions", suite: "benchmark", question: "Explain critical actions and their significance." },
  { id: "bench_bw", suite: "benchmark", question: "Explain analysis authorizations." },
  { id: "bench_idm", suite: "benchmark", question: "Explain the identity provisioning lifecycle." },
  { id: "bench_btp", suite: "benchmark", question: "Explain authentication and authorization architecture." },
  { id: "bench_s4_experience", suite: "benchmark", question: "Describe your role in an S/4HANA security transformation and the key authorization activities you personally owned." },
  { id: "bench_oauth", suite: "benchmark", question: "Explain how OAuth 2.0 authorization code flow works in cloud integrations." }
];

function createCaptureRes() {
  const events = [];
  const dataChunks = [];
  const res = {
    writable: true,
    writableEnded: false,
    statusCode: 200,
    headersSent: false,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; this.headersSent = true; },
    status(code) { this.statusCode = code; return this; },
    json(body) { events.push({ name: "json", data: body }); return this; },
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
          } catch { /* ignore */ }
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

function buildHistory(priorTurns) {
  // Production API expects OpenAI-style {role, content} (see buildBoundedHistory).
  // Use freshly replayed answers for prior turns — never the historical answer to the current Q.
  const history = [];
  for (const t of priorTurns.slice(-6)) {
    history.push({ role: "user", content: t.question });
    if (t.finalAnswer) history.push({ role: "assistant", content: t.finalAnswer });
  }
  return history;
}

async function runOne(spec) {
  const promptDump = path.join(OUT_DIR, `_live-prompt-${spec.runId}.txt`);
  process.env.DEBUG_DUMP_PROMPT = promptDump;
  resetProviderStats("live");
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
        history: spec.history || [],
        interviewSessionId: `audit_${spec.runId}`.slice(0, 80),
        source: "v23-live-quality-audit"
      }
    }, res);
  } catch (e) {
    error = { message: String(e?.message || e).slice(0, 500), name: e?.name || "Error", code: e?.code || null };
  }
  delete process.env.DEBUG_DUMP_PROMPT;
  const stats = getProviderStats();
  const admission = res.events.find((e) => e.name === "admission")?.data || null;
  const generation = res.events.find((e) => e.name === "generation")?.data || null;
  const answerFinal = res.events.find((e) => e.name === "answer_final")?.data || null;
  const providerRaw = res.events.find((e) => e.name === "provider_raw")?.data || null;
  const jsonErr = res.events.find((e) => e.name === "json")?.data || null;
  const finalAnswer = String(answerFinal?.text || res.substantive() || "").trim();
  const rawProviderText = String(providerRaw?.text || "").trim() || null;
  const promptText = fs.existsSync(promptDump) ? fs.readFileSync(promptDump, "utf8") : null;
  if (fs.existsSync(promptDump)) {
    try { fs.unlinkSync(promptDump); } catch { /* keep if locked */ }
  }

  const mockLeak = stats.mockInvocations > 0 || /mock-deterministic/i.test(String(generation?.model || admission?.model || ""));
  const liveFailed = Boolean(error)
    || Boolean(jsonErr?.error)
    || mockLeak
    || stats.liveTransportInvocations < 1 && String(admission?.route || "") === "GENERATION"
    || (!finalAnswer && String(admission?.route || "") === "GENERATION");

  // Note: VERIFIED_WORKFLOW/PREPARED_SCRIPT may skip live transport — record as non-LLM production short-circuit.
  const shortCircuit = ["PREPARED_SCRIPT", "ANSWER_BANK", "VERIFIED_WORKFLOW", "RETRIEVED_PROCEDURE"].includes(String(admission?.route || ""));

  return {
    at: new Date().toISOString(),
    runId: spec.runId,
    suite: spec.suite,
    sessionId: spec.sessionId || null,
    sequence: spec.sequence || null,
    provenance: spec.provenance || null,
    question: spec.question,
    historicalAnswer: spec.historicalAnswer || null,
    historicalRoute: spec.historicalRoute || null,
    providerModeConfigured: "live",
    providerModeResolved: resolveProviderMode(process.env),
    providerStats: stats,
    mockSubstituted: mockLeak,
    shortCircuitRoute: shortCircuit ? admission?.route : null,
    liveTransportInvocations: stats.liveTransportInvocations,
    latencyMs: Date.now() - started,
    admission,
    generation,
    answerFinalMeta: answerFinal ? {
      answerKind: answerFinal.answerKind,
      recovered: answerFinal.recovered,
      route: answerFinal.route,
      flag: answerFinal.flag || null
    } : null,
    rawProviderHint: rawProviderText,
    rawProviderChars: rawProviderText ? rawProviderText.length : 0,
    rawProviderSource: providerRaw?.source || null,
    finalDisplayedAnswer: finalAnswer,
    promptChars: promptText ? promptText.length : 0,
    promptHasBankCue: promptText ? /architect-bank|interview-bank|ANSWER_BANK|prepared script/i.test(promptText) : null,
    malformedPhrase: /not confirmed in supporting knowledge/i.test(finalAnswer),
    operationalPathPhrase: /operational path end to end|plane-appropriate positive check/i.test(finalAnswer),
    agrUsersAsExecutionHistory: /\bAGR_USERS\b/i.test(finalAnswer) && /(?:executed|used by|transaction history|actually (?:ran|used)|workload)/i.test(finalAnswer),
    error,
    httpJsonError: jsonErr || null,
    classification: liveFailed
      ? "LIVE_EXECUTION_FAILED"
      : (mockLeak ? "LIVE_EXECUTION_FAILED" : "PENDING_EVALUATION"),
    liveFailed,
    failureReason: liveFailed
      ? (mockLeak ? "mock-substitution-forbidden" : (error?.message || jsonErr?.error || "live-generation-missing-or-empty"))
      : null
  };
}

// Build worklist: historical (sequential per session) then defects then benchmark
const work = [];
for (const sess of DATASET.sessions) {
  for (const q of sess.questions) {
    work.push({
      suite: "historical",
      sessionId: sess.sessionId,
      provenance: sess.provenance,
      sequence: q.sequence,
      question: q.question,
      historicalAnswer: q.historicalAnswer,
      historicalRoute: q.historicalRoute,
      runId: `h_${sess.sessionId}_${q.sequence}`
    });
  }
}
for (const d of DEFECT_PROBES) work.push({ ...d, runId: d.id });
for (const b of BENCHMARK) work.push({ ...b, runId: b.id });

const suiteFilter = String(process.env.LIVE_AUDIT_SUITES || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const filtered = suiteFilter.length ? work.filter((w) => suiteFilter.includes(w.suite)) : work;
const limit = Number(process.env.LIVE_AUDIT_LIMIT || 0);
const planned = limit > 0 ? filtered.slice(0, limit) : filtered;

fs.writeFileSync(JSONL, ""); // truncate for this run
const meta = {
  startedAt: new Date().toISOString(),
  envLoad,
  providerMode: mode,
  model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  plannedCount: planned.length,
  fullWorklistCount: work.length,
  limit: limit || null,
  completed: 0,
  liveFailed: 0,
  shortCircuits: 0,
  mockViolations: 0
};

console.log(`LIVE audit starting: ${planned.length} questions (mode=${mode})`);

const sessionPrior = new Map();

for (let i = 0; i < planned.length; i++) {
  const item = planned[i];
  const priorKey = item.sessionId || item.suite;
  const prior = sessionPrior.get(priorKey) || [];
  const history = item.suite === "historical" ? buildHistory(prior) : [];
  process.stdout.write(`[${i + 1}/${planned.length}] ${item.suite} ${item.runId} … `);
  const result = await runOne({ ...item, history });
  fs.appendFileSync(JSONL, `${JSON.stringify(result)}\n`);
  meta.completed += 1;
  if (result.liveFailed) meta.liveFailed += 1;
  if (result.shortCircuitRoute) meta.shortCircuits += 1;
  if (result.mockSubstituted) meta.mockViolations += 1;
  if (item.suite === "historical" && result.finalDisplayedAnswer) {
    prior.push({ question: item.question, finalAnswer: result.finalDisplayedAnswer });
    sessionPrior.set(priorKey, prior);
  }
  console.log(result.liveFailed ? `FAIL (${result.failureReason})` : `ok route=${result.admission?.route || "?"} chars=${result.finalDisplayedAnswer.length}`);
  meta.last = { runId: item.runId, at: result.at, liveFailed: result.liveFailed };
  fs.writeFileSync(RUN_META, JSON.stringify(meta, null, 2));
}

meta.endedAt = new Date().toISOString();
fs.writeFileSync(RUN_META, JSON.stringify(meta, null, 2));
console.log("DONE", meta);
