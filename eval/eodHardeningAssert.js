/**
 * EOD hardening gates — offline, no paid calls.
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { BUDGETS_MS, createTraceId, createStageTimer } = require("../lib/liveBudgets.js");
const { isSafeModeEnabled, resolveSafeModeAnswer, shapeSpokenSafe } = require("../lib/safeModeRouter.js");
const {
  loadPack,
  matchPreparedAnswer,
  DEFAULT_PROFILE_SLUG,
  resetPreparedPackCache
} = require("../lib/preparedAnswerPack.js");
const { runAnswerFallbackLadder, buildPrincipleSpokenAnswer } = require("../lib/liveReliability.js");
const { looksIncompleteSpokenAnswer, stripUngroundedSapEntities } = require("../lib/generationGuard.js");
const { admitQuestion } = require("../lib/questionAdmission.js");

let failures = [];
function check(name, fn) {
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

check("budgets-defaults", () => {
  assert.strictEqual(BUDGETS_MS.firstToken, 2500);
  assert.strictEqual(BUDGETS_MS.stall, 4000);
  assert.strictEqual(BUDGETS_MS.total, 20000);
  assert.match(createTraceId(), /^tr_/);
  const timer = createStageTimer();
  timer.mark("x");
  assert.ok(timer.snapshot().stages.x >= 0);
});

check("safe-mode-default-on", () => {
  assert.strictEqual(isSafeModeEnabled({}), true);
  assert.strictEqual(isSafeModeEnabled({ safeMode: false }), false);
});

resetPreparedPackCache();
const pack = loadPack(DEFAULT_PROFILE_SLUG);
check("prepared-pack-drafted", () => {
  assert.ok((pack.entries || []).length >= 40, `entries=${pack.entries?.length}`);
  assert.ok((pack.entries || []).length <= 60);
  assert.strictEqual((pack.approvedEntries || []).length, 0, "drafts must not be APPROVED yet");
  assert.ok(pack.entries.every((e) => e.approval_status === "NEEDS_REVIEW"));
});

check("prepared-pack-not-served-until-approved", () => {
  const hit = matchPreparedAnswer("How do you configure an MSMP workflow for access requests?");
  assert.strictEqual(hit.hit, false);
});

check("safe-mode-msmp-serves-nonempty", () => {
  const brf = fs.readFileSync(path.join(__dirname, "../knowledge/grc/brf-plus.md"), "utf8");
  const safe = resolveSafeModeAnswer({
    question: "How do you configure an MSMP workflow for access requests?",
    knowledgeText: brf
  });
  assert.strictEqual(safe.served, true);
  assert.ok(safe.answer.trim().length > 40);
  assert.ok(
    ["PREPARED_PACK", "VERIFIED_WORKFLOW", "RETRIEVED_PROCEDURE", "CONCEPTUAL_KNOWLEDGE", "GENERATION"].includes(safe.route)
    || safe.continueToGeneration === true
  );
  assert.doesNotMatch(safe.answer, /[*#`]/);
  assert.ok(!looksIncompleteSpokenAnswer(safe.answer));
});

check("I-1-msmp-incomplete-class", () => {
  assert.strictEqual(looksIncompleteSpokenAnswer("To configure MSMP this includes"), true);
  const ladder = runAnswerFallbackLadder("To configure MSMP");
  assert.ok(ladder.answer.trim().length > 20);
  assert.ok(!looksIncompleteSpokenAnswer(ladder.answer));
});

check("I-2-btp-pillars-safe-no-numbered-cutoff", () => {
  const btp = fs.readFileSync(path.join(__dirname, "../knowledge/btp/btp-overview.md"), "utf8");
  const safe = resolveSafeModeAnswer({
    question: "What are the pillars of SAP BTP?",
    knowledgeText: btp
  });
  assert.ok(safe.answer);
  assert.doesNotMatch(safe.answer, /^\s*\d+\.\s/m);
  assert.doesNotMatch(safe.answer, /identifiers are not confirmed in supporting knowledge for this turn/i);
  assert.ok(!looksIncompleteSpokenAnswer(safe.answer));
  assert.match(safe.answer, /BTP|subaccount|role collection|Identity Authentication|IAS/i);
  assert.ok(["CONCEPTUAL_KNOWLEDGE", "PREPARED_PACK", "VERIFIED_WORKFLOW"].includes(safe.route));
});

check("ladder-principle", () => {
  const p = buildPrincipleSpokenAnswer("How to configure MSMP?");
  assert.ok(p && p.length > 40);
  assert.doesNotMatch(p, /principle level because|identifiers are not confirmed|live path recovers/i);
  assert.match(p, /identity|governance|enforcement|validation|configuration/i);
});

check("shape-spoken-safe", () => {
  const shaped = shapeSpokenSafe("**Decision:** do X\n- item", "Headline");
  assert.doesNotMatch(shaped, /\*\*|^\s*-/m);
});

check("admission-short-msmp", () => {
  assert.strictEqual(admitQuestion("How to configure MSMP?").decision, "ANSWER");
});

check("wiring-files", () => {
  const chat = fs.readFileSync(path.join(__dirname, "../pages/api/chat.js"), "utf8");
  assert.match(chat, /isSafeModeEnabled/);
  assert.match(chat, /runAnswerFallbackLadder/);
  assert.match(chat, /createTraceId/);
  assert.ok(fs.existsSync(path.join(__dirname, "../pages/preflight.js")));
  assert.ok(fs.existsSync(path.join(__dirname, "../pages/api/preflight.js")));
  assert.ok(fs.existsSync(path.join(__dirname, "../data/verified-content/cards/enumeration-btp-capability-framing.json")));
});

check("ui-no-failed-interrupted-labels", () => {
  const interview = fs.readFileSync(path.join(__dirname, "../pages/interview.js"), "utf8");
  assert.doesNotMatch(interview, /Generation failed/);
  assert.doesNotMatch(interview, /status === 'interrupted' \? 'Interrupted'/);
  assert.match(interview, /Recovered with a complete spoken answer/);
  assert.doesNotMatch(interview, /I would answer this at principle level while the live path recovers/);
});

check("strip-grfcp2", () => {
  const brf = fs.readFileSync(path.join(__dirname, "../knowledge/grc/brf-plus.md"), "utf8");
  const cleaned = stripUngroundedSapEntities("I open transaction code GRFCP2 now.", brf);
  assert.doesNotMatch(cleaned, /GRFCP2/);
});

if (failures.length) {
  console.error("eodHardeningAssert: FAIL");
  for (const row of failures) console.error(" -", row);
  process.exitCode = 1;
} else {
  console.log(`eodHardeningAssert: PASS (pack=${pack.entries.length} NEEDS_REVIEW)`);
}
