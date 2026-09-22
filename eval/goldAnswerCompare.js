const { generateAnswer } = require("./lib/generateAnswer");
const { DEFAULT_CAREER_BACKGROUND } = require("./lib/careerTimeline");

const TARGET_JOB_DESCRIPTION =
  "Chalhoub Group — Lead, Identity Security & Access Management. SAP S/4HANA IAM/Security workstream. Do not invent Chalhoub experience.";

function words(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function has(text, re) {
  return re.test(String(text || ""));
}

const CASES = [
  {
    id: "auth-ecc-s4-btp",
    q: "Explain the authorization architecture across SAP ECC, S/4HANA, and SAP BTP.",
    priorAppWords: 248,
    goldWords: 148,
    goldMust: [
      { name: "PFCG", re: /\bPFCG\b/i },
      { name: "SU01", re: /\bSU01\b/i },
      { name: "Fiori catalog", re: /\bcatalog/i },
      { name: "S_SERVICE or S_START", re: /\bS_SERVICE\b|\bS_START\b/i },
      { name: "role collection", re: /role collections?/i },
      { name: "OAuth/SAML/JWT", re: /\bOAuth\b|\bSAML\b|\bJWT\b/i }
    ],
    goldMustNot: [
      { name: "evolution opener", re: /evolved|evolution in how access/i }
    ]
  },
  {
    id: "ias-ips-hybrid",
    q: "Explain the architecture of SAP Cloud Identity Services — IAS and IPS — and how they work in a hybrid landscape.",
    priorAppWords: 218,
    goldWords: 132,
    goldMust: [
      { name: "IdP or proxy", re: /\bIdP\b|identity provider|proxy IdP/i },
      { name: "SCIM", re: /\bSCIM\b/i },
      { name: "source/target", re: /\bsource\b|\btarget\b/i },
      { name: "Cloud Connector", re: /Cloud Connector/i }
    ],
    goldMustNot: []
  },
  {
    id: "siem-etd",
    q: "How would you position and architect SAP Threat Detection and SIEM integration for a customer's Security Operations Center?",
    priorAppWords: 247,
    goldWords: 108,
    goldMust: [
      { name: "app-layer gap or SE16/RFC", re: /SE16|RFC|application-layer|application layer|kernel/i },
      { name: "SM19 or SM20 or SAL", re: /\bSM19\b|\bSM20\b|Security Audit Log/i },
      { name: "ETD or SAP-aware engine", re: /Enterprise Threat Detection|\bETD\b|SecurityBridge|Onapsis/i },
      { name: "CEF or Syslog", re: /\bCEF\b|Syslog/i }
    ],
    goldMustNot: [
      { name: "IAS bolted on", re: /\bIAS\b|Cloud Identity/i },
      { name: "SOC process opener", re: /first step is to define the integration/i }
    ]
  }
];

(async () => {
  const results = [];
  for (const c of CASES) {
    const started = Date.now();
    let gen;
    try {
      gen = await generateAnswer(c.q, {
        candidateResume: DEFAULT_CAREER_BACKGROUND,
        jobDescription: TARGET_JOB_DESCRIPTION
      });
    } catch (err) {
      console.error(`FAIL ${c.id}: ${err.message}`);
      results.push({ id: c.id, error: err.message });
      continue;
    }
    const w = words(gen.answer);
    const hits = c.goldMust.map((m) => ({ name: m.name, ok: has(gen.answer, m.re) }));
    const leaks = c.goldMustNot.map((m) => ({ name: m.name, leaked: has(gen.answer, m.re) }));
    const row = {
      id: c.id,
      priorAppWords: c.priorAppWords,
      goldWords: c.goldWords,
      newWords: w,
      vsApp: `${Math.round((w / c.priorAppWords) * 100)}% of prior app`,
      vsGold: `${Math.round((w / c.goldWords) * 100)}% of gold`,
      latencyMs: gen.latencyMs || Date.now() - started,
      hits,
      leaks,
      answer: gen.answer
    };
    results.push(row);
    console.log("\n==== " + c.id + " ====");
    console.log(`words priorApp=${c.priorAppWords} gold=${c.goldWords} new=${w} (${row.vsApp}, ${row.vsGold})`);
    console.log("must: " + hits.map((h) => `${h.name}:${h.ok ? "Y" : "N"}`).join(" | "));
    console.log("mustNot: " + leaks.map((h) => `${h.name}:${h.leaked ? "LEAK" : "ok"}`).join(" | "));
    console.log(gen.answer);
  }
  const fs = require("fs");
  const out = "eval/results/gold-answer-compare.json";
  fs.mkdirSync("eval/results", { recursive: true });
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
  console.log("\nWrote " + out);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
