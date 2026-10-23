process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3102";

const QUESTION = "What is SAP Cloud IAG and how does it differ from SAP GRC Access Control";

const ANALOGY = /\bbuilds the doors\b|\bgoverns the keys\b|think of (?:it|them) like|like a (?:door|key|lock|house|highway)|cloud is the highway|Security builds the doors/i;
const TECH = {
  hasDecision: /\*\*\s*Decision:?\s*\*\*|\bDecision\s*:/i,
  hasMechanism: /\*\*\s*Mechanism:?\s*\*\*|\bMechanism\s*:/i,
  hasGovernance: /\*\*\s*Governance:?\s*\*\*|\bGovernance\s*:/i,
  hasValidation: /\*\*\s*Validation:?\s*\*\*|\bValidation\s*:/i,
  hasMsmpOrBrf: /\bMSMP\b|\bBRF\+?\b/i,
  hasIagService: /\bAccess Analysis\b|\bAccess Request\b|\bPrivileged Access Management\b|\bAccess Certification\b|\bRole Design\b/i,
  hasBtpOrIas: /\bBTP\b|\bIAS\b|\bCloud Connector\b|\bIAG Bridge\b/i,
  hasGrcStack: /\bGRC\b|\bAccess Control\b|\bARA\b|\bEAM\b|\bFirefighter\b|\bGRCFND/i
};

(async () => {
  const res = await fetch("http://127.0.0.1:3102/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini", question: QUESTION })
  });
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

  const hasAnalogy = ANALOGY.test(answer);
  const techHits = Object.fromEntries(
    Object.entries(TECH).map(([k, re]) => [k, re.test(answer)])
  );
  const techScore = Object.values(techHits).filter(Boolean).length;
  const pass = !hasAnalogy
    && techHits.hasDecision
    && techHits.hasMechanism
    && techHits.hasGovernance
    && techHits.hasValidation
    && techHits.hasMsmpOrBrf
    && techHits.hasIagService
    && techHits.hasBtpOrIas;

  const report = {
    status: res.status,
    question: QUESTION,
    hasAnalogy,
    techHits,
    techScore,
    words: answer.split(/\s+/).filter(Boolean).length,
    preview: answer.replace(/\s+/g, " ").slice(0, 1000)
  };
  console.log(JSON.stringify(report, null, 2));
  console.log(pass ? "\nSMOKE PASS — IAG vs GRC technical, no analogies" : "\nSMOKE FAIL — analogy or shallow comparison");
  process.exit(pass ? 0 : 1);
})().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
