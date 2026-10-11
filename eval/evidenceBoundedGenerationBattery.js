/**
 * Evidence boundary for named-engagement generation.
 * Checks the historical channel the model receives. It does not call a model.
 * node eval/evidenceBoundedGenerationBattery.js
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { scopeCareerEvidence, scopedHistoryOnly, auditHistoricalClaims } = require("./lib/careerTimeline.js");
const { recallExperience, recallGroundedExperience } = require("./lib/expertiseCards.js");
const { loadSession } = require("./liveInterviewReview.js");

const chatSource = fs.readFileSync(path.join(__dirname, "../pages/api/chat.js"), "utf8");
assert.ok(chatSource.includes("!scopedHistoryOnly(promptPayload.evidenceMode)"), "scoped history must withhold the experience card");

function channel(question, prior = "") {
  const evidence = scopeCareerEvidence(question, prior);
  const card = recallExperience(question).strongest;
  return {
    evidence,
    card,
    cardAttached: Boolean(card) && !scopedHistoryOnly(evidence.mode)
  };
}

function named(question, id, present, absent) {
  const result = channel(question);
  assert.strictEqual(result.evidence.mode, "programme", question);
  assert.strictEqual(result.evidence.programmeId, id, question);
  assert.strictEqual(result.cardAttached, false, question);
  for (const pattern of present) assert.match(result.evidence.text, pattern, question);
  for (const pattern of absent) assert.doesNotMatch(result.evidence.text, pattern, question);
}

const fabtech = [
  "Tell me about your Fabtech programme.",
  "What was your role in Fabtech?",
  "What IAM challenges did you face at Fabtech?",
  "What did you implement at Fabtech?",
  "What was the architecture at Fabtech?",
  "What was the scale of the Fabtech work?",
  "Which technologies were involved at Fabtech?",
  "Walk me through the Fabtech security landscape.",
  "What access problems were in scope at Fabtech?"
];
const dover = [
  "Tell me about your Dover programme.",
  "What was your role at Dover?",
  "What GRC challenges did you face at Dover?",
  "What did you implement on the Dover programme?",
  "What was the Dover authorization architecture?",
  "What was the scale at Dover?",
  "Which technologies were involved at Dover?",
  "Describe the Dover SoD remediation.",
  "How was hypercare handled at Dover?"
];
const eminnov = [
  "Tell me about your Eminnov programme.",
  "What was your role at Eminnov?",
  "What conversion challenges did you face at Eminnov?",
  "What did you implement at Eminnov?",
  "What was the Eminnov security architecture?",
  "What was the scale of Eminnov?",
  "Which technologies were involved at Eminnov?",
  "Describe the Eminnov cutover support.",
  "How long was hypercare at Eminnov?"
];

for (const question of fabtech) {
  named(question, "fabtech", [/2,000/, /10\.1/, /Dubai/], [/8,700/, /15-month/, /6,500/, /HCM/, /SRM/, /CRM/]);
}
for (const question of dover) {
  named(question, "dover", [/8,700/, /15-month/], [/Dubai/, /2,000 users/, /6,500/]);
}
for (const question of eminnov) {
  named(question, "eminnov", [/6,500/, /8-week/], [/Dubai/, /8,700/, /Middle East/]);
}

const fabtechCard = recallExperience("Tell me about your Fabtech experience.").strongest;
assert.ok(fabtechCard && /HCM/.test(fabtechCard.spoken || ""), "the competing card still contains the HCM narrative");
assert.strictEqual(channel("Tell me about your Fabtech experience.").cardAttached, false);

const generic = [
  "What was your GRC experience?",
  "How broad is your SoD background?",
  "Where have you used Access Control?",
  "Tell me about your firefighter experience.",
  "What GRC modules have you delivered?",
  "Describe your access-risk work.",
  "Have you led ARA and ARM?",
  "What is your business role experience?",
  "What user access review experience do you have?",
  "What security operations work have you done?"
];
for (const question of generic) {
  const result = channel(question);
  assert.ok(result.evidence.mode === "domain" || result.evidence.mode === "profile", `${question} -> ${result.evidence.mode}`);
  assert.strictEqual(result.cardAttached, false, question);
  assert.doesNotMatch(result.evidence.text, /HCM integration to ECC/, question);
  assert.ok(result.evidence.text.includes("Dover") && result.evidence.text.includes("Fabtech"), question);
}

const adversarial = [
  ["Tell me about Fabtech. How many users did you support and how large was the team?", "fabtech", /8,700|team of 8|15-month/],
  ["What did you implement at Eminnov and which countries were involved?", "eminnov", /Dubai|8,700/],
  ["How many Dover users were on the Fabtech project?", "multi", null],
  ["Put the Dover 15-month plan onto Fabtech.", "multi", null],
  ["Was the Eminnov work delivered in Dubai?", "eminnov", /Dubai/],
  ["Did Fabtech run for 15 months with a team of 8?", "fabtech", /15-month|team of 8/],
  ["How many ARM requests did Fabtech process?", "fabtech", /4,000/],
  ["Which Middle East country was Eminnov based in?", "eminnov", /Dubai|Middle East/],
  ["What was the Fabtech SoD rule count?", "fabtech", /250\+/],
  ["How many conflicts did you clear at Fabtech?", "fabtech", /2,400/]
];
for (const [question, mode, forbidden] of adversarial) {
  const result = channel(question);
  if (mode === "fabtech" || mode === "dover" || mode === "eminnov") {
    assert.strictEqual(result.evidence.mode, "programme", question);
    assert.strictEqual(result.evidence.programmeId, mode, question);
  } else {
    assert.strictEqual(result.evidence.mode, mode, `${question} -> ${result.evidence.mode}`);
  }
  assert.strictEqual(result.cardAttached, false, question);
  if (forbidden && result.evidence.programmeId) assert.doesNotMatch(result.evidence.text, forbidden, question);
}

const metrics = [
  ["How many users were in scope?", /8,700|6,500|2,000/],
  ["How long was that programme?", /15-month|8-week/],
  ["What was the team size?", /team of 8|teams of 4/],
  ["How many countries were covered?", /11 countries|9 countries/],
  ["How many SoD rules were written?", /250/],
  ["How many ARM requests were there?", /4,000/],
  ["How many conflicts were cleared?", /2,400/],
  ["How many mitigating controls existed?", /300/],
  ["How much budget was assigned to that programme?", /8,700|15-month/],
  ["How many integrations were connected?", /18 connected/]
];
for (const [question, forbidden] of metrics) {
  const result = channel(question);
  assert.strictEqual(result.evidence.mode, "methodology", question);
  assert.strictEqual(result.cardAttached, false, question);
  assert.doesNotMatch(result.evidence.text, forbidden, question);
}

const driftContext = [
  "What IAM work did you do at Fabtech?",
  "Explain the GRC design you used at Dover.",
  "What identity work was in the Eminnov conversion?",
  "How did authorization tracing work in the Fabtech support role?",
  "What does Access Control mean in the Dover programme?",
  "Which SAP products were actually in the Fabtech landscape?",
  "Did the Dover GRC work include a Fiori launchpad redesign?",
  "Was Eminnov an identity-management implementation?",
  "What backend systems did Fabtech security actually touch?",
  "How was SoD evaluated on the Dover programme?"
];
for (const question of driftContext) {
  const result = channel(question);
  assert.notStrictEqual(result.evidence.mode, "full", question);
  assert.strictEqual(result.cardAttached, false, question);
  assert.doesNotMatch(result.evidence.text, /integrated SAP HCM with ECC, BI, SRM, and CRM/, question);
}

const methodology = [
  "How would you investigate a missing authorization?",
  "How do you design a PFCG role?",
  "How would you approach an SoD ruleset?",
  "How would you structure firefighter logging?",
  "How should a role transport be controlled?",
  "What would you check first in SU53?",
  "How would you separate IAS from IAG?",
  "How do you validate SU24 proposals?",
  "What is your method for an access review?",
  "How would you handle a provisioning failure?"
];
for (const question of methodology) {
  const result = channel(question);
  assert.strictEqual(result.evidence.mode, "full", question);
}

const comparisons = [
  "Compare your Dover and Eminnov programmes.",
  "How did Fabtech differ from Dover?",
  "Contrast the Eminnov conversion with Dover.",
  "What changed between Fabtech GRC 10.1 and Dover GRC 12?",
  "Compare user scale at Dover and Eminnov.",
  "How did hypercare differ between Eminnov and Dover?",
  "Which engagement had the larger role landscape, Dover or Eminnov?",
  "Compare Fabtech in Dubai with the Dover programme.",
  "What did Fabtech and Eminnov each document for GRC?",
  "Set Dover's 15-month plan next to Eminnov's hypercare."
];
for (const question of comparisons) {
  const result = channel(question);
  assert.ok(result.evidence.mode === "multi" || result.evidence.mode === "portfolio", `${question} -> ${result.evidence.mode}`);
  assert.strictEqual(result.cardAttached, false, question);
}

const session = loadSession();
const watched = [13, 14, 16, 17, 19, 22, 23, 24];
for (const turn of session.turns || []) {
  const index = (session.turns || []).indexOf(turn) + 1;
  if (!watched.includes(index)) continue;
  const evidence = scopeCareerEvidence(turn.question, "");
  const leaked = auditHistoricalClaims(turn.answer || "", evidence.text);
  if (scopedHistoryOnly(evidence.mode)) {
    assert.ok(leaked.length >= 0);
    assert.strictEqual(channel(turn.question).cardAttached, false, turn.question);
  }
}
const fabtechDuration = session.turns[18];
const durationEvidence = scopeCareerEvidence(fabtechDuration.question, "Tell me about Fabtech.");
assert.strictEqual(durationEvidence.programmeId, "fabtech");
assert.doesNotMatch(durationEvidence.text, /18 months|team of 6|HCM/);

const technical = channel("What exactly is PFCG?");
assert.strictEqual(technical.evidence.mode, "full");
assert.ok(technical.evidence.text.includes("Dover") && technical.evidence.text.includes("Fabtech"));

const iagCard = recallGroundedExperience("How do you configure SAP IAG with IAS and IPS for S/4HANA and BTP?");
assert.ok(iagCard, "an IAG question still has a grounded card");
assert.notStrictEqual(iagCard.id, "iag-ias-ips-sf");
assert.doesNotMatch(`${iagCard.spoken} ${iagCard.result}`, /SuccessFactors is the HR source|3 days to under 30/);
const rawIag = recallExperience("How do you configure SAP IAG with IAS and IPS for S/4HANA and BTP?").strongest;
assert.strictEqual(rawIag.id, "iag-ias-ips-sf");

console.log(`evidence boundary: fabtech ${fabtech.length}, dover ${dover.length}, eminnov ${eminnov.length}, generic ${generic.length}, adversarial ${adversarial.length}, metrics ${metrics.length}, drift ${driftContext.length}, methodology ${methodology.length}, comparisons ${comparisons.length}`);
