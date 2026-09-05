const { getApplicationContainer } = require("../lib/container");

const DOMAIN_BOOST_MAP = Object.freeze({
  "SAP Security": ["pfcg", "su24", "su25", "su53", "st01", "stauthtrace", "authorization", "role", "usobt_c", "usobx_c"],
  "SAP GRC": ["grc", "ara", "arm", "eam", "brm", "firefighter", "msmp", "brf", "grac", "risk", "rulebook"],
  "SAP Cloud Identity": ["ias", "ips", "iag", "saml", "oidc", "oauth", "scim", "tenant", "idp"],
  "SAP BTP Security": ["btp", "cloud connector", "principal propagation", "subaccount", "destination", "mtls", "x.509"],
  // interviewAnalyzer.js's DOMAIN_PATTERNS emits the combined string "SAP Cloud Identity / BTP"
  // for IAS/IPS/IAG/BTP questions -- that string matched neither of the two keys above, so
  // every question in this domain got zero domain boost during retrieval scoring. Merging
  // both keyword sets under the exact string the analyzer actually produces.
  "SAP Cloud Identity / BTP": ["ias", "ips", "iag", "saml", "oidc", "oauth", "scim", "tenant", "idp", "btp", "cloud connector", "principal propagation", "subaccount", "destination", "mtls", "x.509"],
  "SAP Fiori Security": ["fiori", "launchpad", "catalog", "group", "space", "page", "odata", "iwfnd", "iwmnd"],
  "SAP IDM": ["idm", "identity center", "vds", "pass-vector", "repository"],
  // "SAP Platform" (interviewAnalyzer.js) covers S/4HANA, ECC, HANA, ABAP, BW, SuccessFactors,
  // Netweaver, Sybase, MaxDB questions and had no boost entry at all -- same zero-boost gap.
  "SAP Platform": ["s/4hana", "s4hana", "ecc", "hana", "universal journal", "new gl", "analytic privilege", "bw", "bw/4hana", "netweaver", "abap", "hdi container", "catalog role", "repository role"],
  // SAC/PMP had no domain boost entry before this -- confirmed by direct trace that SAC content
  // lost to IAS/IAG content purely on missing domain credit despite a better semantic score.
  "SAC": ["sac", "story", "model", "digest", "team", "folder", "analytics cloud"],
  "PMP": ["stakeholder", "risk register", "raid", "steering committee", "change control", "scope", "schedule", "governance", "vendor", "wbs", "milestone"]
});

// Split from one flat SAP_ARTIFACT_REGEX into two family-specific patterns: adversarial testing
// (Test 8, "HANA catalog role vs repository role") confirmed a generic access-review chunk
// containing "PFCG" out-ranked real, indexed, exact-match HANA content purely because ANY
// PFCG/SU24/USRxx mention got a flat +0.08 boost regardless of the actual query's product. The
// fix is not to delete the boost -- it's real signal for ABAP-family questions -- but to gate
// it on the classified category, so a cloud/HANA/Datasphere question never rewards ABAP-table
// jargon just because a candidate chunk happens to contain it.
const ABAP_ARTIFACT_REGEX = /\b(agr_[a-z0-9_]+|usr[0-9]{2}|ust[0-9]{2}|pfcg|su24|su25|su53|st01|stauthtrace|st22|slg1|sm37|sm21|se16|se16n|se11)\b/i;
const GRC_ARTIFACT_REGEX = /\b(grac_[a-z0-9_]+|msmp|brf\+?)\b/i;

const ABAP_ARTIFACT_ELIGIBLE_CATEGORIES = new Set([
  "S/4", "ECC", "Fiori", "Authorization", "Role Design", "Security", "BW",
  "Troubleshooting", "Upgrade", "Configuration", "Migration", "Transports",
  "Audit", "Production Support", "Performance", "General"
]);
const GRC_ARTIFACT_ELIGIBLE_CATEGORIES = new Set([
  "ARM", "ARA", "EAM", "BRM", "IAG", "Security", "Audit", "Troubleshooting", "General"
]);

// A cloud product in play anywhere (primary OR secondary) means ABAP/GRC-table artifacts are
// noise, not evidence -- even when Troubleshooting won primary category (Test 1: "IAS auth
// succeeds but BTP authorization fails... troubleshoot it" classified primary=Troubleshooting,
// secondary=[BTP,IAS], and a Troubleshooting-eligible ABAP boost would still have rewarded an
// irrelevant PFCG-heavy chunk). This is the smallest safe precedence adjustment available
// without restructuring the category model into separate product/intent dimensions.
const CLOUD_ONLY_CATEGORIES = new Set(["BTP", "IAS", "IPS", "IAG", "HANA", "Datasphere", "RISE", "SAC", "SAP IDM", "PMP"]);

function normalizeText(text) {
  if (!text || typeof text !== "string") return "";
  return text.toLowerCase().replace(/[^\w\s/.-]/g, " ").replace(/\s+/g, " ").trim();
}

function calculateCosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dot / denominator;
}

function computeKeywordOverlap(queryNorm, contentNorm) {
  if (!queryNorm || !contentNorm) return 0;
  const queryTokens = queryNorm.split(" ").filter((t) => t.length > 2);
  if (queryTokens.length === 0) return 0;
  let matches = 0;
  for (let i = 0; i < queryTokens.length; i++) {
    if (contentNorm.includes(queryTokens[i])) {
      matches++;
    }
  }
  return matches / queryTokens.length;
}

// A real architect's reasoning connects adjacent domains (a GRC question naturally touches
// role design and Fiori; an S/4HANA question naturally touches security and BTP). Retrieval
// scoring previously only rewarded exact-domain keyword matches, so adjacent-domain context
// never got a relevance boost even when genuinely relevant. This is a half-weight boost --
// EXPERIMENTAL, see git log for the before/after measurement.
const RELATED_DOMAINS = Object.freeze({
  "SAP Security": ["SAP GRC", "SAP Fiori Security"],
  "SAP GRC": ["SAP Security", "SAP Fiori Security", "SAP IDM"],
  "SAP Cloud Identity": ["SAP BTP Security", "SAP IDM"],
  "SAP BTP Security": ["SAP Cloud Identity", "SAP Fiori Security"],
  "SAP Cloud Identity / BTP": ["SAP Security", "SAP GRC", "SAP IDM"],
  "SAP Fiori Security": ["SAP Security", "SAP BTP Security"],
  "SAP IDM": ["SAP GRC", "SAP Cloud Identity"],
  "SAP Platform": ["SAP Security", "SAP GRC", "SAP Fiori Security"],
  // SAC commonly integrates via IAS/BTP (a "SAC via IAS" question is legitimately cross-product)
  // -- a half-weight related-domain boost lets that context still count without letting it
  // override SAC's own primary content the way it did before SAC had any identity at all.
  // PMP deliberately has no related-domains entry: no SAP-domain relation is appropriate here,
  // and adding one would risk reintroducing the contamination this fix is meant to prevent.
  "SAC": ["SAP Cloud Identity / BTP"]
});

function computeDomainBoost(domain, contentNorm) {
  if (!domain || !contentNorm) return 0;

  const directKeywords = DOMAIN_BOOST_MAP[domain];
  let directHits = 0;
  if (directKeywords) {
    for (let i = 0; i < directKeywords.length; i++) {
      if (contentNorm.includes(directKeywords[i])) directHits++;
    }
  }
  const directBoost = Math.min(0.15, directHits * 0.03);

  const relatedDomains = RELATED_DOMAINS[domain] || [];
  let relatedHits = 0;
  for (const relatedDomain of relatedDomains) {
    const relatedKeywords = DOMAIN_BOOST_MAP[relatedDomain];
    if (!relatedKeywords) continue;
    for (let i = 0; i < relatedKeywords.length; i++) {
      if (contentNorm.includes(relatedKeywords[i])) relatedHits++;
    }
  }
  const relatedBoost = Math.min(0.06, relatedHits * 0.015);

  return Math.min(0.18, directBoost + relatedBoost);
}

function computeArtifactBoost(content, category, secondaryCategories = []) {
  if (!content || typeof content !== "string") return 0;

  const secondaries = Array.isArray(secondaryCategories) ? secondaryCategories : [];
  const hasCloudProductContext = CLOUD_ONLY_CATEGORIES.has(category) || secondaries.some((c) => CLOUD_ONLY_CATEGORIES.has(c));
  if (hasCloudProductContext) return 0;

  let boost = 0;
  if (ABAP_ARTIFACT_REGEX.test(content) && ABAP_ARTIFACT_ELIGIBLE_CATEGORIES.has(category)) {
    boost = Math.max(boost, 0.08);
  }
  if (GRC_ARTIFACT_REGEX.test(content) && GRC_ARTIFACT_ELIGIBLE_CATEGORIES.has(category)) {
    boost = Math.max(boost, 0.08);
  }
  return boost;
}

function computeIntentBoost(intent, contentNorm) {
  if (!intent || !contentNorm) return 0;
  const intentLower = String(intent).toLowerCase();
  if (intentLower.includes("troubleshoot") || intentLower.includes("trace")) {
    if (contentNorm.includes("su53") || contentNorm.includes("st01") || contentNorm.includes("slg1") || contentNorm.includes("st22")) {
      return 0.1;
    }
  } else if (intentLower.includes("workflow") || intentLower.includes("approval")) {
    if (contentNorm.includes("msmp") || contentNorm.includes("brf") || contentNorm.includes("stage")) {
      return 0.1;
    }
  } else if (intentLower.includes("architecture") || intentLower.includes("design")) {
    if (contentNorm.includes("landscape") || contentNorm.includes("connector") || contentNorm.includes("federation")) {
      return 0.08;
    }
  }
  return 0;
}

