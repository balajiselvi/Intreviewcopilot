/**
 * Fresh unseen response-mode battery. None of these strings were used to implement
 * interviewContext / answerScope rules. Routing-only: no LLM.
 *
 * Expected values map to CURRENT engine fields (answerScope, questionIntent, scenarioMode),
 * not to a wish-list of new enums.
 */
const { resolveInterviewContext, QUESTION_INTENTS } = require("../lib/interviewContext");

function ctx(question, history = []) {
  return resolveInterviewContext({ questionRaw: question, history });
}

function turn(role, content, extra = {}) {
  return { role, content, ...extra };
}

const failures = [];
function check(name, got, pred, detail) {
  const ok = typeof pred === "function" ? pred(got) : pred;
  if (!ok) failures.push({ name, detail: detail || JSON.stringify(got) });
}

// --- CONCEPT / SIMPLE FACTUAL (unseen paraphrases) ---
[
  "What exactly is SoD?",
  "Explain SoD.",
  "How would you describe SoD?",
  "What is a Fiori catalog?",
  "Define IAG in one sentence.",
  "What does IPS actually do?",
  "What is Cloud Connector used for?",
  "What's Datasphere?",
  "What is a RAID log?"
].forEach((q) => {
  const c = ctx(q);
  check(`concept-not-impl ${q}`, c, c.answerScope !== "IMPLEMENTATION_WALKTHROUGH"
    && c.answerScope !== "EXPERIENCE_CONFIRMATION"
    && c.answerScope !== "EXPERIENCE_DEEP_DIVE",
    `${c.answerScope} ${c.questionIntent}`);
});
// --- IDENTIFY / UNDERSTAND (investigative, not fix) ---
{
  const history = [
    turn("user", "A business user can post and also approve the same invoice. I need you to find the real SoD conflict."),
    turn("assistant", "I would start from the risk and work down to the permission that actually enables both sides.", { context: null })
  ];
  const first = ctx(history[0].content);
  history[1].context = first;
  const which = ctx("Which control actually allows both sides?", history);
  check("identify-fragment-or-followup", which, which.questionIntent === QUESTION_INTENTS.FOLLOW_UP
    || which.questionIntent === QUESTION_INTENTS.FRAGMENT
    || which.questionIntent === QUESTION_INTENTS.REQUEST_FOR_VALIDATION,
    which.questionIntent);
  check("identify-not-impl", which, which.answerScope !== "IMPLEMENTATION_WALKTHROUGH", which.answerScope);
  const establish = ctx("What would you establish first before naming a cause?", history);
  check("understand-not-remediation", establish, establish.questionIntent !== QUESTION_INTENTS.REQUEST_FOR_REMEDIATION, establish.questionIntent);
}

// --- TROUBLESHOOT vs IMPLEMENT (HOW collision) ---
const troubleshootQs = [
  "How would you troubleshoot a Fiori tile?",
  "How would you diagnose a launchpad tile that will not open?",
  "Walk me through investigating an IPS job that stopped creating users.",
  "Users can see the SAC story but the data never loads. How do you approach that?",
  "IAS authentication fails after the certificate rotation. What do you look at first?"
];
for (const q of troubleshootQs) {
  const c = ctx(q);
  check(`troubleshoot-not-walkthrough ${q}`, c, c.answerScope !== "IMPLEMENTATION_WALKTHROUGH",
    `${c.answerScope} ${c.questionIntent} step=${c.scenario?.step || c.step}`);
}

// --- IMPLEMENTATION (fresh products / paraphrases) ---
const implQs = [
  "How would you stand up a new IPS source system for SuccessFactors?",
  "Take me through enabling a custom OData service for a Fiori app.",
  "How do you actually wire Cloud Connector so a BTP app can reach the on-prem backend?",
  "What's the sequence for creating a derived role for a new company code?",
  "How would you switch on privileged access in IAG for a break-glass ID?"
];
for (const q of implQs) {
  const c = ctx(q);
  check(`impl-walkthrough ${q}`, c, c.answerScope === "IMPLEMENTATION_WALKTHROUGH"
    && c.questionIntent === QUESTION_INTENTS.REQUEST_FOR_TECHNICAL_STEPS,
    `${c.answerScope} ${c.questionIntent}`);
}

// Negative: concept / design neighbours of implementation
[
  ["What is an IPS source system?", (c) => c.answerScope !== "IMPLEMENTATION_WALKTHROUGH"],
  ["How would you design identity for a RISE move?", (c) => c.answerScope !== "IMPLEMENTATION_WALKTHROUGH"
    && c.questionIntent === QUESTION_INTENTS.REQUEST_FOR_ARCHITECTURE],
  ["How did you implement the IPS source system?", (c) => c.answerScope === "EXPERIENCE_DEEP_DIVE"
    || c.answerScope === "EXPERIENCE_CONFIRMATION"]
].forEach(([q, pred]) => {
  const c = ctx(q);
  check(`impl-neighbour ${q}`, c, pred(c), `${c.answerScope} ${c.questionIntent}`);
});

// --- REMEDIATE ---
{
  const history = [
    turn("user", "The tile is visible but will not launch."),
    turn("assistant", "I would first confirm whether the target mapping and the OData service are actually reachable.", { context: null })
  ];
  history[1].context = ctx(history[0].content);
  const fix = ctx("How would you fix that?", history);
  check("remediate-intent", fix, fix.questionIntent === QUESTION_INTENTS.REQUEST_FOR_REMEDIATION, fix.questionIntent);
  check("remediate-not-impl", fix, fix.answerScope !== "IMPLEMENTATION_WALKTHROUGH", fix.answerScope);
}

