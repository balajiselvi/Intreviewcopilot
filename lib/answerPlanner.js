export function buildAnswerPlan(question = "", analysis = {}) {

    const q = (question || "").toLowerCase();

    const plan = {

        opening: "",

        sections: [],

        maxDuration: "45-60 seconds",

        thinking: [],

        executionFlow: [],

        mandatoryComponents: [],

        interviewerExpectation: "",

        answerStyle: "Implementation"

    };

    //----------------------------------------------------
    // SAP Topic Detection
    //----------------------------------------------------

    const topic = {

        arm:
            /(access request|arm|grac_request|request management)/i.test(q),

        ara:
            /(access risk|ara|risk analysis|sod)/i.test(q),

        eam:
            /(eam|firefighter|emergency access)/i.test(q),

        role:
            /(role design|role creation|pfcg|derived role|composite role)/i.test(q),

        fiori:
            /(fiori|catalog|group|space|page)/i.test(q),

        btp:
            /(btp|ias|ips|identity authentication|identity provisioning)/i.test(q),

        migration:
            /(migration|upgrade|greenfield|brownfield|rise)/i.test(q),

        troubleshooting:
            /(error|issue|authorization failure|su53|st01|trace)/i.test(q)

    };

      //----------------------------------------------------
    // SAP Specific Planning
    //----------------------------------------------------

    if (topic.arm) {

        plan.opening = "Business Objective";

        plan.sections = [
            "Business Requirement",
            "Request Submission (Fiori/NWBC)",
            "MSMP Workflow",
            "BRF+ Agent Determination",
            "Access Risk Analysis (ARA)",
            "Mitigation Control",
            "Provisioning Framework",
            "Connector Execution",
            "Audit Trail",
            "Business Outcome"
        ];

        plan.mandatoryComponents = [
            "ARM",
            "MSMP",
            "BRF+",
            "ARA",
            "Provisioning Framework",
            "Connectors"
        ];

    }

    else if (topic.ara) {

        plan.opening = "Business Objective";

        plan.sections = [
            "Business Requirement",
            "Rule Set",
            "Function",
            "Risk",
            "Risk Analysis",
            "Mitigation",
            "Compliance Decision",
            "Business Outcome"
        ];

        plan.mandatoryComponents = [
            "ARA",
            "Ruleset",
            "Function",
            "Risk",
            "Mitigation"
        ];

    }

    else if (topic.eam) {

        plan.opening = "Emergency Access Requirement";

        plan.sections = [
            "Business Justification",
            "Firefighter ID",
            "Owner",
            "Controller",
            "Log Review",
            "Reason Codes",
            "Compliance Validation",
            "Business Outcome"
        ];

        plan.mandatoryComponents = [
            "EAM",
            "Firefighter",
            "Owner",
            "Controller",
            "Log Review"
        ];

    }

    else if (topic.role) {

        plan.opening = "Business Requirement";

        plan.sections = [
            "Business Role",
            "SU24 Proposal",
            "Authorization Objects",
            "Single Role",
            "Derived Role",
            "Composite Role",
            "PFCG Generation",
            "User Assignment",
            "Risk Validation",
            "Business Outcome"
        ];

        plan.mandatoryComponents = [
            "PFCG",
            "SU24",
            "SU25",
            "AGR_1251",
            "AGR_USERS"
        ];

    }

    else {
        switch (analysis.intent) {

            case "architecture":

                plan.opening = "Business Objective";

                plan.sections = [
                    "Business Requirement",
                    "Architecture Overview",
                    "Major SAP Components",
                    "Integration Flow",
                    "Security Controls",
                    "Implementation Decisions",
                    "Business Outcome"
                ];

                break;

            case "scenario":

                plan.opening = "Immediate Decision";

                plan.sections = [
                    "Situation",
                    "Business Impact",
                    "Technical Analysis",
                    "Implementation",
                    "Risk Mitigation",
                    "Outcome"
                ];

                break;

            case "troubleshooting":

                plan.opening = "Problem Assessment";

                plan.sections = [
                    "Symptoms",
                    "Evidence Collection",
                    "Root Cause",
                    "Technical Validation",
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
                    "Audit Trail"
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

                plan.opening = "Business Objective";

                plan.sections = [
                    "Business Requirement",
                    "Technical Explanation",
                    "Implementation",
                    "Business Outcome"
                ];

        }

    }
  // Interview thinking model

  plan.thinking = [

    "Identify what the interviewer is actually evaluating.",

    "Answer from an implementation perspective, not from SAP documentation.",

    "Start with the business objective.",

    "Explain WHY before HOW.",

    "Describe the end-to-end execution flow.",

    "Mention only SAP components actually involved in the process.",

    "Explain configuration decisions where applicable.",

    "Explain integration points between SAP components.",

    "Mention production considerations.",

    "Mention governance and audit implications.",

    "Avoid generic definitions.",

    "Avoid repeating the question.",

    "Avoid generic conclusions.",

    "Finish with the business outcome."

];
 //----------------------------------------------------
// Industry Awareness
//----------------------------------------------------

if (
    analysis.industry &&
    analysis.industry !== "General Enterprise"
) {

    plan.sections.push(
        `${analysis.industry} Security & Compliance Considerations`
    );

}

//----------------------------------------------------
// Expert Interview Intelligence
//----------------------------------------------------

if (analysis.complexity === "Expert") {

    plan.sections.push("Architect Recommendation");
    plan.sections.push("Production Considerations");
    plan.sections.push("Common Implementation Mistakes");
    plan.sections.push("Performance Impact");

}

//----------------------------------------------------
// Interviewer Expectations
//----------------------------------------------------

switch ((analysis.interviewerRole || "").toLowerCase()) {

    case "architect":

        plan.interviewerExpectation =
            "Architecture, integration, scalability and governance";

        break;

    case "security":

        plan.interviewerExpectation =
            "Authorization concepts, SoD, risk mitigation and compliance";

        break;

    case "project manager":

        plan.interviewerExpectation =
            "Business value, delivery approach, governance and stakeholder communication";

        break;

    default:

        plan.interviewerExpectation =
            "Balanced business and technical explanation";

}

//----------------------------------------------------
// Return
//----------------------------------------------------

return plan;

}