/**
 * Offline Senior Architect sandbox — prints representative spoken answers
 * from verified workflow / safe-mode / conceptual / retrieved procedure paths.
 * No paid provider calls. Fresh Node process.
 *
 * Usage: node eval/seniorArchitectOfflineSandbox.js
 */
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { selectVerifiedWorkflow } = require("../lib/verifiedWorkflow.js");
const { resolveSafeModeAnswer } = require("../lib/safeModeRouter.js");
const { productKnowledgeFolders } = require("../lib/productKnowledgeScope.js");

const ROOT = path.join(__dirname, "..");
const read = (...parts) => fs.readFileSync(path.join(ROOT, ...parts), "utf8");

const META = /I would answer this at principle level because|identifiers are not confirmed|while the live path recovers/i;

function knowledgeFor(question) {
  const q = String(question || "");
  if (/\bMSMP\b/i.test(q)) {
    return `${read("knowledge", "grc", "msmp.md")}\n${read("knowledge", "grc", "brf-plus.md")}`;
  }
  if (/\bBRF/i.test(q)) {
    return `${read("knowledge", "grc", "brf-plus.md")}\n${read("knowledge", "grc", "msmp.md")}`;
  }
  if (/\bBTP\b/i.test(q)) {
    return [
      read("knowledge", "btp", "btp-security.md"),
      read("knowledge", "btp", "btp-security-architect-bank.md").slice(0, 6000),
      read("knowledge", "btp", "btp-overview.md")
    ].join("\n");
  }
  if (/\bFiori\b|\blaunchpad\b/i.test(q)) {
    // Prefer Spaces/Pages + launchpad content procedures; omit RAP/custom-app bank noise.
    return [
      read("knowledge", "fiori", "spaces-pages.md"),
      read("knowledge", "fiori", "catalogs.md"),
      read("knowledge", "fiori", "launchpad.md"),
      // Design section only — avoid RAP custom-app procedure dominating launchpad configure.
      (() => {
        const full = read("knowledge", "fiori", "fiori-security.md");
        const start = full.indexOf("## Design Fiori security for an S/4 rollout");
        const end = full.indexOf("\n## ", start + 10);
        return start >= 0 ? full.slice(start, end > start ? end : undefined) : "";
      })()
    ].join("\n");
  }
  return "";
}

const cases = [
  {
    id: "msmp",
    question: "How to configure MSMP?",
    // Prefer path may serve RETRIEVED_PROCEDURE when verified gates do not fire on the bare ask.
    expectRoute: /VERIFIED_WORKFLOW|RETRIEVED_PROCEDURE/,
    expect: [/GRFNMW_CONFIGURE/i, /Generate Version|generate the MSMP version|Maintain Rules|Instance Status/i]
  },
  {
    // Fix 1: MSMP-scoped BRF ask may use verified playbook; bare "How to configure BRF+?" must not.
    id: "brf-msmp",
    question: "How do you configure a BRF+ agent rule for MSMP?",
    expectRoute: "VERIFIED_WORKFLOW",
    expect: [/BRFPLUS|BRF\+/i, /Define Workflow-Related MSMP Rules/i, /decision table|Agent Rule|initiator|GRFN_MW_T_AGENT_ID/i]
  },
  {
    id: "brf-generic",
    question: "How to configure BRF+?",
    // Fix 1: must not hijack into VERIFIED MSMP agent-rule workflow. Empty GENERATION
    // body is Fix 2 (empty-answer recovery) — assert routing only here.
    expectRoute: /GENERATION|RETRIEVED_PROCEDURE|CONCEPTUAL_KNOWLEDGE/,
    expectVerifiedNull: true,
    expect: []
  },
  {
    id: "btp-security-pillars",
    question: "What are the core pillars of BTP security?",
    expectRoute: /VERIFIED_WORKFLOW|CONCEPTUAL_KNOWLEDGE/,
    expect: [/role collection/i, /XSUAA|IAS|subaccount/i]
  },
  {
    id: "fiori-launchpad",
    question: "How to configure Fiori launchpad in S/4HANA?",
    expect: [/\/UI2\/FLPCM_CUST|Manage Launchpad Spaces|F2786/i, /Spaces|Pages|F2570/i]
  }
];

const chat = read("pages", "api", "chat.js");
assert.match(chat, /const maxTokens = 2048/);
assert.match(read("lib", "prompt", "interviewPrompt.js"), /5-POINT TECHNICAL STRUCTURE/);
assert.match(read("lib", "prompt", "interviewPrompt.js"), /WORKFLOW-FIRST/);

console.log("=== Senior Architect Offline Sandbox (no paid provider calls) ===\n");

let failures = 0;
for (const item of cases) {
  const kb = knowledgeFor(item.question);
  const verified = selectVerifiedWorkflow(item.question);
  const safe = resolveSafeModeAnswer({ question: item.question, knowledgeText: kb });
  const answer = String(safe.answer || verified?.answer || "").trim();
  const folders = productKnowledgeFolders(item.question);
  const route = safe.route || (verified ? "VERIFIED_WORKFLOW" : "");

  console.log(`--- ${item.id}`);
  console.log(`Q: ${item.question}`);
  console.log(`folders: ${folders.join(",") || "(none)"}`);
  console.log(`verified: ${verified?.id || "null"}`);
  console.log(`safe.route: ${safe.route} served=${safe.served}`);
  console.log(`ANSWER:\n${answer}\n`);

  try {
    if (item.expectVerifiedNull) {
      assert.strictEqual(verified, null, "bare BRF+ must not select MSMP verified playbook");
    }
    if (item.expectRoute) {
      if (item.expectRoute instanceof RegExp) assert.match(route, item.expectRoute);
      else assert.strictEqual(route, item.expectRoute, `route ${route}`);
    }
    if (!item.expectVerifiedNull) {
      assert.ok(answer.length > 120, "answer too short");
      assert.doesNotMatch(answer, META);
    }
    for (const re of item.expect || []) assert.match(answer, re);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${item.id}: ${error.message}\n`);
  }
}

if (failures) {
  console.error(`seniorArchitectOfflineSandbox: FAIL (${failures})`);
  process.exitCode = 1;
} else {
  console.log(`seniorArchitectOfflineSandbox: PASS (${cases.length} representative answers)`);
}
