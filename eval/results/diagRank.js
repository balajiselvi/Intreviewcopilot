const { searchKnowledge } = require("../../services/vectorSearch.js");

const cases = [
  ["ips-yes", "Have you implemented IPS? Topic: IPS. Facet: request for experience.", { category: "General", secondaryCategories: [] }, 3],
  ["ips-integrate", "How did you integrate IPS with SAP IAG, S/4HANA, and BTP? Topic: BTP. Facet: request for experience.", { category: "BTP", secondaryCategories: [] }, 3],
  ["ips-sync", "How would you troubleshoot a failed IPS synchronization? Topic: IPS. Facet: direct question.", { category: "Troubleshooting", secondaryCategories: [] }, 4],
  ["pm-risk", "How do you manage project risks and dependencies during an SAP security delivery? Topic: . Facet: direct question.", { category: "PMP", secondaryCategories: [] }, 3],
  ["cutover", "What do you do during cutover and hypercare? Topic: . Facet: direct question.", { category: "General", secondaryCategories: [] }, 2],
  ["compare", "How does missing an app differ from an app opening and then failing authorization? Topic: . Facet: direct question.", { category: "Authorization", secondaryCategories: [] }, 3],
  ["public", "On SAP S/4HANA Cloud Public Edition, a business user cannot see a Fiori app. What do you check? Topic: Fiori. Facet: direct question.", { category: "Fiori", secondaryCategories: ["Troubleshooting"] }, 4],
  ["private", "On SAP S/4HANA Cloud Private Edition, a user cannot see a Fiori app on the launchpad. What do you check? Topic: Fiori. Facet: direct question.", { category: "Fiori", secondaryCategories: [] }, 3],
  ["odata", "The Fiori app opens, then an OData request fails with an authorization error on an on-premise Gateway system. What do you check? Topic: Fiori. Facet: direct question.", { category: "Troubleshooting", secondaryCategories: ["Fiori"] }, 4],
  ["service", "The Fiori app opens, but the OData service is not registered or not active. What do you check on an on-premise system? Topic: Fiori. Facet: direct question.", { category: "Troubleshooting", secondaryCategories: ["Fiori"] }, 4],
  ["negative", "The app is missing from the launchpad. What is the first diagnostic step? Topic: Fiori. Facet: direct question.", { category: "Fiori", secondaryCategories: [] }, 3]
];

function promptText(chunks) {
  let current = 0;
  const kept = [];
  for (const chunk of chunks) {
    for (const para of String(chunk.content || "").split(/\n+/)) {
      const p = para.trim();
      if (!p) continue;
      if (current + p.length > 3000) return kept.join("\n");
      kept.push(p);
      current += p.length;
    }
  }
  return kept.join("\n");
}

(async () => {
  const { extractProcedureSteps } = await import("../../lib/procedureRetention.js");
  for (const [id, query, analysis, topK] of cases) {
    const chunks = await searchKnowledge(query, analysis, topK);
    const text = promptText(chunks);
    const steps = extractProcedureSteps(text);
    console.log("\n==", id, "chars", text.length, "steps", steps.length, "jobLogs", text.includes("Job Logs"), "com0465", text.includes("SAP_COM_0465"));
    if (id.startsWith("ips") || id === "cutover") steps.slice(0, 4).forEach((step, index) => console.log(" step", index + 1, step.slice(0, 140)));
    chunks.forEach((chunk, index) => {
      const file = String(chunk.sourceFile || "").split(/[/\\]/).pop();
      console.log(index + 1, (chunk.score || 0).toFixed(3), file, "|", chunk.heading);
    });
  }
})().catch((error) => { console.error(error); process.exit(1); });
