process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3102";
const BASE = "http://127.0.0.1:3102";

const ROBOTIC =
  /(?:^|\n)\s*[-*•]?\s*(?:\*\*\s*)?(?:Decision|Mechanism|Governance|Validation)\s*:|^\s*Lead with\b|^\s*Lead diagnostics with\b|are the entry (?:points|surfaces) I use\b/im;
const CONVERSATIONAL = /\b(?:I typically|When I|From there|To (?:prove|troubleshoot)|I start|I move)\b/i;

const CASES = [
  {
    id: "msmp-brf",
    question: "How do you configure MSMP and BRF+ for GRC Access Control access requests?",
    must: [/GRFNMW_CONFIGURE/i, /BRF/i, /MSMP/i]
  },
  {
    id: "fiori-config",
    question: "How do you configure Fiori SSO and Principal Propagation?",
    must: [/\/UI2\/FLP/i, /SAML2/i, /STRUST/i]
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
  console.log("\n=== SPOKEN HUMAN ARCHITECT VERIFY (:3102) ===\n");
  for (const c of CASES) {
    const r = await ask(c.question);
    const text = String(r.answer || "").replace(/\s+/g, " ").trim();
    const robotic = ROBOTIC.test(r.answer || "") || ROBOTIC.test(text);
    const conversational = CONVERSATIONAL.test(text);
    const depth = c.must.every((re) => re.test(text));
    const pass = r.status === 200 && !robotic && conversational && depth && text.length > 100;
    console.log(
      `${c.id.padEnd(14)} route=${r.route || "-"} robotic=${robotic} spoken=${conversational} depth=${depth} => ${pass ? "PASS" : "FAIL"}`
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
