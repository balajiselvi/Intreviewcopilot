const crypto = require("node:crypto");
const fs = require("node:fs");
const { generateEmbedding } = require("../../services/embeddingService");

function sectionsOf(file) {
  const markdown = fs.readFileSync(file, "utf8");
  const sections = [];
  for (const block of markdown.split(/^## /m).slice(1)) {
    const breakAt = block.indexOf("\n");
    const heading = block.slice(0, breakAt).trim();
    const body = block.slice(breakAt + 1).trim();
    if (heading && body) sections.push({ heading, body });
  }
  return sections;
}

function sha(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

(async () => {
  const indexPath = "data/knowledgeIndex.json";
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const sourceFile = "fiori-security.md";
  const wanted = new Set([
    "Troubleshoot a user who cannot access a Fiori app",
    "Troubleshoot Fiori access when the server is on premise",
    "Fiori app missing from the launchpad",
    "Fiori app opens and returns an authorization error"
  ]);
  const sibling = index.chunks.find((chunk) => chunk.sourceFile === sourceFile);
  if (!sibling) throw new Error("no fiori sibling");
  const changed = [];
  for (const section of sectionsOf("knowledge/fiori/fiori-security.md")) {
    if (!wanted.has(section.heading)) continue;
    const matches = index.chunks.filter((chunk) => chunk.sourceFile === sourceFile && chunk.heading === section.heading);
    if (matches.length === 1 && matches[0].content === section.body) continue;
    if (matches.length > 1) throw new Error(`multi ${section.heading}`);
    if (matches.length === 1) {
      const checksum = sha(section.body);
      matches[0].content = section.body;
      matches[0].checksum = checksum;
      if (matches[0].metadata) matches[0].metadata.chunkChecksum = checksum;
      changed.push(matches[0]);
      continue;
    }
    const checksum = sha(section.body);
    const id = `chunk_${sha(`${sourceFile}:${section.heading}:${checksum}`)}`;
    const chunk = {
      ...sibling,
      id,
      chunkId: id,
      sourceFile,
      sourceFolder: sibling.sourceFolder,
      heading: section.heading,
      section: section.heading,
      content: section.body,
      checksum,
      embedding: [],
      documentId: sibling.documentId,
      metadata: {
        ...(sibling.metadata || {}),
        chunkId: id,
        documentId: sibling.documentId,
        heading: section.heading,
        sourceFile,
        chunkChecksum: checksum
      }
    };
    index.chunks.push(chunk);
    changed.push(chunk);
    console.log(`added ${section.heading}`);
  }
  for (const chunk of changed) {
    const embedding = await generateEmbedding(chunk.content);
    if (!Array.isArray(embedding) || embedding.length !== 384) throw new Error(`bad vector ${chunk.heading}`);
    chunk.embedding = embedding;
  }
  index.totalChunks = index.chunks.length;
  index.totalDocuments = new Set(index.chunks.map((chunk) => chunk.sourceFile)).size;
  const temporary = `${indexPath}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(index));
  fs.copyFileSync(temporary, indexPath);
  fs.unlinkSync(temporary);
  const manifestPath = "data/knowledgeManifest.json";
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.totalChunks = index.totalChunks;
  manifest.totalDocuments = index.totalDocuments;
  manifest.buildTimestamp = new Date().toISOString();
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({ chunks: index.totalChunks, documents: index.totalDocuments, embedded: changed.length }));
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
