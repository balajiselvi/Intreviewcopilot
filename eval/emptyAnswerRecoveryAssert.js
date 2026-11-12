/**
 * Fix 2 — safe empty-answer recovery (offline, no paid provider calls).
 */
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  recoverNonEmptySpokenAnswer,
  stripUngroundedSapEntities,
  findUngroundedTransactionClaims,
  isMetaRefusalText,
  looksIncompleteSpokenAnswer,
  buildPrincipleLevelFallback,
  procedureEligibleForRecovery
} = require("../lib/generationGuard.js");
const {
  shouldPreferRetrievedProcedure,
  procedureTaskFit,
  isThinProcedureChunk
} = require("../lib/procedureRetention.js");
const { appendQa, readSession, DATA_DIR } = require("../lib/interviewSessionStore.js");

const ROOT = path.join(__dirname, "..");
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "knowledgeIndex.json"), "utf8"));
const BRF_AGENT_HEADING = "Configure a BRFplus agent rule for MSMP";
const brfAgentSiblings = idx.chunks
  .filter((c) => c.sourceFile === "brf-plus.md" && c.heading === BRF_AGENT_HEADING)
  .sort((a, b) => Number(a.chunkIndex || 0) - Number(b.chunkIndex || 0));
assert.ok(brfAgentSiblings.length >= 3, "BRF sibling trio required");
const heading = brfAgentSiblings[0];
const body = brfAgentSiblings.find((c) => !isThinProcedureChunk(c.content)) || brfAgentSiblings[1];
// Thin heading-only chunk acts as the citation seed after index rebuild.
const citation = heading;
assert.ok(citation && body && heading, "BRF sibling trio required");
assert.ok(isThinProcedureChunk(citation.content), "citation/heading sibling is thin");

const brfKnowledge = fs.readFileSync(path.join(ROOT, "knowledge/grc/brf-plus.md"), "utf8");

// 1) Empty post-strip, no procedure → non-empty non-meta recovery
{
  const recovered = recoverNonEmptySpokenAnswer({
    question: "How to configure BRF+?",
    spoken: "",
    beforeStrip: "",
    procedureSpoken: "",
    localKnowledgeAnswer: "",
    knowledgeText: ""
  });
  assert.ok(recovered.answer.trim().length >= 40, "1) non-empty recovery");
  assert.strictEqual(isMetaRefusalText(recovered.answer), false, "1) non-meta");
  assert.strictEqual(recovered.recovered, true);
  assert.match(String(recovered.answerKind), /recovered_/);
  assert.notEqual(recovered.answer, "");
}

// 2) Unsupported T-code stripped — must not reappear via recovery
{
  const poisoned =
    "I open the BRF+ workbench through the transaction code GRFCP2 and create an application for Access Control.";
  const stripped = stripUngroundedSapEntities(poisoned, "Open BRFPLUS and maintain the decision table.");
  assert.doesNotMatch(stripped, /\bGRFCP2\b/);
  const recovered = recoverNonEmptySpokenAnswer({
    question: "How do you configure a BRF+ agent rule for MSMP?",
    spoken: stripped,
    beforeStrip: poisoned,
    procedureSpoken: "",
    knowledgeText: "Open BRFPLUS and maintain the decision table."
  });
  assert.doesNotMatch(recovered.answer, /\bGRFCP2\b/, "2) GRFCP2 must not leak");
  assert.ok(
    recovered.rejectedPreStripReason || recovered.answerKind !== "recovered_prestrip_validated",
    "2) raw pre-strip with GRFCP2 rejected"
  );
}

// 3) Qualifying same-turn procedure recovery (MSMP-scoped BRF ask)
{
  const pool = [citation, body, heading];
  const prefer = shouldPreferRetrievedProcedure({
    question: "How do you configure a BRF+ agent rule for MSMP?",
    knowledgeText: citation.content,
    procedurePool: pool,
    seedChunks: [citation]
  });
  assert.strictEqual(prefer.prefer, true, "3) prefer after siblings");
  const recovered = recoverNonEmptySpokenAnswer({
    question: "How do you configure a BRF+ agent rule for MSMP?",
    spoken: "",
    beforeStrip: "I open transaction code GRFCP2 now.",
    procedureSpoken: prefer.spoken,
    knowledgeText: brfKnowledge
  });
  assert.strictEqual(recovered.recovered, true);
  assert.strictEqual(recovered.answerKind, "recovered_procedure");
  assert.strictEqual(recovered.flag, "empty_fallback_procedure");
  assert.strictEqual(recovered.routeHint, "RETRIEVED_PROCEDURE");
  assert.doesNotMatch(recovered.answer, /\bGRFCP2\b/);
  assert.notEqual(recovered.routeHint, "VERIFIED_WORKFLOW");
}

// 4) Procedure for wrong product/task rejected
{
  const msmpBody = `## ${body.heading}\n${body.content}`;
  assert.strictEqual(
    procedureTaskFit("How do you configure IAS federation with Entra ID?", msmpBody).ok,
    false
  );
  const eligibility = procedureEligibleForRecovery(
    "How do you configure IAS federation with Entra ID?",
    preferSpokenOrBody()
  );
  assert.strictEqual(eligibility.ok, false, "4) foreign product procedure ineligible");
  const recovered = recoverNonEmptySpokenAnswer({
    question: "How do you configure IAS federation with Entra ID?",
    spoken: "",
    beforeStrip: "",
    procedureSpoken: preferSpokenOrBody(),
    knowledgeText: "IAS federation uses SAML 2.0 trust with the corporate IdP."
  });
  assert.notEqual(recovered.answerKind, "recovered_procedure");
  assert.ok(recovered.rejectedProcedureReason);
}

