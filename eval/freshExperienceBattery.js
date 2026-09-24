/**
 * Fresh experience-scope battery.
 * node eval/freshExperienceBattery.js
 */
const assert = require("assert");
const { scopeCareerEvidence } = require("./lib/careerTimeline.js");

function scope(question, prior = "") {
  return scopeCareerEvidence(question, prior);
}

function line(text, name) {
  return text.split("\n").find((row) => row.includes(name)) || "";
}

const cases = [];

function named(question, id, present, absent) {
  cases.push(question);
  const result = scope(question);
  assert.strictEqual(result.mode, "programme", question);
  assert.strictEqual(result.programmeId, id, question);
  for (const pattern of present) assert.match(result.text, pattern, question);
  for (const pattern of absent) assert.doesNotMatch(result.text, pattern, question);
}

named("Describe the Fabtech engagement.", "fabtech", [/Dubai/, /2,000/, /10\.1/], [/8,700/, /15-month/, /team of 8/, /6,500/]);
named("How long did Fabtech run, and what was the team size?", "fabtech", [/duration in months/, /team size/], [/15-month/, /team of 8/, /8,700/]);
named("Which countries were on the Dover programme?", "dover", [/11 countries/, /individual country names/], [/Dubai/, /6,500/]);
named("What was the Dover user population?", "dover", [/8,700/], [/450 roles/, /Dubai/]);
named("Talk about the Eminnov conversion.", "eminnov", [/6,500/, /8-week/], [/Dubai/, /8,700/, /team of 8/]);
named("Did Eminnov include Middle East delivery?", "eminnov", [/regional delivery label/], [/Dubai/]);
named("What did WMS cover?", "wms", [/Middle East/], [/8,700/, /6,500/, /GRC AC 12/]);
named("Summarize the Enerlife work.", "enerlife", [/ECC roles/], [/8,700/, /Dubai/, /2,000 users/]);

function domain(question) {
  cases.push(question);
  const result = scope(question);
  assert.strictEqual(result.mode, "domain", question);
  const dover = line(result.text, "Dover");
  const fabtech = line(result.text, "Fabtech");
  const eminnov = line(result.text, "Eminnov");
  assert.ok(dover && fabtech && eminnov, question);
  assert.doesNotMatch(fabtech, /8,700|15-month|team of 8/, question);
  assert.doesNotMatch(eminnov, /Dubai|8,700/, question);
  assert.doesNotMatch(dover, /Dubai/, question);
  assert.doesNotMatch(result.text, /\bMMT\b/, question);
}

domain("What was your GRC experience?");
domain("How broad is your SoD background?");
domain("Where have you used Access Control?");
domain("Tell me about your firefighter experience.");
domain("What GRC modules have you actually delivered?");
domain("Describe your access-risk work.");
domain("Have you led ARA and ARM?");
domain("What is your experience with business role management?");

function metric(question) {
  cases.push(question);
  const result = scope(question);
  assert.strictEqual(result.mode, "methodology", question);
  assert.doesNotMatch(result.text, /8,700|6,500|2,000|15-month|team of 8|Dubai/, question);
}

metric("How many users were in scope?");
metric("How long was that programme?");
metric("What was the team size?");
metric("How many SoD rules did you write?");
metric("How many years of experience is that?");

function adversarial(question, mode, forbidden) {
  cases.push(question);
  const result = scope(question);
  assert.strictEqual(result.mode, mode, `${question} -> ${result.mode}`);
  for (const pattern of forbidden) assert.doesNotMatch(result.text, pattern, question);
}

adversarial("Put the Dover 15-month plan on the Fabtech story.", "multi", []);
adversarial("How many Dover users were at Fabtech?", "multi", []);
{
  cases.push("fabtech line in a dual question stays free of dover duration");
  const result = scope("How many Dover users were at Fabtech?");
  const fabtech = line(result.text, "Fabtech");
  if (fabtech) assert.doesNotMatch(fabtech, /15-month|team of 8/);
}
adversarial("What geography did the Eminnov conversion cover?", "programme", [/Dubai/]);

assert.ok(cases.length >= 25, `cases ${cases.length}`);
console.log(`fresh experience: ${cases.length} cases`);
