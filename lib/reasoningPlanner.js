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

// Exported for reuse by chat.js's context-resolution step (Day-9) -- NOT a new classifier or
// vocabulary, the identical set already used below to resolve answerIntent directly from
// category. Reused there as the same "is this a people/PM category" signal, applied to a
// question's classification before deciding whether to inherit a prior turn's technical domain.
export const NON_SAP_TECHNICAL_CATEGORIES = new Set(["Behavioral", "PMP", "Leadership"]);

// A domain is genuine SAP-technical evidence unless it's interviewAnalyzer.js's own no-match
// default ("General SAP") or "PMP" (a real domain match, but not a technical one). Negative/
// exclusion form deliberately, not an allow-list of specific domain strings: a domain added to
// DOMAIN_PATTERNS in the future is automatically treated as genuine evidence without this file
// needing an update, the same principle already applied to the component-fallback fix.
const NON_GENUINE_DOMAINS = new Set(["General SAP", "PMP"]);
function hasGenuineSapDomain(analysis) {
  return Boolean(analysis.domain) && !NON_GENUINE_DOMAINS.has(analysis.domain);
}

// Structural signal for "reported symptom / unexpected state" (component A), replacing a prior
// narrow phrase list (succeeds-but/cannot/stopped-working) that a same-day unseen-question
// evaluation found does not generalize -- "users are ending up with duplicate accounts" and
// "the data looks stale" are genuine symptom reports that matched none of those specific
// phrases. Built from closed GRAMMATICAL classes instead of domain vocabulary: negation
// auxiliaries, contrastive conjunctions, and unexpected-result phrasal patterns are what mark a
// DECLARATIVE report of a current problem, in any domain, as distinct from a request for a
// future plan. Still not universal (see report), but it no longer needs a growing dictionary of
// specific symptom phrases to cover a new one -- "the report keeps returning wrong totals" or
// "access looks fine but the tile won't open" match the same grammatical shape without having
// been seen before.
//
// Day-9 addition: the negation-auxiliary and unexpected-result-phrasal classes above were
// declared as CLOSED grammatical categories but were incomplete instances of themselves, not
// missing a new category -- "hasn't/haven't/hadn't/didn't/couldn't/wouldn't/shouldn't" are the
// same negated-auxiliary class as "isn't/aren't/wasn't", and "started/begins/begun + gerund" is
// the same inchoative-anomaly class as "keeps + gerund"/"stopped + gerund" (the onset of an
// anomalous process, not just its continuation or cessation). Discovered as a concrete
// integration defect while validating context resolution: "The nightly sync has started
// skipping users" -- the canonical contextual-continuation example -- matched neither the old
// negation list nor the old phrasal list, so even with domain correctly inherited it would not
// have reached diagnose mode. Completing two already-declared closed classes, not adding a
// third or reaching for domain-specific vocabulary.
const NEGATION_OR_ANOMALY_PATTERN = /\b(isn't|aren't|doesn't|don't|didn't|can't|cannot|couldn't|wasn't|weren't|won't|wouldn't|shouldn't|hasn't|haven't|hadn't|no longer)\b|\b(but|however|yet|although|though)\b|\b(ending up|ended up|turns out|turned out|keeps?\s+\w+ing|stopped\s+\w+ing|started\s+\w+ing|begins?\s+\w+ing|begun\s+\w+ing)\b/i;

// Excludes an explicit request for a future plan/decision (design/build/implement/configure/
// coordinate/recommend) from ever being reclassified as a symptom report, regardless of
// incidental contrast/negation words appearing later in the same sentence ("design X, but keep
// cost low" stays a design question). Deliberately does not exclude troubleshoot/diagnose/fix/
// handle -- those verbs are just as consistent with a genuine diagnostic question as with
// anything else, so excluding them would reintroduce the same narrowness this replaces.
const FUTURE_PLAN_REQUEST_OPENER = /^\s*(how|what)\s+(would|should|could|will)\s+(you\s+)?(recommend|design|architect|build|implement|configure|set\s?up|coordinate|lead)\b|^\s*(would|should|could)\s+you\s+(recommend|design|architect|build|implement|configure|set\s?up|coordinate|lead)\b|^\s*(design|architect|build|implement|configure|coordinate)\b/i;

function isSymptomReport(question, analysis) {
  return (
    hasGenuineSapDomain(analysis) &&
    !FUTURE_PLAN_REQUEST_OPENER.test(question) &&
    NEGATION_OR_ANOMALY_PATTERN.test(question)
  );
}

// Structural signal for "SAP + PMP/governance hybrid" (component B): the same semantic category
// interviewerProfiler.js's deliveryManager persona already uses to detect Program-Manager-style
// framing (project/stakeholder/delivery/team/deadline/budget/resource/governance/leadership/
// timeline/milestone) -- not a new vocabulary invented from test cases, the identical concept
// set, applied independently here with plural handling (interviewerProfiler.js's own regex
// requires the exact singular "team" and does not match "teams", which is why "regional teams
// that each have different risk appetites" needs its own plural-safe copy rather than reusing
// that file's compiled regex directly; interviewerProfiler.js itself is not modified). Gated by
// genuine SAP domain evidence so it can only ever widen an already-technical question, never
// pull a PMP/Behavioral/General non-SAP question into a "hybrid" reasoning mode.
//
// Exported for reuse by chat.js's context-resolution step (Day-9) as its own "does the CURRENT
// turn show a people/project signal of its own" check -- same reasoning as exporting
// NON_SAP_TECHNICAL_CATEGORIES above: reusing the one existing pattern, not building a second.
export const DELIVERY_GOVERNANCE_PATTERN = /\b(projects?|stakeholders?|deliver(?:y|ies)|teams?|deadlines?|budgets?|resources?|governance|leadership|timelines?|milestones?)\b/i;

function isHybridSignal(question, analysis, answerIntent) {
  return (
    hasGenuineSapDomain(analysis) &&
    answerIntent !== "factual" &&
    DELIVERY_GOVERNANCE_PATTERN.test(question)
  );
}

const INTENT_TO_ANSWER_INTENT = Object.freeze({
  Troubleshooting: "troubleshooting",
  Performance: "troubleshooting",
  "Production Support": "troubleshooting",
  Architecture: "architecture",
  "Role Design": "architecture",
  RISE: "architecture",
  Scenario: "scenario-design",
  Comparison: "comparison",
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
  comparison: "compare",
  experience: "relate",
  behavioral: "resolve",
  "project-management": "decide"
});

// Product-agnostic: "tell me about your experience with X" is an exposure question even when
// X is SAC, GRC, BTP, or anything else. Without this, classifyWeightedIntents assigns the
// product category and CATEGORY_TEMPLATES turns the answer into a feature tour.
const EXPERIENCE_QUESTION_PATTERN =
  /\b((tell me|talk) about your (experience|exposure)|what(?:'s| is) your (experience|exposure)|do you have (any )?(experience|exposure)|have you (worked with|used|implemented|configured)|your (experience|exposure) (with|in|on)|what have you done (with|in|on))\b/i;

export function isExperienceQuestion(question = "") {
  return EXPERIENCE_QUESTION_PATTERN.test(String(question));
}

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
    "After that decision, name only the mechanisms that actually implement it and how they connect — do not open with a product inventory.",
    "If this is a real design choice, state one explicit trade-off or a rejected alternative. Skip a trade-off sentence if the question is not asking for a decision."
  ],
  compare: [
    "State the direct distinction in the first sentence.",
    "State each side's purpose and what it is responsible for — do not blend them into one capability.",
    "State how they relate or coexist only if that is part of the question.",
    "Give one concrete example of when you would use one versus the other."
  ],
  relate: [
    "Open with the actual scope of experience from CANDIDATE BACKGROUND, or honest working-knowledge framing if background does not cover this topic — never invent a project.",
    "State the technical responsibilities or layers involved, not a product brochure.",
    "Keep authentication, authorization, provisioning, governance, and application enforcement distinct wherever they appear.",
    "Give one specific mechanism from retrieved knowledge. Do not close with a generic enterprise-policy sentence."
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
  if (isExperienceQuestion(question)) {
    return "experience";
  }
  if (category === "Definition" || isSimpleFactualQuestion(question)) {
    return "factual";
  }
  if (isSymptomReport(question, analysis)) {
    return "troubleshooting";
  }
  return INTENT_TO_ANSWER_INTENT[analysis.primaryIntent] || "scenario-design";
}

const MODES_THAT_MUST_NOT_BECOME_LEAD = new Set(["define", "relate", "resolve", "compare", "diagnose"]);

export function buildReasoningContract(question = "", analysis = {}) {
  const answerIntent = deriveAnswerIntent(question, analysis);
  let reasoningMode = ANSWER_INTENT_TO_MODE[answerIntent] || "design";

  const isHybrid = isHybridSignal(question, analysis, answerIntent);
  if (isHybrid && !MODES_THAT_MUST_NOT_BECOME_LEAD.has(reasoningMode)) {
    reasoningMode = "lead";
  }

  const requiredElements = REQUIRED_ELEMENTS_BY_MODE[reasoningMode] || [];

  return { answerIntent, reasoningMode, requiredElements, isHybrid };
}
