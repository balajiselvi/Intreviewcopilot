/**
 * Local live check of comparison and control questions.
 * node eval/results/comparisonLive.js
 */
const questions = [
  ["ruleset-vs-workflow", "What is the difference between an Access Analysis risk ruleset and a workflow-determination ruleset?"],
  ["policy-vs-workflow", "How is that policy different from the IAG workflow-determination rule?"],
  ["pam-vs-ff", "How is an IAG PAM ID created compared with a GRC firefighter ID?"],
  ["owners", "Who are the owners, approvers, and reviewers for IAG privileged access?"],
  ["template", "What is a workflow template in IAG, and which stages does it run?"],
  ["ruleset-control", "How do you upload or update a ruleset in IAG?"],
  ["policy-control", "What does authorization policy mean in IAG Access Request?"],
  ["requestor", "What must be in place before a user can raise an IAG access request?"],
  ["rise", "How would you design identity for a hybrid RISE landscape?"]
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
  for (const block of raw.split(/\r?\n\r?\n/)) {
    const dataLine = block.split(/\r?\n/).find((row) => row.startsWith("data: "));
    if (!dataLine || dataLine.includes("[DONE]")) continue;
    try {
      const payload = JSON.parse(dataLine.slice(6));
      if (payload.text) text += payload.text;
      if (payload.decision || payload.route) admission = payload;
    } catch { /* non-json */ }
  }
  return {
    httpStatus: response.status,
    route: admission?.route || "",
    workflowId: admission?.scriptId || "",
    modelCalls: /event: generation/.test(raw) ? 1 : 0,
    answer: text
  };
}

(async () => {
  let n = 0;
  for (const [id, question] of questions) {
    n += 1;
    const sessionId = `cmp_live_${String(n).padStart(2, "0")}x`;
    const started = Date.now();
    const row = await ask(question, sessionId);
    console.log("\n===", id, row.route, row.workflowId, "calls", row.modelCalls, "http", row.httpStatus, "ms", Date.now() - started, "chars", row.answer.length);
    console.log(row.answer);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
