const assert = require("node:assert/strict");
const { takeUtterance } = require("../lib/deferredContinuation");
const { decideInterviewTurn } = require("../lib/turnDecision");
const { resolveInterviewContext } = require("../lib/interviewContext");

const FIORI = "If the user cannot access a Fiori app, how do you troubleshoot?";
const FOLLOW = "What if my server was on premise?";

function acceptFinalTranscript(text, { pending = null, history = [] } = {}) {
  const assembly = takeUtterance(pending, text);
  if (assembly.action === "hold") {
    return { submitted: false, reason: "deferred-fragment", text };
  }
  const turn = decideInterviewTurn({ question: assembly.text || text, history });
  return {
    submitted: turn.decision === "ANSWER",
    reason: turn.reason,
    decision: turn.decision,
    text: assembly.text || text
  };
}

const history = [{ type: "question", text: FIORI }];
const follow = acceptFinalTranscript(FOLLOW, { history });
assert.equal(follow.submitted, true, "short speech follow-up is submitted");
assert.equal(follow.reason, "follow-up");

const fragment = acceptFinalTranscript("the role or", { history });
assert.equal(fragment.submitted, false, "incomplete speech stays deferred");

const orphan = acceptFinalTranscript(FOLLOW, { history: [] });
assert.equal(orphan.submitted, false, "follow-up without a previous question is not sent");
assert.equal(orphan.reason, "follow-up-without-context");

const resolved = resolveInterviewContext({
  questionRaw: FOLLOW,
  history: [{ role: "user", content: FIORI }, { role: "assistant", content: "I would check the deployment first." }]
});
assert.match(resolved.questionResolved || resolved.resolvedQuestion || "", /Fiori/);
assert.match(resolved.questionResolved || resolved.resolvedQuestion || "", /on premise/i);

const unrelated = resolveInterviewContext({
  questionRaw: "How do you secure an SAP Analytics Cloud story?",
  history: [{ role: "user", content: FIORI }, { role: "assistant", content: "I would check the deployment first." }]
});
const unrelatedText = unrelated.questionResolved || unrelated.resolvedQuestion || "";
assert.match(unrelatedText, /Analytics Cloud/i);
assert.doesNotMatch(unrelatedText, /cannot access a Fiori app/);

console.log("speechTranscriptBoundaryAssert: PASS (injected transcript, microphone recognition NOT TESTED)");
