/**
 * Offline Fix 1 before/after comparison for the live BRF citation-chunk failure.
 * No paid provider calls. Distinguishes mocked prefer routing from live LLM answers.
 */
const fs = require("fs");
const path = require("path");
const {
  isThinProcedureChunk,
  mergeSameHeadingChunks,
  shouldPreferRetrievedProcedure,
  expandPoolWithHeadingSiblings
} = require("../../lib/procedureRetention.js");
const { selectVerifiedWorkflow } = require("../../lib/verifiedWorkflow.js");

const idx = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../data/knowledgeIndex.json"), "utf8")
);
const byId = (id) => idx.chunks.find((c) => (c.id || c.chunkId) === id);

const CITATION = "chunk_05062f25aec1b0c58780677c56a0ce8a7d5689b4412daf7e5866dbbb70a33f0f";
const BODY = "chunk_c06bb7006f0118654844d379a6c0596f26d8bccbb8c63fcd46a7a88be6fc5de9";
const HEADING = "chunk_2d2d272bae8e5d754abee169d4da339da897f332698252cc13ffe578884deb78";

const citation = byId(CITATION);
const body = byId(BODY);
const heading = byId(HEADING);
const qMsmp = "How do you configure a BRF+ agent rule for MSMP?";
const qGeneric = "How to configure BRF+?";

const before = shouldPreferRetrievedProcedure({
  question: qMsmp,
  knowledgeText: `## ${citation.heading}\n${citation.content}`,
  procedurePool: [citation],
  seedChunks: [citation]
});

const pool = expandPoolWithHeadingSiblings([citation], [citation, body, heading]);
const merged = mergeSameHeadingChunks(citation, pool);
const after = shouldPreferRetrievedProcedure({
  question: qMsmp,
  knowledgeText: `## ${citation.heading}\n${citation.content}`,
  procedurePool: pool,
  seedChunks: [citation]
});
const afterGeneric = shouldPreferRetrievedProcedure({
  question: qGeneric,
  knowledgeText: `## ${citation.heading}\n${citation.content}`,
  procedurePool: pool,
  seedChunks: [citation]
});

const report = {
  mode: "offline-mocked-prefer-path",
  notLiveGeneratedAnswer: true,
  selectedChunk: {
    id: CITATION,
    heading: citation.heading,
    sourceFile: citation.sourceFile,
    chunkIndex: citation.chunkIndex,
    thin: isThinProcedureChunk(citation.content),
    preview: String(citation.content).slice(0, 120)
  },
  assembledEvidence: {
    merged: merged.merged,
    gap: merged.gap,
    chunkIds: merged.chunkIds,
    sourceFile: merged.sourceFile,
    heading: merged.heading,
    preview: String(merged.text).slice(0, 280)
  },
  beforeSiblingRecovery: {
    prefer: before.prefer,
    reason: before.reason,
    route: before.route,
    stepCount: before.stepCount || 0
  },
  afterSiblingRecovery: {
    prefer: after.prefer,
    reason: after.reason,
    route: after.route,
    stepCount: after.stepCount || 0,
    answerSource: after.prefer ? "RETRIEVED_PROCEDURE (assembled same-heading siblings)" : "GENERATION",
    spokenPreview: String(after.spoken || "").slice(0, 220)
  },
  genericBrfGuard: {
    prefer: afterGeneric.prefer,
    reason: afterGeneric.reason,
    verified: selectVerifiedWorkflow(qGeneric)?.id || null
  },
  msmpVerified: selectVerifiedWorkflow(qMsmp)?.id || null
};

console.log(JSON.stringify(report, null, 2));
fs.writeFileSync(
  path.join(__dirname, "fix1_sibling_compare.json"),
  JSON.stringify(report, null, 2)
);
