const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const { OPENAI_API_KEY } = require("./lib/env");

const client = new OpenAI({ apiKey: OPENAI_API_KEY });
const QUESTION = "How would you design the authorization architecture for a multi-country S/4HANA rollout where each country has different regulatory requirements?";

// Single-variable ablation: the REAL captured production prompt (15,501 bytes, dumped via
// DEBUG_DUMP_PROMPT from an actual /api/chat call) is misclassified as a follow-up because
// isFollowUpUtterance() in pages/api/chat.js matches bare "how"/"why" as follow-up openers
// UNGATED by history.length -- so "How would you design..." on turn one, with zero history,
// still gets `normalized.startsWith("how ")` = true and is treated as a follow-up.
// Variant A = exactly what production actually sends (FOLLOW-UP MODE line, no retrieval).
// Variant B = identical prompt with ONLY that one line corrected to DIRECT MODE -- the
// classification a genuinely fresh first-turn question should receive.
const CAPTURED_PROMPT_PATH = "C:\\Users\\balaj\\AppData\\Local\\Temp\\claude\\C--Users-balaj-Downloads-interviewcopilot-main-interviewcopilot-main\\e013dbe1-535a-4fcc-8d40-97fd3e84d093\\scratchpad\\debug_prompt_dump.txt";
const FULL_PROMPT = fs.readFileSync(CAPTURED_PROMPT_PATH, "utf-8");

const BUGGY_FOLLOWUP_LINE = "FOLLOW-UP MODE: Continue seamlessly from the previous context. Do NOT redefine concepts, restart explanations, or repeat background information.";
const CORRECT_DIRECT_LINE = "DIRECT MODE: Answer immediately without rephrasing or repeating the question.";

if (!FULL_PROMPT.includes(BUGGY_FOLLOWUP_LINE)) {
  console.error("FATAL: expected follow-up line not found verbatim in captured prompt -- aborting rather than testing the wrong text.");
  process.exit(1);
}

const VARIANT_A_BUGGY = FULL_PROMPT; // exactly as production sent it
const VARIANT_B_FIXED = FULL_PROMPT.replace(BUGGY_FOLLOWUP_LINE, CORRECT_DIRECT_LINE);

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
    console.log(`  ${answer.replace(/\n/g, " ").slice(0, 180)}...`);
  }
  const hitCount = results.filter(r => r.hit).length;
  console.log(`=== [${label}] HIT RATE: ${hitCount}/${n} ===\n`);
  return { label, hitCount, n, results };
}

(async () => {
  console.log(`Prompt length: ${FULL_PROMPT.length} chars (identical for both variants except one line)\n`);

  const a = await runVariant("A_BUGGY_FOLLOWUP_MODE", VARIANT_A_BUGGY, 5);
  const b = await runVariant("B_FIXED_DIRECT_MODE", VARIANT_B_FIXED, 5);

  fs.writeFileSync(
    path.join(__dirname, "results", "verify_followup_bug.json"),
    JSON.stringify({ a, b }, null, 2),
    "utf-8"
  );

  console.log("=== SUMMARY ===");
  console.log(`Variant A (buggy, matches real production for this question): ${a.hitCount}/${a.n}`);
  console.log(`Variant B (single-line fix to DIRECT MODE):                   ${b.hitCount}/${b.n}`);
  console.log(b.hitCount > a.hitCount
    ? "CONFIRMS the follow-up misclassification (not prompt-block competition) as a real, isolated cause of suppressed experience activation."
    : "Does NOT confirm -- follow-up misclassification alone does not explain the gap; competition hypothesis remains live.");
})();
