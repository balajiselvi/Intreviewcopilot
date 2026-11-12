/**
 * 100-question soak against safe-mode resolver (offline, $0).
 */
const assert = require("assert");
const { resolveSafeModeAnswer } = require("../lib/safeModeRouter.js");
const { loadPack, DEFAULT_PROFILE_SLUG } = require("../lib/preparedAnswerPack.js");
const { looksIncompleteSpokenAnswer } = require("../lib/generationGuard.js");

const pack = loadPack(DEFAULT_PROFILE_SLUG);
const base = (pack.entries || []).map((e) => e.question);
while (base.length < 100) {
  base.push(`How would you approach SAP security governance topic ${base.length + 1}?`);
}
const questions = base.slice(0, 100);

const latencies = [];
let failures = 0;
const routes = {};

for (const question of questions) {
  const t0 = Date.now();
  const safe = resolveSafeModeAnswer({ question });
  const ms = Date.now() - t0;
  latencies.push(ms);
  routes[safe.route] = (routes[safe.route] || 0) + 1;
  // Only treat UI failure banners as soak defects — not the English word "failed" inside SAP answers.
  if (!safe.answer || looksIncompleteSpokenAnswer(safe.answer) || /\b(?:Failed to generate|Interrupted)\b/i.test(safe.answer)) {
    failures += 1;
  }
}

latencies.sort((a, b) => a - b);
const p50 = latencies[Math.floor(latencies.length * 0.5)];
const p95 = latencies[Math.floor(latencies.length * 0.95)];

assert.strictEqual(failures, 0, `soak failures=${failures}`);
assert.ok(p95 < 2000, `offline p95 too high: ${p95}`);

console.log(JSON.stringify({
  suite: "soakSafeMode100Assert",
  n: questions.length,
  failures,
  p50_ms: p50,
  p95_ms: p95,
  routes,
  status: "PASS"
}, null, 2));
