/**
 * Incident regression — 2026-10-30 live interview failure.
 *
 * Recovered from session live_mvt4dz46_5fcq9n4o:
 * 1) "How do you restrict debug access … production system?" was served as
 *    RETRIEVED_PROCEDURE IAS/IPS SSO troubleshooting (wrong plane).
 * 2) STT retry "… introduction system" selected PREPARED_SCRIPT about-yourself.
 * 3) Chitchat/acknowledgment "OK, OK, then" was inherited into the technical ask,
 *    polluting retrieval and forcing STAGE_INVESTIGATION via the word "debug".
 *
 * Offline only — no paid provider calls.
 */
const assert = require("node:assert/strict");
const {
  resolveInterviewContext,
  isDiagnosticHowRequest,
  toHistoryContext
} = require("../lib/interviewContext.js");
const { resolvePreparedScript, isOverviewRequest } = require("../lib/scriptMatch.js");
const { decideInterviewTurn } = require("../lib/turnDecision.js");
const {
  shouldPreferRetrievedProcedure,
  procedureTaskFit,
  questionProcedureIntent
} = require("../lib/procedureRetention.js");
const { resolveSafeModeAnswer } = require("../lib/safeModeRouter.js");

const DEBUG_Q =
  "Regarding OK, Balaji will start with the technical discussion. We'll start with the recipe then then move towards here and then, then we will have some jealous discussion. First, first lets start with SAP security. How do you restrict debug access product production system?";

const STT_INTRODUCTION_Q =
  "How do you restrict by CCS in production system? There is an audit observation. Auditor is saying this is restricted debug assist from introduction system.";

const IAS_TROUBLESHOOT =
  "Separate authentication success from provisioning/authorization failure—check IAS subject, IPS assignment, then app authz plane. "
  + "Mechanism: IAS troubleshooting: authentication logs, NameID, app config. IPS: job logs, failed entities, transform errors. "
  + "App: SF RBP / PFCG / BTP role collections / Ariba groups. "
  + "Governance: Ban granting temporary Admin in every plane to make it work. "
  + "Validation: Prove authn OK, then prove assignment, then prove app authz with a business transaction.";

// 1) Bare STT "introduction system" must not select about-yourself
{
  assert.equal(isOverviewRequest(STT_INTRODUCTION_Q), false, "1 overview must be false");
  assert.notEqual(resolvePreparedScript(STT_INTRODUCTION_Q)?.id, "about-yourself", "1 script");
  const turn = decideInterviewTurn({ question: STT_INTRODUCTION_Q });
  assert.notEqual(turn.scriptId, "about-yourself", `1 turn scriptId=${turn.scriptId}`);
  assert.notEqual(turn.route, "PREPARED_SCRIPT", `1 turn route=${turn.route}`);
}

// 2) "debug access" restriction is NOT a diagnostic how-request
{
  const clean = "How do you restrict debug access in a production system?";
  assert.equal(isDiagnosticHowRequest(clean), false, "2 diagnosticHow clean");
  assert.equal(isDiagnosticHowRequest(DEBUG_Q), false, "2 diagnosticHow incident");
  const ctx = resolveInterviewContext({ questionRaw: clean, history: [] });
  assert.notEqual(ctx.answerScope, "STAGE_INVESTIGATION", `2 scope=${ctx.answerScope}`);
  assert.equal(questionProcedureIntent(clean, ctx.answerScope), "", "2 procedure intent");
}

// 3) IAS identity troubleshooting must not task-fit a debug-access restrict ask
{
  const fit = procedureTaskFit(
    "How do you restrict debug access in a production system?",
    IAS_TROUBLESHOOT
  );
  assert.equal(fit.ok, false, `3 taskFit reason=${fit.reason}`);
  assert.match(String(fit.reason || ""), /debug-access-vs-identity/);
  const prefer = shouldPreferRetrievedProcedure({
    question: "How do you restrict debug access in a production system?",
    knowledgeText: IAS_TROUBLESHOOT,
    answerScope: "STAGE_INVESTIGATION"
  });
  assert.equal(prefer.prefer, false, `3 prefer reason=${prefer.reason}`);
}

// 4) Safe mode must not serve IAS procedure for the incident question
{
  const safe = resolveSafeModeAnswer({
    question: "How do you restrict debug access product production system?",
    knowledgeText: IAS_TROUBLESHOOT,
    answerScope: "STAGE_INVESTIGATION"
  });
  assert.notEqual(safe.route, "RETRIEVED_PROCEDURE", `4 safe route=${safe.route}`);
  assert.ok(
    safe.served === false || safe.route === "GENERATION" || safe.continueToGeneration,
    `4 expected continue-to-generation, got ${JSON.stringify({ served: safe.served, route: safe.route })}`
  );
  assert.doesNotMatch(String(safe.answer || ""), /Identity Authentication|NameID|IPS assignment/i);
}

// 5) Chitchat / "OK, OK, then" must not be inherited into the technical debug ask
{
  const ack = resolveInterviewContext({
    questionRaw: "OK, OK, then. Fine. OK, fine.",
    history: []
  });
  const history = [
    {
      role: "user",
      content: "Ah, OK, so you are the where are you from? Basically where is your hometown?",
      context: toHistoryContext(resolveInterviewContext({
        questionRaw: "Ah, OK, so you are the where are you from? Basically where is your hometown?",
        history: []
      }))
    },
    { role: "assistant", content: "I am from Krishnagiri." },
    {
      role: "user",
      content: "OK, OK, then. Fine. OK, fine.",
      context: toHistoryContext(ack)
    },
    { role: "assistant", content: "Understood." }
  ];
  const ctx = resolveInterviewContext({ questionRaw: DEBUG_Q, history });
  assert.equal(ctx.inheritsContext, false, "5 must not inherit chitchat");
  assert.equal(ctx.questionResolved, DEBUG_Q, "5 resolved must be the technical ask alone");
  assert.doesNotMatch(ctx.questionResolved, /hometown|Krishnagiri|OK, OK, then/i);
  assert.notEqual(ctx.answerScope, "STAGE_INVESTIGATION", `5 scope=${ctx.answerScope}`);
}

// 6) Positive control — genuine intro and genuine diagnostic still work
{
  assert.equal(resolvePreparedScript("Tell me about yourself")?.id, "about-yourself");
  assert.equal(
    isDiagnosticHowRequest("How do you troubleshoot an IPS job that stopped creating users?"),
    true
  );
}

console.log("liveInterviewDebugAccessIncidentAssert: PASS");
