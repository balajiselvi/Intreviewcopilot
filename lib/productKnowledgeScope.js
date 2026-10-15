const { explicitProductTopics } = require("./interviewContext.js");

// A product explicitly named in the question is a hard retrieval boundary for
// a single-product answer. Cross-product questions union the requested lanes.
// Broad troubleshooting content is only a fallback when no matching product
// evidence was retrieved; it must never displace an available product procedure.
const FOLDERS_BY_PRODUCT = Object.freeze({
  SAC: ["sac"],
  Datasphere: ["datasphere"],
  Ariba: ["lob"],
  SuccessFactors: ["idm"],
  "SAP IDM": ["idm"],
  BW: ["bw"],
  HANA: ["hana"],
  CAR: ["lob", "hana"],
  Fiori: ["fiori", "s4hana", "rise"],
  BTP: ["btp", "cloud"],
  IAS: ["btp", "cloud"],
  IAG: ["iag"],
  IPS: ["btp", "idm"],
  GRC: ["grc"],
  RISE: ["rise", "s4hana"],
  "S/4": ["s4hana", "fiori", "security"],
  ECC: ["security", "grc"],
  Authorization: ["security", "s4hana", "fiori"]
});

function productKnowledgeFolders(question) {
  const topics = explicitProductTopics(question);
  let folders = [...new Set(topics.flatMap((topic) => FOLDERS_BY_PRODUCT[topic] || []))];
  const asksAuditEvidence = /\b(?:audit|sox|itgc|control evidence|audit evidence|access review evidence)\b/i.test(String(question || ""));
  const asksPublicEdition = /\bpublic\s+(?:cloud\s+)?edition\b|\bpublic\s+cloud\b/i.test(String(question || ""));
  const asksAbapGateway = /\b(?:on[- ]premise|ABAP Gateway|embedded Gateway)\b/i.test(String(question || ""));

  // SoD/ARA questions are correctly classified as GRC, but a GRC-only boundary
  // removed audit evidence from questions whose actual objective is SOX/ITGC
  // preparation. Keep both lanes when audit evidence is explicitly requested.
  if (asksAuditEvidence) folders = [...new Set([...folders, "audit", "compliance"])];

  // S/4HANA public and private editions share product words, but their admin
  // surfaces differ. A named Public Edition question must not pull the RISE
  // private-cloud lane or generic ABAP security into its answer candidates.
  if (asksPublicEdition && topics.some((topic) => ["S/4", "Fiori"].includes(topic))) {
    folders = folders.filter((folder) => !["rise", "security"].includes(folder));
  }
  if (asksAbapGateway && topics.includes("Fiori")) {
    folders = folders.filter((folder) => folder !== "rise");
  }
  return folders;
}

function selectProductScopedChunks(question, chunks = []) {
  const allowedFolders = new Set(productKnowledgeFolders(question));
  if (!allowedFolders.size || !Array.isArray(chunks) || chunks.length === 0) return chunks;

  const q = String(question || "");
  const asksPublic = /\bpublic\s+(?:cloud\s+)?edition\b|\bpublic\s+cloud\b/i.test(q);
  const asksPrivate = /\bprivate\s+(?:cloud\s+)?edition\b|\bprivate\s+cloud\b/i.test(q);
  const asksAbapGateway = /\b(?:on[- ]premise|ABAP Gateway|embedded Gateway)\b/i.test(q);
  const editionComparison = asksPublic && asksPrivate;
  const scoped = chunks.filter((chunk) => {
    if (!allowedFolders.has(String(chunk?.sourceFolder || "").toLowerCase())) return false;
    if (editionComparison) return true;

    const heading = String(chunk?.heading || chunk?.section || "");
    if (asksAbapGateway && /\bpublic\s+(?:cloud\s+)?edition\b/i.test(heading)) return false;
    if (asksPublic && /\bprivate\s+(?:edition|cloud)\b/i.test(heading) && !/\bpublic\s+(?:edition|cloud)\b/i.test(heading)) return false;
    if (asksPrivate && /\bpublic\s+(?:edition|cloud)\b/i.test(heading) && !/\bprivate\s+(?:edition|cloud)\b/i.test(heading)) return false;
    return true;
  });
  if (scoped.length) return scoped;

  // Shared operational guidance is preferable to a confidently wrong procedure
  // from another SAP product when the exact product lane has no indexed match.
  return chunks.filter((chunk) => ["troubleshooting", "interview-scenarios"].includes(String(chunk?.sourceFolder || "").toLowerCase()));
}

module.exports = { FOLDERS_BY_PRODUCT, productKnowledgeFolders, selectProductScopedChunks };
