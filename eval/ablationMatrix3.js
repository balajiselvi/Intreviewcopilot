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

// Round 1: removed 8 individual blocks (incl. the entire Decision Accountability sequence,
// down to 11,610 chars) one at a time -- ALL 0/5.
// Round 2: removed/neutralized MANDATORY STRUCTURE specifically (the block whose literal
// example string "Sure, I'll walk through that..." appeared verbatim in ~100% of round-1
// answers) -- STILL 0/5, and removing it didn't even stop the generic-decision-category
// pattern, it just changed the generic pattern's wording.
// Conclusion so far: no SINGLE block is "the" competitor. This round tests the remaining
// hypothesis directly -- that suppression is a CUMULATIVE effect of total instruction density,
// not any one block -- by removing multiple blocks AT ONCE (explicitly departing from strict
// one-at-a-time ablation, which is now exhausted for the individually-tested blocks) and
// seeing whether the minimal prompt's 5/5 reproduces once enough is stripped simultaneously.
function must(text, marker, label) {
  if (!text.includes(marker)) throw new Error(`marker not found for ${label}: ${marker.slice(0, 60)}...`);
}
function slice(text, startMarker, endMarker, label) {
  must(text, startMarker, `${label} start`);
  must(text, endMarker, `${label} end`);
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start);
  if (end === -1 || end <= start) throw new Error(`bad range for ${label}`);
  return text.slice(start, end);
}

const candidateBackgroundBlock = slice(
  BASELINE,
  "================ CANDIDATE BACKGROUND & CONTEXT ================",
  "================ ROLE & RULES ================",
  "CANDIDATE BACKGROUND"
);

// Maximal-strip variant: CANDIDATE BACKGROUND (real, unmodified) + a short role framing that
// keeps ONLY the single "does background contain relevant experience" reasoning instruction +
// QUESTION + FINAL OUTPUT. Drops REASONING TEMPLATE, INTERVIEWER CONTEXT, TECHNICAL REASONING,
// DETERMINISTIC CONSTRAINTS, MANDATORY STRUCTURE, the banned-phrase RULES list, and SPECIAL
// HANDLING FOR BEHAVIORAL entirely -- everything except background + the one activation
// instruction + the question itself.
const MAXIMAL_STRIP = `${candidateBackgroundBlock}
================ ROLE ================
You are speaking live in an SAP Security technical interview. Target length: 140-220 words.

Before answering, first ask: does CANDIDATE BACKGROUND above contain genuine experience directly relevant to this question, even if it's phrased hypothetically ("how would you...")? If yes, anchor your answer in that real experience -- use its real numbers and scope by name. Only if it doesn't apply should you answer generically.

Answer the interview question naturally, in spoken language, under 220 words.

================ QUESTION ================
${QUESTION}

================ FINAL OUTPUT ================
Return ONLY the spoken interview response. Begin speaking immediately.`;

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
  matrix.push(await runVariant("BASELINE_full_15420", BASELINE, 5));
  matrix.push(await runVariant("MAXIMAL_STRIP_real_background_only", MAXIMAL_STRIP, 5));

  fs.writeFileSync(
    path.join(__dirname, "results", "ablation_matrix_3.json"),
    JSON.stringify(matrix, null, 2),
    "utf-8"
  );

  console.log("\n=== ROUND 3 (CUMULATIVE) RESULT ===");
  for (const row of matrix) {
    console.log(row.label.padEnd(40), `size=${row.size}`.padEnd(14), `${row.hitCount}/${row.n}`);
  }
})();
