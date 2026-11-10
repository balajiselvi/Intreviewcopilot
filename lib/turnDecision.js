const { admitQuestion, priorAnchor, DECISIONS } = require("./questionAdmission.js");
const { resolvePreparedScript } = require("./scriptMatch.js");
const { matchAnswerBank } = require("./answerBank.js");
const { scopeCareerEvidence } = require("./candidateExperience.js");
const { prepareLiveTranscript, IGNORE_NOISE_TOKEN } = require("./transcriptGuardrails.js");
const { sanitizeSpokenAnswer, stripBankQuestionLabels } = require("./generationGuard.js");

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

/**
 * Non-bypassable output sanitizer contract (enforced in chat.js finalizeSpokenAnswer;
 * also applied here to any script/bank answer decided on the turn path).
 */
const OUTPUT_SANITIZER_RULE = [
  "POST-GENERATION OUTPUT SANITIZER (mandatory):",
  "Strip Q\\d+: bank headers, 'I would treat Q…', governing design boundary meta-talk,",
  "RULE N labels, interviewPrompt.js / turnDecision.js path leaks, doors/keys analogies,",
  "Decision:/Mechanism:/Governance:/Validation: template headings,",
  "and ALL meta-evaluation / rubric frames ('An average answer…', 'A 10/10 answer…',",
  "'In a senior architect answer…', 'To score full points…', 'According to the framework…',",
  "'What makes this a 10/10…', coaching preambles like 'Sure' / 'Great question') —",
  "flatten into fluent first-person spoken candidate prose before any answer reaches the UI."
].join(" ");

/**
 * Live-interview voice contract injected on every generation turn (chat.js customInstructions).
 */
const SPOKEN_CANDIDATE_VOICE_RULE = [
  "SPOKEN CANDIDATE VOICE (mandatory — V2.2 integrity-aware):",
  "Speak to Senior Principal Technical Architect / Senior Manager communication quality for SAP Security, GRC, Fiori, BTP & IAM.",
  "Do not claim employment, affiliation, or project experience with Protiviti or any organisation unless candidate background supports it.",
  "Begin immediately by answering the question. Use first-person for approaches/troubleshooting/experience;",
  "for pure definitions prefer a direct technical definition — do not force first-person autobiography.",
  "ZERO PREAMBLE — no 'Sure', 'I can explain that', 'Great question', 'Here is an evaluation',",
  "'Here is a draft', 'To approach this configuration…', 'I treat this as a conceptual…',",
  "or 'I will answer using the following framework…'.",
  "ABSOLUTE META-TALK BAN — never print classification decisions, planning commentary, coverage diagnostics,",
  "grading rubrics, or labels: 'Product boundaries:', 'Expected answer:', 'Grade:', 'Evaluation:', 'Grading:',",
  "'Average answer:', 'Strategic Executive Summary:', 'The system should…', 'I am using the knowledge base…'.",
  "Honor the REASONING TEMPLATE / intent structure — do not force a five-point architecture shape onto every answer.",
  "Name exact T-codes/objects only when they directly answer the question; never dump artifacts to sound technical.",
  "Output ONLY the clean candidate-facing answer. Never invent personal employers or metrics."
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
    tcodeVerificationRule: TCODE_VERIFICATION_RULE,
    outputSanitizerRule: OUTPUT_SANITIZER_RULE,
    spokenCandidateVoiceRule: SPOKEN_CANDIDATE_VOICE_RULE
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
      scriptAnswer: sanitizeSpokenAnswer(bankHit.answer),
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
      scriptAnswer: sanitizeSpokenAnswer(script.answer),
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
      scriptAnswer: sanitizeSpokenAnswer(bankHit.answer),
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

module.exports = {
  decideInterviewTurn,
  TCODE_VERIFICATION_RULE,
  OUTPUT_SANITIZER_RULE,
  SPOKEN_CANDIDATE_VOICE_RULE,
  sanitizeSpokenAnswer,
  stripBankQuestionLabels
};
