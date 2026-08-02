const { z } = require("zod");

const NonEmptyString = z.string().trim().min(1);

/**
 * Canonical document extracted from a knowledge source.
 */
const DocumentSchema = z.object({
  id: NonEmptyString,
  documentId: NonEmptyString,
  documentChecksum: NonEmptyString,
  checksum: NonEmptyString,
  version: NonEmptyString,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  source: NonEmptyString,
  category: NonEmptyString,
  fileName: NonEmptyString,
  filePath: NonEmptyString,
  sourceFolder: NonEmptyString,
  extension: z.string(),
  size: z.number().int().nonnegative(),
  wordCount: z.number().int().nonnegative(),
  characterCount: z.number().int().nonnegative(),
  content: z.string(),
  metadata: z.object({
    documentId: NonEmptyString,
    documentChecksum: NonEmptyString,
    parserVersion: NonEmptyString,
    schemaVersion: NonEmptyString
  })
});

/**
 * Canonical retrieval unit derived from a document.
 */
const ChunkSchema = z.object({
  id: NonEmptyString,
  chunkId: NonEmptyString,
  documentId: NonEmptyString,
  chunkIndex: z.number().int().positive(),
  heading: NonEmptyString,
  pageNumber: z.number().int().positive().nullable(),
  tokenEstimate: z.number().int().nonnegative(),
  checksum: NonEmptyString,
  sourceFile: NonEmptyString,
  sourceFolder: NonEmptyString,
  extension: z.string(),
  chunkNumber: z.number().int().positive(),
  section: NonEmptyString,
  content: NonEmptyString,
  metadata: z.object({
    chunkId: NonEmptyString,
    documentId: NonEmptyString,
    chunkChecksum: NonEmptyString,
    documentChecksum: NonEmptyString,
    chunkVersion: NonEmptyString,
    embeddingVersion: NonEmptyString
  })
});

const EmbeddingSchema = z.object({
  model: NonEmptyString,
  vector: z.array(z.number()).min(1)
});

const EmbeddedChunkSchema = ChunkSchema.extend({
  embedding: z.array(z.number()).min(1)
});

const SearchResultSchema = EmbeddedChunkSchema.extend({
  semanticScore: z.number().optional(),
  lexicalScore: z.number().optional(),
  componentScore: z.number().optional(),
  intentScore: z.number().optional(),
  score: z.number().optional(),
  rerankScore: z.number().optional()
});

const ConversationTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: NonEmptyString,
  timestamp: z.string().datetime().optional()
});

const ChatRequestSchema = z.object({
  apiKey: NonEmptyString,
  model: NonEmptyString,
  question: NonEmptyString,
  history: z.array(ConversationTurnSchema).default([]),
  customInstructions: z.string().optional(),
  responseLength: z.enum(["concise", "medium", "lengthy"]).optional()
});

const ChatResponseSchema = z.object({
  text: z.string(),
  done: z.boolean(),
  requestId: z.string().optional()
});

const KnowledgeMetadataSchema = z.object({
  version: z.number().int().positive(),
  embeddingModel: NonEmptyString,
  generatedAt: z.string().datetime(),
  totalDocuments: z.number().int().nonnegative(),
  totalChunks: z.number().int().nonnegative()
});

const IndexManifestSchema = z.object({
  schemaVersion: NonEmptyString,
  parserVersion: NonEmptyString,
  chunkVersion: NonEmptyString,
  embeddingVersion: NonEmptyString,
  buildTimestamp: z.string().datetime(),
  totalDocuments: z.number().int().nonnegative(),
  totalChunks: z.number().int().nonnegative(),
  indexVersion: z.number().int().positive()
});

const IndexReportSchema = z.object({
  documentsProcessed: z.number().int().nonnegative(),
  documentsSkipped: z.number().int().nonnegative(),
  documentsUpdated: z.number().int().nonnegative(),
  chunksCreated: z.number().int().nonnegative(),
  elapsedSeconds: z.number().nonnegative(),
  errors: z.array(z.object({
    stage: NonEmptyString,
    message: NonEmptyString,
    documentId: z.string().optional(),
    fileName: z.string().optional()
  })),
  warnings: z.array(z.object({
    stage: NonEmptyString,
    message: NonEmptyString,
    documentId: z.string().optional(),
    fileName: z.string().optional()
  }))
});

const KnowledgeIndexSchema = KnowledgeMetadataSchema.extend({
  chunks: z.array(EmbeddedChunkSchema)
});

const DocumentCollectionSchema = z.array(DocumentSchema);
const ChunkCollectionSchema = z.array(ChunkSchema);
const EmbeddedChunkCollectionSchema = z.array(EmbeddedChunkSchema);

const QueryAnalysisSchema = z.object({
  domain: z.string().optional(),
  intent: z.string().optional()
}).passthrough();

const RetrievalMetadataFiltersSchema = z.object({
  documentType: z.string().optional(),
  sapModule: z.string().optional(),
  category: z.string().optional(),
  documentVersion: z.string().optional(),
  source: z.string().optional()
}).passthrough();

const QuerySchema = z.object({
  question: NonEmptyString,
  analysis: QueryAnalysisSchema.default({}),
  topK: z.number().int().positive().default(8),
  metadataFilters: RetrievalMetadataFiltersSchema.default({})
});

const ExpandedQuerySchema = z.object({
  question: NonEmptyString,
  queries: z.array(NonEmptyString).min(1)
});

