/**
 * Scenario Challenges supplement matching + provenance regressions.
 * node eval/scenarioBankAssert.js
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const {
  loadBank,
  matchAnswerBank,
  validateBankIntegrity,
  resetAnswerBankCacheForTests,
  SCENARIO_JSON,
  inferQuestionTaskFamily
} = require("../lib/answerBank.js");
const { decideInterviewTurn } = require("../lib/turnDecision.js");
const { selectVerifiedWorkflow } = require("../lib/verifiedWorkflow.js");

resetAnswerBankCacheForTests();
const bank = loadBank();
const integrity = validateBankIntegrity(bank);
assert.equal(integrity.ok, true, integrity.errors.join("; "));
assert.equal(integrity.top100, 100);
assert.equal(integrity.connector, 10);
assert.equal(integrity.scenario, 22);
assert.ok(fs.existsSync(SCENARIO_JSON));
assert.ok(fs.existsSync("data/answer-bank/SAP_Security_GRC_Scenario_Challenges_Supplement.md"));

const scenarioPack = JSON.parse(fs.readFileSync(SCENARIO_JSON, "utf8"));
assert.equal(scenarioPack.questions.length, 22);
assert.equal(scenarioPack.pack_id, "SAPSCN-SCENARIO");

for (const entry of scenarioPack.questions) {
  assert.match(entry.id, /^SAPSCN-\d{3}$/);
  assert.equal(entry.task, "scenario");
  assert.ok(entry.answer && entry.answer.length > 80, `thin answer ${entry.id}`);
  assert.ok(entry.star?.situation && entry.star?.task && entry.star?.actions && entry.star?.result, `STAR ${entry.id}`);
  assert.ok(Array.isArray(entry.technical_verification) && entry.technical_verification.length >= 2);
  assert.ok(Array.isArray(entry.lessons_learned) && entry.lessons_learned.length >= 1);
  assert.ok(Array.isArray(entry.follow_ups) && entry.follow_ups.length >= 1);
  assert.ok(["adaptable_model", "cv_anchored_framework"].includes(entry.experience_label), entry.id);
  assert.ok(Array.isArray(entry.replace_with_personal) && entry.replace_with_personal.length >= 1, entry.id);
  assert.match(
    entry.answer,
    /[Rr]eplace|Insert your|[Pp]rovide your|[Dd]o not invent|when you tell it|personal|your (?:real|verified|actual|engagement|career|risk|stakeholder|workpapers)/
  );
}

const adaptable = scenarioPack.questions.filter((q) => q.experience_label === "adaptable_model");
const anchored = scenarioPack.questions.filter((q) => q.experience_label === "cv_anchored_framework");
assert.equal(adaptable.length, 14);
assert.equal(anchored.length, 8);

const expectExact = [
  [
    "Tell me about a time critical production access failed after a role or transport change. How did you restore service without creating a permanent over-grant?",
    "SAPSCN-001"
  ],
  ["Tell me about a difficult GRC issue you resolved", "SAPSCN-001"],
  ["Tell me about a challenging GRC production incident", "SAPSCN-001"],
  [
    "Describe a situation where GRC ARA showed a large SoD conflict count and the business pushed back on remediation. What did you do?",
    "SAPSCN-002"
  ],
  ["Walk me through a real production ARM provisioning failure", "SAPSCN-004"],
  ["How did you handle an MSMP request with no approver", "SAPSCN-005"],
  [
    "Tell me about a GRC connector that passed a connectivity test but still produced incomplete ARA or sync results.",
    "SAPSCN-007"
  ],
  ["GRC connector registration gap story", "SAPSCN-007"],
  ["Describe a difficult stakeholder situation in SAP Security", "SAPSCN-021"],
  [
    "What is the most important lesson you have learned from a hard SAP Security or GRC delivery, and how did it change how you work?",
    "SAPSCN-022"
  ]
];

const behaviouralParaphrases = new Set([
  "Tell me about a difficult GRC issue you resolved",
  "Tell me about a challenging GRC production incident",
  "How did you handle an MSMP request with no approver",
  "Describe a difficult stakeholder situation in SAP Security",
  "Walk me through a real production ARM provisioning failure"
]);

for (const [q, id] of expectExact) {
  if (behaviouralParaphrases.has(q)) {
    assert.equal(inferQuestionTaskFamily(q), "scenario", `task family for ${q}`);
  }
  const hit = matchAnswerBank(q);
  assert.equal(hit?.id, id, `bank match for ${q}`);
  assert.equal(hit?.pack_id, "scenario-supplement", `pack for ${q}`);
  const entry = bank.questions.find((row) => row.id === id);
  assert.equal(hit.answer, entry.answer, `verbatim answer ${id}`);
  assert.ok(hit.experience_label, `experience_label ${id}`);
  const turn = decideInterviewTurn({ question: q, history: [] });
  assert.equal(turn.route, "ANSWER_BANK", `route for ${q}`);
  assert.equal(turn.scriptId, id);
  assert.equal(turn.scriptAnswer, entry.answer);
}

// Concept / configure / diagnose must not be stolen by scenario pack.
assert.equal(matchAnswerBank("What is a connector in SAP GRC Access Control?")?.id, "SAPSUP-001");
assert.equal(matchAnswerBank("How do you configure and test an SAP GRC connector?")?.id, "SAPSUP-003");
assert.equal(matchAnswerBank("How do you troubleshoot an access request stuck in MSMP?")?.id, "SAPSC-042");
assert.equal(matchAnswerBank("Explain the end-to-end SAP GRC Access Request Management flow.")?.id, "SAPSC-041");
assert.equal(matchAnswerBank("How do you configure or maintain an SAP GRC ARA ruleset?")?.id, "SAPSC-032");

// Behavioural wording must not fall through to a concept definition.
assert.notEqual(matchAnswerBank("Tell me about a difficult GRC issue you resolved")?.id, "SAPSUP-001");
assert.notEqual(matchAnswerBank("Tell me about a difficult GRC issue you resolved")?.task, "concept");

// Unrelated / cross-domain must not force a scenario hit.
assert.equal(matchAnswerBank("What is an HDMI connector on a monitor?")?.id || null, null);
assert.equal(matchAnswerBank("How do you configure IAG Access Analysis?")?.id || null, null);
assert.equal(selectVerifiedWorkflow("How do you configure IAG Access Analysis?")?.id, "iag-analysis-ruleset");

// Top-100 and connector packs remain loaded unchanged.
assert.equal(bank.questions.filter((q) => /^SAPSC-/.test(q.id)).length, 100);
assert.equal(bank.questions.filter((q) => /^SAPSUP-/.test(q.id)).length, 10);
assert.equal(bank.questions.filter((q) => /^SAPSCN-/.test(q.id)).length, 22);

console.log(
  `scenarioBankAssert: PASS (scenario ${integrity.scenario}, connector ${integrity.connector}, top100 ${integrity.top100})`
);
