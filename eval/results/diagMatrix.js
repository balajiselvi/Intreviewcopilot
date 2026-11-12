const { searchKnowledge } = require("../../services/vectorSearch.js");

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

const cases = [
  ["grc-config", "How do you configure an MSMP workflow for an access request?", { category: "Workflow", secondaryCategories: [] }, 4],
  ["grc-trouble", "How would you troubleshoot a missing connector for GRC risk analysis?", { category: "Troubleshooting", secondaryCategories: [] }, 4],
  ["grc-version", "What is the difference between SAP Access Control 10.1 and 12.0?", { category: "General", secondaryCategories: [] }, 3],
  ["iag-config", "How do you configure an IAG access request?", { category: "IAG", secondaryCategories: [] }, 3],
  ["iag-trouble", "How would you troubleshoot a failed IAG access request provisioning?", { category: "Troubleshooting", secondaryCategories: ["IAG"] }, 4],
  ["btp", "How do you assign a BTP role collection?", { category: "BTP", secondaryCategories: [] }, 3],
  ["fiori-public", "On SAP S/4HANA Cloud Public Edition, a business user cannot see a Fiori app. What do you check?", { category: "Fiori", secondaryCategories: ["Troubleshooting"] }, 4],
  ["fiori-private", "On SAP S/4HANA Cloud Private Edition, a user cannot see a Fiori app on the launchpad. What do you check?", { category: "Fiori", secondaryCategories: [] }, 3],
  ["fiori-odata", "The Fiori app opens, then an OData request fails with an authorization error on an on-premise Gateway system. What do you check?", { category: "Troubleshooting", secondaryCategories: ["Fiori"] }, 4],
  ["sf", "How do you configure SuccessFactors role-based permissions?", { category: "General", secondaryCategories: [] }, 3],
  ["ariba", "How would you troubleshoot Ariba user access?", { category: "Troubleshooting", secondaryCategories: [] }, 4],
  ["bw", "How do you configure BW analysis authorizations?", { category: "General", secondaryCategories: [] }, 3],
  ["hana", "How would you troubleshoot a HANA privilege failure?", { category: "Troubleshooting", secondaryCategories: [] }, 4],
  ["sac", "How do you configure SAP Analytics Cloud roles and teams?", { category: "General", secondaryCategories: [] }, 3],
  ["datasphere", "How do you configure Datasphere space roles?", { category: "General", secondaryCategories: [] }, 3],
  ["cutover", "What do you do during cutover and hypercare?", { category: "General", secondaryCategories: [] }, 2],
  ["ips-sync", "How would you troubleshoot a failed IPS synchronization? Topic: IPS. Facet: direct question.", { category: "Troubleshooting", secondaryCategories: [] }, 4],
  ["ips-yes", "Have you implemented IPS?", { category: "General", secondaryCategories: [] }, 3]
];

(async () => {
  const { authoritativeProcedure } = await import("../../lib/procedureRetention.js");
  for (const [id, question, analysis, topK] of cases) {
    const chunks = await searchKnowledge(question, analysis, topK);
    const text = promptText(chunks);
    const steps = authoritativeProcedure(question, text);
    const file = String(chunks[0]?.sourceFile || "").split(/[/\\]/).pop();
    const spoken = steps.join(" ");
    console.log(`\n== ${id} top=${file} | ${chunks[0]?.heading || ""} steps=${steps.length}`);
    console.log("basis", /\bBasis\b/.test(spoken), "targetUser", /user or group exists/.test(spoken), "inPrompt", /user or group exists/.test(text));
    console.log("publicApp", /Maintain Business Users/.test(spoken), "privateTxn", /\/UI2\/FLPCM|PFCG/.test(spoken), "gateway", /IWFND\/ERROR_LOG|IWBEP\/ERROR_LOG/.test(spoken));
    if (steps[0]) console.log("first:", steps[0].slice(0, 180));
    if (steps.length) console.log("last:", steps[steps.length - 1].slice(0, 180));
  }
})().catch((error) => { console.error(error); process.exit(1); });
