const fs = require("fs");
const { generateEmbedding } = require("../../services/embeddingService");

function cosine(a, b) {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / Math.sqrt(magA * magB);
}

(async () => {
  const index = JSON.parse(fs.readFileSync("data/knowledgeIndex.json", "utf8"));
  const wanted = ["sap-activate.md", "joule-security.md", "car-security.md", "rise-project.md"];
  const picked = [];
  for (const file of wanted) {
    const chunk = index.chunks.find((item) => item.sourceFile === file && /Overview|30 Second/i.test(item.heading || item.section || ""));
    if (chunk) picked.push(chunk);
  }
  const rows = [];
  for (const chunk of picked) {
    const embedding = await generateEmbedding(chunk.content);
    const score = cosine(embedding, chunk.embedding);
    rows.push({
      sourceFile: chunk.sourceFile,
      heading: chunk.heading || chunk.section,
      dim: chunk.embedding.length,
      fresh: score > 0.995,
      score: Number(score.toFixed(4))
    });
    console.log(`${rows.at(-1).fresh ? "fresh" : "STALE"} ${score.toFixed(4)} ${chunk.sourceFile} | ${chunk.heading || chunk.section}`);
  }
  fs.writeFileSync("eval/results/_sampleVectorCheck.json", JSON.stringify(rows, null, 2));
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
