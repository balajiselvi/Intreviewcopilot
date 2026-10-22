const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "interview-copilot-eval-"));
const runner = path.join(__dirname, "principalArchitectAnswerQualityBattery.js");
const node = process.execPath;

function run(args, env = {}) {
  return spawnSync(node, [runner, ...args], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, ...env },
    timeout: 30000
  });
}

try {
  const offlinePath = path.join(tempRoot, "offline.json");
  const offline = run(["--mode=offline", `--output=${offlinePath}`]);
  assert.equal(offline.status, 0, offline.stderr || offline.stdout);
  const offlineReport = JSON.parse(fs.readFileSync(offlinePath, "utf8"));
  assert.equal(offlineReport.mode, "offline");
  assert.equal(offlineReport.status, "passed");

  const finalizedPath = path.join(tempRoot, "finalized.json");
  const finalized = run(["--mode=offline", "--test-partial-output", `--output=${finalizedPath}`]);
  assert.equal(finalized.status, 0, finalized.stderr || finalized.stdout);
  const finalizedReport = JSON.parse(fs.readFileSync(finalizedPath, "utf8"));
  assert.equal(finalizedReport.status, "passed");
  assert.equal(finalizedReport.partial, undefined);

  const failurePath = path.join(tempRoot, "failure.json");
  const induced = run(["--mode=offline", "--test-failure", `--output=${failurePath}`]);
  assert.equal(induced.status, 1, induced.stderr || induced.stdout);
  assert.equal(JSON.parse(fs.readFileSync(failurePath, "utf8")).sourceContracts[0].name, "injected-regression-failure");

  const liveFailurePath = path.join(tempRoot, "live-failure.json");
  const liveFailure = run(["--mode=offline", "--test-live-failure", `--output=${liveFailurePath}`]);
  assert.equal(liveFailure.status, 1, liveFailure.stderr || liveFailure.stdout);
  const liveFailureReport = JSON.parse(fs.readFileSync(liveFailurePath, "utf8"));
  assert.equal(liveFailureReport.status, "failed");
  assert.equal(liveFailureReport.liveFailures[0].failureCategory, "injected-live-answer-quality-failure");

  const rescoreFailurePath = path.join(tempRoot, "rescore-failure.json");
  const capturedPath = path.join(tempRoot, "captured-failure.json");
  fs.writeFileSync(capturedPath, JSON.stringify({ liveRows: [{
    id: "IMP-10",
    answer: "- Define the authoritative source and stable entity identifier for each source-to-target path - Define transformation rules for each source-to-target combination - Install on-premise connector (if connecting to on-premise systems) - Test provisioning rules in non-prod (create sample users, verify correct accounts created in targets) - Configure notifications and integration with workflow systems"
  }] }));
  const rescoreFailure = run(["--mode=rescore", `--input=${capturedPath}`, `--output=${rescoreFailurePath}`]);
  assert.equal(rescoreFailure.status, 1, rescoreFailure.stderr || rescoreFailure.stdout);
  const rescoreFailureReport = JSON.parse(fs.readFileSync(rescoreFailurePath, "utf8"));
  assert.equal(rescoreFailureReport.status, "failed");
  assert.equal(rescoreFailureReport.answerSource, "saved-live-captures");

  const blockedPath = path.join(tempRoot, "blocked.json");
  const blocked = run(["--mode=live", `--output=${blockedPath}`], { EVAL_APP_BASE_URL: "http://127.0.0.1:1" });
  assert.equal(blocked.status, 2, blocked.stderr || blocked.stdout);
  const blockedReport = JSON.parse(fs.readFileSync(blockedPath, "utf8"));
  assert.equal(blockedReport.status, "blocked");
  assert.equal(blockedReport.live, false);
  assert.equal(blockedReport.counts.completed, 0);

  const protectedPath = path.join(tempRoot, "protected.json");
  const sentinel = "preserve-existing-report";
  fs.writeFileSync(protectedPath, sentinel);
  const protectedRun = run(["--mode=offline", `--output=${protectedPath}`]);
  assert.equal(protectedRun.status, 2);
  assert.equal(fs.readFileSync(protectedPath, "utf8"), sentinel);

  console.log("principalArchitectBatteryRunnerAssert: PASS");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
