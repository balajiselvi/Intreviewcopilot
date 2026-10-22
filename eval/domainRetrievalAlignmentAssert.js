const fs = require("node:fs");
const path = require("node:path");
const { resolveInterviewContext, resolveProductScope } = require("../lib/interviewContext.js");
const { productKnowledgeFolders, selectProductScopedChunks } = require("../lib/productKnowledgeScope.js");
const { searchKnowledge } = require("../services/vectorSearch.js");

const probes = [
  ["ARA", "How do I validate SoD risk coverage before a new role is provisioned?", /ara|risk|sod|ruleset/i],
  ["ARA", "In SAP GRC ARA, user-level analysis misses a role conflict; what should I compare?", /ara|risk|sod|ruleset/i],
  ["ARM", "How should an access request move from approval to target provisioning?", /arm|access.request|provision/i],
  ["ARM", "The request is approved but access is absent in the target; where do I trace it?", /arm|access.request|provision/i],
  ["EAM", "How do I govern Firefighter owners, controllers, and session-log review?", /firefighter|emergency|eam/i],
  ["EAM", "An emergency session log is missing from controller review; how do I investigate?", /firefighter|emergency|eam/i],
  ["BRM", "How do I govern business-role design and risk approval before assignment?", /brm|business.role|role/i],
  ["BRM", "An approved business role does not reflect changed target authorizations; what do I check?", /brm|business.role|role/i],
  ["MSMP/BRF+", "How do I map a BRFplus rule result to the correct MSMP approval path?", /brf|msmp/i],
  ["MSMP/BRF+", "An MSMP request has no agent; how do I trace rule and stage evaluation?", /brf|msmp/i],
  ["Process Control", "How do I implement a manual assessment in SAP GRC Process Control with evidence and retesting?", /process.control|control|assessment/i],
  ["Process Control", "A control assessment fails on incomplete evidence; how do I remediate and retest?", /process.control|control|assessment/i],
  ["SAP Security", "How do I design a least-privilege derived PFCG role and validate it?", /pfcg|security|role/i],
  ["SAP Security", "A user receives an authorization failure after transport; how do I isolate it?", /authorization|security|debug/i],
  ["Fiori", "A tile is absent from the launchpad; what content assignments do I validate?", /fiori|launchpad|catalog/i],
  ["Fiori", "The tile launches but the app fails at runtime; how do I distinguish service from authorization issues?", /fiori|gateway|odata|launchpad/i],
  ["IDM/IAM", "How do I migrate identity provisioning from SAP IDM to Cloud Identity Services?", /idm|identity|provision/i],
  ["IDM/IAM", "An identity transformation provisions the wrong group; how do I trace mapping and target behavior?", /idm|identity|provision/i],
  ["IAS/IPS/BTP", "How do I map IdP groups to BTP role collections through trust configuration?", /btp|identity|cloud/i],
  ["IAS/IPS/BTP", "Users authenticate successfully but lack a BTP application role; where do I diagnose it?", /btp|identity|cloud/i],
  ["SuccessFactors", "How do I grant employee-data access using permission groups and target populations?", /successfactors|permission|rbp/i],
  ["SuccessFactors", "In SuccessFactors RBP, a manager sees employees outside the intended target population; how do I troubleshoot it?", /successfactors|permission|rbp/i],
  ["Ariba", "How do I integrate Ariba user provisioning and role assignment with enterprise identity?", /ariba/i],
  ["Ariba", "Ariba SSO works but a user lacks application access; what do I verify?", /ariba/i],
  ["BW/BW4HANA", "How do I design and transport BW analysis authorizations for data-level access?", /bw|analysis.authorization/i],
  ["BW/BW4HANA", "A query returns excess records for one user; how do I trace analysis authorization?", /bw|analysis.authorization/i],
  ["HANA", "How do I grant least-privilege HANA object access to an application user?", /hana/i],
  ["HANA", "A user can connect to HANA but cannot read a view; what privilege layers do I inspect?", /hana/i],
  ["SAC", "How do I separate SAC role permissions from model data access?", /sac|analytics.cloud/i],
  ["SAC", "In SAP Analytics Cloud, a user opens a story but sees incorrect model data; how do I isolate access controls?", /sac|analytics.cloud/i],
  ["Datasphere/CAR", "How do I restrict Datasphere space and view access for an analytics team?", /datasphere/i],
  ["Datasphere/CAR", "In SAP Customer Activity Repository (CAR), an analytics user has application access but sees no expected data; what do I inspect?", /car|customer.activity|datasphere/i],
  ["RISE/S4", "How do I plan security testing and cutover for a RISE brownfield conversion?", /rise|s4hana|migration/i],
  ["RISE/S4", "After an S/4HANA upgrade, authorization behavior changed; how do I triage it?", /rise|s4hana|migration/i],
  ["SAP Activate", "How do I govern security design and quality gates across Explore and Realize?", /activate|project.management|project/i],
  ["SAP Activate", "Role testing is incomplete near the Realize milestone; how do I recover the schedule?", /activate|project.management|project/i],
  ["PMP/Delivery", "How do I manage RAID, dependencies, and forecasts across SAP security workstreams?", /project.management|delivery|project/i],
  ["PMP/Delivery", "On an SAP GRC program, a vendor delay threatens cutover; how do I govern recovery and escalation?", /project.management|delivery|project|cutover|rollback/i],
  ["Compliance", "How does SAP GRC evidence support SOX ITGC without implying automatic compliance?", /compliance|sox|audit/i],
  ["Compliance", "How do I distinguish GDPR obligations from ISO 27001 controls in an SAP audit?", /compliance|gdpr|iso|audit/i]
];

(async () => {
  const rows = [];
  for (const [domain, question, expectedSource] of probes) {
    const context = resolveInterviewContext({ questionRaw: question, history: [] });
    const folders = productKnowledgeFolders(question);
    const scope = resolveProductScope(context.questionTopic);
    const analysis = { category: scope?.category || context.questionTopic || "General", domain: scope?.domain || context.questionTopic || "", intent: context.questionIntent, primaryIntent: context.questionIntent };
    const ranked = await searchKnowledge(context.retrievalQuery || question, analysis, 10, folders.length ? { metadataFilters: { sourceFolders: folders } } : {});
    const selected = selectProductScopedChunks(question, ranked).slice(0, 6);
    const matching = selected.filter((chunk) => expectedSource.test(`${chunk.sourceFolder}/${chunk.sourceFile} ${chunk.heading || chunk.section}`));
    rows.push({ domain, question, product: context.questionTopic, intent: context.questionIntent, folders, topSources: selected.slice(0, 4).map((chunk) => ({ file: `${chunk.sourceFolder}/${chunk.sourceFile}`, heading: chunk.heading || chunk.section, score: chunk.score })), sourceMatch: matching.length > 0 });
  }
  const failed = rows.filter((row) => !row.sourceMatch);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const output = path.join(__dirname, "results", `domain-retrieval-alignment-${stamp}.json`);
  fs.writeFileSync(output, JSON.stringify({ generatedAt: new Date().toISOString(), mode: "offline-production-retrieval", questionCount: rows.length, seed: null, rows, failed }, null, 2), { flag: "wx" });
  console.log(JSON.stringify({ output, questionCount: rows.length, domainCount: new Set(rows.map((row) => row.domain)).size, failures: failed.map((row) => ({ domain: row.domain, question: row.question, topSources: row.topSources })) }, null, 2));
  if (failed.length) process.exitCode = 1;
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
