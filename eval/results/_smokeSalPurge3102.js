process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3102";

const QUESTION = "How do you purge Security Audit Logs in SAP";

(async () => {
  const base = process.env.EVAL_APP_BASE_URL;
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini", question: QUESTION })
  });

  const status = res.status;
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
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
        if (o.text) answer += o.text;
        if (o.answer) answer = String(o.answer);
      } catch {
        /* ignore */
      }
    }
  }

  const hasSm18 = /\bSM18\b/i.test(answer);
  const hasRsaupurg = /\bRSAUPURG\b/i.test(answer);
  const hasRseauAdmin = /\bRSAU_ADMIN\b/i.test(answer);
  const hasCorrectPurge = hasSm18 || hasRsaupurg || hasRseauAdmin;

  // Fail only when SM20 is cast as the purge/delete/admin tool — not when used for post-purge read/validation.
  const sm20AsDeleteTool =
    /\b(?:use|using|via|through|run|execute|in)\s+(?:transaction\s+)?SM20(?:N)?\b[^\n.]{0,60}\b(?:to\s+)?(?:delete|purge|reorganiz)/i.test(answer) ||
    /\bSM20(?:N)?\b[^\n.]{0,40}\b(?:is\s+(?:used\s+)?(?:to|for)\s+)?(?:delete|purge|reorganiz|deletion|purging)\b/i.test(answer) ||
    /\b(?:delete|purge|reorganiz|purging|deletion)\b[^\n.]{0,40}\b(?:transaction\s+)?SM20(?:N)?\b(?![^\n.]{0,40}\b(?:read|analy|check|validat|confirm|display|view)\b)/i.test(answer);

  const usesSm20OnlyForPurge =
    !hasCorrectPurge && /\bSM20(?:N)?\b/i.test(answer) && /purge|delete|reorganiz/i.test(answer);

  const report = {
    status,
    question: QUESTION,
    hasSm18,
    hasRsaupurg,
    hasRseauAdmin,
    hasCorrectPurge,
    sm20AsDeleteTool,
    usesSm20OnlyForPurge,
    words: answer.split(/\s+/).filter(Boolean).length,
    preview: answer.replace(/\s+/g, " ").slice(0, 900)
  };

  console.log(JSON.stringify(report, null, 2));
  const pass = hasCorrectPurge && !sm20AsDeleteTool && !usesSm20OnlyForPurge;
  console.log(pass ? "\nSMOKE PASS — SAL purge grounded on SM18/RSAUPURG" : "\nSMOKE FAIL — SAL purge hallucination");
  process.exit(pass ? 0 : 1);
})().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
