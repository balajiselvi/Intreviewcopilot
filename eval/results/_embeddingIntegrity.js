const { execFileSync } = require("node:child_process");
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
  const lengths = new Set(index.chunks.map((chunk) => (Array.isArray(chunk.embedding) ? chunk.embedding.length : 0)));
  const head = JSON.parse(execFileSync("git", ["show", "HEAD:data/knowledgeIndex.json"], { maxBuffer: 120 * 1024 * 1024 }).toString());
  const previous = new Map(head.chunks.map((chunk) => [chunk.id, chunk.content]));
  const changed = index.chunks.filter((chunk) => previous.has(chunk.id) && previous.get(chunk.id) !== chunk.content);
  const fiori = index.chunks.filter((chunk) => chunk.sourceFile === "fiori-security.md");
  const sample = [
    ...changed,
    ...fiori.filter((_, index) => index % Math.ceil(fiori.length / 6) === 0).slice(0, 6)
  ];
  const unique = [];
  const seen = new Set();
  for (const chunk of sample) {
    if (seen.has(chunk.id)) continue;
    seen.add(chunk.id);
    unique.push(chunk);
  }
  console.log(JSON.stringify({
    indexChunks: index.chunks.length,
    manifestChunks: manifest.totalChunks,
    indexModel: index.embeddingModel,
    manifestModel: manifest.embeddingVersion,
    manifestTimestamp: manifest.buildTimestamp,
    dimensions: [...lengths],
    sameIdContentChanges: changed.length,
    fioriChunks: fiori.length,
    sampled: unique.length
  }));
  let stale = 0;
  for (const chunk of unique) {
    const embedding = await generateEmbedding(chunk.content);
    const score = cosine(embedding, chunk.embedding);
    const fresh = score > 0.995;
    if (!fresh) stale += 1;
    console.log(`${fresh ? "fresh" : "STALE"} ${score.toFixed(4)} ${chunk.sourceFile} | ${chunk.heading}`);
  }
  console.log(`staleSamples ${stale}`);
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
