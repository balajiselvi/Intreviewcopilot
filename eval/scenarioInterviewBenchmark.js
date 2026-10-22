/**
 * Scenario-Based Interview Benchmark (design artifact; no production wiring).
 *
 * Source of interviewer flow: forensic session live_mttq3q5r_zmzcvfyw
 * (report: InterviewCopilot-forensics/live_mttq3q5r_zmzcvfyw-forensic-report.md).
 * Candidate spoken answers were not captured. Cases judge interviewer
 * question flow + required copilot behavior, not the candidate.
 *
 * Production scenario APIs do not exist yet. This file:
 * 1. Locks the intended case contract.
 * 2. Asserts current-engine facts that Scenario Mode must preserve.
 * 3. Documents gaps (no scenarioMode / scenarioStep on resolveInterviewContext).
 *
 * Do not treat SCENARIO_DESCRIPTION in interviewContext.js as Scenario Mode.
 * That intent is a keyword leftover; it is not a state machine.
 */
const assert = require("assert");
const {
  QUESTION_INTENTS,
  isClearlyIncompleteFragment,
  isTruncatedScenarioSetup,
  resolveInterviewContext,
  toHistoryContext
} = require("../lib/interviewContext");

const SCENARIO_MODES = Object.freeze(["NONE", "ACTIVE", "COMPLETED"]);
const SCENARIO_TYPES = Object.freeze([
  "SOD_INVESTIGATION",
  "TROUBLESHOOTING",
  "ROLE_DESIGN",
  "FIORI_DESIGN",
  "DISPLAY_ONLY",
  "SAC_SECURITY",
  "IAM_LIFECYCLE",
  "HYBRID_ARCHITECTURE",
  "MIGRATION",
  "OTHER"
]);
const SCENARIO_STEPS = Object.freeze([
  "UNDERSTAND_PROBLEM",
  "IDENTIFY_SCOPE",
  "IDENTIFY_EVIDENCE",
  "DIAGNOSE",
  "VALIDATE",
  "IDENTIFY_EXACT_CONTROL",
  "REMEDIATE",
  "RETEST",
  "GOVERNANCE"
]);
const EXPERIENCE_MODES = Object.freeze([
  "HYPOTHETICAL",
  "DOCUMENTED_EXPERIENCE",
  "EXPERIENCE_BACKED_EXAMPLE",
  "EXPERIENCE_CLAIM_GATED"
]);

const FORENSIC = Object.freeze({
  sessionId: "live_mttq3q5r_zmzcvfyw",
  note: "ASR is noisy. Labels below are interviewer intent recovered from attempts, not invented generic SAP drills.",
  chains: {
    A_SOD_IAG: {
      attempts: [6, 7, 25, 28, 33, 35, 38, 41, 47, 49, 50, 52, 53, 54, 94, 95, 96, 97],
      pattern: [
        "ruleset/false-positive landscape",
        "detailed SoD report / IAG Excel extract",
        "identify conflict / rule / role / object / value",
        "genuine vs false positive",
        "remediation",
        "rerun"
      ]
    },
    B_FIORI_SUSTAINABLE: {
      attempts: [5, 63, 64, 70, 73, 74],
      pattern: ["deviated Fiori app / Manage Purchase Order", "catalog change risk", "sustainable design", "no manual override"]
    },
    C_DISPLAY_ONLY: {
      attempts: [5, 61, 82, 83],
      pattern: ["display-only Fiori access", "sustainable design", "not override standard permissions"]
    },
    D_ROLE_ARCHITECTURE: {
      attempts: [3, 4, 59, 89, 90],
      pattern: ["business-role / theory-first design", "master derived composite", "engagement design follow-up"]
    },
    E_SAC: {
      attempts: [11, 87, 91, 93],
      pattern: ["SAC folders/content vs BTP role collections", "what is the SAC design"]
    },
    F_HYBRID_IAM: {
      attempts: [8, 9, 11, 31],
      pattern: ["IAG configured except JML", "IAS/IPS vs IAG reporting", "hybrid Fiori/SAC/IAG/IAS/IPS"]
    },
    G_ROOT_CAUSE: {
      attempts: [12, 23, 40],
      pattern: ["find the problem then the solution", "root cause before action"]
    }
  }
});

