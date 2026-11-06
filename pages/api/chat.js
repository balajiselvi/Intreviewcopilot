import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";

import { analyzeInterviewQuestion } from "../../lib/interviewAnalyzer";
import { buildReasoningContract, NON_SAP_TECHNICAL_CATEGORIES, DELIVERY_GOVERNANCE_PATTERN, isTechnicalFailureAsk } from "../../lib/reasoningPlanner";
import { selectSapComponents } from "../../lib/componentSelector";
import { buildSapInterviewPrompt, getMaxTokensForCategory } from "../../lib/prompt/interviewPrompt";
import { profileInterviewer } from "../../lib/interviewerProfiler";
import { buildTechnicalReasoning } from "../../lib/technicalReasoner";
import { searchKnowledge } from "../../services/vectorSearch";
import { searchEngineeringMemory, renderEngineeringJudgmentSection } from "../../lib/engineeringMemory/retrieval";
import { createRequire } from "module";
import { logger } from "../../lib/logger";
import { runPostAnswerEvaluation } from "../../lib/prompt";
import APP_CONFIG from "../../config/appConfig";

const require = createRequire(import.meta.url);
const { recallGroundedExperience, formatMemoryCard, fieldConflictsWithCv, cardCoversAskedWork } = require("../../eval/lib/expertiseCards.js");
const { recallExpectedAnswer } = require("../../lib/preparedSpokenScripts.js");
const {
  DEFAULT_CAREER_BACKGROUND,
  STATED_PROFILE,
  scopeCareerEvidence,
  scopedHistoryOnly,
  isProfileCredentialQuestion,
  buildCredentialConfirmationAnswer
} = require("../../lib/candidateExperience.js");
const { shouldInheritPriorDomain, hasStrongTechnicalEvidence, isPlaneFoil, isTopicContinuation } = require("../../lib/contextInheritance.js");
const {
  publicLlmError,
  isIncompleteGeneration,
  looksIncompleteSpokenAnswer,
  findUngroundedTransactionClaims,
  stripUngroundedSapEntities,
  isDestructiveEntityStripResult,
  postStripCoherenceCheck,
  sanitizeUsageVsAssignmentPlanes,
  buildPrincipleLevelFallback,
  recoverNonEmptySpokenAnswer,
  isMetaRefusalText,
  sanitizeSpokenAnswer,
  stripBankQuestionLabels,
  anonymizeStarEmployers
} = require("../../lib/generationGuard.js");
const {
  validateAndRecoverSpokenAnswer,
  finalizeSpokenAnswerForDisplay,
  buildDirectTechnicalFallback,
  isMetaProcedureResponse,
  isProviderDisabledOperationalMessage
} = require("../../lib/answerIntegrityGate.js");
const {
  LLM_REQUEST_TIMEOUT_MS,
  MAX_RETRIES,
  isRetryableLlmError,
  runWithExponentialRetry,
  resolveProviderFailoverChain,
  generateWithReliability,
  buildLocalKnowledgeFallback,
  runAnswerFallbackLadder
} = require("../../lib/liveReliability.js");
const {
  resolveProviderMode,
  resetProviderStats,
  getProviderStats,
  recordDisabledBlocked,
  assertLiveTransportAllowed,
  streamMockProviderResponse,
  DISABLED_GENERATION_MESSAGE
} = require("../../lib/providerMode.js");
const { createTraceId, createStageTimer, BUDGETS_MS } = require("../../lib/liveBudgets.js");
const { isSafeModeEnabled, resolveSafeModeAnswer } = require("../../lib/safeModeRouter.js");
const { DEFAULT_PROFILE_SLUG } = require("../../lib/preparedAnswerPack.js");
const { appendQa, readScenarioTimeline, writeScenarioTimeline } = require("../../lib/interviewSessionStore.js");
const {
  PROMPT_POLICY_VERSION,
  buildAnswerProvenance,
  fingerprintPromptPolicy
} = require("../../lib/answerProvenance.js");
const { timelinePromptForTurn, nextScenarioTimeline, extractTimeline, unspecifiedTimelinePolicy, isContextOnlyTimeline } = require("../../lib/scenarioTimeline.js");
const { decideInterviewTurn } = require("../../lib/turnDecision.js");
const { selectVerifiedWorkflow } = require("../../lib/verifiedWorkflow.js");
const { historyForCurrentTurn } = require("../../lib/currentTurnHistory.js");
const { priorAnchor } = require("../../lib/questionAdmission.js");
const { resolveInterviewContext, sanitizeDebugContext, toHistoryContext, QUESTION_INTENTS, explicitProductTopic, resolveProductScope, evaluateLayer7Clarity, clarificationRequired } = require("../../lib/interviewContext.js");
const {
  productKnowledgeFolders,
  selectProductScopedChunks,
  augmentStemMatchedChunks
} = require("../../lib/productKnowledgeScope.js");
const {
  COVERAGE,
  assessKnowledgeCoverage,
  buildCoverageDirective,
  buildComparisonAnswerBlueprint,
  buildTransitionPathComparisonFallback,
  evaluateAnswerConceptCoverage,
  evaluateUnsupportedTechnicalDetail
} = require("../../lib/knowledgeCoverage.js");
const {
  isBehavioralStarIntent,
  buildStarFrameworkBlock,
  buildLowRelevanceArchitectFramework,
  isProductComparisonQuestion,
  buildProductComparisonDirective,
  isTechnicalTopicFastPath,
  TECH_ARTIFACT_FIRST_RULE,
  buildMasterArchitectDirective,
  detectTechnicalLifecycle,
  buildStarLocalFallback,
  starMayNameEmployer
} = require("../../lib/intentRouter.js");
const { formatSessionPreparation, normalizeSessionPreparation } = require("../../lib/sessionPreparation.js");
import {
  asksMsmpScopedBrf,
  authoritativeProcedure,
  expandPoolWithHeadingSiblings,
  fitSpokenLength,
  isThinProcedureChunk,
  isWorkflowBackboneAsk,
  knowledgeFromProcedurePool,
  mergeSameHeadingChunks,
  prioritizeProcedureChunks,
  questionProcedureIntent,
  renderSpokenProcedure,
  shapeSpokenContract,
  shouldPreferRetrievedProcedure
} from "../../lib/procedureRetention.js";
import { serveV2Chat, isV2EngineEnabled } from "../../lib/v2Core/serveV2Chat.js";

const MAX_HISTORY_ITEMS = 6;
/** Overall request budget (retrieval + generation). Per-LLM attempt is capped at LLM_REQUEST_TIMEOUT_MS (4s). */
const DEFAULT_TIMEOUT_MS = 25000;
const RESPONSE_WRITE_TIMEOUT = 100;
/** Live retrieval must clear this composite score or fall back to an architect framework block. */
const LIVE_RELEVANCE_THRESHOLD = 0.45;

// Startup diagnostics - log once per process
let STARTUP_LOGGED = false;
function logStartupDiagnostics() {
  if (STARTUP_LOGGED) return;
  STARTUP_LOGGED = true;

  const llmConfig = APP_CONFIG?.llm || {};
  const executionMode = llmConfig.validationMode || 'full';
  const provider = llmConfig.provider || 'openai';
  const model = llmConfig.defaultModel || 'gpt-4o-mini';
  const hasOpenAIKey = !!llmConfig.apiKeys?.openai;
  const hasGeminiKey = !!llmConfig.apiKeys?.gemini;

  logger?.info?.({
    event: 'app.startup_diagnostics',
    executionMode,
    provider,
    defaultModel: model,
    hasOpenAIKey,
    hasGeminiKey,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });

  if (executionMode === 'retrieval-only') {
    logger?.info?.({
      event: 'app.mode_diagnostic',
      message: 'Running in retrieval-only mode (diagnostic). No LLM calls will be made.',
      mode: 'retrieval-only'
    });
  } else if (executionMode === 'disabled') {
    logger?.warn?.({
      event: 'app.mode_disabled',
      message: 'Application is disabled. Interview Copilot will not be available.',
      mode: 'disabled'
    });
  } else if (executionMode === 'full') {
    logger?.info?.({
      event: 'app.mode_production',
      message: 'Running in production mode with LLM generation enabled.',
      mode: 'full',
      provider,
      model
    });
  }
}

const TOP_K_BY_CATEGORY = Object.freeze({
  Architecture: 3,
  Implementation: 3,
  Configuration: 3,
  Workflow: 3,
  Troubleshooting: 4,
  Scenario: 3,
  Migration: 3,
  Upgrade: 3,
  Comparison: 4,
  Definition: 2,
  Performance: 3,
  Security: 3,
  Authorization: 3,
  "Role Design": 3,
  "Production Support": 4,
  Cloud: 3,
  BTP: 3,
  IAS: 3,
  IPS: 3,
  IAG: 3,
  ARM: 3,
  ARA: 3,
  EAM: 3,
  BRM: 3,
  "SAP IDM": 3,
  Fiori: 3,
  ECC: 3,
  BW: 3,
  "S/4": 3,
  // HANA/Datasphere/RISE were added as classifier categories without ever being added here --
  // they silently fell back to General's topK=2, the smallest retrieval budget of any category,
  // even though real indexed knowledge exists (knowledge/hana/hana-authorization.md,
  // knowledge/sac/sac-security.md, knowledge/rise/*.md).
  HANA: 3,
  Datasphere: 3,
  RISE: 3,
  SAC: 3,
  PMP: 3,
  General: 2
});

const CATEGORY_RULES = Object.freeze([
  { category: "Troubleshooting", keywords: ["troubleshoot", "error", "dump", "st22", "su53", "bug", "fix", "issue", "fail", "exception", "returns nothing", "returns no", "no data", "what do you check"], weight: 3 },
  { category: "Production Support", keywords: ["production support", "ticket", "incident", "p1", "sla", "support"], weight: 3 },
  // CATEGORY_TEMPLATES.Behavioral/Leadership/Hypercare/Transports/Audit/Cutover (interviewPrompt.js)
  // all existed with zero rule here ever producing their exact category string -- same dead-code
  // class as the S/4HANA/BTP Security key-mismatch fixed earlier today, but Behavioral is the
  // highest-stakes of the six: its anti-fabrication guard (never invent a specific incident the
  // candidate can't defend under follow-up) never activated for a single behavioral question,
  // silently falling through to the generic template instead.
  { category: "Behavioral", keywords: ["tell me about a time", "describe a situation", "describe a time", "how did you handle", "walk me through a time", "give me an example of a time", "have you ever had to", "difficult stakeholder", "disagreement with", "mistake you made", "a failure you", "biggest challenge you faced", "conflict with a"], weight: 4 },
  { category: "Leadership", keywords: ["led a team", "lead a team", "influence without authority", "mentored", "convinced stakeholders", "managing up", "difficult conversation with leadership"], weight: 4 },
  { category: "Hypercare", keywords: ["hypercare", "post go-live support", "post-go-live support", "go-live support"], weight: 4 },
  { category: "Transports", keywords: ["transport request", "stms", "se09", "se10", "transport landscape", "change request approval"], weight: 4 },
  { category: "Audit", keywords: ["sox audit", "sox compliance", "audit evidence", "audit trail", "control testing", "internal audit", "external audit", "audit finding"], weight: 4 },
  { category: "Cutover", keywords: ["cutover", "go-live", "go live plan", "parallel run", "cutover plan", "cutover strategy"], weight: 4 },
  { category: "Architecture", keywords: ["architecture", "landscape", "design", "diagram", "topology"], weight: 3 },
  { category: "BTP", keywords: ["btp", "business technology platform"], weight: 4 },
  { category: "IAS", keywords: ["ias", "identity authentication service"], weight: 4 },
  // IPS owns SCIM/JML/HR-driven provisioning — do NOT keyword-match bare "SuccessFactors" (that bleeds RBP asks into IPS).
  { category: "IPS", keywords: ["ips", "identity provision service", "identity provisioning", "scim", "jml", "joiner", "mover", "leaver", "hr trigger", "hr-driven", "provisioning job", "provisioning transformation"], weight: 4 },
  { category: "SuccessFactors", keywords: ["rbp", "role-based permission", "role based permission", "permission role", "permission group", "target population", "employee central", "sf rbp", "successfactors", "success factors", "sap successfactors", "mdf", "metadata framework", "custom field", "field-level permission", "object definition"], weight: 4 },
  { category: "Ariba", keywords: ["ariba"], weight: 4 },
  { category: "CAR", keywords: ["customer activity repository", "sap car"], weight: 4 },
  { category: "IAG", keywords: ["iag", "identity access governance"], weight: 4 },
  // Deliberately placed immediately after IAG: "should we replace GRC with IAG during RISE"
  // ties IAG and RISE at the same weight, and on a tie this array's order decides primaryCategory
  // (see classifyWeightedIntents/sort). Listing RISE right after IAG makes IAG win as primary
  // (so the coexistence-first IAG template governs the answer's structure) with RISE demoted to
  // secondaryCategories -- which is exactly what's needed to make the "rise" keyword entry in
  // DOMAIN_DEPTH_GUIDANCE_MAP (interviewPrompt.js) reachable at all, since getDomainDepthGuidance
  // only ever checks category/domain/secondaryCategories strings, never the raw question text.
  // Before this rule existed, no category was ever literally named "RISE", so that guidance
  // block was unreachable regardless of how a RISE question was phrased -- confirmed dead code,
  // not just under-triggered.
  { category: "RISE", keywords: ["rise"], weight: 4 },
  { category: "ARM", keywords: ["arm", "access request management"], weight: 4 },
  // SoD / risk-violation / business-risk-report signals belong to ARA — not bare "Security".
  { category: "ARA", keywords: ["ara", "access risk analysis", "sod", "segregation of duties", "risk violation", "risk violations", "excessive sod", "excessive violations", "business reports", "grac_batch_risk_analysis", "ruleset simulation", "toxic combination"], weight: 4 },
  { category: "EAM", keywords: ["eam", "emergency access management", "firefighter", "fflog", "gracfflog"], weight: 4 },
  { category: "BRM", keywords: ["brm", "business role management"], weight: 4 },
  { category: "MSMP", keywords: ["msmp", "grfnmw_configure", "stuck workflow", "no approver", "msmp workflow"], weight: 4 },
  { category: "SAP IDM", keywords: ["sap idm", "identity management"], weight: 4 },
  // "tile" and "target mapping" are launchpad vocabulary with no other product meaning here --
  // without them "add a tile" classified as General and never reached the Fiori structure.
  { category: "Fiori", keywords: ["fiori", "launchpad", "ui5", "tile", "target mapping"], weight: 3 },
  { category: "S/4", keywords: ["s/4", "s4", "s/4hana", "s4hana"], weight: 3 },
  { category: "ECC", keywords: ["ecc", "erp"], weight: 3 },
  { category: "BW", keywords: ["bw", "bw/4hana", "analysis authorization", "rsecadmin"], weight: 3 },
  // No category existed for Datasphere/SAC before this -- every question fell through to
  // General, which has no space/privilege authorization model and would default to whatever
  // generic or BW-flavored language the model reached for.
  { category: "Datasphere", keywords: ["datasphere"], weight: 4 },
  // Was previously folded into Datasphere via the "sap analytics cloud" keyword -- confirmed by
  // direct trace to be wrong: a pure SAC question ("How do you design authorization for SAP
  // Analytics Cloud?") classified as category=Datasphere, and SAC has no representation of its
  // own anywhere (classifier, domain, or component keywords), so it could never win against
  // IAS/IAG/BTP content even when SAC's own semantic match was measurably better. SAC and
  // Datasphere are related but distinct products; giving SAC its own identity here is what
  // makes the domain/component fixes below actually reachable.
  { category: "SAC", keywords: ["sac", "sap analytics cloud", "sac story", "sac folder"], weight: 4 },
  // PMP had zero representation anywhere before this -- confirmed real project-management
  // knowledge exists (346 chunks) but was only ever reached by accident, when no SAP-flavored
  // word happened to compete. Deliberately multi-word, PM-distinctive phrases only -- a bare
  // "risk" keyword was tested and rejected: it's exactly the kind of shared-vocabulary word
  // that also legitimately belongs to SAP GRC risk analysis, and a live test confirmed a real
  // "risk register" PM question pulling in grc-overview.md/sox.md content instead.
  { category: "PMP", keywords: ["stakeholder management", "risk register", "scope creep", "change control", "steering committee", "project governance", "raid log", "project charter", "behind schedule", "vendor management", "resource conflict", "project schedule"], weight: 4 },
  // No category existed for HANA either -- a live test confirmed the General fallback produced
  // generic RBAC/ABAC textbook language instead of HANA's actual five privilege types. Bare
  // "hana" as a token is safe against "s4hana"/"s/4hana" (tokenize splits "/" into separate
  // tokens, and "s4hana" is one token, neither of which equals "hana").
  { category: "HANA", keywords: ["hana", "analytic privilege", "sql privilege"], weight: 4 },
  { category: "Cloud", keywords: ["cloud", "saas", "paas", "iaas"], weight: 2 },
  { category: "Role Design", keywords: ["role design", "pfcg", "single role", "composite role", "derived role", "role catalog", "role mining", "role rationalization", "rationalize roles", "overlapping sap roles", "duplicate roles", "unused roles", "thousands of sap roles", "thousands of roles", "user-role extract", "user role extract", "assignment extract", "agr_users"], weight: 4 },
  { category: "Authorization", keywords: ["authorization", "auth object", "auth field", "authorization object"], weight: 3 },
  // "sod" intentionally removed — SoD risk analysis is ARA (above), not generic Security.
  { category: "Security", keywords: ["security", "audit", "compliance", "encryption", "siem", "threat detection", "enterprise threat detection", "security operations center", "soc"], weight: 2 },
  { category: "Methodology", keywords: ["health check", "methodology", "assessment approach", "assessment methodology", "how would you assess", "how do you assess"], weight: 3 },
  { category: "Performance", keywords: ["performance", "optimization", "st03n", "trace", "slow", "bottleneck"], weight: 3 },
  { category: "Migration", keywords: ["migration", "migrate", "conversion", "brownfield", "greenfield"], weight: 3 },
  { category: "Upgrade", keywords: ["upgrade", "patch", "support package", "spau"], weight: 3 },
  { category: "Scenario", keywords: ["scenario", "case study", "client asks", "customer wants", "use case"], weight: 3 },
  { category: "Comparison", keywords: ["compare", "difference", "vs", "versus", "pros and cons"], weight: 3 },
  { category: "Implementation", keywords: ["implementation", "implement", "step", "customizing", "configure"], weight: 2 },
  { category: "Configuration", keywords: ["config", "configuration", "setting", "spro", "t-code"], weight: 2 },
  { category: "Workflow", keywords: ["workflow", "process flow", "approval"], weight: 2 },
  { category: "Definition", keywords: ["what is", "define", "meaning", "concept"], weight: 2 }
]);

