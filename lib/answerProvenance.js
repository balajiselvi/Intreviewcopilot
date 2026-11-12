/**
 * Fix 3 — Answer generation provenance (observability only).
 * Does not change routing, retrieval ranking, procedure selection, or recovery policy.
 * Never stores full prompts, credentials, or entire knowledge documents.
 */
const crypto = require("crypto");

/** Stable policy label — not a content dump of the Master System Prompt. */
const PROMPT_POLICY_VERSION = "interview-copilot-v2.1-operating-contract";

function safeText(value, max = 160) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function safeList(value, maxItems = 12, maxLen = 120) {
  return Array.isArray(value)
    ? value.map((item) => safeText(item, maxLen)).filter(Boolean).slice(0, maxItems)
    : [];
}

/**
 * Fingerprint assembled policy markers / prompt text without persisting the prompt body.
 * Uses a short sha256 prefix of a stable versioned component string.
 */
function fingerprintPromptPolicy(input = "") {
  const raw = String(input || "").trim();
  const basis = raw
    ? `policy:${PROMPT_POLICY_VERSION}|len:${raw.length}|head:${raw.slice(0, 240)}|tail:${raw.slice(-120)}`
    : `policy:${PROMPT_POLICY_VERSION}|empty`;
  try {
    return crypto.createHash("sha256").update(basis).digest("hex").slice(0, 24);
  } catch {
    return null;
  }
}

function sanitizeEvidenceChunks(evidence = []) {
  if (!Array.isArray(evidence)) return [];
  return evidence
    .map((item) => {
      if (!item || typeof item !== "object") {
        const id = safeText(item, 100);
        return id ? { id, label: "", sourceFile: "", heading: "", chunkIndex: null } : null;
      }
      const chunkIndex = Number.isFinite(Number(item.chunkIndex)) ? Number(item.chunkIndex) : null;
      return {
        id: safeText(item.id || item.chunkId, 100),
        label: safeText(item.label || item.heading || item.section, 160),
        sourceFile: safeText(item.sourceFile || item.fileName, 160),
        heading: safeText(item.heading || item.section || item.label, 160),
        chunkIndex,
        reviewStatus: safeText(item.reviewStatus || item.approvalStatus || item.status, 40) || null
      };
    })
    .filter((row) => row && (row.id || row.label || row.sourceFile))
    .slice(0, 8);
}

/**
 * Distinguishes empty retrieval vs relevant-but-rejected vs used/assembled.
 * Does not invent sources.
 */
function classifyRetrievalOutcome({
  evidence = [],
  procedurePrefer = null,
  route = ""
} = {}) {
  const chunks = sanitizeEvidenceChunks(evidence);
  const prefer = procedurePrefer && typeof procedurePrefer === "object" ? procedurePrefer : null;
  const routeName = safeText(route, 40);

  if (!chunks.length) {
    return {
      outcome: "retrieval_miss",
      empty: true,
      usedForAnswer: false,
      siblingAssembled: false
    };
  }

  const siblingAssembled = Boolean(
    prefer?.enrichment?.enriched
    || /sibling/i.test(String(prefer?.sourceTag || ""))
    || /sibling/i.test(String(prefer?.reason || ""))
    || /from-siblings/i.test(String(prefer?.reason || ""))
  );

  if (prefer?.prefer === true && (prefer.servedAs || /VERIFIED_WORKFLOW|RETRIEVED_PROCEDURE/i.test(routeName))) {
    return {
      outcome: siblingAssembled ? "sibling_assembled_procedure" : "procedure_served",
      empty: false,
      usedForAnswer: true,
      siblingAssembled
    };
  }

  if (prefer && prefer.prefer === false && prefer.reason) {
    return {
      outcome: "retrieved_procedure_rejected",
      empty: false,
      usedForAnswer: false,
      siblingAssembled,
      rejectReason: safeText(prefer.reason, 80)
    };
  }

  if (/VERIFIED_WORKFLOW/i.test(routeName)) {
    return {
      outcome: "verified_workflow",
      empty: false,
      usedForAnswer: true,
      siblingAssembled: false
    };
  }

  if (/GENERATION|LOCAL_KNOWLEDGE/i.test(routeName)) {
    return {
      outcome: chunks.length ? "retrieval_used_for_generation" : "retrieval_miss",
      empty: !chunks.length,
      usedForAnswer: Boolean(chunks.length),
      siblingAssembled: false
    };
  }

  return {
    outcome: "retrieval_present",
    empty: false,
    usedForAnswer: false,
    siblingAssembled
  };
}

