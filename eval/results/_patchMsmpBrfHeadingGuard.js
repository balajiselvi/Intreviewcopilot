const fs = require("node:fs");
const path = require("node:path");

const file = path.join(__dirname, "../../lib/procedureRetention.js");
const lines = fs.readFileSync(file, "utf8").split("\n");

const boostIdx = lines.findIndex((line) => line.includes("/^configure\\b/i.test(String(heading"));
if (boostIdx < 0) throw new Error("configure heading boost not found");

lines[boostIdx] = [
  "  // Prefer a Configure-* procedure whose product focus matches the question.",
  "  // Do not let \"Configure a BRFplus agent rule for MSMP\" win a pure MSMP how-to.",
  "  if (/\\bhow (?:do|would|to)\\b.{0,48}\\bconfigur/i.test(normalizedQuestion) && /^configure\\b/i.test(String(heading || \"\").trim())) {",
  "    if (asksMsmp && !asksBrf && /\\bmsmp\\b/i.test(String(heading || \"\")) && !headingBrf) score += 40;",
  "    else if (asksBrf && headingBrf) score += 34;",
  "    else if (!asksMsmp && !asksBrf) score += 24;",
  "  }",
  "  if (asksMsmp && !asksBrf && headingBrf && headingAgentRule) score -= 45;"
].join("\n");

fs.writeFileSync(file, lines.join("\n"));
console.log("patched configure-heading guard at", boostIdx);
