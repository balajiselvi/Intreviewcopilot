process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3102";
const BASE = "http://127.0.0.1:3102";

const ROBOTIC =
  /(?:^|\n)\s*[-*•]?\s*(?:\*\*\s*)?(?:Decision|Mechanism|Governance|Validation)\s*:|^\s*Lead with\b|^\s*Lead diagnostics with\b|are the entry (?:points|surfaces) I use\b|Lead with this architecture matrix/im;
const HUMAN = /\b(?:When (?:I |configuring|troubleshooting)|I typically|From there|To (?:address|prove|troubleshoot)|my first step)\b/i;

const CASES = [
  {
    id: "fiori-sso",
    q: "How do you configure Fiori SSO?",
    must: [/\/UI2\/FLP/i, /SAML2|STRUST/i]
  },
  {
    id: "msmp",
    q: "How do you configure MSMP and BRF+ workflow for GRC access requests?",
    must: [/MSMP/i, /BRF/i, /GRFNMW_CONFIGURE/i]
  },
  {
    id: "su25",
    q: "During an S/4HANA upgrade, how do you use SU25 and SU24 proposal tables?",
    must: [/SU25/i, /USOBT_C|USOBX_C/i]
  }
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
  console.log("\n=== SPOKEN HUMAN STYLE VERIFY (:3102) ===\n");
  for (const c of CASES) {
    const r = await ask(c.q);
    const text = String(r.answer || "").replace(/\s+/g, " ").trim();
    const robotic = ROBOTIC.test(r.answer || "") || /^\s*Lead with\b/i.test(text);
    const human = HUMAN.test(text);
    const depth = c.must.every((re) => re.test(text));
    const pass = r.status === 200 && !robotic && human && depth && text.length > 120;
    console.log(
      `${c.id.padEnd(10)} route=${(r.route || "-").padEnd(18)} robotic=${robotic} human=${human} depth=${depth} => ${pass ? "PASS" : "FAIL"}`
    );
    console.log(`  ${text.slice(0, 260)}\n`);
    if (!pass) failed += 1;
  }
  console.log(`RESULT ${failed === 0 ? "PASS" : "FAIL"} — ${CASES.length - failed}/${CASES.length}\n`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
