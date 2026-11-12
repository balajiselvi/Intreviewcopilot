async function ask(question, sessionId) {
  const response = await fetch("http://127.0.0.1:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, model: "gpt-4o-mini", history: [], interviewSessionId: sessionId })
  });
  const raw = await response.text();
  let route = "";
  let text = "";
  for (const block of raw.split(/\r?\n\r?\n/)) {
    const dataLine = (block.split(/\r?\n/).find((row) => row.startsWith("data: ")) || "");
    if (!dataLine || dataLine.includes("[DONE]")) continue;
    try {
      const payload = JSON.parse(dataLine.slice(6));
      if (payload.route) route = payload.route;
      if (payload.reason) route += " " + payload.reason;
      if (payload.text) text += payload.text;
    } catch { /* non-json */ }
  }
  console.log(route);
  console.log(text);
}
ask("How did you integrate IPS with SAP IAG, S/4HANA, and BTP?", "diag_integrate_v7").catch((error) => {
  console.error(error);
  process.exit(1);
});
