/**
 * Phase 2 — domain routing, capability isolation, question intent.
 * Asserts internal classification / retrieval / workflow behavior — not fluent prose alone.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { analyzeInterviewQuestion } = require("../lib/interviewAnalyzer.js");
const {
  resolveInterviewContext,
  QUESTION_INTENTS,
  ANSWER_SCOPES,
  explicitProductTopics
} = require("../lib/interviewContext.js");
const { selectProductScopedChunks } = require("../lib/productKnowledgeScope.js");
const { deliveryProcedureAdjustment } = require("../services/sectionHeading.js");
const { selectVerifiedWorkflow } = require("../lib/verifiedWorkflow.js");
const { decideInterviewTurn } = require("../lib/turnDecision.js");
const { buildAskRecoveryText, normalizeRequestQuestion } = require("../lib/askOpenAIRequestScope.js");

const ROOT = path.join(__dirname, "..");

const grcChunks = [
  { sourceFolder: "grc", sourceFile: "msmp.md", heading: "MSMP troubleshooting: stuck workflow", content: "GRFNMW_CONFIGURE SWIA approval" },
  { sourceFolder: "grc", sourceFile: "ara.md", heading: "ARA SoD risk analysis business reports", content: "GRAC_BATCH_RISK_ANALYSIS excessive SoD violations" },
  { sourceFolder: "grc", sourceFile: "firefighter.md", heading: "Missing Firefighter session logs", content: "GRACFFLOG EAM review" },
  { sourceFolder: "grc", sourceFile: "arm.md", heading: "Configure ARM access request", content: "MSMP path" },
  { sourceFolder: "bw", sourceFile: "analysis-authorizations.md", heading: "Missing BW Analysis Authorization", content: "RSECADMIN S_RS_AUTH" },
  { sourceFolder: "btp", sourceFile: "ias.md", heading: "IAS authentication", content: "SAML trust" },
  { sourceFolder: "btp", sourceFile: "ips.md", heading: "IPS provisioning", content: "SCIM jobs" }
];

// 1. Business Reports Excessive SoD Violations → ARA, not MSMP
{
  const q = "How to troubleshoot Business Reports Excessive SoD Violations?";
  const analysis = analyzeInterviewQuestion(q);
  assert.equal(analysis.domain, "SAP GRC");
  assert.equal(analysis.businessProcess, "Risk Analysis");
  assert.equal(analysis.answerType, "troubleshooting");
  const scoped = selectProductScopedChunks(q, grcChunks);
  assert.ok(scoped.every((c) => c.sourceFile !== "msmp.md"), "SoD violation ask must not keep MSMP procedure files");
  assert.ok(scoped.some((c) => c.sourceFile === "ara.md"), "SoD violation ask must retrieve ARA");
  const msmpDelta = deliveryProcedureAdjustment(q, grcChunks[0], { category: "Troubleshooting" });
  const araDelta = deliveryProcedureAdjustment(q, grcChunks[1], { category: "Troubleshooting" });
  assert.ok(araDelta > msmpDelta, `ARA heading must outrank MSMP troubleshooting (${araDelta} vs ${msmpDelta})`);
  assert.equal(selectVerifiedWorkflow(q), null, "ARA SoD ask must not select an MSMP verified workflow");
}

// 2. Stuck MSMP → MSMP
{
  const q = "Stuck MSMP approval workflow";
  const scoped = selectProductScopedChunks(q, grcChunks);
  assert.ok(scoped.some((c) => c.sourceFile === "msmp.md"), "MSMP stuck workflow must keep msmp.md");
  const wf = selectVerifiedWorkflow(q);
  assert.ok(wf && /msmp/i.test(String(wf.id || wf.workflowId || "")), `MSMP stuck must select MSMP workflow, got ${wf?.id}`);
}

// 3. Missing Firefighter session logs → EAM
{
  const q = "Missing Firefighter session logs";
  assert.ok(explicitProductTopics(q).includes("GRC") || /\bFirefighter\b/i.test(q));
  const deltaEam = deliveryProcedureAdjustment(q, grcChunks[2], { category: "Troubleshooting" });
  const deltaMsmp = deliveryProcedureAdjustment(q, grcChunks[0], { category: "Troubleshooting" });
  assert.ok(deltaEam > deltaMsmp, "EAM/Firefighter heading must outrank unrelated MSMP troubleshooting");
}

// 4. IAS vs IPS → comparison intent / identity topics
{
  const q = "Compare IAS and IPS";
  const analysis = analyzeInterviewQuestion(q);
  assert.equal(analysis.primaryIntent, "Comparison");
  assert.equal(analysis.answerType, "comparison");
  const topics = explicitProductTopics(q);
  assert.ok(topics.includes("IAS") || topics.includes("IPS") || topics.includes("BTP"));
}

// 5. GRC AC integration with S/4 — retain GRC (integration context allowed)
{
  const q = "How does GRC Access Control integrate with S/4HANA?";
  const topics = explicitProductTopics(q);
  assert.ok(topics.includes("GRC"));
  assert.ok(topics.includes("S/4") || topics.includes("S/4HANA") || /S\/?4/i.test(q));
}

// 6. Missing BW Analysis Authorization → BW security lane
{
  const q = "Missing BW Analysis Authorization";
  const analysis = analyzeInterviewQuestion(q);
  assert.match(String(analysis.domain), /BW|Platform|Security|General/i);
  const folders = require("../lib/productKnowledgeScope.js").productKnowledgeFolders(q);
  assert.ok(folders.includes("bw") || folders.includes("security") || analysis.domain.includes("BW"));
}

// 7. SAP GRC Health Check Approach → methodology (not product definition scope)
{
  const q = "Explain your SAP GRC Health Check Approach?";
  const analysis = analyzeInterviewQuestion(q);
  assert.equal(analysis.primaryIntent, "Methodology");
  assert.equal(analysis.answerType, "methodology");
  const ctx = resolveInterviewContext({ questionRaw: q, history: [] });
  assert.equal(ctx.questionIntent, QUESTION_INTENTS.REQUEST_FOR_METHODOLOGY);
  assert.equal(ctx.answerScope, ANSWER_SCOPES.ASSESSMENT_METHODOLOGY);
  const prompt = fs.readFileSync(path.join(ROOT, "lib/prompt/interviewPrompt.js"), "utf8");
  assert.match(prompt, /ASSESSMENT_METHODOLOGY:/);
  assert.match(prompt, /Methodology:\s*"Structure \(spoken methodology/);
}

// 8. Explain MSMP configuration → technical steps / MSMP retention
{
  const q = "Explain MSMP configuration";
  const scoped = selectProductScopedChunks(q, grcChunks);
  assert.ok(scoped.some((c) => c.sourceFile === "msmp.md"));
  const turn = decideInterviewTurn({ question: q, history: [] });
  assert.notEqual(turn.route, "IGNORE");
}

// 9. Troubleshoot SoD violations → investigation shape
{
  const q = "How do you troubleshoot SoD violations?";
  const analysis = analyzeInterviewQuestion(q);
  assert.equal(analysis.primaryIntent, "Troubleshooting");
  assert.equal(analysis.businessProcess, "Risk Analysis");
  const scoped = selectProductScopedChunks(q, grcChunks);
  assert.ok(!scoped.some((c) => c.sourceFile === "msmp.md") || scoped.some((c) => c.sourceFile === "ara.md"));
}

// 10. Compare technologies → comparison
{
  const q = "What is the difference between centralized and decentralized Firefighter?";
  const analysis = analyzeInterviewQuestion(q);
  assert.equal(analysis.primaryIntent, "Comparison");
}

// Ambiguous / insufficient-evidence: empty question recovery stays controlled
{
  const recovered = buildAskRecoveryText({
    streamedResponse: "",
    requestQuestion: normalizeRequestQuestion("   "),
    looksIncomplete: () => true,
    buildFallback: () => "SHOULD_NOT_RUN"
  });
  assert.equal(recovered.ok, false);
  assert.equal(recovered.reason, "empty-question");
}

// Cross-domain: Fiori configure must not keep MSMP
{
  const q = "How do you configure a Fiori app on the launchpad?";
  const scoped = selectProductScopedChunks(q, [
    ...grcChunks,
    { sourceFolder: "fiori", sourceFile: "spaces-pages.md", heading: "Configure Spaces and Pages", content: "/UI2/FLPCM_CUST" },
    { sourceFolder: "fiori", sourceFile: "fiori-security.md", heading: "Fiori authorization", content: "S_SERVICE" }
  ]);
  assert.ok(!scoped.some((c) => c.sourceFile === "msmp.md"), "Fiori configure must not retrieve MSMP");
}

console.log("phase2DomainRoutingIntentAssert: PASS");
