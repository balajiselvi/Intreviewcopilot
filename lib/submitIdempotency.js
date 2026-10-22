function submissionKey(text = "") {
  return String(text || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function shouldIgnoreDuplicateSubmit({
  previous = null,
  text = "",
  now = 0,
  windowMs = 1200,
  retry = false
} = {}) {
  if (retry) return false;
  const key = submissionKey(text);
  if (!key || !previous || previous.key !== key) return false;
  const elapsed = Number(now) - Number(previous.at);
  return Number.isFinite(elapsed) && elapsed >= 0 && elapsed < windowMs;
}

module.exports = {
  submissionKey,
  shouldIgnoreDuplicateSubmit
};