function normalizeAnswerKind({
  route = "",
  answerKind = "",
  recovered = false,
  status = "",
  verified = false
} = {}) {
  const kind = safeText(answerKind, 40);
  const routeName = safeText(route, 40);
  if (status === "partial" || status === "empty" || status === "aborted") {
    return kind || (status === "partial" ? "incomplete_failure" : "recoverable_failure");
  }
  if (verified || routeName === "VERIFIED_WORKFLOW" || kind === "verified_workflow") {
    return "verified_workflow";
  }
  if (kind === "recovered_procedure" || (recovered && kind.includes("procedure"))) {
    return "recovered_procedure";
  }
  if (kind === "recovered_principle" || kind === "recovered_hardcoded" || kind === "recovered_local_kb") {
    return kind;
  }
  if (kind === "recovered_prestrip_validated") {
    return kind;
  }
  if (routeName === "RETRIEVED_PROCEDURE" || kind === "retrieved_procedure") {
    return "retrieved_procedure";
  }
  if (kind === "validated" || kind === "generated" || !kind) {
    if (routeName === "GENERATION" || routeName === "LOCAL_KNOWLEDGE_FALLBACK") {
      return recovered ? (kind || "recovered_principle") : "generated";
    }
  }
  return kind || "generated";
}

/**
 * Build a compact, serializable provenance object for one turn.
 */
function buildAnswerProvenance({
  questionId = null,
  route = "",
  status = "completed",
  model = "",
  scriptId = null,
  promptPolicyVersion = PROMPT_POLICY_VERSION,
  promptFingerprint = null,
  systemPromptForFingerprint = null,
  evidence = [],
  procedurePrefer = null,
  answerKind = "",
  recovered = false,
  finishReason = null,
  contentQualityFlags = [],
  answerFinalEmitted = null,
  validationPassed = null
} = {}) {
  const prefer = procedurePrefer && typeof procedurePrefer === "object" ? { ...procedurePrefer } : null;
  if (prefer) {
    delete prefer._spoken;
  }

  const retrievalChunks = sanitizeEvidenceChunks(evidence);
  const retrieval = classifyRetrievalOutcome({
    evidence: retrievalChunks,
    procedurePrefer: prefer,
    route
  });

  const enrichment = prefer?.enrichment && typeof prefer.enrichment === "object"
    ? {
      enriched: Boolean(prefer.enrichment.enriched),
      gap: prefer.enrichment.gap ? safeText(prefer.enrichment.gap, 80) : null,
      sourceFile: safeText(prefer.enrichment.sourceFile, 160) || null,
      heading: safeText(prefer.enrichment.heading, 160) || null,
      chunkIds: safeList(prefer.enrichment.chunkIds, 8, 100),
      reason: safeText(prefer.enrichment.reason, 80) || null
    }
    : null;

  const finalAnswerKind = normalizeAnswerKind({
    route,
    answerKind,
    recovered,
    status,
    verified: prefer?.servedAs === "verified-workflow" || route === "VERIFIED_WORKFLOW"
  });

  const approvedVerified = finalAnswerKind === "verified_workflow"
    && status === "completed"
    && !recovered;

  const fingerprint = promptFingerprint
    || fingerprintPromptPolicy(systemPromptForFingerprint || promptPolicyVersion);

  return {
    schemaVersion: 1,
    questionId: questionId ? safeText(questionId, 80) : null,
    route: safeText(route, 40) || null,
    status: safeText(status, 24) || null,
    model: safeText(model, 80) || null,
    scriptId: scriptId ? safeText(scriptId, 80) : null,
    promptPolicyVersion: safeText(promptPolicyVersion, 80),
    promptFingerprint: fingerprint ? safeText(fingerprint, 64) : null,
    retrieval: {
      outcome: retrieval.outcome,
      empty: Boolean(retrieval.empty),
      usedForAnswer: Boolean(retrieval.usedForAnswer),
      siblingAssembled: Boolean(retrieval.siblingAssembled),
      rejectReason: retrieval.rejectReason || null,
      chunks: retrievalChunks
    },
    procedureSelection: prefer
      ? {
        prefer: Boolean(prefer.prefer),
        reason: safeText(prefer.reason, 80) || null,
        stepCount: Number(prefer.stepCount) || 0,
        sourceTag: safeText(prefer.sourceTag, 40) || null,
        servedAs: safeText(prefer.servedAs, 40) || null,
        wrapMode: safeText(prefer.wrapMode, 40) || null,
        workflowBackboneAsk: Boolean(prefer.workflowBackboneAsk),
        retrievalGap: prefer.retrievalGap ? safeText(prefer.retrievalGap, 80) : null,
        enrichmentReason: prefer.enrichmentReason
          ? safeText(prefer.enrichmentReason, 80)
          : (enrichment?.reason || null),
        taskFitOk: prefer.taskFit && typeof prefer.taskFit === "object"
          ? prefer.taskFit.ok !== false
          : null,
        taskFitReason: prefer.taskFit?.reason ? safeText(prefer.taskFit.reason, 80) : null,
        editionAligned: prefer.alignment && typeof prefer.alignment === "object"
          ? prefer.alignment.aligned !== false
          : null,
        editionReason: prefer.alignment?.reason ? safeText(prefer.alignment.reason, 80) : null,
        enrichment
      }
      : null,
    answerValidation: {
      answerKind: finalAnswerKind,
      recovered: Boolean(recovered),
      finishReason: finishReason ? safeText(finishReason, 64) : null,
      contentQualityFlags: safeList(contentQualityFlags, 16, 80),
      validationPassed: validationPassed == null
        ? (status === "completed" && Boolean(finalAnswerKind) && finalAnswerKind !== "recoverable_failure")
        : Boolean(validationPassed),
      approvedVerified,
      answerFinalEmitted: answerFinalEmitted == null ? null : Boolean(answerFinalEmitted)
    }
  };
}

