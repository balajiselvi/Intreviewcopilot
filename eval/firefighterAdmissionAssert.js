/**
 * Exact Firefighter admission inputs — must ANSWER, not reject as elliptical chatter.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { admitQuestion, DECISIONS } = require("../lib/questionAdmission.js");
const { questionProcedureIntent } = require("../lib/procedureRetention.js");

const OUT = path.join(__dirname, "results", "_acceptance", "firefighter-admission.json");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const CASES = [
  "What if Firefighter Logs are Not Generated?",
  "Why are Firefighter logs not generated?",
  "Firefighter logs are missing — how do you troubleshoot?",
  "What do you check when EAM firefighter session logs are not created?"
];

const report = { cases: [], pass: true };

for (const q of CASES) {
  const admitted = admitQuestion(q, { priorQuestion: "" });
  const intent = questionProcedureIntent(q, "");
  const ok = admitted.decision === DECISIONS.ANSWER || admitted.decision === "ANSWER";
  const intentOk = intent === "troubleshoot";
  const row = {
    question: q,
    decision: admitted.decision,
    reason: admitted.reason || admitted.via || null,
    procedureIntent: intent,
    admitOk: ok,
    intentOk
  };
  report.cases.push(row);
  if (!ok || !intentOk) report.pass = false;
  console.log(`${ok && intentOk ? "PASS" : "FAIL"}`, JSON.stringify(row));
}

fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log(`firefighterAdmission: ${report.pass ? "PASS" : "FAIL"} → ${OUT}`);
assert.equal(report.pass, true);
