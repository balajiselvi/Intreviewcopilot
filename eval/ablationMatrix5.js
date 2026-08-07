const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const { OPENAI_API_KEY } = require("./lib/env");

const client = new OpenAI({ apiKey: OPENAI_API_KEY });
const QUESTION = "How would you design the authorization architecture for a multi-country S/4HANA rollout where each country has different regulatory requirements?";

// Checkpoint A in ablationMatrix4.js (5.5KB core + RULES + REASONING TEMPLATE +
// DETERMINISTIC CONSTRAINTS, 7,636 chars) already scored 0/5 -- a much tighter threshold than
// the 8-11KB target assumed going in. This subdivides that single checkpoint into its 3
// components, added ONE AT A TIME to the proven 5.5KB/5-of-5 core, to find which specific
// addition (or combination) is actually responsible before assuming any target prompt size.
const CAPTURED_PATH = "C:\\Users\\balaj\\AppData\\Local\\Temp\\claude\\C--Users-balaj-Downloads-interviewcopilot-main-interviewcopilot-main\\e013dbe1-535a-4fcc-8d40-97fd3e84d093\\scratchpad\\debug_prompt_verify_fix.txt";
const FULL = fs.readFileSync(CAPTURED_PATH, "utf-8");

function must(text, marker, label) { if (!text.includes(marker)) throw new Error(`missing ${label}: ${marker.slice(0,50)}`); }
function between(text, s, e, label) {
  must(text, s, `${label} start`); must(text, e, `${label} end`);
  const a = text.indexOf(s), b = text.indexOf(e, a);
  if (b <= a) throw new Error(`bad range ${label}`);
  return text.slice(a, b).trim();
}

const candidateBackground = between(FULL, "================ CANDIDATE BACKGROUND & CONTEXT ================", "================ ROLE & RULES ================", "background");
const rulesBlock = between(FULL, "RULES:\n- DIRECT MODE", "================ REASONING TEMPLATE ================", "rules");
const reasoningTemplate = between(FULL, "================ REASONING TEMPLATE ================", "================ INTERVIEWER CONTEXT ================", "reasoning template");
const deterministicConstraints = between(FULL, "================ DETERMINISTIC CONSTRAINTS ================", "================ QUESTION ================", "deterministic constraints");

const CORE_ROLE = `You are speaking live in an SAP Security technical interview. Target length for this question: 140-220 words.

Before answering, first ask: does CANDIDATE BACKGROUND above contain genuine experience directly relevant to this question, even if it's phrased hypothetically ("how would you..."). If yes, anchor your answer in that real experience -- use its real numbers and scope by name. Only if it doesn't apply should you answer generically.`;

function section(title, body) { return `================ ${title} ================\n${body}`; }

function buildCore() {
  return [
    section("CANDIDATE BACKGROUND & CONTEXT", candidateBackground),
    section("ROLE", CORE_ROLE),
    section("QUESTION", QUESTION),
    section("FINAL OUTPUT", "Return ONLY the spoken interview response. Begin speaking immediately.")
  ].join("\n\n");
}

function withAddition(...additions) {
  const core = buildCore();
  const marker = "================ QUESTION ================";
  const idx = core.indexOf(marker);
  const addedText = additions.join("\n\n") + "\n\n";
  return core.slice(0, idx) + addedText + core.slice(idx);
}

const variants = {
  "core_only_control": buildCore(),
  "core_+_RULES_only": withAddition(section("RULES", rulesBlock)),
  "core_+_REASONING_TEMPLATE_only": withAddition(section("REASONING TEMPLATE", reasoningTemplate)),
  "core_+_DETERMINISTIC_CONSTRAINTS_only": withAddition(section("DETERMINISTIC CONSTRAINTS", deterministicConstraints)),
};

async function runOnce(systemPrompt) {
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: QUESTION }]
  });
  return res.choices[0].message.content;
}
function hitTest(answer) { return /11 countries|8,?700|45 systems|28 legal entities/i.test(answer); }
async function runVariant(label, systemPrompt, n = 5) {
  const results = [];
  for (let i = 1; i <= n; i++) {
    const answer = await runOnce(systemPrompt);
    const hit = hitTest(answer);
    results.push({ run: i, hit, answer });
    console.log(`[${label}] Run ${i}: hit=${hit}`);
  }
  const hitCount = results.filter(r => r.hit).length;
  console.log(`=== [${label}] size=${systemPrompt.length} | HIT RATE: ${hitCount}/${n} ===\n`);
  return { label, size: systemPrompt.length, hitCount, n, results };
}

(async () => {
  const matrix = [];
  for (const [label, prompt] of Object.entries(variants)) {
    matrix.push(await runVariant(label, prompt, 5));
  }
  fs.writeFileSync(path.join(__dirname, "results", "ablation_matrix_5_subdivide.json"), JSON.stringify(matrix, null, 2), "utf-8");
  console.log("\n=== SUBDIVIDED CHECKPOINT A RESULT ===");
  for (const row of matrix) console.log(row.label.padEnd(40), `size=${row.size}`.padEnd(10), `${row.hitCount}/${row.n}`);
})();
