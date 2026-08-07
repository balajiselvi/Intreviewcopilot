const fs = require("fs");
const path = require("path");
const { generateAnswer } = require("./lib/generateAnswer");
const { judgeLeverage } = require("./lib/evalLeveraging");
const { CANDIDATE_BACKGROUND } = require("./lib/candidateBackground");

// Verifies the "MANDATORY -- REJECTED ALTERNATIVE" isolation fix against the TRUE, full
// production prompt (all sections present, live /api/chat) -- not the minimal test harness
// used in eval/testAlternativeGenerationHypothesis.js. Learning applied from
// eval/results/LEVERAGING_BENCHMARK_2026-08-07.md's earlier lesson: isolated-prompt results
// don't always survive at full prompt size, so this must be checked directly, not assumed.
// Runs in the FOREGROUND (not backgrounded) to avoid the console/file reliability issue also
// documented in that file; all reported numbers come from reading the saved JSON back.

const N_TEST = 10;
const MODEL = "gpt-4o-mini";
const BASELINE_PATH = path.join(__dirname, "results", "leveraging_benchmark.json");
const REJECTION_LANGUAGE = /instead of|rather than|reject|considered .*but|chose .* over|opted .* over|in favor of/i;

(async () => {
  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf-8"));
  const grcBaseline = baseline.find(d => d.domain === "GRC");
  const question = grcBaseline.question;
  const controls = grcBaseline.controls;

  console.log(`Generating ${N_TEST} GRC answers against the TRUE full production prompt (real background)...`);
  const tests = [];
  for (let i = 0; i < N_TEST; i++) {
    const { answer } = await generateAnswer(question, { model: MODEL, candidateResume: CANDIDATE_BACKGROUND });
    tests.push(answer);
  }

  const rejectionFlagged = tests.filter(a => REJECTION_LANGUAGE.test(a)).length;
  console.log(`Rejection-language flagged: ${rejectionFlagged}/${N_TEST} (manual verification still required)`);

  console.log(`Judging against the ${controls.length} reused original control answers...`);
  const judged = [];
  for (let i = 0; i < tests.length; i++) {
    const verdict = await judgeLeverage(question, controls, tests[i]);
    judged.push({ run: i + 1, answer: tests[i], verdict, rejection_flagged: REJECTION_LANGUAGE.test(tests[i]) });
    console.log(`  run ${i + 1}: ${verdict.classification} (fork: ${verdict.decision_fork || "none"}) rejection_flagged=${REJECTION_LANGUAGE.test(tests[i])}`);
  }

  const counts = { LEVERAGED: 0, MENTIONED: 0, ABSENT: 0 };
  for (const j of judged) counts[j.verdict.classification] = (counts[j.verdict.classification] || 0) + 1;

  const result = {
    domain: "GRC",
    question,
    n: N_TEST,
    leverage_rate: counts.LEVERAGED / N_TEST,
    mentioned_rate: counts.MENTIONED / N_TEST,
    absent_rate: counts.ABSENT / N_TEST,
    counts,
    rejection_flagged_count: rejectionFlagged,
    pre_fix_leverage_rate: 0.10,
    controls,
    judged
  };
  fs.writeFileSync(path.join(__dirname, "results", "grc_post_altgen_fix_retest.json"), JSON.stringify(result, null, 2), "utf-8");

  const saved = JSON.parse(fs.readFileSync(path.join(__dirname, "results", "grc_post_altgen_fix_retest.json"), "utf-8"));
  const recomputed = { LEVERAGED: 0, MENTIONED: 0, ABSENT: 0 };
  for (const j of saved.judged) recomputed[j.verdict.classification] = (recomputed[j.verdict.classification] || 0) + 1;

  console.log("\n=== GRC FULL-PRODUCTION POST-FIX RESULT (verified against saved file) ===");
  console.log(`Leverage: ${counts.LEVERAGED}/${N_TEST} (was 10% pre-fix)`);
  console.log(`Recomputed from file: LEVERAGED=${recomputed.LEVERAGED} MENTIONED=${recomputed.MENTIONED} ABSENT=${recomputed.ABSENT}`);
  console.log(counts.LEVERAGED === recomputed.LEVERAGED ? "File matches in-memory counts: OK" : "MISMATCH -- investigate before reporting");
})();
