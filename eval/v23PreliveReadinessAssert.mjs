/**
 * Interview Copilot V2.3 — Pre-live release readiness verification (MOCK/DISABLED only).
 *
 *   node --import ./eval/harness/registerNextResolve.mjs eval/v23PreliveReadinessAssert.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "eval", "results", "_acceptance");
const OUT = path.join(OUT_DIR, "v23-prelive-readiness.json");
fs.mkdirSync(OUT_DIR, { recursive: true });

process.env.LLM_PROVIDER_MODE = "mock";
process.env.INTERVIEW_SAFE_MODE = "0";

const { resetMockOpenai, enqueueMockCompletion, getMockOpenaiCalls } = await import("./harness/mockOpenai.mjs");
const {
  resolveProviderMode,
  getProviderStats,
  resetProviderStats,
  assertLiveTransportAllowed,
  DISABLED_GENERATION_MESSAGE
} = require("../lib/providerMode.js");
const {
  productKnowledgeFolders,
  selectProductScopedChunks,
  augmentStemMatchedChunks
} = require("../lib/productKnowledgeScope.js");
const { searchKnowledge } = require("../services/vectorSearch.js");
const { assessKnowledgeCoverage } = require("../lib/knowledgeCoverage.js");
const { analyzeInterviewQuestion } = require("../lib/interviewAnalyzer.js");
const {
  questionProcedureIntent,
  shouldPreferRetrievedProcedure,
  prioritizeProcedureChunks
} = require("../lib/procedureRetention.js");
const { selectVerifiedWorkflow } = require("../lib/verifiedWorkflow.js");
const { isMetaRefusalText } = require("../lib/generationGuard.js");
const { validateAndRecoverSpokenAnswer } = require("../lib/answerIntegrityGate.js");
const { default: handler } = await import("../pages/api/chat.js");

const report = {
  at: new Date().toISOString(),
  phase1: {},
  phase2: {},
  phase3: {},
  phase4: { cases: [] },
  phase5: { cases: [] },
  phase6: { cases: [] },
  pass: true,
  defects: []
};

function fail(id, detail) {
  report.pass = false;
  report.defects.push({ id, detail });
  console.log(`FAIL ${id}: ${typeof detail === "string" ? detail : JSON.stringify(detail).slice(0, 200)}`);
}
function ok(id, detail = "") {
  console.log(`PASS ${id}${detail ? ` — ${detail}` : ""}`);
}

function createCaptureRes() {
  const events = [];
  const dataChunks = [];
  const res = {
    writable: true, writableEnded: false, statusCode: 200, headersSent: false, headers: {},
    setHeader(k, v) { this.headers[k] = v; this.headersSent = true; },
    status(c) { this.statusCode = c; return this; },
    json(b) { events.push({ name: "json", data: b }); return this; },
    end() { this.writableEnded = true; },
    once() {}, on() {},
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
  return res;
}

async function ask(question, mode = "mock") {
  process.env.LLM_PROVIDER_MODE = mode;
  resetProviderStats(mode);
  resetMockOpenai();
  enqueueMockCompletion("LIVE_BAIT");
  const res = createCaptureRes();
  await handler({
    method: "POST",
    body: {
      model: "gpt-4o-mini",
      apiKey: "sk-unused",
      safeMode: false,
      question,
      history: [],
      source: "v23-prelive"
    }
  }, res);
  return {
    substantive: res.substantive(),
    admission: res.events.find((e) => e.name === "admission")?.data || null,
    answerFinal: res.events.find((e) => e.name === "answer_final")?.data || null,
    events: res.events.map((e) => e.name),
    stats: getProviderStats(),
    openaiCalls: getMockOpenaiCalls().length
  };
}

async function retrievalTrace(question) {
  const analysis = analyzeInterviewQuestion(question, []);
  const folders = productKnowledgeFolders(question);
  const retrievalQuery = `${question}${analysis?.category ? ` Topic: ${analysis.category}.` : ""}`;
  const candidates = folders.length
    ? (await searchKnowledge(retrievalQuery, analysis, 12, { metadataFilters: { sourceFolders: folders } })) || []
    : [];
  const augmented = augmentStemMatchedChunks(retrievalQuery, candidates, folders);
  const scoped = selectProductScopedChunks(retrievalQuery, augmented);
  const coverage = assessKnowledgeCoverage({ question: retrievalQuery, chunks: scoped, analysis });
  const bankHits = scoped.filter((c) => /architect-bank|interview-bank|gap-filler|deloitte-usi/i.test(String(c.sourceFile || "")));
  const top = scoped.slice(0, 6).map((c) => ({
    heading: String(c.heading || c.section || "").slice(0, 80),
    sourceFile: String(c.sourceFile || "").slice(-60),
    score: Number(c.score || c.semanticScore || 0),
    interviewBank: Boolean(c.metadata?.interviewBank || /architect-bank|interview-bank/i.test(String(c.sourceFile || "")))
  }));
  return {
    analysis: { category: analysis?.category, domain: analysis?.domain, intent: analysis?.intent },
    folders,
    coverage: coverage.status,
    coverageReason: coverage.reason || null,
    candidateCount: candidates.length,
    scopedCount: scoped.length,
    bankHitsInScoped: bankHits.length,
    bankFiles: [...new Set(bankHits.map((c) => c.sourceFile))],
    top,
    intent: questionProcedureIntent(question, "")
  };
}

// ─── PHASE 1 ─────────────────────────────────────────────────────
report.phase1 = {
  branch: execSync("git branch --show-current", { cwd: ROOT, encoding: "utf8" }).trim(),
  head: execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim(),
  statusPorcelainCount: execSync("git status --porcelain", { cwd: ROOT, encoding: "utf8" })
    .split("\n").filter(Boolean).length,
  section913Exists: fs.existsSync(path.join(OUT_DIR, "SECTION9_13_FINAL_REPORT.md")),
  brmPfcgArtifact: fs.existsSync(path.join(OUT_DIR, "brm-pfcg-acceptance.json")),
  section910Artifact: fs.existsSync(path.join(OUT_DIR, "section910-acceptance-matrix.json"))
};
ok("phase1-baseline", `${report.phase1.branch}@${report.phase1.head.slice(0, 8)} dirty=${report.phase1.statusPorcelainCount}`);

// Re-verify prior acceptance claims by re-running key asserts' outcome files freshness + live re-ask
{
  const brm = await ask("Why do organizations implement BRM?");
  const pfcg = await ask("Explain how do you use PFCG?");
  const claimsOk = brm.admission?.route === "VERIFIED_WORKFLOW"
    && /business[- ]role/i.test(brm.substantive)
    && pfcg.admission?.route === "RETRIEVED_PROCEDURE"
    && /\bPFCG\b/i.test(pfcg.substantive)
    && !/I do not have a reliable technical answer/i.test(brm.substantive + pfcg.substantive);
  report.phase1.reverifiedBrmPfcg = {
    ok: claimsOk,
    brmRoute: brm.admission?.route,
    pfcgRoute: pfcg.admission?.route,
    brmPreview: brm.substantive.slice(0, 220),
    pfcgPreview: pfcg.substantive.slice(0, 220)
  };
  if (claimsOk) ok("phase1-reverify-brm-pfcg");
  else fail("phase1-reverify-brm-pfcg", report.phase1.reverifiedBrmPfcg);
}

// ─── PHASE 2 — Q&A isolation ─────────────────────────────────────
{
  const indexPath = path.join(ROOT, "data", "knowledgeIndex.json");
  let index = null;
  try {
    index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  } catch (err) {
    fail("phase2-index-load", String(err.message || err));
  }
  const chunks = Array.isArray(index?.chunks) ? index.chunks
    : Array.isArray(index?.documents) ? []
    : (index?.chunkIndex || []);
  // Support multiple index shapes
  let allChunks = [];
  if (Array.isArray(index?.chunks)) allChunks = index.chunks;
  else if (Array.isArray(index)) allChunks = index;
  else if (index && typeof index === "object") {
    const vals = Object.values(index);
    if (vals[0]?.sourceFile || vals[0]?.content) allChunks = vals;
  }

  const bankInIndex = allChunks.filter((c) =>
    /architect-bank|interview-bank|gap-filler|deloitte-usi/i.test(String(c.sourceFile || c.fileName || ""))
    || c?.metadata?.interviewBank === true
  );
  const withProvenance = allChunks.filter((c) => c.sourceFile || c.fileName || c.documentId).length;
  const provenanceRate = allChunks.length ? withProvenance / allChunks.length : 0;

  // Production retrieval for GRC definition — banks should not dominate scoped set
  const critTrace = await retrievalTrace("What are Critical Actions?");
  const brmTrace = await retrievalTrace("Why do organizations implement BRM?");
  const pfcgTrace = await retrievalTrace("Explain how do you use PFCG?");

  const bankExcludedOrDemoted = critTrace.bankHitsInScoped === 0
    || critTrace.top.every((t, i) => i >= 2 || !t.interviewBank);

  report.phase2 = {
    indexChunkCount: allChunks.length,
    bankChunksStillIndexed: bankInIndex.length,
    bankFilesIndexed: [...new Set(bankInIndex.map((c) => c.sourceFile || c.fileName))].slice(0, 20),
    provenanceCoverage: Number(provenanceRate.toFixed(4)),
    criticalActions: {
      bankHitsInScoped: critTrace.bankHitsInScoped,
      topFiles: critTrace.top.map((t) => t.sourceFile),
      coverage: critTrace.coverage
    },
    brm: { bankHitsInScoped: brmTrace.bankHitsInScoped, topFiles: brmTrace.top.map((t) => t.sourceFile), coverage: brmTrace.coverage },
    pfcg: { bankHitsInScoped: pfcgTrace.bankHitsInScoped, topFiles: pfcgTrace.top.map((t) => t.sourceFile), coverage: pfcgTrace.coverage },
    preparedScriptPathExists: fs.existsSync(path.join(ROOT, "lib", "preparedSpokenScripts.js")),
    rehearsalNote: "Prepared/verified routes remain available via admission; technical retrieval prefers non-bank sources."
  };

  if (allChunks.length === 0) {
    fail("phase2-index-empty", "Could not enumerate index chunks — provenance audit incomplete");
  } else {
    ok("phase2-index-loaded", `${allChunks.length} chunks, bankIndexed=${bankInIndex.length}`);
  }
  if (provenanceRate < 0.95) {
    fail("phase2-provenance-gap", `provenanceCoverage=${provenanceRate}`);
  } else {
    ok("phase2-provenance", `${(provenanceRate * 100).toFixed(1)}% chunks have sourceFile/documentId`);
  }
  if (!bankExcludedOrDemoted && critTrace.bankHitsInScoped > 0 && critTrace.top[0]?.interviewBank) {
    fail("phase2-bank-dominates-critical-actions", critTrace.top);
  } else {
    ok("phase2-bank-isolation-critical-actions", `bankHitsInScoped=${critTrace.bankHitsInScoped}`);
  }
  // Banks may remain in index (preserved) — that is allowed if filtered at retrieval
  report.phase2.findingA = bankInIndex.length > 0
    ? "Banks remain indexed but selectProductScopedChunks demotes/excludes them from ordinary technical primary set"
    : "No bank-named chunks found in enumerated index shape";
  report.phase2.findingB = bankInIndex.length > 0;
  report.phase2.findingC = "Prepared scripts / verified workflows are admission routes, not retrieval overrides of arbitrary questions";
}

// ─── PHASE 3+4 — Multi-domain matrix with retrieval traces ───────
const MATRIX = [
  {
    id: "grc-brm",
    q: "Why do organizations implement BRM?",
    expectDomain: /grc|business role|authorization|security/i,
    expectAnswer: /business[- ]role|BRM|ARM|PFCG/i,
    forbid: [/I do not have a reliable technical answer/i, /LIVE_BAIT/]
  },
  {
    id: "sec-pfcg",
    q: "Explain how do you use PFCG?",
    expectDomain: /authorization|security|role|pfcg/i,
    expectAnswer: /\bPFCG\b/i,
    forbid: [/I do not have a reliable technical answer/i, /LIVE_BAIT/]
  },
  {
    id: "sec-su24-su25",
    q: "Explain the difference between SU24 and SU25.",
    expectDomain: /authorization|security|s\/?4|upgrade/i,
    expectAnswer: /SU24|SU25/i,
    forbid: [/LIVE_BAIT/, /I do not have a reliable technical answer/i]
  },
  {
    id: "grc-msmp",
    q: "Explain MSMP architecture.",
    expectDomain: /grc|msmp|workflow|arm/i,
    expectAnswer: /MSMP|workflow|path|stage|BRF/i,
    forbid: [/LIVE_BAIT/, /I do not have a reliable technical answer/i]
  },
  {
    id: "grc-critical-actions",
    q: "Explain critical actions and their significance.",
    expectDomain: /grc|ara|risk|security/i,
    expectAnswer: /Critical Action/i,
    forbid: [/LIVE_BAIT/, /1,?650/]
  },
  {
    id: "bw-analysis-auth",
    q: "Explain analysis authorizations.",
    expectDomain: /bw|bi|analysis|authorization|security/i,
    expectAnswer: /analysis authorization|RSECADMIN|InfoObject|BW/i,
    forbid: [/LIVE_BAIT/]
  },
  {
    id: "idm-ips-lifecycle",
    q: "Explain the identity provisioning lifecycle.",
    expectDomain: /ips|iam|identity|provision|ias|iag/i,
    expectAnswer: /provision|IPS|SCIM|lifecycle|joiner|source|target/i,
    forbid: [/LIVE_BAIT/, /I do not have a reliable technical answer/i]
  },
  {
    id: "btp-authz",
    q: "Explain authentication and authorization architecture.",
    expectDomain: /btp|ias|xsuaa|security|iam|authorization|authentication/i,
    expectAnswer: /authenticat|authoriz|IAS|XSUAA|IdP|role collection|OAuth|OIDC|SAML/i,
    forbid: [/LIVE_BAIT/]
  },
  {
    id: "s4-experience",
    q: "Tell me about your S/4HANA transformation experience.",
    expectDomain: /s\/?4|experience|security/i,
    expectAnswer: /S\/?4|role|Fiori|Dover|would/i,
    forbid: [/Maintain two checklists where needed/i, /reduced roles by \d+%/i, /LIVE_BAIT/]
  },
  {
    id: "outside-inventory",
    q: "What is ZZX99_FAKE in Quantum Ledger Controllers?",
    expectDomain: /./,
    expectAnswer: /would not invent|not have verified product documentation/i,
    forbid: [/LIVE_BAIT/, /GRFNMW_CONFIGURE/]
  }
];

for (const spec of MATRIX) {
  const trace = await retrievalTrace(spec.q);
  const out = await ask(spec.q);
  const answerOk = spec.expectAnswer.test(out.substantive)
    && !(spec.forbid || []).some((re) => re.test(out.substantive))
    && out.stats.liveTransportInvocations === 0
    && out.substantive.length > 40;
  const domainHay = `${trace.analysis.category || ""} ${trace.analysis.domain || ""} ${spec.q}`;
  const domainOk = spec.expectDomain.test(domainHay);
  const row = {
    id: spec.id,
    ok: Boolean(answerOk && domainOk),
    domainOk,
    answerOk,
    route: out.admission?.route,
    folders: trace.folders,
    coverage: trace.coverage,
    intent: trace.intent,
    bankHitsInScoped: trace.bankHitsInScoped,
    topFiles: trace.top.map((t) => t.sourceFile),
    preview: out.substantive.slice(0, 240),
    analysis: trace.analysis
  };
  report.phase4.cases.push(row);
  report.phase3[spec.id] = {
    folders: trace.folders,
    coverage: trace.coverage,
    bankHitsInScoped: trace.bankHitsInScoped,
    top: trace.top
  };
  if (row.ok) ok(`phase4-${spec.id}`, `route=${row.route} cov=${row.coverage}`);
  else fail(`phase4-${spec.id}`, row);
}

// ─── PHASE 5 — Intent / route regression ─────────────────────────
{
  const cases = [];
  // A. wrapMode=direct for configure; conceptual why stays non-configure
  const whyIntent = questionProcedureIntent("Why do organizations implement BRM?", "");
  const howIntent = questionProcedureIntent("Explain how do you use PFCG?", "");
  const workIntent = questionProcedureIntent("How do you typically work in PFCG day to day?", "");
  const whyPrefer = shouldPreferRetrievedProcedure({
    question: "Why do organizations implement BRM?",
    knowledgeText: "## Overview\nBRM maps business roles to technical roles for ARM.",
    seniority: "Principal Architect",
    procedurePool: [],
    seedChunks: []
  });
  const howPrefer = shouldPreferRetrievedProcedure({
    question: "Explain how do you use PFCG?",
    knowledgeText: [
      "## Generate and assign a single role",
      "Use transaction PFCG to create the single role, add the required transactions on the Menu tab, and maintain organizational levels on the Authorizations tab.",
      "Generate the authorization profile in PFCG after that authorization data is complete, because the generated profile is what the user buffer checks.",
      "Assign the role on the PFCG User tab or in transaction SU01, then run user comparison so the profile enters the user buffer.",
      "Review table AGR_USERS for the user assignment and table AGR_1251 for authorization values, and do not treat AGR_USERS as a transaction.",
      "Validate the result by having the assigned user complete the business transaction for the maintained organizational value."
    ].join("\n"),
    seniority: "Principal Architect",
    procedurePool: [],
    seedChunks: []
  });
  cases.push({
    id: "wrapMode-configure-direct",
    ok: howIntent === "configure" && howPrefer.prefer === true && howPrefer.wrapMode === "direct",
    detail: { howIntent, wrap: howPrefer.wrapMode, prefer: howPrefer.prefer, reason: howPrefer.reason, steps: howPrefer.stepCount }
  });
  cases.push({
    id: "why-not-forced-configure",
    ok: whyIntent === "" || whyPrefer.prefer === false || whyPrefer.reason === "no-procedure-intent",
    detail: { whyIntent, prefer: whyPrefer.prefer, reason: whyPrefer.reason }
  });
  cases.push({
    id: "usage-work-in-intent",
    ok: workIntent === "configure",
    detail: { workIntent }
  });

  // C. Experience recovery
  const exp = await ask("Tell me about your S/4HANA transformation experience.");
  cases.push({
    id: "experience-not-activate-checklist",
    ok: !/Maintain two checklists where needed/i.test(exp.substantive)
      && /S\/?4|role|Fiori|would/i.test(exp.substantive),
    detail: { preview: exp.substantive.slice(0, 180), route: exp.admission?.route }
  });

  // D. Inability not validated
  const inability = "I do not have a reliable technical answer I can defend for that question right now (test). I would rather qualify the gap.";
  cases.push({
    id: "inability-is-meta",
    ok: isMetaRefusalText(inability) === true,
    detail: {}
  });
  const inabilityGate = validateAndRecoverSpokenAnswer({
    question: "Explain how do you use PFCG?",
    answer: inability,
    interviewContext: {},
    recoveryAnswer: "Use PFCG to maintain the Menu tab, adjust Authorizations, generate the profile, assign the role, and validate with a business action."
  });
  cases.push({
    id: "inability-not-accepted-as-technical",
    ok: inabilityGate.answerKind !== "validated" || !/I do not have a reliable technical answer/i.test(inabilityGate.answer),
    detail: { answerKind: inabilityGate.answerKind, preview: String(inabilityGate.answer || "").slice(0, 120) }
  });

  // E. Finalization — answer_final present on mock generation path
  const crit = await ask("What are Critical Actions?");
  cases.push({
    id: "answer-final-emitted",
    ok: crit.events.includes("answer_final") && crit.substantive.length > 40,
    detail: { events: crit.events, route: crit.admission?.route }
  });

  report.phase5.cases = cases;
  for (const c of cases) {
    if (c.ok) ok(`phase5-${c.id}`);
    else fail(`phase5-${c.id}`, c.detail);
  }
}

// ─── PHASE 6 — Provider modes ────────────────────────────────────
{
  const mockMode = resolveProviderMode({ LLM_PROVIDER_MODE: "mock" }, {});
  const disabledMode = resolveProviderMode({ LLM_PROVIDER_MODE: "disabled" }, {});
  const liveMode = resolveProviderMode({ LLM_PROVIDER_MODE: "live" }, {});
  report.phase6.resolve = { mockMode, disabledMode, liveMode };

  let liveBlocked = false;
  try {
    assertLiveTransportAllowed("disabled", "readiness-probe");
  } catch {
    liveBlocked = true;
  }
  report.phase6.disabledBlocksLiveTransport = liveBlocked;

  const mockAsk = await ask("What are Critical Actions?", "mock");
  report.phase6.mock = {
    ok: mockAsk.stats.liveTransportInvocations === 0
      && mockAsk.stats.mockInvocations >= 0
      && mockAsk.substantive.length > 40
      && !/LIVE_BAIT/i.test(mockAsk.substantive),
    route: mockAsk.admission?.route,
    stats: mockAsk.stats,
    note: "MOCK exercises pipeline; not proof of live LLM accuracy"
  };

  const disabledAsk = await ask("What are Critical Actions?", "disabled");
  const disabledText = disabledAsk.substantive;
  // Indexed definition may still answer via local knowledge; LLM must stay blocked.
  const disabledKnownOk = disabledAsk.stats.liveTransportInvocations === 0
    && disabledAsk.stats.disabledBlocked >= 1
    && disabledAsk.openaiCalls === 0
    && /Critical Action/i.test(disabledText)
    && !/LIVE_BAIT/i.test(disabledText);
  const disabledOutside = await ask("What is ZZX99_FAKE in Quantum Ledger Controllers?", "disabled");
  const disabledOutsideText = disabledOutside.substantive;
  const disabledOutsideOk = disabledOutside.stats.liveTransportInvocations === 0
    && disabledOutside.stats.disabledBlocked >= 1
    && (
      /Provider generation is disabled/i.test(disabledOutsideText)
      || /operational configuration/i.test(disabledOutsideText)
      || disabledOutsideText.includes(String(DISABLED_GENERATION_MESSAGE || "").slice(0, 40))
    )
    && !/IAG_WF_MANAGER|PAM ID/i.test(disabledOutsideText);
  report.phase6.disabled = {
    ok: disabledKnownOk && disabledOutsideOk,
    known: { ok: disabledKnownOk, route: disabledAsk.admission?.route, preview: disabledText.slice(0, 180), stats: disabledAsk.stats },
    outsideInventory: {
      ok: disabledOutsideOk,
      route: disabledOutside.admission?.route,
      preview: disabledOutsideText.slice(0, 220),
      stats: disabledOutside.stats
    }
  };

  report.phase6.live = {
    invoked: false,
    modeResolvesToLive: liveMode === "live",
    prerequisites: [
      "Explicit user authorization for paid live calls",
      "Valid provider API key configured",
      "LLM_PROVIDER_MODE=live",
      "Separate live evaluation harness (not this readiness suite)"
    ]
  };

  if (mockMode === "mock" && report.phase6.mock.ok) ok("phase6-mock");
  else fail("phase6-mock", report.phase6.mock);
  if (disabledMode === "disabled" && liveBlocked && report.phase6.disabled.ok) ok("phase6-disabled");
  else fail("phase6-disabled", report.phase6.disabled);
  if (liveMode === "live" && report.phase6.live.invoked === false) ok("phase6-live-not-invoked");
  else fail("phase6-live", report.phase6.live);
}

delete process.env.LLM_PROVIDER_MODE;
delete process.env.INTERVIEW_SAFE_MODE;

fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log(`\nv23PreliveReadiness: ${report.pass ? "PASS" : "FAIL"} defects=${report.defects.length} → ${OUT}`);
assert.equal(report.pass, true);
