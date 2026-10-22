/**
 * Adversarial pass for answer-scope work: integrity, product correctness, and the cases most
 * likely to be broken by scope gating. Local harness; run against the local Next.js server.
 */
const { generateAnswer } = require("./lib/generateAnswer");
const { resolveInterviewContext, toHistoryContext } = require("../lib/interviewContext");

const FABRICATION = /\b(?:Accenture|Chalhoub|SuccessFactors was|our client (?:ACME|XYZ)|last (?:Tuesday|month) we|the auditor told me)\b/i;
const SAP_OPERATES_CC = /\bSAP (?:owns|operates|manages)[^.]{0,40}Cloud Connector\b/i;
const OFF_DOMAIN_METRIC = /\b(?:20-25 percent|10,000-user Power Query|3-day|70-80 percent)\b/i;

function words(s) { return String(s || "").trim().split(/\s+/).filter(Boolean).length; }

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
    step: ctx.step,
    mode: ctx.scenarioMode,
    type: ctx.scenarioType,
    topic: ctx.questionTopic,
    depth: ctx.depth,
    words: words(answer),
    fabrication: FABRICATION.test(answer),
    sapOperatesCloudConnector: SAP_OPERATES_CC.test(answer),
    offDomainMetric: OFF_DOMAIN_METRIC.test(answer)
  }));
  console.log(answer);
  return answer;
}

(async () => {
  try {
    const sod = await seed("You find an SoD conflict in a business role. What would you do?");

    await run("DEEPDIVE_PARA", "Walk me through your implementation.", sod);
    await run("DEEPDIVE_PARA", "What was your role and what was the outcome?", sod);
    await run("CONFIRM_NEGATIVE_CONTROL", "Have you built a Joule agent for IAG in production?", sod);
    await run("CONFIRM_ARIBA", "Have you delivered Ariba security yourself?", []);
    await run("RISE_CC", "Who operates the Cloud Connector in a RISE landscape?", []);
    await run("CHRONOLOGY", "Which employer was the GRC 12.0 global programme?", []);
    await run("PLANE_TRAP", "Can IAS assign role collections?", []);
    await run("DESIGN_NOT_TROUBLESHOOT", "How would you design display-only Fiori access sustainably?", []);
    await run("FOLLOWUP_INHERIT", "And what about the org level?", sod);
    await run("TOPIC_CHANGE", "Let's switch to BTP. How are role collections assigned?", sod);
  } catch (error) {
    console.error("ADVERSARIAL_FAILED", error && error.message ? error.message : error);
    process.exitCode = 1;
  }
})();
