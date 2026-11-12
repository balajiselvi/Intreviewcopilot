/**
 * Live version-audit sample against http://127.0.0.1:3000/api/chat.
 * node eval/results/versionCoverageLive.js
 */
const fs = require("fs");
const path = require("path");

const questions = [
  ["grc-version", "What is the difference between SAP Access Control 10.1 and Access Control 12.0?"],
  ["msmp-open", "How do you open MSMP workflow maintenance for SAP Access Control?"],
  ["fiori-space", "How is a Fiori space assigned on S/4HANA Cloud Public Edition, and how is that different from Private Edition?"],
  ["fiori-trace", "The user can see a Fiori tile but the app fails an authorization check. What do you trace?"],
  ["bw-compare", "How does BW/4HANA analysis authorization differ from an S/4 PFCG role?"],
  ["bw-only", "A BW query runs but returns no rows for one user. How do you isolate analysis authorization?"],
  ["iag-policy", "What does authorization policy mean in IAG Access Request?"],
  ["definition", "What exactly is SU53?"]
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
  let meta = null;
  for (const block of raw.split(/\r?\n\r?\n/)) {
    const lines = block.split(/\r?\n/);
    const eventLine = lines.find((row) => row.startsWith("event: "));
    const dataLine = lines.find((row) => row.startsWith("data: "));
    if (!dataLine || dataLine.includes("[DONE]")) continue;
    try {
      const payload = JSON.parse(dataLine.slice(6));
      if (payload.text) text += payload.text;
      if (eventLine && eventLine !== "event: content") meta = { event: eventLine.slice(7), ...payload };
      else if (payload.route || payload.decision) meta = payload;
    } catch { /* non-json */ }
  }
  return {
    httpStatus: response.status,
    route: meta?.route || meta?.decision || "",
    workflowId: meta?.scriptId || meta?.workflowId || "",
    modelCalls: /event: generation/.test(raw) ? 1 : 0,
    chars: text.length,
    employers: /Dover|Fabtech|Enerlife|Eminnov|8,700|8700/.test(text),
    answer: text
  };
}

(async () => {
  const results = [];
  let n = 1;
  for (const [id, question] of questions) {
    const sessionId = `vercovb_${String(n).padStart(2, "0")}x`;
    n += 1;
    const row = await ask(question, sessionId);
    results.push({ id, question, ...row });
    console.log(`${id} http=${row.httpStatus} route=${row.route} wf=${row.workflowId} calls=${row.modelCalls} chars=${row.chars} employers=${row.employers}`);
    console.log(row.answer.slice(0, 700));
    console.log("---");
  }
  const out = path.join(__dirname, "version-coverage-live.json");
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
