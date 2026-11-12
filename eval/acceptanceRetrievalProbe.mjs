/**
 * Acceptance retrieval probe — mirrors pages/api/chat.js retrieval composition.
 * Uses searchKnowledge (not unranked full-corpus scoping).
 * Writes eval/results/_acceptance/retrieval-seven-families.json
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "eval", "results", "_acceptance");
fs.mkdirSync(OUT_DIR, { recursive: true });

const { productKnowledgeFolders, selectProductScopedChunks } = require("../lib/productKnowledgeScope.js");
const { searchKnowledge } = require("../services/vectorSearch.js");
const { explicitProductTopic } = require("../lib/interviewContext.js");
const { detectQuestionContractFamily } = require("../lib/answerIntegrityGate.js");
const { assessKnowledgeCoverage, COVERAGE } = require("../lib/knowledgeCoverage.js");
const { analyzeInterviewQuestion } = require("../lib/interviewAnalyzer.js");
const APP_CONFIG = require("../config/appConfig.js");

const indexPath = path.join(ROOT, "data", "knowledgeIndex.json");
const backupPath = path.join(ROOT, "data", "index-backup-20261102-203015-pre-v22", "knowledgeIndex.json");
const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
const LIVE_RELEVANCE_THRESHOLD = 0.45;

const questions = [
  ["What are Critical Actions?", /Critical Action/i, /ara\.md/i],
  ["What are Critical Permissions?", /Critical Permission/i, /ara\.md/i],
  ["What are Critical Access Risks?", /Critical Access Risk/i, /ara\.md/i],
  ["What is the difference between Risk, Function, Action and Permission?", /Function|Permission|Action|Risk/i, /ara\.md/i],
  ["What are the GRC Rule Set Components?", /ruleset|rule set|Function|Risk/i, /ara\.md|ruleset|rule/i],
  ["Explain the Mitigation Lifecycle.", /mitigat|owner|monitor|expir/i, /mitigation\.md/i],
  ["What if Firefighter Logs are Not Generated?", /Firefighter|log|sync|session/i, /firefighter|eam|grc/i]
];

const report = {
  index: {
    activeChunks: index.chunks.length,
    generatedAt: index.generatedAt,
    parserVersion: APP_CONFIG.knowledge?.parserVersion,
    chunkVersion: APP_CONFIG.knowledge?.chunkVersion,
    indexVersion: APP_CONFIG.knowledge?.indexVersion,
    backupChunks: backup.chunks.length,
    backupGeneratedAt: backup.generatedAt,
    backupPath: "data/index-backup-20261102-203015-pre-v22/",
    method: "searchKnowledge + selectProductScopedChunks (mirrors chat.js)"
  },
  families: []
};

for (const [question, topicalRe, sourceRe] of questions) {
  const folders = productKnowledgeFolders(question);
  const topic = explicitProductTopic(question);
  const family = detectQuestionContractFamily(question);
  const analysis = analyzeInterviewQuestion(question);
  const candidates = (await searchKnowledge(
    question,
    analysis,
    16,
    { metadataFilters: { sourceFolders: folders } }
  )) || [];
  const list = Array.isArray(candidates) ? candidates : (candidates.chunks || []);
  const scoped = selectProductScopedChunks(question, list);
  const topScore = Math.max(
    Number(scoped?.[0]?.score ?? 0),
    Number(scoped?.[0]?.semanticScore ?? 0),
    Number(scoped?.[0]?.confidenceScore ?? 0)
  );
  const coverage = assessKnowledgeCoverage({ question, chunks: scoped, analysis });
  const top8 = scoped.slice(0, 8).map((c, i) => ({
    rank: i + 1,
    id: c.id || c.chunkId,
    sourceFile: `${c.sourceFolder}/${c.sourceFile}`,
    heading: c.heading || c.section || "",
    score: c.score ?? c.similarity ?? c.semanticScore ?? null,
    preview: String(c.content || "").replace(/\s+/g, " ").slice(0, 160)
  }));
  const knowledgeText = scoped.slice(0, 8).map((c) => String(c.content || "")).join("\n\n");
  const bankish = top8.filter((t) => /interview-bank|gap-filler|deloitte-usi/i.test(t.sourceFile));
  const techInTop = top8.find((t) => sourceRe.test(t.sourceFile) && topicalRe.test(`${t.heading} ${t.preview}`));
  const techInScoped = scoped.find((c) => sourceRe.test(c.sourceFile || "") && topicalRe.test(`${c.heading || ""} ${c.content || ""}`));

  report.families.push({
    question,
    detectedFamily: family,
    topic,
    folders,
    returnedCandidates: list.length,
    scopedCount: scoped.length,
    topScore,
    belowLiveRelevanceThreshold: topScore < LIVE_RELEVANCE_THRESHOLD,
    coverageStatus: coverage.status,
    useRetrievedAsGrounding: coverage.useRetrievedAsGrounding,
    top8,
    bankOrGapFillerInTop8: bankish.map((b) => `${b.rank}:${b.sourceFile}`),
    technicalPreferredInTop8: Boolean(techInTop),
    technicalReference: techInScoped
      ? {
          id: techInScoped.id,
          sourceFile: `${techInScoped.sourceFolder}/${techInScoped.sourceFile}`,
          heading: techInScoped.heading,
          rankAmongScoped: scoped.findIndex((c) => (c.id || c.chunkId) === (techInScoped.id || techInScoped.chunkId)) + 1
        }
      : null,
    knowledgeHasTopical: topicalRe.test(knowledgeText),
    q22HeadingInKnowledge: /Explain the architecture of Mitigating Controls/i.test(knowledgeText),
    validateInstructionInKnowledge: /\bValidate expiry\b/i.test(knowledgeText),
    coverageEnum: COVERAGE
  });
}

fs.writeFileSync(path.join(OUT_DIR, "retrieval-seven-families.json"), JSON.stringify(report, null, 2));
console.log("acceptanceRetrievalProbe: wrote retrieval-seven-families.json");
for (const f of report.families) {
  console.log(
    `- ${f.detectedFamily}: topScore=${f.topScore?.toFixed?.(3) ?? f.topScore} coverage=${f.coverageStatus} techTop8=${f.technicalPreferredInTop8} rank=${f.technicalReference?.rankAmongScoped ?? "-"} bankTop=${f.bankOrGapFillerInTop8.length} topical=${f.knowledgeHasTopical}`
  );
}
