const fs = require("fs");
const path = require("path");

const { DOMAINS } = require("./domains");
const { generateAnswer } = require("./lib/generateAnswer");
const { critiqueAnswer } = require("./lib/critic");
const { improveAnswer } = require("./lib/improver");
const { judgeAnswer } = require("./lib/judge");

const OUT_PATH = path.join(__dirname, "results", "pipeline_results.json");

function overallOf(scores) {
  const dims = ["technical_accuracy", "production_experience", "business_context", "communication", "architecture_thinking", "leadership"];
  const sum = dims.reduce((s, d) => s + (scores[d] || 0), 0);
  return Number((sum / dims.length).toFixed(2));
}

async function runDomain(entry) {
  const { domain, question } = entry;
  console.log(`\n=== ${domain} ===`);

  const gen = await generateAnswer(question);
  console.log(`  generated (${gen.answer.length} chars, ${gen.latencyMs}ms)`);

  const rawJudge = await judgeAnswer(question, gen.answer);
  rawJudge.overall_score = overallOf(rawJudge);
  console.log(`  raw judge: ${rawJudge.overall_score}/10`);

  const critique = await critiqueAnswer(question, gen.answer);
  console.log(`  critic found ${critique.findings.length} issue(s)`);

  let improved, improvedJudge;
  if (critique.findings.length === 0) {
    improved = { improved_answer: gen.answer, changes_made: [] };
    improvedJudge = rawJudge;
    console.log(`  no findings — improved answer == raw answer`);
  } else {
    improved = await improveAnswer(question, gen.answer, critique.findings);
    improvedJudge = await judgeAnswer(question, improved.improved_answer);
    improvedJudge.overall_score = overallOf(improvedJudge);
    console.log(`  improved judge: ${improvedJudge.overall_score}/10`);
  }

  return {
    domain,
    question,
    raw: { answer: gen.answer, latencyMs: gen.latencyMs, judge: rawJudge },
    critic: critique,
    improved: { answer: improved.improved_answer, changes_made: improved.changes_made, judge: improvedJudge }
  };
}

(async () => {
  const results = [];
  for (const entry of DOMAINS) {
    try {
      const r = await runDomain(entry);
      results.push(r);
    } catch (e) {
      console.log(`  ERROR: ${e.message}`);
      results.push({ domain: entry.domain, question: entry.question, error: e.message });
    }
    // Write incrementally so a crash mid-run doesn't lose completed domains.
    fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2), "utf-8");
  }

  const scored = results.filter(r => r.raw && r.improved);
  const avgRaw = scored.reduce((s, r) => s + r.raw.judge.overall_score, 0) / (scored.length || 1);
  const avgImproved = scored.reduce((s, r) => s + r.improved.judge.overall_score, 0) / (scored.length || 1);

  console.log(`\n=== SUMMARY ===`);
  console.log(`Domains: ${results.length} | Errors: ${results.filter(r => r.error).length}`);
  console.log(`Avg raw (production) score: ${avgRaw.toFixed(2)}/10`);
  console.log(`Avg improved score: ${avgImproved.toFixed(2)}/10`);
})();