// --- DESIGN / ARCHITECTURE ---
[
  "How would you design the role model for a new plant?",
  "Walk me through the overall security architecture for RISE with S/4.",
  "How should identity boundaries sit between IAS, IPS and IAG?"
].forEach((q) => {
  const c = ctx(q);
  check(`arch-not-impl ${q}`, c, c.answerScope !== "IMPLEMENTATION_WALKTHROUGH", `${c.answerScope} ${c.questionIntent}`);
});

// --- EXPERIENCE confirmation vs deep dive ---
check("exp-confirm have you", ctx("Have you actually implemented IAG access analysis?"),
  (c) => c.answerScope === "EXPERIENCE_CONFIRMATION");
check("exp-confirm do you have", ctx("Do you have hands-on experience with Ariba procurement groups?"),
  (c) => c.answerScope === "EXPERIENCE_CONFIRMATION");
check("exp-dive how did you", ctx("How did you implement the catalog model at your last client?"),
  (c) => c.answerScope === "EXPERIENCE_DEEP_DIVE");
check("exp-dive walk me through your", ctx("Walk me through exactly what you implemented for JML."),
  (c) => c.answerScope === "EXPERIENCE_DEEP_DIVE");

// --- COMPARE ---
check("compare ias ips", ctx("How is IAS different from IPS?"),
  (c) => c.answerScope !== "IMPLEMENTATION_WALKTHROUGH" && c.answerScope !== "EXPERIENCE_CONFIRMATION");

// --- FOLLOW-UP / TOPIC CHANGE ---
{
  const history = [
    turn("user", "How would you design the role architecture for S/4?"),
    turn("assistant", "I would separate master and derived roles by org element.", { context: null })
  ];
  history[1].context = ctx(history[0].content);
  const follow = ctx("What about Fiori?", history);
  check("follow-up about fiori", follow, follow.questionIntent === QUESTION_INTENTS.FOLLOW_UP
    || follow.questionTopic === "Fiori", `${follow.questionIntent} ${follow.questionTopic}`);
  const change = ctx("Okay, moving to SAC security now.", history);
  check("topic-change sac", change, Boolean(change.topicChanged) || change.questionTopic === "SAC",
    `${change.topicChanged} ${change.questionTopic} ${change.questionIntent}`);
}

// --- ACTIVE vs ISOLATED fragment ---
{
  const isolated = ctx("Which object?");
  check("isolated-fragment", isolated, isolated.questionIntent === QUESTION_INTENTS.FRAGMENT
    || isolated.questionIntent === QUESTION_INTENTS.FOLLOW_UP, isolated.questionIntent);
  const history = [
    turn("user", "Find the authorization object causing the SoD conflict after the Excel export."),
    turn("assistant", "I would trace from the risk to the action to the object.", { context: null })
  ];
  history[1].context = ctx(history[0].content);
  const active = ctx("Which object?", history);
  check("active-fragment-inherits", active, active.scenarioMode === "ACTIVE" || /authorization object/i.test(active.questionResolved),
    `${active.scenarioMode} ${active.questionResolved}`);
}

// --- PMP / leadership (must not become implementation) ---
[
  "The steering committee wants to cut two weeks off hypercare. How do you handle that?",
  "Two workstream leads disagree on the cutover window. What do you do?",
  "How would you recover the RAID log after the PMO stopped updating it?"
].forEach((q) => {
  const c = ctx(q);
  check(`pmp-not-impl ${q}`, c, c.answerScope !== "IMPLEMENTATION_WALKTHROUGH", `${c.answerScope} ${c.questionIntent}`);
});

// --- HOW + TROUBLESHOOT vs HOW + IMPLEMENT (canonical collision pair) ---
check("how troubleshoot tile", ctx("How would you troubleshoot a Fiori tile?"),
  (c) => c.answerScope !== "IMPLEMENTATION_WALKTHROUGH");
check("how implement tile", ctx("How would you implement a Fiori tile?"),
  (c) => c.answerScope === "IMPLEMENTATION_WALKTHROUGH");
check("how did you implement tile", ctx("How did you implement a Fiori tile?"),
  (c) => c.answerScope === "EXPERIENCE_DEEP_DIVE" || c.answerScope === "EXPERIENCE_CONFIRMATION");
check("explain how tiles work", ctx("Can you explain how Fiori tiles work?"),
  (c) => c.answerScope !== "IMPLEMENTATION_WALKTHROUGH" && c.answerScope !== "EXPERIENCE_DEEP_DIVE");

// --- Hybrid technical + governance ---
check("hybrid sod governance", ctx("How would you govern SoD exceptions without blocking the go-live?"),
  (c) => c.answerScope !== "IMPLEMENTATION_WALKTHROUGH");

// Unseen diagnostic HOW paraphrases — different products and wording from the original Fiori tile case.
[
  "How would you troubleshoot a BW query that returns no data?",
  "Walk me through diagnosing a Cloud Connector outage.",
  "How would you investigate an IAG access request that never reaches the approver?"
].forEach((q) => {
  const c = ctx(q);
  check(`diagnostic-how-unseen ${q}`, c, c.answerScope === "STAGE_INVESTIGATION",
    `${c.answerScope} ${c.questionIntent}`);
});

if (failures.length) {
  console.log("responseModeFreshBattery: FAIL");
  for (const f of failures) console.log(`  - ${f.name}: ${f.detail}`);
  process.exitCode = 1;
} else {
  console.log("responseModeFreshBattery: PASS");
}
console.log(`cases_checked=${[
  "concept", "identify", "troubleshoot", "impl", "neighbours", "remediate", "arch",
  "experience", "compare", "follow-up", "fragment", "pmp", "collisions", "hybrid"
].length} failures=${failures.length}`);
