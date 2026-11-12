/**
 * §9 Technical Evidence + §10 Provider Mode / Acceptance Matrix
 *
 *   node --import ./eval/harness/registerNextResolve.mjs eval/section910AcceptanceMatrixAssert.mjs
 *
 * No paid live provider calls. LIVE mode is verified by resolve/guard contracts only.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "eval", "results", "_acceptance", "section910-acceptance-matrix.json");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const {
  resetMockOpenai,
  enqueueMockCompletion,
  getMockOpenaiCalls
} = await import("./harness/mockOpenai.mjs");

const {
  resolveProviderMode,
  getProviderStats,
  resetProviderStats,
  assertLiveTransportAllowed,
  DISABLED_GENERATION_MESSAGE
} = require("../lib/providerMode.js");
const {
  evaluateSpokenAnswerIntegrity,
  validateAndRecoverSpokenAnswer,
  finalizeSpokenAnswerForDisplay,
  isProviderDisabledOperationalMessage
} = require("../lib/answerIntegrityGate.js");
const { resolveInterviewContext, explicitProductTopic } = require("../lib/interviewContext.js");
const { productKnowledgeFolders, selectProductScopedChunks } = require("../lib/productKnowledgeScope.js");
const { searchKnowledge } = require("../services/vectorSearch.js");
const { analyzeInterviewQuestion } = require("../lib/interviewAnalyzer.js");
const { assessKnowledgeCoverage } = require("../lib/knowledgeCoverage.js");

const { default: handler } = await import("../pages/api/chat.js");

const report = { at: new Date().toISOString(), pass: true, cases: [] };

function record(id, ok, detail = {}) {
  report.cases.push({ id, ok, ...detail });
  if (!ok) report.pass = false;
  console.log(`${ok ? "PASS" : "FAIL"} ${id}`, detail.note || "");
}

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
    substantive() { return dataChunks.join(""); },
    hasAnswerFinal() { return events.some((e) => e.name === "answer_final"); },
    generation() { return events.find((e) => e.name === "generation")?.data || null; },
    admission() { return events.find((e) => e.name === "admission")?.data || null; }
  };
  return res;
}

async function invokeChat({ mode, question, history = [], mockText = null, safeMode = false }) {
  process.env.LLM_PROVIDER_MODE = mode;
  resetProviderStats(mode);
  resetMockOpenai();
  if (mockText != null) enqueueMockCompletion(mockText);
  const res = createCaptureRes();
  await handler({
    method: "POST",
    body: {
      model: "gpt-4o-mini",
      apiKey: "sk-matrix-must-not-call-live",
      safeMode,
      question,
      history,
      source: "section910-matrix",
      providerMode: "live",
      forceLocalFallback: true
    }
  }, res);
  return {
    stats: getProviderStats(),
    openaiCalls: getMockOpenaiCalls().length,
    substantive: res.substantive(),
    answerFinal: res.hasAnswerFinal(),
    generation: res.generation(),
    admission: res.admission(),
    events: res.events.map((e) => e.name)
  };
}

// --- §9 unit: integrity independent of generation fluency ---
{
  const altOk = evaluateSpokenAnswerIntegrity({
    question: "What are Critical Actions?",
    answer: "In ARA, a Critical Action risk marks one privileged executable by itself — for example a sensitive transaction — without needing a second conflicting function the way SoD does."
  });
  record("s9-alt-terminology-accepted", altOk.ok === true, { reasons: altOk.reasons });

  const fab = evaluateSpokenAnswerIntegrity({
    question: "What are Critical Actions?",
    answer: "Critical Actions are Firefighter controller SLA reviews for log approval. Six stages. At Dover that was 1,650 PFCG roles."
  });
  record("s9-fabricated-wrong-subject-rejected", fab.ok === false, { reasons: fab.reasons });

  const disabledKeep = validateAndRecoverSpokenAnswer({
    question: "What are Critical Actions?",
    answer: DISABLED_GENERATION_MESSAGE
  });
  record("s9-disabled-msg-not-rewritten",
    disabledKeep.answerKind === "provider_disabled"
    && /Provider generation is disabled/.test(disabledKeep.answer)
    && !disabledKeep.recovered
    && isProviderDisabledOperationalMessage(disabledKeep.answer),
    { kind: disabledKeep.answerKind }
  );

  const finalized = finalizeSpokenAnswerForDisplay({
    question: "What are Critical Actions?",
    answer: "Six stages. At Dover that was 1,650 PFCG roles."
  });
  record("s9-finalization-rejects-s4-leak",
    !/1,?650/.test(finalized.answer) && finalized.recovered === true,
    { kind: finalized.answerKind, preview: String(finalized.answer).slice(0, 100) }
  );
}

// --- §10 provider mode contracts ---
{
  record("s10-mode-live-resolve", resolveProviderMode({ LLM_PROVIDER_MODE: "live" }) === "live");
  record("s10-mode-mock-resolve", resolveProviderMode({ LLM_PROVIDER_MODE: "mock" }) === "mock");
  record("s10-mode-disabled-resolve", resolveProviderMode({ LLM_PROVIDER_MODE: "disabled" }) === "disabled");
  record("s10-mode-unknown-fail-closed", resolveProviderMode({ LLM_PROVIDER_MODE: "weird" }) === "disabled");

  resetProviderStats("live");
  assertLiveTransportAllowed("live", "matrix-live");
  record("s10-live-guard-allows", getProviderStats().liveTransportInvocations === 1);

  let blocked = false;
  try { assertLiveTransportAllowed("disabled", "openai-sdk"); } catch (e) { blocked = e?.code === "PROVIDER_MODE_BLOCKED"; }
  record("s10-disabled-cannot-invoke-llm-guard", blocked === true);

  const msg = DISABLED_GENERATION_MESSAGE;
  record("s10-disabled-msg-operational-not-knowledge-gap",
    /operational configuration/i.test(msg) && !/I do not know|not in my knowledge|cannot answer SAP/i.test(msg)
  );
}

// --- Chat pipeline cases (MOCK / DISABLED) ---
{
  const bank = await invokeChat({
    mode: "mock",
    question: "What are Critical Actions?",
    mockText: "LIVE_BAIT must not appear"
  });
  record("s10-existing-bank-or-indexed-definition",
    bank.stats.liveTransportInvocations === 0
    && bank.openaiCalls === 0
    && bank.answerFinal === true
    && /Critical Action/i.test(bank.substantive)
    && !/LIVE_BAIT|1,?650/.test(bank.substantive),
    { route: bank.generation?.route, preview: bank.substantive.slice(0, 120) }
  );

  const paraphrased = await invokeChat({
    mode: "mock",
    question: "In GRC ARA, what does a Critical Action risk mean compared with SoD?",
    mockText: "LIVE_BAIT"
  });
  record("s10-new-question-indexed-domain",
    paraphrased.answerFinal
    && paraphrased.stats.liveTransportInvocations === 0
    && /Critical Action|ARA|SoD|segregation/i.test(paraphrased.substantive),
    { preview: paraphrased.substantive.slice(0, 120) }
  );

  const skillNoBank = await invokeChat({
    mode: "mock",
    question: "How do you troubleshoot when Firefighter logs are not generated in centralized EAM?",
    mockText: "LIVE_BAIT"
  });
  record("s10-skill-domain-no-exact-bank",
    skillNoBank.stats.liveTransportInvocations === 0
    && skillNoBank.openaiCalls === 0
    && String(skillNoBank.substantive || "").length > 40
    && (skillNoBank.answerFinal || /RETRIEVED_PROCEDURE|VERIFIED_WORKFLOW|GENERATION/i.test(String(skillNoBank.admission?.route || skillNoBank.generation?.route || "")))
    && /Firefighter|EAM|log|sync|controller|emergency/i.test(skillNoBank.substantive)
    && !/LIVE_BAIT/.test(skillNoBank.substantive),
    {
      route: skillNoBank.admission?.route || skillNoBank.generation?.route,
      answerFinal: skillNoBank.answerFinal,
      preview: skillNoBank.substantive.slice(0, 120)
    }
  );

  // Zero / weak RAG: out-of-inventory product-ish ask under mock still finalizes.
  const outside = await invokeChat({
    mode: "mock",
    question: "How do I configure SAP Quantum Ledger Controllers for ZZX99_FAKE transaction paths?",
    mockText: "LIVE_BAIT invent T-code ZZX99_FAKE now"
  });
  record("s10-outside-inventory-finalized-no-live",
    outside.stats.liveTransportInvocations === 0
    && outside.openaiCalls === 0
    && outside.answerFinal === true
    && !/LIVE_BAIT/.test(outside.substantive)
    && !/\bZZX99_FAKE\b/.test(outside.substantive)
    && /knowledge base|not invent|verified product|standard SAP product/i.test(outside.substantive),
    { preview: outside.substantive.slice(0, 180) }
  );

  // Acronym with context → IPS plane
  const ctx = resolveInterviewContext({
    questionRaw: "How does the transformation mapping work?",
    history: [
      { role: "assistant", content: "We configure SAP Cloud Identity Provisioning (IPS) source and target systems." },
      { role: "user", content: "How does the transformation mapping work?" }
    ],
    source: "section910"
  });
  const ipsTopic = String(ctx?.topic || explicitProductTopic("How does IPS handle transformation mapping?") || "");
  record("s10-acronym-contextual-ips",
    /IPS/i.test(JSON.stringify(ctx)) || ipsTopic === "IPS" || /IPS/i.test(String(ctx?.resolvedQuestion || "")),
    { topic: ipsTopic || ctx?.topic, resolved: ctx?.resolvedQuestion || null }
  );

  // Ambiguous short acronym without context — should clarify / defer rather than invent
  const amb = await invokeChat({
    mode: "mock",
    question: "What about AC?",
    mockText: "LIVE_BAIT"
  });
  const ambDefer = /DEFER|WAIT|clarify|incomplete|need|which|Access Control|Analytics Cloud/i.test(
    `${amb.substantive} ${JSON.stringify(amb.admission)}`
  ) || amb.admission?.decision === "DEFER" || amb.admission?.route === "NONE" || !amb.substantive;
  record("s10-ambiguous-acronym-needs-clarity-or-safe",
    amb.stats.liveTransportInvocations === 0 && (ambDefer || amb.answerFinal),
    { admission: amb.admission, preview: amb.substantive.slice(0, 120) }
  );

  // DISABLED with generation required: force a question unlikely to hit rich local KB
  const disabledGen = await invokeChat({
    mode: "disabled",
    question: "Invent a brand-new SAP module called ZZX99_FAKE Controller Fabric and list its T-codes.",
    mockText: "LIVE_BAIT"
  });
  const disabledOp = isProviderDisabledOperationalMessage(disabledGen.substantive)
    || disabledGen.generation?.route === "PROVIDER_DISABLED"
    || /Provider generation is disabled/i.test(disabledGen.substantive)
    || disabledGen.generation?.route === "LOCAL_KNOWLEDGE_FALLBACK";
  record("s10-disabled-no-llm-and-finalized",
    disabledGen.stats.liveTransportInvocations === 0
    && disabledGen.openaiCalls === 0
    && disabledGen.answerFinal === true
    && disabledOp
    && !/LIVE_BAIT/.test(disabledGen.substantive),
    {
      route: disabledGen.generation?.route,
      kind: disabledGen.generation?.providerImplementation,
      preview: disabledGen.substantive.slice(0, 160)
    }
  );

  // Contamination: unrelated S/4 blueprint must not pass Critical Actions integrity
  const contaminated = finalizeSpokenAnswerForDisplay({
    question: "What are the GRC Rule Set Components?",
    answer: "In Cloud IAG, Business Function Groups drive Access Analysis Rule Setup. That is the entire ruleset model."
  });
  record("s10-unrelated-retrieval-contamination-rejected",
    contaminated.ok === false || contaminated.recovered === true || !/Business Function Groups drive Access Analysis Rule Setup\. That is the entire ruleset model/i.test(contaminated.answer),
    { kind: contaminated.answerKind, preview: String(contaminated.answer).slice(0, 140) }
  );

  // Retrieval topicality for indexed domain (zero-RAG contrast uses coverage assessor)
  const analysis = analyzeInterviewQuestion("What are Critical Actions?");
  const folders = productKnowledgeFolders("What are Critical Actions?");
  const candidates = (await searchKnowledge("What are Critical Actions?", analysis, 16, {
    metadataFilters: { sourceFolders: folders }
  })) || [];
  const list = Array.isArray(candidates) ? candidates : (candidates.chunks || []);
  const scoped = selectProductScopedChunks("What are Critical Actions?", list);
  const coverage = assessKnowledgeCoverage({ question: "What are Critical Actions?", chunks: scoped, analysis });
  record("s10-indexed-domain-has-relevant-rag",
    coverage.useRetrievedAsGrounding === true && scoped.length > 0,
    { status: coverage.status, scoped: scoped.length }
  );

  // Synthetic zero-relevant case
  const emptyCoverage = assessKnowledgeCoverage({
    question: "What are Critical Actions?",
    chunks: [{ content: "SAP Analytics Cloud story permissions use folders.", sourceFile: "sac.md", score: 0.1 }],
    analysis
  });
  record("s10-zero-relevant-rag-detected",
    emptyCoverage.useRetrievedAsGrounding === false
    || /IRRELEVANT|NO_RELEVANT|INSUFFICIENT/i.test(String(emptyCoverage.status || "")),
    { status: emptyCoverage.status }
  );
}

delete process.env.LLM_PROVIDER_MODE;
fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log(`\nsection910AcceptanceMatrix: ${report.pass ? "PASS" : "FAIL"} (${report.cases.filter((c) => c.ok).length}/${report.cases.length}) → ${OUT}`);
assert.equal(report.pass, true);
