/**
 * Randomized answer-quality battery across major supported domains.
 * Deterministic routing/workflow checks always run.
 * Live HTTP answer scoring runs only when EVAL_APP_BASE_URL is set.
 */
const fs = require("node:fs");
const path = require("node:path");
const { selectVerifiedWorkflow } = require("../lib/verifiedWorkflow.js");
const { explicitProductTopics } = require("../lib/interviewContext.js");
const { evaluateAnswerQuality } = require("./lib/answerQualityContract.js");

const SEED = Number(process.env.EVAL_SEED || 20261022);
const API_BASE_URL = process.env.EVAL_APP_BASE_URL || "";
const API_TIMEOUT_MS = Number(process.env.EVAL_API_TIMEOUT_MS || 90000);

const DOMAIN_BANK = [
  { domain: "SAP-Security-PFCG", questions: [
    "How would you design a derived PFCG role model for country variants?",
    "A user has the role but SU53 still shows a missing authorization. How do you triage?"
  ]},
  { domain: "Fiori-Gateway", questions: [
    "How do you authorize a custom Fiori app through catalog and OData services?",
    "A Fiori tile is visible but the app fails to start. What do you check first?"
  ]},
  { domain: "GRC-ARA", questions: [
    "How would you baseline SoD risks for a new role set before provisioning?",
    "An ARA role analysis returns a risk absent from user analysis. What do you compare?"
  ]},
  { domain: "GRC-ARM-MSMP", questions: [
    "How do you configure an MSMP workflow for access requests?",
    "An access request is stuck with no approver. What evidence do you check first?"
  ]},
  { domain: "GRC-EAM", questions: [
    "How do you configure Firefighter emergency access in SAP GRC?",
    "A Firefighter user cannot launch an approved emergency session. What do you validate?"
  ]},
  { domain: "GRC-BRM", questions: [
    "How would you design a governed business role lifecycle in SAP GRC BRM?",
    "A business role change is approved in BRM but the technical role is stale. How do you isolate ownership?"
  ]},
  { domain: "GRC-Process-Control", questions: [
    "How would you implement a manual control test plan in SAP GRC Process Control?",
    "An automated control test produces an unexpected result. How do you isolate the cause?"
  ]},
  { domain: "IAG", questions: [
    "How would you build roles in IAG?",
    "How do you troubleshoot failed IAG access analysis or synchronization?"
  ]},
  { domain: "IAS-IPS", questions: [
    "How does IAS federation work with a corporate IdP?",
    "An IPS job completes with skipped users. How do you isolate transformation versus target errors?"
  ]},
  { domain: "SAP-IDM", questions: [
    "How would you design SAP IDM provisioning to an ABAP target?",
    "IDM provisioning fails after a target role rename. What do you verify?"
  ]},
  { domain: "BTP", questions: [
    "How do you design BTP role collections for an application role template?",
    "A BTP role collection mapped to an IdP group does not take effect. How do you isolate trust and mapping?"
  ]},
  { domain: "S4-RISE", questions: [
    "How do Public Edition business roles differ from Private Edition PFCG roles?",
    "After an S/4HANA upgrade, authorization behavior changed in production. How do you triage?"
  ]},
  { domain: "SuccessFactors", questions: [
    "How do you implement SuccessFactors RBP while limiting the target population?",
    "A SuccessFactors permission was granted but the action remains unavailable. What do you inspect?"
  ]},
  { domain: "Ariba", questions: [
    "How would you provision Ariba users with enterprise SSO and controlled group access?",
    "An Ariba user authenticates but cannot see an expected workbench. What layers do you separate?"
  ]},
  { domain: "HANA-BW", questions: [
    "How would you design least-privilege HANA analytic privileges for a reporting role?",
    "A HANA user can connect but cannot read one view. What checks isolate the access boundary?"
  ]},
  { domain: "SAC-Datasphere-CAR", questions: [
    "How would you design least-privilege Datasphere space access for an analytics team?",
    "A CAR analytics user has application access but cannot see expected data. How do you isolate the security layer?"
  ]},
  { domain: "Activate-PMP", questions: [
    "How would you plan the SAP security workstream across Activate Explore, Realize, and Deploy?",
    "A Deploy cutover rehearsal fails on identity dependencies. How do you replan the go-live gate?"
  ]},
  { domain: "Compliance", questions: [
    "How would you use SAP GRC controls to support SOX ITGC access reviews without claiming automatic compliance?",
    "A SOX access control failed because approvals were missing. How do you contain, remediate, and retest it?"
  ]}
];

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pickTwo(domainEntry, rand) {
  const pool = [...domainEntry.questions];
  if (pool.length <= 2) return pool;
  const first = pool.splice(Math.floor(rand() * pool.length), 1)[0];
  const second = pool.splice(Math.floor(rand() * pool.length), 1)[0];
  return [first, second];
}

