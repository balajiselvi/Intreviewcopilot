const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const appConfig = require("../config/appConfig");

// Execute the actual pure functions, injecting only their configuration import.
function load(file, name, config = appConfig) {
  const code = fs.readFileSync(path.join(__dirname, "..", "lib", "prompt", file), "utf8")
    .replace(/import appConfig[^;]+;/, "").replace(/export function /g, "function ");
  return new Function("appConfig", `${code}; return ${name};`)(config);
}
const score = load("scoring.js", "computeWeightedScore");
assert.equal(score({ technicalAccuracy: 10 }).overallScore, null);
assert.equal(score({ technicalAccuracy: 0 }).overallScore, null);
const configured = load("scoring.js", "computeWeightedScore", { evaluation: { weights: { a: 2, b: 1, missing: 3, bad: -1 } } });
assert.equal(configured({ a: 9, b: 3 }).overallScore, 7);
assert.equal(configured({}).overallScore, null);
assert.equal(configured({ a: NaN, b: Infinity }).overallScore, null);
const evaluate = load("evaluation.js", "evaluateAnswer");
const short = evaluate({ question: "What is SU53?", answer: "SU53 displays the last failed authorization check.", analysis: { category: "Definition" } });
assert.doesNotMatch(short.findings.join(" "), /too short|Business framing|Technical depth is weak/);
assert.equal(short.metrics.words, 7);
assert.equal(short.metrics.estimatedSpokenSeconds, 3);
const ownership = evaluate({ answer: "I implemented IAG at my previous client.", sapComponents: ["IAG"], candidateResume: "I have studied IAG." });
assert.match(ownership.findings.join(" "), /does not verify/);
const missingBackground = evaluate({ answer: "I implemented IAG at my previous client.", sapComponents: ["IAG"] });
assert.match(missingBackground.findings.join(" "), /possible fabricated experience/);
assert.equal(evaluate({}).metrics.words, 0);
console.log("practiceFeedbackAssert: PASS (scoring, short answers, delivery metrics, ownership controls)");
