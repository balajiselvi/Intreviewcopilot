/**
 * Shared generation failure classification for /api/chat and the interview UI.
 * Not an extra LLM pass — maps HTTP/API failures to retry policy and user-safe copy.
 */
function classifyGenerationFailure({ httpStatus, message = "", name = "" } = {}) {
  const raw = String(message || "");
  const lower = raw.toLowerCase();
  const status = Number(httpStatus) || 0;

  if (/incomplete generation|invalid stream payload/i.test(lower)) {
    return { code: "incomplete", retryable: true, autoRetry: false, userMessage: "The answer may be incomplete. You can Retry." };
  }

  if (name === "AbortError" || name === "APIConnectionTimeoutError" || /timed out while generating|the answer timed out|generation stopped/i.test(lower)) {
    return {
      code: "timeout",
      retryable: true,
      autoRetry: false,
      userMessage: "The answer timed out. You can Retry."
    };
  }
  if (status === 402 || /insufficient_quota|billing|exceeded your current quota|payment/.test(lower)) {
    return { code: "quota", retryable: false, autoRetry: false, userMessage: "AI quota is exhausted. Check the API key and billing in Settings." };
  }
  if (status === 429 || /rate limit|too many requests/.test(lower)) {
    return { code: "rate", retryable: true, autoRetry: true, userMessage: "The service is busy. You can Retry." };
  }
  // Programming / handler faults (e.g. const reassignment) often arrive as bare HTTP 500 HTML.
  // Do not label them as provider "temporary" outages — they are internal and retryable after a fix/reload.
  if (/assignment to constant variable|cannot read propert|is not a function|is not defined/i.test(lower)) {
    return {
      code: "internal",
      retryable: true,
      autoRetry: false,
      userMessage: "The interview service hit an internal error. You can Retry."
    };
  }
  if (status >= 500 || name === "APIConnectionError" || /econnreset|etimedout|fetch failed|failed to fetch|networkerror|network|load failed/i.test(lower)) {
    return { code: "transient", retryable: true, autoRetry: true, userMessage: "The service had a temporary error. You can Retry." };
  }
  if (/empty generation|empty body|stream error/i.test(lower)) {
    return { code: "empty", retryable: true, autoRetry: false, userMessage: "No answer came back. Your question is still listed. You can Retry." };
  }
  if (status === 401 || status === 403) {
    return { code: "auth", retryable: false, autoRetry: false, userMessage: "The API key was rejected. Update it in Settings." };
  }
  return { code: "generic", retryable: true, autoRetry: false, userMessage: "Could not generate an answer. Your question is still listed. You can Retry." };
}

function publicLlmError(error) {
  const status = error?.status || error?.statusCode || error?.response?.status;
  const message = error?.code || error?.error?.code || error?.message || "";
  return classifyGenerationFailure({ httpStatus: status, message, name: error?.name });
}

function isIncompleteGeneration(reason) {
  return ["length", "max_tokens", "max_output_tokens", "content_filter", "safety", "recitation", "blocklist", "prohibited_content", "spii"].includes(String(reason || "").toLowerCase());
}

/**
 * Rule 1 defense-in-depth: strip internal prompt/debug echoes that must never reach the UI.
 * Operates on spoken answer text only — does not invent content.
 */
function sanitizeSpokenAnswer(text = "") {
  let out = String(text || "");
  if (!out) return out;
  try {
    const leakBlocks = [
      /(?:^|\n)\s*LOW-RELEVANCE RETRIEVAL FALLBACK[\s\S]*?(?=\n\s*\*\s*\*\*|$)/gi,
      /(?:^|\n)\s*INTERNAL RETRIEVAL NOTE[\s\S]*?(?=\n\s*\*\s*\*\*|$)/gi,
      /(?:^|\n)\s*INTERNAL BEHAVIORAL STAR MODE[\s\S]*?(?=\n\s*\*\s*\*\*|$)/gi,
      /(?:^|\n)\s*BEHAVIORAL STAR MODE\b[\s\S]*?(?=\n\s*\*\s*\*\*|$)/gi,
      /(?:^|\n)\s*SUPPORTING KNOWLEDGE\b[\s\S]*?(?=\n\s*\*\s*\*\*|$)/gi
    ];
    for (const re of leakBlocks) out = out.replace(re, "\n");
    out = out
      .replace(/\bLOW-RELEVANCE RETRIEVAL FALLBACK\b[:\s-]*/gi, "")
      .replace(/\bINTERNAL RETRIEVAL NOTE\b[:\s-]*/gi, "")
      .replace(/\bno high-confidence (?:knowledge )?chunk matched\b[^.]*\.?/gi, "")
      .replace(/\bvector similarity score\b[^.]*\.?/gi, "")
      .replace(/\bconfidence score\s*[:=]?\s*0?\.\d+\b/gi, "")
      .replace(/If the server is on premise,\s*I would follow the ABAP Fiori path[^.]*\./gi, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch {
    return String(text || "").trim();
  }
  return out;
}

/**
 * STAR safety net: strip employer/client brands when the interviewer did not ask for them.
 * Keeps CV metrics and technical artifacts; replaces named employers with anonymized programme phrasing.
 */
function anonymizeStarEmployers(text = "") {
  let out = String(text || "");
  if (!out) return out;
  try {
    out = out
      .replace(/\bDover Corporation(?:\s+via\s+Ascent Staffing)?\b/gi, "an enterprise S/4HANA transformation")
      .replace(/\bEminnov Technologies\b/gi, "a GRC 12.0 S/4 conversion programme")
      .replace(/\bFabtech International\b/gi, "an upgrade-support GRC programme")
      .replace(/\bEnerlife(?:\s*\/\s*Nabati Group)?\b/gi, "an ECC manufacturing rollout")
      .replace(/\bNabati Group\b/gi, "an ECC manufacturing rollout")
      .replace(/\bWMS Middle East\b/gi, "an enterprise support organisation")
      .replace(/\bAscent Staffing\b/gi, "the delivery partner")
      .replace(/\b(?:at|for|with|during(?:\s+the)?|on(?:\s+the)?)\s+Dover\b/gi, "during an enterprise S/4HANA go-live")
      .replace(/\bDover\b/gi, "the enterprise programme")
      .replace(/\bEminnov\b/gi, "the conversion programme")
      .replace(/\bFabtech\b/gi, "the upgrade programme")
      .replace(/\bEnerlife\b/gi, "the ECC programme")
      .replace(/\b\d{1,2}\/\d{4}\s*[–-]\s*\d{1,2}\/\d{4}\b/g, "")
      .replace(/\$\s?\d[\d,]*(?:\.\d+)?\s*(?:million|billion|k|m|b)?\b/gi, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/ {2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch {
    return String(text || "").trim();
  }
  return out;
}

module.exports = {
  classifyGenerationFailure,
  publicLlmError,
  isIncompleteGeneration,
  sanitizeSpokenAnswer,
  anonymizeStarEmployers
};