const FOLLOW_UP_PATTERNS = Object.freeze([
  "hmm", "hmmm", "okay", "ok", "yes", "yeah", "exactly", "correct",
  "right", "makes sense", "fair enough", "interesting", "go ahead",
  "continue", "proceed", "tell me more", "can you elaborate", "elaborate",
  "give example", "give an example", "walk me through it", "why", "how",
  "then", "after that", "what happened next", "same issue", "same workflow",
  "same architecture", "same implementation", "this", "that", "it", "those",
  "same", "again", "what about this", "how about that", "can you explain that",
  "what about", "how about"
]);

const CONTEXTUAL_STARTERS = Object.freeze([
  "what about", "how about", "why", "how", "then", "and", "can you", "could you", "what if"
]);

// A "deepen" follow-up ("can you go deeper", "walk me through what you actually did") is a
// different interviewer move from a plain continuation ("then what?", "okay") -- it's a
// request for more technical specificity on what was just said, not a request to move on.
// Treating both identically meant the model had no signal to actually increase depth instead
// of just avoiding repetition.
const DEEPEN_FOLLOW_UP_PATTERNS = Object.freeze([
  "go deeper", "dive deeper", "deep dive", "more technical", "be more technical",
  "more specific", "be more specific", "more detail", "more details", "in more detail",
  "explain that technically", "explain the technical", "walk me through what you actually did",
  "walk me through what you did", "walk me through exactly what you did",
  "what did you actually do", "how exactly", "specifically how", "technically how",
  "drill into", "drill down", "go into detail", "get into the technical", "unpack that"
]);

// A recovery signal ("I'm blank", "wait, sorry", "where was I") carries NO topic content --
// it's the user under live pressure losing their thread, not asking a new question or asking
// for more depth. Treating it as a generic follow-up caused the model to restart the whole
// explanation from scratch, which is exactly backwards: what actually helps is a short, calm
// reminder of where they were and what's next, so they can pick the thread back up themselves.
const RECOVERY_SIGNAL_PATTERNS = Object.freeze([
  "im blank", "i blanked", "blanking", "lost my train of thought", "lost my thought",
  "where was i", "what was i saying", "i forgot what i was saying", "give me a second",
  "give me a sec", "one sec", "hold on", "sorry wait", "wait sorry", "i lost it",
  "my mind went blank", "i went blank", "sorry i lost", "can you remind me", "remind me where"
]);

function isRecoverySignal(question = "") {
  const normalized = question.trim().toLowerCase().replace(/[^\w\s]/g, "");
  if (RECOVERY_SIGNAL_PATTERNS.some(p => normalized.includes(p))) return true;
  // Bare "wait" / "wait..." with no other content is a recovery signal; "wait, why..." or
  // "wait, what about..." is a real contextual question and should not be swallowed here.
  if (normalized === "wait" || normalized === "sorry") return true;
  return false;
}

function isDeepenFollowUp(question = "") {
  const normalized = question.trim().toLowerCase().replace(/[^\w\s]/g, "");
  return DEEPEN_FOLLOW_UP_PATTERNS.some(p => normalized.includes(p));
}

function isClaudeModel(model = "") {
  return model?.toLowerCase?.().includes("claude") || false;
}

function isGeminiModel(model = "") {
  return model?.toLowerCase?.().startsWith("gemini") || false;
}

function isGroqModel(model = "") {
  // Groq models include: mixtral-8x7b-32768, llama2-70b-4096, etc.
  return model?.toLowerCase?.().includes("mixtral") ||
         model?.toLowerCase?.().includes("llama") ||
         model?.toLowerCase?.().includes("groq") || false;
}

function isOpenRouterModel(model = "") {
  // OpenRouter models are typically from external providers routed through openrouter.ai
  // Common formats: openrouter/*, anthropic/claude*, openai/gpt*, etc.
  return !!model;  // All models can be routed through OpenRouter
}

function writeSSEChunk(res, text) {
  try {
    if (!res?.writable) {
      return false;
    }
    const chunk = `data: ${JSON.stringify({ text })}\n\n`;
    return res.write(chunk);
  } catch (error) {
    logger?.error?.("Failed to write SSE chunk:", error);
    return false;
  }
}

/** Complete-answer writes only — never use on token-stream micro-chunks (trim would glue words). */
function writeSSEAnswer(res, text, { starAnonymize = false } = {}) {
  let safe = sanitizeSpokenAnswer(text);
  if (starAnonymize) safe = anonymizeStarEmployers(safe);
  return writeSSEChunk(res, safe);
}

function finalizeSpokenAnswer(text, { behavioralStarMode = false, question = "" } = {}) {
  let safe = sanitizeSpokenAnswer(text);
  if (behavioralStarMode && !starMayNameEmployer(question)) {
    safe = anonymizeStarEmployers(safe);
  }
  return safe;
}

// The prompt's explicit "no markdown formatting" rule (lib/prompt/interviewPrompt.js) is
// unreliable in practice -- live-validation runs reproduced literal ** bold markers around
// T-codes/table names (e.g. **SU53**, **AGR_USERS**) 2/2 despite the rule. A real second
// LLM pass to restructure/clean the answer was already built and measured for this exact
// class of problem (eval/results/EVIDENCE_SUMMARY_2026-08-06.md): +0.14 quality, inside the
// ~0.35 noise floor, for 4.2x the latency (5.4s -> 22.6s) -- unacceptable for a live-interview
// tool built around a single-pass ~5-6s target. Stripping asterisks is a per-character,
// chunk-boundary-independent operation, so it can run on every streamed token with no
// buffering and zero added latency, unlike a real reformatting pass.
function stripStreamMarkdown(text) {
  return String(text || "").replace(/\*/g, "");
}

function writeSSEError(res, errorMessage) {
  try {
    if (!res?.writable) {
      return false;
    }
    const chunk = `event: error\ndata: ${JSON.stringify({ error: errorMessage })}\n\n`;
    return res.write(chunk);
  } catch (error) {
    logger?.error?.("Failed to write SSE error:", error);
    return false;
  }
}

function writeSSEEvent(res, event, payload) {
  try {
    if (!res?.writable) return false;
    return res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
  } catch (error) {
    logger?.error?.(`Failed to write SSE ${event} event:`, error);
    return false;
  }
}

function tokenize(text = "") {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter(Boolean);
}

