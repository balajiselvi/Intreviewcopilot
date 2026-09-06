import { isSimpleFactualQuestion } from "./prompt/interviewPrompt";

// Minimal, deterministic reasoning contract -- NOT a "thinking engine", not a second
// classifier, and not a revival of the old REASONING_PATTERNS/COMPONENT_TRIGGERS content this
// file used to hold (buildReasoningPlan's entire output was confirmed dead in the Day-2 audit:
// computed every request, never destructured by buildSapInterviewPrompt). This replacement
// computes exactly three small, checkable fields and nothing else.
//
// Everything here is derived from analysis.category (classifyWeightedIntents' output -- the
// same signal that already selects CATEGORY_TEMPLATES) and analysis.primaryIntent
// (interviewAnalyzer's own intent classifier), both already computed upstream and unchanged by
// this file. Behavioral/PMP/Leadership are resolved directly from category, bypassing
// primaryIntent entirely -- interviewAnalyzer.js has no awareness of those two categories, and
// its own intent patterns have a known, separate, out-of-scope substring-collision defect
// (e.g. "resolved" -> Troubleshooting) that would otherwise leak into this contract for exactly
// the questions this file most needs to get right.
//
// requiredElements are looked up by reasoningMode only, never by question text or product name
// -- this is what makes the contract generalize to unseen questions instead of hardcoding
// per-question content. Each element is phrased as a single concrete, checkable instruction
// ("state X in one sentence"), not an abstract discourse instruction ("be strategic", "think
// like an architect") -- the Day-2 controlled experiment found concrete content asks get
// followed reliably regardless of prompt position, while abstract structural asks do not.

const NON_SAP_TECHNICAL_CATEGORIES = new Set(["Behavioral", "PMP", "Leadership"]);

// Natural-language symptom description ("X succeeds but Y fails", "cannot access", "stopped
// working") that interviewAnalyzer.js's own keyword-only INTENT_PATTERNS regularly misses
// (it requires literal words like "issue"/"error"/"troubleshoot"). Catches the same class of
// question the Day-1 audit already documented failing classification for symptom-phrased
// questions -- a real troubleshooting question described in plain language, not a category
// name or product name, so it stays generalizable rather than a per-question hardcode.
const SYMPTOM_PATTERN = /\b(succeeds?|works?|logs? ?in|authenticates?)\s+(fine\s+)?but\b|\bcannot\b|\bcan't\b|\bunable to\b|\bfails? to\b|\bnot (being |getting )?(provisioned|synced|synchronized|authorized|authenticated)\b|\bstopped working\b|\bno longer works?\b|\bkeeps? (getting|failing|erroring)\b/i;

// A question that is genuinely SAP-technical AND carries real stakeholder/leadership/
// transformation signal (the "SAP + PMP hybrid" case, e.g. "lead a global S/4HANA security
// transformation involving multiple business stakeholders") doesn't get a new category or new
// routing -- CATEGORY_TEMPLATES, classification, and retrieval are unchanged -- but the
// reasoning contract can still notice the second dimension and ask for it explicitly. This is
// the one thing a contract layer can safely add without redesigning classification.
const HYBRID_SIGNAL_PATTERN = /\b(stakeholders?|business units?|cross-functional|multiple teams|transformation program|change program)\b/i;

const INTENT_TO_ANSWER_INTENT = Object.freeze({
  Troubleshooting: "troubleshooting",
  Performance: "troubleshooting",
  "Production Support": "troubleshooting",
  Architecture: "architecture",
  "Role Design": "architecture",
  RISE: "architecture",
  Scenario: "scenario-design",
  Comparison: "scenario-design",
  Implementation: "implementation",
  Configuration: "implementation",
  Workflow: "implementation",
  Migration: "implementation",
  Upgrade: "implementation",
  Authorization: "implementation",
  Security: "implementation",
  Definition: "factual"
});

const ANSWER_INTENT_TO_MODE = Object.freeze({
  factual: "define",
  troubleshooting: "diagnose",
  implementation: "implement",
  architecture: "design",
  "scenario-design": "design",
  behavioral: "resolve",
  "project-management": "decide"
});

const REQUIRED_ELEMENTS_BY_MODE = Object.freeze({
  define: [
    "State a concise, direct definition in the first sentence.",
    "State the practical purpose it serves.",
    "Give one concrete example or use case."
  ],
  diagnose: [
    "Establish what the symptom actually indicates before naming a cause.",
    "Identify the evidence or check that would distinguish between the likely causes.",
    "State the most likely root cause based on that evidence.",
    "State the specific remediation step.",
    "State how you would validate the fix worked."
  ],
  implement: [
    "State the concrete first configuration or setup step.",
    "Name the specific object, transaction, or setting involved.",
    "State how you would validate the configuration before considering it complete."
  ],
  design: [
    "State the objective and any real constraint driving the design in one sentence.",
    "State the primary architecture decision in one sentence.",
    "Name the key components involved and how they connect.",
    "State one explicit trade-off, or an alternative you would reject and why."
  ],
  decide: [
    "State the real tension between two legitimate interests in one sentence.",
    "State how you would assess the impact and each side's interest.",
    "State the concrete engagement or decision approach you would take.",
    "State the escalation or governance step if it isn't resolved directly.",
    "State the outcome or next step this produces."
  ],
  resolve: [
    // Deliberately phrased in conditional voice ("would be addressing"/"would take"), never
    // past tense ("took", "resolved") -- live-confirmed this element list otherwise nudges the
    // model into a fabricated definite-past-tense incident even with no CANDIDATE BACKGROUND
    // supplied, overriding the existing (frozen) BEHAVIORAL DIRECTIVE/GLOBAL TENSE DISCIPLINE
    // rules elsewhere in the prompt. Tense itself is left entirely to those existing rules.
    "State the specific situation you would be addressing, in one sentence.",
    "State the concrete action you would take.",
    "State the outcome that action would be intended to achieve."
  ],
  lead: [
    "State the primary technical decision in one sentence.",
    "State how you would engage the stakeholders whose interests differ.",
    "State one trade-off between technical correctness and business or timeline pressure.",
    "State the outcome or next step this produces."
  ]
});

function deriveAnswerIntent(question, analysis) {
  const category = analysis.category || "General";
  if (NON_SAP_TECHNICAL_CATEGORIES.has(category)) {
    return category === "PMP" ? "project-management" : "behavioral";
  }
  if (category === "Definition" || isSimpleFactualQuestion(question)) {
    return "factual";
  }
  if (SYMPTOM_PATTERN.test(question)) {
    return "troubleshooting";
  }
  return INTENT_TO_ANSWER_INTENT[analysis.primaryIntent] || "scenario-design";
}

export function buildReasoningContract(question = "", analysis = {}) {
  const category = analysis.category || "General";
  const answerIntent = deriveAnswerIntent(question, analysis);
  let reasoningMode = ANSWER_INTENT_TO_MODE[answerIntent] || "design";

  const isHybrid = !NON_SAP_TECHNICAL_CATEGORIES.has(category)
    && answerIntent !== "factual"
    && HYBRID_SIGNAL_PATTERN.test(question);
  if (isHybrid) reasoningMode = "lead";

  const requiredElements = REQUIRED_ELEMENTS_BY_MODE[reasoningMode] || [];

  return { answerIntent, reasoningMode, requiredElements, isHybrid };
}
