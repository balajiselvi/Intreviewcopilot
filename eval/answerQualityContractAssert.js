const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { register } = require("node:module");
const { selectVerifiedWorkflow } = require("../lib/verifiedWorkflow.js");
const {
  evaluateAnswerQuality,
  classifyQuestionType,
  QUESTION_TYPES
} = require("./lib/answerQualityContract.js");

(async () => {
  await register(pathToFileURL(path.join(__dirname, "lib/extlessResolveHook.mjs")).href);
  const { fitSpokenLength } = await import("../lib/procedureRetention.js");

  assert.equal(
    classifyQuestionType("A Firefighter user cannot launch an approved emergency session. What do you validate?"),
    QUESTION_TYPES.TROUBLESHOOTING
  );
  assert.equal(
    classifyQuestionType("How would you build roles in IAG?"),
    QUESTION_TYPES.IMPLEMENTATION
  );

  const firefighterTrouble = selectVerifiedWorkflow(
    "A Firefighter user cannot launch an approved emergency session. What do you validate?"
  );
  assert.ok(firefighterTrouble);
  assert.equal(firefighterTrouble.workflowId, "grc-firefighter-launch-troubleshooting");
  assert.match(firefighterTrouble.answer, /assignment|repository sync|GRAC_SPM/i);
  assert.doesNotMatch(firefighterTrouble.answer, /^Create the firefighter ID on the target system/i);

  const firefighterSetup = selectVerifiedWorkflow("How do you configure Firefighter emergency access in SAP GRC?");
  assert.ok(firefighterSetup);
  assert.equal(firefighterSetup.workflowId, "grc-firefighter");

  const sfTrouble = selectVerifiedWorkflow(
    "A SuccessFactors permission was granted but the action remains unavailable. What do you inspect?"
  );
  assert.equal(sfTrouble.workflowId, "sf-rbp-unavailable-troubleshooting");
  assert.match(sfTrouble.answer, /target population/i);
  assert.doesNotMatch(sfTrouble.answer, /Open Manage Permission Roles and grant the permissions/);

  const btpTrouble = selectVerifiedWorkflow(
    "A BTP role collection mapped to an IdP group does not take effect. How do you isolate trust and mapping?"
  );
  assert.equal(btpTrouble.workflowId, "btp-role-collection-mapping-troubleshooting");
  assert.match(btpTrouble.answer, /trust|group claim|sign in again/i);

  const iagSync = selectVerifiedWorkflow("How do you troubleshoot failed IAG access analysis or synchronization?");
  assert.equal(iagSync.workflowId, "iag-analysis-sync-troubleshooting");
  assert.match(iagSync.answer, /Rule Setup|sync job|RequestTypeRule|MSMP/i);

  const pcTrouble = selectVerifiedWorkflow(
    "An automated control test produces an unexpected result. How do you isolate the cause?"
  );
  assert.equal(pcTrouble.workflowId, "process-control-test-troubleshooting");
  assert.match(pcTrouble.answer, /Planner|Manual Test Plans|connector/i);
  assert.match(pcTrouble.answer, /Do not diagnose a Process Control test with AGR_USERS/i);

  const iagRoles = selectVerifiedWorkflow("How would you build roles in IAG?");
  assert.equal(iagRoles.workflowId, "iag-role-design");
  const conciseIag = fitSpokenLength(iagRoles.answer, "concise", "How would you build roles in IAG?");
  assert.match(conciseIag, /Role Designer/i);
  assert.match(conciseIag, /application-access|Assignment Approver|Content Approver|PFCG/i);

  const analysis = selectVerifiedWorkflow("How do you configure IAG Access Analysis?");
  assert.equal(analysis.workflowId, "iag-analysis-ruleset");
  const analysisText = analysis.answer.toLowerCase();
  const dup = "then run access analysis and confirm the expected functions and risks";
  const first = analysisText.indexOf(dup);
  const second = analysisText.indexOf(dup, first + 1);
  assert.ok(first >= 0, "analysis answer should mention run Access Analysis");
  assert.equal(second, -1, "analysis answer must not duplicate the run Access Analysis sentence");

  const good = evaluateAnswerQuality({
    question: "How would you build roles in IAG?",
    answer: iagRoles.answer,
    expectedProduct: "IAG",
    requiredPoints: [/Role Designer/i, /PFCG/i],
    forbiddenClaims: [/Maintain MSMP Workflows/i],
    route: "VERIFIED_WORKFLOW",
    sourceFiles: iagRoles.sourceFiles || []
  });
  assert.equal(good.pass, true, JSON.stringify(good.findings));

  const badSetup = evaluateAnswerQuality({
    question: "A Firefighter user cannot launch an approved emergency session. What do you validate?",
    answer: "Create the firefighter ID on the target system. Assign the firefighter role and the owner on that ID.",
    forbiddenClaims: []
  });
  assert.equal(badSetup.pass, false);
  assert.ok(badSetup.findings.some((f) => f.code === "SETUP_FOR_TROUBLESHOOT"));

  const activateSecurity = selectVerifiedWorkflow(
    "How would you plan the SAP security workstream across Activate Explore, Realize, and Deploy?"
  );
  assert.equal(activateSecurity.workflowId, "activate-security-workstream");
  assert.match(activateSecurity.answer, /Explore/i);
  assert.match(activateSecurity.answer, /Realize/i);
  assert.match(activateSecurity.answer, /Deploy/i);
  assert.doesNotMatch(activateSecurity.answer, /In Discover, confirm the business case/);

  const activateCutover = selectVerifiedWorkflow(
    "A Deploy cutover rehearsal fails on identity dependencies. How do you replan the go-live gate?"
  );
  assert.equal(activateCutover.workflowId, "activate-cutover-dependency-recovery");

  const brmLife = selectVerifiedWorkflow("How would you design a governed business role lifecycle in SAP GRC BRM?");
  assert.equal(brmLife.workflowId, "brm-business-role-lifecycle");
  assert.match(brmLife.answer, /technical-role mapping|business role/i);

  const brmStale = selectVerifiedWorkflow(
    "A business role change is approved in BRM but the technical role is stale. How do you isolate ownership?"
  );
  assert.equal(brmStale.workflowId, "brm-stale-technical-mapping-troubleshooting");
  assert.doesNotMatch(brmStale.answer, /Authorization Sync hasn't run/);

  const armE2e = selectVerifiedWorkflow(
    "How do you design an SAP Access Control access request from submission through target provisioning?"
  );
  assert.equal(armE2e.workflowId, "arm-request-to-provision");
  assert.match(armE2e.answer, /MSMP|BRF\+|risk simulation/i);

  const hanaDesign = selectVerifiedWorkflow(
    "How would you design least-privilege HANA analytic privileges for a reporting role?"
  );
  assert.equal(hanaDesign.workflowId, "hana-analytic-privilege-design");
  assert.match(hanaDesign.answer, /analytic privilege/i);
  assert.match(hanaDesign.answer, /not BW analysis authorizations/i);

  const publicPrivate = selectVerifiedWorkflow(
    "How do Public Edition business roles differ from Private Edition PFCG roles?"
  );
  assert.equal(publicPrivate.workflowId, "s4-public-vs-private-roles");
  assert.match(publicPrivate.answer, /Public Edition/i);
  assert.match(publicPrivate.answer, /PFCG/i);
  assert.match(publicPrivate.answer, /Maintain Business Roles/i);
  assert.doesNotMatch(publicPrivate.answer, /I build IAG business roles in Role Designer|Role Designer/);

  assert.equal(
    selectVerifiedWorkflow("How would you baseline SoD risks for a new role set before provisioning?"),
    null
  );
  assert.equal(
    selectVerifiedWorkflow("How do you configure an MSMP workflow for access requests?"),
    null
  );
  assert.equal(
    selectVerifiedWorkflow(
      "How do you design an SAP Access Control access request from submission through target provisioning?"
    )?.workflowId,
    "arm-request-to-provision"
  );

  console.log("answerQualityContractAssert: PASS");
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