function parseStream(raw) {
  let answer = "";
  let admission = null;
  for (const block of String(raw || "").split(/\r?\n\r?\n/)) {
    const event = block.match(/^event:\s*(.+)$/m)?.[1] || "message";
    const line = block.split(/\r?\n/).find((row) => row.startsWith("data: "));
    if (!line || line.slice(6) === "[DONE]") continue;
    try {
      const payload = JSON.parse(line.slice(6));
      if (event === "admission") admission = payload;
      if (payload?.text) answer += payload.text;
    } catch {
      answer += line.slice(6);
    }
  }
  return { answer: answer.trim(), admission, terminated: String(raw).includes("data: [DONE]") };
}

async function requestLive(question) {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      question,
      model: "gpt-4o-mini",
      history: [],
      responseLength: "concise",
      debug: true
    }),
    signal: AbortSignal.timeout(API_TIMEOUT_MS)
  });
  const raw = await response.text();
  return { status: response.status, ...parseStream(raw) };
}

function expectedFor(domain, question) {
  const q = question.toLowerCase();
  if (domain === "IAG" && /build roles/.test(q)) {
    return {
      requiredPoints: [/Role Designer/i],
      forbiddenClaims: [/Maintain MSMP Workflows/i],
      expectedWorkflow: "iag-role-design"
    };
  }
  if (domain === "GRC-EAM" && /cannot launch/.test(q)) {
    return {
      requiredPoints: [/GRAC_SPM|repository sync|assignment/i],
      forbiddenClaims: [/^Create the firefighter ID on the target system/i],
      expectedWorkflow: "grc-firefighter-launch-troubleshooting"
    };
  }
  if (domain === "SuccessFactors" && /unavailable/.test(q)) {
    return {
      requiredPoints: [/target population/i],
      expectedWorkflow: "sf-rbp-unavailable-troubleshooting"
    };
  }
  if (domain === "BTP" && /does not take effect/.test(q)) {
    return {
      requiredPoints: [/trust|mapping|sign in/i],
      expectedWorkflow: "btp-role-collection-mapping-troubleshooting"
    };
  }
  if (domain === "GRC-Process-Control" && /unexpected result/.test(q)) {
    return {
      requiredPoints: [/Planner|Manual Test Plans|connector/i],
      forbiddenClaims: [/\b(?:run ST01|SU53 immediately|Maintain MSMP Workflows)\b/i],
      expectedWorkflow: "process-control-test-troubleshooting"
    };
  }
  if (domain === "IAG" && /troubleshoot failed iag access analysis/.test(q)) {
    return {
      requiredPoints: [/Rule Setup|sync|Access Analysis/i],
      expectedWorkflow: "iag-analysis-sync-troubleshooting"
    };
  }
  if (domain === "Activate-PMP" && /security workstream/.test(q)) {
    return {
      requiredPoints: [/Explore/i, /Realize/i, /Deploy/i],
      forbiddenClaims: [/In Discover, confirm the business case/i],
      expectedWorkflow: "activate-security-workstream"
    };
  }
  if (domain === "Activate-PMP" && /identity dependencies/.test(q)) {
    return {
      requiredPoints: [/go\/no-go|dependency|replan/i],
      expectedWorkflow: "activate-cutover-dependency-recovery"
    };
  }
  if (domain === "GRC-BRM" && /lifecycle/.test(q)) {
    return {
      requiredPoints: [/business role|mapping/i],
      expectedWorkflow: "brm-business-role-lifecycle"
    };
  }
  if (domain === "GRC-BRM" && /stale/.test(q)) {
    return {
      requiredPoints: [/mapping|BRM/i],
      forbiddenClaims: [/Authorization Sync hasn't run/i],
      expectedWorkflow: "brm-stale-technical-mapping-troubleshooting"
    };
  }
  if (domain === "HANA-BW" && /analytic privileges/.test(q)) {
    return {
      requiredPoints: [/analytic privilege/i, /object privileges/i],
      expectedWorkflow: "hana-analytic-privilege-design"
    };
  }
  if (domain === "S4-RISE" && /differ from Private Edition/i.test(question)) {
    return {
      requiredPoints: [/Public Edition/i, /PFCG/i],
      forbiddenClaims: [/I build IAG business roles in Role Designer/i],
      expectedWorkflow: "s4-public-vs-private-roles"
    };
  }
  if (domain === "GRC-ARA" && /baseline SoD/i.test(question)) {
    return { requiredPoints: [], forbiddenClaims: [], expectedWorkflow: null };
  }
  if (domain === "GRC-ARM-MSMP" && /configure an MSMP/i.test(question)) {
    return { requiredPoints: [/MSMP|GRFNMW|Maintain MSMP/i], expectedWorkflow: null };
  }
  return { requiredPoints: [], forbiddenClaims: [] };
}

async function main() {
  const rand = mulberry32(SEED);
  const rows = [];
  let failed = 0;
  for (const entry of DOMAIN_BANK) {
    for (const question of pickTwo(entry, rand)) {
      const expect = expectedFor(entry.domain, question);
      const verified = selectVerifiedWorkflow(question);
      const topics = explicitProductTopics(question);
      const routingPass = Object.prototype.hasOwnProperty.call(expect, "expectedWorkflow")
        ? (expect.expectedWorkflow
          ? verified?.workflowId === expect.expectedWorkflow
          : !verified)
        : true;
      let live = null;
      let quality = null;
      if (API_BASE_URL) {
        try {
          live = await requestLive(question);
          quality = evaluateAnswerQuality({
            question,
            answer: live.answer,
            requiredPoints: expect.requiredPoints,
            forbiddenClaims: expect.forbiddenClaims,
            route: live.admission?.route || null
          });
        } catch (error) {
          live = { error: error.message };
          quality = { pass: false, findings: [{ severity: "CRITICAL", code: "LIVE_ERROR", detail: error.message }] };
        }
      } else if (verified?.answer) {
        quality = evaluateAnswerQuality({
          question,
          answer: verified.answer,
          requiredPoints: expect.requiredPoints,
          forbiddenClaims: expect.forbiddenClaims,
          route: "VERIFIED_WORKFLOW",
          sourceFiles: verified.sourceFiles || []
        });
      } else {
        quality = {
          pass: true,
          findings: [],
          note: "No verified workflow; live answer not requested. Routing-only row."
        };
      }

      const pass = routingPass && (quality?.pass !== false);
      if (!pass) failed += 1;
      rows.push({
        domain: entry.domain,
        question,
        topics,
        verifiedWorkflowId: verified?.workflowId || null,
        expectedWorkflow: expect.expectedWorkflow || null,
        routingPass,
        liveStatus: live?.status ?? null,
        liveRoute: live?.admission?.route || null,
        answerPreview: (live?.answer || verified?.answer || "").slice(0, 240),
        quality,
        pass
      });
    }
  }

  const report = {
    createdAt: new Date().toISOString(),
    seed: SEED,
    mode: API_BASE_URL ? "live-http-and-routing" : "routing-and-verified-workflow-only",
    baseUrl: API_BASE_URL || null,
    domainCount: DOMAIN_BANK.length,
    totalCases: rows.length,
    failed,
    completed: rows.length - failed,
    rows
  };
  const outDir = path.join(__dirname, "results");
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = path.join(outDir, `answer-quality-domain-seed-${SEED}-${stamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    outPath,
    seed: SEED,
    mode: report.mode,
    totalCases: report.totalCases,
    completed: report.completed,
    failed: report.failed
  }, null, 2));
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
