/**
 * Admission battery — force pass-through: non-empty → ANSWER; never DEFER.
 * node eval/inputGateBattery.js
 */
const assert = require("assert");
const { admitQuestion, deferredOnIncomplete } = require("../lib/questionAdmission.js");
const { decideInterviewTurn } = require("../lib/turnDecision.js");
const { repairMidSentenceStart, prepareLiveTranscript } = require("../lib/transcriptGuardrails.js");

assert.equal(deferredOnIncomplete, false);

const PRIOR = "How does ARM approval work in GRC?";

const MUST_ANSWER = [
  "What is PFCG?",
  "How do you design an SoD ruleset?",
  "Why?",
  "How?",
  "And the approval workflow?",
  "So networking.",
  "Or Qatar?",
  "post selling is different",
  "Identify customer",
  "Implementation reco.",
  "based in Dubai or",
  "Just the ruleset.",
  "How how how did that start with the decision",
  "premises SAP GRC Access Control 12.0",
  "the role or",
  "Good morning.",
  "Tell me about your GRC implementation experience."
];

let failed = 0;
for (const text of MUST_ANSWER) {
  const result = admitQuestion(text, { priorQuestion: PRIOR });
  if (result.decision !== "ANSWER") {
    failed += 1;
    console.error("EXPECTED ANSWER", result.decision, result.reason, text);
  }
  if (result.decision === "DEFER") {
    failed += 1;
    console.error("DEFER FORBIDDEN", text);
  }
}

assert.equal(admitQuestion("").decision, "IGNORE");
assert.equal(admitQuestion("   ").decision, "IGNORE");

const repaired = repairMidSentenceStart("premises SAP GRC Access Control 12.0 ARA");
assert.match(repaired, /^Regarding on-premises/i);

const prepared = prepareLiveTranscript("premises SAP GRC Access Control 12.0");
assert.equal(prepared.ignoreNoise, false);
assert.match(prepared.normalized, /Regarding on-premises/i);

const turn = decideInterviewTurn({ question: "premises SAP GRC Access Control 12.0", history: [] });
assert.equal(turn.decision, "ANSWER");
assert.notEqual(turn.decision, "DEFER");

assert.strictEqual(failed, 0, `${failed} admission cases failed`);
console.log(`input gate: force pass-through OK (${MUST_ANSWER.length} non-empty → ANSWER, defer abolished)`);
