import { NON_SAP_TECHNICAL_CATEGORIES } from "./reasoningPlanner";

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
  IAG: ["Access Analysis", "Role Design", "Access Request", "Access Certification", "Privileged Access Management"],
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
    businessObjective: "Separate identity lifecycle from access governance and application authorization across hybrid SAP landscapes.",
    businessRisk: "Orphaned access after movers, ungoverned cloud entitlements, and unclear RISE shared-responsibility boundaries.",
    securityRisk: "Trust misconfiguration, over-privileged role collections, and principal-propagation gaps through Cloud Connector.",
    governanceConsideration: "IAS authenticates; IPS provisions; IAG/GRC governs; XSUAA/PFCG/RBP enforce. Do not collapse those planes."
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

// DOMAIN_REASONING above is keyed by the broad, shared analysis.domain string -- "SAP Cloud
// Identity / BTP" covers IAG, IAS, IPS, and BTP alike, so all four previously got the identical
// businessObjective ("...multi-cloud identity federation, principal propagation, zero-trust
// hybrid integration") regardless of which product was actually asked about. This override is
// checked first, keyed by the already-resolved analysis.category (the more specific signal),
// and only for the products proven to share a contaminated domain; any category without an
// entry here falls through to DOMAIN_REASONING exactly as before -- no other category's
// behavior changes.
const CATEGORY_REASONING = Object.freeze({
  IAG: {
    businessObjective: "Govern whether access is appropriate -- Access Analysis, Role Design, Access Request, Certification, and PAM -- without replacing authentication or application enforcement.",
    businessRisk: "Two disconnected governance stacks (GRC and IAG) evaluating the same user differently, or claiming coverage a connector/ruleset does not actually have.",
    securityRisk: "Privileged access without session review, or SoD mitigations treated as permanent entitlements.",
    governanceConsideration: "IAG decides and records; IPS/ARM executes; IAS authenticates into IAG; S/4 still enforces in PFCG. Connector scope is a design fact, not an assumption."
  },
  IAS: {
    businessObjective: "Authenticate users and federate identity -- corporate IdP trust, MFA/SSO, session and token issuance -- for SAP cloud and BTP applications.",
    businessRisk: "An authentication or trust outage blocking every federated application at once.",
    securityRisk: "Weak MFA policy, expired IdP certificates, or treating IAS as an authorization engine.",
    governanceConsideration: "IAS does not host PFCG roles, BTP role collections, Ariba groups, or SoD rulesets. Those remain application or governance-plane objects."
  },
  IPS: {
    businessObjective: "Provision and deprovision accounts and assignments from HR/identity sources to SAP and non-SAP targets using transformations, correlation, and sync jobs.",
    businessRisk: "Orphaned accounts or delayed leavers from failed jobs; movers that append access instead of reconciling it.",
    securityRisk: "Wrong mapping or correlation creating duplicate users or excess target access.",
    governanceConsideration: "IPS executes mappings; it does not approve SoD-sensitive access. High-risk roles still need IAG/GRC Access Request with simulation."
  },
  Hypercare: {
    businessObjective: "Stabilize production access after cutover without destroying the role model through unlogged widenings.",
    businessRisk: "Finance-close blockers, incomplete Fiori catalogs, and Firefighter used as a standing workaround.",
    securityRisk: "Unreviewed FF sessions, emergency SAP_ALL-style fixes left assigned, IPS queues silently failing.",
    governanceConsideration: "Prove access with SUIM, UAT evidence, PFUD/user comparison, and FF log review. SU53 explains one failed check; it is not cutover validation."
  },
  Cutover: {
    businessObjective: "Move users and roles into production with a go/no-go, reconciliation, and rollback path.",
    businessRisk: "Mass role assignment that never reaches existing users because PFUD/user comparison was skipped.",
    securityRisk: "Reference users, leftover emergency access, and ungenerated profiles.",
    governanceConsideration: "Validate expected versus actual access (SUIM, sample UAT), freeze casual role copies, document FF usage, retain evidence for audit."
  },
  "Role Design": {
    businessObjective: "Translate job functions into a maintainable least-privilege catalog with ownership, SoD, and lifecycle — not a growing pile of composites.",
    businessRisk: "An 8,000-role catalog nobody can certify, with near-duplicates and inherited SoD.",
    securityRisk: "Copy-paste roles carrying unused objects; composites hiding member-level risk.",
    governanceConsideration: "Mine usage (ST03N/STAD/AGR_USERS), retire unused, reduce composites, keep derived roles for org variance, assign business owners, recertify."
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

// This function has its OWN independent PFCG/SU24 default (below) that re-injects fabricated
// components whenever it receives an empty sapComponents array, regardless of why that array is
// empty -- confirmed live: componentSelector.js correctly returning [] for a PMP question still
// left "Components: PFCG, SU24..." in the final prompt because of this second fallback.
// Gated on genuine domain evidence (a real DOMAIN_PATTERNS hit in interviewAnalyzer.js), not a
// category blacklist -- "General SAP" is that function's own no-match value, and non-SAP domains
// (e.g. "PMP") were never in this list, so this generalizes to ANY category without inspecting
// category at all, the same fix applied to componentSelector.js's step-4 fallback.
const GENUINE_SAP_DOMAINS = new Set([
  "SAP GRC",
  "SAP Cloud Identity / BTP",
  "SAP IDM",
  "SAP Fiori Security",
  "SAP Security",
  "SAP Platform"
]);

export function buildTechnicalReasoning(question = "", analysis = {}, sapComponents = [], interviewer = {}, isHybrid = false) {
  const intentKey = (analysis.primaryIntent || analysis.intent || "technical").toLowerCase();
  const domainKey = analysis.domain || "General SAP";
  const complexity = analysis.complexity || "Intermediate";

  const domainData = CATEGORY_REASONING[analysis.category] || DOMAIN_REASONING[domainKey] || DOMAIN_REASONING["General SAP"];
  const sequence = INTENT_SEQUENCES[intentKey] || INTENT_SEQUENCES.technical;

  // Problem A: this fallback used to fire on domain evidence alone, so it could re-inject
  // PFCG/SU24/ARA/ARM/EAM even for a Behavioral/PMP/Leadership question whose sapComponents
  // componentSelector.js correctly emptied -- gated the same way, and for the same reason, as
  // that fix: a genuine SAP+PMP/Behavioral/Leadership hybrid (isHybrid=true) still gets it,
  // a pure non-technical question does not.
  const isNonTechnicalNonHybrid = NON_SAP_TECHNICAL_CATEGORIES.has(analysis.category) && !isHybrid;
  // ROLE plural fix follow-up: category="General" was never covered by isNonTechnicalNonHybrid
  // above (it only inspects NON_SAP_TECHNICAL_CATEGORIES), so once the ROLE fix made
  // domain="SAP Security" reachable for bare-"roles" General-category questions (e.g. "Explain
  // how the roles get assigned for a user who gets promoted or changes division?"), this
  // fallback started firing with zero corroboration -- componentSelector.js correctly returned
  // [] for the same question (its own domain-fallback requires the question to name "SAP"), but
  // this independent fallback ignored that and re-injected the full PFCG/SU24 bundle anyway.
  // Reuses the exact same corroboration concept already proven safe twice in this codebase
  // (Problem B's mentionsSap, the ROLE/PROFILE domain-fallback gate) -- computed locally since
  // componentSelector.js's own mentionsSap is not exported and this file must not import from
  // it. Deliberately does NOT let isHybrid exempt a General-category question here: isHybrid
  // fires on generic delivery/governance words alone (e.g. "project", "team") with no SAP-
  // specific content required, so for category="General" it is not real technical corroboration
  // -- confirmed live: "What role do you play in a project?" sets isHybrid=true purely from
  // "project", while componentSelector.js's own equivalent domain-fallback gate (which this
  // mirrors) never consulted isHybrid for SAP Security either, only mentionsSap. A question
  // that names "SAP" still gets it; a category more specific than "General" (PMP, BTP, IAG, ...)
  // is untouched by this check entirely, exactly like the existing isNonTechnicalNonHybrid gate.
  const mentionsSap = /\bsap\b/i.test(question);
  const isUncorroboratedGeneral = analysis.category === "General" && !mentionsSap;
  const inputComponents = Array.isArray(sapComponents) && sapComponents.length > 0
    ? sapComponents
    : (!isNonTechnicalNonHybrid && !isUncorroboratedGeneral && GENUINE_SAP_DOMAINS.has(analysis.domain))
      ? (analysis.domain === "SAP GRC" ? ["ARA", "ARM", "EAM"] : ["PFCG", "SU24"])
      : [];

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