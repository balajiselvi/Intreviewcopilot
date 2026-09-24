/**
 * Final script-match audit. Wrong script is a failure. No match is acceptable on a near miss.
 * node eval/freshScriptAudit.js
 */
const assert = require("assert");
const { resolvePreparedScript } = require("../lib/scriptMatch.js");

const POSITIVE = [
  ["Introduce yourself.", "about-yourself"],
  ["Give us your profile.", "about-yourself"],
  ["Can you walk us through your career?", "about-yourself"],
  ["Share a short introduction.", "about-yourself"],
  ["Tell us about your security experience.", "about-yourself"],
  ["Run us through your profile and presales experience.", "about-yourself"],
  ["Overview of your background, please.", "about-yourself"],
  ["What draws you toward presales?", "why-presales"],
  ["Why presales rather than delivery?", "why-presales"],
  ["Why hire you for this seat?", "why-hire"],
  ["How do you relate SAP security to GRC?", "security-vs-grc"],
  ["Security versus GRC, how do you separate them?", "security-vs-grc"],
  ["Separate least privilege from segregation of duties.", "sod-vs-least"],
  ["How does ECC authorization differ from S/4?", "s4-vs-ecc"],
  ["Talk through your Dover programme.", "complex-grc"],
  ["What did the Dover GRC work involve?", "complex-grc"],
  ["Describe hypercare at Eminnov.", "eminov-hypercare"],
  ["What happened in the Eminnov cutover?", "eminov-hypercare"],
  ["Why do you want this presales role?", "why-presales"],
  ["Walk me through your background and presales exposure.", "about-yourself"]
];

const NEAR = [
  { text: "Tell me about your GRC implementation experience.", not: "about-yourself" },
  { text: "What did you do at Fabtech?", id: null },
  { text: "Why should we hire you?", not: "about-yourself" },
  { text: "Tell me about your GRC implementation.", not: "about-yourself" },
  { text: "How many users were at Fabtech?", not: "complex-grc" },
  { text: "Was Eminnov a Middle East delivery?", not: "complex-grc" },
  { text: "Design a PFCG role for a buyer.", not: "about-yourself" },
  { text: "What is a mitigating control?", not: "about-yourself" },
  { text: "Explain firefighter access at Fabtech.", id: null },
  { text: "A presales situation you handled.", not: "about-yourself" },
  { text: "Compare two vendors on PAM.", not: "about-yourself" },
  { text: "Your role on the Fabtech rebuild.", not: "complex-grc" },
  { text: "How would you debug a blank Fiori tile?", not: "about-yourself" },
  { text: "What was the team size at Dover?", not: "eminov-hypercare" },
  { text: "Give an example of an SoD workshop.", not: "about-yourself" }
];

const misses = [];
for (const [text, id] of POSITIVE) {
  const match = resolvePreparedScript(text);
  if (match?.id !== id) misses.push(`POS ${text} => ${match?.id || "none"} wanted ${id}`);
}
for (const item of NEAR) {
  const match = resolvePreparedScript(item.text);
  if (item.id === null && match) misses.push(`NEAR ${item.text} => ${match.id}`);
  if (item.not && match?.id === item.not) misses.push(`NEAR ${item.text} hit ${item.not}`);
}
const about = resolvePreparedScript("Run us through your profile and presales experience.");
assert.strictEqual(about?.id, "about-yourself");
assert.ok(!/\b17\b/.test(about.answer));
assert.ok(POSITIVE.length >= 20 && NEAR.length >= 15);
if (misses.length) console.error(misses.join("\n"));
assert.strictEqual(misses.length, 0, `${misses.length} script audit misses`);
console.log(`fresh script audit: positive ${POSITIVE.length}, near ${NEAR.length}`);
