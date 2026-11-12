process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3102";
const BASE = "http://127.0.0.1:3102";
const DMGV = /(?:^|\n)\s*[-*•]?\s*(?:\*\*\s*)?(?:Decision|Mechanism|Governance|Validation)\s*:/im;

const CASES = [
  {
    id: "fiori-sso",
    question: "How do you configure Fiori SSO",
    openRe: /\/UI2\/FLP|\/UI2\/FLPCM_CUST|SAML2|STRUST/i
  },
  {
    id: "grc-ara",
    question: "How do you build an ARA ruleset in GRC using GRAC_RULE_BUILD",
    openRe: /GRAC_RULE_BUILD|NWBC|GRACFUN|GRACRISK/i
  },
  {
    id: "sf-rbp",
    question: "How do you manage SuccessFactors RBP permission groups and target populations",
    openRe: /Manage Permission Roles|Manage Permission Groups|RBP|Target Populations?/i
  }
];

async function ask(question) {
  const started = Date.now();
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
  return { status: res.status, answer, route, latencyMs: Date.now() - started };
}

(async () => {
  let failed = 0;
  console.log("\n=== FLUENT PROSE 3-DOMAIN VERIFY (:3102) ===\n");
  for (const c of CASES) {
    const r = await ask(c.question);
    const preview = String(r.answer || "").replace(/\s+/g, " ").trim();
    const hasDmgv = DMGV.test(r.answer || "");
    const openOk = c.openRe.test(preview.slice(0, 160));
    const pass = r.status === 200 && !hasDmgv && openOk && preview.length > 80;
    console.log(
      `${c.id.padEnd(12)} HTTP=${r.status} ms=${r.latencyMs} route=${r.route || "-"} dmgv=${hasDmgv} open=${openOk} => ${pass ? "PASS" : "FAIL"}`
    );
    console.log(`  ${preview.slice(0, 200)}`);
    if (!pass) failed += 1;
  }
  console.log(`\nRESULT ${failed === 0 ? "PASS" : "FAIL"} — ${CASES.length - failed}/${CASES.length}\n`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
