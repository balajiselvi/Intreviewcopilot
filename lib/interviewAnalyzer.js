export function analyzeInterviewQuestion(question = "") {

  const q = question.toLowerCase();

  const analysis = {

    intent: "technical",

    domain: "General SAP",

    industry: "General Enterprise",

    businessProcess: "General",

    candidateLevel: "Lead",

    interviewerIntent: "Technical Knowledge",

    complexity: "Medium",

    expectedAnswer: "Technical",

    answerStyle: "Direct",

    followUpRisk: "Medium"

  };

  // ===========================
  // Intent
  // ===========================

  if (/(how would|scenario|suppose|assume|case study|customer asks|production issue|real time|real-time|what would)/i.test(q))
    analysis.intent = "scenario";

  else if (/(difference|compare|versus|vs|better|advantages|disadvantages)/i.test(q))
    analysis.intent = "comparison";

  else if (/(architecture|design|landscape|framework|integration|components|blueprint)/i.test(q))
    analysis.intent = "architecture";

  else if (/(issue|error|failure|troubleshoot|root cause|debug|authorization failed|su53|st01|st22|sm21|slg1|sm37)/i.test(q))
    analysis.intent = "troubleshooting";

  else if (/(workflow|approval|process|arm|msmp|brf|provisioning|request flow|access request)/i.test(q))
    analysis.intent = "workflow";

  else if (/(migration|upgrade|conversion|brownfield|greenfield|rise)/i.test(q))
    analysis.intent = "migration";

  else if (/(leadership|stakeholder|team|manager|delivery|governance|program|project)/i.test(q))
    analysis.intent = "leadership";

  // ===========================
  // SAP Domain
  // ===========================

  if (/(grc|ara|arm|eam|firefighter|sod|risk analysis|access control|msmp|brf)/i.test(q))
    analysis.domain = "SAP GRC";

  else if (/(idm|identity management|identity center|repository|pass)/i.test(q))
    analysis.domain = "SAP IDM";

  else if (/(ias|ips|iag|identity authentication|identity provisioning)/i.test(q))
    analysis.domain = "SAP Cloud Identity";

  else if (/(pfcg|su24|su25|su01|authorization|role|profile)/i.test(q))
    analysis.domain = "SAP Security";

  else if (/(fiori|launchpad|catalog|space|page|tile)/i.test(q))
    analysis.domain = "SAP Fiori Security";

  else if (/(s4hana|ecc|hana|abap|gateway)/i.test(q))
    analysis.domain = "SAP Platform";

  // ===========================
  // Industry
  // ===========================

  if (/(defence|defense|military|army|navy|air force|munition|border|homeland security)/i.test(q))
    analysis.industry = "Defense";

  else if (/(bank|banking|swift|payment|treasury|financial)/i.test(q))
    analysis.industry = "Banking";

  else if (/(hospital|patient|healthcare|hipaa|medical|pharma)/i.test(q))
    analysis.industry = "Healthcare";

  else if (/(oil|gas|energy|refinery|petrochemical)/i.test(q))
    analysis.industry = "Oil & Gas";

  else if (/(government|public sector|ministry|authority|municipality)/i.test(q))
    analysis.industry = "Government";

  else if (/(manufacturing|factory|production|plant)/i.test(q))
    analysis.industry = "Manufacturing";

  else if (/(retail|consumer|store|commerce)/i.test(q))
    analysis.industry = "Retail";

  // ===========================
  // Business Process
  // ===========================

  if (/(procurement|vendor|purchase|po)/i.test(q))
    analysis.businessProcess = "Procurement";

  else if (/(warehouse|inventory|logistics|supply)/i.test(q))
    analysis.businessProcess = "Logistics";

  else if (/(finance|payment|invoice|gl|ap|ar)/i.test(q))
    analysis.businessProcess = "Finance";

  else if (/(hr|employee|payroll|successfactors)/i.test(q))
    analysis.businessProcess = "Human Resources";

  // ===========================
  // Complexity
  // ===========================

  if (
    analysis.intent === "architecture" ||
    analysis.intent === "scenario" ||
    analysis.intent === "migration" ||
    analysis.industry !== "General Enterprise"
  ) {

    analysis.complexity = "Expert";

  }

  // ===========================
  // Interview Intent
  // ===========================

  switch (analysis.intent) {

    case "scenario":
      analysis.interviewerIntent = "Decision Making";
      analysis.answerStyle = "Business First";
      analysis.followUpRisk = "High";
      break;

    case "architecture":
      analysis.interviewerIntent = "Solution Design";
      analysis.answerStyle = "Architectural";
      analysis.followUpRisk = "High";
      break;

    case "workflow":
      analysis.interviewerIntent = "Implementation";
      analysis.answerStyle = "Sequential";
      break;

    case "comparison":
      analysis.interviewerIntent = "Conceptual Clarity";
      analysis.answerStyle = "Comparative";
      break;

    case "troubleshooting":
      analysis.interviewerIntent = "Production Support";
      analysis.answerStyle = "Investigative";
      break;

    case "migration":
      analysis.interviewerIntent = "Transformation";
      analysis.answerStyle = "Strategic";
      break;

    case "leadership":
      analysis.interviewerIntent = "Leadership";
      analysis.answerStyle = "Executive";
      break;

    default:
      analysis.interviewerIntent = "Technical Knowledge";

  }

  return analysis;

}