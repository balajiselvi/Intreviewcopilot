const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const { OPENAI_API_KEY } = require("./lib/env");

const client = new OpenAI({ apiKey: OPENAI_API_KEY });
const QUESTION = "How would you design the authorization architecture for a multi-country S/4HANA rollout where each country has different regulatory requirements?";

const CAPTURED_PROMPT_PATH = "C:\\Users\\balaj\\AppData\\Local\\Temp\\claude\\C--Users-balaj-Downloads-interviewcopilot-main-interviewcopilot-main\\e013dbe1-535a-4fcc-8d40-97fd3e84d093\\scratchpad\\debug_prompt_dump.txt";
const RAW_PROMPT = fs.readFileSync(CAPTURED_PROMPT_PATH, "utf-8");

// Baseline for this ablation matrix uses the FOLLOW-UP-bug-corrected prompt (verified
// separately in verifyFollowUpBug.js -- that fix alone did NOT move hit rate, so it's held
// fixed here as the honest starting point, not reintroduced as a second confound).
const BUGGY_LINE = "FOLLOW-UP MODE: Continue seamlessly from the previous context. Do NOT redefine concepts, restart explanations, or repeat background information.";
const DIRECT_LINE = "DIRECT MODE: Answer immediately without rephrasing or repeating the question.";
if (!RAW_PROMPT.includes(BUGGY_LINE)) { console.error("marker not found"); process.exit(1); }
const BASELINE = RAW_PROMPT.replace(BUGGY_LINE, DIRECT_LINE);

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

// ---- Named ablations, each removing exactly ONE thing from BASELINE ----
const ablations = {};

ablations["remove_REASONING_TEMPLATE"] = removeBetween(
  BASELINE,
  "================ REASONING TEMPLATE ================",
  "================ INTERVIEWER CONTEXT ================",
  "REASONING TEMPLATE"
);

ablations["remove_INTERVIEWER_CONTEXT"] = removeBetween(
  BASELINE,
  "================ INTERVIEWER CONTEXT ================",
  "================ TECHNICAL REASONING ================",
  "INTERVIEWER CONTEXT"
);

ablations["remove_TECHNICAL_REASONING"] = removeBetween(
  BASELINE,
  "================ TECHNICAL REASONING ================",
  "================ DETERMINISTIC CONSTRAINTS ================",
  "TECHNICAL REASONING"
);

ablations["remove_DETERMINISTIC_CONSTRAINTS"] = removeBetween(
  BASELINE,
  "================ DETERMINISTIC CONSTRAINTS ================",
  "================ QUESTION ================",
  "DETERMINISTIC CONSTRAINTS"
);

ablations["remove_DECISION_ACCOUNTABILITY_REASONING"] = removeBetween(
  BASELINE,
  "BEFORE YOU ANSWER, reason through this once",
  "MANDATORY STRUCTURE",
  "DECISION ACCOUNTABILITY block"
);

ablations["remove_SIMULATE_BEFORE_CONSTRAINT_ONLY"] = removeBetween(
  BASELINE,
  "SIMULATE BEFORE YOU NAME A CONSTRAINT",
  "Decision, not feature:",
  "SIMULATE paragraph"
);

ablations["remove_DOMAIN_SPECIFIC_DEPTH"] = removeBetween(
  BASELINE,
  "DOMAIN-SPECIFIC TECHNICAL DEPTH:",
  "SPECIAL HANDLING FOR BEHAVIORAL QUESTIONS:",
  "DOMAIN-SPECIFIC DEPTH"
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
    results.push({ run: i, hit });
    console.log(`[${label}] Run ${i}: hit=${hit}`);
  }
  const hitCount = results.filter(r => r.hit).length;
  console.log(`=== [${label}] size=${systemPrompt.length} chars | HIT RATE: ${hitCount}/${n} ===\n`);
  return { label, size: systemPrompt.length, hitCount, n, sample: results };
}

(async () => {
  const matrix = [];

  matrix.push(await runVariant("BASELINE_fixed_direct_mode", BASELINE, 5));

  for (const [label, prompt] of Object.entries(ablations)) {
    matrix.push(await runVariant(label, prompt, 5));
  }

  fs.writeFileSync(
    path.join(__dirname, "results", "ablation_matrix.json"),
    JSON.stringify(matrix, null, 2),
    "utf-8"
  );

  console.log("\n=== INFLUENCE MATRIX ===");
  console.log("label".padEnd(40), "size".padEnd(8), "hitRate");
  for (const row of matrix) {
    console.log(row.label.padEnd(40), String(row.size).padEnd(8), `${row.hitCount}/${row.n}`);
  }
})();
