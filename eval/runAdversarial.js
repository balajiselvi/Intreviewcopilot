const fs = require("fs");
const path = require("path");

const { ADVERSARIAL_CASES } = require("./adversarial");
const { generateAnswer } = require("./lib/generateAnswer");
const { judgeAnswer } = require("./lib/judge");

const OUT_PATH = path.join(__dirname, "results", "adversarial_results.json");

function overallOf(scores) {
  const dims = ["technical_accuracy", "production_experience", "business_context", "communication", "architecture_thinking", "leadership"];
  const sum = dims.reduce((s, d) => s + (scores[d] || 0), 0);
  return Number((sum / dims.length).toFixed(2));
}

(async () => {
  const results = [];
  for (const c of ADVERSARIAL_CASES) {
    console.log(`\n=== ${c.domain} :: ${c.behavior} ===`);
    try {
      const gen = await generateAnswer(c.question);
      const judge = await judgeAnswer(c.question, gen.answer);
      judge.overall_score = overallOf(judge);
      const pass = judge.overall_score >= 9;
      console.log(`  score: ${judge.overall_score}/10 ${pass ? "PASS (>=9)" : "BELOW THRESHOLD"}`);
      results.push({ domain: c.domain, behavior: c.behavior, question: c.question, answer: gen.answer, latencyMs: gen.latencyMs, judge, pass });
    } catch (e) {
      console.log(`  ERROR: ${e.message}`);
      results.push({ domain: c.domain, behavior: c.behavior, question: c.question, error: e.message });
    }
    fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2), "utf-8");
  }

  const scored = results.filter(r => r.judge);
  const passCount = scored.filter(r => r.pass).length;
  const avg = scored.reduce((s, r) => s + r.judge.overall_score, 0) / (scored.length || 1);
  console.log(`\n=== ADVERSARIAL SUMMARY ===`);
  console.log(`${passCount}/${scored.length} scenarios stayed >=9/10 | avg: ${avg.toFixed(2)}/10`);
})();
