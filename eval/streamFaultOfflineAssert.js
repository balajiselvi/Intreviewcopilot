/**
 * Offline fault-injection for early/incomplete streams — no provider calls.
 * Verifies incomplete answers are excluded from session context persistence.
 */
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { appendQa, readSession, DATA_DIR } = require("../lib/interviewSessionStore.js");

const sessionId = `faulttest_${Date.now()}`;
const result = appendQa(
  sessionId,
  { source: "offline-fault", model: "none" },
  {
    question: "How to configure MSMP?",
    answerShown: "To configure MSMP this includes",
    status: "partial",
    finishReason: "incomplete_content",
    excludeFromContext: true,
    usage: { finish_reason: "incomplete_content", firstTokenMs: 15800, streamEndMs: 16200 },
    stageTiming: { firstTokenMs: 15800, streamEndMs: 16200, stages: { first_token: 15800 } }
  }
);
assert.strictEqual(result.ok, true, "appendQa must succeed");
const session = readSession(sessionId);
assert.ok(session, "session exists");
const row = session.qa[session.qa.length - 1];
assert.strictEqual(row.excludeFromContext, true);
assert.strictEqual(row.answerShown, "", "partial answers must not keep spoken text for context");
assert.strictEqual(row.status, "partial");
assert.ok(row.stageTiming && row.stageTiming.firstTokenMs === 15800);

// Cleanup test session file
try {
  fs.unlinkSync(path.join(DATA_DIR, `${sessionId}.json`));
} catch {
  // non-fatal
}

console.log("streamFaultOfflineAssert: PASS");
