const fs = require("fs");
const path = require("path");

const { generateAnswer } = require("./lib/generateAnswer");
const { critiqueAnswer } = require("./lib/critic");
const { improveAnswer } = require("./lib/improver");
const { judgeAnswer } = require("./lib/judge");
const { CANDIDATE_BACKGROUND } = require("./lib/candidateBackground");
const { DOMAINS } = require("./domains");

// Same 3-domain sample as the noise-floor and cross-domain tests, for a clean, directly
// comparable measurement against the already-established n=5 raw-generation baseline.
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
    console.log(`\n=== ${t.domain}: ${RUNS_PER_DOMAIN} runs (full 3-pass: generate -> critique -> improve -> judge) ===`);
    const scores = [];
    const latencies = [];

    for (let i = 0; i < RUNS_PER_DOMAIN; i++) {
      const t0 = Date.now();
      const gen = await generateAnswer(t.question, { candidateResume: CANDIDATE_BACKGROUND });
      const t1 = Date.now();
      const critique = await critiqueAnswer(t.question, gen.answer);
      const t2 = Date.now();
      let finalAnswer = gen.answer;
      if (critique.findings.length > 0) {
        const improved = await improveAnswer(t.question, gen.answer, critique.findings);
        finalAnswer = improved.improved_answer;
      }
      const t3 = Date.now();
      const judge = await judgeAnswer(t.question, finalAnswer);
      const t4 = Date.now();
      const score = overallOf(judge);

      const latency = { generateMs: t1 - t0, critiqueMs: t2 - t1, improveMs: t3 - t2, totalUserFacingMs: t3 - t0 };
      scores.push(score);
      latencies.push(latency);
      console.log(`  run ${i + 1}: score=${score}/10 | generate=${latency.generateMs}ms critique=${latency.critiqueMs}ms improve=${latency.improveMs}ms | TOTAL USER-FACING WAIT=${latency.totalUserFacingMs}ms`);
    }

    const s = stats(scores);
    const avgLatency = {
      generateMs: Math.round(latencies.reduce((sum, l) => sum + l.generateMs, 0) / latencies.length),
      critiqueMs: Math.round(latencies.reduce((sum, l) => sum + l.critiqueMs, 0) / latencies.length),
      improveMs: Math.round(latencies.reduce((sum, l) => sum + l.improveMs, 0) / latencies.length),
      totalUserFacingMs: Math.round(latencies.reduce((sum, l) => sum + l.totalUserFacingMs, 0) / latencies.length)
    };
    const base = baseline.find(b => b.domain === t.domain);
    const delta = Number((s.mean - base.mean).toFixed(2));
    console.log(`  mean=${s.mean} stdDev=${s.stdDev} | n=5 single-pass baseline=${base.mean} | delta=${delta} | avg user-facing wait=${avgLatency.totalUserFacingMs}ms (vs single-pass ~${latencies[0].generateMs}ms)`);

    results.push({ domain: t.domain, scores, ...s, baselineMean: base.mean, delta, avgLatency });
  }

  fs.writeFileSync(path.join(__dirname, "results", "three_pass_evidence_results.json"), JSON.stringify(results, null, 2), "utf-8");

  console.log(`\n=== 3-PASS EVIDENCE SUMMARY ===`);
  const avgDelta = results.reduce((s, r) => s + r.delta, 0) / results.length;
  const avgWait = results.reduce((s, r) => s + r.avgLatency.totalUserFacingMs, 0) / results.length;
  const avgSinglePassWait = results.reduce((s, r) => s + r.avgLatency.generateMs, 0) / results.length;
  console.log(`Avg quality delta vs single-pass: ${avgDelta.toFixed(2)} (noise floor: ~0.35)`);
  console.log(`Avg single-pass latency: ${Math.round(avgSinglePassWait)}ms`);
  console.log(`Avg 3-pass user-facing latency: ${Math.round(avgWait)}ms`);
  console.log(`Latency multiplier: ${(avgWait / avgSinglePassWait).toFixed(1)}x`);
})();
