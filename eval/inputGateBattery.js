/**
 * Admission gate regression battery.
 * Confirms real questions pass, chatter is ignored, fragments defer, and prior
 * context helps only recognized follow-up forms. Run: node eval/inputGateBattery.js
 */
const assert = require("assert");
const { admitQuestion, deferredOnIncomplete } = require("../lib/questionAdmission.js");
const { decideInterviewTurn } = require("../lib/turnDecision.js");
const { repairMidSentenceStart, prepareLiveTranscript } = require("../lib/transcriptGuardrails.js");

assert.strictEqual(deferredOnIncomplete, true, "incomplete questions should remain deferrable");
const PRIOR = "How does ARM approval work in GRC?";

for (const text of ["What is PFCG?", "How do you design an SoD ruleset?", "Tell me about your GRC implementation experience.", "premises SAP GRC Access Control 12.0"]) {
  assert.strictEqual(admitQuestion(text).decision, "ANSWER", `expected clear technical prompt to answer: ${text}`);
}
for (const text of ["Good morning.", "How are you doing?", "Thanks, that's all from me.", "We will email the outcome later."]) {
  assert.strictEqual(admitQuestion(text, { priorQuestion: PRIOR }).decision, "IGNORE", `context must not admit chatter: ${text}`);
}
for (const text of ["So networking.", "the role or", "Implementation reco.", "How to IAG?"]) {
  assert.strictEqual(admitQuestion(text, { priorQuestion: PRIOR }).decision, "DEFER", `context must not admit an incomplete fragment: ${text}`);
}
for (const text of ["Why?", "How?", "And the approval workflow?", "What about SoD?", "Which object?", "What if the app is missing from the launchpad?"]) {
  assert.strictEqual(admitQuestion(text, { priorQuestion: PRIOR }).decision, "ANSWER", `expected contextual follow-up: ${text}`);
}
assert.strictEqual(admitQuestion("").decision, "IGNORE");
assert.strictEqual(admitQuestion("   ").decision, "IGNORE");

const repaired = repairMidSentenceStart("premises SAP GRC Access Control 12.0 ARA");
assert.match(repaired, /^Regarding on-premises/i);
const prepared = prepareLiveTranscript("premises SAP GRC Access Control 12.0");
assert.strictEqual(prepared.ignoreNoise, false);
assert.match(prepared.normalized, /Regarding on-premises/i);

const technicalTurn = decideInterviewTurn({ question: "premises SAP GRC Access Control 12.0", history: [] });
assert.strictEqual(technicalTurn.decision, "ANSWER");
const greetingTurn = decideInterviewTurn({ question: "Good morning.", history: [{ type: "question", text: PRIOR, disposition: "ANSWER" }] });
assert.strictEqual(greetingTurn.decision, "IGNORE");
assert.notStrictEqual(greetingTurn.route, "GENERATION");
console.log("input gate: PASS (technical prompts, chatter rejection, contextual follow-ups, deferred fragments)");