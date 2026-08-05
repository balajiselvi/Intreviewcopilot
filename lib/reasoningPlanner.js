const REASONING_PATTERNS = Object.freeze({
  architecture: {
    pattern: "Business Goal → Architecture Topology → Runtime Integration → Security Control → Production Trade-Offs",
    flow: [
      "Business Architecture & Goal",
      "Landscape & Topology Design",
      "Runtime Integration Flow",
      "Security & Governance Controls",
      "Production Trade-Offs & Scalability"
    ]
  },
  implementation: {
    pattern: "Requirement → Configuration & Objects → Testing & Validation → Production Deployment",
    flow: [
      "Business Requirement & Scope",
      "Technical Configuration (SPRO/T-Codes)",
      "Testing & Validation Steps",
      "Cutover & Production Deployment"
    ]
  },
  workflow: {
    pattern: "Trigger Event → Agent/BRF+ Determination → Approval Path → Provisioning Execution",
    flow: [
      "Trigger Event & Request Entry",
      "Agent & Risk Determination (BRF+/MSMP)",
      "Approval Stages & Escalations",
      "Provisioning & System Updates"
    ]
  },
  troubleshooting: {
    pattern: "Symptom & Triage → Diagnostics → Root Cause Analysis → Technical Resolution → Prevention",
    flow: [
      "Incident Symptoms & Initial Triage",
      "Diagnostic Tools (SU53/ST01/ST22/SLG1)",
      "Root Cause Analysis",
      "Technical Resolution",
      "Preventive Governance Controls"
    ]
  },
  scenario: {
    pattern: "Business Context → Architectural Decision → Implementation Mechanics → Trade-Offs & Outcome",
    flow: [
      "Business Context & Constraints",
      "Architectural Decision",
      "Implementation Mechanics",
      "Trade-Offs & Operational Outcome"
    ]
  },
  comparison: {
    pattern: "Core Architectural Difference → Feature Matrix → Operational Use Cases → Selection Criteria",
    flow: [
      "Core Architectural Distinction",
      "Technical Differences & Mechanics",
      "Practical Operational Use Cases",
      "Architectural Selection Criteria"
    ]
  },
  migration: {
    pattern: "Current State → Target Architecture → Cutover Tools & Transition → Risk Mitigation",
    flow: [
      "Current State & Target Architecture",
      "Preparation & SU25 / Tooling Analysis",
      "Execution, Conversion & Cutover",
      "Post-Go-Live Risk Control & Validation"
    ]
  },
  performance: {
    pattern: "Performance Symptom → Trace Diagnostics → Bottleneck Identification → Technical Tuning",
    flow: [
      "Performance Symptom & Impact",
      "Trace Diagnostics (ST03N/ST12/Trace)",
      "Bottleneck & Buffer Analysis",
      "Technical Tuning & Optimization Steps"
    ]
  },
  security: {
    pattern: "Risk & Audit Objective → Authorization Mechanics → Controls → Evidence Verification",
    flow: [
      "Risk & Audit Compliance Goal",
      "Authorization Objects & SU24 Proposals",
      "PFCG Role & Security Controls",
      "Verification & Evidence Collection"
    ]
  },
  inventory: {
    pattern: "Core Categories → Technical Objects & T-Codes → Enterprise Purpose → Practical Execution",
    flow: [
      "Core SAP Categories",
      "Technical Objects (T-Codes/Tables/Objects)",
      "Enterprise Purpose & Business Impact",
      "Practical Production Usage"
    ]
  },
  general: {
    pattern: "Direct Answer → Technical Mechanism → Enterprise Best Practice",
    flow: [
      "Direct Technical Response",
      "Core Mechanism & System Logic",
      "Enterprise Best Practice & Governance"
    ]
  }
});

const COMPONENT_TRIGGERS = Object.freeze([
  { pattern: /\b(arm|access request|msmp|brf\+?)\b/i, components: ["ARM", "MSMP", "BRF+", "Provisioning Framework"] },
  { pattern: /\b(ara|sod|segregation of duties|risk analysis|mitigation)\b/i, components: ["ARA", "Risk Rules", "Mitigation Controls", "Permission Level Risk"] },
  { pattern: /\b(eam|firefighter|emergency access|privileged access)\b/i, components: ["EAM", "Firefighter IDs", "Controller Review", "Log Sync"] },
  { pattern: /\b(brm|role management|role design)\b/i, components: ["BRM", "Role Methodology", "Naming Conventions"] },
  { pattern: /\b(pfcg|su24|su25|authorization|role|profile|auth object)\b/i, components: ["PFCG", "SU24", "SU25", "Authorization Objects", "Derived Roles"] },
  { pattern: /\b(fiori|launchpad|catalog|space|page|odata)\b/i, components: ["Fiori Launchpad", "Catalogs", "Spaces", "Pages", "OData Services"] },
  { pattern: /\b(btp|ias|ips|iag|cloud identity|saml|oauth|oidc)\b/i, components: ["BTP", "IAS", "IPS", "IAG", "Cloud Connector", "Principal Propagation"] },
  { pattern: /\b(idm|identity management|repository)\b/i, components: ["SAP IDM", "Identity Center", "Repository Sync", "Pass Vector"] },
  { pattern: /\b(integration|rfc|sm59|snc|api|gateway)\b/i, components: ["SM59", "SNC", "mTLS", "Technical Users"] }
]);

