import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const p = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "lib", "generationGuard.js");
let c = fs.readFileSync(p, "utf8");
const start = c.indexOf("function buildPrincipleLevelFallback(question) {");
if (start < 0) throw new Error("function not found");

let depth = 0;
let begun = false;
let i = start;
for (; i < c.length; i += 1) {
  const ch = c[i];
  if (ch === "{") {
    depth += 1;
    begun = true;
  } else if (ch === "}") {
    depth -= 1;
    if (begun && depth === 0) {
      i += 1;
      break;
    }
  }
}

const replacement = `function buildPrincipleLevelFallback(question) {
  // NUCLEAR: canned principle fallback DELETED.
  // Never emit "define the control at the correct identity…" or deployment-plane hedges.
  try {
    const { buildDirectTechnicalFallback } = require("./answerIntegrityGate.js");
    const direct = String(buildDirectTechnicalFallback(question) || "").trim();
    if (direct) return direct;
  } catch {
    // ignore
  }
  return "";
}`;

c = `${c.slice(0, start)}${replacement}${c.slice(i)}`;
fs.writeFileSync(p, c);

const after = fs.readFileSync(p, "utf8");
const still =
  after.includes("define the control at the correct identity")
  || after.includes("confirm the product and deployment plane");
if (still) {
  console.error("BANNED STRING STILL PRESENT");
  process.exit(1);
}
console.log("OK: principle fallback function replaced; banned strings gone");
