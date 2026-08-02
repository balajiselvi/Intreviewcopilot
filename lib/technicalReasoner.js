/*
=========================================================
Technical Reasoner V2
Principal Architect Decision Engine
=========================================================
*/

const INTENT_PATTERNS = {

  architecture: {
    objective:
      "Design a secure, scalable and maintainable enterprise architecture.",
    sequence: [
      "Business Objective",
      "Architecture",
      "Security Controls",
      "Implementation",
      "Operations",
      "Recommendation"
    ]
  },

  workflow: {
    objective:
      "Deliver governed business processes with complete auditability.",
    sequence: [
      "Business Requirement",
      "Workflow",
      "Risk Analysis",
      "Approval",
      "Provisioning",
      "Audit"
    ]
  },

  troubleshooting: {
    objective:
      "Restore production service with minimum business disruption.",
    sequence: [
      "Symptoms",
      "Evidence",
      "Diagnosis",
      "Root Cause",
      "Resolution",
      "Prevention"
    ]
  },

  scenario: {
    objective:
      "Protect business continuity while reducing operational and security risk.",
    sequence: [
      "Immediate Action",
      "Risk",
      "Decision",
      "Implementation",
      "Monitoring",
      "Outcome"
    ]
  },

  comparison: {
    objective:
      "Evaluate alternative enterprise approaches.",
    sequence: [
      "Primary Difference",
      "Comparison",
      "Trade-offs",
      "Recommendation"
    ]
  },

  migration: {
    objective:
      "Transform the security landscape with controlled business risk.",
    sequence: [
      "Current State",
      "Target State",
      "Migration Strategy",
      "Cutover",
      "Validation"
    ]
  },

  leadership: {
    objective:
      "Deliver secure enterprise solutions through leadership and governance.",
    sequence: [
      "Situation",
      "Decision",
      "Execution",
      "Governance",
      "Outcome"
    ]
  }

};

const DOMAIN_PATTERNS = {

  "SAP GRC": {

    mandatoryComponents: [

      "ARA",

      "ARM",

      "EAM",

      "BRM"

    ],

    optionalComponents: [

      "MSMP",

      "BRF+",

      "Firefighter",

      "Risk Analysis"

    ],

    businessRisk:

      "Excessive access can introduce compliance and operational risk.",

    securityRisk:

      "Segregation of Duties violations and privileged access misuse."

  },

  "SAP Security": {

    mandatoryComponents: [

      "PFCG",

      "SU24"

    ],

    optionalComponents: [

      "SU25",

      "SU53",

      "ST01",

      "Authorization Objects"

    ],

    businessRisk:

      "Incorrect role design impacts business continuity.",

    securityRisk:

      "Excessive authorizations violate least privilege."

  }

};
const COMPONENT_LIBRARY = {

  ARA: {

    expandsTo: [

      "Risk Analysis",

      "Function",

      "Action",

      "Permission",

      "Risk ID",

      "Mitigation Control",

      "Critical Access",

      "Critical Permission"

    ]

  },

  ARM: {

    expandsTo: [

      "Access Request",

      "MSMP",

      "BRF+",

      "Provisioning",

      "Approval Path",

      "Notification",

      "Connector",

      "Provisioning Framework"

    ]

  },

  EAM: {

    expandsTo: [

      "Firefighter",

      "Firefighter ID",

      "Owner",

      "Controller",

      "Log Review",

      "Session Log",

      "Reason Code"

    ]

  },

  PFCG: {

    expandsTo: [

      "Single Role",

      "Composite Role",

      "Derived Role",

      "Authorization Object",

      "Organizational Level",

      "AGR_1251",

      "AGR_USERS"

    ]

  },

  SU24: {

    expandsTo: [

      "Check Indicators",

      "Proposal Values",

      "Authorization Defaults",

      "USOBT_C",

      "USOBX_C"

    ]

  },

  RFC: {

    expandsTo: [

      "SM59",

      "Trusted RFC",

      "S_RFC",

      "Technical User",

      "SNC",

      "STRUST"

    ]

  },

  IAS: {

    expandsTo: [

      "Identity Federation",

      "Conditional Authentication",

      "Corporate Identity Provider",

      "Trust",

      "SAML"

    ]

  },

  IPS: {

    expandsTo: [

      "Provisioning Jobs",

      "Source System",

      "Target System",

      "Transformation",

      "Identity Synchronization"

    ]

  },

  IAG: {

    expandsTo: [

      "Cloud Risk Analysis",

      "Access Certification",

      "Cloud ARM",

      "Role Design"

    ]

  },

  "Cloud Connector": {

    expandsTo: [

      "Principal Propagation",

      "Destination",

      "On-Premise Tunnel",

      "TLS",

      "Access Control"

    ]

  }

};

