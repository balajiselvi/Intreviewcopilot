async function ask(question) {
  const response = await fetch("http://127.0.0.1:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, model: "gpt-4o-mini", history: [], interviewSessionId: "diag_cutover_v7" })
  });
  const raw = await response.text();
  let text = "";
  for (const block of raw.split(/\r?\n\r?\n/)) {
    const dataLine = (block.split(/\r?\n/).find((row) => row.startsWith("data: ")) || "");
    if (!dataLine || dataLine.includes("[DONE]")) continue;
    try {
      const payload = JSON.parse(dataLine.slice(6));
      if (payload.text) text += payload.text;
    } catch { /* non-json */ }
  }
  console.log(text);
}
ask("What do you do during cutover and hypercare?").catch((error) => { console.error(error); process.exit(1); });
