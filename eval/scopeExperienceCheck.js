/**
 * Focused re-check of experience scopes after the integrity fix.
 * Local harness; run against the local Next.js server.
 */
const { generateAnswer } = require("./lib/generateAnswer");
const { resolveInterviewContext, toHistoryContext } = require("../lib/interviewContext");

const DOCUMENTED_NUMBERS = [1650, 350, 220, 2400, 8700, 250, 300, 4000, 2500, 200, 18, 11, 28, 45];
const NUMBER_TOKEN = /\b\d[\d,]{2,}\b/g;

function words(s) { return String(s || "").trim().split(/\s+/).filter(Boolean).length; }

function undocumentedNumbers(answer) {
  const found = String(answer || "").match(NUMBER_TOKEN) || [];
  return found
    .map((raw) => Number(raw.replace(/,/g, "")))
    .filter((n) => !DOCUMENTED_NUMBERS.includes(n));
}

async function seed(question) {
  const ctx = resolveInterviewContext({ questionRaw: question, history: [] });
  const { answer } = await generateAnswer(question, { history: [] });
  return [
    { role: "user", content: question, context: toHistoryContext(ctx) },
    { role: "assistant", content: answer }
  ];
}

async function run(label, question, history = []) {
  const ctx = resolveInterviewContext({ questionRaw: question, history });
  const { answer } = await generateAnswer(question, { history });
  console.log(`\n--- [${label}] ${question}`);
  console.log(JSON.stringify({
    scope: ctx.answerScope,
    words: words(answer),
    undocumentedNumbers: undocumentedNumbers(answer)
  }));
  console.log(answer);
}

(async () => {
  try {
    const sod = await seed("You find an SoD conflict in a business role. What would you do?");
    await run("CONFIRM", "Have you done this hands-on?", sod);
    await run("CONFIRM", "Did you personally implement this?", sod);
    await run("CONFIRM_UNDOCUMENTED", "Have you delivered Ariba security yourself?", []);
    await run("CONFIRM_UNDOCUMENTED", "Have you built a Joule agent for IAG in production?", sod);
    await run("DEEPDIVE", "Walk me through your implementation.", sod);
    await run("DEEPDIVE", "What exactly did you implement?", sod);
  } catch (error) {
    console.error("EXPERIENCE_CHECK_FAILED", error && error.message ? error.message : error);
    process.exitCode = 1;
  }
})();
