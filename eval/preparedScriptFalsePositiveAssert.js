/**
 * PREPARED_SCRIPT false-positive guards:
 * - about-yourself must not fire on SAP "profile parameters"
 * - grc-vs-detection must not fire on bare vulnerability-management concepts
 */
const assert = require("assert");
const { decideInterviewTurn } = require("../lib/turnDecision.js");
const { resolvePreparedScript, isOverviewRequest } = require("../lib/scriptMatch.js");
const { recallExpectedAnswer } = require("./lib/expectedAnswers.js");
const { matchAnswerBank } = require("../lib/answerBank.js");

function turn(question, history = []) {
  return decideInterviewTurn({ question, history });
}

// 1) Introduction still selects about-yourself
{
  const selected = turn("Tell me about yourself");
  assert.strictEqual(selected.route, "PREPARED_SCRIPT", `1 route ${selected.route}`);
  assert.strictEqual(selected.scriptId, "about-yourself", `1 scriptId ${selected.scriptId}`);
  assert.ok(isOverviewRequest("Tell me about yourself"));
}

// 2) Professional-profile walkthrough still selects introduction
{
  const selected = turn("Walk me through your professional profile");
  assert.strictEqual(selected.route, "PREPARED_SCRIPT", `2 route ${selected.route}`);
  assert.strictEqual(selected.scriptId, "about-yourself", `2 scriptId ${selected.scriptId}`);
  assert.strictEqual(resolvePreparedScript("Walk me through your professional profile")?.id, "about-yourself");
}

// 3) Profile parameters must NOT select about-yourself
{
  const q = "What are SAP Security Profile Parameters?";
  assert.strictEqual(isOverviewRequest(q), false, "3 overview must be false");
  assert.notEqual(resolvePreparedScript(q)?.id, "about-yourself", "3 script must not be about-yourself");
  const selected = turn(q);
  assert.notEqual(selected.scriptId, "about-yourself", `3 got scriptId ${selected.scriptId}`);
  assert.notEqual(selected.route, "PREPARED_SCRIPT", `3 got route ${selected.route} / ${selected.scriptId}`);
  // Fall through to generation (or bank if a future concept entry exists — never intro).
  assert.ok(
    selected.route === "GENERATION" || selected.route === "ANSWER_BANK",
    `3 unexpected route ${selected.route}`
  );
}

// 4) Bare vulnerability-management concept must NOT select grc-vs-detection
{
  const q = "What is Vulnerability Management in SAP?";
  assert.notEqual(recallExpectedAnswer(q)?.id, "grc-vs-detection");
  assert.notEqual(resolvePreparedScript(q)?.id, "grc-vs-detection");
  const selected = turn(q);
  assert.notEqual(selected.scriptId, "grc-vs-detection", `4 got ${selected.scriptId}`);
  assert.ok(
    selected.route === "GENERATION" || selected.route === "ANSWER_BANK",
    `4 unexpected route ${selected.route}`
  );
}

// 5) Explicit GRC / threat / vulnerability comparison still selects the comparison script
{
  const q = "Difference between GRC, threat detection and vulnerability management?";
  assert.strictEqual(recallExpectedAnswer(q)?.id, "grc-vs-detection");
  const selected = turn(q);
  assert.strictEqual(selected.route, "PREPARED_SCRIPT");
  assert.strictEqual(selected.scriptId, "grc-vs-detection");
}

// 6) Follow-up technical question does not inherit a prior intro script
{
  const history = [
    {
      type: "question",
      text: "Tell me about yourself",
      scriptId: "about-yourself",
      route: "PREPARED_SCRIPT"
    },
    {
      type: "response",
      text: "I'm an SAP Security and GRC professional.",
      scriptId: "about-yourself"
    }
  ];
  const selected = turn("What are SAP Security Profile Parameters?", history);
  assert.notEqual(selected.scriptId, "about-yourself", `6 inherited ${selected.scriptId}`);
  assert.notEqual(selected.route, "PREPARED_SCRIPT");
}

// 7) Existing exact Top-100 matching unchanged
{
  const bank = require("../data/answer-bank/SAP_Security_GRC_Senior_Consultant_Top_100_QA.json");
  const first = (bank.questions || [])[0];
  assert.ok(first?.id && first?.question, "7 bank first entry required");
  const hit = matchAnswerBank(first.question);
  assert.strictEqual(hit?.id, first.id);
  assert.strictEqual(hit?.via, "exact");
  const selected = turn(first.question);
  assert.strictEqual(selected.route, "ANSWER_BANK");
  assert.strictEqual(selected.scriptId, first.id);
}

