const fs = require("node:fs");

const promptPath = "lib/prompt/interviewPrompt.js";
let prompt = fs.readFileSync(promptPath, "utf8");
const replacements = [
  [
    "MANDATORY ANSWER SHAPE — use exactly these three Markdown headings for every generated technical answer, in this order and spelling: “### 1. Direct Answer”, “### 2. Technical Mechanism and Exact Artifacts”, and “### 3. Validation and Operational Boundary”. Put the answer text under each heading; do not use inline-label substitutes. The Direct Answer section must resolve the interviewer’s question in 1–2 sentences.",
    "SPOKEN ANSWER — speak one continuous answer the candidate can say aloud. Do not use Markdown headings, and do not label parts Direct Answer, Technical Mechanism, Validation and Operational Boundary, Key Takeaways, or Conclusion. Open with the decision or the first check, then the relevant steps and how you would prove the result. Prefer about 60 to 120 words for an ordinary question, fewer when it is simple, and more only when the procedure needs the extra steps. Do not repeat the question."
  ],
  [
    "The mechanism section names Discover, Prepare, Explore, Realize, Deploy, and Run, then the workplan, critical path, RAID or dependency register, accountable owners, change-control record, and quality gates inside those phases.",
    "Name Discover, Prepare, Explore, Realize, Deploy, and Run, then the workplan, critical path, RAID or dependency register, accountable owners, change-control record, and quality gates inside those phases."
  ],
  [
    "The mechanism section names the project-delivery artifacts and controls that carry the decision: the integrated workplan, critical path, RAID or dependency register, accountable owners, change-control record, and quality gates. Do not fill that section with SAP transactions, tables, or authorization tools.",
    "Name the project-delivery artifacts and controls that carry the decision: the integrated workplan, critical path, RAID or dependency register, accountable owners, change-control record, and quality gates. Do not fill the answer with SAP transactions, tables, or authorization tools."
  ],
  [
    "The mechanism section must name only the relevant verified",
    "The spoken answer must name only the relevant verified"
  ],
  [
    "The final section states the boundary of the mechanism:",
    "State the boundary of the mechanism:"
  ],
  [
    "The final section must state concrete verification evidence",
    "State concrete verification evidence"
  ],
  [
    "state only profile-supported facts in Direct Answer; describe the relevant technical method in the second section and evidence or limits in the third.",
    "state only profile-supported facts in the opening; then describe the relevant technical method and the evidence or limits in the same spoken answer."
  ],
  [
    "6. Confirm the answer contains exactly the three required headings in order: Direct answer; Technical mechanism and exact artifacts; Validation and operational boundary. Keep the content speakable and avoid extra headings or markdown.",
    "6. Confirm the answer is continuous spoken English. Do not use Markdown headings or the labels Direct Answer, Technical Mechanism, Validation and Operational Boundary, Key Takeaways, or Conclusion."
  ],
  [
    "Place it under the three required headings.",
    "Speak it as continuous interview prose."
  ],
  [
    "Keep the three headings. Section 2 names the integrated workplan, critical path, RAID or dependency register, accountable owners, change-control record, and quality gates.",
    "Name the integrated workplan, critical path, RAID or dependency register, accountable owners, change-control record, and quality gates in the spoken answer."
  ],
  [
    "Return one coherent spoken interview answer using exactly these three Markdown headings in this order: \"### 1. Direct Answer\", \"### 2. Technical Mechanism and Exact Artifacts\", and \"### 3. Validation and Operational Boundary\". Put each section's content on the following line. Do not replace these with inline labels or add other headings. Keep the first section to 1–2 direct sentences, then give only question-relevant mechanism and validation details. Follow the word preference already given; do not truncate reasoning to hit a count or pad the answer.",
    "Return one coherent spoken interview answer. Do not use Markdown headings. Speak the decision, the relevant steps, and the proof in natural sentences. Follow the word preference already given; do not truncate an essential step to hit a count or pad the answer."
  ]
];
for (const [from, to] of replacements) {
  const count = prompt.split(from).length - 1;
  if (count !== 1) throw new Error(`expected 1 occurrence, found ${count}: ${from.slice(0, 80)}`);
  prompt = prompt.replace(from, to);
}
if (prompt.includes("### 1. Direct Answer")) throw new Error("heading instruction remains in the prompt");
fs.writeFileSync(promptPath, prompt);

const batteryPath = "eval/principalArchitectAnswerQualityBattery.js";
let battery = fs.readFileSync(batteryPath, "utf8");
battery = battery.replace(
  /const headings = \["### 1\. Direct Answer", "### 2\. Technical Mechanism and Exact Artifacts", "### 3\. Validation and Operational Boundary"\];\r?\n  if \(family !== "experience" && headings\.some\(\(heading\) => !a\.includes\(heading\)\)\) \{\r?\n    push\("answer contract", "prompt synthesis", "technical answer omitted a required heading"\);\r?\n  \}/,
  `if (/^#{1,6}\\s+|\\b(?:direct answer|technical mechanism and exact artifacts|validation and operational boundary|key takeaways)\\b/i.test(a)) {
    push("answer contract", "prompt synthesis", "spoken answer used a report heading");
  }`
);
battery = battery.replace(/^\s*"### [123]\. (?:Direct Answer|Technical Mechanism and Exact Artifacts|Validation and Operational Boundary)",\r?\n/gm, "");
fs.writeFileSync(batteryPath, battery);
console.log("prompt and battery updated");
