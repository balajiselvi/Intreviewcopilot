/**
 * Live interview reliability boundary for /api/chat.
 * Layers: exponential retry + jitter → multi-provider failover → 4s LLM timeout → local KB fallback.
 * Never invents candidate employers/metrics; methodology framing only.
 */
const fs = require("fs");
const path = require("path");
const { publicLlmError, stripBankQuestionLabels, sanitizeSpokenAnswer } = require("./generationGuard");

const LLM_REQUEST_TIMEOUT_MS = 4000;
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = Object.freeze([300, 800, 1500]);
const INDEX_PATH = path.join(process.cwd(), "data", "knowledgeIndex.json");

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "your", "into", "have",
  "what", "when", "how", "would", "could", "should", "about", "into", "than",
  "then", "them", "they", "are", "was", "were", "been", "being", "will", "can"
]);

let liteChunkCache = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

function jitteredDelay(baseMs) {
  const base = Number(baseMs) || 300;
  const jitter = Math.floor(Math.random() * Math.min(200, Math.max(40, base * 0.25)));
  return base + jitter;
}

function isRetryableLlmError(error) {
  if (!error) return false;
  if (error.name === "AbortError" || error.code === "ABORT_ERR") return true;
  const classified = publicLlmError(error);
  if (classified.autoRetry === true) return true;
  const status = Number(error.status || error.statusCode || error.response?.status || 0);
  if ([429, 500, 502, 503, 504].includes(status)) return true;
  const msg = String(error.message || error.code || "").toLowerCase();
  return /timed?\s*out|timeout|econnreset|etimedout|econnrefused|fetch failed|network|socket|rate limit|overloaded|unavailable/i.test(msg);
}

function createTimeoutSignal(parentSignal, timeoutMs = LLM_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  let timer = null;
  const abortFromParent = () => {
    try { controller.abort(); } catch { /* already aborted */ }
  };
  if (parentSignal?.aborted) {
    abortFromParent();
  } else if (parentSignal) {
    parentSignal.addEventListener("abort", abortFromParent, { once: true });
  }
  timer = setTimeout(abortFromParent, Math.max(1, Number(timeoutMs) || LLM_REQUEST_TIMEOUT_MS));
  return {
    signal: controller.signal,
    dispose() {
      if (timer) clearTimeout(timer);
      timer = null;
      if (parentSignal) {
        try { parentSignal.removeEventListener("abort", abortFromParent); } catch { /* closed */ }
      }
    }
  };
}

/**
 * Run an LLM attempt with a hard timeout. Caller must pass the returned signal into the provider client.
 */
async function runWithLlmTimeout(run, { parentSignal = null, timeoutMs = LLM_REQUEST_TIMEOUT_MS } = {}) {
  const gate = createTimeoutSignal(parentSignal, timeoutMs);
  try {
    return await run(gate.signal);
  } catch (error) {
    if (gate.signal.aborted && (!error || error.name !== "AbortError")) {
      throw Object.assign(new Error("LLM request timed out."), {
        name: "AbortError",
        code: "LLM_TIMEOUT",
        cause: error
      });
    }
    if (gate.signal.aborted) {
      error.code = error.code || "LLM_TIMEOUT";
    }
    throw error;
  } finally {
    gate.dispose();
  }
}

/**
 * Max 3 retries with exponential backoff + jitter on 429/5xx/timeout/network.
 * Stops immediately if hasOutput() is true (tokens already on the wire).
 */
async function runWithExponentialRetry(run, {
  signal = null,
  hasOutput = () => false,
  maxRetries = MAX_RETRIES,
  backoffMs = RETRY_BACKOFF_MS,
  sleepFn = sleep,
  isRetryable = isRetryableLlmError
} = {}) {
  let lastError = null;
  const attempts = Math.max(1, Number(maxRetries) + 1);
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (signal?.aborted && hasOutput()) {
      throw Object.assign(new Error("Request aborted after partial output."), { name: "AbortError" });
    }
    try {
      return await run(attempt);
    } catch (error) {
      lastError = error;
      if (hasOutput()) throw error;
      if (signal?.aborted && error?.name === "AbortError" && error?.code !== "LLM_TIMEOUT") {
        throw error;
      }
      const canRetry = attempt < attempts - 1 && isRetryable(error);
      if (!canRetry) throw error;
      const delay = jitteredDelay(backoffMs[Math.min(attempt, backoffMs.length - 1)] || 300);
      await sleepFn(delay);
    }
  }
  throw lastError || new Error("LLM retries exhausted.");
}

