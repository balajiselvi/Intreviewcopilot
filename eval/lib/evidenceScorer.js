/**
 * Phase 1 — Deterministic evidence scorer (evaluation only).
 *
 * Scores a candidate answer against a manually authored QuestionReference using
 * pattern/checklist matching. This is NOT semantic claim extraction.
 *
 * Spoken fluency is scored separately and must not raise technical excellence.
 */

const {
  TECHNICAL_DIMENSIONS,
  SCORE_SCALE,
  validateQuestionReference,
  validateEvidenceScoreReport
} = require("./evidenceScoreSchema.js");

function asRegex(pattern) {
  if (pattern instanceof RegExp) return pattern;
  return new RegExp(String(pattern), "i");
}

function matchesAny(text, patterns = []) {
  return (patterns || []).some((pattern) => {
    try {
      return asRegex(pattern).test(text);
    } catch {
      return false;
    }
  });
}

function requirementHit(text, req) {
  return matchesAny(text, req.matchAny || []);
}

function clampScore(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(5, Math.round(value)));
}

function hasTag(req, tag) {
  return (req.tags || []).map((t) => String(t).toLowerCase()).includes(String(tag).toLowerCase());
}

/**
 * Spoken-language heuristic (separate from technical scoring).
 * Does not inspect SAP correctness.
 */
