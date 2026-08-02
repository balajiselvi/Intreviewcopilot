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
const { appConfig } = require("../config/appConfig");
const { logger: defaultLogger } = require("../lib/logger");

const RETRIEVAL_PROVIDER_TYPES = Object.freeze({
  LOCAL_KNOWLEDGE_INDEX: "local-knowledge-index",
  QDRANT: "qdrant",
  AZURE_AI_SEARCH: "azure-ai-search",
  ELASTIC: "elastic"
});

const COMPONENT_KEYWORDS = Object.freeze({
  "SAP GRC": ["ara", "arm", "eam", "firefighter", "risk"],
  "SAP Security": ["pfcg", "su24", "authorization", "role"],
  "SAP Cloud Identity": ["ias", "ips", "iag", "saml", "oauth"],
  "SAP Fiori Security": ["catalog", "space", "page", "odata"]
});

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function normalizeAnalysis(analysis) {
  return analysis && typeof analysis === "object" && !Array.isArray(analysis)
    ? analysis
    : {};
}

function normalize(text = "") {
  return text
    .toLowerCase()
    .replace(/[^\w\s/+.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    magA += a[index] * a[index];
    magB += b[index] * b[index];
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function lexicalScore(queries, content) {
  const text = normalize(content);
  let score = 0;

  queries.forEach((query) => {
    normalize(query).split(" ").forEach((word) => {
      if (word.length >= 3 && text.includes(word)) score += 2;
    });
  });

  return score;
}

function componentScore(analysis, content) {
  const text = normalize(content);
  const expected = COMPONENT_KEYWORDS[analysis.domain] || [];

  return expected.reduce(
    (score, keyword) => score + (text.includes(keyword) ? 4 : 0),
    0
  );
}

function intentScore(question, analysis, content) {
  const normalizedQuestion = normalize(question);
  const text = normalize(content);
  let score = 0;

  if (analysis.intent === "architecture" && /(architecture|integration|landscape|component|design|topology|runtime)/i.test(text)) score += 10;
  if (analysis.intent === "workflow" && /(workflow|approval|request|provision|msmp|brf|approval path)/i.test(text)) score += 10;
  if (analysis.intent === "troubleshooting" && /(su53|st01|st22|slg1|sm21|sm37|trace|root cause)/i.test(text)) score += 10;
  if (analysis.intent === "scenario" && /(implementation|approach|decision|strategy|real world|best practice)/i.test(text)) score += 8;
  if (analysis.intent === "comparison" && /(difference|compare|versus|advantage|disadvantage)/i.test(text)) score += 8;

  if (
    (normalizedQuestion.includes("defense") || normalizedQuestion.includes("government")) &&
    /(zero trust|air gap|sovereign|defense|government|audit|data sovereignty)/i.test(text)
  ) score += 8;

  return score;
}

function deduplicateChunks(chunks) {
  const unique = [];
  const seen = new Set();

  for (const chunk of chunks) {
    const key = `${chunk.sourceFile}-${chunk.content.substring(0, 120)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(chunk);
  }

  return unique;
}

function percentile(values, percentileValue) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * percentileValue) - 1)];
}

function createLocalKnowledgeIndexProvider({
  indexFile = appConfig.knowledge.indexFile,
  fileSystem = fs
} = {}) {
  let cachedIndex = null;

  return Object.freeze({
    type: RETRIEVAL_PROVIDER_TYPES.LOCAL_KNOWLEDGE_INDEX,
    async getCandidates() {
      if (!cachedIndex) {
        cachedIndex = JSON.parse(await fileSystem.readFile(indexFile, "utf8"));
      }

      return cachedIndex.chunks || [];
    },
    clearCache() {
      cachedIndex = null;
    }
  });
}

function expandQueryStage({ question, analysis, queryExpander }) {
  return ExpandedQuerySchema.parse({
    question,
    queries: queryExpander(question, analysis)
  });
}

async function retrieveCandidatesStage({ provider, query, metadataFilters }) {
  const candidates = await provider.getCandidates({ query, metadataFilters });
  return candidates.map((candidate) => RetrievedChunkSchema.parse(candidate));
}

function scoreCandidatesStage({ question, analysis, expandedQuery, embeddings, candidates, weights }) {
  return candidates.map((chunk) => {
    let semanticScore = 0;

    for (const embedding of embeddings) {
      semanticScore = Math.max(semanticScore, cosineSimilarity(embedding, chunk.embedding));
    }

    const lexical = lexicalScore(expandedQuery.queries, chunk.content);
    const component = componentScore(analysis, chunk.content);
    const intent = intentScore(question, analysis, chunk.content);

    return RankedChunkSchema.parse({
      ...chunk,
      semanticScore,
      lexicalScore: lexical,
      componentScore: component,
      intentScore: intent,
      score:
        semanticScore * weights.semantic +
        lexical * weights.lexical +
        component * weights.component +
        intent * weights.intent
    });
  });
}

function rankCandidatesStage(scoredCandidates, topK) {
  const ranked = [...scoredCandidates].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.semanticScore !== a.semanticScore) return b.semanticScore - a.semanticScore;
    return (b.content?.length || 0) - (a.content?.length || 0);
  });

  return deduplicateChunks(ranked).slice(0, topK);
}

function selectEvidenceStage(chunks, metadataFilters) {
  return EvidenceSetSchema.parse({ chunks, metadataFilters });
}

function createRetrievalService({
  provider,
  queryExpander,
  embedder,
  logger = defaultLogger,
  config = appConfig.retrieval
}) {
  if (!provider?.getCandidates) throw new Error("A retrieval provider is required.");
  if (typeof queryExpander !== "function") throw new Error("A query expander is required.");
  if (typeof embedder !== "function") throw new Error("An embedding generator is required.");

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
      const embeddings = await Promise.all(
        expandedQuery.queries.map((query) => embedder(query))
      );
      const embeddingTime = now() - embeddingStartedAt;

      const candidates = await retrieveCandidatesStage({
        provider,
        query: normalizedRequest,
        metadataFilters: normalizedRequest.metadataFilters
      });

      const filteredCandidates = candidates.filter(chunk => {

    const text = normalize(chunk.content);

    return expandedQuery.queries.some(q =>
        normalize(q)
            .split(" ")
            .filter(w => w.length > 2)
            .some(word => text.includes(word))
    );

});

      const rankingStartedAt = now();
      const scoredCandidates = scoreCandidatesStage({
        question: normalizedRequest.question,
        analysis: normalizedRequest.analysis,
        expandedQuery,
        embeddings,
        candidates: filteredCandidates.length ? filteredCandidates : candidates,
        weights: config.weights
      });
      const chunks = rankCandidatesStage(scoredCandidates, normalizedRequest.topK);
      const rankingTime = now() - rankingStartedAt;
      const evidence = selectEvidenceStage(chunks, normalizedRequest.metadataFilters);
      const similarities = chunks.map((chunk) => chunk.semanticScore);
      const topChunk = chunks[0];
      const diagnostics = RetrievalDiagnosticsSchema.parse({
        retrievalVersion: config.version,
        retrievalTime: now() - startedAt,
        embeddingTime,
        rankingTime,
        candidateCount: candidates.length,
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

      logger.info("retrieval.completed", {
        query: normalizedRequest.question,
        retrievalTime: diagnostics.retrievalTime,
        candidateCount: diagnostics.candidateCount,
        returnedChunks: diagnostics.returnedChunkCount,
        retrievalVersion: diagnostics.retrievalVersion
      });

      return result;
    } catch (error) {
      logger.error("retrieval.failed", {
        query: normalizedRequest.question,
        retrievalVersion: config.version,
        error
      });
      throw error;
    }
  }

  return Object.freeze({
    version: config.version,
    provider,
    retrieve
  });
}

function createRetrievalBenchmark({ retrievalService, processRef = process } = {}) {
  if (!retrievalService?.retrieve) throw new Error("A retrieval service is required.");

  return Object.freeze({
    async run({ requests, iterations = 1 }) {
      if (!Array.isArray(requests) || !requests.length) {
        throw new Error("At least one benchmark request is required.");
      }

      const memoryBefore = processRef?.memoryUsage?.().heapUsed;
      const diagnostics = [];

      for (let iteration = 0; iteration < iterations; iteration += 1) {
        for (const request of requests) {
          const normalizedRequest = typeof request === "string" ? { question: request } : request;
          const result = await retrievalService.retrieve(normalizedRequest);
          diagnostics.push(result.diagnostics);
        }
      }

      const retrievalTimes = diagnostics.map((entry) => entry.retrievalTime);
      const memoryAfter = processRef?.memoryUsage?.().heapUsed;
      const average = (field) => diagnostics.length
        ? diagnostics.reduce((sum, entry) => sum + entry[field], 0) / diagnostics.length
        : 0;

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
