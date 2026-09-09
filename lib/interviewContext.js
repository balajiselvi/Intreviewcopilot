const crypto = require("crypto");

const QUESTION_INTENTS = Object.freeze({
  DIRECT_QUESTION: "DIRECT_QUESTION",
  FOLLOW_UP: "FOLLOW_UP",
  CLARIFICATION: "CLARIFICATION",
  CORRECTION: "CORRECTION",
  CHALLENGE: "CHALLENGE",
  PROBE_DEEPER: "PROBE_DEEPER",
  REQUEST_FOR_EXAMPLE: "REQUEST_FOR_EXAMPLE",
  REQUEST_FOR_TECHNICAL_STEPS: "REQUEST_FOR_TECHNICAL_STEPS",
  REQUEST_FOR_VALIDATION: "REQUEST_FOR_VALIDATION",
  REQUEST_FOR_REMEDIATION: "REQUEST_FOR_REMEDIATION",
  REQUEST_FOR_ARCHITECTURE: "REQUEST_FOR_ARCHITECTURE",
  REQUEST_FOR_EXPERIENCE: "REQUEST_FOR_EXPERIENCE",
  SCENARIO_DESCRIPTION: "SCENARIO_DESCRIPTION",
  CONFIRMATION: "CONFIRMATION",
  FRAGMENT: "FRAGMENT",
  NON_QUESTION: "NON_QUESTION",
  UNKNOWN: "UNKNOWN"
});

const ENTITY_RULES = Object.freeze([
  ["SAC", /\b(SAC|SAP Analytics Cloud)\b/i],
  ["Fiori", /\b(Fiori|launchpad|catalogs?|spaces?|pages?|target mapping|Manage Purchase Order)\b/i],
  ["BTP", /\b(BTP|role collections?|XSUAA)\b/i],
  ["IAS", /\b(IAS|Identity Authentication)\b/i],
  ["IPS", /\b(IPS|Identity Provisioning|SCIM|provisioning|JML)\b/i],
  ["IAG", /\b(IAG|Identity Access Governance)\b/i],
  ["GRC", /\b(GRC|ARA|ARM|EAM|BRM|SoD|ruleset|conflicts?|risks?)\b/i],
  ["S/4HANA", /\b(S\/?4(?:HANA)?|PFCG|SU24|authorization objects?|master roles?|derived roles?|composite roles?)\b/i],
  ["Excel", /\bExcel|spreadsheet|export(?:ing|ed)?\b/i],
  ["JML", /\bJML|joiner|mover|leaver|lifecycle\b/i],
  ["SuccessFactors", /\bSuccessFactors|Employee Central\b/i]
]);

