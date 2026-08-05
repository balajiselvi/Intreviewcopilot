const COMPONENT_LIBRARY = Object.freeze({
  ARA: ["Risk Analysis", "Rulebook/Ruleset", "Function", "Action", "Permission", "Mitigation Control", "S_TABU_NAM"],
  ARM: ["Access Request", "MSMP Workflow", "BRF+ Rules", "Agent Determination", "Provisioning Engine", "Connector"],
  EAM: ["Firefighter ID", "Firefighter Owner", "Controller Review", "Reason Code", "Session Log Sync", "GRAC_SPM"],
  BRM: ["Role Methodology", "Naming Convention", "Role Import", "Multi-Level Approval", "Role Catalog"],
  PFCG: ["Single Role", "Composite Role", "Derived Role", "Auth Object", "Org Level", "Profile Generator"],
  SU24: ["Check Indicators", "Proposal Values", "USOBT_C", "USOBX_C", "Authorization Defaults"],
  SU25: ["Upgrade Compare", "Step 2a/2b/2c", "Proposal Migration", "Table Comparison"],
  SU53: ["Authorization Failure Display", "Failed Auth Object", "Field Values", "User Context"],
  ST01: ["System Trace", "Authorization Trace", "Buffer Trace", "RFC Trace"],
  STAUTHTRACE: ["System-Wide Authorization Trace", "Filter by User/T-Code", "Trace Evaluation"],
  IAS: ["Identity Authentication", "Corporate IdP Federation", "Conditional Authentication", "Risk-Based Auth", "SAML/OIDC"],
  IPS: ["Identity Provisioning", "Source/Target Connectors", "JSON Transformation Rules", "Sync Jobs"],
  IAG: ["Cloud Access Governance", "Access Analysis", "Role Building", "Bridge Scenario"],
  "Cloud Connector": ["Principal Propagation", "Secure Tunnel", "Destination Configuration", "X.509 Client Cert", "mTLS"],
  Fiori: ["Fiori Launchpad", "Business Catalog", "Business Group", "Space & Page", "OData Service", "IWFND/IWMND"]
});

const DOMAIN_REASONING = Object.freeze({
  "SAP GRC": {
    businessObjective: "Establish continuous access governance, automated SOD management, and auditable emergency access.",
    businessRisk: "Uncontrolled SOD conflicts causing financial fraud, audit failure, or regulatory non-compliance.",
    securityRisk: "Privileged access misuse, unmitigated SOD risk exposure, and unmonitored Firefighter sessions.",
    governanceConsideration: "Ensure rulebook alignment with SOX/GDPR frameworks and quarterly access certification cycles."
  },
  "SAP Cloud Identity / BTP": {
    businessObjective: "Enable secure multi-cloud identity federation, principal propagation, and zero-trust hybrid integration.",
    businessRisk: "Identity boundary breaches, unencrypted cross-cloud RFC calls, and unmanaged cloud user lifecycle.",
    securityRisk: "Token hijacking, unauthenticated OData endpoint access, and misconfigured trust relationships.",
    governanceConsideration: "Enforce centralized IAS corporate IdP routing, IPS sync frequency, and strict mTLS connectivity."
  },
  "SAP IDM": {
    businessObjective: "Automate cross-landscape identity lifecycle management, repository sync, and role provisioning.",
    businessRisk: "Orphan accounts, delayed offboarding, and identity repository synchronization lag.",
    securityRisk: "Stale user permissions across connected ABAP and non-ABAP target repositories.",
    governanceConsideration: "Implement automated reconciliation jobs and strict pass-vector attribute mapping."
  },
  "SAP Fiori Security": {
    businessObjective: "Deliver secure, role-based Fiori UX aligned with backend authorization object proposals.",
    businessRisk: "Business disruption due to broken tile access or backend authorization dumps (SU53/ST01).",
    securityRisk: "Over-privileged OData service access and unmaintained catalog SU24 proposals.",
    governanceConsideration: "Align front-end Fiori Catalogs with backend PFCG roles using standard SU24 OData mapping."
  },
  "SAP Security": {
    businessObjective: "Enforce least-privilege RBAC architecture across ABAP enterprise application tiers.",
    businessRisk: "Broad access allocations leading to unauthorized transactional execution or sensitive data leaks.",
    securityRisk: "Wide authorization ranges in S_TABU_DIS, S_DEVELOP, or S_TCODE.",
    governanceConsideration: "Maintain accurate SU24 proposals to ensure clean PFCG role generation and zero manual auth edits."
  },
  "General SAP": {
    businessObjective: "Maintain secure, compliant, and performant enterprise SAP operations.",
    businessRisk: "Operational downtime and compliance exposure.",
    securityRisk: "Uncontrolled access rights and audit non-compliance.",
    governanceConsideration: "Follow standard SAP security guidelines and enterprise change management."
  }
});

