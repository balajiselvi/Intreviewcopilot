const fs = require("fs");
const path = require("path");

const { generateAnswer } = require("./lib/generateAnswer");
const { judgeAnswer } = require("./lib/judge");
const { critiqueAnswer } = require("./lib/critic");

const TARGETS = [
  { domain: "Troubleshooting", question: "Walk me through how you'd diagnose a user access issue reported as urgent." },
  { domain: "Production Support", question: "A user reports they are unable to access their Firefighter ID in SAP GRC Emergency Access Management. How do you troubleshoot this?" }
];

function overallOf(scores) {
  const dims = ["technical_accuracy", "production_experience", "business_context", "communication", "architecture_thinking", "leadership"];
  const sum = dims.reduce((s, d) => s + (scores[d] || 0), 0);
  return Number((sum / dims.length).toFixed(2));
}

(async () => {
  const results = [];
  for (const t of TARGETS) {
    console.log(`\n=== ${t.domain} (diagnostic methodology directive) ===`);
    const gen = await generateAnswer(t.question);
    console.log(gen.answer);
    const judge = await judgeAnswer(t.question, gen.answer);
    judge.overall_score = overallOf(judge);
    const critique = await critiqueAnswer(t.question, gen.answer);
    console.log(`\n  score: ${judge.overall_score}/10 | findings: ${critique.findings.length}`);
    results.push({ domain: t.domain, question: t.question, answer: gen.answer, judge, findingCount: critique.findings.length });
  }
  fs.writeFileSync(path.join(__dirname, "results", "diagnostic_test_results.json"), JSON.stringify(results, null, 2), "utf-8");
})();
