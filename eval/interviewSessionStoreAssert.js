const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { appendQa, readSession, DATA_DIR, safeSessionId } = require("../lib/interviewSessionStore");

const a = `testA_${Date.now()}`;
const b = `testB_${Date.now()}`;
const r1 = appendQa(a, { model: "gpt-4o-mini", source: "test" }, {
  question: "Q1",
  questionRaw: "No, Q1",
  questionResolved: "Original question. Correction: No, Q1",
  answerShown: "Answer one",
  status: "completed",
  source: "system",
  interviewContext: {
    questionIntent: "CORRECTION",
    questionTopic: "GRC",
    depth: "deep",
    correctionDetected: true,
    unresolvedFacets: ["Excel validation"]
  },
  retrieval: [{ id: "chunk-1", label: "Excel analysis", text: "must not persist" }],
  retryCount: 0,
  latencyMs: 12
});
const r2 = appendQa(a, { model: "gpt-4o-mini" }, {
  question: "Q1",
  answerShown: "Answer one retry",
  status: "completed",
  retryCount: 1,
  latencyMs: 9
});
const r3 = appendQa(b, { model: "gpt-4o-mini" }, {
  question: "Other interview",
  answerShown: "Must not mix",
  status: "failed",
  retryCount: 0
});
assert.ok(r1.ok && r2.ok && r3.ok);
const sessA = readSession(a);
const sessB = readSession(b);
assert.strictEqual(sessA.qa.length, 2);
assert.strictEqual(sessA.qa[0].answerShown, "Answer one");
assert.strictEqual(sessA.schemaVersion, 2);
assert.strictEqual(sessA.qa[0].questionRaw, "No, Q1");
assert.strictEqual(sessA.qa[0].questionIntent, "CORRECTION");
assert.strictEqual(sessA.qa[0].source, "system");
assert.strictEqual(sessA.qa[0].candidateTranscript, undefined);
assert.doesNotMatch(JSON.stringify(sessA), /must not persist/);
assert.strictEqual(sessA.qa[1].retryCount, 1);
assert.strictEqual(sessB.qa.length, 1);
assert.doesNotMatch(JSON.stringify(sessA), /Must not mix/);
assert.strictEqual(safeSessionId("bad id"), null);
assert.strictEqual(appendQa("no", {}, { question: "x" }).ok, false);
assert.doesNotMatch(JSON.stringify(sessA), /apiKey|sk-|BEGIN /);

const old = `oldSchema_${Date.now()}`;
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.writeFileSync(path.join(DATA_DIR, `${old}.json`), JSON.stringify({
  sessionId: old,
  startedAt: new Date().toISOString(),
  qa: [{ question: "legacy", answerShown: "legacy answer" }],
  evaluation: []
}));
assert.strictEqual(readSession(old).qa[0].question, "legacy");

const chat = fs.readFileSync(path.join(__dirname, "../pages/api/chat.js"), "utf8");
const prompt = fs.readFileSync(path.join(__dirname, "../lib/prompt/interviewPrompt.js"), "utf8");
assert.match(chat, /appendQa/);
assert.doesNotMatch(prompt, /interview-sessions/);
assert.doesNotMatch(chat, /readSession\(/);
assert.match(chat, /History is non-critical/);

fs.unlinkSync(path.join(DATA_DIR, `${a}.json`));
fs.unlinkSync(path.join(DATA_DIR, `${b}.json`));
fs.unlinkSync(path.join(DATA_DIR, `${old}.json`));
console.log("interviewSessionStoreAssert: PASS");
