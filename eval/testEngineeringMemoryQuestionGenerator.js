const assert = require("assert");
const { loadJudgmentRecords, saveJudgmentRecords, addJudgmentRecord } = require("../lib/engineeringMemory/store");
const { computeCoverageMatrix, pickHighestPriorityGap, generateElicitationPrompt } = require("../lib/engineeringMemory/questionGenerator");

// Validates lib/engineeringMemory/questionGenerator.js -- build order step 4 (backend logic
// only, no UI). No LLM calls -- purely deterministic, per design doc section 6.2's rationale.

const SOD_RECORD_WITH_ALTERNATIVE = {
  id: "test-qg-001",
  situation: "Global S/4HANA rollout",
  problem: "320 conflicting SoD rules",
  constraint: "Country compliance",
  decision: "Derived role model with country-specific SoD rulesets",
  alternative_rejected: { approach: "Single global role", reason_rejected: "Localization impossible" },
  implementation: null, outcome: null, lesson_learned: null,
  people: { stakeholders: [], personal_responsibility: null },
  provenance: { source_turn_id: "t1", candidate_stated_confidence: "explicit", recall_confidence: "high", extracted_at: 1 },
  tags: { sap_products: [], domain: "SAP GRC", experience_type: "architecture_decision", reusable_for_categories: [] },
  embedding: null
};

const EAM_RECORD_NO_ALTERNATIVE = {
  id: "test-qg-002",
  situation: "Firefighter emergency access session lapse",
  problem: "A Firefighter session ran long",
  constraint: null,
  decision: "Tightened reason-code enforcement",
  alternative_rejected: null, implementation: null, outcome: null, lesson_learned: null,
  people: { stakeholders: [], personal_responsibility: null },
  provenance: { source_turn_id: "t2", candidate_stated_confidence: "explicit", recall_confidence: "high", extracted_at: 2 },
  tags: { sap_products: [], domain: "SAP GRC", experience_type: "architecture_decision", reusable_for_categories: [] },
  embedding: null
};

(async () => {
  const preExisting = loadJudgmentRecords();
  console.log(`Pre-existing records: ${preExisting.length} (restored after)`);

  try {
    saveJudgmentRecords([]);

    // 1. Empty store -> every cell uncovered
    let matrix = computeCoverageMatrix();
    assert.ok(matrix["SAP GRC"].every(c => c.status === "uncovered"), "expected all SAP GRC cells uncovered with no records");
    console.log("PASS: empty store -> all cells uncovered");

    // 2. Add a decision-shaped record WITH an alternative -> that cell should be "covered"
    addJudgmentRecord(SOD_RECORD_WITH_ALTERNATIVE);
    matrix = computeCoverageMatrix();
    const sodCell = matrix["SAP GRC"].find(c => c.id === "sod_ruleset_design");
    assert.strictEqual(sodCell.status, "covered", `expected sod_ruleset_design covered, got ${sodCell.status}`);
    console.log("PASS: decision-shaped record WITH alternative_rejected -> cell status = covered");

    // 3. Add a decision-shaped record WITHOUT an alternative for a DIFFERENT scenario ->
    // "partial", not "covered" -- this is the core design rule from section 3.
    addJudgmentRecord(EAM_RECORD_NO_ALTERNATIVE);
    matrix = computeCoverageMatrix();
    const eamCell = matrix["SAP GRC"].find(c => c.id === "emergency_access_governance");
    assert.strictEqual(eamCell.status, "partial", `expected emergency_access_governance partial, got ${eamCell.status}`);
    console.log("PASS: decision-shaped record WITHOUT alternative_rejected -> cell status = partial, not covered");

    // 4. Priority pick should NOT be a covered cell
    const gap = pickHighestPriorityGap();
    assert.notStrictEqual(gap.status, "covered", "expected the highest-priority gap to not be a fully-covered cell");
    console.log(`PASS: highest-priority gap picked is "${gap.label}" (${gap.domain}), status=${gap.status}`);

    // 5. Elicitation prompt for the partial EAM cell should ask the alternative-specific
    // follow-up template, and should reference the already-covered SoD cell
    const eamPrompt = generateElicitationPrompt(eamCell);
    assert.ok(eamPrompt.includes("SoD ruleset design"), "expected the prompt to reference the already-covered SoD cell");
    assert.ok(/different approach|chose not to use/i.test(eamPrompt), "expected the partial-cell prompt to ask specifically about the missing alternative");
    console.log(`PASS: elicitation prompt for a partial cell references prior coverage and asks for the missing alternative:\n  "${eamPrompt}"`);

    // 6. Elicitation prompt for a genuinely uncovered cell (first question in this domain
    // scenario) with no reference available
    const uncoveredCell = matrix["SAP GRC"].find(c => c.status === "uncovered");
    const freshPrompt = generateElicitationPrompt(uncoveredCell);
    assert.ok(freshPrompt.includes(uncoveredCell.label), "expected the fresh prompt to name the uncovered scenario");
    console.log(`PASS: elicitation prompt for a fresh uncovered cell:\n  "${freshPrompt}"`);

    console.log("\n=== ALL CHECKS PASSED ===");
  } finally {
    saveJudgmentRecords(preExisting);
    console.log(`\nRestored records store to ${preExisting.length} pre-existing record(s).`);
  }
})();
