process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3102";

const CASES = [
  {
    id: "configure-fiori-sso",
    question: "How do you configure Fiori SSO and Principal Propagation?",
    lifecycle: "configure",
    require: [/\bSAML2\b|\bSTRUST\b/i, /\/UI2\/|\/IWFND\/|CERTRULE/i]
  },
  {
    id: "configure-sal",
    question: "How do you configure and purge Security Audit Logs?",
    lifecycle: "configure",
    require: [/\bSM19\b|\bRSAU_CONFIG\b/i, /\bSM18\b|\bRSAUPURG\b/i]
  },
  {
    id: "troubleshoot-fiori",
    question: "How do you troubleshoot a Fiori Gateway authorization error?",
    lifecycle: "troubleshoot",
    require: [/\/IWFND\/ERROR_LOG/i, /\bSU53\b|\bSTAUTHTRACE\b/i]
  },
  {
    id: "troubleshoot-msmp",
    question: "How do you troubleshoot a stuck MSMP access request in GRC?",
    lifecycle: "troubleshoot",
    require: [/\bGRFNMW_DB_CHECK\b|\bSLG1\b/i, /\bSWIA\b|\bSWI1\b|\bMSMP\b/i]
  },
  {
    id: "migrate-su25",
    question: "How do you handle SU25 during an S/4HANA authorization migration?",
    lifecycle: "implement_migrate",
    require: [/\bSU25\b/i, /\bUSOBT_C\b|\bUSOBX_C\b|\b2b\b/i]
  },
  {
    id: "implement-btp",
    question: "How do you design BTP XSUAA role collections with IAS trust?",
    lifecycle: "implement_migrate",
    require: [/\bXSUAA\b|\brole collection\b/i, /\bIAS\b/i]
  }
];

const LEAK = /Q\d+\s*:|\bRULE\s*9\b|MASTER (?:TECHNICAL )?ARCHITECT DIRECTIVE|doors and keys|bouncer/i;

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
  return { status: res.status, latencyMs: Date.now() - t0, answer, route };
}

(async () => {
  const { detectTechnicalLifecycle } = require("../../lib/intentRouter.js");
  const rows = [];
  for (const c of CASES) {
    const detected = detectTechnicalLifecycle(c.question);
    const r = await ask(c.question);
    const missing = c.require.filter((re) => !re.test(r.answer));
    const hasLeak = LEAK.test(r.answer);
    const opensTechnical = /^\s*\*\s*\*\*Decision:\*\*|^\s*Decision:/im.test(r.answer)
      || /(?:SAML2|STRUST|SM1[89]|\/IWFND\/|\/UI2\/|SU25|XSUAA|GRFNMW|NWBC|GRAC_)/i.test(r.answer.slice(0, 220));
    const pass = r.status === 200 && !hasLeak && missing.length === 0 && opensTechnical;
    rows.push({
      id: c.id,
      pass,
      detected,
      expected: c.lifecycle,
      latencyMs: r.latencyMs,
      route: r.route,
      missing: missing.map(String),
      preview: r.answer.replace(/\s+/g, " ").slice(0, 160)
    });
    console.log(`\n=== ${c.id} ${pass ? "PASS" : "FAIL"} (${r.latencyMs}ms ${r.route} lifecycle=${detected}) ===`);
    console.log(rows[rows.length - 1].preview);
  }
  const ok = rows.every((x) => x.pass);
  console.log("\n| Case | Lifecycle | Latency | Route | Result |");
  console.log("|---|---|---:|---|---|");
  for (const row of rows) {
    console.log(`| ${row.id} | ${row.detected} | ${row.latencyMs} | ${row.route || "-"} | ${row.pass ? "PASS" : "FAIL"} |`);
  }
  console.log(`\nMASTER-DIRECTIVE ${ok ? "PASS" : "FAIL"} — ${rows.filter((x) => x.pass).length}/${rows.length}`);
  process.exit(ok ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
