/**
 * Server-side LLM provider mode isolation.
 * Controlled only by process env / appConfig — never by browser-supplied body fields.
 *
 * Modes:
 * - mock: deterministic mock provider only; live SDKs must never run
 * - disabled: no provider API; generation uses controlled unavailable / permitted local routes
 * - live: existing live-provider path
 *
 * Unknown mode → disabled (fail closed). Missing mode → live (production default),
 * unless INTERVIEW_ACCEPTANCE_LOCK=1 which forces disabled when unset.
 */

const PROVIDER_STATS = {
  mode: null,
  mockInvocations: 0,
  liveTransportInvocations: 0,
  disabledBlocked: 0,
  lastImplementation: null
};

function resolveProviderMode(env = process.env, appConfig = null) {
  const configured = String(
    env.LLM_PROVIDER_MODE
    || env.INTERVIEW_PROVIDER_MODE
    || appConfig?.llm?.providerMode
    || ""
  ).trim().toLowerCase();

  if (configured === "mock" || configured === "disabled" || configured === "live") {
    return configured;
  }
  if (configured) {
    // Unknown value — never silently activate live.
    return "disabled";
  }
  if (String(env.INTERVIEW_ACCEPTANCE_LOCK || "") === "1") {
    return "disabled";
  }
  return "live";
}

function resetProviderStats(mode = null) {
  PROVIDER_STATS.mode = mode;
  PROVIDER_STATS.mockInvocations = 0;
  PROVIDER_STATS.liveTransportInvocations = 0;
  PROVIDER_STATS.disabledBlocked = 0;
  PROVIDER_STATS.lastImplementation = null;
}

function getProviderStats() {
  return { ...PROVIDER_STATS };
}

function recordMockInvocation(implementation = "deterministic-mock") {
  PROVIDER_STATS.mockInvocations += 1;
  PROVIDER_STATS.lastImplementation = implementation;
}

function recordLiveTransportInvocation(implementation = "live-sdk") {
  PROVIDER_STATS.liveTransportInvocations += 1;
  PROVIDER_STATS.lastImplementation = implementation;
}

function recordDisabledBlocked() {
  PROVIDER_STATS.disabledBlocked += 1;
  PROVIDER_STATS.lastImplementation = "disabled";
}

/**
 * Guard for live SDK entry points. Throws when mode is not live.
 */
function assertLiveTransportAllowed(mode, implementation = "live-sdk") {
  if (mode === "live") {
    recordLiveTransportInvocation(implementation);
    return;
  }
  const err = new Error(
    `Live provider transport blocked (mode=${mode}). Implementation=${implementation} must not run.`
  );
  err.code = "PROVIDER_MODE_BLOCKED";
  throw err;
}

function looksLikeSapDomainQuestion(question = "") {
  return /\b(?:SAP|S\/4|S4HANA|HANA|Fiori|PFCG|SU\d{2}|PFUD|AGR_|GRC|IAG|IAS|IPS|IDM|BTP|XSUAA|MSMP|BRM|BRF|SoD|BW\/?4?|RSECADMIN|authorization objects?|T-?codes?)\b/i
    .test(String(question || ""));
}

/**
 * Build a deterministic mock spoken answer for GENERATION tests.
 * Prefers integrity-aligned technical fallbacks; never invents personal metrics.
 * Non-SAP questions must not receive SAP-plane principle prose.
 */
