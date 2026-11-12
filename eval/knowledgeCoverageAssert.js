/**
 * Phase 2.1 — Knowledge coverage detection + intelligent LLM fallback (offline fixtures).
 * Deterministic — no paid LLM calls.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  COVERAGE,
  assessKnowledgeCoverage,
  buildCoverageDirective,
  evaluateAnswerConceptCoverage,
  evaluateUnsupportedTechnicalDetail,
  buildTransitionPathComparisonFallback,
  extractRequiredConcepts
} = require("../lib/knowledgeCoverage.js");
const { productKnowledgeFolders } = require("../lib/productKnowledgeScope.js");

const ROOT = path.join(__dirname, "..");
const TRANSITION_Q = "Explain Greenfield, Brownfield and Selective Data Transition?";

const BAD_DATA_ASSESSMENT = [
  "Extract sample data from source systems to understand quality.",
  "Identify missing master data and cleanse duplicates before load.",
  "Profile fields and remediate gaps in the staging area."
].join(" ");

const GOOD_COMPARISON = buildTransitionPathComparisonFallback(TRANSITION_Q);

// --- A. Knowledge present → RELEVANT_SUFFICIENT ---
{
  const chunks = [
    {
      sourceFile: "greenfield.md",
      heading: "Greenfield new implementation",
      content: "Greenfield is a new implementation of S/4HANA with a clean process redesign."
    },
    {
      sourceFile: "brownfield.md",
      heading: "Brownfield system conversion",
      content: "Brownfield is a system conversion that preserves historical footprint while moving to S/4HANA."
    },
    {
      sourceFile: "bluefield.md",
      heading: "Selective Data Transition",
      content: "Selective Data Transition migrates selected configuration and history; Bluefield-style programmes use it when redesign and retention must coexist."
    }
  ];
  const coverage = assessKnowledgeCoverage({ question: TRANSITION_Q, chunks });
  assert.equal(coverage.status, COVERAGE.RELEVANT_SUFFICIENT);
  assert.equal(coverage.useRetrievedAsGrounding, true);
  assert.ok(coverage.relevantChunks.length >= 2);
  assert.match(buildCoverageDirective(coverage, { question: TRANSITION_Q }), /RELEVANT_SUFFICIENT/);
}

// --- B. Knowledge partially present ---
{
  const chunks = [
    {
      sourceFile: "greenfield.md",
      heading: "Greenfield",
      content: "Greenfield is a new implementation path for S/4HANA."
    }
  ];
  const coverage = assessKnowledgeCoverage({ question: TRANSITION_Q, chunks });
  assert.equal(coverage.status, COVERAGE.RELEVANT_PARTIAL);
  assert.ok(coverage.missingConceptIds.includes("brownfield"));
  assert.ok(coverage.missingConceptIds.includes("selective-data-transition"));
  assert.match(buildCoverageDirective(coverage), /RELEVANT_PARTIAL|Missing concepts/i);
}

// --- C. Knowledge absent → LLM fallback path selected ---
{
  const coverage = assessKnowledgeCoverage({ question: TRANSITION_Q, chunks: [] });
  assert.equal(coverage.status, COVERAGE.NO_RELEVANT_KNOWLEDGE);
  assert.equal(coverage.allowGeneralKnowledge, true);
  assert.equal(coverage.useRetrievedAsGrounding, false);
  assert.match(buildCoverageDirective(coverage, { domain: "Transformation" }), /NO_RELEVANT_KNOWLEDGE/);
  assert.match(buildCoverageDirective(coverage), /general technical knowledge/i);
}

// --- D. Irrelevant retrieval discarded ---
{
  const chunks = [
    {
      sourceFile: "data-quality.md",
      heading: "Extract sample data",
      content: "Extract sample data from source systems to understand quality. Identify missing master data descriptions and cleanse duplicates."
    },
    {
      sourceFile: "master-data.md",
      heading: "Missing master data",
      content: "Profile missing master data fields before the load window."
    }
  ];
  const coverage = assessKnowledgeCoverage({ question: TRANSITION_Q, chunks });
  assert.equal(coverage.status, COVERAGE.IRRELEVANT_RETRIEVAL);
  assert.equal(coverage.useRetrievedAsGrounding, false);
  assert.ok(coverage.relevantChunks.length === 0 || coverage.discardedChunks.length >= 1);
  assert.match(buildCoverageDirective(coverage), /IRRELEVANT_RETRIEVAL|ignored as grounding/i);
}

// --- E. Incomplete comparison fails relevance gate ---
{
  const gate = evaluateAnswerConceptCoverage({
    question: TRANSITION_Q,
    answer: BAD_DATA_ASSESSMENT
  });
  assert.equal(gate.ok, false);
  assert.ok(
    gate.reason === "data-assessment-instead-of-transition-paths"
      || gate.reason === "missing-essential-concepts"
  );
  assert.ok(gate.missingConceptIds.length >= 2);
}

// --- F. Unsupported technical detail without knowledge ---
{
  const detail = evaluateUnsupportedTechnicalDetail({
    answer: "I always run ZZ99 and /UI2/FAKE_CUST to activate Selective Data Transition on every landscape.",
    knowledgeText: ""
  });
  assert.equal(detail.ok, false);
  assert.ok(detail.claims.some((c) => /ZZ99|FAKE_CUST|\/UI2\//i.test(c)) || detail.claims.length >= 1);

  const qualified = evaluateUnsupportedTechnicalDetail({
    answer: "Depending on release, confirm the supported selective-data tooling with SAP — I would not invent a speculative T-code here.",
    knowledgeText: ""
  });
  assert.equal(qualified.ok, true);

  // Same identifier grounded in knowledge is allowed.
  const grounded = evaluateUnsupportedTechnicalDetail({
    answer: "I use /UI2/FLPCM_CUST for launchpad content when the landscape is customer-managed ABAP.",
    knowledgeText: "Maintain catalogs in /UI2/FLPCM_CUST for Spaces and Pages."
  });
  assert.equal(grounded.ok, true);
}

// --- G. Correct conceptual fallback passes without KB reference ---
{
  const gate = evaluateAnswerConceptCoverage({
    question: TRANSITION_Q,
    answer: GOOD_COMPARISON
  });
  assert.equal(gate.ok, true, `expected pass, got ${gate.reason} missing=${gate.missingConceptIds}`);
  assert.equal(gate.missingConceptIds.length, 0);
  assert.match(GOOD_COMPARISON, /Greenfield/i);
  assert.match(GOOD_COMPARISON, /Brownfield/i);
  assert.match(GOOD_COMPARISON, /Selective Data Transition/i);
  assert.doesNotMatch(GOOD_COMPARISON, /Extract sample data/i);
}

// Mandatory manual-test regression contract
{
  const concepts = extractRequiredConcepts(TRANSITION_Q);
  assert.equal(concepts.length, 3);
  assert.deepEqual(
    concepts.map((c) => c.id).sort(),
    ["brownfield", "greenfield", "selective-data-transition"]
  );
  const rejectBad = evaluateAnswerConceptCoverage({ question: TRANSITION_Q, answer: BAD_DATA_ASSESSMENT });
  assert.equal(rejectBad.ok, false);
  const acceptGood = evaluateAnswerConceptCoverage({ question: TRANSITION_Q, answer: GOOD_COMPARISON });
  assert.equal(acceptGood.ok, true);
}

// Folders open project-types for transition asks
{
  const folders = productKnowledgeFolders(TRANSITION_Q);
  assert.ok(folders.includes("project-types"), `expected project-types in ${folders.join(",")}`);
}

// chat.js / interviewPrompt wiring smoke
{
  const chat = fs.readFileSync(path.join(ROOT, "pages/api/chat.js"), "utf8");
  assert.match(chat, /assessKnowledgeCoverage/);
  assert.match(chat, /evaluateAnswerConceptCoverage/);
  assert.match(chat, /buildTransitionPathComparisonFallback/);
  assert.match(chat, /IRRELEVANT_RETRIEVAL/);
  const prompt = fs.readFileSync(path.join(ROOT, "lib/prompt/interviewPrompt.js"), "utf8");
  assert.match(prompt, /When knowledge is absent or irrelevant/);
}

console.log("knowledgeCoverageAssert: PASS");
