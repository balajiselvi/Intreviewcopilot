/**
 * P0 / P0.2 — centralized vs decentralized FF ID / EAM deploy selection.
 *
 * Must never select s4-vs-bw-role-design.
 * Must not hijack central/decentral/architecture/failover asks with the generic `eam` script.
 * Safe-mode / conceptual extract must prefer Q109-class deploy prose over GRAC_SPM ops.
 * Offline only — no paid provider calls. Natural LLM spoken quality is NOT validated here.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  selectVerifiedWorkflow,
  namesFirefighterOrEamAsk
} = require("../lib/verifiedWorkflow.js");
const {
  explicitProductTopics,
  resolveInterviewContext
} = require("../lib/interviewContext.js");
const { productKnowledgeFolders } = require("../lib/productKnowledgeScope.js");
const { decideInterviewTurn } = require("../lib/turnDecision.js");
const { resolveSafeModeAnswer } = require("../lib/safeModeRouter.js");
const { resolvePreparedScript } = require("../lib/scriptMatch.js");
const { recallExpectedAnswer } = require("./lib/expectedAnswers.js");
const {
  isEamCentralDecentralTask,
  extractConceptualSpokenFromKnowledge
} = require("../lib/generationGuard.js");
const { deliveryProcedureAdjustment } = require("../services/sectionHeading.js");
const { procedureTaskFit } = require("../lib/procedureRetention.js");

const Q109 = fs.readFileSync(
  path.join(__dirname, "..", "knowledge", "grc", "deloitte-usi-specific-gap-fillers.md"),
  "utf8"
);
assert.match(Q109, /central(?:ized)? vs\.? decentralized Emergency Access Management/i);
assert.match(Q109, /Firefighter IDs?/i);
assert.match(Q109, /GRC hub/i);

const FORBIDDEN_WF = "s4-vs-bw-role-design";
const BW_LEAK = /BW\/?4HANA is not the same model|Analysis Authorizations in RSECADMIN|AGR_1251/i;
const EAM_OVERVIEW_LEAK = /cybersecurity problem it solves is standing privilege|At Dover I ran EAM end to end/i;
const GRAC_SPM_OPS_PRIMARY = /support engineer sees the firefighter|30 second interview|ID versus role-based firefighter/i;

const Q109_SLICE = (() => {
  const start = Q109.indexOf("## Q109:");
  const end = Q109.indexOf("## Q110:");
  assert.ok(start >= 0 && end > start, "Q109 slice bounds");
  return Q109.slice(start, end);
})();

const GRAC_SPM_OPS_FIXTURE = [
  "## 30 Second Interview Answer",
  "The support engineer sees the Firefighter ID versus role-based Firefighter options in GRAC_SPM.",
  "Open GRAC_SPM, assign the firefighter, reason code, and controller, then review logs after the session."
].join("\n");

const CONNECTOR_SYNC_FIXTURE = [
  "## Connector Groups",
  "Maintain connector groups so repository sync can pull role data from target systems.",
  "## Repository Sync",
  "Schedule repository sync jobs so GRC stays current with target-system role inventories."
].join("\n");

function assertNotS4VsBw(question, label) {
  const selected = selectVerifiedWorkflow(question);
  assert.notEqual(selected?.id, FORBIDDEN_WF, `${label}: workflow ${selected?.id}`);
  assert.doesNotMatch(String(selected?.answer || ""), BW_LEAK, `${label}: BW leak in workflow answer`);
  const safe = resolveSafeModeAnswer({ question, knowledgeText: "" });
  assert.notEqual(safe.meta?.scriptId, FORBIDDEN_WF, `${label}: safe-mode scriptId`);
  assert.doesNotMatch(String(safe.answer || ""), BW_LEAK, `${label}: BW leak in safe-mode`);
  return selected;
}

function assertNotGenericEamScript(question, label) {
  const recalled = recallExpectedAnswer(question);
  assert.notEqual(recalled?.id, "eam", `${label}: recallExpectedAnswer must not select eam`);
  const prepared = resolvePreparedScript(question);
  assert.notEqual(prepared?.id, "eam", `${label}: prepared script must not be eam`);
  assert.doesNotMatch(String(prepared?.answer || ""), EAM_OVERVIEW_LEAK, `${label}: eam overview leak`);
  const turn = decideInterviewTurn({ question });
  assert.notEqual(turn.scriptId, "eam", `${label}: turn scriptId`);
  assert.notEqual(turn.route, "PREPARED_SCRIPT", `${label}: must not PREPARED_SCRIPT for deploy ask`);
}

function assertQ109Prefer(question, label) {
  assert.equal(isEamCentralDecentralTask(question), true, `${label}: eam deploy detector`);
  const mixed = [
    "## 60 Second Interview Answer",
    "GRAC_SPM is where the support engineer sees the firefighter assignment screen.",
    Q109_SLICE,
    CONNECTOR_SYNC_FIXTURE
  ].join("\n\n");
  const spoken = extractConceptualSpokenFromKnowledge(question, mixed);
  assert.match(spoken, /central(?:ized)?\s+eam|decentral(?:ized)?\s+eam|grc hub|local eam|failover/i, `${label}: Q109 deploy prose`);
  assert.doesNotMatch(spoken, GRAC_SPM_OPS_PRIMARY, `${label}: must not prefer GRAC_SPM ops`);
  assert.doesNotMatch(spoken, /connector groups?|repository sync/i, `${label}: must not prefer sync/connectors`);

  const safe = resolveSafeModeAnswer({ question, knowledgeText: mixed });
  assert.equal(safe.continueToGeneration, true, `${label}: continueToGeneration for grounded Q109`);
  assert.match(safe.reason || "", /eam-central-decentral-continue-generation/, `${label}: safe reason`);
  const fallback = String(safe.meta?.offlineSpokenFallback || "");
  assert.match(fallback, /central(?:ized)?\s+eam|decentral(?:ized)?\s+eam|grc hub|local eam|failover/i, `${label}: offline fallback`);

  const q109Delta = deliveryProcedureAdjustment(question, {
    heading: "Q109: How do you configure and secure central vs. decentralized Emergency Access Management (EAM / Firefighting)?",
    content: Q109_SLICE
  });
  const opsDelta = deliveryProcedureAdjustment(question, {
    heading: "30 Second Interview Answer",
    content: GRAC_SPM_OPS_FIXTURE
  });
  const syncDelta = deliveryProcedureAdjustment(question, {
    heading: "Repository Sync",
    content: CONNECTOR_SYNC_FIXTURE
  });
  assert.ok(q109Delta > opsDelta, `${label}: Q109 heading delta ${q109Delta} > ops ${opsDelta}`);
  assert.ok(q109Delta > syncDelta, `${label}: Q109 heading delta ${q109Delta} > sync ${syncDelta}`);

  assert.equal(procedureTaskFit(question, GRAC_SPM_OPS_FIXTURE).ok, false, `${label}: ops task-fit reject`);
  assert.equal(procedureTaskFit(question, CONNECTOR_SYNC_FIXTURE).ok, false, `${label}: sync task-fit reject`);
  assert.equal(procedureTaskFit(question, Q109_SLICE).ok, true, `${label}: Q109 task-fit accept`);
}

// 1) Incident phrasing — FF ID shorthand
{
  const q = "difference between centralized & decentralized FF ID?";
  assert.equal(namesFirefighterOrEamAsk(q), true, "1 FF detector");
  assert.ok(explicitProductTopics(q).includes("GRC"), `1 topics ${explicitProductTopics(q)}`);
  assert.ok(productKnowledgeFolders(q).includes("grc"), `1 folders ${productKnowledgeFolders(q)}`);
  const selected = assertNotS4VsBw(q, "1");
  assert.equal(selected, null, "1 no unrelated verified workflow — fall through to retrieval/generation");
  const turn = decideInterviewTurn({ question: q });
  assert.notEqual(turn.scriptId, FORBIDDEN_WF);
  assert.notEqual(turn.route, "VERIFIED_WORKFLOW");
  const ctx = resolveInterviewContext({ questionRaw: q, history: [] });
  assert.equal(ctx.questionTopic, "GRC", `1 topic ${ctx.questionTopic}`);
  assertNotGenericEamScript(q, "1");
  assertQ109Prefer(q, "1");
}

// 2) Full Firefighter ID phrasing
{
  const q = "Difference between centralized and decentralized Firefighter ID?";
  assertNotS4VsBw(q, "2");
  assert.ok(explicitProductTopics(q).includes("GRC"));
  assert.ok(productKnowledgeFolders(q).includes("grc"));
  assertNotGenericEamScript(q, "2");
  assertQ109Prefer(q, "2");
}

// 2b) P0.4 live phrasing — trailing "in SAP GRC" must not select grc-vs-detection
{
  const q = "What is the difference between centralized and decentralized Firefighter ID in SAP GRC?";
  assertNotS4VsBw(q, "2b");
  assertNotGenericEamScript(q, "2b");
  assert.notEqual(recallExpectedAnswer(q)?.id, "grc-vs-detection", "2b recall");
  assert.notEqual(resolvePreparedScript(q)?.id, "grc-vs-detection", "2b prepared");
  const turn = decideInterviewTurn({ question: q });
  assert.notEqual(turn.scriptId, "grc-vs-detection", `2b scriptId ${turn.scriptId}`);
  assert.notEqual(turn.route, "PREPARED_SCRIPT", `2b route ${turn.route}`);
  assert.equal(turn.route, "GENERATION", `2b expected GENERATION got ${turn.route}`);
  assertQ109Prefer(q, "2b");
}

// 3) Centralized Firefighter architecture — must not select generic eam script
{
  const q = "Explain centralized Firefighter architecture in SAP GRC.";
  assertNotS4VsBw(q, "3");
  assert.ok(namesFirefighterOrEamAsk(q) || explicitProductTopics(q).includes("GRC"));
  assert.ok(productKnowledgeFolders(q).includes("grc"), `3 folders ${productKnowledgeFolders(q)}`);
  assertNotGenericEamScript(q, "3");
  assertQ109Prefer(q, "3");
}

// 4) Decentralized Firefighter architecture
{
  const q = "Explain decentralized Firefighter architecture.";
  assertNotS4VsBw(q, "4");
  assert.ok(productKnowledgeFolders(q).includes("grc"));
  assertNotGenericEamScript(q, "4");
  assertQ109Prefer(q, "4");
}

// 5) Central GRC unavailable — Q109 failover over repository sync / connector groups
{
  const q = "What happens when central GRC is unavailable?";
  assertNotS4VsBw(q, "5");
  assertNotGenericEamScript(q, "5");
  // Broader phrasing without Firefighter still must not pick S/4-vs-BW.
  const withFf = "What happens to Firefighter ID access when the central GRC hub is unavailable?";
  assertNotS4VsBw(withFf, "5b");
  assert.ok(productKnowledgeFolders(withFf).includes("grc"));
  assertQ109Prefer(withFf, "5b");
  // Plain "central GRC unavailable" without FF: prefer Q109 when mixed with sync noise.
  const failoverSpoken = extractConceptualSpokenFromKnowledge(
    q,
    [CONNECTOR_SYNC_FIXTURE, Q109_SLICE].join("\n\n")
  );
  assert.match(failoverSpoken, /failover|grc hub|decentral|local eam|offline/i, "5 failover prose");
  assert.doesNotMatch(failoverSpoken, /connector groups?|repository sync/i, "5 no sync primary");
}

// 6) Positive control — genuine Firefighter configuration must keep procedure/ops path available
{
  const q = "How do you configure Firefighter in SAP GRC?";
  assertNotS4VsBw(q, "6-ff-config");
  assert.equal(isEamCentralDecentralTask(q), false, "6 configure is not central/decentral deploy ask");
  assert.notEqual(recallExpectedAnswer(q)?.id, "eam", "6 configure must not use eam overview script");
  // Ops knowledge remains task-fit for genuine configure (not rejected by deploy gate).
  assert.equal(procedureTaskFit(q, GRAC_SPM_OPS_FIXTURE).ok, true, "6 configure ops task-fit ok");
  // Q109 is optional here — do not force it as the only configure source.
  const configureSpoken = extractConceptualSpokenFromKnowledge(q, GRAC_SPM_OPS_FIXTURE);
  // Conceptual extract may be empty for configure (non-conceptual); that is fine.
  assert.ok(typeof configureSpoken === "string");
}

// 7) Positive control — genuine S/4 versus BW role-design comparison preserved
{
  const q = "What is the difference between S/4HANA and BW/4HANA role design?";
  const selected = selectVerifiedWorkflow(q);
  assert.equal(selected?.id, FORBIDDEN_WF, `7 expected ${FORBIDDEN_WF}, got ${selected?.id}`);
  assert.match(String(selected?.answer || ""), /Analysis Authorizations|RSECADMIN|PFCG/i);
}

// 8) Generic comparison must not select product-specific workflows
{
  const q = "difference between alpha and beta?";
  const selected = selectVerifiedWorkflow(q);
  assert.equal(selected, null, `8 got ${selected?.id}`);
  assert.equal(selectVerifiedWorkflow("difference between foo and bar?")?.id || null, null);
}

// 9) Generic EAM overview still matches the eam prepared script (false-negative guard)
{
  const q = "What is EAM in SAP GRC?";
  assert.equal(recallExpectedAnswer(q)?.id, "eam", "9 generic eam overview still matches");
  assert.equal(isEamCentralDecentralTask(q), false, "9 not a deploy ask");
}

// Q109 remains the grounding fixture (not a fabricated playbook)
assert.match(Q109, /Centralized EAM hosts Firefighter/i);
assert.match(Q109, /Decentralized EAM installs local EAM components/i);

console.log("firefighterCentralDecentralAssert: PASS");
