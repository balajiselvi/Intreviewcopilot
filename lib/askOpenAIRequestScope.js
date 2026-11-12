/**
 * Request-scoped question handling for live askOpenAI.
 * Recovery/retry/incomplete paths must use THIS request's question only —
 * never an unbound identifier and never a previous turn's lastAskRef text.
 */

function normalizeRequestQuestion(text) {
  return String(text ?? "").trim();
}

/**
 * Resolve the question used for principle-level / incomplete recovery.
 * Stale lastAsk text is intentionally rejected — pass only the immutable
 * requestQuestion captured when askOpenAI accepted the turn.
 */
function resolveRecoveryQuestion(requestQuestion) {
  return normalizeRequestQuestion(requestQuestion);
}

/**
 * Build recovery text for empty / incomplete / error paths without ReferenceError
 * and without leaking a previous interview turn's question.
 *
 * @param {object} args
 * @param {string} args.streamedResponse
 * @param {string} args.requestQuestion immutable question for THIS request
 * @param {(s: string) => boolean} args.looksIncomplete
 * @param {(q: string) => string} args.buildFallback
 * @returns {{ ok: boolean, text: string, reason: string, requestQuestion: string }}
 */
function buildAskRecoveryText({
  streamedResponse = "",
  requestQuestion = "",
  looksIncomplete,
  buildFallback
} = {}) {
  const scopedQuestion = resolveRecoveryQuestion(requestQuestion);
  if (!scopedQuestion) {
    return {
      ok: false,
      text: "",
      reason: "empty-question",
      requestQuestion: ""
    };
  }
  const stream = String(streamedResponse || "").trim();
  const incomplete = typeof looksIncomplete === "function"
    ? Boolean(looksIncomplete(stream))
    : false;
  if (stream && !incomplete) {
    return {
      ok: true,
      text: stream,
      reason: "stream",
      requestQuestion: scopedQuestion
    };
  }
  let fallback = "";
  try {
    fallback = typeof buildFallback === "function"
      ? String(buildFallback(scopedQuestion) || "").trim()
      : "";
  } catch (error) {
    return {
      ok: false,
      text: "",
      reason: "fallback-threw",
      requestQuestion: scopedQuestion,
      error: error?.message || String(error)
    };
  }
  return {
    ok: Boolean(fallback),
    text: fallback,
    reason: stream ? "incomplete-fallback" : "empty-fallback",
    requestQuestion: scopedQuestion
  };
}

/**
 * Two consecutive asks must keep independent request questions.
 * Used by regression tests and any multi-request bookkeeping.
 */
function assertDistinctRequestQuestions(firstQuestion, secondQuestion) {
  const a = normalizeRequestQuestion(firstQuestion);
  const b = normalizeRequestQuestion(secondQuestion);
  return {
    first: a,
    second: b,
    distinct: a !== b || (!a && !b),
    secondUsesFirst: Boolean(a) && a === b && Boolean(secondQuestion) === false
  };
}

module.exports = {
  normalizeRequestQuestion,
  resolveRecoveryQuestion,
  buildAskRecoveryText,
  assertDistinctRequestQuestions
};
