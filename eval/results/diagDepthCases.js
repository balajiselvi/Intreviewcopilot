const questions = [
  ["ips-yes", "Have you implemented IPS?"],
  ["ips-integrate", "How did you integrate IPS with SAP IAG, S/4HANA, and BTP?"],
  ["ips-sync", "How would you troubleshoot a failed IPS synchronization?"],
  ["pm-risk", "How do you manage project risks and dependencies during an SAP security delivery?"],
  ["cutover", "What do you do during cutover and hypercare?"]
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
    } catch { /* non-json */ }
  }
  return { httpStatus: response.status, route, answer: text, rawHead: raw.slice(0, 300) };
}

(async () => {
  let n = 1;
  for (const [id, question] of questions) {
    const row = await ask(question, `diag_depth_v6_${n}`);
    n += 1;
    console.log(`\n== ${id} http=${row.httpStatus} route=${row.route}`);
    console.log(row.answer || row.rawHead);
  }
})().catch((error) => { console.error(error); process.exit(1); });
