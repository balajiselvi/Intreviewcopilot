const crypto = require("node:crypto");
const fs = require("node:fs");
const { generateEmbedding } = require("../../services/embeddingService");

function sectionsOf(file) {
  const markdown = fs.readFileSync(file, "utf8");
  const sections = [];
  for (const block of markdown.split(/^## /m).slice(1)) {
    const breakAt = block.indexOf("\n");
    sections.push({ heading: block.slice(0, breakAt).trim(), body: block.slice(breakAt).trim() });
  }
  return sections;
}

function sha(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

(async () => {
  const indexPath = "data/knowledgeIndex.json";
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const files = [
    ["car-security.md", "knowledge/lob/car-security.md"],
    ["sac-security.md", "knowledge/sac/sac-security.md"],
    ["joule-security.md", "knowledge/btp/joule-security.md"]
  ];
  const changed = [];
  for (const [sourceFile, path] of files) {
    const sections = sectionsOf(path);
    const sample = index.chunks.find((chunk) => chunk.sourceFolder === "btp") || index.chunks[0];
    for (const section of sections) {
      const matches = index.chunks.filter((chunk) => chunk.sourceFile === sourceFile && chunk.heading === section.heading);
      if (matches.length === 1 && matches[0].content !== section.body) {
        matches[0].content = section.body;
        const checksum = sha(section.body);
        matches[0].checksum = checksum;
        if (matches[0].metadata) matches[0].metadata.chunkChecksum = checksum;
        changed.push(matches[0]);
        console.log(`updated ${sourceFile} | ${section.heading}`);
      } else if (!matches.length) {
        const checksum = sha(section.body);
        const id = `chunk_${sha(`${sourceFile}:${section.heading}:${checksum}`)}`;
        const chunk = {
          ...sample,
          id,
          chunkId: id,
          sourceFile,
          sourceFolder: sourceFile === "joule-security.md" ? "btp" : (sourceFile === "car-security.md" ? "lob" : "sac"),
          heading: section.heading,
          section: section.heading,
          content: section.body,
          checksum,
          embedding: [],
          metadata: {
            ...(sample.metadata || {}),
            chunkId: id,
            heading: section.heading,
            sourceFile,
            chunkChecksum: checksum
          }
        };
        index.chunks.push(chunk);
        changed.push(chunk);
        console.log(`added ${sourceFile} | ${section.heading}`);
      }
    }
  }
  for (const chunk of index.chunks) {
    if (chunk.sourceFile === "sac-security.md" && String(chunk.content).includes("Team Area")) {
      chunk.content = chunk.content.replaceAll("Team Area", "team folder");
      const checksum = sha(chunk.content);
      chunk.checksum = checksum;
      if (chunk.metadata) chunk.metadata.chunkChecksum = checksum;
      if (!changed.includes(chunk)) changed.push(chunk);
      console.log(`renamed ${chunk.heading}`);
    }
  }
  console.log(`embed ${changed.length}`);
  for (const chunk of changed) {
    const embedding = await generateEmbedding(chunk.content);
    if (embedding.length !== 384) throw new Error(`length ${embedding.length}`);
    chunk.embedding = embedding;
  }
  index.totalChunks = index.chunks.length;
  const temporary = `${indexPath}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(index, null, 2));
  fs.renameSync(temporary, indexPath);
  console.log(`indexChunks ${index.totalChunks}`);
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
