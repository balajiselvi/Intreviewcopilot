/**
 * P1 — IAS / IPS plane separation: prepared comparison trim + routing hygiene.
 * Offline only (no paid LLM). Asserts turnDecision / prepared scripts / KB text.
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { decideInterviewTurn } = require("../lib/turnDecision.js");
const { resolvePreparedScript } = require("../lib/scriptMatch.js");
const { recallExpectedAnswer } = require("./lib/expectedAnswers.js");

const root = path.join(__dirname, "..");
const UNRELATED = /^(about-yourself|what-is-grc|grc-vs-detection|profile-parameters)$/i;
const OVER_APPEND = /\bCloud Connector\b|\bIAG\b|\brole collections?\b/i;

function turn(question) {
  return decideInterviewTurn({ question, history: [] });
}

function assertNotHijacked(selected, label) {
  assert.ok(!UNRELATED.test(String(selected.scriptId || "")), `${label} hijacked by ${selected.scriptId}`);
}

// 1) What is SAP IAS? — not IPS-comparison script; not unrelated hijack
{
  const q = "What is SAP IAS?";
  assert.notEqual(recallExpectedAnswer(q)?.id, "ias-ips", "1 recall must not be ias-ips");
  assert.notEqual(resolvePreparedScript(q)?.id, "ias-ips", "1 script must not be ias-ips");
  const selected = turn(q);
  assertNotHijacked(selected, "1");
  assert.notEqual(selected.scriptId, "ias-ips");
  assert.ok(
    selected.route === "GENERATION" || selected.route === "ANSWER_BANK",
    `1 unexpected route ${selected.route}/${selected.scriptId}`
  );
}

// 2) What is SAP IPS? — not IAS-only / comparison script as sole answer path
{
  const q = "What is SAP IPS?";
  assert.notEqual(recallExpectedAnswer(q)?.id, "ias-ips", "2 recall must not be ias-ips");
  assert.notEqual(resolvePreparedScript(q)?.id, "ias-ips", "2 script must not be ias-ips");
  const selected = turn(q);
  assertNotHijacked(selected, "2");
  assert.notEqual(selected.scriptId, "ias-ips");
  assert.ok(
    selected.route === "GENERATION" || selected.route === "ANSWER_BANK",
    `2 unexpected route ${selected.route}/${selected.scriptId}`
  );
}

// 3) Difference between IAS and IPS — prepared ias-ips, plane-pure, no over-append
{
  const q = "What is the difference between IAS and IPS?";
  const recalled = recallExpectedAnswer(q);
  assert.strictEqual(recalled?.id, "ias-ips", "3 recall");
  assert.doesNotMatch(String(recalled.answer || ""), OVER_APPEND, "3 recall over-append");
  assert.match(String(recalled.answer || ""), /authenticat/i);
  assert.match(String(recalled.answer || ""), /provision/i);
  assert.match(String(recalled.answer || ""), /SAML|OpenID|OIDC|MFA/i);
  assert.match(String(recalled.answer || ""), /transform|synchron/i);

  const selected = turn(q);
  assert.strictEqual(selected.route, "PREPARED_SCRIPT", `3 route ${selected.route}`);
  assert.strictEqual(selected.scriptId, "ias-ips", `3 scriptId ${selected.scriptId}`);
  assert.doesNotMatch(String(selected.scriptAnswer || ""), OVER_APPEND, "3 script over-append");
  assert.match(String(selected.scriptAnswer || ""), /IAS/i);
  assert.match(String(selected.scriptAnswer || ""), /IPS/i);
}

// 4) How do IAS and IPS work together? — not unrelated; complementary (generation or safe script)
{
  const q = "How do IAS and IPS work together?";
  const selected = turn(q);
  assertNotHijacked(selected, "4");
  // technicalTask+product gate typically forces GENERATION even if recall hits ias-ips
  assert.ok(
    selected.route === "GENERATION"
      || selected.route === "ANSWER_BANK"
      || (selected.route === "PREPARED_SCRIPT" && selected.scriptId === "ias-ips"),
    `4 unexpected ${selected.route}/${selected.scriptId}`
  );
  if (selected.scriptId === "ias-ips") {
    assert.doesNotMatch(String(selected.scriptAnswer || ""), OVER_APPEND, "4 script over-append");
  }
}

// 5) IPS provision from corporate directory — IPS plane; not IAS-only script; no AC/intro hijack
{
  const q = "How does IPS provision identities from a corporate directory into SAP cloud applications?";
  const selected = turn(q);
  assertNotHijacked(selected, "5");
  assert.notEqual(selected.scriptId, "ias-ips", "5 must not be difference-only script");
  assert.ok(
    selected.route === "GENERATION"
      || selected.route === "ANSWER_BANK"
      || (selected.route === "PREPARED_SCRIPT" && /ips|jml|provision/i.test(String(selected.scriptId || ""))),
    `5 unexpected ${selected.route}/${selected.scriptId}`
  );
}

// Live Markdown plane wording (source of truth for file-based asserts; index may lag)
{
  const ias = fs.readFileSync(path.join(root, "knowledge/btp/ias.md"), "utf8");
  assert.doesNotMatch(
    ias,
    /Unlike Cloud Identity \(which focuses on provisioning/i,
    "ias.md must not treat Cloud Identity as the IPS synonym in Overview"
  );
  assert.doesNotMatch(
    ias,
    /Cloud Identity brings user data from your corporate directory/i,
    "ias.md must not attribute directory sync to Cloud Identity instead of IPS"
  );
  assert.match(ias, /SAP Cloud Identity Services/i, "suite naming preserved");
  assert.match(ias, /\bIPS\b[\s\S]{0,80}provision/i, "IPS named for provisioning");
  assert.match(
    ias,
    /IPS source or target|source or target/i,
    "IAS may participate as IPS source/target"
  );
}

console.log("iasIpsPlaneAssert: PASS (A–E plane separation + ias.md terminology)");
