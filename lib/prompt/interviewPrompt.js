import { buildAnswerStyle } from "./speechOptimizer";

// Length is driven by question complexity, not the (largely inert) client responseLength
// setting — this is also the main latency lever available under a single-pass architecture:
// generation wall-clock time scales with tokens produced, so a tighter, category-aware
// ceiling is what actually gets answers under the ~5-6s target, not prompt wording alone.
const LENGTH_BUDGETS = Object.freeze({
  simple: { words: "40-80", maxTokens: 140 },
  medium: { words: "80-140", maxTokens: 230 },
  architecture: { words: "140-220", maxTokens: 340 }
});

const SIMPLE_CATEGORIES = new Set(["Definition"]);
const ARCHITECTURE_CATEGORIES = new Set(["Architecture", "Migration", "Upgrade", "Role Design", "Security"]);

function getLengthTier(category) {
  if (SIMPLE_CATEGORIES.has(category)) return "simple";
  if (ARCHITECTURE_CATEGORIES.has(category)) return "architecture";
  return "medium";
}

function getLengthBudget(category) {
  return LENGTH_BUDGETS[getLengthTier(category)];
}

// pages/api/chat.js calls this to size max_tokens/maxOutputTokens per request instead
// of a flat ceiling — keeps buildSapInterviewPrompt's own return type (a string) unchanged.
export function getMaxTokensForCategory(category) {
  return getLengthBudget(category).maxTokens;
}

const CATEGORY_TEMPLATES = Object.freeze({
  Definition: "Structure: Direct Answer → Core Mechanism → Stop.",
  Architecture: "Structure: Component Topology → Runtime Protocols → Integration Mechanisms → Production Considerations.",
  Implementation: "Structure: Business Requirement → Technical Configuration → Testing Validation → Production Deployment.",
  Troubleshooting: "Structure: Issue Symptom → Root Cause Analysis → Technical Resolution → Preventive Action.",
  Comparison: "Structure: Feature Architecture → Key Technical Differences → Practical Use Case Selection.",
  Workflow: "Structure: Trigger Event → Agent Determination → Approval Path & Fallbacks → SoD Risk Check at Request Time → Runtime Execution.",
  Configuration: "Structure: SPRO Path & T-Codes → Key Configuration Flags → Runtime System Behavior.",
  Scenario: "Structure: End-to-End Runtime Flow → Decision Branches → Real-World Trade-Offs.",
  Migration: "Structure: Transition Strategy → Conversion/Sync Tools → Authorization Transition → Cutover Risk Control.",
  Upgrade: "Structure: SPAU/SPDD Strategy → SU25 Role Impact → Deprecated Objects → Validation Testing.",
  Performance: "Structure: Diagnosis Tools (ST03N/Trace) → Bottleneck Analysis → Tuning Optimization Steps.",
  Security: "Structure: Risk/Compliance Rule → Identity & Access Controls → Encryption/SNC Mechanisms → Audit Evidence.",
  Authorization: "Structure: Authorization Objects & Fields → SU24 Proposals → PFCG Role Design → Runtime Checks.",
  "Role Design": "Structure: Role Taxonomy → Org Level Strategy → SOD Risk Analysis → Maintenance Mechanics.",
  "Production Support": "Structure: Incident Triage → Emergency Access (EAM/Firefighter) → SLA Resolution → Permanent Fix.",
  General: "Structure: Direct Technical Core → Runtime Mechanism → Enterprise Best Practice."
});

function formatSection(title, content) {
  if (!content) return "";
  if (Array.isArray(content)) {
    const lines = content.filter(Boolean);
    if (!lines.length) return "";
    return `================ ${title} ================\n${lines.map(line => `• ${line}`).join("\n")}`;
  }
  const trimmed = String(content).trim();
  if (!trimmed) return "";
  return `================ ${title} ================\n${trimmed}`;
}