function scoreSpokenLanguage(answer = "") {
  const text = String(answer || "").trim();
  const findings = [];
  if (!text) {
    return {
      score: 0,
      findings: [{ code: "EMPTY", detail: "No answer text" }],
      justification: "Empty answer cannot be spoken."
    };
  }

  let score = 4;
  const words = text.split(/\s+/).filter(Boolean).length;

  if (/^#{1,3}\s|###\s+\d+\.|Decision:\s*|Mechanism:\s*|Governance:\s*|Validation:\s*/m.test(text)) {
    score -= 2;
    findings.push({ code: "DOC_HEADINGS", detail: "Documentation-style headings present" });
  }
  if ((text.match(/^\s*[-*•]\s+/gm) || []).length >= 4) {
    score -= 1;
    findings.push({ code: "BULLET_DUMP", detail: "Heavy bullet formatting for a spoken answer" });
  }
  if (/\b(?:great question|sure[,!]?\s+I can|from an architectural perspective|needless to say)\b/i.test(text)) {
    score -= 1;
    findings.push({ code: "FILLER", detail: "Filler / consultant boilerplate opener" });
  }
  if (words < 40) {
    score -= 1;
    findings.push({ code: "TOO_SHORT", detail: `Very short spoken length (${words} words)` });
  } else if (words > 320) {
    score -= 1;
    findings.push({ code: "TOO_LONG", detail: `Likely too long for ordinary spoken answer (${words} words)` });
  }
  if (!/[.!?]\s+[A-Z(“"]/.test(text) && words > 60) {
    score -= 1;
    findings.push({ code: "LOW_FLOW", detail: "Limited sentence segmentation / flow" });
  }

  score = clampScore(score);
  return {
    score,
    findings,
    justification: `Spoken heuristic score ${score}/5 based on formatting, filler, length, and flow — independent of technical accuracy.`
  };
}

function scoreFromCoverage(hitCount, total, { critical = false, incorrect = 0 } = {}) {
  if (critical) return 0;
  if (total <= 0) return 3;
  const ratio = hitCount / total;
  let score;
  if (ratio >= 0.95) score = 5;
  else if (ratio >= 0.8) score = 4;
  else if (ratio >= 0.55) score = 3;
  else if (ratio >= 0.35) score = 2;
  else if (ratio > 0) score = 1;
  else score = 0;
  if (incorrect > 0) score = Math.min(score, 2);
  return clampScore(score);
}

/**
 * @param {{ reference: object, answer: string, question?: string }} input
 * @returns {object} EvidenceScoreReport
 */
function scoreAnswerAgainstReference({ reference, answer, question = "" } = {}) {
  validateQuestionReference(reference);
  const text = String(answer || "");
  const q = String(question || reference.question || "");
  const findings = [];
  const missingMandatory = [];
  const matchedMandatory = [];
  const triggeredCritical = [];
  const checklistClaims = [];

  for (const err of reference.criticalErrors || []) {
    if (matchesAny(text, err.matchAny)) {
      triggeredCritical.push({
        id: err.id,
        text: err.text,
        severity: err.severity || "critical"
      });
      findings.push({
        dimension: "technicalCorrectness",
        code: "CRITICAL_ERROR",
        support: "incorrect",
        detail: err.text,
        evidence: `Deterministic pattern hit for critical error '${err.id}'`
      });
    }
  }

  for (const req of reference.mandatoryRequirements || []) {
    const hit = requirementHit(text, req);
    const claim = {
      requirementId: req.id,
      requirementText: req.text,
      support: hit ? "supported" : "missing",
      matchMode: "deterministic_pattern",
      evidence: hit
        ? `Matched authored matchAny for '${req.id}'`
        : `No matchAny hit for mandatory requirement '${req.id}'`
    };
    checklistClaims.push(claim);
    if (hit) {
      matchedMandatory.push(req.id);
      findings.push({
        dimension: "technicalCompleteness",
        code: "MANDATORY_PRESENT",
        support: "supported",
        detail: req.text,
        evidence: claim.evidence
      });
    } else {
      missingMandatory.push(req.id);
      findings.push({
        dimension: "technicalCompleteness",
        code: "MANDATORY_MISSING",
        support: "unsupported",
        detail: req.text,
        evidence: claim.evidence
      });
    }
  }

  const optionalHits = [];
  for (const req of reference.optionalRequirements || []) {
    if (requirementHit(text, req)) optionalHits.push(req.id);
  }

  const critical = triggeredCritical.length > 0;
  const mandatoryTotal = (reference.mandatoryRequirements || []).length;
  const mandatoryHits = matchedMandatory.length;

  const implReqs = (reference.mandatoryRequirements || []).filter(
    (r) => hasTag(r, "implementation") || hasTag(r, "grounding")
  );
  const seqReqs = (reference.mandatoryRequirements || []).filter((r) => hasTag(r, "sequence"));
  const valReqs = (reference.mandatoryRequirements || []).filter((r) => hasTag(r, "validation"));
  const verReqs = (reference.mandatoryRequirements || []).filter((r) => hasTag(r, "version"));
  // If no version-tagged mandatory items, use optional version tags + systemContext mention.
  const versionPool = verReqs.length
    ? verReqs
    : (reference.optionalRequirements || []).filter((r) => hasTag(r, "version"));

  const implHits = implReqs.filter((r) => matchedMandatory.includes(r.id)).length;
  const seqHits = seqReqs.filter((r) => matchedMandatory.includes(r.id)).length;
  const valHits = valReqs.filter((r) => matchedMandatory.includes(r.id)).length;
  const verHits = versionPool.filter((r) => requirementHit(text, r)).length;

  let correctness = scoreFromCoverage(mandatoryHits, mandatoryTotal, { critical });
  if (critical) correctness = 0;
  else if (missingMandatory.length && mandatoryHits >= Math.ceil(mandatoryTotal * 0.55)) {
    // Partial core present but gaps — cap below excellence when incomplete.
    correctness = Math.min(correctness, 3);
  }

  let completeness = scoreFromCoverage(mandatoryHits, mandatoryTotal, { critical: false });
  if (critical) completeness = Math.min(completeness, 2);
  if (optionalHits.length && completeness >= 3) {
    completeness = clampScore(completeness + (optionalHits.length >= 1 ? 0 : 0));
  }

  let implementationSpecificity = implReqs.length
    ? scoreFromCoverage(implHits, implReqs.length, { critical })
    : scoreFromCoverage(mandatoryHits, mandatoryTotal, { critical });
  if (critical) implementationSpecificity = 0;

  let executionSequence = seqReqs.length
    ? scoreFromCoverage(seqHits, seqReqs.length, { critical })
    : clampScore(critical ? 0 : mandatoryHits ? 3 : 1);

  let troubleshootingValidation = valReqs.length
    ? scoreFromCoverage(valHits, valReqs.length, { critical })
    : clampScore(critical ? 0 : /\b(?:validat|verify|confirm|test|Instance Status|log review)\b/i.test(text) ? 3 : 2);

  let versionSystemContext = versionPool.length
    ? scoreFromCoverage(verHits, versionPool.length, { critical })
    : clampScore(
      critical
        ? 0
        : (reference.systemContext?.typicalRelease || reference.systemContext?.product)
          && new RegExp(
            String(reference.systemContext.product || reference.systemContext.products?.[0] || "SAP")
              .split(/[,\s]+/)
              .filter((w) => w.length > 2)[0] || "SAP",
            "i"
          ).test(text + q)
          ? 3
          : 2
    );

  // Grounding: mandatory grounding-tagged hits + absence of critical canned wrong scripts.
  const groundReqs = (reference.mandatoryRequirements || []).filter((r) => hasTag(r, "grounding"));
  const groundHits = groundReqs.filter((r) => matchedMandatory.includes(r.id)).length;
  let grounding = groundReqs.length
    ? scoreFromCoverage(groundHits, groundReqs.length, { critical })
    : scoreFromCoverage(mandatoryHits, mandatoryTotal, { critical });
  if (critical) grounding = 0;

  // Excellence block: critical errors prevent any technical dimension from being 5,
  // and force technicalCorrectness to 0; overall technical excellence blocked.
  const technicalScores = {
    technicalCorrectness: {
      score: correctness,
      evidence: critical
        ? `Critical error(s): ${triggeredCritical.map((e) => e.id).join(", ")}`
        : `${mandatoryHits}/${mandatoryTotal} mandatory checklist items matched`
    },
    technicalCompleteness: {
      score: completeness,
      evidence: `Missing mandatory: ${missingMandatory.join(", ") || "none"}; optional hits: ${optionalHits.join(", ") || "none"}`
    },
    implementationSpecificity: {
      score: implementationSpecificity,
      evidence: implReqs.length
        ? `${implHits}/${implReqs.length} implementation/grounding requirements matched`
        : "No implementation-tagged requirements; used mandatory coverage proxy"
    },
    executionSequence: {
      score: executionSequence,
      evidence: seqReqs.length
        ? `${seqHits}/${seqReqs.length} sequence-tagged requirements matched`
        : "No sequence-tagged requirements; neutral/proxy score"
    },
    troubleshootingValidation: {
      score: troubleshootingValidation,
      evidence: valReqs.length
        ? `${valHits}/${valReqs.length} validation-tagged requirements matched`
        : "No validation-tagged requirements; heuristic validation language check"
    },
    versionSystemContext: {
      score: versionSystemContext,
      evidence: versionPool.length
        ? `${verHits}/${versionPool.length} version-tagged items matched`
        : "Limited version-tagged criteria; product/context heuristic"
    },
    groundingEvidenceTraceability: {
      score: grounding,
      evidence: groundReqs.length
        ? `${groundHits}/${groundReqs.length} grounding-tagged requirements matched against authored evidence criteria`
        : "Grounding proxied from mandatory checklist (not citation verification)"
    }
  };

  for (const dim of TECHNICAL_DIMENSIONS) {
    if (critical && technicalScores[dim].score >= 5) {
      technicalScores[dim].score = 4;
    }
  }

  const spoken = scoreSpokenLanguage(text);
  // Excellence blocked when a critical error fires or mandatory coverage is not strong.
  const blockedExcellence = critical || correctness < 4 || completeness < 4;

  const report = {
    schemaVersion: 1,
    scoringMode: "deterministic_checklist",
    question: q,
    candidateAnswer: text,
    questionReferenceId: reference.id,
    expectedTechnicalRequirements: (reference.mandatoryRequirements || []).map((r) => ({
      id: r.id,
      text: r.text
    })),
    extractedTechnicalClaims: checklistClaims,
    // Explicit: checklist rows are requirement presence checks, not NLP claim spans.
    claimExtractionMode: "requirement_checklist_only",
    evidenceSupportingClaims: checklistClaims.filter((c) => c.support === "supported"),
    missingMandatoryElements: missingMandatory.map((id) => {
      const req = reference.mandatoryRequirements.find((r) => r.id === id);
      return { id, text: req?.text || id };
    }),
    incorrectOrUnsupportedClaims: [
      ...triggeredCritical.map((e) => ({
        id: e.id,
        text: e.text,
        classification: "incorrect",
        kind: "critical_error"
      })),
      ...missingMandatory.map((id) => ({
        id,
        text: reference.mandatoryRequirements.find((r) => r.id === id)?.text || id,
        classification: "unsupported",
        kind: "missing_mandatory"
      }))
    ],
    criticalErrorFlags: triggeredCritical,
    criticalErrorTriggered: critical,
    technicalScores,
    spokenLanguageScore: spoken,
    technicalExcellenceBlocked: blockedExcellence,
    scoreScale: SCORE_SCALE,
    findings,
    acceptableAlternativesNoted: reference.acceptableAlternatives || [],
    unverifiableAreas: reference.unverifiableAreas || [],
    evidenceSources: reference.evidenceSources || [],
    remediation: [
      ...(critical
        ? [`Remove critical error content: ${triggeredCritical.map((e) => e.id).join(", ")}`]
        : []),
      ...missingMandatory.map((id) => `Cover mandatory requirement '${id}'`),
      ...(spoken.score <= 2 ? ["Reduce documentation formatting; speak in short connected paragraphs"] : [])
    ],
    justification: critical
      ? `Technical correctness capped at 0 because critical error(s) fired (${triggeredCritical.map((e) => e.id).join(", ")}). Spoken score (${spoken.score}/5) is independent and must not compensate.`
      : `Deterministic checklist matched ${mandatoryHits}/${mandatoryTotal} mandatory requirements. Completeness=${completeness}/5, correctness=${correctness}/5, spoken=${spoken.score}/5 (separate).`,
    limitations: {
      deterministicCriteria: [
        "Authored matchAny pattern hits for mandatory/optional requirements",
        "Authored critical-error pattern hits",
        "Spoken formatting/filler/length heuristics"
      ],
      requiresHumanReview: [
        "Whether a matched phrase is used in the correct technical sense",
        "Acceptable alternative phrasings not listed in matchAny",
        "Release-specific accuracy beyond checklist signals",
        "True source-document citation fidelity"
      ],
      requiresFutureSemanticClaimExtraction: [
        "Full proposition-level claim extraction and entailment against SAP documentation",
        "Detecting contradictions that do not hit authored critical patterns",
        "Scoring paraphrases that are correct but miss keyword patterns"
      ],
      evidenceBasedNow: "partial",
      evidenceBasedExplanation:
        "Scores are evidence-linked to manually authored question-specific criteria and explicit pattern hits, not to impressionistic LLM judging. They are not yet full semantic evidence-based evaluation against live SAP documentation."
    }
  };

  validateEvidenceScoreReport(report);
  return report;
}

module.exports = {
  scoreAnswerAgainstReference,
  scoreSpokenLanguage
};
