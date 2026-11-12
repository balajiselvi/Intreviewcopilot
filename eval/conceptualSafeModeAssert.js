/**
 * Conceptual questions must not be answered with identifier-missing meta-fallback templates.
 * Offline only — no provider calls.
 * Five-pillar BTP coverage uses injected / file knowledge evidence; production card stays NEEDS_REVIEW.
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  resolveSafeModeAnswer,
  isConceptualQuestion
} = require("../lib/safeModeRouter.js");
const {
  buildPrincipleLevelFallback,
  extractConceptualSpokenFromKnowledge
} = require("../lib/generationGuard.js");

const ROOT = path.join(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

let failures = [];
function check(name, fn) {
  try {
    fn();
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
  }
}

const META = /I would answer this at principle level because|identifiers are not confirmed in supporting knowledge for this turn|for:\s*what are/i;
const FIVE_PILLARS = [
  /Application Development(?:\s+and\s+|\s*&\s*)Automation/i,
  /Data and Analytics/i,
  /Integration/i,
  /Artificial Intelligence/i,
  /Platform Foundation/i
];

const card = JSON.parse(read("data/verified-content/cards/enumeration-btp-five-pillars-sap-learning.json"));
const fivePillarEvidence = [
  "# SAP BTP Capability Pillars",
  "",
  "## Interview Summary",
  "",
  String(card.spoken_answer || "").trim()
].join("\n");

const cases = [
  {
    id: "btp-pillars-overview-kb",
    question: "What are the 5 pillars of BTP?",
    knowledge: read("knowledge/btp/btp-overview.md"),
    expect: /BTP|Business Technology Platform|role collection|subaccount|Identity Authentication|IAS/i,
    requireAllFive: false,
    allowInventoryCaution: true
  },
  {
    id: "ias-vs-ips",
    question: "What is the difference between IAS and IPS?",
    knowledge: `${read("knowledge/btp/ias.md")}\n${read("knowledge/btp/ips.md")}`,
    expect: /IAS|IPS|authenticat|provision/i,
    requireAllFive: false
  },
  {
    id: "sod",
    question: "What is SoD in SAP GRC Access Control?",
    knowledge: read("knowledge/grc/ara.md"),
    expect: /SoD|segregation|risk|Access Control|ARA/i,
    requireAllFive: false
  }
];

for (const item of cases) {
  check(`conceptual-classify:${item.id}`, () => {
    assert.strictEqual(isConceptualQuestion(item.question), true);
  });
  check(`conceptual-extract:${item.id}`, () => {
    const spoken = extractConceptualSpokenFromKnowledge(item.question, item.knowledge);
    assert.ok(spoken && spoken.trim().length > 40, "must extract conceptual spoken text from knowledge");
    assert.doesNotMatch(spoken, META);
    assert.match(spoken, item.expect);
  });
  check(`conceptual-safe-mode:${item.id}`, () => {
    const safe = resolveSafeModeAnswer({
      question: item.question,
      knowledgeText: item.knowledge
    });
    assert.strictEqual(safe.served, true);
    assert.doesNotMatch(safe.answer, META);
    assert.match(safe.answer, item.expect);
    assert.ok(
      ["CONCEPTUAL_KNOWLEDGE", "PREPARED_PACK", "VERIFIED_WORKFLOW", "RETRIEVED_PROCEDURE"].includes(safe.route)
      || (safe.continueToGeneration === true && safe.served === false),
      `unexpected route ${safe.route}`
    );
  });
}

check("five-pillars-card-needs-review", () => {
  assert.strictEqual(card.verification_status, "NEEDS_REVIEW");
  assert.strictEqual(card.verified_on, null);
  assert.ok(Array.isArray(card.sources) && card.sources.length >= 1);
  assert.match(card.sources[0].url, /learning\.sap\.com\/courses\/becoming-an-sap-btp-solution-architect\/exploring-sap-btp-an-overview/);
  assert.strictEqual(card.sources[0].retrieved_on, "2026-10-29");
  assert.match(String(card.sources[0].section || ""), /five capability pillars/i);
  assert.match(String(card.claims.find((c) => c.id === "four-vs-five-framing-scope")?.text || ""), /four core solution pillars/i);
});

check("five-pillars-injected-evidence-conceptual-route", () => {
  const q = "What are the five pillars of SAP BTP?";
  assert.strictEqual(isConceptualQuestion(q), true);
  const spoken = extractConceptualSpokenFromKnowledge(q, fivePillarEvidence);
  assert.ok(spoken && spoken.length > 80);
  assert.doesNotMatch(spoken, META);
  assert.doesNotMatch(spoken, /would not recite a fixed marketing inventory/i);
  for (const re of FIVE_PILLARS) assert.match(spoken, re);
  const safe = resolveSafeModeAnswer({ question: q, knowledgeText: fivePillarEvidence });
  assert.strictEqual(safe.served, true);
  assert.strictEqual(safe.route, "CONCEPTUAL_KNOWLEDGE");
  assert.doesNotMatch(safe.answer, META);
  for (const re of FIVE_PILLARS) assert.match(safe.answer, re);
  assert.match(safe.answer, /four core solution pillars|supporting layer/i);
});

check("five-pillars-knowledge-file-when-present", () => {
  const kbPath = path.join(ROOT, "knowledge/btp/btp-capability-pillars.md");
  assert.ok(fs.existsSync(kbPath), "source knowledge file must exist (index rebuild separate)");
  const kb = read("knowledge/btp/btp-capability-pillars.md");
  const q = "What are the five pillars of SAP BTP?";
  const safe = resolveSafeModeAnswer({ question: q, knowledgeText: kb });
  assert.strictEqual(safe.route, "CONCEPTUAL_KNOWLEDGE");
  for (const re of FIVE_PILLARS) assert.match(safe.answer, re);
});

check("five-pillars-absent-does-not-invent-inventory", () => {
  const q = "What are the five pillars of SAP BTP?";
  const kb = read("knowledge/btp/btp-overview.md");
  const spoken = extractConceptualSpokenFromKnowledge(q, kb);
  assert.doesNotMatch(spoken, META);
  // Must not invent the dated five-pillar inventory from overview-only knowledge.
  assert.ok(
    !(/Application Development(?:\s+and\s+|\s*&\s*)Automation/i.test(spoken)
      && /Artificial Intelligence/i.test(spoken)
      && /Platform Foundation/i.test(spoken)),
    "must not invent the SAP Learning five-pillar inventory when that entry is absent"
  );
  assert.match(spoken, /fixed marketing inventory|platform structure and security model/i);
});

check("ias-ips-not-forced-into-procedure", () => {
  const safe = resolveSafeModeAnswer({
    question: "What is the difference between IAS and IPS?",
    knowledgeText: `${read("knowledge/btp/ias.md")}\n${read("knowledge/btp/ips.md")}`
  });
  assert.strictEqual(safe.route, "CONCEPTUAL_KNOWLEDGE");
  // Contrast mentions of PFCG are fine; do not force a GRC/MSMP configuration walkthrough.
  assert.doesNotMatch(safe.answer, /\bGRFNMW_CONFIGURE\b|\bBRFPLUS\b|I start by configuring MSMP/i);
  assert.match(safe.answer, /authenticat|provision/i);
});

check("sod-not-forced-into-procedure", () => {
  const safe = resolveSafeModeAnswer({
    question: "What is SoD in SAP GRC Access Control?",
    knowledgeText: read("knowledge/grc/ara.md")
  });
  assert.strictEqual(safe.route, "CONCEPTUAL_KNOWLEDGE");
  assert.doesNotMatch(safe.answer, /\bHow to configure\b|\bI start in GRFNMW_CONFIGURE\b/i);
});

check("configure-not-conceptual", () => {
  assert.strictEqual(isConceptualQuestion("How do you configure an MSMP workflow?"), false);
  assert.strictEqual(isConceptualQuestion("How do you configure a BRF+ rule for GRC MSMP?"), false);
  assert.strictEqual(isConceptualQuestion("How do you troubleshoot an authorization failure in a Fiori app?"), false);
});

check("config-paths-unaffected-by-five-pillar-card", () => {
  // Conceptual extractor must not hijack configuration questions even if pillar evidence is present.
  for (const q of [
    "How do you configure an MSMP workflow?",
    "How do you configure BRF+ for MSMP?",
    "How do you configure a Fiori catalog and target mapping?"
  ]) {
    assert.strictEqual(isConceptualQuestion(q), false);
    const safe = resolveSafeModeAnswer({ question: q, knowledgeText: fivePillarEvidence });
    assert.notStrictEqual(safe.route, "CONCEPTUAL_KNOWLEDGE");
  }
});

check("meta-fallback-never-for-interview", () => {
  const text = buildPrincipleLevelFallback("What are the 5 pillars of BTP?");
  assert.doesNotMatch(text, /identifiers are not confirmed in supporting knowledge for this turn/i);
  assert.doesNotMatch(text, /for:\s*what are the 5 pillars/i);
});

check("no-tcode-does-not-force-meta", () => {
  const safe = resolveSafeModeAnswer({
    question: "What is SoD?",
    knowledgeText: "Segregation of duties separates conflicting business duties so one person cannot complete a risky process end to end. In SAP GRC Access Control, ARA analyses risks that arise from conflicting access."
  });
  assert.doesNotMatch(safe.answer, META);
  assert.match(safe.answer, /segregation|duties|risk/i);
});

if (failures.length) {
  console.error("conceptualSafeModeAssert: FAIL");
  for (const row of failures) console.error(" -", row);
  process.exitCode = 1;
} else {
  console.log(`conceptualSafeModeAssert: PASS (${cases.length} conceptual + five-pillar inject/absent + negatives)`);
}
