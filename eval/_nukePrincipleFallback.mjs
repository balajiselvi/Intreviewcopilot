import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = path.join(ROOT, "lib", "generationGuard.js");
let c = fs.readFileSync(p, "utf8");

const start = c.indexOf("function buildPrincipleLevelFallback");
const end = c.indexOf("/**\n * Fix 2 — Safe empty-answer recovery decision", start);
if (start < 0 || end < 0) {
  // try CRLF marker
  const end2 = c.indexOf("Fix 2 — Safe empty-answer recovery decision", start);
  if (start < 0 || end2 < 0) {
    console.error("bounds", start, end, end2);
    process.exit(1);
  }
  const endLine = c.lastIndexOf("\n", end2);
  const replacement = `function buildPrincipleLevelFallback(question) {
  // NUCLEAR: canned principle fallback DELETED. Never emit the legacy
  // "define the control at the correct identity…" / deployment-plane hedge strings.
  // Prefer a known-contract direct technical answer; otherwise return empty so callers
  // keep the real LLM stream or surface a retry — never a recovered canned paragraph.
  try {
    const { buildDirectTechnicalFallback } = require("./answerIntegrityGate.js");
    const direct = String(buildDirectTechnicalFallback(question) || "").trim();
    if (direct) return direct;
  } catch {
    // ignore
  }
  return "";
}

`;
  // find start of comment before Fix 2
  const commentStart = c.lastIndexOf("/**", end2);
  c = c.slice(0, start) + replacement + c.slice(commentStart);
} else {
  const replacement = `function buildPrincipleLevelFallback(question) {
  // NUCLEAR: canned principle fallback DELETED. Never emit the legacy
  // "define the control at the correct identity…" / deployment-plane hedge strings.
  // Prefer a known-contract direct technical answer; otherwise return empty so callers
  // keep the real LLM stream or surface a retry — never a recovered canned paragraph.
  try {
    const { buildDirectTechnicalFallback } = require("./answerIntegrityGate.js");
    const direct = String(buildDirectTechnicalFallback(question) || "").trim();
    if (direct) return direct;
  } catch {
    // ignore
  }
  return "";
}

`;
  c = c.slice(0, start) + replacement + c.slice(end);
}

if (c.includes("define the control at the correct identity")) {
  console.error("STRING STILL PRESENT");
  process.exit(1);
}
if (c.includes("confirm the product and deployment plane")) {
  console.error("SECOND STRING STILL PRESENT");
  process.exit(1);
}

fs.writeFileSync(p, c);
console.log("generationGuard principle fallback nuked");
