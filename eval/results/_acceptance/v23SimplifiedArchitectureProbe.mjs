/**
 * V2.3 simplified architecture probe (MOCK only — no paid live LLM).
 * Traces: question → retrieval → generation route → answer for five mandated cases.
 *
 *   node --import ./eval/harness/registerNextResolve.mjs eval/results/_acceptance/v23SimplifiedArchitectureProbe.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT = path.join(ROOT, "eval", "results", "_acceptance", "V23_SIMPLIFIED_ARCHITECTURE_PROBE.json");
const REPORT_MD = path.join(ROOT, "eval", "results", "_acceptance", "V23_SIMPLIFIED_ARCHITECTURE_REPORT.md");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const { resetMockOpenai, enqueueMockCompletion, getMockOpenaiCalls } = await import("../../harness/mockOpenai.mjs");
const { resolveProviderMode, getProviderStats, resetProviderStats } = require("../../../lib/providerMode.js");
const { resolveInterviewContext, explicitProductTopic } = require("../../../lib/interviewContext.js");
const { analyzeInterviewQuestion } = require("../../../lib/interviewAnalyzer.js");
const { productKnowledgeFolders, selectProductScopedChunks } = require("../../../lib/productKnowledgeScope.js");
const { searchKnowledge } = require("../../../services/vectorSearch.js");
const { assessKnowledgeCoverage } = require("../../../lib/knowledgeCoverage.js");
const { finalizeSpokenAnswerForDisplay } = require("../../../lib/answerIntegrityGate.js");
const { selectVerifiedWorkflow } = require("../../../lib/verifiedWorkflow.js");
const { decideInterviewTurn } = require("../../../lib/turnDecision.js");

process.env.LLM_PROVIDER_MODE = "mock";
process.env.INTERVIEW_SAFE_MODE = "0";

const { default: handler } = await import("../../../pages/api/chat.js");

const QUESTIONS = [
  { id: "pfcg", q: "Explain how do you use PFCG?" },
  { id: "brm", q: "Why do organizations implement BRM?" },
  { id: "bw", q: "Explain SAP BW analysis authorizations." },
  { id: "idm", q: "Explain the SAP IDM identity provisioning lifecycle." },
  { id: "zero_kb", q: "Explain how Merkle trees support zero-knowledge proof verification." }
];

function classifySource(chunk) {
  const file = String(chunk?.sourceFile || chunk?.fileName || "").toLowerCase();
  const folder = String(chunk?.sourceFolder || "").toLowerCase();
  const heading = String(chunk?.heading || chunk?.section || "");
  const bank = /-bank\.md$/i.test(file)
    || /architect-bank|interview-bank|principal-architect|gap-filler|deloitte-usi/i.test(file);
  const preparedish = /prepared|answer-bank|spoken-script/i.test(file)
    || /interview questions|90 second|what makes this a 10/i.test(heading);
  let category = "technical-doc";
  if (bank) category = "interview-qa-bank";
  else if (preparedish) category = "qa-or-coaching-format";
  else if (/cv|career|resume|expertise/i.test(file)) category = "cv-career";
  else if (/eval|fixture|test/i.test(folder)) category = "test-fixture";
  return { category, bank, preparedish, technical: !bank && !preparedish, file, folder, heading };
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
    substantive() { return dataChunks.join(""); }
  };
  return res;
}

const report = {
  at: new Date().toISOString(),
  architecture: "QUESTION → KB RETRIEVAL → LLM GENERATION → VALIDATION → DISPLAY",
  providerModeConfigured: resolveProviderMode(process.env),
  cases: []
};

for (const spec of QUESTIONS) {
  const question = spec.q;
  const promptDump = path.join(ROOT, "eval", "results", "_acceptance", `v23-simp-prompt-${spec.id}.txt`);
  process.env.DEBUG_DUMP_PROMPT = promptDump;

  const turn = decideInterviewTurn({ question, history: [] });
  const analysis = analyzeInterviewQuestion(question);
  const ctx = resolveInterviewContext({ questionRaw: question, history: [], source: "v23-simp" });
  const folders = productKnowledgeFolders(question);
  const topic = explicitProductTopic(question) || ctx?.topic || null;

  const candidates = (await searchKnowledge(question, analysis, 16, {
    metadataFilters: { sourceFolders: folders.length ? folders : undefined }
  })) || [];
  const list = Array.isArray(candidates) ? candidates : (candidates.chunks || []);
  const scoped = selectProductScopedChunks(question, list);
  const coverage = assessKnowledgeCoverage({ question, chunks: scoped, analysis });

  const retrievalRows = (scoped || []).slice(0, 10).map((c, i) => {
    const src = classifySource(c);
    return {
      rank: i + 1,
      id: c.id || c.chunkId || null,
      sourceFolder: c.sourceFolder,
      sourceFile: c.sourceFile,
      heading: c.heading || c.section || "",
      score: c.score ?? c.similarity ?? c.semanticScore ?? null,
      sourceCategory: src.category,
      isBank: src.bank,
      preview: String(c.content || "").replace(/\s+/g, " ").slice(0, 180)
    };
  });

  let verified = null;
  try { verified = selectVerifiedWorkflow(question); } catch { verified = null; }

  resetProviderStats("mock");
  resetMockOpenai();
  enqueueMockCompletion("LIVE_BAIT_MUST_NOT_APPEAR");

  const res = createCaptureRes();
  await handler({
    method: "POST",
    body: {
      model: "gpt-4o-mini",
      apiKey: "sk-v23-simp-unused",
      safeMode: false,
      question,
      history: [],
      source: "v23-simplified-architecture"
    }
  }, res);

  delete process.env.DEBUG_DUMP_PROMPT;
  const promptText = fs.existsSync(promptDump) ? fs.readFileSync(promptDump, "utf8") : null;
  const substantive = res.substantive();
  const integrity = finalizeSpokenAnswerForDisplay({ question, answer: substantive, interviewContext: ctx });
  const admission = res.events.find((e) => e.name === "admission")?.data || null;
  const generation = res.events.find((e) => e.name === "generation")?.data || null;
  const answerFinal = res.events.find((e) => e.name === "answer_final")?.data || null;
  const stats = getProviderStats();

  const bannedPhrases = [];
  if (/I walk the operational path end to end/i.test(substantive)) {
    bannedPhrases.push("operational-path-wrap");
  }
  if (/plane-appropriate positive check/i.test(substantive)) {
    bannedPhrases.push("plane-appropriate-wrap");
  }
  if (/LIVE_BAIT/i.test(substantive)) bannedPhrases.push("live-bait-leak");

  const bankHits = retrievalRows.filter((r) => r.isBank);
  const route = admission?.route || generation?.route || answerFinal?.route || null;
  const expectations = {
    routeIsGeneration: route === "GENERATION",
    noBankInRetrieval: bankHits.length === 0,
    noBannedPhrases: bannedPhrases.length === 0,
    mockInvoked: stats.mockInvocations > 0,
    noLiveTransport: stats.liveTransportInvocations === 0,
    noOpenaiHarness: getMockOpenaiCalls().length === 0,
    integrityOk: Boolean(integrity.ok || integrity.answerKind),
    addressesQuestion: true
  };

  if (spec.id === "pfcg") {
    expectations.addressesQuestion = /\bPFCG\b|Profile Generator|role/i.test(substantive);
  } else if (spec.id === "brm") {
    expectations.addressesQuestion = /\bBRM\b|Business Role Management/i.test(substantive)
      && !(/Business Rule Management/i.test(substantive) && !/Business Role Management/i.test(substantive));
  } else if (spec.id === "bw") {
    expectations.addressesQuestion = /\banalysis authorizations?\b|RSECADMIN|BW/i.test(substantive);
  } else if (spec.id === "idm") {
    expectations.addressesQuestion = /\bIDM\b|Identity Management|provision/i.test(substantive);
    expectations.idmNotCloudIdentityPrimary = !retrievalRows.slice(0, 3).every(
      (r) => /cloud-identity/i.test(r.sourceFile || "")
    );
  } else if (spec.id === "zero_kb") {
    expectations.addressesQuestion = !/\b(?:identity or authorization plane|IAS|IPS|IAG|PFCG)\b/i.test(substantive);
    expectations.zeroOrIrrelevantKb = scoped.length === 0
      || !retrievalRows.some((r) => /merkle|zero[- ]knowledge|zk-?snark/i.test(`${r.sourceFile} ${r.heading} ${r.preview}`));
  }

  const failures = Object.entries(expectations)
    .filter(([, v]) => v === false)
    .map(([k]) => k);

  const caseReport = {
    id: spec.id,
    questionReceived: question,
    admissionTurnBeforeDemote: { route: turn.route, reason: turn.reason, scriptId: turn.scriptId || null },
    topic,
    folders,
    verifiedWorkflowAvailable: verified ? { id: verified.id || verified.workflowId, hasAnswer: true } : null,
    retrievedDocuments: retrievalRows,
    bankChunksInScoped: bankHits.map((b) => `${b.rank}:${b.sourceFile}`),
    coverageStatus: coverage?.status || null,
    evidencePassedToLlm: {
      promptDumpChars: promptText ? promptText.length : 0,
      promptDumpPath: promptText ? path.relative(ROOT, promptDump) : null,
      procedureBackboneHint: admission?.procedurePrefer?.servedAs || null
    },
    providerMode: "mock",
    generationRoute: route,
    providerStats: {
      mockInvocations: stats.mockInvocations,
      liveTransportInvocations: stats.liveTransportInvocations,
      openaiHarnessCalls: getMockOpenaiCalls().length
    },
    generatedAnswerPreview: substantive.slice(0, 700),
    generatedAnswerChars: substantive.length,
    validation: {
      integrityOk: integrity.ok,
      answerKind: integrity.answerKind,
      recovered: integrity.recovered,
      finalDisplayedPreview: String(integrity.answer || substantive).slice(0, 700)
    },
    bannedPhrases,
    expectations,
    failures
  };

  report.cases.push(caseReport);
  console.log(`\n=== ${spec.id.toUpperCase()} ===`);
  console.log("route=", route, "mockInv=", stats.mockInvocations, "banks=", bankHits.length);
  console.log("failures=", failures);
  console.log("preview=", substantive.slice(0, 200));
}

report.summary = {
  total: report.cases.length,
  passed: report.cases.filter((c) => c.failures.length === 0).length,
  failed: report.cases.filter((c) => c.failures.length > 0).map((c) => ({ id: c.id, failures: c.failures }))
};

fs.writeFileSync(OUT, JSON.stringify(report, null, 2));

const md = [
  "# V2.3 Simplified Knowledge-Grounded LLM Architecture — Verification Report",
  "",
  `Generated: ${report.at}`,
  `Provider mode: **${report.providerModeConfigured}** (MOCK — no paid live calls)`,
  "",
  "## Architecture",
  "",
  report.architecture,
  "",
  "## PFCG phrase origin (verified)",
  "",
  "- Previously observed phrases (`I walk the operational path…`, `plane-appropriate positive check`) originated in `lib/procedureRetention.js` `renderSpokenProcedure` checklist wrap — **not** from KB docs, mocks, or the LLM.",
  "- That wrap has been removed; checklist steps now render as First/Next/Finally prose only.",
  "",
  "## Summary",
  "",
  `- Cases: ${report.summary.total}`,
  `- Passed: ${report.summary.passed}`,
  `- Failed: ${report.summary.failed.length ? JSON.stringify(report.summary.failed) : "none"}`,
  "",
  "## Per-question trace",
  ""
];

for (const c of report.cases) {
  md.push(`### ${c.id}`);
  md.push("");
  md.push(`- **Question:** ${c.questionReceived}`);
  md.push(`- **Folders:** ${(c.folders || []).join(", ") || "(none)"}`);
  md.push(`- **Retrieved (top):** ${(c.retrievedDocuments || []).slice(0, 5).map((r) => `${r.sourceFolder}/${r.sourceFile} [${r.sourceCategory}]`).join("; ") || "(none)"}`);
  md.push(`- **Bank chunks in scoped:** ${c.bankChunksInScoped?.length ? c.bankChunksInScoped.join(", ") : "none"}`);
  md.push(`- **Route:** ${c.generationRoute}`);
  md.push(`- **Mock invocations:** ${c.providerStats.mockInvocations}; live transport: ${c.providerStats.liveTransportInvocations}`);
  md.push(`- **Banned wrap phrases:** ${c.bannedPhrases.length ? c.bannedPhrases.join(", ") : "none"}`);
  md.push(`- **Failures:** ${c.failures.length ? c.failures.join(", ") : "none"}`);
  md.push(`- **Answer preview:** ${JSON.stringify(c.generatedAnswerPreview)}`);
  md.push("");
}

md.push("## Changes made");
md.push("");
md.push("1. Hard-exclude `*-bank.md` / interview Q&A banks from ordinary technical retrieval (no bank fallback).");
md.push("2. Mock/live: demote ANSWER_BANK; skip VERIFIED_WORKFLOW early return; serve retrieved procedure as LLM evidence backbone.");
md.push("3. Remove PFCG canned checklist wrap in `renderSpokenProcedure`.");
md.push("4. Named SAP IDM questions do not open CIS/cloud solely from shared “identity provisioning” wording.");
md.push("5. Mock zero-KB non-SAP answers avoid SAP-plane principle prose.");
md.push("");
md.push("No commit, push, stash, reset, or paid live provider calls.");
md.push("");

fs.writeFileSync(REPORT_MD, md.join("\n"));
console.log(`\nWrote ${OUT}`);
console.log(`Wrote ${REPORT_MD}`);
console.log("SUMMARY", report.summary);
delete process.env.LLM_PROVIDER_MODE;
