const fs = require("fs/promises");

const {
EvidenceSetSchema,
ExpandedQuerySchema,
QuerySchema,
RankedChunkSchema,
RetrievalBenchmarkSchema,
RetrievalDiagnosticsSchema,
RetrievalResultSchema,
RetrievedChunkSchema
} = require("../models/contracts");
const appConfig = require("../config/appConfig");
const { logger: defaultLogger } = require("../lib/logger");

const RETRIEVAL_PROVIDER_TYPES = Object.freeze({
LOCAL_KNOWLEDGE_INDEX: "local-knowledge-index",
QDRANT: "qdrant",
AZURE_AI_SEARCH: "azure-ai-search",
ELASTIC: "elastic"
});

const COMPONENT_KEYWORDS = Object.freeze({
"SAP GRC": ["ara", "arm", "eam", "firefighter", "risk", "brm", "msmp", "brf"],
"SAP Security": ["pfcg", "su24", "su25", "su53", "st01", "authorization", "role", "usobt_c", "usobx_c"],
"SAP Cloud Identity": ["ias", "ips", "iag", "saml", "oauth", "oidc", "scim", "tenant"],
"SAP Fiori Security": ["catalog", "group", "space", "page", "odata", "iwfnd", "iwmnd", "launchpad"],
"SAP BTP Security": ["cloud connector", "principal propagation", "subaccount", "destination", "x.509", "mtls"],
"SAP IDM": ["identity center", "vds", "repository", "pass-vector", "job", "provisioning"]
});

const SAP_KEYWORDS = Object.freeze([
"grac", "agr_", "usr", "ust", "pfcg", "msmp", "brf", "slg1", "sm37", "sm21",
"su53", "st22", "st01", "stauthtrace", "repository", "connector", "provisioning",
"workflow", "firefighter", "ara", "arm", "brm", "eam", "ias", "ips", "iag"
]);

const RE_TECHNICAL_ARTIFACTS = /(grac_|agr_|usr|ust|pfcg|su24|su25|su53|st22|slg1|sm37|sm21|st01|stauthtrace|se16|se11)/i;
const RE_WORKFLOW = /(msmp|brf|workflow|approval|agent|stage|path)/i;
const RE_IMPLEMENTATION = /(implementation|configured|rollout|go-live|production|migration|cutover|troubleshooting)/i;
const RE_ARCHITECTURE = /(architecture|landscape|integration|connector|repository|provisioning framework|principal propagation|mTLS)/i;

const RE_INTENT_ARCH = /(architecture|landscape|framework|design|component|integration|flow|runtime|federation)/i;
const RE_INTENT_CONFIG = /(configure|configuration|spro|nwbc|parameter|connector|setup|customizing)/i;
const RE_INTENT_TROUBLESHOOT = /(slg1|st22|sm21|sm37|su53|st01|stauthtrace|trace|error|dump|root cause|issue)/i;
const RE_INTENT_WORKFLOW = /(workflow|approval|msmp|brf|agent determination|routing|initiator)/i;
const RE_INTENT_PROVISIONING = /(provision|repository sync|repository object sync|connector group|background job|pass-vector)/i;
const RE_INTENT_TABLES = /(grac_|agr_|usr|ust|pfcg|se16|se11|usobt_c|usobx_c)/i;
const RE_INTENT_REAL_IMPL = /(implementation|configured|customer|production|cutover|rollout|go-live|migration|upgrade)/i;
const RE_SAP_STRONG_FILTER = /(grac|agr_|usr|ust|pfcg|su24|su25|su53|st22|st01|slg1|sm37|msmp|brf|firefighter|ara|arm|brm|eam|fiori|ias|ips|iag|provision|btp)/i;

