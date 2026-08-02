export function profileInterviewer(question = "", analysis = {}) {

  const q = question.toLowerCase();

  const profile = {

    interviewer: "Senior SAP Technical Lead",

    expectation: "",

    answerStyle: "",

    technicalDepth: "High",

    preferredFocus: [],

    avoid: [],

    expectedFollowUps: []

  };

  //---------------------------------------------------
  // Enterprise Architect

  if (

    /(architecture|landscape|integration|design|framework|blueprint|platform)/i.test(q)

  ) {

    profile.interviewer =

      "Enterprise / Solution Architect";

    profile.expectation =

      "Architecture decisions and technical trade-offs.";

    profile.answerStyle =

      "Architecture First";

    profile.preferredFocus = [

      "Business Objective",

      "Architecture",

      "Integration",

      "Security",

      "Trade-offs",

      "Enterprise Scalability"

    ];

  }

  //---------------------------------------------------
  // SAP Security Lead

  else if (

    /(authorization|role|pfcg|su24|su25|grc|ara|arm|eam|firefighter|risk)/i.test(q)

  ) {

    profile.interviewer =

      "SAP Security / GRC Lead";

    profile.expectation =

      "Deep SAP Security implementation knowledge.";

    profile.answerStyle =

      "Implementation First";

    profile.preferredFocus = [

      "Business Requirement",

      "Security Design",

      "SAP Transactions",

      "Authorization",

      "Governance",

      "Audit"

    ];

  }

  //---------------------------------------------------
  // Production Support Lead

  else if (

    /(issue|error|troubleshoot|su53|st01|st22|dump|trace|problem|incident)/i.test(q)

  ) {

    profile.interviewer =

      "Production Support Manager";

    profile.expectation =

      "Root cause analysis and structured troubleshooting.";

    profile.answerStyle =

      "Evidence Driven";

    profile.preferredFocus = [

      "Symptoms",

      "Evidence",

      "Diagnosis",

      "Resolution",

      "Prevention"

    ];

  }

  //---------------------------------------------------
  // Project / Delivery Manager

  else if (

    /(project|stakeholder|delivery|team|deadline|budget|resource|governance|leadership)/i.test(q)

  ) {

    profile.interviewer =

      "Program / Delivery Manager";

    profile.expectation =

      "Leadership, planning and execution.";

    profile.answerStyle =

      "Business Outcome";

    profile.preferredFocus = [

      "Situation",

      "Decision",

      "Execution",

      "Stakeholder Management",

      "Outcome"

    ];

  }

  //---------------------------------------------------
  // CIO / Director

  else if (

    /(strategy|roadmap|future|vision|digital transformation|value|business case)/i.test(q)

  ) {

    profile.interviewer =

      "CIO / Technology Director";

    profile.expectation =

      "Business value and strategic thinking.";

    profile.answerStyle =

      "Executive";

    profile.preferredFocus = [

      "Business Value",

      "Risk",

      "ROI",

      "Architecture",

      "Governance"

    ];

  }

  //---------------------------------------------------
  // Auditor

  else if (

    /(audit|sox|compliance|control|risk assessment|evidence)/i.test(q)

  ) {

    profile.interviewer =

      "Internal / External Auditor";

    profile.expectation =

      "Control effectiveness and compliance.";

    profile.answerStyle =

      "Control Based";

    profile.preferredFocus = [

      "Control",

      "Risk",

      "Evidence",

      "Audit Trail",

      "Compliance"

    ];

  }

  //---------------------------------------------------
  // Avoid

  profile.avoid = [

    "Textbook definitions",

    "Marketing language",

    "Generic compliance statements",

    "Repeating the question",

    "Irrelevant SAP modules"

  ];

  //---------------------------------------------------
  // Expected Follow-up

  profile.expectedFollowUps = [

    "Why this approach?",

    "Alternative solution?",

    "Implementation challenge?",

    "Production impact?",

    "Best practice?",

    "Security trade-off?"

  ];

  return profile;

}