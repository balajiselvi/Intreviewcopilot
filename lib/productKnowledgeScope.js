const { explicitProductTopics } = require("./interviewContext.js");

// A product explicitly named in the question is a hard retrieval boundary for
// a single-product answer. Cross-product questions union the requested lanes.
// Broad troubleshooting content is only a fallback when no matching product
// evidence was retrieved; it must never displace an available product procedure.
const FOLDERS_BY_PRODUCT = Object.freeze({
  SAC: ["sac"],
  Datasphere: ["datasphere"],
  Ariba: ["lob"],
  SuccessFactors: ["successfactors", "idm"],
  "SAP IDM": ["idm"],
  BW: ["bw"],
  HANA: ["hana"],
  CAR: ["lob"],
  MDG: ["mdg", "s4hana", "security"],
  Fiori: ["fiori", "s4hana", "rise"],
  Joule: ["btp"],
  Activate: ["project-management", "rise"],
  Transformation: ["project-types", "project-management", "cutover", "hypercare", "rise"],
  BTP: ["btp", "cloud"],
  IAS: ["btp", "cloud"],
  IAG: ["iag"],
  IPS: ["btp", "idm"],
  GRC: ["grc", "compliance"],
  "Process Control": ["grc", "compliance"],
  RISE: ["rise", "s4hana"],
  "S/4": ["s4hana", "fiori", "security"],
  ECC: ["security", "grc"],
  Authorization: ["security", "s4hana", "fiori"],
  CyberArk: ["cyberark"],
  Integration: ["integration", "cloud", "btp"]
});

function productKnowledgeFolders(question) {
  const topics = explicitProductTopics(question);
  let folders = [...new Set(topics.flatMap((topic) => FOLDERS_BY_PRODUCT[topic] || []))];
  const asksAuditEvidence = /\b(?:audit|sox|itgc|control evidence|audit evidence|access review evidence|gdpr|iso\s*27001|isms|soc\s*[12]|cobit|nist|pci\s*dss)\b/i.test(String(question || ""));
  const asksPublicEdition = /\bpublic\s+(?:cloud\s+)?edition\b|\bpublic\s+cloud\b/i.test(String(question || ""));
  const asksAbapGateway = /\b(?:on[- ]premise|ABAP Gateway|embedded Gateway)\b/i.test(String(question || ""));

  // SoD/ARA questions are correctly classified as GRC, but a GRC-only boundary
  // removed audit evidence from questions whose actual objective is SOX/ITGC
  // preparation. Keep both lanes when audit evidence is explicitly requested.
  // Compliance interview questions often name no SAP product; still open the
  // compliance folder so SOX/GDPR/ISO procedures can be retrieved.
  if (asksAuditEvidence) folders = [...new Set([...folders, "audit", "compliance", "grc"])];

  // Client-delivery questions name a product only in passing. Keep the product
  // lane and add the senior-consultant delivery lane so the answer can use the
  // workplan, RAID, and quality-gate procedure without opening every GRC
  // question to that folder.
  const asksIdentityPlane = /\b(?:SAML|SAML 2\.0|identity provider|identity provisioning|IdP|sign-in|single sign-on|SSO)\b/i.test(String(question || ""));
  if (asksIdentityPlane) folders = [...new Set([...folders, "cloud", "idm"])];

  const asksSeniorDelivery = /\b(?:client security assessment|nontechnical stakeholder|junior consultant|security workstream|critical defect|audit finding|security proposal|disagreement between|vendor delay|missed milestone|delivery recovery|recovery and escalation|resource and budget forecast|RAID|cutover recovery)\b/i.test(String(question || ""));
  if (asksSeniorDelivery) folders = [...new Set([...folders, "project-management"])];

  // S/4HANA public and private editions share product words, but their admin
  // surfaces differ. A named Public Edition question must not pull the RISE
  // private-cloud lane or generic ABAP security into its answer candidates.
  // "S/4HANA Cloud" without Private Edition or on-premise uses the same boundary.
  // The generic PFCG lane was answering that question as an ABAP role design.
  const namesPrivateOrOnPrem = /\b(?:private\s+(?:cloud\s+)?edition|private\s+cloud|on[- ]premise)\b/i.test(String(question || ""));
  const asksUnqualifiedS4Cloud = /\bS\/?4(?:HANA)?\s+Cloud\b/i.test(String(question || "")) && !namesPrivateOrOnPrem;
  if ((asksPublicEdition || asksUnqualifiedS4Cloud) && topics.some((topic) => ["S/4", "Fiori"].includes(topic))) {
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
  const topics = explicitProductTopics(q);
  const namedComplianceFramework = /\bSOX\b|\bITGC\b/i.test(q)
    ? "sox"
    : /\bGDPR\b/i.test(q)
      ? "gdpr"
      : /\bISO(?:\s*\/\s*IEC)?\s*27001\b/i.test(q)
        ? "iso27001"
        : "";
  const scoped = chunks.filter((chunk) => {
    if (!allowedFolders.has(String(chunk?.sourceFolder || "").toLowerCase())) return false;
    const sourceFile = String(chunk?.sourceFile || chunk?.fileName || "").toLowerCase();
    if (sourceFile && topics.includes("CAR") && String(chunk?.sourceFolder || "").toLowerCase() === "lob"
      && !sourceFile.includes("car")) return false;
    if (sourceFile && namedComplianceFramework && String(chunk?.sourceFolder || "").toLowerCase() === "compliance"
      && !sourceFile.includes(namedComplianceFramework)) return false;
    if (sourceFile && topics.includes("Process Control") && String(chunk?.sourceFolder || "").toLowerCase() === "grc"
      && !/process-control|process_control|process control/i.test(sourceFile)
      && !/\bprocess control\b/i.test(String(chunk?.heading || chunk?.section || ""))) return false;
    if (editionComparison) return true;

    const heading = String(chunk?.heading || chunk?.section || "");
    if (asksAbapGateway && /\bpublic\s+(?:cloud\s+)?edition\b/i.test(heading)) return false;
    if (asksPublic && /\bprivate\s+(?:edition|cloud)\b/i.test(heading) && !/\bpublic\s+(?:edition|cloud)\b/i.test(heading)) return false;
    if (asksPrivate && /\bpublic\s+(?:edition|cloud)\b/i.test(heading) && !/\bprivate\s+(?:edition|cloud)\b/i.test(heading)) return false;
    return true;
  });
  if (scoped.length) {
    // Question banks match the query words but are not the procedure the answer should speak.
    const procedural = scoped.filter((chunk) => !/interview questions|follow-up questions/i.test(String(chunk?.heading || chunk?.section || "")));
    return procedural.length ? procedural : scoped;
  }

  // Shared operational guidance is preferable to a confidently wrong procedure
  // from another SAP product when the exact product lane has no indexed match.
  return chunks.filter((chunk) => ["troubleshooting", "interview-scenarios"].includes(String(chunk?.sourceFolder || "").toLowerCase()));
}

module.exports = { FOLDERS_BY_PRODUCT, productKnowledgeFolders, selectProductScopedChunks };
