const assert = require("assert");
const fs = require("fs");
const path = require("path");

const rp = fs.readFileSync(path.join(__dirname, "../lib/reasoningPlanner.js"), "utf8");
const tr = fs.readFileSync(path.join(__dirname, "../lib/technicalReasoner.js"), "utf8");
const chat = fs.readFileSync(path.join(__dirname, "../pages/api/chat.js"), "utf8");
const prompt = fs.readFileSync(path.join(__dirname, "../lib/prompt/interviewPrompt.js"), "utf8");

assert.match(rp, /Do not walk Source/);
assert.match(rp, /removal of obsolete access/);
assert.match(tr, /does not host PFCG roles/);
assert.match(tr, /SU53 explains one failed check/);
assert.match(tr, /SU24 is proposal data/);
assert.match(tr, /never expand DCL/);
assert.match(rp, /do not invent a recent ticket/);
assert.match(rp, /Do not narrate a specific SoD finding/);
assert.match(tr, /secondaryCategories/);
assert.match(chat, /reasoningMode === "resolve"/);
assert.match(prompt, /Boundary: \$\{technicalReasoning\.governanceConsideration\}/);
assert.match(prompt, /it is not hypercare monitoring or cutover proof/);
assert.doesNotMatch(prompt, /Monitoring Tools \(ST03\/SM21\/SU53\)/);
assert.match(tr, /Ariba groups\/permissions enforce/);
assert.match(tr, /never say SAP owns or operates (?:the )?Cloud Connector/);
assert.match(prompt, /DOCUMENTED EXPERIENCE MATCH/);
assert.match(chat, /recallGroundedExperience/);
assert.doesNotMatch(chat, /[^d]recallExperience\(/);
assert.match(chat, /answerScope === "IMPLEMENTATION_WALKTHROUGH"/);
assert.match(chat, /!procedureQuestion/);
assert.match(chat, /selectVerifiedWorkflow/);
assert.match(chat, /VERIFIED_WORKFLOW/);
assert.match(chat, /recallExpectedAnswer/);
assert.match(prompt, /PREPARED ANSWER/);
assert.match(chat, /DEFAULT_CAREER_BACKGROUND/);
assert.match(prompt, /IDM 8.0 Developer Studio/);
assert.match(prompt, /Dover/);
assert.match(prompt, /Five tiers/);
assert.match(prompt, /Datasphere: spaces/);
assert.match(prompt, /Omit this section unless/);
assert.match(prompt, /never say SAP owns or operates (?:the )?Cloud Connector/i);
assert.match(prompt, /ACTIVE DOMAIN SCOPE/);
assert.match(prompt, /MASTER HANDS-ON BANK/);
assert.match(fs.readFileSync(path.join(__dirname, "../eval/lib/expertiseCards.js"), "utf8"), /CLAIM CLASSES/);
assert.match(prompt, /1,650 PFCG/);
assert.match(rp, /AGR_USERS, AGR_1251, last logon/);
assert.match(rp, /not a requirements workshop/);
assert.match(rp, /verifiable artifact/);
assert.match(rp, /Do not invent GUI button labels/);
assert.match(prompt, /logged emergency access/);
assert.match(prompt, /MODE_STRUCTURES/);
assert.match(prompt, /design: "Structure: The gap this design must close/);
assert.match(prompt, /getMechanismLock/);
assert.match(prompt, /CEF or Syslog/);
assert.match(prompt, /SU01 user master/);
assert.match(prompt, /generic P1, rollback/);
assert.match(prompt, /evolution essay, a SOC process/);
assert.match(rp, /SM19\/SM20/);
assert.match(prompt, /CATEGORY_TEMPLATES\[category\] \|\| CATEGORY_TEMPLATES.General/);
assert.doesNotMatch(prompt, /compare" && documentedExperience/);
assert.match(rp, /enforcement artifact and assignment path/);
assert.match(rp, /S_SERVICE\/S_START/);
assert.match(prompt, /S_SERVICE\/S_START/);
assert.match(prompt, /Proxy IdP/);
assert.match(prompt, /SCIM source-to-target/);
assert.match(rp, /not an SAP Security\/GRC configuration question/);
assert.match(chat, /ENFORCEMENT_LANDSCAPES/);
assert.match(prompt, /plane-correct technical dependencies/);
assert.match(prompt, /Do not bolt SAP T-codes/);

const { recallExperience, recallGroundedExperience, fieldConflictsWithCv } = require("./lib/expertiseCards.js");
const { selectVerifiedWorkflow } = require("../lib/verifiedWorkflow.js");

const staleQuestion = "How did you use Power Query across 10,000 user records during role rationalization?";
const rawRecall = recallExperience(staleQuestion);
assert.ok(rawRecall.strongest, "raw recall still finds a card");
assert.ok(
  fieldConflictsWithCv(rawRecall.strongest.spoken) || fieldConflictsWithCv(rawRecall.strongest.result),
  "the unfiltered card for this question conflicts with the CV"
);
const grounded = recallGroundedExperience(staleQuestion);
if (grounded) {
  assert.ok(!fieldConflictsWithCv(grounded.spoken) && !fieldConflictsWithCv(grounded.result));
  assert.notStrictEqual(grounded.id, rawRecall.strongest.id);
}

const ruleset = selectVerifiedWorkflow("How do you upload or update a ruleset in IAG?");
assert.strictEqual(ruleset.workflowId, "iag-analysis-ruleset");
assert.match(ruleset.answer, /Rule Setup/);
assert.match(ruleset.answer, /Upload & Process/);
assert.match(ruleset.answer, /Processing Log and Validation Log/);
assert.doesNotMatch(ruleset.answer, /Which of those do you want\?|open Ruleset Management|click Upload Ruleset/);
const spacedRuleset = selectVerifiedWorkflow("How do we upload the rule set in IAG?");
assert.strictEqual(spacedRuleset.workflowId, "iag-analysis-ruleset");
assert.match(spacedRuleset.answer, /Upload & Process/);

const policy = selectVerifiedWorkflow("What does authorization policy mean in IAG Access Request?");
assert.strictEqual(policy.workflowId, "iag-request-policy");
assert.match(policy.answer, /search/);
assert.doesNotMatch(policy.answer, /RequestTypeRule/);

const iagWorkflow = selectVerifiedWorkflow("How do we configure the workflow in IAG Access Request?");
assert.strictEqual(iagWorkflow.workflowId, "iag-workflow-determination");
assert.match(iagWorkflow.answer, /Template Upload/);
assert.match(iagWorkflow.answer, /Maintain Workflow Template/);
assert.match(iagWorkflow.answer, /IAGWorkflowBusinessRule/);
assert.match(iagWorkflow.answer, /RequestTypeRule/);
assert.match(iagWorkflow.answer, /provisioning separately/);
assert.doesNotMatch(iagWorkflow.answer, /IAG_WF_MANAGER|SCI User Group Sync Job|managerrolesecuritypath/);

const deliveryOwners = selectVerifiedWorkflow("Two process owners disagree on SoD exception authority. How do you govern that?");
assert.equal(deliveryOwners, null);
const pamOwners = selectVerifiedWorkflow("Who are the PAM owners and controllers in IAG?");
assert.strictEqual(pamOwners.workflowId, "iag-owners");
const { recallExpectedAnswer } = require("./lib/expectedAnswers.js");
assert.notStrictEqual(recallExpectedAnswer("Design the JML model across HR, IAS, IPS and the target apps.")?.id, "ias-ips");
assert.strictEqual(recallExpectedAnswer("What is the difference between IAS and IPS?")?.id, "ias-ips");
const { cardCoversAskedWork } = require("./lib/expertiseCards.js");
assert.equal(cardCoversAskedWork(recallGroundedExperience("Where did you implement IAG access analysis?"), "Where did you implement IAG access analysis?"), false);

const experienceProcedure = selectVerifiedWorkflow("Have you set up privileged access in IAG?");
assert.strictEqual(experienceProcedure.experienceAsk, true);
assert.strictEqual(experienceProcedure.workflowId, "iag-pam-setup");
const experienceCard = recallGroundedExperience("Have you set up privileged access in IAG?");
assert.match(experienceCard.spoken, /not an IAG PAM ID/);
assert.doesNotMatch(experienceCard.spoken, /I implemented privileged access management in IAG/);

console.log("phase5 source contract assertions: PASS");
