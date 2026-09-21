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

module.exports = {
  LIVE_SESSION_KEY,
  OPERATOR_STATES,
  createLiveSessionId,
  getOrCreateLiveSessionId,
  rotateLiveSessionId,
  canStartTurn,
  shouldReuseQuestionRow,
  isGenerationHistoryItem,
  historyForGeneration,
  deriveOperatorState,
  nextResetSnapshot
};
