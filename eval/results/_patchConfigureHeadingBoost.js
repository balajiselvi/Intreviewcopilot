const fs = require("node:fs");
const path = require("node:path");

const file = path.join(__dirname, "../../lib/procedureRetention.js");
const lines = fs.readFileSync(file, "utf8").split("\n");
const idx = lines.findIndex((line) => line.includes("red flags|common interview|hidden expectations"));
if (idx < 0) throw new Error("wrapper demotion marker not found");

const already = lines.some((line) => line.includes("technical configuration sequence"));
if (already) {
  console.log("already patched");
  process.exit(0);
}

const insert = [
  "  if (/\\bhow (?:do|would|to)\\b.{0,48}\\bconfigur/i.test(normalizedQuestion) && /^configure\\b/i.test(String(heading || \"\").trim())) score += 34;",
  "  if (/\\bhow (?:do|would|to)\\b.{0,48}\\b(?:configur|troubleshoot)/i.test(normalizedQuestion) && /technical configuration sequence/i.test(headingText)) score -= 12;"
];

// Insert just before the wrapper-demotion `if (` line (idx-1 is the start of that if).
const ifLine = lines.findIndex((line, i) => i <= idx && i >= idx - 2 && line.trim().startsWith("if (/\\b(?:how (?:do|would|to)|configur|troubleshoot|integrat)"));
const at = ifLine >= 0 ? ifLine : idx - 1;
lines.splice(at, 0, ...insert);
fs.writeFileSync(file, lines.join("\n"));
console.log("inserted configure-heading boost at", at);
