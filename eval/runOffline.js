const { spawnSync } = require("node:child_process");
const path = require("node:path");

// Explicit offline allowlist: no provider calls, browser credentials, or index rebuilds.
const scripts = [
  "chatStreamAssert.js", "providerStreamAssert.js", "practiceFeedbackAssert.js", "generationGuardAssert.js",
  "liveSessionOperatorAssert.js", "speechSessionGuardAssert.js", "speechTurnDetectorAssert.js",
  "retrievalScoreAssert.js",
  "productBoundaryAssert.js",
  "iagInterviewAccuracyBattery.js",
  "procedureRetentionAssert.js",
  "knowledgeContentGuardAssert.js",
  "contextInheritanceAssert.js", "convergenceRoutingAssert.js", "freshAdmissionBattery.js",
  "experienceGroundingBattery.js", "deferredContinuationBattery.js", "responseModeCollisionMatrix.js",
  "phase5ContractAssert.js"
];
let failed = 0;
for (const script of scripts) {
  const result = spawnSync(process.execPath, [path.join(__dirname, script)], {
    cwd: path.join(__dirname, ".."), encoding: "utf8", timeout: 30000
  });
  const ok = result.status === 0 && !result.error;
  console.log(`${ok ? "PASS" : "FAIL"} ${script}`);
  if (!ok) {
    failed++;
    console.error(result.error?.message || ((result.stdout || "") + (result.stderr || "")).slice(-2500));
  }
}
console.log(`\n${scripts.length - failed}/${scripts.length} offline suites passed. Generated answer quality and live latency require a separate provider evaluation.`);
process.exitCode = failed ? 1 : 0;
