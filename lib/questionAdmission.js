/**
 * Question admission with explicit noise, ambiguity, and context handling.
 * Well-formed questions and technical issue statements are admitted; pure chatter
 * is ignored; context-dependent fragments are deferred rather than generated alone.
 */
const { isNoiseOnly } = require("./transcriptGuardrails.js");

const DECISIONS = {
  ANSWER: "ANSWER",
  IGNORE: "IGNORE",
  DEFER: "DEFER"
};

const deferredOnIncomplete = true;

// BRF+ cannot rely on a trailing \b ('+' is non-word); keep it in BRF_SIGNAL.
const TECHNICAL_SIGNAL = /\b(?:SAP|S\/4(?:HANA)?|S4(?:HANA)?|ECC|GRC|IAG|IAS|IPS|BTP|Fiori|SoD|SU24|SU25|SU53|PFCG|MSMP|XSUAA|CERTRULE|STAUTHTRACE|Firefighter|RSECADMIN|analysis\s+authorizations?|authori[sz]ations?|derived role|roles?|ruleset|workflow|Access Control|access request|access risk|risk analysis|provisioning|JML|ITGC|OData|mitigating control|mitigation|on[- ]?prem(?:ise|ises)?|Public Edition|Private Edition|SuccessFactors|identity|catalog|UAT|SM59|SAP_ALL|controller review|presales)\b/i;
// '+' is non-word, so trailing \b after BRF+ never matches; use (?!\w) instead.
const BRF_SIGNAL = /\bBRF(?:\+|plus)(?!\w)/i;

const OPEN_TAIL = new Set(
  "a an the and or but so to of in on for with at from by as about into over your you we they would could should can will do does did how what when where which who if that this".split(/\s+/)
);