const INDUSTRY_PATTERNS = {

  Defense: {

    focus: [

      "Mission Continuity",

      "Zero Trust",

      "Data Sovereignty",

      "Air-Gapped Networks"

    ]

  },

  Government: {

    focus: [

      "Compliance",

      "Auditability",

      "Identity Governance",

      "High Availability"

    ]

  },

  Banking: {

    focus: [

      "PCI DSS",

      "Fraud Prevention",

      "Segregation of Duties",

      "Privileged Access"

    ]

  },

  Manufacturing: {

    focus: [

      "Production Availability",

      "Operational Continuity",

      "Shop Floor Security"

    ]

  },

  Healthcare: {

    focus: [

      "Patient Privacy",

      "Emergency Access",

      "Audit Logging"

    ]

  }

};

function expandComponents(

  components = []

) {

  const expanded = new Set();

  components.forEach(component => {

    expanded.add(component);

    const definition =

      COMPONENT_LIBRARY[component];

    if (!definition)
      return;

    definition.expandsTo.forEach(

      item => expanded.add(item)

    );

  });

  return Array.from(expanded);

}
function getIntentPattern(intent = "") {

  return (

    INTENT_PATTERNS[intent] ||

    INTENT_PATTERNS.architecture

  );

}

function getDomainPattern(domain = "") {

  return (

    DOMAIN_PATTERNS[domain] ||

    {

      mandatoryComponents: [],

      optionalComponents: [],

      businessRisk:
        "Business continuity may be affected.",

      securityRisk:
        "Least privilege and governance must be maintained."

    }

  );

}

function getIndustryPattern(industry = "") {

  return (

    INDUSTRY_PATTERNS[industry] ||

    {

      focus: [

        "Business Continuity",

        "Operational Governance",

        "Scalability"

      ]

    }

  );

}

function buildTradeOffs(

  analysis = {}

) {

  const tradeOffs = [];

  switch (analysis.intent) {

    case "architecture":

      tradeOffs.push(

        "Security vs Usability",

        "Performance vs Monitoring",

        "Standard SAP vs Custom Development",

        "Scalability vs Complexity"

      );

      break;

    case "workflow":

      tradeOffs.push(

        "Automation vs Governance",

        "Approval Speed vs Risk Control"

      );

      break;

    case "scenario":

      tradeOffs.push(

        "Business Continuity vs Security Restriction",

        "Immediate Recovery vs Long-Term Hardening"

      );

      break;

    case "migration":

      tradeOffs.push(

        "Migration Speed vs Validation",

        "Minimal Downtime vs Complete Testing"

      );

      break;

    default:

      tradeOffs.push(

        "Business Agility vs Security"

      );

  }

  return tradeOffs;

}