function preferSpokenOrBody() {
  return body.content;
}

// 5) Truncated answer is not trusted as complete solely because it is long
{
  const truncated =
    "To configure MSMP for Access Control I walk Process Global Settings, Maintain Rules, Maintain Agents, "
    + "Variables and Templates, Paths and Stages, and Route Mapping. This includes";
  assert.strictEqual(looksIncompleteSpokenAnswer(truncated), true);
  const recovered = recoverNonEmptySpokenAnswer({
    question: "How to configure MSMP?",
    spoken: truncated,
    beforeStrip: truncated,
    procedureSpoken: "",
    knowledgeText: fs.readFileSync(path.join(ROOT, "knowledge/grc/msmp.md"), "utf8")
  });
  assert.strictEqual(recovered.recovered, true, "5) incomplete must recover");
  assert.ok(!looksIncompleteSpokenAnswer(recovered.answer) || recovered.answerKind.startsWith("recovered_"));
}

// 6) Valid complete answer unchanged
{
  const good =
    "I open BRFPLUS, maintain the agent decision table for the MSMP stage, activate the function, "
    + "and prove Approvers of Selected Path in Request Status, Instance Status.";
  const recovered = recoverNonEmptySpokenAnswer({
    question: "How do you configure a BRF+ agent rule for MSMP?",
    spoken: good,
    beforeStrip: good,
    procedureSpoken: "",
    knowledgeText: brfKnowledge
  });
  assert.strictEqual(recovered.recovered, false);
  assert.strictEqual(recovered.answerKind, "validated");
  assert.strictEqual(recovered.answer, good);
}

// 7) Non-meta-refusal: principle recovery is not a meta template
{
  const principle = buildPrincipleLevelFallback("How to configure BRF+?");
  assert.strictEqual(isMetaRefusalText(principle), false);
  const recovered = recoverNonEmptySpokenAnswer({
    question: "How to configure BRF+?",
    spoken: "",
    beforeStrip: "",
    knowledgeText: ""
  });
  assert.doesNotMatch(recovered.answer, /I would answer this at principle level because/i);
  assert.doesNotMatch(recovered.answer, /while the live path recovers/i);
}

// 8) Session persistence: partial cleared; recovered completed kept
{
  const sessionId = `fix2_${Date.now()}`;
  appendQa(sessionId, { source: "offline-fix2" }, {
    question: "How to configure MSMP?",
    answerShown: "To configure MSMP this includes",
    status: "partial",
    excludeFromContext: true,
    finishReason: "incomplete_content"
  });
  appendQa(sessionId, { source: "offline-fix2" }, {
    question: "How do you configure a BRF+ agent rule for MSMP?",
    answerShown: "I generate the BRF+ flat-rule shell in Define Workflow-Related MSMP Rules.",
    status: "completed",
    answerKind: "recovered_procedure",
    recovered: true,
    excludeFromContext: false
  });
  const session = readSession(sessionId);
  const partial = session.qa[0];
  const recoveredRow = session.qa[1];
  assert.strictEqual(partial.status, "partial");
  assert.strictEqual(partial.answerShown, "", "8) partial cleared");
  assert.strictEqual(partial.excludeFromContext, true);
  assert.ok(recoveredRow.answerShown.length > 40, "8) recovered completed kept");
  assert.strictEqual(recoveredRow.answerKind, "recovered_procedure");
  assert.strictEqual(recoveredRow.excludeFromContext, false);
  try {
    fs.unlinkSync(path.join(DATA_DIR, `${sessionId}.json`));
  } catch {
    // non-fatal
  }
}

// 9) Streaming/client contract — answer_final event documented in chat.js
{
  const chat = fs.readFileSync(path.join(ROOT, "pages/api/chat.js"), "utf8");
  assert.match(chat, /writeSSEEvent\(res, "answer_final"/);
  const ui = fs.readFileSync(path.join(ROOT, "pages/interview.js"), "utf8");
  assert.match(ui, /answer_final/);
  assert.match(ui, /answerFinalLocked/);
}

// 10) Fix 1 sibling recovery still works
{
  const prefer = shouldPreferRetrievedProcedure({
    question: "How do you configure a BRF+ agent rule for MSMP?",
    knowledgeText: citation.content,
    procedurePool: [citation, body, heading],
    seedChunks: [citation]
  });
  assert.strictEqual(prefer.prefer, true, "10) Fix 1 prefer intact");
  assert.match(String(prefer.reason), /sibling|coherent-source-procedure/i);
  assert.strictEqual(
    shouldPreferRetrievedProcedure({
      question: "How to configure BRF+?",
      knowledgeText: citation.content,
      procedurePool: [citation, body, heading],
      seedChunks: [citation]
    }).prefer,
    false,
    "10) Fix 1 task-fit intact"
  );
}

console.log("emptyAnswerRecoveryAssert: PASS (Fix 2 scenarios 1–10)");
