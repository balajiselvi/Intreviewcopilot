/**
 * Top-100 answer-bank integrity and intent-safe matching.
 * node eval/answerBankAssert.js
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { selectVerifiedWorkflow } = require("../lib/verifiedWorkflow.js");
const {
  BANK_JSON,
  loadBank,
  matchAnswerBank,
  validateBankIntegrity,
  normalizeText
} = require("../lib/answerBank.js");
const { decideInterviewTurn } = require("../lib/turnDecision.js");

const stagingJson = path.join(__dirname, "..", "_staging", "Top100AnswerBank", "SAP_Security_GRC_Senior_Consultant_Top_100_QA.json");
const bankMd = path.join(__dirname, "..", "data", "answer-bank", "SAP_Security_GRC_Senior_Consultant_Top_100_QA.md");

assert.ok(fs.existsSync(BANK_JSON), "runtime JSON missing");
assert.ok(fs.existsSync(bankMd), "runtime Markdown missing");
assert.ok(fs.existsSync(stagingJson), "staging JSON missing");

const staging = JSON.parse(fs.readFileSync(stagingJson, "utf8"));
const runtime = loadBank();
const integrity = validateBankIntegrity(runtime);
assert.equal(integrity.ok, true, integrity.errors.join("; "));
assert.equal(integrity.top100, 100);
assert.ok(integrity.supplement >= 10);
assert.equal(integrity.uniqueIds, integrity.count);
assert.equal(integrity.uniqueQuestions, integrity.count);

// Top-100 IDs remain stable; archive preserves pre-audit answers byte-for-byte.
const archive = JSON.parse(fs.readFileSync(
  path.join(__dirname, "..", "data", "answer-bank", "archive", "original-pre-audit-2026-10-22", "SAP_Security_GRC_Senior_Consultant_Top_100_QA.json"),
  "utf8"
));
assert.equal(archive.questions.length, 100);
assert.equal(staging.questions.length, 100);
const top100 = runtime.questions.filter((q) => /^SAPSC-/.test(q.id));
assert.equal(top100.length, 100);
for (let i = 0; i < 100; i += 1) {
  const left = staging.questions[i];
  const archived = archive.questions[i];
  const right = top100.find((q) => q.id === left.id);
  assert.ok(right, `missing ${left.id}`);
  assert.equal(archived.answer, left.answer, `archive drifted from staging for ${left.id}`);
  assert.equal(right.question, left.question, `question rewritten for ${left.id}`);
}

// Exact canonical match returns prepared answer and bank ID.
const first = runtime.questions[0];
const exact = matchAnswerBank(first.question);
assert.equal(exact?.id, first.id);
assert.equal(exact?.answer, first.answer);
assert.equal(exact?.via, "exact");

const punctuated = matchAnswerBank(`${first.question.replace(/\?$/, "")} ???`);
assert.equal(punctuated?.id, first.id);

// Approved alias / wording variant when product+task agree.
const ara = runtime.questions.find((q) => q.id === "SAPSC-032");
const aliasHit = matchAnswerBank("ARA ruleset maintenance");
assert.equal(aliasHit?.id, "SAPSC-032");
assert.equal(aliasHit?.answer, ara.answer);

const arm = runtime.questions.find((q) => q.id === "SAPSC-041");
const armExact = matchAnswerBank(arm.question);
assert.equal(armExact?.id, "SAPSC-041");
assert.equal(armExact?.answer, arm.answer);

// Near-match that asks a different task is rejected.
const armSetupAsTroubleshoot = matchAnswerBank("How do you troubleshoot the end-to-end SAP GRC Access Request Management flow?");
assert.notEqual(armSetupAsTroubleshoot?.id, "SAPSC-041");

// Cross-product / same-keyword mismatches rejected.
assert.equal(matchAnswerBank("How do you configure IAG Access Analysis?")?.id || null, null);
assert.equal(matchAnswerBank("How do you configure IAG Role Design?")?.id || null, null);
assert.equal(matchAnswerBank("How do you configure IAG Access Request?")?.id || null, null);
assert.equal(matchAnswerBank("How do you configure IAG Certification Review?")?.id || null, null);
assert.equal(matchAnswerBank("How do you configure IAG PAM?")?.id || null, null);
assert.notEqual(matchAnswerBank("How do you configure or maintain an SAP GRC ARA ruleset?")?.id, "SAPSC-041");
assert.notEqual(matchAnswerBank("Explain the end-to-end SAP GRC Access Request Management flow.")?.id, "SAPSC-032");
assert.notEqual(matchAnswerBank("How do you troubleshoot an access request stuck in MSMP?")?.id, "SAPSC-032");
assert.notEqual(matchAnswerBank("How do you troubleshoot an access request stuck in MSMP?")?.id, "SAPSC-041");

const publicPrivate = matchAnswerBank("How does SAP S/4HANA security differ between Private Edition/on-premises and Public Edition?");
assert.equal(publicPrivate?.id, "SAPSC-021");
assert.notEqual(
  matchAnswerBank("Walk me through PFCG role design for S/4HANA Public Edition only.")?.id,
  "SAPSC-011"
);

// Follow-up with changed task does not reuse a stale bank answer via weak overlap.
const followUp = matchAnswerBank("How do you troubleshoot that?", {
  priorBankId: "SAPSC-041",
  priorQuestion: arm.question
});
assert.notEqual(followUp?.id, "SAPSC-041");

// Unrelated question falls through (no bank hit).
assert.equal(matchAnswerBank("What is the capital of France?")?.id || null, null);
assert.equal(matchAnswerBank("How do you brew pour-over coffee?")?.id || null, null);

// Turn decision: bank exact hit uses ANSWER_BANK; CV scripts still win first.
const bankTurn = decideInterviewTurn({ question: first.question, history: [] });
assert.equal(bankTurn.route, "ANSWER_BANK");
assert.equal(bankTurn.scriptId, first.id);
assert.equal(bankTurn.scriptAnswer, first.answer);

const cvTurn = decideInterviewTurn({ question: "Tell me about yourself.", history: [] });
assert.equal(cvTurn.route, "PREPARED_SCRIPT");
assert.equal(cvTurn.scriptId, "about-yourself");

const generationTurn = decideInterviewTurn({
  question: "How do you configure IAG Access Analysis risk rules in Rule Setup?",
  history: []
});
assert.equal(generationTurn.route, "GENERATION");
assert.equal(generationTurn.scriptId, null);

// Existing regression examples remain correct on verified workflow / product boundary.
const regressions = [
  { q: "How do you configure IAG role design?", workflow: "iag-role-design", bank: null },
  { q: "How do you configure IAG Access Analysis?", workflow: "iag-analysis-ruleset", bank: null },
  { q: "How would you set up access requests in IAG?", workflow: "iag-workflow-determination", bank: null },
  { q: "How do you configure access certification in IAG?", workflow: "iag-certification-review", bank: null },
  { q: "How would you implement emergency or privileged access with IAG?", workflow: "iag-pam-setup", bank: null },
  { q: "Explain the end-to-end SAP GRC Access Request Management flow.", workflow: null, bank: "SAPSC-041" },
  { q: "How do you configure or maintain an SAP GRC ARA ruleset?", workflow: null, bank: "SAPSC-032" },
  { q: "How do you troubleshoot an access request stuck in MSMP?", workflow: null, bank: "SAPSC-042" },
  { q: "Walk me through PFCG role design. (classic ECC/S/4HANA private edition)", workflow: null, bank: "SAPSC-011" }
];

for (const item of regressions) {
  const bank = matchAnswerBank(item.q);
  assert.equal(bank?.id || null, item.bank, `bank for ${item.q}`);
  if (item.bank) {
    const turn = decideInterviewTurn({ question: item.q, history: [] });
    assert.equal(turn.route, "ANSWER_BANK");
    assert.equal(turn.scriptId, item.bank);
  } else {
    const workflow = selectVerifiedWorkflow(item.q);
    assert.equal(workflow?.id || null, item.workflow, `workflow for ${item.q}`);
    assert.equal(decideInterviewTurn({ question: item.q, history: [] }).route, "GENERATION");
  }
}

// Process Control must not steal Access Control ARM/ARA bank answers.
assert.notEqual(
  matchAnswerBank("How do you design and test a manual control in Process Control?")?.id,
  "SAPSC-041"
);
assert.notEqual(
  matchAnswerBank("How do you design and test a manual control in Process Control?")?.id,
  "SAPSC-032"
);

// Candidate-specific entries remain frameworks, not fabricated experience.
for (const id of ["SAPSC-098", "SAPSC-099"]) {
  const entry = runtime.questions.find((q) => q.id === id);
  assert.equal(entry.candidate_specific, true);
  const hit = matchAnswerBank(entry.question);
  assert.equal(hit?.id, id);
  assert.match(hit.answer, /I would|framework|CV|documented|STAR|not invent|not claim|methodology/i);
}

console.log(`answerBankAssert: PASS (100 records, exact/alias/reject/fallback/regression)`);
console.log(`bank path: ${BANK_JSON}`);
console.log(`normalized sample: ${normalizeText(first.question)}`);
