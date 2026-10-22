const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const indexPath = path.resolve(process.argv[2] || "data/index-rebuild-iag-20261021/knowledgeIndex.json");
const manifestPath = path.resolve(process.argv[3] || "data/index-rebuild-iag-20261021/knowledgeManifest.json");
const reportPath = path.resolve(process.argv[4] || "data/index-rebuild-iag-20261021/knowledgeReport.json");
const digest = (value) => crypto.createHash("sha256").update(value).digest("hex");
const cosine = (left, right) => {
  const dot = left.reduce((sum, value, index) => sum + value * right[index], 0);
  const leftNorm = Math.sqrt(left.reduce((sum, value) => sum + value * value, 0));
  const rightNorm = Math.sqrt(right.reduce((sum, value) => sum + value * value, 0));
  return dot / (leftNorm * rightNorm);
};

(async () => {
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const originalLog = console.log;
  console.log = () => {};
  const { loadKnowledgeDocumentsWithReport } = require("../services/knowledgeService");
  const { generateEmbedding } = require("../services/embeddingService");
  const loaded = await loadKnowledgeDocumentsWithReport();
  console.log = originalLog;

  const sources = new Map(loaded.documents.map((document) => [document.documentId, document]));
  const indexed = new Map();
  for (const chunk of index.chunks) {
    assert.equal(chunk.embedding?.length, 384, `vector dimensions: ${chunk.sourceFile}`);
    assert.equal(chunk.metadata?.embeddingVersion, "Xenova/all-MiniLM-L6-v2", `encoder metadata: ${chunk.sourceFile}`);
    assert.equal(chunk.metadata?.chunkChecksum, digest(chunk.content), `chunk checksum: ${chunk.sourceFile}`);
    const record = indexed.get(chunk.documentId) || { checksum: chunk.metadata?.documentChecksum, chunks: 0, sourceFile: chunk.sourceFile };
    assert.equal(record.checksum, chunk.metadata?.documentChecksum, `document checksum consistency: ${chunk.sourceFile}`);
    record.chunks += 1;
    indexed.set(chunk.documentId, record);
  }

  const missing = [...sources].filter(([id]) => !indexed.has(id));
  const missingNonEmpty = missing.filter(([, document]) => document.content.trim().length > 0);
  const stale = [...indexed].filter(([id, entry]) => sources.get(id)?.documentChecksum !== entry.checksum);
  const obsolete = [...indexed.keys()].filter((id) => !sources.has(id));
  const reportErrors = report.errors || [];
  assert.equal(index.totalChunks, index.chunks.length);
  assert.equal(manifest.totalChunks, index.chunks.length);
  assert.equal(manifest.totalDocuments, index.totalDocuments);
  assert.equal(index.embeddingModel, "Xenova/all-MiniLM-L6-v2");
  assert.equal(manifest.embeddingVersion, index.embeddingModel);
  assert.equal(reportErrors.length, 0);
  assert.equal(stale.length, 0);
  assert.equal(obsolete.length, 0);
  assert.equal(missingNonEmpty.length, 0, `non-empty source docs missing from candidate: ${missingNonEmpty.map(([, d]) => d.fileName).join(", ")}`);

  const sample = index.chunks.filter((chunk, position) => position % Math.ceil(index.chunks.length / 12) === 0).slice(0, 12);
  const similarities = [];
  for (const chunk of sample) similarities.push(cosine(chunk.embedding, await generateEmbedding(chunk.content)));
  assert.ok(similarities.every((score) => score > 0.99999), `sample vector mismatch: ${similarities.join(",")}`);

  originalLog(JSON.stringify({
    status: "PASS",
    sourceDocuments: sources.size,
    indexedDocuments: indexed.size,
    chunks: index.chunks.length,
    missingSourceDocuments: missing.length,
    missingEmptyDocuments: missing.filter(([, document]) => !document.content.trim()).length,
    missingNonEmptyDocuments: missingNonEmpty.length,
    staleDocuments: stale.length,
    obsoleteDocuments: obsolete.length,
    vectorDimensions: 384,
    encoder: index.embeddingModel,
    recomputedSampleCount: sample.length,
    minimumSampleCosine: Math.min(...similarities),
    buildErrors: reportErrors.length
  }, null, 2));
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
