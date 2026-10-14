/**
 * IAG technical accuracy. Checks the knowledge the model is allowed to use.
 * It does not call a model and it does not score by a single keyword.
 * node eval/iagInterviewAccuracyBattery.js
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { admitQuestion } = require("../lib/questionAdmission.js");

const root = path.join(__dirname, "..");
const access = fs.readFileSync(path.join(root, "knowledge/iag/iag-access-request.md"), "utf8");
const pam = fs.readFileSync(path.join(root, "knowledge/iag/iag-pam.md"), "utf8");
const rules = fs.readFileSync(path.join(root, "knowledge/iag/iag-rules-and-roles.md"), "utf8");
const prompt = fs.readFileSync(path.join(root, "lib/prompt/interviewPrompt.js"), "utf8");
const verified = fs.readFileSync(path.join(root, "lib/verifiedWorkflow.js"), "utf8");

function must(text, pattern, label) {
  assert.match(text, pattern, label);
}
function mustNot(text, pattern, label) {
  assert.doesNotMatch(text, pattern, label);
}

const cases = [
  {
    id: "workflow",
    source: access,
    present: [/IAGWorkflowBusinessRule/, /RequestTypeRule/, /Administration > Configuration > Business Rule > Launch/]
  },
  {
    id: "template",
    source: access,
    present: [/stage sequence/, /managerrolesecuritypath/]
  },
  {
    id: "ruleset",
    source: rules,
    present: [/GRC-IAG-AA/, /risk-definition sync/, /Rule Setup/]
  },
  {
    id: "policy",
    source: access,
    present: [/not a PFCG authorization object/, /which systems, roles, users/, /Authorization Policy/, /not RequestTypeRule/]
  },
  {
    id: "search-trigger",
    source: access,
    present: [/Search is the lookup/, /Trigger is what starts work/, /SCI User Group Sync Job/]
  },
  {
    id: "pam-setup",
    source: pam,
    present: [/Reason Code app/, /Maintain Privileged Access/, /job category Provisioning/, /no IAG object called a Network Access Node/]
  },
  {
    id: "pam-id",
    source: pam,
    present: [/Business Roles/, /SIAG_PAM_LAUNCH_PAD/, /S\/4HANA on-premise and SAP ERP/, /Privileged Access Log Sync Job/, /not creating a PAM ID/]
  },
  {
    id: "pam-vs-grc",
    source: pam,
    present: [/Provisioning job pushes it to the target/, /synchronized up into GRC EAM/]
  },
  {
    id: "owners",
    source: pam,
    present: [/IAG_WF_MANAGER/, /no IAG object called contours/]
  },
  {
    id: "role-owner",
    source: rules,
    present: [/Assignment Approver/, /Content Approver/, /Role Designer/]
  },
  {
    id: "requestor",
    source: access,
    present: [/SCI User Group Sync Job/, /IAG_WF_MANAGER/, /not creating the user in IPS/]
  }
];

for (const item of cases) {
  for (const pattern of item.present) must(item.source, pattern, item.id);
}

must(verified, /IAGWorkflowBusinessRule/, "verified workflow names the workflow project");
must(verified, /not an IPS user/, "verified workflow keeps PAM off IPS");
mustNot(prompt, /RequestTypeRule/, "universal IAG template does not inject the workflow table");
mustNot(prompt, /An IPS SCIM job writes the approved access/, "prompt no longer assigns provisioning to IPS");

const answerable = [
  "How do you configure the IAG workflow?",
  "Walk me through the business rules that pick an IAG workflow path.",
  "What is a workflow template in IAG?",
  "Which stages does an IAG access request template run?",
  "How do you upload or update a ruleset in IAG?",
  "How does cloud ruleset content get into IAG?",
  "What does authorization policy mean in IAG Access Request?",
  "What limits the systems a requestor can search in IAG?",
  "Explain search and trigger in IAG.",
  "What is the difference between searching for access and triggering a job in IAG?",
  "How do you set up privileged access in IAG?",
  "What do you configure before a PAM ID can be used?",
  "How do you create a PAM ID for a team in IAG?",
  "How is an IAG PAM ID provisioned to the target?",
  "How is an IAG PAM ID created compared with a GRC firefighter ID?",
  "Where is a firefighter ID created in classic GRC versus IAG?",
  "Who are the PAM owners and controllers in IAG?",
  "How do approvers get assigned on a privileged access ID?",
  "How does role owner mapping work in IAG?",
  "What is the difference between assignment approver and content approver?",
  "How do you allow a user to raise an access request in IAG?",
  "What must be in place before a user submits an IAG access request?"
];

for (const question of answerable) {
  const result = admitQuestion(question);
  assert.strictEqual(result.decision, "ANSWER", question);
}

const incoherent = [
  "the the in",
  "Mm-hmm",
  "OK so"
];
for (const question of incoherent) {
  const result = admitQuestion(question);
  assert.notStrictEqual(result.decision, "ANSWER", question);
}

const chat = fs.readFileSync(path.join(root, "pages/api/chat.js"), "utf8");
assert.ok(!chat.includes("How do you configure the IAG workflow?"), "no canned question route");

console.log(`iagInterviewAccuracyBattery: ${cases.length} knowledge cases, ${answerable.length} admitted questions`);
