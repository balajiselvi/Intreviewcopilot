const crypto = require("crypto");
const fs = require("fs");
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

const files = [
  ["greenfield.md", "knowledge/project-types/greenfield.md", "project-types"],
  ["brownfield.md", "knowledge/project-types/brownfield.md", "project-types"],
  ["bluefield.md", "knowledge/project-types/bluefield.md", "project-types"],
  ["security-workstream.md", "knowledge/project-types/security-workstream.md", "project-types"],
  ["cutover-plan.md", "knowledge/cutover/cutover-plan.md", "cutover"],
  ["upgrade.md", "knowledge/project-types/upgrade.md", "project-types"],
  ["migration.md", "knowledge/project-types/migration.md", "project-types"]
];

(async () => {
  const indexPath = "data/knowledgeIndex.json";
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const sample = index.chunks.find((chunk) => chunk.sourceFolder === "project-types") || index.chunks[0];
  const changed = [];
  for (const [sourceFile, file, folder] of files) {
    for (const section of sectionsOf(file)) {
      const matches = index.chunks.filter((chunk) => chunk.sourceFile === sourceFile && (chunk.heading === section.heading || chunk.section === section.heading));
      if (!matches.length) {
        const id = `chunk_${sha(`${sourceFile}:${section.heading}:${sha(section.body)}`)}`;
        const chunk = {
          ...sample,
          id,
          chunkId: id,
          sourceFile,
          sourceFolder: folder,
          heading: section.heading,
          section: section.heading,
          content: section.body,
          checksum: sha(section.body),
          embedding: [],
          metadata: { ...(sample.metadata || {}), chunkId: id, heading: section.heading, sourceFile, sourceFolder: folder, chunkChecksum: sha(section.body) }
        };
        index.chunks.push(chunk);
        changed.push(chunk);
        console.log("added", sourceFile, section.heading);
        continue;
      }
      for (const chunk of matches) {
        const prefixed = String(chunk.content).startsWith("#");
        const next = prefixed ? `## ${section.heading}\n\n${section.body}` : section.body;
        if (chunk.content === next) continue;
        chunk.content = next;
        const checksum = sha(next);
        chunk.checksum = checksum;
        if (chunk.metadata) chunk.metadata.chunkChecksum = checksum;
        changed.push(chunk);
        console.log("updated", sourceFile, section.heading);
      }
    }
  }
  console.log("embed", changed.length);
  for (const chunk of changed) {
    chunk.embedding = await generateEmbedding(chunk.content);
  }
  index.totalChunks = index.chunks.length;
  const tmp = `${indexPath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(index));
  fs.copyFileSync(tmp, indexPath);
  fs.unlinkSync(tmp);
  console.log("index chunks", index.chunks.length);
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
