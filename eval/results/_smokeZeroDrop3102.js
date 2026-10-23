process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3102";

const q = "premises SAP GRC Access Control 12.0 ARA MSMP configuration";

(async () => {
  const res = await fetch("http://127.0.0.1:3102/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini", question: q })
  });
  const status = res.status;
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let admission = null;
  let answer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop();
    for (const line of lines) {
      const l = line.trim();
      if (!l.startsWith("data: ")) continue;
      const payload = l.slice(6);
      if (payload === "[DONE]") continue;
      try {
        const o = JSON.parse(payload);
        if (o.decision || o.route) admission = o;
        if (o.text) answer += o.text;
      } catch {
        /* ignore */
      }
    }
  }
  const row = {
    httpStatus: status,
    admissionDecision: admission?.decision || null,
    admissionRoute: admission?.route || null,
    admissionReason: admission?.reason || null,
    hasDefer: admission?.decision === "DEFER" || /Deferred|incomplete transcript/i.test(answer),
    answerPreview: answer.replace(/\s+/g, " ").slice(0, 280),
    words: answer.split(/\s+/).filter(Boolean).length
  };
  console.log(JSON.stringify(row, null, 2));
  const pass = status === 200 && row.admissionDecision !== "DEFER" && !row.hasDefer && row.words > 0;
  console.log(pass ? "ZERO_DROP PASS" : "ZERO_DROP FAIL");
  process.exit(pass ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
