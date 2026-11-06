/**
 * Shared generation failure classification for /api/chat and the interview UI.
 * Not an extra LLM pass — maps HTTP/API failures to retry policy and user-safe copy.
 */
function classifyGenerationFailure({ httpStatus, message = "", name = "" } = {}) {
  const raw = String(message || "");
  const lower = raw.toLowerCase();
  const status = Number(httpStatus) || 0;

  if (/incomplete generation|invalid stream payload/i.test(lower)) {
    return { code: "incomplete", retryable: true, autoRetry: false, userMessage: "The answer may be incomplete. You can Retry." };
  }

  if (name === "AbortError" || name === "APIConnectionTimeoutError" || /timed out while generating|the answer timed out|generation stopped/i.test(lower)) {
    return {
      code: "timeout",
      retryable: true,
      autoRetry: false,
      userMessage: "The answer timed out. You can Retry."
    };
  }
  if (status === 402 || /insufficient_quota|billing|exceeded your current quota|payment/.test(lower)) {
    return { code: "quota", retryable: false, autoRetry: false, userMessage: "AI quota is exhausted. Check the API key and billing in Settings." };
  }
  if (status === 429 || /rate limit|too many requests/.test(lower)) {
    return { code: "rate", retryable: true, autoRetry: true, userMessage: "The service is busy. You can Retry." };
  }
  // Programming / handler faults (e.g. const reassignment) often arrive as bare HTTP 500 HTML.
  // Do not label them as provider "temporary" outages — they are internal and retryable after a fix/reload.
  if (/assignment to constant variable|cannot read propert|is not a function|is not defined/i.test(lower)) {
    return {
      code: "internal",
      retryable: true,
      autoRetry: false,
      userMessage: "The interview service hit an internal error. You can Retry."
    };
  }
  if (status >= 500 || name === "APIConnectionError" || /econnreset|etimedout|fetch failed|failed to fetch|networkerror|network|load failed/i.test(lower)) {
    return { code: "transient", retryable: true, autoRetry: true, userMessage: "The service had a temporary error. You can Retry." };
  }
  if (/empty generation|empty body|stream error/i.test(lower)) {
    return { code: "empty", retryable: true, autoRetry: false, userMessage: "No answer came back. Your question is still listed. You can Retry." };
  }
  if (status === 401 || status === 403) {
    return { code: "auth", retryable: false, autoRetry: false, userMessage: "The API key was rejected. Update it in Settings." };
  }
  return { code: "generic", retryable: true, autoRetry: false, userMessage: "Could not generate an answer. Your question is still listed. You can Retry." };
}

function publicLlmError(error) {
  const status = error?.status || error?.statusCode || error?.response?.status;
  const message = error?.code || error?.error?.code || error?.message || "";
  return classifyGenerationFailure({ httpStatus: status, message, name: error?.name });
}

function isIncompleteGeneration(reason) {
  return ["length", "max_tokens", "max_output_tokens", "content_filter", "safety", "recitation", "blocklist", "prohibited_content", "spii", "incomplete_content"].includes(String(reason || "").toLowerCase());
}

const OPEN_CLAUSE_TAIL = /(?:\b(?:this\s+includes|including|such\s+as|for\s+example|e\.g\.|i\.e\.|as\s+well\s+as|along\s+with|and|or|but|with|to|of|for|from|into|via|through|then|next)\s*[,:]?\s*|\b(?:includes|involves|requires|ensures|using|via)\s*)$/i;

/**
 * G2 — content-level completeness (independent of provider finish_reason).
 * Rejects mid-clause cutoffs like "... This includes".
 */
function looksIncompleteSpokenAnswer(text = "") {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (!value) return true;
  if (/[.!?]["')\]]*\s*$/.test(value)) return false;
  if (OPEN_CLAUSE_TAIL.test(value)) return true;
  // Trailing lowercase fragment without sentence end is unfinished speech.
  if (/[a-z0-9)]\s*$/.test(value) && !/[.!?]$/.test(value)) return true;
  return false;
}

function extractClaimedTransactions(answer = "") {
  const text = String(answer || "");
  const found = new Set();
  const patterns = [
    /\btransaction(?:\s+code)?\s+([A-Z][A-Z0-9_\/]{2,})\b/gi,
    /\bT-?codes?\s+([A-Z][A-Z0-9_\/]{2,})\b/gi,
    /\bthrough the transaction code\s+([A-Z][A-Z0-9_\/]{2,})\b/gi
  ];
  for (const re of patterns) {
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(text)) !== null) {
      const code = String(match[1] || "").trim().toUpperCase();
      if (code) found.add(code);
    }
  }
  return [...found];
}

function normalizeSapToken(token = "") {
  return String(token || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/BRF\+/g, "BRFPLUS")
    .replace(/BRFPLUS/g, "BRFPLUS");
}

/**
 * Verified-entity registry loader.
 * IMPORTANT: retrieved knowledge is NEVER auto-promoted to VERIFIED. Only explicitly
 * registered entities with verification_status === "VERIFIED" (and unexpired) qualify.
 * An empty/missing registry is the safe default.
 */
function loadVerifiedEntityRegistry(registry = null) {
  const entities = new Map();
  try {
    const source = registry && typeof registry === "object" ? registry : null;
    const rows = Array.isArray(source?.entities) ? source.entities : [];
    const now = Date.now();
    for (const row of rows) {
      if (!row || typeof row !== "object") continue;
      const token = normalizeSapToken(row.token || row.id || "");
      if (!token) continue;
      const status = String(row.verification_status || "").toUpperCase();
      if (status !== "VERIFIED") continue;
      if (row.expiry || row.recheck_date) {
        const expiry = Date.parse(row.expiry || row.recheck_date);
        if (Number.isFinite(expiry) && expiry < now) continue;
      }
      entities.set(token, {
        token,
        product: row.product || null,
        versionScope: row.version_scope || row.versionScope || null,
        sources: Array.isArray(row.sources) ? row.sources : [],
        verification_status: "VERIFIED",
        verified_on: row.verified_on || null
      });
    }
  } catch {
    // Registry faults must not break live generation.
  }
  return { entities, loaded: entities.size > 0 };
}

function isVerifiedEntity(token, registry = null) {
  const loaded = registry && registry.entities instanceof Map
    ? registry
    : loadVerifiedEntityRegistry(registry);
  return loaded.entities.has(normalizeSapToken(token));
}

/**
 * I2 — Build a per-turn RETRIEVED_CANDIDATE entity set from SUPPORTING KNOWLEDGE.
 * Presence here means "appeared in retrieved text for this turn", NOT "verified against
 * SAP documentation". Conflicts (edition mixes) are surfaced via `conflicts`.
 */
