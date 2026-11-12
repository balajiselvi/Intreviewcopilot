/**
 * Master live smoke suite against http://127.0.0.1:3102/api/chat
 * Criteria: HTTP 200, latency < 2000ms, no DEFER, zero Q#/meta leaks, domain-specific accuracy.
 */
process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3102";

const BASE = "http://127.0.0.1:3102";
const LATENCY_MS_MAX = 2000;

const LEAK = /Q\d+\s*:|governing design boundary|I would treat Q|INTERNAL RETRIEVAL|LOW-RELEVANCE|SUPPORTING KNOWLEDGE|\bRULE\s*[1-9]\b|interviewPrompt\.js|turnDecision\.js|doors and keys|builds the doors|governs the keys/i;
const ANALOGY = /\bdoors?\b.{0,40}\bkeys?\b|\bthink of (?:it|them) like\b/i;
const DEFER = /\bDEFER\b|incomplete transcript|Deferred/i;

const CASES = [
  {
    id: "a-fiori-sso",
    question: "How do you configure Fiori SSO and Principal Propagation?",
    requireAny: [/\bSAML2?\b/i, /\bCERTRULE\b|\bSTRUST\b|\bPrincipal Propagation\b/i],
    forbid: [/\bSM20\b.{0,40}\b(?:delete|purge)/i]
  },
  {
    id: "b-sal-purge",
    question: "How do you delete or purge Security Audit Logs in SAP?",
    requireAny: [/\bSM18\b/i, /\bRSAUPURG\b/i],
    // Fail only when SM20 is cast as the deletion/admin tool.
    forbid: [
      /\b(?:use|using|via|run|execute)\s+(?:transaction\s+)?SM20(?:N)?\b[^\n.]{0,40}\b(?:to\s+)?(?:delete|purge|reorganiz)/i,
      /\bSM20(?:N)?\b[^\n.]{0,50}\bis\s+(?:used\s+)?(?:to|for)\s+(?:delete|purge|reorganiz|deletion|purging)\b/i,
      /\b(?:delete|purge|reorganiz)\b[^\n.]{0,40}\b(?:using|via|with|in)\s+(?:transaction\s+)?SM20(?:N)?\b/i
    ]
  },
  {
    id: "c-iag-vs-grc",
    question: "What is SAP Cloud IAG and how does it differ from SAP GRC Access Control?",
    requireAny: [/\bMSMP\b|\bBRF/i, /\bAccess Analysis\b|\bBTP\b|\bIAG Bridge\b/i],
    forbid: [ANALOGY]
  },
  {
    id: "d-btp-xsuaa",
    question: "How do you configure BTP XSUAA role collections and IAS trust?",
    requireAny: [/\brole collection\b/i, /\bIAS\b|\btrust\b/i],
    forbid: []
  },
  {
    id: "e-sf-rbp",
    question: "How do you manage SuccessFactors RBP permission groups and target populations?",
    requireAny: [/\bpermission (?:role|group)\b|\bRBP\b/i, /\btarget population\b/i],
    forbid: []
  },
  {
    id: "f-messy-grc",
    question: "premises SAP GRC Access Control 12.0 ARA MSMP configuration",
    requireAny: [/\bMSMP\b/i, /\bARA\b|\bAccess Control\b/i],
    forbid: []
  },
  {
    id: "g-su24-derived",
    question: "In S/4HANA, how do you handle SU24 authorization proposals and PFCG derived roles?",
    requireAny: [/\bSU24\b/i, /\bderived\b/i, /\bPFCG\b/i],
    forbid: []
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
  let admission = null;
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
        if (o.decision || o.route) admission = o;
        if (o.text) answer += o.text;
        if (o.answer) answer = String(o.answer);
      } catch {
        /* ignore */
      }
    }
  }
  return {
    status: res.status,
    latencyMs: Date.now() - started,
    answer,
    admissionDecision: admission?.decision || null,
    route: admission?.route || null
  };
}

function evaluate(c, r) {
  const failures = [];
  if (r.status !== 200) failures.push(`http=${r.status}`);
  if (r.latencyMs > LATENCY_MS_MAX) failures.push(`latency=${r.latencyMs}>${LATENCY_MS_MAX}`);
  if (r.admissionDecision === "DEFER" || DEFER.test(r.answer)) failures.push("DEFER");
  if (LEAK.test(r.answer)) failures.push("leak");
  if (ANALOGY.test(r.answer)) failures.push("analogy");
  if (!String(r.answer || "").trim() || r.answer.split(/\s+/).filter(Boolean).length < 20) {
    failures.push("thin");
  }
  for (const re of c.requireAny || []) {
    if (!re.test(r.answer)) failures.push(`missing:${re}`);
  }
  for (const re of c.forbid || []) {
    if (re.test(r.answer)) failures.push(`forbid:${re}`);
  }
  return failures;
}

(async () => {
  // Warm-up compile (not scored)
  try {
    await ask("ping warm-up interview health");
  } catch {
    /* ignore */
  }

  const rows = [];
  for (const c of CASES) {
    const r = await ask(c.question);
    const failures = evaluate(c, r);
    const pass = failures.length === 0;
    rows.push({
      id: c.id,
      question: c.question,
      pass,
      latencyMs: r.latencyMs,
      admission: r.admissionDecision,
      route: r.route,
      failures,
      preview: String(r.answer || "").replace(/\s+/g, " ").slice(0, 160)
    });
  }

  console.log("\n=== MASTER SMOKE SUMMARY (:3102) ===\n");
  console.log(
    "| Case | Latency (ms) | Admission | Route | Result |"
  );
  console.log("|---|---:|---|---|---|");
  for (const row of rows) {
    console.log(
      `| ${row.id} | ${row.latencyMs} | ${row.admission || "-"} | ${row.route || "-"} | ${row.pass ? "PASS" : "FAIL (" + row.failures.join("; ") + ")"} |`
    );
  }
  console.log("");
  for (const row of rows) {
    console.log(`[${row.id}] ${row.pass ? "PASS" : "FAIL"} — ${row.preview}`);
  }

  const passed = rows.filter((r) => r.pass).length;
  console.log(`\nMASTER ${passed === rows.length ? "PASS" : "FAIL"} — ${passed}/${rows.length}`);
  process.exit(passed === rows.length ? 0 : 1);
})().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
