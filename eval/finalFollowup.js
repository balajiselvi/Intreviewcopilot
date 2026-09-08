const { generateAnswer } = require("./lib/generateAnswer");

async function stream(question, history) {
  const base = process.env.EVAL_APP_BASE_URL || "http://localhost:3001";
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini", question, history })
  });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) {
      const l = line.trim();
      if (!l.startsWith("data: ")) continue;
      const payload = l.slice(6);
      if (payload === "[DONE]") continue;
      try {
        const obj = JSON.parse(payload);
        if (obj.text) answer += obj.text;
      } catch {
        /* ignore partial SSE */
      }
    }
  }
  return answer.trim();
}

(async () => {
  const seedQ = "Design mover handling when someone changes job function across two companies in S/4.";
  const seed = await generateAnswer(seedQ);
  console.log("SEED\n" + seed.answer + "\n");
  let history = [
    { role: "user", content: seedQ },
    { role: "assistant", content: seed.answer }
  ];
  for (const q of [
    "Where does IPS fit, and what does it not decide?",
    "Who decides the user receives the new business role?",
    "What stops them keeping the old company access?"
  ]) {
    const a = await stream(q, history);
    console.log("Q: " + q + "\n" + a + "\nlen=" + a.length + "\n");
    history = history.concat([
      { role: "user", content: q },
      { role: "assistant", content: a }
    ]);
  }
  const beh = await generateAnswer("Tell me about a production access incident you personally resolved last year.");
  console.log("BEH\n" + beh.answer);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
