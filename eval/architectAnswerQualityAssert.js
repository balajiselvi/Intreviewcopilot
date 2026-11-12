/**
 * Architect-level answer quality safeguards.
 * Offline only — no provider calls. Fresh Node process recommended.
 * node eval/architectAnswerQualityAssert.js
 *
 * Proves the global defect class behind the Fiori shallow answer:
 * short Implementation Activities inventories must not become RETRIEVED_PROCEDURE
 * First/Next/Finally stubs unless they carry concrete procedure anchors.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { register } = require("node:module");

const root = path.join(__dirname, "..");

function implSection(relPath) {
  const file = path.join(root, relPath);
  const text = fs.readFileSync(file, "utf8");
  const idx = text.search(/^## Implementation Activities\s*$/m);
  assert.notEqual(idx, -1, `${relPath} must expose Implementation Activities`);
  const rest = text.slice(idx);
  const afterHeading = rest.indexOf("\n");
  const bodySearch = rest.slice(afterHeading + 1).search(/\n## /);
  return bodySearch < 0 ? rest : rest.slice(0, afterHeading + 1 + bodySearch);
}

function sourceBlock(relPath, section) {
  return `### SOURCE: ${relPath.replace(/\\/g, "/")} | SECTION: Implementation Activities\n${section}`;
}

(async () => {
  await register(pathToFileURL(path.join(__dirname, "lib/extlessResolveHook.mjs")).href);
  const { buildSapInterviewPrompt } = await import("../lib/prompt/interviewPrompt.js");
  const {
    authoritativeProcedure,
    renderSpokenProcedure,
    questionProcedureIntent
  } = await import("../lib/procedureRetention.js");
  const { selectVerifiedWorkflow } = require("../lib/verifiedWorkflow.js");
  const { decideInterviewTurn } = require("../lib/turnDecision.js");
  const { productKnowledgeFolders } = require("../lib/productKnowledgeScope.js");

  const fioriQ = "How do you configure an SAP Fiori app in the launchpad?";
  assert.equal(questionProcedureIntent(fioriQ), "configure");
  assert.equal(selectVerifiedWorkflow(fioriQ), null,
    "deployment-unspecified Fiori configure must not use classic verified workflow");
  assert.equal(decideInterviewTurn({ question: fioriQ, history: [] }).route, "GENERATION");
  assert.deepEqual(productKnowledgeFolders(fioriQ).sort(), ["fiori", "s4hana"]);

  // Legacy indexed inventory that produced the live RETRIEVED_PROCEDURE stub.
  const fioriLegacyInventory = [
    "### SOURCE: s4hana/s4hana-fiori.md | SECTION: Implementation Activities",
    "## Implementation Activities",
    "",
    "- Maintain OData service authorization for standard and custom Fiori apps",
    "- Validate backend authorization content is complete for every app granted launchpad access",
    "- Test the full app experience end to end, not just launchpad visibility"
  ].join("\n");
  assert.deepEqual(authoritativeProcedure(fioriQ, fioriLegacyInventory, ""), [],
    "Fiori shallow inventory must not win as a spoken procedure");
  assert.equal(renderSpokenProcedure(fioriQ, []), "");

  // Rich deployment-aware Fiori design procedure remains speakable.
  const fioriSecurity = fs.readFileSync(path.join(root, "knowledge/fiori/fiori-security.md"), "utf8");
  const designHeading = "## Design Fiori security for an S/4 rollout";
  const designStart = fioriSecurity.indexOf(designHeading);
  assert.notEqual(designStart, -1);
  const designRest = fioriSecurity.slice(designStart);
  const designEnd = designRest.slice(designHeading.length).search(/\n## /);
  const designSection = designEnd < 0 ? designRest : designRest.slice(0, designHeading.length + designEnd);
  const richSpoken = renderSpokenProcedure(
    fioriQ,
    authoritativeProcedure(fioriQ, `### SOURCE: fiori/fiori-security.md | SECTION: Design Fiori security for an S/4 rollout\n${designSection}`, "")
  );
  assert.match(richSpoken, /Maintain Business Roles|\/UI2\/FLPCM_CUST/);
  assert.doesNotMatch(richSpoken, /First, maintain OData service authorization for standard and custom Fiori apps/i);

  // Prompt payload for the Fiori case: deployment lanes must be present for GENERATION fallback.
  const prompt = buildSapInterviewPrompt({
    question: fioriQ,
    analysis: { category: "Fiori", secondaryCategories: [], domain: "Fiori" },
    knowledgeContext: designSection,
    responseLength: "medium"
  });
  assert.match(prompt, /DEPLOYMENT LANES/i);
  assert.match(prompt, /Spaces\/Pages|Manage Launchpad Spaces/i);
  assert.match(prompt, /OData V4|\/IWFND\/V4_ADMIN/i);
  assert.doesNotMatch(prompt, /First, maintain OData service authorization for standard and custom Fiori apps/i);

  // Cross-domain: short theme inventories alone must not become First/Next/Finally stubs.
  const inventoryCases = [
    ["SAC", "How do you configure security for SAP Analytics Cloud?", "knowledge/sac/sac-security.md"],
    ["BW", "How do you configure BW analysis authorization?", "knowledge/bw/bw-security.md"],
    ["ARA", "How do you configure SAP Access Control ARA?", "knowledge/grc/ara.md"],
    ["Behavioral", "How do you handle conflict on a security project?", "knowledge/behavioral/conflict-resolution.md"]
  ];
  for (const [domain, question, relPath] of inventoryCases) {
    const spoken = renderSpokenProcedure(
      question,
      authoritativeProcedure(question, sourceBlock(relPath, implSection(relPath)), "")
    );
    assert.doesNotMatch(
      spoken,
      /^First,.+Next,.+Finally,/is,
      `${domain} Implementation Activities alone must not emit a shallow First/Next/Finally stub`
    );
  }

  // Positive control: IPS joiner Implementation Activities remains a concrete procedure.
  const ipsSpoken = renderSpokenProcedure(
    "Walk me through configuring a joiner job in IPS.",
    authoritativeProcedure(
      "Walk me through configuring a joiner job in IPS.",
      sourceBlock("knowledge/btp/ips.md", implSection("knowledge/btp/ips.md")),
      "IMPLEMENTATION_WALKTHROUGH"
    )
  );
  assert.match(ipsSpoken, /authoritative source|transformation rules/i);
  assert.match(ipsSpoken, /^First,/i);

  // Classic on-prem Fiori verified workflow remains available when deployment is named.
  const classic = selectVerifiedWorkflow(
    "How do you configure a classic SAP Fiori app on-premise with OData V2?"
  );
  assert.equal(classic?.id, "fiori-app-configure");
  assert.match(classic.answer, /\/UI2\/FLPCM_CUST/);
  assert.match(classic.answer, /\/UI2\/FLPAM/);
  assert.doesNotMatch(classic.answer, /When tackling a Fiori app for Launchpad/i);

  console.log("architectAnswerQualityAssert: PASS");
  console.log(JSON.stringify({
    fioriRoute: "GENERATION (workflow null; shallow inventory rejected; rich design speakable)",
    folders: productKnowledgeFolders(fioriQ),
    promptHasDeploymentLanes: /DEPLOYMENT LANES/i.test(prompt),
    promptChars: prompt.length,
    classicWorkflow: classic.id
  }));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
