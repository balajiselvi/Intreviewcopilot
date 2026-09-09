const assert = require("assert");
const {
  QUESTION_INTENTS,
  buildBoundedHistory,
  isClearlyIncompleteFragment,
  removeSubmittedSnapshot,
  resolveInterviewContext,
  sanitizeDebugContext,
  toHistoryContext
} = require("../lib/interviewContext");

function turn(role, content, extra = {}) {
  return { role, content, ...extra };
}

const excelHistory = [
  turn("user", "How do you identify conflicts?", { questionId: "q1", source: "system" }),
  turn("assistant", "I start with the ARA ruleset and validate the resulting risks.", { answerId: "a1" })
];
const excelCorrection = resolveInterviewContext({
  questionRaw: "No, I mean after exporting the roles into Excel.",
  history: excelHistory
});
assert.strictEqual(excelCorrection.questionIntent, QUESTION_INTENTS.CORRECTION);
assert.strictEqual(excelCorrection.correctionDetected, true);
assert.match(excelCorrection.questionResolved, /identify conflicts/i);
assert.match(excelCorrection.questionResolved, /after exporting the roles into Excel/i);
assert.match(excelCorrection.retrievalQuery, /Excel/i);
assert.doesNotMatch(excelCorrection.unresolvedFacet, /ARA basics/i);

const objectDepth = resolveInterviewContext({
  questionRaw: "How do you know which authorization object or value is actually causing it?",
  history: [
    turn("user", "How do you validate an authorization issue?", { context: { questionTopic: "Authorization" } }),
    turn("assistant", "I validate the failed function before changing the role.")
  ]
});
assert.strictEqual(objectDepth.questionIntent, QUESTION_INTENTS.REQUEST_FOR_VALIDATION);
assert.strictEqual(objectDepth.depth, "deep");
assert.match(objectDepth.interviewerObjective, /object.*field.*value/i);

const rejection = resolveInterviewContext({
  questionRaw: "You're answering round and round. You're not answering the question.",
  history: excelHistory
});
assert.strictEqual(rejection.questionIntent, QUESTION_INTENTS.CHALLENGE);
assert.strictEqual(rejection.rejectionCount, 1);
assert.match(rejection.questionResolved, /identify conflicts/i);
assert.match(rejection.interviewerFeedback, /not answering/i);

const example = resolveInterviewContext({
  questionRaw: "Give me one specific example.",
  history: excelHistory
});
assert.strictEqual(example.questionIntent, QUESTION_INTENTS.REQUEST_FOR_EXAMPLE);
assert.strictEqual(example.experienceRequirement, "candidate-supported-only");

const steps = resolveInterviewContext({
  questionRaw: "What technical steps are involved?",
  history: excelHistory
});
assert.strictEqual(steps.questionIntent, QUESTION_INTENTS.REQUEST_FOR_TECHNICAL_STEPS);
assert.strictEqual(steps.interviewerObjective, "technical steps");
assert.strictEqual(steps.depth, "deep");

const fragment = resolveInterviewContext({
  questionRaw: "How do you?",
  history: [
    turn("user", "Explain SAC authorization design.", { context: { questionTopic: "SAC" } }),
    turn("assistant", "I separate SAC content permissions from authentication.")
  ]
});
assert.strictEqual(fragment.questionIntent, QUESTION_INTENTS.FRAGMENT);
assert.strictEqual(fragment.questionTopic, "SAC");
assert.strictEqual(fragment.retrievalDecision, "active-context");
assert.doesNotMatch(fragment.questionResolved, /\bGRC\b/i);

const sac = resolveInterviewContext({ questionRaw: "How would you design SAC security?", history: [] });
assert.strictEqual(sac.questionTopic, "SAC");
assert.ok(sac.requiredProductBoundaries.includes("SAC"));
assert.ok(sac.forbiddenProductBoundaries.includes("GRC"));

const fiori = resolveInterviewContext({
  questionRaw: "How do you make a sustainable display-only Fiori role?",
  history: []
});
assert.strictEqual(fiori.questionTopic, "Fiori");
assert.match(fiori.interviewerObjective, /display-only/i);

