export function buildAnswerPlan(question = "", analysis = {}) {

  const plan = {
    opening: "",
    sections: [],
    maxDuration: "35-50 seconds",
    thinking: []
  };

  switch (analysis.intent) {

    case "architecture":

      plan.opening = "Business Objective";

      plan.sections = [
        "Business Requirement",
        "Architecture",
        "Major Components",
        "Runtime Flow",
        "Security Controls",
        "Implementation Decision",
        "Business Outcome"
      ];

      break;

    case "scenario":

      plan.opening = "Business Objective";

      plan.sections = [
        "Immediate Decision",
        "Reasoning",
        "SAP Components",
        "Implementation Steps",
        "Risk Mitigation",
        "Business Outcome"
      ];

      break;

    case "troubleshooting":

      plan.opening = "Problem Assessment";

      plan.sections = [
        "Symptoms",
        "Evidence Collection",
        "Root Cause Analysis",
        "Validation",
        "Resolution",
        "Prevention"
      ];

      break;

    case "workflow":

      plan.opening = "Business Requirement";

      plan.sections = [
        "Request Initiation",
        "Validation",
        "Risk Analysis",
        "Approval Workflow",
        "Provisioning",
        "Audit"
      ];

      break;

    case "comparison":

      plan.opening = "Core Difference";

      plan.sections = [
        "Purpose",
        "Architecture",
        "Advantages",
        "Limitations",
        "Recommendation"
      ];

      break;

    case "migration":

      plan.opening = "Current Landscape";

      plan.sections = [
        "Target Landscape",
        "Migration Strategy",
        "Security Changes",
        "Risk Mitigation",
        "Validation"
      ];

      break;

    case "leadership":

      plan.opening = "Situation";

      plan.sections = [
        "Challenge",
        "Decision",
        "Execution",
        "Stakeholder Management",
        "Outcome",
        "Lessons Learned"
      ];

      break;

    default:

      plan.opening = "Direct Answer";

      plan.sections = [
        "Technical Explanation",
        "Implementation",
        "Business Benefit"
      ];

  }

  // Interview thinking model

  plan.thinking = [

    "Understand what the interviewer is actually testing",

    "Answer the business problem before SAP technology",

    "Explain WHY before HOW",

    "Mention only the SAP components relevant to the question",

    "Include one enterprise implementation insight",

    "Finish naturally without unnecessary summary"

  ];

  // Industry awareness

  if (
    analysis.industry &&
    analysis.industry !== "General Enterprise"
  ) {

    plan.sections.push(
      `${analysis.industry} Considerations`
    );

  }

  // Expert questions

  if (analysis.complexity === "Expert") {

    plan.sections.push(
      "Architect Recommendation"
    );

  }

  return plan;

}