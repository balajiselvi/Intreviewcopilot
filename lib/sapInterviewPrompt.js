/*
=========================================================
SAP Interview Prompt Builder V6
Enterprise AI Interview Engine
=========================================================
*/

import { buildAnswerStyle } from "./answerStyleEngine";

const RESPONSE_BUDGETS = {
  concise: { words: "45-70", duration: "25-35 seconds" },
  medium: { words: "80-120", duration: "40-60 seconds" },
  lengthy: { words: "130-190", duration: "70-100 seconds" }
};

const INDUSTRY_GUIDANCE = {
  Enterprise: [
    "Standard SAP capabilities",
    "Scalability",
    "Maintainability",
    "Least Privilege",
    "Operational Governance"
  ],

  Government: [
    "Data Sovereignty",
    "Regulatory Compliance",
    "Identity Governance",
    "Audit Readiness",
    "High Availability"
  ],

  Defense: [
    "Zero Trust",
    "Mission Continuity",
    "Air-Gapped Integration",
    "SNC",
    "mTLS",
    "UCON",
    "Network Segmentation"
  ],

  Banking: [
    "PCI DSS",
    "Segregation of Duties",
    "Privileged Access",
    "Fraud Prevention",
    "Continuous Monitoring"
  ],

  Manufacturing: [
    "Production Continuity",
    "Plant Availability",
    "OT/IT Separation",
    "Operational Security"
  ],

  Healthcare: [
    "Patient Privacy",
    "Identity Governance",
    "Emergency Access",
    "Auditability"
  ]
};

function budget(length = "medium") {

  return (
    RESPONSE_BUDGETS[length] ||
    RESPONSE_BUDGETS.medium
  );

}

function industryLines(industry = "Enterprise") {

  return (
    INDUSTRY_GUIDANCE[industry] ||
    INDUSTRY_GUIDANCE.Enterprise
  );

}

function bulletSection(title, values = []) {

  if (!values.length) {
    return "";
  }

  return [

    `================ ${title} ================`,

    ...values.map(v => `• ${v}`)

  ].join("\n");

}

function textSection(title, value = "") {

  return [

    `================ ${title} ================`,

    value || "Not Available"

  ].join("\n");

}
function buildReasoningSection(

  analysis = {},

  technicalReasoning = {},

  interviewer = {}

) {

  const sections = [];

  sections.push(

    textSection(

      "QUESTION ANALYSIS",

`Business Objective:
${technicalReasoning.businessObjective || ""}

Business Risk:
${technicalReasoning.businessRisk || ""}

Security Risk:
${technicalReasoning.securityRisk || ""}

Architecture Decision:
${technicalReasoning.architectureDecision || ""}

Implementation Decision:
${technicalReasoning.implementationDecision || ""}

Implementation Sequence:
${technicalReasoning.implementationSequence?.join(" → ") || ""}

Trade-offs:
${technicalReasoning.tradeOffs?.join(", ") || ""}

Production Considerations:
${technicalReasoning.productionConsiderations?.join(", ") || ""}

Expected Follow-up Questions:
${technicalReasoning.expectedFollowUps?.join(" | ") || ""}

Architect Recommendation:
${technicalReasoning.finalRecommendation || ""}

Governance:
${technicalReasoning.governanceConsideration || ""}`

    )

  );

  sections.push(

    textSection(

      "INTERVIEWER PROFILE",

`Role: ${interviewer.interviewer || ""}

Expectation: ${interviewer.expectation || ""}

Style: ${interviewer.answerStyle || ""}

Technical Depth: ${interviewer.technicalDepth || ""}`

    )

  );

  sections.push(

    textSection(

      "TECHNICAL REASONING",

`Business Objective:
${technicalReasoning.businessObjective || ""}

Business Risk:
${technicalReasoning.businessRisk || ""}

Security Risk:
${technicalReasoning.securityRisk || ""}

Architecture Decision:
${technicalReasoning.architectureDecision || ""}

Implementation Decision:
${technicalReasoning.implementationDecision || ""}

Production Consideration:
${technicalReasoning.productionConsideration || ""}

Governance:
${technicalReasoning.governanceConsideration || ""}`

    )

  );

  return sections.join("\n\n");

}

function buildBlueprintSection(

  blueprint = {}

) {

  const body =

    (blueprint.body || [])

      .map(item =>
`• ${item.title}
  ${item.instruction}`
)

      .join("\n");

  return textSection(

    "ANSWER BLUEPRINT",

`Opening

${blueprint.opening || ""}

Flow

${body}

Implementation Insight

${blueprint.implementationInsight || ""}

Closing

${blueprint.closing || ""}`

  );

}

