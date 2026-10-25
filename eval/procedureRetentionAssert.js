const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const { explicitProductTopics } = require("../lib/interviewContext.js");
const { deliveryProcedureAdjustment } = require("../services/sectionHeading.js");
const ips = fs.readFileSync(path.join(root, "knowledge/btp/ips.md"), "utf8");
const heading = "## Troubleshooting: failed entities and missing target accounts";
const start = ips.indexOf(heading);
assert.notEqual(start, -1, "IPS source procedure must exist");
const rest = ips.slice(start);
const nextSection = rest.slice(heading.length).search(/\n## /);
const sourceSection = nextSection < 0 ? rest : rest.slice(0, heading.length + nextSection);
const knowledge = `### SOURCE: btp/ips.md | SECTION: Troubleshooting: failed entities and missing target accounts\n${sourceSection}`;

(async () => {
  const { authoritativeProcedure, renderSpokenProcedure } = await import("../lib/procedureRetention.js");
  const { fitSpokenLength } = await import("../lib/procedureRetention.js");
  const { questionProcedureIntent } = await import("../lib/procedureRetention.js");
  const { selectVerifiedWorkflow } = require("../lib/verifiedWorkflow.js");
  assert.equal(questionProcedureIntent("How do I attach the BRFplus agent rule?"), "configure");
  assert.equal(questionProcedureIntent("Why does the MSMP request have no approver?"), "troubleshoot");
  assert.equal(questionProcedureIntent("How do I troubleshoot the rule-result mapping?"), "troubleshoot");
  assert.ok(explicitProductTopics("How do I troubleshoot the rule-result mapping?").includes("GRC"));
  const iagBridgeAnswer = "IAG is a Cloud Foundry service. In a hybrid SAP Access Control 12.0 bridge, validate the documented topology and keep cloud IAG setup separate from backend MSMP configuration. Confirm that each selected service produces the expected governance result and separately verify the resulting target access.";
  for (const mode of ["concise", "medium", "lengthy"]) {
    const fitted = fitSpokenLength(iagBridgeAnswer, mode, "How would you configure IAG?");
    assert.match(fitted, /^IAG is a Cloud Foundry service\./, `${mode} retains the direct opening`);
    assert.match(fitted, /SAP Access Control 12\.0 bridge/, `${mode} preserves decimal release text`);
    assert.doesNotMatch(fitted, /(?:^|[.!?]\s+)0 bridge/);
  }
  const accessRequestQuestion = "How would you set up access requests in IAG?";
  const accessRequestWorkflow = selectVerifiedWorkflow(accessRequestQuestion);
  assert.equal(accessRequestWorkflow.workflowId, "iag-workflow-determination");
  const conciseAccessRequest = fitSpokenLength(accessRequestWorkflow.answer, "concise", accessRequestQuestion);
  assert.match(conciseAccessRequest, /^Workflow determination maps a request type to a path/i);
  assert.match(conciseAccessRequest, /downstream provisioning separately after approval/i,
    "concise fit must retain the approval-to-provisioning boundary");
  assert.ok(deliveryProcedureAdjustment("How do I attach the BRFplus agent rule?", { heading: "Configure a BRFplus agent rule for MSMP" }) > 0);
  const question = "An IPS job ended with failed entities and target accounts are missing. How would you technically triage it?";
  const steps = authoritativeProcedure(question, knowledge, "STAGE_INVESTIGATION");

  assert.ok(steps.length >= 5, "keep the ordered, evidence-led IPS triage sequence");
  assert.match(steps[0], /Scope one entity/);
  assert.ok(steps.some((step) => /Jobs tab, open Job Logs/.test(step)));
  assert.ok(steps.some((step) => /Failed Entities/.test(step)));
  assert.ok(steps.some((step) => /error-log ZIP/.test(step)));
  assert.ok(steps.some((step) => /Reconcile source Read, Failed, and Skipped with target Created, Updated, Deleted, Skipped, and Failed/.test(step)));
  assert.ok(steps.some((step) => /transformation conditions and ignored types for skips/.test(step)));
  assert.ok(steps.some((step) => /target-write failure/.test(step)));
  assert.doesNotMatch(steps.join(" "), /leaver|deprovision|manual deactivat|deduplication|SU01|PFCG/i);

  const spoken = renderSpokenProcedure(question, steps);
  assert.match(spoken, /^Scope one entity/);
  assert.doesNotMatch(spoken, /Direct Answer|Technical Mechanism|Validation and Operational Boundary/);
  assert.match(spoken, /Classify each miss as unread, filtered\/transformation-skipped, or target-write failure/);

  const ipsImplementation = fs.readFileSync(path.join(root, "knowledge/btp/ips.md"), "utf8");
  const implementationHeading = "## Implementation Activities";
  const implementationStart = ipsImplementation.indexOf(implementationHeading);
  assert.notEqual(implementationStart, -1);
  const implementationRest = ipsImplementation.slice(implementationStart);
  const implementationEnd = implementationRest.slice(implementationHeading.length).search(/\n## /);
  const implementationSection = implementationEnd < 0
    ? implementationRest
    : implementationRest.slice(0, implementationHeading.length + implementationEnd);
  const joinerQuestion = "Walk me through configuring a joiner job in IPS.";
  const joinerSteps = authoritativeProcedure(joinerQuestion, implementationSection, "IMPLEMENTATION_WALKTHROUGH");
  const joinerAnswer = renderSpokenProcedure(joinerQuestion, joinerSteps);
  assert.match(joinerAnswer, /^First, define the authoritative source/);
  assert.match(joinerAnswer, /Finally, configure notifications/);
  assert.match(joinerAnswer, /\.$/);
  assert.doesNotMatch(joinerAnswer, /(?:^|\s)-\s/);
  assert.doesNotMatch(joinerAnswer, /I would first Decision/i);

  const bw = fs.readFileSync(path.join(root, "knowledge/bw/bw-security.md"), "utf8");
  const bwHeading = "## Troubleshooting: query runs but returns no data for one user";
  const bwStart = bw.indexOf(bwHeading);
  assert.notEqual(bwStart, -1, "BW source procedure must exist");
  const bwRest = bw.slice(bwStart);
  const bwEnd = bwRest.slice(bwHeading.length).search(/\n## /);
  const bwSection = bwEnd < 0 ? bwRest : bwRest.slice(0, bwHeading.length + bwEnd);
  const bwContext = `### SOURCE: bw/bw-security.md | SECTION: ${bwHeading}\n${bwSection}`;
  const bwQuestion = "A BW query runs but returns no data for one user. How would you technically investigate?";
  const bwSteps = authoritativeProcedure(bwQuestion, bwContext, "STAGE_INVESTIGATION");
  assert.ok(bwSteps.some((step) => /RSRT or RSRT2/.test(step)));
  assert.ok(bwSteps.some((step) => /RSECADMIN/.test(step)));
  assert.ok(bwSteps.some((step) => /final check result/.test(step)));
  assert.ok(bwSteps.some((step) => /query variables and filters/.test(step)));
  assert.doesNotMatch(bwSteps.join(" "), /Sources checked|help\.sap\.com|https?:\/\//i, "source notes stay out of the spoken answer");
  assert.doesNotMatch(bwSteps.join(" "), /PFCG first/i);

  const ariba = fs.readFileSync(path.join(root, "knowledge/lob/ariba-security.md"), "utf8");
  const aribaHeading = "### Troubleshooting: a user can sign in but cannot perform a procurement action";
  const aribaStart = ariba.indexOf(aribaHeading);
  assert.notEqual(aribaStart, -1, "Ariba source procedure must exist");
  const aribaRest = ariba.slice(aribaStart);
  const aribaEnd = aribaRest.slice(aribaHeading.length).search(/\n## /);
  const aribaSection = aribaEnd < 0 ? aribaRest : aribaRest.slice(0, aribaHeading.length + aribaEnd);
  const aribaQuestion = "How do you troubleshoot an Ariba user who can sign in but cannot create a purchase requisition?";
  const aribaSteps = authoritativeProcedure(aribaQuestion,
    `### SOURCE: lob/ariba-security.md | SECTION: ${aribaHeading}\n${aribaSection}`,
    "STAGE_INVESTIGATION");
  assert.ok(aribaSteps.length >= 4, "retain Ariba's ordered diagnostic sequence");
  assert.match(aribaSteps.join(" "), /correct realm[\s\S]*User Groups view[\s\S]*Purchasing User \/ PUR001/i);
  assert.doesNotMatch(aribaSteps.join(" "), /\/IWFND\/ERROR_LOG|Which of those do you want/);
  assert.doesNotMatch(aribaSteps.join(" "), /Sources checked|help\.sap\.com|https?:\/\//i);

  const ias = fs.readFileSync(path.join(root, "knowledge/btp/ias.md"), "utf8");
  const iasHeading = "## Troubleshooting: IAS sign-in succeeds but a BTP app denies access";
  const iasStart = ias.indexOf(iasHeading);
  assert.notEqual(iasStart, -1, "IAS/BTP source procedure must exist");
  const iasRest = ias.slice(iasStart);
  const iasEnd = iasRest.slice(iasHeading.length).search(/\n## /);
  const iasSection = iasEnd < 0 ? iasRest : iasRest.slice(0, iasHeading.length + iasEnd);
  const iasQuestion = "An IAS sign-in works but the BTP app denies access. What do I check?";
  const iasSteps = authoritativeProcedure(iasQuestion,
    `### SOURCE: btp/ias.md | SECTION: ${iasHeading}\n${iasSection}`,
    "STAGE_INVESTIGATION");
  assert.ok(iasSteps.length >= 3);
  assert.match(iasSteps.join(" "), /Security > Role Collections[\s\S]*Groups assertion attribute[\s\S]*sign in again/i);
  assert.doesNotMatch(iasSteps.join(" "), /PFCG|SAML configuration fix|change IAS MFA policy/i);

  const hana = fs.readFileSync(path.join(root, "knowledge/hana/hana-authorization.md"), "utf8");
  const hanaHeading = "## Troubleshooting: SAP HANA insufficient privilege error";
  const hanaStart = hana.indexOf(hanaHeading);
  assert.notEqual(hanaStart, -1, "HANA source procedure must exist");
  const hanaRest = hana.slice(hanaStart);
  const hanaEnd = hanaRest.slice(hanaHeading.length).search(/\n## /);
  const hanaSection = hanaEnd < 0 ? hanaRest : hanaRest.slice(0, hanaHeading.length + hanaEnd);
  const hanaQuestion = "SAP HANA returns an insufficient privilege error. What is the technical diagnostic?";
  const hanaSteps = authoritativeProcedure(hanaQuestion,
    `### SOURCE: hana/hana-authorization.md | SECTION: ${hanaHeading}\n${hanaSection}`,
    "STAGE_INVESTIGATION");
  assert.ok(hanaSteps.length >= 3);
  assert.match(hanaSteps.join(" "), /GUID[\s\S]*GET_INSUFFICIENT_PRIVILEGE_ERROR_DETAILS[\s\S]*missing privilege/i);
  assert.doesNotMatch(hanaSteps.join(" "), /Sources checked|help\.sap\.com|https?:\/\//i);

  const iagRules = fs.readFileSync(path.join(root, "knowledge/iag/iag-access-analysis.md"), "utf8");
  const rulesHeading = "## Upload or Update an Access Analysis Ruleset";
  const rulesStart = iagRules.indexOf(rulesHeading);
  assert.notEqual(rulesStart, -1, "IAG ruleset procedure must exist");
  const rulesRest = iagRules.slice(rulesStart);
  const rulesEnd = rulesRest.slice(rulesHeading.length).search(/\n## /);
  const rulesSection = rulesEnd < 0 ? rulesRest : rulesRest.slice(0, rulesHeading.length + rulesEnd);
  const rulesContext = `### SOURCE: iag/iag-access-analysis.md | SECTION: ${rulesHeading}\n${rulesSection}`;
  const rulesQuestion = "How do we upload the rule set in IAG?";
  const rulesSteps = authoritativeProcedure(rulesQuestion, rulesContext, "IMPLEMENTATION_WALKTHROUGH");
  assert.ok(rulesSteps.length >= 5, "retain an ordered IAG Access Analysis ruleset upload sequence");
  assert.match(rulesSteps.join(" "), /Administration > Rule Setup[\s\S]*Business Function Group[\s\S]*Download File[\s\S]*Upload & Process[\s\S]*Processing Log and Validation Log[\s\S]*Manage Jobs[\s\S]*Job Scheduler/i);
  assert.doesNotMatch(rulesSteps.join(" "), /Which of those do you want\?/i);
  const rulesSpoken = renderSpokenProcedure(rulesQuestion, rulesSteps);
  assert.match(rulesSpoken, /Rule Setup[\s\S]*Upload & Process[\s\S]*Processing Log and Validation Log/i);
  assert.doesNotMatch(rulesSpoken, /Direct Answer|Technical Mechanism|Validation and Operational Boundary/);
  assert.doesNotMatch(rulesSpoken, /Which of those do you want\?/i);

  const msmp = fs.readFileSync(path.join(root, "knowledge/grc/msmp.md"), "utf8");
  const msmpHeading = "## Technical Configuration Sequence";
  const msmpStart = msmp.indexOf(msmpHeading);
  assert.notEqual(msmpStart, -1, "MSMP technical configuration procedure must exist");
  const msmpRest = msmp.slice(msmpStart);
  const msmpEnd = msmpRest.slice(msmpHeading.length).search(/\n## /);
  const msmpSection = msmpEnd < 0 ? msmpRest : msmpRest.slice(0, msmpHeading.length + msmpEnd);
  const msmpQuestion = "How do I configure the MSMP workflow for an access request in SAP Access Control?";
  const msmpContext = `### SOURCE: grc/msmp.md | SECTION: ${msmpHeading}\n${msmpSection}`;
  const msmpSteps = authoritativeProcedure(msmpQuestion, msmpContext, "IMPLEMENTATION_WALKTHROUGH");
  assert.ok(msmpSteps.length >= 3, "retain ordered MSMP setup mechanics for a configuration question");
  assert.match(msmpSteps.join(" "), /SPRO[\s\S]*GRFNMW_CONFIGURE[\s\S]*Access Request Approval[\s\S]*BRF\+[\s\S]*RULE_RESULT[\s\S]*Request Status > Instance Status/i);
  assert.doesNotMatch(msmpSteps.join(" "), /View Provisioning Logs only/i, "do not promote an unrelated downstream failure branch into setup steps");

  const fioriQuestion = "In S/4HANA Cloud Public Edition, how would you troubleshoot a user who cannot see a Fiori app?";
  const fioriSource = fs.readFileSync(path.join(root, "knowledge/fiori/fiori-security.md"), "utf8");
  const fioriHeading = "## Public Edition troubleshooting: app is missing";
  const fioriStart = fioriSource.indexOf(fioriHeading);
  assert.notEqual(fioriStart, -1, "Public Edition missing-app procedure must exist");
  const fioriRest = fioriSource.slice(fioriStart);
  const fioriEnd = fioriRest.slice(fioriHeading.length).search(/\n## /);
  const fioriSection = fioriEnd < 0 ? fioriRest : fioriRest.slice(0, fioriHeading.length + fioriEnd);
  const gateway = fs.readFileSync(path.join(root, "knowledge/s4hana/s4hana-security.md"), "utf8");
  const gatewayHeading = "## Troubleshooting: Fiori app opens but a request fails";
  const gatewayStart = gateway.indexOf(gatewayHeading);
  assert.notEqual(gatewayStart, -1, "opened-app Gateway procedure must exist as the negative control");
  const gatewayRest = gateway.slice(gatewayStart);
  const gatewayEnd = gatewayRest.slice(gatewayHeading.length).search(/\n## /);
  const gatewaySection = gatewayEnd < 0 ? gatewayRest : gatewayRest.slice(0, gatewayHeading.length + gatewayEnd);
  const mixedFioriContext = [
    `### SOURCE: s4hana/s4hana-security.md | SECTION: ${gatewayHeading}\n${gatewaySection}`,
    `### SOURCE: fiori/fiori-security.md | SECTION: ${fioriHeading}\n${fioriSection}`
  ].join("\n");
  const fioriSteps = authoritativeProcedure(fioriQuestion, mixedFioriContext, "STAGE_INVESTIGATION");
  assert.ok(fioriSteps.length >= 3, "select a coherent missing-app procedure from mixed diagnostic evidence");
  assert.match(fioriSteps.join(" "), /App Finder[\s\S]*Manage Launchpad Spaces[\s\S]*Maintain Business Users/i);
  assert.doesNotMatch(fioriSteps.join(" "), /\/IWFND\/ERROR_LOG|\/IWBEP\/ERROR_LOG|Gateway deployment/i,
    "a missing Public Edition app must not be answered with the opened-app Gateway failure procedure");

  const customFioriHeading = "## Custom Fiori app: design, build, secure, and deploy";
  const customFioriStart = fioriSource.indexOf(customFioriHeading);
  assert.notEqual(customFioriStart, -1, "current custom Fiori build-and-security procedure must exist");
  const customFioriRest = fioriSource.slice(customFioriStart + customFioriHeading.length).trim();
  const customFioriParagraph = customFioriRest.split(/\n\s*\n/)[0];
  const customFioriProcedureParagraph = customFioriParagraph.split(/\s+(?=Do not use PFCG\b)/i)[0];
  const customFioriBoundary = customFioriParagraph.slice(customFioriProcedureParagraph.length).trim();
  const customFioriQuestion = "How would you create a custom SAP Fiori app and secure it end to end in S/4HANA Cloud Public Edition?";
  const customFioriContext = [
    `### SOURCE: fiori/fiori-security.md | SECTION: Custom Fiori app: design, build, secure, and deploy\n${customFioriProcedureParagraph}`,
    `### SOURCE: fiori/fiori-security.md | SECTION: Overview\n## Overview\n\nFiori authorization separates launchpad visibility from backend execution.`,
    `### SOURCE: fiori/fiori-security.md | SECTION: Custom Fiori app: design, build, secure, and deploy\n${customFioriBoundary}`
  ].join("\n\n");
  const customFioriSteps = authoritativeProcedure(customFioriQuestion, customFioriContext, "IMPLEMENTATION_WALKTHROUGH");
  assert.ok(customFioriSteps.length >= 5, "retain a complete custom Fiori implementation sequence");
  assert.match(customFioriSteps.join(" "), /RAP service[\s\S]*CDS model[\s\S]*service definition and OData service binding[\s\S]*SAP Business Application Studio[\s\S]*SAPUI5 ABAP Repository[\s\S]*IAM app[\s\S]*business catalog[\s\S]*Maintain Business Roles[\s\S]*CDS DCL[\s\S]*Validate service binding preview/i);
  assert.match(customFioriSteps.join(" "), /three-system landscape[\s\S]*side-by-side BTP extension/i,
    "scope Public Edition developer extensibility to its supported landscape and extension options");
  assert.doesNotMatch(customFioriSteps.join(" "), /PFCG role|SEGW service|\/IWFND\/MAINT_SERVICE[^,;]*register|SU53 trace|ST03N/i,
    "a Public Edition Fiori build answer must not prescribe customer-managed ABAP transactions");
  const customFioriSpoken = renderSpokenProcedure(customFioriQuestion, customFioriSteps);
  assert.match(customFioriSpoken, /^For a custom SAP Fiori app in S\/4HANA Cloud Public Edition/);
  assert.match(customFioriSpoken, /SAP Business Application Studio[\s\S]*Maintain Business Roles/);
  assert.match(customFioriSpoken, /Validate service binding preview/);
  assert.doesNotMatch(customFioriSpoken, /Direct Answer|Technical Mechanism|Validation and Operational Boundary/);
  assert.doesNotMatch(customFioriSpoken, /\b(?:assign|maintain|configure|use|create)\s+(?:the\s+)?(?:PFCG|SEGW|\/IWFND\/MAINT_SERVICE|SU53|STAUTHTRACE)\b/i,
    "do not recommend customer-managed ABAP tools for this Public Edition procedure");

  assert.deepEqual(
    authoritativeProcedure("Have you implemented IPS?", knowledge, "EXPERIENCE_CONFIRMATION"),
    [],
    "a technical procedure must not replace a personal-experience answer"
  );

  const chat = fs.readFileSync(path.join(root, "pages/api/chat.js"), "utf8");
  assert.match(chat, /authoritativeProcedure\(procedureQuestion, knowledgeResult\.procedureText \|\| knowledgeContext, interviewContext\.answerScope\)/);
  assert.match(chat, /fitSpokenLength\(\s*renderSpokenProcedure\(effectiveQuestion, alignedSteps\)/);
  assert.match(chat, /\bfitSpokenLength\b/);
  assert.match(chat, /route: "RETRIEVED_PROCEDURE"/);
  assert.match(chat, /writeSSEAnswer\(res, retrievedProcedureAnswer\)/);
  assert.match(chat, /Retrieved procedure retention failed \(non-fatal\)/);

  const prompt = fs.readFileSync(path.join(root, "lib/prompt/interviewPrompt.js"), "utf8");
  assert.match(prompt, /INTERVIEW COPILOT V2\.1 OPERATING CONTRACT/);
  assert.match(prompt, /NATURAL INTERVIEW SPOKEN CADENCE/);
  assert.match(prompt, /RULE 10 — ABSOLUTE RESPONSE COMPLETENESS/);
  assert.match(prompt, /NEVER output Decision:\/Mechanism:\/Governance:\/Validation:/);
  assert.doesNotMatch(prompt, /### 1\. Direct Answer/);
  assert.doesNotMatch(prompt, /three required answer headings/);
  assert.match(prompt, /profile confirms IPS implementation but does not identify an employer or metric[\s\S]*do not attribute it to Dover/);
  const { recallGroundedExperience, formatMemoryCard } = require("./lib/expertiseCards.js");
  const ipsExperience = recallGroundedExperience("Have you implemented IPS?");
  assert.ok(ipsExperience, "retain the explicit IPS experience fact");
  assert.match(formatMemoryCard(ipsExperience), /candidate confirms IPS implementation/i);
  assert.doesNotMatch(formatMemoryCard(ipsExperience), /At Dover|SuccessFactors|three days|SCIM HTTP payload/i,
    "an IPS yes/no question must not inherit unsupported employer, source, or incident claims");
  const { resolvePreparedScript } = require("../lib/scriptMatch.js");
  const ipsConfirmation = resolvePreparedScript("Have you personally implemented IPS?");
  assert.equal(ipsConfirmation?.id, "ips-implementation-confirmation");
  assert.match(ipsConfirmation.answer, /^Yes, I have implemented SAP Identity Provisioning/);
  assert.doesNotMatch(ipsConfirmation.answer, /Direct Answer|Technical Mechanism|Validation and Operational Boundary/);
  assert.equal(resolvePreparedScript("Have you implemented IPS for SuccessFactors?"), null,
    "do not affirm an undocumented IPS source-system implementation as a candidate fact");

  const { register } = require("node:module");
  const { pathToFileURL } = require("node:url");
  await register(pathToFileURL(path.join(__dirname, "lib/extlessResolveHook.mjs")).href);
  const { buildSapInterviewPrompt, scaleResponseLength, normalizeResponseLength } = await import("../lib/prompt/interviewPrompt.js");
  const { buildReasoningContract } = await import("../lib/reasoningPlanner.js");
  const { resolveInterviewContext } = require("../lib/interviewContext.js");
  const compose = (question, category, knowledgeContext) => {
    const interviewContext = resolveInterviewContext({ questionRaw: question, history: [] });
    const analysis = { category, secondaryCategories: [], domain: "", isFollowUp: false, interviewContext };
    const reasoningContract = buildReasoningContract(question, analysis);
    return {
      reasoningContract,
      prompt: buildSapInterviewPrompt({
        question,
        analysis,
        reasoningContract,
        interviewContext,
        knowledgeContext,
        technicalReasoning: {},
        sapComponents: []
      })
    };
  };
  const recovery = compose(
    "How would you recover a slipping security workstream without dropping quality?",
    "Security",
    "SOURCE: usage.md\nReview ST03N, AGR_USERS, PFCG, and SU24 before changing roles."
  );
  assert.equal(recovery.reasoningContract.deliveryQuestion, true);
  assert.equal(recovery.reasoningContract.requireTechnicalArtifacts, false);
  assert.match(recovery.prompt, /integrated workplan/);
  assert.match(recovery.prompt, /critical path/);
  assert.doesNotMatch(recovery.prompt, /must name only the relevant verified/);
  assert.doesNotMatch(recovery.prompt, /Name which security plane/);
  assert.doesNotMatch(recovery.prompt, /rewrite it as the SAP Security\/IAM decision/);
  assert.doesNotMatch(recovery.prompt, /={3,}\s*SUPPORTING KNOWLEDGE\s*={3,}/);
  assert.doesNotMatch(recovery.prompt, /MASTER HANDS-ON BANK/);
  assert.doesNotMatch(recovery.prompt, /ST03N supplies usage data/);
  assert.doesNotMatch(recovery.prompt, /use that engagement's tools/);
  const sponsorDelay = compose(
    "How would you communicate a role-design delay to business sponsors?",
    "General",
    "SOURCE: roles.md\nUse PFCG and SU24."
  );
  assert.equal(sponsorDelay.reasoningContract.deliveryQuestion, true);
  assert.doesNotMatch(sponsorDelay.prompt, /must name only the relevant verified/);
  assert.doesNotMatch(sponsorDelay.prompt, /={3,}\s*SUPPORTING KNOWLEDGE\s*={3,}/);
  const derivedRole = compose(
    "Take me through creating a derived role for a new company code in PFCG.",
    "Role Design",
    "SOURCE: roles.md\nMaintain the derived role in PFCG from SU24 proposals."
  );
  assert.equal(derivedRole.reasoningContract.deliveryQuestion, false);
  assert.match(derivedRole.prompt, /completing the (?:intended )?business action|completes the business (?:action|transaction)/);
  const cutoverProof = compose(
    "Can you prove cutover succeeded with a clean SU53?",
    "Cutover",
    "SOURCE: cutover.md\nPost-cutover verification uses SUIM and the business transaction."
  );
  assert.equal(cutoverProof.reasoningContract.deliveryQuestion, false);
  assert.match(cutoverProof.prompt, /does not report that a check succeeded/);
  const cutoverPlan = compose(
    "A vendor delay is affecting the cutover plan. What would you do?",
    "PMP",
    "SOURCE: plan.md\nResequence the critical path."
  );
  assert.equal(cutoverPlan.reasoningContract.deliveryQuestion, true);
  assert.equal(derivedRole.reasoningContract.requireTechnicalArtifacts, true);
  assert.match(derivedRole.prompt, /Name only plane-correct artifacts|must name only the relevant verified/);
  assert.match(derivedRole.prompt, /NATURAL INTERVIEW SPOKEN CADENCE|2 to 3 fluid paragraphs|2–3 fluid paragraphs/);
  assert.doesNotMatch(derivedRole.prompt, /^\* \*\*Decision:\*\*/m);
  assert.match(derivedRole.prompt, /PFCG/);
  assert.match(derivedRole.prompt, /SU24/);
  assert.match(derivedRole.prompt, /transaction ST03N supplies usage data/);
  assert.match(derivedRole.prompt, /tables AGR_USERS/);
  assert.match(derivedRole.prompt, /not proof that access succeeded|failed-check display alone is not success proof/);
  assert.match(derivedRole.prompt, /a table is not a transaction/i);
  assert.match(derivedRole.prompt, /Derive from Role/);
  assert.match(derivedRole.prompt, /independent copy is not derivation/);
  const authorizationError = compose(
    "A user gets an authorization error after FB01. How would you investigate?",
    "Troubleshooting",
    "SOURCE: auth.md\nStart with SU53."
  );
  assert.equal(authorizationError.reasoningContract.deliveryQuestion, false);
  assert.match(authorizationError.prompt, /Name only plane-correct artifacts|must name only the relevant verified/);
  assert.match(authorizationError.prompt, /SUPPORTING KNOWLEDGE/);

  const syncKnowledge = [
    "### SOURCE: grc/authorization-sync.md | SECTION: Troubleshooting",
    "Common issue: a user's access review shows access they no longer have. Root cause: Authorization Sync hasn't run since the access was removed. Resolution: trigger a sync and re-verify the review data before finalizing certification."
  ].join("\n");
  assert.deepEqual(
    authoritativeProcedure("How would you troubleshoot an SoD issue?", syncKnowledge, "STAGE_INVESTIGATION"),
    [],
    "a neighboring authorization-sync symptom must not answer a general SoD question"
  );
  const userSyncKnowledge = [
    "### SOURCE: grc/user-sync.md | SECTION: Troubleshooting",
    "Common issue: a terminated employee still appears as active in GRC. Root cause: User Sync hasn't run since the termination. Resolution: trigger an immediate sync.",
    "Common issue: a requester can't find a user in the ARM request form search. Root cause: User Sync hasn't captured that user yet. Resolution: trigger a sync or verify the new user was included in sync scope.",
    "Common issue: reporting shows incorrect department or location groupings. Root cause: stale user attribute data. Resolution: trigger a sync and validate attribute accuracy against the source system."
  ].join("\n");
  assert.deepEqual(
    authoritativeProcedure("How would you troubleshoot an SoD risk that fires on a clean-looking role?", userSyncKnowledge, "STAGE_INVESTIGATION"),
    [],
    "a user-sync termination symptom must not answer an SoD risk question"
  );
  assert.ok(
    authoritativeProcedure("The access review shows access they no longer have. How would you troubleshoot it?", syncKnowledge, "STAGE_INVESTIGATION").length >= 3
  );
  const spokenCheck = renderSpokenProcedure("missing app", [
    "If the app is in App Finder but absent from the expected page, inspect the role's space assignment.",
    "If it is absent from App Finder, confirm the business role and catalog.",
    "Use Display Authorization Trace only after the app opens and a runtime check fails."
  ]);
  assert.match(spokenCheck, /If the app is in App Finder but absent from the expected page[\s\S]*If it is absent from App Finder/);
  assert.doesNotMatch(spokenCheck, /Direct Answer|Technical Mechanism|Validation and Operational Boundary/);

  const fioriFile = fs.readFileSync(path.join(root, "knowledge/fiori/fiori-security.md"), "utf8");
  const accessQuestion = "If the user cannot access a Fiori app, how do you troubleshoot?";
  const accessSteps = authoritativeProcedure(accessQuestion, fioriFile, "STAGE_INVESTIGATION");
  assert.ok(accessSteps.length >= 3, "the generic Fiori troubleshooting procedure must be speakable");
  const accessSpoken = renderSpokenProcedure(accessQuestion, accessSteps);
  assert.match(accessSpoken, /missing|cannot see/i);
  assert.match(accessSpoken, /Public Edition/);
  assert.match(accessSpoken, /on-premise|on premise/i);
  assert.match(accessSpoken, /complete the intended business task/i);
  assert.doesNotMatch(accessSpoken, /Direct Answer|Technical Mechanism|Validation and Operational Boundary/);
  const onPremQuestion = `${accessQuestion} Follow-up: What if my server was on premise?`;
  const onPremSteps = authoritativeProcedure(onPremQuestion, fioriFile, "STAGE_INVESTIGATION");
  const onPremSpoken = renderSpokenProcedure(onPremQuestion, onPremSteps);
  assert.match(onPremSpoken, /PFCG/);
  assert.match(onPremSpoken, /\/IWFND\/ERROR_LOG/);
  assert.match(onPremSpoken, /SU53/);
  assert.match(onPremSpoken, /not proof of success|not proof that access succeeded|rather than proof of success/i);
  assert.doesNotMatch(onPremSpoken, /Maintain Business Users/);
  assert.doesNotMatch(onPremSpoken, /Direct Answer|Technical Mechanism/);

  const joule = fs.readFileSync(path.join(root, "knowledge/btp/joule-security.md"), "utf8");
  const jouleHeading = "## 30 Second Interview Answer";
  const jouleStart = joule.indexOf(jouleHeading);
  assert.notEqual(jouleStart, -1, "Joule spoken procedure must exist");
  const jouleRest = joule.slice(jouleStart);
  const jouleEnd = jouleRest.slice(jouleHeading.length).search(/\n## /);
  const jouleSection = jouleEnd < 0 ? jouleRest : jouleRest.slice(0, jouleHeading.length + jouleEnd);
  const jouleQuestion = "How is identity and access administered for SAP Joule?";
  const jouleSteps = authoritativeProcedure(jouleQuestion, `## 30 Second Interview Answer\n${jouleSection}`, "");
  assert.ok(jouleSteps.length >= 3, "Joule administration must stay a retrieved procedure");
  assert.match(jouleSteps.join(" "), /Trust Configuration/);
  assert.match(jouleSteps.join(" "), /Global User ID/);
  assert.match(jouleSteps.join(" "), /joule_tenant_admin/);
  assert.match(jouleSteps.join(" "), /joule_analytics_admin/);
  assert.match(jouleSteps.join(" "), /joule_end_user/);
  assert.match(jouleSteps.join(" "), /Do not assign an S\/4HANA business role or a PFCG role/);

  const roleQuestion = "What's the sequence to generate and assign a new single role?";
  const roleFile = fs.readFileSync(path.join(root, "knowledge/security/pfcg.md"), "utf8");
  const roleHeading = "## Generate and assign a single role";
  const roleStart = roleFile.indexOf(roleHeading);
  assert.notEqual(roleStart, -1);
  const roleRest = roleFile.slice(roleStart);
  const roleEnd = roleRest.slice(roleHeading.length).search(/\n## /);
  const roleSection = roleEnd < 0 ? roleRest : roleRest.slice(0, roleHeading.length + roleEnd);
  const roleSteps = authoritativeProcedure(roleQuestion, roleSection, "IMPLEMENTATION_WALKTHROUGH");
  const roleSpoken = renderSpokenProcedure(roleQuestion, roleSteps);
  assert.ok(roleSteps.length >= 3, "single-role sequence must be a retrieved procedure");
  assert.match(roleSpoken, /AGR_USERS/);
  assert.doesNotMatch(roleSpoken, /transaction AGR_USERS/i);
  assert.match(roleSpoken, /table AGR_USERS|Table AGR_USERS/);
  assert.match(roleSpoken, /SU53/);
  assert.match(roleSpoken, /does not treat that display as proof|not proof|do not treat that display/i);

  const rolloutQuestion = "How would you design Fiori security for a new S/4 rollout?";
  const rolloutFile = fs.readFileSync(path.join(root, "knowledge/fiori/fiori-security.md"), "utf8");
  const rolloutHeading = "## Design Fiori security for an S/4 rollout";
  const rolloutStart = rolloutFile.indexOf(rolloutHeading);
  assert.notEqual(rolloutStart, -1);
  const rolloutRest = rolloutFile.slice(rolloutStart);
  const rolloutEnd = rolloutRest.slice(rolloutHeading.length).search(/\n## /);
  const rolloutSection = rolloutEnd < 0 ? rolloutRest : rolloutRest.slice(0, rolloutHeading.length + rolloutEnd);
  const rolloutSteps = authoritativeProcedure(rolloutQuestion, rolloutSection, "");
  const rolloutSpoken = renderSpokenProcedure(rolloutQuestion, rolloutSteps);
  assert.ok(rolloutSteps.length >= 3, "Fiori rollout design must be a retrieved procedure");
  assert.match(rolloutSpoken, /Public Edition does not use PFCG/);
  assert.match(rolloutSpoken, /Maintain Business Roles/);
  assert.match(rolloutSpoken, /SU53/);
  assert.match(rolloutSpoken, /not treat that display as proof|does not prove|do not treat that display/i);
  assert.match(rolloutSpoken, /complete the intended business task/);

  const processControl = fs.readFileSync(path.join(root, "knowledge/grc/process-control.md"), "utf8");
  const manualTestQuestion = "How would you implement a manual control test plan in SAP GRC Process Control?";
  const manualTestSteps = authoritativeProcedure(manualTestQuestion, processControl, "IMPLEMENTATION_WALKTHROUGH");
  const manualTestAnswer = renderSpokenProcedure(manualTestQuestion, manualTestSteps);
  assert.ok(manualTestSteps.length >= 3, "manual Process Control testing must select its assessment procedure, not transport guidance");
  assert.match(manualTestAnswer, /manual (?:control )?test plan[\s\S]*Planner[\s\S]*Assessments[\s\S]*Pass or Fail[\s\S]*issue owner[\s\S]*retest/i);
  assert.doesNotMatch(manualTestAnswer, /transport request|production import/i);

  const hanaViewQuestion = "A HANA user can connect but cannot read one view. What checks isolate the access boundary?";
  const hanaViewSteps = authoritativeProcedure(hanaViewQuestion,
    `### SOURCE: hana/hana-authorization.md | SECTION: ${hanaHeading}\n${hanaSection}`,
    "STAGE_INVESTIGATION");
  const hanaSpoken = fitSpokenLength(renderSpokenProcedure(hanaViewQuestion, hanaViewSteps), "concise", hanaViewQuestion);
  assert.match(hanaSpoken, /GET_INSUFFICIENT_PRIVILEGE_ERROR_DETAILS/,
    "length fitting must preserve dotted procedure names inside code spans");
  assert.match(hanaSpoken, /object, schema, object type, and missing privilege/i,
    "concise troubleshooting must retain evidence used to isolate the affected object");

  assert.equal(normalizeResponseLength("interview"), "medium");
  assert.equal(normalizeResponseLength("concise"), "concise");
  assert.equal(scaleResponseLength(700, "medium"), 2048);
  assert.equal(scaleResponseLength(700, "concise"), 2048);
  assert.equal(scaleResponseLength(700, "lengthy"), 2048);
  const concisePrompt = buildSapInterviewPrompt({ question: roleQuestion, analysis: { category: "Implementation", secondaryCategories: [] }, responseLength: "concise" });
  const lengthyPrompt = buildSapInterviewPrompt({ question: roleQuestion, analysis: { category: "Implementation", secondaryCategories: [] }, responseLength: "lengthy" });
  assert.match(concisePrompt, /Selected response length is concise/);
  assert.match(lengthyPrompt, /Selected response length is lengthy/);
  assert.match(fs.readFileSync(path.join(root, "pages/interview.js"), "utf8"), /responseLength: currentConfig\.responseLength \|\| "medium"/);
  assert.doesNotMatch(fs.readFileSync(path.join(root, "pages/interview.js"), "utf8"), /responseLength: "interview"/);

  console.log("procedureRetentionAssert: PASS");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
