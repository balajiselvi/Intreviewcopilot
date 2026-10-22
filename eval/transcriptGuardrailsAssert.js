/**
 * Layers 1–3 guardrail probes.
 * node eval/transcriptGuardrailsAssert.js
 */
const assert = require("assert");
const {
  isNoiseOnly,
  normalizePhonetics,
  reconstructIncompleteAsk,
  prepareLiveTranscript,
  IGNORE_NOISE_TOKEN
} = require("../lib/transcriptGuardrails.js");
const { decideInterviewTurn } = require("../lib/turnDecision.js");

assert.strictEqual(isNoiseOnly("okay"), true);
assert.strictEqual(isNoiseOnly("go ahead"), true);
assert.strictEqual(isNoiseOnly("can you hear me?"), true);
assert.strictEqual(isNoiseOnly("next question"), true);
assert.strictEqual(isNoiseOnly("How do you configure MSMP?"), false);

assert.match(normalizePhonetics("how do you fix splitation of duties"), /Segregation of Duties \(SoD\)/i);
assert.match(normalizePhonetics("configure fee-ori launchpad roles"), /SAP Fiori/i);
assert.match(normalizePhonetics("open m-s-m-p workflow"), /MSMP Workflow/i);
assert.match(normalizePhonetics("check su twenty four proposals"), /SU24/i);
assert.match(normalizePhonetics("run st-auth-trace"), /STAUTHTRACE/i);
assert.match(normalizePhonetics("use x-s-u-a-a scopes"), /XSUAA/i);

const reconstructed = reconstructIncompleteAsk(
  "handle customer-maintained modifications in SU24 proposals without widening Production roles"
);
assert.match(reconstructed, /^How do you handle customer-maintained modifications in SU24/i);

const noise = prepareLiveTranscript("hmm");
assert.strictEqual(noise.ignoreNoise, true);
assert.strictEqual(noise.ignoreToken, IGNORE_NOISE_TOKEN);

const noiseTurn = decideInterviewTurn({ question: "okay okay" });
assert.strictEqual(noiseTurn.decision, "IGNORE");
assert.strictEqual(noiseTurn.reason, "ignore-noise");
assert.strictEqual(noiseTurn.scriptAnswer, IGNORE_NOISE_TOKEN);

const repairedTurn = decideInterviewTurn({
  question: "handle customer-maintained modifications in SU24 proposals for derived roles"
});
assert.strictEqual(repairedTurn.decision, "ANSWER");
assert.match(String(repairedTurn.normalizedQuestion || ""), /How do you handle/i);
assert.match(String(repairedTurn.normalizedQuestion || ""), /SU24/);

console.log(JSON.stringify({
  ok: true,
  noiseToken: IGNORE_NOISE_TOKEN,
  repairedQuestion: repairedTurn.normalizedQuestion
}, null, 2));
