const fs = require("fs");
const path = require("path");
const { CANDIDATE_BACKGROUND } = require("./lib/candidateBackground");
const { loadJudgmentRecords, saveJudgmentRecords, addJudgmentRecord } = require("../lib/engineeringMemory/store");

// Cognitive debugging, not retrieval debugging -- per the reframed hypothesis: the composite
// claim observed in ENGINEERING_MEMORY_STEP5_CHAT_INTEGRATION.md ("320 rules across 11
// countries") is evidence of MEMORY SYNTHESIS (blending CANDIDATE_BACKGROUND and Engineering
// Memory into one claim), not evidence retrieval failed. Confirmed by inspection first, not
// assumed: only 1 Judgment Record was ever in the store during that test (rules out intra-EM
// competition), and zero prompt instruction anywhere mentions ENGINEERING MEMORY for
// arbitration guidance (rules out "the model was told how to choose and ignored it" -- it was
// never told at all).
//
// This experiment isolates whether CANDIDATE_BACKGROUND's simultaneous presence is the
// necessary condition for blending, by comparing:
//   Condition B: Engineering Memory ALONE (no candidateResume at all) -- if the model uses the
//     seeded decision coherently here, blending requires a second source to blend WITH.
//   Condition C: BOTH sources together (the current live wiring) -- reused from the already-run
//     n=5 test (eval/results/... em_fullscale files), re-summarized here for direct comparison,
//     not re-run, to avoid burning quota on data already collected.
// No prompt files touched. No new records seeded beyond the ONE already-designed test record.
// No UI work.

const QUESTION = "How would you design an SoD remediation process and Emergency Access Management framework for a client with a large, complex SAP landscape?";

const SEED_RECORD = {
  id: "arbitration-test-001",
  situation: "Global S/4HANA rollout across multiple countries",
  problem: "320 conflicting SoD rules surfaced during role consolidation",
  constraint: "Country-specific compliance requirements couldn't be waived",
  decision: "Derived role model -- one master role, country-specific derived roles",
  alternative_rejected: { approach: "Single global role for all countries", reason_rejected: "Localization becomes impossible once every country shares one role definition" },
  implementation: "Master roles built centrally in PFCG; derived roles generated per country",
  outcome: "Audit passed with the derived-role structure cited as the control evidence",
  lesson_learned: "Governance gets easier long-term if role ownership is centralized early",
  people: { stakeholders: ["audit committee"], personal_responsibility: "Owned the role architecture decision" },
  provenance: { source_turn_id: "arbitration-turn", candidate_stated_confidence: "explicit", recall_confidence: "high", extracted_at: 1754500000000 },
  tags: { sap_products: ["PFCG", "SU24"], domain: "SAP GRC", experience_type: "architecture_decision", reusable_for_categories: ["Architecture"] },
  embedding: null
};

async function callChat(candidateResume) {
  const body = { model: "gpt-4o-mini", question: QUESTION, history: [] };
  if (candidateResume) body.candidateResume = candidateResume;
  const res = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const raw = await res.text();
  return [...raw.matchAll(/data: (\{.*"text":.*\})\n/g)]
    .map(m => { try { return JSON.parse(m[1]).text; } catch { return ""; } })
    .join("");
}

// Deliberately checking for the SPECIFIC failure pattern observed, not just any mention:
// does the answer name the actual decision (derived roles vs global role)? Does it show
// cross-source number blending (320 paired with a CANDIDATE_BACKGROUND-only fact like 11
// countries / 8,700 users / 45 systems, which the seed record does NOT state)?
const USES_SEEDED_DECISION = /derived role|master role.*(country|derived)|single global role/i;
const CB_ONLY_FACTS = /11 countries|8,?700|45 systems|28 legal entities/i;
const SEEDED_NUMBER = /\b320\b/;

function classify(answer) {
  const usesDecision = USES_SEEDED_DECISION.test(answer);
  const citesSeededNumber = SEEDED_NUMBER.test(answer);
  const citesCbOnlyFact = CB_ONLY_FACTS.test(answer);
  const blended = citesSeededNumber && citesCbOnlyFact; // both a seed-only fact AND a CB-only fact in the same answer
  return { usesDecision, citesSeededNumber, citesCbOnlyFact, blended };
}

async function runCondition(label, candidateResume, n = 5) {
  console.log(`\n=== ${label} ===`);
  const results = [];
  for (let i = 1; i <= n; i++) {
    const answer = await callChat(candidateResume);
    const c = classify(answer);
    results.push({ run: i, answer, ...c });
    console.log(`  run ${i}: usesDecision=${c.usesDecision} citesSeededNumber=${c.citesSeededNumber} citesCbOnlyFact=${c.citesCbOnlyFact} blended=${c.blended}`);
  }
  return results;
}

(async () => {
  const preExisting = loadJudgmentRecords();
  console.log(`Pre-existing records: ${preExisting.length} (restored after)`);

  try {
    saveJudgmentRecords([]);
    addJudgmentRecord(SEED_RECORD);
    console.log("Seeded 1 record.");

    // Condition B: Engineering Memory ALONE, no candidateResume at all.
    const conditionB = await runCondition("CONDITION B: Engineering Memory only (no CANDIDATE_BACKGROUND)", null, 5);

    fs.writeFileSync(
      path.join(__dirname, "results", "memory_arbitration_test.json"),
      JSON.stringify({ conditionB }, null, 2),
      "utf-8"
    );

    const bUsesDecision = conditionB.filter(r => r.usesDecision).length;
    const bBlended = conditionB.filter(r => r.blended).length;
    console.log(`\n=== CONDITION B SUMMARY ===`);
    console.log(`Uses the actual seeded decision: ${bUsesDecision}/5`);
    console.log(`Shows cross-source blending (impossible here -- no second source exists): ${bBlended}/5 (sanity check, should be 0)`);
  } finally {
    saveJudgmentRecords(preExisting);
    console.log(`\nRestored records store to ${preExisting.length} pre-existing record(s).`);
  }
})();