function buildEntityAllowlistFromKnowledge(knowledgeText = "") {
  const text = String(knowledgeText || "");
  const transactions = new Set();
  const tables = new Set();
  const authObjects = new Set();
  const services = new Set();
  const apps = new Set();
  const rawTokens = new Set();
  const conflicts = [];
  const provenance = "RETRIEVED_CANDIDATE";
  const verified = false;

  const add = (bucket, value) => {
    const normalized = normalizeSapToken(value);
    if (!normalized || normalized.length < 3) return;
    bucket.add(normalized);
    rawTokens.add(normalized);
    if (normalized === "BRFPLUS" || /^BRF/.test(normalized)) {
      transactions.add("BRFPLUS");
      transactions.add("BRF+");
      rawTokens.add("BRFPLUS");
      rawTokens.add("BRF+");
    }
  };

  try {
    if (!text.trim()) {
      return {
        transactions,
        tables,
        authObjects,
        services,
        apps,
        rawTokens,
        conflicts,
        provenance,
        verified
      };
    }

    for (const match of text.matchAll(/\/[A-Z][A-Z0-9_]+(?:\/[A-Z0-9_]+)*/gi)) {
      add(services, match[0]);
      add(transactions, match[0]);
    }

    for (const match of text.matchAll(/\b(?:transaction(?:\s+code)?|t-?codes?)\s+([A-Z][A-Z0-9_\/+]{2,})/gi)) {
      add(transactions, match[1]);
    }

    for (const match of text.matchAll(/\btable\s+([A-Z][A-Z0-9_]{3,})\b/gi)) {
      add(tables, match[1]);
    }

    for (const match of text.matchAll(/\b(?:authorization\s+object|auth(?:orization)?\s+obj(?:ect)?)\s+([A-Z][A-Z0-9_]{3,})\b/gi)) {
      add(authObjects, match[1]);
    }

    for (const match of text.matchAll(/\b(?:service|odata(?:\s+service)?)\s+(\/[A-Z][A-Z0-9_\/]+|[A-Z][A-Z0-9_]{3,})\b/gi)) {
      add(services, match[1]);
    }

    for (const match of text.matchAll(/\b(?:app|application|fiori app|admin(?:istration)?\s+app)\s+([A-Z][A-Za-z0-9][A-Za-z0-9 _-]{2,60})/gi)) {
      add(apps, match[1]);
    }

    for (const match of text.matchAll(/`([A-Z][A-Z0-9_\/+]{2,})`/g)) {
      add(rawTokens, match[1]);
      if (match[1].startsWith("/")) add(services, match[1]);
      else if (/^[A-Z]_[A-Z0-9_]+$/.test(match[1])) add(authObjects, match[1]);
      else if (/^(?:AGR_|USOB|GRAC|GRFN)/i.test(match[1])) add(tables, match[1]);
      else add(transactions, match[1]);
    }

    // Standalone well-formed SAP technical tokens that appear as words in the source.
    for (const match of text.matchAll(/\b([A-Z][A-Z0-9_]{3,}|BRF\+|BRFplus|BRFPLUS)\b/g)) {
      const token = match[1];
      if (/^(?:THE|AND|FOR|WITH|FROM|THIS|THAT|WHEN|THEN|NEXT|ALSO|INTO|OVER|ONLY|MUST|SHOULD|WOULD|COULD|AFTER|BEFORE|UNDER|ABOUT|WHERE|WHICH|WHILE|THERE|THESE|THOSE|EACH|BOTH|SAME|MORE|MOST|SUCH|THAN|THEN|JUST|EVEN|ALSO|HERE|SOURCE|CHECKED|VERIFIED|CONTENT|SECTION|OVERVIEW|SUMMARY)$/i.test(token)) {
        continue;
      }
      add(rawTokens, token);
      if (/^BRF/i.test(token)) add(transactions, token);
    }

    // Surface edition/version claim collisions across SOURCE boundaries (informational).
    const editionHits = [...text.matchAll(/\b((?:Public|Private)\s+Edition|on[- ]premise|S\/4HANA\s+Cloud)\b/gi)]
      .map((m) => m[1]);
    if (editionHits.length >= 2) {
      const unique = [...new Set(editionHits.map((v) => v.toLowerCase()))];
      if (unique.length >= 2) {
        conflicts.push({ type: "edition-mix", values: unique });
      }
    }
  } catch {
    // Allowlist build must never throw into the live path.
  }

  return {
    transactions,
    tables,
    authObjects,
    services,
    apps,
    rawTokens,
    conflicts,
    provenance,
    verified
  };
}

function entityAllowed(token, allowlist) {
  const normalized = normalizeSapToken(token);
  if (!normalized) return false;
  const allow = allowlist || {};
  const buckets = [
    allow.transactions,
    allow.tables,
    allow.authObjects,
    allow.services,
    allow.apps,
    allow.rawTokens
  ];
  for (const bucket of buckets) {
    if (bucket && typeof bucket.has === "function" && bucket.has(normalized)) return true;
    if (bucket && typeof bucket.has === "function" && normalized === "BRFPLUS" && (bucket.has("BRF+") || bucket.has("BRFPLUS"))) {
      return true;
    }
  }
  // Soft match: knowledge may say BRFplus while answer says BRFPLUS / BRF+.
  if (/^BRF/.test(normalized)) {
    for (const bucket of buckets) {
      if (!bucket || typeof bucket.values !== "function") continue;
      for (const item of bucket.values()) {
        if (/^BRF/.test(String(item))) return true;
      }
    }
  }
  return false;
}

/**
 * G1 — T-codes/entities claimed in the answer but absent from supporting knowledge.
 * When knowledgeText is empty, only known investigation hallucinations are flagged.
 */
function findUngroundedTransactionClaims(answer = "", knowledgeText = "") {
  const claims = extractClaimedTransactions(answer);
  if (!claims.length) return [];
  const knowledge = String(knowledgeText || "");
  if (!knowledge.trim()) {
    return claims.filter((code) => code === "GRFCP2");
  }
  const allow = buildEntityAllowlistFromKnowledge(knowledge);
  return claims.filter((code) => {
    const norm = normalizeSapToken(code);
    // Align with strip keep-list: established admin/diagnostic T-codes are not "ungrounded"
    // solely because a thin retrieval snippet omitted them (avoids false recovered_procedure).
    if (WELL_KNOWN_SAP_KEEP.has(norm)) return false;
    if (entityAllowed(code, allow)) return false;
    const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return !new RegExp(`\\b${escaped}\\b`, "i").test(knowledge);
  });
}

/**
 * I2 — Remove or hedge SAP entities in the spoken answer that are absent from the
 * knowledge-derived allowlist. Does not invent replacements; keeps surrounding prose.
 */
