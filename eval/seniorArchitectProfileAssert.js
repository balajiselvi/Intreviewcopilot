/**
 * V2.2 Senior Principal Architect response-profile integration — offline contract.
 * Proves conditional activation, intent-structure precedence, and anti-contamination prompts.
 * No provider calls.
 */
const assert = require("node:assert/strict");
const { pathToFileURL } = require("node:url");
const { register } = require("node:module");
const path = require("node:path");

(async () => {
  await register(pathToFileURL(path.join(__dirname, "lib/extlessResolveHook.mjs")).href);
  const {
    buildSapInterviewPrompt,
    isSeniorArchitectTechnicalDomain,
    buildSeniorArchitectResponseProfile
  } = await import("../lib/prompt/interviewPrompt.js");

  // --- Gate: SAP technical domains ON ---
  const sapCases = [
    { q: "Explain Greenfield, Brownfield and Selective Data Transition.", a: { category: "Migration", domain: "S/4" } },
    { q: "Explain your SAP GRC Health Check Approach.", a: { category: "Methodology", domain: "GRC" } },
    { q: "How to troubleshoot Business Reports Excessive SoD Violations?", a: { category: "ARA", domain: "GRC" } },
    { q: "How to troubleshoot a stuck MSMP workflow.", a: { category: "MSMP", domain: "GRC" } },
    { q: "Explain IAS versus IPS.", a: { category: "IAS", secondaryCategories: ["IPS"], domain: "BTP" } },
    { q: "Explain SAP GRC Access Control integration with S/4HANA.", a: { category: "ARA", secondaryCategories: ["S/4"], domain: "GRC" } },
    { q: "How do you approach S/4HANA role design?", a: { category: "Role Design", domain: "S/4" } }
  ];

  for (const { q, a } of sapCases) {
    assert.equal(isSeniorArchitectTechnicalDomain(a, q), true, `gate must activate for: ${q}`);
    const profile = buildSeniorArchitectResponseProfile({ analysis: a, question: q });
    assert.match(profile, /QUALITY PROFILE/i, `profile text missing for: ${q}`);
    assert.match(profile, /does NOT override REASONING TEMPLATE/i);
    assert.doesNotMatch(profile, /mandatory for every technical/i);
  }

  // --- Gate: non-SAP / people-only OFF ---
  assert.equal(
    isSeniorArchitectTechnicalDomain({ category: "PMP", domain: "Delivery" }, "How do you manage stakeholder conflict on a timeline?"),
    false,
    "pure PMP must not activate SAP architect profile"
  );
  assert.equal(
    isSeniorArchitectTechnicalDomain({ category: "Leadership", domain: "Behavioral" }, "Tell me about a time you led a team through conflict."),
    false,
    "pure Leadership must not activate SAP architect profile"
  );
  assert.equal(
    buildSeniorArchitectResponseProfile({
      analysis: { category: "PMP" },
      question: "How do you build a RAID log?"
    }),
    "",
    "profile builder must return empty outside SAP technical domains"
  );

  // Behavioral with explicit SAP signal may activate (quality only — still not override intent).
  assert.equal(
    isSeniorArchitectTechnicalDomain(
      { category: "Behavioral", domain: "Behavioral" },
      "Tell me about a time you remediaed SAP GRC SoD conflicts before cutover."
    ),
    true,
    "Behavioral + SAP signal may activate quality profile"
  );

  // --- Prompt integration: profile present for SAP, absent for PMP ---
  const grcHealthPrompt = buildSapInterviewPrompt({
    question: "Explain your SAP GRC Health Check Approach.",
    analysis: { category: "Methodology", domain: "GRC", secondaryCategories: [] },
    reasoningContract: { reasoningMode: "design" },
    responseLength: "medium"
  });
  assert.match(grcHealthPrompt, /SENIOR PRINCIPAL ARCHITECT RESPONSE PROFILE/);
  assert.match(grcHealthPrompt, /REASONING TEMPLATE/);
  assert.match(grcHealthPrompt, /INTENT-SPECIFIC STRUCTURE PRECEDENCE/);
  assert.match(grcHealthPrompt, /Health-check|assessment|methodology/i);
  assert.doesNotMatch(grcHealthPrompt, /mandatory for every technical interview question/i);
  assert.doesNotMatch(grcHealthPrompt, /silently cover all five V2\.2 beats/i);
  // Methodology template must remain the structural spine (not forced architecture 5-point).
  assert.match(grcHealthPrompt, /Scope and environment baseline|capability and control assessment/i);

  const araPrompt = buildSapInterviewPrompt({
    question: "How to troubleshoot Business Reports Excessive SoD Violations?",
    analysis: { category: "ARA", domain: "GRC", secondaryCategories: [] },
    reasoningContract: { reasoningMode: "diagnose" },
    responseLength: "medium"
  });
  assert.match(araPrompt, /SENIOR PRINCIPAL ARCHITECT RESPONSE PROFILE/);
  assert.match(araPrompt, /Do not introduce MSMP into an ARA-only investigation/i);
  assert.match(araPrompt, /GRAC_BATCH_RISK_ANALYSIS|Ruleset|Violation Triage/i);

  const msmpPrompt = buildSapInterviewPrompt({
    question: "How to troubleshoot a stuck MSMP workflow.",
    analysis: { category: "MSMP", domain: "GRC", secondaryCategories: [] },
    reasoningContract: { reasoningMode: "diagnose" },
    responseLength: "medium"
  });
  assert.match(msmpPrompt, /GRFNMW_CONFIGURE|Instance Status|SLG1/i);
  assert.match(msmpPrompt, /Do not answer with ARA SoD reporting unless/i);

  const iasIpsPrompt = buildSapInterviewPrompt({
    question: "Explain IAS versus IPS.",
    analysis: { category: "IAS", secondaryCategories: ["IPS"], domain: "BTP" },
    reasoningContract: { reasoningMode: "compare" },
    responseLength: "medium"
  });
  assert.match(iasIpsPrompt, /Never collapse IAS and IPS/i);
  assert.match(iasIpsPrompt, /SENIOR PRINCIPAL ARCHITECT RESPONSE PROFILE/);

  const migrationPrompt = buildSapInterviewPrompt({
    question: "Explain Greenfield, Brownfield and Selective Data Transition.",
    analysis: { category: "Migration", domain: "S/4", secondaryCategories: [] },
    reasoningContract: { reasoningMode: "define" },
    responseLength: "medium"
  });
  assert.match(migrationPrompt, /SENIOR PRINCIPAL ARCHITECT RESPONSE PROFILE/);
  assert.match(migrationPrompt, /Transition Strategy|Migration/i);
  // Conceptual/define must not be forced into architecture five-beat mandate.
  assert.doesNotMatch(migrationPrompt, /mandatory for every technical/i);

  const pmpPrompt = buildSapInterviewPrompt({
    question: "How do you manage critical-path slippage with a sponsor?",
    analysis: { category: "PMP", domain: "Delivery", secondaryCategories: [] },
    reasoningContract: { reasoningMode: "decide" },
    responseLength: "medium"
  });
  assert.doesNotMatch(pmpPrompt, /SENIOR PRINCIPAL ARCHITECT RESPONSE PROFILE/);
  assert.match(pmpPrompt, /REASONING TEMPLATE/);

  // Coverage / grounding language retained in operating contract.
  assert.match(grcHealthPrompt, /Coverage-aware generation remains/i);
  assert.match(grcHealthPrompt, /must not authorize unsupported claims/i);

  // Answer Integrity Contract — four-dimensional silent control + leakage protection.
  assert.match(grcHealthPrompt, /ANSWER INTEGRITY CONTRACT/i);
  assert.match(grcHealthPrompt, /PRODUCT & DOMAIN/i);
  assert.match(grcHealthPrompt, /ESSENTIAL CONCEPT/i);
  assert.match(grcHealthPrompt, /QUESTION-TO-ANSWER VALIDATION/i);
  assert.match(grcHealthPrompt, /INTERNAL-INSTRUCTION LEAKAGE PROTECTION/i);
  assert.match(grcHealthPrompt, /I treat this as a conceptual/i);
  assert.match(grcHealthPrompt, /Do not claim employment, affiliation, or project experience with Protiviti/i);
  assert.match(grcHealthPrompt, /do not force first-person/i);
  // Essential-concept examples retained as silent guidance (ARA hierarchy + EAM missing logs).
  assert.match(grcHealthPrompt, /Risk \/ Function \/ Action \/ Permission/i);
  assert.match(grcHealthPrompt, /Firefighter logs not generated/i);

  console.log("seniorArchitectProfileAssert: PASS");
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
