const fs = require("fs");
const path = require("path");

const { generateAnswer } = require("./lib/generateAnswer");
const { critiqueAnswer } = require("./lib/critic");
const { judgeAnswer } = require("./lib/judge");

const TARGETS = [
  { domain: "SAP IAG", question: "What's different about managing access risk in SAP Identity Access Governance compared to on-premise GRC?" },
  { domain: "HANA", question: "How do you design database-level authorization in SAP HANA, including analytic privileges?" },
  { domain: "SAC", question: "How do you approach role and team-based security design in SAP Analytics Cloud?" }
];

function overallOf(scores) {
  const dims = ["technical_accuracy", "production_experience", "business_context", "communication", "architecture_thinking", "leadership"];
  const sum = dims.reduce((s, d) => s + (scores[d] || 0), 0);
  return Number((sum / dims.length).toFixed(2));
}

(async () => {
  const results = [];
  for (const t of TARGETS) {
    console.log(`\n=== ${t.domain} (after knowledge expansion) ===`);
    const gen = await generateAnswer(t.question);
    const judge = await judgeAnswer(t.question, gen.answer);
    judge.overall_score = overallOf(judge);
    const critique = await critiqueAnswer(t.question, gen.answer);
    console.log(`  score: ${judge.overall_score}/10 | findings: ${critique.findings.length}`);
    results.push({ domain: t.domain, question: t.question, answer: gen.answer, judge, findingCount: critique.findings.length, findings: critique.findings });
  }
  fs.writeFileSync(path.join(__dirname, "results", "targeted_after_knowledge.json"), JSON.stringify(results, null, 2), "utf-8");

  // Compare against the original (pre-knowledge-expansion) pipeline results.
  const before = JSON.parse(fs.readFileSync(path.join(__dirname, "results", "pipeline_results.json"), "utf-8"));
  console.log(`\n=== BEFORE vs AFTER (knowledge expansion) ===`);
  for (const r of results) {
    const beforeEntry = before.find(b => b.domain === r.domain || (r.domain === "SAP IAG" && b.domain === "SAP IAG") || (r.domain === "HANA" && b.domain === "HANA") || (r.domain === "SAC" && b.domain === "SAC"));
    const beforeScore = beforeEntry ? beforeEntry.raw.judge.overall_score : "N/A";
    console.log(`${r.domain}: before=${beforeScore} -> after=${r.judge.overall_score} (findings: before=${beforeEntry ? beforeEntry.critic.findings.length : "N/A"} -> after=${r.findingCount})`);
  }
})();
