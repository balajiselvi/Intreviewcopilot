const questions = [
  ["fiori-missing", "A Public Edition user cannot see a Fiori app."],
  ["connector", "Connect ECC for Access Control risk analysis."],
  ["connector-empty", "SM59 succeeds but Access Control risk analysis returns nothing."],
  ["rise", "Who operates the infrastructure of SAP S/4HANA Cloud Private Edition compared with Public Edition?"],
  ["rise-servers", "Does the customer manage the servers in RISE Private Edition?"]
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
    const dataLine = (block.split(/\r?\n/).find((row) => row.startsWith("data: ")) || "");
    if (!dataLine || dataLine.includes("[DONE]")) continue;
    try {
      const payload = JSON.parse(dataLine.slice(6));
      if (payload.text) text += payload.text;
      if (payload.route) route = payload.route;
      if (payload.scriptId) route = payload.scriptId;
    } catch { /* non-json */ }
  }
  return { httpStatus: response.status, route, calls: /event: generation/.test(raw) ? 1 : 0, answer: text, raw: raw.slice(0, 400) };
}

(async () => {
  let n = 1;
  for (const [id, question] of questions) {
    const row = await ask(question, `fail_retry_${n}`);
    n += 1;
    console.log(`\n== ${id} http=${row.httpStatus} route=${row.route} calls=${row.calls}`);
    console.log(row.answer ? row.answer.slice(0, 900) : row.raw);
  }
})().catch((error) => { console.error(error); process.exit(1); });
