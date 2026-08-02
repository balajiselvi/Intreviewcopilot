const path = require("path");

const appConfig = Object.freeze({
  knowledge: Object.freeze({
    sourceDirectory: path.join(process.cwd(), "knowledge"),
    indexFile: path.join(process.cwd(), "data", "knowledge-index.json"),
    manifestFile: path.join(process.cwd(), "data", "index-manifest.json"),
    reportFile: path.join(process.cwd(), "data", "index-report.json"),
    source: "knowledge",
    indexVersion: 1,
    embeddingModel: "Xenova/all-MiniLM-L6-v2",
    schemaVersion: "1.0.0",
    parserVersion: "1.0.0",
    chunkVersion: "1.0.0",
    documentVersion: "1.0.0"
  }),
  chunking: Object.freeze({
    maxChunkSize: 700,
    minChunkSize: 150
  }),
  retrieval: Object.freeze({
    version: "2.0.0",
    defaultTopK: 8,
    provider: "local-knowledge-index",
    weights: Object.freeze({
      semantic: 0.55,
      lexical: 0.20,
      component: 0.15,
      intent: 0.10
    }),
    metadataFields: Object.freeze([
      "documentType",
      "sapModule",
      "category",
      "documentVersion",
      "source"
    ])
  }),
  orchestrator: Object.freeze({
    version: "1.0.0",
    maxHistoryItems: 6,
    stages: Object.freeze({
      intentAnalyzer: "1.0.0",
      planning: "1.0.0",
      resumeContext: "1.0.0",
      jobDescriptionContext: "1.0.0",
      companyContext: "1.0.0",
      conversationContext: "1.0.0",
      interviewerProfile: "1.0.0",
      retrieval: "1.0.0",
      contextBuilder: "1.0.0",
      prompt: "1.0.0",
      llm: "1.0.0",
      sapValidation: "1.0.0",
      confidence: "1.0.0",
      responseAssembler: "1.0.0"
    })
  }),
  logging: Object.freeze({
    service: "interview-copilot",
    level: process.env.LOG_LEVEL || "info"
  })
});

module.exports = { appConfig };
