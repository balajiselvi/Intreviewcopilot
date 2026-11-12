const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "../../lib/turnDecision.js");
let s = fs.readFileSync(file, "utf8");
if (!s.includes("TCODE_VERIFICATION_RULE")) {
  console.error("TCODE_VERIFICATION_RULE missing from file");
  process.exit(1);
}
s = s.replace(
  /module\.exports\s*=\s*\{\s*decideInterviewTurn\s*\};/,
  "module.exports = { decideInterviewTurn, TCODE_VERIFICATION_RULE };"
);
fs.writeFileSync(file, s);
console.log("export patched", /TCODE_VERIFICATION_RULE\s*\}/.test(s) || s.includes("decideInterviewTurn, TCODE_VERIFICATION_RULE"));
