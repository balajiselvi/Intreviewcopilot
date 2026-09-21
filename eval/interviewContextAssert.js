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
assert.match(debug.answerTarget, /IAG is configured except JML/);
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
assert.match(promptSource, /CURRENT SCENARIO/);
assert.match(promptSource, /Current utterance \/ Answer target wins/);
assert.match(promptSource, /Answer target:/);
assert.match(promptSource, /answerTarget \|\| interviewContext.questionRaw/);
assert.match(promptSource, /Active technical chain:/);
assert.match(promptSource, /Current question meaning: which authorization object FIELD VALUE is driving the conflict, not business\/ROI value/);
assert.match(promptSource, /Do not restart by answering earlier clauses/);
assert.match(promptSource, /Confidence: low/);
assert.match(promptSource, /30-60/);
assert.match(promptSource, /150-250/);
assert.match(chatSource, /effectiveQuestion = interviewContext.questionResolved \|\| question/);
assert.match(chatSource, /providerQuestion = interviewContext.answerTarget \|\| interviewContext.questionRaw \|\| question/);
assert.match(chatSource, /question: providerQuestion/);
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
    context: {
      questionTopic: "GRC",
      questionResolved: "How do you identify the authorization object and value causing the conflict?",
      depth: "deep",
      scenarioMode: "ACTIVE",
      scenarioType: "SOD_INVESTIGATION"
    }
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

const whatValueShort = resolveInterviewContext({
  questionRaw: "What value?",
  history: valueHistory
});
assert.match(whatValueShort.interviewerObjective, /field.*value/i);
assert.strictEqual(whatValueShort.questionRaw, "What value?");
assert.strictEqual(whatValueShort.answerTarget, "Which authorization field value is causing the SoD conflict? No actual field value is supplied in the current context, so explain how you would trace the exact value and do not invent one.");
assert.match(whatValueShort.questionResolved, /authorization object/i);
assert.notStrictEqual(whatValueShort.answerTarget, whatValueShort.questionRaw);
assert.match(whatValueShort.retrievalQuery, /No actual field value is supplied in the current context/);

const whatObjectShort = resolveInterviewContext({
  questionRaw: "What object?",
  history: valueHistory
});
assert.strictEqual(whatObjectShort.questionRaw, "What object?");
assert.match(whatObjectShort.answerTarget, /No actual object is supplied/);
assert.notStrictEqual(whatObjectShort.answerTarget, whatObjectShort.questionRaw);
assert.notStrictEqual(whatObjectShort.depth, "brief");
assert.doesNotMatch(whatObjectShort.answerTarget, /is S_TABU_NAM|the object is S_TCODE/i);

const whatAboutValue = resolveInterviewContext({
  questionRaw: "What about the value?",
  history: excelValidateHistory
});
assert.strictEqual(whatAboutValue.questionRaw, "What about the value?");
assert.strictEqual(whatAboutValue.answerTarget, "What about the value?");

const sacWhatValue = resolveInterviewContext({
  questionRaw: "What value?",
  history: [
    turn("user", "How do you design SAC security and access?", {
      context: { questionTopic: "SAC", questionResolved: "How do you design SAC security and access?" }
    }),
    turn("assistant", "I separate teams, content, and source data authorization.")
  ]
});
assert.strictEqual(sacWhatValue.questionTopic, "SAC");
assert.strictEqual(sacWhatValue.questionRaw, "What value?");
assert.strictEqual(sacWhatValue.answerTarget, "What value?");

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
  assert.strictEqual(ctx.questionRaw, questionRaw);
  assert.notStrictEqual(ctx.questionRaw, ctx.questionResolved);
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

const fioriTileFail = resolveInterviewContext({
  questionRaw: "A business user cannot open a Fiori tile. How do you diagnose it?"
});
assert.strictEqual(fioriTileFail.scenarioMode, "ACTIVE");
assert.strictEqual(fioriTileFail.scenarioType, "TROUBLESHOOTING");
assert.notStrictEqual(fioriTileFail.questionIntent, QUESTION_INTENTS.FRAGMENT);

const fioriTileDesign = resolveInterviewContext({
  questionRaw: "How would you design a Fiori tile catalog so it stays maintainable?"
});
assert.notStrictEqual(fioriTileDesign.scenarioType, "TROUBLESHOOTING");

const sodStillConcept = resolveInterviewContext({ questionRaw: "What is SoD?" });
assert.strictEqual(sodStillConcept.scenarioMode, "NONE");

