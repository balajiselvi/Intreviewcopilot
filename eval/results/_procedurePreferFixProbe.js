/**
 * Offline probe: thin overview retrieval must prefer configure sections via pool ranking.
 */
const fs = require("fs");
const assert = require("assert");
const {
  shouldPreferRetrievedProcedure,
  prioritizeProcedureChunks,
  knowledgeFromProcedurePool,
  isWorkflowBackboneAsk
} = require("../../lib/procedureRetention.js");
const { recoverNonEmptySpokenAnswer, isMetaRefusalText } = require("../../lib/generationGuard.js");

const brf = fs.readFileSync("knowledge/grc/brf-plus.md", "utf8");
const overview = brf.slice(0, brf.indexOf("## Configure a BRFplus agent"));
const configure = brf.slice(brf.indexOf("## Configure a BRFplus agent"));

const pool = [
  { heading: "Overview", content: overview.slice(0, 800), sourceFile: "grc/brf-plus.md" },
  { heading: "30 Second Interview Answer", content: "BRF+ evaluates decision tables.", sourceFile: "grc/brf-plus.md" },
  { heading: "Configure a BRFplus agent rule for MSMP", content: configure.slice(0, 2500), sourceFile: "grc/brf-plus.md" }
];

assert.strictEqual(isWorkflowBackboneAsk("How to configure BRF+?"), true);
const ranked = prioritizeProcedureChunks("How to configure BRF+?", pool);
assert.strictEqual(ranked[0].heading.startsWith("Configure"), true, "configure heading first");

const thinPrimary = [
  "### SOURCE: grc/brf-plus.md | SECTION: Overview",
  overview.slice(0, 600)
].join("\n");

const refused = shouldPreferRetrievedProcedure({
  question: "How to configure BRF+?",
  knowledgeText: thinPrimary
});
assert.strictEqual(refused.prefer, false, "thin overview alone should not prefer");

const withPool = shouldPreferRetrievedProcedure({
  question: "How to configure BRF+?",
  knowledgeText: thinPrimary,
  procedurePool: pool
});
assert.strictEqual(withPool.prefer, true, "pool configure section must prefer");
assert.ok(withPool.stepCount >= 3, `stepCount ${withPool.stepCount}`);
assert.ok(/BRFPLUS|Define Workflow-Related MSMP Rules|GRFNMW_CONFIGURE/i.test(withPool.spoken));

const recovered = recoverNonEmptySpokenAnswer({
  question: "How to configure BRF+?",
  spoken: "",
  beforeStrip: "",
  procedureSpoken: withPool.spoken
});
assert.ok(recovered.answer.length > 80);
assert.strictEqual(isMetaRefusalText(recovered.answer), false);
assert.strictEqual(recovered.flag, "empty_fallback_procedure");

console.log(JSON.stringify({
  rankedHead: ranked[0].heading,
  withPool: { prefer: withPool.prefer, stepCount: withPool.stepCount, reason: withPool.reason },
  recoveredFlag: recovered.flag,
  poolChars: knowledgeFromProcedurePool("How to configure BRF+?", pool).length
}, null, 2));
console.log("procedurePreferFixProbe: PASS");