function normalizeTokens(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s/.-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function scoreChunk(queryTokens, chunk, question = "") {
  if (!queryTokens.length) return 0;
  const hay = `${chunk.heading || ""} ${chunk.section || ""} ${chunk.content || ""} ${chunk.sourceFile || ""}`.toLowerCase();
  let hits = 0;
  for (const token of queryTokens) {
    if (hay.includes(token)) hits += 1;
  }
  const headingBoost = queryTokens.some((t) => String(chunk.heading || "").toLowerCase().includes(t)) ? 0.15 : 0;
  let topicBoost = 0;
  const q = String(question || "").toLowerCase();
  // Prefer architect-bank SSO / identity chunks over generic Fiori stubs when those terms appear.
  if (/\bfiori\b/.test(q) && /\b(?:sso|saml2?|oidc|principal\s+propagat|ias)\b/.test(q)) {
    if (/fiori sso|integrate fiori sso|principal propagation|saml|oidc|ias/.test(hay)) topicBoost += 0.55;
    if (/fiori-frontend-security-architect-bank|fiori-security/.test(String(chunk.sourceFile || "").toLowerCase())) {
      topicBoost += 0.25;
    }
  }
  return hits / queryTokens.length + headingBoost + topicBoost;
}

function loadLiteChunks() {
  if (Array.isArray(liteChunkCache) && liteChunkCache.length) return liteChunkCache;
  try {
    const raw = fs.readFileSync(INDEX_PATH, "utf8");
    const index = JSON.parse(raw);
    const chunks = Array.isArray(index?.chunks) ? index.chunks : [];
    liteChunkCache = chunks.map((c) => ({
      content: String(c.content || "").slice(0, 4000),
      heading: String(c.heading || c.section || ""),
      section: String(c.section || ""),
      sourceFile: String(c.sourceFile || ""),
      sourceFolder: String(c.sourceFolder || "")
    }));
  } catch (error) {
    liteChunkCache = [];
    error.code = error.code || "KB_INDEX_LOAD_FAILED";
  }
  return liteChunkCache;
}

/** Test helper — clear cached index rows. */
function resetKnowledgeCache() {
  liteChunkCache = null;
}

function topMatchingChunk(question, { prefetchedText = "", evidence = [] } = {}) {
  const queryTokens = normalizeTokens(question);
  if (Array.isArray(evidence) && evidence.length) {
    const fromEvidence = evidence
      .map((item) => ({
        content: String(item.content || item.text || item.snippet || ""),
        heading: cleanKnowledgeHeading(item.heading || item.section || item.title || ""),
        section: String(item.section || ""),
        sourceFile: String(item.sourceFile || item.source || ""),
        sourceFolder: String(item.sourceFolder || "")
      }))
      .filter((c) => c.content.trim().length > 40)
      .map((c) => ({ chunk: c, score: scoreChunk(queryTokens, c, question) }))
      .sort((a, b) => b.score - a.score)[0];
    if (fromEvidence?.chunk) return fromEvidence.chunk;
  }

  if (String(prefetchedText || "").trim().length > 80) {
    return {
      content: String(prefetchedText).slice(0, 3500),
      heading: "Retrieved knowledge",
      section: "",
      sourceFile: "knowledgeContext",
      sourceFolder: ""
    };
  }

  const chunks = loadLiteChunks();
  if (!chunks.length) {
    return {
      content: "Establish the identity and authorization boundary first, then configure the product-native controls, then prove the path with logs and negative tests.",
      heading: "SAP Security architecture baseline",
      section: "",
      sourceFile: "builtin",
      sourceFolder: ""
    };
  }

  let best = chunks[0];
  let bestScore = -1;
  for (let i = 0; i < chunks.length; i++) {
    const score = scoreChunk(queryTokens, chunks[i], question);
    if (score > bestScore) {
      bestScore = score;
      best = chunks[i];
    }
  }
  if (best) {
    return {
      ...best,
      heading: cleanKnowledgeHeading(best.heading || best.section || ""),
      content: stripBankQuestionLabels(best.content || "")
    };
  }
  return best;
}

function sentencesFrom(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25);
}

