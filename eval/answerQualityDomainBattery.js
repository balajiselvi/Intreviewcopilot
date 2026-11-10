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
const MAX_LIVE_REQUESTS = Number(process.env.EVAL_MAX_LIVE_REQUESTS || 37);
const RATE_LIMIT_DELAY_MS = Number(process.env.EVAL_RATE_LIMIT_DELAY_MS || 1000);
const MAX_SPEND_USD = Number(process.env.EVAL_MAX_SPEND_USD || 0);
const PRIOR_UNMETERED_PROVIDER_ATTEMPTS = Number(process.env.EVAL_PRIOR_UNMETERED_PROVIDER_ATTEMPTS || 0);
const MODEL = "gpt-4o-mini";
const MODEL_CONTEXT_TOKENS = 128000;
const MAX_OUTPUT_TOKENS = 2048;
const INPUT_USD_PER_MILLION_TOKENS = 0.15;
const OUTPUT_USD_PER_MILLION_TOKENS = 0.6;
const MAX_PROVIDER_RETRIES = Number(process.env.EVAL_PROVIDER_RETRIES ?? 3);

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
  let generation = null;
  let context = null;
  let analysis = null;
  for (const block of String(raw || "").split(/\r?\n\r?\n/)) {
    const event = block.match(/^event:\s*(.+)$/m)?.[1] || "message";
    const line = block.split(/\r?\n/).find((row) => row.startsWith("data: "));
    if (!line || line.slice(6) === "[DONE]") continue;
    try {
      const payload = JSON.parse(line.slice(6));
      if (event === "admission") admission = payload;
      if (event === "generation") generation = payload;
      if (event === "context") context = payload;
      if (event === "analysis") analysis = payload;
      if (payload?.text) answer += payload.text;
    } catch {
      answer += line.slice(6);
    }
  }
  return {
    answer: answer.trim(),
    admission,
    generation,
    context,
    analysis,
    terminated: String(raw).includes("data: [DONE]")
  };
}

async function requestLive(question) {
  const startedAt = Date.now();
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      question,
      model: MODEL,
      history: [],
      responseLength: "concise",
      debug: true
    }),
    signal: AbortSignal.timeout(API_TIMEOUT_MS)
  });
  const raw = await response.text();
  return {
    status: response.status,
    responseLatencyMs: Date.now() - startedAt,
    ...parseStream(raw)
  };
}

function expectedFor(domain, question) {
  const q = question.toLowerCase();
  if (domain === "Fiori-Gateway" && /authorize a custom fiori app/.test(q)) {
    return {
      requiredPoints: [],
      forbiddenClaims: [],
      expectedWorkflow: null,
      expectedLiveRoute: "GENERATION"
    };
  }
  if (domain === "IAS-IPS-IAG-Architecture") {
    return {
      requiredPoints: [
        /\bIAS\b/i,
        /\bIPS\b/i,
        /\bIAG\b/i,
        /authentication|federation|SSO/i,
        /provisioning|synchronization|transformation/i,
        /governance|Access Analysis|Access Request|certification/i,
        /target application|target system/i
      ],
      forbiddenClaims: [],
      expectedWorkflow: null,
      expectedLiveRoute: "GENERATION"
    };
  }
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
    return { requiredPoints: [/MSMP|GRFNMW|Maintain MSMP/i], expectedWorkflow: "grc-msmp-access-request-config" };
  }
  return { requiredPoints: [], forbiddenClaims: [] };
}