// Plain keyword-sum scoring ties BTP and IAS at the same weight whenever a question mentions
// both -- e.g. "authenticate through IAS" (IAS as the mechanism) vs "BTP application... gets an
// authorization error" (BTP as the actual subject with the problem). Before this, the correct
// answer only came out by accident of CATEGORY_RULES array order (BTP listed before IAS), which
// is not real precedence logic and breaks the moment the array is reordered. This makes the
// real-world rule explicit: a product named only as the authentication mechanism should not
// out-rank the product that's actually failing.
function applyCategoryPrecedence(scores, question) {
  const q = question.toLowerCase();
  const iasIsJustTheMechanism = /\b(through|via|using)\s+ias\b/.test(q);
  const hasAuthorizationProblem = /\b(authorization (error|fail\w*|denied|issue)|access denied|not authorized|denied access|can'?t access|cannot access)\b/.test(q);
  if (scores.has("BTP") && scores.has("IAS") && iasIsJustTheMechanism && hasAuthorizationProblem) {
    scores.set("BTP", scores.get("BTP") + 3);
  }
  const sfEnforcement = /\b(rbp|role[- ]based permission|permission role|infotype|hr data)\b/.test(q);
  const ipsLifecycle = /\b(ips|provision|joiner|leaver|mover|jml|identity lifecycle|sync job)\b/.test(q);
  if (sfEnforcement && !ipsLifecycle) {
    scores.set("SuccessFactors", (scores.get("SuccessFactors") || 0) + 5);
  }
  // Project-control co-occurrence already scored PMP. An equal-weight SAP ops noun
  // (hypercare/cutover/support) must not win the tie when the interviewer did not report a
  // system failure. "Troubleshoot X during hypercare" keeps the technical path.
  const pmpScore = scores.get("PMP") || 0;
  const opsTied = ["Hypercare", "Cutover", "Production Support"].some((name) => scores.has(name));
  if (pmpScore > 0 && opsTied && !isTechnicalFailureAsk(question)) {
    scores.set("PMP", pmpScore + 3);
  }
  // A question that names two or more enforcement landscapes must not be owned by the
  // heaviest single product (live: ECC+S/4+BTP lost to BTP and became a role-collection essay).
  const ENFORCEMENT_LANDSCAPES = ["ECC", "S/4", "BTP", "Fiori", "HANA", "BW"];
  const landscapeHits = ENFORCEMENT_LANDSCAPES.filter((name) => scores.has(name));
  if (landscapeHits.length >= 2) {
    scores.set("Architecture", (scores.get("Architecture") || 0) + 5);
  }
  // Threat Detection / SIEM is detection telemetry, not identity and not generic architecture.
  if (/\b(siem|threat detection|enterprise threat detection|security operations center|\bsoc\b)\b/.test(q)) {
    scores.set("Security", (scores.get("Security") || 0) + 5);
  }
  return scores;
}

// Narrowly scoped context-aware PMP detection. The exact-phrase PMP keywords in CATEGORY_RULES
// ("stakeholder management", "risk register", etc.) miss real paraphrases ("a stakeholder is
// blocking a critical decision" contains neither exact phrase). Bare single words like "risk",
// "schedule", "scope", or "change" can't be trusted as standalone PMP keywords either -- a live
// test already proved bare "risk" pulls a genuine PM question into SAP GRC content. The fix is
// co-occurrence, not a bigger keyword list: an anchor word plus a genuine PM-context word,
// present ANYWHERE in the question regardless of order or adjacency, is a reliable signal that
// an exact-phrase match would miss and a bare-word match would over-trigger on.
const PMP_CONTEXT_PAIRS = Object.freeze([
  ["stakeholder", ["decision", "blocking", "escalation"]],
  ["vendor", ["delivery", "deliver", "delay", "contract", "performance"]],
  ["schedule", ["delay", "recovery", "recover", "critical path", "behind", "slip"]],
  ["scope", ["creep", "change", "control"]],
  ["project", ["risk", "register", "mitigation"]],
  ["procurement", ["supplier", "vendor"]],
  ["raid", ["project", "program", "escalate", "item"]],
  ["milestone", ["delay", "recovery"]]
]);

function matchesPmpContextTerm(tokenSet, questionLower, term) {
  if (term.includes(" ")) return questionLower.includes(term);
  if (tokenSet.has(term)) return true;
  // Inflection of the listed PM-control term only (delay→delayed, recover→recovery).
  const stem = term.endsWith("y") && term.length > 5 ? term.slice(0, -1) : term;
  if (stem.length < 4) return false;
  for (const tok of tokenSet) {
    if (tok.length >= stem.length && tok.startsWith(stem)) return true;
  }
  return false;
}

function scorePmpContextPairs(scores, tokenSet, questionLower) {
  for (const [anchor, contexts] of PMP_CONTEXT_PAIRS) {
    if (!matchesPmpContextTerm(tokenSet, questionLower, anchor)) continue;
    if (contexts.some((c) => matchesPmpContextTerm(tokenSet, questionLower, c))) {
      scores.set("PMP", (scores.get("PMP") || 0) + 4);
      break; // one matching pair is enough signal; don't let several simultaneous pairs
             // inflate PMP's score disproportionately relative to single-keyword categories
    }
  }
}

function classifyWeightedIntents(question = "") {
  const tokens = tokenize(question);
  const tokenSet = new Set(tokens);
  const scores = new Map();

  for (const { category, keywords, weight } of CATEGORY_RULES) {
    for (const kw of keywords) {
      if (kw.includes(" ") || kw.includes("/")) {
        if (question.toLowerCase().includes(kw)) {
          scores.set(category, (scores.get(category) || 0) + weight);
        }
      } else if (tokenSet.has(kw)) {
        scores.set(category, (scores.get(category) || 0) + weight);
      }
    }
  }

  scorePmpContextPairs(scores, tokenSet, question.toLowerCase());
  // Compressing a delivery phase is a project objective even when the phase noun is SAP ops
  // vocabulary (hypercare/cutover). A reported system failure still stays technical.
  const qLower = question.toLowerCase();
  if (
    /\b(?:hypercare|cutover|go-?live|stabilization)\b/i.test(qLower)
    && /\b(?:cut|compress|shorten|reduce|behind|delay|slip|late|pull(?:ing)? in|bring(?:ing)? forward)\b/i.test(qLower)
    && !isTechnicalFailureAsk(question)
  ) {
    scores.set("PMP", (scores.get("PMP") || 0) + 4);
  }

  if (scores.size === 0) {
    return { primaryCategory: "General", secondaryCategories: [] };
  }

  applyCategoryPrecedence(scores, question);

  const sortedIntents = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
  return {
    primaryCategory: sortedIntents[0][0],
    secondaryCategories: sortedIntents.slice(1).map(([cat]) => cat)
  };
}

function isFollowUpUtterance(question = "", history = []) {
  // FOLLOW_UP_PATTERNS includes bare "how" and "why" as openers -- legitimate follow-up
  // signals ("How about the SoD side?") ONLY when there's a prior turn to follow up on. With
  // no history, `normalized.startsWith("how ")` matches every "How would you...", "How do
  // you..." first-turn question, which is one of the two most common ways real interview
  // questions are phrased -- misclassifying them as follow-ups, which skips retrieval
  // (knowledgeContext = "") and injects "do not repeat background information" on turn one.
  // Gating this behind history.length > 0 matches the (already-correct) gating already applied
  // to CONTEXTUAL_STARTERS and the pronoun check just below.
  if (history.length === 0) return false;

  const trimmed = question.trim().toLowerCase();
  const normalized = trimmed.replace(/[^\w\s]/g, "");

  if (FOLLOW_UP_PATTERNS.some(p => normalized === p || normalized.startsWith(`${p} `))) {
    return true;
  }

  if (CONTEXTUAL_STARTERS.some(starter => normalized.startsWith(starter))) {
    return true;
  }
  const words = normalized.split(/\s+/);
  if (words.length <= 5) {
    const pronouns = ["this", "that", "it", "those", "same", "again"];
    if (words.some(w => pronouns.includes(w))) {
      return true;
    }
  }

  return false;
}

// Day-9 context resolution -- replaces the previous approach of concatenating the prior user
// turn's text onto the current question before classifying ("classificationText"). That
// approach gave classifyWeightedIntents/analyzeInterviewQuestion no notion of WHICH tokens came
// from which turn, so an established topic's keywords competed on equal footing with a genuine
// topic change in the current turn -- live-reproduced: a BTP-established conversation followed
// by "What about the Fiori authorization issue we discovered?" kept category=BTP primary with
// Fiori only demoted to secondary, despite the current turn explicitly naming a different
// product. This resolves category/domain/primaryIntent via two independent, single-turn calls
// to the SAME existing classifiers (never a new classifier, never concatenated text), merged by
// explicit precedence.
//
// "Strong" current-turn technical evidence deliberately requires AGREEMENT between the two
// independently-built classifiers already in this pipeline -- classifyWeightedIntents'
// CATEGORY_RULES and analyzeInterviewQuestion's DOMAIN_PATTERNS -- not either one alone. A
// single classifier matching one generic, possibly-coincidental word (e.g. bare "role" hitting
// the SAP Security domain pattern, or "access control" hitting the SAP GRC domain pattern on a
// question that is not actually about either) is not strong enough on its own to either
// override inherited context or qualify as inheritable context itself. This is the explicit
// alternative to using `category !== "General"` as the sole test.
// Evidence precedence:
//   1. No history -> current-turn only.
//   2. Current turn is people/project (no technical product named as the subject) -> current-people.
//   3. Continuation / plane-foil after a strong prior product -> inherit prior category/domain.
//      Does not freeze the topic: explicit "what about X" and a different strong product win current.
//   4. Current turn has strong technical evidence -> current wins.
//   5. Else inherit prior strong evidence if present.
//   6. Else none.
function hasPeopleSignal(category, question) {
  return NON_SAP_TECHNICAL_CATEGORIES.has(category) || DELIVERY_GOVERNANCE_PATTERN.test(question);
}

function resolveContext(question, history) {
  const currentClassification = classifyWeightedIntents(question);
  const currentAnalysis = analyzeInterviewQuestion(question);
  const productScope = resolveProductScope(explicitProductTopic(question));
  if (productScope) currentAnalysis.domain = productScope.domain;
  const currentCategory = productScope?.category || currentClassification.primaryCategory;

  const asCurrent = (contextSource) => ({
    currentAnalysis,
    resolvedCategory: currentCategory,
    resolvedSecondaryCategories: currentClassification.secondaryCategories.filter((category) => category !== currentCategory),
    resolvedDomain: currentAnalysis.domain,
    resolvedPrimaryIntent: currentAnalysis.primaryIntent,
    contextSource
  });

  if (!history || history.length === 0) {
    return asCurrent("current");
  }

  if (hasPeopleSignal(currentCategory, question)) {
    return asCurrent("current-people");
  }

  const lastUserTurn = [...history].reverse().find(item => item?.role === "user" && item?.content)?.content || "";
  const priorClassification = lastUserTurn ? classifyWeightedIntents(lastUserTurn) : null;
  const priorAnalysis = lastUserTurn ? analyzeInterviewQuestion(lastUserTurn) : null;
  const inherit = lastUserTurn && shouldInheritPriorDomain({
    question,
    currentCategory,
    currentDomain: currentAnalysis.domain,
    priorCategory: priorClassification.primaryCategory,
    priorDomain: priorAnalysis.domain
  });

  if (inherit) {
    return {
      currentAnalysis,
      resolvedCategory: priorClassification.primaryCategory,
      resolvedSecondaryCategories: priorClassification.secondaryCategories,
      resolvedDomain: priorAnalysis.domain,
      resolvedPrimaryIntent: currentAnalysis.primaryIntent,
      contextSource: "inherited"
    };
  }

  if (hasStrongTechnicalEvidence(currentCategory, currentAnalysis.domain)) {
    return asCurrent("current");
  }

  if (lastUserTurn && hasStrongTechnicalEvidence(priorClassification.primaryCategory, priorAnalysis.domain)) {
    return {
      currentAnalysis,
      resolvedCategory: priorClassification.primaryCategory,
      resolvedSecondaryCategories: priorClassification.secondaryCategories,
      resolvedDomain: priorAnalysis.domain,
      resolvedPrimaryIntent: currentAnalysis.primaryIntent,
      contextSource: "inherited"
    };
  }

  return asCurrent("none");
}

function extractConversationTopic(history = []) {
  if (history.length === 0) return "";

  // Prior assistant answers are spoken prose. Tokenizing them into the retrieval query
  // drowns the current follow-up (live defect: "Where does IPS fit?" retrieved a bag of
  // prior-answer tokens). Only recent USER questions contribute topic tokens.
  const recentUserTurns = history
    .filter((item) => item?.role === "user" && item?.content)
    .slice(-2);

  const topicTokens = new Set();
  for (const item of recentUserTurns) {
    const tokens = tokenize(item.content);
    for (const token of tokens) {
      if (token.length > 3 && token.length < 28) {
        topicTokens.add(token);
      }
    }
  }

  return Array.from(topicTokens).slice(0, 16).join(" ");
}

function synthesizeRetrievalQuery(question, history, allowPriorTopic = false) {
  // A clearly named new topic must not inherit vocabulary from earlier interview turns.
  // The old unconditional merge made an IPS question retrieve Fiori/Gateway material after
  // the interviewer had changed subjects. Context tokens are only valid on an inherited
  // follow-up.
  if (!allowPriorTopic) return question;
  const conversationTopic = extractConversationTopic(history);
  if (!conversationTopic) return question;

  const questionTokens = tokenize(question);
  const topicTokens = tokenize(conversationTopic);

  const newTopicTokens = topicTokens.filter(token => !questionTokens.includes(token));
  if (newTopicTokens.length === 0) return question;

  return `${question} ${newTopicTokens.join(" ")}`.trim();
}

async function fetchKnowledgeContext(question, primaryCategory, secondaryCategories, history, analysis, answerScope, allowPriorTopic) {
  let topK = TOP_K_BY_CATEGORY[primaryCategory] || TOP_K_BY_CATEGORY.General;
  if (secondaryCategories && secondaryCategories.length > 0) {
    const maxSecondaryK = Math.max(
      ...secondaryCategories.map(cat => TOP_K_BY_CATEGORY[cat] || TOP_K_BY_CATEGORY.General)
    );
    topK = Math.max(topK, maxSecondaryK);
  }

  // Investigations need a small set of high-confidence diagnostic sources. Pulling a broad
  // topic pack adds adjacent scenarios that the model can mistake for the reported symptom.
  if (answerScope === "STAGE_INVESTIGATION") topK = Math.min(topK, 4);

  const retrievalQuery = synthesizeRetrievalQuery(question, history, allowPriorTopic);
  // searchKnowledge's real signature is (question, analysis, topK, options) -- passing topK
  // as the second positional argument here previously landed it in the `analysis` slot,
  // silently zeroing out domain/intent boost scoring and discarding this topK entirely in
  // favor of the function's own internal default.
  // The scorer may rank a semantically adjacent product procedure above the
  // named product's own source (for example Public Edition launchpad steps for
  // an Ariba or SAC failure). Retrieve a wider candidate set, then enforce the
  // explicit product lane before selecting the normal answer budget.
  const sourceFolders = productKnowledgeFolders(retrievalQuery);
  // Empty folder list must NOT open the entire corpus — that is how S/4 / bank chunks
  // contaminated Critical Actions and other definition asks. Prefer general-knowledge
  // generation with an explicit low-relevance directive instead.
  if (!sourceFolders.length) {
    const domain = analysis?.domain || analysis?.category || primaryCategory || "General";
    const comparisonBlueprint = buildComparisonAnswerBlueprint(retrievalQuery);
    return {
      text: "",
      procedureText: "",
      procedurePool: [],
      evidence: [],
      lowRelevanceFallback: true,
      knowledgeCoverage: {
        status: COVERAGE.NO_RELEVANT_KNOWLEDGE,
        reason: "empty-product-folder-no-unscoped-search",
        useRetrievedAsGrounding: false,
        relevantChunks: [],
        discardedChunks: []
      },
      lowRelevanceDirective: [
        buildCoverageDirective(
          { status: COVERAGE.NO_RELEVANT_KNOWLEDGE, reason: "empty-product-folder-no-unscoped-search" },
          { domain, question: retrievalQuery }
        ),
        comparisonBlueprint,
        buildLowRelevanceArchitectFramework({ domain, question: retrievalQuery })
      ].filter(Boolean).join("\n\n"),
      topScore: 0
    };
  }
  // Technical topics (Fiori SSO, BTP, GRC, IAG, …): keep retrieval shallow so generation starts fast.
  const technicalFastPath = isTechnicalTopicFastPath(retrievalQuery);
  const searchK = technicalFastPath ? Math.max(topK, 8) : Math.max(topK, 12);
  const candidates = (await searchKnowledge(
    retrievalQuery,
    analysis,
    searchK,
    { metadataFilters: { sourceFolders } }
  )) || [];
  // Provenance enrichment: when the question names a product whose technical
  // source file is indexed (brm.md, pfcg.md, …), ensure those chunks enter
  // scoping even if vector search ranked coaching/bank neighbours higher.
  const augmentedCandidates = augmentStemMatchedChunks(retrievalQuery, candidates, sourceFolders);
  const productScoped = selectProductScopedChunks(retrievalQuery, augmentedCandidates);
  const topScore = Math.max(
    Number(productScoped?.[0]?.score ?? 0),
    Number(productScoped?.[0]?.semanticScore ?? 0),
    Number(productScoped?.[0]?.confidenceScore ?? 0)
  );

  // Phase 2.1: assess coverage before trusting chunks as grounding.
  let coverage = assessKnowledgeCoverage({
    question: retrievalQuery,
    chunks: productScoped,
    analysis
  });
  let scopedForAnswer = coverage.useRetrievedAsGrounding
    ? (coverage.relevantChunks.length ? coverage.relevantChunks : productScoped)
    : [];

  // IRRELEVANT_RETRIEVAL: discard hijacking context; allow intelligent LLM fallback.
  if (coverage.status === COVERAGE.IRRELEVANT_RETRIEVAL) {
    const domain = analysis?.domain || analysis?.category || primaryCategory || "General";
    const comparisonBlueprint = buildComparisonAnswerBlueprint(retrievalQuery);
    return {
      text: "",
      procedureText: "",
      procedurePool: [],
      evidence: [],
      lowRelevanceFallback: true,
      knowledgeCoverage: coverage,
      lowRelevanceDirective: [
        buildCoverageDirective(coverage, { domain, question: retrievalQuery }),
        comparisonBlueprint,
        buildLowRelevanceArchitectFramework({ domain, question: retrievalQuery })
      ].filter(Boolean).join("\n\n"),
      topScore
    };
  }

  // Weak top hit OR no relevant knowledge: LLM fallback with coverage-aware directive.
  // Do NOT inject debug/fallback prose into knowledgeContext (it leaked to the UI).
  if (
    coverage.status === COVERAGE.NO_RELEVANT_KNOWLEDGE
    || !productScoped.length
    || (topScore < LIVE_RELEVANCE_THRESHOLD && !coverage.useRetrievedAsGrounding)
  ) {
    if (technicalFastPath && productScoped.length && coverage.status !== COVERAGE.NO_RELEVANT_KNOWLEDGE) {
      // Continue with shallow product context below.
      scopedForAnswer = productScoped;
      coverage = assessKnowledgeCoverage({ question: retrievalQuery, chunks: scopedForAnswer, analysis });
    } else {
      const domain = analysis?.domain || analysis?.category || primaryCategory || "General";
      const comparisonBlueprint = buildComparisonAnswerBlueprint(retrievalQuery);
      return {
        text: "",
        procedureText: "",
        procedurePool: [],
        evidence: [],
        lowRelevanceFallback: true,
        knowledgeCoverage: coverage,
        lowRelevanceDirective: [
          buildCoverageDirective(coverage, { domain, question: retrievalQuery }),
          comparisonBlueprint,
          buildLowRelevanceArchitectFramework({ domain, question: retrievalQuery })
        ].filter(Boolean).join("\n\n"),
        topScore
      };
    }
  }

  // Prefer coverage-filtered relevant chunks over raw productScoped when available.
  const effectiveScoped = scopedForAnswer.length ? scopedForAnswer : productScoped;
  // Configure / how-to asks: rank procedure sections ahead of Overview / interview summaries
  // before the topK slice — otherwise stepCount stays 0 and free LLM emits textbook junk.
  const configureAsk = Boolean(questionProcedureIntent(retrievalQuery, answerScope));
  const orderedScoped = configureAsk
    ? prioritizeProcedureChunks(retrievalQuery, effectiveScoped)
    : effectiveScoped;
  const rankedChunks = orderedScoped.slice(0, technicalFastPath ? Math.min(topK, 4) : topK);
  const diagnosticSections = new Set(["STAGE_INVESTIGATION"]);
  // Keep symptom-specific sections even when their headings use "troubleshooting"
  // or "triage" rather than the bare stems. The old word-boundary regex silently
  // discarded "Public Edition troubleshooting" and "IPS evidence-led triage",
  // then kept generic Production Support Activities chunks instead.
  const diagnosticChunkHeading = /\b(?:troubleshoot\w*|diagnos\w*|investigat\w*|triag\w*|production support|failing authorization|service not active|incident|symptom|failed entities|missing app|odata.*(?:fail|error|403))\b/i;
  const diagnosticChunks = rankedChunks.filter((chunk) => diagnosticChunkHeading.test(String(chunk.heading || chunk.section || "")));
  // Keep the ranked diagnostic set together: a query may need both the symptom procedure
  // and its conditional follow-up (for example, an OData authorization failure versus an
  // inactive service). Drop only generic production-support summaries when a real procedure
  // section is available; selecting one precise-sounding heading alone can choose the wrong
  // branch merely because it resembles one word in the symptom.
  const scopedDiagnosticChunks = diagnosticChunks.filter((chunk) => !/\bproduction support\b/i.test(String(chunk.heading || chunk.section || "")));
  const chunks = diagnosticSections.has(answerScope) && scopedDiagnosticChunks.length ? scopedDiagnosticChunks : rankedChunks;
  if (!chunks || chunks.length === 0) return { text: "", evidence: [], procedurePool: productScoped.slice(0, 12) };

  // Fix 1: keep same-heading siblings in the procedure pool even when topK selected a
  // citation-only chunk (live BRF Configure heading → footer sibling).
  const procedurePool = expandPoolWithHeadingSiblings(chunks, productScoped);

  const maxChars = APP_CONFIG?.maxContextCharacters || 3000;
  const seenChunks = new Set();
  const sourceBlocks = [];
  let currentLength = 0;

  for (const chunk of chunks) {
    if (!chunk?.content) continue;
    const body = String(chunk.content).trim();
    const source = String(chunk.sourceFile || chunk.documentId || "knowledge").slice(0, 120);
    const heading = stripBankQuestionLabels(String(chunk.heading || chunk.section || "")).slice(0, 160);
    // Skip coaching link dumps and title-only stubs — they are not answer evidence.
    if (/^related topics$/i.test(heading.trim())) continue;
    if (body.length < 60 || /^#+\s+\S[\s\S]{0,60}$/.test(body)) continue;
    // When the selected body is thin, assemble same-heading siblings for the prompt block.
    const assembled = isThinProcedureChunk(body)
      ? mergeSameHeadingChunks(chunk, procedurePool)
      : null;
    const cleanBody = stripBankQuestionLabels(
      assembled && !assembled.gap && assembled.text ? assembled.text : body
    );
    const identity = String(chunk.id || chunk.chunkId || `${source}:${heading}:${cleanBody.slice(0, 100)}`);
    if (!cleanBody || seenChunks.has(identity)) continue;
    seenChunks.add(identity);

    // Keep provenance and section boundaries intact. Flattening chunks into anonymous
    // paragraphs let the model splice a Public Edition navigation check, an ABAP Gateway
    // log, and an unrelated role procedure into one confident answer.
    // Never pass bank "Q5:" labels into the prompt — they leak into spoken answers.
    const label = `### SOURCE: ${source}${heading ? ` | SECTION: ${heading}` : ""}`;
    const block = `${label}\n${cleanBody}`;
    const remaining = maxChars - currentLength;
    if (block.length > remaining) {
      const availableBody = remaining - label.length - 1;
      if (availableBody > 120) {
        const prefix = cleanBody.slice(0, availableBody);
        const sentenceEnd = Math.max(prefix.lastIndexOf(". "), prefix.lastIndexOf(".\n"), prefix.lastIndexOf("."));
        const truncated = sentenceEnd > 80 ? prefix.slice(0, sentenceEnd + 1) : "";
        if (truncated) sourceBlocks.push(`${label}\n${truncated}`);
      }
      break;
    }
    sourceBlocks.push(block);
    currentLength += block.length + 2;
  }

  const procedureText = chunks
    .filter((chunk) => chunk?.content)
    .map((chunk) => {
      const h = stripBankQuestionLabels(String(chunk.heading || chunk.section || "").trim());
      const raw = String(chunk.content).trim();
      const assembled = isThinProcedureChunk(raw)
        ? mergeSameHeadingChunks(chunk, procedurePool)
        : null;
      const c = stripBankQuestionLabels(
        assembled && !assembled.gap && assembled.text ? assembled.text : raw
      );
      return `## ${h}\n${c}`;
    })
    .join("\n\n");

  const domain = analysis?.domain || analysis?.category || primaryCategory || "General";
  const needsCoverageDirective = [
    COVERAGE.RELEVANT_PARTIAL,
    COVERAGE.CONFLICTING_KNOWLEDGE
  ].includes(coverage.status);
  const comparisonBlueprint = buildComparisonAnswerBlueprint(retrievalQuery);

  return {
    text: sourceBlocks.join("\n\n"),
    procedureText,
    procedurePool,
    knowledgeCoverage: coverage,
    // Partial/conflicting: keep grounding text but instruct hybrid / qualified generation.
    lowRelevanceFallback: needsCoverageDirective,
    lowRelevanceDirective: needsCoverageDirective
      ? [
        buildCoverageDirective(coverage, { domain, question: retrievalQuery }),
        comparisonBlueprint
      ].filter(Boolean).join("\n\n")
      : (comparisonBlueprint || ""),
    evidence: [...new Map(chunks.map((chunk) => [
      stripBankQuestionLabels(String(chunk.heading || chunk.section || chunk.sourceFile || chunk.documentId || "knowledge")).slice(0, 160),
      chunk
    ])).values()].slice(0, 6).map((chunk) => ({
      id: String(chunk.id || chunk.chunkId || chunk.documentId || "").slice(0, 100),
      label: stripBankQuestionLabels(String(chunk.heading || chunk.section || chunk.sourceFile || chunk.documentId || "knowledge")).slice(0, 160),
      sourceFile: String(chunk.sourceFile || chunk.fileName || chunk.documentId || "").slice(0, 160),
      // Fix 3 provenance — observational metadata only (no ranking change).
      heading: stripBankQuestionLabels(String(chunk.heading || chunk.section || "")).slice(0, 160),
      chunkIndex: Number.isFinite(Number(chunk.chunkIndex)) ? Number(chunk.chunkIndex) : null,
      reviewStatus: chunk.reviewStatus || chunk.approvalStatus || null
    }))
  };
}

function alignedProcedureText(question, chunks = []) {
  // Prefer configure-ranked pool text; fall back to multi-term heading overlap.
  const fromPool = knowledgeFromProcedurePool(question, chunks, 8);
  if (fromPool.trim()) return fromPool;
  const stop = new Set(["about", "after", "would", "could", "should", "there", "their", "which", "where", "while", "through"]);
  const terms = [...new Set((String(question || "").toLowerCase().match(/[a-z0-9]{5,}/g) || []).filter((term) => !stop.has(term)))];
  const aligned = (Array.isArray(chunks) ? chunks : []).filter((chunk) => {
    const heading = String(chunk?.heading || chunk?.section || "").toLowerCase();
    return terms.filter((term) => heading.includes(term)).length >= 2;
  });
  return aligned
    .filter((chunk) => chunk?.content)
    .map((chunk) => `## ${String(chunk.heading || chunk.section || "").trim()}\n${String(chunk.content).trim()}`)
    .join("\n\n");
}

function sourceFilesFromEvidence(evidence = [], verifiedFiles = []) {
  const fromEvidence = (Array.isArray(evidence) ? evidence : [])
    .map((item) => String(item?.sourceFile || item?.label || item?.id || "").trim())
    .filter(Boolean);
  const fromVerified = (Array.isArray(verifiedFiles) ? verifiedFiles : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  return [...new Set([...fromVerified, ...fromEvidence])].slice(0, 12);
}

function prepareConversationHistory(history = []) {
  const validHistory = history.filter(
    item => item?.content && ["user", "assistant"].includes(item.role)
  );
  const providerSafe = (items) => items.map((item) => ({
    role: item.role,
    content: String(item.content).slice(0, 1600)
  }));

  if (validHistory.length <= MAX_HISTORY_ITEMS) {
    return providerSafe(validHistory);
  }

  const recentHistory = validHistory.slice(-MAX_HISTORY_ITEMS);
  if (recentHistory.length > 0 && recentHistory[0].role === "assistant") {
    const prevIdx = validHistory.length - MAX_HISTORY_ITEMS - 1;
    if (prevIdx >= 0 && validHistory[prevIdx].role === "user") {
      return providerSafe([validHistory[prevIdx], ...recentHistory]);
    }
  }

  return providerSafe(recentHistory);
}

async function streamGeminiResponse({ apiKey, model, systemPrompt, recentHistory, question, res, signal, maxTokens, onUsage, onChunk }) {
  assertLiveTransportAllowed(resolveProviderMode(process.env, APP_CONFIG), "gemini-sdk");
  const client = new GoogleGenerativeAI(apiKey);
  const generativeModel = client.getGenerativeModel({
    model,
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { temperature: 0.05, maxOutputTokens: maxTokens }
  });

  const chat = generativeModel.startChat({
    history: recentHistory.map(item => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.content }]
    }))
  });

  let fullText = "";
  const resultStream = await chat.sendMessageStream(question, { signal });
  for await (const chunk of resultStream.stream) {
    signal?.throwIfAborted();
    const finish = chunk.candidates?.[0]?.finishReason;
    if (finish) onUsage?.({ finish_reason: finish });
    const chunkText = stripStreamMarkdown(chunk.text());
    if (chunkText) {
      writeSSEChunk(res, chunkText);
      fullText += chunkText;
      onChunk?.(chunkText);
    }
  }
  return fullText;
}

async function createOpenAiChatStream(client, { model, systemPrompt, recentHistory, question, maxTokens, signal }) {
  return client.chat.completions.create(
    {
      model,
      temperature: 0.1,
      max_tokens: maxTokens,
      stream: true,
      stream_options: { include_usage: true },
      messages: [
        { role: "system", content: systemPrompt },
        ...recentHistory,
        { role: "user", content: question }
      ]
    },
    { signal }
  );
}

function isTransientLlmError(error) {
  return isRetryableLlmError(error);
}

// Route-level retry: up to 3 retries with exponential backoff + jitter on 429/5xx/timeouts.
// Never retries after the first answer token is already on the wire (avoids duplicated speech).
async function runProviderStreamWithRetry(run, { signal, hasOutput, sleepFn } = {}) {
  return runWithExponentialRetry(() => run(), {
    signal,
    hasOutput,
    maxRetries: MAX_RETRIES,
    sleepFn,
    isRetryable: isTransientLlmError
  });
}

