export function evaluateInterviewAnswer({

  question,

  answer,

  analysis = {},

  reasoningPlan = {},

  sapComponents = []

}) {

  const text = (answer || "").toLowerCase();

  const evaluation = {

    overallScore: 10,

    regenerate: false,

    categoryScores: {

      technicalAccuracy: 10,

      architectThinking: 10,

      businessUnderstanding: 10,

      implementationDepth: 10,

      interviewPresence: 10,

      conciseness: 10

    },

    findings: [],

    improvementPrompt: ""

  };

  //----------------------------------------
  // Length

  const words =
    answer.trim().split(/\s+/).length;

  if (words < 70) {

    evaluation.categoryScores.conciseness -= 2;

    evaluation.findings.push(
      "Answer is too short."
    );

  }

  if (words > 180) {

    evaluation.categoryScores.conciseness -= 2;

    evaluation.findings.push(
      "Answer is too lengthy."
    );

  }

  //----------------------------------------
  // Business Objective

  if (

    !text.includes("business") &&

    !text.includes("objective") &&

    !text.includes("requirement")

  ) {

    evaluation.categoryScores.businessUnderstanding -= 2;

    evaluation.findings.push(

      "Business objective is missing."

    );

  }

  //----------------------------------------
  // WHY before HOW

  if (

    !text.includes("because") &&

    !text.includes("therefore") &&

    !text.includes("so that")

  ) {

    evaluation.categoryScores.architectThinking -= 1;

    evaluation.findings.push(

      "Reasoning is weak."

    );

  }

  //----------------------------------------
  // SAP Components

  let componentHits = 0;

  sapComponents.forEach(component => {

    if (

      text.includes(

        component.toLowerCase()

      )

    ) {

      componentHits++;

    }

  });

  if (

    sapComponents.length > 0 &&

    componentHits <

    Math.min(2, sapComponents.length)

  ) {

    evaluation.categoryScores.technicalAccuracy -= 2;

    evaluation.findings.push(

      "Expected SAP components are missing."

    );

  }

  //----------------------------------------
  // Enterprise Thinking

  if (

    !text.includes("enterprise") &&

    !text.includes("implementation") &&

    !text.includes("production")

  ) {

    evaluation.categoryScores.implementationDepth -= 2;

    evaluation.findings.push(

      "Implementation insight missing."

    );

  }

  //----------------------------------------
  // Generic Statements

  const generic = [

    "best practice",

    "proper governance",

    "overall security",

    "this improves compliance",

    "this enhances security"

  ];

  generic.forEach(item => {

    if (

      text.includes(item)

    ) {

      evaluation.categoryScores.interviewPresence -= 1;

      evaluation.findings.push(

        `Generic statement detected: ${item}`

      );

    }

  });

  //----------------------------------------
  // Hallucination Detection

  const hallucinations = [

    "my project",

    "our customer",

    "when i implemented",

    "our client",

    "during my deployment"

  ];

  hallucinations.forEach(item => {

    if (

      text.includes(item)

    ) {

      evaluation.overallScore -= 2;

      evaluation.findings.push(

        "Possible fabricated experience."

      );

    }

  });

  //----------------------------------------
  // Calculate

  const scores = Object.values(

    evaluation.categoryScores

  );

  evaluation.overallScore =

    scores.reduce(

      (a, b) => a + b,

      0

    ) / scores.length;

  //----------------------------------------
  // Regeneration

  if (

    evaluation.overallScore < 9.3

  ) {

    evaluation.regenerate = true;

    evaluation.improvementPrompt = `

Improve the previous interview answer.

Issues found:

${evaluation.findings.join("\n")}

Requirements:

• Business objective first

• Explain WHY before HOW

• Mention only relevant SAP components

• Increase implementation depth

• Sound like a Principal Architect

• Remove generic statements

Return ONLY the improved answer.

`;

  }

  return evaluation;

}