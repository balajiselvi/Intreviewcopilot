const { admitQuestion, priorAnchor, DECISIONS } = require("./questionAdmission.js");
const { resolvePreparedScript } = require("./scriptMatch.js");
const { matchAnswerBank } = require("./answerBank.js");
const { scopeCareerEvidence } = require("../eval/lib/careerTimeline.js");
const { prepareLiveTranscript, IGNORE_NOISE_TOKEN } = require("./transcriptGuardrails.js");

/**
 * Anti-hallucination contract attached to every admitted turn (consumed by prompt layer).
 * VERIFY ALL T-CODES BEFORE OUTPUT — never confuse read vs admin/delete planes.
 */
const TCODE_VERIFICATION_RULE = [
  "VERIFY ALL T-CODES BEFORE OUTPUT.",
  "Never confuse display/read transactions with administration/deletion transactions.",
  "Security Audit Log: SM20/SM20N/RSAU_READ_LOG = READ/ANALYZE only;",
  "SM18/RSAUPURG/RSAU_ADMIN = DELETE/PURGE/reorganize (retention often >= 3 days);",
  "SM19/RSAU_CONFIG = CONFIGURE filters/activation.",
  "Authorization object S_ADMI_FCD value AUDA where audit administration applies.",
  "If unsure of an exact transaction code or table name, state the architectural pattern and the standard SAP report/utility name (e.g. RSAUPURG, SU25 step 2b, RSECADMIN) or BTP API/service — do not guess speculative 4-character T-codes."
].join(" ");

function priorBankIdFromHistory(history = []) {
  if (!Array.isArray(history)) return "";
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const item = history[i];
    const id = String(item?.scriptId || item?.bankId || "").trim();
    if (/^SAPSC-\d{3}$/.test(id)) return id;
  }
  return "";
}

function decideInterviewTurn({ question = "", history = [], priorQuestion = "" } = {}) {
  const prepared = prepareLiveTranscript(question);
  if (prepared.ignoreNoise) {
    return {
      decision: DECISIONS.IGNORE,
      route: "NONE",
      reason: "ignore-noise",
      scriptId: null,
      confidence: 0,
      evidenceMode: null,
      programmeId: null,
      scriptAnswer: IGNORE_NOISE_TOKEN,
      normalizedQuestion: prepared.normalized,
      features: { ignoreNoise: true }
    };
  }

  const workingQuestion = prepared.normalized || question;
  const prior = priorQuestion || priorAnchor(history);
  const admission = admitQuestion(workingQuestion, { priorQuestion: prior });

  // Exact/alias bank hits beat loose CV script patterns (e.g. "access request
  // management" must not steal the authored ARM end-to-end bank answer).
  // Evaluate before admission short-circuit so authored bank questions still
  // answer when speech admission would otherwise DEFER a well-formed STAR closer.
  let bankHit = null;
  try {
    bankHit = matchAnswerBank(workingQuestion, {
      priorQuestion: prior,
      priorBankId: priorBankIdFromHistory(history)
    });
  } catch (error) {
    bankHit = null;
  }
  if (
    admission.decision !== DECISIONS.ANSWER
    && !(bankHit?.authoritative && bankHit.answer && ["exact", "alias"].includes(bankHit.via) && admission.decision === DECISIONS.DEFER)
  ) {
    return {
      decision: admission.decision,
      route: "NONE",
      reason: admission.reason,
      scriptId: null,
      confidence: 0,
      evidenceMode: null,
      programmeId: null,
      scriptAnswer: admission.decision === DECISIONS.IGNORE ? IGNORE_NOISE_TOKEN : "",
      normalizedQuestion: workingQuestion,
      features: { ...admission.features, reconstructed: prepared.reconstructed }
    };
  }
  let evidence = { mode: "full", programmeId: null, text: "" };
  try {
    evidence = scopeCareerEvidence(workingQuestion, prior);
  } catch (error) {
    evidence = { mode: "full", programmeId: null, text: "" };
  }

  const answerMeta = {
    normalizedQuestion: workingQuestion,
    features: { ...admission.features, reconstructed: prepared.reconstructed },
    tcodeVerificationRule: TCODE_VERIFICATION_RULE
  };

  if (bankHit?.authoritative && bankHit.answer && ["exact", "alias"].includes(bankHit.via)) {
    return {
      decision: DECISIONS.ANSWER,
      route: "ANSWER_BANK",
      reason: admission.reason,
      scriptId: bankHit.id,
      confidence: bankHit.confidence,
      via: bankHit.via,
      evidenceMode: evidence.mode,
      programmeId: evidence.programmeId,
      scriptAnswer: bankHit.answer,
      bankDomain: bankHit.domain,
      bankTask: bankHit.task,
      candidateSpecific: Boolean(bankHit.candidate_specific),
      ...answerMeta
    };
  }

  let script = null;
  try {
    script = resolvePreparedScript(workingQuestion);
  } catch (error) {
    script = null;
  }
  if (script?.authoritative) {
    return {
      decision: DECISIONS.ANSWER,
      route: "PREPARED_SCRIPT",
      reason: admission.reason,
      scriptId: script.id,
      confidence: script.confidence,
      via: script.via,
      evidenceMode: evidence.mode,
      programmeId: evidence.programmeId,
      scriptAnswer: script.answer,
      ...answerMeta
    };
  }

  if (bankHit?.authoritative && bankHit.answer) {
    return {
      decision: DECISIONS.ANSWER,
      route: "ANSWER_BANK",
      reason: admission.reason,
      scriptId: bankHit.id,
      confidence: bankHit.confidence,
      via: bankHit.via,
      evidenceMode: evidence.mode,
      programmeId: evidence.programmeId,
      scriptAnswer: bankHit.answer,
      bankDomain: bankHit.domain,
      bankTask: bankHit.task,
      candidateSpecific: Boolean(bankHit.candidate_specific),
      ...answerMeta
    };
  }

  return {
    decision: DECISIONS.ANSWER,
    route: "GENERATION",
    reason: admission.reason,
    scriptId: null,
    confidence: 0,
    evidenceMode: evidence.mode,
    programmeId: evidence.programmeId,
    scriptAnswer: "",
    evidenceText: evidence.text,
    ...answerMeta
  };
}

module.exports = { decideInterviewTurn, TCODE_VERIFICATION_RULE };