function buildProductionConsiderations(

  analysis = {}

) {

  const considerations = [

    "Monitoring",

    "Audit Logging",

    "Operational Support",

    "Change Management"

  ];

  if (

    analysis.intent === "troubleshooting"

  ) {

    considerations.unshift(

      "Evidence Collection",

      "Root Cause Analysis"

    );

  }

  if (

    analysis.intent === "architecture"

  ) {

    considerations.push(

      "Scalability",

      "High Availability"

    );

  }

  return considerations;

}
function buildExpectedFollowUps(

  analysis = {},

  domain = ""

) {

  const followUps = [];

  switch (analysis.intent) {

    case "architecture":

      followUps.push(

        "Why was this architecture selected?",

        "What alternative architecture exists?",

        "How would you secure the runtime?",

        "What are the scalability considerations?"

      );

      break;

    case "workflow":

      followUps.push(

        "How is approval determined?",

        "Where is risk evaluated?",

        "How is provisioning triggered?",

        "How is the workflow audited?"

      );

      break;

    case "troubleshooting":

      followUps.push(

        "Which logs would you check first?",

        "How do you prove the root cause?",

        "How do you prevent recurrence?"

      );

      break;

    case "scenario":

      followUps.push(

        "What would you do if the first approach failed?",

        "How would you minimize business impact?",

        "How would you communicate the risk?"

      );

      break;

    default:

      followUps.push(

        "Why is this the preferred SAP approach?",

        "What are the implementation challenges?"

      );

  }

  if (domain === "SAP GRC") {

    followUps.push(

      "How is SoD evaluated?",

      "How is emergency access controlled?"

    );

  }

  if (domain === "SAP Security") {

    followUps.push(

      "How do you validate authorizations?",

      "How do you optimize SU24 proposals?"

    );

  }

  return [...new Set(followUps)];

}

function buildRecommendation(

  analysis = {},

  industryPattern = {}

) {

  if (analysis.intent === "architecture") {

    return "Use SAP standard capabilities first, apply least privilege, design for scalability, and introduce custom development only when standard functionality cannot satisfy the business requirement.";

  }

  if (analysis.intent === "workflow") {

    return "Prefer configuration-driven workflows with governance, risk analysis and auditability rather than custom workflow logic.";

  }

  if (analysis.intent === "troubleshooting") {

    return "Diagnose using evidence before implementing corrective actions, and validate the resolution before closing the incident.";

  }

  return `Adopt an enterprise approach that balances business objectives, security controls and operational maintainability while considering ${industryPattern.focus.join(", ")}.`;

}

function removeDuplicates(array = []) {

  return [...new Set(array.filter(Boolean))];

}
export function buildTechnicalReasoning(

  question = "",

  analysis = {},

  sapComponents = [],

  interviewer = {}

) {

  const intentPattern =

    getIntentPattern(

      analysis.intent

    );

  const domainPattern =

    getDomainPattern(

      analysis.domain

    );

  const industryPattern =

    getIndustryPattern(

      analysis.industry

    );

  const components =

    removeDuplicates([

      ...domainPattern.mandatoryComponents,

      ...sapComponents,

      ...domainPattern.optionalComponents

    ]);

  const expandedComponents =

    expandComponents(

      components

    );

  const implementationSequence =

    intentPattern.sequence;

  const tradeOffs =

    buildTradeOffs(

      analysis

    );

  const productionConsiderations =

    buildProductionConsiderations(

      analysis

    );

  const followUps =

    buildExpectedFollowUps(

      analysis,

      analysis.domain

    );

  const recommendation =

    buildRecommendation(

      analysis,

      industryPattern

    );

  return {

    businessObjective:

      intentPattern.objective,

    businessRisk:

      domainPattern.businessRisk,

    securityRisk:

      domainPattern.securityRisk,

    industryFocus:

      industryPattern.focus,

    mandatoryComponents:

      domainPattern.mandatoryComponents,

    optionalComponents:

      domainPattern.optionalComponents,

    recommendedComponents:

      expandedComponents,

    implementationSequence,

    tradeOffs,

    productionConsiderations,

    governanceConsideration:

      "Ensure every design remains auditable, supportable and aligned with enterprise governance.",

    interviewerExpectation:

      interviewer.expectation ||

      "",

    expectedFollowUps:

      followUps,

    finalRecommendation:

      recommendation,
    question,

    analysis,

    interviewer,

    architectMindset: {

      thinkBusinessFirst: true,

      explainWhyBeforeHow: true,

      useStandardSapFirst: true,

      avoidCustomUnlessRequired: true,

      considerOperations: true,

      considerGovernance: true,

      anticipateFollowUps: true

    }

  };

}