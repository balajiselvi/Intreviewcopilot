/**
 * Fix 1 stabilization — offline product-boundary probe (no paid calls).
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  shouldPreferRetrievedProcedure,
  mergeSameHeadingChunks,
  isThinProcedureChunk,
  asksMsmpScopedBrf,
  procedureTaskFit,
  isRuntimeFlowOverviewKnowledge
} = require("../../lib/procedureRetention.js");
const { selectVerifiedWorkflow } = require("../../lib/verifiedWorkflow.js");
const { productKnowledgeFolders } = require("../../lib/productKnowledgeScope.js");

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

// 1) Explicit MSMP BRF agent-rule ask may prefer assembled siblings / verified playbook
{
  const pool = [citation, body, heading];
  const prefer = shouldPreferRetrievedProcedure({
    question: "How do you configure a BRF+ agent rule for MSMP?",
    knowledgeText: citation.content,
    procedurePool: pool,
    seedChunks: [citation]
  });
  assert.strictEqual(prefer.prefer, true);
  assert.notEqual(prefer.route, "VERIFIED_WORKFLOW");
  assert.strictEqual(
    selectVerifiedWorkflow("How do you configure a BRF+ agent rule for MSMP?")?.id,
    "grc-brf-msmp-agent-rule-config"
  );
}

// 2) Generic BRF+ without GRC/MSMP cue
{
  assert.strictEqual(asksMsmpScopedBrf("How to configure BRF+?"), false);
  assert.strictEqual(selectVerifiedWorkflow("How to configure BRF+?"), null);
  const prefer = shouldPreferRetrievedProcedure({
    question: "How to configure BRF+?",
    knowledgeText: `## ${body.heading}\n${body.content}`,
    procedurePool: [citation, body, heading],
    seedChunks: [citation]
  });
  assert.strictEqual(prefer.prefer, false);
  assert.strictEqual(prefer.reason, "task-fit-msmp-scoped-brf");
}

// 3) Runtime Flow overview alone ineligible for MSMP configure
{
  const runtime = idx.chunks.find(
    (c) => /msmp\.md$/i.test(c.sourceFile || "") && /Runtime Flow/i.test(c.heading || "")
  );
  assert.ok(runtime);
  assert.strictEqual(
    isRuntimeFlowOverviewKnowledge(`## ${runtime.heading}\n${runtime.content}`),
    true
  );
  const prefer = shouldPreferRetrievedProcedure({
    question: "How to configure MSMP?",
    knowledgeText: `## ${runtime.heading}\n${runtime.content}`,
    procedurePool: [runtime],
    seedChunks: [runtime]
  });
  assert.strictEqual(prefer.prefer, false);
  assert.match(String(prefer.reason), /runtime-flow|insufficient/i);
}

// 4) Citation-only with no body sibling → gap, no invent
{
  const merged = mergeSameHeadingChunks(citation, [citation]);
  assert.ok(isThinProcedureChunk(citation.content));
  assert.ok(merged.gap);
  const prefer = shouldPreferRetrievedProcedure({
    question: "How do you configure a BRF+ agent rule for MSMP?",
    knowledgeText: citation.content,
    procedurePool: [citation],
    seedChunks: [citation]
  });
  assert.strictEqual(prefer.prefer, false);
}

// 5) Unrelated product/file not merged
{
  const foreign = {
    id: "x",
    sourceFile: "btp/ias.md",
    heading: citation.heading,
    chunkIndex: 99,
    content: "I would configure IAS trust and corporate IdP federation with SAML 2.0."
  };
  const merged = mergeSameHeadingChunks(citation, [citation, body, foreign]);
  assert.ok(!/IAS trust|SAML 2\.0/i.test(merged.text));
}

// 6) IAS/IPS/IAG/Fiori must not inherit MSMP procedure prefer from BRF body
{
  const msmpBody = `## ${body.heading}\n${body.content}`;
  for (const q of [
    "How do you configure IAS federation with Entra ID?",
    "How do you troubleshoot an IPS job that completes with skipped users?",
    "How do you configure IAG Access Analysis?",
    "How do you authorize a custom Fiori app through catalog and OData services?"
  ]) {
    const fit = procedureTaskFit(q, msmpBody);
    assert.strictEqual(fit.ok, false, `task-fit must reject MSMP BRF body for: ${q}`);
    assert.strictEqual(fit.reason, "task-fit-cross-product");
    const prefer = shouldPreferRetrievedProcedure({
      question: q,
      knowledgeText: msmpBody
    });
    assert.strictEqual(prefer.prefer, false, q);
    assert.notEqual(prefer.route, "VERIFIED_WORKFLOW", q);
  }
  assert.ok(productKnowledgeFolders("How do you configure IAS federation with Entra ID?").includes("btp"));
  assert.ok(productKnowledgeFolders("How do you configure IAG Access Analysis?").includes("iag"));
}

// 7) Edition alignment + retrieved ≠ verified
{
  const prefer = shouldPreferRetrievedProcedure({
    question: "How do you authorize a Fiori app in S/4HANA Cloud Public Edition?",
    knowledgeText: "Open PFCG and maintain SU24 proposals, then check SU53. Then run STAUTHTRACE. Finally transport the role."
  });
  assert.strictEqual(prefer.prefer, false);
  assert.match(String(prefer.reason), /public-ask-private/);
}

console.log("fix1BoundaryProbe: PASS");
