/**
 * Fresh admission battery. Not copied from the 23 Sep capture.
 * node eval/freshAdmissionBattery.js
 */
const assert = require("assert");
const { admitQuestion } = require("../lib/questionAdmission.js");

const PRIOR = "How does the ARM approval path work?";

const VALID = [
  ["What is a derived role in PFCG?", {}],
  ["How would you remediate a false-positive SoD conflict?", {}],
  ["Walk me through an S/4HANA role design.", {}],
  ["Can you compare IAS and IPS?", {}],
  ["Where did the Cloud Connector sit in that design?", {}],
  ["Who owns the mitigating control?", {}],
  ["Have you done any GRC demo?", {}],
  ["You have experience in presales?", {}],
  ["Did you configure firefighter IDs yourself?", {}],
  ["Explain how SU24 proposals become role defaults.", {}],
  ["What changed in authorizations between ECC and S/4?", {}],
  ["How many catalog assignments sit behind a Fiori space?", {}],
  ["Would you transport a role before ARA simulation?", {}],
  ["Describe the MSMP stages you would keep.", {}],
  ["Is least privilege the same control as SoD?", {}],
  ["Tell us how you would brief a CFO on access risk.", {}],
  ["What evidence would you pull for an ITGC sample?", {}],
  ["How do you trace a failed OData call?", {}],
  ["Could you outline a JML design for a hybrid estate?", {}],
  ["Which authorization object blocks that Fiori tile?", {}],
  ["Have you any background in access certification?", {}],
  ["Do you build business roles as well as PFCG roles?", {}],
  ["What does a controller review on a firefighter log?", {}],
  ["How should hypercare hand back to the run team?", {}],
  ["Give me the decision you would take if UAT is red."],
];

const CHATTER = [
  "Hi there.",
  "Good afternoon everyone.",
  "How are you doing?",
  "Yep.",
  "Sounds good.",
  "Thanks, that's all from me.",
  "We can pause until the next interviewer joins.",
  "The HR conversation comes after this round.",
  "Mm hmm mm hmm.",
  "Okay okay okay okay.",
  "Lovely, thank you.",
  "No worries at all.",
  "Please hold, the panel is still connecting.",
  "Bye for now.",
  "Sure sure.",
  "Right, noted.",
  "We will email the outcome later.",
  "Hello hello hello.",
  "I'm well, thanks for asking.",
  "One moment while we switch rooms.",
  "Great, appreciate your time today.",
  "Uh huh.",
  "The final discussion is about compensation.",
  "Welcome in.",
  "time time time time time"
];

const AMBIGUOUS = [
  ["Why?", {}],
  ["How?", {}],
  ["And the approval workflow?", {}],
  ["post selling is different", {}],
  ["Have you statistical or any session demo case?", {}],
  ["Or maybe the catalog?", {}],
  ["So networking.", {}],
  ["Implementation bit.", {}],
  ["based in the region or", {}],
  ["And may I ask?", {}],
  ["Just the ruleset piece.", {}],
  ["How how how did the cutover begin", {}],
  ["Identify customer then partner.", {}],
  ["Something about the ruleset.", {}],
  ["You you you the access.", {}]
];

const FOLLOW_UPS = [
  ["Why?", { priorQuestion: PRIOR }],
  ["How?", { priorQuestion: PRIOR }],
  ["And the approval workflow?", { priorQuestion: PRIOR }],
  ["What about SoD?", { priorQuestion: PRIOR }],
  ["And the controller review?", { priorQuestion: PRIOR }],
  ["Which object?", { priorQuestion: PRIOR }],
  ["Any other control besides mitigation?", { priorQuestion: PRIOR }],
  ["So the provisioning step?", { priorQuestion: PRIOR }],
  ["What about the audit evidence?", { priorQuestion: PRIOR }],
  ["And the hypercare window?", { priorQuestion: PRIOR }]
];

function check(rows, expected) {
  const misses = [];
  for (const row of rows) {
    const text = Array.isArray(row) ? row[0] : row;
    const context = Array.isArray(row) ? row[1] : {};
    const result = admitQuestion(text, context);
    if (result.decision !== expected) misses.push(`${result.decision}/${result.reason}: ${text}`);
  }
  return misses;
}

const misses = [
  ...check(VALID, "ANSWER"),
  ...check(CHATTER, "IGNORE"),
  ...check(AMBIGUOUS, "DEFER"),
  ...check(FOLLOW_UPS, "ANSWER")
];
assert.ok(VALID.length >= 25 && CHATTER.length >= 25 && AMBIGUOUS.length >= 15 && FOLLOW_UPS.length >= 10);
if (misses.length) {
  console.error(misses.join("\n"));
}
assert.strictEqual(misses.length, 0, `${misses.length} fresh admission misses`);
console.log(`fresh admission: valid ${VALID.length}, chatter ${CHATTER.length}, ambiguous ${AMBIGUOUS.length}, follow-ups ${FOLLOW_UPS.length}`);
