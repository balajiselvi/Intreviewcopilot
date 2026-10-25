/**
 * Master 8-domain enterprise smoke against http://127.0.0.1:3102/api/chat
 * Asserts T-code/table/architecture criteria + forbids meta-talk leaks.
 */
process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3102";

const BASE = "http://127.0.0.1:3102";

const META_LEAK =
  /Q\d+\s*:|Decision:\s*I would treat Q|I would treat Q|governing design boundary|INTERNAL RETRIEVAL|LOW-RELEVANCE|SUPPORTING KNOWLEDGE|\bRULE\s*[1-9]\b|interviewPrompt\.js|turnDecision\.js/i;

const CASES = [
  {
    id: "1-su25-s4-upgrade",
    name: "CORE SAP SECURITY & S/4HANA UPGRADE",
    question:
      "Scenario: During an S/4HANA upgrade, custom transaction codes are throwing authorization errors due to changed SU24 defaults. Which SU25 steps and database tables do you use to analyze, merge, and fix these proposals?",
    requireAll: [
      { label: "SU25 step 1", re: /\bSU25\b[\s\S]{0,200}\b(?:step\s*)?1\b|\bsteps?\s*1\b[\s\S]{0,80}\b2a\b/i },
      { label: "SU25 2a", re: /\b2a\b/i },
      { label: "SU25 2b", re: /\b2b\b/i },
      { label: "USOBT_C", re: /\bUSOBT_C\b/i },
      { label: "USOBX_C", re: /\bUSOBX_C\b/i },
      { label: "PFCG", re: /\bPFCG\b/i }
    ]
  },
  {
    id: "2-grc-msmp-stuck",
    name: "SAP GRC 12.0 ACCESS CONTROL (ARA & ARM)",
    question:
      "Scenario: An MSMP access request in GRC ARM is stuck in processing because workflow routing agents are failing. Which T-codes and backend tables do you check to diagnose and fix the workflow DB sync?",
    requireAll: [
      { label: "GRFNMW_CONFIGURE_WD", re: /\bGRFNMW_CONFIGURE_WD\b/i },
      { label: "GRFNMW_DB_CHECK", re: /\bGRFNMW_DB_CHECK\b/i },
      { label: "GRACFFLOG / SLG1", re: /\bGRACFFLOG\b|\bSLG1\b/i }
    ]
  },
  {
    id: "3-iag-bridge",
    name: "SAP CLOUD IAG & HYBRID INTEGRATION",
    question:
      "Scenario: How do you configure the IAG Bridge to synchronize risk rules between an on-premises SAP GRC Access Control 12.0 system and SAP Cloud IAG?",
    requireAll: [
      { label: "IAG connector", re: /\bIAG\b[\s\S]{0,120}\bconnector|\bconnector settings\b/i },
      { label: "provisioning / sync jobs", re: /\bprovisioning\b|\bsynchroni[sz]ation jobs?\b|\bsync(?:hronization)? jobs?\b/i },
      { label: "service configuration endpoints", re: /\bservice configuration\b|\bendpoints?\b/i }
    ]
  },
  {
    id: "4-btp-xsuaa-ias",
    name: "SAP BTP, XSUAA & IAS/IPS SECURITY",
    question:
      "Scenario: A custom HTML5 application deployed on Cloud Foundry in BTP is failing authorization checks. How do you structure the xs-security.json scopes, role templates, and BTP role collections, and how does IAS map user groups?",
    requireAll: [
      { label: "XSUAA token validation", re: /\bXSUAA\b[\s\S]{0,120}\b(?:token|JWT|runtime)\b|\btoken validation\b|\bXSUAA runtime\b/i },
      { label: "role templates", re: /\brole[- ]templates?\b/i },
      { label: "role collections", re: /\brole collections?\b/i },
      { label: "IAS group mapping", re: /\bIAS\b[\s\S]{0,120}\b(?:user )?groups?\b|\bIAS user group mapping\b|\bmap(?:ping)?\b[\s\S]{0,60}\bIAS\b/i }
    ]
  },
  {
    id: "5-sf-rbp",
    name: "SAP SUCCESSFACTORS RBP",
    question:
      "Scenario: An HR administrator in SuccessFactors cannot view compensation data for a specific subsidiary. How do you troubleshoot this using Permission Roles, Permission Groups, and Target Populations?",
    requireAll: [
      { label: "Permission Roles (activities)", re: /\bPermission Roles?\b[\s\S]{0,80}\b(?:what )?activit|\bwhat activities\b/i },
      { label: "Permission Groups (who)", re: /\bPermission Groups?\b[\s\S]{0,80}\bwho\b|\bwho belongs\b/i },
      { label: "Target Populations (whose data)", re: /\bTarget Populations?\b[\s\S]{0,100}\bwhose data\b|\bwhose data can be seen\b/i }
    ]
  },
  {
    id: "6-bw4-analysis-auth",
    name: "SAP BW / BW/4HANA ANALYTICAL AUTHORIZATIONS",
    question:
      "Scenario: A user can log into SAP BW/4HANA but cannot view specific regional data in a query. Why does standard ABAP PFCG authorization fail here, and how do you configure Analysis Authorizations?",
    requireAll: [
      { label: "PFCG vs Analysis Auth contrast", re: /\bPFCG\b[\s\S]{0,200}\b(?:do not|does not|fail|not filter|cannot)\b|\bstandard ABAP\b[\s\S]{0,120}\bPFCG\b/i },
      { label: "Analysis Authorizations", re: /\bAnalysis Authorizations?\b/i },
      { label: "authorization-relevant characteristics", re: /\bauthorization[- ]relevant characteristics?\b/i }
    ]
  },
  {
    id: "7-fiori-cloud-connector",
    name: "SAP FIORI & PRINCIPAL PROPAGATION",
    question:
      "Scenario: Fiori Launchpad users accessing a hybrid S/4HANA backend via SAP Cloud Connector experience authentication failures. How do you configure short-lived X.509 client certificates and backend mapping?",
    requireAll: [
      { label: "SAP Cloud Connector", re: /\b(?:SAP )?Cloud Connector\b/i },
      { label: "STRUST", re: /\bSTRUST\b/i },
      { label: "login/certificate_mapping_rulebased", re: /\blogin\/certificate_mapping_rulebased\b/i },
      { label: "CERTRULE", re: /\bCERTRULE\b/i }
    ]
  },
  {
    id: "8-sal-compliance-purge",
    name: "SECURITY AUDIT LOG COMPLIANCE & PURGING",
    question:
      "Scenario: Management requests the deletion of historical Security Audit Logs to free up database space. How do you compliantly configure, purge, and read audit logs without violating SOX audit requirements?",
    requireAll: [
      { label: "SM19 config", re: /\bSM19\b|\bRSAU_CONFIG\b/i },
      { label: "SM18 / RSAUPURG purge", re: /\bSM18\b|\bRSAUPURG\b/i },
      { label: "SM20 / RSAU_READ_LOG read", re: /\bSM20(?:N)?\b|\bRSAU_READ_LOG\b/i }
    ]
  }
];

