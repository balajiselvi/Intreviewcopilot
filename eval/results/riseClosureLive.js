/**
 * Live check for the RISE edition correction and the Access Control connector correction.
 * No browser API key is sent. The server must use its own configured key.
 * node eval/results/riseClosureLive.js
 */
const fs = require("fs");
const path = require("path");

const questions = [
  ["rise-editions", "How does the infrastructure of SAP S/4HANA Cloud Public Edition differ from Private Edition in a RISE landscape?"],
  ["rise-trace", "A user on SAP S/4HANA Cloud Public Edition cannot see a Fiori application. Where do you start, and why is an ABAP authorization trace the wrong first tool?"],
  ["connector", "How do you connect an ECC system to SAP Access Control so risk analysis can read its authorization data?"],
  ["connector-follow", "The RFC destination in SM59 tests successfully, but Access Control risk analysis still returns no data from that system. What do you check next?"]
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
  for (const block of raw.split(/\r?\n\r?\n/)) {
    const lines = block.split(/\r?\n/);
    const eventLine = lines.find((row) => row.startsWith("event: ")) || "";
    const dataLine = lines.find((row) => row.startsWith("data: "));
    if (!dataLine || dataLine.includes("[DONE]")) continue;
    try {
      const payload = JSON.parse(dataLine.slice(6));
      if (payload.text) text += payload.text;
      if (payload.route || payload.decision || payload.scriptId || payload.workflowId) {
        route = payload.route || payload.decision || payload.scriptId || payload.workflowId || route;
      }
      if (eventLine && eventLine !== "event: content" && !route) route = eventLine.slice(7);
    } catch { /* non-json */ }
  }
  return {
    httpStatus: response.status,
    route,
    modelCalls: /event: generation/.test(raw) ? 1 : 0,
    chars: text.length,
    claimsEc2AsArchitecture: /EC2|Outposts|Azure Stack/.test(text) && !/do not|not a|is not/.test(text),
    mentionsGracconnectors: /GRACCONNECTORS/.test(text),
    mentionsSm59: /SM59/.test(text),
    mentionsSaas: /SaaS|multi-tenant|software as a service/i.test(text),
    answer: text
  };
}

(async () => {
  const results = [];
  let n = 1;
  for (const [id, question] of questions) {
    const row = await ask(question, `rise_closure_${String(n).padStart(2, "0")}`);
    n += 1;
    results.push({ id, question, ...row });
    console.log(`${id} http=${row.httpStatus} route=${row.route} calls=${row.modelCalls} saas=${row.mentionsSaas} sm59=${row.mentionsSm59} fakeTx=${row.mentionsGracconnectors} ec2=${row.claimsEc2AsArchitecture}`);
    console.log(row.answer.slice(0, 900));
    console.log("---");
  }
  fs.writeFileSync(path.join(__dirname, "rise-closure-live.json"), JSON.stringify(results, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