function streamLocalKnowledgeFallback(res, question, {
  knowledgeContext = "",
  evidence = [],
  behavioralStarMode = false,
  writeChunk = writeSSEChunk,
  writeEvent = writeSSEEvent,
  // When true (generation buffer path), never emit tokens here — caller finalizes first.
  emit = true,
  interviewContext = {}
} = {}) {
  // Credential / years asks must never dump a random KB chunk (PMP/ITIL was matching PAM).
  // STAR turns must never dump a random KB chunk (that was flashing wrong Decision bullets).
  const fallback = isProfileCredentialQuestion(question)
    ? {
      answer: buildCredentialConfirmationAnswer(question),
      chunk: null,
      route: "PROFILE_CREDENTIAL_FALLBACK",
      sourceFile: "profile-facts",
      heading: "Confirmed profile credentials"
    }
    : behavioralStarMode
    ? {
      answer: buildStarLocalFallback(question),
      chunk: null,
      route: "STAR_LOCAL_FALLBACK",
      sourceFile: "star-local-fallback",
      heading: "Behavioral STAR methodology"
    }
    : buildLocalKnowledgeFallback(question, {
      prefetchedText: knowledgeContext,
      evidence
    });
  let answer = finalizeSpokenAnswer(fallback.answer, {
    behavioralStarMode,
    question
  });
  // Do not run integrity recovery on empty local knowledge — callers (especially
  // PROVIDER_DISABLED) must see emptiness and emit the operational disabled message
  // instead of a recovered hardcoded principle line.
  if (String(answer || "").trim().length >= 40) {
    try {
      const finalized = finalizeSpokenAnswerForDisplay({
        question,
        answer,
        interviewContext
      });
      answer = finalized.answer;
    } catch {
      // keep sanitized answer
    }
  }
  try {
    writeEvent?.(res, "admission", {
      decision: "ANSWER",
      route: fallback.route || (behavioralStarMode ? "STAR_LOCAL_FALLBACK" : "LOCAL_KNOWLEDGE_FALLBACK"),
      reason: "llm-unavailable-or-timeout",
      confidence: 0.7,
      evidenceMode: isProfileCredentialQuestion(question)
        ? "profile-facts"
        : behavioralStarMode
        ? "star-methodology"
        : "local-knowledge",
      sourceFile: fallback.sourceFile || null,
      heading: fallback.heading || null
    });
  } catch {
    // admission is informational; answer delivery is mandatory
  }
  if (emit !== false && res?.writable !== false) {
    writeChunk?.(res, answer);
  }
  return { ...fallback, answer };
}

async function streamOpenAIResponse({ apiKey, model, systemPrompt, recentHistory, question, res, signal, maxTokens, onUsage, onChunk }) {
  assertLiveTransportAllowed(resolveProviderMode(process.env, APP_CONFIG), "openai-sdk");
  // The route owns the single safe retry; disable nested SDK retries within the 25s budget.
  const client = new OpenAI({ apiKey, maxRetries: 0 });
  const args = { model, systemPrompt, recentHistory, question, maxTokens, signal };
  const stream = await createOpenAiChatStream(client, args);

  let fullText = "";
  let usage = null;
  for await (const part of stream) {
    signal?.throwIfAborted();
    if (part.usage) {
      usage = {
        ...(usage || {}),
        prompt_tokens: part.usage.prompt_tokens,
        completion_tokens: part.usage.completion_tokens,
        total_tokens: part.usage.total_tokens
      };
    }
    const finish = part.choices?.[0]?.finish_reason;
    if (finish) {
      usage = { ...(usage || {}), finish_reason: finish };
    }
    const text = stripStreamMarkdown(part.choices[0]?.delta?.content || "");
    if (text) {
      writeSSEChunk(res, text);
      fullText += text;
      if (typeof onChunk === "function") {
        try { onChunk(text); } catch { /* history only */ }
      }
    }
  }
  if (typeof onUsage === "function" && usage) {
    try { onUsage(usage); } catch { /* metadata only */ }
  }
  return fullText;
}

async function streamOpenRouterResponse({ apiKey, model, systemPrompt, recentHistory, question, res, signal, maxTokens, onUsage, onChunk }) {
  assertLiveTransportAllowed(resolveProviderMode(process.env, APP_CONFIG), "openrouter-sdk");
  // OpenRouter is API-compatible with OpenAI but uses openrouter.ai as base URL
  const client = new OpenAI({
    apiKey,
    maxRetries: 0,
    baseURL: "https://openrouter.io/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://interviewcopilot.app",
      "X-Title": "Interview Copilot"
    }
  });

  const stream = await client.chat.completions.create(
    {
      model,
      temperature: 0.1,
      max_tokens: maxTokens,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...recentHistory,
        { role: "user", content: question }
      ]
    },
    { signal }
  );

  let fullText = "";
  for await (const part of stream) {
    signal?.throwIfAborted();
    const finish = part.choices?.[0]?.finish_reason;
    if (finish) onUsage?.({ finish_reason: finish });
    const text = stripStreamMarkdown(part.choices[0]?.delta?.content || "");
    if (text) {
      writeSSEChunk(res, text);
      fullText += text;
      onChunk?.(text);
    }
  }
  return fullText;
}

async function streamClaudeResponse({ apiKey, model, systemPrompt, recentHistory, question, res, signal, maxTokens, onUsage, onChunk }) {
  assertLiveTransportAllowed(resolveProviderMode(process.env, APP_CONFIG), "anthropic-sdk");
  // Use Anthropic's Claude API
  const client = new Anthropic({
    apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    maxRetries: 0
  });

  const messages = [
    ...recentHistory,
    { role: "user", content: question }
  ];

  const stream = await client.messages.create(
    {
      model,
      max_tokens: maxTokens,
      temperature: 0.1,
      system: systemPrompt,
      messages,
      stream: true
    },
    { signal }
  );

  let fullText = "";
  for await (const event of stream) {
    signal?.throwIfAborted();
    if (event.type === "message_delta" && event.delta?.stop_reason) {
      onUsage?.({ finish_reason: event.delta.stop_reason });
    }
    if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
      const text = stripStreamMarkdown(event.delta.text || "");
      if (text) {
        writeSSEChunk(res, text);
        fullText += text;
        onChunk?.(text);
      }
    }
  }
  return fullText;
}

async function streamGroqResponse({ apiKey, model, systemPrompt, recentHistory, question, res, signal, maxTokens, onUsage, onChunk }) {
  assertLiveTransportAllowed(resolveProviderMode(process.env, APP_CONFIG), "groq-sdk");
  // Groq is OpenAI-compatible but uses groq.com as base URL
  const client = new OpenAI({
    apiKey,
    maxRetries: 0,
    baseURL: "https://api.groq.com/openai/v1"
  });

  const stream = await client.chat.completions.create(
    {
      model,
      temperature: 0.1,
      max_tokens: maxTokens,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...recentHistory,
        { role: "user", content: question }
      ]
    },
    { signal }
  );

  let fullText = "";
  for await (const part of stream) {
    signal?.throwIfAborted();
    const finish = part.choices?.[0]?.finish_reason;
    if (finish) onUsage?.({ finish_reason: finish });
    const text = stripStreamMarkdown(part.choices[0]?.delta?.content || "");
    if (text) {
      writeSSEChunk(res, text);
      fullText += text;
      onChunk?.(text);
    }
  }
  return fullText;
}

function setSSEHeaders(res) {
  try {
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    if (res.flushHeaders) {
      res.flushHeaders();
    }
    return true;
  } catch (error) {
    logger?.error?.("Failed to set SSE headers:", error);
    return false;
  }
}


