export function selfReflect({

  question,

  answer,

  analysis = {},

  reasoningPlan = {},

  evaluation = {}

}) {

  const reflection = {

    regenerate: false,

    confidence: 10,

    missingConcepts: [],

    weaknesses: [],

    improvementPrompt: ""

  };

  const text = (answer || "").toLowerCase();

  //------------------------------------
  // Intent Validation

  switch (analysis.intent) {

    case "architecture":

      if (!/architecture|design|component|integration|runtime/.test(text)) {

        reflection.confidence -= 2;

        reflection.missingConcepts.push(
          "Architecture explanation"
        );

      }

      break;

    case "workflow":

      if (!/approval|workflow|request|provision|risk/.test(text)) {

        reflection.confidence -= 2;

        reflection.missingConcepts.push(
          "Workflow sequence"
        );

      }

      break;

    case "troubleshooting":

      if (!/root cause|diagnosis|resolution|trace|evidence/.test(text)) {

        reflection.confidence -= 2;

        reflection.missingConcepts.push(
          "Troubleshooting methodology"
        );

      }

      break;

    case "scenario":

      if (!/immediate|priority|approach|risk/.test(text)) {

        reflection.confidence -= 2;

        reflection.missingConcepts.push(
          "Decision-making process"
        );

      }

      break;

  }

  //------------------------------------
  // Business First

  if (

    !text.includes("business") &&

    !text.includes("objective") &&

    !text.includes("requirement")

  ) {

    reflection.confidence--;

    reflection.weaknesses.push(

      "Business objective not clearly stated."

    );

  }

  //------------------------------------
  // Why Before How

  if (

    !text.includes("because") &&

    !text.includes("therefore") &&

    !text.includes("so that")

  ) {

    reflection.confidence--;

    reflection.weaknesses.push(

      "Explains HOW without WHY."

    );

  }

  //------------------------------------
  // Enterprise Thinking

  if (

    !text.includes("enterprise") &&

    !text.includes("implementation") &&

    !text.includes("production")

  ) {

    reflection.confidence--;

    reflection.weaknesses.push(

      "Enterprise implementation thinking missing."

    );

  }

  //------------------------------------
  // Generic Statements

  const generic = [

    "best practice",

    "overall security",

    "improves compliance",

    "proper governance"

  ];

  generic.forEach(item => {

    if (text.includes(item)) {

      reflection.confidence--;

      reflection.weaknesses.push(

        `Generic wording: ${item}`

      );

    }

  });

  //------------------------------------
  // Evaluation

  if (

    evaluation.overallScore &&
    evaluation.overallScore < 9.3

  ) {

    reflection.confidence -= 2;

  }

  //------------------------------------
  // Final Decision

  if (

    reflection.confidence < 8

  ) {

    reflection.regenerate = true;

    reflection.improvementPrompt = `

Improve the previous interview answer.

Missing concepts:

${reflection.missingConcepts.join("\n")}

Weaknesses:

${reflection.weaknesses.join("\n")}

Requirements:

- Business objective first

- Explain WHY before HOW

- Stronger architect-level reasoning

- Enterprise implementation focus

- Remove generic wording

Return ONLY the improved answer.

`;

  }

  return reflection;

}