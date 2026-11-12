/**
 * Stage 1 — class-level routing + grounding invariants (offline, no paid calls).
 * Uses ≥5 unrelated configure/how-to/troubleshoot examples across products.
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  authoritativeProcedure,
  questionProcedureIntent,
  renderSpokenProcedure,
  shouldPreferRetrievedProcedure
} = require("../lib/procedureRetention.js");
const {
  looksIncompleteSpokenAnswer,
  findUngroundedTransactionClaims,
  stripUngroundedSapEntities,
  buildEntityAllowlistFromKnowledge
} = require("../lib/generationGuard.js");

const ROOT = path.join(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

const CLASS_CASES = [
  {
    // Fix 1: prefer MSMP-scoped BRF knowledge only for an MSMP-scoped BRF question.
    id: "brf-configure",
    question: "How do you configure a BRF+ agent rule for MSMP?",
    knowledge: read("knowledge/grc/brf-plus.md"),
    expectIntent: "configure"
  },
  {
    id: "msmp-configure",
    question: "How do you configure an MSMP workflow in SAP GRC Access Control?",
    knowledge: read("knowledge/grc/msmp.md"),
    expectIntent: "configure"
  },
  {
    id: "fiori-authorize",
    question: "How do you authorize a custom Fiori app through catalog and OData services?",
    knowledge: read("knowledge/fiori/fiori-security.md"),
    expectIntent: "configure"
  },
  {
    id: "ips-troubleshoot",
    question: "How do you troubleshoot an IPS job that completes with skipped users?",
    knowledge: read("knowledge/btp/ips.md"),
    expectIntent: "troubleshoot"
  },
  {
    id: "su24-how-to",
    question: "How do you maintain SU24 proposals for a custom transaction?",
    knowledge: read("knowledge/security/su24.md"),
    expectIntent: "configure",
    optionalKnowledge: true
  },
  {
    id: "ias-noisy",
    question: "um how to configure IAS federation with Entra ID?",
    knowledge: read("knowledge/btp/ias.md"),
    expectIntent: "configure"
  },
  {
    id: "ara-false-positive",
    question: "How do you investigate an SAP GRC Access Risk Analysis false positive?",
    knowledge: read("knowledge/grc/ara.md"),
    expectIntent: "troubleshoot",
    optionalKnowledge: true
  }
];

let failures = [];
function check(name, fn) {
  try {
    fn();
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
  }
}

// --- I1: authoritative procedure must be preferred when it yields a speakable sequence ---
for (const item of CLASS_CASES) {
  check(`I1-intent:${item.id}`, () => {
    if (!fs.existsSync(path.join(ROOT, item.knowledge ? "" : ""))) return;
    const intent = questionProcedureIntent(item.question);
    if (item.optionalKnowledge && !intent) return;
    assert.strictEqual(intent, item.expectIntent, `${item.id} intent`);
  });
  check(`I1-prefer:${item.id}`, () => {
    if (!item.knowledge) return;
    const decision = shouldPreferRetrievedProcedure({
      question: item.question,
      knowledgeText: item.knowledge
    });
    const steps = authoritativeProcedure(item.question, item.knowledge) || [];
    if (steps.length >= 3 && renderSpokenProcedure(item.question, steps)) {
      assert.strictEqual(decision.prefer, true, `${item.id} must prefer retrieved procedure`);
      assert.strictEqual(decision.route, "RETRIEVED_PROCEDURE");
    }
  });
}

// --- I2: ungrounded SAP entities must be stripped / hedged ---
const hallucinated = [
  "I open the BRF+ workbench through the transaction code GRFCP2 and create an application.",
  "I use transaction ZX99 to fix the Fiori tile assignment in the catalog.",
  "I check table ZFAKE_USERS for IPS skipped records.",
  "I assign authorization object Z_FAKE_AUTH in PFCG for Public Edition.",
  "I call service /IWFND/FAKE_SERVICE to activate the OData endpoint."
];
const brfKnowledge = read("knowledge/grc/brf-plus.md");
for (const [index, answer] of hallucinated.entries()) {
  check(`I2-strip:${index}`, () => {
    const allow = buildEntityAllowlistFromKnowledge(brfKnowledge);
    assert.ok(allow.transactions.size > 0 || allow.rawTokens.size > 0, "allowlist builds from KB");
    const cleaned = stripUngroundedSapEntities(answer, brfKnowledge);
    assert.doesNotMatch(cleaned, /\bGRFCP2\b|\bZX99\b|\bZFAKE_USERS\b|\bZ_FAKE_AUTH\b|FAKE_SERVICE/i);
    assert.ok(cleaned.trim().length > 0 || /not confirmed|supporting knowledge|principle/i.test(cleaned));
  });
}

check("I2-keep-grounded-brfplus", () => {
  const ok = "I open transaction BRFPLUS, maintain the agent decision table, activate it, and prove Approvers of Selected Path.";
  const cleaned = stripUngroundedSapEntities(ok, brfKnowledge);
  assert.match(cleaned, /BRFPLUS/i);
  assert.strictEqual(findUngroundedTransactionClaims(cleaned, brfKnowledge).length, 0);
});

// --- I2/I4 incomplete gate retained ---
check("I4-incomplete-tail", () => {
  assert.strictEqual(
    looksIncompleteSpokenAnswer("Next, I establish the necessary rules. This includes"),
    true
  );
});

// --- Routing exposure: chat must consult shouldPreferRetrievedProcedure (contract) ---
check("I1-chat-wired", () => {
  const chat = fs.readFileSync(path.join(ROOT, "pages/api/chat.js"), "utf8");
  assert.match(chat, /shouldPreferRetrievedProcedure/);
});

check("I3-prompt-principle-when-missing", () => {
  const prompt = fs.readFileSync(path.join(ROOT, "lib/prompt/interviewPrompt.js"), "utf8");
  assert.match(
    prompt,
    /principle[- ]level|only supplied knowledge|SUPPORTING KNOWLEDGE[\s\S]{0,200}missing/i
  );
});

if (failures.length) {
  console.error("stage1RoutingGroundingAssert: FAIL");
  for (const row of failures) console.error(" -", row);
  process.exitCode = 1;
} else {
  console.log(`stage1RoutingGroundingAssert: PASS (${CLASS_CASES.length} class cases + grounding checks)`);
}
