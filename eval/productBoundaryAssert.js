const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { resolveInterviewContext, resolveProductScope, explicitProductTopic, explicitProductTopics } = require("../lib/interviewContext.js");
const { selectProductScopedChunks } = require("../lib/productKnowledgeScope.js");
const { productKnowledgeFolders } = require("../lib/productKnowledgeScope.js");
const { retrieveCandidatesStage } = require("../services/retrievalService.js");
const { selectVerifiedWorkflow } = require("../lib/verifiedWorkflow.js");
const { deliveryProcedureAdjustment } = require("../services/sectionHeading.js");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const publicMissing = resolveInterviewContext({
  questionRaw: "In S/4HANA Cloud Public Edition, how would you troubleshoot a user who cannot see an app?"
});
assert.equal(publicMissing.questionTopic, "Fiori");
assert.equal(publicMissing.answerScope, "STAGE_INVESTIGATION");

for (const question of [
  "An IAS sign-in works but the BTP app denies access. What do I check?",
  "An on-premise Fiori app returns HTTP 403 from OData. What do I check?",
  "SAP HANA returns an insufficient privilege error. What is the technical diagnostic?"
]) {
  assert.equal(resolveInterviewContext({ questionRaw: question }).answerScope, "STAGE_INVESTIGATION", question);
}

const ipsTriage = resolveInterviewContext({
  questionRaw: "An IPS job ended with failed entities and target accounts are missing. How would you technically triage it?"
});
assert.equal(ipsTriage.questionTopic, "IPS");
assert.equal(ipsTriage.answerScope, "STAGE_INVESTIGATION");
assert.deepEqual(resolveProductScope("IPS"), { category: "IPS", domain: "SAP Cloud Identity / BTP" });

for (const [question, topic] of [
  ["How do you troubleshoot SuccessFactors employee data access?", "SuccessFactors"],
  ["A SAP Ariba approver cannot approve a requisition.", "Ariba"],
  ["How do you diagnose a BW/4HANA analysis authorization?", "BW"],
  ["How do you apply an analytic privilege in SAP HANA?", "HANA"],
  ["How do I secure data in Datasphere?", "Datasphere"],
  ["How does SAP IDM provision users?", "SAP IDM"]
]) {
  assert.equal(explicitProductTopic(question), topic, question);
  const context = resolveInterviewContext({ questionRaw: question });
  assert.equal(context.questionTopic, topic, `question topic: ${question}`);
  assert.equal(resolveProductScope(topic).category, topic, `category scope: ${question}`);
}
assert.ok(resolveInterviewContext({
  questionRaw: "How do you troubleshoot a SuccessFactors employee access issue?"
}).forbiddenProductBoundaries.includes("S/4 Public Edition Display Authorization Trace"));