function now() {
return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function normalizeAnalysis(analysis) {
return analysis && typeof analysis === "object" && !Array.isArray(analysis)
? analysis
: {};
}

function normalize(text = "") {
return String(text || "")
.toLowerCase()
.replace(/[^\w\s/+.-]/g, " ")
.replace(/\s+/g, " ")
.trim();
}

function cosineSimilarity(a, b) {
if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) return 0;
let dot = 0;
let magA = 0;
let magB = 0;

for (let index = 0; index < a.length; index += 1) {
const valA = a[index];
const valB = b[index];
dot += valA * valB;
magA += valA * valA;
magB += valB * valB;
}

const denom = Math.sqrt(magA) * Math.sqrt(magB);
return denom === 0 ? 0 : dot / denom;
}

function lexicalScore(queries, content) {
const text = normalize(content);
if (!text) return 0;
let score = 0;

// Only the original question (queries[0]) is used for direct word-overlap — the
// expanded queries lib/queryExpander.js adds are long, generic, multi-keyword phrases
// (e.g. "SAP GRC ARA Risk Analysis Function Risk Permission") deliberately built to
// cast a wide net for candidate *recall* during the earlier filtering stage. Reusing
// them here for word-overlap *scoring* double-counts their generic domain terms
// against any chunk that shares common words like "risk" or "function" — nearly every
// GRC chunk — which is the same defect already fixed above for lexicalScore's old
// SAP_KEYWORDS bonus and componentScore/intentScore's static content-only bonuses:
// measuring generic domain-density instead of relevance to what was actually asked.
if (Array.isArray(queries) && queries.length > 0) {
const words = normalize(queries[0]).split(" ");
for (let j = 0; j < words.length; j++) {
const word = words[j];
if (word.length >= 3 && text.includes(word)) {
score += 3;
}
}
}

// Deliberately no longer applies a flat SAP_KEYWORDS bonus for keywords found
// anywhere in the chunk regardless of the query — that measured "how SAP-buzzword-
// dense is this chunk," not "how relevant is this chunk to what was actually asked,"
// and systematically favored content-dense hub documents (e.g. arm.md, which
// legitimately cross-references ARA/MSMP/BRF+/EAM/Firefighter/connectors in its own
// prose) over topically-correct but keyword-sparser documents on every single query.
// General SAP relevance is already enforced upstream by RE_SAP_STRONG_FILTER during
// candidate filtering; this function's job is query relevance specifically.

return score;
}

function componentScore(analysis, content) {
const text = normalize(content);
if (!text) return 0;

const domain = analysis?.domain || "";
const expected = COMPONENT_KEYWORDS[domain] || [];
let score = 0;

for (let i = 0; i < expected.length; i++) {
if (text.includes(expected[i])) {
score += 8;
}
}

// The RE_TECHNICAL_ARTIFACTS/RE_WORKFLOW/RE_IMPLEMENTATION/RE_ARCHITECTURE bonuses
// that used to live here had the same defect as lexicalScore's removed SAP_KEYWORDS
// loop: they test chunk content only, independent of the query, so they rewarded
// generically SAP-technical-sounding chunks rather than chunks matching this specific
// question's domain. Removed for the same reason. The domain-based `expected` keyword
// match above stays — it's genuinely query-context-aware, derived from the classified
// domain of the current question via COMPONENT_KEYWORDS.

return score;
}

