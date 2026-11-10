const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { resolveInterviewContext, resolveProductScope, explicitProductTopic, explicitProductTopics } = require("../lib/interviewContext.js");
const { selectProductScopedChunks } = require("../lib/productKnowledgeScope.js");
const { productKnowledgeFolders } = require("../lib/productKnowledgeScope.js");
const { retrieveCandidatesStage } = require("../services/retrievalService.js");
const { selectVerifiedWorkflow } = require("../lib/verifiedWorkflow.js");
const { deliveryProcedureAdjustment, namedSourceAdjustment } = require("../services/sectionHeading.js");

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
  ["How do I configure the MSMP workflow for an access request in SAP Access Control?", "GRC"],
  ["How do you troubleshoot SuccessFactors employee data access?", "SuccessFactors"],
  ["A SAP Ariba approver cannot approve a requisition.", "Ariba"],
  ["How do you diagnose a BW/4HANA analysis authorization?", "BW"],
  ["How do you apply an analytic privilege in SAP HANA?", "HANA"],
  ["How do I secure data in Datasphere?", "Datasphere"],
  ["How do I implement a manual assessment in SAP GRC Process Control?", "Process Control"],
  ["How does SAP IDM provision users?", "SAP IDM"]
]) {
  assert.equal(explicitProductTopic(question), topic, question);
  const context = resolveInterviewContext({ questionRaw: question });
  assert.equal(context.questionTopic, topic, `question topic: ${question}`);
  assert.equal(resolveProductScope(topic).category, topic, `category scope: ${question}`);
}
assert.deepEqual(
  productKnowledgeFolders("How do I configure the MSMP workflow for an access request in SAP Access Control?"),
  ["grc"],
  "SAP Access Control questions use the GRC knowledge lane even when the interviewer omits the GRC acronym"
);
assert.deepEqual(
  productKnowledgeFolders("How do I implement a manual assessment in SAP GRC Process Control?"),
  ["grc"],
  "Process Control is a distinct GRC product scope"
);
assert.ok(productKnowledgeFolders("On an SAP GRC program, a vendor delay threatens cutover; how do I govern recovery and escalation?").includes("project-management"));
assert.equal(namedSourceAdjustment("How do I implement a test in SAP GRC Process Control?", { sourceFolder: "grc", sourceFile: "process-control.md" }), 0.22);
assert.ok(resolveInterviewContext({
  questionRaw: "How do you troubleshoot a SuccessFactors employee access issue?"
}).forbiddenProductBoundaries.includes("S/4 Public Edition Display Authorization Trace"));

