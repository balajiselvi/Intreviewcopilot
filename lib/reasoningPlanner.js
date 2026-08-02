export function buildReasoningPlan(question = "", analysis = {}) {

  const q = question.toLowerCase();

  const plan = {

    objective: "",
    businessProblem: "",
    securityProblem: "",
    reasoningPattern: "",
    relevantSapComponents: [],
    implementationPoints: [],
    avoidTopics: [],
    expectedFollowUps: [],
    answerFlow: [],
    targetDuration: "35-50 seconds"

  };

  // -----------------------------
  // Business Objective
  // -----------------------------

  if (analysis.intent === "architecture")
    plan.objective = "Design a secure, scalable enterprise architecture.";

  else if (analysis.intent === "workflow")
    plan.objective = "Deliver governed, auditable business processes.";

  else if (analysis.intent === "scenario")
    plan.objective = "Maintain business continuity while minimizing security risk.";

  else if (analysis.intent === "troubleshooting")
    plan.objective = "Restore secure operations with minimum business impact.";

  else if (analysis.intent === "migration")
    plan.objective = "Transform securely with minimum operational risk.";

  else
    plan.objective = "Provide a technically correct enterprise solution.";

  // -----------------------------
  // Security Problem
  // -----------------------------

  if (/(sod|ara|risk)/i.test(q))
    plan.securityProblem = "Segregation of Duties and access governance.";

  else if (/(integration|rfc|api|cloud connector|snc|saml|oauth)/i.test(q))
    plan.securityProblem = "Secure system-to-system communication.";

  else if (/(role|authorization|pfcg|su24|fiori)/i.test(q))
    plan.securityProblem = "Least privilege authorization design.";

  else if (/(firefighter|eam)/i.test(q))
    plan.securityProblem = "Controlled privileged access.";

  else
    plan.securityProblem = "Enterprise security governance.";

  // -----------------------------
  // SAP Component Discovery
  // -----------------------------

  const add = (...items) =>
    items.forEach(i => {
      if (!plan.relevantSapComponents.includes(i))
        plan.relevantSapComponents.push(i);
    });

  if (/(arm|access request)/i.test(q))
    add("ARM","MSMP","BRF+","ARA","Provisioning Framework");

  if (/(ara|sod|risk)/i.test(q))
    add("ARA","Risk Rules","Mitigation Controls","Risk IDs");

  if (/(eam|firefighter)/i.test(q))
    add("EAM","Firefighter IDs","Controller","Log Review");

  if (/(role|authorization|pfcg|su24)/i.test(q))
    add("PFCG","SU24","SU25","Authorization Objects");

  if (/(integration|api|rfc)/i.test(q))
    add("SM59","SNC","Technical Communication Users");

  if (/(cloud|ias|ips|iag)/i.test(q))
    add("IAS","IPS","IAG","Cloud Connector");

  if (/(fiori)/i.test(q))
    add("Catalogs","Spaces","Pages","OData Security");

  // -----------------------------
  // Reasoning Pattern
  // -----------------------------

  switch (analysis.intent) {

    case "architecture":

      plan.reasoningPattern = "Business → Architecture → Runtime → Security → Trade-off";

      plan.answerFlow = [

        "Business Objective",

        "Architecture",

        "Components",

        "Runtime Flow",

        "Security Controls",

        "Implementation",

        "Business Outcome"

      ];

      break;

    case "workflow":

      plan.reasoningPattern = "Request → Validation → Risk → Approval → Provision";

      plan.answerFlow = [

        "Business Requirement",

        "Workflow",

        "Risk Analysis",

        "Approval",

        "Provisioning",

        "Audit"

      ];

      break;

    case "scenario":

      plan.reasoningPattern = "Decision → Reason → Action → Risk → Outcome";

      plan.answerFlow = [

        "Immediate Action",

        "Reasoning",

        "Implementation",

        "Risk",

        "Outcome"

      ];

      break;

    case "troubleshooting":

      plan.reasoningPattern = "Evidence → Root Cause → Resolution";

      plan.answerFlow = [

        "Symptoms",

        "Evidence",

        "Diagnosis",

        "Fix",

        "Prevention"

      ];

      break;

    default:

      plan.reasoningPattern = "Business → Technical → Implementation";

      plan.answerFlow = [

        "Direct Answer",

        "Technical Explanation",

        "Implementation"

      ];

  }

  // -----------------------------
  // Implementation Points
  // -----------------------------

  plan.implementationPoints = [

    "Business objective before SAP technology",

    "Explain WHY before HOW",

    "Mention only relevant SAP components",

    "Include one enterprise implementation insight",

    "Leave room for follow-up questions"

  ];

  // -----------------------------
  // Avoid
  // -----------------------------

  plan.avoidTopics = [

    "Textbook definitions",

    "Marketing language",

    "Generic compliance statements",

    "Fake project stories",

    "Unrelated SAP components"

  ];

  // -----------------------------
  // Expected Follow-up
  // -----------------------------

  plan.expectedFollowUps = [

    "Why this approach?",

    "Alternative design?",

    "Implementation challenge?",

    "Security trade-off?",

    "Best practice?"

  ];

  return plan;

}