function intentScore(question, analysis, content) {
const text = normalize(content);
if (!text) return 0;
let score = 0;

const cfg = appConfig?.retrieval || {};
const q = normalize(question);

// Each bonus now requires the QUESTION to also match the same intent pattern, not
// just the chunk content — the same defect fixed in lexicalScore/componentScore
// above: testing content alone rewards any chunk that happens to mention workflow,
// config, or troubleshooting language regardless of what was actually asked. A plain
// "Explain X" question matches none of these patterns, which is correct — for that
// question shape, only direct query-word overlap (below) and semantic score should
// differentiate candidates.
if (RE_INTENT_ARCH.test(q) && RE_INTENT_ARCH.test(text)) score += cfg.architectureBonus || 5;
if (RE_INTENT_CONFIG.test(q) && RE_INTENT_CONFIG.test(text)) score += cfg.configurationBonus || 5;
if (RE_INTENT_TROUBLESHOOT.test(q) && RE_INTENT_TROUBLESHOOT.test(text)) score += cfg.troubleshootingBonus || 5;
if (RE_INTENT_WORKFLOW.test(q) && RE_INTENT_WORKFLOW.test(text)) score += cfg.workflowBonus || 5;
if (RE_INTENT_PROVISIONING.test(q) && RE_INTENT_PROVISIONING.test(text)) score += cfg.provisioningBonus || 5;
if (RE_INTENT_TABLES.test(q) && RE_INTENT_TABLES.test(text)) score += cfg.tablesBonus || 5;
if (RE_INTENT_REAL_IMPL.test(q) && RE_INTENT_REAL_IMPL.test(text)) score += cfg.realImplementationBonus || 5;

const qWords = q.split(" ");
for (let i = 0; i < qWords.length; i++) {
const word = qWords[i];
if (word.length > 3 && text.includes(word)) {
score += 2;
}
}

return score;
}

function deduplicateChunks(chunks) {
if (!Array.isArray(chunks)) return [];
const unique = [];
const seen = new Set();

for (let i = 0; i < chunks.length; i++) {
const chunk = chunks[i];
if (!chunk) continue;
const chunkId = chunk.id || chunk.chunkId || "";
const key = chunkId
  ? String(chunkId)
  : `${chunk.sourceFile || ""}-${(chunk.content || "").substring(0, 120)}`;
if (seen.has(key)) continue;
seen.add(key);
unique.push(chunk);
}

return unique;
}

function percentile(values, percentileValue) {
if (!Array.isArray(values) || !values.length) return 0;
const sorted = [...values].sort((a, b) => a - b);
return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * percentileValue) - 1))];
}

function createLocalKnowledgeIndexProvider({
indexFile = appConfig?.knowledge?.indexFile || "./data/knowledgeIndex.json",
fileSystem = fs
} = {}) {
let cachedIndex = null;

return Object.freeze({
type: RETRIEVAL_PROVIDER_TYPES.LOCAL_KNOWLEDGE_INDEX,
async getCandidates() {
if (!cachedIndex) {
const fileContent = await fileSystem.readFile(indexFile, "utf8");
cachedIndex = JSON.parse(fileContent);
}
return cachedIndex?.chunks || [];
},
clearCache() {
cachedIndex = null;
}
});
}

function expandQueryStage({ question, analysis, queryExpander }) {
const rawQueries = typeof queryExpander === "function" ? queryExpander(question, analysis) : [question];
const normalizedRaw = Array.isArray(rawQueries) ? rawQueries : [rawQueries];

const queries = [...new Set(normalizedRaw)]
.filter(Boolean)
.map((q) => String(q).trim());

if (!queries.some((q) => q.toLowerCase() === String(question).toLowerCase())) {
queries.unshift(question);
}

const maxExpansion = appConfig?.retrieval?.maxQueryExpansion || 5;
return ExpandedQuerySchema.parse({
question,
queries: queries.slice(0, maxExpansion)
});
}

async function retrieveCandidatesStage({ provider, query, metadataFilters }) {
const candidates = await provider.getCandidates({ query, metadataFilters });
if (!Array.isArray(candidates)) return [];
return candidates.map((candidate) => RetrievedChunkSchema.parse(candidate));
}

