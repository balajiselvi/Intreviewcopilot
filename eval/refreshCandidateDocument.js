const fs = require("node:fs/promises");
const path = require("node:path");
const assert = require("node:assert/strict");
const appConfig = require("../config/appConfig");
const { loadKnowledgeDocumentsWithReport } = require("../services/knowledgeService");
const { parseDocuments } = require("../services/documentParser");
const { generateEmbeddings } = require("../services/embeddingService");

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function writeNew(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2), { flag: "wx" });
}

(async () => {
  const [inputIndexPath, inputManifestPath, inputReportPath, sourceRelativePath, outputDirectory] = process.argv.slice(2);
  assert.ok(inputIndexPath && inputManifestPath && inputReportPath && sourceRelativePath && outputDirectory, "Usage: node eval/refreshCandidateDocument.js <candidate-index> <manifest> <report> <source-relative-path> <new-output-directory>");
  assert.notEqual(path.resolve(inputIndexPath), path.resolve(path.join(outputDirectory, "knowledgeIndex.json")), "output must not overwrite input candidate");
  const [index, manifest, priorReport, loaded] = await Promise.all([
    readJson(inputIndexPath), readJson(inputManifestPath), readJson(inputReportPath), loadKnowledgeDocumentsWithReport()
  ]);
  assert.equal(index.embeddingModel, appConfig.knowledge.embeddingModel);
  assert.equal(manifest.embeddingVersion, appConfig.knowledge.embeddingModel);
  const normalizedTarget = sourceRelativePath.replace(/\\/g, "/");
  const document = loaded.documents.find((item) => {
    const sourcePath = `${item.sourceFolder}/${item.fileName}`.replace(/\\/g, "/");
    return sourcePath === normalizedTarget || `knowledge/${sourcePath}` === normalizedTarget;
  });
  assert.ok(document, `source document not found: ${normalizedTarget}`);
  const targetId = document.documentId;
  const existing = index.chunks.filter((chunk) => chunk.documentId === targetId);
  assert.ok(existing.length, `candidate does not contain target document: ${normalizedTarget}`);
  const currentChunks = parseDocuments([document]);
  assert.ok(currentChunks.length, `source produced no chunks: ${normalizedTarget}`);
  const embedded = await generateEmbeddings(currentChunks);
  assert.ok(embedded.every((chunk) => chunk.embedding?.length === appConfig.knowledge.embedding.dimensionality));
  assert.ok(embedded.every((chunk) => chunk.metadata?.embeddingVersion === appConfig.knowledge.embeddingModel));

  const firstIndex = index.chunks.findIndex((chunk) => chunk.documentId === targetId);
  const chunks = index.chunks.filter((chunk) => chunk.documentId !== targetId);
  chunks.splice(firstIndex, 0, ...embedded);
  const nextIndex = { ...index, generatedAt: new Date().toISOString(), totalChunks: chunks.length, chunks };
  const nextManifest = { ...manifest, buildTimestamp: new Date().toISOString(), totalDocuments: loaded.documents.length, totalChunks: chunks.length };
  const nextReport = {
    ...priorReport,
    documentsProcessed: loaded.documents.length,
    documentsSkipped: loaded.documents.length - 1,
    documentsUpdated: 1,
    chunksCreated: embedded.length,
    elapsedSeconds: 0,
    errors: loaded.errors || [],
    warnings: loaded.warnings || []
  };
  const out = path.resolve(outputDirectory);
  await writeNew(path.join(out, "knowledgeIndex.json"), nextIndex);
  await writeNew(path.join(out, "knowledgeManifest.json"), nextManifest);
  await writeNew(path.join(out, "knowledgeReport.json"), nextReport);
  console.log(JSON.stringify({ outputDirectory: out, source: normalizedTarget, sourceChecksum: document.documentChecksum, oldChunks: existing.length, refreshedChunks: embedded.length, totalChunks: chunks.length, encoder: index.embeddingModel, errors: nextReport.errors.length }, null, 2));
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