const haveYou = resolveInterviewContext({
  questionRaw: "Have you actually implemented this?",
  history: [
    turn("user", "You find an SoD conflict in a business role. What would you do?", {
      context: toHistoryContext(resolveInterviewContext({
        questionRaw: "You find an SoD conflict in a business role. What would you do?"
      }))
    })
  ]
});
assert.strictEqual(haveYou.questionIntent, QUESTION_INTENTS.REQUEST_FOR_EXPERIENCE);
assert.strictEqual(haveYou.depth, "normal");

const whichObjectPara = resolveInterviewContext({
  questionRaw: "Which object is controlling that?",
  history: [
    turn("user", "You find an SoD conflict in a business role. What would you do?", {
      context: toHistoryContext(resolveInterviewContext({
        questionRaw: "You find an SoD conflict in a business role. What would you do?"
      }))
    })
  ]
});
assert.strictEqual(whichObjectPara.step, "IDENTIFY_EXACT_CONTROL");
assert.notStrictEqual(whichObjectPara.depth, "brief");

const exactControl = resolveInterviewContext({
  questionRaw: "Which exact control should I look at?",
  history: [
    turn("user", "You find an SoD conflict in a business role. What would you do?", {
      context: toHistoryContext(resolveInterviewContext({
        questionRaw: "You find an SoD conflict in a business role. What would you do?"
      }))
    })
  ]
});
assert.strictEqual(exactControl.step, "IDENTIFY_EXACT_CONTROL");

// --- Answer scope: how much of the subject the current utterance actually asked for ---------
const sodSeedHistory = [
  turn("user", "You find an SoD conflict in a business role. What would you do?", {
    context: toHistoryContext(resolveInterviewContext({
      questionRaw: "You find an SoD conflict in a business role. What would you do?"
    }))
  })
];

const scopeCases = [
  ["Which exact control handles that?", "STAGE_INVESTIGATION"],
  ["What would you establish first?", "STAGE_INVESTIGATION"],
  ["How would you fix it?", "STAGE_REMEDIATION"],
  ["Have you done this hands-on?", "EXPERIENCE_CONFIRMATION"],
  ["Was this something you actually owned?", "EXPERIENCE_CONFIRMATION"],
  ["Where have you implemented this?", "EXPERIENCE_CONFIRMATION"],
  ["What exactly did you implement?", "EXPERIENCE_DEEP_DIVE"],
  ["Walk me through your implementation.", "EXPERIENCE_DEEP_DIVE"],
  ["What was your role and what was the outcome?", "EXPERIENCE_DEEP_DIVE"]
];
for (const [questionRaw, expectedScope] of scopeCases) {
  const scoped = resolveInterviewContext({ questionRaw, history: sodSeedHistory });
  assert.strictEqual(scoped.answerScope, expectedScope, `${questionRaw} -> ${scoped.answerScope}`);
}

// An experience confirmation must stay a claim-sized answer, never a project narrative.
const confirmDepth = resolveInterviewContext({
  questionRaw: "Have you done this hands-on?",
  history: sodSeedHistory
});
assert.notStrictEqual(confirmDepth.depth, "project");
assert.notStrictEqual(confirmDepth.depth, "brief");

// An explicit design request is never treated as an investigative stage, even mid-scenario.
const designScope = resolveInterviewContext({
  questionRaw: "How would you design the role architecture for a new S/4 rollout?"
});
assert.strictEqual(designScope.answerScope, "DEFAULT");

// The fix cue sits in a subordinate clause; the request itself is for evidence.
const evidenceBeforeFix = resolveInterviewContext({
  questionRaw: "What evidence would you collect before deciding on a fix?",
  history: sodSeedHistory
});
assert.notStrictEqual(evidenceBeforeFix.questionIntent, QUESTION_INTENTS.REQUEST_FOR_REMEDIATION);
assert.strictEqual(evidenceBeforeFix.answerScope, "STAGE_INVESTIGATION");

// Uncontracted negation is the same reported failure as the contracted form.
const uncontractedSymptom = resolveInterviewContext({
  questionRaw: "A business user reports the purchasing app will not start for them."
});
assert.strictEqual(uncontractedSymptom.scenarioMode, "ACTIVE");
assert.strictEqual(uncontractedSymptom.scenarioType, "TROUBLESHOOTING");

// "Do you have experience..." is the same question as "have you...", built with a different
// auxiliary; it must reach the confirmation scope rather than the scenario stage.
for (const questionRaw of [
  "Do you have hands-on experience with this?",
  "Have you had exposure to this?",
  "Any experience with IAG rulesets?"
]) {
  const possession = resolveInterviewContext({ questionRaw, history: sodSeedHistory });
  assert.strictEqual(possession.questionIntent, QUESTION_INTENTS.REQUEST_FOR_EXPERIENCE, questionRaw);
  assert.strictEqual(possession.answerScope, "EXPERIENCE_CONFIRMATION", questionRaw);
}

