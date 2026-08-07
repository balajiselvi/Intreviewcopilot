const fs = require("fs");
const path = require("path");
const { judgeLeverage } = require("./lib/evalLeveraging");

// Single-variable re-test: v1's judge (see git history of eval/lib/evalLeveraging.js) produced
// a 91.4% average leverage rate, but spot-checking its own evidence/counterfactual_explanation
// fields showed it classifying pure decoration ("cited a real number as an example of a step
// every control answer also takes") as LEVERAGED -- exactly the failure mode this benchmark
// exists to screen out. This script changes ONE variable -- the judge prompt (now requiring a
// named decision fork where the TEST answer diverges IN KIND from every control, not just with
// more specific illustration) -- and re-scores the SAME saved answers/controls from the
// original run, with no new generation calls, isolating the judge-prompt variable cleanly.

const SOURCE = path.join(__dirname, "results", "leveraging_benchmark.json");
const OUTPUT = path.join(__dirname, "results", "leveraging_benchmark_v2.json");

(async () => {
  const domains = JSON.parse(fs.readFileSync(SOURCE, "utf-8"));
  const results = [];

  for (const d of domains) {
    console.log(`\n=== ${d.domain} (re-judging ${d.judged.length} saved answers) ===`);
    const rejudged = [];
    for (const item of d.judged) {
      const verdict = await judgeLeverage(d.question, d.controls, item.answer);
      rejudged.push({ run: item.run, answer: item.answer, verdict, v1_classification: item.verdict.classification });
      console.log(`  run ${item.run}: v1=${item.verdict.classification} -> v2=${verdict.classification} (fork: ${verdict.decision_fork || "none"})`);
    }

    const counts = { LEVERAGED: 0, MENTIONED: 0, ABSENT: 0 };
    for (const j of rejudged) counts[j.verdict.classification] = (counts[j.verdict.classification] || 0) + 1;
    const n = rejudged.length;
    const avgQuality = rejudged.reduce((s, j) => s + (Number(j.verdict.reasoning_quality) || 0), 0) / n;
    const avgConfidence = rejudged.reduce((s, j) => s + (Number(j.verdict.confidence) || 0), 0) / n;
    const modal = Math.max(counts.LEVERAGED, counts.MENTIONED, counts.ABSENT);
    const consistency = modal / n;

    const result = {
      domain: d.domain,
      question: d.question,
      n,
      leverage_rate: counts.LEVERAGED / n,
      mentioned_rate: counts.MENTIONED / n,
      absent_rate: counts.ABSENT / n,
      counts,
      avg_reasoning_quality: avgQuality,
      avg_judge_confidence: avgConfidence,
      consistency,
      v1_leverage_rate: d.leverage_rate,
      judged: rejudged
    };
    console.log(`  === [${d.domain}] v1 leverage=${(d.leverage_rate * 100).toFixed(0)}% -> v2 leverage=${(result.leverage_rate * 100).toFixed(0)}% (mentioned=${(result.mentioned_rate * 100).toFixed(0)}%, absent=${(result.absent_rate * 100).toFixed(0)}%) ===`);
    results.push(result);
    fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2), "utf-8");
  }

  console.log("\n=== v1 vs v2 SUMMARY ===");
  console.log("Domain".padEnd(14), "v1 Leverage".padEnd(13), "v2 Leverage".padEnd(13), "v2 Mentioned".padEnd(14), "v2 Absent");
  for (const r of results) {
    console.log(
      r.domain.padEnd(14),
      `${(r.v1_leverage_rate * 100).toFixed(0)}%`.padEnd(13),
      `${(r.leverage_rate * 100).toFixed(0)}%`.padEnd(13),
      `${(r.mentioned_rate * 100).toFixed(0)}%`.padEnd(14),
      `${(r.absent_rate * 100).toFixed(0)}%`
    );
  }
  const v1Avg = results.reduce((s, r) => s + r.v1_leverage_rate, 0) / results.length;
  const v2Avg = results.reduce((s, r) => s + r.leverage_rate, 0) / results.length;
  console.log(`\nOverall: v1 avg leverage=${(v1Avg * 100).toFixed(1)}% -> v2 avg leverage=${(v2Avg * 100).toFixed(1)}%`);
})();