// This remains compatible with the pre-Module 2 knowledge-index shape.
const RetrievedChunkSchema = z.object({
  id: NonEmptyString,
  sourceFile: NonEmptyString,
  sourceFolder: z.string(),
  extension: z.string(),
  chunkNumber: z.number().int().positive(),
  section: z.string(),
  content: NonEmptyString,
  embedding: z.array(z.number()).min(1),
  documentId: z.string().optional(),
  chunkId: z.string().optional(),
  metadata: z.object({}).passthrough().optional()
}).passthrough();

const RankedChunkSchema = RetrievedChunkSchema.extend({
  semanticScore: z.number(),
  lexicalScore: z.number(),
  componentScore: z.number(),
  intentScore: z.number(),
  score: z.number()
});

const EvidenceSetSchema = z.object({
  chunks: z.array(RankedChunkSchema),
  metadataFilters: RetrievalMetadataFiltersSchema
});

const RetrievalDiagnosticsSchema = z.object({
  retrievalVersion: NonEmptyString,
  retrievalTime: z.number().nonnegative(),
  embeddingTime: z.number().nonnegative(),
  rankingTime: z.number().nonnegative(),
  candidateCount: z.number().int().nonnegative(),
  returnedChunkCount: z.number().int().nonnegative(),
  averageSimilarity: z.number(),
  topSimilarity: z.number(),
  topDocumentId: z.string().nullable(),
  topChunkId: z.string().nullable()
});

const RetrievalResultSchema = z.object({
  query: QuerySchema,
  expandedQuery: ExpandedQuerySchema,
  chunks: z.array(RankedChunkSchema),
  evidence: EvidenceSetSchema,
  diagnostics: RetrievalDiagnosticsSchema
});

const RetrievalBenchmarkSchema = z.object({
  retrievalVersion: NonEmptyString,
  sampleCount: z.number().int().nonnegative(),
  averageRetrievalTime: z.number().nonnegative(),
  p50RetrievalLatency: z.number().nonnegative(),
  p95RetrievalLatency: z.number().nonnegative(),
  averageCandidateCount: z.number().nonnegative(),
  averageReturnedChunkCount: z.number().nonnegative(),
  memoryUsageBytes: z.object({
    before: z.number().nonnegative(),
    after: z.number().nonnegative(),
    delta: z.number()
  }).nullable()
});

const StageHealthSchema = z.object({
  status: z.enum(["ok", "degraded", "unavailable"]),
  version: NonEmptyString
}).passthrough();

const ResumeContextSchema = z.object({
  content: z.string(),
  source: z.string(),
  version: NonEmptyString
});

const JobDescriptionContextSchema = z.object({
  content: z.string(),
  source: z.string(),
  version: NonEmptyString
});

const CompanyProfileSchema = z.object({
  name: z.string(),
  context: z.string(),
  source: z.string(),
  version: NonEmptyString
});

const InterviewProfileSchema = z.object({
  interviewer: z.string(),
  expectation: z.string(),
  answerStyle: z.string(),
  technicalDepth: z.string(),
  preferredFocus: z.array(z.string()),
  avoid: z.array(z.string()),
  expectedFollowUps: z.array(z.string()),
  version: NonEmptyString
}).passthrough();

const ConversationContextSchema = z.object({
  turns: z.array(ConversationTurnSchema),
  version: NonEmptyString
});

const ContextObjectSchema = z.object({
  question: NonEmptyString,
  analysis: QueryAnalysisSchema,
  resume: ResumeContextSchema,
  jobDescription: JobDescriptionContextSchema,
  company: CompanyProfileSchema,
  conversation: ConversationContextSchema,
  interviewProfile: InterviewProfileSchema,
  evidence: EvidenceSetSchema,
  knowledgeContext: z.string(),
  version: NonEmptyString
});

const ConfidenceReportSchema = z.object({
  score: z.number().min(0).max(1),
  level: z.enum(["high", "medium", "low"]),
  reasons: z.array(z.string()),
  version: NonEmptyString
});

const InterviewTimingSchema = z.object({
  total: z.number().nonnegative(),
  stages: z.record(z.number().nonnegative())
});

const InterviewResultSchema = z.object({
  answer: z.string(),
  confidence: ConfidenceReportSchema,
  evidence: EvidenceSetSchema,
  diagnostics: z.object({
    retrieval: RetrievalDiagnosticsSchema,
    validation: z.object({
      score: z.number(),
      issues: z.array(z.string()),
      regenerate: z.boolean()
    }),
    stageVersions: z.record(NonEmptyString)
  }),
  timing: InterviewTimingSchema
});

module.exports = {
  DocumentSchema,
  ChunkSchema,
  EmbeddingSchema,
  EmbeddedChunkSchema,
  SearchResultSchema,
  ConversationTurnSchema,
  ChatRequestSchema,
  ChatResponseSchema,
  KnowledgeMetadataSchema,
  IndexManifestSchema,
  IndexReportSchema,
  KnowledgeIndexSchema,
  DocumentCollectionSchema,
  ChunkCollectionSchema,
  EmbeddedChunkCollectionSchema,
  QueryAnalysisSchema,
  RetrievalMetadataFiltersSchema,
  QuerySchema,
  ExpandedQuerySchema,
  RetrievedChunkSchema,
  RankedChunkSchema,
  EvidenceSetSchema,
  RetrievalDiagnosticsSchema,
  RetrievalResultSchema,
  RetrievalBenchmarkSchema,
  StageHealthSchema,
  ResumeContextSchema,
  JobDescriptionContextSchema,
  CompanyProfileSchema,
  InterviewProfileSchema,
  ConversationContextSchema,
  ContextObjectSchema,
  ConfidenceReportSchema,
  InterviewTimingSchema,
  InterviewResultSchema
};
