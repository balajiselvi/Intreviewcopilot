/**
 * Reusable answer-quality contract for Interview Copilot.
 *
 * Dimensions are question-type sensitive. Critical severity fails the answer
 * even when fluency and product keywords look correct.
 */

const QUESTION_TYPES = Object.freeze({
  IMPLEMENTATION: "implementation",
  TROUBLESHOOTING: "troubleshooting",
  ARCHITECTURE: "architecture",
  COMPARISON: "comparison",
  BEHAVIORAL: "behavioral",
  COMPLIANCE: "compliance",
  GENERAL: "general"
});

const SEVERITY = Object.freeze({
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW"
});

const DIMENSIONS = Object.freeze([
  "questionFulfilment",
  "productTaskCorrectness",
  "technicalCorrectness",
  "sequenceCompleteness",
  "architecturalReasoning",
  "operationalReadiness",
  "evidenceUncertainty",
  "communicationQuality"
]);

function classifyQuestionType(question = "", hints = {}) {
  if (hints.questionType && QUESTION_TYPES[String(hints.questionType).toUpperCase()]) {
    return QUESTION_TYPES[String(hints.questionType).toUpperCase()];
  }
  const q = String(question || "");
  if (/\b(?:tell me about a time|have you|did you|your experience|conflict with|stakeholder)\b/i.test(q)) {
    return QUESTION_TYPES.BEHAVIORAL;
  }
  if (/\b(?:versus|vs\.?|difference|compared|comparison)\b/i.test(q)) return QUESTION_TYPES.COMPARISON;
  if (/\b(?:SOX|ITGC|GDPR|ISO\s*27001|compliance|audit evidence)\b/i.test(q)) return QUESTION_TYPES.COMPLIANCE;
  if (/\b(?:troubleshoot|diagnos|isolate|triage|stuck|failed|cannot|can't|does not take effect|unavailable)\b/i.test(q)) {
    return QUESTION_TYPES.TROUBLESHOOTING;
  }
  if (/\b(?:architect|design decision|trade-?off|integrate|hybrid identity|boundary)\b/i.test(q)) {
    return QUESTION_TYPES.ARCHITECTURE;
  }
  if (/\b(?:how (?:do|would|can) you|configure|implement|set up|build|create)\b/i.test(q)) {
    return QUESTION_TYPES.IMPLEMENTATION;
  }
  return QUESTION_TYPES.GENERAL;
}

function relevantDimensions(questionType) {
  const base = [
    "questionFulfilment",
    "productTaskCorrectness",
    "technicalCorrectness",
    "communicationQuality",
    "evidenceUncertainty"
  ];
  if (questionType === QUESTION_TYPES.IMPLEMENTATION || questionType === QUESTION_TYPES.TROUBLESHOOTING) {
    return [...base, "sequenceCompleteness", "operationalReadiness"];
  }
  if (questionType === QUESTION_TYPES.ARCHITECTURE) {
    return [...base, "architecturalReasoning", "operationalReadiness"];
  }
  if (questionType === QUESTION_TYPES.COMPLIANCE) {
    return [...base, "architecturalReasoning", "operationalReadiness"];
  }
  if (questionType === QUESTION_TYPES.BEHAVIORAL) {
    return ["questionFulfilment", "communicationQuality", "evidenceUncertainty"];
  }
  if (questionType === QUESTION_TYPES.COMPARISON) {
    return [...base, "architecturalReasoning"];
  }
  return base;
}

function pushFinding(findings, severity, dimension, code, detail) {
  findings.push({ severity, dimension, code, detail });
}

function evaluateAnswerQuality({
  question = "",
  answer = "",
  expectedProduct = null,
  expectedTaskHints = [],
  forbiddenClaims = [],
  requiredPoints = [],
  route = null,
  sourceFiles = [],
  questionType: forcedType = null
} = {}) {
  const questionType = classifyQuestionType(question, { questionType: forcedType });
  const dims = new Set(relevantDimensions(questionType));
  const findings = [];
  const text = String(answer || "").trim();
  const q = String(question || "");

  if (!text) {
    pushFinding(findings, SEVERITY.CRITICAL, "questionFulfilment", "EMPTY_ANSWER", "No visible answer");
  }

  for (const claim of forbiddenClaims || []) {
    const pattern = claim instanceof RegExp ? claim : new RegExp(String(claim), "i");
    if (pattern.test(text)) {
      pushFinding(findings, SEVERITY.CRITICAL, "technicalCorrectness", "FORBIDDEN_CLAIM", String(pattern));
    }
  }

  // Fabricated personal delivery markers that must not appear as lived experience.
  if (/\b(?:at my last client|in my recent project|we delivered a \d|11-country|Fortune 500 engagement I led)\b/i.test(text)) {
    pushFinding(findings, SEVERITY.CRITICAL, "evidenceUncertainty", "FABRICATED_EXPERIENCE", "Unsupported personal delivery claim");
  }

  if (expectedProduct && text && !new RegExp(String(expectedProduct).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(text)
    && !new RegExp(String(expectedProduct).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(q)) {
    // Product may be implied by workflow wording; only flag when neither Q nor A carries it
    // and the answer clearly drifts to another SAP product family.
  }

  if (questionType === QUESTION_TYPES.TROUBLESHOOTING) {
    // Flag pure setup scripts that ignore the symptom. Remediation that follows
    // an explicit root-cause or inspection path is allowed.
    const opensAsSetup = /^(?:create the firefighter id|open manage permission roles and grant|start from the role template the application provides)\b/i.test(text);
    const hasDiagnostic = /\b(?:confirm|inspect|verify|validate|isolate|reproduce|check|root cause|symptom|evidence)\b/i.test(text);
    if (opensAsSetup && !hasDiagnostic) {
      pushFinding(
        findings,
        SEVERITY.CRITICAL,
        "productTaskCorrectness",
        "SETUP_FOR_TROUBLESHOOT",
        "Implementation setup answered a troubleshooting question"
      );
    }
  }

  if (questionType === QUESTION_TYPES.IMPLEMENTATION || questionType === QUESTION_TYPES.TROUBLESHOOTING) {
    for (const hint of expectedTaskHints || []) {
      const pattern = hint instanceof RegExp ? hint : new RegExp(String(hint), "i");
      if (!pattern.test(text)) {
        pushFinding(findings, SEVERITY.HIGH, "sequenceCompleteness", "MISSING_TASK_HINT", String(pattern));
      }
    }
  }

  for (const point of requiredPoints || []) {
    const pattern = point instanceof RegExp ? point : new RegExp(String(point), "i");
    if (!pattern.test(text)) {
      pushFinding(findings, SEVERITY.HIGH, "questionFulfilment", "MISSING_REQUIRED_POINT", String(pattern));
    }
  }

  if (/^#{1,3}\s|###\s+\d+\.\s+Direct Answer|Technical Mechanism and Exact Artifacts/m.test(text)) {
    pushFinding(findings, SEVERITY.HIGH, "communicationQuality", "MARKDOWN_TEMPLATE", "Spoken answer contains legacy template headings");
  }
  if (/I would first\s*\*?\*?Decision/i.test(text) || /Here is the answer/i.test(text)) {
    pushFinding(findings, SEVERITY.HIGH, "communicationQuality", "ROBOTIC_PREFIX", "Answer mixes filler with Decision label");
  }

  // Cross-domain contamination examples that are critical when unexpected.
  if (/\bProcess Control\b/i.test(q) && /\b(?:MSMP|GRFNMW_CONFIGURE)\b/i.test(text) && !/\b(?:separate|not|Access Control)\b/i.test(text)) {
    pushFinding(findings, SEVERITY.CRITICAL, "productTaskCorrectness", "CROSS_DOMAIN", "Process Control answered with Access Control MSMP");
  }
  if (/\bIAG\b/i.test(q) && /\b(?:GRFNMW_CONFIGURE|Maintain MSMP Workflows)\b/i.test(text) && !/\b(?:bridge|Access Control|not)\b/i.test(text)) {
    pushFinding(findings, SEVERITY.CRITICAL, "productTaskCorrectness", "CROSS_DOMAIN", "IAG answered as Access Control MSMP");
  }

  if (dims.has("architecturalReasoning") && questionType === QUESTION_TYPES.ARCHITECTURE) {
    if (!/\b(?:boundary|trade-?off|because|rather than|separate|plane|decision)\b/i.test(text)) {
      pushFinding(findings, SEVERITY.MEDIUM, "architecturalReasoning", "WEAK_REASONING", "Architecture ask lacks decision or boundary language");
    }
  }

  if (route === "VERIFIED_WORKFLOW" && Array.isArray(sourceFiles) && sourceFiles.length === 0) {
    pushFinding(findings, SEVERITY.LOW, "evidenceUncertainty", "MISSING_SOURCE_META", "Verified workflow has no sourceFiles metadata");
  }

  const critical = findings.filter((f) => f.severity === SEVERITY.CRITICAL);
  const high = findings.filter((f) => f.severity === SEVERITY.HIGH);
  const pass = critical.length === 0 && high.length === 0;

  return {
    pass,
    questionType,
    dimensionsEvaluated: [...dims],
    findings,
    criticalCount: critical.length,
    highCount: high.length,
    mediumCount: findings.filter((f) => f.severity === SEVERITY.MEDIUM).length
  };
}

module.exports = {
  QUESTION_TYPES,
  SEVERITY,
  DIMENSIONS,
  classifyQuestionType,
  relevantDimensions,
  evaluateAnswerQuality
};
