/**
 * I-1 / I-2 / I-3 production incident regressions + card/acronym offline checks.
 * Fresh Node process, no paid calls.
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { admitQuestion } = require("../lib/questionAdmission.js");
const {
  looksIncompleteSpokenAnswer,
  findUngroundedTransactionClaims,
  stripUngroundedSapEntities,
  buildEntityAllowlistFromKnowledge
} = require("../lib/generationGuard.js");

const ROOT = path.join(__dirname, "..");
const cardsDir = path.join(ROOT, "data", "verified-content", "cards");
let failures = [];
function check(name, fn) {
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

// I-1 — incomplete / interrupted spoken tails must be detected (MSMP-class)
check("I-1-incomplete-this-includes", () => {
  assert.strictEqual(
    looksIncompleteSpokenAnswer("To configure MSMP I open the workflow. This includes"),
    true
  );
});
check("I-1-incomplete-trailing-and", () => {
  assert.strictEqual(
    looksIncompleteSpokenAnswer("I configure the path mapping and"),
    true
  );
});
check("I-1-complete-control", () => {
  assert.strictEqual(
    looksIncompleteSpokenAnswer("I configure MSMP stages, attach the agent rule, and validate Approvers of Selected Path."),
    false
  );
});

// I-2 — hallucinated GRFCP2 / ungrounded entities
const brf = fs.readFileSync(path.join(ROOT, "knowledge/grc/brf-plus.md"), "utf8");
check("I-2-grfcp2-flagged", () => {
  assert.ok(
    findUngroundedTransactionClaims(
      "I open transaction code GRFCP2 for BRF+.",
      brf
    ).includes("GRFCP2")
  );
});
check("I-2-grfcp2-stripped", () => {
  const cleaned = stripUngroundedSapEntities(
    "I open the BRF+ workbench through the transaction code GRFCP2 and create an application.",
    brf
  );
  assert.doesNotMatch(cleaned, /\bGRFCP2\b/);
});
check("I-2-allowlist-not-verified", () => {
  const allow = buildEntityAllowlistFromKnowledge(brf);
  assert.strictEqual(allow.verified, false);
  assert.strictEqual(allow.provenance, "RETRIEVED_CANDIDATE");
});

// I-3 — short SAP-term asks admit ANSWER (never Held as incomplete)
const shortAsks = [
  "How to configure BRF+?",
  "How to configure MSMP?",
  "What is IAS?",
  "Explain IPS",
  "MSMP?",
  "BRF+?",
  "How to configure Fiori?",
  "What is IAG?",
  "BTP role collections?",
  "PFCG derived roles?"
];
for (const q of shortAsks) {
  check(`I-3-admit:${q}`, () => {
    const d = admitQuestion(q);
    assert.strictEqual(d.decision, "ANSWER", `${q} -> ${d.decision}/${d.reason}`);
  });
}

// Card set enumeration — every card is NEEDS_REVIEW with sources + retrieval date
check("cards-needs-review-enumeration", () => {
  const files = fs.readdirSync(cardsDir).filter((f) => f.endsWith(".json"));
  assert.ok(files.length >= 5, "expected drafted card set");
  for (const file of files) {
    const card = JSON.parse(fs.readFileSync(path.join(cardsDir, file), "utf8"));
    assert.strictEqual(card.verification_status, "NEEDS_REVIEW", file);
    assert.ok(Array.isArray(card.sources) && card.sources.length >= 1, file);
    assert.ok(card.sources.every((s) => s.url && s.retrieved_on), file);
    assert.ok(Array.isArray(card.claims) && card.claims.length >= 1, file);
  }
});

// Acronym expansion tests — MSMP conflict recorded; XSUAA not asserted as verified fact
check("acronym-msmp-conflict-recorded", () => {
  const card = JSON.parse(fs.readFileSync(path.join(cardsDir, "acronym-msmp.json"), "utf8"));
  assert.ok(card.conflicts.some((c) => /Path|Process/i.test(c)));
  assert.notStrictEqual(card.verification_status, "VERIFIED");
});
check("acronym-xsuaa-candidate-only", () => {
  const card = JSON.parse(fs.readFileSync(path.join(cardsDir, "acronym-xsuaa.json"), "utf8"));
  assert.match(JSON.stringify(card.claims), /verify|Confirm/i);
  assert.strictEqual(card.verification_status, "NEEDS_REVIEW");
});

// Wiring contract — chat imports prefer/strip helpers
check("wiring-chat-prefer", () => {
  const chat = fs.readFileSync(path.join(ROOT, "pages/api/chat.js"), "utf8");
  assert.match(chat, /shouldPreferRetrievedProcedure/);
  assert.match(chat, /stripUngroundedSapEntities/);
  assert.match(chat, /postStripCoherenceCheck/);
  assert.match(chat, /buildPrincipleLevelFallback/);
  assert.match(chat, /excludeFromContext/);
  assert.match(chat, /firstTokenMs/);
});
check("wiring-prompt-principle", () => {
  const prompt = fs.readFileSync(path.join(ROOT, "lib/prompt/interviewPrompt.js"), "utf8");
  assert.match(prompt, /principle[- ]level|only supplied knowledge/i);
  assert.match(prompt, /PROCEDURE BACKBONE|procedureBackbone/);
});

if (failures.length) {
  console.error("iRegressionAssert: FAIL");
  for (const row of failures) console.error(" -", row);
  process.exitCode = 1;
} else {
  console.log(`iRegressionAssert: PASS (${shortAsks.length} short admits + I-1/I-2 + cards)`);
}
