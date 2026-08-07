const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const { OPENAI_API_KEY } = require("./lib/env");

const client = new OpenAI({ apiKey: OPENAI_API_KEY });
const QUESTION = "How would you design the authorization architecture for a multi-country S/4HANA rollout where each country has different regulatory requirements?";

// ablationMatrix5.js found: REASONING TEMPLATE alone (+266 bytes) breaks 5/5 -> 0/5. RULES
// alone also breaks it. DETERMINISTIC CONSTRAINTS (+601 bytes, more than double the size) does
// NOT break it. So this isn't cumulative density -- REASONING TEMPLATE and RULES are two small
// blocks that give the model an explicit competing recipe ("Structure: A -> B -> C -> D") or an
// explicit "don't invent specific metrics" caution, and NEITHER ONE mentions CANDIDATE
// BACKGROUND or grounding at all. The hypothesis: it's not that they're present, it's that
// they're silent on background -- so the model treats them as the operative recipe and never
// connects back to "use the real numbers." This tests the fix: same functional content, one
// explicit clause added tying each block back to background grounding.
const CAPTURED_PATH = "C:\\Users\\balaj\\AppData\\Local\\Temp\\claude\\C--Users-balaj-Downloads-interviewcopilot-main-interviewcopilot-main\\e013dbe1-535a-4fcc-8d40-97fd3e84d093\\scratchpad\\debug_prompt_verify_fix.txt";
const FULL = fs.readFileSync(CAPTURED_PATH, "utf-8");
function must(text, marker, label) { if (!text.includes(marker)) throw new Error(`missing ${label}`); }
function between(text, s, e, label) {
  must(text, s, `${label} start`); must(text, e, `${label} end`);
  const a = text.indexOf(s), b = text.indexOf(e, a);
  if (b <= a) throw new Error(`bad range ${label}`);
  return text.slice(a, b).trim();
}
const candidateBackground = between(FULL, "================ CANDIDATE BACKGROUND & CONTEXT ================", "================ ROLE & RULES ================", "background");
const rulesBlockOriginal = between(FULL, "RULES:\n- DIRECT MODE", "================ REASONING TEMPLATE ================", "rules");
const reasoningTemplateOriginal = between(FULL, "================ REASONING TEMPLATE ================", "================ INTERVIEWER CONTEXT ================", "reasoning template");

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
  return core.slice(0, idx) + additions.join("\n\n") + "\n\n" + core.slice(idx);
}

// Fix variant: REASONING TEMPLATE with one clause added, tying the structure back to
// background when it applies -- functional structure unchanged.
const reasoningTemplateFixed = reasoningTemplateOriginal +
  "\nIf CANDIDATE BACKGROUND above covers this scenario, at least one step in this structure must be grounded in its real scope or numbers, not left generic.";

// Fix variant: RULES with the anti-fabrication line clarified so "don't invent" doesn't read
// as "avoid specifics" -- explicitly distinguishing invented from real-and-permitted.
const rulesBlockFixed = rulesBlockOriginal.replace(
  "Never invent SAP objects, transactions, functionality, projects, clients, ownership, or specific incidents/metrics not present in CANDIDATE BACKGROUND below.",
  "Never invent SAP objects, transactions, functionality, projects, clients, ownership, or specific incidents/metrics not present in CANDIDATE BACKGROUND below -- but DO use real numbers and scope that ARE present in CANDIDATE BACKGROUND; citing them is not fabrication, it's the whole point."
);

const variants = {
  "reasoningTemplate_ORIGINAL_confirm": withAddition(section("REASONING TEMPLATE", reasoningTemplateOriginal)),
  "reasoningTemplate_FIXED_groundingClause": withAddition(section("REASONING TEMPLATE", reasoningTemplateFixed)),
  "rules_ORIGINAL_confirm": withAddition(section("RULES", rulesBlockOriginal)),
  "rules_FIXED_clarifiedAntiFab": withAddition(section("RULES", rulesBlockFixed)),
  "BOTH_fixed_together": withAddition(section("RULES", rulesBlockFixed), section("REASONING TEMPLATE", reasoningTemplateFixed)),
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
  fs.writeFileSync(path.join(__dirname, "results", "ablation_matrix_6_fix_test.json"), JSON.stringify(matrix, null, 2), "utf-8");
  console.log("\n=== FIX-TEST RESULT ===");
  for (const row of matrix) console.log(row.label.padEnd(42), `size=${row.size}`.padEnd(10), `${row.hitCount}/${row.n}`);
})();
