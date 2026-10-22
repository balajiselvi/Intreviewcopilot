/**
 * Small routing check for remediation phrasing vs investigative controls. Local harness.
 */
const { resolveInterviewContext, toHistoryContext } = require("../lib/interviewContext");

const seed = "IPS isn't creating accounts in the target system.";
const history = [
  { role: "user", content: seed, context: toHistoryContext(resolveInterviewContext({ questionRaw: seed })) },
  { role: "assistant", content: "prior answer placeholder" }
];

const questions = [
  "How do you put it right?",
  "How do you get it working again?",
  "How would you make this work?",
  "How do you bring the roles back in line?",
  "What would you establish first?",
  "What would you check first?",
  "What is the business impact?",
  "How do you put the ruleset together?",
  "Where would you start looking?"
];

for (const questionRaw of questions) {
  const ctx = resolveInterviewContext({ questionRaw, history });
  console.log(questionRaw.padEnd(42), (ctx.questionIntent || "").padEnd(26), (ctx.step || "-").padEnd(20), ctx.answerScope);
}
