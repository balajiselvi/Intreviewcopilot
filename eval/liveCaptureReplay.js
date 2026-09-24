/**
 * Replay the 23 Sep 60-turn capture through the gate.
 * Counts are derived. 39 is not an expected constant.
 * node eval/liveCaptureReplay.js
 */
const assert = require("assert");
const { loadSession, reviewSession, summarize } = require("./liveInterviewReview.js");

const rows = reviewSession(loadSession());
const summary = summarize(rows);
const { answer, ignore, defer } = summary.disposition;
const withheld = ignore + defer;
const scopeTotal = Object.values(summary.evidenceScope).reduce((sum, count) => sum + count, 0);

assert.strictEqual(summary.turns, 60);
assert.strictEqual(answer + ignore + defer, 60);
assert.strictEqual(summary.answerRoute.preparedScript + summary.answerRoute.normalGeneration, answer);
assert.strictEqual(scopeTotal, answer, "every answered turn has one evidence scope");
assert.ok(withheld > answer, "most captured turns should not generate");
assert.ok(ignore >= 10, "clear non-questions should be ignored");
assert.ok(defer >= 8, "fragments should be deferred");
assert.strictEqual(summary.answeredInCapture, 60, "the capture itself answered every turn");
assert.strictEqual(summary.currentReproduction.stillInPreparedScript, 0);
assert.strictEqual(summary.currentReproduction.claimStillInEvidence, 0);

const intro = rows.find((row) => row.turn === 13);
assert.strictEqual(intro.gate, "ANSWER");
assert.strictEqual(intro.scriptId, "about-yourself");
assert.ok(intro.unsupportedClaims.some((claim) => claim.includes("17")));

const greeting = rows.find((row) => row.turn === 1);
assert.strictEqual(greeting.gate, "IGNORE");

const thanks = rows.find((row) => row.turn === 60);
assert.notStrictEqual(thanks.gate, "ANSWER");

const fabtechDuration = rows.find((row) => row.turn === 19);
assert.strictEqual(fabtechDuration.gate, "ANSWER");
assert.strictEqual(fabtechDuration.programmeId, "fabtech");
assert.ok(fabtechDuration.unsupportedClaims.some((claim) => claim.startsWith("months:")));
assert.ok(fabtechDuration.unsupportedClaims.some((claim) => claim.startsWith("team:")));

const repeated = rows.find((row) => row.turn === 58);
assert.strictEqual(repeated.gate, "IGNORE");

const generated = rows.filter((row) => row.gate !== "ANSWER" && row.route !== "NONE");
assert.strictEqual(generated.length, 0, "non-answers must not enter generation");

console.log(JSON.stringify(summary, null, 2));
console.log(`replay disposition answer ${answer}, ignore ${ignore}, defer ${defer}; routes ${summary.answerRoute.preparedScript}+${summary.answerRoute.normalGeneration}`);
