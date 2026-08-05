const COMPONENT_CONFIG = Object.freeze({
  ARM: {
    category: "SAP GRC",
    weight: 10,
    pattern: /\b(arm|access request|msmp|brf\+?|provisioning flow)\b/i,
    components: ["ARM", "MSMP Workflow", "BRF+", "Provisioning Framework"]
  },
  ARA: {
    category: "SAP GRC",
    weight: 10,
    pattern: /\b(ara|risk analysis|sod|segregation of duties|ruleset|rulebook|ruleset sync|mitigation)\b/i,
    components: ["ARA", "Risk Rules", "Ruleset Sync", "Mitigation Controls", "Permission Level Risk"]
  },
  EAM: {
    category: "SAP GRC",
    weight: 10,
    pattern: /\b(eam|firefighter|emergency access|privileged access|grac_spm|ff owner|ff controller)\b/i,
    components: ["EAM", "Firefighter IDs", "FF Owners", "FF Controllers", "Log Review", "GRAC_SPM"]
  },
  BRM: {
    category: "SAP GRC",
    weight: 9,
    pattern: /\b(brm|role management|role design|role methodology|role catalog)\b/i,
    components: ["BRM", "Role Methodology", "Naming Conventions", "Role Catalog"]
  },
  GRC_PLATFORM: {
    category: "SAP GRC",
    weight: 8,
    pattern: /\b(repository sync|connector group|connector groups|grc connector|grc landscape)\b/i,
    components: ["Repository Sync", "Connector Groups", "GRC Foundation"]
  },
  ABAP_SECURITY: {
    category: "SAP Security",
    weight: 10,
    pattern: /\b(pfcg|su24|su25|su01|authorization|profile|auth object|agr_1251|agr_define|usobt_c|usobx_c|usr02|usr04|suim)\b/i,
    components: ["PFCG", "SU24", "SU25", "SU01", "Authorization Objects", "AGR_1251", "USOBT_C", "USOBX_C", "SUIM"]
  },
  DIAGNOSTICS: {
    category: "SAP Security",
    weight: 9,
    pattern: /\b(su53|st01|stauthtrace|security audit log|sm21|st22|trace)\b/i,
    components: ["SU53", "ST01", "STAUTHTRACE", "Security Audit Log", "SM21"]
  },
  FIORI_SECURITY: {
    category: "SAP Fiori Security",
    weight: 10,
    pattern: /\b(fiori|launchpad|catalog|catalogs|space|spaces|page|pages|tile|group|groups|target mapping|icf|sicf|gateway|odata|iwfnd|iwmnd)\b/i,
    components: ["Fiori Launchpad", "Business Catalogs", "Spaces & Pages", "Target Mappings", "OData V2/V4 Services", "SICF", "Gateway Services"]
  },
  CLOUD_IDENTITY: {
    category: "SAP Cloud Identity / BTP",
    weight: 10,
    pattern: /\b(ias|ips|iag|cloud identity|saml|oauth2?|oidc|jwt|identity federation|trust configuration|principal propagation)\b/i,
    components: ["IAS", "IPS", "IAG", "Identity Federation", "Trust Configuration", "OAuth2 / SAML / OIDC", "JWT"]
  },
  BTP_PLATFORM: {
    category: "SAP Cloud Identity / BTP",
    weight: 9,
    pattern: /\b(btp|xsuaa|destination service|connectivity service|mtls|cloud connector)\b/i,
    components: ["BTP Platform", "XSUAA", "Destination Service", "Connectivity Service", "SAP Cloud Connector", "mTLS", "Principal Propagation"]
  },
  BUILD_PORTFOLIO: {
    category: "SAP Cloud / BTP",
    weight: 8,
    pattern: /\b(build work zone|work zone|build process automation|process automation)\b/i,
    components: ["SAP Build Work Zone", "SAP Build Process Automation"]
  },
  CLOUD_ANALYTICS: {
    category: "SAP Cloud",
    weight: 8,
    pattern: /\b(datasphere|sac|analytics cloud)\b/i,
    components: ["SAP Datasphere", "SAP Analytics Cloud (SAC)"]
  },
  S4_HANA_PLATFORM: {
    category: "SAP Platform",
    weight: 8,
    pattern: /\b(s\/?4hana|hana cloud|ecc|abap platform|bw)\b/i,
    components: ["S/4HANA", "SAP HANA Cloud", "ABAP Platform"]
  },
  ENTERPRISE_LOB: {
    category: "SAP LoB Applications",
    weight: 8,
    pattern: /\b(successfactors|ariba|mdg|gts|ibp)\b/i,
    components: ["SAP SuccessFactors", "SAP Ariba", "SAP MDG", "SAP GTS", "SAP IBP"]
  },
  INTEGRATION: {
    category: "Integration",
    weight: 7,
    pattern: /\b(rfc|sm59|snc|api|web dispatcher)\b/i,
    components: ["SM59", "SNC", "SAP Web Dispatcher", "Technical Communication Users"]
  }
});

