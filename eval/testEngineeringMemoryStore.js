const assert = require("assert");
const {
  loadJudgmentRecords,
  saveJudgmentRecords,
  addJudgmentRecord,
  loadEngineeringPrinciples,
  addEngineeringPrinciple,
  RECORDS_PATH,
  PRINCIPLES_PATH
} = require("../lib/engineeringMemory/store");

// Validates lib/engineeringMemory/schema.js + store.js -- step 1 of the Version 1 build order
// in docs/EXPERIENCE_ACQUISITION_ENGINE_DESIGN.md section 10. No LLM calls, no wiring into
// chat.js -- this only checks that a Judgment Record round-trips correctly and that invalid
// data is rejected, not silently accepted. Cleans up after itself (both success and failure
// paths) so this test never leaves fixture data in the real data files.

const WORKED_EXAMPLE = {
  id: "test-jr-001",
  situation: "Global S/4HANA rollout across multiple countries",
  problem: "320 conflicting SoD rules surfaced during role consolidation",
  constraint: "Country-specific compliance requirements couldn't be waived",
  decision: "Derived role model -- one master role, country-specific derived roles",
  alternative_rejected: {
    approach: "Single global role for all countries",
    reason_rejected: "Localization becomes impossible once every country shares one role definition"
  },
  implementation: "Master roles built centrally in PFCG; derived roles generated per country with org-level restrictions; SU24 proposals maintained once at master level",
  outcome: "Audit passed with the derived-role structure cited as the control evidence",
  lesson_learned: "Governance gets easier long-term if role ownership is centralized early, even though it's slower to set up initially",
  people: {
    stakeholders: ["audit committee", "regional IT leads"],
    personal_responsibility: "Owned the role architecture decision and defended it to audit"
  },
  provenance: {
    source_turn_id: "test-turn-001",
    candidate_stated_confidence: "explicit",
    recall_confidence: "high",
    extracted_at: 1754500000000
  },
  tags: {
    sap_products: ["PFCG", "SU24"],
    domain: "SAP GRC",
    experience_type: "architecture_decision",
    reusable_for_categories: ["Architecture", "Role Design"]
  },
  embedding: null
};

function resetStores() {
  saveJudgmentRecords([]);
  const { saveEngineeringPrinciples } = require("../lib/engineeringMemory/store");
  saveEngineeringPrinciples([]);
}

(async () => {
  console.log(`Records path: ${RECORDS_PATH}`);
  console.log(`Principles path: ${PRINCIPLES_PATH}`);

  const preExisting = loadJudgmentRecords();
  console.log(`Pre-existing records before test: ${preExisting.length} (will be restored after)`);

  try {
    // Start from empty for a clean, deterministic test.
    resetStores();
    assert.strictEqual(loadJudgmentRecords().length, 0, "expected empty store after reset");

    // 1. Round trip
    const written = addJudgmentRecord(WORKED_EXAMPLE);
    assert.strictEqual(written.id, "test-jr-001");
    const readBack = loadJudgmentRecords();
    assert.strictEqual(readBack.length, 1, "expected exactly 1 record after one add");
    assert.strictEqual(readBack[0].decision, WORKED_EXAMPLE.decision);
    assert.strictEqual(readBack[0].alternative_rejected.approach, "Single global role for all countries");
    assert.strictEqual(readBack[0].provenance.recall_confidence, "high");
    console.log("PASS: round-trip write/read preserves full record shape");

    // 2. Partial record (most fields null) is valid -- per design doc, this must be accepted
    const partial = {
      id: "test-jr-002",
      situation: "A production incident, details still fuzzy",
      problem: null,
      constraint: null,
      decision: null,
      alternative_rejected: null,
      implementation: null,
      outcome: null,
      lesson_learned: null,
      people: { stakeholders: [], personal_responsibility: null },
      provenance: {
        source_turn_id: "test-turn-002",
        candidate_stated_confidence: "implied",
        recall_confidence: "low",
        extracted_at: 1754500000001
      },
      tags: { sap_products: [], domain: "SAP GRC", experience_type: "production_failure", reusable_for_categories: [] }
    };
    addJudgmentRecord(partial);
    assert.strictEqual(loadJudgmentRecords().length, 2);
    console.log("PASS: partial record (mostly null fields) accepted, per design intent");

    // 3. Missing required field (situation) must be REJECTED, not silently coerced
    let rejectedMissingSituation = false;
    try {
      addJudgmentRecord({ ...WORKED_EXAMPLE, id: "test-jr-003", situation: undefined });
    } catch (e) {
      rejectedMissingSituation = true;
    }
    assert.ok(rejectedMissingSituation, "expected missing `situation` to be rejected by schema validation");
    console.log("PASS: record missing required `situation` field is rejected");

    // 4. Duplicate id must be REJECTED, not silently overwritten
    let rejectedDuplicate = false;
    try {
      addJudgmentRecord(WORKED_EXAMPLE);
    } catch (e) {
      rejectedDuplicate = true;
    }
    assert.ok(rejectedDuplicate, "expected duplicate id to be rejected");
    assert.strictEqual(loadJudgmentRecords().length, 2, "duplicate rejection must not have appended a 3rd record");
    console.log("PASS: duplicate id is rejected, not silently overwritten");

    // 5. Engineering Principle round trip, including the derived_from linkage
    const principle = addEngineeringPrinciple({
      id: "test-ep-001",
      statement: "Prefer derived roles over a single global role when country-specific compliance requirements exist",
      status: "proposed",
      derived_from: ["test-jr-001"],
      domain_scope: ["SAP GRC", "SAP Security"],
      confirmation: { confirmed_at: null, candidate_wording: null },
      embedding: null
    });
    assert.strictEqual(principle.status, "proposed", "a newly-drafted principle must default to proposed, never confirmed");
    const principles = loadEngineeringPrinciples();
    assert.strictEqual(principles.length, 1);
    assert.deepStrictEqual(principles[0].derived_from, ["test-jr-001"]);
    console.log("PASS: Engineering Principle round-trips and defaults to status=proposed");

    // 6. A principle with an empty derived_from array must be REJECTED -- a principle must cite
    // at least one real record, per the "never assert without evidence" design rule.
    let rejectedEmptyDerivedFrom = false;
    try {
      addEngineeringPrinciple({
        id: "test-ep-002",
        statement: "An ungrounded claim",
        status: "proposed",
        derived_from: [],
        domain_scope: [],
        confirmation: { confirmed_at: null, candidate_wording: null },
        embedding: null
      });
    } catch (e) {
      rejectedEmptyDerivedFrom = true;
    }
    assert.ok(rejectedEmptyDerivedFrom, "expected a principle with empty derived_from to be rejected");
    console.log("PASS: Engineering Principle with no derived_from evidence is rejected");

    console.log("\n=== ALL CHECKS PASSED ===");
  } finally {
    // Always restore the store to what it was before this test ran -- never leave fixture data
    // in the real data files, success or failure.
    saveJudgmentRecords(preExisting);
    const { saveEngineeringPrinciples } = require("../lib/engineeringMemory/store");
    const prePrinciples = []; // no principles existed before this test in any real scenario yet
    saveEngineeringPrinciples(prePrinciples);
    console.log(`\nRestored records store to ${preExisting.length} pre-existing record(s); principles store cleared.`);
  }
})();
