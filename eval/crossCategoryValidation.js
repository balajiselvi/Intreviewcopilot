const fs = require("fs");
const path = require("path");

// Cross-category generalization check against the LIVE /api/chat endpoint (not a reconstructed
// prompt) -- all tuning so far (eval/ablationMatrix4-6.js, FIX_VALIDATION_2026-08-07.md) used
// ONE question/category (multi-country S/4HANA Architecture) and ONE candidate background. This
// checks whether the grounding-clause fix generalizes to different categories AND different
// background metrics, using distinct synthetic candidate backgrounds per case so a pass here
// can't just be re-detecting the same "11 countries" pattern the fix was tuned against.
// Per the freeze directive: interviewPrompt.js / chat.js / vectorSearch.js are NOT modified as
// part of this run -- this is measurement only.

const ENDPOINT = "http://localhost:3000/api/chat";
const MODEL = "gpt-4o-mini";

const CASES = [
  {
    label: "GRC_SoD_Remediation_EAM",
    question: "Walk me through how you would design an SoD remediation process and Emergency Access Management framework for a client with a large, complex SAP landscape.",
    candidateResume: `Senior SAP GRC Access Control consultant with hands-on Access Risk Analysis (ARA), Access Request Management (ARM), Business Role Management (BRM), and Emergency Access Management (EAM/Firefighter) delivery experience.
Representative real project scope (employer/client names generalized; all numbers are real): Led SoD remediation for a global retail client's GRC Access Control implementation -- identified and remediated 1,850 SoD conflicts across 12,000 users using a 320-rule ARA ruleset built from SOX-aligned risk criteria. Designed the EAM Firefighter framework covering 65 firefighter IDs across 18 production systems, with structured controller review cycles and reason-code enforcement that cut critical-access incidents materially within two audit cycles. Directed quarterly SoD certification campaigns and presented remediation evidence directly to internal audit.
Do not use specific employer or client names in generated answers -- generalize as "a global retail client," the way this background text already does. Do not invent any detail beyond what is stated above.`,
    // Includes spelled-out number alternatives (e.g. "eighteen production") -- a prior round
    // (FIX_VALIDATION_2026-08-07.md) found the model sometimes spells small numbers as words,
    // which a digits-only pattern silently miscounts as a miss.
    hitPattern: /1,?850|320[\s-]?rule|(65|sixty[\s-]?five) firefighter|(18|eighteen) production/i
  },
  {
    label: "BTP_Cloud_Identity_Security",
    question: "How would you architect authentication and identity federation for a company moving multiple applications to SAP BTP?",
    candidateResume: `Senior SAP Security Architect with deep SAP BTP, Cloud Connector, and Identity Authentication Service (IAS) delivery experience.
Representative real project scope (employer/client names generalized; all numbers are real): Architected SAP BTP cloud identity security for an enterprise landscape spanning 14 BTP subaccounts and 30+ integrated cloud applications. Implemented IAS-driven SAML 2.0 and OAuth 2.0 federation with Azure AD as the corporate identity provider, and configured Cloud Connector principal propagation across 6 on-premise backend systems, closing a prior credential-sprawl finding raised by internal audit.
Do not use specific employer or client names in generated answers -- generalize as "an enterprise client," the way this background text already does. Do not invent any detail beyond what is stated above.`,
    hitPattern: /(14|fourteen) (btp )?subaccounts|30\+? integrated|thirty\+? integrated|(6|six) on-premise/i
  },
  {
    label: "HANA_Privilege_Authorization",
    question: "How do you design HANA privilege and authorization architecture for a multi-tenant analytics landscape?",
    candidateResume: `Senior SAP Security Architect with hands-on HANA privilege design and multi-tenant analytics authorization experience.
Representative real project scope (employer/client names generalized; all numbers are real): Designed HANA privilege architecture for a multi-tenant analytics platform covering 40 HANA schemas and 220 analytic privileges. Implemented row-level security via analytic privileges for 9 distinct business units sharing the same HANA landscape, and enforced least-privilege separation of SQL and system privileges across 3 HANA tenant databases ahead of an external security audit.
Do not use specific employer or client names in generated answers -- generalize as "an enterprise analytics client," the way this background text already does. Do not invent any detail beyond what is stated above.`,
    hitPattern: /40 hana schemas|220 analytic|(9|nine) (distinct )?business units|(3|three) hana tenant/i
  }
];

async function callChat(question, candidateResume) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, question, history: [], candidateResume })
  });
  const raw = await res.text();
  const textChunks = [...raw.matchAll(/data: (\{.*"text":.*\})\n/g)]
    .map(m => { try { return JSON.parse(m[1]).text; } catch { return ""; } })
    .join("");
  return textChunks;
}

function hitTest(answer, pattern) {
  return pattern.test(answer);
}

async function runCase(testCase, n = 5) {
  const results = [];
  for (let i = 1; i <= n; i++) {
    const answer = await callChat(testCase.question, testCase.candidateResume);
    const hit = hitTest(answer, testCase.hitPattern);
    results.push({ run: i, hit, answer });
    console.log(`[${testCase.label}] Run ${i}: hit=${hit}`);
    if (!hit) console.log(`  MISS -- ${answer.replace(/\n/g, " ").slice(0, 220)}...`);
  }
  const hitCount = results.filter(r => r.hit).length;
  console.log(`=== [${testCase.label}] HIT RATE: ${hitCount}/${n} ===\n`);
  return { label: testCase.label, hitCount, n, results };
}

(async () => {
  const summary = [];
  for (const testCase of CASES) {
    summary.push(await runCase(testCase, 5));
  }

  fs.writeFileSync(
    path.join(__dirname, "results", "cross_category_validation.json"),
    JSON.stringify(summary, null, 2),
    "utf-8"
  );

  console.log("\n=== CROSS-CATEGORY VALIDATION SUMMARY ===");
  for (const row of summary) console.log(row.label.padEnd(35), `${row.hitCount}/${row.n}`);
})();
