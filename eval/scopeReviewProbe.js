/**
 * Live probe for the final review: the specific suspected divergences, each run twice so
 * deterministic pipeline behavior can be separated from model variance.
 * Local diagnostic harness; runs against the local Next.js server.
 */
const { generateAnswer } = require("./lib/generateAnswer");
const { resolveInterviewContext, toHistoryContext } = require("../lib/interviewContext");

function words(s) { return String(s || "").trim().split(/\s+/).filter(Boolean).length; }

async function seedHistory(question) {
  const ctx = resolveInterviewContext({ questionRaw: question });
  const { answer } = await generateAnswer(question, { history: [] });
  return [
    { role: "user", content: question, context: toHistoryContext(ctx) },
    { role: "assistant", content: answer }
  ];
}

async function extend(history, question) {
  const ctx = resolveInterviewContext({ questionRaw: question, history });
  const { answer } = await generateAnswer(question, { history });
  return {
    ctx,
    answer,
    history: [
      ...history,
      { role: "user", content: question, context: toHistoryContext(ctx) },
      { role: "assistant", content: answer }
    ]
  };
}

async function probe(label, question, history, runs = 2) {
  for (let i = 0; i < runs; i += 1) {
    const { ctx, answer } = await extend(history, question);
    console.log(`\n--- [${label} #${i + 1}] ${question}`);
    console.log(JSON.stringify({
      intent: ctx.questionIntent,
      step: ctx.step,
      scope: ctx.answerScope,
      words: words(answer)
    }));
    console.log(answer);
  }
}

(async () => {
  try {
    const ips = await seedHistory("IPS isn't creating accounts in the target system.");
    const sod = await seedHistory("You find an SoD conflict in a business role. What would you do?");

    await probe("FIX/resultative", "How do you put it right?", ips);
    await probe("FIX/working", "How do you get it working again?", ips, 1);
    await probe("STOP/control", "What would you establish first?", ips, 1);
    await probe("STOP/control-sod", "What would you rule out before anything else?", sod, 1);
    await probe("CONFIRM/possession", "Do you have hands-on experience with this?", sod, 1);

    const confirmed = await extend(sod, "Have you done this hands-on?");
    console.log(`\n--- [CONFIRM seed] ${confirmed.ctx.answerScope} / ${words(confirmed.answer)}w`);
    console.log(confirmed.answer);
    await probe("DEEPEN/after-confirmation", "Tell me more.", confirmed.history, 1);

    const investigated = await extend(ips, "What would you check first?");
    await probe("DEEPEN/after-investigation", "Tell me more.", investigated.history, 1);
  } catch (error) {
    console.error("REVIEW_PROBE_FAILED", error && error.message ? error.message : error);
    process.exitCode = 1;
  }
})();
