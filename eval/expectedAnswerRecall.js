const assert = require("assert");
const { recallExpectedAnswer } = require("./lib/expectedAnswers");

const hits = [
  ["Tell me about yourself.", "about-yourself"],
  ["What is the difference between SAP Security and SAP GRC?", "security-vs-grc"],
  ["We already have SAP Security. Why do we need GRC?", "security-vs-grc"],
  ["Explain the SAP GRC Access Control architecture.", "what-is-grc"],
  ["How would you design an SoD ruleset?", "sod-ruleset"],
  ["What is the difference between SoD and least privilege?", "sod-vs-least"],
  ["Explain ARA.", "ara"],
  ["Explain EAM / Firefighter.", "eam"],
  ["How is S/4HANA security different from ECC?", "s4-vs-ecc"],
  ["How would you integrate SAP with a SIEM?", "siem"],
  ["What is the difference between GRC and threat detection?", "grc-vs-detection"],
  ["IAS versus IPS?", "ias-ips"],
  ["A customer wants SAP_ALL.", "sap-all"]
];

const misses = [
  "What is PFCG?",
  "How do you design a derived role?",
  "Walk me through SU24 proposals.",
  "The vendor is late and hypercare needs to be compressed.",
  "How do you troubleshoot a blank Fiori tile?"
];

for (const [question, id] of hits) {
  const hit = recallExpectedAnswer(question);
  assert.ok(hit, "missed " + question);
  assert.strictEqual(hit.id, id, question + " -> " + hit.id);
}

for (const question of misses) {
  const hit = recallExpectedAnswer(question);
  assert.strictEqual(hit, null, "false hit " + question + " -> " + (hit && hit.id));
}

console.log("expectedAnswerRecall: PASS");
