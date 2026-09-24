/**
 * Live-interview operator session: turn admission, retry identity,
 * history hygiene, session rotation, and visible operator state.
 * Does not classify questions or construct prompts.
 */

const LIVE_SESSION_KEY = "interviewCopilot.liveSessionId";
const SESSION_ID_OK = /^[a-zA-Z0-9_-]{8,80}$/;

const OPERATOR_STATES = {
  GENERATING: "generating",
  ERROR: "error",
  LISTENING: "listening",
  READY: "ready"
};

function createLiveSessionId(now = Date.now(), random = Math.random) {
  return `live_${Number(now).toString(36)}_${random().toString(36).slice(2, 10)}`;
}

function readLiveSessionId(storage) {
  try {
    const existing = storage && typeof storage.getItem === "function"
      ? storage.getItem(LIVE_SESSION_KEY)
      : null;
    if (existing && SESSION_ID_OK.test(existing)) return existing;
  } catch {
    // sessionStorage may be blocked; caller falls back to an ephemeral id
  }
  return null;
}

function persistLiveSessionId(storage, id) {
  try {
    if (storage && typeof storage.setItem === "function") {
      storage.setItem(LIVE_SESSION_KEY, id);
    }
  } catch {
    // keep the in-memory id even if persistence fails
  }
  return id;
}

function getOrCreateLiveSessionId(storage) {
  return readLiveSessionId(storage) || persistLiveSessionId(storage, createLiveSessionId());
}

function rotateLiveSessionId(storage) {
  return persistLiveSessionId(storage, createLiveSessionId());
}

function canStartTurn({ isProcessing } = {}) {
  return !Boolean(isProcessing);
}

function shouldReuseQuestionRow({
  retry = false,
  continuing = false,
  utteranceId = null,
  lastUtteranceId = null,
  lastQuestionId = null
} = {}) {
  if (retry && lastQuestionId) return true;
  if (continuing && utteranceId && utteranceId === lastUtteranceId && lastQuestionId) return true;
  return false;
}

function isGenerationHistoryItem(item) {
  if (!item || (item.type !== "question" && item.type !== "response")) return false;
  if (item.status === "pending" || item.status === "error" || item.status === "interrupted") return false;
  if (item.disposition === "IGNORE" || item.disposition === "DEFER") return false;
  return true;
}

function historyForGeneration(events = []) {
  return (Array.isArray(events) ? events : []).filter(isGenerationHistoryItem);
}

function deriveOperatorState({
  isProcessing = false,
  generationError = null,
  isSystemAudioActive = false,
  isMicrophoneActive = false,
  queuedSpeechCount = 0
} = {}) {
  if (isProcessing) {
    return {
      id: OPERATOR_STATES.GENERATING,
      label: queuedSpeechCount > 0 ? "Generating — next turn queued" : "Generating",
      tone: "info"
    };
  }
  if (generationError) {
    return {
      id: OPERATOR_STATES.ERROR,
      label: generationError.retryable ? "Failed — Retry available" : "Failed",
      tone: "error"
    };
  }
  if (isSystemAudioActive || isMicrophoneActive) {
    const both = isSystemAudioActive && isMicrophoneActive;
    return {
      id: OPERATOR_STATES.LISTENING,
      label: both
        ? "Listening — system + mic"
        : (isSystemAudioActive ? "Listening — system audio" : "Listening — microphone"),
      tone: "success"
    };
  }
  return {
    id: OPERATOR_STATES.READY,
    label: "Ready",
    tone: "default"
  };
}

function nextResetSnapshot() {
  return {
    history: [],
    aiResponse: "",
    generationError: null,
    selectedQuestions: [],
    pendingSpeechQueue: [],
    queuedSpeechCount: 0,
    lastAsk: { text: "", source: "microphone" }
  };
}

// Client watchdog must be slightly above the server 25s LLM abort so a normal
// complete answer is not cut by the browser first. If fetch/retrieval never
// returns, this is what releases the Generating lock.
const CLIENT_GENERATION_TIMEOUT_MS = 28000;
const GENERATION_WATCHDOG_GRACE_MS = 2000;
const MAX_QUEUED_SPEECH_TURNS = 1;

