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
  findRetryTarget,
  historyBeforeQuestion,
  historyForGeneration,
  deriveOperatorState,
  nextResetSnapshot,
  enqueueSpeechTurn,
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

const failedTurns = [
  { type: "question", text: "How do I configure MSMP?", questionId: "q_old", source: "system", utteranceId: "u_old" },
  { type: "response", text: "Service unavailable.", status: "error", questionId: "q_old", retryCount: 1 },
  { type: "question", text: "How do I troubleshoot IPS?", questionId: "q_new", source: "microphone", utteranceId: "u_new" },
  { type: "response", text: "Timed out.", status: "error", questionId: "q_new", retryCount: 0 }
];
assert.deepStrictEqual(findRetryTarget(failedTurns, failedTurns[1]), {
  text: "How do I configure MSMP?",
  source: "system",
  questionId: "q_old",
  utteranceId: "u_old",
  retryCount: 1
}, "Retry from an older error card must target that card's question, not the latest question");
assert.deepStrictEqual(historyBeforeQuestion(failedTurns, "q_new").map((item) => item.questionId), ["q_old", "q_old"]);
assert.deepStrictEqual(historyBeforeQuestion(failedTurns, "q_old"), []);

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
assert.strictEqual(MAX_QUEUED_SPEECH_TURNS, 4);
const firstPark = enqueueSpeechTurn([], { text: "How do you configure MSMP?", utteranceId: "u1" });
const secondPark = enqueueSpeechTurn(firstPark.queue, { text: "What about BRFplus?", utteranceId: "u2" });
assert.deepStrictEqual(secondPark.queue.map((item) => item.text), [
  "How do you configure MSMP?",
  "What about BRFplus?"
]);
assert.deepStrictEqual(secondPark.overflow, []);
const updated = enqueueSpeechTurn(secondPark.queue, { text: "What about BRFplus agent rules?", utteranceId: "u2" });
assert.deepStrictEqual(updated.queue.map((item) => item.utteranceId), ["u1", "u2"]);
assert.strictEqual(updated.queue[1].text, "What about BRFplus agent rules?");
const packed = ["a", "b", "c", "d"].map((text, index) => ({ text, utteranceId: `u${index}` }));
const overflowed = enqueueSpeechTurn(packed, { text: "e", utteranceId: "u4" });
assert.deepStrictEqual(overflowed.queue.map((item) => item.text), ["b", "c", "d", "e"]);
assert.deepStrictEqual(overflowed.overflow.map((item) => item.text), ["a"]);
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
assert.match(interview, /findRetryTarget/);
assert.match(interview, /historyBeforeQuestion/);
assert.match(interview, /onClick=\{\(\) => retryQuestionFromResponse\(item\)\}/);
assert.match(interview, /rotateLiveSessionId/);
assert.match(interview, /canStartTurn/);
assert.match(interview, /deriveOperatorState/);
assert.match(interview, /resetLiveInterviewSession/);
assert.match(interview, /sessionEpochRef/);
assert.match(interview, /queuedTurnCount/);
assert.match(interview, /retry:\s*true/);
assert.match(interview, /armGenerationTimeout/);
assert.match(interview, /enqueueSpeechTurn/);
assert.match(interview, /UNANSWERED/);
assert.match(interview, /sessionPreparation/);
assert.match(interview, /activeRequestRef.current !== requestController/);
assert.match(interview, /stopInFlightGeneration/);
assert.match(interview, /acceptCapturedTurn/);
assert.match(interview, /shouldAutoSubmitSource/);
assert.match(interview, /CLIENT_GENERATION_TIMEOUT_MS/);
assert.match(interview, /current_streaming/);
assert.match(interview, /The answer may be incomplete/);
assert.match(chatSrc, /writeSSEError\(res, errorMessage\)/);
assert.doesNotMatch(chatSrc, /else if \(!streamStarted\)/);
assert.match(historySlice, /clearHistory/);
assert.match(interview, /if \(!canStartTurn\(\{ isProcessing: isProcessingRef\.current \}\)\)/);
assert.match(interview, /if \(isProcessingRef\.current\) setSelectedQuestions\(\[\]\)/);

const prep = require("../lib/sessionPreparation");
const prepStore = memoryStorage();
prep.writeSessionPreparation(prepStore, "live_a_1", { role: "IAM architect", round: "technical", focus: "IAG and GRC" });
prep.writeSessionPreparation(prepStore, "live_b_2", { role: "Other role" });
assert.strictEqual(prep.readSessionPreparation(prepStore, "live_a_1").role, "IAM architect");
assert.strictEqual(prep.readSessionPreparation(prepStore, "live_b_2").role, "Other role");
assert.match(prep.formatSessionPreparation({ role: "IAM architect", focus: "Fiori" }), /not candidate experience/);
assert.strictEqual(prep.formatSessionPreparation({}), "");

console.log("liveSessionOperatorAssert: PASS");
