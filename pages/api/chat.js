import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";

import { analyzeInterviewQuestion } from "../../lib/interviewAnalyzer";
import { buildReasoningContract, NON_SAP_TECHNICAL_CATEGORIES, DELIVERY_GOVERNANCE_PATTERN } from "../../lib/reasoningPlanner";
import { selectSapComponents } from "../../lib/componentSelector";
import { buildSapInterviewPrompt, getMaxTokensForCategory } from "../../lib/prompt/interviewPrompt";
import { profileInterviewer } from "../../lib/interviewerProfiler";
import { buildTechnicalReasoning } from "../../lib/technicalReasoner";
import { searchKnowledge } from "../../services/vectorSearch";
import { searchEngineeringMemory, renderEngineeringJudgmentSection } from "../../lib/engineeringMemory/retrieval";
import { logger } from "../../lib/logger";
import { runPostAnswerEvaluation } from "../../lib/prompt";
import APP_CONFIG from "../../config/appConfig";

const MAX_HISTORY_ITEMS = 6;
const DEFAULT_TIMEOUT_MS = 25000;
const RESPONSE_WRITE_TIMEOUT = 100;

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
  { category: "Troubleshooting", keywords: ["troubleshoot", "error", "dump", "st22", "su53", "bug", "fix", "issue", "fail", "exception"], weight: 3 },
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
  { category: "Fiori", keywords: ["fiori", "launchpad", "ui5"], weight: 3 },
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
  { category: "Role Design", keywords: ["role design", "pfcg", "single role", "composite role", "derived role", "role catalog", "role mining", "role rationalization", "rationalize roles", "overlapping sap roles", "duplicate roles", "unused roles", "thousands of sap roles", "thousands of roles"], weight: 4 },
  { category: "Authorization", keywords: ["authorization", "auth object", "auth field", "authorization object"], weight: 3 },
  { category: "Security", keywords: ["security", "audit", "compliance", "encryption", "sod"], weight: 2 },
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
  return text.replace(/\*/g, "");
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
  ["vendor", ["delivery", "deliver", "contract", "performance"]],
  ["schedule", ["delay", "recovery", "critical path", "behind"]],
  ["scope", ["creep", "change", "control"]],
  ["project", ["risk", "register", "mitigation"]],
  ["procurement", ["supplier", "vendor"]],
  ["raid", ["project", "program"]],
  ["milestone", ["delay", "recovery"]]
]);

