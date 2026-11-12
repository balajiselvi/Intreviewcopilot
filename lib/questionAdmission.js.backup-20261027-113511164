/**
 * Question admission — ZERO-DROPPED-TRANSCRIPT / FORCE PASS-THROUGH.
 *
 * Hard rule: any non-empty transcript is ANSWER. Never DEFER. Never reject for
 * capitalization, question marks, word count, or mid-sentence starts.
 * Noise-only filtering (if any) happens upstream in prepareLiveTranscript.
 */

const DECISIONS = {
  ANSWER: "ANSWER",
  IGNORE: "IGNORE",
  // Compatibility only — never emitted by admitQuestion.
  DEFER: "DEFER"
};

/** Hard policy: incomplete/mid-sentence text must never be parked. */
const deferredOnIncomplete = false;

function normalize(raw) {
  return String(raw || "").replace(/[’']/g, "'").replace(/\s+/g, " ").trim();
}

function decision(code, reason, features = {}) {
  return { decision: code, reason, features: { ...features, deferredOnIncomplete } };
}

/**
 * Force pass-through: non-empty → ANSWER. Empty → IGNORE.
 * No fragment / incomplete / capitalization / punctuation gates.
 */
function admitQuestion(raw, context = {}) {
  const text = normalize(raw);
  const priorQuestion = normalize(context.priorQuestion || "");
  const features = {
    tokens: text ? text.split(/\s+/).filter(Boolean).length : 0,
    hasPrior: Boolean(priorQuestion),
    deferredOnIncomplete
  };

  if (!text) return decision(DECISIONS.IGNORE, "empty", features);

  // ZERO-DROP: every non-empty string is admitted for generation.
  return decision(
    DECISIONS.ANSWER,
    priorQuestion ? "zero-drop-admit-follow-up" : "zero-drop-admit",
    features
  );
}

function priorAnchor(history = []) {
  const items = Array.isArray(history) ? history : [];
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];
    if (!item || item.disposition === DECISIONS.IGNORE || item.disposition === DECISIONS.DEFER) continue;
    const role = item.role || item.type;
    if (role === "assistant" || role === "response") continue;
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
  deferredOnIncomplete
};
