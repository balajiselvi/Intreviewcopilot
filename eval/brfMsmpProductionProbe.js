const fs = require("node:fs");
const path = require("node:path");
const { searchKnowledge } = require("../services/vectorSearch");
const { productKnowledgeFolders, selectProductScopedChunks } = require("../lib/productKnowledgeScope");

const questions = [
  "How do I configure BRF+ agent determination in MSMP?",
  "How do I attach the BRFplus agent rule?",
  "How do I configure approver determination?",
  "Why does the MSMP request have no approver?",
  "How do I configure a new access-request approval path?",
  "How do I troubleshoot the rule-result mapping?"
];

(async () => {
  const { analyzeInterviewQuestion } = await import("../lib/interviewAnalyzer.js");
  const { authoritativeProcedure, renderSpokenProcedure, questionProcedureIntent } = await import("../lib/procedureRetention.js");
  const { resolveInterviewContext } = require("../lib/interviewContext");
  const cases = [];
  for (const question of questions) {
    const analysis = analyzeInterviewQuestion(question, []);
    const context = resolveInterviewContext({ questionRaw: question, history: [] });
    const folders = productKnowledgeFolders(question);
    const candidates = await searchKnowledge(question, analysis, 12, folders.length ? { metadataFilters: { sourceFolders: folders } } : {});
    const scoped = selectProductScopedChunks(question, candidates).slice(0, 8);
    const evidence = scoped.map((chunk) => `## ${chunk.heading || chunk.section}\n${chunk.content}`).join("\n\n");
    const steps = authoritativeProcedure(question, evidence, context.answerScope);
    const answer = renderSpokenProcedure(question, steps);
    cases.push({
      question,
      domain: analysis.domain,
      answerScope: context.answerScope,
      sourceFolders: folders,
      intent: questionProcedureIntent(question, context.answerScope),
      answerPath: steps.length >= 3 ? "retrieved-procedure" : "generation-required",
      rankedSources: scoped.map((chunk) => ({ folder: chunk.sourceFolder, file: chunk.sourceFile, heading: chunk.heading || chunk.section, score: chunk.score })),
      procedureStepCount: steps.length,
      answer,
      inventedGrcmsmp: /\bGRCMSMP\b/i.test(answer),
      sourcedMsmpOrBrfArtifacts: /Maintain MSMP Workflows|Define Workflow-Related MSMP Rules|RULE_RESULT|Agent Rule|decision table/i.test(answer)
    });
  }
  const result = { generatedAt: new Date().toISOString(), mode: "production-retrieval", cases };
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const output = path.join(__dirname, "results", `brf-msmp-production-${stamp}.json`);
  fs.writeFileSync(output, JSON.stringify(result, null, 2), { flag: "wx" });
  console.log(JSON.stringify({ output, cases: cases.length, retrievalOnly: true, failures: cases.filter((item) => item.inventedGrcmsmp || item.answerPath !== "retrieved-procedure").map((item) => item.question) }, null, 2));
  if (cases.some((item) => item.inventedGrcmsmp || item.answerPath !== "retrieved-procedure")) process.exitCode = 1;
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
