/**
 * Critical: SF RBP troubleshooting must not hijack hybrid SF/EC JML provisioning asks.
 * Offline only — asserts selected workflow ID and route, not a vague route name.
 */
const assert = require("assert");
const {
  selectVerifiedWorkflow,
  isTroubleshootingAsk,
  isHrJmlProvisioningAsk,
  isHybridDesignTroubleshootAsk
} = require("../lib/verifiedWorkflow.js");

function pick(question) {
  const selected = selectVerifiedWorkflow(question);
  return {
    id: selected?.id || selected?.workflowId || null,
    route: selected?.route || null,
    product: selected?.product || null,
    answer: String(selected?.answer || "")
  };
}

// A) Hybrid SF EC joiner provisioning + troubleshooting → IPS JML, never RBP unavailable
{
  const q = "How would you design and troubleshoot joiner provisioning from SuccessFactors Employee Central into downstream SAP systems?";
  assert.strictEqual(isTroubleshootingAsk(q), true);
  assert.strictEqual(isHrJmlProvisioningAsk(q), true);
  assert.strictEqual(isHybridDesignTroubleshootAsk(q), true);
  const selected = pick(q);
  assert.strictEqual(selected.id, "ips-jml-hr-provisioning", `A hybrid selected ${selected.id}`);
  assert.strictEqual(selected.route, "VERIFIED_WORKFLOW");
  assert.notEqual(selected.id, "sf-rbp-unavailable-troubleshooting");
  assert.doesNotMatch(selected.answer, /compensation data is missing|Manage Permission Roles[\s\S]*subsidiary/i);

  const withIps = pick(
    "How would you design and troubleshoot joiner provisioning using IPS from SuccessFactors Employee Central?"
  );
  assert.strictEqual(withIps.id, "ips-jml-hr-provisioning", `A+IPS hybrid selected ${withIps.id}`);
  assert.strictEqual(withIps.route, "VERIFIED_WORKFLOW");
}

// B) Pure SF RBP / unavailable-action troubleshooting preserved
{
  const unavailable = pick(
    "A SuccessFactors permission was granted but the action remains unavailable. What do you inspect?"
  );
  assert.strictEqual(unavailable.id, "sf-rbp-unavailable-troubleshooting");
  assert.strictEqual(unavailable.route, "VERIFIED_WORKFLOW");

  const rbp = pick(
    "How would you investigate and remediate an employee-data access issue caused by SuccessFactors role-based permissions?"
  );
  assert.ok(rbp.id === "sf-rbp" || rbp.id === "sf-rbp-unavailable-troubleshooting", `B RBP selected ${rbp.id}`);
  assert.notEqual(rbp.id, "ips-jml-hr-provisioning");
}

// C) Explicit IDM provisioning from SuccessFactors → not displaced by RBP troubleshooting
{
  const idm = pick("How do you troubleshoot SAP IDM provisioning from SuccessFactors?");
  assert.notEqual(idm.id, "sf-rbp-unavailable-troubleshooting", `C IDM hijacked by ${idm.id}`);
  assert.notEqual(idm.id, "sf-rbp");
  // No IDM verified playbook today — null / non-RBP is the safe contract.
  assert.ok(
    idm.id == null || !String(idm.id).startsWith("sf-rbp"),
    `C unexpected verified workflow ${idm.id}`
  );
}

// D) Design-only JML provisioning preserved
{
  const design = pick(
    "How would you design joiner provisioning from SuccessFactors Employee Central into downstream SAP systems?"
  );
  assert.strictEqual(design.id, "ips-jml-hr-provisioning");
  assert.strictEqual(design.route, "VERIFIED_WORKFLOW");

  const namedIps = pick(
    "How would you use SAP IPS for joiner, mover, and leaver provisioning from SuccessFactors Employee Central?"
  );
  assert.strictEqual(namedIps.id, "ips-jml-hr-provisioning");
  assert.strictEqual(namedIps.route, "VERIFIED_WORKFLOW");
}

// E) IAS/IPS/IAG multi-product ask → never SF RBP troubleshooting (boundary; no separate IAG redesign)
{
  const planes = pick(
    "Explain the distinct responsibilities of IAS, IPS and SAP Cloud IAG, including how you would troubleshoot an identity-provisioning failure."
  );
  assert.notEqual(planes.id, "sf-rbp-unavailable-troubleshooting");
  assert.notEqual(planes.id, "sf-rbp");
  assert.doesNotMatch(planes.answer || "", /Manage Permission Roles[\s\S]*compensation/i);
}

// F) Ambiguous hybrid without provisioning lifecycle → no false verified IPS/JML or RBP-unavailable success
{
  const ambiguous = pick("How would you design and troubleshoot SuccessFactors?");
  assert.notEqual(ambiguous.id, "ips-jml-hr-provisioning");
  assert.notEqual(ambiguous.id, "sf-rbp-unavailable-troubleshooting");

  const joinerNoProvision = pick(
    "How would you design and troubleshoot joiner issues in SuccessFactors without changing permissions?"
  );
  assert.notEqual(joinerNoProvision.id, "ips-jml-hr-provisioning");
  assert.notEqual(joinerNoProvision.id, "sf-rbp-unavailable-troubleshooting");
}

console.log("verifiedWorkflowJmlHijackAssert: PASS (A–F hybrid JML vs SF RBP)");
