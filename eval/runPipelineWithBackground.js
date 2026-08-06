const fs = require("fs");
const path = require("path");

const { DOMAINS } = require("./domains");
const { generateAnswer } = require("./lib/generateAnswer");
const { critiqueAnswer } = require("./lib/critic");
const { judgeAnswer } = require("./lib/judge");
const { CANDIDATE_BACKGROUND } = require("./lib/candidateBackground");

const OUT_PATH = path.join(__dirname, "results", "pipeline_with_real_cv_results.json");

function overallOf(scores) {
  const dims = ["technical_accuracy", "production_experience", "business_context", "communication", "architecture_thinking", "leadership"];
  const sum = dims.reduce((s, d) => s + (scores[d] || 0), 0);
  return Number((sum / dims.length).toFixed(2));
}

(async () => {
  const results = [];
  for (const entry of DOMAINS) {
    const { domain, question } = entry;
    console.log(`\n=== ${domain} (with candidate background) ===`);
    try {
      const gen = await generateAnswer(question, { candidateResume: CANDIDATE_BACKGROUND });
      const judge = await judgeAnswer(question, gen.answer);
      judge.overall_score = overallOf(judge);
      const critique = await critiqueAnswer(question, gen.answer);
      console.log(`  score: ${judge.overall_score}/10 | findings: ${critique.findings.length}`);
      results.push({ domain, question, answer: gen.answer, latencyMs: gen.latencyMs, judge, findingCount: critique.findings.length, findings: critique.findings });
    } catch (e) {
      console.log(`  ERROR: ${e.message}`);
      results.push({ domain, question, error: e.message });
    }
    fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2), "utf-8");
  }

  const before = JSON.parse(fs.readFileSync(path.join(__dirname, "results", "pipeline_results.json"), "utf-8"));
  const scored = results.filter(r => r.judge);
  const avgAfter = scored.reduce((s, r) => s + r.judge.overall_score, 0) / scored.length;
  const avgBefore = before.filter(b => b.raw).reduce((s, b) => s + b.raw.judge.overall_score, 0) / before.filter(b => b.raw).length;

  console.log(`\n=== BEFORE (no background) vs AFTER (with real candidate background) ===`);
  console.log(`Avg before: ${avgBefore.toFixed(2)}/10`);
  console.log(`Avg after:  ${avgAfter.toFixed(2)}/10`);
  console.log(`Delta:      ${(avgAfter - avgBefore).toFixed(2)}`);

  console.log(`\nPer-domain:`);
  for (const r of results) {
    if (!r.judge) continue;
    const b = before.find(x => x.domain === r.domain);
    const bs = b ? b.raw.judge.overall_score : "N/A";
    console.log(`  ${r.domain}: ${bs} -> ${r.judge.overall_score}`);
  }
})();
