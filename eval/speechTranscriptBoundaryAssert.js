/**
 * Speech boundary regression: incomplete utterances defer, continuation joins,
 * independent questions supersede pending fragments, and noise is not generated.
 * Run: node eval/speechTranscriptBoundaryAssert.js
 */
const assert = require("assert");
const { takeUtterance, deferredOnIncomplete } = require("../lib/deferredContinuation.js");
const { admitQuestion } = require("../lib/questionAdmission.js");
const { decideInterviewTurn } = require("../lib/turnDecision.js");

assert.strictEqual(deferredOnIncomplete, true);
const first = takeUtterance(null, "What about");
assert.strictEqual(first.action, "hold", "open phrase should be held for continuation");
assert.strictEqual(first.disposition, "DEFER");
assert.ok(first.pending && first.pending.text);

const continued = takeUtterance(first.pending, "the approval workflow?");
assert.strictEqual(continued.action, "complete");
assert.match(continued.text, /^What about the approval workflow\?$/i);
const joinedTurn = decideInterviewTurn({ question: continued.text, history: [{ type: "question", text: "How does ARM approval path work?", disposition: "ANSWER" }] });
assert.strictEqual(joinedTurn.decision, "ANSWER");

const pending = takeUtterance(null, "What about").pending;
const independent = takeUtterance(pending, "What is SoD?");
assert.strictEqual(independent.action, "pass", "a new question must not be merged into the pending fragment");
assert.strictEqual(independent.pending, null);
assert.strictEqual(decideInterviewTurn({ question: independent.text, history: [] }).decision, "ANSWER");

assert.notStrictEqual(admitQuestion("So networking.", { priorQuestion: "How does ARM approval work in GRC?" }).decision, "ANSWER");
const noise = takeUtterance(null, "Thanks");
assert.strictEqual(noise.disposition, "IGNORE");
const noiseTurn = decideInterviewTurn({ question: "Thanks", history: [{ type: "question", text: "How does ARM approval work in GRC?", disposition: "ANSWER" }] });
assert.strictEqual(noiseTurn.decision, "IGNORE");
assert.notStrictEqual(noiseTurn.route, "GENERATION");
console.log("speechTranscriptBoundaryAssert: PASS (defer, continuation join, independent-turn separation, noise rejection)");