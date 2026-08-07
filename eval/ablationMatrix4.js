const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const { OPENAI_API_KEY } = require("./lib/env");

const client = new OpenAI({ apiKey: OPENAI_API_KEY });
const QUESTION = "How would you design the authorization architecture for a multi-country S/4HANA rollout where each country has different regulatory requirements?";

// Binary-search-style reintroduction, starting from the proven 5.5KB / 5/5 core
// (ablationMatrix3.js) and adding blocks back in priority order, checking at each waypoint
// instead of one at a time (8 individual re-adds x n=5 would be 40 calls; this narrows to 4
// checkpoints x n=5 = 20, then subdivides only around wherever the hit rate actually breaks).
// Text for each reintroduced block is pulled verbatim from a REAL captured production prompt
// (debug_prompt_verify_fix.txt, captured post-follow-up-fix so retrieval is genuinely active),
// not paraphrased -- so whatever survives this test is real production text, not a rewrite.
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
const rulesBlock = between(FULL, "RULES:\n- DIRECT MODE", "================ REASONING TEMPLATE ================", "rules").replace(/^RULES:\n/, "RULES:\n");
const reasoningTemplate = between(FULL, "================ REASONING TEMPLATE ================", "================ INTERVIEWER CONTEXT ================", "reasoning template");
const interviewerContextRaw = between(FULL, "================ INTERVIEWER CONTEXT ================", "================ TECHNICAL REASONING ================", "interviewer context");
const technicalReasoning = between(FULL, "================ TECHNICAL REASONING ================", "================ SUPPORTING KNOWLEDGE ================", "technical reasoning");
const supportingKnowledge = between(FULL, "================ SUPPORTING KNOWLEDGE ================", "================ DETERMINISTIC CONSTRAINTS ================", "supporting knowledge");
const deterministicConstraints = between(FULL, "================ DETERMINISTIC CONSTRAINTS ================", "================ QUESTION ================", "deterministic constraints");
const domainDepth = between(FULL, "DOMAIN-SPECIFIC TECHNICAL DEPTH:", "SPECIAL HANDLING FOR BEHAVIORAL QUESTIONS:", "domain depth");
const mandatoryStructureRaw = between(FULL, "MANDATORY STRUCTURE (the person using this is under live interview pressure", "Mention specific SAP components as part of the decision", "mandatory structure");

// Fix #2 found in passing: INTERVIEWER CONTEXT instructs "Open in the tone of 'From an
// enterprise perspective,' and close ... 'That's the architectural pattern'" -- both phrases
// are on the RULES banned-phrase list two sections earlier. Direct contradiction between two
// prompt sections. Reconciled here by dropping the open/close-tone directive and keeping the
// rest (role, expectation, depth, pacing/verbosity) -- not tested as a separate ablation
// variable since it's an unambiguous bug fix, not a hypothesis.
const interviewerContext = interviewerContextRaw.replace(/\s*Open in the tone of[^|]*?\.\s*/, " ");

// MANDATORY STRUCTURE with the two literal quoted examples stripped (round 2 found ~100% of
// answers were copying "Sure, I'll walk through that from an implementation angle" verbatim --
// example imitation, not instruction-following).
const mandatoryStructureNoExamples = mandatoryStructureRaw
  .replace(`("Sure, I'll walk through that from an implementation angle")`, "-- phrased fresh each time, never a stock opener")
  .replace(`-- "it comes down to whether you federate identity or run a separate store, and how you handle the encryption overhead," never a bare component list like "identity management, encryption, and monitoring."`,
           `-- phrased as real decisions specific to THIS question's content, never a bare component list.`);

const CORE_ROLE = `You are speaking live in an SAP Security technical interview. Target length for this question: 140-220 words.

Before answering, first ask: does CANDIDATE BACKGROUND above contain genuine experience directly relevant to this question, even if it's phrased hypothetically ("how would you..."). If yes, anchor your answer in that real experience -- use its real numbers and scope by name. Only if it doesn't apply should you answer generically.`;

function section(title, body) { return `================ ${title} ================\n${body}`; }

const CORE = [
  section("CANDIDATE BACKGROUND & CONTEXT", candidateBackground),
  section("ROLE", CORE_ROLE),
  section("QUESTION", QUESTION),
  section("FINAL OUTPUT", "Return ONLY the spoken interview response. Begin speaking immediately.")
].join("\n\n");

function insertBefore(prompt, marker, addition) {
  const idx = prompt.indexOf(marker);
  if (idx === -1) throw new Error(`insert marker not found: ${marker}`);
  return prompt.slice(0, idx) + addition + "\n\n" + prompt.slice(idx);
}

// Checkpoint A: core + RULES (anti-fabrication/banned-phrase) + REASONING TEMPLATE + DETERMINISTIC CONSTRAINTS
let A = insertBefore(CORE, "================ QUESTION ================",
  section("RULES", rulesBlock) + "\n\n" + section("REASONING TEMPLATE", reasoningTemplate) + "\n\n" + section("DETERMINISTIC CONSTRAINTS", deterministicConstraints));

// Checkpoint B: A + TECHNICAL REASONING + DOMAIN-SPECIFIC DEPTH
let B = insertBefore(A, "================ QUESTION ================",
  section("TECHNICAL REASONING", technicalReasoning) + "\n\n" + section("DOMAIN-SPECIFIC TECHNICAL DEPTH", domainDepth));

// Checkpoint C: B + INTERVIEWER CONTEXT (contradiction fixed) + SUPPORTING KNOWLEDGE (real retrieval)
let C = insertBefore(B, "================ QUESTION ================",
  section("INTERVIEWER CONTEXT", interviewerContext) + "\n\n" + section("SUPPORTING KNOWLEDGE", supportingKnowledge));

// Checkpoint D: C + MANDATORY STRUCTURE (examples stripped) -- the full feature set, minus the
// long Decision Accountability reasoning essay and SPECIAL HANDLING FOR BEHAVIORAL (not
// applicable to this Architecture-category question anyway).
let D = insertBefore(C, "================ QUESTION ================",
  section("MANDATORY STRUCTURE", mandatoryStructureNoExamples));

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
  matrix.push(await runVariant("Checkpoint_A_core+rules+template+constraints", A, 5));
  matrix.push(await runVariant("Checkpoint_B_+techreasoning+domaindepth", B, 5));
  matrix.push(await runVariant("Checkpoint_C_+interviewer+retrieval", C, 5));
  matrix.push(await runVariant("Checkpoint_D_+mandatorystructure_noexamples", D, 5));

  fs.writeFileSync(path.join(__dirname, "results", "ablation_matrix_4_reintroduction.json"), JSON.stringify(matrix, null, 2), "utf-8");

  console.log("\n=== BINARY-SEARCH REINTRODUCTION RESULT ===");
  for (const row of matrix) console.log(row.label.padEnd(48), `size=${row.size}`.padEnd(12), `${row.hitCount}/${row.n}`);
})();
