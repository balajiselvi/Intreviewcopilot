const fs = require("fs");
const path = require("path");

// Minimal .env.local reader — no new dependency, mirrors how the app itself
// (Next.js) sources these values. Never logs or echoes key contents.
function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", "..", ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  const out = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    out[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return out;
}

const env = loadEnvLocal();

module.exports = {
  OPENAI_API_KEY: env.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  APP_BASE_URL: process.env.EVAL_APP_BASE_URL || "http://localhost:3000"
};
