process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3102";
const BASE = "http://127.0.0.1:3102";

const MANUAL =
  /\bIn (?:transaction|Role Designer)[^.]{0,40}\b(?:create or maintain|do )\b|^\s*Create or maintain\b|\bThe administrator must\b|^\s*Lead with\b|\bDefine the business role's purpose\b/im;
const FIRST_PERSON =
  /\b(?:When (?:I |tackling)|My standard approach|In my experience|I (?:always|typically|start|pull|build|work)|To resolve this)\b/i;

const CASES = [
  {
    id: "iag-role",
    q: "How do you design a business role in IAG Role Designer?",
    must: [/Role Designer/i, /Business Roles/i]
  },
  {
    id: "fiori-sso",
    q: "How do you configure Fiori SSO and Principal Propagation?",
    must: [/\/UI2\/FLP/i, /SAML2|STRUST/i]
  },
  {
    id: "msmp",
    q: "How do you configure MSMP and BRF+ for GRC access requests?",
    must: [/MSMP/i, /BRF/i, /GRFNMW_CONFIGURE/i]
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
  console.log("\n=== NATURAL INTERVIEW CADENCE VERIFY (:3102) ===\n");
  for (const c of CASES) {
    const r = await ask(c.q);
    const text = String(r.answer || "").replace(/\s+/g, " ").trim();
    const manual = MANUAL.test(r.answer || "") || MANUAL.test(text);
    const firstPerson = FIRST_PERSON.test(text);
    const depth = c.must.every((re) => re.test(text));
    const pass = r.status === 200 && !manual && firstPerson && depth && text.length > 120;
    console.log(
      `${c.id.padEnd(10)} route=${(r.route || "-").padEnd(18)} manual=${manual} firstPerson=${firstPerson} depth=${depth} => ${pass ? "PASS" : "FAIL"}`
    );
    console.log(`  ${text.slice(0, 280)}\n`);
    if (!pass) failed += 1;
  }
  console.log(`RESULT ${failed === 0 ? "PASS" : "FAIL"} — ${CASES.length - failed}/${CASES.length}\n`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
