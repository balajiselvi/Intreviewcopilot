const fs = require("fs");
const crypto = require("crypto");
const { generateEmbedding } = require("../../services/embeddingService");
const from = "Confirm the configuration work against that sequence.";
const to = "Confirm the configuration sequence Discover, Prepare, Explore, Realize, Deploy, and Run.";
(async () => {
  const indexPath = "data/knowledgeIndex.json";
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const matches = index.chunks.filter((chunk) => String(chunk.content).includes(from));
  console.log(`matches ${matches.length}`);
  for (const chunk of matches) {
    chunk.content = chunk.content.replace(from, to);
    const checksum = crypto.createHash("sha256").update(chunk.content).digest("hex");
    chunk.checksum = checksum;
    if (chunk.metadata) chunk.metadata.chunkChecksum = checksum;
    chunk.embedding = await generateEmbedding(chunk.content);
    console.log(`embedded ${chunk.sourceFile} | ${chunk.heading} dim ${chunk.embedding.length}`);
  }
  const tmp = `${indexPath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(index));
  fs.copyFileSync(tmp, indexPath);
  fs.unlinkSync(tmp);
  console.log("index updated");
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
