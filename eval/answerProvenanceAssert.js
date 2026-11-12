/**
 * Fix 3 — answer generation provenance (offline, no paid providers).
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  PROMPT_POLICY_VERSION,
  fingerprintPromptPolicy,
  buildAnswerProvenance,
  classifyRetrievalOutcome,
  sanitizeProvenance,
  normalizeAnswerKind
} = require("../lib/answerProvenance.js");
const { appendQa, readSession, DATA_DIR } = require("../lib/interviewSessionStore.js");
const {
  shouldPreferRetrievedProcedure,
  mergeSameHeadingChunks
} = require("../lib/procedureRetention.js");
const { recoverNonEmptySpokenAnswer } = require("../lib/generationGuard.js");

const ROOT = path.join(__dirname, "..");
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "knowledgeIndex.json"), "utf8"));
const { isThinProcedureChunk } = require("../lib/procedureRetention.js");
// Resolve by stable heading after index rebuild (chunk IDs are content-hash based).
const BRF_AGENT_HEADING = "Configure a BRFplus agent rule for MSMP";
const brfAgentSiblings = idx.chunks
  .filter((c) => c.sourceFile === "brf-plus.md" && c.heading === BRF_AGENT_HEADING)
  .sort((a, b) => Number(a.chunkIndex || 0) - Number(b.chunkIndex || 0));
assert.ok(brfAgentSiblings.length >= 3, "index must contain the live BRF sibling trio");
const heading = brfAgentSiblings[0];
const body = brfAgentSiblings.find((c) => !isThinProcedureChunk(c.content)) || brfAgentSiblings[1];
const citation = heading;
const CITATION = citation.id || citation.chunkId;
const BODY = body.id || body.chunkId;
const HEADING = heading.id || heading.chunkId;
assert.ok(citation && body && heading);

const sessionId = `prov_${Date.now()}`;

// 1) GENERATION turn records route + source IDs
{
  const evidence = [
    { id: "chunk_a", label: "IAS federation", sourceFile: "btp/ias.md", heading: "Federation", chunkIndex: 2 }
  ];
  const prov = buildAnswerProvenance({
    questionId: "q1",
    route: "GENERATION",
    status: "completed",
    model: "gpt-4o-mini",
    evidence,
    answerKind: "validated",
    recovered: false,
    finishReason: "stop",
    systemPromptForFingerprint: "INTERVIEW COPILOT V2.1 OPERATING CONTRACT\n..."
  });
  assert.strictEqual(prov.route, "GENERATION");
  assert.strictEqual(prov.retrieval.outcome, "retrieval_used_for_generation");
  assert.strictEqual(prov.retrieval.chunks[0].id, "chunk_a");
  assert.strictEqual(prov.answerValidation.answerKind, "generated");
  assert.strictEqual(prov.answerValidation.approvedVerified, false);
  assert.ok(prov.promptFingerprint);
  assert.strictEqual(prov.promptPolicyVersion, PROMPT_POLICY_VERSION);
}

// 2) Retrieval miss vs retrieved-but-rejected
{
  const miss = classifyRetrievalOutcome({ evidence: [], procedurePrefer: null, route: "GENERATION" });
  assert.strictEqual(miss.outcome, "retrieval_miss");
  assert.strictEqual(miss.empty, true);

  const rejected = classifyRetrievalOutcome({
    evidence: [{ id: BODY, sourceFile: "brf-plus.md", heading: citation.heading, chunkIndex: 14 }],
    procedurePrefer: {
      prefer: false,
      reason: "task-fit-msmp-scoped-brf",
      enrichment: { enriched: true, chunkIds: [HEADING, BODY, CITATION] }
    },
    route: "GENERATION"
  });
  assert.strictEqual(rejected.outcome, "retrieved_procedure_rejected");
  assert.strictEqual(rejected.empty, false);
  assert.strictEqual(rejected.rejectReason, "task-fit-msmp-scoped-brf");
  assert.notEqual(miss.outcome, rejected.outcome);
}

// 3) Sibling assembly lineage
{
  const merged = mergeSameHeadingChunks(citation, [citation, body, heading]);
  assert.strictEqual(merged.merged, true);
  const prefer = shouldPreferRetrievedProcedure({
    question: "How do you configure a BRF+ agent rule for MSMP?",
    knowledgeText: citation.content,
    procedurePool: [citation, body, heading],
    seedChunks: [citation]
  });
  assert.strictEqual(prefer.prefer, true);
  const prov = buildAnswerProvenance({
    route: "RETRIEVED_PROCEDURE",
    status: "completed",
    evidence: [
      { id: citation.id, sourceFile: citation.sourceFile, heading: citation.heading, chunkIndex: citation.chunkIndex },
      { id: body.id, sourceFile: body.sourceFile, heading: body.heading, chunkIndex: body.chunkIndex }
    ],
    procedurePrefer: {
      prefer: true,
      reason: prefer.reason,
      stepCount: prefer.stepCount,
      sourceTag: prefer.sourceTag,
      servedAs: "direct-procedure",
      enrichment: prefer.enrichment
    },
    answerKind: "retrieved_procedure"
  });
  assert.strictEqual(prov.retrieval.siblingAssembled, true);
  assert.ok(prov.procedureSelection.enrichment.chunkIds.length >= 2);
  assert.deepStrictEqual(
    prov.procedureSelection.enrichment.chunkIds.slice(0, 3),
    merged.chunkIds.slice(0, 3)
  );
}

// 4) VERIFIED_WORKFLOW distinguishable from GENERATION
{
  const verified = buildAnswerProvenance({
    route: "VERIFIED_WORKFLOW",
    status: "completed",
    scriptId: "grc-msmp-access-request-config",
    evidence: [],
    procedurePrefer: {
      prefer: true,
      reason: "verified-workflow-backbone",
      servedAs: "verified-workflow",
      scriptId: "grc-msmp-access-request-config",
      stepCount: 3
    },
    answerKind: "verified_workflow"
  });
  assert.strictEqual(verified.answerValidation.answerKind, "verified_workflow");
  assert.strictEqual(verified.answerValidation.approvedVerified, true);
  assert.strictEqual(verified.scriptId, "grc-msmp-access-request-config");

  const generated = buildAnswerProvenance({
    route: "GENERATION",
    status: "completed",
    evidence: [{ id: "c1", sourceFile: "btp/ias.md" }],
    answerKind: "validated"
  });
  assert.strictEqual(generated.answerValidation.answerKind, "generated");
  assert.strictEqual(generated.answerValidation.approvedVerified, false);
  assert.notEqual(verified.answerValidation.answerKind, generated.answerValidation.answerKind);
}

// 5) Recovered procedure marked recovered, not verified
{
  const prefer = shouldPreferRetrievedProcedure({
    question: "How do you configure a BRF+ agent rule for MSMP?",
    knowledgeText: citation.content,
    procedurePool: [citation, body, heading],
    seedChunks: [citation]
  });
  const recovered = recoverNonEmptySpokenAnswer({
    question: "How do you configure a BRF+ agent rule for MSMP?",
    spoken: "",
    beforeStrip: "I open transaction code GRFCP2.",
    procedureSpoken: prefer.spoken,
    knowledgeText: "BRFPLUS Maintain Rules"
  });
  assert.strictEqual(recovered.answerKind, "recovered_procedure");
  const prov = buildAnswerProvenance({
    route: "GENERATION",
    status: "completed",
    answerKind: recovered.answerKind,
    recovered: true,
    evidence: [{ id: body.id, sourceFile: body.sourceFile }],
    procedurePrefer: {
      prefer: true,
      reason: prefer.reason,
      servedAs: null,
      enrichment: prefer.enrichment
    }
  });
  assert.strictEqual(prov.answerValidation.answerKind, "recovered_procedure");
  assert.strictEqual(prov.answerValidation.recovered, true);
  assert.strictEqual(prov.answerValidation.approvedVerified, false);
}

// 6) Recovered principle not verified / not complete technical procedure label
{
  const recovered = recoverNonEmptySpokenAnswer({
    question: "How to configure BRF+?",
    spoken: "",
    beforeStrip: "",
    knowledgeText: ""
  });
  const prov = buildAnswerProvenance({
    route: "GENERATION",
    status: "completed",
    answerKind: recovered.answerKind,
    recovered: true,
    evidence: []
  });
  assert.match(prov.answerValidation.answerKind, /recovered_principle|recovered_hardcoded/);
  assert.strictEqual(prov.answerValidation.approvedVerified, false);
  assert.notEqual(prov.answerValidation.answerKind, "verified_workflow");
  assert.notEqual(prov.answerValidation.answerKind, "retrieved_procedure");
}

// 7) Incomplete/failed distinguishable
{
  const incomplete = buildAnswerProvenance({
    route: "GENERATION",
    status: "partial",
    answerKind: "",
    recovered: false,
    finishReason: "incomplete_content",
    evidence: [{ id: "c1" }]
  });
  assert.strictEqual(incomplete.status, "partial");
  assert.strictEqual(incomplete.answerValidation.answerKind, "incomplete_failure");
  assert.strictEqual(incomplete.answerValidation.validationPassed, false);
}

// 8) Provenance survives serialization / reload
{
  const prefer = shouldPreferRetrievedProcedure({
    question: "How do you configure a BRF+ agent rule for MSMP?",
    knowledgeText: citation.content,
    procedurePool: [citation, body, heading],
    seedChunks: [citation]
  });
  const prov = buildAnswerProvenance({
    questionId: "q-sibling",
    route: "RETRIEVED_PROCEDURE",
    status: "completed",
    model: "none",
    evidence: [
      { id: citation.id, sourceFile: citation.sourceFile, heading: citation.heading, chunkIndex: citation.chunkIndex },
      { id: body.id, sourceFile: body.sourceFile, heading: body.heading, chunkIndex: body.chunkIndex }
    ],
    procedurePrefer: {
      prefer: true,
      reason: prefer.reason,
      stepCount: prefer.stepCount,
      sourceTag: prefer.sourceTag,
      servedAs: "direct-procedure",
      enrichment: prefer.enrichment,
      taskFit: prefer.taskFit,
      alignment: prefer.alignment
    },
    answerKind: "retrieved_procedure",
    systemPromptForFingerprint: PROMPT_POLICY_VERSION
  });
  appendQa(sessionId, { source: "offline-fix3", model: "none" }, {
    question: "How do you configure a BRF+ agent rule for MSMP?",
    answerShown: prefer.spoken.slice(0, 400),
    status: "completed",
    route: "RETRIEVED_PROCEDURE",
    answerKind: "retrieved_procedure",
    retrieval: prov.retrieval.chunks,
    procedurePrefer: {
      prefer: true,
      reason: prefer.reason,
      stepCount: prefer.stepCount,
      sourceTag: prefer.sourceTag,
      servedAs: "direct-procedure"
    },
    provenance: prov
  });
  const reloaded = readSession(sessionId);
  assert.ok(reloaded.qa[0].provenance);
  assert.strictEqual(reloaded.qa[0].provenance.route, "RETRIEVED_PROCEDURE");
  assert.ok(reloaded.qa[0].provenance.retrieval.chunks.some((c) => c.id === body.id));
  assert.strictEqual(reloaded.qa[0].provenance.answerValidation.approvedVerified, false);
}

// 9) Historical records without provenance remain readable
{
  const legacyId = `legacy_prov_${Date.now()}`;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, `${legacyId}.json`), JSON.stringify({
    sessionId: legacyId,
    startedAt: new Date().toISOString(),
    qa: [{ question: "legacy", answerShown: "legacy answer", status: "completed" }],
    evaluation: []
  }));
  const legacy = readSession(legacyId);
  assert.strictEqual(legacy.qa[0].question, "legacy");
  assert.strictEqual(legacy.qa[0].provenance, undefined);
  fs.unlinkSync(path.join(DATA_DIR, `${legacyId}.json`));
}

// 10) No sensitive / full-prompt contents
{
  const fp = fingerprintPromptPolicy("SECRET_PROMPT_BODY_SHOULD_NOT_APPEAR " + "x".repeat(500));
  const prov = buildAnswerProvenance({
    route: "GENERATION",
    status: "completed",
    promptFingerprint: fp,
    systemPromptForFingerprint: "SECRET_PROMPT_BODY_SHOULD_NOT_APPEAR",
    evidence: []
  });
  const serialized = JSON.stringify(prov);
  assert.doesNotMatch(serialized, /SECRET_PROMPT_BODY_SHOULD_NOT_APPEAR/);
  assert.doesNotMatch(serialized, /apiKey|sk-|BEGIN PRIVATE/);
  assert.ok(prov.promptFingerprint);
  assert.notEqual(prov.promptFingerprint, "SECRET_PROMPT_BODY_SHOULD_NOT_APPEAR");
  const roundTrip = sanitizeProvenance(prov);
  assert.doesNotMatch(JSON.stringify(roundTrip), /SECRET_PROMPT/);
}

// 11) normalizeAnswerKind contract + chat wiring present
{
  assert.strictEqual(normalizeAnswerKind({ route: "VERIFIED_WORKFLOW", status: "completed" }), "verified_workflow");
  assert.strictEqual(normalizeAnswerKind({ answerKind: "recovered_procedure", recovered: true, status: "completed" }), "recovered_procedure");
  const chat = fs.readFileSync(path.join(ROOT, "pages/api/chat.js"), "utf8");
  assert.match(chat, /buildAnswerProvenance/);
  assert.match(chat, /promptFingerprint|fingerprintPromptPolicy/);
  assert.match(chat, /lastPromptFingerprint/);
}

try {
  fs.unlinkSync(path.join(DATA_DIR, `${sessionId}.json`));
} catch {
  // non-fatal
}

console.log("answerProvenanceAssert: PASS (Fix 3 scenarios 1–11)");
