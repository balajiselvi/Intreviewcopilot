const { execFileSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const { generateEmbedding } = require("../../services/embeddingService");

function syncS4Sections(index) {
  const markdown = fs.readFileSync("knowledge/s4hana/s4hana-security.md", "utf8");
  const sections = new Map();
  for (const block of markdown.split(/^## /m).slice(1)) {
    const breakAt = block.indexOf("\n");
    sections.set(block.slice(0, breakAt).trim(), block.slice(breakAt).trim());
  }
  const headings = ["Architecture", "Configuration", "Implementation Activities", "Best Practices", "Troubleshooting: Public Edition app is missing"];
  for (const chunk of index.chunks) {
    if (chunk.sourceFile !== "s4hana-security.md" || !headings.includes(chunk.heading)) continue;
    const body = sections.get(chunk.heading);
    if (!body || chunk.content === body) continue;
    chunk.content = body;
    const checksum = crypto.createHash("sha256").update(body).digest("hex");
    chunk.checksum = checksum;
    if (chunk.metadata) chunk.metadata.chunkChecksum = checksum;
    console.log(`synced ${chunk.heading}`);
  }
}

(async () => {
  const head = JSON.parse(execFileSync("git", ["show", "HEAD:data/knowledgeIndex.json"], { maxBuffer: 120 * 1024 * 1024 }).toString());
  const indexPath = "data/knowledgeIndex.json";
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  syncS4Sections(index);
  const previous = new Map(head.chunks.map((chunk) => [chunk.id, chunk.content]));
  const stale = index.chunks.filter((chunk) => previous.has(chunk.id) && previous.get(chunk.id) !== chunk.content);
  console.log(`stale ${stale.length}`);
  for (const chunk of stale) {
    console.log(`${chunk.sourceFile} | ${chunk.heading}`);
    const embedding = await generateEmbedding(chunk.content);
    if (!Array.isArray(embedding) || embedding.length !== chunk.embedding.length) {
      throw new Error(`embedding length ${embedding && embedding.length} for ${chunk.id}`);
    }
    chunk.embedding = embedding;
  }
  const temporary = `${indexPath}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(index, null, 2));
  fs.renameSync(temporary, indexPath);
  console.log("refreshed");
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
