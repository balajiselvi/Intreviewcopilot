/**
 * Meta-refusal recovery: never serve identifier-disclaimer templates as answers.
 * Offline — no provider calls.
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  isMetaRefusalText,
  buildPrincipleLevelFallback
} = require("../lib/generationGuard.js");
const { resolveSafeModeAnswer } = require("../lib/safeModeRouter.js");
const { buildPrincipleSpokenAnswer } = require("../lib/liveReliability.js");

const META = /I would answer this at principle level because|identifiers are not confirmed in supporting knowledge for this turn|while the live path recovers|for:\s*what are/i;

const questions = [
  "How do you configure an MSMP workflow?",
  "What are the 5 pillars of BTP?",
  "How to configure BRF+?",
  "What is the difference between IAS and IPS?"
];

for (const q of questions) {
  const safe = resolveSafeModeAnswer({ question: q, knowledgeText: "" });
  if (safe.served === false) {
    assert.strictEqual(safe.continueToGeneration, true, q);
    assert.ok(!safe.answer || !META.test(safe.answer), q);
  } else {
    assert.doesNotMatch(safe.answer, META, q);
  }
  assert.strictEqual(isMetaRefusalText(buildPrincipleLevelFallback(q)), false, `fallback meta? ${q}`);
  assert.doesNotMatch(buildPrincipleSpokenAnswer(q), META, `ladder meta? ${q}`);
}

const chat = fs.readFileSync(path.join(__dirname, "../pages/api/chat.js"), "utf8");
assert.match(chat, /continueToGeneration|GROUNDED_SAFE_ROUTES|isMetaRefusalText/);
assert.match(chat, /const maxTokens = 2048/);

const prompt = fs.readFileSync(path.join(__dirname, "../lib/prompt/interviewPrompt.js"), "utf8");
assert.match(
  prompt,
  /RETRIEVAL & GROUNDING|Thin RAG|without meta-refusals|principle level because|MANDATORY MECHANISM|FINAL TEST before speaking/i
);
assert.doesNotMatch(prompt, /answer at principle level — briefly and openly/);
assert.match(prompt, /Never invent T-codes|never invent speculative identifiers/i);

console.log(`metaRefusalRecoveryAssert: PASS (${questions.length} questions)`);