function scoreCandidatesStage({ question, analysis, expandedQuery, embeddings, candidates, weights }) {
const activeWeights = {
semantic: weights?.semantic ?? 0.4,
lexical: weights?.lexical ?? 0.2,
component: weights?.component ?? 0.2,
intent: weights?.intent ?? 0.2
};

return candidates.map((chunk) => {
let semanticScore = 0;

if (Array.isArray(embeddings) && Array.isArray(chunk.embedding)) {
  for (let i = 0; i < embeddings.length; i++) {
    semanticScore = Math.max(semanticScore, cosineSimilarity(embeddings[i], chunk.embedding));
  }
}

const lexical = lexicalScore(expandedQuery.queries, chunk.content);
const component = componentScore(analysis, chunk.content);
const intent = intentScore(question, analysis, chunk.content);

const totalScore =
  semanticScore * activeWeights.semantic +
  lexical * activeWeights.lexical +
  component * activeWeights.component +
  intent * activeWeights.intent;

return RankedChunkSchema.parse({
  ...chunk,
  semanticScore,
  lexicalScore: lexical,
  componentScore: component,
  intentScore: intent,
  score: totalScore
});
});
}

function rankCandidatesStage(scoredCandidates, topK) {
const defaultTopK = appConfig?.retrieval?.defaultTopK || 5;
const targetTopK = typeof topK === "number" && topK > 0 ? topK : defaultTopK;

const ranked = [...scoredCandidates].sort((a, b) => {
if (b.score !== a.score) return b.score - a.score;

const aImplementation = RE_IMPLEMENTATION.test(a.content || "");
const bImplementation = RE_IMPLEMENTATION.test(b.content || "");

if (aImplementation !== bImplementation) {
  return bImplementation ? 1 : -1;
}

if (b.semanticScore !== a.semanticScore) {
  return b.semanticScore - a.semanticScore;
}

return (b.content?.length || 0) - (a.content?.length || 0);
});

return deduplicateChunks(ranked).slice(0, targetTopK);
}

function selectEvidenceStage(chunks, metadataFilters) {
return EvidenceSetSchema.parse({ chunks, metadataFilters });
}

function createRetrievalService({
provider,
queryExpander,
embedder,
logger = defaultLogger,
config = appConfig?.retrieval || {}
} = {}) {
if (!provider?.getCandidates) throw new Error("A retrieval provider with getCandidates is required.");
if (typeof queryExpander !== "function") throw new Error("A query expander function is required.");
if (typeof embedder !== "function") throw new Error("An embedding generator function is required.");

const retrievalVersion = config.version || "1.0.0";
const candidateLimit = config.candidateLimit || 50;
const minimumScore = config.minimumScore ?? 0.1;
const defaultWeights = config.weights || { semantic: 0.4, lexical: 0.2, component: 0.2, intent: 0.2 };

async function retrieve(request) {
const startedAt = now();
const normalizedRequest = QuerySchema.parse({
...request,
analysis: normalizeAnalysis(request?.analysis)
});

try {
  const expandedQuery = expandQueryStage({
    question: normalizedRequest.question,
    analysis: normalizedRequest.analysis,
    queryExpander
  });

  const embeddingStartedAt = now();
  const rawEmbedding = await embedder(normalizedRequest.question);
  const embeddings = Array.isArray(rawEmbedding) ? [rawEmbedding] : [];
  const embeddingTime = now() - embeddingStartedAt;

  const candidates = await retrieveCandidatesStage({
    provider,
    query: normalizedRequest,
    metadataFilters: normalizedRequest.metadataFilters
  });

  const filteredCandidates = candidates.filter((chunk) => {
    const text = normalize(chunk.content);
    if (RE_SAP_STRONG_FILTER.test(text)) {
      return true;
    }

    return expandedQuery.queries.some((q) =>
      normalize(q)
        .split(" ")
        .filter((w) => w.length > 2)
        .some((word) => text.includes(word))
    );
  });

  const rankingStartedAt = now();
  const candidatesToScore = deduplicateChunks(
    filteredCandidates.length > 0 ? filteredCandidates : candidates
  ).slice(0, candidateLimit);

  const scoredCandidates = scoreCandidatesStage({
    question: normalizedRequest.question,
    analysis: normalizedRequest.analysis,
    expandedQuery,
    embeddings,
    candidates: candidatesToScore,
    weights: defaultWeights
  });

  const qualifyingCandidates = scoredCandidates.filter((chunk) => chunk.score >= minimumScore);
  const chunks = rankCandidatesStage(
    qualifyingCandidates.length > 0 ? qualifyingCandidates : scoredCandidates,
    normalizedRequest.topK
  );

  const rankingTime = now() - rankingStartedAt;
  const evidence = selectEvidenceStage(chunks, normalizedRequest.metadataFilters);
  const similarities = chunks.map((chunk) => chunk.semanticScore);
  const topChunk = chunks[0];

  const diagnostics = RetrievalDiagnosticsSchema.parse({
    retrievalVersion,
    retrievalTime: now() - startedAt,
    embeddingTime,
    rankingTime,
    candidateCount: filteredCandidates.length,
    returnedChunkCount: chunks.length,
    averageSimilarity: similarities.length
      ? similarities.reduce((sum, score) => sum + score, 0) / similarities.length
      : 0,
    topSimilarity: topChunk?.semanticScore || 0,
    topDocumentId: topChunk?.documentId || null,
    topChunkId: topChunk?.chunkId || topChunk?.id || null
  });

  const result = RetrievalResultSchema.parse({
    query: normalizedRequest,
    expandedQuery,
    chunks,
    evidence,
    diagnostics
  });

  if (logger && typeof logger.info === "function") {
    logger.info("retrieval.completed", {
      query: normalizedRequest.question,
      retrievalTime: diagnostics.retrievalTime,
      candidateCount: diagnostics.candidateCount,
      returnedChunks: diagnostics.returnedChunkCount,
      retrievalVersion: diagnostics.retrievalVersion
    });
  }

  return result;
} catch (error) {
  if (logger && typeof logger.error === "function") {
    logger.error("retrieval.failed", {
      query: normalizedRequest.question,
      retrievalVersion,
      error
    });
  }
  throw error;
}
}

return Object.freeze({
version: retrievalVersion,
provider,
retrieve
});
}

