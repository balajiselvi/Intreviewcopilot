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
 * Strip knowledge-bank question numbers / test-suite labels from headings or spoken text.
 * Example: "Q5: How do you integrate Fiori SSO..." → "How do you integrate Fiori SSO..."
 */
function stripBankQuestionLabels(text = "") {
  return String(text || "")
    .replace(/(?:^|\n)\s*#{1,6}\s*Q\d+\s*:\s*/gi, "\n")
    .replace(/(?:^|\n)\s*Q\d+\s*:\s*/gi, "\n")
    .replace(/\bQ\d+\s*:\s*/gi, "")
    // Full meta sentences that echo bank headings / test harness language.
    .replace(/\bI would treat\b[^.!?\n]*\bgoverning design boundary\b[^.!?\n]*[.!?]?/gi, "")
    .replace(/\bI would treat\s+(?:Q\d+\b|(?:How|What|Why|When|Where)\b)[^.!?\n]*[.!?]?/gi, "")
    .replace(/\bas the governing design boundary for this ask\b[^.!?]*[.!?]?/gi, "")
    .replace(/\b(?:unit[- ]?test|test[- ]?suite|assertion|eval assert)\b[^.!?\n]*/gi, "")
    .replace(/\b(?:RULE|Rule)\s*[1-9]\d?\b(?:\s*[—:\-–]\s*[^\n]*)?/gi, "")
    .replace(/\b(?:interviewPrompt|turnDecision|intentRouter|generationGuard|verifiedWorkflow)\.js\b/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Flatten banned Decision/Mechanism/Governance/Validation template headings into
 * continuous spoken prose. Preserves STAR (Situation/Task/Action/Result) bullets.
 */
function flattenDmgvTemplateToProse(text = "") {
  let out = String(text || "");
  if (!out) return out;
  const hasDmgv =
    /(?:^|\n)\s*[-*•]?\s*(?:\*\*\s*)?(?:Decision|Mechanism|Governance|Validation)\s*:/im.test(out)
    || /\*\*\s*(?:Decision|Mechanism|Governance|Validation)\s*:\s*\*\*/i.test(out);
  if (!hasDmgv) return out;
  out = out
    .replace(/(?:^|\n)\s*[-*•]\s*\*\*\s*(?:Decision|Mechanism|Governance|Validation)\s*:\s*\*\*\s*/gi, "\n")
    .replace(/(?:^|\n)\s*\*\*\s*(?:Decision|Mechanism|Governance|Validation)\s*:\s*\*\*\s*/gi, "\n")
    .replace(/(?:^|\n)\s*[-*•]\s*(?:Decision|Mechanism|Governance|Validation)\s*:\s*/gi, "\n")
    .replace(/(?:^|\n)\s*(?:Decision|Mechanism|Governance|Validation)\s*:\s*/gi, "\n")
    .replace(/\*\*\s*(?:Decision|Mechanism|Governance|Validation)\s*:\s*\*\*\s*/gi, " ");
  // Collapse template line-breaks into fluent paragraph flow.
  out = out
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return out;
}

/**
 * Rule 1 defense-in-depth: strip internal prompt/debug echoes that must never reach the UI.
 * Operates on spoken answer text only — does not invent content.
 * Non-bypassable post-generation interceptor used by chat.js finalizeSpokenAnswer / SSE writers.
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
      /(?:^|\n)\s*SUPPORTING KNOWLEDGE\b[\s\S]*?(?=\n\s*\*\s*\*\*|$)/gi,
      /(?:^|\n)\s*INTERNAL PRODUCT COMPARISON MODE\b[\s\S]*?(?=\n\s*\*\s*\*\*|$)/gi,
      /(?:^|\n)\s*NON-NEGOTIABLE SYSTEM RULES\b[\s\S]*?(?=\n\s*\*\s*\*\*|$)/gi
    ];
    for (const re of leakBlocks) out = out.replace(re, "\n");
    out = out
      .replace(/\bLOW-RELEVANCE RETRIEVAL FALLBACK\b[:\s-]*/gi, "")
      .replace(/\bINTERNAL RETRIEVAL NOTE\b[:\s-]*/gi, "")
      .replace(/\bno high-confidence (?:knowledge )?chunk matched\b[^.]*\.?/gi, "")
      .replace(/\bvector similarity score\b[^.]*\.?/gi, "")
      .replace(/\bconfidence score\s*[:=]?\s*0?\.\d+\b/gi, "")
      .replace(/If the server is on premise,\s*I would follow the ABAP Fiori path[^.]*\./gi, "")
      // Conceptual analogy ban (must never reach live interview UI)
      .replace(/\bSecurity builds the doors[^.!?\n]*[.!?]?/gi, "")
      .replace(/\bGRC governs the keys[^.!?\n]*[.!?]?/gi, "")
      .replace(/\bdoors?\b[^.!?\n]{0,40}\bkeys?\b[^.!?\n]*[.!?]?/gi, "")
      .replace(/\bthink of (?:it|them) like\b[^.!?\n]*[.!?]?/gi, "")
      // Weak / evasive executive hedges (must never reach live interview UI)
      .replace(/\bI would not claim that as a completed implementation\b[^.!?\n]*[.!?]?/gi, "")
      .replace(/\bAs an AI\b[^.!?\n]*[.!?]?/gi, "")
      .replace(/\bGenerally speaking,?\s*/gi, "")
      .replace(/\*?\s*\*\*Clarification Required:\*\*[^\n]*/gi, "")
      .replace(/\bCould you please clarify\b[^.!?\n]*[.!?]?/gi, "")
      .replace(/\bCould you please (?:repeat|rephrase)\b[^.!?\n]*[.!?]?/gi, "")
      .replace(/\bDo you mean\b[^.!?\n]*[.!?]?/gi, "")
      // Prompt-template / fragment prefixes
      .replace(/(?:^|\n)\s*(?:FINAL OUTPUT|ANSWER SCOPE|CANDIDATE BACKGROUND|EXPERIENCE GROUNDING)\b[^\n]*/gi, "\n")
      .replace(/\bTCODE_VERIFICATION_RULE\b/gi, "");
    out = stripBankQuestionLabels(out);
    out = flattenDmgvTemplateToProse(out);
    // Soften residual index-card / procedural-manual openers without inventing technical content.
    out = out
      .replace(/\bLead with this architecture matrix[^.!?\n]*[.!?…]?\s*/gi, "")
      .replace(/^\s*Lead diagnostics with\s+/i, "When I troubleshoot this, I typically start with ")
      .replace(/^\s*Lead with\s+/i, "I typically start with ")
      .replace(/\bIn Role Designer,\s*Business Roles,\s*create or maintain\b/gi, "In Role Designer under Business Roles I build")
      .replace(/\bThe administrator must\b/gi, "I always")
      .replace(/^\s*Create or maintain\b/i, "I build");
    out = out
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
  flattenDmgvTemplateToProse,
  stripBankQuestionLabels,
  anonymizeStarEmployers
};
