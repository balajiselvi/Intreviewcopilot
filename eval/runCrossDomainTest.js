const fs = require("fs");
const path = require("path");

const { generateAnswer } = require("./lib/generateAnswer");
const { judgeAnswer } = require("./lib/judge");
const { CANDIDATE_BACKGROUND } = require("./lib/candidateBackground");
const { DOMAINS } = require("./domains");

const SAMPLE = new Set(["SAP GRC", "SAP BTP Security", "HANA"]);
const targets = DOMAINS.filter(d => SAMPLE.has(d.domain));
const RUNS_PER_DOMAIN = 3;

function overallOf(scores) {
  const dims = ["technical_accuracy", "production_experience", "business_context", "communication", "architecture_thinking", "leadership"];
  const sum = dims.reduce((s, d) => s + (scores[d] || 0), 0);
  return Number((sum / dims.length).toFixed(2));
}

function stats(arr) {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((s, x) => s + (x - mean) ** 2, 0) / arr.length;
  return { mean: Number(mean.toFixed(2)), stdDev: Number(Math.sqrt(variance).toFixed(2)) };
}

(async () => {
  const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, "results", "multipass_noise_results_n5.json"), "utf-8"));
  const results = [];
  for (const t of targets) {
    console.log(`\n=== ${t.domain}: ${RUNS_PER_DOMAIN} runs (cross-domain retrieval boost) ===`);
    const scores = [];
    for (let i = 0; i < RUNS_PER_DOMAIN; i++) {
      const gen = await generateAnswer(t.question, { candidateResume: CANDIDATE_BACKGROUND });
      const judge = await judgeAnswer(t.question, gen.answer);
      const score = overallOf(judge);
      scores.push(score);
      console.log(`  run ${i + 1}: ${score}/10`);
    }
    const s = stats(scores);
    const base = baseline.find(b => b.domain === t.domain);
    console.log(`  mean=${s.mean} stdDev=${s.stdDev} | n=5 baseline mean=${base.mean} stdDev=${base.stdDev}`);
    results.push({ domain: t.domain, scores, ...s, baselineMean: base.mean, baselineStdDev: base.stdDev, delta: Number((s.mean - base.mean).toFixed(2)) });
  }
  fs.writeFileSync(path.join(__dirname, "results", "cross_domain_boost_results.json"), JSON.stringify(results, null, 2), "utf-8");

  console.log(`\n=== CROSS-DOMAIN RETRIEVAL BOOST SUMMARY ===`);
  results.forEach(r => {
    const withinNoise = Math.abs(r.delta) < 0.35;
    console.log(`${r.domain}: baseline=${r.baselineMean} -> new(n=3)=${r.mean} | delta=${r.delta} | ${withinNoise ? "within noise floor, not significant" : "exceeds noise floor"}`);
  });
})();
