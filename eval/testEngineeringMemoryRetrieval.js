const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const { OPENAI_API_KEY } = require("./lib/env");
const { CANDIDATE_BACKGROUND } = require("./lib/candidateBackground");
const { judgeLeverage } = require("./lib/evalLeveraging");
const { loadJudgmentRecords, saveJudgmentRecords, addJudgmentRecord } = require("../lib/engineeringMemory/store");
const { searchEngineeringMemory, renderEngineeringJudgmentSection } = require("../lib/engineeringMemory/retrieval");

// Build order step 3 (retrieval), per docs/EXPERIENCE_ACQUISITION_ENGINE_DESIGN.md section 10:
// "tested via the same before/after leverage-rate measurement used throughout this session (0
// vs. N seeded records)." This is an ISOLATED test (real CANDIDATE_BACKGROUND + the new
// rendered section + question, NOT the full production prompt via /api/chat) -- proving the
// retrieval+rendering mechanism itself helps, before the separate, later step of wiring it into
// chat.js and re-verifying at full production scale (this session's repeated finding: isolated
// wins don't always survive that merge, so that check is explicitly NOT skipped, just deferred
// to its own step).

const client = new OpenAI({ apiKey: OPENAI_API_KEY });
const QUESTION = "How would you design an SoD remediation process and Emergency Access Management framework for a client with a large, complex SAP landscape?";
const BASELINE_LEVERAGE_RATE = 0.10; // from eval/results/leveraging_benchmark_v2.json, GRC, verified against saved file

const ANALYSIS = { category: "Architecture", domain: "SAP GRC", secondaryCategories: ["EAM", "Security"] };

// The exact worked example from the design doc's section 2 -- directly relevant to this
// question, so this is a best-case test of the mechanism, not an adversarial one. (An
// adversarial "does it avoid retrieving an IRRELEVANT record" test is a reasonable follow-up,
// not required to validate that retrieval works at all.)
const SEED_RECORD = {
  id: "seed-jr-grc-derived-roles",
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
  people: { stakeholders: ["audit committee", "regional IT leads"], personal_responsibility: "Owned the role architecture decision and defended it to audit" },
  provenance: { source_turn_id: "seed-turn-001", candidate_stated_confidence: "explicit", recall_confidence: "high", extracted_at: 1754500000000 },
  tags: { sap_products: ["PFCG", "SU24"], domain: "SAP GRC", experience_type: "architecture_decision", reusable_for_categories: ["Architecture", "Role Design"] },
  embedding: null
};

async function runOnce(systemPrompt) {
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: QUESTION }]
  });
  return res.choices[0].message.content;
}

(async () => {
  const preExisting = loadJudgmentRecords();
  console.log(`Pre-existing records before test: ${preExisting.length} (will be restored after)`);

  try {
    saveJudgmentRecords([]);
    addJudgmentRecord(SEED_RECORD);
    console.log("Seeded 1 Judgment Record.");

    const retrieved = await searchEngineeringMemory({ question: QUESTION, analysis: ANALYSIS, topK: 3 });
    console.log(`Retrieved: ${retrieved.records.length} record(s), ${retrieved.principles.length} principle(s).`);
    if (retrieved.records.length === 0 || retrieved.records[0].id !== SEED_RECORD.id) {
      throw new Error("BLOCKER: the seeded record was not retrieved for its own directly-relevant question -- retrieval scoring itself is broken, not a downstream leverage issue. Stopping before generating misleading eval data.");
    }

    const judgmentSection = renderEngineeringJudgmentSection(retrieved);
    console.log("\n--- Rendered RELEVANT ENGINEERING JUDGMENT section ---");
    console.log(judgmentSection);

    const systemPrompt = `You are speaking live in an SAP Security technical interview. Target length: 140-220 words.

CANDIDATE BACKGROUND (ground truth for anything phrased as personal experience): ${CANDIDATE_BACKGROUND}

${judgmentSection}

Before answering, reason through this: does the RELEVANT ENGINEERING JUDGMENT above (if present) directly bear on this question? If so, the decision it describes -- including what was rejected and why -- should shape your actual answer, not just be mentioned alongside a generic one. What's at least one realistic alternative? Why this approach over that alternative?

Answer the interview question naturally, in spoken language, under 220 words. Do not expose the reasoning questions themselves in the answer.`;

    console.log("\nGenerating 10 test answers with the retrieved judgment in context...");
    const testAnswers = [];
    for (let i = 0; i < 10; i++) testAnswers.push(await runOnce(systemPrompt));

    // Reuse the SAME controls from the original benchmark (no background at all -- retrieval
    // never touches control generation, so reusing them isn't a confound).
    const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, "results", "leveraging_benchmark.json"), "utf-8"));
    const controls = baseline.find(d => d.domain === "GRC").controls;

    console.log("Judging against the reused control answers with the unmodified v2 leverage judge...");
    const judged = [];
    for (let i = 0; i < testAnswers.length; i++) {
      const verdict = await judgeLeverage(QUESTION, controls, testAnswers[i]);
      judged.push({ run: i + 1, answer: testAnswers[i], verdict });
      console.log(`  run ${i + 1}: ${verdict.classification} (fork: ${verdict.decision_fork || "none"})`);
    }

    const leveraged = judged.filter(j => j.verdict.classification === "LEVERAGED").length;
    const result = { seeded_record: SEED_RECORD.id, question: QUESTION, n: 10, leverage_rate: leveraged / 10, baseline_leverage_rate: BASELINE_LEVERAGE_RATE, judgmentSection, judged };
    fs.writeFileSync(path.join(__dirname, "results", "engineering_memory_retrieval_test.json"), JSON.stringify(result, null, 2), "utf-8");

    const savedFile = JSON.parse(fs.readFileSync(path.join(__dirname, "results", "engineering_memory_retrieval_test.json"), "utf-8"));
    const recomputedLeveraged = savedFile.judged.filter(j => j.verdict.classification === "LEVERAGED").length;

    console.log(`\n=== RESULT (verified against saved file) ===`);
    console.log(`Baseline (no Engineering Memory): ${(BASELINE_LEVERAGE_RATE * 100).toFixed(0)}%`);
    console.log(`With 1 seeded, directly-relevant Judgment Record: ${leveraged}/10 = ${(leveraged / 10 * 100).toFixed(0)}%`);
    console.log(recomputedLeveraged === leveraged ? "File matches in-memory count: OK" : "MISMATCH -- do not trust this result, investigate");
  } finally {
    saveJudgmentRecords(preExisting);
    console.log(`\nRestored records store to ${preExisting.length} pre-existing record(s).`);
  }
})();
