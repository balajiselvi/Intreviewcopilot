import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { searchKnowledge } = require("../../services/vectorSearch.js");

const logged = [
  ["rise-live-query", "How does the infrastructure of SAP S/4HANA Cloud Public Edition differ from Private Edition in a RISE landscape? Topic: Authorization. Facet: request for architecture.", { category: "Authorization", domain: "SAP Platform", primaryIntent: "Architecture" }],
  ["connector-live-query", "How do you connect an ECC system to SAP Access Control so risk analysis can read its authorization data? Topic: . Facet: request for technical steps.", { category: "Authorization", domain: "SAP GRC", primaryIntent: "Authorization" }],
  ["fiori-live-query", "A user on SAP S/4HANA Cloud Public Edition cannot see a Fiori application. Where do you start, and why is an ABAP authorization trace the wrong first tool? Topic: Fiori. Facet: direct question.", { category: "Authorization", domain: "SAP Fiori Security", primaryIntent: "Authorization" }],
  ["connector-follow-query", "The RFC destination in SM59 tests successfully, but Access Control risk analysis still returns no data from that system. What do you check next? Topic: . Facet: direct question.", { category: "General", domain: "SAP GRC", primaryIntent: "General" }]
];

for (const [id, question, analysis] of logged) {
  const chunks = await searchKnowledge(question, analysis, 6);
  console.log("\nLOGGED", id);
  for (const chunk of chunks || []) {
    const file = String(chunk.sourceFile || "").split(/[/\\]/).pop();
    console.log("-", file, "|", chunk.heading || chunk.section);
  }
}
