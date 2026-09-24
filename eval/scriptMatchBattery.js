/**
 * Prepared-script paraphrase and near-miss battery.
 * node eval/scriptMatchBattery.js
 */
const assert = require("assert");
const { resolvePreparedScript } = require("../lib/scriptMatch.js");

const PARAPHRASES = [
  ["Tell me about yourself.", "about-yourself"],
  ["Walk me through your profile.", "about-yourself"],
  ["Run us through your background.", "about-yourself"],
  ["Give us an overview of your career.", "about-yourself"],
  ["Tell us about your SAP security experience.", "about-yourself"],
  ["Tell us about your SAP GRC and presales background.", "about-yourself"],
  ["Give us a brief introduction and explain your presales exposure.", "about-yourself"],
  ["Run us through your profile and presales experience.", "about-yourself"],
  ["Balaji, can you run us through a profile and experience detail what all your word in terms of implementation and pre sales experience?", "about-yourself"],
  ["What draws you to a presales role?", "why-presales"],
  ["Why should we hire you?", "why-hire"],
  ["How does SAP security relate to GRC?", "security-vs-grc"],
  ["What separates least privilege from segregation of duties?", "sod-vs-least"],
  ["Tell me about your Dover experience.", "complex-grc"],
  ["How did hypercare go at Eminnov?", "eminov-hypercare"],
  ["What is the difference between SAP security and GRC?", "security-vs-grc"]
];

const NEAR_MISS = [
  { text: "Tell me about your GRC implementation experience.", not: "about-yourself" },
  { text: "Tell me about your Fabtech project.", id: null },
  { text: "What was your role?", id: null },
  { text: "Tell me about a presales situation.", not: "about-yourself" },
  { text: "How do you design a PFCG derived role?", not: "about-yourself" },
  { text: "Tell me about your Dover experience.", not: "eminov-hypercare" },
  { text: "What did you do at Eminnov?", not: "complex-grc" },
  { text: "What is a derived role?", not: "about-yourself" },
  { text: "Explain firefighter access at Fabtech.", id: null },
  { text: "How many users were on the Fabtech project?", not: "complex-grc" },
  { text: "What was the team size at Eminnov?", not: "complex-grc" }
];

let failed = 0;
for (const [text, id] of PARAPHRASES) {
  const match = resolvePreparedScript(text);
  if (match?.id !== id || !match.authoritative) {
    failed += 1;
    console.error("PARAPHRASE", text, "got", match?.id, "expected", id);
  }
}
for (const item of NEAR_MISS) {
  const match = resolvePreparedScript(item.text);
  if (Object.prototype.hasOwnProperty.call(item, "id") && (match?.id || null) !== item.id) {
    failed += 1;
    console.error("NEAR", item.text, "got", match?.id, "expected", item.id);
  }
  if (item.not && match?.id === item.not) {
    failed += 1;
    console.error("NEAR HIT", item.text, "incorrectly", item.not);
  }
}

assert.ok(PARAPHRASES.length >= 15);
assert.ok(NEAR_MISS.length >= 10);
assert.strictEqual(failed, 0, `${failed} script cases failed`);
console.log(`script match: paraphrases ${PARAPHRASES.length}, near-miss ${NEAR_MISS.length}`);