/** Established plane-correct diagnostic / admin T-codes — never strip from spoken answers solely for missing KB hit. */
const WELL_KNOWN_SAP_KEEP = new Set([
  "ST03", "ST03N", "STAD", "SM18", "SM19", "SM20", "SM20N", "RSAU_READ_LOG", "RSAU_CONFIG", "RSAUPURG",
  "SUIM", "SU53", "ST01", "STAUTHTRACE", "PFCG", "SU01", "SU10", "SU24", "SU25", "PFUD",
  "SM59", "SICF", "SAML2", "STRUST", "RSECADMIN",
  "GRFNMW_CONFIGURE", "GRFNMW_CONFIGURE_WD", "GRAC_RULE_BUILD", "NWBC"
]);

function stripUngroundedSapEntities(answer = "", knowledgeText = "") {
  const source = String(answer || "");
  if (!source.trim()) return source;
  let out = source;
  const removed = [];
  try {
    const allow = buildEntityAllowlistFromKnowledge(knowledgeText);

    // Remove ungrounded technical identifiers quietly. Do NOT inject meta phrases such as
    // "not confirmed in supporting knowledge" into spoken interview answers (LIVE audit defect).
    const scrub = (full, prefix, token) => {
      const norm = normalizeSapToken(token);
      if (entityAllowed(token, allow) || WELL_KNOWN_SAP_KEEP.has(norm)) return full;
      removed.push(norm);
      return prefix.trimEnd() ? `${prefix.trimEnd()} ` : "";
    };

    out = out.replace(/\b(transaction(?:\s+code)?\s+)([A-Z][A-Z0-9_\/+]{2,})\b/gi, scrub);
    out = out.replace(/\b(T-?codes?\s+)([A-Z][A-Z0-9_\/+]{2,})\b/gi, scrub);
    out = out.replace(/\b(table\s+)([A-Z][A-Z0-9_]{3,})\b/gi, scrub);
    out = out.replace(/\b(authorization\s+object\s+)([A-Z][A-Z0-9_]{3,})\b/gi, scrub);
    out = out.replace(/\b(service\s+)(\/[A-Z][A-Z0-9_\/]+|[A-Z][A-Z0-9_]{3,})\b/gi, scrub);

    // Verb-anchored bare codes ("I launch ZX99") — false-negative class when "transaction" is omitted.
    // Require an action verb; never strip free-standing English capitals.
    out = out.replace(
      /\b((?:open|launch|run|call|use|via|through|execute)\s+)([A-Z][A-Z0-9_]{2,20})\b/g,
      (full, prefix, token) => {
        const norm = normalizeSapToken(token);
        if (entityAllowed(token, allow) || WELL_KNOWN_SAP_KEEP.has(norm)) return full;
        // Skip tokens that look like ordinary words already lowercased away; require digit or underscore
        // OR classic T-code shape (letters+digits) to reduce false strips.
        if (!/[0-9_]/.test(token) && token.length > 6) return full;
        removed.push(norm);
        return prefix.trimEnd() ? `${prefix.trimEnd()} ` : "";
      }
    );

    // Bare slash paths that look like Gateway/UI services and are not allowlisted.
    out = out.replace(/(\s)(\/[A-Z][A-Z0-9_]+(?:\/[A-Z0-9_]+)*)\b/g, (full, space, token) => {
      const norm = normalizeSapToken(token);
      if (entityAllowed(token, allow) || WELL_KNOWN_SAP_KEEP.has(norm)) return full;
      removed.push(norm);
      return space;
    });

    out = out.replace(/\s{2,}/g, " ").replace(/\s+([.,;:!?])/g, "$1").trim();
    if (!out && removed.length) {
      // Never emit a meta-refusal stub here — callers must fall back to procedure / local KB.
      return "";
    }
  } catch {
    return source.trim();
  }
  return out;
}

/**
 * True when entity strip hollowed a sentence into broken spoken English
 * (e.g. "Review table for the user assignment", "utilizing transaction, which…").
 * Used by callers to reject damaged sanitizer output — does not re-introduce entities.
 */
