const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const ips = fs.readFileSync(path.join(root, "knowledge/btp/ips.md"), "utf8");
const heading = "### Failed entities and missing target accounts: evidence-led triage";
const start = ips.indexOf(heading);
assert.notEqual(start, -1, "IPS source procedure must exist");
const rest = ips.slice(start);
const nextSection = rest.slice(heading.length).search(/\n## /);
const sourceSection = nextSection < 0 ? rest : rest.slice(0, heading.length + nextSection);
const knowledge = `### SOURCE: btp/ips.md | SECTION: Failed entities and missing target accounts: evidence-led triage\n${sourceSection}`;

(async () => {
  const { authoritativeProcedure, renderSpokenProcedure } = await import("../lib/procedureRetention.js");
  const question = "An IPS job ended with failed entities and target accounts are missing. How would you technically triage it?";
  const steps = authoritativeProcedure(question, knowledge, "STAGE_INVESTIGATION");

  assert.ok(steps.length >= 5, "keep the ordered, evidence-led IPS triage sequence");
  assert.match(steps[0], /Scope one entity/);
  assert.ok(steps.some((step) => /Provisioning Logs > Job Logs/.test(step)));
  assert.ok(steps.some((step) => /Failed Entities/.test(step)));
  assert.ok(steps.some((step) => /error-log ZIP/.test(step)));
  assert.ok(steps.some((step) => /source Read and Failed; source Skipped; target Created, Updated, Deleted, Skipped, and Failed/.test(step)));
  assert.ok(steps.some((step) => /For skipped entities compare transformation conditions/.test(step)));
  assert.ok(steps.some((step) => /target-write failure/.test(step)));
  assert.doesNotMatch(steps.join(" "), /leaver|deprovision|manual deactivat|deduplication|SU01|PFCG/i);

  const spoken = renderSpokenProcedure(question, steps);
  assert.match(spoken, /^I would do it in this order\./);
  assert.match(spoken, /Missing accounts may be unread or skipped/);

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
  assert.doesNotMatch(rulesSpoken, /Which of those do you want\?/i);

  assert.deepEqual(
    authoritativeProcedure("Have you implemented IPS?", knowledge, "EXPERIENCE_CONFIRMATION"),
    [],
    "a technical procedure must not replace a personal-experience answer"
  );

  const chat = fs.readFileSync(path.join(root, "pages/api/chat.js"), "utf8");
  assert.match(chat, /authoritativeProcedure\(effectiveQuestion, knowledgeContext, interviewContext\.answerScope\)/);
  assert.match(chat, /promptPayload\.expectedSpokenAnswer = renderSpokenProcedure\(effectiveQuestion, steps\)/);
  assert.match(chat, /Retrieved procedure retention failed \(non-fatal\)/);

  const prompt = fs.readFileSync(path.join(root, "lib/prompt/interviewPrompt.js"), "utf8");
  assert.match(prompt, /For an answerable technical question, do not respond by asking the interviewer to choose between adjacent interpretations/);

  console.log("procedureRetentionAssert: PASS");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