function enqueueLatestSpeechTurn(queue = [], row, max = MAX_QUEUED_SPEECH_TURNS) {
  const next = Array.isArray(queue) ? queue.slice() : [];
  if (!row || !String(row.text || "").trim()) return next;
  const id = row.utteranceId;
  const withoutDup = id ? next.filter((item) => item.utteranceId !== id) : next;
  withoutDup.push(row);
  const cap = Math.max(1, Number(max) || MAX_QUEUED_SPEECH_TURNS);
  return withoutDup.slice(-cap);
}

function armGenerationTimeout(controller, ms = CLIENT_GENERATION_TIMEOUT_MS) {
  if (!controller || typeof controller.abort !== "function") {
    return () => {};
  }
  let fired = false;
  const timer = setTimeout(() => {
    fired = true;
    try {
      controller.abort();
    } catch {
      // abort must never throw into the interview UI
    }
  }, Math.max(1000, Number(ms) || CLIENT_GENERATION_TIMEOUT_MS));
  return () => {
    try { clearTimeout(timer); } catch { /* ignore */ }
    return fired;
  };
}

// Whole-utterance-only phrases -- an exact match to one of these carries no substantive
// ask on its own. Deliberately does NOT include recovery-signal phrases ("I'm blank", "where
// was I") -- those ARE a genuine request for the copilot's help and must keep flowing through
// to chat.js's isRecoverySignal handling, not get silenced here.
const FILLER_PHRASES = new Set([
  "hmm", "hmmm", "uh", "uhh", "okay", "ok", "yes", "yeah", "yep", "right", "correct",
  "go ahead", "continue", "carry on", "please continue", "next question", "i see",
  "alright", "fine", "sure", "exactly", "understood", "thats right", "thats the question",
  "and so on", "so on"
]);

// Closed class of leave-taking / social closing. Not a growing SAP keyword list.
const SOCIAL_CLOSE = /\b(have a (nice|good|great) (day|one|evening|night|weekend)|take care|good\s*bye|bye bye|talk (to you )?later|see you( later)?|thanks for your time)\b/;

function clausesOf(rawText = "") {
  return String(rawText || "")
    .toLowerCase()
    .split(/[.?!,]+|\band\b/)
    .map((s) => s.replace(/[^a-z0-9\s]/g, "").trim())
    .filter(Boolean);
}

function isNonSubstantiveFiller(rawText = "") {
  const clauses = clausesOf(rawText);
  if (clauses.length === 0) return true;
  return clauses.every((clause) => FILLER_PHRASES.has(clause));
}

function isSocialClosing(rawText = "") {
  const text = String(rawText || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text || !SOCIAL_CLOSE.test(text)) return false;
  const remainder = text.replace(SOCIAL_CLOSE, " ").replace(/\s+/g, " ").trim();
  if (!remainder) return true;
  return clausesOf(remainder).every((clause) => FILLER_PHRASES.has(clause));
}

function shouldSkipAutoSubmit(rawText = "") {
  return isNonSubstantiveFiller(rawText) || isSocialClosing(rawText);
}

module.exports = {
  LIVE_SESSION_KEY,
  OPERATOR_STATES,
  CLIENT_GENERATION_TIMEOUT_MS,
  GENERATION_WATCHDOG_GRACE_MS,
  MAX_QUEUED_SPEECH_TURNS,
  createLiveSessionId,
  getOrCreateLiveSessionId,
  rotateLiveSessionId,
  canStartTurn,
  shouldReuseQuestionRow,
  isGenerationHistoryItem,
  historyForGeneration,
  deriveOperatorState,
  nextResetSnapshot,
  enqueueLatestSpeechTurn,
  armGenerationTimeout,
  shouldSkipAutoSubmit,
  isNonSubstantiveFiller,
  isSocialClosing
};
