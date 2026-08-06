const fs = require("fs");
const path = require("path");

const { generateAnswer } = require("./lib/generateAnswer");
const { judgeAnswer } = require("./lib/judge");
const { CANDIDATE_BACKGROUND } = require("./lib/candidateBackground");
const { DOMAINS } = require("./domains");

// Representative sample spanning the patterns observed so far: big gainers, flat, and a dropper.
const SAMPLE = new Set(["SAP GRC", "SAP Security", "HANA", "SAP BTP Security", "Audit", "SAC"]);
const targets = DOMAINS.filter(d => SAMPLE.has(d.domain));
const RUNS_PER_DOMAIN = 2; // extends the existing 3-run results to 5 total; merged by mergeMultiPassResults.js

function overallOf(scores) {
  const dims = ["technical_accuracy", "production_experience", "business_context", "communication", "architecture_thinking", "leadership"];
  const sum = dims.reduce((s, d) => s + (scores[d] || 0), 0);
  return Number((sum / dims.length).toFixed(2));
}

function stats(arr) {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((s, x) => s + (x - mean) ** 2, 0) / arr.length;
  const stdDev = Math.sqrt(variance);
  return { mean: Number(mean.toFixed(2)), stdDev: Number(stdDev.toFixed(2)), min: Math.min(...arr), max: Math.max(...arr) };
}

(async () => {
  const results = [];
  for (const t of targets) {
    console.log(`\n=== ${t.domain}: ${RUNS_PER_DOMAIN} runs ===`);
    const scores = [];
    for (let i = 0; i < RUNS_PER_DOMAIN; i++) {
      const gen = await generateAnswer(t.question, { candidateResume: CANDIDATE_BACKGROUND });
      const judge = await judgeAnswer(t.question, gen.answer);
      const score = overallOf(judge);
      scores.push(score);
      console.log(`  run ${i + 1}: ${score}/10`);
    }
    const s = stats(scores);
    console.log(`  mean=${s.mean} stdDev=${s.stdDev} range=[${s.min}, ${s.max}]`);
    results.push({ domain: t.domain, scores, ...s });
  }
  fs.writeFileSync(path.join(__dirname, "results", "multipass_noise_results_run4-5.json"), JSON.stringify(results, null, 2), "utf-8");

  const avgStdDev = results.reduce((s, r) => s + r.stdDev, 0) / results.length;
  console.log(`\n=== NOISE FLOOR SUMMARY ===`);
  console.log(`Average within-domain stdDev across ${results.length} domains, ${RUNS_PER_DOMAIN} runs each: ${avgStdDev.toFixed(2)}`);
  console.log(`This is the noise floor -- any measured effect smaller than ~${(avgStdDev * 2).toFixed(2)} (2x stdDev) cannot be confidently attributed to a code change at n=1.`);
})();
