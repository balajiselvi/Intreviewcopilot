const fs = require("fs");
const path = require("path");
const { generateAnswer } = require("./lib/generateAnswer");
const { judgeLeverage } = require("./lib/evalLeveraging");
const { CANDIDATE_BACKGROUND } = require("./lib/candidateBackground");

// Architectural Leveraging benchmark. Distinct from the Experience Activation work (frozen as
// of commit 49317ab) -- activation measured whether background FACTS appear in the answer;
// this measures whether background genuinely CHANGES the engineering reasoning, via a
// counterfactual test: for each question, generate real CONTROL answers with no background
// (the live pipeline's actual generic-mode output) and real TEST answers with background, then
// have an independent judge decide whether each TEST answer's underlying engineering decision
// would collapse into the control shape if the background were removed. See
// eval/lib/evalLeveraging.js for the judge's exact criteria -- deliberately NOT keyword-based.
//
// Uses the real production CANDIDATE_BACKGROUND (not synthetic per-domain backgrounds like
// eval/crossCategoryValidation.js) because this benchmarks what the shipped product actually
// does with the real candidate's real experience, not activation generalization.

const N_TEST = 10;
const N_CONTROL = 3;
const MODEL = "gpt-4o-mini";

const DOMAIN_CASES = [
  { domain: "GRC", question: "How would you design an SoD remediation process and Emergency Access Management framework for a client with a large, complex SAP landscape?" },
  { domain: "BTP", question: "How do you secure the Cloud Connector and manage trust between BTP subaccounts and on-premise systems?" },
  { domain: "HANA", question: "How do you design database-level authorization in SAP HANA, including analytic privileges?" },
  { domain: "Security", question: "How do you approach designing a role-based authorization concept for a large SAP landscape from scratch?" },
  { domain: "IDM", question: "How would you design an identity provisioning workflow for a new SAP landscape, including joiner-mover-leaver processes?" },
  { domain: "Fiori", question: "How do you approach security for a Fiori launchpad deployment, including tile-level authorization?" },
  { domain: "Architecture", question: "How would you design the authorization architecture for a multi-country S/4HANA rollout where each country has different regulatory requirements?" }
];

async function runDomain(testCase) {
  console.log(`\n=== ${testCase.domain} ===`);

  console.log(`  generating ${N_CONTROL} control answers (no background)...`);
  const controls = [];
  for (let i = 0; i < N_CONTROL; i++) {
    const { answer } = await generateAnswer(testCase.question, { model: MODEL });
    controls.push(answer);
  }

  console.log(`  generating ${N_TEST} test answers (with real background)...`);
  const tests = [];
  for (let i = 0; i < N_TEST; i++) {
    const { answer } = await generateAnswer(testCase.question, { model: MODEL, candidateResume: CANDIDATE_BACKGROUND });
    tests.push(answer);
  }

  console.log(`  judging ${N_TEST} test answers against the control baseline...`);
  const judged = [];
  for (let i = 0; i < tests.length; i++) {
    const verdict = await judgeLeverage(testCase.question, controls, tests[i]);
    judged.push({ run: i + 1, answer: tests[i], verdict });
    console.log(`    run ${i + 1}: ${verdict.classification} (quality=${verdict.reasoning_quality}, confidence=${verdict.confidence})`);
  }

  const counts = { LEVERAGED: 0, MENTIONED: 0, ABSENT: 0 };
  for (const j of judged) counts[j.verdict.classification] = (counts[j.verdict.classification] || 0) + 1;

  const avgQuality = judged.reduce((s, j) => s + (Number(j.verdict.reasoning_quality) || 0), 0) / judged.length;
  const avgConfidence = judged.reduce((s, j) => s + (Number(j.verdict.confidence) || 0), 0) / judged.length;
  const modal = Math.max(counts.LEVERAGED, counts.MENTIONED, counts.ABSENT);
  const consistency = modal / judged.length;

  const result = {
    domain: testCase.domain,
    question: testCase.question,
    n: N_TEST,
    n_control: N_CONTROL,
    leverage_rate: counts.LEVERAGED / N_TEST,
    mentioned_rate: counts.MENTIONED / N_TEST,
    absent_rate: counts.ABSENT / N_TEST,
    counts,
    avg_reasoning_quality: avgQuality,
    avg_judge_confidence: avgConfidence,
    consistency,
    controls,
    judged
  };

  console.log(`  === [${testCase.domain}] leverage=${(result.leverage_rate * 100).toFixed(0)}% mentioned=${(result.mentioned_rate * 100).toFixed(0)}% absent=${(result.absent_rate * 100).toFixed(0)}% quality=${avgQuality.toFixed(1)} consistency=${consistency.toFixed(2)} ===`);

  return result;
}

(async () => {
  const results = [];
  for (const testCase of DOMAIN_CASES) {
    const r = await runDomain(testCase);
    results.push(r);
    fs.writeFileSync(
      path.join(__dirname, "results", "leveraging_benchmark.json"),
      JSON.stringify(results, null, 2),
      "utf-8"
    );
  }

  console.log("\n=== ARCHITECTURAL LEVERAGING BENCHMARK SUMMARY ===");
  console.log("Domain".padEnd(14), "Leverage".padEnd(10), "Mentioned".padEnd(11), "Absent".padEnd(9), "Quality".padEnd(9), "Consistency");
  for (const r of results) {
    console.log(
      r.domain.padEnd(14),
      `${(r.leverage_rate * 100).toFixed(0)}%`.padEnd(10),
      `${(r.mentioned_rate * 100).toFixed(0)}%`.padEnd(11),
      `${(r.absent_rate * 100).toFixed(0)}%`.padEnd(9),
      r.avg_reasoning_quality.toFixed(1).padEnd(9),
      r.consistency.toFixed(2)
    );
  }

  const overallLeverage = results.reduce((s, r) => s + r.leverage_rate, 0) / results.length;
  console.log(`\nOverall average leverage rate: ${(overallLeverage * 100).toFixed(1)}%`);
})();
