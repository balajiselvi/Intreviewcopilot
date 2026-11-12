/**
 * Phase 1 — Evidence-based scoring foundation assert (offline, no paid LLM).
 *
 * Validates schemas, five reference cards, deterministic scorer behaviour:
 * - known-good scores appropriately
 * - known-bad / fluent-wrong fails excellence
 * - missing mandatory reduces completeness
 * - critical errors block technical excellence
 */
const assert = require("node:assert/strict");
const {
  TECHNICAL_DIMENSIONS,
  validateQuestionReference,
  validateEvidenceScoreReport
} = require("./lib/evidenceScoreSchema.js");
const { scoreAnswerAgainstReference } = require("./lib/evidenceScorer.js");
const { listEvidenceReferences, getEvidenceReference } = require("./references/evidence/index.js");

const refs = listEvidenceReferences();
assert.equal(refs.length, 5, `expected 5 reference cards, got ${refs.length}`);
for (const ref of refs) validateQuestionReference(ref);

const REQUIRED_IDS = [
  "msmp-configuration",
  "firefighter-central-decentral",
  "ias-vs-ips",
  "s4-vs-bw-security",
  "grc-s4-integration"
];
for (const id of REQUIRED_IDS) {
  assert.ok(getEvidenceReference(id), `missing reference ${id}`);
}

const ffRef = getEvidenceReference("firefighter-central-decentral");

// Known-good: covers mandatory EAM deploy comparison (authored fixture for checklist — not a live LLM answer).
const KNOWN_GOOD_FF = [
  "Centralized EAM hosts Firefighter IDs and configuration on the GRC hub, and users launch target sessions from that hub, typically over RFC.",
  "Decentralized EAM installs local EAM components on the target systems so emergency access can continue if the central GRC hub or network link is unavailable — that is the failover case.",
  "When connectivity returns, logs still need sync and controller review; GRAC_SPM_LOG_SYNC is the usual hub reconciliation job for that evidence."
].join(" ");

// Known-bad / fluent-wrong: polished GRC-vs-detection script (live P0.3 failure content).
const FLUENT_WRONG_FF = [
  "GRC asks who should have access and whether that access creates risk.",
  "Threat detection asks what is happening and whether it looks suspicious.",
  "Vulnerability management asks whether the system, software, or configuration can be exploited.",
  "A patched system can still have excessive privilege. A clean role model does not patch a vulnerability.",
  "I need all three, and I would not call them the same product."
].join(" ");

// Incomplete: mentions central only, misses decentral/failover/log governance.
const INCOMPLETE_FF = [
  "Centralized Firefighter keeps the IDs on the GRC system and you assign them there for emergency access."
].join(" ");

{
  const good = scoreAnswerAgainstReference({
    reference: ffRef,
    question: ffRef.question,
    answer: KNOWN_GOOD_FF
  });
  validateEvidenceScoreReport(good);
  assert.equal(good.criticalErrorTriggered, false, "good must not trip critical errors");
  assert.ok(good.technicalScores.technicalCorrectness.score >= 3, `good correctness ${good.technicalScores.technicalCorrectness.score}`);
  assert.ok(good.technicalScores.technicalCompleteness.score >= 4, `good completeness ${good.technicalScores.technicalCompleteness.score}`);
  assert.ok(good.spokenLanguageScore.score >= 3, `good spoken ${good.spokenLanguageScore.score}`);
  assert.equal(good.missingMandatoryElements.length, 0, "good should cover mandatory checklist");
  for (const dim of TECHNICAL_DIMENSIONS) {
    assert.ok(good.technicalScores[dim], `missing dimension ${dim}`);
  }
}

{
  const bad = scoreAnswerAgainstReference({
    reference: ffRef,
    question: ffRef.question,
    answer: FLUENT_WRONG_FF
  });
  validateEvidenceScoreReport(bad);
  assert.equal(bad.criticalErrorTriggered, true, "fluent-wrong must trip critical error");
  assert.ok(bad.criticalErrorFlags.some((f) => f.id === "grc-vs-detection"), "expected grc-vs-detection critical");
  assert.equal(bad.technicalScores.technicalCorrectness.score, 0, "critical error must zero technical correctness");
  assert.equal(bad.technicalExcellenceBlocked, true, "excellence must be blocked");
  // Fluent speech must not rescue technical excellence.
  assert.ok(
    bad.spokenLanguageScore.score >= 3,
    `fluent-wrong should still look spoken-fluent (${bad.spokenLanguageScore.score})`
  );
  assert.ok(
    bad.technicalScores.technicalCorrectness.score <= 1,
    "fluent-wrong must not be technically excellent"
  );
  assert.ok(bad.spokenLanguageScore.score > bad.technicalScores.technicalCorrectness.score);
}

