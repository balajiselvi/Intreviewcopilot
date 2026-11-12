/**
 * Phase 1 — Evidence-based scoring schemas (evaluation infrastructure only).
 *
 * QuestionReference criteria are manually authored independently of candidate answers.
 * EvidenceScoreReport is the output contract for the deterministic scorer.
 *
 * This module does NOT perform semantic claim extraction.
 */

const TECHNICAL_DIMENSIONS = Object.freeze([
  "technicalCorrectness", // A
  "technicalCompleteness", // B
  "implementationSpecificity", // C
  "executionSequence", // D
  "troubleshootingValidation", // E
  "versionSystemContext", // F
  "groundingEvidenceTraceability" // G
]);

const CLAIM_SUPPORT = Object.freeze([
  "supported",
  "partially_supported",
  "unsupported",
  "incorrect",
  "contradictory",
  "not_verifiable"
]);

const SCORE_SCALE = Object.freeze({
  min: 0,
  max: 5,
  labels: {
    0: "Absent, completely incorrect, or fundamentally misleading",
    1: "Minimal coverage with major technical defects",
    2: "Partially correct but missing critical technical requirements",
    3: "Correct core explanation with identifiable gaps",
    4: "Strong technical answer with minor omissions",
    5: "Complete, accurate, implementation-relevant answer supported by evidence"
  }
});

/**
 * @typedef {Object} RequirementSpec
 * @property {string} id
 * @property {string} text
 * @property {string[]} [tags] - e.g. mandatory|optional|implementation|sequence|validation|version|grounding
 * @property {(RegExp|string)[]} [matchAny] - deterministic presence signals (keyword/phrase checks, not semantics)
 * @property {string} [evidenceNote] - why this requirement belongs on the card
 */

/**
 * @typedef {Object} CriticalErrorSpec
 * @property {string} id
 * @property {string} text
 * @property {(RegExp|string)[]} matchAny
 * @property {string} [severity]
 */

/**
 * Validate a QuestionReference object. Throws AssertionError-style Error on structural failure.
 * @param {object} ref
 */
function validateQuestionReference(ref) {
  if (!ref || typeof ref !== "object") throw new Error("QuestionReference must be an object");
  const required = [
    "id",
    "question",
    "systemContext",
    "mandatoryRequirements",
    "evidenceSources",
    "acceptableAlternatives",
    "criticalErrors",
    "optionalRequirements",
    "unverifiableAreas"
  ];
  for (const key of required) {
    if (ref[key] === undefined || ref[key] === null) {
      throw new Error(`QuestionReference.${key} is required (${ref.id || "unknown"})`);
    }
  }
  if (!Array.isArray(ref.mandatoryRequirements) || ref.mandatoryRequirements.length < 1) {
    throw new Error(`QuestionReference ${ref.id}: mandatoryRequirements must be non-empty`);
  }
  if (!Array.isArray(ref.criticalErrors) || ref.criticalErrors.length < 1) {
    throw new Error(`QuestionReference ${ref.id}: criticalErrors must be non-empty`);
  }
  if (!Array.isArray(ref.evidenceSources) || ref.evidenceSources.length < 1) {
    throw new Error(`QuestionReference ${ref.id}: evidenceSources must be non-empty`);
  }
  for (const req of ref.mandatoryRequirements) {
    if (!req?.id || !req?.text) throw new Error(`QuestionReference ${ref.id}: mandatory requirement missing id/text`);
    if (!Array.isArray(req.matchAny) || !req.matchAny.length) {
      throw new Error(`QuestionReference ${ref.id}: mandatory ${req.id} needs matchAny for deterministic scoring`);
    }
  }
  for (const err of ref.criticalErrors) {
    if (!err?.id || !err?.text || !Array.isArray(err.matchAny) || !err.matchAny.length) {
      throw new Error(`QuestionReference ${ref.id}: criticalErrors entry incomplete`);
    }
  }
  return true;
}

/**
 * Validate EvidenceScoreReport structure (lightweight).
 * @param {object} report
 */
function validateEvidenceScoreReport(report) {
  if (!report || typeof report !== "object") throw new Error("EvidenceScoreReport must be an object");
  if (!report.questionReferenceId) throw new Error("EvidenceScoreReport.questionReferenceId required");
  if (!report.technicalScores || typeof report.technicalScores !== "object") {
    throw new Error("EvidenceScoreReport.technicalScores required");
  }
  for (const dim of TECHNICAL_DIMENSIONS) {
    const score = report.technicalScores[dim]?.score;
    if (typeof score !== "number" || score < 0 || score > 5) {
      throw new Error(`EvidenceScoreReport.technicalScores.${dim}.score must be 0–5`);
    }
  }
  if (typeof report.spokenLanguageScore?.score !== "number") {
    throw new Error("EvidenceScoreReport.spokenLanguageScore.score required");
  }
  if (typeof report.criticalErrorTriggered !== "boolean") {
    throw new Error("EvidenceScoreReport.criticalErrorTriggered required");
  }
  if (!Array.isArray(report.findings)) throw new Error("EvidenceScoreReport.findings required");
  if (!report.limitations || typeof report.limitations !== "object") {
    throw new Error("EvidenceScoreReport.limitations required");
  }
  return true;
}

module.exports = {
  TECHNICAL_DIMENSIONS,
  CLAIM_SUPPORT,
  SCORE_SCALE,
  validateQuestionReference,
  validateEvidenceScoreReport
};
