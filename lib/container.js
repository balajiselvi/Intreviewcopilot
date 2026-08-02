const { z } = require("zod");
const { logger: defaultLogger } = require("./logger");

const ServiceDependencySchema = z.object({
  documentService: z.object({}).passthrough().optional(),
  chunkService: z.object({}).passthrough().optional(),
  embeddingService: z.object({}).passthrough().optional(),
  retrievalService: z.object({}).passthrough().optional(),
  promptService: z.object({}).passthrough().optional(),
  interviewService: z.object({}).passthrough().optional(),
  memoryService: z.object({}).passthrough().optional(),
  webSearchService: z.object({}).passthrough().optional(),
  logger: z.object({
    debug: z.function(),
    info: z.function(),
    warn: z.function(),
    error: z.function()
  }).passthrough().optional()
}).default({});

function createContainer(dependencies = {}) {
  const validated = ServiceDependencySchema.parse(dependencies);

  return Object.freeze({
    ...validated,
    logger: validated.logger || defaultLogger
  });
}

let applicationContainer = null;

function getApplicationContainer() {
  if (applicationContainer) {
    return applicationContainer;
  }

  // Services
  const { generateEmbedding } = require("../services/embeddingService");
  const { expandQuery } = require("./queryExpander");

  const {
    createLocalKnowledgeIndexProvider,
    createRetrievalService
  } = require("../services/retrievalService");

  const provider = createLocalKnowledgeIndexProvider();

  const retrievalService = createRetrievalService({
    provider,
    queryExpander: expandQuery,
    embedder: generateEmbedding,
    logger: defaultLogger
  });

  applicationContainer = createContainer({
    retrievalService
  });

  return applicationContainer;
}

module.exports = {
  createContainer,
  getApplicationContainer,
  ServiceDependencySchema
};