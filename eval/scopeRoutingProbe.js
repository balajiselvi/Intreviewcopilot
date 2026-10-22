/**
 * Deterministic routing probe (no LLM): prints intent / scenario step / answerScope for a
 * matrix of utterances, including unseen paraphrases. Used to locate the FIRST divergence
 * before touching any code. Local diagnostic harness.
 */
const { resolveInterviewContext, toHistoryContext } = require("../lib/interviewContext");

function historyFor(question) {
  const ctx = resolveInterviewContext({ questionRaw: question });
  return [
    { role: "user", content: question, context: toHistoryContext(ctx) },
    { role: "assistant", content: "prior answer placeholder" }
  ];
}

const SEEDS = {
  SOD: "You find an SoD conflict in a business role. What would you do?",
  S4_ROLE: "We are rebuilding the PFCG role design for the S/4 finance rollout.",
  FIORI_FAIL: "A business user reports the purchasing app will not start for them.",
  IPS_FAIL: "IPS isn't creating accounts in the target system."
};

const GROUPS = [
  ["A/exact-control candidates", "SOD", [
    "What object?",
    "Which object is controlling that?",
    "Which exact control should I look at?",
    "What authorization artifact would you inspect?",
    "Which security artifact would you check?",
    "What specific authorization mechanism would you inspect?",
    "Which object or authorization artifact should I verify?",
    "Which authorization element is driving it?",
    "What exactly is enforcing that restriction?"
  ]],
  ["A/negative controls", "SOD", [
    "What would you do about it?",
    "Which team would you involve?",
    "What is the business impact?",
    "Which report would you send to the auditor?",
    "What would you tell the role owner?"
  ]],
  ["B/org-level follow-ups", "S4_ROLE", [
    "And what about the org level?",
    "What about organisational levels?",
    "How do you handle the org values here?",
    "And derived roles for the plants?",
    "What about company code restrictions?"
  ]],
  ["B/governance follow-ups", "S4_ROLE", [
    "And what about ownership of that?",
    "Who signs off on this?",
    "How do you keep this controlled after go-live?",
    "What about the audit evidence?"
  ]],
  ["D/investigative fresh", "FIORI_FAIL", [
    "What would you rule out first?",
    "Where would you start looking?",
    "How do you narrow it down?",
    "What tells you which layer is at fault?"
  ]],
  ["D/diagnose + remediate fresh", "IPS_FAIL", [
    "What is most likely causing it?",
    "So what is the actual fix here?",
    "How do you put it right?",
    "Once it's fixed, how do you prove it?"
  ]],
  ["D/experience fresh", "SOD", [
    "Do you have hands-on experience with this?",
    "Have you implemented Ariba security directly?",
    "Did you personally deliver this product?",
    "Have you implemented SAP IDM?",
    "Have you worked hands-on with IAG, IAS and IPS?",
    "Tell me more about that programme.",
    "Describe what you actually built.",
    "How big was the landscape you ran this on?"
  ]],
  ["D/standalone", null, [
    "Explain SoD.",
    "What is IAG?",
    "What does PFCG do?",
    "Compare IAS and IPS.",
    "How would you architect identity for a RISE migration?",
    "Design a least-privilege model for BW reporting.",
    "Approvals complete but users still cannot post invoices.",
    "The provisioning job finished yet nothing changed in the target.",
    "What object?"
  ]],
  ["G/topic change + inheritance", "SOD", [
    "Let's move on to Fiori. How are catalogs assigned?",
    "Now, separately, what is a business role?",
    "And the ruleset itself?",
    "Okay, that makes sense."
  ]]
];

for (const [label, seedKey, questions] of GROUPS) {
  const history = seedKey ? historyFor(SEEDS[seedKey]) : [];
  console.log(`\n=== ${label}${seedKey ? ` (after: ${SEEDS[seedKey]})` : " (no history)"}`);
  for (const questionRaw of questions) {
    const ctx = resolveInterviewContext({ questionRaw, history });
    console.log([
      questionRaw.padEnd(58),
      (ctx.questionIntent || "").padEnd(26),
      (ctx.scenarioMode || "").padEnd(10),
      (ctx.step || "-").padEnd(24),
      (ctx.answerScope || "").padEnd(24),
      (ctx.questionTopic || "").padEnd(14),
      ctx.depth
    ].join(" | "));
  }
}
