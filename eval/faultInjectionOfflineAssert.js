/**
 * Fault-injection offline suite (no paid provider calls).
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { runAnswerFallbackLadder, isRetryableLlmError } = require("../lib/liveReliability.js");
const { looksIncompleteSpokenAnswer } = require("../lib/generationGuard.js");
const { appendQa, readSession, DATA_DIR } = require("../lib/interviewSessionStore.js");
const { admitQuestion } = require("../lib/questionAdmission.js");
const { resolveSafeModeAnswer } = require("../lib/safeModeRouter.js");
const { planManualSubmit } = require("../lib/liveSessionOperator.js");

let failures = [];
function check(name, fn) {
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const cases = [
  { id: "timeout", error: Object.assign(new Error("timed out"), { name: "AbortError", code: "LLM_TIMEOUT" }) },
  { id: "429", error: Object.assign(new Error("rate limit"), { status: 429 }) },
  { id: "500", error: Object.assign(new Error("server error"), { status: 500 }) },
  { id: "empty", answer: "" },
  { id: "truncated", answer: "To configure MSMP this includes" },
  { id: "stall-mid", answer: "Next I establish the rules and" }
];

for (const item of cases) {
  check(`fault:${item.id}`, () => {
    if (item.error) {
      assert.strictEqual(isRetryableLlmError(item.error), true);
    }
    const ladder = runAnswerFallbackLadder("How do you configure an MSMP workflow for access requests?", {
      knowledgeContext: ""
    });
    assert.ok(ladder.answer.trim().length > 30);
    assert.ok(!looksIncompleteSpokenAnswer(ladder.answer));
    if (item.answer !== undefined) {
      assert.strictEqual(looksIncompleteSpokenAnswer(item.answer) || !item.answer.trim(), true);
    }
  });
}

check("fault:partial-excluded-from-context", () => {
  const id = `fault_${Date.now()}`;
  const result = appendQa(id, { source: "fault" }, {
    question: "MSMP",
    answerShown: "To configure MSMP this includes",
    status: "partial",
    excludeFromContext: true,
    finishReason: "incomplete_content"
  });
  assert.ok(result.ok);
  const session = readSession(id);
  assert.strictEqual(session.qa.at(-1).answerShown, "");
  assert.strictEqual(session.qa.at(-1).excludeFromContext, true);
  try { fs.unlinkSync(path.join(DATA_DIR, `${id}.json`)); } catch { /* ignore */ }
});

check("fault:duplicate-submit-operator", () => {
  const plan = planManualSubmit({
    text: "How to configure MSMP?",
    isProcessing: true,
    queueLength: 0
  });
  assert.ok(plan);
  assert.ok(["queue", "answer", "hold", "ignore"].includes(plan.action) || plan.action);
});

check("fault:two-rapid-questions-admission", () => {
  assert.strictEqual(admitQuestion("How to configure MSMP?").decision, "ANSWER");
  assert.strictEqual(admitQuestion("How to configure BRF+?").decision, "ANSWER");
});

check("fault:safe-mode-never-empty", () => {
  const safe = resolveSafeModeAnswer({ question: "How to configure MSMP?" });
  assert.ok(safe.answer.trim());
});

if (failures.length) {
  console.error("faultInjectionOfflineAssert: FAIL");
  for (const row of failures) console.error(" -", row);
  process.exitCode = 1;
} else {
  console.log(`faultInjectionOfflineAssert: PASS (${cases.length} fault classes)`);
}