async function main() {
  const rand = mulberry32(SEED);
  const rows = [];
  let failed = 0;
  let requestsSent = 0;
  let estimatedSpendUsd = 0;
  let unmeteredProviderAttempts = 0;
  let unmeteredSpendUpperBoundUsd = 0;
  let stopReason = null;
  const cases = DOMAIN_BANK.flatMap((entry) => pickTwo(entry, rand).map((question) => {
    const expect = expectedFor(entry.domain, question);
    const verified = selectVerifiedWorkflow(question);
    return {
      domain: entry.domain,
      question,
      expect,
      verified,
      topics: explicitProductTopics(question)
    };
  })).concat([{
    domain: "IAS-IPS-IAG-Architecture",
    question: "What is the role of SAP IAS (Identity Authentication) and IPS (Identity Provisioning) when deploying SAP Cloud SAP Cloud IAG?",
    expect: expectedFor(
      "IAS-IPS-IAG-Architecture",
      "What is the role of SAP IAS (Identity Authentication) and IPS (Identity Provisioning) when deploying SAP Cloud SAP Cloud IAG?"
    ),
    verified: selectVerifiedWorkflow(
      "What is the role of SAP IAS (Identity Authentication) and IPS (Identity Provisioning) when deploying SAP Cloud SAP Cloud IAG?"
    ),
    topics: explicitProductTopics(
      "What is the role of SAP IAS (Identity Authentication) and IPS (Identity Provisioning) when deploying SAP Cloud SAP Cloud IAG?"
    )
  }]);
  const potentialProviderCases = cases.filter((testCase) => !testCase.verified?.answer).length;
  const maxProviderAttempts = potentialProviderCases
    + PRIOR_UNMETERED_PROVIDER_ATTEMPTS
    + (potentialProviderCases ? MAX_PROVIDER_RETRIES : 0);
  const maxAttemptCostUsd = (
    MODEL_CONTEXT_TOKENS * INPUT_USD_PER_MILLION_TOKENS
    + MAX_OUTPUT_TOKENS * OUTPUT_USD_PER_MILLION_TOKENS
  ) / 1_000_000;
  const worstCaseSpendUsd = maxProviderAttempts * maxAttemptCostUsd;

  if (API_BASE_URL) {
    let target;
    try {
      target = new URL(API_BASE_URL);
    } catch {
      throw new Error("EVAL_APP_BASE_URL must be a valid local development-server URL.");
    }
    if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)) {
      throw new Error("Live evaluation is restricted to localhost; refusing to send questions to a remote host.");
    }
    if (!Number.isInteger(MAX_LIVE_REQUESTS) || MAX_LIVE_REQUESTS < cases.length) {
      throw new Error(`EVAL_MAX_LIVE_REQUESTS must allow all ${cases.length} battery cases.`);
    }
    if (!Number.isFinite(MAX_SPEND_USD) || MAX_SPEND_USD <= 0) {
      throw new Error("Set EVAL_MAX_SPEND_USD to an explicit positive USD cap before live evaluation.");
    }
    if (!Number.isInteger(PRIOR_UNMETERED_PROVIDER_ATTEMPTS) || PRIOR_UNMETERED_PROVIDER_ATTEMPTS < 0) {
      throw new Error("EVAL_PRIOR_UNMETERED_PROVIDER_ATTEMPTS must be a non-negative integer.");
    }
    if (!Number.isFinite(RATE_LIMIT_DELAY_MS) || RATE_LIMIT_DELAY_MS < 0) {
      throw new Error("EVAL_RATE_LIMIT_DELAY_MS must be a non-negative number.");
    }
    if (!Number.isInteger(MAX_PROVIDER_RETRIES) || MAX_PROVIDER_RETRIES < 0) {
      throw new Error("EVAL_PROVIDER_RETRIES must be a non-negative integer.");
    }
    if (worstCaseSpendUsd > MAX_SPEND_USD) {
      throw new Error(
        `Preflight refused: worst-case provider spend is $${worstCaseSpendUsd.toFixed(4)}, above the $${MAX_SPEND_USD.toFixed(2)} cap.`
      );
    }
  }

  for (const [index, testCase] of cases.entries()) {
    const { domain, question, expect, verified, topics } = testCase;
    const routingPass = Object.prototype.hasOwnProperty.call(expect, "expectedWorkflow")
      ? (expect.expectedWorkflow
        ? verified?.workflowId === expect.expectedWorkflow
        : !verified)
      : true;
    let live = null;
    let quality = null;
    if (API_BASE_URL) {
      if (requestsSent >= MAX_LIVE_REQUESTS) {
        stopReason = `Live request cap reached at ${MAX_LIVE_REQUESTS}.`;
        break;
      }
      if (requestsSent > 0 && RATE_LIMIT_DELAY_MS > 0) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
      }
      requestsSent += 1;
      try {
        live = await requestLive(question);
        const promptTokens = Number(live.generation?.prompt_tokens);
        const completionTokens = Number(live.generation?.completion_tokens);
        if (Number.isFinite(promptTokens) && Number.isFinite(completionTokens)) {
          live.estimatedCostUsd = (
            promptTokens * INPUT_USD_PER_MILLION_TOKENS
            + completionTokens * OUTPUT_USD_PER_MILLION_TOKENS
          ) / 1_000_000;
          estimatedSpendUsd += live.estimatedCostUsd;
        }
        quality = evaluateAnswerQuality({
          question,
          answer: live.answer,
          requiredPoints: expect.requiredPoints,
          forbiddenClaims: expect.forbiddenClaims,
          route: live.admission?.route || null,
          sourceFiles: live.admission?.sourceFiles || []
        });
      } catch (error) {
        live = { error: error.message };
        quality = { pass: false, findings: [{ severity: "CRITICAL", code: "LIVE_ERROR", detail: error.message }] };
        if (!verified?.answer) {
          unmeteredProviderAttempts += 1;
          unmeteredSpendUpperBoundUsd += maxAttemptCostUsd;
        }
        stopReason = `Stopped after request error for ${domain}: ${String(error.message || error).slice(0, 180)}`;
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

    const route = live?.admission?.route || null;
    const liveRoutePass = !API_BASE_URL || !expect.expectedLiveRoute || route === expect.expectedLiveRoute;
    const finishReason = live?.generation?.finish_reason || null;
    const generationRoute = route === "GENERATION";
    const truncated = generationRoute && !finishReason
      ? null
      : ["length", "max_tokens", "max_output_tokens"].includes(String(finishReason).toLowerCase());
    const transportComplete = Boolean(
      live?.terminated
      && live?.answer
      && Number.isFinite(live?.status)
      && live.status >= 200
      && live.status < 300
    );
    const complete = transportComplete && truncated !== true;
    const completionStatus = !transportComplete
      ? "incomplete"
      : truncated
      ? "truncated"
      : generationRoute && !finishReason
      ? "transport-complete-unverified"
      : "complete";
    const generationUsageAvailable = live?.generation?.prompt_tokens != null
      && live?.generation?.completion_tokens != null
      && Number.isFinite(Number(live.generation.prompt_tokens))
      && Number.isFinite(Number(live.generation.completion_tokens));
    let rowSpendUpperBoundUsd = live?.estimatedCostUsd || 0;
    if (API_BASE_URL && !live?.error
      && ["GENERATION", "LOCAL_KNOWLEDGE_FALLBACK"].includes(route)
      && !generationUsageAvailable) {
      unmeteredProviderAttempts += 1;
      unmeteredSpendUpperBoundUsd += maxAttemptCostUsd;
      rowSpendUpperBoundUsd = maxAttemptCostUsd;
    } else if (API_BASE_URL && live?.error && !verified?.answer) {
      rowSpendUpperBoundUsd = maxAttemptCostUsd;
    }
    const retrievedEvidence = live?.context?.retrieval?.evidence || [];
    const sourceFiles = live?.admission?.sourceFiles || [];
    const citationGrounding = {
      provenanceAvailable: sourceFiles.length > 0 || retrievedEvidence.length > 0,
      sourceFiles,
      retrievedEvidence,
      inlineCitationCount: (live?.answer?.match(/\[\d+\]|\((?:source|cite):[^)]+\)/gi) || []).length
    };
    const livePass = !API_BASE_URL || (
      live !== null
      && Number.isFinite(live.status)
      && live.status >= 200
      && live.status < 300
      && typeof live.answer === "string"
      && live.answer.trim().length > 0
      && complete
      && quality !== null
      && quality?.pass === true
    );

    const pass = routingPass && livePass && liveRoutePass;
    if (!pass) failed += 1;
    rows.push({
      domain,
      question,
      topics,
      verifiedWorkflowId: verified?.workflowId || null,
      expectedWorkflow: expect.expectedWorkflow || null,
      expectedLiveRoute: expect.expectedLiveRoute || null,
      routingPass,
      liveRoutePass,
      liveStatus: live?.status ?? null,
      liveRoute: route,
      responseLatencyMs: live?.responseLatencyMs ?? null,
      completionStatus: API_BASE_URL ? completionStatus : "not-run",
      finishReason,
      truncated,
      tokenUsage: live?.generation ? {
        promptTokens: live.generation.prompt_tokens ?? null,
        completionTokens: live.generation.completion_tokens ?? null,
        totalTokens: live.generation.total_tokens ?? null
      } : null,
      estimatedCostUsd: live?.estimatedCostUsd ?? null,
      estimatedCostUpperBoundUsd: API_BASE_URL ? Number(rowSpendUpperBoundUsd.toFixed(6)) : null,
      generationUsageAvailable: API_BASE_URL ? generationUsageAvailable : null,
      postAnswerAnalysisAvailable: API_BASE_URL ? Boolean(live?.analysis) : null,
      citationGrounding,
      answerText: live?.answer || verified?.answer || "",
      answerPreview: (live?.answer || verified?.answer || "").slice(0, 240),
      quality,
      pass
    });

    if (API_BASE_URL && !stopReason) {
      if (!live || live.error) {
        stopReason = `Stopped after an error for ${domain}.`;
      } else if (route === "LOCAL_KNOWLEDGE_FALLBACK") {
        stopReason = `Stopped after local fallback for ${domain}; provider retry cost could not be measured.`;
      } else {
        const remainingProviderCases = cases.slice(index + 1)
          .filter((remainingCase) => !remainingCase.verified?.answer).length;
        const projectedUpperBoundUsd = estimatedSpendUsd
          + unmeteredSpendUpperBoundUsd
          + PRIOR_UNMETERED_PROVIDER_ATTEMPTS * maxAttemptCostUsd
          + remainingProviderCases * maxAttemptCostUsd;
        if (projectedUpperBoundUsd > MAX_SPEND_USD) {
          stopReason = `Stopped before the next request; projected upper bound $${projectedUpperBoundUsd.toFixed(4)} exceeds the $${MAX_SPEND_USD.toFixed(2)} cap.`;
        }
      }
    }
    if (stopReason) break;
    if (index === cases.length - 1) break;
  }

  const report = {
    createdAt: new Date().toISOString(),
    seed: SEED,
    mode: API_BASE_URL ? "live-http-and-routing" : "routing-and-verified-workflow-only",
    baseUrl: API_BASE_URL || null,
    model: API_BASE_URL ? MODEL : null,
    domainCount: new Set(cases.map((testCase) => testCase.domain)).size,
    totalCases: rows.length,
    plannedCases: cases.length,
    requestsSent,
    maxLiveRequests: API_BASE_URL ? MAX_LIVE_REQUESTS : 0,
    rateLimitDelayMs: API_BASE_URL ? RATE_LIMIT_DELAY_MS : 0,
    maxSpendUsd: API_BASE_URL ? MAX_SPEND_USD : null,
    worstCaseSpendUsd: API_BASE_URL ? worstCaseSpendUsd : null,
    estimatedSpendUsd: API_BASE_URL ? Number(estimatedSpendUsd.toFixed(6)) : null,
    priorUnmeteredProviderAttempts: API_BASE_URL ? PRIOR_UNMETERED_PROVIDER_ATTEMPTS : null,
    unmeteredProviderAttempts: API_BASE_URL ? unmeteredProviderAttempts : null,
    estimatedSpendUpperBoundUsd: API_BASE_URL
      ? Number((estimatedSpendUsd + unmeteredSpendUpperBoundUsd + PRIOR_UNMETERED_PROVIDER_ATTEMPTS * maxAttemptCostUsd).toFixed(6))
      : null,
    stopReason,
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
    plannedCases: report.plannedCases,
    requestsSent: report.requestsSent,
    estimatedSpendUsd: report.estimatedSpendUsd,
    stopReason: report.stopReason,
    completed: report.completed,
    failed: report.failed
  }, null, 2));
  if (failed || stopReason) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