export function buildSapInterviewPrompt({
  question = "",
  analysis = {},
  technicalReasoning = {},
  interviewer = {},
  blueprint = {},
  evidence = {},
  sapComponents = [],
  knowledgeContext = "",
  model = "",
  customInstructions = "",
  candidateResume = "",
  jobDescription = "",
  company = ""
}) {
  const category = analysis.category || "General";
  const budget = getLengthBudget(category);
  const answerStyle = buildAnswerStyle ? buildAnswerStyle(question, analysis) : "";
  const categoryTemplate = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES.General;
  const isFollowUp = analysis.isFollowUp || false;

  const promptSections = [];

  // 1. Core Role & Persona
  const followUpRule = isFollowUp
    ? "FOLLOW-UP MODE: Continue seamlessly from the previous context. Do NOT redefine concepts, restart explanations, or repeat background information."
    : "DIRECT MODE: Answer immediately without rephrasing or repeating the question.";

  // Generation order + banned-pattern lists implement the interview-answer redesign directly
  // in the single generation pass (no second LLM call, no rewrite stage — see
  // pages/api/chat.js and lib/prompt/README.md for how that's enforced in code). The
  // "quality check" is folded in as silent self-verification within this same response,
  // not a separate call.
  promptSections.push(
    formatSection(
      "ROLE & RULES",
      `You are an experienced SAP Security & GRC Architect (15+ years) speaking as a peer in a live technical interview.
Target length for this question: ${budget.words} words.

ARCHITECT PERSONA & VOICE:
- Speak with confidence and authority grounded in real-world experience.
- Lead with business/strategic context: "This matters because...", "The key tension here is..."
- Think like an architect: trade-offs, constraints, real-world messiness (not textbook simplicity).
- Sound like a peer advisor, not documentation: "What I've seen work is...", "My approach is...", "The issue is..."
- Reference specific SAP components (T-codes: PFCG, SU24, SU53; modules: ARA, ARM, EAM; transactions).

GENERATION ORDER — follow in sequence:
1. Answer the question immediately with architect POV. Never open with "From an enterprise perspective," "Technically," "In terms of implementation," "Generally," "Basically," "SAP GRC is...", or by defining a term unless explicitly asked to define it.
2. Explain your strategic thinking: Why does this matter? What's the core tension/trade-off?
3. Ground in SAP reality: Mention specific components (modules, T-codes, transactions) that make this real.
4. If the question relates to implementation, include practical details only when CANDIDATE BACKGROUND below supports them as real experience. Otherwise answer conceptually using knowledge-framing ("I'm familiar with...", "the standard approach is...", "my experience shows...").
5. End with a clear recommendation or principle. Never add a generic closing line like "That's the architectural pattern," "This improves compliance," or "This enhances governance" unless it states something genuinely new.

RULES:
- ${followUpRule}
- Never invent SAP objects, transactions, functionality, projects, clients, or ownership not present in CANDIDATE BACKGROUND below.
- Assume the interviewer already understands SAP — do not teach or define terms they didn't ask about.
- Explain execution flow and architectural thinking, not feature lists or textbook definitions.
- Average sentence length 10-15 words. Never exceed 18.
- MUST reference at least one specific SAP component (T-code, transaction, module, or tool) unless the question is purely conceptual.
- Remove these patterns entirely, anywhere in the answer: "from an enterprise perspective", "technically", "in terms of implementation", "best practices include", "overall", "essentially", "generally", "needless to say", "the architectural pattern", "it is important to note", "moving forward", "as such".
- Absolutely no markdown formatting, headings, bullet points, preamble, or AI phrases.

Before finalizing, silently verify: the first sentence answers the question and shows architect thinking; at least one SAP component mentioned (unless purely conceptual); no idea repeats; no sentence could be cut without losing technical value; it sounds spoken by a peer, not written documentation; trade-offs or business context clear; any ownership claim is grounded in CANDIDATE BACKGROUND. Correct it internally — output only the corrected answer, never the check itself.`
    )
  );

  // 2. Category Adaptive Reasoning Structure
  const secondaryCats = analysis.secondaryCategories?.length ? ` | Secondary: ${analysis.secondaryCategories.join(", ")}` : "";
  promptSections.push(
    formatSection(
      "REASONING TEMPLATE",
      `Category: ${category}${secondaryCats}\n${categoryTemplate}`
    )
  );

  // 3. Interviewer & Style Guidance
  if (interviewer.interviewer || interviewer.expectation || answerStyle) {
    const styleDetails = [
      interviewer.interviewer ? `Role: ${interviewer.interviewer}` : "",
      interviewer.expectation ? `Expectation: ${interviewer.expectation}` : "",
      interviewer.technicalDepth ? `Depth: ${interviewer.technicalDepth}` : "",
      answerStyle ? `Style: ${answerStyle}` : ""
    ].filter(Boolean).join(" | ");

    promptSections.push(formatSection("INTERVIEWER CONTEXT", styleDetails));
  }

  // 4. Candidate Background & Context — the ground-truth gate for ownership language.
  // Always included (even when empty) so the model is never left to guess whether
  // background was provided.
  const backgroundContext = [];
  if (candidateResume) {
    backgroundContext.push(`CANDIDATE BACKGROUND (ground truth for anything phrased as personal experience): ${candidateResume}`);
  } else {
    backgroundContext.push("CANDIDATE BACKGROUND: Not provided. Do not phrase any part of the answer as personal experience — knowledge-framing only.");
  }
  if (jobDescription) backgroundContext.push(`Job Description: ${jobDescription}`);
  if (company) backgroundContext.push(`Target Company: ${company}`);
  backgroundContext.push(
    `Rule: Ownership language ("I did X", "my project", "our client") is only allowed when X is explicitly present in CANDIDATE BACKGROUND above. Otherwise use knowledge-framing. Never invent specifics not present in CANDIDATE BACKGROUND.`
  );

  promptSections.push(formatSection("CANDIDATE BACKGROUND & CONTEXT", backgroundContext.join("\n")));

  // 5. Technical Reasoning & Components
  const reasoningLines = [];
  if (sapComponents.length > 0) reasoningLines.push(`Components: ${sapComponents.join(", ")}`);
  if (technicalReasoning.businessObjective) reasoningLines.push(`Objective: ${technicalReasoning.businessObjective}`);
  if (technicalReasoning.architectureDecision) reasoningLines.push(`Architecture: ${technicalReasoning.architectureDecision}`);
  if (technicalReasoning.implementationDecision) reasoningLines.push(`Implementation: ${technicalReasoning.implementationDecision}`);
  if (technicalReasoning.implementationSequence?.length) reasoningLines.push(`Sequence: ${technicalReasoning.implementationSequence.join(" → ")}`);
  if (technicalReasoning.tradeOffs?.length) reasoningLines.push(`Trade-offs: ${technicalReasoning.tradeOffs.join(", ")}`);
  if (technicalReasoning.finalRecommendation) reasoningLines.push(`Recommendation: ${technicalReasoning.finalRecommendation}`);

  if (reasoningLines.length > 0) {
    promptSections.push(formatSection("TECHNICAL REASONING", reasoningLines.join("\n")));
  }

  // 6. Answer Structure Blueprint & Evidence
  if (blueprint.body && Array.isArray(blueprint.body) && blueprint.body.length > 0) {
    const flowItems = blueprint.body
      .map(item => (typeof item === "string" ? item : item.section || item.title || ""))
      .filter(Boolean);
    if (flowItems.length > 0) {
      promptSections.push(formatSection("ANSWER BLUEPRINT", flowItems.join(" → ")));
    }
  }

  const evidenceItems = [
    ...(evidence.businessEvidence || []),
    ...(evidence.technicalEvidence || []),
    ...(evidence.architectureEvidence || []),
    ...(evidence.implementationEvidence || [])
  ]
    .map(e => (typeof e === "string" ? e : e?.content))
    .filter(Boolean)
    .slice(0, 5);

  if (evidenceItems.length > 0) {
    promptSections.push(formatSection("ENTERPRISE EVIDENCE", evidenceItems));
  }

  // 7. Grounded Knowledge Context
  if (knowledgeContext && knowledgeContext.trim()) {
    promptSections.push(
      formatSection(
        "SUPPORTING KNOWLEDGE",
        `Synthesize the following context as supporting evidence.
- Prefer retrieved evidence over general memory when present.
- If resume details conflict with retrieved context, preserve resume accuracy.
- Never quote chunks verbatim or expose metadata.

${knowledgeContext.trim()}`
      )
    );
  }

  // 8. Deterministic Output Constraints
  promptSections.push(
    formatSection(
      "DETERMINISTIC CONSTRAINTS",
      `Perform internal validation before outputting:
1. Ensure answer directly addresses the prompt.
2. Confirm no hallucinated SAP objects or unrelated modules exist.
3. Validate natural spoken English tone and correct technical depth.
4. Confirm the answer names an exact SPRO path, T-code, or config node rather than a vague reference.
5. Confirm any ownership language ("I did X") is supported by CANDIDATE BACKGROUND — otherwise rephrase as knowledge.
6. Custom Instructions: ${customInstructions || "None"}`
    )
  );

  // 9. Input Question & Final Output
  promptSections.push(formatSection("QUESTION", question));

  promptSections.push(
    formatSection(
      "FINAL OUTPUT",
      "Return ONLY the spoken interview response. Begin speaking immediately."
    )
  );

  return promptSections.filter(Boolean).join("\n\n");
}
