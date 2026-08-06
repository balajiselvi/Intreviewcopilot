const fs = require("fs");
const path = require("path");

const { generateAnswer } = require("./lib/generateAnswer");
const { judgeAnswer } = require("./lib/judge");
const { critiqueAnswer } = require("./lib/critic");
const { CANDIDATE_BACKGROUND } = require("./lib/candidateBackground");
const { DOMAINS } = require("./domains");

const AFFECTED = new Set(["SAP BTP Security", "IAS", "IPS", "SAP IAG", "HANA", "BW", "S/4HANA Migration"]);
const targets = DOMAINS.filter(d => AFFECTED.has(d.domain));

function overallOf(scores) {
  const dims = ["technical_accuracy", "production_experience", "business_context", "communication", "architecture_thinking", "leadership"];
  const sum = dims.reduce((s, d) => s + (scores[d] || 0), 0);
  return Number((sum / dims.length).toFixed(2));
}

(async () => {
  const before = JSON.parse(fs.readFileSync(path.join(__dirname, "results", "pipeline_with_real_cv_results.json"), "utf-8"));
  const results = [];
  for (const t of targets) {
    console.log(`\n=== ${t.domain} (after domain-boost retrieval fix) ===`);
    const gen = await generateAnswer(t.question, { candidateResume: CANDIDATE_BACKGROUND });
    const judge = await judgeAnswer(t.question, gen.answer);
    judge.overall_score = overallOf(judge);
    const critique = await critiqueAnswer(t.question, gen.answer);
    const beforeEntry = before.find(b => b.domain === t.domain);
    const beforeScore = beforeEntry ? beforeEntry.judge.overall_score : "N/A";
    console.log(`  before: ${beforeScore} -> after: ${judge.overall_score} | findings: ${critique.findings.length}`);
    results.push({ domain: t.domain, question: t.question, answer: gen.answer, judge, findingCount: critique.findings.length, beforeScore });
  }
  fs.writeFileSync(path.join(__dirname, "results", "retrieval_fix_results.json"), JSON.stringify(results, null, 2), "utf-8");

  const avgBefore = results.reduce((s, r) => s + (typeof r.beforeScore === "number" ? r.beforeScore : 0), 0) / results.length;
  const avgAfter = results.reduce((s, r) => s + r.judge.overall_score, 0) / results.length;
  console.log(`\n=== RETRIEVAL FIX SUMMARY (7 affected domains) ===`);
  console.log(`Avg before: ${avgBefore.toFixed(2)}/10`);
  console.log(`Avg after:  ${avgAfter.toFixed(2)}/10`);
  console.log(`Delta:      ${(avgAfter - avgBefore).toFixed(2)}`);
})();
