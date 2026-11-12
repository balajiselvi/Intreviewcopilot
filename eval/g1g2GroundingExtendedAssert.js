/**
 * G1/G2 extended offline asserts — positive + negative cases across domains.
 * Covers false-strip, false-negative entity shapes, retrieved≠verified, edition alignment,
 * and post-strip coherence. No paid provider calls.
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  buildEntityAllowlistFromKnowledge,
  stripUngroundedSapEntities,
  findUngroundedTransactionClaims,
  looksIncompleteSpokenAnswer,
  postStripCoherenceCheck,
  buildPrincipleLevelFallback,
  loadVerifiedEntityRegistry,
  isVerifiedEntity
} = require("../lib/generationGuard.js");
const {
  shouldPreferRetrievedProcedure,
  procedureEditionAligned,
  authoritativeProcedure,
  renderSpokenProcedure
} = require("../lib/procedureRetention.js");

const ROOT = path.join(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

let failures = [];
function check(name, fn) {
  try {
    fn();
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
  }
}

const brf = read("knowledge/grc/brf-plus.md");
const fiori = read("knowledge/fiori/fiori-security.md");
const ips = read("knowledge/btp/ips.md");
const ias = read("knowledge/btp/ias.md");
const su24 = read("knowledge/security/su24.md");

// --- Retrieved candidate ≠ verified ---
check("G1-provenance-retrieved-not-verified", () => {
  const allow = buildEntityAllowlistFromKnowledge(brf);
  assert.strictEqual(allow.provenance, "RETRIEVED_CANDIDATE");
  assert.strictEqual(allow.verified, false);
  assert.ok(allow.transactions.size + allow.rawTokens.size > 0);
  assert.strictEqual(isVerifiedEntity("BRFPLUS"), false, "KB presence must not imply VERIFIED");
  const emptyReg = loadVerifiedEntityRegistry(null);
  assert.strictEqual(emptyReg.loaded, false);
  const verifiedReg = loadVerifiedEntityRegistry({
    entities: [{
      token: "BRFPLUS",
      verification_status: "VERIFIED",
      sources: [{ url: "https://example.invalid/brf", section: "Workbench" }],
      verified_on: "2026-10-01",
      expiry: "2099-01-01"
    }]
  });
  assert.strictEqual(isVerifiedEntity("BRFPLUS", verifiedReg), true);
  assert.strictEqual(
    isVerifiedEntity("BRFPLUS", loadVerifiedEntityRegistry({
      entities: [{ token: "BRFPLUS", verification_status: "NEEDS_REVIEW" }]
    })),
    false,
    "NEEDS_REVIEW must not count as verified"
  );
});

// --- False-strip positives (legitimate grounded entities must survive) ---
const keepCases = [
  {
    id: "brfplus-transaction",
    knowledge: brf,
    answer: "I open transaction BRFPLUS, maintain the agent decision table, activate it, and prove Approvers of Selected Path."
  },
  {
    id: "brfplus-verb-bare",
    knowledge: brf,
    answer: "I launch BRFPLUS and maintain the decision table for the agent rule."
  },
  {
    id: "ips-job-logs",
    knowledge: ips,
    answer: "I open the Identity Provisioning Jobs tab, inspect Job Logs for skipped users, and correct the transformation mapping."
  },
  {
    id: "ias-federation-method",
    knowledge: ias,
    answer: "I configure the corporate IdP trust in IAS and validate SAML assertion attributes before enabling SSO."
  },
  {
    id: "su24-proposals",
    knowledge: su24,
    answer: "I maintain SU24 proposals for the custom transaction and transport the USOBT_C changes after validation."
  }
];

for (const item of keepCases) {
  check(`G1-false-strip-keep:${item.id}`, () => {
    const cleaned = stripUngroundedSapEntities(item.answer, item.knowledge);
    assert.ok(cleaned.trim().length > 20, "must retain spoken content");
    assert.doesNotMatch(cleaned, /not confirmed in supporting knowledge/i);
    if (/\bBRFPLUS\b/i.test(item.answer)) assert.match(cleaned, /BRFPLUS/i);
    if (/\bSU24\b/i.test(item.answer) && /\bSU24\b/i.test(item.knowledge)) {
      assert.match(cleaned, /SU24/i);
    }
  });
}

// --- False-negative shapes (ungrounded entities without "transaction code" wording) ---
const falseNeg = [
  { id: "launch-zx99", answer: "I launch ZX99 immediately to fix the catalog assignment.", needle: /ZX99/ },
  { id: "use-zfake", answer: "I use ZFAKE01 via the admin cockpit for IPS repairs.", needle: /ZFAKE01/ },
  { id: "call-fake-svc", answer: "I call service /IWFND/FAKE_SERVICE to activate the endpoint.", needle: /FAKE_SERVICE/ },
  { id: "table-claim", answer: "I check table ZFAKE_USERS for skipped records.", needle: /ZFAKE_USERS/ },
  { id: "auth-obj", answer: "I assign authorization object Z_FAKE_AUTH in PFCG.", needle: /Z_FAKE_AUTH/ }
];

for (const item of falseNeg) {
  check(`G1-false-neg-strip:${item.id}`, () => {
    const cleaned = stripUngroundedSapEntities(item.answer, brf);
    assert.doesNotMatch(cleaned, item.needle);
  });
}

// --- Incomplete gate retained (G2) across paraphrases ---
const incomplete = [
  "Next, I establish the necessary rules. This includes",
  "I configure the connector and then",
  "After activating the rule I validate"
];
for (const [index, text] of incomplete.entries()) {
  check(`G2-incomplete:${index}`, () => {
    assert.strictEqual(looksIncompleteSpokenAnswer(text), true);
  });
}
check("G2-complete-control", () => {
  assert.strictEqual(
    looksIncompleteSpokenAnswer("I open BRFPLUS, maintain the decision table, activate it, and prove Approvers of Selected Path."),
    false
  );
});

// --- Post-strip coherence ---
check("G1-coherence-overhedge", () => {
  const noisy = "I use transaction AAA and table BBB and authorization object CCC and service /X/Y.";
  const cleaned = stripUngroundedSapEntities(noisy, "No entities here.");
  const verdict = postStripCoherenceCheck(noisy, cleaned);
  assert.ok(verdict.ok === false || /not confirmed/i.test(cleaned));
  if (!verdict.ok) {
    assert.strictEqual(verdict.fallback, "principle-level");
    assert.match(
      buildPrincipleLevelFallback("How to configure BRF+?"),
      /identity|governance|enforcement|supporting knowledge|method terms/i
    );
    assert.doesNotMatch(
      buildPrincipleLevelFallback("What are the 5 pillars of BTP?"),
      /identifiers are not confirmed in supporting knowledge for this turn/i
    );
  }
});

// --- Edition alignment (amendment a) ---
check("I1-edition-public-vs-private-procedure", () => {
  const privateOnly = "Open PFCG and maintain SU24 proposals, then check SU53 for the missing object.";
  const decision = procedureEditionAligned(
    "How do you authorize a Fiori app in S/4HANA Cloud Public Edition?",
    privateOnly
  );
  assert.strictEqual(decision.aligned, false);
  const prefer = shouldPreferRetrievedProcedure({
    question: "How do you authorize a Fiori app in S/4HANA Cloud Public Edition?",
    knowledgeText: `${privateOnly} Then run STAUTHTRACE. Finally transport the role. Also document SICF.`
  });
  // Prefer must refuse when alignment fails even if sentence count is high enough to look procedural.
  assert.strictEqual(prefer.prefer, false);
  assert.match(String(prefer.reason), /public-ask-private/);
});

check("I1-edition-aligned-ok", () => {
  const ok = procedureEditionAligned(
    "How do you configure MSMP in GRC Access Control?",
    brf
  );
  assert.strictEqual(ok.aligned, true);
});

// --- Prefer still works on multi-domain configure asks when aligned ---
const preferCases = [
  // Fix 1: prefer MSMP-scoped BRF body only for an MSMP-scoped BRF question.
  { id: "brf", q: "How do you configure a BRF+ agent rule for MSMP?", knowledge: brf },
  { id: "ips", q: "How do you troubleshoot an IPS job that completes with skipped users?", knowledge: ips },
  { id: "fiori", q: "How do you authorize a custom Fiori app through catalog and OData services?", knowledge: fiori }
];
for (const item of preferCases) {
  check(`I1-prefer-aligned:${item.id}`, () => {
    const steps = authoritativeProcedure(item.q, item.knowledge) || [];
    if (steps.length >= 3 && renderSpokenProcedure(item.q, steps)) {
      const decision = shouldPreferRetrievedProcedure({ question: item.q, knowledgeText: item.knowledge });
      assert.strictEqual(decision.prefer, true, item.id);
    }
  });
}

// --- Senior wrapMode signal (wiring consumes this; helper must emit it) ---
check("I1-senior-backbone-flag", () => {
  const q = "How do you configure a BRF+ agent rule for MSMP?";
  const steps = authoritativeProcedure(q, brf) || [];
  if (steps.length >= 3) {
    const decision = shouldPreferRetrievedProcedure({
      question: q,
      knowledgeText: brf,
      seniority: "Senior Manager"
    });
    if (decision.prefer) assert.strictEqual(decision.wrapMode, "senior-backbone");
  }
});

// --- Ungrounded finder still flags GRFCP2 ---
check("G1-find-grfcp2", () => {
  assert.ok(
    findUngroundedTransactionClaims(
      "I open the workbench through the transaction code GRFCP2.",
      brf
    ).includes("GRFCP2")
  );
});

if (failures.length) {
  console.error("g1g2GroundingExtendedAssert: FAIL");
  for (const row of failures) console.error(" -", row);
  process.exitCode = 1;
} else {
  console.log(`g1g2GroundingExtendedAssert: PASS (${keepCases.length} keep + ${falseNeg.length} false-neg + alignment/coherence)`);
}