const INTENT_SEQUENCES = Object.freeze({
  architecture: ["Business Context", "Architecture Landscape", "Integration Mechanics", "Security Controls", "Production Operations"],
  workflow: ["Request Trigger", "BRF+/MSMP Determination", "Multi-Stage Approval", "Provisioning Engine", "Audit Trail"],
  troubleshooting: ["Symptom Triage", "Diagnostic Trace (SU53/ST01)", "Root Cause Isolation", "Correction", "Preventive Controls"],
  scenario: ["Immediate Business Impact", "Risk Assessment", "Architectural Decision", "Implementation Steps", "Verification"],
  comparison: ["Structural Distinction", "Technical Mechanics", "Operational Trade-offs", "Architectural Recommendation"],
  migration: ["Source State Assessment", "SU25/Tooling Preparation", "Delta Conversion", "Cutover Validation", "Post-Go-Live Governance"],
  troubleshoot: ["Symptom Triage", "Diagnostic Trace", "Root Cause Analysis", "Remediation", "Preventive Audit"],
  technical: ["Business Context", "Technical Solution", "Implementation Details", "Verification", "Governance"]
});

function deriveArchitectureDecision(intent, domain) {
  switch (intent) {
    case "Architecture":
    case "architecture":
      return `Deploy a decoupled, scalable architecture utilizing standard ${domain} integration patterns and secure transport protocols.`;
    case "Troubleshooting":
    case "troubleshooting":
      return `Isolate technical root cause using standard SAP trace utilities before modifying baseline authorizations or configurations.`;
    case "Workflow":
    case "workflow":
      return `Utilize standard SAP MSMP/BRF+ workflow structures to ensure automated, auditable decision routing.`;
    case "Comparison":
    case "comparison":
      return `Select the target component based on enterprise scalability, maintenance overhead, and security isolation requirements.`;
    case "Migration":
    case "migration":
      return `Follow a structured multi-phase conversion model utilizing SAP standard upgrade tools (e.g. SU25) and delta transports.`;
    default:
      return `Implement standard SAP best-practice controls tailored for ${domain}.`;
  }
}

function deriveImplementationDecision(intent, domain) {
  switch (intent) {
    case "Architecture":
    case "architecture":
      return "Configure baseline parameters, establish secure connector endpoints, and validate end-to-end authorization flows.";
    case "Workflow":
    case "workflow":
      return "Maintain BRF+ decision tables, configure MSMP process IDs and stages, and test dynamic agent routing.";
    case "Troubleshooting":
    case "troubleshooting":
      return "Execute SU53/ST01 traces in target environment, adjust SU24 proposals where appropriate, and regenerate PFCG profiles.";
    default:
      return "Leverage standard SPRO customizing, PFCG role updates, and transport management workflows.";
  }
}

