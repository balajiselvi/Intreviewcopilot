async function ask(question, sessionId) {
  const response = await fetch("http://127.0.0.1:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, model: "gpt-4o-mini", history: [], interviewSessionId: sessionId })
  });
  const raw = await response.text();
  let text = "";
  for (const block of raw.split(/\r?\n\r?\n/)) {
    const dataLine = block.split(/\r?\n/).find((row) => row.startsWith("data: "));
    if (!dataLine || dataLine.includes("[DONE]")) continue;
    try {
      const payload = JSON.parse(dataLine.slice(6));
      if (payload.text) text += payload.text;
    } catch { /* non-json */ }
  }
  console.log("calls", /event: generation/.test(raw) ? 1 : 0);
  console.log("route", /fiori-space-by-edition|ac-release-boundary/.test(raw) ? "verified" : "other");
  console.log(text);
}

ask("What is the difference between SAP Access Control 10.1 and Access Control 12.0?", "vercovc_03x")
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
