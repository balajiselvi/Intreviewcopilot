/**
 * Ultimate Architect Directive live verify on :3102
 * JML→IPS (zero IAG bleed), SU25 Activate depth, Fiori spoken cadence.
 */
process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3102";

const BASE = "http://127.0.0.1:3102";

const TOXIC =
  /Decision:\s*|Mechanism:\s*|Governance:\s*|Validation:\s*|Lead with\b|Create or maintain\b|I would not claim that as a completed implementation|As an AI\b|Generally speaking|Q\d+\s*:|\bRULE\s*9\b|MASTER (?:SPOKEN|TECHNICAL)?\s*ARCHITECT|ULTIMATE ARCHITECT/i;

const CASES = [
  {
    id: "jml-ips-no-iag-bleed",
    question:
      "How do you design HR-driven JML provisioning with SuccessFactors Employee Central?",
    require: [/\bIPS\b/i, /\bSCIM\b|\btransformation/i, /\bEmployee Central\b|\bSuccessFactors\b/i],
    forbid: [/\bAccess Request\b[\s\S]{0,80}\b(?:write|provision|joiner)/i, /\bMSMP\b/i, /\bRequestTypeRule\b/i],
    expectRoute: "VERIFIED_WORKFLOW"
  },
  {
    id: "su25-activate-lifecycle",
    question: "How do you handle SU25 during an S/4HANA authorization migration?",
    require: [
      /\bSU25\b/i,
      /\bUSOBT_C\b/i,
      /\b(?:Discover|Prepare|Explore|Realize|Deploy|Run|Activate|cutover|hypercare)\b/i
    ],
    forbid: [],
    expectRoute: "VERIFIED_WORKFLOW"
  },
  {
    id: "fiori-sso-spoken",
    question: "How do you configure Fiori SSO and Principal Propagation?",
    require: [/\bSAML2\b|\bOIDC\b/i, /\/UI2\/FLP/i],
    forbid: [/Lead with\b/i, /Decision:\s*/i],
    expectRoute: "VERIFIED_WORKFLOW"
  }
];

async function ask(q) {
  const t0 = Date.now();
  const res = await fetch(`${BASE}/api/chat`, {
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
      } catch {
        /* ignore */
      }
    }
  }
  return { status: res.status, latencyMs: Date.now() - t0, answer, route };
}

(async () => {
  const rows = [];
  let failed = 0;
  for (const c of CASES) {
    const r = await ask(c.question);
    const miss = (c.require || []).filter((re) => !re.test(r.answer)).map((re) => String(re));
    const hitForbid = (c.forbid || []).filter((re) => re.test(r.answer)).map((re) => String(re));
    const toxic = TOXIC.test(r.answer);
    const routeOk = !c.expectRoute || r.route === c.expectRoute;
    const ok =
      r.status === 200 &&
      r.answer.trim().length > 80 &&
      miss.length === 0 &&
      hitForbid.length === 0 &&
      !toxic &&
      routeOk;
    if (!ok) failed += 1;
    rows.push({
      id: c.id,
      ok,
      route: r.route,
      latencyMs: r.latencyMs,
      miss,
      hitForbid,
      toxic,
      routeOk,
      head: r.answer.replace(/\s+/g, " ").slice(0, 220)
    });
    console.log(JSON.stringify(rows[rows.length - 1], null, 2));
  }
  console.log(JSON.stringify({ failed, passed: CASES.length - failed, total: CASES.length }, null, 2));
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(2);
});
