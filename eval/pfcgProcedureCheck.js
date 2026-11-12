const {
  shouldPreferRetrievedProcedure,
  authoritativeProcedure,
  renderSpokenProcedure,
  questionProcedureIntent
} = require("../lib/procedureRetention");
const { searchKnowledge } = require("../services/vectorSearch");
const { analyzeInterviewQuestion } = require("../lib/interviewAnalyzer");
const {
  productKnowledgeFolders,
  selectProductScopedChunks,
  augmentStemMatchedChunks
} = require("../lib/productKnowledgeScope");

(async () => {
  const q = "Explain how do you use PFCG?";
  const analysis = analyzeInterviewQuestion(q);
  const folders = productKnowledgeFolders(q);
  const c = await searchKnowledge(q, analysis, 16, { metadataFilters: { sourceFolders: folders } });
  const list = Array.isArray(c) ? c : (c.chunks || []);
  const augmented = augmentStemMatchedChunks(q, list, folders);
  const scoped = selectProductScopedChunks(q, augmented);
  console.log(scoped.slice(0, 6).map((x, i) => ({ i: i + 1, h: x.heading, file: x.sourceFile })));
  const knowledgeText = scoped.slice(0, 8).map((x) => `## ${x.heading}\n${x.content || ""}`).join("\n\n");
  const prefer = shouldPreferRetrievedProcedure({ question: q, knowledgeText, answerScope: "DEFAULT" });
  const steps = authoritativeProcedure(q, knowledgeText, "DEFAULT") || [];
  console.log(JSON.stringify({
    intent: questionProcedureIntent(q, ""),
    prefer,
    steps: steps.slice(0, 8),
    spoken: String(renderSpokenProcedure(q, steps) || "").slice(0, 450)
  }, null, 2));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