const SECURITY_PROBLEM_TRIGGERS = Object.freeze([
  { pattern: /\b(sod|ara|risk|sox|compliance|audit)\b/i, problem: "Segregation of Duties and access governance exposure." },
  { pattern: /\b(integration|rfc|api|cloud connector|snc|saml|oauth|btp)\b/i, problem: "Unsecured system-to-system boundary communication and identity propagation." },
  { pattern: /\b(eam|firefighter|emergency access)\b/i, problem: "Unmonitored privileged access and inadequate emergency audit trails." },
  { pattern: /\b(fiori|catalog|odata)\b/i, problem: "Over-privileged OData execution and unmapped Fiori tile authorizations." },
  { pattern: /\b(role|authorization|pfcg|su24)\b/i, problem: "Over-broad authorizations and unmaintained SU24 proposals causing authority leaks." }
]);

const DEFAULT_IMPLEMENTATION_POINTS = Object.freeze([
  "Address business objective before introducing SAP technical mechanics",
  "Explain technical WHY and runtime mechanism before HOW",
  "Focus on production-tested configuration objects and T-Codes",
  "Include one real-world enterprise governance or cutover insight",
  "Maintain clear structured flow to facilitate natural conversation"
]);

const DEFAULT_AVOID_TOPICS = Object.freeze([
  "Generic textbook definitions and SAP marketing glossaries",
  "Unrelated SAP modules or obsolete legacy procedures",
  "Vague compliance statements lacking specific SAP objects",
  "Fictional or unverified project experiences"
]);

const DEFAULT_FOLLOW_UPS = Object.freeze([
  "How would you handle performance/scalability bottlenecks in this design?",
  "What is the rollback or contingency strategy if production deployment fails?",
  "How does this impact audit compliance, SOD rules, and SU24 baseline maintenance?",
  "What alternative design options exist for cloud hybrid environments?"
]);

function deriveCategory(intent, answerType) {
  if (answerType === "inventory") return "inventory";
  if (answerType === "comparison") return "comparison";
  if (answerType === "workflow") return "workflow";
  
  const key = String(intent || "").toLowerCase();
  if (REASONING_PATTERNS[key]) return key;
  return "general";
}

function deriveObjective(category) {
  switch (category) {
    case "architecture": return "Design a secure, scalable, and compliant enterprise SAP architecture.";
    case "workflow": return "Deliver automated, fully governed, and auditable business workflows.";
    case "troubleshooting": return "Rapidly diagnose, resolve, and prevent operational disruptions with minimal business impact.";
    case "scenario": return "Ensure business continuity while upholding strict enterprise security controls.";
    case "migration": return "Execute seamless system transformation with zero authorization degradation or cutover risk.";
    case "performance": return "Optimize runtime system throughput while maintaining secure data access controls.";
    case "security": return "Enforce least-privilege authorizations and continuous regulatory compliance.";
    default: return "Provide a precise, production-ready technical solution aligned with SAP best practices.";
  }
}

export function buildReasoningPlan(question = "", analysis = {}) {
  const rawQ = String(question || "").trim();
  const q = rawQ.toLowerCase();

  const intent = analysis.intent || analysis.primaryIntent || "technical";
  const answerType = analysis.answerType || "explanation";
  const category = deriveCategory(intent, answerType);
  const patternConfig = REASONING_PATTERNS[category] || REASONING_PATTERNS.general;

  // 1. Business & Security Problem Discovery
  let securityProblem = "Enterprise authorization governance and risk mitigation.";
  for (let i = 0; i < SECURITY_PROBLEM_TRIGGERS.length; i++) {
    if (SECURITY_PROBLEM_TRIGGERS[i].pattern.test(q)) {
      securityProblem = SECURITY_PROBLEM_TRIGGERS[i].problem;
      break;
    }
  }

  // 2. Component Discovery
  const relevantSapComponents = [];
  for (let i = 0; i < COMPONENT_TRIGGERS.length; i++) {
    if (COMPONENT_TRIGGERS[i].pattern.test(q)) {
      const list = COMPONENT_TRIGGERS[i].components;
      for (let j = 0; j < list.length; j++) {
        if (!relevantSapComponents.includes(list[j])) {
          relevantSapComponents.push(list[j]);
        }
      }
    }
  }

  // 3. Dynamic Target Duration
  const complexity = analysis.complexity || "Medium";
  const targetDuration = (complexity === "Architect" || complexity === "Expert") 
    ? "50-70 seconds" 
    : (complexity === "Advanced") 
      ? "40-60 seconds" 
      : "30-45 seconds";

  return {
    objective: deriveObjective(category),
    businessProblem: `Address enterprise governance for ${analysis.domain || "SAP Systems"}.`,
    securityProblem,
    reasoningPattern: patternConfig.pattern,
    relevantSapComponents,
    implementationPoints: [...DEFAULT_IMPLEMENTATION_POINTS],
    avoidTopics: [...DEFAULT_AVOID_TOPICS],
    expectedFollowUps: [...DEFAULT_FOLLOW_UPS],
    answerFlow: [...patternConfig.flow],
    targetDuration,
    answerType,
    expectedStructure: analysis.expectedStructure || "paragraph",
    expectedDepth: analysis.expectedDepth || "medium",
    isFollowUp: Boolean(analysis.isFollowUp)
  };
}