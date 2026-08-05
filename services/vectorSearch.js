const { getApplicationContainer } = require("../lib/container");

const DOMAIN_BOOST_MAP = Object.freeze({
  "SAP Security": ["pfcg", "su24", "su25", "su53", "st01", "stauthtrace", "authorization", "role", "usobt_c", "usobx_c"],
  "SAP GRC": ["grc", "ara", "arm", "eam", "brm", "firefighter", "msmp", "brf", "grac", "risk", "rulebook"],
  "SAP Cloud Identity": ["ias", "ips", "iag", "saml", "oidc", "oauth", "scim", "tenant", "idp"],
  "SAP BTP Security": ["btp", "cloud connector", "principal propagation", "subaccount", "destination", "mtls", "x.509"],
  "SAP Fiori Security": ["fiori", "launchpad", "catalog", "group", "space", "page", "odata", "iwfnd", "iwmnd"],
  "SAP IDM": ["idm", "identity center", "vds", "pass-vector", "repository"]
});

const SAP_ARTIFACT_REGEX = /\b(grac_[a-z0-9_]+|agr_[a-z0-9_]+|usr[0-9]{2}|ust[0-9]{2}|pfcg|su24|su25|su53|st01|stauthtrace|st22|slg1|sm37|sm21|se16|se16n|se11)\b/i;

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

function computeDomainBoost(domain, contentNorm) {
  if (!domain || !DOMAIN_BOOST_MAP[domain] || !contentNorm) return 0;
  const keywords = DOMAIN_BOOST_MAP[domain];
  let hits = 0;
  for (let i = 0; i < keywords.length; i++) {
    if (contentNorm.includes(keywords[i])) {
      hits++;
    }
  }
  return Math.min(0.15, hits * 0.03);
}

function computeArtifactBoost(content) {
  if (!content || typeof content !== "string") return 0;
  return SAP_ARTIFACT_REGEX.test(content) ? 0.08 : 0;
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

      const scored = rawChunks.map((chunk) => {
        const content = chunk.content || chunk.text || "";
        const contentNorm = normalizeText(content);

        const semanticScore = typeof chunk.semanticScore === "number"
          ? chunk.semanticScore
          : (typeof chunk.score === "number" ? chunk.score : 0.5);

        const keywordScore = computeKeywordOverlap(queryNorm, contentNorm);
        const domainBoost = computeDomainBoost(domain, contentNorm);
        const artifactBoost = computeArtifactBoost(content);
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
  deduplicateAndDiversify
};