function turn(role, content, extra = {}) {
  return { role, content, ...extra };
}

function sodHistory(steps) {
  const history = [];
  for (const [index, questionRaw] of steps.entries()) {
    const context = resolveInterviewContext({ questionRaw, history, source: "benchmark" });
    history.push(turn("user", questionRaw, { context: toHistoryContext(context), questionId: `b${index}` }));
    history.push(turn("assistant", `answer-${index}`, { context: toHistoryContext(context) }));
  }
  return history;
}

const CASES = Object.freeze([
  {
    id: "TEST_1",
    forensicAttempts: [41, 47],
    scenarioType: "SOD_INVESTIGATION",
    initialUtterance: "You find an SoD conflict in a business role. What would you do?",
    followUps: [],
    expectedIntent: "SCENARIO_ENTRY",
    expectedScenarioState: "ACTIVE",
    expectedScenarioStep: "UNDERSTAND_PROBLEM",
    expectedAnswerTarget: "You find an SoD conflict in a business role. What would you do?",
    expectedProductBoundary: "GRC",
    expectedExperienceMode: "HYPOTHETICAL",
    expectedEvidenceBehavior: "no invented objects/values",
    forbiddenBehaviors: ["generic SoD definition", "IAS/IPS lecture", "PFCG inventory"]
  },
  {
    id: "TEST_2",
    forensicAttempts: [49, 94],
    scenarioType: "SOD_INVESTIGATION",
    initialUtterance: "You find an SoD conflict in a business role. What would you do?",
    followUps: ["How do you identify the role?"],
    expectedIntent: "FOLLOW_UP",
    expectedScenarioState: "ACTIVE",
    expectedScenarioStep: "IDENTIFY_SCOPE",
    expectedAnswerTarget: "How do you identify the role?",
    expectedProductBoundary: "GRC",
    expectedExperienceMode: "HYPOTHETICAL",
    expectedEvidenceBehavior: "role identification from IAG/Excel/AGR evidence, no invented role name",
    forbiddenBehaviors: ["reset to SoD definition", "skip to remediation"]
  },
  {
    id: "TEST_3",
    forensicAttempts: [49, 50],
    scenarioType: "SOD_INVESTIGATION",
    initialUtterance: "You find an SoD conflict in a business role. What would you do?",
    followUps: ["How do you identify the role?", "What object?"],
    expectedIntent: "FRAGMENT",
    expectedScenarioState: "ACTIVE",
    expectedScenarioStep: "IDENTIFY_EXACT_CONTROL",
    expectedAnswerTargetIncludes: "No actual object is supplied",
    expectedProductBoundary: "GRC",
    expectedExperienceMode: "HYPOTHETICAL",
    expectedEvidenceBehavior: "authorization-object identification method; no invented object as this-case fact",
    forbiddenBehaviors: ["Excel how-to restart", "business-value interpretation"]
  },
  {
    id: "TEST_4",
    forensicAttempts: [38, 53],
    scenarioType: "SOD_INVESTIGATION",
    initialUtterance: "You find an SoD conflict in a business role. What would you do?",
    followUps: ["How do you identify the role?", "What object?", "What value?"],
    expectedIntent: "FOLLOW_UP",
    expectedScenarioState: "ACTIVE",
    expectedScenarioStep: "IDENTIFY_EXACT_CONTROL",
    expectedAnswerTargetIncludes: "No actual field value is supplied",
    expectedProductBoundary: "GRC",
    expectedExperienceMode: "HYPOTHETICAL",
    expectedEvidenceBehavior: "trace method only; do not invent ACTVT 01/02/03",
    forbiddenBehaviors: ["ACTVT 01 as the case", "vendor invoice example as this case", "ROI value"]
  },
  {
    id: "TEST_5",
    forensicAttempts: [52, 53],
    scenarioType: "SOD_INVESTIGATION",
    initialUtterance: "You find an SoD conflict in a business role. What would you do?",
    followUps: ["How do you know the conflict is genuine?"],
    expectedIntent: "REQUEST_FOR_VALIDATION",
    expectedScenarioState: "ACTIVE",
    expectedScenarioStep: "VALIDATE",
    expectedAnswerTarget: "How do you know the conflict is genuine?",
    expectedProductBoundary: "GRC",
    expectedExperienceMode: "HYPOTHETICAL",
    expectedEvidenceBehavior: "validation/evidence; not remediation",
    forbiddenBehaviors: ["PFCG redesign first", "Excel export lecture"]
  },
  {
    id: "TEST_6",
    forensicAttempts: [54, 95],
    scenarioType: "SOD_INVESTIGATION",
    initialUtterance: "You find an SoD conflict in a business role. What would you do?",
    followUps: ["How do you fix it?"],
    expectedIntent: "REQUEST_FOR_REMEDIATION",
    expectedScenarioState: "ACTIVE",
    expectedScenarioStep: "REMEDIATE",
    expectedAnswerTarget: "How do you fix it?",
    expectedProductBoundary: "GRC",
    expectedExperienceMode: "HYPOTHETICAL",
    expectedEvidenceBehavior: "remediation after identified conflict",
    forbiddenBehaviors: ["repeat validation theory as the whole answer"]
  },
  {
    id: "TEST_7",
    forensicAttempts: [96, 97],
    scenarioType: "SOD_INVESTIGATION",
    initialUtterance: "You find an SoD conflict in a business role. What would you do?",
    followUps: ["How do you fix it?", "How do you validate after fixing?"],
    expectedIntent: "REQUEST_FOR_VALIDATION",
    expectedScenarioState: "ACTIVE",
    expectedScenarioStep: "RETEST",
    expectedAnswerTarget: "How do you validate after fixing?",
    expectedProductBoundary: "GRC",
    expectedExperienceMode: "HYPOTHETICAL",
    expectedEvidenceBehavior: "rerun analysis / regression",
    forbiddenBehaviors: ["restart Excel identification"]
  },
  {
    id: "TEST_8",
    forensicAttempts: [72, 84],
    scenarioType: "SOD_INVESTIGATION",
    initialUtterance: "You find an SoD conflict in a business role. What would you do?",
    followUps: ["No, I mean technically how do you find it?"],
    expectedIntent: "CORRECTION",
    expectedScenarioState: "ACTIVE",
    expectedScenarioStep: "IDENTIFY_EVIDENCE",
    expectedAnswerTarget: "No, I mean technically how do you find it?",
    expectedProductBoundary: "GRC",
    expectedExperienceMode: "HYPOTHETICAL",
    expectedEvidenceBehavior: "technical depth escalation",
    forbiddenBehaviors: ["repeat rejected generic explanation"]
  },
  {
    id: "TEST_9",
    forensicAttempts: [50],
    scenarioType: "SOD_INVESTIGATION",
    initialUtterance: "After exporting the SoD results into Excel, how do you validate the conflict?",
    followUps: ["What value?"],
    expectedIntent: "FOLLOW_UP",
    expectedScenarioState: "ACTIVE",
    expectedScenarioStep: "IDENTIFY_EXACT_CONTROL",
    expectedAnswerTargetIncludes: "No actual field value is supplied",
    expectedProductBoundary: "GRC",
    expectedExperienceMode: "HYPOTHETICAL",
    expectedEvidenceBehavior: "inherit Excel/SoD chain",
    forbiddenBehaviors: ["standalone value question", "scenario reset"]
  },
  {
    id: "TEST_10",
    forensicAttempts: [12, 23],
    scenarioType: "TROUBLESHOOTING",
    initialUtterance: "A user cannot access a Fiori application. What would you do?",
    followUps: [],
    expectedIntent: "SCENARIO_ENTRY",
    expectedScenarioState: "ACTIVE",
    expectedScenarioStep: "UNDERSTAND_PROBLEM",
    expectedAnswerTarget: "A user cannot access a Fiori application. What would you do?",
    expectedProductBoundary: "Fiori",
    expectedExperienceMode: "HYPOTHETICAL",
    expectedEvidenceBehavior: "reproduce before changing the role",
    forbiddenBehaviors: ["immediate PFCG change", "GRC SoD lecture"]
  },
  {
    id: "TEST_11",
    forensicAttempts: [64],
    scenarioType: "FIORI_DESIGN",
    initialUtterance: "You are using Manage Purchase Order in a non-standard way. How would you design it sustainably?",
    followUps: ["Would you manually add the authorization?"],
    expectedIntent: "FOLLOW_UP",
    expectedScenarioState: "ACTIVE",
    expectedScenarioStep: "GOVERNANCE",
    expectedAnswerTarget: "Would you manually add the authorization?",
    expectedProductBoundary: "Fiori",
    expectedExperienceMode: "HYPOTHETICAL",
    expectedEvidenceBehavior: "reject fragile manual override; catalog/target-mapping/backend alignment",
    forbiddenBehaviors: ["yes add ACTVT in PFCG as the design"]
  },
  {
    id: "TEST_12",
    forensicAttempts: [82, 83],
    scenarioType: "DISPLAY_ONLY",
    initialUtterance: "Business wants display-only access to this Fiori app. How would you design it sustainably?",
    followUps: [],
    expectedIntent: "SCENARIO_ENTRY",
    expectedScenarioState: "ACTIVE",
    expectedScenarioStep: "UNDERSTAND_PROBLEM",
    expectedAnswerTarget: "Business wants display-only access to this Fiori app. How would you design it sustainably?",
    expectedProductBoundary: "Fiori",
    expectedExperienceMode: "HYPOTHETICAL",
    expectedEvidenceBehavior: "content + service + backend restriction; not permission override as the default",
    forbiddenBehaviors: ["override standard Fiori permissions as the solution"]
  },
  {
    id: "TEST_13",
    forensicAttempts: [73, 74],
    scenarioType: "FIORI_DESIGN",
    initialUtterance: "We need to use Manage Purchase Order in a deviated, not default, format. Give me a sustainable design.",
    followUps: ["What happens when the standard Fiori catalog changes?"],
    expectedIntent: "FOLLOW_UP",
    expectedScenarioState: "ACTIVE",
    expectedScenarioStep: "GOVERNANCE",
    expectedAnswerTarget: "What happens when the standard Fiori catalog changes?",
    expectedProductBoundary: "Fiori",
    expectedExperienceMode: "HYPOTHETICAL",
    expectedEvidenceBehavior: "catalog lifecycle first",
    forbiddenBehaviors: ["open with GRC/SoD"]
  },
  {
    id: "TEST_14",
    forensicAttempts: [93],
    scenarioType: "SAC_SECURITY",
    initialUtterance: "What is the design you use for SAC?",
    followUps: ["How do you?"],
    expectedIntent: "FRAGMENT",
    expectedScenarioState: "ACTIVE",
    expectedScenarioStep: "IDENTIFY_SCOPE",
    expectedAnswerTarget: "How do you?",
    expectedProductBoundary: "SAC",
    expectedExperienceMode: "HYPOTHETICAL",
    expectedEvidenceBehavior: "SAC teams/content/data; not S/4 PFCG as content authorization",
    forbiddenBehaviors: ["PFCG as SAC security", "GRC ruleset as SAC model security"]
  },
  {
    id: "TEST_15",
    forensicAttempts: [24, 41, 90],
    scenarioType: "ROLE_DESIGN",
    initialUtterance: "Role architecture: master, derived, composite. How did you design it in an engagement?",
    followUps: ["Give me an example from your project."],
    expectedIntent: "REQUEST_FOR_EXAMPLE",
    expectedScenarioState: "ACTIVE",
    expectedScenarioStep: "IDENTIFY_SCOPE",
    expectedAnswerTarget: "Give me an example from your project.",
    expectedProductBoundary: "Authorization",
    expectedExperienceMode: "EXPERIENCE_BACKED_EXAMPLE",
    expectedEvidenceBehavior: "CV-supported only; no extra metrics",
    forbiddenBehaviors: ["invent Dover 2400 if not answering a GRC-SoD documented claim in-scope", "convert hypothetical scenario into a STAR story"]
  },
  {
    id: "TEST_16",
    forensicAttempts: [22, 90],
    scenarioType: "SOD_INVESTIGATION",
    initialUtterance: "You find an SoD conflict in a business role. What would you do?",
    followUps: ["Have you actually implemented this?"],
    expectedIntent: "REQUEST_FOR_EXPERIENCE",
    expectedScenarioState: "ACTIVE",
    expectedScenarioStep: "UNDERSTAND_PROBLEM",
    expectedAnswerTarget: "Have you actually implemented this?",
    expectedProductBoundary: "GRC",
    expectedExperienceMode: "EXPERIENCE_CLAIM_GATED",
    expectedEvidenceBehavior: "claim only CV-supported implementation",
    forbiddenBehaviors: ["unconditional Dover story"]
  },
  {
    id: "TEST_E2E_FORENSIC",
    forensicAttempts: [6, 25, 28, 49, 53, 54, 58, 59, 73, 82, 89, 93],
    scenarioType: "HYBRID_ARCHITECTURE",
    initialUtterance: "How do you identify SoD conflicts in the roles?",
    followUps: [
      "Can IAG give a detailed SoD report for the business role, including permissions?",
      "After exporting the SoD results into Excel, how do you validate the conflict?",
      "How do you identify the rule?",
      "Which role?",
      "What object?",
      "What value?",
      "How do you know the conflict is genuine?",
      "How do you fix it?",
      "IAG only shows the violation. How do you find the actual authorization?",
      "Let's move to role design.",
      "Would you manually override the authorization?",
      "Give me a sustainable design for using Manage Purchase Order in a non-default format.",
      "Users need this app in display-only mode, sustainably.",
      "Role architecture: master, derived, composite. How is it in SAC?",
      "What is the design you use for SAC?"
    ],
    expectedIntent: "SCENARIO_TRANSITION",
    expectedScenarioState: "ACTIVE",
    expectedScenarioStep: "IDENTIFY_SCOPE",
    expectedAnswerTarget: "What is the design you use for SAC?",
    expectedProductBoundary: "SAC",
    expectedExperienceMode: "HYPOTHETICAL",
    expectedEvidenceBehavior: "final turn is SAC; prior SoD scenario may complete; do not keep answering Excel/SoD",
    forbiddenBehaviors: ["SoD Excel restart on SAC question", "PFCG as SAC content model"]
  },
  {
    id: "TEST_INCOMPLETE_UTTERANCE",
    forensicAttempts: [2, 4, 10, 13, 65],
    scenarioType: "OTHER",
    initialUtterance: "And we have SAP IAG as the access governance role. We are in the situation wherein let's say some design work has been done on roles and authorization, which is 60% good, 40% not good. When I say not good, it could be.",
    followUps: [],
    expectedIntent: "INCOMPLETE_UTTERANCE",
    expectedScenarioState: "NONE",
    expectedScenarioStep: "UNDERSTAND_PROBLEM",
    expectedAnswerTarget: "And we have SAP IAG as the access governance role. We are in the situation wherein let's say some design work has been done on roles and authorization, which is 60% good, 40% not good. When I say not good, it could be.",
    expectedProductBoundary: "IAG",
    expectedExperienceMode: "HYPOTHETICAL",
    expectedEvidenceBehavior: "hold or clarify; do not answer a truncated clause as a complete scenario",
    forbiddenBehaviors: ["invent the missing 40% issues", "answer as if the question finished"]
  }
]);

