/**
 * READ-ONLY forensic probe for BRM + PFCG production path.
 * Uses MOCK provider — no paid live LLM calls.
 *
 *   node --import ./eval/harness/registerNextResolve.mjs eval/results/_forensicBrmPfcgProbe.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "eval", "results", "_acceptance", "forensic-brm-pfcg.json");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const { resetMockOpenai, enqueueMockCompletion, getMockOpenaiCalls } = await import("../harness/mockOpenai.mjs");
const { resolveProviderMode, getProviderStats, resetProviderStats } = require("../../lib/providerMode.js");
const { resolveInterviewContext, explicitProductTopic } = require("../../lib/interviewContext.js");
const { analyzeInterviewQuestion } = require("../../lib/interviewAnalyzer.js");
const { productKnowledgeFolders, selectProductScopedChunks } = require("../../lib/productKnowledgeScope.js");
const { searchKnowledge } = require("../../services/vectorSearch.js");
const { assessKnowledgeCoverage } = require("../../lib/knowledgeCoverage.js");
const { detectQuestionContractFamily, finalizeSpokenAnswerForDisplay } = require("../../lib/answerIntegrityGate.js");
const { resolvePreparedScript } = require("../../lib/scriptMatch.js");
const { matchPreparedAnswer } = require("../../lib/preparedAnswerPack.js");
const { selectVerifiedWorkflow } = require("../../lib/verifiedWorkflow.js");
const { questionProcedureIntent } = require("../../lib/procedureRetention.js");
const { isSafeModeEnabled } = require("../../lib/safeModeRouter.js");

// Capture prompt dump path
process.env.LLM_PROVIDER_MODE = "mock";
process.env.INTERVIEW_SAFE_MODE = "0";

const { default: handler } = await import("../../pages/api/chat.js");

const QUESTIONS = [
  { id: "brm", q: "Why do organizations implement BRM?" },
  { id: "pfcg", q: "Explain how do you use PFCG?" }
];

function classifySource(chunk) {
  const file = String(chunk?.sourceFile || chunk?.fileName || "").toLowerCase();
  const folder = String(chunk?.sourceFolder || "").toLowerCase();
  const heading = String(chunk?.heading || chunk?.section || "");
  const bank = /architect-bank|interview-bank|principal-architect|gap-filler|deloitte-usi/i.test(file);
  const preparedish = /prepared|answer-bank|spoken-script/i.test(file) || /interview questions|90 second|what makes this a 10/i.test(heading);
  const technical = !bank && !preparedish;
  let category = "technical-doc";
  if (bank) category = "interview-qa-bank";
  else if (preparedish) category = "qa-or-coaching-format";
  else if (/cv|career|resume|expertise/i.test(file)) category = "cv-career";
  else if (/eval|fixture|test/i.test(folder)) category = "test-fixture";
  return { category, bank, preparedish, technical, file, folder, heading };
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
  mode: "READ_ONLY_FORENSIC",
  providerModeConfigured: resolveProviderMode(process.env),
  safeModeDefault: isSafeModeEnabled({}),
  cases: []
};

for (const spec of QUESTIONS) {
  const question = spec.q;
  const promptDump = path.join(ROOT, "eval", "results", "_acceptance", `forensic-prompt-${spec.id}.txt`);
  process.env.DEBUG_DUMP_PROMPT = promptDump;

  const analysis = analyzeInterviewQuestion(question);
  const ctx = resolveInterviewContext({ questionRaw: question, history: [], source: "forensic" });
  const family = detectQuestionContractFamily(question);
  const intent = questionProcedureIntent(question, ctx?.answerScope || "");
  const folders = productKnowledgeFolders(question);
  const topic = explicitProductTopic(question) || ctx?.topic || null;

  const candidates = (await searchKnowledge(question, analysis, 16, {
    metadataFilters: { sourceFolders: folders }
  })) || [];
  const list = Array.isArray(candidates) ? candidates : (candidates.chunks || []);
  const scoped = selectProductScopedChunks(question, list);
  const coverage = assessKnowledgeCoverage({ question, chunks: scoped, analysis });

  const retrievalRows = (scoped || []).slice(0, 12).map((c, i) => {
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
      preview: String(c.content || "").replace(/\s+/g, " ").slice(0, 220)
    };
  });

  const prepared = resolvePreparedScript(question);
  const pack = matchPreparedAnswer(question, {});
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
      apiKey: "sk-forensic-unused",
      safeMode: false,
      question,
      history: [],
      source: "forensic-brm-pfcg"
    }
  }, res);

  delete process.env.DEBUG_DUMP_PROMPT;
  const promptText = fs.existsSync(promptDump) ? fs.readFileSync(promptDump, "utf8") : null;
  const knowledgeBlockMatch = promptText
    ? (promptText.match(/KNOWLEDGE[\s\S]{0,80}?\n([\s\S]{0,4000})/i) || promptText.match(/retrieved knowledge[\s\S]{0,80}?\n([\s\S]{0,4000})/i))
    : null;

  const substantive = res.substantive();
  const integrity = finalizeSpokenAnswerForDisplay({ question, answer: substantive, interviewContext: ctx });

  const bankInTop = retrievalRows.filter((r) => r.isBank);
  const techHits = retrievalRows.filter((r) =>
    (spec.id === "brm" && /brm\.md/i.test(r.sourceFile || ""))
    || (spec.id === "pfcg" && /pfcg\.md/i.test(r.sourceFile || ""))
  );

  const caseReport = {
    id: spec.id,
    question,
    normalization: {
      analysisCategory: analysis?.category || null,
      analysisDomain: analysis?.domain || null,
      analysisComponents: analysis?.sapComponents || analysis?.components || null,
      topic,
      folders,
      family,
      procedureIntent: intent,
      contextTopic: ctx?.topic || null,
      resolvedQuestion: ctx?.resolvedQuestion || null,
      answerScope: ctx?.answerScope || null
    },
    provider: {
      mode: "mock",
      liveTransportInvocations: getProviderStats().liveTransportInvocations,
      mockInvocations: getProviderStats().mockInvocations,
      openaiHarnessCalls: getMockOpenaiCalls().length,
      llmActuallyInvoked: getMockOpenaiCalls().length > 0,
      note: "MOCK mode — deterministic path; openaiHarnessCalls must be 0 when providerMode=mock"
    },
    selection: {
      preparedScript: prepared ? { id: prepared.id, via: prepared.via, confidence: prepared.confidence, authoritative: prepared.authoritative } : null,
      preparedPack: pack?.hit ? { entryId: pack.entry?.id, score: pack.score } : { hit: false },
      verifiedWorkflow: verified ? { workflowId: verified.workflowId || verified.id, hasAnswer: Boolean(verified.answer) } : null
    },
    retrieval: {
      candidateCount: list.length,
      scopedCount: scoped.length,
      coverageStatus: coverage.status,
      useRetrievedAsGrounding: coverage.useRetrievedAsGrounding,
      top12: retrievalRows,
      bankChunksInTop12: bankInTop.map((b) => `${b.rank}:${b.sourceFile}`),
      technicalTargetInTop12: techHits.map((t) => `${t.rank}:${t.sourceFile}:${t.heading}`),
      technicalTargetRank: techHits[0]?.rank ?? null
    },
    prompt: {
      dumpPath: promptText ? `eval/results/_acceptance/forensic-prompt-${spec.id}.txt` : null,
      dumpChars: promptText ? promptText.length : 0,
      containsBankHeading: promptText ? /Interview Questions|90 Second|What Makes This a 10|gap-filler|architect-bank/i.test(promptText) : null,
      containsBrmDoc: promptText ? /Business Role Management|BRM/i.test(promptText) : null,
      containsPfcgDoc: promptText ? /\bPFCG\b|Profile Generator/i.test(promptText) : null,
      knowledgeExcerptPreview: knowledgeBlockMatch ? String(knowledgeBlockMatch[1] || "").slice(0, 500) : null
    },
    delivery: {
      admission: res.events.find((e) => e.name === "admission")?.data || null,
      generation: res.events.find((e) => e.name === "generation")?.data || null,
      answerFinal: res.events.find((e) => e.name === "answer_final")?.data || null,
      events: res.events.map((e) => e.name),
      substantivePreview: substantive.slice(0, 500),
      substantiveChars: substantive.length,
      integrityOk: integrity.ok,
      integrityKind: integrity.answerKind,
      integrityRecovered: integrity.recovered
    },
    failureHypotheses: []
  };

  // Hypothesis tagging (read-only)
  if (spec.id === "brm") {
    if (!/Business Role Management|\bBRM\b/i.test(substantive) || /Business Rule Management|BRF\+/i.test(substantive) && !/Business Role Management/i.test(substantive)) {
      caseReport.failureHypotheses.push("answer-may-miss-or-misidentify-BRM-as-business-role-management");
    }
    if (caseReport.retrieval.technicalTargetRank == null || caseReport.retrieval.technicalTargetRank > 3) {
      caseReport.failureHypotheses.push("brm.md-not-preferred-in-retrieval");
    }
    if (bankInTop.length && (caseReport.retrieval.technicalTargetRank == null || bankInTop[0].rank < (caseReport.retrieval.technicalTargetRank || 99))) {
      caseReport.failureHypotheses.push("qa-bank-outranks-technical-brm-doc");
    }
  }
  if (spec.id === "pfcg") {
    if (!/\bPFCG\b/i.test(substantive)) {
      caseReport.failureHypotheses.push("answer-missing-pfcg");
    }
    const keywordSoup = (substantive.match(/\b(?:SU24|SU25|SU53|STAUTHTRACE|AGR_\w+|S_TCODE|PFCG)\b/g) || []).length;
    if (keywordSoup >= 8 && !/Profile Generator|role maintenance|authorization data|generate profile/i.test(substantive)) {
      caseReport.failureHypotheses.push("keyword-accumulation-without-focused-pfcg-usage");
    }
    if (caseReport.retrieval.technicalTargetRank == null || caseReport.retrieval.technicalTargetRank > 3) {
      caseReport.failureHypotheses.push("pfcg.md-not-preferred-in-retrieval");
    }
    if (bankInTop.length && (caseReport.retrieval.technicalTargetRank == null || bankInTop[0].rank < (caseReport.retrieval.technicalTargetRank || 99))) {
      caseReport.failureHypotheses.push("qa-bank-outranks-technical-pfcg-doc");
    }
  }
  if (caseReport.prompt.containsBankHeading) {
    caseReport.failureHypotheses.push("prompt-contains-bank-or-coaching-material");
  }

  report.cases.push(caseReport);
  console.log(`\n=== ${spec.id.toUpperCase()} ===`);
  console.log("topic=", topic, "folders=", folders, "family=", family, "intent=", intent);
  console.log("techTargetRank=", caseReport.retrieval.technicalTargetRank, "banks=", caseReport.retrieval.bankChunksInTop12);
  console.log("route=", caseReport.delivery.admission?.route || caseReport.delivery.generation?.route);
  console.log("hypotheses=", caseReport.failureHypotheses);
  console.log("preview=", substantive.slice(0, 220));
}

fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log(`\nWrote ${OUT}`);
delete process.env.LLM_PROVIDER_MODE;
delete process.env.INTERVIEW_SAFE_MODE;
