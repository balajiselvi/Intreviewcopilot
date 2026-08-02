const { buildKnowledgeIndex } = require("../services/knowledgeIndexService");

const { logger } = require("../lib/logger");

async function buildKnowledge() {
  const result = await buildKnowledgeIndex();

  logger.info("knowledge.compiler.completed", {
    totalDocuments: result.totalDocuments,
    totalChunks: result.totalChunks,
    outputPath: result.outputPath,
    manifestPath: result.manifestPath,
    reportPath: result.reportPath
  });
}

buildKnowledge().catch((error) => {
  logger.error("knowledge.compiler.failed", { error });
  process.exitCode = 1;
});