{
  const incomplete = scoreAnswerAgainstReference({
    reference: ffRef,
    question: ffRef.question,
    answer: INCOMPLETE_FF
  });
  assert.equal(incomplete.criticalErrorTriggered, false, "incomplete is omission, not this critical canned script");
  assert.ok(incomplete.missingMandatoryElements.length >= 2, "incomplete must show missing mandatory");
  assert.ok(
    incomplete.technicalScores.technicalCompleteness.score <= 3,
    `completeness should drop (${incomplete.technicalScores.technicalCompleteness.score})`
  );
  assert.ok(
    incomplete.technicalScores.technicalCorrectness.score <= 3,
    "incomplete must not score as excellent correctness"
  );
}

// Second card smoke: IAS vs IPS critical plane collapse.
{
  const ias = getEvidenceReference("ias-vs-ips");
  const goodIas = scoreAnswerAgainstReference({
    reference: ias,
    answer:
      "IAS is Identity Authentication: it authenticates users as IdP or proxy IdP with SAML 2.0 or OIDC and MFA. IPS is Identity Provisioning: it reads sources, transforms attributes, synchronizes, and provisions accounts to targets. They complement each other but the planes stay distinct — sign-in versus account lifecycle."
  });
  assert.equal(goodIas.criticalErrorTriggered, false);
  assert.ok(goodIas.technicalScores.technicalCompleteness.score >= 4);

  const badIas = scoreAnswerAgainstReference({
    reference: ias,
    answer:
      "IPS authenticates users for SAML SSO tokens across the landscape, while IAS is mainly the provisioning engine that also runs SoD for cloud apps."
  });
  assert.equal(badIas.criticalErrorTriggered, true);
  assert.equal(badIas.technicalScores.technicalCorrectness.score, 0);
}

// GRC↔S/4: canned what-is-grc overview must critically fail; integration answer must pass checklist.
{
  const grcS4 = getEvidenceReference("grc-s4-integration");
  const overviewOnly = scoreAnswerAgainstReference({
    reference: grcS4,
    answer:
      "I explain SAP GRC Access Control as the governance layer over SAP access. Security controls what a user can do. GRC covers who should have it, who approves it, what risk exists, how it is mitigated, and how it is monitored. Four capabilities: ARA, ARM, EAM, BRM."
  });
  assert.equal(overviewOnly.criticalErrorTriggered, true, "what-is-grc opener must critically fail integration reference");
  assert.equal(overviewOnly.technicalScores.technicalCorrectness.score, 0);

  const integrated = scoreAnswerAgainstReference({
    reference: grcS4,
    answer: [
      "GRC Access Control integrates to S/4HANA through ABAP connectors and repository sync so user and role data stay aligned.",
      "S/4 still enforces authorizations in PFCG; GRC governs SoD risk analysis, access requests that provision into S/4, and Firefighter emergency paths on that connector.",
      "I validate by confirming the connector, running repository sync, and proving an access request provisions the expected S/4 role assignment."
    ].join(" ")
  });
  assert.equal(integrated.criticalErrorTriggered, false);
  assert.ok(integrated.technicalScores.technicalCompleteness.score >= 3);
}

// Limitations contract present on every report.
{
  const sample = scoreAnswerAgainstReference({ reference: ffRef, answer: KNOWN_GOOD_FF });
  assert.equal(sample.limitations.evidenceBasedNow, "partial");
  assert.ok(Array.isArray(sample.limitations.deterministicCriteria));
  assert.ok(Array.isArray(sample.limitations.requiresFutureSemanticClaimExtraction));
  assert.equal(sample.claimExtractionMode, "requirement_checklist_only");
  assert.match(String(sample.limitations.evidenceBasedExplanation || ""), /not yet full semantic/i);
}

console.log("evidenceScoreAssert: PASS (Phase 1 schema + 5 refs + deterministic scorer + critical/spoken gates)");