// 8) Boundary smoke — Fix B FF, JML hybrid, IAS compare still not collapsed to intro
{
  const ff = turn(
    "What is your cutover runbook for GRC connectors, Firefighter and role transports, including rollback triggers?"
  );
  assert.notEqual(ff.scriptId, "about-yourself");
  assert.notEqual(ff.scriptId, "grc-vs-detection");

  const jml = turn(
    "How would you design and troubleshoot HR-driven joiner mover leaver provisioning with IPS transformations?"
  );
  assert.notEqual(jml.scriptId, "about-yourself");

  const ias = turn("Difference Between IAS and IPS?");
  assert.strictEqual(ias.route, "PREPARED_SCRIPT");
  assert.strictEqual(ias.scriptId, "ias-ips");
}

// 9) Live STT "introduction system" (production) + debug restrict must not select about-yourself
{
  const q =
    "How do you restrict by CCS in production system? There is an audit observation. Auditor is saying this is restricted debug assist from introduction system.";
  assert.strictEqual(isOverviewRequest(q), false, "9 overview");
  assert.notEqual(resolvePreparedScript(q)?.id, "about-yourself", "9 script");
  const selected = turn(q);
  assert.notEqual(selected.scriptId, "about-yourself", `9 got ${selected.scriptId}`);
  assert.notEqual(selected.route, "PREPARED_SCRIPT", `9 got route ${selected.route}`);
}

// 10) P0.4 Defect A — GRC↔S/4 integration must NOT select what-is-grc overview
{
  const q = "Explain how SAP GRC integrates with S/4HANA?";
  assert.notEqual(recallExpectedAnswer(q)?.id, "what-is-grc", "10 recall");
  assert.notEqual(resolvePreparedScript(q)?.id, "what-is-grc", "10 prepared");
  const selected = turn(q);
  assert.notEqual(selected.scriptId, "what-is-grc", `10 scriptId ${selected.scriptId}`);
  assert.notEqual(selected.route, "PREPARED_SCRIPT", `10 route ${selected.route}`);
  assert.ok(
    selected.route === "GENERATION" || selected.route === "ANSWER_BANK",
    `10 unexpected route ${selected.route}`
  );
}

// 11) P0.4 Defect B — live central/decentral Firefighter must NOT select grc-vs-detection
{
  const live = "What is the difference between centralized and decentralized Firefighter ID in SAP GRC?";
  const withSuffix = "Difference between centralized and decentralized Firefighter ID in SAP GRC?";
  const ffId = "difference between centralized & decentralized FF ID?";
  for (const [label, q] of [
    ["live", live],
    ["suffix", withSuffix],
    ["ff-id", ffId]
  ]) {
    assert.notEqual(recallExpectedAnswer(q)?.id, "grc-vs-detection", `11 ${label} recall`);
    assert.notEqual(resolvePreparedScript(q)?.id, "grc-vs-detection", `11 ${label} prepared`);
    const selected = turn(q);
    assert.notEqual(selected.scriptId, "grc-vs-detection", `11 ${label} scriptId ${selected.scriptId}`);
    assert.notEqual(selected.scriptId, "what-is-grc", `11 ${label} what-is-grc`);
    assert.notEqual(selected.route, "PREPARED_SCRIPT", `11 ${label} route ${selected.route}`);
  }
}

// 12) P0.4 positive controls — generic GRC overview + genuine detection comparison preserved
{
  assert.strictEqual(recallExpectedAnswer("What is SAP GRC?")?.id, "what-is-grc", "12 what-is");
  assert.strictEqual(turn("What is SAP GRC?").scriptId, "what-is-grc");
  assert.strictEqual(
    recallExpectedAnswer("Explain SAP GRC Access Control.")?.id,
    "what-is-grc",
    "12 explain AC"
  );
  assert.strictEqual(turn("Explain SAP GRC Access Control.").scriptId, "what-is-grc");

  const threat = "Difference between GRC and threat detection?";
  assert.strictEqual(recallExpectedAnswer(threat)?.id, "grc-vs-detection", "12 threat recall");
  assert.strictEqual(turn(threat).scriptId, "grc-vs-detection", "12 threat turn");

  const vuln = "Difference between GRC and vulnerability management?";
  assert.strictEqual(recallExpectedAnswer(vuln)?.id, "grc-vs-detection", "12 vuln recall");
  assert.strictEqual(turn(vuln).scriptId, "grc-vs-detection", "12 vuln turn");
}

console.log("preparedScriptFalsePositiveAssert: PASS (profile + vulnerability + introduction-system + P0.4 guards)");