assert.deepEqual(
  explicitProductTopics("How do you secure an SAC live connection to Datasphere?"),
  ["SAC", "Datasphere"]
);
const diagnosticCandidates = [
  { sourceFolder: "rise", heading: "Public Edition troubleshooting: app is missing" },
  { sourceFolder: "fiori", heading: "Public Edition troubleshooting: app is missing" },
  { sourceFolder: "sac", heading: "Data access control" },
  { sourceFolder: "datasphere", heading: "Data Access Control" },
  { sourceFolder: "troubleshooting", heading: "Troubleshooting" }
];
const editionCandidates = [
  { sourceFolder: "s4hana", heading: "Public Edition: user cannot see a Fiori app" },
  { sourceFolder: "s4hana", heading: "Private Edition: user cannot see a Fiori app" },
  { sourceFolder: "s4hana", heading: "Private Edition launchpad" },
  { sourceFolder: "fiori", heading: "Public Edition troubleshooting: app is missing" }
];
const gatewayCandidates = [
  { sourceFolder: "rise", heading: "Troubleshooting" },
  { sourceFolder: "s4hana", heading: "Failing authorization: on-premise and Private Edition Gateway" },
  { sourceFolder: "fiori", heading: "Public Edition app opens but authorization fails" },
  { sourceFolder: "fiori", heading: "Failing authorization: on-premise and Private Edition Gateway" }
];
assert.deepEqual(
  selectProductScopedChunks("In S/4HANA Cloud Public Edition, a user cannot see a Fiori app.", editionCandidates).map((c) => c.heading),
  ["Public Edition: user cannot see a Fiori app", "Public Edition troubleshooting: app is missing"],
  "single-edition answers exclude the opposite edition's procedure"
);
assert.deepEqual(
  selectProductScopedChunks("Compare the Fiori app assignment in S/4HANA Cloud Public Edition and Private Edition.", editionCandidates).map((c) => c.heading),
  editionCandidates.map((c) => c.heading),
  "an explicit edition comparison retains both edition lanes"
);
assert.deepEqual(
  productKnowledgeFolders("An on-premise Fiori app returns HTTP 403 from OData. What do I check?"),
  ["fiori", "s4hana"],
  "ABAP Gateway diagnosis excludes the RISE private-cloud lane"
);
assert.deepEqual(
  selectProductScopedChunks("An on-premise Fiori app returns HTTP 403 from OData. What do I check?", gatewayCandidates).map((c) => c.heading),
  ["Failing authorization: on-premise and Private Edition Gateway", "Failing authorization: on-premise and Private Edition Gateway"],
  "ABAP Gateway diagnosis excludes Public Edition tools and unrelated RISE troubleshooting"
);
assert.deepEqual(
  selectProductScopedChunks("A user can open an SAC story but sees rows outside their organization.", diagnosticCandidates).map((c) => c.sourceFolder),
  ["sac"],
  "SAC diagnosis must not retrieve Public Edition launchpad troubleshooting"
);
assert.deepEqual(productKnowledgeFolders("How do you troubleshoot SuccessFactors employee data access?"), ["idm"]);
const publicFioriFolders = productKnowledgeFolders("In S/4HANA Cloud Public Edition, a user cannot see a Fiori app.");
assert.ok(publicFioriFolders.includes("fiori") && publicFioriFolders.includes("s4hana"));
assert.ok(!publicFioriFolders.includes("rise") && !publicFioriFolders.includes("security"), "Public Edition retrieval excludes Private Edition and generic ABAP security lanes");
const privateFioriFolders = productKnowledgeFolders("In S/4HANA Cloud Private Edition, a user cannot see a Fiori app.");
assert.ok(privateFioriFolders.includes("rise"), "Private Edition retrieval retains RISE deployment guidance");
assert.deepEqual(
  selectProductScopedChunks("How do you secure an SAC live connection to Datasphere?", diagnosticCandidates).map((c) => c.sourceFolder),
  ["sac", "datasphere"],
  "cross-product questions include both explicitly named knowledge lanes"
);
assert.deepEqual(
  selectProductScopedChunks("How do you diagnose an Ariba approval failure?", diagnosticCandidates).map((c) => c.sourceFolder),
  ["troubleshooting"],
  "generic troubleshooting is only a fallback when no Ariba source was retrieved"
);

