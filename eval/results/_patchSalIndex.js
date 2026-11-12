/**
 * Patch live knowledgeIndex.json with Security Audit Log Q11/Q12 from the architect bank.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.join(__dirname, "../..");
const indexPath = path.join(root, "data/knowledgeIndex.json");
const mdPath = path.join(root, "knowledge/security/core-sap-security-authorizations-architect-bank.md");
const md = fs.readFileSync(mdPath, "utf8");

function section(heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`## ${escaped}\\r?\\n([\\s\\S]*?)(?=\\r?\\n## |$)`);
  const m = md.match(re);
  if (!m) throw new Error(`missing section: ${heading}`);
  return (`## ${heading}\n\n${m[1].trim()}`).trim();
}

const headings = [
  "Q11: How do you configure, read, and purge the Security Audit Log (SAL) without confusing SM19 / SM20 / SM18?",
  "Q12: How do you purge Security Audit Logs in SAP (deletion path only)?"
];

const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
const sourceFile = "core-sap-security-authorizations-architect-bank.md";
let updated = 0;
let inserted = 0;

for (const heading of headings) {
  const content = section(heading);
  const existing = (index.chunks || []).filter(
    (c) => (c.sourceFile === sourceFile || c.metadata?.sourceFile === sourceFile)
      && (c.heading === heading || c.section === heading)
  );
  if (existing.length) {
    for (const chunk of existing) {
      chunk.content = content;
      updated += 1;
    }
    continue;
  }
  const id = `chunk_${crypto.createHash("sha256").update(heading + content).digest("hex").slice(0, 32)}`;
  index.chunks.push({
    id,
    chunkId: id,
    documentId: `doc_sal_${id.slice(0, 12)}`,
    chunkIndex: (index.chunks?.length || 0) + 1,
    heading,
    pageNumber: null,
    tokenEstimate: Math.ceil(content.split(/\s+/).length * 1.3),
    checksum: crypto.createHash("sha256").update(content).digest("hex").slice(0, 40),
    sourceFile,
    sourceFolder: "security",
    extension: ".md",
    chunkNumber: (index.chunks?.length || 0) + 1,
    section: heading,
    content,
    metadata: {
      chunkId: id,
      sourceFile,
      sourceFolder: "security",
      heading
    }
  });
  inserted += 1;
}

if (typeof index.totalChunks === "number") {
  index.totalChunks = index.chunks.length;
}
fs.writeFileSync(indexPath, JSON.stringify(index));
const blob = JSON.stringify(index);
console.log(JSON.stringify({
  updated,
  inserted,
  hasSm18: blob.includes("SM18"),
  hasRsaupurg: blob.includes("RSAUPURG"),
  hasPurgeQ: blob.includes("purge Security Audit Logs")
}));