// A bare "tell me more" has no subject of its own: it inherits what was just asked.
const deepenAfterExperience = resolveInterviewContext({
  questionRaw: "Tell me more.",
  history: [
    ...sodSeedHistory,
    { role: "user", content: "Have you done this hands-on?" },
    { role: "assistant", content: "Yes, at Dover Corporation." }
  ]
});
assert.strictEqual(deepenAfterExperience.answerScope, "EXPERIENCE_DEEP_DIVE");
const deepenAfterInvestigation = resolveInterviewContext({
  questionRaw: "Tell me more.",
  history: [
    ...sodSeedHistory,
    { role: "user", content: "What would you establish first?" },
    { role: "assistant", content: "I would establish the symptom." }
  ]
});
assert.strictEqual(deepenAfterInvestigation.answerScope, "STAGE_INVESTIGATION");

// Asking for the fix without the word "fix": verb + object + result state is still remediation,
// because answering a remediation request with more investigation is the costlier error.
for (const questionRaw of ["How do you put it right?", "How do you get it working again?"]) {
  const resultative = resolveInterviewContext({ questionRaw, history: sodSeedHistory });
  assert.strictEqual(resultative.questionIntent, QUESTION_INTENTS.REQUEST_FOR_REMEDIATION, questionRaw);
  assert.strictEqual(resultative.answerScope, "STAGE_REMEDIATION", questionRaw);
}
const buildNotFix = resolveInterviewContext({
  questionRaw: "How do you put the ruleset together?",
  history: sodSeedHistory
});
assert.notStrictEqual(buildNotFix.questionIntent, QUESTION_INTENTS.REQUEST_FOR_REMEDIATION);

// Constraints are instructions the model has to read; they must survive intact, not be cut
// mid-sentence by the field bound.
const constrained = resolveInterviewContext({
  questionRaw: "What authorization artifact would you inspect?",
  history: sodSeedHistory
});
assert.ok(constrained.constraints.length > 0, "expected an anti-invention constraint");
for (const constraint of constrained.constraints) {
  assert.ok(/[.!?]$/.test(constraint.trim()), `constraint truncated: ${constraint}`);
}

// "How is this actually done?" is its own question type: not a concept, not a design, not a
// failure. It must reach the walkthrough scope from the question's grammar -- a HOW/walk-me-
// through request plus a realization verb -- and not from any particular product or phrasing.
for (const questionRaw of [
  "I have given you a requirement to add a tile. How are you going to do that?",
  "Walk me through configuring a new tile.",
  "How do you set up an IPS provisioning job?",
  "How would you configure IAS SSO with Azure AD?",
  "How do you create a derived role for a new plant?",
  "How do you configure a GRC connector for access risk analysis?",
  "How do you set up analysis authorizations in BW?",
  "How do you add a new space and assign privileges in Datasphere?",
  "If I give you a requirement to onboard a new application to IAG, how will you implement it?",
  "How do you build the JML flow from the HR source to S/4?",
  "How do you put the ruleset together?"
]) {
  const implementation = resolveInterviewContext({ questionRaw });
  assert.strictEqual(implementation.questionIntent, QUESTION_INTENTS.REQUEST_FOR_TECHNICAL_STEPS, questionRaw);
  assert.strictEqual(implementation.answerScope, "IMPLEMENTATION_WALKTHROUGH", questionRaw);
}

// The neighbours of that scope, each of which must keep its own behavior: a concept question
// stays a concept question, a design question stays architecture, a reported failure stays
// investigative, and a past-tense personal question stays on the experience path.
const notImplementation = [
  ["What is a Fiori catalog?", "DEFAULT"],
  ["What is target mapping?", "DEFAULT"],
  ["Why would you use a catalog?", "DEFAULT"],
  ["What is the difference between a catalog and a target mapping?", "DEFAULT"],
  ["How would you design Fiori security for S/4?", "DEFAULT"],
  ["How would you architect identity for a RISE migration?", "DEFAULT"],
  ["How would you model the role design for finance?", "DEFAULT"],
  ["The tile is visible but won't launch.", "STAGE_INVESTIGATION"],
  ["Have you actually implemented Fiori security?", "EXPERIENCE_CONFIRMATION"],
  ["How did you implement the catalog model at your last client?", "EXPERIENCE_DEEP_DIVE"]
];
for (const [questionRaw, expectedScope] of notImplementation) {
  const control = resolveInterviewContext({ questionRaw });
  assert.strictEqual(control.answerScope, expectedScope, questionRaw);
  if (expectedScope !== "IMPLEMENTATION_WALKTHROUGH") {
    assert.notStrictEqual(control.answerScope, "IMPLEMENTATION_WALKTHROUGH", questionRaw);
  }
}

