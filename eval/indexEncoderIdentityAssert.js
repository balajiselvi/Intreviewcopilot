const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const config = require(path.join(root, "config", "appConfig"));
const runtime = fs.readFileSync(path.join(root, "services", "embeddingService.js"), "utf8");
const index = JSON.parse(fs.readFileSync(path.join(root, "data", "knowledgeIndex.json"), "utf8"));
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data", "knowledgeManifest.json"), "utf8"));
const modelId = "Xenova/all-MiniLM-L6-v2";

assert.equal(config.knowledge.embeddingModel, modelId);
assert.equal(config.knowledge.embedding.modelId, modelId);
assert.equal(config.knowledge.embedding.dimensionality, 384);
assert.ok(runtime.includes(modelId), "runtime encoder and configured encoder must match");
assert.equal(index.embeddingModel, modelId);
assert.equal(manifest.embeddingVersion, modelId);
assert.equal(index.totalChunks, manifest.totalChunks);
assert.equal(index.chunks.length, manifest.totalChunks);
assert.ok(index.chunks.every((chunk) => chunk.metadata.embeddingVersion === modelId));
assert.ok(index.chunks.every((chunk) => chunk.embedding.length === config.knowledge.embedding.dimensionality));

console.log(`indexEncoderIdentityAssert: PASS (${index.chunks.length} current chunks, ${modelId}, 384 dimensions)`);
