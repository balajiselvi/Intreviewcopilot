/**
 * Session-scoped interview preparation. Emphasis only.
 * It is not candidate experience and it is not technical evidence.
 */

const LIMITS = {
  role: 120,
  seniority: 80,
  round: 80,
  focus: 400,
  style: 160
};

function clip(value, max) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function normalizeSessionPreparation(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  return {
    role: clip(source.role, LIMITS.role),
    seniority: clip(source.seniority, LIMITS.seniority),
    round: clip(source.round, LIMITS.round),
    focus: clip(source.focus, LIMITS.focus),
    style: clip(source.style, LIMITS.style)
  };
}

function preparationStorageKey(sessionId) {
  const id = String(sessionId || "").replace(/[^a-zA-Z0-9_-]/g, "");
  return id ? `interviewCopilot.preparation.${id}` : "";
}

function formatSessionPreparation(input) {
  const row = normalizeSessionPreparation(input);
  const lines = [];
  if (row.role) lines.push(`Target role: ${row.role}`);
  if (row.seniority) lines.push(`Seniority: ${row.seniority}`);
  if (row.round) lines.push(`Round: ${row.round}`);
  if (row.focus) lines.push(`Emphasize: ${row.focus}`);
  if (row.style) lines.push(`Answer style: ${row.style}`);
  if (!lines.length) return "";
  lines.push("Use this only to choose depth and emphasis for this session. It is not candidate experience, not a company fact, and not a technical source.");
  return lines.join("\n");
}

function readSessionPreparation(storage, sessionId) {
  const key = preparationStorageKey(sessionId);
  if (!key || !storage || typeof storage.getItem !== "function") return normalizeSessionPreparation();
  try {
    const raw = storage.getItem(key);
    if (!raw) return normalizeSessionPreparation();
    return normalizeSessionPreparation(JSON.parse(raw));
  } catch {
    return normalizeSessionPreparation();
  }
}

function writeSessionPreparation(storage, sessionId, input) {
  const key = preparationStorageKey(sessionId);
  const row = normalizeSessionPreparation(input);
  if (!key || !storage || typeof storage.setItem !== "function") return row;
  try {
    storage.setItem(key, JSON.stringify(row));
  } catch {
    // the in-memory copy still applies to this page
  }
  return row;
}

module.exports = {
  normalizeSessionPreparation,
  preparationStorageKey,
  formatSessionPreparation,
  readSessionPreparation,
  writeSessionPreparation
};