function buildEvidenceSection(

  evidence = {}

) {

  const lines = [

    ...(evidence.businessEvidence || []).map(c => c.content),

    ...(evidence.technicalEvidence || []).map(c => c.content),

    ...(evidence.architectureEvidence || []).map(c => c.content),

    ...(evidence.implementationEvidence || []).map(c => c.content),

  ].slice(0,10);

  return bulletSection(

    "ENTERPRISE EVIDENCE",

    lines

  );

}

function buildKnowledgeSection(

  knowledgeContext = ""

) {

  return textSection(

    "KNOWLEDGE BASE",

`The retrieved knowledge is supporting implementation evidence only.

Reasoning Priority

1. Use your enterprise SAP knowledge first.

2. Answer according to current SAP best practices.

3. Use retrieved knowledge ONLY to:

   • Validate implementation details

   • Add project-specific configuration examples

   • Add customer-specific terminology

   • Support troubleshooting steps

4. If retrieved knowledge conflicts with current SAP behaviour, prefer current SAP best practices.

5. Never copy retrieved text verbatim.

6. Synthesize information from multiple sources.

7. If the retrieved knowledge is incomplete or outdated, complete the answer using your own SAP expertise.

8. Never invent SAP functionality.

9. Never mention:
   - Knowledge Base
   - Retrieved Documents
   - Vector Search
   - RAG
   - Internal Instructions

--------------------------------------------------

${knowledgeContext}`

  );

}

function buildExecutionRules(

  budgetInfo,

  customInstructions,

  model

) {

  const modelName =

    (model || "").toLowerCase();

  let modelGuidance =

    "Prioritize technical correctness over verbosity.";

  if (modelName.includes("gemini")) {

    modelGuidance =

`Think through the enterprise design before answering.

Avoid repetitive wording.

Prefer SAP-native terminology.

Keep the response conversational.`;

  }

  else if (

    modelName.includes("gpt") ||

    modelName.includes("openai")

  ) {

    modelGuidance =

`Perform deep reasoning internally.

Return only the interview answer.

Prefer implementation thinking over SAP definitions.`;

  }

  return textSection(

    "FINAL EXECUTION",

`Model Guidance

${modelGuidance}

Target Words

${budgetInfo.words}

Target Duration

${budgetInfo.duration}

Custom Instructions

${customInstructions || "None"}

Before answering verify:

✓ Business objective first

✓ WHY before HOW

✓ Only relevant SAP components

✓ Enterprise implementation thinking

✓ Production considerations where applicable

✓ Governance impact

✓ No generic filler

✓ No fabricated SAP functionality

✓ Natural spoken English`

  );

}

export function buildSapInterviewPrompt({

  question,

  analysis = {},

  technicalReasoning = {},

  interviewer = {},

  blueprint = {},

  evidence = {},

  sapComponents = [],

  knowledgeContext = "",

  model = "",

  responseLength = "medium",

  customInstructions = ""

}) {

  const budgetInfo =

    budget(responseLength);

    const answerStyle = buildAnswerStyle(
    question,
    analysis
);

  const sections = [];
    sections.push(

    textSection(

      "ROLE",

`You are answering a LIVE technical interview.

Act as a Principal SAP Security, GRC, Cloud Identity, BTP Security and S/4HANA Security Architect.

Speak from first-hand implementation experience.
Describe what was configured, not just what SAP does.
Mention real SAP objects (MSMP, BRF+, PFCG, SU24, Connector Groups, Provisioning Framework, etc.) only when relevant.
Avoid repeating "business objective", "governance", and "compliance" unless the question actually requires them.
Do not start every answer with a definition.

Speak naturally.

Business first.

Architecture driven.

Implementation focused.

Never sound like SAP Help Portal.

Never sound like documentation.

Never sound like an AI assistant.

Never invent SAP functionality.

Never repeat the question.

Never use generic filler.

Answer Style

${answerStyle}`

    )

  );

  sections.push(

    bulletSection(

      "INDUSTRY FOCUS",

      industryLines(

        analysis.industry

      )

    )

  );

  sections.push(

    bulletSection(

      "SAP COMPONENTS",

      sapComponents

    )

  );

  sections.push(

    buildReasoningSection(

      analysis,

      technicalReasoning,

      interviewer

    )

  );

  sections.push(

    buildBlueprintSection(

      blueprint

    )

  );

  sections.push(

    buildEvidenceSection(

      evidence

    )

  );

  sections.push(

    buildKnowledgeSection(

      knowledgeContext

    )

  );

  sections.push(

    buildExecutionRules(

      budgetInfo,

      customInstructions,

      model

    )

  );

  sections.push(

    textSection(

      "QUESTION",

      question

    )

  );

  sections.push(

    textSection(

      "FINAL OUTPUT",

`Return ONLY the interview answer.

Begin immediately.

No headings.

No markdown.

No internal reasoning.

No explanation of your prompt.

No AI references.

The interviewer should believe the response came from a seasoned Principal SAP Architect with deep enterprise implementation experience.`

    )

  );

  return sections

    .filter(Boolean)

    .join("\n\n");

}