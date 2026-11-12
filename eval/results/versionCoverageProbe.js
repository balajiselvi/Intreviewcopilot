/**
 * Local retrieval probe for the version-aware coverage audit.
 * node eval/results/versionCoverageProbe.js
 */
const { searchKnowledge } = require("../../services/vectorSearch");

const cases = [
  ["grc-version", "What is the difference between SAP Access Control 10.1 and Access Control 12.0?", "Comparison", 4, /GRCFND_A V1200|Release names/],
  ["msmp-maintain", "How do you open MSMP workflow maintenance for SAP Access Control?", "Workflow", 3, /GRFNMW_CONFIGURE/],
  ["msmp-stuck", "An approval request is stuck in SAP Access Control. How do you find the stage that did not resolve?", "Workflow", 3, /stage|BRF/i],
  ["fiori-editions", "How is a Fiori space assigned on S/4HANA Cloud Public Edition, and how is that different from Private Edition?", "Architecture", 3, /FLPCM_CUST|Manage Launchpad Spaces/],
  ["fiori-trace", "The user can see a Fiori tile but the app fails an authorization check. What do you trace?", "Fiori", 3, /STAUTHTRACE|Display Authorization Trace/],
  ["btp-collection", "How do you create a role collection on SAP BTP?", "BTP", 3, /role collection/i],
  ["ias-reach", "A user signs in through IAS but cannot reach the BTP application. What do you check first?", "BTP", 3, /trust|role collection|IAS/i],
  ["ias-ips", "How does Identity Provisioning differ from Identity Authentication?", "IPS", 3, /provision|authenticat/i],
  ["sac-rows", "How do you restrict rows in an SAP Analytics Cloud model?", "SAC", 3, /Data Access Control|Model Data Privacy/],
  ["ds-rows", "A Datasphere view is shared to SAC but the story still shows all rows. Where is the row restriction missing?", "Datasphere", 3, /data access control|space/i],
  ["hana-roles", "How do you separate a catalog role from a repository role in SAP HANA?", "HANA", 3, /catalog role|repository/i],
  ["idm-iag", "What is the difference between SAP IDM and SAP IAG?", "IAG", 3, /Identity Management|on-premise/i],
  ["pmp-scope", "How do you handle scope creep when a steering committee adds requirements after design sign-off?", "PMP", 3, /scope|change control|steering/i],
  ["sf-rbp", "How do you configure role-based permissions in SuccessFactors Employee Central?", "SuccessFactors", 3, /permission|RBP|Employee Central/i],
  ["ariba-pr", "How do you troubleshoot an Ariba user who can log in but cannot create a purchase requisition?", "Ariba", 3, /group|permission|realm/i],
  ["bw-aa", "How does BW/4HANA analysis authorization differ from an S/4 PFCG role?", "Architecture", 3, /RSECADMIN|analysis authorization/i],
  ["bw-only", "A BW query runs but returns no rows for one user. How do you isolate analysis authorization?", "BW", 3, /RSECADMIN|0TCAIPROV/],
  ["rise-hybrid", "How would you design identity for a hybrid RISE landscape?", "RISE", 3, /Hybrid identity|PFCG maintains/]
];

(async () => {
  for (const [id, question, category, topK, expect] of cases) {
    const rows = await searchKnowledge(question, { category, secondaryCategories: [] }, topK);
    const top = rows.map((row, index) => `${index + 1}:${row.heading || "?"}@${Number(row.score || 0).toFixed(3)}:${row.sourceFile}`).join(" | ");
    const joined = rows.map((row) => `${row.heading}\n${row.content}`).join("\n");
    const hit = expect.test(joined);
    const bad = /GRFNMW_CONFIGURE_WORKFLOW/.test(joined);
    console.log(`${hit ? "HIT" : "MISS"}${bad ? " BADTCODE" : ""} ${id} cat=${category} k=${topK} ${top}`);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
