/**
 * Fresh-paraphrase + adversarial battery for answer-scope behavior.
 * Wording here is deliberately NOT the wording used while building the fix.
 * Local evaluation harness; run against the local Next.js server.
 */
const { generateAnswer } = require("./lib/generateAnswer");
const { resolveInterviewContext, toHistoryContext } = require("../lib/interviewContext");

const PRESCRIBES_FIX = /\b(?:i would (?:then )?(?:remediate|redesign|remove|split|adjust|rebuild|create a new role|correct|fix)|remediation (?:plan|step|approach)|mitigating control (?:would|should) be|then i would fix)\b/i;
const PREVIEWS_LATER = /\b(?:inform(?:s|ing|ed)? (?:the )?remediation|guide the fix|before (?:we|i) remediat|then (?:we|i) can (?:decide|remediate)|which will (?:inform|guide))\b/i;
const NAMES_EMPLOYER = /\bDover\b/i;
const DIRECT_CLAIM = /^(?:yes|no)\b/i;

function words(s) {
  return String(s || "").trim().split(/\s+/).filter(Boolean).length;
}

async function turn(question, history) {
  const ctx = resolveInterviewContext({ questionRaw: question, history });
  const { answer } = await generateAnswer(question, { history });
  return { question, ctx, answer };
}

async function seed(question) {
  const ctx = resolveInterviewContext({ questionRaw: question, history: [] });
  const { answer } = await generateAnswer(question, { history: [] });
  return [
    { role: "user", content: question, context: toHistoryContext(ctx) },
    { role: "assistant", content: answer }
  ];
}

function report(group, result, extra = {}) {
  console.log(`\n--- [${group}] ${result.question}`);
  console.log(JSON.stringify({
    scope: result.ctx.answerScope,
    step: result.ctx.step,
    mode: result.ctx.scenarioMode,
    type: result.ctx.scenarioType,
    intent: result.ctx.questionIntent,
    depth: result.ctx.depth,
    words: words(result.answer),
    prescribesFix: PRESCRIBES_FIX.test(result.answer),
    previewsLater: PREVIEWS_LATER.test(result.answer),
    namesEmployer: NAMES_EMPLOYER.test(result.answer),
    directClaim: DIRECT_CLAIM.test(result.answer.trim()),
    ...extra
  }));
  console.log(result.answer);
}

(async () => {
  try {
    const sod = await seed("You find an SoD conflict in a business role. What would you do?");
    const fiori = await seed("A business user reports the purchasing app will not start for them.");

    for (const q of [
      "Which exact control handles that?",
      "What authorization artifact would you inspect?",
      "What would you establish first?",
      "How would you verify what is actually failing?",
      "What evidence would you collect before deciding on a fix?"
    ]) {
      report("INVESTIGATIVE/SOD", await turn(q, sod));
    }

    for (const q of [
      "How would you verify what is actually failing?",
      "What would you look at first here?"
    ]) {
      report("INVESTIGATIVE/FIORI", await turn(q, fiori));
    }

    for (const q of [
      "How would you fix it?",
      "What would you do to remediate it?",
      "How would you correct the access issue?"
    ]) {
      report("REMEDIATION", await turn(q, sod));
    }

    for (const q of [
      "Have you done this hands-on?",
      "Did you personally implement this?",
      "Have you worked on this in production?",
      "Was this something you actually owned?",
      "Where have you implemented this?"
    ]) {
      report("EXPERIENCE_CONFIRM", await turn(q, sod));
    }

    for (const q of [
      "What exactly did you implement?",
      "Walk me through your implementation.",
      "What was your role and what was the outcome?"
    ]) {
      report("EXPERIENCE_DEEPDIVE", await turn(q, sod));
    }

    for (const q of ["Explain SoD.", "What is SoD?", "What does SoD mean in GRC?"]) {
      report("CONCEPT", await turn(q, []));
    }

    for (const q of [
      "IPS isn't creating accounts in the target system.",
      "Users are ending up with duplicate accounts after the sync.",
      "The approval goes through but the role never shows up on the user."
    ]) {
      report("TROUBLESHOOTING", await turn(q, []));
    }

    for (const q of [
      "How would you design the role architecture for a new S/4 rollout?",
      "What is your approach to planning an IPS provisioning model for a hybrid landscape?"
    ]) {
      report("DESIGN", await turn(q, []));
    }

    report("TOPIC_CHANGE", await turn("Let's move to SAC. How is story access controlled?", sod));
    report("ACTIVE_FRAGMENT", await turn("Which object?", sod));
    report("ISOLATED_FRAGMENT", await turn("What object?", []));
  } catch (error) {
    console.error("BATTERY_FAILED", error && error.message ? error.message : error);
    process.exitCode = 1;
  }
})();