const ruleset = resolveInterviewContext({
  questionRaw: "How do you fix ruleset false positives without missing real risks?",
  history: []
});
assert.strictEqual(ruleset.questionTopic, "GRC");
assert.match(ruleset.interviewerObjective, /rules.*functions.*actions.*permissions/i);

const jml = resolveInterviewContext({
  questionRaw: "IAG is configured except JML. What architecture completes it?",
  history: []
});
assert.strictEqual(jml.questionIntent, QUESTION_INTENTS.REQUEST_FOR_ARCHITECTURE);
assert.deepStrictEqual(jml.entities.filter((x) => ["IAG", "IPS"].includes(x)).sort(), ["IAG", "IPS"]);
assert.ok(jml.requiredProductBoundaries.includes("target application"));
assert.ok(jml.constraints.some((x) => /SuccessFactors/i.test(x)));

const reset = resolveInterviewContext({
  questionRaw: "Now explain BTP role collections.",
  history: [turn("user", "How do SAC teams control stories?", { context: { questionTopic: "SAC" } })]
});
assert.strictEqual(reset.questionTopic, "BTP");
assert.strictEqual(reset.previousQuestion, "How do SAC teams control stories?");
assert.strictEqual(reset.questionIntent, QUESTION_INTENTS.DIRECT_QUESTION);
assert.doesNotMatch(reset.questionResolved, /SAC teams/i);

assert.strictEqual(isClearlyIncompleteFragment("How do you?"), true);
assert.strictEqual(isClearlyIncompleteFragment("Why IAG?"), false);
assert.strictEqual(isClearlyIncompleteFragment("What is IAS?"), false);
assert.strictEqual(removeSubmittedSnapshot("How do you validate? New speech arrived.", "How do you validate?"), "New speech arrived.");
assert.strictEqual(removeSubmittedSnapshot("Different live text", "Submitted text"), "Different live text");

const acknowledgement = resolveInterviewContext({
  questionRaw: "Okay, understood.",
  history: excelHistory
});
assert.strictEqual(acknowledgement.questionIntent, QUESTION_INTENTS.NON_QUESTION);
assert.strictEqual(acknowledgement.retrievalDecision, "skip");

const manyEvents = Array.from({ length: 24 }, (_, i) => ({
  type: i % 2 ? "response" : "question",
  text: `${i}-${"x".repeat(600)}`,
  timestamp: `t${i}`,
  source: i % 2 ? "copilot" : "system",
  questionId: `q${i}`,
  context: { questionTopic: "SAC", privatePrompt: "must not pass" },
  status: "completed"
}));
const bounded = buildBoundedHistory(manyEvents);
assert.ok(bounded.length <= 13);
assert.ok(bounded.filter((x) => x.role === "user").length <= 8);
assert.ok(bounded.filter((x) => x.role === "assistant").length <= 5);
assert.ok(JSON.stringify(bounded).length <= 7600);
assert.ok(bounded.some((x) => x.source === "system" && x.timestamp));
assert.doesNotMatch(JSON.stringify(bounded), /privatePrompt/);

const debug = sanitizeDebugContext({
  ...jml,
  prompt: "secret prompt",
  apiKey: "sk-secret",
  retrievalEvidence: [{ id: "chunk-1", label: "JML flow", text: "private evidence" }]
}, {
  latencyMs: 21,
  classification: "IAG",
  reasoning: { mode: "architecture", hiddenThought: "secret" },
  components: ["IAG", "IPS"]
});
assert.match(JSON.stringify(debug), /chunk-1/);
assert.doesNotMatch(JSON.stringify(debug), /secret prompt|sk-secret|private evidence|hiddenThought/);

