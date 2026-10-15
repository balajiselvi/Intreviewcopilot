const assert = require("node:assert/strict");
const { computeArtifactBoost } = require("../services/vectorSearch");
const { deliveryProcedureAdjustment, namedSourceAdjustment } = require("../services/sectionHeading.js");

const pfcgChunk = "Assign the catalog in PFCG and trace with STAUTHTRACE.";
const publicChunk = "On SAP S/4HANA Cloud Public Edition, use Maintain Business Roles. PFCG is not this path.";
const msmpChunk = "Maintain the MSMP workflow and the BRF rule.";

assert.strictEqual(
  computeArtifactBoost(pfcgChunk, "Fiori", [], "A Public Edition user cannot see a Fiori app."),
  0
);
assert.ok(
  computeArtifactBoost(publicChunk, "Fiori", [], "A Public Edition user cannot see a Fiori app.") > 0
);
assert.ok(
  computeArtifactBoost(pfcgChunk, "Authorization", [], "The SU53 trace shows a missing PFCG authorization.") > 0
);
assert.strictEqual(
  computeArtifactBoost(msmpChunk, "Troubleshooting", [], "Connect ECC for Access Control risk analysis."),
  0
);
assert.ok(
  computeArtifactBoost(msmpChunk, "Troubleshooting", [], "How do you maintain the MSMP workflow?") > 0
);

const investigation = { category: "Troubleshooting", primaryIntent: "Troubleshooting" };
assert.ok(
  deliveryProcedureAdjustment("How would you investigate this diagnostic failure?", { heading: "Diagnostic Split" }, investigation)
    > deliveryProcedureAdjustment("How would you investigate this diagnostic failure?", { heading: "90 Second Interview Answer" }, investigation),
  "investigation retrieval should prefer diagnostic sections over sample-answer prose"
);
assert.strictEqual(
  deliveryProcedureAdjustment("What is a diagnostic trace?", { heading: "Troubleshooting" }, { category: "Definition" }),
  0,
  "concept questions must not receive an investigation-only section boost"
);
assert.ok(
  deliveryProcedureAdjustment(
    "In SAP Access Control, a submitted request has no approver. What evidence would you inspect to isolate MSMP versus BRFplus?",
    { heading: "No Approver MSMP BRFplus" },
    { category: "Workflow", primaryIntent: "Workflow" }
  ) > deliveryProcedureAdjustment(
    "In SAP Access Control, a submitted request has no approver. What evidence would you inspect to isolate MSMP versus BRFplus?",
    { heading: "90 Second Interview Answer" },
    { category: "Workflow", primaryIntent: "Workflow" }
  ),
  "symptom-and-evidence investigations should rank procedure sections above generic interview-answer prose"
);
const missingAppQuestion = "In S/4HANA Cloud Public Edition, how would you troubleshoot a user who cannot see a Fiori app?";
assert.ok(
  deliveryProcedureAdjustment(missingAppQuestion, { heading: "Public Edition troubleshooting: app is missing" }, investigation)
    > deliveryProcedureAdjustment(missingAppQuestion, { heading: "Troubleshooting: Fiori app opens but a request fails" }, investigation),
  "a missing-app question must rank absence procedures above opened-app runtime failures"
);
assert.ok(
  deliveryProcedureAdjustment("The Fiori app opens but its OData request returns HTTP 403. What should I inspect?", {
    heading: "Troubleshooting: Fiori app opens but a request fails"
  }, investigation) > deliveryProcedureAdjustment("The Fiori app opens but its OData request returns HTTP 403. What should I inspect?", {
    heading: "Public Edition troubleshooting: app is missing"
  }, investigation),
  "an opened-app failure must rank runtime diagnostics above missing-app procedures"
);
assert.ok(
  namedSourceAdjustment("An Identity Provisioning job has failed entities and missing target accounts.", {
    sourceFolder: "btp",
    sourceFile: "ips.md"
  }) > namedSourceAdjustment("An Identity Provisioning job has failed entities and missing target accounts.", {
    sourceFolder: "btp",
    sourceFile: "cloud-identity.md"
  }),
  "the full product name must rank its own IPS procedure above broad identity troubleshooting"
);

console.log("retrievalScoreAssert: PASS");
