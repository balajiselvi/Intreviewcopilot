const { OPENAI_API_KEY } = require("../lib/env");
process.env.OPENAI_API_KEY = OPENAI_API_KEY;
const { searchKnowledge } = require("../../services/vectorSearch");
const { productKnowledgeFolders, selectProductScopedChunks } = require("../../lib/productKnowledgeScope");

const cases = [
  ["public-design", "How would you design security for SAP S/4HANA Cloud Public Edition?"],
  ["public-assign", "How do you assign a business role to a business user in SAP S/4HANA Cloud Public Edition?"],
  ["public-trace", "How do you trace an authorization check and confirm the business user can complete the app in S/4HANA Cloud Public Edition?"],
  ["private-pfcg", "How do you create and assign a role in SAP S/4HANA Cloud Private Edition?"],
  ["compare", "What changes in role administration between SAP S/4HANA Cloud Public Edition and Private Edition?"],
  ["fiori-miss", "A user cannot launch a Fiori app in SAP S/4HANA Cloud Public Edition. What do you check?"],
  ["no-edition", "How do you design and verify authorization for S/4HANA?"],
  ["regression", "How would you design security for SAP S/4HANA Cloud, and how would you verify that the user has the required access?"],
  ["architecture", "Walk me through the overall security architecture for S/4HANA Cloud."]
];

(async () => {
  const { analyzeInterviewQuestion } = await import("../../lib/interviewAnalyzer.js");
  const { authoritativeProcedure } = await import("../../lib/procedureRetention.js");
  for (const [id, question] of cases) {
    const analysis = analyzeInterviewQuestion(question, []);
    const folders = productKnowledgeFolders(question);
    const searchK = folders.length ? 12 : 3;
    const candidates = await searchKnowledge(question, analysis, searchK, folders.length ? { metadataFilters: { sourceFolders: folders } } : {});
    const scoped = selectProductScopedChunks(question, candidates).slice(0, 8);
    const selected = scoped.slice(0, 3);
    const text = selected.map((chunk) => `## ${chunk.heading || ""}\n${chunk.content || ""}`).join("\n\n");
    const steps = authoritativeProcedure(question, text, "");
    const spoken = steps.map((step) => step.text || step).join(" ");
    console.log(`\n${id} folders=${folders.join(",") || "-"}`);
    console.log(scoped.map((chunk) => `${chunk.sourceFile} | ${chunk.heading} | ${chunk.score ?? chunk.finalScore ?? ""}`).join("\n"));
    console.log(`steps=${steps.length} public=${/Maintain Business Roles/.test(spoken)} pfcg=${/\bPFCG\b/.test(spoken)}`);
    console.log(steps.map((step, index) => `${index + 1}. ${String(step.text || step).slice(0, 180)}`).join("\n"));
  }
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