function deriveTradeOffs(intent) {
  switch (intent) {
    case "Architecture":
    case "architecture":
      return ["Security Hardening vs End-User Friction", "Standard SAP Features vs Custom Enhancement Overhead", "Centralized Governance vs Local System Autonomy"];
    case "Workflow":
    case "workflow":
      return ["Automation Speed vs Granular Approval Checks", "Complex BRF+ Rules vs Operational Maintenance Burden"];
    case "Troubleshooting":
    case "troubleshooting":
      return ["Immediate Hotfix vs Complete Root Cause & SU24 Remediation", "Broad Temporary Access vs Strict Emergency Access (EAM) Usage"];
    default:
      return ["Implementation Speed vs Long-Term Maintainability", "Access Flexibility vs Compliance Control"];
  }
}

function deriveProductionConsiderations(intent, complexity) {
  const base = ["Transport management and cutover sequencing", "Change management and audit documentation"];
  if (intent === "Troubleshooting" || intent === "troubleshooting") {
    base.unshift("Buffer refresh impact ($TAB, $AUTH) and user session resets");
  } else if (complexity === "Architect" || complexity === "Advanced") {
    base.unshift("High Availability (HA) failover and cross-system RFC latency");
  }
  return base;
}

function deriveExpectedFollowUps(intent, domain) {
  const list = [];
  if (domain === "SAP GRC") {
    list.push("How do you handle custom Z-transactions in the GRC ARA rulebook?", "What is the rollback strategy if an MSMP workflow stage fails in production?");
  } else if (domain === "SAP Cloud Identity / BTP") {
    list.push("How is principal propagation configured across the Cloud Connector?", "What happens if the IAS identity provider trust certificate expires?");
  } else {
    list.push("How would you secure this approach against audit findings?", "What alternative standard SAP tools could achieve the same objective?");
  }
  return list;
}

function expandSapComponents(components = []) {
  const resultSet = new Set(components);
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    if (COMPONENT_LIBRARY[comp]) {
      const expanded = COMPONENT_LIBRARY[comp];
      for (let j = 0; j < expanded.length; j++) {
        resultSet.add(expanded[j]);
      }
    }
  }
  return Array.from(resultSet);
}

export function buildTechnicalReasoning(question = "", analysis = {}, sapComponents = [], interviewer = {}) {
  const intentKey = (analysis.primaryIntent || analysis.intent || "technical").toLowerCase();
  const domainKey = analysis.domain || "General SAP";
  const complexity = analysis.complexity || "Intermediate";

  const domainData = DOMAIN_REASONING[domainKey] || DOMAIN_REASONING["General SAP"];
  const sequence = INTENT_SEQUENCES[intentKey] || INTENT_SEQUENCES.technical;

  const inputComponents = Array.isArray(sapComponents) && sapComponents.length > 0
    ? sapComponents
    : (analysis.domain === "SAP GRC" ? ["ARA", "ARM", "EAM"] : ["PFCG", "SU24"]);

  const recommendedComponents = expandSapComponents(inputComponents);

  const businessObjective = domainData.businessObjective;
  const businessRisk = domainData.businessRisk;
  const securityRisk = domainData.securityRisk;
  const governanceConsideration = domainData.governanceConsideration;

  const architectureDecision = deriveArchitectureDecision(intentKey, domainKey);
  const implementationDecision = deriveImplementationDecision(intentKey, domainKey);
  const implementationSequence = [...sequence];
  const tradeOffs = deriveTradeOffs(intentKey);
  const productionConsiderations = deriveProductionConsiderations(intentKey, complexity);
  const productionConsideration = productionConsiderations[0] || "Ensure strict transport transport sequencing and validation.";
  const expectedFollowUps = deriveExpectedFollowUps(intentKey, domainKey);

  const finalRecommendation = `Implement standard ${domainKey} controls prioritizing least privilege, automated governance, and standard SAP maintainability.`;

  return {
    businessObjective,
    businessRisk,
    securityRisk,
    architectureDecision,
    implementationDecision,
    implementationSequence,
    tradeOffs,
    productionConsiderations,
    productionConsideration,
    expectedFollowUps,
    finalRecommendation,
    governanceConsideration,
    recommendedComponents,
    answertype: analysis.answerType || "explanation",
    expectedStructure: analysis.expectedStructure || "paragraph"
  };
}