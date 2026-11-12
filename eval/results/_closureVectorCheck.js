const fs = require("node:fs");
const { generateEmbedding } = require("../../services/embeddingService");

function cosine(a, b) {
  if (!a || !b || a.length !== b.length || !a.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

(async () => {
  const index = JSON.parse(fs.readFileSync("data/knowledgeIndex.json", "utf8"));
  const manifest = JSON.parse(fs.readFileSync("data/knowledgeManifest.json", "utf8"));
  const wanted = new Set([
    "Generate and assign a single role",
    "Design Fiori security for an S/4 rollout",
    "Access Control and Process Control",
    "Test and remediate a Process Control",
    "Move a Process Control change through development quality and production",
    "Move configuration through development quality and production",
    "Role transport and business acceptance"
  ]);
  const sample = index.chunks.filter((chunk) => wanted.has(chunk.heading));
  const lengths = new Set(index.chunks.map((chunk) => (Array.isArray(chunk.embedding) ? chunk.embedding.length : 0)));
  console.log(JSON.stringify({
    indexChunks: index.chunks.length,
    headerChunks: index.totalChunks,
    manifestChunks: manifest.totalChunks,
    indexDocuments: index.totalDocuments,
    manifestDocuments: manifest.totalDocuments,
    uniqueSourceFiles: new Set(index.chunks.map((chunk) => chunk.sourceFile)).size,
    model: index.embeddingModel,
    manifestModel: manifest.embeddingVersion,
    dimensions: [...lengths],
    sampled: sample.length
  }));
  let stale = 0;
  for (const chunk of sample) {
    const fresh = await generateEmbedding(chunk.content);
    const score = cosine(fresh, chunk.embedding);
    const ok = score > 0.995;
    if (!ok) stale += 1;
    console.log(`${ok ? "fresh" : "STALE"} ${score.toFixed(4)} ${chunk.sourceFile} | ${chunk.heading}`);
  }
  if (stale) process.exitCode = 1;
  if (index.chunks.length !== manifest.totalChunks) process.exitCode = 1;
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
