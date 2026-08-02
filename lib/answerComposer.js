export function composeAnswerBlueprint(

  analysis = {},

  reasoningPlan = {},

  evidence = {},

  sapComponents = []

) {

  const blueprint = {

    opening: "",

    body: [],

    closing: "",

    mandatoryEvidence: [],

    mandatoryComponents: sapComponents,

    implementationInsight: "",

    followUpProtection: []

  };

  // ------------------------------------
  // Opening

  switch (analysis.intent) {

    case "architecture":

      blueprint.opening =
        "Begin with the business objective, then explain why this architecture is required.";

      break;

    case "workflow":

      blueprint.opening =
        "Start from the business request that triggers the workflow.";

      break;

    case "scenario":

      blueprint.opening =
        "Start with your immediate decision and explain why.";

      break;

    case "troubleshooting":

      blueprint.opening =
        "Start with symptoms and evidence before discussing the fix.";

      break;

    case "comparison":

      blueprint.opening =
        "State the biggest difference in one sentence.";

      break;

    default:

      blueprint.opening =
        "Answer the business objective before discussing SAP.";

  }

  // ------------------------------------
  // Body

  reasoningPlan.answerFlow.forEach(step => {

    blueprint.body.push({

      section: step,

      evidence:

        evidence.businessEvidence
          .concat(evidence.technicalEvidence)
          .concat(evidence.architectureEvidence)
          .concat(evidence.workflowEvidence)
          .concat(evidence.implementationEvidence)
          .slice(0, 3)

    });

  });

  // ------------------------------------
  // Mandatory Evidence

  blueprint.mandatoryEvidence = [

    ...evidence.businessEvidence.slice(0,2),

    ...evidence.technicalEvidence.slice(0,3),

    ...evidence.implementationEvidence.slice(0,2)

  ];

  // ------------------------------------
  // Implementation Insight

  if (evidence.implementationEvidence.length) {

    blueprint.implementationInsight =
      evidence.implementationEvidence[0];

  }

  // ------------------------------------
  // Follow-up Protection

  blueprint.followUpProtection =

    reasoningPlan.expectedFollowUps;

  // ------------------------------------
  // Closing

  blueprint.closing =
    "Finish naturally with the business outcome instead of a generic conclusion.";

  return blueprint;

}