const INTENT_COMPONENTS = Object.freeze({
  troubleshooting: ["SU53", "ST01", "STAUTHTRACE", "SM21"],
  migration: ["SU25", "Repository Sync", "USOBT_C"],
  upgrade: ["SU25", "SPAU/SPDD", "USOBX_C"],
  workflow: ["MSMP Workflow", "BRF+", "ARM"],
  architecture: ["BTP Platform", "SAP Cloud Connector", "IAS"]
});

const DOMAIN_DEFAULTS = Object.freeze({
  "SAP GRC": ["ARA", "ARM", "EAM", "BRM", "Repository Sync"],
  "SAP Cloud Identity / BTP": ["IAS", "IPS", "IAG", "SAP Cloud Connector", "XSUAA"],
  "SAP IDM": ["SAP IDM", "Identity Center", "Repository Sync"],
  "SAP Fiori Security": ["Fiori Launchpad", "Business Catalogs", "Spaces & Pages", "OData V2/V4 Services"],
  "SAP Security": ["PFCG", "SU24", "Authorization Objects", "USOBT_C"],
  "SAP Platform": ["S/4HANA", "ABAP Platform", "SU25"]
});

const PROCESS_COMPONENTS = Object.freeze({
  "Emergency Access": ["EAM", "Firefighter IDs", "FF Owners", "FF Controllers"],
  "Provisioning": ["ARM", "MSMP Workflow", "BRF+", "Provisioning Framework"],
  "Risk Analysis": ["ARA", "Risk Rules", "Mitigation Controls", "Ruleset Sync"],
  "Role Design": ["BRM", "PFCG", "SU24", "Business Catalogs"]
});

export function selectSapComponents(question = "", analysis = {}) {
  const rawQ = String(question || "").trim();
  const q = rawQ.toLowerCase();

  const componentScores = new Map();

  function addComponent(name, weight) {
    if (!name) return;
    const current = componentScores.get(name) || 0;
    componentScores.set(name, Math.max(current, weight));
  }

  // 1. Keyword-based matching with component config
  for (const key in COMPONENT_CONFIG) {
    const config = COMPONENT_CONFIG[key];
    if (config.pattern.test(q)) {
      for (let i = 0; i < config.components.length; i++) {
        addComponent(config.components[i], config.weight);
      }
    }
  }

  // 2. Intent-based component expansion
  const intentKey = (analysis.primaryIntent || analysis.intent || "").toLowerCase();
  if (INTENT_COMPONENTS[intentKey]) {
    const list = INTENT_COMPONENTS[intentKey];
    for (let i = 0; i < list.length; i++) {
      addComponent(list[i], 7);
    }
  }

  // 3. Business process component inference
  const processKey = analysis.businessProcess || "";
  if (PROCESS_COMPONENTS[processKey]) {
    const list = PROCESS_COMPONENTS[processKey];
    for (let i = 0; i < list.length; i++) {
      addComponent(list[i], 8);
    }
  }

  // 4. Domain fallback / defaults
  if (componentScores.size === 0) {
    const domain = analysis.domain || "SAP Security";
    const defaults = DOMAIN_DEFAULTS[domain] || DOMAIN_DEFAULTS["SAP Security"];
    for (let i = 0; i < defaults.length; i++) {
      addComponent(defaults[i], 5);
    }
  }

  // 5. Deterministic sorting by weight score, preserving order
  const sortedComponents = Array.from(componentScores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);

  return sortedComponents;
}