function assertCaseContract(item) {
  assert.ok(item.id, "case id");
  assert.ok(Array.isArray(item.forensicAttempts) && item.forensicAttempts.length, item.id);
  assert.ok(SCENARIO_TYPES.includes(item.scenarioType), item.id);
  assert.ok(item.initialUtterance, item.id);
  assert.ok(Array.isArray(item.followUps), item.id);
  assert.ok(SCENARIO_MODES.includes(item.expectedScenarioState), item.id);
  assert.ok(SCENARIO_STEPS.includes(item.expectedScenarioStep), item.id);
  assert.ok(item.expectedAnswerTarget || item.expectedAnswerTargetIncludes, item.id);
  assert.ok(item.expectedProductBoundary, item.id);
  assert.ok(EXPERIENCE_MODES.includes(item.expectedExperienceMode), item.id);
  assert.ok(item.expectedEvidenceBehavior, item.id);
  assert.ok(Array.isArray(item.forbiddenBehaviors) && item.forbiddenBehaviors.length, item.id);
}

function playCase(item) {
  const history = [];
  let ctx = null;
  const utterances = [item.initialUtterance, ...item.followUps];
  for (const [index, questionRaw] of utterances.entries()) {
    ctx = resolveInterviewContext({ questionRaw, history, source: "benchmark" });
    history.push(turn("user", questionRaw, { context: toHistoryContext(ctx), questionId: `${item.id}-${index}` }));
    history.push(turn("assistant", `answer-${index}`, { context: toHistoryContext(ctx) }));
  }
  return ctx;
}