function matchesPmpContextTerm(tokenSet, questionLower, term) {
  return term.includes(" ") ? questionLower.includes(term) : tokenSet.has(term);
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
function hasStrongTechnicalEvidence(category, domain) {
  return Boolean(category) && category !== "General" && Boolean(domain) && domain !== "General SAP" && domain !== "PMP";
}

// Reuses the exact category set and pattern reasoningPlanner.js already uses to decide
// answerIntent/hybrid-mode -- not a new signal, the same one, asked here one step earlier: does
// the CURRENT turn, considered alone, show a people/project/governance dimension of its own?
function hasPeopleSignal(category, question) {
  return NON_SAP_TECHNICAL_CATEGORIES.has(category) || DELIVERY_GOVERNANCE_PATTERN.test(question);
}

// Evidence precedence (see docs/CHANGELOG.md Day-9 entry for the full design rationale):
//   1. No history                              -> current-turn classification only (unchanged
//                                                  from pre-Day-9 behavior for every standalone
//                                                  question).
//   2. Current turn has strong technical evidence -> current wins outright. Never overridden by
//                                                     inherited context, regardless of history.
//   3. Current turn has a people/project signal   -> current wins outright, explicitly WITHOUT
//                                                     pulling in a prior technical domain (so
//                                                     componentSelector's existing domain-
//                                                     evidence gate correctly yields no
//                                                     fabricated SAP components).
//   4. Otherwise, if the immediately preceding user turn (only -- no deeper history search, see
//      docs/PROJECT_STATE.md known limitations) has strong technical evidence of its own,
//      inherit ONLY its category/domain as context. primaryIntent is deliberately NEVER
//      inherited -- the current question, however it's phrased, still determines its own
//      intent/reasoning behavior; only the missing product/domain context is borrowed.
//   5. Otherwise -- no strong evidence anywhere -- do nothing. Matches today's safe default
//      rather than guessing.
function resolveContext(question, history) {
  const currentClassification = classifyWeightedIntents(question);
  const currentAnalysis = analyzeInterviewQuestion(question);
  const currentCategory = currentClassification.primaryCategory;

  const asCurrent = (contextSource) => ({
    currentAnalysis,
    resolvedCategory: currentCategory,
    resolvedSecondaryCategories: currentClassification.secondaryCategories,
    resolvedDomain: currentAnalysis.domain,
    resolvedPrimaryIntent: currentAnalysis.primaryIntent,
    contextSource
  });

  if (!history || history.length === 0) {
    return asCurrent("current");
  }

  if (hasStrongTechnicalEvidence(currentCategory, currentAnalysis.domain)) {
    return asCurrent("current");
  }

  if (hasPeopleSignal(currentCategory, question)) {
    return asCurrent("current-people");
  }

  const lastUserTurn = [...history].reverse().find(item => item?.role === "user" && item?.content)?.content || "";
  if (lastUserTurn) {
    const priorClassification = classifyWeightedIntents(lastUserTurn);
    const priorAnalysis = analyzeInterviewQuestion(lastUserTurn);
    if (hasStrongTechnicalEvidence(priorClassification.primaryCategory, priorAnalysis.domain)) {
      return {
        currentAnalysis,
        resolvedCategory: priorClassification.primaryCategory,
        resolvedSecondaryCategories: priorClassification.secondaryCategories,
        resolvedDomain: priorAnalysis.domain,
        resolvedPrimaryIntent: currentAnalysis.primaryIntent,
        contextSource: "inherited"
      };
    }
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

function synthesizeRetrievalQuery(question, history) {
  const conversationTopic = extractConversationTopic(history);
  if (!conversationTopic) return question;

  const questionTokens = tokenize(question);
  const topicTokens = tokenize(conversationTopic);

  const newTopicTokens = topicTokens.filter(token => !questionTokens.includes(token));
  if (newTopicTokens.length === 0) return question;

  return `${question} ${newTopicTokens.join(" ")}`.trim();
}

async function fetchKnowledgeContext(question, primaryCategory, secondaryCategories, history, analysis) {
  let topK = TOP_K_BY_CATEGORY[primaryCategory] || TOP_K_BY_CATEGORY.General;
  if (secondaryCategories && secondaryCategories.length > 0) {
    const maxSecondaryK = Math.max(
      ...secondaryCategories.map(cat => TOP_K_BY_CATEGORY[cat] || TOP_K_BY_CATEGORY.General)
    );
    topK = Math.max(topK, maxSecondaryK);
  }

  const retrievalQuery = synthesizeRetrievalQuery(question, history);
  // searchKnowledge's real signature is (question, analysis, topK, options) -- passing topK
  // as the second positional argument here previously landed it in the `analysis` slot,
  // silently zeroing out domain/intent boost scoring and discarding this topK entirely in
  // favor of the function's own internal default.
  const chunks = await searchKnowledge(retrievalQuery, analysis, topK);
  if (!chunks || chunks.length === 0) return "";

  const maxChars = APP_CONFIG?.maxContextCharacters || 3000;
  const seenParagraphs = new Set();
  const cleanParagraphs = [];
  let currentLength = 0;

  for (const chunk of chunks) {
    if (!chunk?.content) continue;

    const paragraphs = chunk.content.split(/\n+/);
    for (const rawPara of paragraphs) {
      const para = rawPara.trim();
      if (!para || seenParagraphs.has(para)) continue;

      seenParagraphs.add(para);

      if (currentLength + para.length > maxChars) {
        const remainingChars = maxChars - currentLength;
        if (remainingChars > 100) {
          const sentenceEnd = para.lastIndexOf(".", remainingChars);
          const truncated = sentenceEnd > 0 ? para.slice(0, sentenceEnd + 1) : para.slice(0, remainingChars);
          cleanParagraphs.push(truncated);
        }
        currentLength = maxChars;
        break;
      }

      cleanParagraphs.push(para);
      currentLength += para.length;
    }

    if (currentLength >= maxChars) break;
  }

  return cleanParagraphs.join("\n\n");
}

function prepareConversationHistory(history = []) {
  const validHistory = history.filter(
    item => item?.content && ["user", "assistant"].includes(item.role)
  );

  if (validHistory.length <= MAX_HISTORY_ITEMS) {
    return validHistory;
  }

  const recentHistory = validHistory.slice(-MAX_HISTORY_ITEMS);
  if (recentHistory.length > 0 && recentHistory[0].role === "assistant") {
    const prevIdx = validHistory.length - MAX_HISTORY_ITEMS - 1;
    if (prevIdx >= 0 && validHistory[prevIdx].role === "user") {
      return [validHistory[prevIdx], ...recentHistory];
    }
  }

  return recentHistory;
}

async function streamGeminiResponse({ apiKey, model, systemPrompt, recentHistory, question, res, signal, maxTokens }) {
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
    if (signal?.aborted) break;
    const chunkText = stripStreamMarkdown(chunk.text());
    if (chunkText) {
      writeSSEChunk(res, chunkText);
      fullText += chunkText;
    }
  }
  return fullText;
}

async function streamOpenAIResponse({ apiKey, model, systemPrompt, recentHistory, question, res, signal, maxTokens }) {
  const client = new OpenAI({ apiKey });

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
    if (signal?.aborted) break;
    const text = stripStreamMarkdown(part.choices[0]?.delta?.content || "");
    if (text) {
      writeSSEChunk(res, text);
      fullText += text;
    }
  }
  return fullText;
}

async function streamOpenRouterResponse({ apiKey, model, systemPrompt, recentHistory, question, res, signal, maxTokens }) {
  // OpenRouter is API-compatible with OpenAI but uses openrouter.ai as base URL
  const client = new OpenAI({
    apiKey,
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
    if (signal?.aborted) break;
    const text = stripStreamMarkdown(part.choices[0]?.delta?.content || "");
    if (text) {
      writeSSEChunk(res, text);
      fullText += text;
    }
  }
  return fullText;
}

async function streamClaudeResponse({ apiKey, model, systemPrompt, recentHistory, question, res, signal, maxTokens }) {
  // Use Anthropic's Claude API
  const client = new Anthropic({
    apiKey: apiKey || process.env.ANTHROPIC_API_KEY
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
    if (signal?.aborted) break;
    if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
      const text = stripStreamMarkdown(event.delta.text || "");
      if (text) {
        writeSSEChunk(res, text);
        fullText += text;
      }
    }
  }
  return fullText;
}

async function streamGroqResponse({ apiKey, model, systemPrompt, recentHistory, question, res, signal, maxTokens }) {
  // Groq is OpenAI-compatible but uses groq.com as base URL
  const client = new OpenAI({
    apiKey,
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
    if (signal?.aborted) break;
    const text = stripStreamMarkdown(part.choices[0]?.delta?.content || "");
    if (text) {
      writeSSEChunk(res, text);
      fullText += text;
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
    question,
    history = [],
    customInstructions,
    candidateResume,
    jobDescription,
    company
  } = req.body || {};

  // Falls back to the configured default (OPENAI_MODEL) when the client doesn't
  // specify one — lets provider/model be set purely through env vars for deployments
  // not driven by the Settings dialog, without any code change.
  const model = requestedModel || APP_CONFIG?.llm?.defaultModel;

  if (!model || !question?.trim()) {
    return res.status(400).json({
      error: "Model and question are required."
    });
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

  // Production mode requires an API key
  if (isProduction && !apiKey) {
    let provider = 'openai';
    if (isClaudeModel(model)) provider = 'anthropic';
    else if (isGeminiModel(model)) provider = 'gemini';

    logger?.warn?.({
      event: 'interview.missing_api_key',
      model,
      provider
    });
    return res.status(400).json({
      error: "An API key is required for production mode — supply one in Settings or configure OPENAI_API_KEY/GEMINI_API_KEY/ANTHROPIC_API_KEY/OPENROUTER_API_KEY."
    });
  }

  if (!setSSEHeaders(res)) {
    return res.status(500).json({ error: "Failed to initialize streaming response." });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  let streamStarted = false;

  try {
    const recoverySignal = isRecoverySignal(question) && history.length > 0;
    const deepenFollowUp = !recoverySignal && isDeepenFollowUp(question);
    const isFollowUp = recoverySignal || isFollowUpUtterance(question, history) || deepenFollowUp;

    // Context resolution (see resolveContext above) -- runs on every request, not just
    // follow-ups: with no history it reduces to exactly the classification every standalone
    // question already got, so this is a no-op for the majority case. For a follow-up, it
    // classifies the current question and (only if needed) the immediately preceding user turn
    // independently, then merges them by explicit precedence -- current-turn evidence always
    // wins; the prior turn's technical domain fills in only when the current turn shows no
    // genuine evidence of its own.
    const resolved = resolveContext(question, history);
    const analysis = resolved.currentAnalysis;
    const primaryCategory = resolved.resolvedCategory;
    const secondaryCategories = resolved.resolvedSecondaryCategories;
    analysis.category = primaryCategory;
    analysis.secondaryCategories = secondaryCategories;
    analysis.domain = resolved.resolvedDomain;
    analysis.isFollowUp = isFollowUp;
    analysis.isDeepenFollowUp = deepenFollowUp;
    analysis.isRecoverySignal = recoverySignal;
    analysis.contextSource = resolved.contextSource;

    const reasoningContract = buildReasoningContract(question, analysis);
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
    const sapComponents = selectSapComponents(question, analysis, reasoningContract.isHybrid);
    const interviewer = profileInterviewer(question, analysis);
    const technicalReasoning = buildTechnicalReasoning(
      question,
      analysis,
      sapComponents,
      interviewer,
      reasoningContract.isHybrid
    );

    // A plain continuation ("then what?") doesn't need fresh retrieval -- the prior context
    // already covers it. A "go deeper" follow-up is the opposite case: the interviewer is
    // asking for MORE technical specificity than the first pass gave, which is exactly when
    // additional targeted retrieval helps most. Skipping it there was starving the one
    // follow-up type that most needed grounding.
    const knowledgeContext = (isFollowUp && !deepenFollowUp)
      ? ""
      : await fetchKnowledgeContext(question, primaryCategory, secondaryCategories, history, analysis);

    // Engineering Memory Platform integration (docs/EXPERIENCE_ACQUISITION_ENGINE_DESIGN.md
    // section 9) -- additive, new prompt section, does not touch CANDIDATE BACKGROUND's
    // existing grounding clauses or any other currently-frozen Experience Activation content.
    // Same skip-on-plain-follow-up reasoning as knowledgeContext above. searchEngineeringMemory
    // itself short-circuits to a zero-cost no-op when the store is empty, so this is safe to
    // leave on unconditionally rather than gating behind whether records exist yet.
    const engineeringJudgment = (isFollowUp && !deepenFollowUp)
      ? { principles: [], records: [] }
      : await searchEngineeringMemory({ question, analysis, topK: 3 });
    const engineeringJudgmentContext = renderEngineeringJudgmentSection(engineeringJudgment);

    const promptPayload = {
      question,
      analysis,
      reasoningContract,
      technicalReasoning,
      interviewer,
      knowledgeContext,
      engineeringJudgmentContext,
      model,
      sapComponents: technicalReasoning.recommendedComponents
    };

    if (customInstructions?.trim()) promptPayload.customInstructions = customInstructions.trim();
    if (candidateResume?.trim()) promptPayload.candidateResume = candidateResume.trim();
    if (jobDescription?.trim()) promptPayload.jobDescription = jobDescription.trim();
    if (company?.trim()) promptPayload.company = company.trim();

    const systemPrompt = buildSapInterviewPrompt(promptPayload);
    // Opt-in diagnostic (off by default, zero effect unless DEBUG_DUMP_PROMPT is set): dumps
    // the exact raw prompt sent to the model to a file, so information-flow questions ("is X
    // actually in the prompt, and where") can be answered by observation instead of inferred
    // from source code.
    if (process.env.DEBUG_DUMP_PROMPT) {
      require("fs").writeFileSync(process.env.DEBUG_DUMP_PROMPT, systemPrompt, "utf-8");
    }
    const recentHistory = prepareConversationHistory(history);

    // Ceiling is sized to the question's length tier (see lib/prompt/interviewPrompt.js) —
    // the main lever for keeping generation under the ~5-6s target in a single-pass
    // architecture, since streaming wall-clock time scales with tokens produced.
    const maxTokens = getMaxTokensForCategory(analysis.category, analysis.secondaryCategories, question, analysis.isDeepenFollowUp, reasoningContract.reasoningMode);

    const streamOptions = {
      apiKey,
      model,
      systemPrompt,
      recentHistory,
      question,
      res,
      signal: controller.signal,
      maxTokens
    };

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
        knowledgeContextPreview: knowledgeContext.slice(0, 500),
        systemPromptChars: systemPrompt.length,
        timestamp: new Date().toISOString()
      };
      if (res?.writable) {
        res.write(`event: retrieval_only\ndata: ${JSON.stringify(diagnostic)}\n\n`);
      }
    } else {
      // Production mode: stream the LLM response
      logger?.info?.({
        event: 'interview.streaming_llm_response',
        model,
        provider: isGeminiModel(model) ? 'gemini' : 'openai',
        hasApiKey: !!apiKey
      });

      let fullAnswerText = "";

      if (isClaudeModel(model)) {
        fullAnswerText = await streamClaudeResponse(streamOptions);
      } else if (isGeminiModel(model)) {
        fullAnswerText = await streamGeminiResponse(streamOptions);
      } else if (isGroqModel(model)) {
        fullAnswerText = await streamGroqResponse(streamOptions);
      } else if (APP_CONFIG?.llm?.apiKeys?.openai) {
        fullAnswerText = await streamOpenAIResponse(streamOptions);
      } else if (APP_CONFIG?.llm?.apiKeys?.openrouter) {
        fullAnswerText = await streamOpenRouterResponse(streamOptions);
      } else {
        fullAnswerText = await streamOpenAIResponse(streamOptions);
      }

      // Post-answer evaluation: pure heuristics, no LLM call, runs only after every
      // content chunk is already on the wire — never delays the spoken answer, and a
      // failure here must never break the already-delivered response.
      try {
        const qualityAnalysis = runPostAnswerEvaluation({
          question,
          answer: fullAnswerText,
          analysis,
          sapComponents: technicalReasoning.recommendedComponents,
          interviewer,
          candidateResume: promptPayload.candidateResume || ""
        });
        if (res?.writable) {
          res.write(`event: analysis\ndata: ${JSON.stringify(qualityAnalysis)}\n\n`);
        }
      } catch (evalError) {
        logger?.error?.("Post-answer evaluation failed (non-fatal):", evalError);
      }
    }

    if (res?.writable) {
      res.write("data: [DONE]\n\n");
    }
  } catch (error) {
    logger?.error?.("Interview Copilot Error:", error);

    const errorMessage = controller.signal.aborted
      ? "Request timed out while generating response."
      : error?.message || "Failed to generate AI response.";

    if (streamStarted && res?.writable) {
      writeSSEError(res, errorMessage);
    } else if (!streamStarted) {
      return res.status(500).json({ error: errorMessage });
    }
  } finally {
    clearTimeout(timeoutId);
    if (res?.writable) {
      res.end();
    }
  }
}