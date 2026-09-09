/**
 * Live-interview Q&A history for later self-evaluation.
 * Isolated from CV, expertise cards, and prompt construction.
 * Persistence failures must never throw to the interview path.
 */
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(process.cwd(), "data", "interview-sessions");
const ID_OK = /^[a-zA-Z0-9_-]{8,80}$/;

function safeSessionId(raw) {
  const id = String(raw || "").trim();
  return ID_OK.test(id) ? id : null;
}

function sessionPath(sessionId) {
  return path.join(DATA_DIR, `${sessionId}.json`);
}

function readSession(sessionId) {
  const id = safeSessionId(sessionId);
  if (!id) return null;
  const filePath = sessionPath(id);
  if (!fs.existsSync(filePath)) return null;
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return parsed && parsed.sessionId === id ? parsed : null;
}

function writeSession(session) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = sessionPath(session.sessionId) + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(session, null, 2), "utf-8");
  fs.renameSync(tmp, sessionPath(session.sessionId));
}

function ensureSession(sessionId, meta = {}) {
  const id = safeSessionId(sessionId);
  if (!id) return null;
  let session = readSession(id);
  if (!session) {
    session = {
      sessionId: id,
      startedAt: new Date().toISOString(),
      endedAt: null,
      jobLabel: meta.jobLabel || "",
      company: meta.company || "",
      model: meta.model || "",
      source: meta.source || "live-interview",
      qa: [],
      evaluation: []
    };
    writeSession(session);
  }
  return session;
}

function appendQa(sessionId, meta, qa) {
  try {
    const session = ensureSession(sessionId, meta);
    if (!session) return { ok: false, reason: "invalid-session-id" };
    const record = {
      id: `qa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      question: String(qa.question || ""),
      answerShown: String(qa.answerShown || ""),
      status: qa.status || "completed",
      model: qa.model || meta.model || session.model || "",
      retryCount: Number(qa.retryCount) || 0,
      attemptIndex: Number.isFinite(qa.attemptIndex) ? qa.attemptIndex : session.qa.length,
      latencyMs: Number.isFinite(qa.latencyMs) ? qa.latencyMs : null,
      usage: qa.usage && typeof qa.usage === "object" ? qa.usage : null,
      errorCode: qa.errorCode || null
    };
    session.qa.push(record);
    session.endedAt = record.timestamp;
    if (meta.model) session.model = meta.model;
    if (meta.jobLabel) session.jobLabel = meta.jobLabel;
    if (meta.company) session.company = meta.company;
    writeSession(session);
    return { ok: true, recordId: record.id, sessionId: session.sessionId };
  } catch (error) {
    return { ok: false, reason: "write-failed" };
  }
}

function addEvaluationNote(sessionId, qaId, note) {
  try {
    const session = readSession(sessionId);
    if (!session) return { ok: false };
    session.evaluation.push({
      id: `ev_${Date.now()}`,
      qaId,
      timestamp: new Date().toISOString(),
      note
    });
    writeSession(session);
    return { ok: true };
  } catch (error) {
    return { ok: false };
  }
}

module.exports = {
  DATA_DIR,
  safeSessionId,
  readSession,
  ensureSession,
  appendQa,
  addEvaluationNote
};
