/**
 * Patch knowledgeIndex.json with dense IAG vs GRC Access Control comparison chunks.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.join(__dirname, "../..");
const indexPath = path.join(root, "data/knowledgeIndex.json");
const bankPath = path.join(root, "knowledge/iag/iag-cloud-identity-access-governance-architect-bank.md");
const overviewPath = path.join(root, "knowledge/iag/iag-overview.md");

function sectionFrom(md, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`## ${escaped}\\r?\\n([\\s\\S]*?)(?=\\r?\\n## |$)`);
  const m = md.match(re);
  if (!m) throw new Error(`missing section: ${heading}`);
  return (`## ${heading}\n\n${m[1].trim()}`).trim();
}

function upsertChunk(index, { sourceFile, sourceFolder, heading, content }) {
  const existing = (index.chunks || []).filter(
    (c) => (c.sourceFile === sourceFile || c.metadata?.sourceFile === sourceFile)
      && (c.heading === heading || c.section === heading)
  );
  if (existing.length) {
    for (const chunk of existing) chunk.content = content;
    return { updated: existing.length, inserted: 0 };
  }
  const id = `chunk_${crypto.createHash("sha256").update(heading + content).digest("hex").slice(0, 32)}`;
  index.chunks.push({
    id,
    chunkId: id,
    documentId: `doc_iag_cmp_${id.slice(0, 12)}`,
    chunkIndex: (index.chunks?.length || 0) + 1,
    heading,
    pageNumber: null,
    tokenEstimate: Math.ceil(content.split(/\s+/).length * 1.3),
    checksum: crypto.createHash("sha256").update(content).digest("hex").slice(0, 40),
    sourceFile,
    sourceFolder,
    extension: ".md",
    chunkNumber: (index.chunks?.length || 0) + 1,
    section: heading,
    content,
    metadata: {
      chunkId: id,
      sourceFile,
      sourceFolder,
      heading,
      topic: "iag-vs-grc"
    }
  });
  return { updated: 0, inserted: 1 };
}

const bank = fs.readFileSync(bankPath, "utf8");
const overview = fs.readFileSync(overviewPath, "utf8");
const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));

const targets = [
  {
    sourceFile: "iag-cloud-identity-access-governance-architect-bank.md",
    sourceFolder: "iag",
    heading: "Q11: What is SAP Cloud IAG and how does it differ from SAP GRC Access Control?",
    content: sectionFrom(bank, "Q11: What is SAP Cloud IAG and how does it differ from SAP GRC Access Control?")
  },
  {
    sourceFile: "iag-overview.md",
    sourceFolder: "iag",
    heading: "IAG vs GRC Access Control 12.0 — technical boundaries (no analogies)",
    content: sectionFrom(overview, "IAG vs GRC Access Control 12.0 — technical boundaries \\(no analogies\\)".replace(/\\/g, ""))
  }
];

// Fix overview heading match without over-escaping
targets[1].heading = "IAG vs GRC Access Control 12.0 — technical boundaries (no analogies)";
targets[1].content = sectionFrom(overview, targets[1].heading);

let updated = 0;
let inserted = 0;
for (const t of targets) {
  const r = upsertChunk(index, t);
  updated += r.updated;
  inserted += r.inserted;
}

if (typeof index.totalChunks === "number") {
  index.totalChunks = index.chunks.length;
}
fs.writeFileSync(indexPath, JSON.stringify(index));
const blob = JSON.stringify(index);
console.log(JSON.stringify({
  updated,
  inserted,
  hasMsmp: blob.includes("MSMP"),
  hasBridge: blob.includes("IAG Bridge"),
  hasQ11: blob.includes("how does it differ from SAP GRC Access Control"),
  hasNoAnalogy: blob.includes("Never answer with doors/keys analogies") || blob.includes("never doors/keys")
}));