const ACKNOWLEDGEMENT = /^(?:(?:okay|ok|yes|yeah|right|correct|understood|got it|makes sense|thank you|thanks)(?:\s+|[,.!])*)+$/i;
const CORRECTION = /\b(?:no[, ]+i mean|rather|instead|not that|what i mean|i meant)\b/i;
const CHALLENGE = /\b(?:not answering|answering round and round|too generic|you missed|still miss(?:es|ing)?|still not|that'?s not what i asked)\b/i;
const DEEPEN = /\b(?:go deeper|more technical|more detail|be specific|how exactly|drill down)\b/i;
const EXAMPLE = /\b(?:specific|concrete|real)\s+example\b|\bgive me (?:an?|one) example\b/i;
const TECHNICAL_STEPS = /\b(?:technical steps|configuration steps|step by step|steps are involved|exact sequence)\b/i;
const VALIDATION = /\b(?:validate|validation|how do you know|prove|verify|which authorization object|which value)\b|(?:evidence|identify|isolate).{0,40}\b(?:object|field|value)\b/i;
const REMEDIATION = /\b(?:remediat|fix|correct|resolve|reduce false positives)\w*\b/i;
const ARCHITECTURE = /\b(?:architecture|design|landscape|topology|integrat)\w*\b/i;
const EXPERIENCE = /\b(?:your experience|have you|did you|tell me about a time|project example)\b/i;
const SCENARIO = /\b(?:scenario|suppose|assume|the customer|the user|in production)\b/i;
const CLARIFY = /\b(?:do you mean|are you saying|clarify|in other words)\b/i;

function text(value, max = 1200) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function normalizeHistoryItem(item) {
  const role = item?.role || (item?.type === "response" ? "assistant" : "user");
  const content = text(item?.content || item?.text);
  if (!content || !["user", "assistant"].includes(role)) return null;
  return { ...item, role, content };
}

function normalizedHistory(history) {
  return (Array.isArray(history) ? history : []).map(normalizeHistoryItem).filter(Boolean);
}

function lastByRole(history, role) {
  return [...history].reverse().find((item) => item.role === role);
}

function extractEntities(question, anchor = "") {
  const combined = `${question} ${anchor}`;
  return ENTITY_RULES.filter(([, pattern]) => pattern.test(combined)).map(([name]) => name);
}

function explicitEntities(question) {
  return ENTITY_RULES.filter(([, pattern]) => pattern.test(question)).map(([name]) => name);
}

function explicitProductTopic(question) {
  if (/\b(SAC|SAP Analytics Cloud)\b/i.test(question)) return "SAC";
  if (/\b(Fiori|launchpad|Manage Purchase Order)\b/i.test(question)) return "Fiori";
  if (/\b(BTP|XSUAA|role collections?)\b/i.test(question)) return "BTP";
  if (/\b(IAS|Identity Authentication)\b/i.test(question)) return "IAS";
  if (/\b(IAG|Identity Access Governance)\b/i.test(question)) return "IAG";
  if (/\b(GRC|ARA|ARM|EAM|BRM|SoD|ruleset)\b/i.test(question)) return "GRC";
  if (/\b(IPS|Identity Provisioning)\b/i.test(question)) return "IPS";
  if (/\bS\/?4(?:HANA)?\b/i.test(question)) return "Authorization";
  return "";
}

function deriveTopic(question, prior, activeContext) {
  const explicitProduct = explicitProductTopic(question);
  if (explicitProduct) return explicitProduct;
  const inherited = text(activeContext?.questionTopic || prior?.context?.questionTopic || prior?.questionTopic || "");
  if (inherited) return inherited;
  if (/\b(master|derived|composite|authorization object|PFCG)\b/i.test(question)) return "Authorization";
  return explicitEntities(prior?.content || "").find((x) => !["Excel"].includes(x)) || "";
}

function isClearlyIncompleteFragment(raw) {
  const q = text(raw, 240);
  if (!q) return true;
  const words = q.replace(/[?!.]+$/, "").split(/\s+/).filter(Boolean);
  if (words.length > 5) return false;
  if (/^(?:(?:this|that|these|those)\s+\w+[.! ]*)+$/i.test(q)) return true;
  return /^(?:how|what|why|where|when|who)\s+(?:do|does|did|would|could|can|is|are|was|were)\s+(?:you|we|they|it|this|that)?$/i.test(q.replace(/[?!.]+$/, "").trim());
}

function removeSubmittedSnapshot(current, submitted) {
  const live = String(current || "");
  const snapshot = String(submitted || "");
  return live.indexOf(snapshot) === 0 ? live.slice(snapshot.length).trimStart() : live;
}

function isExplicitTopicChange(question, priorTopic) {
  const explicit = explicitProductTopic(question);
  if (!explicit || !priorTopic || priorTopic === "General") return false;
  return explicit !== priorTopic;
}

function isSemanticallyDependent(question, hasAnchor) {
  if (!hasAnchor) return false;
  const q = text(question, 400);
  if (/^(?:and then|then what|what next|so then|afterwards)\b/i.test(q)) return true;
  if (/\b(?:how do you (?:validate|fix|know|rerun)|is it genuine|why is that|how does that|what happens then|what about)\b/i.test(q)) return true;
  if (/\b(?:it|that|this|those|these|them|then|afterwards|after that)\b/i.test(q)) return true;
  if (/\bthe (?:\w+\s+){0,2}(?:conflict|value|object|role|rule|result|risk|catalog|design|report|export|analysis|field)\b/i.test(q)) return true;
  return false;
}

function detectIntent(question, hasAnchor) {
  if (ACKNOWLEDGEMENT.test(question)) return QUESTION_INTENTS.NON_QUESTION;
  if (CHALLENGE.test(question)) return QUESTION_INTENTS.CHALLENGE;
  if (CORRECTION.test(question)) return QUESTION_INTENTS.CORRECTION;
  if (EXAMPLE.test(question)) return QUESTION_INTENTS.REQUEST_FOR_EXAMPLE;
  if (TECHNICAL_STEPS.test(question)) return QUESTION_INTENTS.REQUEST_FOR_TECHNICAL_STEPS;
  if (VALIDATION.test(question)) return QUESTION_INTENTS.REQUEST_FOR_VALIDATION;
  if (REMEDIATION.test(question)) return QUESTION_INTENTS.REQUEST_FOR_REMEDIATION;
  if (EXPERIENCE.test(question)) return QUESTION_INTENTS.REQUEST_FOR_EXPERIENCE;
  if (ARCHITECTURE.test(question)) return QUESTION_INTENTS.REQUEST_FOR_ARCHITECTURE;
  if (DEEPEN.test(question)) return QUESTION_INTENTS.PROBE_DEEPER;
  if (CLARIFY.test(question)) return QUESTION_INTENTS.CLARIFICATION;
  if (isClearlyIncompleteFragment(question)) return QUESTION_INTENTS.FRAGMENT;
  if (SCENARIO.test(question)) return QUESTION_INTENTS.SCENARIO_DESCRIPTION;
  const explainDirect = /^(?:now\s+)?(?:explain|describe|compare|walk me through|tell me)\b/i.test(question);
  if (explainDirect && !(hasAnchor && isSemanticallyDependent(question, hasAnchor))) {
    return QUESTION_INTENTS.DIRECT_QUESTION;
  }
  if (question.includes("?")) {
    if (hasAnchor && (question.split(/\s+/).length <= 7 || isSemanticallyDependent(question, hasAnchor))) {
      return QUESTION_INTENTS.FOLLOW_UP;
    }
    return QUESTION_INTENTS.DIRECT_QUESTION;
  }
  if (!hasAnchor && question.split(/\s+/).filter(Boolean).length >= 3) return QUESTION_INTENTS.DIRECT_QUESTION;
  return hasAnchor ? QUESTION_INTENTS.FOLLOW_UP : QUESTION_INTENTS.UNKNOWN;
}

function deriveDepth(intent, question) {
  if (EXAMPLE.test(question) || EXPERIENCE.test(question)) return "project";
  if ([QUESTION_INTENTS.PROBE_DEEPER, QUESTION_INTENTS.REQUEST_FOR_TECHNICAL_STEPS, QUESTION_INTENTS.REQUEST_FOR_VALIDATION].includes(intent)) return "deep";
  if ([QUESTION_INTENTS.NON_QUESTION, QUESTION_INTENTS.CONFIRMATION, QUESTION_INTENTS.FRAGMENT].includes(intent)) return "brief";
  return "normal";
}

function deriveObjective(intent, question) {
  if (/\bdetailed (?:SoD )?report\b/i.test(question)) return "detailed SoD report";
  if (/\bexport\w*.{0,24}\bExcel\b|\bExcel export\b/i.test(question)) return "Excel export analysis";
  if (/rerun|re-run|run (?:it|the analysis) again/i.test(question)) return "rerun analysis and validate regression";
  if (/false positives?|miss(?:ed|ing).{0,12}risks?/i.test(question)) return "rules → functions → actions → permissions; separate remediation and regression validation";
  if (/authorization object.{0,24}(?:field|value)|exact authorization field|exact authorization value/i.test(question)) return "function → action → authorization object → field → value";
  if (/\brole.{0,20}authorization object\b/i.test(question)) return "role → authorization object";
  if (/\bidentify.{0,20}\brule\b|\bwhich rule\b/i.test(question)) return "rule identification";
  if (/\bgenuine\b|\breal conflict\b/i.test(question)) return "genuine conflict determination";
  if (TECHNICAL_STEPS.test(question)) return "technical steps";
  if (intent === QUESTION_INTENTS.REQUEST_FOR_VALIDATION) return "technical validation steps";
  if (/display[- ]only/i.test(question)) return "sustainable display-only access across content, service, and backend object/value layers";
  if (EXAMPLE.test(question)) return "one candidate-supported specific example";
  if (CHALLENGE.test(question)) return "answer the unresolved question directly without repeating rejected material";
  if (intent === QUESTION_INTENTS.REQUEST_FOR_REMEDIATION) return "remediation path";
  return intent.toLowerCase().replaceAll("_", " ");
}

function deriveFeedback(question) {
  if (CHALLENGE.test(question)) return text(question);
  if (CORRECTION.test(question)) return text(question.replace(/^no[, ]*/i, ""));
  return "";
}

function resolvedQuestion(raw, intent, anchor) {
  if (!anchor) return raw;
  if (intent === QUESTION_INTENTS.CORRECTION) return `${anchor} Correction: ${raw}`;
  if (intent === QUESTION_INTENTS.CHALLENGE) return `${anchor} Feedback: ${raw}`;
  if ([QUESTION_INTENTS.FOLLOW_UP, QUESTION_INTENTS.FRAGMENT, QUESTION_INTENTS.PROBE_DEEPER,
    QUESTION_INTENTS.REQUEST_FOR_EXAMPLE, QUESTION_INTENTS.REQUEST_FOR_TECHNICAL_STEPS,
    QUESTION_INTENTS.REQUEST_FOR_VALIDATION, QUESTION_INTENTS.REQUEST_FOR_REMEDIATION,
    QUESTION_INTENTS.REQUEST_FOR_ARCHITECTURE, QUESTION_INTENTS.REQUEST_FOR_EXPERIENCE].includes(intent)) {
    return `${anchor} Follow-up: ${raw}`;
  }
  return raw;
}

function productBoundaries(topic, entities) {
  const required = new Set();
  const forbidden = new Set();
  if (topic === "SAC") { required.add("SAC"); forbidden.add("GRC"); forbidden.add("BTP role collections as SAC content authorization"); }
  if (topic === "Fiori") { required.add("Fiori"); required.add("S/4 backend authorization"); }
  if (topic === "BTP") { required.add("BTP role collections"); forbidden.add("ABAP authorization tools unless a backend is in scope"); }
  if (topic === "IAS") { required.add("authentication"); forbidden.add("provisioning ownership"); forbidden.add("application authorization ownership"); }
  if (topic === "IPS") { required.add("provisioning and synchronization"); forbidden.add("authentication ownership"); forbidden.add("access-governance decisions"); }
  if (topic === "IAG") { required.add("access governance"); forbidden.add("authentication ownership"); forbidden.add("target authorization enforcement"); }
  if (topic === "GRC") { required.add("GRC rules, functions, actions, and permissions as relevant"); forbidden.add("cloud identity products unless the scenario requires them"); }
  if (topic === "Authorization") { required.add("target application authorization enforcement"); }
  if (entities.includes("JML")) {
    required.add("lifecycle source");
    required.add("IPS");
    required.add("IAG");
    required.add("target application");
  }
  return { required: [...required], forbidden: [...forbidden] };
}

function makeQuestionId(raw, priorId) {
  return `q_${crypto.createHash("sha1").update(`${priorId || ""}|${raw}`).digest("hex").slice(0, 12)}`;
}

function retrievalPolicy(intent, confidence, resolved) {
  if ([QUESTION_INTENTS.NON_QUESTION, QUESTION_INTENTS.CONFIRMATION].includes(intent)) return { decision: "skip", query: "" };
  if (intent === QUESTION_INTENTS.FRAGMENT) return confidence >= 0.65
    ? { decision: "active-context", query: resolved } : { decision: "clarify", query: "" };
  return { decision: "retrieve", query: resolved };
}

function resolveInterviewContext({ questionRaw, history = [], source = "unknown", questionId } = {}) {
  const raw = text(questionRaw);
  const prior = normalizedHistory(history);
  const previousQuestionEvent = lastByRole(prior, "user");
  const previousAnswerEvent = lastByRole(prior, "assistant");
  const activeContext = [...prior].reverse().find((item) => item?.context)?.context;
  const previousQuestion = text(previousQuestionEvent?.content, 900);
  const inheritedTopic = text(activeContext?.questionTopic || previousQuestionEvent?.context?.questionTopic || "");
  let intent = detectIntent(raw, Boolean(previousQuestion));
  const topic = deriveTopic(raw, previousQuestionEvent, activeContext);
  const topicChanged = isExplicitTopicChange(raw, inheritedTopic);
  if (topicChanged && intent === QUESTION_INTENTS.FOLLOW_UP && explicitProductTopic(raw) && !isClearlyIncompleteFragment(raw)) {
    intent = QUESTION_INTENTS.DIRECT_QUESTION;
  } else if (!topicChanged && previousQuestion && intent === QUESTION_INTENTS.DIRECT_QUESTION && isSemanticallyDependent(raw, true)) {
    intent = QUESTION_INTENTS.FOLLOW_UP;
  }
  const entities = extractEntities(raw, topicChanged ? "" : previousQuestion);
  if (entities.includes("JML") && !entities.includes("IPS")) entities.push("IPS");
  const confidence = topic || explicitEntities(raw).length ? 0.9 : (previousQuestion ? 0.7 : 0.45);
  const anchorQuestion = topicChanged ? "" : text(activeContext?.questionResolved || previousQuestion, 1200);
  const resolved = resolvedQuestion(raw, intent, anchorQuestion);
  const boundaries = productBoundaries(topic, entities);
  const previousRejections = Number(activeContext?.rejectionCount || previousQuestionEvent?.context?.rejectionCount || 0);
  const rejectionCount = previousRejections + (intent === QUESTION_INTENTS.CHALLENGE ? 1 : 0);
  const objective = deriveObjective(intent, raw);
  const retrieval = retrievalPolicy(intent, confidence, `${resolved} Topic: ${topic}. Facet: ${objective}.`);
  const constraints = entities.includes("JML") && !entities.includes("SuccessFactors")
    ? ["Do not assume SuccessFactors or another lifecycle source unless supplied."] : [];
  let requestedDepth = deriveDepth(intent, `${raw} ${objective}`);
  if (requestedDepth === "normal" && activeContext?.depth === "deep" && intent !== QUESTION_INTENTS.DIRECT_QUESTION && !topicChanged) {
    requestedDepth = "deep";
  }
  return {
    schemaVersion: 2,
    currentQuestion: raw,
    questionId: text(questionId || makeQuestionId(raw, previousQuestionEvent?.questionId), 80),
    questionRaw: raw,
    questionResolved: resolved,
    previousQuestion,
    previousAnswer: text(previousAnswerEvent?.content, 1200),
    questionIntent: intent,
    questionTopic: topic || "General",
    questionSubtopic: entities.filter((x) => x !== topic).slice(0, 4).join(", "),
    interviewerObjective: objective,
    facet: objective,
    depth: requestedDepth,
    correctionDetected: [QUESTION_INTENTS.CORRECTION, QUESTION_INTENTS.CHALLENGE].includes(intent),
    interviewerFeedback: deriveFeedback(raw),
    confidence,
    entities,
    constraints,
    answeredFacets: intent === QUESTION_INTENTS.CHALLENGE
      ? (activeContext?.answeredFacets || [])
      : [...new Set([...(activeContext?.answeredFacets || []), ...(activeContext?.unresolvedFacets || [])])].slice(-8),
    unresolvedFacets: intent === QUESTION_INTENTS.CHALLENGE && activeContext?.unresolvedFacets?.length
      ? activeContext.unresolvedFacets.slice(-6)
      : [objective],
    unresolvedFacet: objective,
    rejectionCount,
    retrievalDecision: retrieval.decision,
    retrievalQuery: retrieval.query,
    requiredProductBoundaries: boundaries.required,
    forbiddenProductBoundaries: boundaries.forbidden,
    experienceRequirement: [QUESTION_INTENTS.REQUEST_FOR_EXAMPLE, QUESTION_INTENTS.REQUEST_FOR_EXPERIENCE].includes(intent)
      ? "candidate-supported-only" : "confidence-gated",
    source: text(source, 40)
  };
}

function toHistoryContext(context) {
  if (!context || typeof context !== "object") return undefined;
  return {
    questionIntent: text(context.questionIntent, 48),
    questionTopic: text(context.questionTopic, 80),
    questionSubtopic: text(context.questionSubtopic, 120),
    questionResolved: text(context.questionResolved, 1200),
    interviewerObjective: text(context.interviewerObjective, 160),
    depth: text(context.depth, 16),
    correctionDetected: Boolean(context.correctionDetected),
    rejectionCount: Number(context.rejectionCount) || 0,
    answeredFacets: Array.isArray(context.answeredFacets) ? context.answeredFacets.map((x) => text(x, 120)).slice(0, 6) : [],
    unresolvedFacets: Array.isArray(context.unresolvedFacets) ? context.unresolvedFacets.map((x) => text(x, 120)).slice(0, 6) : []
  };
}

function buildBoundedHistory(events = [], { maxUsers = 8, maxAssistants = 5, maxChars = 7000 } = {}) {
  const selected = [];
  let users = 0;
  let assistants = 0;
  let chars = 0;
  for (const item of [...events].reverse()) {
    const normalized = normalizeHistoryItem(item);
    if (!normalized || item?.status === "pending") continue;
    if (normalized.role === "user" && users >= maxUsers) continue;
    if (normalized.role === "assistant" && assistants >= maxAssistants) continue;
    const remaining = maxChars - chars;
    if (remaining < 80) break;
    const content = text(normalized.content, Math.min(1200, remaining));
    const safe = {
      role: normalized.role, content, source: text(item.source, 40),
      timestamp: text(item.timestamp, 40), questionId: text(item.questionId, 80),
      answerId: text(item.answerId, 80), context: toHistoryContext(item.context)
    };
    let serializedLength = JSON.stringify(safe).length;
    if (serializedLength > remaining) {
      safe.content = text(content, Math.max(0, content.length - (serializedLength - remaining) - 20));
      serializedLength = JSON.stringify(safe).length;
    }
    if (!safe.content || serializedLength > remaining) continue;
    selected.push(safe);
    chars += serializedLength;
    if (safe.role === "user") users += 1; else assistants += 1;
  }
  return selected.reverse();
}

function sanitizeDebugContext(context = {}, runtime = {}) {
  const evidence = Array.isArray(context.retrievalEvidence) ? context.retrievalEvidence : [];
  return {
    questionRaw: text(context.questionRaw),
    questionResolved: text(context.questionResolved),
    intent: text(context.questionIntent, 48),
    topic: text(context.questionTopic, 80),
    subtopic: text(context.questionSubtopic, 120),
    depth: text(context.depth, 16),
    correctionDetected: Boolean(context.correctionDetected),
    feedback: text(context.interviewerFeedback, 240),
    retrieval: {
      decision: text(context.retrievalDecision, 40),
      evidence: evidence.map((item) => ({ id: text(item.id, 100), label: text(item.label, 160) })).slice(0, 6)
    },
    experience: { confidence: text(runtime.experienceConfidence, 16), label: text(runtime.experienceLabel, 120) },
    requestedAnswerLength: text(runtime.requestedAnswerLength, 24),
    latencyMs: Number(runtime.latencyMs) || 0,
    classification: text(runtime.classification, 80),
    domain: text(runtime.domain, 120),
    reasoning: text(runtime.reasoning?.mode || runtime.reasoning, 80),
    components: Array.isArray(runtime.components) ? runtime.components.map((x) => text(x, 80)).slice(0, 12) : []
  };
}

module.exports = {
  QUESTION_INTENTS,
  buildBoundedHistory,
  isClearlyIncompleteFragment,
  removeSubmittedSnapshot,
  resolveInterviewContext,
  sanitizeDebugContext,
  toHistoryContext
};