assert.deepEqual(
  explicitProductTopics("How do you secure an SAC live connection to Datasphere?"),
  ["SAC", "Datasphere"]
);
assert.equal(explicitProductTopic("How is identity and access administered for SAP Joule?"), "Joule");
assert.deepEqual(
  productKnowledgeFolders("How is identity and access administered for SAP Joule?"),
  ["btp"],
  "Joule uses its own knowledge lane and does not require a candidate project"
);
assert.deepEqual(
  productKnowledgeFolders("How would you deliver a programme with SAP Activate?"),
  ["project-management"],
  "SAP Activate methodology uses its project-management lane without assuming a RISE engagement"
);
const projectDeliveryScopeCases = [
  {
    question: "How would you apply the SAP Activate implementation methodology?",
    expected: ["project-management"],
    excluded: ["rise", "cutover", "hypercare"]
  },
  {
    question: "How would you lead a RISE with SAP transformation?",
    expected: ["rise", "s4hana"],
    excluded: ["project-management", "cutover", "hypercare"]
  },
  {
    question: "How do you prepare SAP Activate cutover and hypercare?",
    expected: ["project-management", "cutover", "hypercare"],
    excluded: ["rise"]
  },
  {
    question: "How do you govern risks and milestones in an SAP project?",
    expected: ["project-management"],
    excluded: ["rise", "cutover", "hypercare"]
  }
];
for (const item of projectDeliveryScopeCases) {
  const folders = productKnowledgeFolders(item.question);
  assert.deepEqual(folders, item.expected, item.question);
  for (const excludedFolder of item.excluded) {
    assert.ok(!folders.includes(excludedFolder), `${item.question}: excludes ${excludedFolder}`);
  }
}
assert.deepEqual(
  productKnowledgeFolders("How do you choose between a greenfield new implementation and a system conversion?"),
  ["project-types", "project-management", "cutover", "hypercare", "rise"],
  "Transition-path questions use the implementation lifecycle lanes"
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
{
  // Contract is edition retention — Public procedure + Public troubleshooting — not frozen
  // input-array order. Opposite-edition Private headings must stay excluded.
  const publicMissingAppHeadings = selectProductScopedChunks(
    "In S/4HANA Cloud Public Edition, a user cannot see a Fiori app.",
    editionCandidates
  ).map((c) => c.heading);
  assert.equal(publicMissingAppHeadings.length, 2, "single-edition answers keep both Public procedure lanes");
  assert.ok(
    publicMissingAppHeadings.includes("Public Edition: user cannot see a Fiori app"),
    "single-edition answers retain the Public Edition assignment procedure"
  );
  assert.ok(
    publicMissingAppHeadings.includes("Public Edition troubleshooting: app is missing"),
    "single-edition answers retain the Public Edition troubleshooting procedure"
  );
  assert.ok(
    !publicMissingAppHeadings.some((h) => /Private Edition/i.test(h)),
    "single-edition answers exclude the opposite edition's procedure"
  );
}
{
  // Contract is lane retention for an explicit Public vs Private comparison — not
  // a frozen input-array order. Ranking may promote troubleshooting headings first.
  const compareHeadings = selectProductScopedChunks(
    "Compare the Fiori app assignment in S/4HANA Cloud Public Edition and Private Edition.",
    editionCandidates
  ).map((c) => c.heading);
  const expectedHeadings = editionCandidates.map((c) => c.heading);
  assert.equal(
    compareHeadings.length,
    expectedHeadings.length,
    "an explicit edition comparison retains every edition-lane candidate"
  );
  for (const heading of expectedHeadings) {
    assert.ok(
      compareHeadings.includes(heading),
      `an explicit edition comparison retains both edition lanes (missing: ${heading})`
    );
  }
  assert.ok(
    compareHeadings.some((h) => /Public Edition/i.test(h))
      && compareHeadings.some((h) => /Private Edition/i.test(h)),
    "an explicit edition comparison retains both edition lanes"
  );
}
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
// SuccessFactors intent-sensitive scope: RBP/employee-data ≠ IDM; JML/provisioning adds IPS plane.
const sfEmployeeDataFolders = productKnowledgeFolders("How do you troubleshoot SuccessFactors employee data access?");
assert.ok(sfEmployeeDataFolders.includes("successfactors"),
  "SF employee data access uses the SuccessFactors RBP lane");
assert.ok(!sfEmployeeDataFolders.includes("idm"),
  "SF employee data access must not require standalone IDM scope");
assert.ok(!sfEmployeeDataFolders.includes("iag"),
  "SF employee data access must not open IAG");

const sfRbpFolders = productKnowledgeFolders("How do you configure SuccessFactors role-based permissions?");
assert.ok(sfRbpFolders.includes("successfactors"), "SF RBP configure stays on successfactors");
assert.ok(!sfRbpFolders.includes("idm"), "SF RBP configure must not pull standalone IDM");
assert.ok(!sfRbpFolders.includes("iag"), "SF RBP configure must not open IAG");

const sfIdmFolders = productKnowledgeFolders("How do you integrate SuccessFactors with SAP IDM?");
assert.ok(sfIdmFolders.includes("successfactors") && sfIdmFolders.includes("idm"),
  "explicit SF–IDM integration retrieves both domains");

const sfJmlEcFolders = productKnowledgeFolders("How do you provision joiners from SuccessFactors Employee Central?");
assert.ok(sfJmlEcFolders.includes("successfactors"), "SF EC joiner provisioning keeps the SF source lane");
assert.ok(sfJmlEcFolders.includes("btp") && sfJmlEcFolders.includes("cloud"),
  "SF EC joiner provisioning opens the IPS identity-provisioning plane (btp/cloud)");
assert.ok(!sfJmlEcFolders.includes("iag"), "SF EC joiner provisioning must not open IAG");

const sfJmlFolders = productKnowledgeFolders("How do you provision joiners from SuccessFactors?");
assert.ok(sfJmlFolders.includes("successfactors"), "SF joiner provisioning keeps the SF source lane");
assert.ok(sfJmlFolders.includes("btp") && sfJmlFolders.includes("cloud"),
  "SF joiner provisioning opens the IPS plane even when plurals omit explicit IPS/IDM names");
assert.ok(!sfJmlFolders.includes("iag"), "SF joiner provisioning must not open IAG");

const sfIdmProvisionFolders = productKnowledgeFolders("How do you troubleshoot SAP IDM provisioning from SuccessFactors?");
assert.ok(sfIdmProvisionFolders.includes("idm") && sfIdmProvisionFolders.includes("successfactors"),
  "SF→IDM provisioning troubleshooting retrieves IDM and SuccessFactors");
assert.ok(!sfIdmProvisionFolders.includes("btp") && !sfIdmProvisionFolders.includes("cloud"),
  "explicit IDM provisioning must not synonymize IPS (btp/cloud) into the scope");
assert.ok(!sfIdmProvisionFolders.includes("iag"),
  "SF→IDM provisioning must not open IAG");

const idmOnlyFolders = productKnowledgeFolders("How do you troubleshoot SAP IDM itself?");
assert.ok(idmOnlyFolders.includes("idm"), "IDM-only troubleshooting retrieves IDM");
assert.ok(!idmOnlyFolders.includes("successfactors"),
  "IDM-only troubleshooting must not force SuccessFactors");

const auditEvidenceFolders = productKnowledgeFolders("How do I prepare role and SoD evidence for a SOX ITGC audit?");
assert.ok(auditEvidenceFolders.includes("grc") && auditEvidenceFolders.includes("audit") && auditEvidenceFolders.includes("compliance"),
  "SOX/ITGC questions retain both product-risk and audit-evidence sources");
assert.deepEqual(
  selectProductScopedChunks("How do I prepare role and SoD evidence for a SOX ITGC audit?", [
    { sourceFolder: "grc", heading: "SoD analysis" },
    { sourceFolder: "audit", heading: "SOX evidence" },
    { sourceFolder: "compliance", heading: "Mitigating controls" },
    { sourceFolder: "rise", heading: "Troubleshooting" }
  ]).map((chunk) => chunk.sourceFolder),
  ["grc", "audit", "compliance"],
  "audit-focused GRC questions preserve all relevant evidence lanes and exclude unrelated products"
);
const publicFioriFolders = productKnowledgeFolders("In S/4HANA Cloud Public Edition, a user cannot see a Fiori app.");
assert.ok(publicFioriFolders.includes("fiori") && publicFioriFolders.includes("s4hana"));
assert.ok(!publicFioriFolders.includes("rise") && !publicFioriFolders.includes("security"), "Public Edition retrieval excludes Private Edition and generic ABAP security lanes");
const unqualifiedCloudFolders = productKnowledgeFolders("How would you design security for SAP S/4HANA Cloud, and how would you verify that the user has the required access?");
assert.ok(unqualifiedCloudFolders.includes("s4hana") && unqualifiedCloudFolders.includes("fiori"));
assert.ok(!unqualifiedCloudFolders.includes("security") && !unqualifiedCloudFolders.includes("rise"), "S/4HANA Cloud without a private or on-premise edition must not retrieve the PFCG lane");
const privateFioriFolders = productKnowledgeFolders("In S/4HANA Cloud Private Edition, a user cannot see a Fiori app.");
assert.ok(privateFioriFolders.includes("rise"), "Private Edition retrieval retains RISE deployment guidance");
const seniorFolders = productKnowledgeFolders("How do you explain a SoD risk to a nontechnical stakeholder?");
assert.ok(seniorFolders.includes("grc") && seniorFolders.includes("project-management"),
  "a client-facing SoD explanation keeps Access Control and the senior delivery lane");
assert.ok(!productKnowledgeFolders("How do I configure the MSMP workflow for an access request in SAP Access Control?").includes("project-management"),
  "an MSMP configuration question does not open the senior delivery lane");
assert.deepEqual(
  selectProductScopedChunks("How do you secure an SAC live connection to Datasphere?", [
    { sourceFolder: "sac", heading: "Common Interview Questions" },
    { sourceFolder: "sac", heading: "Configuration" },
    { sourceFolder: "datasphere", heading: "Tough Follow-up Questions" }
  ]).map((chunk) => chunk.heading),
  ["Configuration"],
  "a retrieved procedure outranks an interview-question bank in the answer budget"
);
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
assert.match(fiori, /App Finder[\s\S]*(?:pages|page)[\s\S]*(?:selected subset|subset selected|subset by the administrator)[\s\S]*absent from App Finder/);
assert.match(fiori, /Display Authorization Trace/);
const fioriProcedures = read("knowledge/s4hana/s4hana-fiori.md");
assert.match(fioriProcedures, /Failing authorization: on-premise and Private Edition Gateway/);
assert.match(fioriProcedures, /Public Edition app opens but authorization fails/);
assert.doesNotMatch(fioriProcedures.match(/## Failing authorization: on-premise and Private Edition Gateway[\s\S]*?(?=## Public Edition app opens)/)?.[0] || "", /Public Edition: Display Authorization Trace/);

const ips = read("knowledge/btp/ips.md");
assert.match(ips, /Troubleshooting: failed entities and missing target accounts/);
assert.match(ips, /Reconcile source Read, Failed, and Skipped with target Created, Updated, Deleted, Skipped, and Failed/i);
assert.match(ips, /download the error-log ZIP/);
assert.doesNotMatch(ips, /Deduplication rule/i);
const ipsQuestion = "An IPS job ended with failed entities and target accounts are missing. How would you technically triage it?";
assert.ok(deliveryProcedureAdjustment(ipsQuestion, {
  heading: "Troubleshooting: failed entities and missing target accounts",
  sourceFile: "ips.md"
}, { domain: "SAP Cloud Identity / BTP", primaryIntent: "troubleshooting" }) > 0);
assert.equal(deliveryProcedureAdjustment("What is Identity Provisioning?", {
  heading: "Troubleshooting: failed entities and missing target accounts",
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

for (const question of [
  "The BRFplus decision table returns a value but the request follows the wrong path. What do you check?",
  "An MSMP request routes to an unexpected path even though the initiator rule returns a result. How do you troubleshoot it?"
]) {
  const routeMapping = selectVerifiedWorkflow(question);
  assert.equal(routeMapping.workflowId, "grc-msmp-route-mapping-troubleshooting", question);
  assert.match(routeMapping.answer, /initiator rule selects the MSMP path/i);
  assert.match(routeMapping.answer, /RULE_RESULT.*mapped to the intended path/i);
  assert.match(routeMapping.answer, /Instance Status/i);
  assert.doesNotMatch(routeMapping.answer, /GRCMSMP/i);
  assert.match(routeMapping.answer, /do not change the stage.s agent rule to correct a path/i);
}

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
