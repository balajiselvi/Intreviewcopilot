const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// --- Indexing-pipeline versioning strategy ---
// services/knowledgeIndexService.js skips re-chunking a document whenever its content
// checksum AND these version strings are unchanged from the last build (see
// priorChunksByDocument / isUnchangedDocument there) — a mismatch on ANY of these
// wholesale-invalidates every prior chunk and forces a full rebuild.
// Rather than requiring someone to remember to bump a version number whenever the
// chunking or parsing algorithm changes, PARSER_VERSION and CHUNK_VERSION below are
// hashes of the actual source files that implement that logic (plus, for chunking, the
// size config that governs chunk boundaries). Any future edit to either file, or to the
// chunk size env vars, changes the hash automatically — a full rebuild triggers itself,
// with no manual cache-invalidation step. Override with the env vars below only if you
// need to force a specific version deliberately (e.g. to intentionally reuse chunks
// across a change you know is safe to skip).
function hashSourceFile(relativePathFromConfigDir, extra = '') {
  try {
    const absolutePath = path.join(__dirname, relativePathFromConfigDir);
    const source = fs.readFileSync(absolutePath, 'utf8');
    return crypto.createHash('sha256').update(source).update(String(extra)).digest('hex').slice(0, 12);
  } catch (error) {
    // Should only happen if the file was moved without updating this path — fail safe
    // to a fixed string rather than crashing config load; a mismatch here still forces
    // a rebuild on the next deploy where the path is fixed.
    return 'unresolved';
  }
}

const CHUNK_SIZE_CONFIG = {
  maxChunkSize: parseInt(process.env.MAX_CHUNK_SIZE_CHARS) || 700,
  minChunkSize: parseInt(process.env.MIN_CHUNK_SIZE_CHARS) || 200
};

const PARSER_VERSION = process.env.PARSER_VERSION
  || hashSourceFile('../services/knowledgeService.js');
const CHUNK_VERSION = process.env.CHUNK_VERSION
  || hashSourceFile('../services/chunkService.js', JSON.stringify(CHUNK_SIZE_CONFIG));