const paraphrases = [
  ["Actually, I meant the analysis after the role export.", excelHistory, QUESTION_INTENTS.CORRECTION],
  ["What evidence identifies the exact field value that failed?", excelHistory, QUESTION_INTENTS.REQUEST_FOR_VALIDATION],
  ["That still misses my question.", excelHistory, QUESTION_INTENTS.CHALLENGE],
  ["Give me a concrete example.", excelHistory, QUESTION_INTENTS.REQUEST_FOR_EXAMPLE],
  ["Walk me through the configuration steps.", excelHistory, QUESTION_INTENTS.REQUEST_FOR_TECHNICAL_STEPS],
  ["What would you?", [turn("user", "Explain Fiori display authorization.", { context: { questionTopic: "Fiori" } })], QUESTION_INTENTS.FRAGMENT],
  ["Design team and story access in SAP Analytics Cloud.", [], QUESTION_INTENTS.REQUEST_FOR_ARCHITECTURE],
  ["Build a maintainable read-only launchpad role.", [], QUESTION_INTENTS.DIRECT_QUESTION],
  ["How would you remediate noisy SoD rules while retaining true violations?", [], QUESTION_INTENTS.REQUEST_FOR_REMEDIATION],
  ["The governance tenant is ready, but joiner mover leaver is missing. Design the remaining flow.", [], QUESTION_INTENTS.REQUEST_FOR_ARCHITECTURE]
];
for (const [questionRaw, history, expected] of paraphrases) {
  assert.strictEqual(resolveInterviewContext({ questionRaw, history }).questionIntent, expected, questionRaw);
}

