const fs = require("fs");
const path = require("path");
const { generateAnswer } = require("./lib/generateAnswer");
const { judgeLeverage } = require("./lib/evalLeveraging");
const { ENRICHED_GRC_BACKGROUND, ENRICHED_FIORI_BACKGROUND } = require("./lib/enrichedBackgrounds");

// Single-variable experiment (Option 1 from LEVERAGING_BENCHMARK_2026-08-07.md's root-cause
// diagnosis): does adding genuine decision-and-rationale narrative to CANDIDATE_BACKGROUND
// (vs. its original scope/achievements-inventory shape) raise GRC/Fiori leverage above the
// 10%/10% baseline? Everything else held constant: same questions, same reused control answers
// (control generation never used a background at all, so they're valid regardless of which
// background variant is under test), same v2 judge (eval/lib/evalLeveraging.js, unmodified).
// No interviewPrompt.js/chat.js/vectorSearch.js changes -- freeze respected.

const BASELINE_PATH = path.join(__dirname, "results", "leveraging_benchmark.json");
const BASELINE_V2_PATH = path.join(__dirname, "results", "leveraging_benchmark_v2.json");
const N_TEST = 10;
const MODEL = "gpt-4o-mini";

const CASES = [
  { domain: "GRC", background: ENRICHED_GRC_BACKGROUND },
  { domain: "Fiori", background: ENRICHED_FIORI_BACKGROUND }
];

async function runCase(testCase, controls, question) {
  console.log(`\n=== ${testCase.domain} (enriched background) ===`);
  console.log(`  generating ${N_TEST} test answers with enriched background...`);
  const tests = [];
  for (let i = 0; i < N_TEST; i++) {
    const { answer } = await generateAnswer(question, { model: MODEL, candidateResume: testCase.background });
    tests.push(answer);
  }

  console.log(`  judging against the ${controls.length} REUSED original control answers...`);
  const judged = [];
  for (let i = 0; i < tests.length; i++) {
    const verdict = await judgeLeverage(question, controls, tests[i]);
    judged.push({ run: i + 1, answer: tests[i], verdict });
    console.log(`    run ${i + 1}: ${verdict.classification} (fork: ${verdict.decision_fork || "none"})`);
  }

  const counts = { LEVERAGED: 0, MENTIONED: 0, ABSENT: 0 };
  for (const j of judged) counts[j.verdict.classification] = (counts[j.verdict.classification] || 0) + 1;
  const avgQuality = judged.reduce((s, j) => s + (Number(j.verdict.reasoning_quality) || 0), 0) / judged.length;
  const avgConfidence = judged.reduce((s, j) => s + (Number(j.verdict.confidence) || 0), 0) / judged.length;
  const modal = Math.max(counts.LEVERAGED, counts.MENTIONED, counts.ABSENT);

  const result = {
    domain: testCase.domain,
    question,
    n: N_TEST,
    leverage_rate: counts.LEVERAGED / N_TEST,
    mentioned_rate: counts.MENTIONED / N_TEST,
    absent_rate: counts.ABSENT / N_TEST,
    counts,
    avg_reasoning_quality: avgQuality,
    avg_judge_confidence: avgConfidence,
    consistency: modal / judged.length,
    enriched_background: testCase.background,
    controls,
    judged
  };
  console.log(`  === [${testCase.domain}] enriched leverage=${(result.leverage_rate * 100).toFixed(0)}% mentioned=${(result.mentioned_rate * 100).toFixed(0)}% ===`);
  return result;
}

(async () => {
  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf-8"));
  const baselineV2 = JSON.parse(fs.readFileSync(BASELINE_V2_PATH, "utf-8"));
  const results = [];

  for (const testCase of CASES) {
    // controls/question come from the v1 file (the only one that saved them); the comparison
    // baseline leverage rate uses the CORRECTED v2 number (10%/10%), not v1's inflated one.
    const baselineEntry = baseline.find(d => d.domain === testCase.domain);
    const baselineV2Entry = baselineV2.find(d => d.domain === testCase.domain);
    const r = await runCase(testCase, baselineEntry.controls, baselineEntry.question);
    r.baseline_v2_leverage_rate = baselineV2Entry.leverage_rate;
    results.push(r);
    fs.writeFileSync(
      path.join(__dirname, "results", "enriched_background_experiment.json"),
      JSON.stringify(results, null, 2),
      "utf-8"
    );
  }

  console.log("\n=== ENRICHED BACKGROUND EXPERIMENT SUMMARY ===");
  console.log("Domain".padEnd(10), "Baseline (v2)".padEnd(15), "Enriched Leverage".padEnd(19), "Enriched Mentioned");
  for (const r of results) {
    console.log(
      r.domain.padEnd(10),
      `${(r.baseline_v2_leverage_rate * 100).toFixed(0)}%`.padEnd(15),
      `${(r.leverage_rate * 100).toFixed(0)}%`.padEnd(19),
      `${(r.mentioned_rate * 100).toFixed(0)}%`
    );
  }
})();
