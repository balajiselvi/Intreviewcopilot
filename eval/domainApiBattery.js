const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { resolveInterviewContext, resolveProductScope } = require("../lib/interviewContext.js");
const { productKnowledgeFolders, selectProductScopedChunks } = require("../lib/productKnowledgeScope.js");
const { searchKnowledge } = require("../services/vectorSearch.js");

const SEED = 20261021;
const API_BASE_URL = process.env.EVAL_APP_BASE_URL || "http://127.0.0.1:3000";
const API_TIMEOUT_MS = Number(process.env.EVAL_API_TIMEOUT_MS) || 35000;
let randomState = SEED >>> 0;
function randomIndex(length) {
  randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
  return randomState % length;
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

const iagRequired = [
  { id: "IAG-01", q: "How would you configure IAG?", must: [/Cloud Foundry/i, /master data|business processes|risks/i, /Access Analysis/i], mustNot: [/SAP_GRAC_ACCESS_REQUEST|Approvers of Selected Path|BRF\+ decision table/i] },
  { id: "IAG-02", q: "What are the main steps to implement SAP Cloud Identity Access Governance?", must: [/Cloud Foundry/i, /master data/i, /target|application/i], mustNot: [/SAP_GRAC_ACCESS_REQUEST|Approvers of Selected Path/i] },
  { id: "IAG-03", q: "How do you configure IAG Access Analysis?", must: [/Rule Setup|ruleset/i, /Business Function Group|target system/i], mustNot: [/MSMP agent rule|RequestTypeRule/i] },
  { id: "IAG-04", q: "How would you set up access requests in IAG?", must: [/workflow|RequestTypeRule|template/i, /provision/i], mustNot: [/SAP_GRAC_ACCESS_REQUEST|Approvers of Selected Path/i] },
  { id: "IAG-05", q: "How do you configure access certification in IAG?", must: [/campaign|review/i, /evidence|decision|reviewer/i], mustNot: [/MSMP|BRF\+/i] },
  { id: "IAG-06", q: "How would you implement emergency or privileged access with IAG?", must: [/PAM ID|Maintain Privileged Access/i, /provision/i], mustNot: [/GRAC_SPM|GRC firefighter ID/i] },
  { id: "IAG-07", q: "How do you configure IAG role design?", must: [/Role Designer|business role/i, /approver|risk/i], mustNot: [/MSMP agent rule/i] },
  { id: "IAG-08", q: "How do you integrate IAG with SAP Access Control 12.0 on-premise?", must: [/Bridge|Access Control 12\.0/i, /backend|MSMP|connectors/i], mustNot: [/IAG and MSMP are the same/i] },
  { id: "IAG-09", q: "How do you troubleshoot failed IAG access analysis or synchronization?", must: [/synchron|analysis|target/i, /error|evidence|reconcil|job/i], mustNot: [/SAP_GRAC_ACCESS_REQUEST|Approvers of Selected Path/i] },
  { id: "IAG-10", q: "In the connected on-premise GRC system, how do you troubleshoot an MSMP request with no approver?", must: [/MSMP|approver|agent|stage/i, /GRC|request/i], mustNot: [/IAG Access Analysis Rule Setup/i] },
  { id: "IAG-11", q: "How would you build roles in IAG?", must: [/Role Designer, Business Roles/i, /purpose|job function/i, /entitlement|access/i, /target systems|target-side/i], mustNot: [/SAP_GRAC_ACCESS_REQUEST|Approvers of Selected Path|MSMP agent rule|generic IAG service catalogue/i] }
];

const domains = [
  { name: "ARA", folder: "grc", items: [
    { type: "implementation", q: "How would you baseline SoD risks for a new SAP role set before provisioning?", must: [/ruleset|risk|function/i, /role|user/i] },
    { type: "implementation", q: "How do you design an ARA ruleset and govern mitigation ownership?", must: [/ruleset|risk/i, /mitigat|owner/i] },
    { type: "troubleshooting", q: "A user is flagged for a SoD conflict that seems false. How do you isolate it?", must: [/function|risk/i, /authorization|role|false positive/i] },
    { type: "troubleshooting", q: "An ARA role analysis returns a risk absent from user analysis. What do you compare?", must: [/role|user/i, /ruleset|risk|function/i] }
  ]},
  { name: "ARM", folder: "grc", items: [
    { type: "implementation", q: "How do you design an SAP Access Control access request from submission through target provisioning?", must: [/request/i, /approval|MSMP|BRF/i, /provision/i] },
    { type: "implementation", q: "What would you configure and test before enabling a new ARM request type?", must: [/request type/i, /workflow|approval|MSMP/i] },
    { type: "troubleshooting", q: "An ARM request is approved but the target user did not receive access. How do you trace it?", must: [/provision/i, /connector|target|status/i] },
    { type: "troubleshooting", q: "An access request is stuck with no approver. What evidence do you check first?", must: [/MSMP|agent|approver|path/i, /request|status/i] }
  ]},
  { name: "EAM", folder: "grc", items: [
    { type: "implementation", q: "How would you implement Firefighter access with independent owner and controller oversight?", must: [/Firefighter|emergency access/i, /owner|controller/i, /log|review/i] },
    { type: "implementation", q: "How do you make an emergency SAP access session auditable end to end?", must: [/approval|owner/i, /log|review/i, /evidence/i] },
    { type: "troubleshooting", q: "A Firefighter session log never reaches controller review. How do you diagnose it?", must: [/log/i, /sync|repository|controller/i] },
    { type: "troubleshooting", q: "A Firefighter user cannot launch an approved emergency session. What do you validate?", must: [/assignment|owner|role/i, /target|reason/i] }
  ]},
  { name: "BRM", folder: "grc", items: [
    { type: "implementation", q: "How would you design a governed business role lifecycle in SAP GRC BRM?", must: [/business role|technical role/i, /approval|risk/i] },
    { type: "implementation", q: "How do you assess and approve a new business role before assigning it?", must: [/role/i, /risk analysis|SoD|risk/i, /approv/i] },
    { type: "troubleshooting", q: "A BRM role is approved but its generated technical role is incomplete. How do you investigate?", must: [/role/i, /generate|technical|authorization/i] },
    { type: "troubleshooting", q: "After a role change, BRM analysis no longer reflects the target authorizations. What do you verify?", must: [/role|authorization/i, /sync|generate|analysis/i] }
  ]},
  { name: "MSMP-BRFplus", folder: "grc", items: [
    { type: "implementation", q: "How would you attach a BRFplus agent rule to an SAP Access Control MSMP approval stage?", must: [/agent rule|BRF\+/i, /MSMP|stage|path/i] },
    { type: "implementation", q: "How do initiator rules differ from agent rules when configuring an ARM workflow?", must: [/initiator/i, /agent/i, /path|approver/i] },
    { type: "troubleshooting", q: "An MSMP request has no approver after routing. How do you trace the responsible rule and stage?", must: [/MSMP/i, /agent|approver/i, /stage|rule|path/i] },
    { type: "troubleshooting", q: "The BRFplus decision table returns a value but the request follows the wrong path. What do you check?", must: [/rule.result|mapping|decision table/i, /path|MSMP|stage/i] }
  ]},
  { name: "Process-Control", folder: "grc", items: [
    { type: "implementation", q: "How would you implement a manual control test plan in SAP GRC Process Control?", must: [/control/i, /test plan|assessment/i, /evidence|owner/i] },
    { type: "implementation", q: "How do you define control ownership, test evidence, and operating-effectiveness assessment?", must: [/control owner|owner/i, /test|assessment/i, /evidence/i] },
    { type: "troubleshooting", q: "A Process Control assessment failed because evidence was incomplete. How do you remediate and retest?", must: [/evidence/i, /remediat|issue|CAPA/i, /retest|assessment/i] },
    { type: "troubleshooting", q: "An automated control test produces an unexpected result. How do you isolate the cause?", must: [/control/i, /data|test|evidence/i, /result|remediat/i] }
  ]},
  { name: "SAP-Security-Fiori", folder: "security", items: [
    { type: "implementation", q: "How would you design a least-privilege derived PFCG role for an organizational structure?", must: [/PFCG/i, /derived role/i, /authorization/i] },
    { type: "implementation", q: "How do you move a role change through SU24 review, generation, user comparison, and transport?", must: [/SU24/i, /generat|user comparison/i, /transport/i] },
    { type: "troubleshooting", q: "A Fiori tile is visible but the app fails at runtime with an authorization error. How do you separate the layers?", must: [/tile|launchpad|catalog|target mapping/i, /runtime|OData|authorization/i] },
    { type: "troubleshooting", q: "A user cannot see a Fiori app at all. How do you distinguish missing launchpad content from a runtime failure?", must: [/visibility|catalog|space|target mapping/i, /runtime|OData|authorization/i] }
  ]},
  { name: "IDM-IAM-CloudIdentity", folder: "idm", items: [
    { type: "implementation", q: "How would you migrate SAP IDM joiner-mover-leaver provisioning into a hybrid IAS and IPS design?", must: [/IAS/i, /IPS/i, /source|mapping|provision/i] },
    { type: "implementation", q: "How do you separate federation, lifecycle provisioning, governance, and target authorization in SAP IAM?", must: [/IAS|authentication/i, /IPS|provision/i, /IAG|governance/i] },
    { type: "troubleshooting", q: "An IPS source identity is not created in a target after a successful login. How do you trace the failure?", must: [/IPS/i, /mapping|transformation|job/i, /target|provision/i] },
    { type: "troubleshooting", q: "SAML sign-in succeeds but the user is missing from the application. Which identity layers do you inspect?", must: [/SAML|IAS|authentication/i, /IPS|provision/i, /authorization|target/i] }
  ]},
  { name: "BTP", folder: "btp", items: [
    { type: "implementation", q: "How would you configure BTP trust and assign an application role collection to an IAS group?", must: [/trust|identity provider/i, /role collection/i, /IAS|group/i] },
    { type: "implementation", q: "How do you secure an SAP BTP API integration using identity and least-privilege authorization?", must: [/API/i, /OAuth|token|authentication/i, /authorization|role/i] },
    { type: "troubleshooting", q: "A BTP user authenticates through IAS but receives access denied in the application. What do you trace?", must: [/IAS/i, /role collection|authorization/i, /application/i] },
    { type: "troubleshooting", q: "A BTP role collection mapped to an IdP group does not take effect. How do you isolate trust and mapping?", must: [/group|attribute/i, /role collection/i, /trust|sign in|mapping/i] }
  ]},
  { name: "SuccessFactors", folder: "idm", items: [
    { type: "implementation", q: "How do you implement SuccessFactors RBP for employee data while limiting the target population?", must: [/permission role/i, /permission group/i, /target population/i] },
    { type: "implementation", q: "How would you review a SuccessFactors permission role before assigning it to a population?", must: [/role/i, /permission group|target population/i, /employee|data/i] },
    { type: "troubleshooting", q: "A SuccessFactors user can sign in but sees too many employee records. How do you diagnose RBP?", must: [/target population/i, /permission group|role/i] },
    { type: "troubleshooting", q: "A SuccessFactors permission was granted but the action remains unavailable. What do you inspect?", must: [/permission role|RBP/i, /group|target population/i] }
  ]},
  { name: "Ariba", folder: "lob", items: [
    { type: "implementation", q: "How would you provision Ariba users and groups with enterprise SSO and controlled application access?", must: [/Ariba/i, /group|role/i, /SSO|identity|provision/i] },
    { type: "implementation", q: "How do you design least-privilege group assignments for a procurement role in SAP Ariba?", must: [/Ariba/i, /group/i, /realm|solution|permission/i] },
    { type: "troubleshooting", q: "An Ariba user signs in through SSO but cannot create a requisition. What do you check?", must: [/SSO|sign/i, /group|permission/i, /requisition|solution/i] },
    { type: "troubleshooting", q: "A provisioned Ariba identity is in the wrong realm or lacks a role. How do you trace it?", must: [/realm/i, /provision|identity/i, /group|role/i] }
  ]},
  { name: "BW-BW4HANA", folder: "bw", items: [
    { type: "implementation", q: "How do you implement BW analysis authorizations for characteristic-level data access?", must: [/analysis authorizations/i, /characteristic/i, /user|role/i] },
    { type: "implementation", q: "How would you test and transport a BW/4HANA analysis-authorization change?", must: [/analysis authorization/i, /test|query/i, /transport/i] },
    { type: "troubleshooting", q: "A BW query returns no rows for one user but works for another. How do you prove an authorization issue?", must: [/RSECADMIN|analysis authorization/i, /log|query/i, /characteristic|S_RS_AUTH/i] },
    { type: "troubleshooting", q: "A BW user sees data outside the intended business unit. What evidence guides the correction?", must: [/analysis authorization/i, /characteristic|value/i, /query|log/i] }
  ]},
  { name: "HANA", folder: "hana", items: [
    { type: "implementation", q: "How would you design least-privilege HANA roles for an application schema and data access?", must: [/role/i, /object privilege|system privilege/i, /least privilege|schema/i] },
    { type: "implementation", q: "How do you separate HANA object access from data-level analytic restrictions?", must: [/object privilege/i, /analytic|data/i, /role/i] },
    { type: "troubleshooting", q: "A HANA query fails with insufficient privilege. How do you identify the missing privilege without broad grants?", must: [/insufficient privilege/i, /object|privilege/i, /GUID|trace|diagnostic/i] },
    { type: "troubleshooting", q: "A HANA user can connect but cannot read one view. What checks isolate the access boundary?", must: [/view|object/i, /schema|privilege/i, /user|role/i] }
  ]},
  { name: "SAC", folder: "sac", items: [
    { type: "implementation", q: "How do you assign SAC roles and teams while restricting model and folder access?", must: [/role/i, /team/i, /model|folder|data/i] },
    { type: "implementation", q: "How would you validate content permissions separately from data access in SAP Analytics Cloud?", must: [/folder|content/i, /model|data/i, /role|team/i] },
    { type: "troubleshooting", q: "A SAC user can open a story but sees incorrect model data. How do you isolate role versus data restrictions?", must: [/model|data/i, /role|team/i, /permission|access/i] },
    { type: "troubleshooting", q: "A SAC user cannot open a folder despite having a business role. What do you verify?", must: [/folder/i, /team|role/i, /permission|access/i] }
  ]},
  { name: "Datasphere-CAR", folder: "datasphere", items: [
    { type: "implementation", q: "How would you design least-privilege Datasphere space access for an analytics team?", must: [/space/i, /privilege|role/i, /data|view/i] },
    { type: "implementation", q: "How do you secure analytical data access across Datasphere and SAC?", must: [/Datasphere/i, /SAC/i, /space|data/i] },
    { type: "troubleshooting", q: "A Datasphere consumer can see a space but not the required view. How do you trace permissions?", must: [/space/i, /view|object/i, /privilege|permission/i] },
    { type: "troubleshooting", q: "A CAR analytics user has application access but cannot see expected data. How do you isolate the security layer?", must: [/CAR|Customer Activity Repository/i, /data/i, /role|authorization|privilege/i] }
  ]},
  { name: "RISE-S4-Transformation", folder: "rise", items: [
    { type: "implementation", q: "How would you plan the SAP security workstream for a RISE brownfield S/4HANA conversion?", must: [/conversion|brownfield|RISE/i, /role|authorization/i, /test|cutover/i] },
    { type: "implementation", q: "How do you preserve clean-core boundaries while integrating BTP extensions with S/4HANA identity?", must: [/clean core/i, /BTP/i, /identity|authorization/i] },
    { type: "troubleshooting", q: "A migration rehearsal reveals role defects and unresolved SoD risks before go-live. How do you govern the decision?", must: [/risk|SoD/i, /cutover|go-live/i, /remediat|rollback|decision/i] },
    { type: "troubleshooting", q: "After an S/4HANA upgrade, authorization behavior changed in production. How do you triage and validate?", must: [/authorization/i, /trace|SU53|test/i, /transport|regression|validate/i] }
  ]},
  { name: "SAP-Activate", folder: "project-management", items: [
    { type: "implementation", q: "How would you plan the SAP security workstream across Activate Explore, Realize, and Deploy?", must: [/Explore/i, /Realize/i, /Deploy|cutover/i] },
    { type: "implementation", q: "How do you govern security design decisions and quality gates in an SAP Activate project?", must: [/design/i, /quality gate|test/i, /stakeholder|governance/i] },
    { type: "troubleshooting", q: "An SAP Activate Realize milestone is slipping because role testing is incomplete. How do you recover?", must: [/milestone|schedule/i, /test|role/i, /risk|recovery|stakeholder/i] },
    { type: "troubleshooting", q: "A Deploy cutover rehearsal fails on identity dependencies. How do you replan the go-live gate?", must: [/cutover|Deploy/i, /dependency|identity/i, /gate|replan|validate/i] }
  ]},
  { name: "PMP-Delivery", folder: "project-management", items: [
    { type: "implementation", q: "How do you manage RAID, dependencies, milestones, and stakeholder reporting on an SAP security programme?", must: [/risk|issue|dependency/i, /milestone|schedule/i, /stakeholder|report/i] },
    { type: "implementation", q: "How would you establish resource and budget forecasts for parallel SAP security workstreams?", must: [/resource/i, /forecast|budget/i, /dependency|baseline/i] },
    { type: "troubleshooting", q: "A vendor delay threatens a GRC go-live milestone. What recovery and escalation actions do you take?", must: [/vendor|dependency/i, /recovery|milestone|schedule/i, /escalat|stakeholder/i] },
    { type: "troubleshooting", q: "Hypercare ends with a high-severity access defect and unresolved audit evidence. How do you manage handover?", must: [/hypercare|handover/i, /defect|issue/i, /evidence|owner|acceptance/i] }
  ]},
  { name: "Audit-Compliance", folder: "compliance", items: [
    { type: "implementation", q: "How would you use SAP GRC controls and evidence to support SOX ITGC access reviews without claiming automatic compliance?", must: [/SOX|ITGC/i, /access review|SoD|provision/i, /evidence/i, /does not make|does not guarantee|without claiming|not.*automatic compliance/i], mustNot: [/(?:SAP GRC|GRC installation|installing GRC) (?:alone )?(?:guarantees|ensures|certifies) (?:SOX|the company|compliance)/i] },
    { type: "implementation", q: "How do SAP Security controls support GDPR accountability and an ISO 27001 ISMS without replacing the legal or certification obligations?", must: [/GDPR/i, /ISO\s*27001/i, /control|evidence/i], mustNot: [/SAP GRC (?:ensures|guarantees) compliance/i] },
    { type: "troubleshooting", q: "An auditor finds no evidence that terminated users were removed from SAP. How do you remediate and prove operating effectiveness?", must: [/terminated|leaver|remove|deprovision/i, /evidence|log/i, /retest|operating effectiveness/i] },
    { type: "troubleshooting", q: "A SOX access control failed because approvals were missing. How do you contain, remediate, and retest it?", must: [/SOX|control/i, /approval/i, /remediat|retest|evidence/i] }
  ]}
];

function sampleDomainCases() {
  return domains.flatMap((domain) => {
    const implementation = domain.items.filter((item) => item.type === "implementation");
    const troubleshooting = domain.items.filter((item) => item.type === "troubleshooting");
    return [
      { ...domain, ...implementation[randomIndex(implementation.length)] },
      { ...domain, ...troubleshooting[randomIndex(troubleshooting.length)] }
    ];
  });
}

function parseStream(raw) {
  let answer = "";
  const events = [];
  for (const block of raw.split(/\r?\n\r?\n/)) {
    const event = block.match(/^event:\s*(.+)$/m)?.[1] || "message";
    const line = block.split(/\r?\n/).find((row) => row.startsWith("data: "));
    if (!line || line.slice(6) === "[DONE]") continue;
    const data = line.slice(6);
    try {
      const payload = JSON.parse(data);
      events.push({ event, payload });
      if (payload?.text) answer += payload.text;
    } catch {
      answer += data;
    }
  }
  return { answer: answer.trim(), events };
}

async function inspectRetrieval(question, context) {
  const scope = productKnowledgeFolders(question);
  const product = resolveProductScope(context.questionTopic);
  const analysis = {
    category: product?.category || context.questionTopic || "General",
    domain: product?.domain || context.questionTopic || "",
    primaryIntent: context.questionIntent,
    intent: context.questionIntent
  };
  const raw = await searchKnowledge(context.retrievalQuery || question, analysis, 12, scope.length ? { metadataFilters: { sourceFolders: scope } } : {});
  const selected = selectProductScopedChunks(question, raw);
  return {
    allowedFolders: scope,
    topSources: selected.slice(0, 6).map((chunk) => ({
      sourceFolder: chunk.sourceFolder,
      sourceFile: chunk.sourceFile,
      heading: chunk.heading || chunk.section,
      score: chunk.score
    }))
  };
}

async function requestApi(question, responseLength, history = []) {
  const startedAt = Date.now();
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question, model: "gpt-4o-mini", history, responseLength, debug: true }),
    signal: AbortSignal.timeout(API_TIMEOUT_MS)
  });
  const raw = await response.text();
  return { status: response.status, durationMs: Date.now() - startedAt, terminated: raw.includes("data: [DONE]"), ...parseStream(raw) };
}