const config = {
  environment: {
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production'
  },

  maxContextCharacters: parseInt(process.env.MAX_CONTEXT_CHARACTERS) || 3000,
  responseLength: process.env.DEFAULT_RESPONSE_LENGTH || 'medium',

  api: {
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: process.env.ANTHROPIC_API_URL || 'https://api.anthropic.com',
      timeout: parseInt(process.env.API_TIMEOUT_MS) || 120000,
      maxRetries: parseInt(process.env.API_MAX_RETRIES) || 3,
      retryDelayMs: parseInt(process.env.API_RETRY_DELAY_MS) || 1000,
      exponentialBackoffFactor: 2
    },
    // Server-side fallback keys, used only when the client (Settings dialog) doesn't
    // supply its own apiKey in the request body. The app's primary model is
    // bring-your-own-key from the client; these env vars exist for deployments that
    // want a shared server-side key instead. Never hardcode a key value here.
    openai: {
      apiKey: process.env.OPENAI_API_KEY || ''
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || ''
    }
  },

  // Controls whether pages/api/chat.js actually calls the LLM. 'retrieval-only' runs
  // the full pipeline (analysis, retrieval, prompt construction) and returns a
  // diagnostic event instead of calling OpenAI/Gemini — no API key required, no cost,
  // safe for validating the knowledge base during content population. Set
  // LLM_VALIDATION_MODE=full (and provide a real key, client-supplied or via the env
  // vars above) to enable real end-to-end generation.
  llm: {
    validationMode: process.env.LLM_VALIDATION_MODE || 'retrieval-only',
    // Declares the intended default provider/model for deployments that configure a
    // server-side key rather than relying on the client's Settings dialog. The model
    // string itself still determines actual provider routing in pages/api/chat.js
    // (a "gemini-" prefix routes to Gemini, otherwise OpenAI) — these are only used as
    // the fallback when a request doesn't specify a model at all.
    provider: process.env.LLM_PROVIDER || 'openai',
    defaultModel: process.env.OPENAI_MODEL || 'gpt-4o-mini'
  },

  models: {
    default: {
      modelId: process.env.MODEL_ID || 'claude-opus-5',
      contextWindow: 200000,
      maxOutputTokens: 4096,
      costPer1KInputTokens: 0.015,
      costPer1KOutputTokens: 0.075
    },
    reasoning: {
      modelId: process.env.REASONING_MODEL_ID || 'claude-opus-5',
      contextWindow: 200000,
      maxOutputTokens: 16000,
      costPer1KInputTokens: 0.015,
      costPer1KOutputTokens: 0.075
    },
    fast: {
      modelId: process.env.FAST_MODEL_ID || 'claude-haiku-4-5-20251001',
      contextWindow: 200000,
      maxOutputTokens: 2048,
      costPer1KInputTokens: 0.0008,
      costPer1KOutputTokens: 0.004
    }
  },

  interview: {
    domains: [
      'SAP Security',
      'SAP GRC Access Control',
      'SAP BTP Security',
      'SAP Cloud Identity',
      'SAP IAS',
      'SAP IPS',
      'SAP IAG',
      'SAP IDM',
      'SAP Fiori Security',
      'SAP Gateway',
      'SAP S/4HANA Security',
      'SAP BW Security'
    ],
    audienceLevels: {
      seniorConsultant: 'Senior Consultant',
      lead: 'Lead',
      architect: 'Architect'
    },
    defaultLevel: 'architect',
    difficultyLevels: {
      fundamental: 1,
      intermediate: 2,
      advanced: 3,
      expert: 4,
      architect: 5
    },
    defaultDifficulty: 'architect',
    maxQuestionsPerSession: 50,
    sessionTimeoutMinutes: 120,
    minAnswerLengthCharacters: 100,
    maxAnswerLengthCharacters: 5000
  },

  // Character-based chunk sizing used by the semantic chunker (services/chunkService.js),
  // distinct from knowledge.chunking's token-based sizing used elsewhere. Shared with the
  // CHUNK_VERSION hash above so a chunk-size change also forces a full re-chunk.
  chunking: CHUNK_SIZE_CONFIG,

  knowledge: {
    source: process.env.KNOWLEDGE_SOURCE || 'sap-interview-knowledge-base',
    sourceDirectory: process.env.KNOWLEDGE_SOURCE_DIR || './knowledge',
    documentVersion: process.env.DOCUMENT_VERSION || '1.0.0',
    parserVersion: PARSER_VERSION,
    schemaVersion: process.env.SCHEMA_VERSION || '1.0.0',
    chunkVersion: CHUNK_VERSION,
    embeddingModel: process.env.EMBEDDING_MODEL_ID || 'text-embedding-3-small',
    indexVersion: parseInt(process.env.KNOWLEDGE_INDEX_VERSION) || 1,
    indexFile: process.env.KNOWLEDGE_INDEX_FILE || './data/knowledgeIndex.json',
    manifestFile: process.env.KNOWLEDGE_MANIFEST_FILE || './data/knowledgeManifest.json',
    reportFile: process.env.KNOWLEDGE_REPORT_FILE || './data/knowledgeReport.json',
    chunking: {
      strategy: process.env.CHUNKING_STRATEGY || 'semantic',
      maxChunkSizeTokens: parseInt(process.env.MAX_CHUNK_TOKENS) || 1024,
      minChunkSizeTokens: parseInt(process.env.MIN_CHUNK_TOKENS) || 200,
      overlapTokens: parseInt(process.env.CHUNK_OVERLAP_TOKENS) || 100,
      supportedStrategies: ['semantic', 'fixed', 'hybrid']
    },
    embedding: {
      modelId: process.env.EMBEDDING_MODEL_ID || 'text-embedding-3-small',
      dimensionality: 1536,
      batchSize: parseInt(process.env.EMBEDDING_BATCH_SIZE) || 100,
      maxRetries: 3,
      timeoutMs: 30000
    },
    storage: {
      type: process.env.KNOWLEDGE_STORAGE_TYPE || 'memory',
      dbPath: process.env.KNOWLEDGE_DB_PATH || './data/knowledge.db',
      cacheSize: parseInt(process.env.KNOWLEDGE_CACHE_SIZE) || 10000,
      enablePersistence: process.env.ENABLE_PERSISTENCE === 'true'
    },
    sapArtifacts: {
      enableTCodeDetection: true,
      enableTableDetection: true,
      enableAuthObjectDetection: true,
      enableSpecialTermDetection: true,
      enablePreservation: true
    },
    deduplication: {
      enabled: true,
      algorithm: 'sha256',
      minSimilarityThreshold: 0.95
    }
  },

  retrieval: {
    defaultTopK: parseInt(process.env.RETRIEVAL_TOP_K) || 5,
    maxQueryExpansion: parseInt(process.env.MAX_QUERY_EXPANSION) || 5,
    // How many post-filter candidates get scored per query, BEFORE ranking picks the
    // final topK. This used to default to 50 in code with no config override, which
    // truncated candidates in raw (effectively alphabetical file-order) order before
    // scoring ever ran — files sorting later within a domain (msmp.md, repository-
    // sync.md, etc.) could be silently excluded from consideration entirely once a
    // domain's real chunk count exceeded the limit, independent of actual relevance.
    // Set generously above the current index size (560 chunks across 2 of 20 domains)
    // with headroom for the full ~110-file target; scoring itself is cheap (a cosine
    // similarity plus a few string/regex checks per chunk), so this is bounding cost
    // against a genuinely oversized index, not a tight performance constraint.
    candidateLimit: parseInt(process.env.RETRIEVAL_CANDIDATE_LIMIT) || 2000,
    vectorSearch: {
      enabled: true,
      topK: parseInt(process.env.RETRIEVAL_TOP_K) || 5,
      minSimilarityScore: parseFloat(process.env.MIN_SIMILARITY_SCORE) || 0.7,
      maxDocumentsPerQuery: 20,
      timeoutMs: 5000,
      batchQuerySize: 10
    },
    ranking: {
      strategy: process.env.RANKING_STRATEGY || 'relevance-recency',
      useMetadataFiltering: true,
      useSapArtifactMatching: true,
      boostRecentDocuments: true,
      recencyWeightDays: 30
    },
    caching: {
      enabled: true,
      ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS) || 3600,
      maxCacheSize: parseInt(process.env.MAX_CACHE_ENTRIES) || 1000
    },
    filtering: {
      byDomain: true,
      byAudienceLevel: true,
      byDifficulty: true,
      byRecency: true
    }
  },

  // Post-answer heuristic evaluation (lib/prompt/evaluation.js, scoring.js, followupAnalyzer.js).
  // Pure string/regex checks only — never gates or regenerates the live answer, purely informational.
  evaluation: {
    enabled: process.env.ENABLE_ANSWER_EVALUATION !== 'false',
    scale: 10,
    weights: {
      technicalAccuracy: 0.30,
      experienceConsistency: 0.25,
      spokenDelivery: 0.15,
      naturalConversation: 0.10,
      ownership: 0.05,
      completeness: 0.05,
      followUpReadiness: 0.05,
      conciseness: 0.05
    },
    thresholds: {
      wordCountMin: 70,
      wordCountMax: 180,
      minSapComponentHits: 2,
      minTechnicalKeywordHits: 2,
      maxAvgSentenceWords: 22,
      perGapPenalty: 0.5,
      genericPhrasePenalty: 1,
      fillerPhrasePenalty: 0.5,
      hallucinationPenaltyNoResume: 4,
      hallucinationPenaltyUnsupported: 2
    },
    hallucinationPhrases: ['my project', 'our customer', 'when i implemented', 'our client', 'during my deployment'],
    genericPhrases: ['best practice', 'proper governance', 'overall security', 'this improves compliance', 'this enhances security'],
    fillerPhrases: ['basically', 'essentially', 'obviously', 'needless to say', 'at the end of the day', 'as such', 'kind of', 'sort of'],
    technicalKeywords: ['pfcg', 'su24', 'ara', 'arm', 'eam', 'msmp', 'brf', 'ias', 'ips', 'iag', 'cloud connector', 'snc', 'sm59', 'firefighter', 'role', 'authorization']
  },

  streaming: {
    enabled: true,
    bufferSizeKb: 64,
    flushIntervalMs: 100,
    compressionEnabled: false,
    maxConcurrentStreams: 10
  },

  timeout: {
    documentLoadMs: parseInt(process.env.TIMEOUT_DOCUMENT_LOAD_MS) || 30000,
    vectorSearchMs: parseInt(process.env.TIMEOUT_VECTOR_SEARCH_MS) || 5000,
    modelInferenceMs: parseInt(process.env.TIMEOUT_MODEL_INFERENCE_MS) || 60000,
    totalResponseMs: parseInt(process.env.TIMEOUT_TOTAL_RESPONSE_MS) || 120000,
    knowledgeProcessingMs: parseInt(process.env.TIMEOUT_KNOWLEDGE_PROCESSING_MS) || 300000
  },

  retry: {
    apiCallMaxRetries: parseInt(process.env.RETRY_API_MAX) || 3,
    apiCallInitialDelayMs: parseInt(process.env.RETRY_INITIAL_DELAY_MS) || 1000,
    vectorSearchMaxRetries: parseInt(process.env.RETRY_VECTOR_SEARCH_MAX) || 2,
    knowledgeLoadMaxRetries: parseInt(process.env.RETRY_KNOWLEDGE_LOAD_MAX) || 3,
    exponentialBackoff: true,
    maxBackoffMs: 30000
  },

  logging: {
    service: process.env.SERVICE_NAME || 'interview-copilot',
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    format: process.env.LOG_FORMAT || 'json',
    outputDestination: process.env.LOG_OUTPUT || 'stdout',
    logFilePath: process.env.LOG_FILE_PATH || './logs/app.log',
    maxLogFileSizeMb: 100,
    maxLogFiles: 10,
    enableConsoleOutput: process.env.LOG_CONSOLE !== 'false',
    loggers: {
      api: true,
      retrieval: true,
      knowledge: true,
      interview: true,
      reasoning: true,
      errors: true,
      performance: process.env.NODE_ENV !== 'production'
    }
  },

  performance: {
    memory: {
      maxHeapSizeMb: parseInt(process.env.MAX_HEAP_SIZE_MB) || 2048,
      enableGarbageCollection: true,
      gcIntervalSeconds: 300
    },
    caching: {
      enableResponseCache: true,
      enableChunkCache: true,
      enableEmbeddingCache: true,
      responseCacheTtlSeconds: 3600,
      chunkCacheTtlSeconds: 86400,
      embeddingCacheTtlSeconds: 604800
    },
    rateLimit: {
      enabled: true,
      requestsPerSecond: parseInt(process.env.RATE_LIMIT_RPS) || 10,
      burstAllowance: parseInt(process.env.RATE_LIMIT_BURST) || 20,
      windowSeconds: 60
    }
  },

  tokens: {
    maxInputTokensPerRequest: parseInt(process.env.MAX_INPUT_TOKENS) || 150000,
    maxOutputTokensPerRequest: parseInt(process.env.MAX_OUTPUT_TOKENS) || 4096,
    maxTokensPerInterviewSession: parseInt(process.env.MAX_SESSION_TOKENS) || 500000,
    inputTokenBudgetPercentage: 0.75,
    outputTokenBudgetPercentage: 0.25,
    warningThresholdPercentage: 0.8
  },

  sap: {
    domains: {
      security: {
        name: 'SAP Security',
        subtopics: ['Authorization', 'Authentication', 'Audit', 'Compliance', 'IAM'],
        priority: 1
      },
      grcAccessControl: {
        name: 'SAP GRC Access Control',
        subtopics: ['ARA', 'ARM', 'ARC', 'Segregation of Duties', 'Workflow'],
        priority: 2
      },
      btpSecurity: {
        name: 'SAP BTP Security',
        subtopics: ['Cloud Security', 'Identity Services', 'Connectivity', 'Data Protection'],
        priority: 3
      },
      cloudIdentity: {
        name: 'SAP Cloud Identity Services',
        subtopics: ['IAS', 'IPS', 'IAG', 'Authentication', 'Authorization'],
        priority: 4
      },
      idm: {
        name: 'SAP IDM',
        subtopics: ['User Provisioning', 'Access Governance', 'Identity Sync', 'Compliance'],
        priority: 5
      },
      fioriSecurity: {
        name: 'SAP Fiori Security',
        subtopics: ['App Security', 'Role Design', 'Gateway Security', 'Data Protection'],
        priority: 6
      },
      s4hanaSecurity: {
        name: 'SAP S/4HANA Security',
        subtopics: ['Authorization', 'Audit', 'Data Classification', 'Compliance'],
        priority: 7
      }
    },
    components: {
      enableAutoDetection: true,
      enableContextMapping: true,
      enableHierarchyTracking: true
    }
  },

  features: {
    enableLiveInterview: true,
    enableCoachingFeedback: true,
    enableScoring: true,
    enableAnalytics: true,
    enableKnowledgeExport: process.env.NODE_ENV === 'development',
    enableDebugMode: process.env.DEBUG_MODE === 'true' && process.env.NODE_ENV === 'development'
  },

  security: {
    apiKeyValidation: true,
    requestSigning: process.env.REQUEST_SIGNING === 'true',
    contentEncryption: process.env.CONTENT_ENCRYPTION === 'true',
    tlsVerification: true,
    corsEnabled: true,
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    rateLimitingEnabled: true
  },

  monitoring: {
    enableMetrics: true,
    metricsCollectionIntervalSeconds: 60,
    enableTracing: process.env.ENABLE_TRACING === 'true',
    enableProfiling: process.env.NODE_ENV === 'development',
    alertThresholds: {
      errorRatePercentage: 5,
      responseTimeMs: 30000,
      memoryUsagePercentage: 85,
      tokenUsagePercentage: 90
    }
  },

  defaults: {
    pageSize: 20,
    sortOrder: 'relevance',
    dateFormat: 'ISO8601',
    timezone: process.env.TIMEZONE || 'UTC'
  },

  validation: {
    validateInputs: true,
    validateOutputs: true,
    validateSchemas: process.env.NODE_ENV === 'development',
    maxInputLength: 10000,
    maxOutputLength: 100000
  }
};

const getConfig = (path) => {
  const keys = path.split('.');
  let current = config;
  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  return current;
};

const setConfig = (path, value) => {
  const keys = path.split('.');
  let current = config;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
};

const hasConfig = (path) => {
  return getConfig(path) !== undefined;
};

const mergeConfig = (overrides) => {
  const deepMerge = (target, source) => {
    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!(key in target)) {
          target[key] = {};
        }
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  };
  return deepMerge(JSON.parse(JSON.stringify(config)), overrides);
};

module.exports = config;
module.exports.getConfig = getConfig;
module.exports.setConfig = setConfig;
module.exports.hasConfig = hasConfig;
module.exports.mergeConfig = mergeConfig;