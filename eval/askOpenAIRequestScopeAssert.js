/**
 * P0 runtime stability — askOpenAI request-scoped question recovery.
 * Tests actual recovery helper behavior (not a source-string-only check).
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  normalizeRequestQuestion,
  resolveRecoveryQuestion,
  buildAskRecoveryText,
  assertDistinctRequestQuestions
} = require("../lib/askOpenAIRequestScope.js");
const {
  buildPrincipleLevelFallback,
  looksIncompleteSpokenAnswer
} = require("../lib/generationGuard.js");

const ROOT = path.join(__dirname, "..");
const interviewSrc = fs.readFileSync(path.join(ROOT, "pages/interview.js"), "utf8");

function looksIncompleteStub(text) {
  const t = String(text || "").trim();
  if (!t) return true;
  return /,\s*$|and\s*$|the\s*$/i.test(t) || t.split(/\s+/).length < 4;
}

function fallbackStub(q) {
  return `When I approach ${q}, I start from the verified control plane and validate with evidence.`;
}

// --- Source wiring: interview.js must use request-scoped recovery, not unbound `question` ---
assert.match(interviewSrc, /from ['"]\.\.\/lib\/askOpenAIRequestScope['"]/);
assert.match(interviewSrc, /const requestQuestion = normalizeRequestQuestion\(text\)/);
assert.match(interviewSrc, /buildAskRecoveryText\(\{[\s\S]*?requestQuestion/);
assert.doesNotMatch(
  interviewSrc,
  /buildPrincipleLevelFallback\(\s*question\s*\|\|/
);
assert.doesNotMatch(
  interviewSrc,
  /buildPrincipleLevelFallback\(\s*question\s*\|\|\s*lastAskRef/
);

// Unbound `question` must not appear as a free identifier inside askOpenAI recovery branches.
{
  const askStart = interviewSrc.indexOf("const askOpenAI = async");
  assert.ok(askStart > 0, "askOpenAI declaration present");
  const askBody = interviewSrc.slice(askStart, askStart + 45000);
  const unbound = askBody.match(/(?<![.\w])question(?!\s*[:=]|\s*\(|Id|History|Texts|Id\b)/g) || [];
  // Property keys `question:` and decideInterviewTurn({ question: text }) are allowed;
  // free-identifier recovery uses were the ReferenceError source.
  const freeUses = (askBody.match(/buildPrincipleLevelFallback\(\s*question\b/g) || [])
    .concat(askBody.match(/[^.\w]question\s*\|\|\s*lastAskRef/g) || []);
  assert.equal(freeUses.length, 0, "askOpenAI must not reference unbound question for recovery");
}

// --- Behavioral: normal complete stream ---
{
  const q = "How do you configure MSMP workflows?";
  const result = buildAskRecoveryText({
    streamedResponse: "When I configure MSMP I open GRFNMW_CONFIGURE and walk the initiator path through validation.",
    requestQuestion: q,
    looksIncomplete: looksIncompleteSpokenAnswer,
    buildFallback: buildPrincipleLevelFallback
  });
  assert.equal(result.ok, true);
  assert.equal(result.reason, "stream");
  assert.equal(result.requestQuestion, q);
  assert.match(result.text, /MSMP|GRFNMW_CONFIGURE/i);
}

// --- Empty stream → same-question fallback, no ReferenceError ---
{
  const q = "How do you troubleshoot Business Reports Excessive SoD Violations?";
  const result = buildAskRecoveryText({
    streamedResponse: "",
    requestQuestion: q,
    looksIncomplete: looksIncompleteStub,
    buildFallback: fallbackStub
  });
  assert.equal(result.ok, true);
  assert.equal(result.reason, "empty-fallback");
  assert.equal(result.requestQuestion, q);
  assert.match(result.text, /SoD Violations/i);
}

// --- Incomplete spoken answer → same-question fallback ---
{
  const q = "Explain your SAP GRC Health Check Approach?";
  const result = buildAskRecoveryText({
    streamedResponse: "GRC Access Control has four capabilities,",
    requestQuestion: q,
    looksIncomplete: looksIncompleteStub,
    buildFallback: fallbackStub
  });
  assert.equal(result.ok, true);
  assert.equal(result.reason, "incomplete-fallback");
  assert.equal(result.requestQuestion, q);
  assert.match(result.text, /Health Check Approach/i);
  assert.doesNotMatch(result.text, /four capabilities,/);
}

// --- Throttled / retained request question across simulated dispatch ---
{
  const requestQuestion = normalizeRequestQuestion("Compare IAS and IPS.");
  let retained = "";
  const throttledDispatch = (partial) => {
    retained = buildAskRecoveryText({
      streamedResponse: partial,
      requestQuestion,
      looksIncomplete: () => false,
      buildFallback: fallbackStub
    }).requestQuestion;
  };
  throttledDispatch("When I compare IAS");
  throttledDispatch("When I compare IAS and IPS I keep authentication separate from provisioning.");
  assert.equal(retained, "Compare IAS and IPS.");
}

// --- Retry/recovery path: fallback throws must not surface unbound identifier ---
{
  const q = "Missing Firefighter session logs";
  const result = buildAskRecoveryText({
    streamedResponse: "",
    requestQuestion: q,
    looksIncomplete: () => true,
    buildFallback: () => {
      throw new Error("provider down");
    }
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "fallback-threw");
  assert.equal(result.requestQuestion, q);
}

// --- Empty / invalid question: controlled path, no stale lastAsk injection ---
{
  const result = buildAskRecoveryText({
    streamedResponse: "",
    requestQuestion: "   ",
    looksIncomplete: looksIncompleteStub,
    buildFallback: (stale) => `LEAKED:${stale || "PREVIOUS_TURN"}`
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "empty-question");
  assert.equal(result.text, "");
  assert.equal(resolveRecoveryQuestion(""), "");
  assert.equal(normalizeRequestQuestion(null), "");
}

// --- Two consecutive questions: second never uses first ---
{
  const first = "How to troubleshoot Business Reports Excessive SoD Violations?";
  const second = "Explain your SAP GRC Health Check Approach?";
  const r1 = buildAskRecoveryText({
    streamedResponse: "",
    requestQuestion: first,
    looksIncomplete: looksIncompleteStub,
    buildFallback: fallbackStub
  });
  const r2 = buildAskRecoveryText({
    streamedResponse: "",
    requestQuestion: second,
    looksIncomplete: looksIncompleteStub,
    buildFallback: fallbackStub
  });
  assert.equal(r1.requestQuestion, first);
  assert.equal(r2.requestQuestion, second);
  assert.notEqual(r1.requestQuestion, r2.requestQuestion);
  assert.match(r2.text, /Health Check/i);
  assert.doesNotMatch(r2.text, /SoD Violations/i);
  const distinct = assertDistinctRequestQuestions(first, second);
  assert.equal(distinct.distinct, true);
}

// --- Rapid / concurrent simulated asks retain per-request scope ---
{
  const asks = [
    "Stuck MSMP approval workflow",
    "Missing Firefighter session logs",
    "Missing BW Analysis Authorization"
  ];
  const results = asks.map((requestQuestion) =>
    buildAskRecoveryText({
      streamedResponse: "",
      requestQuestion,
      looksIncomplete: looksIncompleteStub,
      buildFallback: fallbackStub
    })
  );
  results.forEach((result, index) => {
    assert.equal(result.requestQuestion, asks[index]);
    assert.match(result.text, new RegExp(asks[index].slice(0, 12).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  });
  assert.equal(new Set(results.map((r) => r.requestQuestion)).size, asks.length);
}

console.log("askOpenAIRequestScopeAssert: PASS");
