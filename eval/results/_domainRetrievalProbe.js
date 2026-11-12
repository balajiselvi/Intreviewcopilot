const { searchKnowledge } = require("../../services/vectorSearch");
const { productKnowledgeFolders, selectProductScopedChunks } = require("../../lib/productKnowledgeScope");
const questions = [
  "How do you authorize an administrator for SAP Customer Activity Repository?",
  "How is identity and access administered for SAP Joule?"
];
(async () => {
  const { analyzeInterviewQuestion } = await import("../../lib/interviewAnalyzer.js");
  const { authoritativeProcedure } = await import("../../lib/procedureRetention.js");
  for (const question of questions) {
    const analysis = analyzeInterviewQuestion(question, []);
    const folders = productKnowledgeFolders(question);
    const candidates = await searchKnowledge(question, analysis, folders.length ? 12 : 8, folders.length ? { metadataFilters: { sourceFolders: folders } } : {});
    const scoped = selectProductScopedChunks(question, candidates).slice(0, 3);
    const text = scoped.map((chunk) => `## ${chunk.heading}\n${chunk.content}`).join("\n\n");
    const steps = authoritativeProcedure(question, text, "");
    console.log(`\n${question}`);
    console.log(`folders ${folders.join(",") || "-"}`);
    console.log(scoped.map((chunk) => `${chunk.sourceFile} | ${chunk.heading}`).join("\n"));
    console.log(`steps ${steps.length}`);
    console.log(steps.slice(0, 4).join(" | ").slice(0, 400));
  }
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
