const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const { OPENAI_API_KEY } = require("./lib/env");

const client = new OpenAI({ apiKey: OPENAI_API_KEY });
const QUESTION = "How would you design the authorization architecture for a multi-country S/4HANA rollout where each country has different regulatory requirements?";

const CAPTURED_PROMPT_PATH = "C:\\Users\\balaj\\AppData\\Local\\Temp\\claude\\C--Users-balaj-Downloads-interviewcopilot-main-interviewcopilot-main\\e013dbe1-535a-4fcc-8d40-97fd3e84d093\\scratchpad\\debug_prompt_dump.txt";
const RAW_PROMPT = fs.readFileSync(CAPTURED_PROMPT_PATH, "utf-8");

const BUGGY_LINE = "FOLLOW-UP MODE: Continue seamlessly from the previous context. Do NOT redefine concepts, restart explanations, or repeat background information.";
const DIRECT_LINE = "DIRECT MODE: Answer immediately without rephrasing or repeating the question.";
if (!RAW_PROMPT.includes(BUGGY_LINE)) { console.error("marker not found"); process.exit(1); }
const BASELINE = RAW_PROMPT.replace(BUGGY_LINE, DIRECT_LINE);

// Round 1 (ablationMatrix.js) removed 8 different single blocks -- including the ENTIRE
// Decision Accountability reasoning sequence, taking the prompt down to 11,610 chars -- and
// EVERY variant still scored 0/5. That rules out "which block is longest" and "which block is
// most abstract" as the mechanism, because removing the most abstract block changed nothing.
// The one thing invariant across all 8 losing variants, and present in 100% of the ~13 raw
// answers inspected so far, is that they open with a near-verbatim copy of the literal example
// string given inside MANDATORY STRUCTURE: '"Sure, I'll walk through that from an
// implementation angle"'. That is evidence of EXAMPLE IMITATION, not instruction-following --
// the model is pattern-matching the literal demonstration string bundled inside the
// instruction, not generalizing the instruction's intent. This round tests that directly.
function must(text, marker, label) {
  if (!text.includes(marker)) throw new Error(`marker not found for ${label}: ${marker.slice(0, 60)}...`);
}
function removeBetween(text, startMarker, endMarker, label) {
  must(text, startMarker, `${label} start`);
  must(text, endMarker, `${label} end`);
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start);
  if (end === -1 || end <= start) throw new Error(`bad range for ${label}`);
  return text.slice(0, start) + text.slice(end);
}
function replaceOnce(text, target, replacement, label) {
  must(text, target, label);
  return text.replace(target, replacement);
}

const ablations = {};

// A: remove the entire MANDATORY STRUCTURE + banned-opener/closer paragraph, keep everything
// else (including the "Mention specific SAP components..." grounding line right after it).
ablations["remove_MANDATORY_STRUCTURE_BLOCK"] = removeBetween(
  BASELINE,
  "MANDATORY STRUCTURE (the person using this is under live interview pressure",
  "Mention specific SAP components as part of the decision",
  "MANDATORY STRUCTURE block"
);

// B: keep the structural instruction (anchor sentence, name 3-5 points, expand in order) but
// strip out the two literal quoted example strings the model appears to be copying verbatim,
// forcing it to generalize the instruction instead of pattern-matching the demonstration.
let stripped = BASELINE;
stripped = replaceOnce(
  stripped,
  `-- never the direct content yet, just a commitment to an angle ("Sure, I'll walk through that from an implementation angle").`,
  `-- never the direct content yet, just a commitment to an angle, phrased fresh each time, never reusing a stock opener.`,
  "anchor example"
);
stripped = replaceOnce(
  stripped,
  `-- "it comes down to whether you federate identity or run a separate store, and how you handle the encryption overhead," never a bare component list like "identity management, encryption, and monitoring."`,
  `-- phrased as real decisions specific to THIS question's actual content, never a bare component list.`,
  "3-5 points example"
);
ablations["strip_MANDATORY_STRUCTURE_EXAMPLES_ONLY"] = stripped;

// C: combine B with an explicit instruction to ground the named decision points in
// CANDIDATE BACKGROUND specifics when relevant -- testing whether closing the loop between
// "name 3-5 decisions" and "use real background" (currently two separate, unlinked
// instructions) is what's needed, not just removing the example.
ablations["strip_examples_PLUS_explicit_grounding_link"] = replaceOnce(
  stripped,
  `(3) Expand each named point in order, spoken-conversation language, so a speaker who loses their place can resume at the next point without the previous one's exact wording.`,
  `(3) Expand each named point in order, spoken-conversation language, so a speaker who loses their place can resume at the next point without the previous one's exact wording. If CANDIDATE BACKGROUND above contains real experience matching this question, at least one of the named points must be anchored in its actual scope or numbers, not left as an abstract category.`,
  "expand-in-order line"
);

async function runOnce(systemPrompt) {
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: QUESTION }
    ]
  });
  return res.choices[0].message.content;
}

function hitTest(answer) {
  return /11 countries|8,?700|45 systems|28 legal entities/i.test(answer);
}

async function runVariant(label, systemPrompt, n = 5) {
  const results = [];
  for (let i = 1; i <= n; i++) {
    const answer = await runOnce(systemPrompt);
    const hit = hitTest(answer);
    results.push({ run: i, hit, answer });
    console.log(`[${label}] Run ${i}: hit=${hit}`);
    console.log(`  ${answer.replace(/\n/g, " ").slice(0, 150)}...`);
  }
  const hitCount = results.filter(r => r.hit).length;
  console.log(`=== [${label}] size=${systemPrompt.length} chars | HIT RATE: ${hitCount}/${n} ===\n`);
  return { label, size: systemPrompt.length, hitCount, n, results };
}

(async () => {
  const matrix = [];
  matrix.push(await runVariant("BASELINE_fixed_direct_mode", BASELINE, 5));
  for (const [label, prompt] of Object.entries(ablations)) {
    matrix.push(await runVariant(label, prompt, 5));
  }

  fs.writeFileSync(
    path.join(__dirname, "results", "ablation_matrix_2.json"),
    JSON.stringify(matrix, null, 2),
    "utf-8"
  );

  console.log("\n=== ROUND 2 INFLUENCE MATRIX ===");
  console.log("label".padEnd(45), "size".padEnd(8), "hitRate");
  for (const row of matrix) {
    console.log(row.label.padEnd(45), String(row.size).padEnd(8), `${row.hitCount}/${row.n}`);
  }
})();
