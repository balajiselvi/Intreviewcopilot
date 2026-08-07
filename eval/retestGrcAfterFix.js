const fs = require("fs");
const path = require("path");
const { generateAnswer } = require("./lib/generateAnswer");
const { judgeLeverage } = require("./lib/evalLeveraging");
const { ENRICHED_GRC_BACKGROUND } = require("./lib/enrichedBackgrounds");

// Single-variable re-test after the targeted getDomainDepthGuidance() fix in
// lib/prompt/interviewPrompt.js (see the comment above that function for the fix rationale).
// Same question, same enriched GRC background, same REUSED control answers from the original
// benchmark -- the ONLY thing that changed since the last GRC run is the one added clause.
const N_TEST = 10;
const MODEL = "gpt-4o-mini";

const BASELINE_PATH = path.join(__dirname, "results", "leveraging_benchmark.json");
const NARRATIVE_KEYWORDS = /MSMP|localized stage|dynamic agent routing|overrode|SU24/i;

(async () => {
  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf-8"));
  const grcBaseline = baseline.find(d => d.domain === "GRC");
  const question = grcBaseline.question;
  const controls = grcBaseline.controls;

  console.log(`Generating ${N_TEST} GRC test answers with enriched background (post-fix)...`);
  const tests = [];
  for (let i = 0; i < N_TEST; i++) {
    const { answer } = await generateAnswer(question, { model: MODEL, candidateResume: ENRICHED_GRC_BACKGROUND });
    tests.push(answer);
  }

  const narrativeSurfaced = tests.filter(a => NARRATIVE_KEYWORDS.test(a)).length;
  console.log(`Narrative keywords found in ${narrativeSurfaced}/${N_TEST} answers (was 0/10 before the fix).`);

  console.log(`Judging against the ${controls.length} REUSED original control answers...`);
  const judged = [];
  for (let i = 0; i < tests.length; i++) {
    const verdict = await judgeLeverage(question, controls, tests[i]);
    judged.push({ run: i + 1, answer: tests[i], verdict, narrative_present: NARRATIVE_KEYWORDS.test(tests[i]) });
    console.log(`  run ${i + 1}: ${verdict.classification} (fork: ${verdict.decision_fork || "none"}) narrative_present=${NARRATIVE_KEYWORDS.test(tests[i])}`);
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
    narrative_surfaced_count: narrativeSurfaced,
    pre_fix_leverage_rate: 0.10,
    pre_fix_narrative_surfaced_count: 0,
    controls,
    judged
  };

  fs.writeFileSync(
    path.join(__dirname, "results", "grc_post_fix_retest.json"),
    JSON.stringify(result, null, 2),
    "utf-8"
  );

  // Verify by reading the file back and recomputing, per this project's established discipline
  // after repeated console-vs-file mismatches on backgrounded runs.
  const savedFile = JSON.parse(fs.readFileSync(path.join(__dirname, "results", "grc_post_fix_retest.json"), "utf-8"));
  const recomputed = { LEVERAGED: 0, MENTIONED: 0, ABSENT: 0 };
  for (const j of savedFile.judged) recomputed[j.verdict.classification] = (recomputed[j.verdict.classification] || 0) + 1;

  console.log("\n=== GRC POST-FIX RESULT (verified against saved file) ===");
  console.log(`Narrative surfaced: ${savedFile.narrative_surfaced_count}/${N_TEST} (was 0/10)`);
  console.log(`Leverage: ${counts.LEVERAGED}/${N_TEST} = ${(result.leverage_rate * 100).toFixed(0)}% (was 10%)`);
  console.log(`Recomputed from saved file: LEVERAGED=${recomputed.LEVERAGED} MENTIONED=${recomputed.MENTIONED} ABSENT=${recomputed.ABSENT}`);
  console.log(counts.LEVERAGED === recomputed.LEVERAGED && counts.MENTIONED === recomputed.MENTIONED ? "File matches in-memory counts: OK" : "MISMATCH -- do not trust this run, investigate before reporting");
})();
