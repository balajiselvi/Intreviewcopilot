process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3000";
const { admitQuestion } = require("../../lib/questionAdmission");
const { generateAnswer } = require("../lib/generateAnswer");

const first = "If the user cannot access a Fiori app, how do you troubleshoot?";
const follow = "What if my server was on premise?";
const session = `fiori_follow_${Date.now()}`;

function report(label, result) {
  const answer = result.answer || "";
  const words = answer.split(/\s+/).filter(Boolean).length;
  console.log(JSON.stringify({
    label,
    words,
    route: result.generation?.route || result.context?.route || null,
    reason: result.generation?.reason || null,
    finish: result.generation?.finish_reason || null,
    headings: /Direct Answer|Technical Mechanism|Validation and Operational Boundary|Key Takeaways/.test(answer),
    hasPfcg: /PFCG/.test(answer),
    hasPublic: /Public Edition|Maintain Business Users/.test(answer),
    hasGateway: /IWFND\/ERROR_LOG/.test(answer),
    hasSu53: /SU53/.test(answer),
    provesSuccess: /SU53[\s\S]{0,80}prove/.test(answer),
    preview: answer.slice(0, 900)
  }, null, 2));
}

(async () => {
  const dropped = admitQuestion(follow, { priorQuestion: "" });
  const admitted = admitQuestion(follow, { priorQuestion: first });
  console.log(JSON.stringify({ dropped, admittedReason: admitted.reason, admitted: admitted.decision }));
  if (admitted.decision !== "ANSWER" || dropped.decision === "ANSWER") {
    throw new Error("admission decision is wrong");
  }
  const initial = await generateAnswer(first, { interviewSessionId: session, history: [] });
  report("initial", initial);
  if (!initial.answer || /Direct Answer/.test(initial.answer)) throw new Error("initial answer missing or headed");
  const next = await generateAnswer(follow, {
    interviewSessionId: session,
    history: [
      { role: "user", content: first },
      { role: "assistant", content: initial.answer }
    ]
  });
  report("follow-up", next);
  if (!next.answer) throw new Error("follow-up answer empty");
  if (/Direct Answer|Technical Mechanism/.test(next.answer)) throw new Error("follow-up used a report heading");
  if (!/PFCG|\/IWFND\/ERROR_LOG|on-premise|on premise/i.test(next.answer)) throw new Error("follow-up missed the on-premise path");
  if (next.answer.trim() === initial.answer.trim()) throw new Error("follow-up repeated the first answer");
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
