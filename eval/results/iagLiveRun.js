/**
 * One-off live /api/chat probe. Not a regression suite.
 * node eval/results/iagLiveRun.js
 */
const fs = require("fs");
const path = require("path");

const questions = [
  ["iag-workflow", "How do you configure the IAG workflow?", /IAGWorkflowBusinessRule|RequestTypeRule|Business Rule/, /Workflow Configuration|Create New Workflow|MSMP process/],
  ["iag-template", "What is a workflow template in IAG?", /stage|manager|path/, /blueprint of all SAP workflows/],
  ["iag-ruleset", "How do you upload or update a ruleset in IAG?", /GRC-IAG-AA|Rule Setup|risk-definition/, /risk threshold spreadsheet/],
  ["iag-policy", "What does authorization policy mean in IAG Access Request?", /search|requestor|systems/, /SU53|authorization object S_/],
  ["iag-search", "Explain search and trigger in IAG.", /[Ss]earch/, /MSMP/],
  ["iag-pam", "How do you set up privileged access in IAG?", /Maintain Privileged Access|Reason Code/, /Network Access Node/],
  ["iag-pamid", "How do you create a PAM ID for a team in IAG?", /Maintain Privileged Access|Provisioning/, /create a user in IPS/],
  ["iag-vs-grc", "How is an IAG PAM ID created compared with a GRC firefighter ID?", /provision|target/, /same thing/],
  ["iag-owners", "Who are the PAM owners and controllers in IAG?", /IAG_WF_MANAGER|approver|reviewer/, /contour/],
  ["iag-roleowner", "How does role owner mapping work in IAG?", /Assignment Approver|Content Approver|Role Designer/, /Dover/],
  ["iag-requestor", "How do you allow a user to raise an access request in IAG?", /SCI User Group Sync|role collection|IAS/, /MSMP/],
  ["iag-workflow-repeat", "How do you configure the IAG workflow?", /IAGWorkflowBusinessRule|RequestTypeRule|Business Rule/, /Create New Workflow/],
  ["s4-public", "How do you maintain a business role in S/4HANA Public Cloud?", /Maintain Business Roles|restriction/, /SU24 proposal/],
  ["sf-rbp", "How do you grant SuccessFactors role-based permissions?", /permission role|target population|RBP/i, /PFCG/],
  ["btp-rc", "How do you assign a BTP role collection?", /role collection|role template/i, /PFCG/],
  ["grc-ff", "How does a user start a firefighter session in GRC?", /GRAC_SPM|reason code/i, /Maintain Privileged Access/]
];

async function ask(question) {
  const response = await fetch("http://127.0.0.1:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      model: "gpt-4o-mini",
      history: [],
      interviewSessionId: "live_iag_accuracy_probe_01"
    })
  });
  const raw = await response.text();
  let text = "";
  let calls = 0;
  for (const block of raw.split("\n\n")) {
    const line = block.split("\n").find((row) => row.startsWith("data: "));
    if (!line || line.includes("[DONE]")) continue;
    try {
      const payload = JSON.parse(line.slice(6));
      if (payload.text) text += payload.text;
    } catch { /* event payloads */ }
  }
  if (/event: generation/.test(raw)) calls = 1;
  if (/event: retrieval_only/.test(raw)) calls = 0;
  return { status: response.status, text, calls, rawBytes: raw.length };
}

(async () => {
  const results = [];
  for (const [id, question, must, mustNot] of questions) {
    const started = Date.now();
    let row;
    try {
      const answer = await ask(question);
      row = {
        id,
        question,
        ms: Date.now() - started,
        status: answer.status,
        modelCalls: answer.calls,
        must: must.test(answer.text),
        mustNot: !mustNot.test(answer.text),
        text: answer.text.slice(0, 1800)
      };
    } catch (error) {
      row = { id, question, error: String(error.message || error) };
    }
    results.push(row);
    console.log(row.id, row.must, row.mustNot, row.modelCalls, row.ms);
  }
  const out = path.join(__dirname, "iag-live-after.json");
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
  const failed = results.filter((row) => row.must === false || row.mustNot === false || row.error);
  console.log("failed", failed.length, "of", results.length);
})();
