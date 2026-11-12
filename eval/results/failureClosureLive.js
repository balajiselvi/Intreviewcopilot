/**
 * Live reproduction of the three failed questions, paraphrases, RISE responsibility, and negative controls.
 * No browser API key is sent.
 * node eval/results/failureClosureLive.js
 */
const fs = require("fs");
const path = require("path");

const questions = [
  ["fiori-missing", "A Public Edition user cannot see a Fiori app."],
  ["fiori-para", "On S/4HANA Cloud Public Edition the tile is missing. Where do you look first?"],
  ["connector", "Connect ECC for Access Control risk analysis."],
  ["connector-empty", "SM59 succeeds but Access Control risk analysis returns nothing."],
  ["connector-para", "The RFC test in SM59 is green, yet risk analysis shows no authorization data from ECC. What is the next check?"],
  ["rise", "Who operates the infrastructure of SAP S/4HANA Cloud Private Edition compared with Public Edition?"],
  ["rise-para", "Does the customer manage the servers in RISE Private Edition?"],
  ["neg-msmp", "How do you maintain an MSMP workflow in Access Control?"],
  ["neg-pfcg", "How do you add a Fiori catalog to a PFCG role on an on-premise system?"],
  ["neg-iag", "What does authorization policy mean in IAG Access Request?"],
  ["neg-rfc", "How do you create a type 3 RFC destination in SM59 between two ABAP systems?"]
];

async function ask(question, sessionId) {
  const response = await fetch("http://127.0.0.1:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, model: "gpt-4o-mini", history: [], interviewSessionId: sessionId })
  });
  const raw = await response.text();
  let text = "";
  let route = "";
  for (const block of raw.split(/\r?\n\r?\n/)) {
    const lines = block.split(/\r?\n/);
    const eventLine = lines.find((row) => row.startsWith("event: ")) || "";
    const dataLine = lines.find((row) => row.startsWith("data: "));
    if (!dataLine || dataLine.includes("[DONE]")) continue;
    try {
      const payload = JSON.parse(dataLine.slice(6));
      if (payload.text) text += payload.text;
      if (payload.route || payload.decision || payload.scriptId || payload.workflowId) {
        route = payload.workflowId || payload.scriptId || payload.route || payload.decision || route;
      }
      if (eventLine.startsWith("event: ") && eventLine !== "event: content" && !route) route = eventLine.slice(7);
    } catch { /* non-json */ }
  }
  return { httpStatus: response.status, route, calls: /event: generation/.test(raw) ? 1 : 0, answer: text };
}

(async () => {
  const results = [];
  let n = 1;
  for (const [id, question] of questions) {
    const row = await ask(question, `fail_closure_${String(n).padStart(2, "0")}`);
    n += 1;
    results.push({ id, question, ...row });
    console.log(`\n== ${id} http=${row.httpStatus} route=${row.route} calls=${row.calls}`);
    console.log(row.answer.slice(0, 800));
  }
  fs.writeFileSync(path.join(__dirname, "failure-closure-live.json"), JSON.stringify(results, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
