const fs = require("fs/promises");
const path = require("path");

const { loadKnowledgeDocumentsWithReport } = require("./knowledgeService");
const { parseDocuments } = require("./documentParser");
const { generateEmbeddings } = require("./embeddingService");

const {
  ChunkCollectionSchema,
  IndexManifestSchema,
  IndexReportSchema,
  KnowledgeIndexSchema
} = require("../models/contracts");
const { appConfig } = require("../config/appConfig");
const { logger } = require("../lib/logger");

async function readJsonIfPresent(filePath, eventName) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;

    logger.warn(eventName, { filePath, error });
    return null;
  }
}

function priorChunksByDocument(previousIndex, previousManifest) {
  if (
    !previousIndex?.chunks ||
    !Array.isArray(previousIndex.chunks) ||
    !previousManifest ||
    previousManifest.schemaVersion !== appConfig.knowledge.schemaVersion ||
    previousManifest.parserVersion !== appConfig.knowledge.parserVersion ||
    previousManifest.chunkVersion !== appConfig.knowledge.chunkVersion
  ) {
    return new Map();
  }

  const chunksByDocument = new Map();

  previousIndex.chunks.forEach((chunk) => {
    const documentId = chunk?.documentId;
    if (!documentId || !chunk?.metadata?.documentChecksum) return;

    const chunks = chunksByDocument.get(documentId) || [];
    chunks.push(chunk);
    chunksByDocument.set(documentId, chunks);
  });

  return chunksByDocument;
}

function isUnchangedDocument(document, priorChunks) {
  return (
    priorChunks?.length > 0 &&
    priorChunks.every(
      (chunk) =>
        chunk.metadata?.documentChecksum === document.documentChecksum &&
        chunk.metadata?.chunkVersion === appConfig.knowledge.chunkVersion
    )
  );
}

function createManifest(totalDocuments, totalChunks) {
  return IndexManifestSchema.parse({
    schemaVersion: appConfig.knowledge.schemaVersion,
    parserVersion: appConfig.knowledge.parserVersion,
    chunkVersion: appConfig.knowledge.chunkVersion,
    embeddingVersion: appConfig.knowledge.embeddingModel,
    buildTimestamp: new Date().toISOString(),
    totalDocuments,
    totalChunks,
    indexVersion: appConfig.knowledge.indexVersion
  });
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

function finishReport(report, startedAt) {
  return IndexReportSchema.parse({
    ...report,
    elapsedSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(3))
  });
}

/**
 * The only supported indexing service. Unchanged documents retain their
 * already parsed chunks, but all chunks still pass through the current
 * embedding service. The retained metadata is the future extension point for
 * safe embedding reuse when checksum and embedding version both match.
 */
async function buildKnowledgeIndex() {
  const startedAt = Date.now();
  const report = {
    documentsProcessed: 0,
    documentsSkipped: 0,
    documentsUpdated: 0,
    chunksCreated: 0,
    elapsedSeconds: 0,
    errors: [],
    warnings: []
  };

  try {
    logger.info("knowledge.index.build.started");

    const [loadResult, previousIndex, previousManifest] = await Promise.all([
      loadKnowledgeDocumentsWithReport(),
      readJsonIfPresent(appConfig.knowledge.indexFile, "knowledge.index.read.failed"),
      readJsonIfPresent(appConfig.knowledge.manifestFile, "knowledge.manifest.read.failed")
    ]);

    report.errors.push(...loadResult.errors);
    report.warnings.push(...loadResult.warnings);
    report.documentsProcessed = loadResult.documents.length;

    const existingChunks = priorChunksByDocument(previousIndex, previousManifest);
    const chunksToEmbed = [];

    for (const document of loadResult.documents) {
      const priorChunks = existingChunks.get(document.documentId);

      if (isUnchangedDocument(document, priorChunks)) {
        report.documentsSkipped += 1;
        chunksToEmbed.push(...priorChunks);
        continue;
      }

      try {
        const documentChunks = parseDocuments([document]);
        report.documentsUpdated += 1;
        report.chunksCreated += documentChunks.length;
        chunksToEmbed.push(...documentChunks);
      } catch (error) {
        const failure = {
          stage: "document-parse",
          documentId: document.documentId,
          fileName: document.fileName,
          message: error instanceof Error ? error.message : String(error)
        };
        report.errors.push(failure);
        logger.error("knowledge.document.parse.failed", { ...failure, error });

        // Preserve the last valid chunks for this document if available.
        if (priorChunks?.length) {
          chunksToEmbed.push(...priorChunks);
          report.warnings.push({
            stage: "document-parse",
            documentId: document.documentId,
            fileName: document.fileName,
            message: "Retained the last valid chunks after a parsing failure."
          });
        }
      }
    }

    const validatedChunks = ChunkCollectionSchema.parse(chunksToEmbed);
    logger.info("knowledge.index.embeddings.generating", {
      totalChunks: validatedChunks.length,
      documentsProcessed: report.documentsProcessed,
      documentsSkipped: report.documentsSkipped,
      documentsUpdated: report.documentsUpdated
    });

    // Embedding reuse is deliberately deferred. Every current build generates
    // embeddings through the unchanged embedding service.
    const embeddedChunks = await generateEmbeddings(validatedChunks);
    const knowledgeIndex = KnowledgeIndexSchema.parse({
      version: appConfig.knowledge.indexVersion,
      embeddingModel: appConfig.knowledge.embeddingModel,
      generatedAt: new Date().toISOString(),
      totalDocuments: loadResult.documents.length,
      totalChunks: embeddedChunks.length,
      chunks: embeddedChunks
    });
    const manifest = createManifest(
      knowledgeIndex.totalDocuments,
      knowledgeIndex.totalChunks
    );
    const completedReport = finishReport(report, startedAt);

    await writeJson(appConfig.knowledge.indexFile, knowledgeIndex);
    await writeJson(appConfig.knowledge.manifestFile, manifest);
    await writeJson(appConfig.knowledge.reportFile, completedReport);

    logger.info("knowledge.index.build.completed", {
      ...completedReport,
      indexVersion: manifest.indexVersion
    });

    return {
      totalDocuments: knowledgeIndex.totalDocuments,
      totalChunks: knowledgeIndex.totalChunks,
      outputPath: appConfig.knowledge.indexFile,
      manifestPath: appConfig.knowledge.manifestFile,
      reportPath: appConfig.knowledge.reportFile,
      report: completedReport
    };
  } catch (error) {
    report.errors.push({
      stage: "index-build",
      message: error instanceof Error ? error.message : String(error)
    });
    const failedReport = finishReport(report, startedAt);

    try {
      await writeJson(appConfig.knowledge.reportFile, failedReport);
    } catch (reportError) {
      logger.error("knowledge.index.report.write.failed", { error: reportError });
    }

    logger.error("knowledge.index.build.failed", { error, report: failedReport });
    throw error;
  }
}

module.exports = { buildKnowledgeIndex };