// A procedure request describes no situation, so it must not open a scenario -- but an actual
// reported failure still does, even when the interviewer also asks how to configure the fix.
const procedureNoScenario = resolveInterviewContext({ questionRaw: "Walk me through configuring a new tile." });
assert.notStrictEqual(procedureNoScenario.scenarioMode, "ACTIVE");
const symptomPlusProcedure = resolveInterviewContext({
  questionRaw: "The purchasing app will not start for the user. How do you set the catalog up correctly?"
});
assert.strictEqual(symptomPlusProcedure.scenarioMode, "ACTIVE");

// Generalized collisions: diagnostic HOW must not become a walkthrough because a realization
// verb appears in the symptom clause; particle-less "wire" is still a realization verb;
// walk-through of what the candidate implemented is experience content, not a new scenario step.
{
  const conceptualSoD = resolveInterviewContext({ questionRaw: "What exactly is SoD?" });
  assert.strictEqual(conceptualSoD.answerScope, "DEFAULT");
  assert.notStrictEqual(conceptualSoD.scenarioMode, "ACTIVE");

  const diagnosticHow = resolveInterviewContext({
    questionRaw: "Walk me through investigating an IPS job that stopped creating users."
  });
  assert.notStrictEqual(diagnosticHow.answerScope, "IMPLEMENTATION_WALKTHROUGH");
  assert.notStrictEqual(diagnosticHow.questionIntent, QUESTION_INTENTS.REQUEST_FOR_TECHNICAL_STEPS);

  const diagnosticParaphrase = resolveInterviewContext({
    questionRaw: "Take me through diagnosing a provisioning run that keeps creating duplicates."
  });
  assert.notStrictEqual(diagnosticParaphrase.answerScope, "IMPLEMENTATION_WALKTHROUGH");

  const wireConnector = resolveInterviewContext({
    questionRaw: "How do you actually wire Cloud Connector so a BTP app can reach the on-prem backend?"
  });
  assert.strictEqual(wireConnector.answerScope, "IMPLEMENTATION_WALKTHROUGH");
  assert.strictEqual(wireConnector.questionIntent, QUESTION_INTENTS.REQUEST_FOR_TECHNICAL_STEPS);

  const whatYouImplemented = resolveInterviewContext({
    questionRaw: "Walk me through exactly what you implemented for JML."
  });
  assert.strictEqual(whatYouImplemented.answerScope, "EXPERIENCE_DEEP_DIVE");

  const takeMeThroughBuilt = resolveInterviewContext({
    questionRaw: "Take me through what you configured in IAG."
  });
  assert.strictEqual(takeMeThroughBuilt.answerScope, "EXPERIENCE_DEEP_DIVE");
}

// HOW + diagnostic procedure is investigation without a symptom clause, and is not a
// realization walkthrough. The verb class is diagnostic, not a product name.
for (const questionRaw of [
  "How would you troubleshoot an authorization failure?",
  "How would you troubleshoot an IPS issue?",
  "How would you troubleshoot a synchronization problem?",
  "How would you troubleshoot a login problem?",
  "Walk me through diagnosing a Cloud Connector outage."
]) {
  const diagnosticHow = resolveInterviewContext({ questionRaw });
  assert.strictEqual(diagnosticHow.answerScope, "STAGE_INVESTIGATION", questionRaw);
  assert.notStrictEqual(diagnosticHow.answerScope, "IMPLEMENTATION_WALKTHROUGH", questionRaw);
}

for (const questionRaw of [
  "How would you design the role?",
  "How would you implement the role?"
]) {
  const notDiagnostic = resolveInterviewContext({ questionRaw });
  assert.notStrictEqual(notDiagnostic.answerScope, "STAGE_INVESTIGATION", questionRaw);
}

const schedulePressure = resolveInterviewContext({
  questionRaw: "We are two weeks behind during hypercare. How would you handle this?"
});
assert.notStrictEqual(schedulePressure.answerScope, "STAGE_INVESTIGATION");
assert.notStrictEqual(schedulePressure.answerScope, "IMPLEMENTATION_WALKTHROUGH");

const technicalHypercare = resolveInterviewContext({
  questionRaw: "How would you troubleshoot a production issue during hypercare?"
});
assert.strictEqual(technicalHypercare.answerScope, "STAGE_INVESTIGATION");

console.log("interviewContextAssert: PASS");
