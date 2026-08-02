const SAP_SYNONYMS = {

  grc: [
    "SAP GRC",
    "Access Control",
    "ARA",
    "ARM",
    "EAM",
    "Firefighter",
    "BRM"
  ],

  security: [
    "SAP Security",
    "PFCG",
    "SU24",
    "SU25",
    "SU01",
    "Authorization Objects"
  ],

  integration: [
    "SM59",
    "RFC Security",
    "SNC",
    "SAP Web Dispatcher",
    "SAP Cloud Connector",
    "Technical Communication User",
    "Certificate Authentication",
    "mTLS"
  ],

  cloud: [
    "IAS",
    "IPS",
    "IAG",
    "Identity Authentication",
    "Identity Provisioning",
    "SAML",
    "OAuth2",
    "Principal Propagation"
  ],

  fiori: [
    "Launchpad",
    "Catalog",
    "Business Role",
    "Space",
    "Page",
    "OData Security"
  ],

  hana: [
    "CDS",
    "DCL",
    "Analytical Privileges"
  ],

  troubleshooting: [
    "SU53",
    "ST01",
    "ST22",
    "SLG1",
    "SM21",
    "SM37",
    "Security Audit Log"
  ],

  defense: [
    "Defense",
    "Military",
    "Government",
    "Zero Trust",
    "Data Sovereignty",
    "Air Gap",
    "Network Segmentation"
  ]

};

export function expandQuery(question = "", analysis = {}) {

  const q = question.toLowerCase();

  const queries = new Set();

  queries.add(question);

  // Domain

  if (analysis.domain === "SAP GRC")
    SAP_SYNONYMS.grc.forEach(v => queries.add(v));

  if (analysis.domain === "SAP Security")
    SAP_SYNONYMS.security.forEach(v => queries.add(v));

  if (analysis.domain === "SAP Cloud Identity")
    SAP_SYNONYMS.cloud.forEach(v => queries.add(v));

  if (analysis.domain === "SAP Fiori Security")
    SAP_SYNONYMS.fiori.forEach(v => queries.add(v));

  // Intent

  if (analysis.intent === "architecture")
    SAP_SYNONYMS.integration.forEach(v => queries.add(v));

  if (analysis.intent === "troubleshooting")
    SAP_SYNONYMS.troubleshooting.forEach(v => queries.add(v));

  // Industry

  if (
    analysis.industry === "Defense" ||
    analysis.industry === "Government"
  ) {

    SAP_SYNONYMS.defense.forEach(v => queries.add(v));

  }

  // Keywords from question

  q.split(/\s+/)

    .filter(w => w.length > 3)

    .forEach(word => queries.add(word));

  return Array.from(queries);

}