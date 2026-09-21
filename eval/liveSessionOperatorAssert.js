const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  LIVE_SESSION_KEY,
  OPERATOR_STATES,
  createLiveSessionId,
  getOrCreateLiveSessionId,
  rotateLiveSessionId,
  canStartTurn,
  shouldReuseQuestionRow,
  historyForGeneration,
  deriveOperatorState,
  nextResetSnapshot
} = require("../lib/liveSessionOperator");
const { buildBoundedHistory } = require("../lib/interviewContext");

function memoryStorage(seed = {}) {
  const store = { ...seed };
  return {
    getItem(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
    setItem(key, value) { store[key] = String(value); },
    _store: store
  };
}

const firstId = getOrCreateLiveSessionId(memoryStorage());
assert.match(firstId, /^live_[a-z0-9]+_[a-z0-9]+$/i);
const sticky = memoryStorage({ [LIVE_SESSION_KEY]: firstId });
assert.strictEqual(getOrCreateLiveSessionId(sticky), firstId);
const rotated = rotateLiveSessionId(sticky);
assert.notStrictEqual(rotated, firstId);
assert.strictEqual(sticky.getItem(LIVE_SESSION_KEY), rotated);
assert.notStrictEqual(createLiveSessionId(1, () => 0.1), createLiveSessionId(2, () => 0.2));

assert.strictEqual(canStartTurn({ isProcessing: false }), true);
assert.strictEqual(canStartTurn({ isProcessing: true }), false);
assert.strictEqual(canStartTurn({ isProcessing: true, manual: true }), false);

assert.strictEqual(shouldReuseQuestionRow({
  retry: true,
  lastQuestionId: "q_1"
}), true);
assert.strictEqual(shouldReuseQuestionRow({
  continuing: true,
  utteranceId: "u1",
  lastUtteranceId: "u1",
  lastQuestionId: "q_1"
}), true);
assert.strictEqual(shouldReuseQuestionRow({
  continuing: true,
  utteranceId: "u2",
  lastUtteranceId: "u1",
  lastQuestionId: "q_1"
}), false);
assert.strictEqual(shouldReuseQuestionRow({ retry: false, continuing: false, lastQuestionId: "q_1" }), false);

const mixed = [
  { type: "question", text: "What is IAG?", status: "completed", questionId: "q1" },
  { type: "response", text: "Could not generate an answer.", status: "error" },
  { type: "response", text: "Partial streamed text", status: "interrupted" },
  { type: "response", text: "IAG is SAP's cloud access-governance layer.", status: "completed", questionId: "q1" },
  { type: "question", text: "pending", status: "pending" }
];
const generationHistory = historyForGeneration(mixed);
assert.deepStrictEqual(generationHistory.map((item) => item.text), [
  "What is IAG?",
  "IAG is SAP's cloud access-governance layer."
]);
const bounded = buildBoundedHistory(generationHistory);
assert.doesNotMatch(JSON.stringify(bounded), /Could not generate|Partial streamed/);
assert.match(JSON.stringify(bounded), /cloud access-governance/);

assert.strictEqual(deriveOperatorState({ isProcessing: true }).id, OPERATOR_STATES.GENERATING);
assert.match(deriveOperatorState({ isProcessing: true, queuedSpeechCount: 1 }).label, /queued/i);
assert.strictEqual(deriveOperatorState({ generationError: { retryable: true } }).id, OPERATOR_STATES.ERROR);
assert.strictEqual(deriveOperatorState({ isSystemAudioActive: true }).id, OPERATOR_STATES.LISTENING);
assert.strictEqual(deriveOperatorState({}).id, OPERATOR_STATES.READY);

const reset = nextResetSnapshot();
assert.deepStrictEqual(reset.history, []);
assert.strictEqual(reset.generationError, null);
assert.strictEqual(reset.queuedSpeechCount, 0);

const interview = fs.readFileSync(path.join(__dirname, "../pages/interview.js"), "utf8");
const historySlice = fs.readFileSync(path.join(__dirname, "../redux/historySlice.js"), "utf8");
assert.match(interview, /liveSessionOperator/);
assert.match(interview, /historyForGeneration/);
assert.match(interview, /shouldReuseQuestionRow/);
assert.match(interview, /rotateLiveSessionId/);
assert.match(interview, /canStartTurn/);
assert.match(interview, /deriveOperatorState/);
assert.match(interview, /resetLiveInterviewSession/);
assert.match(interview, /sessionEpochRef/);
assert.match(interview, /queuedTurnCount/);
assert.match(interview, /retry:\s*true/);
assert.match(historySlice, /clearHistory/);
assert.match(interview, /if \(!canStartTurn\(\{ isProcessing: isProcessingRef\.current \}\)\)/);
assert.match(interview, /if \(isProcessingRef\.current\) setSelectedQuestions\(\[\]\)/);

console.log("liveSessionOperatorAssert: PASS");