function assertPlayedCase(item) {
  const ctx = playCase(item);
  assert.strictEqual(ctx.scenarioMode, item.expectedScenarioState, `${item.id} scenarioMode`);
  if (item.expectedIntent === "SCENARIO_TRANSITION") {
    assert.strictEqual(ctx.scenarioType, "SAC_SECURITY", `${item.id} last-turn type`);
    assert.strictEqual(ctx.questionTopic, "SAC", `${item.id} last-turn topic`);
    assert.doesNotMatch(ctx.questionResolved, /Excel/i, `${item.id} no SoD recap on SAC`);
  } else if (item.expectedScenarioState === "ACTIVE") {
    assert.strictEqual(ctx.scenarioType, item.scenarioType, `${item.id} scenarioType`);
    assert.strictEqual(ctx.step, item.expectedScenarioStep, `${item.id} step`);
    assert.ok(ctx.scenarioId, `${item.id} scenarioId`);
  }
  if (item.expectedAnswerTarget) {
    assert.strictEqual(ctx.answerTarget, item.expectedAnswerTarget, `${item.id} answerTarget`);
  }
  if (item.expectedAnswerTargetIncludes) {
    assert.match(ctx.answerTarget, new RegExp(item.expectedAnswerTargetIncludes.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${item.id} answerTargetIncludes`);
  }
  assert.strictEqual(ctx.questionTopic, item.expectedProductBoundary, `${item.id} topic`);
  assert.strictEqual(ctx.experienceMode, item.expectedExperienceMode, `${item.id} experienceMode`);
  if (item.expectedIntent === "SCENARIO_ENTRY" || item.expectedIntent === "SCENARIO_TRANSITION") {
    assert.strictEqual(ctx.scenarioMode, "ACTIVE", `${item.id} entry/transition active`);
  } else if (item.expectedIntent === "INCOMPLETE_UTTERANCE") {
    assert.strictEqual(ctx.incompleteUtterance, true, `${item.id} incompleteUtterance`);
    assert.strictEqual(ctx.retrievalDecision, "clarify", `${item.id} clarify`);
    assert.strictEqual(ctx.scenarioMode, "NONE", `${item.id} no scenario on truncated setup`);
  } else {
    assert.strictEqual(ctx.questionIntent, item.expectedIntent, `${item.id} intent`);
  }
  if (/No actual field value is supplied/.test(ctx.answerTarget || "")) {
    assert.ok(ctx.evidence.missing.includes("authorization field value"), `${item.id} missing field value`);
    const blob = JSON.stringify(ctx.evidence);
    assert.doesNotMatch(blob, /ACTVT\s*0[123]/i, `${item.id} no fabricated ACTVT`);
    assert.doesNotMatch(blob, /S_TABU_NAM/i, `${item.id} no fabricated S_TABU_NAM`);
  }
  if (/No actual object is supplied/.test(ctx.answerTarget || "")) {
    assert.ok(ctx.evidence.missing.includes("authorization object"), `${item.id} missing authorization object`);
    assert.notStrictEqual(ctx.answerTarget, "What object?", `${item.id} object guard`);
  }
}

function assertCurrentEnginePreservesTargeting() {
  const history = sodHistory([
    "After exporting the SoD results into Excel, how do you validate the conflict?",
    "Is the conflict genuine?",
    "How do you fix it?"
  ]);
  const whatValue = resolveInterviewContext({ questionRaw: "What value?", history });
  assert.strictEqual(whatValue.questionRaw, "What value?");
  assert.match(whatValue.questionResolved, /Excel/i);
  assert.match(whatValue.answerTarget, /No actual field value is supplied/);
  assert.strictEqual(whatValue.questionTopic, "GRC");
  assert.notStrictEqual(whatValue.answerTarget, whatValue.questionRaw);
  assert.strictEqual(whatValue.scenarioMode, "ACTIVE");
  assert.strictEqual(whatValue.scenarioType, "SOD_INVESTIGATION");
  assert.strictEqual(whatValue.step, "IDENTIFY_EXACT_CONTROL");
  assert.ok(whatValue.evidence.missing.includes("authorization field value"));

  const whatObject = resolveInterviewContext({ questionRaw: "What object?", history });
  assert.strictEqual(whatObject.questionRaw, "What object?");
  assert.strictEqual(whatObject.questionIntent, QUESTION_INTENTS.FRAGMENT);
  assert.match(whatObject.answerTarget, /No actual object is supplied/);
  assert.ok(whatObject.evidence.missing.includes("authorization object"));
  assert.notStrictEqual(whatObject.depth, "brief", "active-scenario fragment must not use acknowledgement token budget");

  const isolatedObject = resolveInterviewContext({ questionRaw: "What object?", history: [] });
  assert.strictEqual(isolatedObject.questionIntent, QUESTION_INTENTS.FRAGMENT);
  assert.strictEqual(isolatedObject.scenarioMode, "NONE");
  assert.strictEqual(isolatedObject.depth, "brief");

  const genuine = resolveInterviewContext({
    questionRaw: "How do you know the conflict is genuine?",
    history: sodHistory(["After exporting the SoD results into Excel, how do you validate the conflict?"])
  });
  assert.strictEqual(genuine.questionRaw, "How do you know the conflict is genuine?");
  assert.match(genuine.questionResolved, /Excel/i);
  assert.match(genuine.interviewerObjective, /genuine/i);
  assert.strictEqual(genuine.step, "VALIDATE");

  const sac = resolveInterviewContext({
    questionRaw: "How do you?",
    history: [
      turn("user", "What is the design you use for SAC?", {
        context: toHistoryContext(resolveInterviewContext({ questionRaw: "What is the design you use for SAC?" }))
      }),
      turn("assistant", "I separate SAC authentication, teams, and data access.")
    ]
  });
  assert.strictEqual(sac.questionTopic, "SAC");
  assert.doesNotMatch(sac.questionResolved, /\bGRC\b/);
}

function assertConceptualIsNotScenario() {
  const ctx = resolveInterviewContext({ questionRaw: "What is SoD?", history: [] });
  assert.strictEqual(ctx.scenarioMode, "NONE");
  assert.strictEqual(ctx.questionTopic, "GRC");
  assert.notStrictEqual(ctx.questionIntent, QUESTION_INTENTS.SCENARIO_DESCRIPTION);
}

function assertTopicChangeClosesScenario() {
  const history = sodHistory(["You find an SoD conflict in a business role. What would you do?"]);
  const moved = resolveInterviewContext({
    questionRaw: "Let's move to another topic. What is the design you use for SAC?",
    history
  });
  assert.strictEqual(moved.questionTopic, "SAC");
  assert.strictEqual(moved.scenarioType, "SAC_SECURITY");
  assert.strictEqual(moved.scenarioMode, "ACTIVE");
  assert.ok(moved.completedSteps.length >= 1 || moved.problem.match(/SAC/i));
  assert.ok(!(moved.evidence?.confirmed || []).some((item) => /SoD/i.test(item)), "topic change must not carry SoD evidence");
}

function assertTruncatedSetup() {
  const truncated = "And we have SAP IAG as the access governance role. We are in the situation wherein let's say some design work has been done on roles and authorization, which is 60% good, 40% not good. When I say not good, it could be.";
  assert.strictEqual(isClearlyIncompleteFragment(truncated), false);
  assert.strictEqual(isTruncatedScenarioSetup(truncated, {}), true);
  const short = "How do you?";
  assert.strictEqual(isClearlyIncompleteFragment(short), true);
  assert.strictEqual(isTruncatedScenarioSetup(short, { activeMode: "ACTIVE", intent: QUESTION_INTENTS.FRAGMENT }), false);
  const hanging = "Now there are certain things which.";
  assert.strictEqual(isClearlyIncompleteFragment(hanging), false);
  assert.strictEqual(isTruncatedScenarioSetup(hanging, { activeMode: "ACTIVE", intent: QUESTION_INTENTS.FOLLOW_UP }), true);
}

function assertE2EWaypoints() {
  const item = CASES.find((entry) => entry.id === "TEST_E2E_FORENSIC");
  const history = [];
  const seen = [];
  for (const [index, questionRaw] of [item.initialUtterance, ...item.followUps].entries()) {
    const ctx = resolveInterviewContext({ questionRaw, history, source: "benchmark" });
    seen.push({ questionRaw, mode: ctx.scenarioMode, type: ctx.scenarioType, topic: ctx.questionTopic, step: ctx.step });
    history.push(turn("user", questionRaw, { context: toHistoryContext(ctx), questionId: `e2e-${index}` }));
    history.push(turn("assistant", `a${index}`, { context: toHistoryContext(ctx) }));
  }
  const valueTurn = seen.find((row) => row.questionRaw === "What value?");
  assert.strictEqual(valueTurn.type, "SOD_INVESTIGATION");
  assert.strictEqual(valueTurn.step, "IDENTIFY_EXACT_CONTROL");
  const move = seen.find((row) => /Let's move to role design/i.test(row.questionRaw));
  assert.ok(move.type === "ROLE_DESIGN" || move.mode === "COMPLETED" || move.mode === "ACTIVE");
  const last = seen[seen.length - 1];
  assert.strictEqual(last.type, "SAC_SECURITY");
  assert.strictEqual(last.topic, "SAC");
  assert.strictEqual(last.mode, "ACTIVE");
}

function assertForensicCoverage() {
  const labeled = new Set(CASES.flatMap((item) => item.forensicAttempts));
  for (const attempt of [25, 28, 50, 53, 54, 73, 82, 90, 93, 95]) {
    assert.ok(labeled.has(attempt), `forensic attempt ${attempt} must appear on a case`);
  }
}

CASES.forEach(assertCaseContract);
assert.strictEqual(CASES.length >= 17, true);
assertCurrentEnginePreservesTargeting();
assertConceptualIsNotScenario();
assertTopicChangeClosesScenario();
assertTruncatedSetup();
assertForensicCoverage();
assertE2EWaypoints();
CASES.forEach(assertPlayedCase);

module.exports = {
  CASES,
  EXPERIENCE_MODES,
  FORENSIC,
  SCENARIO_MODES,
  SCENARIO_STEPS,
  SCENARIO_TYPES
};

if (require.main === module) {
  console.log("scenarioInterviewBenchmark: PASS");
  console.log(`cases=${CASES.length} forensicSession=${FORENSIC.sessionId}`);
}
