const assert = require("node:assert/strict");
const { resolveInterviewContext, explicitProductTopics, resolveProductScope } = require("../lib/interviewContext.js");
const { productKnowledgeFolders, selectProductScopedChunks } = require("../lib/productKnowledgeScope.js");
const { selectVerifiedWorkflow } = require("../lib/verifiedWorkflow.js");
const { decideInterviewTurn } = require("../lib/turnDecision.js");
const { retrieveCandidatesStage } = require("../services/retrievalService.js");

const cases = [
  { q: "How would you build roles in IAG?", topic: "IAG", workflow: "iag-role-design" },
  { q: "How would you maintain business-role approvers in IAG?", topic: "IAG", workflow: "iag-role-owner" },
  { q: "How would you analyse access risk in IAG?", topic: "IAG", workflow: "iag-analysis-ruleset" },
  { q: "How would you configure governed access requests in IAG?", topic: "IAG", workflow: "iag-workflow-determination" },
  { q: "How would you run periodic access reviews in IAG?", topic: "IAG", workflow: "iag-certification-review" },
  { q: "How would you handle emergency or privileged access through IAG?", topic: "IAG", workflow: "iag-pam-setup" },
  { q: "How would you configure MSMP and BRF+ for SAP GRC Access Control?", topic: "GRC", workflow: "grc-msmp-access-request-config", folders: ["grc"] },
  { q: "How do you build an authorization role in classic SAP ECC using PFCG?", topic: "ECC", workflow: null, folders: ["security", "grc"] },
  { q: "How does the IAG Bridge interact with SAP Access Control?", topic: "IAG", workflow: "iag-access-control-bridge", folders: ["iag", "grc"] },
  // Broad iag-general-implementation canned stub removed — these fall through to the LLM.
  { q: "How would you configure IAG?", topic: "IAG", workflow: null },
  { q: "What are the main steps to implement SAP Cloud Identity Access Governance?", topic: "IAG", workflow: null },
  // Conceptual overview asks must fall through; the broad IAG implementation workflow is a procedural mismatch.
  { q: "Explain IAG?", topic: "IAG", workflow: null },
  { q: "Explain SAP Cloud IAG?", topic: "IAG", workflow: null },
  { q: "What is IAG?", topic: "IAG", workflow: null },
  { q: "How do you configure IAG Access Analysis?", topic: "IAG", workflow: "iag-analysis-ruleset" },
  { q: "How would you set up access requests in IAG?", topic: "IAG", workflow: "iag-workflow-determination" },
  { q: "How do you configure access certification in IAG?", topic: "IAG", workflow: "iag-certification-review" },
  { q: "How would you implement emergency or privileged access with IAG?", topic: "IAG", workflow: "iag-pam-setup" },
  { q: "How do you configure IAG role design?", topic: "IAG", workflow: "iag-role-design" },
  { q: "How do you integrate IAG with SAP Access Control 12.0 on-premise?", topic: "IAG", workflow: "iag-access-control-bridge", folders: ["iag", "grc"] },
  { q: "How do you troubleshoot failed IAG access analysis or synchronization?", topic: "IAG", workflow: "iag-analysis-sync-troubleshooting", scope: "STAGE_INVESTIGATION" },
  { q: "In the connected on-premise GRC system, how do you troubleshoot an MSMP request with no approver?", topic: "GRC", workflow: "grc-msmp-stuck-troubleshoot", scope: "STAGE_INVESTIGATION", folders: ["grc"] },
  { q: "How do I configure BRF+ agent determination in MSMP?", topic: "GRC", workflow: "grc-brf-msmp-agent-rule-config", folders: ["grc"] },
  { q: "How do I configure the approval path in SAP Access Control 12.0?", topic: "GRC", workflow: "grc-msmp-access-request-config", folders: ["grc"] },
  { q: "How do you configure ARA risk rules and MSMP workflow together in SAP Access Control 12.0?", topic: "GRC", workflow: "grc-ac12-ara-msmp-config", folders: ["grc"] },
  { q: "What is the role of SAP IAS (Identity Authentication) and IPS (Identity Provisioning) when deploying SAP Cloud SAP Cloud IAG?", topic: "IAS", workflow: null, route: "GENERATION", folders: ["btp", "cloud", "iag"], notFolders: ["idm"] },
  { q: "How would you design HR-driven joiner provisioning in SAP IPS?", topic: "IPS", workflow: "ips-jml-hr-provisioning", folders: ["btp", "cloud"] },
  { q: "How would you use SAP IPS for joiner, mover, and leaver provisioning from SuccessFactors Employee Central?", topic: "IPS", workflow: "ips-jml-hr-provisioning", folders: ["btp", "cloud", "successfactors"] },
  { q: "How do you implement SAP SuccessFactors-driven JML provisioning to target systems using IPS?", topic: "SuccessFactors", workflow: "ips-jml-hr-provisioning", folders: ["successfactors", "btp", "cloud"] },
  { q: "An IPS job ended with failed entities and target accounts are missing. How would you technically triage it?", topic: "IPS", workflow: null, route: "GENERATION", folders: ["btp", "cloud"] },
  { q: "How do you troubleshoot SAP IDM provisioning failures when target accounts are not created?", topic: "SAP IDM", workflow: null, route: "GENERATION", folders: ["idm"] },
  { q: "A connected IAG tenant cannot synchronize access data from its target. How would you diagnose it?", topic: "IAG", workflow: "iag-analysis-sync-troubleshooting", scope: "STAGE_INVESTIGATION" },
  { q: "What would you validate before enabling IAG Access Request for a new target?", topic: "IAG", workflow: null }
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
  for (const folder of item.notFolders || []) {
    assert.ok(!folders.includes(folder), `${item.q}: unexpected ${folder} in ${folders}`);
  }
  const workflow = selectVerifiedWorkflow(item.q);
  assert.equal(workflow?.id || null, item.workflow, `${item.q}: verified answer path`);
  if (item.route) {
    const turn = decideInterviewTurn({ question: item.q, history: [] });
    assert.equal(turn.route, item.route, `${item.q}: turn decision`);
  }
  if (item.workflow === "iag-role-design") {
    assert.equal(workflow.product, "IAG");
    assert.equal(workflow.task, "Role Design");
    assert.deepEqual(workflow.sourceFiles, ["knowledge/iag/iag-rules-and-roles.md", "knowledge/iag/iag-implementation.md"]);
    assert.match(workflow.answer, /Role Designer under Business Roles|I build IAG business roles in Role Designer/i);
    assert.match(workflow.answer, /Assignment Approver and Content Approver/);
    assert.match(workflow.answer, /release-dependent/);
    assert.doesNotMatch(workflow.answer, /SAP_GRAC_ACCESS_REQUEST|Approvers of Selected Path|BRF\+ decision table/);
    assert.doesNotMatch(workflow.answer, /Access Analysis for risk evaluation.*Certification Review/);
    assert.doesNotMatch(workflow.answer, /For IAG, I confirm the Cloud Foundry environment/);
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

const identityScopeCases = [
  {
    question: "What is the role of SAP IAS (Identity Authentication) and IPS (Identity Provisioning) when deploying SAP Cloud SAP Cloud IAG?",
    expected: ["btp", "cloud", "iag"]
  },
  {
    question: "How do I configure SAP Cloud Identity Services Identity Provisioning (IPS) to provision target accounts?",
    expected: ["btp", "cloud"]
  },
  { question: "How does SAP IDM (Identity Management) provision users?", expected: ["idm"] },
  { question: "How does SAP Identity Center provision accounts?", expected: ["idm"] },
  {
    question: "How does SAP IDM / Identity Center interact with SAP Cloud Identity Services IPS?",
    expected: ["idm", "btp", "cloud"]
  },
  {
    question: "How should identity provisioning work in a system?",
    expected: ["btp", "cloud"],
    forbidden: ["idm"]
  }
];

(async () => {
  const candidates = ["idm", "btp", "cloud", "iag"].map((sourceFolder) => ({
    id: `identity-scope-${sourceFolder}`,
    sourceFile: `${sourceFolder}.md`,
    sourceFolder,
    extension: ".md",
    chunkNumber: 1,
    section: "Identity provisioning procedure",
    content: `${sourceFolder} identity provisioning procedure`,
    embedding: [0.1, 0.2]
  }));
  for (const item of identityScopeCases) {
    const folders = productKnowledgeFolders(item.question);
    assert.deepEqual(folders, item.expected, `${item.question}: folder selection`);
    const retrieved = await retrieveCandidatesStage({
      provider: {
        getCandidates: async ({ metadataFilters }) => {
          assert.deepEqual(metadataFilters?.sourceFolders, folders, `${item.question}: retrieval metadata`);
          return candidates;
        }
      },
      query: { question: item.question },
      metadataFilters: { sourceFolders: folders }
    });
    const retrievedFolders = [...new Set(retrieved.map((chunk) => chunk.sourceFolder))].sort();
    assert.deepEqual(retrievedFolders, [...item.expected].sort(), `${item.question}: final retrieval scope`);
    const selectedFolders = [...new Set(selectProductScopedChunks(item.question, retrieved).map((chunk) => chunk.sourceFolder))].sort();
    assert.deepEqual(selectedFolders, [...item.expected].sort(), `${item.question}: selected retrieval scope`);
    for (const folder of item.forbidden || []) {
      assert.ok(!retrievedFolders.includes(folder), `${item.question}: retrieval included ${folder}`);
    }
  }
  console.log(`iagProductBoundaryAssert: PASS (${cases.length} route/product cases, ${identityScopeCases.length} retrieval-scope cases)`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
