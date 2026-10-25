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
const { recallExpectedAnswer } = require("../../eval/lib/expectedAnswers.js");
const {
  DEFAULT_CAREER_BACKGROUND,
  STATED_PROFILE,
  scopeCareerEvidence,
  scopedHistoryOnly,
  isProfileCredentialQuestion,
  buildCredentialConfirmationAnswer
} = require("../../eval/lib/careerTimeline.js");
const { shouldInheritPriorDomain, hasStrongTechnicalEvidence, isPlaneFoil, isTopicContinuation } = require("../../lib/contextInheritance.js");
const {
  publicLlmError,
  isIncompleteGeneration,
  sanitizeSpokenAnswer,
  stripBankQuestionLabels,
  anonymizeStarEmployers
} = require("../../lib/generationGuard.js");
const {
  LLM_REQUEST_TIMEOUT_MS,
  MAX_RETRIES,
  isRetryableLlmError,
  runWithExponentialRetry,
  resolveProviderFailoverChain,
  generateWithReliability,
  buildLocalKnowledgeFallback
} = require("../../lib/liveReliability.js");
const { appendQa, readScenarioTimeline, writeScenarioTimeline } = require("../../lib/interviewSessionStore.js");
const { timelinePromptForTurn, nextScenarioTimeline, extractTimeline, unspecifiedTimelinePolicy, isContextOnlyTimeline } = require("../../lib/scenarioTimeline.js");
const { decideInterviewTurn } = require("../../lib/turnDecision.js");
const { selectVerifiedWorkflow } = require("../../lib/verifiedWorkflow.js");
const { historyForCurrentTurn } = require("../../lib/currentTurnHistory.js");
const { priorAnchor } = require("../../lib/questionAdmission.js");
const { resolveInterviewContext, sanitizeDebugContext, toHistoryContext, QUESTION_INTENTS, explicitProductTopic, resolveProductScope, evaluateLayer7Clarity, clarificationRequired } = require("../../lib/interviewContext.js");
const { productKnowledgeFolders, selectProductScopedChunks } = require("../../lib/productKnowledgeScope.js");
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
import { authoritativeProcedure, fitSpokenLength, questionProcedureIntent, renderSpokenProcedure, shapeSpokenContract } from "../../lib/procedureRetention.js";

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
  { category: "IPS", keywords: ["ips", "identity provision service", "successfactors", "success factors", "sap successfactors"], weight: 4 },
  { category: "SuccessFactors", keywords: ["rbp", "role-based permission", "role based permission", "permission role", "employee central", "sf rbp"], weight: 4 },
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
  { category: "ARA", keywords: ["ara", "access risk analysis"], weight: 4 },
  { category: "EAM", keywords: ["eam", "emergency access management", "firefighter"], weight: 4 },
  { category: "BRM", keywords: ["brm", "business role management"], weight: 4 },
  { category: "SAP IDM", keywords: ["sap idm", "identity management"], weight: 4 },
  // "tile" and "target mapping" are launchpad vocabulary with no other product meaning here --
  // without them "add a tile" classified as General and never reached the Fiori structure.
  { category: "Fiori", keywords: ["fiori", "launchpad", "ui5", "tile", "target mapping"], weight: 3 },
  { category: "S/4", keywords: ["s/4", "s4", "s/4hana", "s4hana"], weight: 3 },
  { category: "ECC", keywords: ["ecc", "erp"], weight: 3 },
  { category: "BW", keywords: ["bw", "bw/4hana"], weight: 3 },
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
  { category: "Security", keywords: ["security", "audit", "compliance", "encryption", "sod", "siem", "threat detection", "enterprise threat detection", "security operations center", "soc"], weight: 2 },
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
  // Technical topics (Fiori SSO, BTP, GRC, IAG, …): keep retrieval shallow so generation starts fast.
  const technicalFastPath = isTechnicalTopicFastPath(retrievalQuery);
  const searchK = technicalFastPath ? Math.max(topK, 8) : Math.max(topK, 12);
  const candidates = (await searchKnowledge(
    retrievalQuery,
    analysis,
    searchK,
    sourceFolders.length ? { metadataFilters: { sourceFolders } } : {}
  )) || [];
  const productScoped = selectProductScopedChunks(retrievalQuery, candidates);
  const topScore = Math.max(
    Number(productScoped?.[0]?.score ?? 0),
    Number(productScoped?.[0]?.semanticScore ?? 0),
    Number(productScoped?.[0]?.confidenceScore ?? 0)
  );
  // Weak top hit: do NOT inject debug/fallback prose into knowledgeContext (it leaked to the UI).
  // Return empty retrieval + a flag so the prompt layer can ask the LLM for fluent spoken prose.
  // On known technical topics, still pass the best product-scoped chunks when present so the
  // model is not forced through an empty-retrieval multi-hop path.
  if (!productScoped.length || topScore < LIVE_RELEVANCE_THRESHOLD) {
    if (technicalFastPath && productScoped.length) {
      // Continue with shallow product context below.
    } else {
      const domain = analysis?.domain || analysis?.category || primaryCategory || "General";
      return {
        text: "",
        procedureText: "",
        procedurePool: [],
        evidence: [],
        lowRelevanceFallback: true,
        lowRelevanceDirective: buildLowRelevanceArchitectFramework({ domain, question: retrievalQuery }),
        topScore
      };
    }
  }
  const rankedChunks = productScoped.slice(0, technicalFastPath ? Math.min(topK, 4) : topK);
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

  const maxChars = APP_CONFIG?.maxContextCharacters || 3000;
  const seenChunks = new Set();
  const sourceBlocks = [];
  let currentLength = 0;

  for (const chunk of chunks) {
    if (!chunk?.content) continue;
    const body = String(chunk.content).trim();
    const source = String(chunk.sourceFile || chunk.documentId || "knowledge").slice(0, 120);
    const heading = stripBankQuestionLabels(String(chunk.heading || chunk.section || "")).slice(0, 160);
    const cleanBody = stripBankQuestionLabels(body);
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

  return {
    text: sourceBlocks.join("\n\n"),
    procedureText: chunks
      .filter((chunk) => chunk?.content)
      .map((chunk) => {
        const h = stripBankQuestionLabels(String(chunk.heading || chunk.section || "").trim());
        const c = stripBankQuestionLabels(String(chunk.content).trim());
        return `## ${h}\n${c}`;
      })
      .join("\n\n"),
    procedurePool: productScoped.slice(0, 12),
    evidence: [...new Map(chunks.map((chunk) => [
      stripBankQuestionLabels(String(chunk.heading || chunk.section || chunk.sourceFile || chunk.documentId || "knowledge")).slice(0, 160),
      chunk
    ])).values()].slice(0, 6).map((chunk) => ({
      id: String(chunk.id || chunk.chunkId || chunk.documentId || "").slice(0, 100),
      label: stripBankQuestionLabels(String(chunk.heading || chunk.section || chunk.sourceFile || chunk.documentId || "knowledge")).slice(0, 160)
    }))
  };
}

