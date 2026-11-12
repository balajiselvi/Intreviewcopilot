/**
 * Fix B — Firefighter setup must not hijack GRC cutover / deployment questions.
 * Asserts workflow ID and route (not a vague “some verified workflow”).
 */
const assert = require("assert");
const { selectVerifiedWorkflow } = require("../lib/verifiedWorkflow.js");

function pick(question) {
  const selected = selectVerifiedWorkflow(question);
  return {
    id: selected?.id || selected?.workflowId || null,
    route: selected?.route || null,
    answer: String(selected?.answer || "")
  };
}

// A) Pure Firefighter configuration → grc-firefighter
{
  const selected = pick("How do you configure Firefighter emergency access in SAP GRC Access Control?");
  assert.strictEqual(selected.id, "grc-firefighter", `A got ${selected.id}`);
  assert.strictEqual(selected.route, "VERIFIED_WORKFLOW");
  assert.match(selected.answer, /firefighter ID|GRAC_SPM|created on the target/i);
}

// B) Firefighter log review → must not be the ID-creation setup workflow
{
  const selected = pick("How do you review Firefighter logs after emergency access in SAP GRC?");
  assert.notEqual(selected.id, "grc-firefighter", `B setup hijacked log review as ${selected.id}`);
  // No dedicated FF log-review verified playbook today — null / non-setup is the safe contract.
  assert.ok(
    selected.id == null || selected.id === "grc-firefighter-launch-troubleshooting",
    `B unexpected workflow ${selected.id}`
  );
  if (selected.id == null) {
    assert.strictEqual(selected.route, null);
  }
}

// C) GRC cutover involving Firefighter and connectors → not firefighter setup
{
  const selected = pick(
    "What is your cutover runbook for GRC connectors, Firefighter and role transports, including rollback triggers?"
  );
  assert.notEqual(selected.id, "grc-firefighter", `C cutover hijacked by ${selected.id}`);
  assert.doesNotMatch(selected.answer, /^A GRC firefighter ID is created on the target/i);
  // Prefer a cutover workflow if scored; otherwise fall through to retrieval/generation (null).
  assert.ok(
    selected.id == null
      || selected.id === "activate-cutover-dependency-recovery"
      || /cutover/i.test(String(selected.id)),
    `C unexpected workflow ${selected.id}`
  );
}

// D) GRC cutover transports / rollback / go-no-go without needing FF setup
{
  const selected = pick(
    "How would you plan GRC cutover with transports, go/no-go and rollback for production transition?"
  );
  assert.notEqual(selected.id, "grc-firefighter");
  assert.ok(
    selected.id == null
      || selected.id === "activate-cutover-dependency-recovery"
      || /cutover/i.test(String(selected.id)),
    `D unexpected workflow ${selected.id}`
  );
}

// E) Combined Firefighter readiness and cutover → not complete cutover answered as FF setup
{
  const selected = pick(
    "How do you confirm Firefighter readiness as part of Access Control cutover and go-live hypercare?"
  );
  assert.notEqual(selected.id, "grc-firefighter", `E readiness/cutover hijacked by setup ${selected.id}`);
  assert.doesNotMatch(selected.answer, /^A GRC firefighter ID is created on the target/i);
}

// F) Existing Firefighter troubleshooting + approved setup controls
{
  const trouble = pick(
    "A Firefighter user cannot launch an approved emergency session. What do you validate?"
  );
  assert.strictEqual(trouble.id, "grc-firefighter-launch-troubleshooting");
  assert.strictEqual(trouble.route, "VERIFIED_WORKFLOW");

  const setup = pick("How do you configure Firefighter emergency access in SAP GRC?");
  assert.strictEqual(setup.id, "grc-firefighter");
  assert.strictEqual(setup.route, "VERIFIED_WORKFLOW");
}

console.log("firefighterCutoverWorkflowAssert: PASS (A–F Firefighter vs cutover)");
