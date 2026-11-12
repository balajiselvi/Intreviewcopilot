const { OPENAI_API_KEY } = require("../lib/env");
process.env.OPENAI_API_KEY = OPENAI_API_KEY;
const { searchKnowledge } = require("../../services/vectorSearch");
const { productKnowledgeFolders, selectProductScopedChunks } = require("../../lib/productKnowledgeScope");

const question = "Walk me through the overall security architecture for S/4HANA Cloud. Topic: S/4. Facet: request for architecture.";

(async () => {
  const { analyzeInterviewQuestion } = await import("../../lib/interviewAnalyzer.js");
  const raw = "Walk me through the overall security architecture for S/4HANA Cloud.";
  const analysis = analyzeInterviewQuestion(raw, []);
  console.log("analysis", JSON.stringify({ category: analysis.category, domain: analysis.domain, intent: analysis.primaryIntent || analysis.intent }));
  const folders = productKnowledgeFolders(question);
  const chunks = await searchKnowledge(question, analysis, 12, folders.length ? { metadataFilters: { sourceFolders: folders } } : {});
  const scoped = selectProductScopedChunks(question, chunks).slice(0, 3);
  console.log(scoped.map((chunk) => `${chunk.sourceFile} | ${chunk.heading}`).join("\n"));
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
