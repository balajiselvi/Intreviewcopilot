process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3102";

const CASES = [
  {
    id: "fiori-sso",
    question: "How do you configure Fiori SSO and Principal Propagation?",
    require: [/\bIAS\b|\bSAML\b|\bOIDC\b/i, /\bPrincipal Propagation\b|\bSM59\b|\bFLP\b/i]
  },
  {
    id: "sal-purge",
    question: "How do you delete/purge Security Audit Logs in SAP?",
    require: [/\bSM18\b|\bRSAUPURG\b/i]
  },
  {
    id: "iag-vs-grc",
    question: "What is SAP Cloud IAG and how does it differ from GRC 12.0?",
    require: [/\bMSMP\b|\bBRF/i, /\bAccess Analysis\b|\bBTP\b/i]
  },
  {
    id: "btp-xsuaa",
    question: "How do you set up BTP XSUAA role collections and IAS trust?",
    require: [/\brole collection\b|\bXSUAA\b/i, /\bIAS\b|\btrust\b/i]
  },
  {
    id: "sf-rbp",
    question: "How do you manage SuccessFactors RBP permission groups?",
    require: [/\bpermission (?:role|group)\b|\bRBP\b/i, /\btarget population\b/i]
  }
];

const LEAK = /Q\d+\s*:|governing design boundary|INTERNAL RETRIEVAL|LOW-RELEVANCE|SUPPORTING KNOWLEDGE|I would treat Q\d+/i;

async function ask(question) {
  const started = Date.now();
  const res = await fetch("http://127.0.0.1:3102/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini", question })
  });
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let answer = "";
  let route = null;
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
        if (o.route) route = o.route;
        if (o.text) answer += o.text;
        if (o.answer) answer = String(o.answer);
      } catch {
        /* ignore */
      }
    }
  }
  return { status: res.status, latencyMs: Date.now() - started, answer, route };
}

(async () => {
  const rows = [];
  for (const c of CASES) {
    const r = await ask(c.question);
    const hasLeak = LEAK.test(r.answer);
    const missing = c.require.filter((re) => !re.test(r.answer)).map((re) => String(re));
    const pass = r.status === 200 && !hasLeak && missing.length === 0 && r.answer.trim().length > 40;
    rows.push({
      id: c.id,
      pass,
      latencyMs: r.latencyMs,
      route: r.route,
      hasLeak,
      missing,
      preview: r.answer.replace(/\s+/g, " ").slice(0, 220)
    });
    console.log(`\n=== ${c.id} ${pass ? "PASS" : "FAIL"} (${r.latencyMs}ms route=${r.route}) ===`);
    console.log(JSON.stringify({ hasLeak, missing, preview: rows[rows.length - 1].preview }));
  }
  const allPass = rows.every((r) => r.pass);
  console.log(`\nBATCH ${allPass ? "PASS" : "FAIL"} — ${rows.filter((r) => r.pass).length}/${rows.length}`);
  process.exit(allPass ? 0 : 1);
})().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
