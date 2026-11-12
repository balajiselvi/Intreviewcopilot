/**
 * Post-commit live check against http://localhost:3000/api/chat.
 * Local diagnostic only. node eval/results/postCommitLive.js
 */
const fs = require("fs");
const path = require("path");

const repeat = [
  ["ruleset-upload-obtain", "How do you upload or obtain an IAG Access Analysis ruleset?"],
  ["ruleset-update", "How do you update a ruleset in IAG?"],
  ["ruleset-vs-workflow", "What is the difference between an Access Analysis risk ruleset and a workflow-determination ruleset?"],
  ["policy-meaning", "What does authorization policy mean in IAG Access Request?"],
  ["policy-search", "How does the policy control what a requestor can search for?"],
  ["policy-vs-workflow", "How is that policy different from the IAG workflow-determination rule?"]
];

const once = [
  ["ruleset-original", "How do you upload or update a ruleset in IAG?"],
  ["template", "What is a workflow template in IAG, and which stages does it run?"],
  ["pam-setup", "How do you set up privileged access in IAG?"],
  ["pam-id", "How do you create a PAM ID and provision it to the target?"],
  ["pam-vs-ff", "How is an IAG PAM ID created compared with a GRC firefighter ID?"],
  ["owners", "Who are the owners, approvers, and reviewers for IAG privileged access?"],
  ["role-owner", "How does role owner mapping work on an IAG business role?"],
  ["requestor", "What must be in place before a user can raise an IAG access request?"],
  ["search-trigger", "What is the difference between search and trigger in IAG?"]
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
  let admission = null;
  for (const block of raw.split("\n\n")) {
    const dataLine = block.split("\n").find((row) => row.startsWith("data: "));
    if (!dataLine || dataLine.includes("[DONE]")) continue;
    try {
      const payload = JSON.parse(dataLine.slice(6));
      if (payload.text) text += payload.text;
      if (payload.decision || payload.route) admission = payload;
    } catch { /* non-json */ }
  }
  return {
    httpStatus: response.status,
    admission,
    route: admission?.route || "",
    workflowId: admission?.scriptId || "",
    reason: admission?.reason || "",
    modelCalls: /event: generation/.test(raw) ? 1 : 0,
    answer: text
  };
}

(async () => {
  const jobs = [];
  for (const [id, question] of repeat) {
    for (let n = 1; n <= 5; n += 1) jobs.push([`${id}-${n}`, question]);
  }
  for (const row of once) jobs.push(row);

  const results = [];
  let n = 0;
  for (const [id, question] of jobs) {
    n += 1;
    const sessionId = `post_commit_live_${String(n).padStart(2, "0")}`;
    const started = Date.now();
    try {
      const row = await ask(question, sessionId);
      row.id = id;
      row.question = question;
      row.ms = Date.now() - started;
      results.push(row);
      console.log(id, row.route, row.workflowId, "calls", row.modelCalls, row.httpStatus, row.ms, "chars", row.answer.length);
    } catch (error) {
      results.push({ id, question, error: String(error.message || error) });
      console.log(id, "ERROR", error.message || error);
    }
  }
  const out = path.join(__dirname, "post-commit-live.json");
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
  const failed = results.filter((row) => row.error || row.httpStatus !== 200 || !row.answer);
  console.log("http-or-empty", failed.length, "of", results.length);
  if (failed.length) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