const fs = require("fs");
const path = require("path");
const promptSource = fs.readFileSync(path.join(__dirname, "../lib/prompt/interviewPrompt.js"), "utf8");
const chatSource = fs.readFileSync(path.join(__dirname, "../pages/api/chat.js"), "utf8");
const interviewSource = fs.readFileSync(path.join(__dirname, "../pages/interview.js"), "utf8");
assert.match(promptSource, /CURRENT INTERVIEW CONTEXT/);
assert.match(promptSource, /Confidence: low/);
assert.match(promptSource, /30-60/);
assert.match(promptSource, /150-250/);
assert.match(chatSource, /effectiveQuestion = interviewContext.questionResolved \|\| question/);
assert.match(chatSource, /question: effectiveQuestion/);
assert.match(chatSource, /event", sanitizeDebugContext|writeSSEEvent\(res, "context"/);
assert.doesNotMatch(chatSource, /knowledgeContextPreview/);
assert.match(interviewSource, /removeSubmittedSnapshot/);
assert.match(interviewSource, /isClearlyIncompleteFragment/);

function runConversation(questions) {
  const history = [];
  return questions.map((questionRaw, index) => {
    const context = resolveInterviewContext({ questionRaw, history, source: "system" });
    history.push(turn("user", questionRaw, { questionId: context.questionId, source: "system" }));
    history.push(turn("assistant", `answer-${index}`, { context: toHistoryContext(context), answerId: `a${index}` }));
    return context;
  });
}

const sodFlow = runConversation([
  "Show me the SoD detailed report.",
  "Then I export it to Excel. What next?",
  "How do you validate?",
  "How do you identify the rule?",
  "How do you identify the role and authorization object?",
  "How do you know the exact authorization field and value?",
  "How do you determine whether the conflict is genuine?",
  "How do you remediate it?",
  "How do you rerun and validate the fix?"
]);
assert.ok(sodFlow.every((item) => item.questionTopic === "GRC"));
assert.deepStrictEqual(sodFlow.map((item) => item.facet), [
  "detailed SoD report",
  "Excel export analysis",
  "technical validation steps",
  "rule identification",
  "role → authorization object",
  "function → action → authorization object → field → value",
  "genuine conflict determination",
  "remediation path",
  "rerun analysis and validate regression"
]);
assert.strictEqual(sodFlow[5].depth, "deep");
assert.ok(sodFlow[8].answeredFacets.includes("remediation path"));
assert.strictEqual(sodFlow[6].questionIntent, QUESTION_INTENTS.FOLLOW_UP);
assert.match(sodFlow[6].questionResolved, /Excel/i);
assert.match(sodFlow[6].questionResolved, /SoD|conflict/i);
assert.strictEqual(sodFlow[6].depth, "deep");
assert.match(sodFlow[7].questionResolved, /Excel|authorization object|conflict/i);

const excelValidateHistory = [
  turn("user", "After exporting the SoD results into Excel, how do you validate the conflict?", {
    context: toHistoryContext(resolveInterviewContext({
      questionRaw: "After exporting the SoD results into Excel, how do you validate the conflict?"
    }))
  }),
  turn("assistant", "I would inspect the exported function-action rows.", {
    context: toHistoryContext(resolveInterviewContext({
      questionRaw: "After exporting the SoD results into Excel, how do you validate the conflict?"
    }))
  })
];
const genuineFollowUp = resolveInterviewContext({
  questionRaw: "Is the conflict genuine?",
  history: excelValidateHistory
});
assert.strictEqual(genuineFollowUp.questionIntent, QUESTION_INTENTS.FOLLOW_UP);
assert.strictEqual(genuineFollowUp.questionTopic, "GRC");
assert.match(genuineFollowUp.questionResolved, /Excel/i);
assert.match(genuineFollowUp.questionResolved, /SoD/i);
assert.match(genuineFollowUp.questionResolved, /Is the conflict genuine\?/i);

const valueHistory = [
  turn("user", "How do you identify the authorization object and value causing the conflict?", {
    context: { questionTopic: "GRC", questionResolved: "How do you identify the authorization object and value causing the conflict?", depth: "deep" }
  }),
  turn("assistant", "I trace function to action to object to field to value.")
];
const valueFollowUp = resolveInterviewContext({
  questionRaw: "How do you know that value is really causing it?",
  history: valueHistory
});
assert.notStrictEqual(valueFollowUp.questionIntent, QUESTION_INTENTS.DIRECT_QUESTION);
assert.match(valueFollowUp.questionResolved, /authorization object/i);
assert.match(valueFollowUp.questionResolved, /value/i);
assert.strictEqual(valueFollowUp.depth, "deep");

const fioriSustain = [
  turn("user", "How do you make the deviated Manage Purchase Order design sustainable?", {
    context: { questionTopic: "Fiori", questionResolved: "How do you make the deviated Manage Purchase Order design sustainable?" }
  }),
  turn("assistant", "I would lock display-only in catalog, target mapping, and backend ACTVT.")
];
const catalogFollowUp = resolveInterviewContext({
  questionRaw: "What happens when SAP changes the standard catalog?",
  history: fioriSustain
});
assert.strictEqual(catalogFollowUp.questionTopic, "Fiori");
assert.match(catalogFollowUp.questionResolved, /Manage Purchase Order/i);
assert.match(catalogFollowUp.questionResolved, /sustainable/i);
assert.match(catalogFollowUp.questionResolved, /standard catalog/i);

const dependentComplete = [
  ["How do you validate that?", QUESTION_INTENTS.REQUEST_FOR_VALIDATION, /Excel|SoD|conflict/i],
  ["How do you fix it?", QUESTION_INTENTS.REQUEST_FOR_REMEDIATION, /Excel|SoD|conflict/i],
  ["What about the value?", QUESTION_INTENTS.FOLLOW_UP, /Excel|SoD|conflict|value/i],
  ["What happens then?", QUESTION_INTENTS.FOLLOW_UP, /Excel|SoD|conflict/i]
];
for (const [questionRaw, expectedIntent, resolvedRe] of dependentComplete) {
  const ctx = resolveInterviewContext({ questionRaw, history: excelValidateHistory });
  assert.strictEqual(ctx.questionIntent, expectedIntent, questionRaw);
  assert.strictEqual(ctx.questionTopic, "GRC", questionRaw);
  assert.match(ctx.questionResolved, resolvedRe, questionRaw);
  const providerUserMessage = ctx.questionResolved || questionRaw;
  assert.strictEqual(providerUserMessage, ctx.questionResolved);
  assert.doesNotMatch(providerUserMessage, /^Is the conflict genuine\?$/);
}

const whySustainable = resolveInterviewContext({
  questionRaw: "Why is that sustainable?",
  history: fioriSustain
});
assert.strictEqual(whySustainable.questionTopic, "Fiori");
assert.match(whySustainable.questionResolved, /Manage Purchase Order/i);

const sacThat = resolveInterviewContext({
  questionRaw: "How does that work in SAC?",
  history: [
    turn("user", "How do you design SAC security and access?", { context: { questionTopic: "SAC", questionResolved: "How do you design SAC security and access?" } }),
    turn("assistant", "I separate teams, content, and source data authorization.")
  ]
});
assert.strictEqual(sacThat.questionTopic, "SAC");
assert.match(sacThat.questionResolved, /design SAC security/i);
assert.ok(sacThat.forbiddenProductBoundaries.includes("GRC"));

const sodToSac = resolveInterviewContext({
  questionRaw: "How does that work in SAC?",
  history: excelValidateHistory
});
assert.strictEqual(sodToSac.questionTopic, "SAC");
assert.strictEqual(sodToSac.questionIntent, QUESTION_INTENTS.DIRECT_QUESTION);
assert.doesNotMatch(sodToSac.questionResolved, /Excel/i);
assert.doesNotMatch(sodToSac.questionResolved, /SoD results/i);

const correctionFlow = runConversation([
  "How do you identify conflicts?",
  "You're answering round and round. You're not answering to the question."
]);
assert.strictEqual(correctionFlow[1].questionIntent, QUESTION_INTENTS.CHALLENGE);
assert.strictEqual(correctionFlow[1].correctionDetected, true);
assert.match(correctionFlow[1].questionResolved, /identify conflicts/i);
assert.match(correctionFlow[1].interviewerObjective, /unresolved question directly/i);

const projectExample = runConversation([
  "How did you remediate SoD conflicts?",
  "Give me one specific example."
])[1];
assert.strictEqual(projectExample.experienceRequirement, "candidate-supported-only");
assert.strictEqual(projectExample.depth, "project");

const fioriFlow = runConversation([
  "How is Manage Purchase Order authorized in Fiori?",
  "What if usage deviates from the default?",
  "Make it display-only.",
  "How do you keep that design sustainable?"
]);
assert.ok(fioriFlow.every((item) => item.questionTopic === "Fiori"));
assert.match(fioriFlow[2].questionResolved, /Manage Purchase Order/i);
assert.match(fioriFlow[3].questionResolved, /display-only/i);

const roleDesign = runConversation([
  "Explain master, derived, and composite role architecture.",
  "What design did you use in an actual previous engagement?"
]);
assert.strictEqual(roleDesign[0].questionTopic, "Authorization");
assert.strictEqual(roleDesign[1].questionIntent, QUESTION_INTENTS.REQUEST_FOR_EXPERIENCE);
assert.strictEqual(roleDesign[1].experienceRequirement, "candidate-supported-only");

const sacFlow = runConversation([
  "How do you design SAC security and access?",
  "How do you?",
  "This object. That object."
]);
assert.ok(sacFlow.every((item) => item.questionTopic === "SAC"));
assert.strictEqual(sacFlow[1].questionIntent, QUESTION_INTENTS.FRAGMENT);
assert.strictEqual(sacFlow[2].questionIntent, QUESTION_INTENTS.FRAGMENT);
assert.match(sacFlow[2].questionResolved, /How do you\?/i);

const planeCases = [
  ["How does IAS authenticate users?", "IAS"],
  ["How does IPS synchronize identities?", "IPS"],
  ["How does IAG govern access?", "IAG"],
  ["How does GRC ARA analyze conflicts?", "GRC"],
  ["How does SAC secure stories?", "SAC"],
  ["How do BTP role collections work?", "BTP"],
  ["How does S/4HANA enforce authorization?", "Authorization"]
];
for (const [questionRaw, expectedTopic] of planeCases) {
  assert.strictEqual(resolveInterviewContext({ questionRaw }).questionTopic, expectedTopic);
}

console.log("interviewContextAssert: PASS");