function createRetrievalBenchmark({ retrievalService, processRef = process } = {}) {
if (!retrievalService?.retrieve) throw new Error("A retrieval service with retrieve method is required.");

return Object.freeze({
async run({ requests, iterations = 1 }) {
if (!Array.isArray(requests) || !requests.length) {
throw new Error("At least one benchmark request is required.");
}

  const memoryBefore = typeof processRef?.memoryUsage === "function" ? processRef.memoryUsage().heapUsed : null;
  const diagnostics = [];

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    for (const request of requests) {
      const normalizedRequest = typeof request === "string" ? { question: request } : request;
      const result = await retrievalService.retrieve(normalizedRequest);
      diagnostics.push(result.diagnostics);
    }
  }

  const retrievalTimes = diagnostics.map((entry) => entry.retrievalTime);
  const memoryAfter = typeof processRef?.memoryUsage === "function" ? processRef.memoryUsage().heapUsed : null;

  const average = (field) => (diagnostics.length
    ? diagnostics.reduce((sum, entry) => sum + (entry[field] || 0), 0) / diagnostics.length
    : 0);

  return RetrievalBenchmarkSchema.parse({
    retrievalVersion: retrievalService.version,
    sampleCount: diagnostics.length,
    averageRetrievalTime: average("retrievalTime"),
    p50RetrievalLatency: percentile(retrievalTimes, 0.5),
    p95RetrievalLatency: percentile(retrievalTimes, 0.95),
    averageCandidateCount: average("candidateCount"),
    averageReturnedChunkCount: average("returnedChunkCount"),
    memoryUsageBytes: typeof memoryBefore === "number" && typeof memoryAfter === "number"
      ? { before: memoryBefore, after: memoryAfter, delta: memoryAfter - memoryBefore }
      : null
  });
}
});
}

module.exports = {
RETRIEVAL_PROVIDER_TYPES,
createLocalKnowledgeIndexProvider,
createRetrievalService,
createRetrievalBenchmark,
expandQueryStage,
retrieveCandidatesStage,
scoreCandidatesStage,
rankCandidatesStage,
selectEvidenceStage
};