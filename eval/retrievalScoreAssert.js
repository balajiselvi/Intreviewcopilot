const assert = require("node:assert/strict");
const { computeArtifactBoost } = require("../services/vectorSearch");
const { deliveryProcedureAdjustment } = require("../services/sectionHeading.js");

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

console.log("retrievalScoreAssert: PASS");
