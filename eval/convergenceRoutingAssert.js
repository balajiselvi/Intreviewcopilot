/**
 * Dual-decision coordination: interviewContext (intent/scope) vs reasoningPlanner (mode).
 * Planner is ESM and is consumed by Next; this file source-contracts it and runtime-tests
 * the CJS interviewContext stopping plane.
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { resolveInterviewContext, isDiagnosticHowRequest } = require("../lib/interviewContext");

const chatSrc = fs.readFileSync(path.join(__dirname, "../pages/api/chat.js"), "utf8");
assert.match(chatSrc, /scores\.set\("PMP", pmpScore \+ 3\)/);
assert.match(chatSrc, /!isTechnicalFailureAsk\(question\)/);
assert.match(chatSrc, /hypercare\|cutover\|go-\?live\|stabilization/);

const plannerSrc = fs.readFileSync(path.join(__dirname, "../lib/reasoningPlanner.js"), "utf8");
assert.match(plannerSrc, /DIAGNOSE_INVESTIGATE_ELEMENTS/);
assert.match(plannerSrc, /answerScope === "STAGE_INVESTIGATION"/);
assert.match(plannerSrc, /"decide"/);
assert.match(plannerSrc, /function isDiagnosticHowAsk/);
assert.match(plannerSrc, /isDiagnosticHowAsk\(question\) \|\| isSymptomReport/);

const diagnosticHows = [
  "How would you troubleshoot an authorization failure?",
  "How would you troubleshoot an IPS issue?",
  "How would you troubleshoot a synchronization problem?",
  "How would you troubleshoot a login problem?",
  "Walk me through diagnosing a Cloud Connector outage."
];
for (const q of diagnosticHows) {
  assert.strictEqual(isDiagnosticHowRequest(q), true, q);
  const ctx = resolveInterviewContext({ questionRaw: q });
  assert.strictEqual(ctx.answerScope, "STAGE_INVESTIGATION", q);
}

for (const q of ["How would you design the role?", "How would you implement the role?"]) {
  assert.strictEqual(isDiagnosticHowRequest(q), false, q);
  const ctx = resolveInterviewContext({ questionRaw: q });
  assert.notStrictEqual(ctx.answerScope, "STAGE_INVESTIGATION", q);
}

const impl = resolveInterviewContext({ questionRaw: "How would you add a Fiori tile?" });
assert.strictEqual(impl.answerScope, "IMPLEMENTATION_WALKTHROUGH");

const pmpGovernance = [
  "How would you manage a delayed hypercare milestone?",
  "How would you recover a slipping schedule?",
  "How would you handle a RAID item escalating to the steering committee?",
  "How would you manage a vendor delay during cutover?",
  "How would you reduce project risk during stabilization?",
  "The steering committee wants to cut two weeks off hypercare. How do you handle that?"
];
for (const q of pmpGovernance) {
  const ctx = resolveInterviewContext({ questionRaw: q });
  assert.notStrictEqual(ctx.answerScope, "IMPLEMENTATION_WALKTHROUGH", q);
  assert.notStrictEqual(ctx.answerScope, "STAGE_INVESTIGATION", q);
  assert.strictEqual(isDiagnosticHowRequest(q), false, q);
}

const technicalHypercare = "How would you troubleshoot a production issue during hypercare?";
assert.strictEqual(isDiagnosticHowRequest(technicalHypercare), true);
const techCtx = resolveInterviewContext({ questionRaw: technicalHypercare });
assert.strictEqual(techCtx.answerScope, "STAGE_INVESTIGATION");

console.log("convergenceRoutingAssert: PASS");
