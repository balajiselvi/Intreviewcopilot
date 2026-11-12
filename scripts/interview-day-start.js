/**
 * Interview-day production starter: single listener, warmed index.
 * Usage: node scripts/interview-day-start.js
 * Env: PORT (default 3102), INTERVIEW_SAFE_MODE=1, INTERVIEW_PROFILE_SLUG=...
 */
const { spawn, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const PORT = String(process.env.PORT || "3102");
const ROOT = path.join(__dirname, "..");

function killPort(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr ":${port}" | findstr LISTENING`, { encoding: "utf8" });
      const pids = [...new Set((out.match(/\s(\d+)\s*$/gm) || []).map((s) => s.trim()))];
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
          console.log(`killed pid ${pid} on :${port}`);
        } catch {
          // ignore
        }
      }
    }
  } catch {
    console.log(`no listener on :${port}`);
  }
}

function main() {
  process.chdir(ROOT);
  process.env.NODE_ENV = "production";
  process.env.PORT = PORT;
  process.env.INTERVIEW_SAFE_MODE = process.env.INTERVIEW_SAFE_MODE || "1";
  process.env.INTERVIEW_PROFILE_SLUG =
    process.env.INTERVIEW_PROFILE_SLUG || "protiviti-senior-manager-sap-security-grc";

  // Prefer a single interview port; also clear common conflict port.
  killPort(PORT);
  if (PORT !== "3000") killPort("3000");

  if (!fs.existsSync(path.join(ROOT, ".next", "BUILD_ID"))) {
    console.log("running next build…");
    execSync("npx next build", { stdio: "inherit", env: process.env });
  }

  // Warm knowledge index into memory via a short node require.
  try {
    const { loadLiteChunks, resetKnowledgeCache } = require("../lib/liveReliability.js");
    resetKnowledgeCache();
    const n = loadLiteChunks().length;
    console.log(`warmed knowledge chunks: ${n}`);
  } catch (error) {
    console.warn("index warm failed:", error.message);
  }

  console.log(`starting next start on :${PORT} (safe mode ON)`);
  const child = spawn("npx", ["next", "start", "-p", PORT], {
    stdio: "inherit",
    env: process.env,
    shell: true
  });
  child.on("exit", (code) => process.exit(code || 0));
}

main();
