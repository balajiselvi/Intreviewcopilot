const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const { OPENAI_API_KEY } = require("./lib/env");
const { CANDIDATE_BACKGROUND } = require("./lib/candidateBackground");

const client = new OpenAI({ apiKey: OPENAI_API_KEY });
const QUESTION = "How would you design the authorization architecture for a multi-country S/4HANA rollout where each country has different regulatory requirements?";

// Test 1: MINIMAL prompt -- just role + real background + the explicit
// experience-activation instruction + question. Nothing else: no speakability rules, no
// banned-phrase lists, no domain-specific depth blocks, no deterministic constraints. If the
// hit rate is high here, prompt length/dilution (hypotheses A/B) is the real mechanism. If
// it's still low, the cause is something else (hypothesis C: reasoning competition --
// "methodology" framing wins before "I've done this" gets considered -- independent of length).
const MINIMAL_SYSTEM_PROMPT = `You are speaking live in an SAP Security technical interview.

CANDIDATE BACKGROUND (ground truth for anything phrased as personal experience): ${CANDIDATE_BACKGROUND}

Before answering, first ask: does CANDIDATE BACKGROUND above contain genuine experience directly relevant to this question, even if it's phrased hypothetically ("how would you...")? If yes, anchor your answer in that real experience -- use its real numbers and scope by name. Only if it doesn't apply should you answer generically.

Answer the interview question naturally, in spoken language, under 120 words.`;

async function runOnce() {
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    messages: [
      { role: "system", content: MINIMAL_SYSTEM_PROMPT },
      { role: "user", content: QUESTION }
    ]
  });
  return res.choices[0].message.content;
}

(async () => {
  console.log(`Minimal system prompt length: ${MINIMAL_SYSTEM_PROMPT.length} chars (vs ~20,000 in the full production prompt)\n`);
  const results = [];
  for (let i = 1; i <= 5; i++) {
    const answer = await runOnce();
    const hit = /11 countries|8,?700|45 systems|28 legal entities/i.test(answer);
    results.push({ run: i, hit, answer });
    console.log(`Run ${i}: hit=${hit}`);
    console.log(`  ${answer.replace(/\n/g, " ").slice(0, 200)}...`);
  }
  fs.writeFileSync(path.join(__dirname, "results", "isolate_experience_activation.json"), JSON.stringify(results, null, 2), "utf-8");
  const hitCount = results.filter(r => r.hit).length;
  console.log(`\n=== MINIMAL PROMPT HIT RATE: ${hitCount}/5 ===`);
  console.log(hitCount >= 3
    ? "HIGH hit rate in minimal prompt -> supports hypothesis A/B (length/salience dilution in the full prompt)."
    : "LOW hit rate even in minimal prompt -> length is NOT the primary cause; points to hypothesis C (reasoning/composition-order competition, independent of prompt size).");
})();
