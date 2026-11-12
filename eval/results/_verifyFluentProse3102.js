process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3102";
const BASE = "http://127.0.0.1:3102";
const DMGV = /(?:^|\n)\s*[-*•]?\s*(?:\*\*\s*)?(?:Decision|Mechanism|Governance|Validation)\s*:/im;

const CASES = [
  "How do you configure Fiori SSO",
  "How do you configure a Fiori app"
];

async function ask(question) {
  const res = await fetch(`${BASE}/api/chat`, {
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
  return { status: res.status, answer, route };
}

(async () => {
  let failed = 0;
  for (const q of CASES) {
    const r = await ask(q);
    const hasDmgv = DMGV.test(r.answer);
    const first = String(r.answer || "").replace(/\s+/g, " ").trim().slice(0, 180);
    const tcodeLead = /^\/UI2\/FLP\b|^\/UI2\/FLPCM_CUST\b|^SAML2\b|^STRUST\b|^\/IWFND\//i.test(first)
      || /\/UI2\/FLP|\/UI2\/FLPCM_CUST|SAML2|STRUST/i.test(first.slice(0, 120));
    const pass = r.status === 200 && !hasDmgv && tcodeLead && r.answer.length > 80;
    console.log(`\nQ: ${q}`);
    console.log(`  status=${r.status} route=${r.route || "-"} dmgv=${hasDmgv} tcodeLead=${tcodeLead} => ${pass ? "PASS" : "FAIL"}`);
    console.log(`  preview: ${first}`);
    if (!pass) failed += 1;
  }
  console.log(`\nFLUENT PROSE ${failed === 0 ? "PASS" : "FAIL"} — ${CASES.length - failed}/${CASES.length}`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