function alignedProcedureText(question, chunks = []) {
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
  writeEvent = writeSSEEvent
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
  const answer = finalizeSpokenAnswer(fallback.answer, {
    behavioralStarMode,
    question
  });
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
  writeChunk?.(res, answer);
  return { ...fallback, answer };
}

async function streamOpenAIResponse({ apiKey, model, systemPrompt, recentHistory, question, res, signal, maxTokens, onUsage, onChunk }) {
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
  const model = requestedModel || APP_CONFIG?.llm?.defaultModel;
  const responseLength = ["concise", "medium", "lengthy"].includes(String(requestedResponseLength || "").trim().toLowerCase())
    ? String(requestedResponseLength).trim().toLowerCase()
    : "medium";

  if (!model || !question?.trim()) {
    return res.status(400).json({
      error: "Model and question are required."
    });
  }

  let turn = { decision: "ANSWER", route: "GENERATION", reason: "admission-failed-open", scriptAnswer: "" };
  try {
    turn = decideInterviewTurn({ question, history });
  } catch (error) {
    logger?.error?.("Question admission failed:", error);
  }
  if (turn.normalizedQuestion) {
    question = String(turn.normalizedQuestion);
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
        turn.scriptAnswer = shapeSpokenContract(turn.scriptAnswer);
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
                latencyMs: 0
              }
            );
          }
        } catch (recordError) {
          logger?.error?.("Prepared script session write failed:", recordError);
        }
      }
      // Answer-bank text is authored and must stream verbatim (no spoken-contract reshape).
      if (turn.route === "ANSWER_BANK" && turn.scriptAnswer) {
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
                latencyMs: 0
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
      writeSSEEvent(res, "admission", {
        decision: "ANSWER",
        route: "RETRIEVED_PROCEDURE",
        reason: "timeline-policy",
        scriptId: null,
        confidence: 1,
        evidenceMode: null
      });
      writeSSEChunk(res, timelinePolicy);
      persistIncomingTimeline(question, timelinePolicy);
      try {
        if (interviewSessionId) {
          appendQa(
            interviewSessionId,
            { model, company: String(company || "").slice(0, 80), source: "live-interview" },
            {
              question,
              answerShown: timelinePolicy,
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

  try {
    const verified = selectVerifiedWorkflow(question);
    if (verified?.answer) {
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
      if (!setSSEHeaders(res)) {
        return res.status(500).json({ error: "Failed to initialize streaming response." });
      }
      writeSSEEvent(res, "admission", {
        decision: "ANSWER",
        route: "VERIFIED_WORKFLOW",
        reason: "verified-procedure",
        scriptId: verified.id,
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
  const apiKey = clientApiKey || envApiKey || "";
  const forceLocalFallback = process.env.LIVE_RELIABILITY_FORCE_FALLBACK === "1"
    || String(req.body?.forceLocalFallback || "") === "1"
    || String(req.body?.forceLocalFallback || "").toLowerCase() === "true";

  // Missing keys must not crash the live UI — continue and serve local KB fallback at generation time.
  if (isProduction && !apiKey && !forceLocalFallback) {
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
  let qaRecorded = false;
  let interviewContext = null;
  const recordLiveQa = (fields) => {
    if (qaRecorded) return;
    try {
      if (!interviewSessionId) return;
      const result = appendQa(
        interviewSessionId,
        {
          jobLabel: String(company || "").slice(0, 80),
          company: String(company || "").slice(0, 80),
          model,
          source: "live-interview"
        },
        fields
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
    const lowRelevanceFallback = knowledgeResult.lowRelevanceFallback === true;
    const lowRelevanceDirective = String(knowledgeResult.lowRelevanceDirective || "").trim();
    interviewContext.retrievalEvidence = knowledgeResult.evidence;

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
      lowRelevanceDirective: (!behavioralStarMode && lowRelevanceFallback) ? lowRelevanceDirective : "",
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
      const { TCODE_VERIFICATION_RULE, OUTPUT_SANITIZER_RULE } = require("../../lib/turnDecision.js");
      const rule = String(turn?.tcodeVerificationRule || TCODE_VERIFICATION_RULE || "").trim();
      const sanitizerRule = String(turn?.outputSanitizerRule || OUTPUT_SANITIZER_RULE || "").trim();
      const artifactRule = String(
        buildMasterArchitectDirective(effectiveQuestion || question) || TECH_ARTIFACT_FIRST_RULE || ""
      ).trim();
      const combined = [rule, sanitizerRule, artifactRule].filter(Boolean).join("\n\n");
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

    let retrievedProcedureAnswer = "";
    // Low-relevance turns must go through the LLM fluent-prose path — never stream empty/fallback prose.
    // Also refuse first-person canned Fiori stubs that used to leak from the knowledge index.
    const looksLikeHardcodedStub = (text) => /If the server is on premise,\s*I would follow the ABAP Fiori path/i.test(String(text || ""))
      || /LOW-RELEVANCE RETRIEVAL FALLBACK/i.test(String(text || ""))
      || /INTERNAL RETRIEVAL NOTE/i.test(String(text || ""));
    if (!lowRelevanceFallback
      && !behavioralStarMode
      && !scenarioTurn.promptBlock
      && !promptPayload.expectedSpokenAnswer
      && !/\b(?:have you|did you|your experience|tell me about a time|walk me through a time)\b/i.test(question)) {
      try {
        const procedureQuestion = questionProcedureIntent(question, interviewContext.answerScope)
          ? question
          : (effectiveQuestion || question);
        const steps = authoritativeProcedure(procedureQuestion, knowledgeResult.procedureText || knowledgeContext, interviewContext.answerScope)
          || [];
        const alignedSteps = steps.length ? steps : authoritativeProcedure(
          procedureQuestion,
          alignedProcedureText(procedureQuestion, knowledgeResult.procedurePool),
          interviewContext.answerScope
        );
        if (alignedSteps.length >= 3) {
          const candidate = fitSpokenLength(
            renderSpokenProcedure(effectiveQuestion, alignedSteps),
            responseLength,
            procedureQuestion
          );
          if (!looksLikeHardcodedStub(candidate)) {
            retrievedProcedureAnswer = candidate;
            promptPayload.expectedSpokenAnswer = retrievedProcedureAnswer;
          }
        }
      } catch (error) {
        logger?.error?.("Retrieved procedure retention failed (non-fatal):", error);
      }
    }
    if (jobDescription?.trim()) promptPayload.jobDescription = jobDescription.trim();
    if (sessionPreparationText) promptPayload.sessionPreparation = sessionPreparationText;
    if (company?.trim()) promptPayload.company = company.trim();

    // A model paraphrase is not a safe final authority when the current question has
    // one coherent, product-scoped procedure in the retrieved evidence. Live checks
    // showed the model replacing IPS Job Logs and MSMP configuration steps with
    // neighboring generic advice even though those steps were supplied as its answer
    // anchor. Speak the verified sequence directly; experience questions and turns
    // without a coherent procedure continue through the normal single-pass model path.
    if (!retrievedProcedureAnswer && promptPayload.speakExpectedAnswer && promptPayload.expectedSpokenAnswer) {
      retrievedProcedureAnswer = promptPayload.expectedSpokenAnswer;
    }
    if (retrievedProcedureAnswer) {
      streamStarted = true;
      retrievedProcedureAnswer = sanitizeSpokenAnswer(retrievedProcedureAnswer);
      recordedAnswer = retrievedProcedureAnswer;
      writeSSEEvent(res, "admission", {
        decision: "ANSWER",
        route: "RETRIEVED_PROCEDURE",
        reason: "coherent-source-procedure",
        confidence: 1,
        evidenceMode: null,
        responseLength
      });
      writeSSEAnswer(res, retrievedProcedureAnswer);
      persistScenarioTimeline(retrievedProcedureAnswer);
      recordLiveQa({
        question,
        questionRaw: question,
        questionResolved: effectiveQuestion,
        interviewContext,
        answerShown: retrievedProcedureAnswer,
        status: "completed",
        model,
        source: req.body?.source,
        route: "RETRIEVED_PROCEDURE",
        disposition: "ANSWER",
        evidenceMode: "knowledge-procedure",
        latencyMs: Date.now() - qaStartedMs
      });
      if (res?.writable) {
        res.write("data: [DONE]\n\n");
        res.end();
      }
      return;
    }

    const systemPrompt = buildSapInterviewPrompt(promptPayload);
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

    // Ceiling is sized to the question's length tier (see lib/prompt/interviewPrompt.js) —
    // the main lever for keeping generation under the ~5-6s target in a single-pass
    // architecture, since streaming wall-clock time scales with tokens produced.
    const maxTokens = getMaxTokensForCategory(analysis.category, analysis.secondaryCategories, effectiveQuestion, analysis.isDeepenFollowUp, reasoningContract.reasoningMode, interviewContext.depth, interviewContext.answerScope, knowledgeContext, responseLength);

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
      recordedAnswer = String(interviewContext.clarificationPrompt || "").trim()
        || clarificationRequired(
          interviewContext.questionTopic === "General"
            ? "The question is incomplete. Could you please repeat or rephrase it with the specific SAP product and deployment context?"
            : `Could you finish that question about ${interviewContext.questionTopic} with the specific product or deployment context needed?`
        );
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
        recordedAnswer += text;
      }
    };

    // STAR employer safety: buffer tokens, then emit one anonymized complete answer.
    // Live streaming would otherwise flash CV employer brands before post-processing.
    const starBufferEmployers = behavioralStarMode && !starMayNameEmployer(effectiveQuestion || question);
    if (starBufferEmployers) {
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

      const shouldSkipRemoteLlm = forceLocalFallback || !apiKey;

      if (shouldSkipRemoteLlm) {
        logger?.warn?.({
          event: "interview.local_knowledge_fallback",
          reason: forceLocalFallback ? "forced" : "missing-api-key",
          model
        });
        const fallback = streamLocalKnowledgeFallback(res, effectiveQuestion || question, {
          knowledgeContext,
          evidence: knowledgeResult.evidence || interviewContext?.retrievalEvidence || [],
          behavioralStarMode
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
          if (starBufferEmployers && fullAnswerText) {
            writeSSEChunk(res, fullAnswerText);
          }
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
            throw llmError;
          }
          logger?.warn?.({
            event: "interview.local_knowledge_fallback",
            reason: llmError?.code || llmError?.name || "llm-failed",
            message: String(llmError?.message || "").slice(0, 200)
          });
          const fallback = streamLocalKnowledgeFallback(res, effectiveQuestion || question, {
            knowledgeContext,
            evidence: knowledgeResult.evidence || interviewContext?.retrievalEvidence || [],
            behavioralStarMode
          });
          fullAnswerText = fallback.answer;
          recordedAnswer = fallback.answer;
          generationRoute = behavioralStarMode ? "STAR_LOCAL_FALLBACK" : "LOCAL_KNOWLEDGE_FALLBACK";
        }
      }

      abortIfTimedOut();
      if (res?.writable && generationRoute === "GENERATION") {
        writeSSEEvent(res, "generation", {
          finish_reason: tokenUsage?.finish_reason || null,
          maxTokens,
          prompt_tokens: tokenUsage?.prompt_tokens ?? null,
          completion_tokens: tokenUsage?.completion_tokens ?? null,
          total_tokens: tokenUsage?.total_tokens ?? null
        });
      }
      persistScenarioTimeline(recordedAnswer);
      recordLiveQa({
        question,
        questionRaw: question,
        questionResolved: effectiveQuestion,
        interviewContext,
        answerShown: recordedAnswer,
        status: isIncompleteGeneration(tokenUsage?.finish_reason) ? "partial" : (recordedAnswer.trim() ? "completed" : "empty"),
        model: generationModel,
        retryCount: Number(clientRetryCount) || 0,
        latencyMs: Date.now() - qaStartedMs,
        usage: tokenUsage,
        source: req.body?.source,
        route: generationRoute,
        disposition: "ANSWER",
        evidenceMode: generationRoute === "LOCAL_KNOWLEDGE_FALLBACK" ? "local-knowledge" : (promptPayload.evidenceMode || "full"),
        retrieval: knowledgeResult.evidence,
        errorCode: isIncompleteGeneration(tokenUsage?.finish_reason) ? "incomplete" : null
      });

      // Post-answer evaluation: pure heuristics, no LLM call, runs only after every
      // content chunk is already on the wire — never delays the spoken answer, and a
      // failure here must never break the already-delivered response.
      try {
        if (generationRoute === "LOCAL_KNOWLEDGE_FALLBACK") {
          // Fallback answers are already grounded; skip incomplete-token signaling.
        } else if (isIncompleteGeneration(tokenUsage?.finish_reason)) {
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
          behavioralStarMode: starMode
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