export default async function handler(req, res) {
  // Log startup diagnostics once per process
  logStartupDiagnostics();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    apiKey: clientApiKey,
    model: requestedModel,
    question: requestedQuestion,
    history = [],
    customInstructions,
    candidateResume,
    jobDescription,
    company,
    sessionPreparation,
    sessionPrep: rawSessionPrep,
    interviewSessionId,
    debug: requestDebug,
    retryCount: clientRetryCount,
    responseLength: requestedResponseLength
  } = req.body || {};

  // Sidebar metadata: prefer structured fields; fall back to the formatted string the UI already sends.
  const sessionPrep = normalizeSessionPreparation(rawSessionPrep || {});
  const sessionPreparationText = formatSessionPreparation(sessionPrep)
    || (typeof sessionPreparation === "string" ? sessionPreparation.trim() : "");

  // Must be let: phonetic/admission normalization may rewrite the spoken transcript
  // (e.g. "Explain IAG?" → "Explain SAP Cloud IAG?"). Reassigning a destructured const
  // threw TypeError before SSE started, which the UI mapped to "temporary error".
  let question = typeof requestedQuestion === "string" ? requestedQuestion : "";

  // Falls back to the configured default (OPENAI_MODEL) when the client doesn't
  // specify one — lets provider/model be set purely through env vars for deployments
  // not driven by the Settings dialog, without any code change.
  const model = requestedModel || APP_CONFIG?.llm?.defaultModel || "gpt-4o";
  const responseLength = ["concise", "medium", "lengthy"].includes(String(requestedResponseLength || "").trim().toLowerCase())
    ? String(requestedResponseLength).trim().toLowerCase()
    : "medium";

  if (!model || !question?.trim()) {
    return res.status(400).json({
      error: "Model and question are required."
    });
  }

  // V2 Principal Architect engine (default ON): in-memory KB + gold boost + streaming gpt-4o.
  // System Audio auto-submit and typed Ask both hit this same /api/chat route.
  // Set USE_V2_ENGINE=0 to fall back to the legacy V1 pipeline.
  if (isV2EngineEnabled()) {
    const envApiKey = APP_CONFIG?.llm?.apiKeys?.openai || process.env.OPENAI_API_KEY || "";
    const handled = await serveV2Chat(req, res, {
      question,
      apiKey: clientApiKey || envApiKey,
      model,
      logger
    });
    if (handled) return;
  }

  // Resolve provider mode before any answer short-circuit so mock/live always share one
  // knowledge-grounded generation path (banks / verified / procedure are evidence, not substitutes).
  const providerMode = resolveProviderMode(process.env, APP_CONFIG);
  resetProviderStats(providerMode);
  const llmMustGenerate = providerMode === "mock" || providerMode === "live";

  let turn = { decision: "ANSWER", route: "GENERATION", reason: "admission-failed-open", scriptAnswer: "" };
  try {
    turn = decideInterviewTurn({ question, history });
  } catch (error) {
    logger?.error?.("Question admission failed:", error);
  }
  if (turn.normalizedQuestion) {
    question = String(turn.normalizedQuestion);
  }
  // V2.3: Q&A bank / prepared-script hits are not production answer substitutes when a
  // provider can generate. Files remain for regression / explicit rehearsal workflows.
  if (
    llmMustGenerate
    && turn.decision === "ANSWER"
    && (turn.route === "ANSWER_BANK" || turn.route === "PREPARED_SCRIPT")
  ) {
    turn = {
      ...turn,
      route: "GENERATION",
      reason: "knowledge-grounded-llm",
      scriptId: null,
      scriptAnswer: "",
      confidence: 0,
      via: undefined
    };
  }
  const persistIncomingTimeline = (text, answer = "") => {
    try {
      if (!interviewSessionId || !String(text || "").trim()) return;
      const active = readScenarioTimeline(interviewSessionId);
      const decision = nextScenarioTimeline({ active, question: text, answer });
      if (decision.action === "replace") writeScenarioTimeline(interviewSessionId, decision.timeline);
      if (decision.action === "clear") writeScenarioTimeline(interviewSessionId, null);
    } catch (timelineError) {
      logger?.error?.("Scenario timeline capture failed:", timelineError);
    }
  };
  if (turn.decision !== "ANSWER") persistIncomingTimeline(question, turn.scriptAnswer || "");

  // Master Technical Architect Directive: verified T-code procedures outrank answer-bank narrative
  // for configure / troubleshoot / migrate / technical-topic asks (bank prose often lacks GRFNMW_DB_CHECK, /IWFND/ERROR_LOG, etc.).
  try {
    if (
      turn.decision === "ANSWER"
      && (turn.route === "ANSWER_BANK" || turn.route === "PREPARED_SCRIPT")
    ) {
      const lifecycle = detectTechnicalLifecycle(question);
      const technicalAsk = isTechnicalTopicFastPath(question)
        || lifecycle === "configure"
        || lifecycle === "troubleshoot"
        || lifecycle === "implement_migrate";
      if (technicalAsk) {
        const verifiedPrefer = selectVerifiedWorkflow(question);
        if (verifiedPrefer?.answer) {
          turn = {
            ...turn,
            route: "GENERATION",
            reason: "verified-workflow-over-bank",
            scriptId: null,
            scriptAnswer: "",
            confidence: 0,
            via: undefined
          };
        }
      }
    }
  } catch (verifiedPreferError) {
    logger?.error?.("Verified-over-bank preference failed:", verifiedPreferError);
  }

  // Layer 7 early gate: clarify before bank/workflow/generation invents across missing or conflicting boundaries.
  // Exact answer-bank / prepared-script hits remain authoritative when admission already selected them.
  if (turn.decision === "ANSWER" && turn.route !== "PREPARED_SCRIPT" && turn.route !== "ANSWER_BANK") {
    try {
      const layer7Early = evaluateLayer7Clarity({ question });
      if (layer7Early.needsClarify && layer7Early.clarificationPrompt) {
        if (!setSSEHeaders(res)) {
          return res.status(500).json({ error: "Failed to initialize streaming response." });
        }
        layer7Early.clarificationPrompt = sanitizeSpokenAnswer(layer7Early.clarificationPrompt);
        writeSSEEvent(res, "admission", {
          decision: "ANSWER",
          route: "CLARIFY",
          reason: layer7Early.reason || "layer7-ambiguity",
          scriptId: null,
          confidence: 1,
          evidenceMode: null
        });
        writeSSEChunk(res, layer7Early.clarificationPrompt);
        if (res?.writable) {
          res.write("data: [DONE]\n\n");
          res.end();
        }
        return;
      }
    } catch (layer7Error) {
      logger?.error?.("Layer 7 clarity gate failed:", layer7Error);
    }
  }

  if (turn.decision !== "ANSWER" || turn.route === "PREPARED_SCRIPT" || turn.route === "ANSWER_BANK") {
    if (!setSSEHeaders(res)) {
      return res.status(500).json({ error: "Failed to initialize streaming response." });
    }
    try {
      writeSSEEvent(res, "admission", {
        decision: turn.decision,
        route: turn.route,
        reason: turn.reason,
        scriptId: turn.scriptId || null,
        confidence: turn.confidence || 0,
        evidenceMode: turn.evidenceMode || null,
        normalizedQuestion: turn.normalizedQuestion || null
      });
      if (turn.decision !== "ANSWER") {
        const ignorePayload = String(turn.scriptAnswer || "").trim() || (turn.reason === "ignore-noise" ? "[IGNORE_NOISE]" : "");
        if (ignorePayload) writeSSEChunk(res, ignorePayload);
        if (interviewSessionId) {
          try {
            appendQa(
              interviewSessionId,
              { model, company: String(company || "").slice(0, 80), source: "live-interview" },
              {
                question,
                answerShown: ignorePayload,
                status: turn.decision,
                disposition: turn.decision,
                route: "NONE",
                source: "admission",
                errorCode: turn.reason || "",
                latencyMs: 0
              }
            );
          } catch (recordError) {
            logger?.error?.("Admission session write failed:", recordError);
          }
        }
      }
      if (turn.route === "PREPARED_SCRIPT" && turn.scriptAnswer) {
        const preparedFinal = finalizeSpokenAnswerForDisplay({
          question,
          answer: shapeSpokenContract(turn.scriptAnswer)
        });
        turn.scriptAnswer = preparedFinal.answer;
        writeSSEChunk(res, turn.scriptAnswer);
        try {
          if (interviewSessionId) {
            appendQa(
              interviewSessionId,
              { model, company: String(company || "").slice(0, 80), source: "live-interview" },
              {
                question,
                answerShown: turn.scriptAnswer,
                status: "completed",
                model,
                source: "prepared-script",
                route: "PREPARED_SCRIPT",
                scriptId: turn.scriptId || "",
                disposition: "ANSWER",
                evidenceMode: turn.evidenceMode || "",
                latencyMs: 0,
                integrityRecovered: Boolean(preparedFinal.recovered),
                answerKind: preparedFinal.answerKind || "prepared_script"
              }
            );
          }
        } catch (recordError) {
          logger?.error?.("Prepared script session write failed:", recordError);
        }
      }
      // Answer-bank text is authored but still must pass integrity (no heading/metric leakage).
      if (turn.route === "ANSWER_BANK" && turn.scriptAnswer) {
        const bankFinal = finalizeSpokenAnswerForDisplay({
          question,
          answer: turn.scriptAnswer
        });
        turn.scriptAnswer = bankFinal.answer;
        writeSSEChunk(res, turn.scriptAnswer);
        try {
          if (interviewSessionId) {
            appendQa(
              interviewSessionId,
              { model, company: String(company || "").slice(0, 80), source: "live-interview" },
              {
                question,
                answerShown: turn.scriptAnswer,
                status: "completed",
                model,
                source: "answer-bank",
                route: "ANSWER_BANK",
                scriptId: turn.scriptId || "",
                disposition: "ANSWER",
                evidenceMode: turn.evidenceMode || "",
                latencyMs: 0,
                integrityRecovered: Boolean(bankFinal.recovered),
                answerKind: bankFinal.answerKind || "answer_bank"
              }
            );
          }
        } catch (recordError) {
          logger?.error?.("Answer bank session write failed:", recordError);
        }
      }
      if (res?.writable) {
        res.write("data: [DONE]\n\n");
        res.end();
      }
    } catch (error) {
      logger?.error?.("Admission response failed:", error);
      try { res.end(); } catch { /* the admission response is already closed */ }
    }
    return;
  }

  try {
    const storedTimeline = interviewSessionId ? readScenarioTimeline(interviewSessionId) : null;
    const timelinePolicy = unspecifiedTimelinePolicy(question, storedTimeline);
    if (timelinePolicy) {
      if (!setSSEHeaders(res)) {
        return res.status(500).json({ error: "Failed to initialize streaming response." });
      }
      const timelineFinal = finalizeSpokenAnswerForDisplay({
        question,
        answer: timelinePolicy
      });
      const timelineSpoken = timelineFinal.answer;
      writeSSEEvent(res, "admission", {
        decision: "ANSWER",
        route: "RETRIEVED_PROCEDURE",
        reason: "timeline-policy",
        scriptId: null,
        confidence: 1,
        evidenceMode: null
      });
      writeSSEChunk(res, timelineSpoken);
      persistIncomingTimeline(question, timelineSpoken);
      try {
        if (interviewSessionId) {
          appendQa(
            interviewSessionId,
            { model, company: String(company || "").slice(0, 80), source: "live-interview" },
            {
              question,
              answerShown: timelineSpoken,
              status: "completed",
              model,
              source: "timeline-policy",
              route: "RETRIEVED_PROCEDURE",
              disposition: "ANSWER",
              latencyMs: 0
            }
          );
        }
      } catch (recordError) {
        logger?.error?.("Timeline policy session write failed:", recordError);
      }
      if (res?.writable) {
        res.write("data: [DONE]\n\n");
        res.end();
      }
      return;
    }
  } catch (timelinePolicyError) {
    logger?.error?.("Timeline policy failed:", timelinePolicyError);
  }

  if (isContextOnlyTimeline(question)) {
    persistIncomingTimeline(question, "");
    if (!setSSEHeaders(res)) {
      return res.status(500).json({ error: "Failed to initialize streaming response." });
    }
    try {
      writeSSEEvent(res, "admission", {
        decision: "DEFER",
        route: "NONE",
        reason: "timeline-context",
        scriptId: null,
        confidence: 1,
        evidenceMode: null
      });
      if (interviewSessionId) {
        appendQa(
          interviewSessionId,
          { model, company: String(company || "").slice(0, 80), source: "live-interview" },
          {
            question,
            answerShown: "",
            status: "deferred",
            model,
            source: "timeline-context",
            route: "NONE",
            disposition: "DEFER",
            latencyMs: 0
          }
        );
      }
    } catch (contextError) {
      logger?.error?.("Timeline context capture failed:", contextError);
    }
    if (res?.writable) {
      res.write("data: [DONE]\n\n");
      res.end();
    }
    return;
  }

  // Verified workflows: when mock/live, keep as later prompt evidence — do not skip LLM generation.
  // When disabled (no provider), still serve verified local knowledge as an authoritative route.
  try {
    const verified = selectVerifiedWorkflow(question);
    if (verified?.answer && !llmMustGenerate) {
      let spoken = finalizeSpokenAnswer(
        fitSpokenLength(shapeSpokenContract(verified.answer), responseLength, question),
        { behavioralStarMode: false, question }
      );
      if (verified.experienceAsk) {
        try {
          const card = recallGroundedExperience(question);
          if (card?.spoken && !fieldConflictsWithCv(card.spoken) && cardCoversAskedWork(card, question)) {
            spoken = card.spoken;
          } else {
            spoken = `I would not claim that as a completed implementation.\n\n${verified.answer}`;
          }
        } catch (recallError) {
          logger?.error?.("Verified workflow experience recall failed:", recallError);
          spoken = `I would not claim that as a completed implementation.\n\n${verified.answer}`;
        }
      }
      const verifiedFinal = finalizeSpokenAnswerForDisplay({
        question,
        answer: spoken
      });
      spoken = verifiedFinal.answer;
      if (!setSSEHeaders(res)) {
        return res.status(500).json({ error: "Failed to initialize streaming response." });
      }
      writeSSEEvent(res, "admission", {
        decision: "ANSWER",
        route: "VERIFIED_WORKFLOW",
        reason: "verified-procedure",
        scriptId: verified.id,
        sourceFiles: verified.sourceFiles || [],
        confidence: 1,
        evidenceMode: null
      });
      writeSSEChunk(res, spoken);
      try {
        if (interviewSessionId) {
          appendQa(
            interviewSessionId,
            { model, company: String(company || "").slice(0, 80), source: "live-interview" },
            {
              question,
              answerShown: spoken,
              status: "completed",
              model,
              source: "verified-workflow",
              route: "VERIFIED_WORKFLOW",
              scriptId: verified.id || "",
              sourceFiles: verified.sourceFiles || [],
              disposition: "ANSWER",
              latencyMs: 0
            }
          );
        }
      } catch (recordError) {
        logger?.error?.("Verified workflow session write failed:", recordError);
      }
      if (res?.writable) {
        res.write("data: [DONE]\n\n");
        res.end();
      }
      return;
    }
  } catch (error) {
    logger?.error?.("Verified workflow selection failed:", error);
  }

  // Execution mode determines behavior: 'full' (production), 'retrieval-only' (diagnostic), 'disabled' (maintenance)
  // Defaults to 'full' for production safety; must be explicitly configured for other modes
  const validationMode = APP_CONFIG?.llm?.validationMode || 'full';
  const isProduction = validationMode === 'full';
  const isRetrievalOnly = validationMode === 'retrieval-only';
  const isDisabled = validationMode === 'disabled';

  // Log execution mode at request time
  logger?.info?.({
    event: 'interview.request',
    executionMode: validationMode,
    providerMode,
    model,
    isProduction,
    isRetrievalOnly,
    isDisabled
  });

  // Handle disabled mode
  if (isDisabled) {
    if (!setSSEHeaders(res)) {
      return res.status(500).json({ error: "Failed to initialize streaming response." });
    }
    const disabledMessage = {
      event: 'disabled',
      message: 'Interview Copilot is currently disabled for maintenance. Please try again later.'
    };
    if (res?.writable) {
      res.write(`event: disabled\ndata: ${JSON.stringify(disabledMessage)}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    }
    return;
  }

  // Client-supplied key (Settings dialog) takes priority; env var is the fallback for
  // deployments running a shared server-side key. Neither is required in
  // retrieval-only mode, since no LLM call is made.
  let envApiKey = "";
  if (isClaudeModel(model)) {
    envApiKey = APP_CONFIG?.llm?.apiKeys?.anthropic;
  } else if (isGeminiModel(model)) {
    envApiKey = APP_CONFIG?.llm?.apiKeys?.gemini;
  } else if (isGroqModel(model)) {
    envApiKey = APP_CONFIG?.llm?.apiKeys?.groq;
  } else {
    // Prefer a directly-configured OpenAI key; only fall back to OpenRouter when
    // no OpenAI key is set, so a stray/placeholder OPENROUTER_API_KEY in the host
    // environment can't silently hijack requests meant for OpenAI.
    envApiKey = APP_CONFIG?.llm?.apiKeys?.openai || APP_CONFIG?.llm?.apiKeys?.openrouter;
  }
  let apiKey = clientApiKey || envApiKey || "";
  // Body forceLocalFallback is only honored in live mode. Mock/disabled never escalate to live SDKs.
  const forceLocalFallback = providerMode === "live" && (
    process.env.LIVE_RELIABILITY_FORCE_FALLBACK === "1"
    || String(req.body?.forceLocalFallback || "") === "1"
    || String(req.body?.forceLocalFallback || "").toLowerCase() === "true"
  );
  // In mock/disabled mode, strip keys so live transport is never selected from client BYOK.
  if (providerMode === "mock" || providerMode === "disabled") {
    apiKey = "";
  }

  // Missing keys must not crash the live UI — continue and serve local KB fallback at generation time.
  if (isProduction && !apiKey && !forceLocalFallback && providerMode === "live") {
    let provider = "openai";
    if (isClaudeModel(model)) provider = "anthropic";
    else if (isGeminiModel(model)) provider = "gemini";
    logger?.warn?.({
      event: "interview.missing_api_key_fallback",
      model,
      provider,
      message: "No API key available; local knowledge fallback will be used if generation is required."
    });
  }

  if (!setSSEHeaders(res)) {
    return res.status(500).json({ error: "Failed to initialize streaming response." });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const onDisconnect = () => { if (!res.writableEnded) controller.abort(); };
  res.once?.("close", onDisconnect);
  let streamStarted = false;
  let recordedAnswer = "";
  let tokenUsage = null;
  const qaStartedMs = Date.now();
  const traceId = createTraceId();
  const stageTimer = createStageTimer(traceId);
  const stageTiming = { startedAt: qaStartedMs, firstTokenMs: null, streamEndMs: null, stages: {}, traceId, budgets: BUDGETS_MS };
  let qaRecorded = false;
  let interviewContext = null;
  const markStage = (name) => {
    try {
      const ms = stageTimer.mark(name);
      stageTiming.stages[name] = ms;
    } catch {
      // Timing is diagnostic only.
    }
  };
  let lastPromptFingerprint = null;
  const recordLiveQa = (fields) => {
    if (qaRecorded) return;
    try {
      if (!interviewSessionId) return;
      // Incomplete / early-terminated streams must never become valid conversation context.
      const status = String(fields?.status || "");
      const safeFields = { ...fields };
      if (status === "partial" || status === "empty" || status === "aborted") {
        safeFields.excludeFromContext = true;
        safeFields.answerShown = "";
        safeFields.contextAnswer = "";
      }
      // Fix 3 — attach diagnosable provenance without storing full prompts or KB bodies.
      if (!safeFields.provenance) {
        try {
          const preferMeta = safeFields.procedurePrefer || null;
          safeFields.provenance = buildAnswerProvenance({
            questionId: req.body?.questionId || null,
            route: safeFields.route || "",
            status: safeFields.status || "completed",
            model: safeFields.model || model || "",
            scriptId: safeFields.scriptId || preferMeta?.scriptId || null,
            promptPolicyVersion: PROMPT_POLICY_VERSION,
            promptFingerprint: lastPromptFingerprint
              || fingerprintPromptPolicy(safeFields.promptFingerprintBasis || PROMPT_POLICY_VERSION),
            evidence: safeFields.retrieval || [],
            procedurePrefer: preferMeta,
            answerKind: safeFields.answerKind || safeFields.usage?.answerKind || "",
            recovered: Boolean(safeFields.recovered || safeFields.usage?.recovered),
            finishReason: safeFields.finishReason || safeFields.usage?.finish_reason || null,
            contentQualityFlags: Array.isArray(safeFields.usage?.contentQualityFlags)
              ? safeFields.usage.contentQualityFlags
              : [],
            answerFinalEmitted: safeFields.answerFinalEmitted,
            validationPassed: status === "completed"
          });
        } catch {
          safeFields.provenance = null;
        }
      }
      delete safeFields.promptFingerprintBasis;
      const result = appendQa(
        interviewSessionId,
        {
          jobLabel: String(company || "").slice(0, 80),
          company: String(company || "").slice(0, 80),
          model,
          source: "live-interview"
        },
        {
          ...safeFields,
          finishReason: fields?.usage?.finish_reason || fields?.finishReason || null,
          stageTiming: {
            firstTokenMs: stageTiming.firstTokenMs,
            streamEndMs: stageTiming.streamEndMs,
            stages: { ...stageTiming.stages },
            totalMs: Date.now() - qaStartedMs
          }
        }
      );
      if (result.ok) qaRecorded = true;
    } catch {
      // History is non-critical. Generation must continue.
    }
  };

  try {
    interviewContext = resolveInterviewContext({
      questionRaw: question,
      history,
      source: req.body?.source,
      questionId: req.body?.questionId
    });
    const effectiveQuestion = interviewContext.questionResolved || question;
    const providerQuestion = interviewContext.answerTarget || interviewContext.questionRaw || question;
    const debugEnabled = requestDebug === true || req.query?.debug === "1" || process.env.INTERVIEW_DEBUG === "1";
    const contextualIntents = new Set([
      QUESTION_INTENTS.FOLLOW_UP,
      QUESTION_INTENTS.CLARIFICATION,
      QUESTION_INTENTS.CORRECTION,
      QUESTION_INTENTS.CHALLENGE,
      QUESTION_INTENTS.PROBE_DEEPER,
      QUESTION_INTENTS.REQUEST_FOR_EXAMPLE,
      QUESTION_INTENTS.REQUEST_FOR_TECHNICAL_STEPS,
      QUESTION_INTENTS.REQUEST_FOR_VALIDATION,
      QUESTION_INTENTS.REQUEST_FOR_REMEDIATION,
      QUESTION_INTENTS.REQUEST_FOR_EXPERIENCE,
      QUESTION_INTENTS.FRAGMENT
    ]);
    const recoverySignal = isRecoverySignal(question) && history.length > 0;
    const deepenFollowUp = !recoverySignal && (
      isDeepenFollowUp(question) ||
      interviewContext.questionIntent === QUESTION_INTENTS.PROBE_DEEPER ||
      interviewContext.depth === "deep"
    );

    // Context resolution (see resolveContext above) -- runs on every request, not just
    // follow-ups: with no history it reduces to exactly the classification every standalone
    // question already got, so this is a no-op for the majority case. For a follow-up, it
    // classifies the current question and (only if needed) the immediately preceding user turn
    // independently, then merges them by explicit precedence -- current-turn evidence always
    // wins; the prior turn's technical domain fills in only when the current turn shows no
    // genuine evidence of its own.
    const resolved = resolveContext(effectiveQuestion, history);
    const isFollowUp = recoverySignal
      || (history.length > 0 && contextualIntents.has(interviewContext.questionIntent))
      || isFollowUpUtterance(question, history)
      || deepenFollowUp
      || (resolved.contextSource === "inherited" && (isPlaneFoil(question) || isTopicContinuation(question)));
    const analysis = resolved.currentAnalysis;
    const primaryCategory = resolved.resolvedCategory;
    const secondaryCategories = resolved.resolvedSecondaryCategories;
    analysis.inheritedDomain = resolved.contextSource === "inherited" ? resolved.resolvedDomain : "";
    analysis.category = primaryCategory;
    analysis.secondaryCategories = secondaryCategories;
    analysis.domain = resolved.resolvedDomain;
    analysis.isFollowUp = isFollowUp;
    analysis.isDeepenFollowUp = deepenFollowUp;
    analysis.isRecoverySignal = recoverySignal;
    analysis.contextSource = resolved.contextSource;
    analysis.interviewContext = interviewContext;

    const reasoningContract = buildReasoningContract(effectiveQuestion, analysis);
    if (reasoningContract.reasoningMode === "resolve") {
      analysis.isBehavioral = true;
    }
    // Problem A fix: componentSelector.js/technicalReasoner.js previously never consulted
    // analysis.category, so a question already correctly classified as Behavioral/PMP/Leadership
    // (NON_SAP_TECHNICAL_CATEGORIES) could still receive SAP technical components purely because
    // interviewAnalyzer.js's own domain/intent scan found an unrelated technical match (e.g.
    // "stakeholder escalation" matching the Workflow intent pattern). reasoningContract.isHybrid
    // is the exact, already-computed signal that already governs reasoningMode for a genuine
    // SAP+PMP/Behavioral/Leadership question (see reasoningPlanner.js's isHybridSignal) -- passing
    // it through here reuses that single source of truth instead of re-deriving it, so a real
    // hybrid question (e.g. "stakeholder escalation during an SAP GRC implementation") keeps its
    // SAP components while a pure PMP/Behavioral/Leadership question does not.
    const sapComponents = selectSapComponents(effectiveQuestion, analysis, reasoningContract.isHybrid);
    const interviewer = profileInterviewer(effectiveQuestion, analysis);
    const technicalReasoning = buildTechnicalReasoning(
      effectiveQuestion,
      analysis,
      sapComponents,
      interviewer,
      reasoningContract.isHybrid
    );

    // Layer 8: behavioral / project-leadership asks bypass the vector index entirely and use STAR framing.
    const behavioralStarMode = isBehavioralStarIntent(effectiveQuestion || question, interviewContext)
      || isBehavioralStarIntent(question, interviewContext);
    if (behavioralStarMode) {
      analysis.isBehavioral = true;
      if (!analysis.category || analysis.category === "General") analysis.category = "Behavioral";
    }

    // A plain continuation ("then what?") doesn't need fresh retrieval -- the prior context
    // already covers it. A "go deeper" follow-up is the opposite case: the interviewer is
    // asking for MORE technical specificity than the first pass gave, which is exactly when
    // additional targeted retrieval helps most. Skipping it there was starving the one
    // follow-up type that most needed grounding.
    const shouldRetrieve = !behavioralStarMode && (
      interviewContext.retrievalDecision === "retrieve"
      || interviewContext.retrievalDecision === "active-context"
    );
    const abortIfTimedOut = () => {
      if (controller.signal.aborted) {
        throw Object.assign(new Error("Request timed out while generating response."), { name: "AbortError" });
      }
    };
    let knowledgeResult = { text: "", evidence: [] };
    if (shouldRetrieve) {
      let onAbort = null;
      try {
        knowledgeResult = await Promise.race([
          fetchKnowledgeContext(
            interviewContext.retrievalQuery || effectiveQuestion,
            primaryCategory,
            secondaryCategories,
            history,
            analysis,
            interviewContext.answerScope,
            resolved.contextSource === "inherited" && isFollowUp
          ),
          new Promise((_, reject) => {
            const fail = () => reject(Object.assign(new Error("Request timed out while generating response."), { name: "AbortError" }));
            if (controller.signal.aborted) {
              fail();
              return;
            }
            onAbort = fail;
            controller.signal.addEventListener("abort", fail, { once: true });
          })
        ]);
      } finally {
        if (onAbort) {
          try {
            controller.signal.removeEventListener("abort", onAbort);
          } catch {
            // listener already fired or signal already closed
          }
        }
      }
    }
    abortIfTimedOut();
    const knowledgeContext = knowledgeResult.text;
    const lowRelevanceFallback = knowledgeResult.lowRelevanceFallback === true
      || knowledgeResult.knowledgeCoverage?.status === COVERAGE.NO_RELEVANT_KNOWLEDGE
      || knowledgeResult.knowledgeCoverage?.status === COVERAGE.IRRELEVANT_RETRIEVAL;
    const lowRelevanceDirective = String(knowledgeResult.lowRelevanceDirective || "").trim();
    interviewContext.retrievalEvidence = knowledgeResult.evidence;
    interviewContext.knowledgeCoverage = knowledgeResult.knowledgeCoverage || null;
    const safeModeOn = isSafeModeEnabled(req.body);
    const profileSlug = String(req.body?.profileSlug || process.env.INTERVIEW_PROFILE_SLUG || DEFAULT_PROFILE_SLUG);

    // Engineering Memory Platform integration (docs/EXPERIENCE_ACQUISITION_ENGINE_DESIGN.md
    // section 9) -- additive, new prompt section, does not touch CANDIDATE BACKGROUND's
    // existing grounding clauses or any other currently-frozen Experience Activation content.
    // Same skip-on-plain-follow-up reasoning as knowledgeContext above. searchEngineeringMemory
    // itself short-circuits to a zero-cost no-op when the store is empty, so this is safe to
    // leave on unconditionally rather than gating behind whether records exist yet.
    let engineeringJudgment = { principles: [], records: [] };
    if (shouldRetrieve) {
      try {
        abortIfTimedOut();
        engineeringJudgment = await searchEngineeringMemory({
          question: interviewContext.retrievalQuery || effectiveQuestion,
          analysis,
          topK: 3
        });
      } catch (error) {
        if (error?.name === "AbortError") throw error;
        logger?.error?.("Engineering memory retrieval failed (non-fatal):", error);
      }
    }
    abortIfTimedOut();
    const engineeringJudgmentContext = behavioralStarMode
      ? ""
      : renderEngineeringJudgmentSection(engineeringJudgment);

    const promptPayload = {
      question: providerQuestion,
      interviewContext,
      analysis,
      reasoningContract,
      technicalReasoning,
      interviewer,
      knowledgeContext: behavioralStarMode
        ? buildStarFrameworkBlock({
          domain: analysis.domain || interviewContext.questionTopic || "",
          sessionPrep,
          question: effectiveQuestion || question
        })
        : knowledgeContext,
      // Prompt-only; never stream this string to the UI as answer text.
      // Pass coverage / comparison directives whenever present (partial, absent, or irrelevant).
      lowRelevanceDirective: (!behavioralStarMode && lowRelevanceDirective) ? lowRelevanceDirective : "",
      engineeringJudgmentContext,
      behavioralStarMode,
      sessionPrep,
      model,
      sapComponents: behavioralStarMode ? [] : technicalReasoning.recommendedComponents,
      activeDomainScope: resolved.contextSource === "inherited" ? resolved.resolvedDomain : "",
      responseLength
    };

    if (customInstructions?.trim()) promptPayload.customInstructions = customInstructions.trim();
    // Anti-hallucination: always reinforce T-code plane boundaries (SM20≠purge, etc.).
    try {
      const {
        TCODE_VERIFICATION_RULE,
        OUTPUT_SANITIZER_RULE,
        SPOKEN_CANDIDATE_VOICE_RULE
      } = require("../../lib/turnDecision.js");
      const rule = String(turn?.tcodeVerificationRule || TCODE_VERIFICATION_RULE || "").trim();
      const sanitizerRule = String(turn?.outputSanitizerRule || OUTPUT_SANITIZER_RULE || "").trim();
      const spokenVoiceRule = String(
        turn?.spokenCandidateVoiceRule || SPOKEN_CANDIDATE_VOICE_RULE || ""
      ).trim();
      const artifactRule = String(
        buildMasterArchitectDirective(effectiveQuestion || question) || TECH_ARTIFACT_FIRST_RULE || ""
      ).trim();
      // Spoken-candidate voice + meta-talk ban ride with every generation (sanitizer is defense-in-depth).
      const combined = [rule, spokenVoiceRule, sanitizerRule, artifactRule].filter(Boolean).join("\n\n");
      if (combined) {
        promptPayload.customInstructions = promptPayload.customInstructions
          ? `${promptPayload.customInstructions}\n\n${combined}`
          : combined;
      }
    } catch (tcodeRuleError) {
      logger?.error?.("T-code verification rule inject failed:", tcodeRuleError);
    }
    // Product comparison: ban analogies; force technical architecture matrix.
    try {
      const cmpQuestion = String(effectiveQuestion || question || "").trim();
      if (!behavioralStarMode && isProductComparisonQuestion(cmpQuestion)) {
        const cmpDirective = buildProductComparisonDirective(cmpQuestion);
        promptPayload.customInstructions = promptPayload.customInstructions
          ? `${promptPayload.customInstructions}\n\n${cmpDirective}`
          : cmpDirective;
      }
    } catch (cmpRuleError) {
      logger?.error?.("Product comparison directive inject failed:", cmpRuleError);
    }
    try {
      const extra = candidateResume?.trim();
      const evidence = scopeCareerEvidence(effectiveQuestion, priorAnchor(history));
      promptPayload.evidenceMode = evidence.mode;
      const scopedBody = evidence.mode === "full"
        ? (extra
          ? `${DEFAULT_CAREER_BACKGROUND}\n\nADDITIONAL BACKGROUND FROM SETTINGS:\n${extra}`
          : DEFAULT_CAREER_BACKGROUND)
        : (evidence.text || "");
      promptPayload.candidateResume = scopedBody
        ? `${STATED_PROFILE}\n\n${scopedBody}`
        : STATED_PROFILE;
    } catch (error) {
      logger?.error?.("Career timeline inject failed:", error);
      if (candidateResume?.trim()) promptPayload.candidateResume = candidateResume.trim();
    }
    try {
      const prepared = recallExpectedAnswer(effectiveQuestion);
      if (prepared?.answer) {
        promptPayload.expectedSpokenAnswer = prepared.answer;
      } else {
        const recallQuery = `${effectiveQuestion} ${resolved.resolvedDomain || ""}`.trim();
        const strongest = recallGroundedExperience(recallQuery);
        const procedureQuestion = interviewContext.answerScope === "IMPLEMENTATION_WALKTHROUGH";
        const asksPersonalHistory = /\b(?:have you|did you|your experience|tell me about|worked with|worked on|your role|your responsibilities)\b/i.test(question);
        const awarenessOnly = strongest?.strength === "thin";
        if (asksPersonalHistory && awarenessOnly && strongest?.spoken && !procedureQuestion) {
          promptPayload.expectedSpokenAnswer = shapeSpokenContract(strongest.spoken);
          promptPayload.speakExpectedAnswer = true;
        } else if (strongest && !scopedHistoryOnly(promptPayload.evidenceMode) && !procedureQuestion && !(awarenessOnly && !asksPersonalHistory)) {
          promptPayload.documentedExperience = formatMemoryCard(strongest);
          promptPayload.experienceSelection = {
            confidence: strongest.strength || strongest.confidence || "medium",
            label: strongest.topic || strongest.title || strongest.id || "documented match"
          };
        }
      }
    } catch (error) {
      logger?.error?.("Experience recall failed:", error);
    }

    // The source procedure must survive the final LLM paraphrase. When retrieval supplied
    // one coherent, ordered procedure block, make that block the answer anchor. This is a
    // single-pass generation still: it adds no model call and does not apply to personal-
    // experience questions, which remain governed by the candidate-evidence rules above.
    let scenarioTurn = { promptBlock: "", active: null };
    try {
      const storedTimeline = interviewSessionId ? readScenarioTimeline(interviewSessionId) : null;
      const historyText = (Array.isArray(history) ? history : []).map((item) => item?.content || "").join("\n");
      const recovered = !storedTimeline ? extractTimeline(historyText) : null;
      const activeTimeline = storedTimeline || (recovered
        ? { ...recovered, scenarioId: `scn_${interviewSessionId || "history"}`, source: "candidate" }
        : null);
      scenarioTurn = {
        active: activeTimeline,
        promptBlock: timelinePromptForTurn({ active: activeTimeline, question })
      };
      promptPayload.scenarioTimeline = scenarioTurn.promptBlock;
      if (!storedTimeline && activeTimeline && scenarioTurn.promptBlock && interviewSessionId) {
        writeScenarioTimeline(interviewSessionId, activeTimeline);
      }
    } catch (timelineError) {
      logger?.error?.("Scenario timeline read failed:", timelineError);
    }
    const persistScenarioTimeline = (answer) => {
      try {
        if (!interviewSessionId || !String(answer || "").trim()) return;
        const decision = nextScenarioTimeline({ active: scenarioTurn.active, question, answer });
        if (decision.action === "replace") writeScenarioTimeline(interviewSessionId, decision.timeline);
        if (decision.action === "clear") writeScenarioTimeline(interviewSessionId, null);
      } catch (timelineError) {
        logger?.error?.("Scenario timeline update failed:", timelineError);
      }
    };

    // Grounded safe routes only (prepared / verified / procedure / conceptual knowledge).
    // Thin RAG must CONTINUE into hybrid LLM generation — never serve meta-refusal text.
    const GROUNDED_SAFE_ROUTES = new Set([
      "PREPARED_PACK",
      "VERIFIED_WORKFLOW",
      "RETRIEVED_PROCEDURE",
      "CONCEPTUAL_KNOWLEDGE"
    ]);
    if (safeModeOn && !behavioralStarMode && !scenarioTurn.promptBlock) {
      try {
        markStage("safe_mode_resolve");
        const seniorityHint = [jobDescription, company, sessionPreparationText, STATED_PROFILE]
          .filter(Boolean)
          .join(" ");
        const safe = resolveSafeModeAnswer({
          question: effectiveQuestion || question,
          profileSlug,
          knowledgeText: knowledgeContext,
          answerScope: interviewContext.answerScope,
          seniority: seniorityHint
        });
        if (safe.served !== false && GROUNDED_SAFE_ROUTES.has(safe.route)) {
          let spoken = sanitizeSpokenAnswer(String(safe.answer || "").trim());
          // Verified workflows are pre-authored baselines — do not strip their T-codes
          // merely because the live retrieval context is thin.
          if (safe.route !== "VERIFIED_WORKFLOW") {
            spoken = stripUngroundedSapEntities(spoken, knowledgeContext || "");
          }
          const coherence = postStripCoherenceCheck(safe.answer, spoken);
          if (!coherence.ok || isMetaRefusalText(spoken) || looksIncompleteSpokenAnswer(spoken)) {
            // Do not block the turn — fall through to generative completion.
            markStage("safe_mode_continue_generation");
          } else {
            const safeFinal = finalizeSpokenAnswerForDisplay({
              question: effectiveQuestion || question,
              answer: spoken,
              interviewContext
            });
            spoken = safeFinal.answer;
            streamStarted = true;
            recordedAnswer = spoken;
            writeSSEEvent(res, "admission", {
              decision: "ANSWER",
              route: safe.route,
              reason: safe.reason,
              safeMode: true,
              traceId,
              profileSlug,
              confidence: 1,
              responseLength
            });
            writeSSEEvent(res, "generation", {
              finish_reason: "stop",
              safeMode: true,
              traceId,
              route: safe.route,
              firstTokenMs: stageTimer.snapshot().firstTokenMs,
              streamEndMs: Date.now() - qaStartedMs,
              budgets: BUDGETS_MS
            });
            writeSSEAnswer(res, spoken);
            persistScenarioTimeline(spoken);
            markStage("safe_mode_served");
            recordLiveQa({
              question,
              questionRaw: question,
              questionResolved: effectiveQuestion,
              interviewContext,
              answerShown: spoken,
              status: "completed",
              model: "safe-mode",
              source: req.body?.source,
              route: safe.route,
              disposition: "ANSWER",
              evidenceMode: "safe-mode",
              latencyMs: Date.now() - qaStartedMs,
              finishReason: "stop",
              usage: { finish_reason: "stop", safeMode: true, traceId, meta: safe.meta || null }
            });
            if (res?.writable) {
              res.write("data: [DONE]\n\n");
              res.end();
            }
            return;
          }
        }
      } catch (safeError) {
        logger?.error?.("Safe mode resolve failed (continuing):", safeError);
      }
    }

    let retrievedProcedureAnswer = "";
    let procedurePreferMeta = null;
    // Low-relevance turns must go through the LLM fluent-prose path — never stream empty/fallback prose.
    // Also refuse first-person canned Fiori stubs that used to leak from the knowledge index.
    const looksLikeHardcodedStub = (text) => /If the server is on premise,\s*I would follow the ABAP Fiori path/i.test(String(text || ""))
      || /LOW-RELEVANCE RETRIEVAL FALLBACK/i.test(String(text || ""))
      || /INTERNAL RETRIEVAL NOTE/i.test(String(text || ""))
      // Shallow s4hana-fiori "Implementation Activities" checklist spoken as RETRIEVED_PROCEDURE.
      || /First, maintain OData service authorization for standard and custom Fiori apps/i.test(String(text || ""));
    const seniorityHint = [jobDescription, company, sessionPreparationText, STATED_PROFILE]
      .filter(Boolean)
      .join(" ");
    if (!lowRelevanceFallback
      && !behavioralStarMode
      && !scenarioTurn.promptBlock
      && !promptPayload.expectedSpokenAnswer
      && !/\b(?:have you|did you|your experience|tell me about a time|walk me through a time)\b/i.test(question)) {
      try {
        markStage("procedure_prefer_start");
        const procedureQuestion = questionProcedureIntent(question, interviewContext.answerScope)
          ? question
          : (effectiveQuestion || question);
        const primaryKnowledge = knowledgeResult.procedureText || knowledgeContext;
        const pool = knowledgeResult.procedurePool || [];
        const seedChunks = (knowledgeResult.evidence || [])
          .map((row) => pool.find((chunk) => String(chunk.id || chunk.chunkId || "") === String(row.id || ""))
            || pool.find((chunk) => String(chunk.heading || chunk.section || "") === String(row.label || "")))
          .filter(Boolean);
        let preferDecision = shouldPreferRetrievedProcedure({
          question: procedureQuestion,
          knowledgeText: primaryKnowledge,
          answerScope: interviewContext.answerScope,
          seniority: seniorityHint,
          procedurePool: pool,
          seedChunks: seedChunks.length ? seedChunks : pool.slice(0, 3)
        });
        if (!preferDecision.prefer) {
          const aligned = alignedProcedureText(procedureQuestion, pool);
          if (aligned) {
            preferDecision = shouldPreferRetrievedProcedure({
              question: procedureQuestion,
              knowledgeText: aligned,
              answerScope: interviewContext.answerScope,
              seniority: seniorityHint,
              procedurePool: pool,
              seedChunks: seedChunks.length ? seedChunks : pool.slice(0, 3)
            });
          }
        }
        // Keep spoken for in-process D2 recovery only — do not put full prose on SSE admission.
        procedurePreferMeta = {
          prefer: Boolean(preferDecision.prefer),
          reason: preferDecision.reason || null,
          wrapMode: preferDecision.wrapMode || null,
          stepCount: preferDecision.stepCount || 0,
          sourceTag: preferDecision.sourceTag || null,
          workflowBackboneAsk: Boolean(preferDecision.workflowBackboneAsk),
          retrievalGap: preferDecision.retrievalGap || preferDecision.enrichment?.gap || null,
          enrichmentReason: preferDecision.enrichment?.reason || null,
          // Fix 3 — retain selection/eligibility evidence for provenance (not spoken prose).
          taskFit: preferDecision.taskFit || preferDecision.enrichment?.taskFit || null,
          alignment: preferDecision.alignment || null,
          enrichment: preferDecision.enrichment
            ? {
              enriched: Boolean(preferDecision.enrichment.enriched),
              gap: preferDecision.enrichment.gap || null,
              sourceFile: preferDecision.enrichment.sourceFile || null,
              heading: preferDecision.enrichment.heading || null,
              chunkIds: Array.isArray(preferDecision.enrichment.chunkIds)
                ? preferDecision.enrichment.chunkIds.slice(0, 8)
                : [],
              reason: preferDecision.enrichment.reason || null
            }
            : null
        };
        if (preferDecision.spoken) {
          procedurePreferMeta._spoken = preferDecision.spoken;
        }
        if (preferDecision.prefer && preferDecision.spoken) {
          const candidate = fitSpokenLength(
            preferDecision.spoken,
            responseLength,
            procedureQuestion
          );
          if (!looksLikeHardcodedStub(candidate)) {
            // Provenance: KB-backed procedure candidates must ground against their own source
            // text plus retrieval context. Never strip identifiers that appear in the candidate
            // itself when that candidate is the retrieved procedure (PFCG Q1 defect). This
            // branch only cleans prefer seeds — not arbitrary LLM self-grounding.
            const groundedKnowledge = [
              primaryKnowledge,
              knowledgeContext,
              preferDecision.spoken,
              candidate
            ].filter(Boolean).join("\n");
            let cleaned = stripUngroundedSapEntities(candidate, groundedKnowledge);
            const coherence = postStripCoherenceCheck(candidate, cleaned);
            const stripDestroyedMeaning = isDestructiveEntityStripResult(candidate, cleaned);
            if (
              !coherence.ok
              || stripDestroyedMeaning
              || isMetaRefusalText(cleaned)
              || !String(cleaned || "").trim()
            ) {
              // Procedure text is already source-backed — keep the candidate rather than
              // hollowed "Review table for…" output.
              cleaned = (!isMetaRefusalText(candidate) && String(candidate || "").trim().length > 40)
                ? candidate
                : "";
              procedurePreferMeta.coherenceFallback = stripDestroyedMeaning
                ? "destructive-entity-strip"
                : (coherence.reason || "meta-or-incoherent");
            }
            // V2.3: when a provider can generate, retrieved procedure is evidence for the LLM —
            // never a RETRIEVED_PROCEDURE short-circuit that skips generation.
            if (cleaned && cleaned.trim()) {
              if (llmMustGenerate || preferDecision.wrapMode === "senior-backbone") {
                promptPayload.expectedSpokenAnswer = cleaned;
                promptPayload.procedureBackbone = true;
                promptPayload.speakExpectedAnswer = false;
                procedurePreferMeta.servedAs = llmMustGenerate
                  ? "kb-evidence-backbone"
                  : "senior-backbone";
              } else {
                retrievedProcedureAnswer = cleaned;
                promptPayload.expectedSpokenAnswer = retrievedProcedureAnswer;
                procedurePreferMeta.servedAs = "direct-procedure";
              }
            }
          }
        }
        markStage("procedure_prefer_end");
      } catch (error) {
        logger?.error?.("Retrieved procedure retention failed (non-fatal):", error);
      }
    }
    // Late verified playbook only when selectVerifiedWorkflow already applies — do not force
    // an MSMP BRF workflow onto a generic BRFplus question (Fix 1 task-fit).
    if (!retrievedProcedureAnswer && !promptPayload.procedureBackbone) {
      try {
        const qLate = effectiveQuestion || question;
        const brfGenericBlocked = /\bBRF(?:\+|plus)(?!\w)/i.test(qLate) && !asksMsmpScopedBrf(qLate);
        if (!brfGenericBlocked) {
          const verifiedLate = selectVerifiedWorkflow(qLate);
          if (verifiedLate?.answer) {
            const verifiedSpoken = fitSpokenLength(
              shapeSpokenContract(verifiedLate.answer),
              responseLength,
              qLate
            );
            procedurePreferMeta = {
              ...(procedurePreferMeta || {}),
              prefer: true,
              reason: "verified-workflow-backbone",
              stepCount: Math.max(Number(procedurePreferMeta?.stepCount) || 0, 3),
              servedAs: llmMustGenerate ? "kb-evidence-backbone" : "verified-workflow",
              scriptId: verifiedLate.id || null,
              sourceFiles: verifiedLate.sourceFiles || []
            };
            promptPayload.expectedSpokenAnswer = verifiedSpoken;
            if (llmMustGenerate) {
              promptPayload.procedureBackbone = true;
              promptPayload.speakExpectedAnswer = false;
            } else {
              retrievedProcedureAnswer = verifiedSpoken;
            }
          }
        }
      } catch (verifiedLateError) {
        logger?.error?.("Late verified workflow backbone failed:", verifiedLateError);
      }
    }
    if (jobDescription?.trim()) promptPayload.jobDescription = jobDescription.trim();
    if (sessionPreparationText) promptPayload.sessionPreparation = sessionPreparationText;
    if (company?.trim()) promptPayload.company = company.trim();

    // A model paraphrase is not a safe final authority when the current question has
    // one coherent, product-scoped procedure in the retrieved evidence — unless senior
    // wrap mode keeps the procedure as backbone for a single constrained generation pass.
    if (!retrievedProcedureAnswer && promptPayload.speakExpectedAnswer && promptPayload.expectedSpokenAnswer
      && !promptPayload.procedureBackbone) {
      retrievedProcedureAnswer = promptPayload.expectedSpokenAnswer;
    }
    if (retrievedProcedureAnswer) {
      streamStarted = true;
      const procedureFinal = finalizeSpokenAnswerForDisplay({
        question: effectiveQuestion || question,
        answer: retrievedProcedureAnswer,
        interviewContext
      });
      retrievedProcedureAnswer = procedureFinal.answer;
      recordedAnswer = retrievedProcedureAnswer;
      const procedureRoute = procedurePreferMeta?.servedAs === "verified-workflow"
        ? "VERIFIED_WORKFLOW"
        : "RETRIEVED_PROCEDURE";
      const procedureSourceFiles = sourceFilesFromEvidence(
        knowledgeResult.evidence,
        procedurePreferMeta?.sourceFiles || []
      );
      const procedurePreferPublic = procedurePreferMeta
        ? {
          prefer: procedurePreferMeta.prefer,
          reason: procedurePreferMeta.reason,
          wrapMode: procedurePreferMeta.wrapMode,
          stepCount: procedurePreferMeta.stepCount,
          servedAs: procedurePreferMeta.servedAs || null,
          sourceTag: procedurePreferMeta.sourceTag || null,
          scriptId: procedurePreferMeta.scriptId || null
        }
        : undefined;
      writeSSEEvent(res, "admission", {
        decision: "ANSWER",
        route: procedureRoute,
        reason: procedurePreferMeta?.reason || "coherent-source-procedure",
        scriptId: procedurePreferMeta?.scriptId || null,
        confidence: 1,
        evidenceMode: null,
        responseLength,
        procedurePrefer: procedurePreferPublic,
        sourceFiles: procedureSourceFiles
      });
      writeSSEEvent(res, "answer_final", {
        text: retrievedProcedureAnswer,
        answerKind: procedureFinal.answerKind || "validated",
        recovered: Boolean(procedureFinal.recovered),
        flag: procedureFinal.recovered ? "integrity_gate" : null,
        replacesStream: false,
        bufferedPreDisplay: true,
        route: procedureRoute
      });
      writeSSEAnswer(res, retrievedProcedureAnswer);
      persistScenarioTimeline(retrievedProcedureAnswer);
      markStage("retrieved_procedure_served");
      recordLiveQa({
        question,
        questionRaw: question,
        questionResolved: effectiveQuestion,
        interviewContext,
        answerShown: retrievedProcedureAnswer,
        status: "completed",
        model,
        source: req.body?.source,
        route: procedureRoute,
        scriptId: procedurePreferMeta?.scriptId || "",
        sourceFiles: procedureSourceFiles,
        disposition: "ANSWER",
        evidenceMode: procedureRoute === "VERIFIED_WORKFLOW" ? "verified-workflow" : "knowledge-procedure",
        latencyMs: Date.now() - qaStartedMs,
        usage: { finish_reason: "stop", procedurePrefer: procedurePreferMeta },
        procedurePrefer: procedurePreferMeta || undefined,
        retrieval: knowledgeResult.evidence,
        answerKind: procedureRoute === "VERIFIED_WORKFLOW" ? "verified_workflow" : "retrieved_procedure",
        recovered: false,
        answerFinalEmitted: false,
        promptFingerprintBasis: PROMPT_POLICY_VERSION
      });
      if (res?.writable) {
        res.write("data: [DONE]\n\n");
        res.end();
      }
      return;
    }

    const systemPrompt = buildSapInterviewPrompt(promptPayload);
    // Fix 3 — fingerprint only (never persist systemPrompt body on the session record).
    try {
      lastPromptFingerprint = fingerprintPromptPolicy(systemPrompt);
    } catch {
      lastPromptFingerprint = fingerprintPromptPolicy(PROMPT_POLICY_VERSION);
    }
    // Opt-in diagnostic (off by default, zero effect unless DEBUG_DUMP_PROMPT is set): dumps
    // the exact raw prompt sent to the model to a file, so information-flow questions ("is X
    // actually in the prompt, and where") can be answered by observation instead of inferred
    // from source code.
    if (process.env.DEBUG_DUMP_PROMPT) {
      require("fs").writeFileSync(process.env.DEBUG_DUMP_PROMPT, systemPrompt, "utf-8");
    }
    // Keep conversation memory for continuations only. Passing the previous
    // unrelated interview exchange to the model let IAG configuration leak
    // into a fresh GRC question even though retrieval had selected GRC sources.
    const recentHistory = prepareConversationHistory(historyForCurrentTurn(history, isFollowUp));

    // Fixed completion budget — never omit max_tokens (provider defaults are often ~256–300).
    // Category budgets remain soft prompt preferences only; API hard-cap is always 2048.
    const maxTokens = 2048;

    if (debugEnabled) {
      writeSSEEvent(res, "context", sanitizeDebugContext(interviewContext, {
        latencyMs: Date.now() - qaStartedMs,
        classification: primaryCategory,
        domain: analysis.domain,
        reasoning: { mode: reasoningContract.reasoningMode },
        components: technicalReasoning.recommendedComponents,
        experienceConfidence: promptPayload.experienceSelection?.confidence || "low",
        experienceLabel: promptPayload.experienceSelection?.label || "expertise-only",
        requestedAnswerLength: interviewContext.depth
      }));
    }

    if (interviewContext.retrievalDecision === "clarify") {
      streamStarted = true;
      const clarifyRaw = String(interviewContext.clarificationPrompt || "").trim()
        || clarificationRequired(
          interviewContext.questionTopic === "General"
            ? "The question is incomplete. Could you please repeat or rephrase it with the specific SAP product and deployment context?"
            : `Could you finish that question about ${interviewContext.questionTopic} with the specific product or deployment context needed?`
        );
      // Clarifications are control utterances — still sanitize; do not run technical concept contracts.
      recordedAnswer = sanitizeSpokenAnswer(clarifyRaw);
      writeSSEEvent(res, "admission", {
        decision: "ANSWER",
        route: "CLARIFY",
        reason: interviewContext.layer7Reason || "clarify",
        scriptId: null,
        confidence: 1,
        evidenceMode: null
      });
      writeSSEChunk(res, recordedAnswer);
      recordLiveQa({
        question,
        questionRaw: question,
        questionResolved: effectiveQuestion,
        interviewContext,
        answerShown: recordedAnswer,
        status: "completed",
        model,
        source: req.body?.source,
        latencyMs: Date.now() - qaStartedMs
      });
      res.write("data: [DONE]\n\n");
      return;
    }

    const streamOptions = {
      apiKey,
      model,
      systemPrompt,
      recentHistory,
      question: providerQuestion,
      res,
      signal: controller.signal,
      maxTokens,
      onUsage: (usage) => {
        tokenUsage = { ...(tokenUsage || {}), ...usage };
      },
      onChunk: (text) => {
        if (String(text || "").length) {
          const ft = stageTimer.markFirstToken();
          stageTiming.firstTokenMs = ft;
        }
        recordedAnswer += text;
      }
    };

    // Pre-display integrity: buffer ALL provider tokens server-side. Do not expose
    // candidate-facing text until sanitization + relevance validation complete.
    // STAR employer anonymization uses the same buffered path.
    const starBufferEmployers = behavioralStarMode && !starMayNameEmployer(effectiveQuestion || question);
    const bufferBeforeDisplay = true;
    if (bufferBeforeDisplay || starBufferEmployers) {
      streamOptions.res = { writable: false };
    }

    streamStarted = true;

    if (isRetrievalOnly) {
      // Retrieval-only diagnostic mode: validates the pipeline up through prompt construction
      // without calling LLM or spending real API tokens. Useful for validating RAG quality.
      logger?.info?.({
        event: 'interview.retrieval_only_mode',
        model,
        knowledgeContextLength: knowledgeContext.length,
        systemPromptLength: systemPrompt.length
      });

      const diagnostic = {
        mode: "retrieval-only",
        note: 'Retrieval-only diagnostic mode: knowledge retrieved and prompt constructed, but no LLM call made.',
        model,
        provider: isGeminiModel(model) ? 'gemini' : 'openai',
        maxTokens,
        category: analysis.category,
        sapComponents: technicalReasoning.recommendedComponents,
        knowledgeContextChars: knowledgeContext.length,
        systemPromptChars: systemPrompt.length,
        timestamp: new Date().toISOString()
      };
      if (res?.writable) {
        res.write(`event: retrieval_only\ndata: ${JSON.stringify(diagnostic)}\n\n`);
      }
    } else {
      try {
        writeSSEEvent(res, "admission", {
          decision: "ANSWER",
          route: "GENERATION",
          reason: turn.reason,
          scriptId: null,
          evidenceMode: promptPayload.evidenceMode || "full",
          responseLength
        });
      } catch (admissionError) {
        logger?.error?.("Generation admission event failed:", admissionError);
      }
      // Production mode: stream the LLM response
      logger?.info?.({
        event: 'interview.streaming_llm_response',
        model,
        provider: isGeminiModel(model) ? 'gemini' : 'openai',
        hasApiKey: !!apiKey
      });

      let fullAnswerText = "";
      let generationRoute = "GENERATION";
      let generationModel = model;

      const shouldSkipRemoteLlm = forceLocalFallback || (!apiKey && providerMode === "live");

      if (providerMode === "disabled") {
        recordDisabledBlocked();
        logger?.warn?.({
          event: "interview.provider_disabled",
          providerMode,
          model
        });
        // Prefer permitted local knowledge when available; otherwise controlled unavailable text.
        const fallback = streamLocalKnowledgeFallback(res, effectiveQuestion || question, {
          knowledgeContext,
          evidence: knowledgeResult.evidence || interviewContext?.retrievalEvidence || [],
          behavioralStarMode,
          interviewContext,
          emit: false
        });
        const localAnswer = String(fallback?.answer || "").trim();
        fullAnswerText = localAnswer.length >= 40 ? localAnswer : DISABLED_GENERATION_MESSAGE;
        recordedAnswer = fullAnswerText;
        generationRoute = localAnswer.length >= 40
          ? (behavioralStarMode ? "STAR_LOCAL_FALLBACK" : "LOCAL_KNOWLEDGE_FALLBACK")
          : "PROVIDER_DISABLED";
        generationModel = "disabled";
      } else if (providerMode === "mock") {
        logger?.info?.({
          event: "interview.mock_provider",
          providerMode,
          model
        });
        // Prefer KB / procedure backbone as the deterministic mock "LLM" output when present;
        // otherwise buildDeterministicMockAnswer (non-SAP questions must not get SAP-plane prose).
        const mockSeed = String(promptPayload.expectedSpokenAnswer || "").trim();
        const mockGrounding = [knowledgeContext, mockSeed].filter(Boolean).join("\n\n");
        const mockText = await streamMockProviderResponse({
          question: effectiveQuestion || question,
          res: streamOptions.res,
          onChunk: streamOptions.onChunk,
          answerText: mockSeed,
          knowledgeContext: mockGrounding
        });
        fullAnswerText = finalizeSpokenAnswer(mockText || "", {
          behavioralStarMode,
          question: effectiveQuestion || question
        });
        recordedAnswer = fullAnswerText;
        generationRoute = "GENERATION";
        generationModel = "mock-deterministic";
      } else if (shouldSkipRemoteLlm) {
        logger?.warn?.({
          event: "interview.local_knowledge_fallback",
          reason: forceLocalFallback ? "forced" : "missing-api-key",
          model
        });
        const fallback = streamLocalKnowledgeFallback(res, effectiveQuestion || question, {
          knowledgeContext,
          evidence: knowledgeResult.evidence || interviewContext?.retrievalEvidence || [],
          behavioralStarMode,
          interviewContext,
          // Buffer only — integrity gate below is the sole emission point.
          emit: false
        });
        fullAnswerText = fallback.answer;
        recordedAnswer = fallback.answer;
        generationRoute = behavioralStarMode ? "STAR_LOCAL_FALLBACK" : "LOCAL_KNOWLEDGE_FALLBACK";
      } else {
        const providerChain = resolveProviderFailoverChain({
          primaryModel: model,
          primaryApiKey: apiKey,
          apiKeys: APP_CONFIG?.llm?.apiKeys || {}
        });

        const runProviderAttempt = async ({ provider, model: attemptModel, apiKey: attemptKey, signal }) => {
          const attemptOptions = {
            ...streamOptions,
            apiKey: attemptKey,
            model: attemptModel,
            signal
          };
          if (provider === "anthropic" || isClaudeModel(attemptModel)) {
            return streamClaudeResponse(attemptOptions);
          }
          if (provider === "gemini" || isGeminiModel(attemptModel)) {
            return streamGeminiResponse(attemptOptions);
          }
          if (provider === "groq" || isGroqModel(attemptModel)) {
            return streamGroqResponse(attemptOptions);
          }
          if (provider === "openrouter") {
            return streamOpenRouterResponse(attemptOptions);
          }
          if (APP_CONFIG?.llm?.apiKeys?.openrouter && !APP_CONFIG?.llm?.apiKeys?.openai) {
            return streamOpenRouterResponse(attemptOptions);
          }
          return streamOpenAIResponse(attemptOptions);
        };

        try {
          const reliable = await generateWithReliability(runProviderAttempt, {
            chain: providerChain,
            parentSignal: controller.signal,
            hasOutput: () => recordedAnswer.length > 0,
            // STAR answers need artifact density; 4s hard-cut was forcing wrong KB local fallback.
            timeoutMs: behavioralStarMode ? Math.max(LLM_REQUEST_TIMEOUT_MS, 12000) : LLM_REQUEST_TIMEOUT_MS,
            maxRetries: MAX_RETRIES
          });
          fullAnswerText = finalizeSpokenAnswer(reliable.text || recordedAnswer || "", {
            behavioralStarMode,
            question: effectiveQuestion || question
          });
          recordedAnswer = fullAnswerText;
          // Buffered path: do not write provider text yet — integrity gate emits after validation.
          generationModel = reliable.model || model;
          if (reliable.usedFailover) {
            logger?.info?.({
              event: "interview.provider_failover_success",
              fromModel: model,
              toModel: generationModel,
              provider: reliable.provider
            });
          }
        } catch (llmError) {
          if (recordedAnswer.length > 0) {
            // Partial tokens already on the wire — do not invent a second answer; mark incomplete later.
            throw llmError;
          }
          logger?.warn?.({
            event: "interview.answer_fallback_ladder",
            reason: llmError?.code || llmError?.name || "llm-failed",
            message: String(llmError?.message || "").slice(0, 200),
            traceId
          });
          const ladder = runAnswerFallbackLadder(effectiveQuestion || question, {
            knowledgeContext,
            evidence: knowledgeResult.evidence || interviewContext?.retrievalEvidence || []
          });
          // Buffer ladder text — never emit before integrity finalization below.
          fullAnswerText = ladder.answer;
          recordedAnswer = ladder.answer;
          generationRoute = ladder.route || "LADDER_PRINCIPLE";
        }
      }

      abortIfTimedOut();
      stageTiming.streamEndMs = Date.now() - qaStartedMs;
      markStage("stream_end");
      // G1/G2 content gates — strip ungrounded entities, coherence check, then incompleteness.
      // Incomplete / early-ended streams must not be treated as valid final outputs or context.
      let effectiveFinishReason = tokenUsage?.finish_reason || null;
      let contentQualityFlags = [];
      let strippedEntityCount = 0;
      // Every buffered generation route must finalize before client delivery — including
      // PROVIDER_DISABLED (operational message) and STAR local fallback.
      const routeNeedsIntegrityGate = generationRoute === "GENERATION"
        || generationRoute === "RETRIEVED_PROCEDURE"
        || generationRoute === "LOCAL_KNOWLEDGE_FALLBACK"
        || generationRoute === "STAR_LOCAL_FALLBACK"
        || generationRoute === "PROVIDER_DISABLED"
        || String(generationRoute || "").startsWith("LADDER_");
      if (routeNeedsIntegrityGate) {
        let spokenForGate = String(fullAnswerText || recordedAnswer || "");
        // Operational disabled text: finalize without concept/technical recovery rewrites.
        if (
          generationRoute === "PROVIDER_DISABLED"
          || isProviderDisabledOperationalMessage(spokenForGate)
        ) {
          const disabledFinal = finalizeSpokenAnswerForDisplay({
            question: effectiveQuestion || question,
            answer: spokenForGate || DISABLED_GENERATION_MESSAGE,
            interviewContext
          });
          spokenForGate = disabledFinal.answer || DISABLED_GENERATION_MESSAGE;
          recordedAnswer = spokenForGate;
          fullAnswerText = spokenForGate;
          contentQualityFlags.push("answer_kind:provider_disabled");
          if (res?.writable && String(spokenForGate || "").trim()) {
            writeSSEEvent(res, "answer_final", {
              text: spokenForGate,
              answerKind: "provider_disabled",
              recovered: false,
              flag: "provider_disabled",
              replacesStream: false,
              bufferedPreDisplay: true
            });
            writeSSEAnswer(res, spokenForGate);
          }
        } else {
        const beforeStrip = spokenForGate;
        // Observability: preserve pre-sanitizer LIVE completion for audit harnesses.
        // Client UI still receives only post-integrity answer_final text.
        if (res?.writable && String(beforeStrip || "").trim()) {
          try {
            writeSSEEvent(res, "provider_raw", {
              text: beforeStrip,
              source: "pre_strip_llm_or_procedure_backbone",
              chars: String(beforeStrip).length
            });
          } catch (rawEmitErr) {
            console.error("provider_raw SSE emit failed (non-fatal):", rawEmitErr);
          }
        }
        // Include procedure backbone so strip does not gut identifiers retrieved as generation evidence.
        const stripGrounding = [
          knowledgeContext,
          promptPayload?.expectedSpokenAnswer,
          knowledgeResult?.procedureText
        ].filter(Boolean).join("\n");
        spokenForGate = stripUngroundedSapEntities(spokenForGate, stripGrounding || "");
        if (isDestructiveEntityStripResult(beforeStrip, spokenForGate)) {
          // Prefer keeping pre-strip text when strip hollowed grammar; recovery still
          // re-validates ungrounded claims against knowledge (no self-grounding pass-through).
          contentQualityFlags.push("destructive_entity_strip_reverted");
          spokenForGate = beforeStrip;
        }
        try {
          const usagePlane = sanitizeUsageVsAssignmentPlanes(
            effectiveQuestion || question,
            spokenForGate
          );
          if (usagePlane.changed && usagePlane.text) {
            spokenForGate = usagePlane.text;
            contentQualityFlags.push(`usage_assignment_plane_sanitized:${usagePlane.removed}`);
          }
        } catch (usagePlaneError) {
          logger?.error?.("Usage vs assignment plane sanitize failed:", usagePlaneError);
        }
        const coherence = postStripCoherenceCheck(beforeStrip, spokenForGate);
        if (!coherence.ok || isMetaRefusalText(spokenForGate)) {
          // Prefer keeping stripped spoken content or local KB — never a meta-refusal disclaimer.
          if (!spokenForGate.trim() || isMetaRefusalText(spokenForGate) || spokenForGate.trim().length < 40) {
            try {
              const local = buildLocalKnowledgeFallback(effectiveQuestion || question, {
                prefetchedText: knowledgeContext,
                evidence: knowledgeResult.evidence || []
              });
              if (String(local?.answer || "").trim() && !isMetaRefusalText(local.answer)) {
                spokenForGate = local.answer;
                contentQualityFlags.push(`coherence_local_kb:${coherence.reason || "meta"}`);
              } else if (!isMetaRefusalText(beforeStrip) && beforeStrip.trim().length > 40) {
                spokenForGate = stripUngroundedSapEntities(beforeStrip, stripGrounding || "");
                contentQualityFlags.push(`coherence_keep_stripped:${coherence.reason || "meta"}`);
              } else {
                spokenForGate = buildPrincipleLevelFallback(effectiveQuestion || question);
                contentQualityFlags.push(`coherence_spoken_recovery:${coherence.reason || "meta"}`);
              }
            } catch {
              spokenForGate = buildPrincipleLevelFallback(effectiveQuestion || question);
              contentQualityFlags.push(`coherence_spoken_recovery:${coherence.reason || "meta"}`);
            }
          } else {
            contentQualityFlags.push(`coherence_keep:${coherence.reason}`);
          }
        }
        if (isMetaRefusalText(spokenForGate)) {
          spokenForGate = buildPrincipleLevelFallback(effectiveQuestion || question);
          contentQualityFlags.push("meta_refusal_replaced");
        }

        // D2 — never leave the UI with an empty answer after strip/coherence.
        let localKbAnswer = "";
        try {
          localKbAnswer = String(buildLocalKnowledgeFallback(effectiveQuestion || question, {
            prefetchedText: knowledgeContext,
            evidence: knowledgeResult.evidence || []
          })?.answer || "");
        } catch {
          localKbAnswer = "";
        }
        const procedureSpoken = String(
          promptPayload.expectedSpokenAnswer
          || procedurePreferMeta?._spoken
          || ""
        );
        // Recompute procedure spoken if prefer had steps but we only stored meta.
        let procedureFallback = procedureSpoken;
        if (!procedureFallback.trim() && (procedurePreferMeta?.stepCount || 0) >= 3) {
          try {
            const steps = authoritativeProcedure(
              effectiveQuestion || question,
              knowledgeResult.procedureText || knowledgeContext || "",
              interviewContext.answerScope
            ) || [];
            procedureFallback = renderSpokenProcedure(effectiveQuestion || question, steps) || "";
          } catch {
            procedureFallback = "";
          }
        }
        if (!procedureFallback.trim() && isWorkflowBackboneAsk(effectiveQuestion || question)) {
          try {
            const verifiedRecover = selectVerifiedWorkflow(effectiveQuestion || question);
            if (verifiedRecover?.answer) procedureFallback = verifiedRecover.answer;
          } catch {
            // non-fatal
          }
        }
        const recovered = recoverNonEmptySpokenAnswer({
          question: effectiveQuestion || question,
          spoken: spokenForGate,
          beforeStrip,
          procedureSpoken: procedureFallback,
          localKnowledgeAnswer: localKbAnswer,
          knowledgeText: knowledgeContext || knowledgeResult.procedureText || ""
        });
        spokenForGate = recovered.answer;
        const answerKind = recovered.answerKind || (recovered.recovered ? "recovered_principle" : "validated");
        if (recovered.recovered && recovered.flag) {
          contentQualityFlags.push(recovered.flag);
          contentQualityFlags.push(`answer_kind:${answerKind}`);
          if (recovered.rejectedProcedureReason) {
            contentQualityFlags.push(`procedure_recovery_reject:${recovered.rejectedProcedureReason}`);
          }
          if (recovered.rejectedPreStripReason) {
            contentQualityFlags.push(`prestrip_reject:${recovered.rejectedPreStripReason}`);
          }
        } else {
          contentQualityFlags.push(`answer_kind:${answerKind}`);
        }

        strippedEntityCount = (beforeStrip.match(/\b(?:transaction|table|authorization object|service)\b/gi) || []).length
          - (spokenForGate.match(/\b(?:transaction|table|authorization object|service)\b/gi) || []).length;
        if (/not confirmed in supporting knowledge/i.test(spokenForGate) && !/not confirmed in supporting knowledge/i.test(beforeStrip)) {
          strippedEntityCount = Math.max(strippedEntityCount, 1);
        }
        spokenForGate = sanitizeSpokenAnswer(spokenForGate);
        // Defense: recovered text must not reintroduce unsupported T-codes from beforeStrip.
        const leakGrounding = [
          knowledgeContext,
          promptPayload?.expectedSpokenAnswer,
          knowledgeResult?.procedureText
        ].filter(Boolean).join("\n");
        const leakCheck = findUngroundedTransactionClaims(spokenForGate, leakGrounding || "");
        if (leakCheck.length && recovered.recovered) {
          spokenForGate = buildDirectTechnicalFallback(effectiveQuestion || question)
            || buildPrincipleLevelFallback(effectiveQuestion || question);
          contentQualityFlags.push(`recovery_leak_blocked:${leakCheck.join(",")}`);
        }

        // Phase 2.1 — question-to-answer relevance + V2.2 pre-display integrity gate.
        // At most ONE recovery. Rejected text never reaches the UI (stream was buffered).
        try {
          let conceptGate = evaluateAnswerConceptCoverage({
            question: effectiveQuestion || question,
            answer: spokenForGate
          });
          if (!conceptGate.ok && conceptGate.reason === "data-assessment-instead-of-transition-paths") {
            spokenForGate = buildTransitionPathComparisonFallback(effectiveQuestion || question);
            contentQualityFlags.push("concept_coverage_repaired:transition-paths");
            conceptGate = evaluateAnswerConceptCoverage({
              question: effectiveQuestion || question,
              answer: spokenForGate
            });
          }
          const detailGate = evaluateUnsupportedTechnicalDetail({
            answer: spokenForGate,
            knowledgeText: knowledgeContext || knowledgeResult.procedureText || ""
          });
          if (!detailGate.ok && (knowledgeResult.knowledgeCoverage?.status === COVERAGE.NO_RELEVANT_KNOWLEDGE
            || knowledgeResult.knowledgeCoverage?.status === COVERAGE.IRRELEVANT_RETRIEVAL
            || lowRelevanceFallback)) {
            contentQualityFlags.push(`unsupported_detail:${(detailGate.claims || []).slice(0, 6).join(",")}`);
          }

          const integrity = validateAndRecoverSpokenAnswer({
            question: effectiveQuestion || question,
            answer: spokenForGate,
            interviewContext,
            recoveryAnswer: buildDirectTechnicalFallback(effectiveQuestion || question)
              || (conceptGate.reason === "data-assessment-instead-of-transition-paths"
                ? buildTransitionPathComparisonFallback(effectiveQuestion || question)
                : "")
          });
          spokenForGate = integrity.answer;
          if (integrity.recovered) {
            contentQualityFlags.push(`integrity_recovered:${integrity.answerKind}`);
            contentQualityFlags.push(...(integrity.priorGate?.reasons || integrity.gate?.reasons || []).map((r) => `integrity_prior:${r}`));
          }
          // Score concept coverage on the FINAL displayed text (post-recovery), not a stale pre-recovery miss.
          conceptGate = evaluateAnswerConceptCoverage({
            question: effectiveQuestion || question,
            answer: spokenForGate
          });
          if (!conceptGate.ok) {
            contentQualityFlags.push(`concept_coverage_fail:${conceptGate.reason || "missing"}`);
            contentQualityFlags.push(`missing_concepts:${(conceptGate.missingConceptIds || []).join(",")}`);
          }
          if (integrity.rejected || isMetaProcedureResponse(spokenForGate)) {
            contentQualityFlags.push("integrity_inability");
          }
        } catch (gateError) {
          console.error("Concept/integrity coverage gate failed (non-fatal):", gateError);
        }

        fullAnswerText = spokenForGate;
        recordedAnswer = spokenForGate;
        const ungrounded = findUngroundedTransactionClaims(spokenForGate, knowledgeContext || "");
        if (ungrounded.length) {
          contentQualityFlags.push(`ungrounded_tcodes:${ungrounded.join(",")}`);
        }
        // Incomplete only when still empty/unusable after recovery.
        if (!String(spokenForGate || "").trim() || (looksIncompleteSpokenAnswer(spokenForGate) && !recovered.recovered)) {
          contentQualityFlags.push("incomplete_spoken_tail");
          effectiveFinishReason = "incomplete_content";
        } else if (looksIncompleteSpokenAnswer(spokenForGate) && recovered.recovered) {
          contentQualityFlags.push("incomplete_recovered");
          effectiveFinishReason = tokenUsage?.finish_reason || "stop";
        }

        // Pre-display validation complete: emit only the accepted answer.
        // Provider tokens were buffered (res.writable false), so the client stream is empty
        // until answer_final / writeSSEAnswer. Never leak rejected first-pass text.
        if (res?.writable && String(spokenForGate || "").trim()) {
          const integrityRecovered = contentQualityFlags.some((f) => String(f).startsWith("integrity_recovered"));
          writeSSEEvent(res, "answer_final", {
            text: spokenForGate,
            answerKind,
            recovered: Boolean(recovered.recovered || integrityRecovered),
            flag: recovered.flag || (integrityRecovered ? "integrity_gate" : null),
            replacesStream: false,
            bufferedPreDisplay: true
          });
          writeSSEAnswer(res, spokenForGate);
        }
        } // end else (non-provider-disabled integrity path)
      }
      if (contentQualityFlags.length) {
        tokenUsage = {
          ...(tokenUsage || {}),
          finish_reason: effectiveFinishReason,
          contentQualityFlags,
          strippedEntityCount,
          procedurePrefer: procedurePreferMeta || undefined,
          firstTokenMs: stageTiming.firstTokenMs,
          streamEndMs: stageTiming.streamEndMs
        };
      } else {
        tokenUsage = {
          ...(tokenUsage || {}),
          finish_reason: effectiveFinishReason,
          strippedEntityCount,
          procedurePrefer: procedurePreferMeta || undefined,
          firstTokenMs: stageTiming.firstTokenMs,
          streamEndMs: stageTiming.streamEndMs
        };
      }
      if (res?.writable && (
        generationRoute === "GENERATION"
        || generationRoute === "PROVIDER_DISABLED"
        || generationRoute === "LOCAL_KNOWLEDGE_FALLBACK"
        || generationRoute === "STAR_LOCAL_FALLBACK"
      )) {
        const providerStats = getProviderStats();
        writeSSEEvent(res, "generation", {
          finish_reason: effectiveFinishReason,
          maxTokens,
          prompt_tokens: tokenUsage?.prompt_tokens ?? null,
          completion_tokens: tokenUsage?.completion_tokens ?? null,
          total_tokens: tokenUsage?.total_tokens ?? null,
          contentQualityFlags: contentQualityFlags.length ? contentQualityFlags : undefined,
          strippedEntityCount,
          firstTokenMs: stageTiming.firstTokenMs,
          streamEndMs: stageTiming.streamEndMs,
          procedurePrefer: procedurePreferMeta || undefined,
          providerMode,
          providerImplementation: providerStats.lastImplementation || generationModel || null,
          mockInvocations: providerStats.mockInvocations,
          liveTransportInvocations: providerStats.liveTransportInvocations,
          route: generationRoute
        });
      }
      const hasSpeakableAnswer = String(recordedAnswer || "").trim().length >= 40;
      // Fix 2: recovered speakable answers are completed (with answerKind flags), not empty.
      // Truncated streams without a speakable recovery remain partial and are excluded from context.
      const answerIncomplete = isIncompleteGeneration(effectiveFinishReason) && !hasSpeakableAnswer;
      const answerKindFlag = (contentQualityFlags.find((f) => String(f).startsWith("answer_kind:")) || "")
        .replace(/^answer_kind:/, "") || (hasSpeakableAnswer ? "validated" : "empty");
      if (hasSpeakableAnswer) {
        persistScenarioTimeline(recordedAnswer);
      }
      const generationSourceFiles = sourceFilesFromEvidence(knowledgeResult.evidence);
      recordLiveQa({
        question,
        questionRaw: question,
        questionResolved: effectiveQuestion,
        interviewContext,
        answerShown: hasSpeakableAnswer ? recordedAnswer : "",
        status: answerIncomplete ? "partial" : (hasSpeakableAnswer ? "completed" : "empty"),
        model: generationModel,
        retryCount: Number(clientRetryCount) || 0,
        latencyMs: Date.now() - qaStartedMs,
        usage: {
          ...(tokenUsage || {}),
          answerKind: answerKindFlag,
          recovered: contentQualityFlags.some((f) => String(f).startsWith("empty_fallback"))
        },
        source: req.body?.source,
        route: generationRoute,
        disposition: "ANSWER",
        evidenceMode: generationRoute === "LOCAL_KNOWLEDGE_FALLBACK" ? "local-knowledge" : (promptPayload.evidenceMode || "full"),
        retrieval: knowledgeResult.evidence,
        sourceFiles: generationSourceFiles,
        procedurePrefer: procedurePreferMeta || undefined,
        answerKind: answerKindFlag,
        recovered: contentQualityFlags.some((f) => String(f).startsWith("empty_fallback")),
        answerFinalEmitted: contentQualityFlags.some((f) => String(f).startsWith("answer_kind:")),
        errorCode: answerIncomplete ? "incomplete" : null,
        excludeFromContext: answerIncomplete,
        finishReason: effectiveFinishReason || (hasSpeakableAnswer ? "stop" : null)
      });

      // Post-answer evaluation: pure heuristics, no LLM call, runs only after every
      // content chunk is already on the wire — never delays the spoken answer, and a
      // failure here must never break the already-delivered response.
      try {
        if (generationRoute === "LOCAL_KNOWLEDGE_FALLBACK") {
          // Fallback answers are already grounded; skip incomplete-token signaling.
        } else if (isIncompleteGeneration(effectiveFinishReason)) {
          res.write("data: [DONE]\n\n");
          return;
        } else {
          const qualityAnalysis = runPostAnswerEvaluation({
            question,
            answer: fullAnswerText,
            analysis,
            sapComponents: technicalReasoning.recommendedComponents,
            interviewer,
            candidateResume: promptPayload.candidateResume || ""
          });
          qualityAnalysis.contextSummary = toHistoryContext(interviewContext);
          if (res?.writable) {
            res.write(`event: analysis\ndata: ${JSON.stringify(qualityAnalysis)}\n\n`);
          }
        }
      } catch (evalError) {
        logger?.error?.("Post-answer evaluation failed (non-fatal):", evalError);
      }
    }

    if (res?.writable) {
      res.write("data: [DONE]\n\n");
    }
  } catch (error) {
    // Surface the full provider/runtime failure in the Next.js terminal for live debugging.
    console.error("EXACT API GENERATION ERROR:", error?.response?.data || error?.message || error);
    console.error("EXACT API GENERATION STACK:", error?.stack || "(no stack)");
    console.error("EXACT API GENERATION META:", {
      name: error?.name || null,
      code: error?.code || error?.error?.code || null,
      status: error?.status || error?.statusCode || error?.response?.status || null,
      openaiKeyPresent: Boolean(process.env.OPENAI_API_KEY),
      openaiKeyLength: process.env.OPENAI_API_KEY ? String(process.env.OPENAI_API_KEY).length : 0,
      clientKeyPresent: Boolean(apiKey),
      model
    });
    logger?.error?.("Interview Copilot Error", {
      model,
      provider: isClaudeModel(model) ? "anthropic" : isGeminiModel(model) ? "gemini" : isGroqModel(model) ? "groq" : (APP_CONFIG?.llm?.apiKeys?.openai ? "openai" : "openrouter"),
      errorName: error?.name || "Error",
      errorCode: error?.code || error?.error?.code || "",
      httpStatus: error?.status || error?.statusCode || error?.response?.status || null,
      errorMessage: String(error?.message || "").slice(0, 240)
    });

    // Zero-crash guarantee: prefer local KB answer over any orange/red Generation failed banner.
    if (res?.writable && !recordedAnswer.trim()) {
      try {
        const starMode = isBehavioralStarIntent(question, interviewContext);
        const fallback = streamLocalKnowledgeFallback(res, question, {
          knowledgeContext: "",
          evidence: interviewContext?.retrievalEvidence || [],
          behavioralStarMode: starMode,
          interviewContext,
          emit: true
        });
        recordedAnswer = fallback.answer;
        recordLiveQa({
          question,
          questionRaw: question,
          questionResolved: interviewContext?.questionResolved || question,
          interviewContext,
          answerShown: recordedAnswer,
          status: "completed",
          model,
          retryCount: Number(clientRetryCount) || 0,
          latencyMs: Date.now() - qaStartedMs,
          usage: tokenUsage,
          source: req.body?.source,
          route: "LOCAL_KNOWLEDGE_FALLBACK",
          disposition: "ANSWER",
          evidenceMode: "local-knowledge",
          retrieval: interviewContext?.retrievalEvidence || [],
          errorCode: null
        });
        try {
          res.write("data: [DONE]\n\n");
        } catch {
          // stream may already be closing
        }
      } catch (fallbackError) {
        logger?.error?.("Local knowledge fallback failed", {
          message: String(fallbackError?.message || "").slice(0, 200)
        });
        const classified = publicLlmError(error);
        const errorMessage = controller.signal.aborted
          ? "Request timed out while generating response."
          : classified.userMessage;
        recordLiveQa({
          question,
          questionRaw: question,
          questionResolved: interviewContext?.questionResolved || question,
          interviewContext,
          answerShown: recordedAnswer,
          status: "failed",
          model,
          retryCount: Number(clientRetryCount) || 0,
          latencyMs: Date.now() - qaStartedMs,
          usage: tokenUsage,
          source: req.body?.source,
          retrieval: interviewContext?.retrievalEvidence || [],
          errorCode: controller.signal.aborted ? "timeout" : (classified.code || "failed")
        });
        writeSSEError(res, errorMessage);
        try {
          res.write("data: [DONE]\n\n");
        } catch {
          // stream may already be closing
        }
      }
    } else {
      const classified = publicLlmError(error);
      recordLiveQa({
        question,
        questionRaw: question,
        questionResolved: interviewContext?.questionResolved || question,
        interviewContext,
        answerShown: recordedAnswer,
        status: recordedAnswer.trim() ? "partial" : "failed",
        model,
        retryCount: Number(clientRetryCount) || 0,
        latencyMs: Date.now() - qaStartedMs,
        usage: tokenUsage,
        source: req.body?.source,
        retrieval: interviewContext?.retrievalEvidence || [],
        errorCode: controller.signal.aborted ? "timeout" : (classified.code || "failed")
      });
      // Partial answer already visible — close cleanly without an error banner.
      if (res?.writable) {
        try {
          res.write("data: [DONE]\n\n");
        } catch {
          // stream may already be closing
        }
      }
    }
  } finally {
    clearTimeout(timeoutId);
    res.removeListener?.("close", onDisconnect);
    if (res?.writable) {
      res.end();
    }
  }
}