function deduplicateAndDiversify(scoredChunks, topK) {
  if (!Array.isArray(scoredChunks) || scoredChunks.length === 0) return [];

  const sorted = [...scoredChunks].sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    return (b.semanticScore || 0) - (a.semanticScore || 0);
  });

  const selected = [];
  const seenContents = new Set();
  const docCountMap = new Map();
  const maxPerDoc = Math.max(2, Math.ceil(topK / 3));

  // First pass: select with document diversity limits
  for (let i = 0; i < sorted.length; i++) {
    if (selected.length >= topK) break;
    const item = sorted[i];
    const chunk = item.chunk || item;
    const content = chunk.content || chunk.text || "";
    const snippetKey = content.substring(0, 100).toLowerCase().trim();

    if (seenContents.has(snippetKey)) continue;

    const docId = chunk.documentId || chunk.sourceFile || chunk.fileId || "default_doc";
    const currentDocCount = docCountMap.get(docId) || 0;

    if (currentDocCount >= maxPerDoc && sorted.length > topK * 2) {
      continue;
    }

    seenContents.add(snippetKey);
    docCountMap.set(docId, currentDocCount + 1);

    selected.push({
      ...chunk,
      score: item.finalScore,
      semanticScore: item.semanticScore,
      keywordScore: item.keywordScore,
      confidenceScore: item.confidenceScore
    });
  }

  // Second pass: fill remaining slots if needed (relaxed constraints)
  if (selected.length < topK) {
    for (let i = 0; i < sorted.length; i++) {
      if (selected.length >= topK) break;
      const item = sorted[i];
      const chunk = item.chunk || item;
      const content = chunk.content || chunk.text || "";
      const snippetKey = content.substring(0, 100).toLowerCase().trim();

      if (!seenContents.has(snippetKey)) {
        seenContents.add(snippetKey);
        selected.push({
          ...chunk,
          score: item.finalScore,
          semanticScore: item.semanticScore,
          keywordScore: item.keywordScore,
          confidenceScore: item.confidenceScore
        });
      }
    }
  }

  return selected;
}

async function searchKnowledge(question, analysis = {}, topK = 8, options = {}) {
  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return [];
  }

  const effectiveTopK = typeof topK === "number" && topK > 0 ? Math.min(topK, 50) : 8;
  const container = getApplicationContainer();
  const retrievalService = container?.retrievalService;

  if (retrievalService && typeof retrievalService.retrieve === "function") {
    try {
      const result = await retrievalService.retrieve({
        question,
        analysis,
        topK: effectiveTopK * 2,
        metadataFilters: options.metadataFilters
      });

      const rawChunks = result?.chunks || [];
      if (!Array.isArray(rawChunks) || rawChunks.length === 0) {
        return [];
      }

      const queryNorm = normalizeText(question);
      const domain = analysis?.domain || "";
      const intent = analysis?.primaryIntent || analysis?.intent || "";
      const category = analysis?.category || "";
      const secondaryCategories = analysis?.secondaryCategories || [];

      const scored = rawChunks.map((chunk) => {
        const content = chunk.content || chunk.text || "";
        const contentNorm = normalizeText(content);

        const semanticScore = typeof chunk.semanticScore === "number"
          ? chunk.semanticScore
          : (typeof chunk.score === "number" ? chunk.score : 0.5);

        const keywordScore = computeKeywordOverlap(queryNorm, contentNorm);
        const domainBoost = computeDomainBoost(domain, contentNorm);
        const artifactBoost = computeArtifactBoost(content, category, secondaryCategories);
        const intentBoost = computeIntentBoost(intent, contentNorm);

        const finalScore = Math.min(
          1.0,
          semanticScore * 0.55 +
          keywordScore * 0.20 +
          domainBoost +
          artifactBoost +
          intentBoost
        );

        const confidenceScore = Math.min(1.0, finalScore * 1.1);

        return {
          chunk,
          semanticScore,
          keywordScore,
          finalScore,
          confidenceScore
        };
      });

      const minThreshold = options.similarityThreshold ?? 0.15;
      const filtered = scored.filter((s) => s.finalScore >= minThreshold);
      const candidatesToRank = filtered.length > 0 ? filtered : scored;

      return deduplicateAndDiversify(candidatesToRank, effectiveTopK);
    } catch (err) {
      if (container?.logger && typeof container.logger.error === "function") {
        container.logger.error("vectorSearch.searchKnowledge.error", { error: err.message, question });
      }
    }
  }

  return [];
}

module.exports = {
  searchKnowledge,
  calculateCosineSimilarity,
  deduplicateAndDiversify,
  // Exported for lib/engineeringMemory/retrieval.js to reuse the exact same scoring formula
  // (docs/EXPERIENCE_ACQUISITION_ENGINE_DESIGN.md section 5.4) rather than duplicating it --
  // additive export only, no behavior change to this module.
  normalizeText,
  computeKeywordOverlap,
  computeDomainBoost,
  computeArtifactBoost,
  computeIntentBoost
};