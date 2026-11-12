/**
 * Upsert Fiori SSO / Principal Propagation architect-bank section into knowledgeIndex.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.join(__dirname, "../..");
const indexPath = path.join(root, "data/knowledgeIndex.json");
const mdPath = path.join(root, "knowledge/fiori/fiori-frontend-security-architect-bank.md");
const md = fs.readFileSync(mdPath, "utf8");
const heading = "Q5: How do you integrate Fiori SSO (IAS / SAML / OIDC) without weakening backend authorization?";

function section(h) {
  const escaped = h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`## ${escaped}\\r?\\n([\\s\\S]*?)(?=\\r?\\n## |$)`);
  const m = md.match(re);
  if (!m) throw new Error(`missing section: ${h}`);
  return (`## ${h}\n\n${m[1].trim()}`).trim();
}

const content = section(heading);
const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
const sourceFile = "fiori-frontend-security-architect-bank.md";
const existing = (index.chunks || []).filter(
  (c) => (c.sourceFile === sourceFile || c.metadata?.sourceFile === sourceFile)
    && (c.heading === heading || c.section === heading || /integrate Fiori SSO/i.test(c.heading || ""))
);

let updated = 0;
let inserted = 0;
if (existing.length) {
  for (const chunk of existing) {
    chunk.content = content;
    chunk.heading = heading;
    chunk.section = heading;
    updated += 1;
  }
} else {
  const id = `chunk_${crypto.createHash("sha256").update(heading + content).digest("hex").slice(0, 32)}`;
  index.chunks.push({
    id,
    chunkId: id,
    documentId: `doc_fiori_sso_${id.slice(0, 12)}`,
    chunkIndex: (index.chunks?.length || 0) + 1,
    heading,
    pageNumber: null,
    tokenEstimate: Math.ceil(content.split(/\s+/).length * 1.3),
    checksum: crypto.createHash("sha256").update(content).digest("hex").slice(0, 40),
    sourceFile,
    sourceFolder: "fiori",
    extension: ".md",
    chunkNumber: (index.chunks?.length || 0) + 1,
    section: heading,
    content,
    metadata: { chunkId: id, sourceFile, sourceFolder: "fiori", heading, topic: "fiori-sso" }
  });
  inserted += 1;
}

if (typeof index.totalChunks === "number") index.totalChunks = index.chunks.length;
fs.writeFileSync(indexPath, JSON.stringify(index));
const blob = JSON.stringify(index);
console.log(JSON.stringify({
  updated,
  inserted,
  hasAlias: blob.includes("configure Fiori SSO"),
  hasPrincipal: blob.includes("Principal Propagation"),
  hasSaml: /SAML2|SAML\/OIDC|SAML/i.test(blob)
}));