function isDestructiveEntityStripResult(original = "", stripped = "") {
  try {
    const before = String(original || "").trim();
    const after = String(stripped || "").trim();
    if (!before || !after || after === before) return false;
    if (/Review table for\b/i.test(after) && /Review table\s+[A-Z]/i.test(before)) return true;
    if (/\btable for (?:the\s+)?(?:user assignment|authorization values)\b/i.test(after)
      && /\btable\s+AGR_/i.test(before)) return true;
    if (/\btransaction,\s*(?:which|typically|and)\b/i.test(after)
      && /\btransaction\s+[A-Z][A-Z0-9_/]{2,}/i.test(before)) return true;
    if (/\b(?:utilizing|using|via|through)\s+transaction(?!\s+[A-Z])/i.test(after)
      && /\btransaction\s+[A-Z][A-Z0-9_/]{2,}/i.test(before)) return true;
    if (/\bauthorization object\s+(?:for|to|in|on|[,.])/i.test(after)
      && /\bauthorization object\s+[A-Z]/i.test(before)) return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * After strip: decide whether the spoken answer is still coherent enough to serve,
 * or should fall back to a brief principle-level answer (no invented entities).
 */
function postStripCoherenceCheck(original = "", stripped = "") {
  try {
    const text = String(stripped || "").trim();
    if (!text) {
      return { ok: false, reason: "empty-after-strip", fallback: "principle-level" };
    }
    if (looksIncompleteSpokenAnswer(text)) {
      return { ok: false, reason: "incomplete-after-strip", fallback: "principle-level" };
    }
    const hedgeCount = (text.match(/not confirmed in supporting knowledge/gi) || []).length;
    if (hedgeCount >= 3) {
      return { ok: false, reason: "over-hedged", fallback: "principle-level" };
    }
    const originalWords = String(original || "").trim().split(/\s+/).filter(Boolean).length;
    const strippedWords = text.split(/\s+/).filter(Boolean).length;
    if (originalWords >= 40 && strippedWords < Math.max(12, Math.floor(originalWords * 0.35))) {
      return { ok: false, reason: "over-stripped", fallback: "principle-level" };
    }
    return { ok: true, reason: "coherent", fallback: null, strippedEntitiesHint: hedgeCount };
  } catch {
    return { ok: true, reason: "coherence-check-error-pass", fallback: null };
  }
}

/**
 * True when the interviewer asks for historical / executed transaction usage
 * (workload), not for what is assigned in roles.
 */
function isTransactionUsageHistoryAsk(question = "") {
  const q = String(question || "");
  if (!q.trim()) return false;
  // Role-design / assignment questions that merely mention usage stay out.
  if (/\b(?:assign(?:ed|ment)?|AGR_USERS|authorization\s+object|S_TCODE\s+in\s+the\s+role|role\s+content)\b/i.test(q)
    && !/\b(?:used|executed|usage|workload|ST03N?|STAD|export)\b/i.test(q)) {
    return false;
  }
  return (
    /\b(?:export|list|collect|identify|find|get|show|pull)\b[\s\S]{0,80}\b(?:T-?codes?|transactions?)\b/i.test(q)
    || /\b(?:T-?codes?|transactions?)\b[\s\S]{0,80}\b(?:used|executed|usage|workload)\b/i.test(q)
    || /\b(?:used|executed)\s+by\s+(?:a\s+|the\s+)?user\b/i.test(q)
    || /\buser(?:'s)?\s+(?:historical\s+)?(?:transaction|T-?code)\s+usage\b/i.test(q)
    || /\b(?:ST03N?|STAD)\b[\s\S]{0,60}\b(?:user|usage|export)\b/i.test(q)
  );
}

/**
 * On usage-history asks: remove sentences that present AGR_USERS / AGR_1251 / S_TCODE
 * as investigation evidence for execution. Keep at most one short clarifying sentence
 * that explicitly says those objects are assignment/authorization planes, not execution.
 */
function sanitizeUsageVsAssignmentPlanes(question = "", answer = "") {
  const source = String(answer || "");
  if (!source.trim() || !isTransactionUsageHistoryAsk(question)) {
    return { text: source, changed: false, removed: 0 };
  }
  try {
    const citesAssignmentPlane = (s) => /\bAGR_(?:USERS|1251)\b|\bS_TCODE\b/i.test(s);
    const clarifiesNonExecution = (s) => (
      /not\s+(?:the\s+)?(?:same\s+as\s+)?(?:actual\s+)?(?:execution|usage|workload)\b/i.test(s)
      || /(?:assignment|authorization)\s+(?:data|values|plane|only)\b/i.test(s)
      && /not\s+(?:execution|usage|workload|proof\s+that)/i.test(s)
      || /do\s+not\s+(?:prove|show|provide|represent)\s+(?:execution|usage|that\s+the\s+user\s+(?:ran|used))/i.test(s)
      || /never\s+(?:present|treat|use)\s+.{0,40}\bas\s+(?:execution|usage)/i.test(s)
    );
    const parts = source.split(/(?<=[.!?])\s+/).filter(Boolean);
    const kept = [];
    let clarificationKept = false;
    let removed = 0;
    for (const part of parts) {
      if (!citesAssignmentPlane(part)) {
        kept.push(part);
        continue;
      }
      if (clarifiesNonExecution(part) && !clarificationKept) {
        kept.push(part);
        clarificationKept = true;
        continue;
      }
      removed += 1;
    }
    let text = kept.join(" ").replace(/\s{2,}/g, " ").trim();
    // If the model only named assignment tables and never a workload path, do not invent ST03N here.
    if (!text && source.trim()) {
      return { text: source.trim(), changed: false, removed: 0 };
    }
    return { text, changed: removed > 0 || text !== source.trim(), removed };
  } catch {
    return { text: source, changed: false, removed: 0 };
  }
}

/**
 * Conceptual / definition / comparison asks — not configure/troubleshoot procedures.
 * Used so missing T-codes do not force an identifier-missing fallback.
 */
function isConceptualQuestion(question = "") {
  const q = String(question || "").trim();
  if (!q) return false;
  if (/\b(configur(?:e|ation|ing)|implement(?:ation|ing)?|troubleshoot|diagnos|set\s*up|setup|how\s+do\s+(?:you|i)\s+(?:fix|open|maintain|build)\b)/i.test(q)) {
    return false;
  }
  if (/^(?:what|what's|whats|define|explain|describe)\b/i.test(q)) return true;
  if (/\b(?:difference|versus|\bvs\.?\b|compare|comparison|purpose of|pillars?\b|overview of|meaning of)\b/i.test(q)) {
    return true;
  }
  return false;
}

/**
 * Central vs decentral EAM / Firefighter deployment (and central-GRC failover).
 * Must prefer Q109-class evidence over generic GRAC_SPM day-to-day Firefighter prose.
 */
function isEamCentralDecentralTask(question = "") {
  const q = String(question || "");
  if (!q.trim()) return false;
  const namesEamPlane = /\b(?:eam|firefighter|ff\s*ids?|emergency access)\b/i.test(q);
  const namesDeploy = /\b(?:central(?:ized)?|decentral(?:ized)?)\b/i.test(q);
  const namesFailover = /\b(?:unavailable|offline|outage|failover|down)\b/i.test(q)
    && /\b(?:(?:central\s+)?grc|eam|firefighter|ff\s*ids?)\b/i.test(q);
  return (namesEamPlane && namesDeploy) || namesFailover;
}

/**
 * Build a spoken conceptual answer from SUPPORTING KNOWLEDGE text only.
 * Prefers Interview Summary / short interview-answer sections; never invents inventories.
 * For EAM central/decentral tasks, prefer Q109 deploy/failover prose over GRAC_SPM ops.
 */
function extractConceptualSpokenFromKnowledge(question = "", knowledgeText = "") {
  try {
    const knowledge = String(knowledgeText || "").trim();
    if (!knowledge) return "";
    const q = String(question || "");
    const eamDeployAsk = isEamCentralDecentralTask(q);
    const terms = [...new Set(
      (q.toLowerCase().match(/[a-z0-9][a-z0-9+./-]{2,}/g) || [])
        .filter((t) => !/^(?:what|whats|the|are|and|for|how|does|with|from|into|that|this|about|between)\b/.test(t))
    )];
    const blocks = [];
    let section = "";
    for (const line of knowledge.split(/\n+/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (/^#{1,3}\s+/.test(trimmed)) {
        section = trimmed.replace(/^#{1,3}\s+/, "");
        continue;
      }
      if (/^(?:sources? checked|content verified|source:|references?:)\b/i.test(trimmed)) continue;
      let prefer = /interview summary|second interview answer|^overview$/i.test(section) ? 8 : 1;
      const text = trimmed
        .replace(/^[-*•]\s+/, "")
        .replace(/\*\*(?:Decision|Mechanism|Governance|Validation)\s*:\s*\*\*/gi, "")
        .replace(/\*\*/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (text.length < 60 || text.length > 700) continue;
      if (text.endsWith("?")) continue;
      const lower = text.toLowerCase();
      const hits = terms.reduce((n, term) => n + (lower.includes(term) ? 1 : 0), 0);
      // Short supporting snippets for conceptual asks may not repeat the query acronym
      // (e.g. "SoD" vs "segregation of duties") — still keep substantive definition prose.
      if (hits === 0 && prefer < 8 && knowledge.length > 900 && !eamDeployAsk) continue;
      if (eamDeployAsk) {
        if (/central(?:ized)?\s+eam|decentral(?:ized)?\s+eam|grc hub|local eam components|grac_spm_log_sync|failover/i.test(lower)
          || /central vs\.?\s*decentralized emergency access|q109/i.test(section)) {
          prefer += 24;
        }
        if (/grac_spm|support engineer sees the firefighter|id versus role-based firefighter|30 second interview|60 second interview|90 second interview/i.test(lower)
          || /\d+\s+second interview answer|red flags|what makes this a 10\/10/i.test(section)) {
          prefer -= 18;
        }
        if (/repository sync|connector groups?/i.test(lower) && !/firefighter|eam|failover|hub/i.test(lower)) {
          prefer -= 12;
        }
      }
      if (hits === 0 && prefer < 8 && knowledge.length > 900) continue;
      blocks.push({ text, score: hits * 3 + prefer + (knowledge.length <= 900 ? 2 : 0), section });
    }
    blocks.sort((a, b) => b.score - a.score);
    const chosen = [];
    const seen = new Set();
    const wordTarget = eamDeployAsk ? 140 : 90;
    for (const block of blocks) {
      const key = block.text.slice(0, 80).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      chosen.push(block.text);
      if (chosen.join(" ").split(/\s+/).length >= wordTarget) break;
      if (chosen.length >= (eamDeployAsk ? 3 : 2)) break;
    }
    if (!chosen.length) return "";
    let spoken = chosen.join(" ").replace(/\s+/g, " ").trim();
    spoken = flattenDmgvTemplateToProse(spoken);
    if (!/[.!?]$/.test(spoken)) spoken = `${spoken}.`;
    // Enumeration asks without a dated inventory in knowledge: keep conceptual framing,
    // do not invent a fixed member list. BTP *security* pillar asks are control-plane asks —
    // do not append marketing-inventory caution when security primitives are already present.
    const asksSecurityPillars = /\bpillars?\b/i.test(q) && /\bsecurity\b/i.test(q);
    const hasSecurityPrimitives = /\b(?:role collection|XSUAA|subaccount|Cloud Connector|Identity Authentication|IAS)\b/i.test(spoken);
    if (/\bpillars?\b|\bcategories\b|\bcomponents of\b/i.test(q)
      && !/\bpillar(?:s)?\b/i.test(knowledge)
      && !(asksSecurityPillars && hasSecurityPrimitives)) {
      spoken += " I would not recite a fixed marketing inventory unless a dated SAP source for that framing is in the supporting material; I keep the answer on the platform structure and security model that the knowledge actually supports.";
    }
    return spoken;
  } catch {
    return "";
  }
}

/**
 * Detect meta-refusal / guardrail leakage that must never be shown as an interview answer.
 */
function isMetaRefusalText(text = "") {
  const value = String(text || "");
  return /I would answer this at principle level because/i.test(value)
    || /identifiers are not confirmed in supporting knowledge for this turn/i.test(value)
    || /while the live path recovers/i.test(value)
    || /\bfor:\s*(?:what|how|why)\b/i.test(value)
    || /answer at principle level\s*[—-]\s*briefly and openly/i.test(value)
    // Integrity-contract planning / system-leak openers (candidate UI must never show these).
    || /\bI treat this as a (?:conceptual|platform|technical|configuration)\b/i.test(value)
    || /\bI will answer using the following framework\b/i.test(value)
    || /\bI am using the knowledge base\b/i.test(value)
    || /\bThe system should\b/i.test(value)
    || /^\s*Expected answer\s*:/i.test(value)
    || /^\s*Grading\s*:/i.test(value)
    // Inability / gap lines must not block procedure recovery as "validated" answers.
    || /I do not have a reliable technical (?:answer|procedure|definition) I can defend/i.test(value)
    || /I would rather qualify the gap/i.test(value);
}

/**
 * Last-resort spoken recovery content (emergency ladder only).
 * Must read as a real interview answer — never a meta-refusal or prompt echo.
 */
function buildPrincipleLevelFallback(question) {
  // NUCLEAR: never emit canned principle/hedge recovery text.
  void question;
  return "";
}

/**
 * Fix 2 — Safe empty-answer recovery decision (centralized).
 *
 * A) Keep a complete, non-meta filtered answer.
 * B) Same-turn qualifying procedure (task/edition eligible) — never auto-VERIFIED.
 * C) Never restore raw pre-strip text that still carries unsupported identifiers.
 * D) Non-meta principle recovery when nothing safer is available — never blank success.
 *
 * Returns answerKind for session/UI: validated | recovered_procedure | recovered_local_kb |
 * recovered_prestrip_validated | recovered_principle | recovered_hardcoded.
 */
function procedureEligibleForRecovery(question = "", procedureText = "") {
  const text = String(procedureText || "").trim();
  if (!text || text.length < 40) {
    return { ok: false, reason: "missing-or-short" };
  }
  if (isMetaRefusalText(text) || looksIncompleteSpokenAnswer(text)) {
    return { ok: false, reason: "meta-or-incomplete" };
  }
  try {
    // Soft dependency: recovery must not crash if procedureRetention fails to load.
    const {
      procedureTaskFit,
      procedureEditionAligned
    } = require("./procedureRetention.js");
    const fit = procedureTaskFit(question, text);
    if (!fit?.ok) {
      return { ok: false, reason: fit?.reason || "task-fit-reject" };
    }
    const edition = procedureEditionAligned(question, text);
    if (edition && edition.aligned === false) {
      return { ok: false, reason: edition.reason || "edition-mismatch" };
    }
  } catch {
    return { ok: false, reason: "eligibility-unavailable" };
  }
  return { ok: true, reason: "ok" };
}

function recoverNonEmptySpokenAnswer({
  question = "",
  spoken = "",
  beforeStrip = "",
  procedureSpoken = "",
  localKnowledgeAnswer = "",
  knowledgeText = ""
} = {}) {
  const usable = (text) => {
    const value = String(text || "").trim();
    if (!value || value.length < 40) return "";
    if (isMetaRefusalText(value)) return "";
    return value;
  };

  const pack = ({
    answer,
    recovered,
    flag,
    answerKind,
    rejectedProcedureReason = null,
    rejectedPreStripReason = null
  }) => ({
    answer: String(answer || "").trim(),
    recovered: Boolean(recovered),
    flag: flag || null,
    answerKind: answerKind || (recovered ? "recovered_principle" : "validated"),
    routeHint: answerKind === "recovered_procedure" ? "RETRIEVED_PROCEDURE" : null,
    rejectedProcedureReason,
    rejectedPreStripReason
  });

  const current = usable(spoken);
  if (current && !looksIncompleteSpokenAnswer(current)) {
    const stillUngrounded = findUngroundedTransactionClaims(current, knowledgeText || "");
    if (!stillUngrounded.length) {
      return pack({
        answer: current,
        recovered: false,
        flag: null,
        answerKind: "validated"
      });
    }
    // Filtered text still claims unsupported codes — treat as unusable.
  }

  let rejectedProcedureReason = null;
  const experienceAsk = /\b(?:have you|did you|your experience|tell me about (?:a time|your)|walk me through a time|describe a (?:time|project) when)\b/i
    .test(String(question || ""));
  const procedureRaw = String(procedureSpoken || "").trim();
  if (procedureRaw && !experienceAsk) {
    const eligibility = procedureEligibleForRecovery(question, procedureRaw);
    if (eligibility.ok) {
      const procedure = usable(procedureRaw);
      if (procedure) {
        return pack({
          answer: procedure,
          recovered: true,
          flag: "empty_fallback_procedure",
          answerKind: "recovered_procedure"
        });
      }
    } else {
      rejectedProcedureReason = eligibility.reason;
    }
  }

  // Experience asks must not be filled with product procedure / Activate checklists from local KB.
  const localRaw = experienceAsk ? "" : String(localKnowledgeAnswer || "").trim();
  if (localRaw) {
    const localClean = stripUngroundedSapEntities(localRaw, knowledgeText || localRaw);
    const local = usable(localClean);
    if (local && !looksIncompleteSpokenAnswer(local) && !isMetaRefusalText(local)) {
      const localUngrounded = findUngroundedTransactionClaims(local, knowledgeText || localRaw);
      if (!localUngrounded.length) {
        return pack({
          answer: local,
          recovered: true,
          flag: "empty_fallback_local_kb",
          answerKind: "recovered_local_kb",
          rejectedProcedureReason
        });
      }
    }
  }

  // C — never restore raw pre-strip merely because filtering emptied the answer.
  let rejectedPreStripReason = null;
  const priorRaw = String(beforeStrip || "").trim();
  if (priorRaw) {
    const priorUngrounded = findUngroundedTransactionClaims(priorRaw, knowledgeText || "");
    if (priorUngrounded.length) {
      rejectedPreStripReason = `ungrounded:${priorUngrounded.join(",")}`;
    } else {
      const revalidated = stripUngroundedSapEntities(priorRaw, knowledgeText || "");
      const prior = usable(revalidated);
      const coherence = postStripCoherenceCheck(priorRaw, revalidated);
      if (
        prior
        && !looksIncompleteSpokenAnswer(prior)
        && coherence.ok
        && !findUngroundedTransactionClaims(prior, knowledgeText || "").length
      ) {
        return pack({
          answer: prior,
          recovered: true,
          flag: "empty_fallback_pre_strip_validated",
          answerKind: "recovered_prestrip_validated",
          rejectedProcedureReason,
          rejectedPreStripReason
        });
      }
      rejectedPreStripReason = rejectedPreStripReason || coherence.reason || "pre-strip-unusable";
    }
  }

  // NUCLEAR: never replace LLM output with principle/hardcoded canned text.
  void buildPrincipleLevelFallback;
  return pack({
    answer: "",
    recovered: false,
    flag: "empty_no_canned_fallback",
    answerKind: "validated",
    rejectedProcedureReason,
    rejectedPreStripReason
  });
}

/**
 * Strip knowledge-bank question numbers / test-suite labels from headings or spoken text.
 * Example: "Q5: How do you integrate Fiori SSO..." → "How do you integrate Fiori SSO..."
 */
function stripBankQuestionLabels(text = "") {
  return String(text || "")
    // Remove interview-bank question headings entirely (not merely the Qn: label).
    .replace(/(?:^|\n)\s*#{1,6}\s*Q\d+\s*:\s*[^\n]+/gi, "\n")
    .replace(/(?:^|\n)\s*Q\d+\s*:\s*[^\n]+/gi, "\n")
    .replace(/\bQ\d+\s*:\s*/gi, "")
    // Validation / coaching lines from interview banks are evaluation metadata, not spoken answers.
    .replace(/(?:^|\n)\s*Validate\b[^\n]*/gi, "\n")
    .replace(/(?:^|\n)\s*(?:Red flags?|Hidden expectations?|Keywords?|Interviewer expectations?|Tough follow[- ]?ups?)\s*:?[^\n]*/gi, "\n")
    // Full meta sentences that echo bank headings / test harness language.
    .replace(/\bI would treat\b[^.!?\n]*\bgoverning design boundary\b[^.!?\n]*[.!?]?/gi, "")
    .replace(/\bI would treat\s+(?:Q\d+\b|(?:How|What|Why|When|Where)\b)[^.!?\n]*[.!?]?/gi, "")
    .replace(/\bas the governing design boundary for this ask\b[^.!?]*[.!?]?/gi, "")
    .replace(/\b(?:unit[- ]?test|test[- ]?suite|assertion|eval assert)\b[^.!?\n]*/gi, "")
    .replace(/\b(?:RULE|Rule)\s*[1-9]\d?\b(?:\s*[—:\-–]\s*[^\n]*)?/gi, "")
    .replace(/\b(?:interviewPrompt|turnDecision|intentRouter|generationGuard|verifiedWorkflow)\.js\b/gi, "")
    // Spoken answers must not restate interviewer questions that leaked from bank headings.
    .replace(/\bExplain the architecture of Mitigating Controls in GRC ARA and how they affect risk scoring\.?/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Flatten banned Decision/Mechanism/Governance/Validation template headings into
 * continuous spoken prose. Preserves STAR (Situation/Task/Action/Result) bullets.
 */
function flattenDmgvTemplateToProse(text = "") {
  let out = String(text || "");
  if (!out) return out;
  const hasDmgv =
    /(?:^|\n)\s*[-*•]?\s*(?:\*\*\s*)?(?:Decision|Mechanism|Governance|Validation)\s*:/im.test(out)
    || /\*\*\s*(?:Decision|Mechanism|Governance|Validation)\s*:\s*\*\*/i.test(out);
  if (!hasDmgv) return out;
  out = out
    .replace(/(?:^|\n)\s*[-*•]\s*\*\*\s*(?:Decision|Mechanism|Governance|Validation)\s*:\s*\*\*\s*/gi, "\n")
    .replace(/(?:^|\n)\s*\*\*\s*(?:Decision|Mechanism|Governance|Validation)\s*:\s*\*\*\s*/gi, "\n")
    .replace(/(?:^|\n)\s*[-*•]\s*(?:Decision|Mechanism|Governance|Validation)\s*:\s*/gi, "\n")
    .replace(/(?:^|\n)\s*(?:Decision|Mechanism|Governance|Validation)\s*:\s*/gi, "\n")
    .replace(/\*\*\s*(?:Decision|Mechanism|Governance|Validation)\s*:\s*\*\*\s*/gi, " ");
  // Collapse template line-breaks into fluent paragraph flow.
  out = out
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return out;
}

/**
 * Strip coach/rubric meta-talk so the UI only ever shows candidate spoken language.
 * Defense-in-depth for residual "average answer / 10/10 answer" frames after generation.
 */
function stripMetaEvaluationFraming(text = "") {
  let out = String(text || "");
  if (!out) return out;
  try {
    // Zero-preamble coaching fillers at the start of the answer.
    out = out
      .replace(/^\s*(?:Sure[,!]?\s+)?(?:I (?:can|would) (?:help(?: you)?(?: with that)?|explain(?: that| this)?))[,.]?\s*/i, "")
      .replace(/^\s*(?:That(?:'s| is)|This is) a (?:great|good|excellent) question[,.]?\s*/i, "")
      .replace(/^\s*(?:Great|Good|Excellent) question[,.]?\s*/i, "")
      .replace(/^\s*(?:Here(?:'s| is) (?:an? )?evaluation|Here is the (?:answer|evaluation))\b[,.:]?\s*/i, "")
      .replace(/^\s*(?:Here(?:'s| is) a draft)\b[,.:]?\s*/i, "")
      .replace(/^\s*To approach this (?:configuration|setup|design|architecture|problem|issue)\b[,.:]?\s*/i, "");
    // Rubric / score / coach frames (opening or mid-answer sentences).
    const metaSentence = [
      /\bAn average answer\b[^.!?\n]*[.!?…]?\s*/gi,
      /\bAverage answer\s*:\s*[^.!?\n]*[.!?…]?\s*/gi,
      /\bA(?:n)?\s*10\s*\/\s*10\s+answer\b[^.!?\n]*[.!?…]?\s*/gi,
      /\bWhat makes (?:this|that|it) a\s*10\s*\/\s*10\s+answer\b[^.!?\n]*[.!?…]?\s*/gi,
      /\bIn a senior(?:\s+architect)?\s+answer\b[^.!?\n]*[.!?…]?\s*/gi,
      /\bTo score full points\b[^.!?\n]*[.!?…]?\s*/gi,
      /\bAccording to the framework\b[^.!?\n]*[.!?…]?\s*/gi,
      /\bA (?:strong|good|better|ideal|perfect|complete) answer (?:would|describes|explains|covers|includes)\b[^.!?\n]*[.!?…]?\s*/gi,
      /\b(?:Here is|Here's) (?:how|what) (?:a|an) (?:10\s*\/\s*10|strong|ideal) answer\b[^.!?\n]*[.!?…]?\s*/gi,
      /\b(?:Here is|Here's) an? evaluation\b[^.!?\n]*[.!?…]?\s*/gi,
      /\bTo approach this (?:configuration|setup|design|architecture|problem|issue)\b[^.!?\n]*[.!?…]?\s*/gi,
      // Integrity-contract planning leaks (semantic — strip the planning sentence, keep technical prose).
      /\bI treat this as a (?:conceptual|platform|technical|configuration)[^.!?\n]*[.!?…]?\s*/gi,
      /\bI will answer using the following framework\b[^.!?\n]*[.!?…]?\s*/gi,
      /\bI am using the knowledge base\b[^.!?\n]*[.!?…]?\s*/gi,
      /\bThe system should\b[^.!?\n]*[.!?…]?\s*/gi,
      /\bI outline the governing architecture\b[^.!?\n]*[.!?…]?\s*/gi,
      /\bI keep the answer on the platform structure\b[^.!?\n]*[.!?…]?\s*/gi
    ];
    for (const re of metaSentence) out = out.replace(re, "");
    // Heading-style leaks from knowledge bank score sections / system instruction echoes.
    out = out
      .replace(/(?:^|\n)\s*#{0,6}\s*What Makes This a\s*10\s*\/\s*10\s+Answer\s*:?\s*/gi, "\n")
      .replace(/(?:^|\n)\s*#{0,6}\s*(?:Average|Strong|Ideal)\s+Answer\s*:?\s*/gi, "\n")
      .replace(/(?:^|\n)\s*#{0,6}\s*Product boundaries\s*:?\s*/gi, "\n")
      .replace(/(?:^|\n)\s*#{0,6}\s*Anti-surface rule\s*:?\s*/gi, "\n")
      .replace(/(?:^|\n)\s*#{0,6}\s*(?:Grade|Evaluation|Scope|Grading|Expected answer)\s*:?\s*/gi, "\n")
      .replace(/(?:^|\n)\s*#{0,6}\s*Executive Architectural Summary\s*:?\s*/gi, "\n")
      .replace(/(?:^|\n)\s*#{0,6}\s*Strategic Executive Summary\s*:?\s*/gi, "\n")
      .replace(/(?:^|\n)\s*#{0,6}\s*Systemic Triage(?:\s*&\s*Sequence)?\s*:?\s*/gi, "\n")
      .replace(/(?:^|\n)\s*#{0,6}\s*Domain Triage(?:\s*&\s*Sequence)?\s*:?\s*/gi, "\n")
      .replace(/(?:^|\n)\s*#{0,6}\s*(?:Draft|Internal)(?:\s+notes?)?\s*:?\s*/gi, "\n")
      .replace(/^\s*(?:Here(?:'s| is) a draft)\b[,.:]?\s*/i, "")
      .replace(/\bProduct boundaries\s*:\s*/gi, "")
      .replace(/\bAnti-surface rule\s*:\s*/gi, "")
      .replace(/\b(?:Grade|Evaluation|Scope|Grading|Expected answer)\s*:\s*/gi, "")
      .replace(/\bStrategic Executive Summary\s*:\s*/gi, "")
      .replace(/\bSystemic Triage(?:\s*&\s*Sequence)?\s*:\s*/gi, "");
    // Soften residual generic tool hedges without inventing technical content.
    out = out
      .replace(/\bchecking the tables\b/gi, "checking the relevant authorization tables")
      .replace(/\busing system tools\b/gi, "using the plane-correct SAP tools");
    return out.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/ {2,}/g, " ").trim();
  } catch {
    return String(text || "").trim();
  }
}

/**
 * Rule 1 defense-in-depth: strip internal prompt/debug echoes that must never reach the UI.
 * Operates on spoken answer text only — does not invent content.
 * Non-bypassable post-generation interceptor used by chat.js finalizeSpokenAnswer / SSE writers.
 */
function sanitizeSpokenAnswer(text = "") {
  let out = String(text || "");
  if (!out) return out;
  try {
    const leakBlocks = [
      /(?:^|\n)\s*LOW-RELEVANCE RETRIEVAL FALLBACK[\s\S]*?(?=\n\s*\*\s*\*\*|$)/gi,
      /(?:^|\n)\s*INTERNAL RETRIEVAL NOTE[\s\S]*?(?=\n\s*\*\s*\*\*|$)/gi,
      /(?:^|\n)\s*INTERNAL BEHAVIORAL STAR MODE[\s\S]*?(?=\n\s*\*\s*\*\*|$)/gi,
      /(?:^|\n)\s*BEHAVIORAL STAR MODE\b[\s\S]*?(?=\n\s*\*\s*\*\*|$)/gi,
      /(?:^|\n)\s*SUPPORTING KNOWLEDGE\b[\s\S]*?(?=\n\s*\*\s*\*\*|$)/gi,
      /(?:^|\n)\s*INTERNAL PRODUCT COMPARISON MODE\b[\s\S]*?(?=\n\s*\*\s*\*\*|$)/gi,
      /(?:^|\n)\s*NON-NEGOTIABLE SYSTEM RULES\b[\s\S]*?(?=\n\s*\*\s*\*\*|$)/gi
    ];
    for (const re of leakBlocks) out = out.replace(re, "\n");
    out = out
      .replace(/\bLOW-RELEVANCE RETRIEVAL FALLBACK\b[:\s-]*/gi, "")
      .replace(/\bINTERNAL RETRIEVAL NOTE\b[:\s-]*/gi, "")
      .replace(/\bno high-confidence (?:knowledge )?chunk matched\b[^.]*\.?/gi, "")
      .replace(/\bvector similarity score\b[^.]*\.?/gi, "")
      .replace(/\bconfidence score\s*[:=]?\s*0?\.\d+\b/gi, "")
      .replace(/If the server is on premise,\s*I would follow the ABAP Fiori path[^.]*\./gi, "")
      // Conceptual analogy ban (must never reach live interview UI)
      .replace(/\bSecurity builds the doors[^.!?\n]*[.!?]?/gi, "")
      .replace(/\bGRC governs the keys[^.!?\n]*[.!?]?/gi, "")
      .replace(/\bdoors?\b[^.!?\n]{0,40}\bkeys?\b[^.!?\n]*[.!?]?/gi, "")
      .replace(/\bthink of (?:it|them) like\b[^.!?\n]*[.!?]?/gi, "")
      // Weak / evasive executive hedges (must never reach live interview UI)
      .replace(/\bI would not claim that as a completed implementation\b[^.!?\n]*[.!?]?/gi, "")
      .replace(/\bAs an AI\b[^.!?\n]*[.!?]?/gi, "")
      .replace(/\bGenerally speaking,?\s*/gi, "")
      .replace(/\*?\s*\*\*Clarification Required:\*\*[^\n]*/gi, "")
      .replace(/\bCould you please clarify\b[^.!?\n]*[.!?]?/gi, "")
      .replace(/\bCould you please (?:repeat|rephrase)\b[^.!?\n]*[.!?]?/gi, "")
      .replace(/\bDo you mean\b[^.!?\n]*[.!?]?/gi, "")
      // Prompt-template / fragment prefixes
      .replace(/(?:^|\n)\s*(?:FINAL OUTPUT|ANSWER SCOPE|CANDIDATE BACKGROUND|EXPERIENCE GROUNDING)\b[^\n]*/gi, "\n")
      .replace(/\bTCODE_VERIFICATION_RULE\b/gi, "")
      // Retrieval provenance labels must never reach spoken output.
      .replace(/(?:^|\n)\s*#{0,6}\s*SOURCE:\s*[^\n|]{1,120}\s*\|\s*SECTION:\s*[^\n]*/gi, "\n")
      .replace(/\bSOURCE:\s*[\w./-]+\s*\|\s*SECTION:\s*[^\n]+/gi, "")
      .replace(/(?:^|\n)\s*#{1,6}\s*Related Topics\b[\s\S]*?(?=(?:\n\s*#{1,6}\s+)|\s*$)/gi, "\n");
    // Meta-evaluation / grading-rubric frames — never reach the live interview UI.
    out = stripMetaEvaluationFraming(out);
    out = stripBankQuestionLabels(out);
    out = flattenDmgvTemplateToProse(out);
    // Soften residual index-card / procedural-manual openers without inventing technical content.
    out = out
      .replace(/\bLead with this architecture matrix[^.!?\n]*[.!?…]?\s*/gi, "")
      .replace(/^\s*Lead diagnostics with\s+/i, "When I troubleshoot this, I typically start with ")
      .replace(/^\s*Lead with\s+/i, "I typically start with ")
      .replace(/\bIn Role Designer,\s*Business Roles,\s*create or maintain\b/gi, "In Role Designer under Business Roles I build")
      .replace(/\bThe administrator must\b/gi, "I always")
      .replace(/^\s*Create or maintain\b/i, "I build");
    out = out
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch {
    return String(text || "").trim();
  }
  return out;
}

/**
 * STAR safety net: strip employer/client brands when the interviewer did not ask for them.
 * Keeps CV metrics and technical artifacts; replaces named employers with anonymized programme phrasing.
 */
function anonymizeStarEmployers(text = "") {
  let out = String(text || "");
  if (!out) return out;
  try {
    out = out
      .replace(/\bDover Corporation(?:\s+via\s+Ascent Staffing)?\b/gi, "an enterprise S/4HANA transformation")
      .replace(/\bEminnov Technologies\b/gi, "a GRC 12.0 S/4 conversion programme")
      .replace(/\bFabtech International\b/gi, "an upgrade-support GRC programme")
      .replace(/\bEnerlife(?:\s*\/\s*Nabati Group)?\b/gi, "an ECC manufacturing rollout")
      .replace(/\bNabati Group\b/gi, "an ECC manufacturing rollout")
      .replace(/\bWMS Middle East\b/gi, "an enterprise support organisation")
      .replace(/\bAscent Staffing\b/gi, "the delivery partner")
      .replace(/\b(?:at|for|with|during(?:\s+the)?|on(?:\s+the)?)\s+Dover\b/gi, "during an enterprise S/4HANA go-live")
      .replace(/\bDover\b/gi, "the enterprise programme")
      .replace(/\bEminnov\b/gi, "the conversion programme")
      .replace(/\bFabtech\b/gi, "the upgrade programme")
      .replace(/\bEnerlife\b/gi, "the ECC programme")
      .replace(/\b\d{1,2}\/\d{4}\s*[–-]\s*\d{1,2}\/\d{4}\b/g, "")
      .replace(/\$\s?\d[\d,]*(?:\.\d+)?\s*(?:million|billion|k|m|b)?\b/gi, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/ {2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch {
    return String(text || "").trim();
  }
  return out;
}

module.exports = {
  classifyGenerationFailure,
  publicLlmError,
  isIncompleteGeneration,
  looksIncompleteSpokenAnswer,
  extractClaimedTransactions,
  findUngroundedTransactionClaims,
  buildEntityAllowlistFromKnowledge,
  stripUngroundedSapEntities,
  isDestructiveEntityStripResult,
  postStripCoherenceCheck,
  isTransactionUsageHistoryAsk,
  sanitizeUsageVsAssignmentPlanes,
  buildPrincipleLevelFallback,
  recoverNonEmptySpokenAnswer,
  procedureEligibleForRecovery,
  isMetaRefusalText,
  isConceptualQuestion,
  isEamCentralDecentralTask,
  extractConceptualSpokenFromKnowledge,
  loadVerifiedEntityRegistry,
  isVerifiedEntity,
  normalizeSapToken,
  sanitizeSpokenAnswer,
  stripMetaEvaluationFraming,
  flattenDmgvTemplateToProse,
  stripBankQuestionLabels,
  anonymizeStarEmployers
};