function pickSentence(sentences, patterns, fallback) {
  for (const sentence of sentences) {
    if (patterns.some((re) => re.test(sentence))) return sentence.replace(/^[-*#\s]+/, "");
  }
  return fallback;
}

/**
 * Format a grounded Senior Principal Architect answer from a KB chunk.
 * Uses methodology voice only — no fabricated employers or metrics.
 */
function stripBulletLabel(text = "") {
  return String(text || "")
    .replace(/^\s*\*\s*\*\*(?:Decision|Mechanism|Governance|Validation|Situation|Task|Action|Result):\*\*\s*/i, "")
    .replace(/^\s*(?:Decision|Mechanism|Governance|Validation|Situation|Task|Action|Result):\s*/i, "")
    .trim();
}

function extractLabeledBullet(content, label) {
  const re = new RegExp(
    `(?:^|\\n)\\s*[-*]?\\s*\\*\\*\\s*${label}\\s*:?\\s*\\*\\*\\s*([^\\n]+)`,
    "i"
  );
  const match = String(content || "").match(re);
  return match ? stripBulletLabel(match[1]) : "";
}

function cleanKnowledgeHeading(heading = "") {
  const cleaned = stripBankQuestionLabels(String(heading || "").trim())
    .replace(/^#+\s*/, "")
    .trim();
  // Never feed bank question text ("How do you integrate…") into Decision.
  if (!cleaned || /^(?:how|what|why|when|where)\b/i.test(cleaned)) {
    return "the relevant control plane";
  }
  return cleaned.slice(0, 120);
}

function formatArchitectFallback(chunk, question = "") {
  const content = stripBankQuestionLabels(String(chunk?.content || "").trim());
  const sentences = sentencesFrom(content).map(stripBulletLabel).filter(Boolean);
  const lead = sentences[0] || stripBulletLabel(content.slice(0, 220)) || "I would fix the control boundary before expanding entitlements.";
  const planeFallback =
    "I would keep lifecycle, authentication, provisioning, and authorization planes distinct for this control boundary.";

  const decision = stripBulletLabel(
    extractLabeledBullet(content, "Decision")
    || pickSentence(sentences, [/boundar/i, /architect/i, /design/i, /separat/i, /approach/i, /SSO|SAML|OIDC|IAS|propagat/i], planeFallback)
  );
  const mechanism = stripBulletLabel(
    extractLabeledBullet(content, "Mechanism")
    || pickSentence(
      sentences,
      [/PFCG|SU24|SU53|MSMP|BRF|IAS|IPS|IAG|RBP|SAML|OIDC|SCIM|SM59|CERTRULE|FLP|role|auth|config|parameter|transaction|t-?code|ST03N|AGR_/i],
      lead
    )
  );
  const governance = stripBulletLabel(
    extractLabeledBullet(content, "Governance")
    || pickSentence(
      sentences,
      [/SoD|audit|complian|govern|approv|segregat|risk|control|policy|SOX|GDPR|technical user|IdP/i],
      "I would keep approval, SoD, and audit evidence on the governance plane so emergency access and standing privilege stay reviewable."
    )
  );
  const validation = stripBulletLabel(
    extractLabeledBullet(content, "Validation")
    || pickSentence(
      sentences,
      [/validat|verify|ST01|STAUTHTRACE|SM50|log|trace|test|RC=|negative|UAT|sign-?off|SY-UNAME|propagat/i],
      "I would validate with a positive path, a negative denial path, and the product log or trace that proves the same decision end to end."
    )
  );

  // Fluent spoken prose only — never emit Decision/Mechanism/Governance/Validation headings.
  const parts = [mechanism || decision, decision && mechanism && decision !== mechanism ? decision : "", governance, validation]
    .map((p) => String(p || "").trim())
    .filter(Boolean);
  const deduped = [];
  for (const part of parts) {
    if (!deduped.some((kept) => kept === part || kept.includes(part) || part.includes(kept))) {
      deduped.push(part);
    }
  }
  return sanitizeSpokenAnswer(deduped.join(" "));
}

function buildLocalKnowledgeFallback(question, options = {}) {
  const chunk = topMatchingChunk(question, options);
  const answer = formatArchitectFallback(chunk, question);
  return {
    answer,
    chunk,
    route: "LOCAL_KNOWLEDGE_FALLBACK",
    sourceFile: chunk.sourceFile || "",
    heading: chunk.heading || ""
  };
}

/**
 * Build ordered failover targets when secondary keys/models exist.
 */
function resolveProviderFailoverChain({
  primaryModel,
  primaryApiKey,
  apiKeys = {},
  env = process.env
} = {}) {
  const chain = [];
  const seen = new Set();
  const push = (entry) => {
    if (!entry?.apiKey || !entry?.model) return;
    const key = `${entry.provider}:${entry.model}:${String(entry.apiKey).slice(0, 8)}`;
    if (seen.has(key)) return;
    seen.add(key);
    chain.push(entry);
  };

  const model = String(primaryModel || "").toLowerCase();
  let primaryProvider = "openai";
  if (model.includes("claude")) primaryProvider = "anthropic";
  else if (model.startsWith("gemini")) primaryProvider = "gemini";
  else if (model.includes("llama") || model.includes("mixtral") || model.includes("groq")) primaryProvider = "groq";

  push({
    provider: primaryProvider,
    model: primaryModel,
    apiKey: primaryApiKey
  });

  const fallbackOpenAiModel = env.FALLBACK_OPENAI_MODEL || env.OPENAI_FALLBACK_MODEL || "gpt-4o-mini";
  const fallbackAnthropicModel = env.FALLBACK_ANTHROPIC_MODEL || env.ANTHROPIC_FALLBACK_MODEL || "claude-haiku-4-5-20251001";
  const fallbackGeminiModel = env.FALLBACK_GEMINI_MODEL || "gemini-1.5-flash";
  const fallbackGroqModel = env.FALLBACK_GROQ_MODEL || "llama-3.1-8b-instant";

  if (apiKeys.openai) {
    push({ provider: "openai", model: fallbackOpenAiModel, apiKey: apiKeys.openai });
  }
  if (apiKeys.anthropic) {
    push({ provider: "anthropic", model: fallbackAnthropicModel, apiKey: apiKeys.anthropic });
  }
  if (apiKeys.gemini) {
    push({ provider: "gemini", model: fallbackGeminiModel, apiKey: apiKeys.gemini });
  }
  if (apiKeys.groq) {
    push({ provider: "groq", model: fallbackGroqModel, apiKey: apiKeys.groq });
  }
  if (apiKeys.openrouter) {
    push({
      provider: "openrouter",
      model: env.FALLBACK_OPENROUTER_MODEL || fallbackOpenAiModel,
      apiKey: apiKeys.openrouter
    });
  }

  return chain;
}

/**
 * Primary LLM path with timeout, retries, and provider failover.
 * Returns { text, provider, model, usedFailover } or throws the last error.
 */
function isIntraProviderRetryable(error) {
  // Hard 4s LLM timeout should fail over / fall back immediately — do not burn backoff retries.
  if (error?.code === "LLM_TIMEOUT") return false;
  if (error?.name === "AbortError" && error?.code === "LLM_TIMEOUT") return false;
  return isRetryableLlmError(error);
}

async function generateWithReliability(runProvider, {
  chain,
  parentSignal = null,
  hasOutput = () => false,
  timeoutMs = LLM_REQUEST_TIMEOUT_MS,
  maxRetries = MAX_RETRIES,
  sleepFn = sleep
} = {}) {
  if (!Array.isArray(chain) || chain.length === 0) {
    throw Object.assign(new Error("No LLM provider available."), { code: "NO_PROVIDER" });
  }

  let lastError = null;
  for (let i = 0; i < chain.length; i++) {
    const target = chain[i];
    if (hasOutput()) {
      throw lastError || Object.assign(new Error("Partial output already streamed."), { code: "PARTIAL_OUTPUT" });
    }
    try {
      const text = await runWithExponentialRetry(
        async () => runWithLlmTimeout(
          (signal) => runProvider({ ...target, signal }),
          { parentSignal, timeoutMs }
        ),
        {
          signal: parentSignal,
          hasOutput,
          maxRetries,
          sleepFn,
          isRetryable: isIntraProviderRetryable
        }
      );
      return {
        text,
        provider: target.provider,
        model: target.model,
        usedFailover: i > 0
      };
    } catch (error) {
      lastError = error;
      if (hasOutput()) throw error;
      // Auth / quota / hard timeout: switch provider when a secondary key exists.
      const classified = publicLlmError(error);
      const tryNext = i < chain.length - 1 && (
        isRetryableLlmError(error) ||
        classified.code === "auth" ||
        classified.code === "quota" ||
        error?.code === "LLM_TIMEOUT" ||
        error?.code === "NO_PROVIDER"
      );
      if (!tryNext) throw error;
    }
  }
  throw lastError || new Error("All LLM providers failed.");
}

module.exports = {
  LLM_REQUEST_TIMEOUT_MS,
  MAX_RETRIES,
  RETRY_BACKOFF_MS,
  isRetryableLlmError,
  jitteredDelay,
  sleep,
  runWithLlmTimeout,
  runWithExponentialRetry,
  resolveProviderFailoverChain,
  generateWithReliability,
  topMatchingChunk,
  formatArchitectFallback,
  buildLocalKnowledgeFallback,
  loadLiteChunks,
  resetKnowledgeCache
};
