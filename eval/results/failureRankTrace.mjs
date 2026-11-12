import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { searchKnowledge } = require("../../services/vectorSearch.js");

const cases = [
  ["fiori", "A Public Edition user cannot see a Fiori app. Topic: Fiori. Facet: direct question.", { category: "Fiori", domain: "SAP Fiori Security", primaryIntent: "Authorization" }, 3],
  ["connector", "Connect ECC for Access Control risk analysis. Topic: . Facet: direct question.", { category: "ECC", domain: "SAP GRC", primaryIntent: "Authorization" }, 3],
  ["empty", "SM59 succeeds but Access Control risk analysis returns nothing. Topic: . Facet: direct question.", { category: "Troubleshooting", domain: "SAP GRC", primaryIntent: "Troubleshooting" }, 4]
];

for (const [id, question, analysis, topK] of cases) {
  const chunks = await searchKnowledge(question, analysis, topK);
  console.log("\n", id, "top", topK);
  (chunks || []).forEach((chunk, index) => {
    const file = String(chunk.sourceFile || "").split(/[/\\]/).pop();
    console.log(index + 1, chunk.score?.toFixed?.(3), file, "|", chunk.heading);
    console.log(String(chunk.content || "").slice(0, 180).replace(/\s+/g, " "));
  });
}
