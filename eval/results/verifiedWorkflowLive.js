/**
 * Live /api/chat check for the verified-workflow route.
 * Local diagnostic. node eval/results/verifiedWorkflowLive.js
 */
const fs = require("fs");
const path = require("path");

const once = [
  ["workflow", "How do you configure the IAG workflow?", "iag-workflow-determination", /RequestTypeRule/, /Ruleset Management/],
  ["template", "What is a workflow template in IAG?", "iag-workflow-determination", /pre-delivered path/, /Ruleset Management/],
  ["search", "Explain search and trigger in IAG.", "iag-search-trigger", /lookup/, /RequestTypeRule/],
  ["pam", "How do you set up privileged access in IAG?", "iag-pam-setup", /Maintain Privileged Access/, /Network Access Node/],
  ["pamid", "How do you create a PAM ID for a team in IAG?", "iag-pam-setup", /Provisioning/, /create a user in IPS/],
  ["vs", "How is an IAG PAM ID created compared with a GRC firefighter ID?", "iag-pam-setup", /Maintain Privileged Access/, /Network Access Node/],
  ["owners", "Who are the PAM owners and controllers in IAG?", "iag-owners", /IAG_WF_MANAGER/, /RequestTypeRule/],
  ["role", "How does role owner mapping work in IAG?", "iag-role-owner", /Assignment Approver/, /RequestTypeRule/],
  ["requestor", "How do you allow a user to raise an access request in IAG?", "iag-requestor", /Identity Authentication/, /IAG_REQUESTOR/],
  ["ruleset-holdout", "How does the standard cloud risk content get into IAG Access Analysis?", "iag-analysis-ruleset", /GRC-IAG-AA/, /RequestTypeRule/],
  ["policy-holdout", "What limits the systems a requestor can search in IAG?", "iag-request-policy", /search/, /RequestTypeRule/],
  ["s4", "How do you maintain a business role in S/4HANA Public Cloud?", "s4-public-cloud-role", /Maintain Business Roles/, /GRAC_SPM/],
  ["sf", "How do you grant SuccessFactors permissions?", "sf-rbp", /Manage Permission Roles/, /PFCG/],
  ["btp", "How do you assign a BTP role collection?", "btp-role-collection", /role collection/, /PFCG/],
  ["grc", "How does a user start a firefighter session?", "grc-firefighter", /GRAC_SPM/, /Rule Setup/],
  ["script", "What is privileged access?", "PREPARED_SCRIPT", /SAP_ALL|firefighter|privileged/i, /Maintain Privileged Access/],
  ["experience", "Have you set up privileged access in IAG?", "iag-pam-setup", /not an IAG PAM ID/, /I implemented privileged access management in IAG/]
];

const repeated = [
  ["ruleset", "How do you upload or update a ruleset in IAG?", "iag-analysis-ruleset", /Rule Setup/, /RequestTypeRule|open Ruleset Management|click Upload Ruleset/],
  ["policy", "What does authorization policy mean in IAG Access Request?", "iag-request-policy", /search/, /RequestTypeRule/]
];

async function ask(question, sessionId) {
  const response = await fetch("http://127.0.0.1:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      model: "gpt-4o-mini",
      history: [],
      interviewSessionId: sessionId
    })
  });
  const raw = await response.text();
  let text = "";
  let route = "";
  let scriptId = "";
  for (const block of raw.split("\n\n")) {
    const dataLine = block.split("\n").find((row) => row.startsWith("data: "));
    if (!dataLine || dataLine.includes("[DONE]")) continue;
    try {
      const payload = JSON.parse(dataLine.slice(6));
      if (payload.text) text += payload.text;
      if (payload.route) {
        route = payload.route;
        scriptId = payload.scriptId || "";
      }
    } catch { /* ignore non-json */ }
  }
  const modelCalls = /event: generation/.test(raw) ? 1 : 0;
  return { status: response.status, text, route, scriptId, modelCalls };
}

function judge(id, question, expectedRoute, must, mustNot, answer) {
  const routeOk = expectedRoute === "NOT_VERIFIED"
    ? answer.route !== "VERIFIED_WORKFLOW"
    : expectedRoute === "PREPARED_SCRIPT"
      ? answer.route === "PREPARED_SCRIPT"
      : answer.route === "VERIFIED_WORKFLOW" && answer.scriptId === expectedRoute;
  const contentChecked = expectedRoute !== "NOT_VERIFIED";
  return {
    id,
    question,
    status: answer.status,
    route: answer.route,
    workflowId: answer.scriptId,
    modelCalls: answer.modelCalls,
    routeOk,
    must: contentChecked ? must.test(answer.text) : true,
    mustNot: contentChecked ? !mustNot.test(answer.text) : true,
    text: answer.text.slice(0, 1600)
  };
}

(async () => {
  const results = [];
  const jobs = [];
  for (const row of once) jobs.push(row);
  for (const row of repeated) {
    for (let i = 1; i <= 5; i += 1) jobs.push([`${row[0]}-${i}`, row[1], row[2], row[3], row[4]]);
  }
  let n = 0;
  for (const [id, question, expectedRoute, must, mustNot] of jobs) {
    n += 1;
    const sessionId = `live_verified_wf_${String(n).padStart(2, "0")}`;
    const started = Date.now();
    try {
      const answer = await ask(question, sessionId);
      const row = judge(id, question, expectedRoute, must, mustNot, answer);
      row.ms = Date.now() - started;
      results.push(row);
      console.log(id, row.route, row.workflowId, row.modelCalls, row.routeOk, row.must, row.mustNot, row.ms);
    } catch (error) {
      results.push({ id, question, error: String(error.message || error) });
      console.log(id, "ERROR", error.message || error);
    }
  }
  const out = path.join(__dirname, "verified-workflow-live.json");
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
  const failed = results.filter((row) => row.error || row.routeOk === false || row.must === false || row.mustNot === false || (row.route === "VERIFIED_WORKFLOW" && row.modelCalls !== 0));
  console.log("failed", failed.length, "of", results.length);
  if (failed.length) process.exit(1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
