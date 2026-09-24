/**
 * Admission battery. Examples are unseen paraphrases; they are not listed in the gate.
 * node eval/inputGateBattery.js
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { admitQuestion } = require("../lib/questionAdmission.js");

const PRIOR = "How does ARM approval work in GRC?";

const SHOULD_ANSWER = [
  ["What is PFCG?", {}],
  ["How do you design an SoD ruleset?", {}],
  ["Why?", { priorQuestion: PRIOR }],
  ["How?", { priorQuestion: PRIOR }],
  ["What about SoD?", { priorQuestion: PRIOR }],
  ["And the approval workflow?", { priorQuestion: PRIOR }],
  ["What was your role?", {}],
  ["How is S/4HANA security different from ECC?", {}],
  ["Walk me through ARM.", {}],
  ["Can you explain firefighter access?", {}],
  ["What was your role at Dover?", {}],
  ["How many users were on the Fabtech project?", {}],
  ["Tell me about your GRC implementation experience.", {}],
  ["How would you troubleshoot a missing authorization?", {}],
  ["Where did you work before Dover?", {}],
  ["Who approves an emergency access request?", {}],
  ["Does this mean the role needs S_SERVICE?", {}],
  ["Any other security area besides GRC?", { priorQuestion: PRIOR }],
  ["Which countries were in scope?", {}],
  ["How long was the Dover programme?", {}],
  ["What steps do you take during discovery?", {}],
  ["Give us a brief introduction.", {}]
];

const SHOULD_IGNORE = [
  "Good morning.",
  "How are you?",
  "Mm-hmm.",
  "Yes, for sure.",
  "Thank you for your time. We will share the outcome.",
  "We will wait for the next panelist to join.",
  "This is only one interview round, right?",
  "time time time time time time",
  "OK thanks.",
  "Goodbye.",
  "All well.",
  "Yeah.",
  "The final round will be an HR discussion if this round goes fine.",
  "Please wait, someone is joining the panel.",
  "MMM.",
  "Sure.",
  "Have a good day, bye.",
  "We have conducted one interview and a third round will follow.",
  "Thanks for asking, I'm good.",
  "Hello hello.",
  "uh uh uh uh uh uh"
];

const SHOULD_DEFER = [
  ["Why?", {}],
  ["How?", {}],
  ["And the approval workflow?", {}],
  ["So networking.", {}],
  ["Or Qatar?", {}],
  ["And may I ask?", {}],
  ["post selling is different", {}],
  ["Identify customer", {}],
  ["Implementation reco.", {}],
  ["based in Dubai or", {}],
  ["Just the ruleset.", {}],
  ["How how how did that start with the decision", {}]
];

function unseenRatio(examples) {
  const source = fs.readFileSync(path.join(__dirname, "../lib/questionAdmission.js"), "utf8")
    + fs.readFileSync(path.join(__dirname, "../lib/scriptMatch.js"), "utf8");
  const copied = examples.filter((example) => source.includes(example));
  return { copied: copied.length, total: examples.length };
}

let failed = 0;
for (const [text, context] of SHOULD_ANSWER) {
  const result = admitQuestion(text, context);
  if (result.decision !== "ANSWER") {
    failed += 1;
    console.error("EXPECTED ANSWER", result.decision, result.reason, text);
  }
}
for (const text of SHOULD_IGNORE) {
  const result = admitQuestion(text, { priorQuestion: PRIOR });
  if (result.decision !== "IGNORE") {
    failed += 1;
    console.error("EXPECTED IGNORE", result.decision, result.reason, text);
  }
}
for (const [text, context] of SHOULD_DEFER) {
  const result = admitQuestion(text, context);
  if (result.decision !== "DEFER") {
    failed += 1;
    console.error("EXPECTED DEFER", result.decision, result.reason, text);
  }
}

const examples = [
  ...SHOULD_ANSWER.map((item) => item[0]),
  ...SHOULD_IGNORE,
  ...SHOULD_DEFER.map((item) => item[0])
];
const unseen = unseenRatio(examples);
assert.ok(unseen.total >= 20);
assert.ok((unseen.total - unseen.copied) / unseen.total >= 0.6, `unseen ratio too low: ${unseen.copied} copied`);
assert.strictEqual(failed, 0, `${failed} admission cases failed`);
console.log(`input gate: answer ${SHOULD_ANSWER.length}, ignore ${SHOULD_IGNORE.length}, defer ${SHOULD_DEFER.length}, unseen ${unseen.total - unseen.copied}/${unseen.total}`);
