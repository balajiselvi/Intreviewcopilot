/**
 * Live-interview Q&A history for later self-evaluation.
 * Isolated from CV, expertise cards, and prompt construction.
 * Persistence failures must never throw to the interview path.
 */
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(process.cwd(), "data", "interview-sessions");
const ID_OK = /^[a-zA-Z0-9_-]{8,80}$/;

function safeText(value, max = 1200) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function safeList(value, maxItems = 8) {
  return Array.isArray(value) ? value.map((item) => safeText(item, 160)).filter(Boolean).slice(0, maxItems) : [];
}

function sanitizeRetrieval(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => typeof item === "string"
    ? { id: safeText(item, 100), label: "" }
    : { id: safeText(item?.id, 100), label: safeText(item?.label, 160) }
  ).filter((item) => item.id || item.label).slice(0, 6);
}

function sanitizeContext(context = {}) {
  return {
    questionIntent: safeText(context.questionIntent, 48),
    questionTopic: safeText(context.questionTopic, 80),
    questionSubtopic: safeText(context.questionSubtopic, 120),
    questionDepth: safeText(context.depth, 16),
    interviewerFeedback: safeText(context.interviewerFeedback, 240),
    correctionDetected: Boolean(context.correctionDetected),
    answeredFacets: safeList(context.answeredFacets),
    unresolvedFacets: safeList(context.unresolvedFacets),
    rejectionCount: Number(context.rejectionCount) || 0,
    retrievalDecision: safeText(context.retrievalDecision, 40)
  };
}

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
      schemaVersion: 2,
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
      schemaVersion: 2,
      id: `qa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      submittedAt: qa.submittedAt || new Date().toISOString(),
      completedAt: new Date().toISOString(),
      question: safeText(qa.question),
      questionRaw: safeText(qa.questionRaw || qa.question),
      questionResolved: safeText(qa.questionResolved || qa.question),
      answerShown: safeText(qa.answerShown, 12000),
      status: qa.status || "completed",
      model: qa.model || meta.model || session.model || "",
      source: safeText(qa.source || meta.source || "unknown", 40),
      retryCount: Number(qa.retryCount) || 0,
      attemptIndex: Number.isFinite(qa.attemptIndex) ? qa.attemptIndex : session.qa.length,
      latencyMs: Number.isFinite(qa.latencyMs) ? qa.latencyMs : null,
      usage: qa.usage && typeof qa.usage === "object" ? qa.usage : null,
      errorCode: qa.errorCode || null,
      ...sanitizeContext(qa.interviewContext),
      retrieval: sanitizeRetrieval(qa.retrieval),
      debugSummary: qa.debugSummary && typeof qa.debugSummary === "object"
        ? sanitizeContext(qa.debugSummary)
        : null
    };
    const candidateTranscript = safeText(qa.candidateTranscript, 12000);
    if (candidateTranscript) record.candidateTranscript = candidateTranscript;
    session.qa.push(record);
    session.endedAt = record.timestamp;
    if (meta.model) session.model = meta.model;
    if (meta.jobLabel) session.jobLabel = meta.jobLabel;
    if (meta.company) session.company = meta.company;
    writeSession(session);
    return { ok: true, recordId: record.id, sessionId: session.sessionId };
  } catch (error) {
    return { ok: false, reason: "write-failed", errorCode: error?.code || "unknown" };
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