function evaluate(item, context, retrieval, api) {
  const flattened = api.answer.replace(/\s+/g, " ");
  const failures = [];
  if (api.status !== 200) failures.push(`HTTP ${api.status}`);
  if (!flattened) failures.push("empty visible answer");
  if (!api.terminated) failures.push("SSE stream did not terminate");
  if (item.topic && context.questionTopic !== item.topic) failures.push(`product resolved ${context.questionTopic}, expected ${item.topic}`);
  if (item.scope && context.answerScope !== item.scope) failures.push(`scope resolved ${context.answerScope}, expected ${item.scope}`);
  for (const pattern of item.must || []) if (!pattern.test(flattened)) failures.push(`missing expected criterion ${pattern}`);
  for (const pattern of item.mustNot || []) if (pattern.test(flattened)) failures.push(`forbidden cross-product procedure ${pattern}`);
  if (item.id === "IAG-01" && /SAP_GRAC_ACCESS_REQUEST|Approvers of Selected Path|BRF\+ decision table/i.test(flattened)) failures.push("generic IAG answer contains GRC MSMP implementation");
  return failures;
}

(async () => {
  const branch = execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
  const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const extra = sampleDomainCases();
  const cases = shuffle([
    ...iagRequired.map((item) => ({ ...item, topic: item.id === "IAG-10" ? "GRC" : "IAG", scope: item.id === "IAG-09" || item.id === "IAG-10" ? "STAGE_INVESTIGATION" : undefined })),
    ...extra
  ]);
  const rows = [];
  for (let index = 0; index < cases.length; index += 1) {
    const item = cases[index];
    const context = resolveInterviewContext({ questionRaw: item.q, history: [] });
    let retrieval = { allowedFolders: productKnowledgeFolders(item.q), topSources: [], error: null };
    try { retrieval = { ...(await inspectRetrieval(item.q, context)), error: null }; }
    catch (error) { retrieval.error = String(error.message || error); }
    let api;
    try { api = await requestApi(item.q, index % 3 === 0 ? "concise" : index % 3 === 1 ? "medium" : "lengthy"); }
    catch (error) { api = { status: 0, answer: "", events: [], error: String(error.message || error) }; }
    const answer = api.answer || "";
    const row = {
      id: item.id || `${item.name}-${item.type}-${index}`,
      domain: item.name || "IAG",
      task: item.type || "implementation",
      question: item.q,
      resolved: { topic: context.questionTopic, intent: context.questionIntent, answerScope: context.answerScope, retrievalDecision: context.retrievalDecision },
      responseLength: index % 3 === 0 ? "concise" : index % 3 === 1 ? "medium" : "lengthy",
      answerPath: api.events.find((event) => event.event === "admission")?.payload?.route || api.events.find((event) => event.event === "retrieval_only")?.payload?.route || "unreported",
      events: api.events.filter((event) => ["admission", "generation", "context", "retrieval_only"].includes(event.event)).map((event) => ({ event: event.event, payload: event.payload })),
      retrieval,
      httpStatus: api.status,
      durationMs: api.durationMs ?? null,
      streamTerminated: api.terminated ?? false,
      answer,
      wordCount: answer ? answer.split(/\s+/).length : 0,
      failures: evaluate(item, context, retrieval, api)
    };
    rows.push(row);
    console.log(`${row.id} | ${row.answerPath} | ${row.wordCount}w | ${row.failures.length ? "FAIL" : "ok"}`);
  }
  const createdAt = new Date().toISOString();
  const safeStamp = createdAt.replace(/[:.]/g, "-");
  let output = path.join(__dirname, "results", `domain-api-seed-${SEED}-${safeStamp}.json`);
  let suffix = 1;
  while (fs.existsSync(output)) output = path.join(__dirname, "results", `domain-api-seed-${SEED}-${safeStamp}-${suffix++}.json`);
  const report = {
    createdAt,
    mode: "live-http-api-and-production-retrieval",
    baseUrl: API_BASE_URL,
    timeoutMs: API_TIMEOUT_MS,
    serverProcess: process.env.EVAL_SERVER_IDENTITY || "Not supplied",
    branch,
    head,
    seed: SEED,
    iagRequiredCases: iagRequired.length,
    sampledDomains: domains.map((domain) => domain.name),
    domainCaseCount: extra.length,
    totalCases: rows.length,
    completed: rows.filter((row) => row.httpStatus === 200 && row.answer).length,
    failed: rows.filter((row) => row.failures.length).length,
    rows
  };
  fs.writeFileSync(output, JSON.stringify(report, null, 2), { flag: "wx" });
  console.log(JSON.stringify({ output, totalCases: report.totalCases, completed: report.completed, failed: report.failed, seed: SEED }));
  if (report.failed) process.exit(1);
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
