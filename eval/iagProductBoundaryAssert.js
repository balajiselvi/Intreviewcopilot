const assert = require("node:assert/strict");
const { resolveInterviewContext, explicitProductTopics, resolveProductScope } = require("../lib/interviewContext.js");
const { productKnowledgeFolders } = require("../lib/productKnowledgeScope.js");
const { selectVerifiedWorkflow } = require("../lib/verifiedWorkflow.js");

const cases = [
  { q: "How would you build roles in IAG?", topic: "IAG", workflow: "iag-role-design" },
  { q: "How would you maintain business-role approvers in IAG?", topic: "IAG", workflow: "iag-role-owner" },
  { q: "How would you analyse access risk in IAG?", topic: "IAG", workflow: "iag-analysis-ruleset" },
  { q: "How would you configure governed access requests in IAG?", topic: "IAG", workflow: "iag-workflow-determination" },
  { q: "How would you run periodic access reviews in IAG?", topic: "IAG", workflow: "iag-certification-review" },
  { q: "How would you handle emergency or privileged access through IAG?", topic: "IAG", workflow: "iag-pam-setup" },
  { q: "How would you configure MSMP and BRF+ for SAP GRC Access Control?", topic: "GRC", workflow: null, folders: ["grc"] },
  { q: "How do you build an authorization role in classic SAP ECC using PFCG?", topic: "ECC", workflow: null, folders: ["security", "grc"] },
  { q: "How does the IAG Bridge interact with SAP Access Control?", topic: "IAG", workflow: "iag-access-control-bridge", folders: ["iag", "grc"] },
  { q: "How would you configure IAG?", topic: "IAG", workflow: "iag-general-implementation" },
  { q: "What are the main steps to implement SAP Cloud Identity Access Governance?", topic: "IAG", workflow: "iag-general-implementation" },
  { q: "How do you configure IAG Access Analysis?", topic: "IAG", workflow: "iag-analysis-ruleset" },
  { q: "How would you set up access requests in IAG?", topic: "IAG", workflow: "iag-workflow-determination" },
  { q: "How do you configure access certification in IAG?", topic: "IAG", workflow: "iag-certification-review" },
  { q: "How would you implement emergency or privileged access with IAG?", topic: "IAG", workflow: "iag-pam-setup" },
  { q: "How do you configure IAG role design?", topic: "IAG", workflow: "iag-role-design" },
  { q: "How do you integrate IAG with SAP Access Control 12.0 on-premise?", topic: "IAG", workflow: "iag-access-control-bridge", folders: ["iag", "grc"] },
  { q: "How do you troubleshoot failed IAG access analysis or synchronization?", topic: "IAG", workflow: "iag-analysis-sync-troubleshooting", scope: "STAGE_INVESTIGATION" },
  { q: "In the connected on-premise GRC system, how do you troubleshoot an MSMP request with no approver?", topic: "GRC", workflow: null, scope: "STAGE_INVESTIGATION", folders: ["grc"] },
  { q: "How do I configure BRF+ agent determination in MSMP?", topic: "GRC", workflow: null, folders: ["grc"] },
  { q: "How do I configure the approval path in SAP Access Control 12.0?", topic: "GRC", workflow: null, folders: ["grc"] },
  { q: "A connected IAG tenant cannot synchronize access data from its target. How would you diagnose it?", topic: "IAG", workflow: "iag-analysis-sync-troubleshooting", scope: "STAGE_INVESTIGATION" },
  { q: "What would you validate before enabling IAG Access Request for a new target?", topic: "IAG", workflow: "iag-general-implementation" }
];

const forbiddenGenericIag = /SAP_GRAC_ACCESS_REQUEST|Approvers of Selected Path|BRF\+ decision table|MSMP agent rule/i;
for (const item of cases) {
  const context = resolveInterviewContext({ questionRaw: item.q, history: [] });
  assert.equal(context.questionTopic, item.topic, `${item.q}: product resolution`);
  assert.equal(resolveProductScope(context.questionTopic)?.category, item.topic, `${item.q}: product scope`);
  if (item.scope) assert.equal(context.answerScope, item.scope, `${item.q}: task scope`);
  const folders = productKnowledgeFolders(item.q);
  for (const folder of item.folders || [item.topic === "IAG" ? "iag" : "grc"]) {
    assert.ok(folders.includes(folder), `${item.q}: expected ${folder} in ${folders}`);
  }
  const workflow = selectVerifiedWorkflow(item.q);
  assert.equal(workflow?.id || null, item.workflow, `${item.q}: verified answer path`);
  if (item.workflow === "iag-role-design") {
    assert.equal(workflow.product, "IAG");
    assert.equal(workflow.task, "Role Design");
    assert.deepEqual(workflow.sourceFiles, ["knowledge/iag/iag-rules-and-roles.md", "knowledge/iag/iag-implementation.md"]);
    assert.match(workflow.answer, /^I build IAG business roles in Role Designer, Business Roles/);
    assert.match(workflow.answer, /Assignment Approver and Content Approver/);
    assert.match(workflow.answer, /release-dependent/);
    assert.doesNotMatch(workflow.answer, /SAP_GRAC_ACCESS_REQUEST|Approvers of Selected Path|BRF\+ decision table/);
    assert.doesNotMatch(workflow.answer, /Access Analysis for risk evaluation.*Certification Review/);
  }
  if (item.workflow === "iag-role-owner") {
    assert.equal(workflow.task, "Role Designer");
    assert.deepEqual(workflow.sourceFiles, ["knowledge/iag/iag-rules-and-roles.md"]);
    assert.match(workflow.answer, /Assignment Approver and a Content Approver/);
    assert.doesNotMatch(workflow.answer, /IAG_WF_MANAGER/);
  }
  if (item.q === cases[0].q) assert.doesNotMatch(workflow.answer, forbiddenGenericIag, "generic IAG implementation must not speak the GRC MSMP procedure");
  if (item.workflow === "iag-access-control-bridge") assert.match(workflow.answer, /backend|Access Control|MSMP/i);
}

const crossProduct = explicitProductTopics("How do you integrate IAG with SAP Access Control 12.0 on-premise?");
assert.deepEqual(crossProduct, ["IAG", "GRC"]);
console.log(`iagProductBoundaryAssert: PASS (${cases.length} route and product-boundary cases)`);
