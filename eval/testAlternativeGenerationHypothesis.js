const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const { OPENAI_API_KEY } = require("./lib/env");
const { CANDIDATE_BACKGROUND } = require("./lib/candidateBackground");

const client = new OpenAI({ apiKey: OPENAI_API_KEY });
const QUESTION = "How would you design an SoD remediation process and Emergency Access Management framework for a client with a large, complex SAP landscape?";

// Phase 5 experiment for the alternative-generation hypothesis (see chat transcript /
// LEVERAGING_BENCHMARK_2026-08-07.md for phases 1-4). Production's ROLE & RULES ALREADY
// contains "What's at least one realistic alternative? Why this approach over that
// alternative?" -- buried as one clause inside a long paragraph, alongside ~6 other reasoning
// questions. Across ~30 GRC generations this session (original benchmark, enrichment test,
// post-fix retest), ZERO ever named a rejected alternative. This experiment changes exactly
// ONE variable: isolating the SAME instruction as a first-class, standalone step the model
// must complete and SHOW before writing the rest of the answer -- not new content, not a
// stronger claim, just structural isolation from the competing paragraph. Measures ONE
// outcome: does a concrete, named rejected alternative appear in the output.

const CONTROL_PROMPT = `You are speaking live in an SAP Security technical interview. Target length: 140-220 words.

CANDIDATE BACKGROUND (ground truth for anything phrased as personal experience): ${CANDIDATE_BACKGROUND}

Before answering, reason through this: What problem is actually being solved? What constraint shapes it? What's at least one realistic alternative? Why this approach over that alternative? What responsibility does this decision create in production? What could go wrong? Could you defend this to another architect?

Answer the interview question naturally, in spoken language, under 220 words. Do not expose the reasoning questions themselves in the answer.`;

const TREATMENT_PROMPT = `You are speaking live in an SAP Security technical interview. Target length: 140-220 words.

CANDIDATE BACKGROUND (ground truth for anything phrased as personal experience): ${CANDIDATE_BACKGROUND}

MANDATORY FIRST STEP -- complete this before drafting any part of your answer: name ONE specific, realistic alternative approach to this problem that you are NOT going to recommend, and one concrete reason you're rejecting it. This alternative must be a real competing approach (a different tool, a different sequence, a different governance model) -- not a straw man. You do not need to show this step's rehearsal, but the alternative and your reason for rejecting it MUST appear explicitly in your spoken answer.

THEN answer the interview question naturally, in spoken language, under 220 words, incorporating the rejected alternative as part of your reasoning.`;

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

// Deliberately NOT a keyword regex (past false negatives from regex-based detection in this
// project) -- flags for manual read-verification instead: does the answer contain rejection
// language ("instead of", "rather than", "rejected", "considered... but", "chose X over Y")
// AND name a second concrete approach alongside the recommended one.
function flagsForReview(answer) {
  return /instead of|rather than|reject|considered .*but|chose .* over|opted .* over|in favor of/i.test(answer);
}

async function runVariant(label, systemPrompt, n = 10) {
  const results = [];
  for (let i = 1; i <= n; i++) {
    const answer = await runOnce(systemPrompt);
    const flagged = flagsForReview(answer);
    results.push({ run: i, flagged, answer });
    console.log(`[${label}] Run ${i}: rejection-language flagged=${flagged}`);
  }
  return results;
}

(async () => {
  console.log("=== CONTROL (existing production wording, buried instruction) ===");
  const control = await runVariant("CONTROL", CONTROL_PROMPT, 10);

  console.log("\n=== TREATMENT (same instruction, isolated as mandatory first step) ===");
  const treatment = await runVariant("TREATMENT", TREATMENT_PROMPT, 10);

  fs.writeFileSync(
    path.join(__dirname, "results", "alternative_generation_experiment.json"),
    JSON.stringify({ control, treatment }, null, 2),
    "utf-8"
  );

  const controlFlagged = control.filter(r => r.flagged).length;
  const treatmentFlagged = treatment.filter(r => r.flagged).length;
  console.log(`\n=== RESULT (flagged for manual review, NOT the final verified count) ===`);
  console.log(`Control: ${controlFlagged}/10 flagged`);
  console.log(`Treatment: ${treatmentFlagged}/10 flagged`);
  console.log("\nNEXT: manually read every flagged (and a sample of unflagged) answer to confirm a REAL named alternative was rejected, not just rejection-adjacent phrasing.");
})();
