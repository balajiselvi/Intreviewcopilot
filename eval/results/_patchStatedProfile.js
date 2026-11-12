const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "../lib/careerTimeline.js");
let s = fs.readFileSync(file, "utf8");
const start = s.indexOf("const DEFAULT_STATED_PROFILE = `");
const end = s.indexOf("`;\nconst STATED_PROFILE");
if (start < 0 || end < 0) {
  console.error("markers not found", { start, end });
  process.exit(1);
}
const next = `${s.slice(0, start)}const DEFAULT_STATED_PROFILE = \`Candidate posture: Senior Principal SAP Security, GRC & Cloud IAM Architect with 12+ years enterprise field depth, PMP, and ITIL V4 Foundation. Speak with absolute confidence and uncompromising technical depth — battle-tested go-live and hypercare judgment, not textbook summaries.
Use candidate-specific facts only when they are supplied in the current interview profile or CV. Technical knowledge is not evidence of personal experience. Do not deny an explicitly supplied candidate fact because a CV summary is incomplete. Do not invent employers, project names, metrics, budgets, or outcomes.
Process Control honesty: if asked about SAP GRC Process Control, state frankly that depth is Access Control; Process Control knowledge is basic/conceptual only — do not invent a PC delivery story.\`;
${s.slice(end + 2)}`;
fs.writeFileSync(file, next);
console.log("patched DEFAULT_STATED_PROFILE");
