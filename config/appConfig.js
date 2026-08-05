  const config = {
  environment: {
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production'
  },

  api: {
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: process.env.ANTHROPIC_API_URL || 'https://api.anthropic.com',
      timeout: parseInt(process.env.API_TIMEOUT_MS) || 120000,
      maxRetries: parseInt(process.env.API_MAX_RETRIES) || 3,
      retryDelayMs: parseInt(process.env.API_RETRY_DELAY_MS) || 1000,
      exponentialBackoffFactor: 2
    }
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

  knowledge: {
    sourceDirectory: process.env.KNOWLEDGE_SOURCE_DIR || './knowledge',
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

  prompts: {
    system: {
      role: 'You are a Senior SAP GRC Security Architect and Interview Coach.',
      tone: 'Professional, direct, technically precise.',
      focus: 'Deliver technically accurate SAP answers grounded in real consulting experience.',
      format: 'Conversational spoken English, 30 seconds to 2 minutes for most answers.'
    },
    styleGuide: {
      noBulletPoints: true,
      noMarkdown: true,
      noHeadings: true,
      conversationalTone: true,
      useRealExamples: true,
      emphasizePractical: true
    },
    sapTerminologyPreservation: {
      preserveTCodes: true,
      preserveTableNames: true,
      preserveAuthObjects: true,
      preserveSpecialTerms: true,
      useSAPAccurateTerminology: true
    },
    answerGuidelines: {
      minLengthSeconds: 30,
      maxLengthSeconds: 120,
      includeRealWorldContext: true,
      highlightTrustPlanningCorePrinciples: true,
      demonstrateArchitectureKnowledge: true,
      showConsultingExperience: true
    }
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
  },

  llm: {
    // Execution mode: 'full' (production, calls LLM), 'retrieval-only' (diagnostic, no LLM), or 'disabled' (maintenance mode)
    // MUST be explicitly configured; defaults to 'full' for production safety
    validationMode: process.env.LLM_VALIDATION_MODE || 'full',

    // LLM provider configuration
    provider: process.env.LLM_PROVIDER || 'openai',
    defaultModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',

    // API keys - client-supplied key takes priority (BYOK design)
    // Server-side keys are optional fallbacks for shared deployments
    apiKeys: {
      openai: process.env.OPENAI_API_KEY || null,
      gemini: process.env.GEMINI_API_KEY || null
    },

    // Timeout for LLM generation requests (milliseconds)
    generationTimeoutMs: parseInt(process.env.LLM_GENERATION_TIMEOUT_MS) || 60000,

    // Streaming configuration
    streaming: {
      enabled: true,
      maxTokensPerChunk: parseInt(process.env.LLM_STREAMING_CHUNK_TOKENS) || 50,
      flushIntervalMs: parseInt(process.env.LLM_STREAMING_FLUSH_MS) || 100
    },

    // Token limits for generation
    maxCompletionTokens: parseInt(process.env.LLM_MAX_COMPLETION_TOKENS) || 2048,

    // Validation mode diagnostic output
    validationModeSettings: {
      'full': {
        description: 'Production mode: retrieves knowledge and calls LLM',
        callsLLM: true,
        returnsAnswer: true,
        returnsRetrieval: false
      },
      'retrieval-only': {
        description: 'Diagnostic mode: retrieves knowledge without calling LLM',
        callsLLM: false,
        returnsAnswer: false,
        returnsRetrieval: true
      },
      'disabled': {
        description: 'Maintenance mode: explicitly disabled',
        callsLLM: false,
        returnsAnswer: false,
        returnsRetrieval: false
      }
    }
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