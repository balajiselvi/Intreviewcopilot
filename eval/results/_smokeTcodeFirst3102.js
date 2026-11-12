process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3102";

const CASES = [
  {
    id: "fiori",
    question: "How do you configure Fiori SSO and Principal Propagation?",
    require: [/\bSAML2\b|\bSTRUST\b/i, /\bCERTRULE\b|\/IWFND\/|\/UI2\//i]
  },
  {
    id: "sal",
    question: "How do you purge Security Audit Logs in SAP?",
    require: [/\bSM18\b|\bRSAUPURG\b/i, /\bSM19\b|\bSM20\b|\bRSAU_/i]
  },
  {
    id: "grc",
    question: "How do you configure GRC Access Control 12.0 ARA and MSMP?",
    require: [/\bGRAC_RULE_BUILD\b|\bNWBC\b|\bGRFNMW_CONFIGURE/i, /\bGRACFUN\b|\bMSMP\b|\bARA\b/i]
  },
  {
    id: "btp",
    question: "How do you set up BTP XSUAA role collections and IAS trust?",
    require: [/\bXSUAA\b|\brole (?:template|collection)\b/i, /\bIAS\b|\btrust\b/i]
  }
];

const LEAK = /Q\d+\s*:|\bRULE\s*[1-9]\b|doors and keys|governing design boundary/i;

async function ask(q) {
  const t0 = Date.now();
  const res = await fetch("http://127.0.0.1:3102/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini", question: q })
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
      const p = l.slice(6);
      if (p === "[DONE]") continue;
      try {
        const o = JSON.parse(p);
        if (o.route) route = o.route;
        if (o.text) answer += o.text;
      } catch { /* ignore */ }
    }
  }
  return { latencyMs: Date.now() - t0, answer, route, status: res.status };
}

(async () => {
  const rows = [];
  for (const c of CASES) {
    const r = await ask(c.question);
    const missing = c.require.filter((re) => !re.test(r.answer));
    const lead = r.answer.replace(/\s+/g, " ").slice(0, 180);
    const hasLeak = LEAK.test(r.answer);
    const pass = r.status === 200 && !hasLeak && missing.length === 0;
    rows.push({ id: c.id, pass, latencyMs: r.latencyMs, route: r.route, missing: missing.map(String), lead });
    console.log(`\n=== ${c.id} ${pass ? "PASS" : "FAIL"} (${r.latencyMs}ms ${r.route}) ===`);
    console.log(lead);
  }
  const ok = rows.every((r) => r.pass);
  console.log(`\nTCODE-FIRST ${ok ? "PASS" : "FAIL"} — ${rows.filter((r) => r.pass).length}/${rows.length}`);
  process.exit(ok ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