const components = read("lib/componentSelector.js");
assert.doesNotMatch(components, /troubleshooting:\s*\["SU53"/);
assert.match(components, /pattern:\s*\/\\b\(su53\|st01\|stauthtrace\|security audit log\|sm21\|st22\)\\b\/i/);
assert.match(components, /components:\s*\["Fiori Launchpad", "Business Catalogs", "Spaces & Pages", "Target Mappings", "OData V2\/V4 Services"\]/);
assert.doesNotMatch(components, /components:\s*\["Fiori Launchpad"[^\]]*"SICF"|"Gateway Services"/);

const reasoning = read("lib/technicalReasoner.js");
assert.doesNotMatch(reasoning, /Execute SU53\/ST01 traces in target environment/);
assert.match(reasoning, /Product-Owned Evidence/);
assert.match(reasoning, /FALLBACK_COMPONENTS_BY_DOMAIN/);

const fiori = read("knowledge/fiori/fiori-security.md");
assert.match(fiori, /Public Edition troubleshooting: app is missing/);
assert.match(fiori, /A missing launchpad entry is not an OData authorization trace case/);
assert.match(fiori, /Display Authorization Trace/);
const fioriProcedures = read("knowledge/s4hana/s4hana-fiori.md");
assert.match(fioriProcedures, /Failing authorization: on-premise and Private Edition Gateway/);
assert.match(fioriProcedures, /Public Edition app opens but authorization fails/);
assert.doesNotMatch(fioriProcedures.match(/## Failing authorization: on-premise and Private Edition Gateway[\s\S]*?(?=## Public Edition app opens)/)?.[0] || "", /Public Edition: Display Authorization Trace/);

const ips = read("knowledge/btp/ips.md");
assert.match(ips, /Failed entities and missing target accounts: evidence-led triage/);
assert.match(ips, /source Read and Failed; source Skipped; target Created, Updated, Deleted, Skipped, and Failed/i);
assert.match(ips, /download the error-log ZIP/);
assert.doesNotMatch(ips, /Deduplication rule/i);
const ipsQuestion = "An IPS job ended with failed entities and target accounts are missing. How would you technically triage it?";
assert.ok(deliveryProcedureAdjustment(ipsQuestion, {
  heading: "Failed entities and missing target accounts: evidence-led triage",
  sourceFile: "ips.md"
}, { domain: "SAP Cloud Identity / BTP", primaryIntent: "troubleshooting" }) > 0);
assert.equal(deliveryProcedureAdjustment("What is Identity Provisioning?", {
  heading: "Failed entities and missing target accounts: evidence-led triage",
  sourceFile: "ips.md"
}, { domain: "SAP Cloud Identity / BTP" }), 0);
const gatewayQuestion = "On an ABAP Gateway deployment, the Fiori app launches but its OData call returns HTTP 403. What is your technical triage sequence?";
assert.ok(deliveryProcedureAdjustment(gatewayQuestion, {
  heading: "Failing authorization",
  sourceFile: "s4hana-fiori.md"
}, { domain: "SAP Fiori Security", primaryIntent: "troubleshooting" }) > deliveryProcedureAdjustment(gatewayQuestion, {
  heading: "Production Support Activities",
  sourceFile: "s4hana-fiori.md"
}, { domain: "SAP Fiori Security", primaryIntent: "troubleshooting" }));

const prompt = read("lib/prompt/interviewPrompt.js");
assert.match(prompt, /Keep mutually exclusive symptoms separate/);
assert.match(prompt, /Keep absence, skipped processing, and explicit failure distinct/);
assert.match(prompt, /Name a user-facing Fiori or cloud tool as an app/);
assert.match(prompt, /Do not replace the interviewer's failure with a different lifecycle case/);

const selector = read("lib/componentSelector.js");
assert.match(selector, /"Provisioning": \{ domains: \["SAP GRC"\]/);
assert.match(selector, /processDefinition\.domains\.includes\(analysis\.domain\)/);
assert.doesNotMatch(selector, /"Provisioning": \["ARM", "MSMP Workflow", "BRF\+"/);

const iag = selectVerifiedWorkflow("How do we configure the workflow in IAG Access Request?");
assert.equal(iag.workflowId, "iag-workflow-determination");
assert.match(iag.answer, /Maintain Workflow Template/);
assert.match(iag.answer, /RequestTypeRule/);
assert.match(iag.answer, /provisioning separately/);
assert.doesNotMatch(iag.answer, /IAG_WF_MANAGER|SCI User Group Sync Job|managerrolesecuritypath/);

const iagRuleset = selectVerifiedWorkflow("How do we upload the rule set in IAG?");
assert.equal(iagRuleset.workflowId, "iag-analysis-ruleset");
assert.match(iagRuleset.answer, /Administration > Rule Setup/);
assert.match(iagRuleset.answer, /Upload & Process/);
assert.match(iagRuleset.answer, /Processing Log and Validation Log/);
assert.doesNotMatch(iagRuleset.answer, /Which of those do you want\?|Ruleset Management/);

(async () => {
  const candidates = ["idm", "rise"].map((sourceFolder, index) => ({
    id: `scope-${index}`,
    sourceFile: `${sourceFolder}.md`,
    sourceFolder,
    extension: ".md",
    chunkNumber: 1,
    section: "test",
    content: `SAP ${sourceFolder} source evidence for testing product-scoped retrieval.`,
    embedding: [0.1, 0.2]
  }));
  const scoped = await retrieveCandidatesStage({
    provider: { getCandidates: async () => candidates },
    query: { question: "SuccessFactors RBP" },
    metadataFilters: { sourceFolders: ["idm"] }
  });
  assert.deepEqual(scoped.map((item) => item.sourceFolder), ["idm"]);
  console.log("productBoundaryAssert: PASS");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
