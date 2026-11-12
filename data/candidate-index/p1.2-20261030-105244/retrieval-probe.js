const fs = require("fs");
const path = require("path");

async function run(label) {
  // Force fresh modules so env index path is honored
  Object.keys(require.cache).forEach((k) => {
    if (/[\\/](config|services|lib|models)[\\/]/.test(k)) delete require.cache[k];
  });
  const { searchKnowledge } = require("./services/vectorSearch");
  const { productKnowledgeFolders, selectProductScopedChunks } = require("./lib/productKnowledgeScope");
  const { analyzeInterviewQuestion } = await import("./lib/interviewAnalyzer.js");
  const questions = [
    "What is SAP IAS?",
    "What is SAP IPS?",
    "What is the difference between IAS and IPS?",
    "How do IAS and IPS work together?",
    "How does IPS provision identities from a corporate directory into SAP cloud applications?",
    "How do you secure SAP Fiori?",
    "Explain SAP GRC Access Control implementation.",
    "Explain an SAP GRC Process Control implementation.",
    "How do you configure MSMP workflow?"
  ];
  const rows = [];
  for (const question of questions) {
    const analysis = analyzeInterviewQuestion(question, []);
    const folders = productKnowledgeFolders(question);
    const candidates = await searchKnowledge(
      question,
      analysis,
      12,
      folders.length ? { metadataFilters: { sourceFolders: folders } } : {}
    );
    const scoped = selectProductScopedChunks(question, candidates).slice(0, 8);
    rows.push({
      question,
      folders,
      top: scoped.map((c, i) => ({
        rank: i + 1,
        score: Number((c.score ?? c.semanticScore ?? 0).toFixed(4)),
        file: c.sourceFile,
        heading: c.heading || c.section,
        blur: /Unlike Cloud Identity \(which focuses on provisioning|Cloud Identity brings user data|Cloud Identity is the provisioning/i.test(String(c.content || "")),
        hasSuite: /SAP Cloud Identity Services/i.test(String(c.content || "")),
        hasSourceTarget: /source or target|IPS source or target/i.test(String(c.content || "")),
        cloudConnector: /Cloud Connector/i.test(String(c.content || "")),
        cloudIdentityFile: /cloud-identity\.md/i.test(String(c.sourceFile || ""))
      }))
    });
  }
  return { label, indexFile: process.env.KNOWLEDGE_INDEX_FILE || "./data/knowledgeIndex.json", rows };
}

(async () => {
  const outPath = process.argv[2];
  const label = process.argv[3] || "run";
  const result = await run(label);
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ wrote: outPath, label, questions: result.rows.length }, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
