/**
 * P0 — Process Control must not be answered by the Access Control what-is-grc script.
 */
const assert = require("assert");
const { decideInterviewTurn } = require("../lib/turnDecision.js");
const { resolvePreparedScript } = require("../lib/scriptMatch.js");
const { recallExpectedAnswer } = require("./lib/expectedAnswers.js");
const { selectVerifiedWorkflow } = require("../lib/verifiedWorkflow.js");

function turn(question) {
  return decideInterviewTurn({ question, history: [] });
}

const AC_OPENER = /^I explain SAP GRC Access Control/i;

// A) Explain PC implementation — must not select what-is-grc
{
  const q = "Explain an SAP GRC Process Control implementation.";
  assert.notEqual(recallExpectedAnswer(q)?.id, "what-is-grc", "A recall");
  assert.notEqual(resolvePreparedScript(q)?.id, "what-is-grc", "A script");
  const selected = turn(q);
  assert.notEqual(selected.scriptId, "what-is-grc", `A scriptId ${selected.scriptId}`);
  assert.doesNotMatch(String(selected.scriptAnswer || ""), AC_OPENER);
  assert.ok(
    selected.route === "GENERATION" || selected.route === "ANSWER_BANK"
      || (selected.route === "PREPARED_SCRIPT" && selected.scriptId !== "what-is-grc"),
    `A unexpected ${selected.route}/${selected.scriptId}`
  );
}

// B) Implement PC — must not serve Access Control content
{
  const q = "How do you implement SAP GRC Process Control?";
  const selected = turn(q);
  assert.notEqual(selected.scriptId, "what-is-grc");
  assert.doesNotMatch(String(selected.scriptAnswer || ""), AC_OPENER);
}

// C) Access Control implementation — preserve what-is-grc
{
  const q = "Explain SAP GRC Access Control implementation.";
  assert.strictEqual(recallExpectedAnswer(q)?.id, "what-is-grc");
  const selected = turn(q);
  assert.strictEqual(selected.route, "PREPARED_SCRIPT");
  assert.strictEqual(selected.scriptId, "what-is-grc");
  assert.match(String(selected.scriptAnswer || ""), AC_OPENER);
}

// D) Generic What is SAP GRC? — preserve selection
{
  const q = "What is SAP GRC?";
  const selected = turn(q);
  assert.strictEqual(selected.route, "PREPARED_SCRIPT");
  assert.strictEqual(selected.scriptId, "what-is-grc");
}

// E) AC vs PC differences — must not return AC-only prepared overview as complete answer
{
  const q = "Explain Access Control and Process Control differences.";
  const selected = turn(q);
  assert.notEqual(selected.scriptId, "what-is-grc");
  assert.doesNotMatch(String(selected.scriptAnswer || ""), AC_OPENER);
}

// F) PC troubleshooting/configuration — not hijacked by AC overview
{
  const trouble = turn("How do you troubleshoot a failed Process Control control test?");
  assert.notEqual(trouble.scriptId, "what-is-grc");
  assert.doesNotMatch(String(trouble.scriptAnswer || ""), AC_OPENER);
  const wf = selectVerifiedWorkflow("How do you troubleshoot a failed Process Control control test?");
  assert.ok(
    wf == null || wf.id === "process-control-test-troubleshooting" || /process-control/i.test(String(wf.id)),
    `F unexpected workflow ${wf?.id}`
  );

  const configure = turn("How do you configure Process Control in SAP GRC?");
  assert.notEqual(configure.scriptId, "what-is-grc");
  assert.doesNotMatch(String(configure.scriptAnswer || ""), AC_OPENER);
}

console.log("processControlPreparedScriptAssert: PASS (A–F Process Control vs what-is-grc)");