function sanitizeProvenance(value) {
  if (!value || typeof value !== "object") return null;
  try {
    // Re-run through builder with already-sanitized-ish inputs to drop unexpected keys.
    return buildAnswerProvenance({
      questionId: value.questionId,
      route: value.route,
      status: value.status,
      model: value.model,
      scriptId: value.scriptId,
      promptPolicyVersion: value.promptPolicyVersion || PROMPT_POLICY_VERSION,
      promptFingerprint: value.promptFingerprint,
      evidence: value.retrieval?.chunks || value.evidence || [],
      procedurePrefer: value.procedureSelection
        ? {
          prefer: value.procedureSelection.prefer,
          reason: value.procedureSelection.reason,
          stepCount: value.procedureSelection.stepCount,
          sourceTag: value.procedureSelection.sourceTag,
          servedAs: value.procedureSelection.servedAs,
          wrapMode: value.procedureSelection.wrapMode,
          workflowBackboneAsk: value.procedureSelection.workflowBackboneAsk,
          retrievalGap: value.procedureSelection.retrievalGap,
          enrichmentReason: value.procedureSelection.enrichmentReason,
          taskFit: value.procedureSelection.taskFitOk == null
            ? undefined
            : { ok: value.procedureSelection.taskFitOk, reason: value.procedureSelection.taskFitReason },
          alignment: value.procedureSelection.editionAligned == null
            ? undefined
            : { aligned: value.procedureSelection.editionAligned, reason: value.procedureSelection.editionReason },
          enrichment: value.procedureSelection.enrichment
        }
        : null,
      answerKind: value.answerValidation?.answerKind || value.answerKind,
      recovered: value.answerValidation?.recovered,
      finishReason: value.answerValidation?.finishReason,
      contentQualityFlags: value.answerValidation?.contentQualityFlags,
      answerFinalEmitted: value.answerValidation?.answerFinalEmitted,
      validationPassed: value.answerValidation?.validationPassed
    });
  } catch {
    return null;
  }
}

module.exports = {
  PROMPT_POLICY_VERSION,
  fingerprintPromptPolicy,
  sanitizeEvidenceChunks,
  classifyRetrievalOutcome,
  normalizeAnswerKind,
  buildAnswerProvenance,
  sanitizeProvenance
};
