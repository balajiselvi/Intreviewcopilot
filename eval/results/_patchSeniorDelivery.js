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
  const backup = "data/index-staged/knowledgeIndex.before-senior-delivery.json";
  fs.mkdirSync("data/index-staged", { recursive: true });
  if (!fs.existsSync(backup)) fs.copyFileSync(indexPath, backup);
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const files = [
    ["senior-consultant-delivery.md", "knowledge/project-management/senior-consultant-delivery.md", "project-management"],
    ["process-control.md", "knowledge/grc/process-control.md", "grc"]
  ];
  const changed = [];
  for (const [sourceFile, path, folderHint] of files) {
    const sibling = index.chunks.find((chunk) => chunk.sourceFile === sourceFile)
      || index.chunks.find((chunk) => String(chunk.sourceFolder || "").toLowerCase() === folderHint);
    if (!sibling) throw new Error(`no sibling for ${folderHint}`);
    for (const section of sectionsOf(path)) {
      const matches = index.chunks.filter((chunk) => chunk.sourceFile === sourceFile && chunk.heading === section.heading);
      if (matches.length === 1 && matches[0].content === section.body) continue;
      if (matches.length > 1) {
        console.log(`skip multi ${sourceFile} | ${section.heading}`);
        continue;
      }
      if (matches.length === 1) {
        matches[0].content = section.body;
        const checksum = sha(section.body);
        matches[0].checksum = checksum;
        if (matches[0].metadata) matches[0].metadata.chunkChecksum = checksum;
        changed.push(matches[0]);
        console.log(`updated ${sourceFile} | ${section.heading}`);
        continue;
      }
      const checksum = sha(section.body);
      const id = `chunk_${sha(`${sourceFile}:${section.heading}:${checksum}`)}`;
      const chunk = {
        ...sibling,
        id,
        chunkId: id,
        sourceFile,
        sourceFolder: sibling.sourceFolder || folderHint,
        heading: section.heading,
        section: section.heading,
        content: section.body,
        checksum,
        embedding: [],
        documentId: sibling.sourceFile === sourceFile ? sibling.documentId : `doc_${sha(sourceFile)}`,
        metadata: {
          ...(sibling.metadata || {}),
          chunkId: id,
          documentId: sibling.sourceFile === sourceFile ? sibling.documentId : `doc_${sha(sourceFile)}`,
          heading: section.heading,
          sourceFile,
          chunkChecksum: checksum
        }
      };
      index.chunks.push(chunk);
      changed.push(chunk);
      console.log(`added ${sourceFile} | ${section.heading} folder=${chunk.sourceFolder}`);
    }
  }
  console.log(`embed ${changed.length}`);
  for (const chunk of changed) {
    const embedding = await generateEmbedding(chunk.content);
    if (!Array.isArray(embedding) || embedding.length !== 384) {
      throw new Error(`length ${embedding && embedding.length} ${chunk.sourceFile} ${chunk.heading}`);
    }
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
  console.log(JSON.stringify({
    indexChunks: index.totalChunks,
    manifestChunks: manifest.totalChunks,
    documents: index.totalDocuments,
    embedded: changed.length,
    dimensions: changed.map((chunk) => chunk.embedding.length)
  }));
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