async function ask(question) {
  const started = Date.now();
  let status = 0;
  let answer = "";
  let admission = null;
  let route = null;
  try {
    const res = await fetch(`${BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", question })
    });
    status = res.status;
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
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
          if (o.decision || o.route) {
            admission = o.decision || admission;
            route = o.route || route;
          }
          if (o.text) answer += o.text;
          if (o.answer) answer = String(o.answer);
        } catch {
          /* ignore partial SSE JSON */
        }
      }
    }
  } catch (err) {
    return {
      status: 0,
      latencyMs: Date.now() - started,
      answer: "",
      admission: null,
      route: null,
      error: err && err.message ? err.message : String(err)
    };
  }
  return {
    status,
    latencyMs: Date.now() - started,
    answer,
    admission,
    route,
    error: null
  };
}

function evaluate(c, r) {
  const failures = [];
  if (r.error) failures.push(`error:${r.error}`);
  if (r.status !== 200) failures.push(`http=${r.status}`);
  if (!String(r.answer || "").trim()) failures.push("empty");
  if (META_LEAK.test(r.answer || "")) failures.push("meta-talk");
  for (const req of c.requireAll || []) {
    if (!req.re.test(r.answer || "")) failures.push(`missing:${req.label}`);
  }
  return failures;
}

function pad(s, n) {
  const t = String(s);
  return t.length >= n ? t.slice(0, n) : t + " ".repeat(n - t.length);
}

(async () => {
  try {
    await ask("ping warm-up interview health");
  } catch {
    /* ignore warm-up */
  }

  const rows = [];
  for (const c of CASES) {
    process.stdout.write(`\n>>> ${c.id} — ${c.name}\n`);
    const r = await ask(c.question);
    const failures = evaluate(c, r);
    const pass = failures.length === 0;
    console.log(
      `    status=${r.status}  latencyMs=${r.latencyMs}  route=${r.route || "-"}  admission=${r.admission || "-"}`
    );
    console.log(`    result=${pass ? "PASS" : "FAIL"}` + (failures.length ? `  [${failures.join("; ")}]` : ""));
    if (!pass) {
      console.log(`    preview=${String(r.answer || "").replace(/\s+/g, " ").slice(0, 220)}`);
    }
    rows.push({
      id: c.id,
      name: c.name,
      pass,
      status: r.status,
      latencyMs: r.latencyMs,
      route: r.route,
      failures
    });
  }

  console.log("\n=== MASTER DOMAIN SMOKE SUMMARY (:3102) ===\n");
  console.log(
    `${pad("Domain", 48)} ${pad("HTTP", 6)} ${pad("ms", 8)} ${pad("Result", 8)}`
  );
  console.log("-".repeat(74));
  for (const row of rows) {
    console.log(
      `${pad(row.name, 48)} ${pad(row.status, 6)} ${pad(row.latencyMs, 8)} ${pad(row.pass ? "PASS" : "FAIL", 8)}`
    );
  }
  console.log("-".repeat(74));
  const passed = rows.filter((r) => r.pass).length;
  console.log(`\nMASTER DOMAIN ${passed === rows.length ? "PASS" : "FAIL"} — ${passed}/${rows.length}\n`);
  for (const row of rows.filter((r) => !r.pass)) {
    console.log(`FAIL detail [${row.id}]: ${row.failures.join("; ")}`);
  }
  process.exit(passed === rows.length ? 0 : 1);
})().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