function buildDeterministicMockAnswer(question = "", knowledgeContext = "") {
  const q = String(question || "");
  const kb = String(knowledgeContext || "").trim();
  // Outside-inventory / invented-product asks: never echo fabricated T-codes or modules.
  if (/\bZZX99_FAKE\b|\bQuantum Ledger Controllers?\b/i.test(q)) {
    return (
      "I do not have verified product documentation for that module or transaction path in the knowledge base. "
      + "I would not invent T-codes, tables, or configuration paths. "
      + "If this maps to a standard SAP product, name the real product and release and I will answer from that plane."
    );
  }
  // Personal-experience asks: methodology framing only — never Activate/RISE checklist KB dumps.
  if (/\b(?:tell me about your|your .{0,60}experience|have you (?:ever |worked|implemented|led)|walk me through a time|describe a (?:time|project) when)\b/i.test(q)) {
    return (
      "I would answer from verified CV engagements only: the transformation objective, "
      + "the security and role decisions I owned, Fiori or platform authorization readiness where relevant, "
      + "and the cutover evidence I would defend — without inventing employers, metrics, or undocumented transactions."
    );
  }
  // Grounded mock: when KB evidence was retrieved, speak from that evidence (LLM path exercise).
  if (kb.length >= 80) {
    const clipped = kb
      .replace(/^###\s*SOURCE:[^\n]*$/gim, "")
      .replace(/\bSOURCE:\s*[\w./-]+\s*\|\s*SECTION:\s*[^\n]+/gi, "")
      .replace(/^#+\s+/gm, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 900);
    return clipped.length >= 40 ? clipped : kb;
  }
  try {
    const { buildDirectTechnicalFallback } = require("./answerIntegrityGate.js");
    const direct = String(buildDirectTechnicalFallback(question) || "").trim();
    if (direct.length >= 40) return direct;
  } catch {
    // fall through
  }
  // Zero relevant KB + non-SAP ask: general technical generation stub (not SAP identity/auth planes).
  if (!looksLikeSapDomainQuestion(q)) {
    return (
      "I would answer from established general knowledge for this topic: state the direct concept, "
      + "explain the mechanism in a logical sequence, and separate well-established facts from "
      + "version-dependent or uncertain details. I will not invent product capabilities or personal implementation history."
    );
  }
  try {
    const { buildPrincipleLevelFallback } = require("./generationGuard.js");
    const principle = String(buildPrincipleLevelFallback(question) || "").trim();
    if (principle.length >= 40) return principle;
  } catch {
    // fall through
  }
  return (
    "I would confirm the product plane, state the governing mechanism for this ask, "
    + "and validate with a positive and negative check. I will not invent project metrics "
    + "or undocumented personal transactions."
  );
}

/**
 * Mock provider stream compatible with buffered GENERATION (writable may be false).
 * Returns full text the same way streamOpenAIResponse does.
 */
function stripKnowledgeProvenanceLabels(text = "") {
  return String(text || "")
    .replace(/^###\s*SOURCE:[^\n]*$/gim, "")
    .replace(/\bSOURCE:\s*[\w./-]+\s*\|\s*SECTION:\s*[^\n]+/gi, "")
    .replace(/^#+\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

async function streamMockProviderResponse({
  question = "",
  res = null,
  onChunk = null,
  answerText = "",
  knowledgeContext = ""
} = {}) {
  recordMockInvocation("deterministic-mock");
  const seeded = stripKnowledgeProvenanceLabels(answerText);
  const text = stripKnowledgeProvenanceLabels(
    seeded
    || buildDeterministicMockAnswer(question, knowledgeContext)
    || ""
  );
  // Buffer-only path: do not write when res is non-writable (production bufferBeforeDisplay).
  if (res?.writable && text) {
    try {
      // Intentionally unused for buffered path; kept for API symmetry with live streams.
      void onChunk;
    } catch {
      // ignore
    }
  }
  if (typeof onChunk === "function") {
    try { onChunk(text); } catch { /* history only */ }
  }
  return text;
}

const DISABLED_GENERATION_MESSAGE =
  "Provider generation is disabled on this server. That is an operational configuration, not a statement that SAP technical knowledge is missing. "
  + "Prepared, verified, or retrieved local-knowledge routes may still answer when they apply; otherwise generation stays unavailable until a provider is enabled.";

module.exports = {
  resolveProviderMode,
  resetProviderStats,
  getProviderStats,
  recordMockInvocation,
  recordLiveTransportInvocation,
  recordDisabledBlocked,
  assertLiveTransportAllowed,
  buildDeterministicMockAnswer,
  streamMockProviderResponse,
  DISABLED_GENERATION_MESSAGE,
  PROVIDER_STATS
};
