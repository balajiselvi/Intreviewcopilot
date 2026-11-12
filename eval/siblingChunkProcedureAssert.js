/**
 * Fix 1 — sibling-chunk procedure recovery (offline, no provider calls).
 *
 * Proves citation-only BRF chunks are insufficient; same-heading body siblings
 * recover a preferable procedure; MSMP-scoped procedures are not forced onto
 * generic BRF+; Runtime Flow alone is ineligible; unrelated headings/files
 * are not merged; edition alignment still refuses.
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  isThinProcedureChunk,
  mergeSameHeadingChunks,
  expandPoolWithHeadingSiblings,
  enrichProcedureKnowledgeFromPool,
  procedureTaskFit,
  asksMsmpScopedBrf,
  shouldPreferRetrievedProcedure,
  procedureEditionAligned,
  authoritativeProcedure
} = require("../lib/procedureRetention.js");
const { selectVerifiedWorkflow } = require("../lib/verifiedWorkflow.js");

const ROOT = path.join(__dirname, "..");
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "knowledgeIndex.json"), "utf8"));

function chunkById(id) {
  return idx.chunks.find((c) => (c.id || c.chunkId) === id);
}

// Resolve by stable heading after index rebuild (chunk IDs are content-hash based).
const BRF_AGENT_HEADING = "Configure a BRFplus agent rule for MSMP";
const brfAgentSiblings = idx.chunks
  .filter((c) => c.sourceFile === "brf-plus.md" && c.heading === BRF_AGENT_HEADING)
  .sort((a, b) => Number(a.chunkIndex || 0) - Number(b.chunkIndex || 0));
assert.ok(brfAgentSiblings.length >= 3, "index must contain the live BRF sibling trio");
const headingOnly = brfAgentSiblings[0];
const body = brfAgentSiblings.find((c) => !isThinProcedureChunk(c.content)) || brfAgentSiblings[1];
// After rebuild, the heading-only chunk is the thin citation seed.
const citation = headingOnly;
const HEADING_ID = headingOnly.id || headingOnly.chunkId;
const BODY_ID = body.id || body.chunkId;
const CITATION_ID = citation.id || citation.chunkId;
const third = brfAgentSiblings.find((c) => {
  const id = c.id || c.chunkId;
  return id !== HEADING_ID && id !== BODY_ID;
}) || brfAgentSiblings[2];

assert.ok(citation && body && headingOnly, "index must contain the live BRF sibling trio");
assert.strictEqual(citation.heading, body.heading);
assert.ok(isThinProcedureChunk(citation.content), "a) citation-only chunk is thin");
assert.ok(!isThinProcedureChunk(body.content), "body sibling is not thin");

// a) citation alone is insufficient
{
  const alone = shouldPreferRetrievedProcedure({
    question: "How do you configure a BRF+ agent rule for MSMP?",
    knowledgeText: `## ${citation.heading}\n${citation.content}`,
    procedurePool: [citation]
  });
  assert.strictEqual(alone.prefer, false, "a) citation alone must not prefer");
  assert.match(String(alone.reason), /insufficient|gap|thin|task-fit|missing/i);
}

// b + c) same-source/same-heading siblings recover procedure in chunkIndex order
{
  const pool = [citation, body, headingOnly];
  const merged = mergeSameHeadingChunks(citation, pool);
  assert.strictEqual(merged.merged, true, "b) merge marks siblings");
  assert.ok(!merged.gap, "b) body sibling closes gap");
  assert.ok(merged.chunkIds.includes(HEADING_ID), "c) heading sibling present");
  assert.ok(merged.chunkIds.includes(BODY_ID), "c) body sibling present");
  if (third) assert.ok(merged.chunkIds.includes(third.id || third.chunkId) || merged.chunkIds.length >= 2, "c) sibling set recovered");
  assert.ok(/initiator rule|Define Workflow-Related MSMP Rules/i.test(merged.text));

  const prefer = shouldPreferRetrievedProcedure({
    question: "How do you configure a BRF+ agent rule for MSMP in Access Control?",
    knowledgeText: `## ${citation.heading}\n${citation.content}`,
    procedurePool: pool,
    seedChunks: [citation]
  });
  assert.strictEqual(prefer.prefer, true, "b) prefer after sibling recovery");
  assert.ok(prefer.stepCount >= 3);
  assert.match(String(prefer.reason), /sibling|coherent-source-procedure/i);
  assert.ok(/Define Workflow-Related MSMP Rules|BRF\+|GRFNMW_CONFIGURE|decision table/i.test(prefer.spoken));
  assert.notEqual(prefer.route, "VERIFIED_WORKFLOW", "retrieved prefer is not auto-verified");
}

// d) generic BRF+ must not receive MSMP-specific procedure or verified workflow
{
  assert.strictEqual(asksMsmpScopedBrf("How to configure BRF+?"), false);
  assert.strictEqual(asksMsmpScopedBrf("How do you configure a BRF+ agent rule for MSMP?"), true);

  const fit = procedureTaskFit(
    "How to configure BRF+?",
    `## ${body.heading}\n${body.content}`
  );
  assert.strictEqual(fit.ok, false, "d) task-fit rejects MSMP-scoped body for generic BRF");
  assert.strictEqual(fit.reason, "task-fit-msmp-scoped-brf");

  const preferGeneric = shouldPreferRetrievedProcedure({
    question: "How to configure BRF+?",
    knowledgeText: `## ${citation.heading}\n${citation.content}`,
    procedurePool: [citation, body, headingOnly],
    seedChunks: [citation]
  });
  assert.strictEqual(preferGeneric.prefer, false, "d) prefer refuses MSMP procedure for generic BRF");
  assert.strictEqual(preferGeneric.reason, "task-fit-msmp-scoped-brf");

  assert.strictEqual(
    selectVerifiedWorkflow("How to configure BRF+?"),
    null,
    "d) verified workflow must not hijack bare BRF+"
  );
  assert.ok(
    selectVerifiedWorkflow("How do you configure a BRF+ agent rule for MSMP?")?.id
      === "grc-brf-msmp-agent-rule-config",
    "d) MSMP-scoped BRF ask may still select the MSMP BRF verified playbook"
  );
}

// e) MSMP Runtime Flow overview alone remains ineligible
{
  const runtime = idx.chunks.find(
    (c) => /msmp\.md$/i.test(c.sourceFile || "") && /Runtime Flow/i.test(c.heading || "")
  );
  assert.ok(runtime, "msmp Runtime Flow chunk exists");
  const preferRuntime = shouldPreferRetrievedProcedure({
    question: "How to configure MSMP?",
    knowledgeText: `## ${runtime.heading}\n${runtime.content}`,
    procedurePool: [runtime],
    seedChunks: [runtime]
  });
  assert.strictEqual(preferRuntime.prefer, false, "e) Runtime Flow alone ineligible");
  assert.match(String(preferRuntime.reason), /runtime-flow|insufficient/i);
}

// f) unrelated headings / files / products are not merged
{
  const foreign = {
    id: "foreign",
    sourceFile: "btp/btp-security.md",
    heading: "Configure a BRFplus agent rule for MSMP",
    chunkIndex: 99,
    content: "I would open BTP Cockpit and assign role collections with XSUAA scopes for the subaccount."
  };
  const merged = mergeSameHeadingChunks(citation, [citation, body, foreign]);
  assert.ok(!/role collections|XSUAA/i.test(merged.text), "f) foreign file content excluded");
  assert.ok(merged.chunkIds.every((id) => id !== "foreign"));

  const otherHeading = {
    id: "other-heading",
    sourceFile: citation.sourceFile,
    heading: "Configure a BRFplus initiator rule for MSMP",
    chunkIndex: 20,
    content: "I would create a custom initiator only when one process needs multiple paths."
  };
  const mergedHeading = mergeSameHeadingChunks(citation, [citation, body, otherHeading]);
  assert.ok(!/custom initiator only when/i.test(mergedHeading.text), "f) different heading excluded");
}

// g) edition alignment + expandPool preserve safeguards
{
  const privateOnly = "Open PFCG and maintain SU24 proposals, then check SU53 for the missing object.";
  assert.strictEqual(
    procedureEditionAligned(
      "How do you authorize a Fiori app in S/4HANA Cloud Public Edition?",
      privateOnly
    ).aligned,
    false,
    "g) edition alignment still refuses"
  );
  const preferMisaligned = shouldPreferRetrievedProcedure({
    question: "How do you authorize a Fiori app in S/4HANA Cloud Public Edition?",
    knowledgeText: `${privateOnly} Then run STAUTHTRACE. Finally transport the role. Also document SICF.`
  });
  assert.strictEqual(preferMisaligned.prefer, false);
  assert.match(String(preferMisaligned.reason), /public-ask-private/);

  const expanded = expandPoolWithHeadingSiblings(
    [citation],
    [citation, body, headingOnly]
  );
  assert.ok(expanded.some((c) => (c.id || c.chunkId) === BODY_ID), "g) expand brings body sibling");
  assert.ok(expanded.some((c) => (c.id || c.chunkId) === HEADING_ID), "g) expand keeps heading sibling");

  const enriched = enrichProcedureKnowledgeFromPool({
    question: "How do you configure a BRF+ agent rule for MSMP?",
    knowledgeText: citation.content,
    procedurePool: [citation, body, headingOnly],
    seedChunks: [citation]
  });
  assert.strictEqual(enriched.enriched, true);
  assert.ok(!enriched.gap);
  assert.ok(authoritativeProcedure(
    "How do you configure a BRF+ agent rule for MSMP?",
    enriched.text
  ).length >= 3);

  // Cross-product: MSMP BRF body must not prefer for IAS/Fiori asks.
  assert.strictEqual(
    procedureTaskFit(
      "How do you configure IAS federation with Entra ID?",
      `## ${body.heading}\n${body.content}`
    ).ok,
    false
  );
}

console.log("siblingChunkProcedureAssert: PASS (citation/siblings/task-fit/runtime/edition)");
