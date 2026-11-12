/**
 * Local live check. node eval/results/reliabilityLive.js
 */
const questions = [
  ["rise-1", "How would you design identity for a hybrid RISE landscape?"],
  ["rise-2", "How would you design identity for a hybrid RISE landscape?"],
  ["rise-3", "How would you design identity for a hybrid RISE landscape?"],
  ["rise-4", "How would you design identity for a hybrid RISE landscape?"],
  ["rise-5", "How would you design identity for a hybrid RISE landscape?"]
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
    const sessionId = `reld_live_${String(n).padStart(2, "0")}`;
    const started = Date.now();
    const row = await ask(question, sessionId);
    console.log(`\n=== ${id} ${row.route} ${row.workflowId} calls ${row.modelCalls} http ${row.httpStatus} ms ${Date.now() - started} chars ${row.answer.length}`);
    console.log(row.answer);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