function normalize(raw) {
  return String(raw || "").replace(/[â€™â€˜']/g, "'").replace(/\s+/g, " ").trim();
}

function decision(code, reason, features = {}) {
  return { decision: code, reason, features: { ...features, deferredOnIncomplete } };
}

function hasTechnicalSignal(text) {
  const value = String(text || "");
  return TECHNICAL_SIGNAL.test(value) || BRF_SIGNAL.test(value);
}

function isAlwaysUnderspecified(text) {
  // Includes phonetic expansion "How to SAP Cloud IAG?" from prepareLiveTranscript.
  return /^(?:how|what)\s+to\s+(?:(?:sap\s+)?(?:cloud\s+)?iag|grc)\s*[?.!]*$/i.test(text)
    || /^have you statistical\b/i.test(text)
    || /^(?:how\s+){2,}/i.test(text);
}

/**
 * Short but explicit SAP interview asks ("How to configure BRF+?", "What is IAS?")
 * must never be deferred as incomplete fragments solely for low token count.
 * Does not admit elliptical chatter ("Or maybe the catalog?", "What if …").
 */
function isShortTechnicalInterviewAsk(text) {
  const value = normalize(text);
  if (!value || !hasTechnicalSignal(value)) return false;
  if (isAlwaysUnderspecified(value)) return false;
  if (/^(?:and|or|so|but|then|or maybe|something about|just|based in|what about|what if)\b/i.test(value)) {
    return false;
  }
  if (/^(?:how|what)\s+to\b/i.test(value)) return true;
  if (/^(?:how|what|why|when|where|which|who)\s+(?:do|does|did|is|are|would|could|should|can|have|has)\b/i.test(value)) {
    return true;
  }
  if (/^(?:what|who|where|which)\s+is\b/i.test(value)) return true;
  if (/^(?:explain|describe|configure|implement|troubleshoot|compare|outline|tell|walk|design)\b/i.test(value)) {
    return true;
  }
  // Bare / very short SAP-topic asks ("MSMP?", "BRF+?", "IAS federation") — never hold as incomplete.
  const tokens = value.replace(/[?.!]+$/g, "").split(/\s+/).filter(Boolean);
  if (tokens.length <= 5 && (/\?\s*$/.test(value) || /^(?:configure|explain|describe|troubleshoot|implement)\b/i.test(value))) {
    return true;
  }
  return false;
}

function isContextlessFragment(text) {
  const tokens = text.toLowerCase().replace(/[^a-z0-9+/? ]/g, " ").split(/\s+/).filter(Boolean);
  if (tokens.length <= 2 && !hasTechnicalSignal(text)) return true;
  if (
    tokens.length <= 2
    && hasTechnicalSignal(text)
    && !/\?/.test(text)
    && !/^(?:how|what|why|when|where|which|who|configure|explain)\b/i.test(text)
  ) {
    return true;
  }
  if (/^(?:and|or|so|but|then|what about|or maybe|something about|just|based in|implementation bit|post selling|identify customer then partner|you you you|the role or)\b/i.test(text)) return true;
  // "What if …" fragments are usually elliptical — except well-formed troubleshooting
  // with an identifiable SAP subject and failure condition (Firefighter logs not generated).
  if (/^what\s+if\b/i.test(text)) {
    const wellFormedFfLogs = /\bfirefighter\b/i.test(text)
      && /\blogs?\b/i.test(text)
      && /\b(?:not\s+generated|missing|not\s+coming|empty|not\s+sync|fail(?:ed|ure)?|sync)\b/i.test(text);
    const wellFormedTechnical = hasTechnicalSignal(text)
      && tokens.length >= 5
      && /\b(?:not\s+\w+|missing|fail(?:ed|ure|ing)?|error|denied|unable|broken|down)\b/i.test(text);
    if (!wellFormedFfLogs && !wellFormedTechnical) return true;
  }
  if (OPEN_TAIL.has(tokens[tokens.length - 1])) return true;
  // "How to configure BRF+?" is a complete short technical ask — do not defer on token count.
  if (/^(?:how|what|where|which|who)\s+to\b/i.test(text) && tokens.length < 5 && !hasTechnicalSignal(text)) return true;
  if (/^(?:how\s+){2,}/i.test(text)) return true;
  return false;
}

function isWellFormedAsk(text, count) {
  if (count < 4) return false;
  if (/^(?:and|or|so|but|then|or maybe|something about|just|based in)\b/i.test(text)) return false;
  if (/^have you statistical\b/i.test(text) || /^(?:how\s+){2,}/i.test(text)) return false;

  const questionOrPrompt = /^(?:what|how|why|when|where|which|who|can|could|would|should|do|does|did|is|are|have|has|tell|walk|compare|explain|describe|outline|give|name|connect|identify|trace|configure|design|troubleshoot|implement|remediate|validate|propose|modify|integrate|provision|approve|assign)\b/i.test(text);
  const explicitlyAsked = /\?\s*$/.test(text) && count >= 4;
  return questionOrPrompt || explicitlyAsked;
}

function isContextualFollowUp(raw) {
  const text = normalize(raw);
  if (!text) return false;
  // ADMISSION_PATCH_20261027_V1: recognise a substantive question embedded in ASR filler.
  // This branch is only reached with a prior question; it does not admit arbitrary chatter.
  const tokenCount = text.split(/\s+/).filter(Boolean).length;
  const embeddedInterviewAsk = tokenCount >= 8 &&
    /\b(?:how\s+(?:long|many|much)|what\s+kind\s+of|which\s+countries|what\s+clients|what\s+geography|what\s+projects|can\s+you\s+run\s+us\s+through|walk\s+me\s+through|tell\s+me\s+about)\b/i.test(text);
  if (embeddedInterviewAsk) return true;
  if (/^(?:why|how|what|when|where|which|who)\s*[?!.]*$/i.test(text)) return true;
  if (/^(?:(?:and|so|but|then)\s+)?what\s+about\b/i.test(text)) return true;
  if (/^what\s+if\b/i.test(text)) return true;
  if (/^(?:and|so)\s+(?:the|this|that|your|their|our)\b/i.test(text)) return true;
  if (/^(?:any other|anything else|what else)\b.*\?\s*$/i.test(text)) return true;
  if (/^(?:which|what|who|where|when)\s+(?:object|control|step|workflow|evidence|catalog|role|approval|application|app|server|policy|owner|one|part|stage|process)\b/i.test(text)
      && /\?\s*$/.test(text)) return true;
  return false;
}

function admitQuestion(raw, context = {}) {
  const text = normalize(raw);
  const priorQuestion = normalize(context.priorQuestion || "");
  const count = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const features = {
    tokens: count,
    hasPrior: Boolean(priorQuestion),
    deferredOnIncomplete
  };

  if (!text) return decision(DECISIONS.IGNORE, "empty", features);
  if (isNoiseOnly(text)) return decision(DECISIONS.IGNORE, "noise-only", features);
  if (isAlwaysUnderspecified(text)) return decision(DECISIONS.DEFER, "underspecified-fragment", features);

  // Short SAP technical asks are complete enough for generation even at low
  // token counts. Evaluate before fragment deferral so "How to configure BRF+?"
  // never surfaces the incomplete-question banner.
  if (isShortTechnicalInterviewAsk(text)) {
    return decision(DECISIONS.ANSWER, "well-formed-question-or-technical-issue", {
      ...features,
      shortTechnicalAsk: true
    });
  }

  // Context may resolve a genuine elliptical follow-up; it must never admit
  // arbitrary chatter, fragments, or unrelated statements by itself.
  if (priorQuestion && isContextualFollowUp(text)) {
    return decision(DECISIONS.ANSWER, "contextual-follow-up", features);
  }

  if (isContextlessFragment(text)) {
    return decision(DECISIONS.DEFER, "ambiguous-fragment", features);
  }

  // Permit concise but explicit technical questions such as "What is SoD?".
  // Contextless fragments ("What about the workflow?") were deferred above.
  const conciseTechnicalAsk = count >= 3 && /\?\s*$/.test(text) && hasTechnicalSignal(text);
  if (isWellFormedAsk(text, count) || conciseTechnicalAsk || (count >= 4 && hasTechnicalSignal(text))) {
    return decision(DECISIONS.ANSWER, "well-formed-question-or-technical-issue", features);
  }

  return decision(DECISIONS.DEFER, "insufficient-question-context", features);
}

function priorAnchor(history = []) {
  const items = Array.isArray(history) ? history : [];
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];
    if (!item || item.disposition === DECISIONS.IGNORE || item.disposition === DECISIONS.DEFER) continue;
    const role = item.role || item.type;
    if (role === "assistant" || role === "response" || role === "answer") continue;
    const content = item.content || item.text || item.question || "";
    if (!String(content).trim()) continue;
    const admitted = admitQuestion(content, { priorQuestion: "" });
    if (admitted.decision === DECISIONS.ANSWER) return String(content);
  }
  return "";
}

module.exports = {
  DECISIONS,
  admitQuestion,
  priorAnchor,
  deferredOnIncomplete,
  hasTechnicalSignal,
  isShortTechnicalInterviewAsk
};
