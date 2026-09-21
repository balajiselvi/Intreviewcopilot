/**
 * Deliberate semantic collisions. Winner is justified by intent class, not by product nouns.
 */
const { resolveInterviewContext, QUESTION_INTENTS, isDiagnosticHowRequest } = require("../lib/interviewContext");

const failures = [];
function check(name, pred, detail) {
  if (!pred) failures.push({ name, detail });
}

function ctx(q, history = []) {
  return resolveInterviewContext({ questionRaw: q, history });
}

const collisions = [
  {
    name: "HOW+IMPLEMENTATION",
    q: "How would you stand up a Datasphere space for finance?",
    why: "realization verb + procedure request",
    pred: (c) => c.answerScope === "IMPLEMENTATION_WALKTHROUGH"
  },
  {
    name: "HOW+TROUBLESHOOT",
    q: "How would you troubleshoot a BW query authorization miss?",
    why: "diagnostic procedure + HOW, not a realization sequence",
    pred: (c) => c.answerScope === "STAGE_INVESTIGATION"
  },
  {
    name: "HOW+DESIGN",
    q: "How would you design IAG privileged access for RISE?",
    why: "design verb outranks realization nouns",
    pred: (c) => c.answerScope !== "IMPLEMENTATION_WALKTHROUGH"
      && c.answerScope !== "STAGE_INVESTIGATION"
      && c.questionIntent === QUESTION_INTENTS.REQUEST_FOR_ARCHITECTURE
  },
  {
    name: "HOW+EXPERIENCE",
    q: "How did you implement JML at your last client?",
    why: "personal past delivery is experience, not a method walkthrough",
    pred: (c) => c.answerScope === "EXPERIENCE_DEEP_DIVE" || c.answerScope === "EXPERIENCE_CONFIRMATION"
  },
  {
    name: "WHAT+CONCEPT",
    q: "What is Cloud Connector used for in a BTP landscape?",
    why: "definition, not a procedure",
    pred: (c) => c.answerScope !== "IMPLEMENTATION_WALKTHROUGH"
  },
  {
    name: "WHAT+IDENTIFY",
    q: "What object would you look at first?",
    why: "identify/fragment, not remediation",
    pred: (c) => c.questionIntent !== QUESTION_INTENTS.REQUEST_FOR_REMEDIATION
      && c.answerScope !== "IMPLEMENTATION_WALKTHROUGH"
  },
  {
    name: "TECHNICAL+GOVERNANCE",
    q: "How would you govern SoD exceptions without blocking the go-live?",
    why: "governance of a technical control is not a config sequence",
    pred: (c) => c.answerScope !== "IMPLEMENTATION_WALKTHROUGH"
  },
  {
    name: "PROJECT+SAP VOCABULARY",
    q: "How would you manage a delayed hypercare milestone?",
    why: "project objective, not a system failure",
    pred: (c) => !isDiagnosticHowRequest(c.questionRaw) && c.answerScope !== "STAGE_INVESTIGATION"
  },
  {
    name: "TROUBLESHOOT+PRODUCTION PHASE",
    q: "How would you troubleshoot a production issue during hypercare?",
    why: "system failure inside a project phase stays technical",
    pred: (c) => isDiagnosticHowRequest(c.questionRaw) && c.answerScope === "STAGE_INVESTIGATION"
  },
  {
    name: "ARCHITECTURE+CLEANUP VOCABULARY",
    q: "How would you design a sustainable S/4 role model after rationalization?",
    why: "design verb keeps architecture even when cleanup vocabulary is present",
    pred: (c) => c.questionIntent === QUESTION_INTENTS.REQUEST_FOR_ARCHITECTURE
      && c.answerScope !== "STAGE_INVESTIGATION"
  },
  {
    name: "TROUBLESHOOT+IMPLEMENTATION words",
    q: "Walk me through investigating an IPS job that stopped creating users.",
    why: "diagnostic procedure owns the HOW; realization is in the symptom",
    pred: (c) => c.answerScope === "STAGE_INVESTIGATION"
  },
  {
    name: "CONCEPT+EXPERIENCE words",
    q: "Can you explain how IAG Access Analysis works?",
    why: "concept explain is not a have-you question",
    pred: (c) => c.answerScope !== "EXPERIENCE_CONFIRMATION"
      && c.answerScope !== "EXPERIENCE_DEEP_DIVE"
      && c.answerScope !== "IMPLEMENTATION_WALKTHROUGH"
  }
];

for (const row of collisions) {
  const c = ctx(row.q);
  check(row.name, row.pred(c), `${c.answerScope} ${c.questionIntent} :: ${row.why}`);
}

{
  const history = [
    { role: "user", content: "How would you design the role architecture for S/4?" },
    { role: "assistant", content: "I would separate master and derived roles by org element." }
  ];
  history[1].context = ctx(history[0].content);
  const follow = ctx("What about Fiori catalogs?", history);
  check("WHAT+FOLLOW-UP", follow.questionIntent === QUESTION_INTENTS.FOLLOW_UP
    || follow.questionTopic === "Fiori", `${follow.questionIntent} ${follow.questionTopic}`);
  const isolated = ctx("Which object?");
  check("WHAT+FRAGMENT isolated", isolated.questionIntent === QUESTION_INTENTS.FRAGMENT
    || isolated.questionIntent === QUESTION_INTENTS.FOLLOW_UP, isolated.questionIntent);
}

if (failures.length) {
  console.log("responseModeCollisionMatrix: FAIL");
  for (const f of failures) console.log(`  - ${f.name}: ${f.detail}`);
  process.exitCode = 1;
} else {
  console.log("responseModeCollisionMatrix: PASS");
}
