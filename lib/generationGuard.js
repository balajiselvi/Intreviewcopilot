/**
 * Shared generation failure classification for /api/chat and the interview UI.
 * Not an extra LLM pass — maps HTTP/API failures to retry policy and user-safe copy.
 */
function classifyGenerationFailure({ httpStatus, message = "", name = "" } = {}) {
  const raw = String(message || "");
  const lower = raw.toLowerCase();
  const status = Number(httpStatus) || 0;

  if (name === "AbortError") {
    return { code: "aborted", retryable: false, autoRetry: false, userMessage: "The answer timed out. Any text already received is kept." };
  }
  if (status === 402 || /insufficient_quota|billing|exceeded your current quota|payment/.test(lower)) {
    return { code: "quota", retryable: false, autoRetry: false, userMessage: "AI quota is exhausted. Check the API key and billing in Settings." };
  }
  if (status === 429 || /rate limit|too many requests/.test(lower)) {
    return { code: "rate", retryable: true, autoRetry: true, userMessage: "The service is busy. You can Retry." };
  }
  if (status >= 500 || /econnreset|etimedout|fetch failed|network/.test(lower)) {
    return { code: "transient", retryable: true, autoRetry: true, userMessage: "The service had a temporary error. You can Retry." };
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

module.exports = { classifyGenerationFailure, publicLlmError };
