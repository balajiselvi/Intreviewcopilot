const { searchKnowledge } = require("../../services/vectorSearch");
const { productKnowledgeFolders, selectProductScopedChunks } = require("../../lib/productKnowledgeScope");
const questions = [
  "How would you deliver a programme with SAP Activate? Topic: Activate. Facet: request for technical steps.",
  "How is identity and access administered for SAP Joule? Topic: Joule. Facet: direct question."
];
(async () => {
  const { analyzeInterviewQuestion } = await import("../../lib/interviewAnalyzer.js");
  const { authoritativeProcedure, questionProcedureIntent } = await import("../../lib/procedureRetention.js");
  for (const question of questions) {
    const analysis = analyzeInterviewQuestion(question, []);
    if (/Joule/i.test(question)) analysis.category = "BTP";
    const folders = productKnowledgeFolders(question);
    const candidates = await searchKnowledge(question, analysis, folders.length ? 12 : 8, folders.length ? { metadataFilters: { sourceFolders: folders } } : {});
    const scoped = selectProductScopedChunks(question, candidates).slice(0, 3);
    const text = scoped.map((chunk) => `## ${chunk.heading}\n${chunk.content}`).join("\n\n");
    const steps = authoritativeProcedure(question, text, "");
    console.log(`\n${question}`);
    console.log(`intent ${questionProcedureIntent(question)} category ${analysis.category} folders ${folders.join(",") || "-"}`);
    console.log(scoped.map((chunk) => `${chunk.sourceFolder}/${chunk.sourceFile} | ${chunk.heading} | ${String(chunk.content).slice(0, 180).replace(/\s+/g, " ")}`).join("\n"));
    console.log(`steps ${steps.length}`);
  }
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
