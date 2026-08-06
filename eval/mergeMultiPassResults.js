const fs = require("fs");
const path = require("path");

const run1to3 = JSON.parse(fs.readFileSync(path.join(__dirname, "results", "multipass_noise_results_run1-3.json"), "utf-8"));
const run4to5 = JSON.parse(fs.readFileSync(path.join(__dirname, "results", "multipass_noise_results_run4-5.json"), "utf-8"));

function stats(arr) {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((s, x) => s + (x - mean) ** 2, 0) / arr.length;
  const stdDev = Math.sqrt(variance);
  return { mean: Number(mean.toFixed(2)), stdDev: Number(stdDev.toFixed(2)), min: Math.min(...arr), max: Math.max(...arr) };
}

const merged = run1to3.map(a => {
  const b = run4to5.find(x => x.domain === a.domain);
  const scores = [...a.scores, ...(b ? b.scores : [])];
  return { domain: a.domain, n: scores.length, scores, ...stats(scores) };
});

fs.writeFileSync(path.join(__dirname, "results", "multipass_noise_results_n5.json"), JSON.stringify(merged, null, 2), "utf-8");

console.log("=== MERGED n=5 NOISE FLOOR RESULTS ===\n");
merged.forEach(m => {
  console.log(`${m.domain}: n=${m.n} scores=[${m.scores.join(", ")}] mean=${m.mean} stdDev=${m.stdDev} range=[${m.min}, ${m.max}]`);
});

const avgStdDev = merged.reduce((s, r) => s + r.stdDev, 0) / merged.length;
const avgMean = merged.reduce((s, r) => s + r.mean, 0) / merged.length;
console.log(`\nOverall avg mean (n=5, 6 domains): ${avgMean.toFixed(2)}`);
console.log(`Overall avg within-domain stdDev: ${avgStdDev.toFixed(2)}`);
console.log(`Noise floor (2x stdDev): ~${(avgStdDev * 2).toFixed(2)} -- effects smaller than this at n=1 are not distinguishable from noise.`);
