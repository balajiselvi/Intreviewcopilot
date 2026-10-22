/**
 * Connector supplement matching + provenance regressions.
 * node eval/connectorBankAssert.js
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const {
  loadBank,
  matchAnswerBank,
  validateBankIntegrity,
  resetAnswerBankCacheForTests,
  SUPPLEMENT_JSON
} = require("../lib/answerBank.js");
const { decideInterviewTurn } = require("../lib/turnDecision.js");
const { resolvePreparedScript } = require("../lib/scriptMatch.js");
const { selectVerifiedWorkflow } = require("../lib/verifiedWorkflow.js");

resetAnswerBankCacheForTests();
const bank = loadBank();
const integrity = validateBankIntegrity(bank);
assert.equal(integrity.ok, true, integrity.errors.join("; "));
assert.equal(integrity.top100, 100);
assert.ok(integrity.supplement >= 10);
assert.ok(fs.existsSync(SUPPLEMENT_JSON));

const archive = JSON.parse(fs.readFileSync(
  "data/answer-bank/archive/original-pre-audit-2026-10-22/SAP_Security_GRC_Senior_Consultant_Top_100_QA.json",
  "utf8"
));
assert.equal(archive.questions.length, 100);

const expectExact = [
  ["What is a connector in SAP GRC Access Control?", "SAPSUP-001"],
  ["What is an SAP GRC connector?", "SAPSUP-001"],
  ["Explain source vs target connectors in GRC", "SAPSUP-002"],
  ["How do you configure and validate a connector in SAP GRC Access Control 10.x or 12.x?", "SAPSUP-003"],
  ["How do you configure and test an SAP GRC connector?", "SAPSUP-003"],
  ["How do I configure/test an SAP GRC connector?", "SAPSUP-003"],
  ["Which access does the GRC connector communication user need, and why must it be least-privileged?", "SAPSUP-004"],
  ["How do you distinguish connector connectivity failures from synchronization, risk-analysis and provisioning failures?", "SAPSUP-005"],
  ["How do you test a connector end to end after initial implementation or a GRC upgrade?", "SAPSUP-006"],
  ["How does GRC connector and provisioning architecture differ for direct ABAP provisioning versus SAP IDM or non-ABAP integration?", "SAPSUP-007"],
  ["What would you check if a connector test succeeds but user or role data or ARA results are incomplete?", "SAPSUP-008"],
  ["How would you plan connector and integration validation in an ECC-to-S/4HANA migration?", "SAPSUP-009"],
  ["What evidence would you retain for connector setup, sync correctness, provisioning and audit?", "SAPSUP-010"]
];

for (const [q, id] of expectExact) {
  const hit = matchAnswerBank(q);
  assert.equal(hit?.id, id, `bank match for ${q}`);
  const entry = bank.questions.find((row) => row.id === id);
  assert.equal(hit.answer, entry.answer, `verbatim answer ${id}`);
  const turn = decideInterviewTurn({ question: q, history: [] });
  assert.equal(turn.route, "ANSWER_BANK", `route for ${q}`);
  assert.equal(turn.scriptId, id);
  assert.equal(turn.scriptAnswer, entry.answer);
}

// Monitoring must not steal definition/configure.
assert.notEqual(matchAnswerBank("What is an SAP GRC connector?")?.id, "SAPSC-057");
assert.notEqual(matchAnswerBank("How do you configure and test an SAP GRC connector?")?.id, "SAPSC-057");
assert.notEqual(matchAnswerBank("How do you configure and test an SAP GRC connector?")?.id, "SAPSC-058");

// what-is-grc must not steal connector wording.
assert.notEqual(resolvePreparedScript("What is an SAP GRC connector?")?.id, "what-is-grc");
assert.equal(decideInterviewTurn({ question: "Tell me about yourself.", history: [] }).route, "PREPARED_SCRIPT");

// Product/task regressions remain outside connector pack.
assert.equal(matchAnswerBank("How do you configure IAG Access Analysis?")?.id || null, null);
assert.equal(selectVerifiedWorkflow("How do you configure IAG Access Analysis?")?.id, "iag-analysis-ruleset");
assert.equal(matchAnswerBank("How do you configure or maintain an SAP GRC ARA ruleset?")?.id, "SAPSC-032");
assert.equal(matchAnswerBank("Explain the end-to-end SAP GRC Access Request Management flow.")?.id, "SAPSC-041");
assert.equal(matchAnswerBank("How do you troubleshoot an access request stuck in MSMP?")?.id, "SAPSC-042");

// Unrelated "connector" meaning should not force a bank hit.
assert.equal(matchAnswerBank("What is an HDMI connector on a monitor?")?.id || null, null);

// Migration representatives still bank-match with improved answers.
for (const id of ["SAPSC-024", "SAPSC-084", "SAPSC-090"]) {
  const entry = bank.questions.find((row) => row.id === id);
  const hit = matchAnswerBank(entry.question);
  assert.equal(hit?.id, id);
  assert.match(hit.answer, /connector/i);
}

console.log(`connectorBankAssert: PASS (supplement ${integrity.supplement}, top100 ${integrity.top100})`);
