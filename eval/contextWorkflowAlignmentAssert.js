/**
 * Cross-layer regression contract for context isolation and verified-workflow alignment.
 * Offline only: no provider calls, speech capture, network access, or index rebuild.
 * node eval/contextWorkflowAlignmentAssert.js
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  ANSWER_SCOPES,
  resolveInterviewContext,
  toHistoryContext
} = require("../lib/interviewContext.js");
const { selectVerifiedWorkflow, WORKFLOWS } = require("../lib/verifiedWorkflow.js");
const { admitQuestion } = require("../lib/questionAdmission.js");
const { productKnowledgeFolders, selectProductScopedChunks } = require("../lib/productKnowledgeScope.js");
const { decideInterviewTurn } = require("../lib/turnDecision.js");
const { retrieveCandidatesStage } = require("../services/retrievalService.js");
const chatApiSource = fs.readFileSync(path.join(__dirname, "..", "pages", "api", "chat.js"), "utf8");
assert.match(chatApiSource, /scriptId: verified\.id,\s*sourceFiles: verified\.sourceFiles \|\| \[\]/,
  "verified-workflow SSE admission preserves source provenance");
assert.match(chatApiSource, /scriptId: verified\.id \|\| "",\s*sourceFiles: verified\.sourceFiles \|\| \[\]/,
  "verified-workflow session records preserve source provenance");

function exchange(question, answer = "Previous answer") {
  const context = resolveInterviewContext({ questionRaw: question, history: [] });
  const saved = toHistoryContext(context);
  return {
    context,
    history: [
      { role: "user", content: question, context: saved },
      { role: "assistant", content: answer, context: saved }
    ]
  };
}

// Context rule: same broad SAP product does not make two distinct tasks follow-ups.
const msmpQuestion = "How do I configure the MSMP workflow for an access request in SAP Access Control?";
const msmp = exchange(msmpQuestion);
const brfQuestion = "How do you configure BRF+?";
const brfContext = resolveInterviewContext({ questionRaw: brfQuestion, history: msmp.history });
assert.equal(brfContext.inheritsContext, false, "standalone BRF+ task must not inherit MSMP task context");
assert.equal(brfContext.questionResolved, brfQuestion, "independent question must remain unprefixed");
assert.equal(brfContext.questionTopic, "GRC", "BRF+ must resolve to the GRC lane when standalone");

const nextStep = resolveInterviewContext({ questionRaw: "What is the next step?", history: msmp.history });
assert.equal(nextStep.inheritsContext, true, "elliptical next-step follow-up should inherit context");
assert.match(nextStep.questionResolved, /MSMP workflow.*Follow-up: What is the next step\?/i);

const duplicate = resolveInterviewContext({ questionRaw: msmpQuestion, history: msmp.history });
assert.equal(duplicate.inheritsContext, false, "repeating a complete technical question starts a fresh turn");
assert.equal(duplicate.questionResolved, msmpQuestion, "repeated standalone question must not be duplicated into a chain");

// Context directives without a question mark must preserve constraints for the next turn.
const fiori = exchange("How is Manage Purchase Order authorized in Fiori?");
const displayOnly = resolveInterviewContext({ questionRaw: "Make it display-only.", history: fiori.history });
assert.equal(displayOnly.inheritsContext, true, "a pronoun-led design directive should inherit prior task");
const designHistory = [
  ...fiori.history,
  { role: "user", content: "Make it display-only.", context: toHistoryContext(displayOnly) },
  { role: "assistant", content: "Keep all display-only constraints.", context: toHistoryContext(displayOnly) }
];
const sustainable = resolveInterviewContext({ questionRaw: "How do you keep that design sustainable?", history: designHistory });
assert.equal(sustainable.inheritsContext, true);
assert.match(sustainable.questionResolved, /display-only/i, "follow-up chain must retain earlier design constraint");

const deepDive = resolveInterviewContext({
  questionRaw: "Tell me more.",
  history: [
    { role: "user", content: "Have you done this hands-on?" },
    { role: "assistant", content: "Yes, at Dover Corporation." }
  ]
});
assert.equal(deepDive.inheritsContext, true, "Tell me more requires immediate prior context");
assert.equal(deepDive.answerScope, ANSWER_SCOPES.EXPERIENCE_DEEP_DIVE);

const auditQuestion = "What monitoring strategies and logs (e.g., Security Audit Log, Read Access Logging) would you configure to detect a potential insider threat attempting unauthorized access to sensitive data?";
const auditContext = resolveInterviewContext({ questionRaw: auditQuestion, history: msmp.history });
assert.equal(auditContext.inheritsContext, false, "new audit-monitoring question must not inherit MSMP context");
assert.equal(auditContext.questionTopic, "Authorization");

// Verified-workflow selection is task-specific; keyword overlap alone cannot select a workflow.
const msmpWorkflow = selectVerifiedWorkflow(msmpQuestion);
assert.equal(msmpWorkflow?.id, "grc-msmp-access-request-config");
assert.match(msmpWorkflow.answer, /Maintain MSMP Workflows/i);
assert.match(msmpWorkflow.answer, /Approvers of Selected Path|selected path.*stage|path, stage/i);
assert.doesNotMatch(msmpWorkflow.answer, /GRAC_RULE_BUILD|GRACRISKT|Firefighter/i,
  "an MSMP request must not receive the combined ARA/Firefighter playbook");

const combinedGrc = selectVerifiedWorkflow(
  "How do you configure ARA risk rules and MSMP workflow together in SAP Access Control 12.0?"
);
assert.equal(combinedGrc?.id, "grc-ac12-ara-msmp-config", "combined playbook requires both ARA and MSMP to be named");
// Fix 1: bare BRF+ must not auto-select the MSMP agent-rule verified playbook.
const brfWorkflow = selectVerifiedWorkflow(brfQuestion);
assert.equal(brfWorkflow, null, "bare BRF+ configure must not force the MSMP agent-rule verified playbook");
assert.notEqual(brfWorkflow?.id, "grc-ac12-ara-msmp-config", "BRF+ alone must not select the combined ARA/MSMP playbook");
const brfMsmpWorkflow = selectVerifiedWorkflow("How do you configure a BRF+ agent rule for MSMP?");
assert.equal(brfMsmpWorkflow?.id, "grc-brf-msmp-agent-rule-config", "MSMP-scoped BRF+ ask may use the agent-rule playbook");
assert.match(brfMsmpWorkflow.answer, /BRFPLUS|Define Workflow-Related MSMP Rules/i);

const monitor = selectVerifiedWorkflow(auditQuestion);
assert.equal(monitor?.id, "sal-monitor-sm20-rala");
assert.match(monitor.answer, /SM19|RSAU_CONFIG/i);
assert.match(monitor.answer, /SM20|RSAU_READ_LOG/i);
assert.match(monitor.answer, /Read Access Logging/i);
assert.doesNotMatch(monitor.answer, /free database space/i, "monitoring answer must not become a purge procedure");

const purge = selectVerifiedWorkflow("How do you purge Security Audit Logs in SAP?");
assert.equal(purge?.id, "sal-purge-sm18-rsaupurg", "explicit deletion request must still use the purge workflow");

const genericAuthorization = selectVerifiedWorkflow("How do you troubleshoot an authorization failure when SU53 is blank?");
assert.equal(genericAuthorization?.id, "abap-authorization-trace-su53");
assert.match(genericAuthorization.answer, /STAUTHTRACE/i);
assert.doesNotMatch(genericAuthorization.answer, /Fiori Gateway failure|\/IWFND\/ERROR_LOG/i,
  "a generic SU53 failure must not assume Gateway context");

const gateway = selectVerifiedWorkflow("A Fiori Gateway request fails with HTTP 403. How do you troubleshoot it?");
assert.equal(gateway?.id, "fiori-gateway-error-troubleshoot", "explicit Gateway context must retain its dedicated workflow");
const genericFioriQuestion = "How do you configure an SAP Fiori app in the launchpad?";
assert.equal(selectVerifiedWorkflow(genericFioriQuestion), null,
  "deployment-unspecified Fiori configuration must use retrieval/generation, not a classic ABAP workflow");
assert.equal(decideInterviewTurn({ question: genericFioriQuestion, history: [] }).route, "GENERATION",
  "generic Fiori configuration remains on the normal generation route");
assert.equal(
  selectVerifiedWorkflow("How do you authorize a custom Fiori app through catalog and OData services?"),
  null,
  "catalog/OData authorization without a named classic deployment must not use the legacy Fiori configure playbook"
);
const classicFioriQuestion = "How do you configure a classic SAP Fiori app on-premise with OData V2?";
const classicFiori = selectVerifiedWorkflow(classicFioriQuestion);
assert.equal(classicFiori?.id, "fiori-app-configure",
  "explicit classic ABAP OData V2 configuration retains its verified workflow");
assert.deepEqual(classicFiori?.sourceFiles, ["knowledge/fiori/fiori-security.md"]);
assert.match(classicFiori.answer, /\/UI2\/FLPCM_CUST/);
assert.match(classicFiori.answer, /\/UI2\/FLPAM/);
assert.match(classicFiori.answer, /\/IWFND\/MAINT_SERVICE/);
assert.match(classicFiori.answer, /\/IWFND\/V4_ADMIN/);
assert.match(classicFiori.answer, /S_SERVICE alone is not proof/i);
assert.match(classicFiori.answer, /spaces?\/page|space\/page/i);
assert.doesNotMatch(classicFiori.answer, /keep (?:SU53|STAUTHTRACE|.*logs?).*clean/i);
assert.doesNotMatch(classicFiori.answer, /When tackling a Fiori app for Launchpad/i,
  "classic workflow must not emit the legacy FLPCM-only spoken template");
const classicPrivate = selectVerifiedWorkflow(
  "How do you configure a Fiori app on S/4HANA Cloud Private Edition with OData V2?"
);
assert.equal(classicPrivate?.id, "fiori-app-configure",
  "explicit Private Edition OData V2 configuration retains the classic ABAP workflow");
assert.match(classicPrivate.answer, /\/UI2\/FLPCM_CUST/);
assert.match(classicPrivate.answer, /\/UI2\/FLPAM/);
assert.match(classicPrivate.answer, /\/IWFND\/MAINT_SERVICE/);
assert.equal(
  selectVerifiedWorkflow("How do you configure a Fiori app using OData V4 service groups?"),
  null,
  "OData V4 must not receive the classic OData V2 workflow"
);
assert.equal(
  selectVerifiedWorkflow("In S/4HANA Cloud Public Edition, how do you configure a Fiori app?"),
  null,
  "Fiori Public Edition app configuration must use deployment-aware retrieval rather than a generic role workflow"
);

// Master system prompt must force deployment-lane structure for Fiori configure answers.
const interviewPromptSource = fs.readFileSync(
  path.join(__dirname, "..", "lib", "prompt", "interviewPrompt.js"),
  "utf8"
);
assert.match(interviewPromptSource, /DEPLOYMENT LANES/i,
  "Fiori master prompt declares deployment lanes for configure/launchpad asks");
assert.match(interviewPromptSource, /Spaces\/Pages|Manage Launchpad Spaces/i,
  "Fiori master prompt includes the S/4HANA Spaces/Pages lane");
assert.match(interviewPromptSource, /FLPD_CUST|Launchpad Designer/i,
  "Fiori master prompt includes the Classic FLP Designer lane");
assert.match(interviewPromptSource, /OData V4|\/IWFND\/V4_ADMIN/i,
  "Fiori master prompt includes the OData V4 service-group lane");
assert.equal(selectVerifiedWorkflow("A Fiori tile is missing; what do I check?"), null,
  "missing-tile diagnosis remains separate from an opened-app runtime failure");
assert.equal(selectVerifiedWorkflow("A Fiori app launches but returns OData HTTP 403; how do you troubleshoot?")?.id,
  "fiori-gateway-error-troubleshoot",
  "an opened app with a Gateway failure retains its diagnostic workflow");
assert.equal(selectVerifiedWorkflow("How do you configure Fiori SSO with IAS and SAML?")?.id,
  "fiori-sso-principal-propagation",
  "explicit Fiori SSO questions retain their dedicated workflow");
assert.equal(selectVerifiedWorkflow("How do we upload the rule set in IAG?")?.id, "iag-analysis-ruleset");
assert.equal(selectVerifiedWorkflow(
  "How do you implement a Zero-Trust/Identity-Centric security model within a hybrid landscape containing both on-premises SAP ERP and cloud-native SAP apps?"
), null, "an unqualified hybrid architecture question must not be forced into the IAG bridge workflow");

assert.equal(admitQuestion("Name the Datasphere unit of membership.").decision, "ANSWER",
  "a valid noun-led technical question must be admitted");
assert.equal(new Set(WORKFLOWS.map((workflow) => workflow.id)).size, WORKFLOWS.length,
  "verified workflow identifiers must be unique");

async function verifyFioriRetrievalScope() {
  const indexPath = path.join(__dirname, "..", "data", "knowledgeIndex.json");
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const retrieveScoped = async (question) => {
    const folders = productKnowledgeFolders(question);
    const candidates = await retrieveCandidatesStage({
      provider: { getCandidates: async () => index.chunks },
      query: { question },
      metadataFilters: { sourceFolders: folders }
    });
    const chunks = selectProductScopedChunks(question, candidates);
    return {
      folders,
      chunks,
      ids: chunks.map((chunk) => chunk.id || chunk.chunkId),
      files: [...new Set(chunks.map((chunk) => chunk.sourceFolder + "/" + chunk.sourceFile))]
    };
  };
  const requireChunkText = (chunks, regex, message, sourceFile) => {
    const chunk = chunks.find((candidate) =>
      (!sourceFile || candidate.sourceFile === sourceFile) && regex.test(candidate.content)
    );
    assert.ok(chunk, message);
    return {
      id: chunk.id || chunk.chunkId,
      sourceFile: `${chunk.sourceFolder}/${chunk.sourceFile}`,
      heading: chunk.heading || chunk.section
    };
  };

  const generic = await retrieveScoped(genericFioriQuestion);
  assert.ok(generic.folders.includes("fiori") && generic.folders.includes("s4hana"),
    "generic Fiori configuration retrieves Fiori and S/4HANA source lanes");
  assert.ok(!generic.folders.includes("rise"),
    "deployment-unspecified Fiori configure must not open the RISE private-cloud bank lane");
  assert.ok(generic.chunks.length > 0 && generic.ids.length > 0,
    "generic Fiori configuration retains indexed retrieval candidates");
  assert.ok(generic.files.some((file) => file.endsWith("/fiori-security.md")));
  assert.ok(generic.files.some((file) => file.endsWith("/s4hana-fiori.md")));
  assert.ok(generic.files.some((file) => file.endsWith("/spaces-pages.md") || file.endsWith("/catalogs.md")),
    "generic Fiori configuration retains Spaces/Pages or catalog launchpad sources");
  // Golden QA architect-banks are allowed alongside modern procedure sources (Senior Architect
  // voice mandate). RAP/BAS custom-app digressions remain banned — they are not golden configure sequences.
  assert.ok(
    generic.files.some((file) => /fiori-frontend-security-architect-bank/i.test(file))
      || generic.files.some((file) => file.endsWith("/fiori-security.md")),
    "generic Fiori configuration retains procedure and/or Fiori golden QA bank evidence"
  );
  assert.ok(!generic.chunks.some((chunk) => /custom fiori app:\s*design/i.test(String(chunk.heading || chunk.section || ""))),
    "generic Fiori configuration must not prefer custom-app RAP/BAS digressions");
  const genericEvidence = requireChunkText(
    generic.chunks,
    /Maintain Business Roles|Manage Launchpad Spaces|\/UI2\/FLPCM_CUST|spaces and pages/i,
    "generic retrieval sources preserve deployment-aware Spaces/Pages or classic content guidance"
  );

  const v4Question = "How do you configure a Fiori app using OData V4 service groups?";
  assert.equal(decideInterviewTurn({ question: v4Question, history: [] }).route, "GENERATION");
  const v4 = await retrieveScoped(v4Question);
  const v4VersionEvidence = requireChunkText(
    v4.chunks,
    /OData V4 is managed as a service group/i,
    "retrieval corpus identifies V4 as service-group based",
    "fiori-security.md"
  );
  const v4ToolEvidence = requireChunkText(v4.chunks, /\/IWFND\/V4_ADMIN/,
    "retrieval corpus identifies the release-supported V4 administration tool", "fiori-security.md");
  const v2Evidence = requireChunkText(
    v4.chunks,
    /existing OData V2[\s\S]*?\/IWFND\/MAINT_SERVICE/i,
    "retrieval corpus limits MAINT_SERVICE to applicable OData V2 services",
    "fiori-security.md"
  );

  const publicQuestion = "In S/4HANA Cloud Public Edition, how do you configure a Fiori app?";
  assert.equal(decideInterviewTurn({ question: publicQuestion, history: [] }).route, "GENERATION");
  const publicEdition = await retrieveScoped(publicQuestion);
  assert.ok(!publicEdition.folders.includes("rise"),
    "Public Edition stays out of the private RISE retrieval lane");
  const publicRoleEvidence = requireChunkText(publicEdition.chunks, /Maintain Business Roles/i,
    "Public Edition retrieval uses business-role administration", "s4hana-fiori.md");
  const publicIamEvidence = requireChunkText(publicEdition.chunks, /IAM Apps|IAM app/i,
    "Public Edition retrieval includes IAM app activation/assignment", "fiori-security.md");
  const publicSpacesEvidence = requireChunkText(publicEdition.chunks, /Manage Launchpad Spaces|spaces and pages/i,
    "Public Edition retrieval includes spaces and pages", "s4hana-fiori.md");

  const missingTileQuestion = "A Fiori tile is missing; what do I check?";
  assert.equal(decideInterviewTurn({ question: missingTileQuestion, history: [] }).route, "GENERATION");
  const missingTile = await retrieveScoped(missingTileQuestion);
  // P2: heading stays in metadata; body holds the procedure (no double-heading composition).
  const missingTileEvidence = requireChunkText(
    missingTile.chunks,
    /catalog contains the tile and target mapping|business catalog and IAM app assignment/i,
    "missing tile retrieval targets launchpad content and assignment",
    "catalogs.md");
  assert.match(String(missingTileEvidence.heading || ""), /Check catalog and target mapping for a missing Fiori app/i,
    "missing-tile chunk retains procedure heading as metadata");
  requireChunkText(missingTile.chunks, /I would not start SU53 for a missing app/i,
    "missing-tile guidance does not start with authorization tracing", "catalogs.md");
  const openedFailure = selectVerifiedWorkflow(
    "A Fiori app launches but returns OData HTTP 403; how do you troubleshoot?"
  );
  assert.match(openedFailure.answer, /\/IWFND\/ERROR_LOG/);
  assert.match(openedFailure.answer, /if the evidence identifies a failed authorization check/i);
  assert.match(openedFailure.answer, /only when the release and log point there/i);
  assert.match(openedFailure.answer, /missing tile is a launchpad content and role-assignment problem/i);
  assert.doesNotMatch(openedFailure.answer, /keep .*clean|always.*(?:SU53|STAUTHTRACE)/i,
    "runtime diagnostics must be evidence-driven rather than blanket trace instructions");

  console.log("Fiori retrieval evidence:", JSON.stringify({
    generic: { route: "GENERATION", folders: generic.folders, evidence: genericEvidence },
    classicODataV2: { route: "VERIFIED_WORKFLOW", id: classicFiori.id, sourceFiles: classicFiori.sourceFiles },
    odataV4: {
      route: "GENERATION",
      folders: v4.folders,
      evidence: [v4VersionEvidence, v4ToolEvidence, v2Evidence]
    },
    publicEdition: {
      route: "GENERATION",
      folders: publicEdition.folders,
      evidence: [publicRoleEvidence, publicIamEvidence, publicSpacesEvidence]
    },
    missingTile: { route: "GENERATION", folders: missingTile.folders, evidence: missingTileEvidence },
    openedODataFailure: {
      route: "VERIFIED_WORKFLOW",
      id: openedFailure.id,
      sourceFiles: openedFailure.sourceFiles,
      answerPreview: openedFailure.answer.slice(0, 220)
    }
  }));
}

verifyFioriRetrievalScope().then(() => {
  console.log("contextWorkflowAlignmentAssert: PASS (context isolation, deployment-aware Fiori routing/retrieval, positive controls)");
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
