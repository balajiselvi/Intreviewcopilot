/**
 * Live generation smoke for investigative closure and experience confirmation.
 * Not a committed contract; run against the local Next.js server.
 */
const { generateAnswer } = require("./lib/generateAnswer");
const {
  resolveInterviewContext,
  toHistoryContext
} = require("../lib/interviewContext");

function words(answer) {
  return String(answer || "").trim().split(/\s+/).filter(Boolean).length;
}

function laterStageLeak(answer) {
  return /\b(remediat(?:e|ion)|role redesign|mitigating control|then I would (?:fix|remediate|correct)|informed remediation|guide the fix)\b/i.test(answer);
}

async function ask(question, history = []) {
  const ctx = resolveInterviewContext({ questionRaw: question, history });
  const { answer, latencyMs } = await generateAnswer(question, { history });
  return { question, ctx, answer, latencyMs, words: words(answer), laterStageLeak: laterStageLeak(answer) };
}

function print(label, result) {
  console.log(`\n===== ${label} =====`);
  console.log(JSON.stringify({
    intent: result.ctx.questionIntent,
    step: result.ctx.step,
    scenarioMode: result.ctx.scenarioMode,
    scenarioType: result.ctx.scenarioType,
    depth: result.ctx.depth,
    experienceMode: result.ctx.experienceMode,
    words: result.words,
    laterStageLeak: result.laterStageLeak,
    latencyMs: result.latencyMs
  }));
  console.log(result.answer);
}

(async () => {
  try {
    const seedQ = "You find an SoD conflict in a business role. What would you do?";
    const seedCtx = resolveInterviewContext({ questionRaw: seedQ, history: [] });
    const seed = await generateAnswer(seedQ, { history: [] });
    const sodHistory = [
      { role: "user", content: seedQ, context: toHistoryContext(seedCtx) },
      { role: "assistant", content: seed.answer }
    ];
    print("SEED_UNDERSTAND", {
      question: seedQ,
      ctx: seedCtx,
      answer: seed.answer,
      latencyMs: seed.latencyMs,
      words: words(seed.answer),
      laterStageLeak: laterStageLeak(seed.answer)
    });

    print("IDENTIFY", await ask("Which exact control handles that?", sodHistory));
    print("EXPERIENCE_CONFIRM", await ask("Have you actually implemented this?", sodHistory));
    print("REMEDIATE", await ask("How would you fix it?", sodHistory));
    print("ACTIVE_FRAGMENT", await ask("Which object?", sodHistory));
    print("ISOLATED_FRAGMENT", await ask("What object?", []));
    print("CONCEPT", await ask("What is SoD?", []));
    print("TROUBLESHOOT_FIORI", await ask("A user cannot open a Fiori tile.", []));
    print("DESIGN", await ask("How would you design a Fiori catalog so it stays maintainable?", []));
  } catch (error) {
    console.error("BASELINE_FAILED", error && error.message ? error.message : error);
    process.exitCode = 1;
  }
})();
