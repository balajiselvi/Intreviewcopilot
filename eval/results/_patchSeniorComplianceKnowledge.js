const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { generateEmbedding } = require("../../services/embeddingService");

const FILES = [
  { file: "knowledge/grc/msmp.md", sourceFile: "msmp.md", sourceFolder: "grc", wanted: new Set([
    "Configure an MSMP workflow for an access request",
    "Troubleshoot an MSMP access request with no approver",
    "Technical Configuration Sequence"
  ]) },
  { file: "knowledge/grc/brf-plus.md", sourceFile: "brf-plus.md", sourceFolder: "grc", wanted: new Set([
    "Configure a BRFplus agent rule for MSMP",
    "Configure a BRFplus initiator rule for MSMP"
  ]) },
  { file: "knowledge/compliance/sox.md", sourceFile: "sox.md", sourceFolder: "compliance" },
  { file: "knowledge/compliance/gdpr.md", sourceFile: "gdpr.md", sourceFolder: "compliance" },
  { file: "knowledge/compliance/iso27001.md", sourceFile: "iso27001.md", sourceFolder: "compliance" },
  { file: "knowledge/compliance/compliance.md", sourceFile: "compliance.md", sourceFolder: "compliance" },
  { file: "knowledge/compliance/risk-mitigation.md", sourceFile: "risk-mitigation.md", sourceFolder: "compliance" }
];

function sha(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

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

function siblingTemplate(index, sourceFolder, sourceFile) {
  return index.chunks.find((chunk) => chunk.sourceFile === sourceFile)
    || index.chunks.find((chunk) => chunk.sourceFolder === sourceFolder)
    || index.chunks.find((chunk) => chunk.sourceFolder === "grc");
}

(async () => {
  const indexPath = "data/knowledgeIndex.json";
  const backupDir = "data/index-staged";
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, "knowledgeIndex.before-senior-compliance.json");
  if (!fs.existsSync(backupPath)) fs.copyFileSync(indexPath, backupPath);

  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const changed = [];

  for (const entry of FILES) {
    const markdown = fs.readFileSync(entry.file, "utf8");
    const documentChecksum = sha(markdown);
    const documentId = `doc_${sha(`${entry.sourceFolder}/${entry.sourceFile}:${documentChecksum}`)}`;
    const template = siblingTemplate(index, entry.sourceFolder, entry.sourceFile);
    if (!template) throw new Error(`no template for ${entry.sourceFile}`);
    let chunkNumber = 0;
    for (const section of sectionsOf(entry.file)) {
      if (entry.wanted && !entry.wanted.has(section.heading)) continue;
      chunkNumber += 1;
      const checksum = sha(section.body);
      const id = `chunk_${sha(`${entry.sourceFile}:${section.heading}:${checksum}`)}`;
      const existing = index.chunks.find((chunk) => chunk.sourceFile === entry.sourceFile && chunk.heading === section.heading);
      if (existing && existing.content === section.body && Array.isArray(existing.embedding) && existing.embedding.length === 384) continue;
      if (existing) {
        existing.content = section.body;
        existing.checksum = checksum;
        existing.documentId = documentId;
        existing.sourceFolder = entry.sourceFolder;
        existing.embedding = [];
        if (existing.metadata) {
          existing.metadata.chunkChecksum = checksum;
          existing.metadata.documentId = documentId;
          existing.metadata.documentChecksum = documentChecksum;
        }
        changed.push(existing);
        continue;
      }
      const chunk = {
        ...template,
        id,
        chunkId: id,
        documentId,
        chunkIndex: chunkNumber - 1,
        heading: section.heading,
        pageNumber: null,
        tokenEstimate: Math.max(1, Math.round(section.body.split(/\s+/).length * 1.3)),
        checksum,
        sourceFile: entry.sourceFile,
        sourceFolder: entry.sourceFolder,
        extension: ".md",
        chunkNumber,
        section: section.heading,
        content: section.body,
        embedding: [],
        metadata: {
          chunkId: id,
          documentId,
          chunkChecksum: checksum,
          documentChecksum,
          chunkVersion: checksum.slice(0, 12),
          embeddingVersion: "text-embedding-3-small",
          heading: section.heading,
          sourceFile: entry.sourceFile
        }
      };
      index.chunks.push(chunk);
      changed.push(chunk);
      console.log(`added ${entry.sourceFile} | ${section.heading}`);
    }
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
  try {
    fs.copyFileSync(temporary, indexPath);
    fs.unlinkSync(temporary);
  } catch (error) {
    console.error("copy retry needed", error.message);
  }

  const manifest = JSON.parse(fs.readFileSync("data/knowledgeManifest.json", "utf8"));
  manifest.totalChunks = index.totalChunks;
  manifest.totalDocuments = index.totalDocuments;
  manifest.buildTimestamp = new Date().toISOString();
  fs.writeFileSync("data/knowledgeManifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({ chunks: index.totalChunks, documents: index.totalDocuments, embedded: changed.length, backup: backupPath }));
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
