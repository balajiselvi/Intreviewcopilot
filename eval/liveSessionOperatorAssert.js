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
  nextResetSnapshot,
  enqueueLatestSpeechTurn,
  armGenerationTimeout,
  CLIENT_GENERATION_TIMEOUT_MS,
  MAX_QUEUED_SPEECH_TURNS,
  shouldSkipAutoSubmit,
  isNonSubstantiveFiller
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

assert.strictEqual(isNonSubstantiveFiller("Okay."), true);
assert.strictEqual(isNonSubstantiveFiller("Yes, that's the question."), true);
assert.strictEqual(shouldSkipAutoSubmit("Yeah, have a nice day."), true);
assert.strictEqual(shouldSkipAutoSubmit("Thanks for your time."), true);
assert.strictEqual(shouldSkipAutoSubmit("How would you design IAG?"), false);
assert.strictEqual(shouldSkipAutoSubmit("A user cannot post FB01."), false);

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

assert.ok(CLIENT_GENERATION_TIMEOUT_MS > 25000);
assert.strictEqual(MAX_QUEUED_SPEECH_TURNS, 1);
assert.deepStrictEqual(
  enqueueLatestSpeechTurn([{ text: "old", utteranceId: "u1" }], { text: "new", utteranceId: "u2" }).map((i) => i.text),
  ["new"]
);
assert.deepStrictEqual(
  enqueueLatestSpeechTurn([{ text: "same", utteranceId: "u1" }], { text: "same-updated", utteranceId: "u1" }).map((i) => i.text),
  ["same-updated"]
);
let aborted = false;
const fake = { abort() { aborted = true; } };
const disarm = armGenerationTimeout(fake, 20);
assert.strictEqual(typeof disarm, "function");
assert.strictEqual(aborted, false);
disarm();
assert.strictEqual(aborted, false);

const reset = nextResetSnapshot();
assert.deepStrictEqual(reset.history, []);
assert.strictEqual(reset.generationError, null);
assert.strictEqual(reset.queuedSpeechCount, 0);

const interview = fs.readFileSync(path.join(__dirname, "../pages/interview.js"), "utf8");
const historySlice = fs.readFileSync(path.join(__dirname, "../redux/historySlice.js"), "utf8");
const chatSrc = fs.readFileSync(path.join(__dirname, "../pages/api/chat.js"), "utf8");
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
assert.match(interview, /armGenerationTimeout/);
assert.match(interview, /enqueueLatestSpeechTurn/);
assert.match(interview, /stopInFlightGeneration/);
assert.match(interview, /shouldSkipAutoSubmit/);
assert.match(interview, /CLIENT_GENERATION_TIMEOUT_MS/);
assert.match(interview, /current_streaming/);
assert.match(interview, /The answer may be incomplete/);
assert.match(chatSrc, /writeSSEError\(res, errorMessage\)/);
assert.doesNotMatch(chatSrc, /else if \(!streamStarted\)/);
assert.match(historySlice, /clearHistory/);
assert.match(interview, /if \(!canStartTurn\(\{ isProcessing: isProcessingRef\.current \}\)\)/);
assert.match(interview, /if \(isProcessingRef\.current\) setSelectedQuestions\(\[\]\)/);

console.log("liveSessionOperatorAssert: PASS");
