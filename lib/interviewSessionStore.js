/**
 * Live-interview Q&A history for later self-evaluation.
 * Isolated from CV, expertise cards, and prompt construction.
 * Persistence failures must never throw to the interview path.
 */
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(process.cwd(), "data", "interview-sessions");
const ID_OK = /^[a-zA-Z0-9_-]{8,80}$/;

let sanitizeProvenanceFn = null;
try {
  ({ sanitizeProvenance: sanitizeProvenanceFn } = require("./answerProvenance.js"));
} catch {
  sanitizeProvenanceFn = null;
}

function safeText(value, max = 1200) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function safeList(value, maxItems = 8) {
  return Array.isArray(value) ? value.map((item) => safeText(item, 160)).filter(Boolean).slice(0, maxItems) : [];
}

function sanitizeRetrieval(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => typeof item === "string"
    ? { id: safeText(item, 100), label: "", sourceFile: "", heading: "", chunkIndex: null }
    : {
      id: safeText(item?.id || item?.chunkId, 100),
      label: safeText(item?.label || item?.heading || item?.section, 160),
      sourceFile: safeText(item?.sourceFile || item?.fileName, 160),
      heading: safeText(item?.heading || item?.section || item?.label, 160),
      chunkIndex: Number.isFinite(Number(item?.chunkIndex)) ? Number(item.chunkIndex) : null,
      reviewStatus: safeText(item?.reviewStatus || item?.approvalStatus, 40) || null
    }
  ).filter((item) => item.id || item.label || item.sourceFile).slice(0, 8);
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
      disposition: safeText(qa.disposition, 24),
      route: safeText(qa.route, 40),
      evidenceMode: safeText(qa.evidenceMode, 40),
      scriptId: safeText(qa.scriptId, 80),
      sourceFiles: safeList(qa.sourceFiles, 12),
      excludeFromContext: Boolean(qa.excludeFromContext),
      finishReason: safeText(qa.finishReason || qa.usage?.finish_reason, 64),
      stageTiming: qa.stageTiming && typeof qa.stageTiming === "object" ? qa.stageTiming : null,
      procedurePrefer: qa.procedurePrefer && typeof qa.procedurePrefer === "object"
        ? {
          prefer: Boolean(qa.procedurePrefer.prefer),
          reason: safeText(qa.procedurePrefer.reason, 80),
          wrapMode: safeText(qa.procedurePrefer.wrapMode, 40),
          stepCount: Number(qa.procedurePrefer.stepCount) || 0,
          servedAs: safeText(qa.procedurePrefer.servedAs, 40),
          sourceTag: safeText(qa.procedurePrefer.sourceTag, 40)
        }
        : null,
      answerKind: safeText(qa.answerKind || qa.usage?.answerKind, 40),
      recovered: Boolean(qa.recovered || qa.usage?.recovered),
      ...sanitizeContext(qa.interviewContext),
      retrieval: sanitizeRetrieval(qa.retrieval),
      provenance: typeof sanitizeProvenanceFn === "function"
        ? (sanitizeProvenanceFn(qa.provenance) || null)
        : (qa.provenance && typeof qa.provenance === "object" ? qa.provenance : null),
      debugSummary: qa.debugSummary && typeof qa.debugSummary === "object"
        ? sanitizeContext(qa.debugSummary)
        : null
    };
    // Incomplete / aborted / empty streams must not pollute later turns as assistant context.
    // Completed recovered answers keep answerShown (Fix 2) with answerKind/recovered flags.
    // Partial truncated text is cleared so it cannot be trusted as a finished answer.
    if (record.status === "aborted" || record.status === "empty") {
      record.answerShown = "";
      record.excludeFromContext = true;
    } else if (record.status === "partial") {
      record.excludeFromContext = true;
      record.answerShown = "";
    } else if (record.excludeFromContext) {
      record.excludeFromContext = true;
    }
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

function readScenarioTimeline(sessionId) {
  try {
    const session = readSession(sessionId);
    const timeline = session?.scenarioTimeline;
    if (!timeline || typeof timeline !== "object" || !timeline.durationMonths) return null;
    return timeline;
  } catch (error) {
    return null;
  }
}

function writeScenarioTimeline(sessionId, timeline) {
  try {
    const session = ensureSession(sessionId, { source: "live-interview" });
    if (!session) return { ok: false, reason: "invalid-session-id" };
    if (timeline) session.scenarioTimeline = timeline;
    else delete session.scenarioTimeline;
    writeSession(session);
    return { ok: true };
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
  addEvaluationNote,
  readScenarioTimeline,
  writeScenarioTimeline
};
