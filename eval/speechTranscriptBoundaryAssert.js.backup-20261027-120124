const assert = require("node:assert/strict");
const { takeUtterance, deferredOnIncomplete } = require("../lib/deferredContinuation");
const { decideInterviewTurn } = require("../lib/turnDecision");
const { resolveInterviewContext } = require("../lib/interviewContext");
const { repairMidSentenceStart, prepareLiveTranscript } = require("../lib/transcriptGuardrails");
const { admitQuestion } = require("../lib/questionAdmission");

const FIORI = "If the user cannot access a Fiori app, how do you troubleshoot?";
const FOLLOW = "What if my server was on premise?";

assert.equal(deferredOnIncomplete, false, "deferredOnIncomplete must be false");

function acceptFinalTranscript(text, { pending = null, history = [] } = {}) {
  const assembly = takeUtterance(pending, text);
  assert.notEqual(assembly.action, "hold", "takeUtterance must never hold");
  const turn = decideInterviewTurn({ question: assembly.text || text, history });
  return {
    submitted: turn.decision === "ANSWER",
    reason: turn.reason,
    decision: turn.decision,
    text: turn.normalizedQuestion || assembly.text || text
  };
}

const history = [{ type: "question", text: FIORI }];
assert.equal(acceptFinalTranscript(FOLLOW, { history }).submitted, true);
assert.equal(acceptFinalTranscript("the role or", { history }).submitted, true);
assert.equal(acceptFinalTranscript(FOLLOW, { history: [] }).submitted, true);

const premises = "premises SAP GRC Access Control 12.0 ARA MSMP configuration";
assert.match(repairMidSentenceStart(premises), /^Regarding on-premises/i);
const prepared = prepareLiveTranscript(premises);
assert.match(prepared.normalized, /Regarding on-premises SAP GRC Access Control/i);
assert.equal(admitQuestion(prepared.normalized).decision, "ANSWER");
assert.equal(admitQuestion(premises).decision, "ANSWER");

const turn = decideInterviewTurn({ question: premises, history: [] });
assert.equal(turn.decision, "ANSWER");
assert.notEqual(turn.decision, "DEFER");

const resolved = resolveInterviewContext({
  questionRaw: FOLLOW,
  history: [{ role: "user", content: FIORI }, { role: "assistant", content: "I would check the deployment first." }]
});
assert.match(resolved.questionResolved || resolved.resolvedQuestion || "", /Fiori|on premise/i);

console.log("speechTranscriptBoundaryAssert: PASS (force pass-through, zero DEFER)");
