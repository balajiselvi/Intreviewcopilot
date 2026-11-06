/**
 * V2.2 Production Response Integrity Gate
 * Pre-display relevance / contamination / meta-response validation with one bounded recovery.
 * Reuses knowledgeCoverage concept extraction patterns; does not create a parallel RAG engine.
 */

const {
  evaluateAnswerConceptCoverage,
  extractRequiredConcepts
} = require("./knowledgeCoverage.js");
const { sanitizeSpokenAnswer, isMetaRefusalText } = require("./generationGuard.js");
const {
  answerContainsDisallowedProjectMetrics,
  isConceptualTechnicalQuestion
} = require("./experienceEligibility.js");

/** Operational provider-disabled text must not be rewritten into a technical answer. */
const PROVIDER_DISABLED_OPERATIONAL =
  /\bProvider generation is disabled on this server\b/i;

function isProviderDisabledOperationalMessage(answer = "") {
  return PROVIDER_DISABLED_OPERATIONAL.test(String(answer || ""));
}

const META_PROCEDURE_RESPONSE = /\b(?:I outline the governing architecture|I treat this as a (?:conceptual|platform|technical)|I will answer using the following framework|To approach this configuration|I approach this as (?:a|an)|I keep the answer on the platform structure)\b/i;

// Coaching / bank-label leaks only — do NOT treat ordinary procedure verbs like
 // "Validate the mapping…" as bank contamination (that falsely killed BRM verified answers).
const BANK_HEADING_OR_COACHING_LEAK =
  /\bExplain the architecture of Mitigating Controls in GRC ARA\b|\bValidate expiry, owner accountability\b|\bWhat Makes This a 10\/10 Answer\b|\b\d+\s*Second Interview Answer\b|\bCommon Interview Questions\b/i;

const S4_TRANSFORMATION_BLUEPRINT_LEAK =
  /\bSix stages\b|\b1,?650\s+PFCG\b|\b350\s+business roles\b|\b220\s+Fiori catalogs\b|\b2,?400\+?\s+(?:SoD\s+)?conflicts?\b/i;

/** Checklist / red-flag fragments from risk-analysis.md that are not interview answers. */
const CHECKLIST_FRAGMENT_LEAK =
  /\bRun baseline risk analysis and triage results into remediation, mitigation, or acceptance\b[\s\S]{0,80}\bTreating mitigation as equivalent to remediation\b/i;

const CRITICAL_ACTION_SHALLOW =
  /\bcritical actions?\b.{0,80}\b(?:important|activities|tasks|steps)\b|\bcritical actions?\s+are important\b/i;

const CRITICAL_ACTION_WRONG_CONCEPT =
  /\bcritical action\b[\s\S]{0,120}\b(?:firefighter|controller|SLA|log review)\b|\bfirefighter\b[\s\S]{0,80}\bcritical action\b/i;

const WRONG_PRODUCT_PATTERNS = Object.freeze({
  "ara-hierarchy": [
    /\b(?:ECC|S\/?4HANA)\b.{0,80}\b(?:role design|master role|derived role|composite role|PFCG)\b/i,
    /\b(?:master|derived|composite)\s+roles?\b.{0,60}\b(?:ECC|S\/?4)\b/i,
    /\bPublic Edition\b.{0,40}\bbusiness roles?\b/i
  ],
  "grc-ruleset": [
    // IAG / Business Function Group as the explanatory subject (not a brief contrast).
    /\b(?:Cloud )?IAG\b(?![\s\S]{0,80}\b(?:not|unlike|rather than|versus|on-premise)\b)/i,
    /\bIdentity Access Governance\b(?![\s\S]{0,80}\b(?:not|unlike|rather than|versus|on-premise)\b)/i,
    /\bBusiness Function Group\b/i,
    /\bIAG\s+(?:Access Analysis|Rule Setup|Bridge)\b/i
  ],
  "eam-ff-logs": [
    /\bI outline the governing architecture\b/i,
    /\bplatform structure and security model\b/i
  ],
  "critical-access-risks": [
    /\bI outline the governing architecture\b/i,
    /\bplatform structure and security model\b/i,
    /\b(?:master|derived|composite)\s+roles?\b.{0,40}\bPFCG\b/i,
    S4_TRANSFORMATION_BLUEPRINT_LEAK
  ],
  "critical-actions": [
    S4_TRANSFORMATION_BLUEPRINT_LEAK,
    /\bHypercare for access defects\b/i,
    /\bcut over with provisioning\b/i
  ],
  "critical-permissions": [
    S4_TRANSFORMATION_BLUEPRINT_LEAK,
    /\bHypercare for access defects\b/i
  ],
  "mitigation-lifecycle": [
    BANK_HEADING_OR_COACHING_LEAK,
    S4_TRANSFORMATION_BLUEPRINT_LEAK
  ]
});

function hasWrongProductContamination(family, answer = "") {
  const text = String(answer || "");
  if (!family) return false;
  if (family === "grc-ruleset") {
    const namesIag = /\b(?:Cloud )?IAG\b|\bIdentity Access Governance\b|\bBusiness Function Group\b/i.test(text);
    if (!namesIag) return false;
    // Allow a short contrast that keeps on-premise GRC Access Control / ARA as the subject.
    const onPremSubject = /\bon-premise SAP GRC Access Control\b|\bSAP GRC Access Control\b.{0,40}\bARA\b|\bnot a Cloud IAG\b|\bunlike Cloud IAG\b/i.test(text);
    if (onPremSubject) return false;
    return true;
  }
  if (family === "ara-hierarchy") {
    const roleDesign = (WRONG_PRODUCT_PATTERNS["ara-hierarchy"] || []).some((re) => re.test(text));
    if (!roleDesign) return false;
    // Allow an explicit rejection of role-design substitution.
    if (/\bconfusing this with PFCG\b|\bnot (?:an? )?(?:S\/?4|ECC).{0,40}role-design\b/i.test(text)) return false;
    return true;
  }
  const patterns = WRONG_PRODUCT_PATTERNS[family] || [];
  return patterns.some((re) => re.test(text));
}

function detectQuestionContractFamily(question = "") {
  const q = String(question || "");
  if (/\brisk\b/i.test(q) && /\bfunction\b/i.test(q) && /\baction\b/i.test(q) && /\bpermission\b/i.test(q)) {
    return "ara-hierarchy";
  }
  if (/\brule\s*sets?\s+components?\b/i.test(q) || /\bcomponents?\s+of\s+(?:a\s+)?(?:the\s+)?rule\s*sets?\b/i.test(q)) {
    return "grc-ruleset";
  }
  if (/\bfirefighter\b/i.test(q) && /\blogs?\b/i.test(q) && /\b(?:not\s+generated|missing|not\s+coming|empty|sync)/i.test(q)) {
    return "eam-ff-logs";
  }
  if (/\bcritical access risks?\b/i.test(q)) {
    return "critical-access-risks";
  }
  if (/\bcritical actions?\b/i.test(q) && !/\bcritical access risks?\b/i.test(q) && !/\bcritical permissions?\b/i.test(q)) {
    return "critical-actions";
  }
  if (/\bcritical permissions?\b/i.test(q) && !/\bcritical access risks?\b/i.test(q)) {
    return "critical-permissions";
  }
  if (/\bmitigation lifecycle\b/i.test(q) || (/\bmitigating controls?\b/i.test(q) && /\blifecycle\b/i.test(q))) {
    return "mitigation-lifecycle";
  }
  return "";
}

function isMetaProcedureResponse(answer = "") {
  const text = String(answer || "");
  if (!text.trim()) return true;
  if (META_PROCEDURE_RESPONSE.test(text)) return true;
  if (isMetaRefusalText(text)) return true;
  // Methodology-only shells with no domain nouns for known GRC asks.
  if (
    /\b(?:governing architecture|security model first|business control objective)\b/i.test(text)
    && !/\b(?:ARA|EAM|Firefighter|ruleset|SoD|Risk|Function|Action|Permission|GRAC_|MSMP)\b/i.test(text)
  ) {
    return true;
  }
  return false;
}

function buildDirectTechnicalFallback(question = "") {
  const q = String(question || "");
  const family = detectQuestionContractFamily(question);
  if (family === "ara-hierarchy") {
    return [
      "In SAP GRC Access Control Access Risk Analysis, Risk, Function, Action and Permission form the ruleset hierarchy rather than an S/4 or ECC role-design model.",
      "A Risk is the access-risk condition ARA evaluates — typically a segregation-of-duties conflict, a Critical Action risk, or a Critical Permission risk.",
      "A Function groups the business activities that participate in that risk and is built from associated Actions and Permissions.",
      "An Action is the executable item being checked — for example an SAP transaction, Web Dynpro application, Fiori UI5 application, or OData service.",
      "A Permission is the authorization-object, field and value combination that makes that Action possible.",
      "ARA constructs rules by binding those layers so conflicting Functions held by the same user surface as Risks; confusing this with PFCG master/derived/composite role design answers a different question."
    ].join(" ");
  }
  if (family === "grc-ruleset") {
    return [
      "In on-premise SAP GRC Access Control, a ruleset is the maintained ARA content that defines what constitutes access risk — not a cloud identity-governance business-function-group model.",
      "The core components are Risks, Functions, Actions and Permissions: Functions map business activities to Actions and Permissions, and Risks combine conflicting Functions into SoD, Critical Action or Critical Permission definitions.",
      "SAP delivers a standard ruleset as a baseline; organisations extend it with custom Functions and Risks so analysis matches real processes and custom transactions.",
      "Ruleset quality determines whether ARA finds genuine conflicts or produces noise, so maintenance stays tied to change management rather than a one-time load."
    ].join(" ");
  }
  if (family === "eam-ff-logs") {
    return [
      "When Firefighter logs are not generated in SAP GRC Access Control EAM, I treat it as a collection and synchronization problem, not a generic architecture discussion.",
      "First I confirm which log type is missing and whether the Firefighter session was correctly closed, because an open or aborted session may never produce a reviewable log package.",
      "Then I verify whether the target system actually captured the expected session activity, and whether the GRC Firefighter log synchronization job or report ran successfully for that connector and time window.",
      "I validate the connector and RFC path, review background-job and application logs for collection or authorization failures, and check target-system logging prerequisites.",
      "For historical gaps I check the requested timestamp range and any supported recovery or resynchronization path, confirm consolidated log availability in GRC, and only then verify controller log-review processing.",
      "I use the release-appropriate EAM log sync and collection reports for that Access Control support package rather than inventing unrelated diagnostic transactions."
    ].join(" ");
  }
  if (family === "critical-access-risks") {
    return [
      "Critical Access Risks in SAP GRC Access Control ARA are ruleset-defined conditions where a single powerful Action or Permission is treated as high risk even without a classic two-function SoD pair.",
      "Unlike segregation-of-duties Risks that require conflicting Functions together, Critical Action and Critical Permission Risks flag inherently sensitive executables or authorization values on their own — for example highly privileged transactions or critical authorization-object values.",
      "They sit in the same ARA ruleset model as SoD Risks, so Functions, Actions and Permissions still define what is being evaluated, but the business intent is sensitive-access detection rather than dual-control conflict detection.",
      "In practice I keep Critical Access Risks current with privileged operations the organisation cares about, and I triage findings separately from SoD noise so remediation and mitigation ownership stay clear."
    ].join(" ");
  }
  if (family === "critical-actions") {
    return [
      "In SAP GRC Access Control Access Risk Analysis, a Critical Action is a ruleset risk type that flags a single sensitive executable — typically a transaction, Web Dynpro, Fiori app, or service — as high risk on its own.",
      "It is not an S/4HANA role-transformation methodology and it is not the same as a segregation-of-duties Risk, which needs conflicting Functions together.",
      "Critical Action differs from Critical Permission: the Action layer checks the executable; Critical Permission checks a powerful authorization-object, field and value combination even when the Action itself looks ordinary.",
      "I keep Critical Action rules aligned to privileged operations the business cares about and triage those findings separately from SoD noise."
    ].join(" ");
  }
  if (family === "critical-permissions") {
    return [
      "In SAP GRC Access Control ARA, a Critical Permission is a ruleset risk that treats a sensitive authorization-object, field and value combination as high risk by itself.",
      "Unlike a Critical Action, which focuses on the executable being started, Critical Permission focuses on the underlying authorization values that enable powerful change or administration.",
      "Unlike an SoD Risk, it does not require two conflicting Functions; the single permission pattern is enough to raise the risk.",
      "I maintain those permission definitions with the organisation's privileged-access policy and review findings separately from classic SoD conflicts."
    ].join(" ");
  }
  if (family === "mitigation-lifecycle") {
    return [
      "In GRC Access Control, mitigating controls are the governed exception path when a risk cannot be removed by changing access.",
      "Operationally I treat the control lifecycle as define the control and monitoring activity, assign owner and monitor, link the control to the risk and user or role, approve activation, execute the review on schedule with evidence, and expire or renew before residual-risk reporting drifts from audit expectations.",
      "Mitigation is not remediation and not automatically Process Control, though a Process Control control can be referenced when that integration is in scope.",
      "I validate owner accountability, review evidence, and confirm residual-risk reporting still shows the mitigation trail auditors expect."
    ].join(" ");
  }
  // Provisioning lifecycle — keep SAP IDM and Cloud IPS on separate planes (no collapse).
  if (/\b(?:identity\s+)?provisioning\s+lifecycle\b/i.test(q)
    || (/\bprovisioning\b/i.test(q) && /\blifecycle\b/i.test(q))
    || (/\b(?:IDM|IPS)\b/i.test(q) && /\b(?:lifecycle|provision|JML|joiner|source|target)\b/i.test(q))) {
    if (/\bIPS\b/i.test(q) && !/\bIDM\b/i.test(q)) {
      return [
        "In SAP Cloud Identity Services, IPS provisioning lifecycle is the cloud sync path that reads an authoritative source, applies JSON transformations, and writes accounts or groups to targets over SCIM or the connector model.",
        "I treat it as source and target system setup, attribute mapping and filters, full versus delta job cadence, failed-entity handling, and reconciliation evidence — without collapsing authentication into IPS.",
        "IAS still authenticates; IPS only provisions. I validate with a representative joiner, mover, and leaver plus the job log rather than assuming a green sync means every account is correct."
      ].join(" ");
    }
    return [
      "Identity provisioning lifecycle is the governed path that creates, changes, and deactivates accounts and entitlements from an authoritative source into target systems — and the plane matters.",
      "On-premise SAP Identity Management 7.2 or 8.0 runs that lifecycle in the Identity Center with entry types such as MX_PERSON, repositories, jobs, tasks and event tasks, plus ABAP or LDAP connectors and scripted logic in Developer Studio, executed by the Runtime Engine.",
      "Cloud IPS is a different plane: a connector and SCIM synchronization engine with source, target and proxy systems and JSON read/write transformations, without IDM's heavy stateful workflow orchestration.",
      "IAG sits on the governance plane for access request, analysis and privileged access — it is not a substitute for IDM or IPS provisioning mechanics.",
      "I validate with joiner, mover and leaver evidence on the plane actually in scope, and I never describe IPS JSON sync as if it were Identity Center event tasks."
    ].join(" ");
  }
  return "";
}

function buildInabilitySpokenAnswer(question = "") {
  // NUCLEAR: never emit inability/hedge spoken lines into the UI.
  void question;
  return "";
}

/**
 * Validate a candidate-facing answer against the current question contract.
 * Not pure keyword overlap: uses contract family, essential-concept coverage, meta detection,
 * and known wrong-product contamination patterns. Documented limitation: this is a structured
 * contract gate, not a full semantic entailment model.
 */
function evaluateSpokenAnswerIntegrity({ question = "", answer = "", interviewContext = {} } = {}) {
  void interviewContext;
  const q = String(question || "");
  const spoken = String(answer || "").trim();
  // Provider-disabled is an operational outcome, not a technical answer under evaluation.
  if (isProviderDisabledOperationalMessage(spoken)) {
    return {
      ok: true,
      reasons: [],
      family: detectQuestionContractFamily(q),
      conceptGate: { ok: true, reason: "provider-disabled-operational" },
      limitation: "Operational provider-disabled message accepted without technical concept entailment."
    };
  }
  const family = detectQuestionContractFamily(q);
  const conceptGate = evaluateAnswerConceptCoverage({ question: q, answer: spoken });
  const reasons = [];

  if (!spoken) reasons.push("empty-answer");
  if (isMetaProcedureResponse(spoken)) reasons.push("meta-procedure-response");
  // Inability lines are recovery endpoints, not successful technical answers.
  if (/I do not have a reliable technical (?:answer|procedure|definition) I can defend/i.test(spoken)
    || /I would rather qualify the gap/i.test(spoken)) {
    reasons.push("inability-not-technical-answer");
  }
  if (BANK_HEADING_OR_COACHING_LEAK.test(spoken)) reasons.push("bank-heading-or-coaching-leak");
  if (CHECKLIST_FRAGMENT_LEAK.test(spoken)) reasons.push("checklist-fragment-leak");
  if (answerContainsDisallowedProjectMetrics(q, spoken)) reasons.push("disallowed-project-metrics");
  if (family && hasWrongProductContamination(family, spoken)) {
    reasons.push(`wrong-product:${family}`);
  }
  if (!conceptGate.ok && conceptGate.reason !== "no-required-concepts") {
    reasons.push(`concept-coverage:${conceptGate.reason}`);
  }
  // Family-specific substance — require distinguishing mechanism, not keyword presence alone.
  if (family === "ara-hierarchy") {
    const needed = [/\brisk\b/i, /\bfunction\b/i, /\baction\b/i, /\bpermission\b/i];
    if (needed.some((re) => !re.test(spoken))) reasons.push("ara-hierarchy-incomplete");
  }
  if (family === "critical-access-risks") {
    if (!/\bcritical\b/i.test(spoken)) reasons.push("critical-access-missing");
    if (!/\b(?:SoD|segregation|single|on its own|without.{0,20}conflict|Critical Action|Critical Permission)\b/i.test(spoken)) {
      reasons.push("critical-access-no-contrast");
    }
  }
  if (family === "critical-actions") {
    if (!/\bcritical actions?\b/i.test(spoken)) reasons.push("critical-actions-missing");
    if (CRITICAL_ACTION_SHALLOW.test(spoken)) reasons.push("critical-actions-shallow");
    if (CRITICAL_ACTION_WRONG_CONCEPT.test(spoken)) reasons.push("critical-actions-wrong-concept");
    if (!/\b(?:ARA|Access Risk Analysis|ruleset|rule set)\b/i.test(spoken)
      || !/\b(?:transaction|executable|Web Dynpro|Fiori|service|S_TCODE|single|on its own|without)\b/i.test(spoken)) {
      reasons.push("critical-actions-incomplete-definition");
    }
  }
  if (family === "critical-permissions") {
    if (!/\bcritical permission/i.test(spoken)) reasons.push("critical-permissions-missing");
    if (!/\b(?:authorization object|auth(?:orization)?\s*object|field|value)\b/i.test(spoken)) {
      reasons.push("critical-permissions-incomplete-definition");
    }
  }
  if (family === "mitigation-lifecycle") {
    const lifecycleMarks = [/\bmitigat/i, /\bowner\b/i, /\bmonitor\b/i, /\b(?:expir|renew|review|evidence)\b/i];
    if (lifecycleMarks.filter((re) => re.test(spoken)).length < 2) {
      reasons.push("mitigation-lifecycle-incomplete");
    }
    if (CHECKLIST_FRAGMENT_LEAK.test(spoken) || /^Run baseline risk analysis\b/i.test(spoken)) {
      reasons.push("mitigation-checklist-substitution");
    }
  }
  if (family === "eam-ff-logs") {
    const ffMarks = [/\blogs?\b/i, /\b(?:sync|synchron)/i, /\b(?:session|connector|controller|Firefighter)\b/i];
    if (ffMarks.filter((re) => re.test(spoken)).length < 2) {
      reasons.push("ff-log-troubleshooting-incomplete");
    }
  }
  if (family === "grc-ruleset") {
    if (!/\b(?:ruleset|rule set)\b/i.test(spoken) || !/\b(?:function|risk|ARA|Access Risk)\b/i.test(spoken)) {
      reasons.push("ruleset-components-incomplete");
    }
  }
  if (!family && isConceptualTechnicalQuestion(q) && S4_TRANSFORMATION_BLUEPRINT_LEAK.test(spoken)) {
    reasons.push("conceptual-s4-blueprint-substitution");
  }
  if (!family && isConceptualTechnicalQuestion(q) && CHECKLIST_FRAGMENT_LEAK.test(spoken)) {
    reasons.push("checklist-fragment-leak");
  }

  return {
    ok: reasons.length === 0,
    reasons,
    family,
    conceptGate,
    limitation: "Structured contract gate (family + concepts + contamination patterns); not full semantic entailment."
  };
}

/**
 * Sanitize → validate → at most one recovery → re-validate → inability.
 * Never returns a meta-procedure template.
 */
function validateAndRecoverSpokenAnswer({
  question = "",
  answer = "",
  interviewContext = {},
  recoveryAnswer = ""
} = {}) {
  try {
    let spoken = sanitizeSpokenAnswer(answer);
    // Never rewrite an explicit provider-disabled operational message into a technical answer.
    if (isProviderDisabledOperationalMessage(spoken)) {
      return {
        ok: true,
        answer: spoken,
        recovered: false,
        attempts: 0,
        gate: {
          ok: true,
          reasons: [],
          family: detectQuestionContractFamily(question),
          limitation: "provider-disabled-operational"
        },
        answerKind: "provider_disabled"
      };
    }
    let gate = evaluateSpokenAnswerIntegrity({ question, answer: spoken, interviewContext });
    if (gate.ok) {
      return {
        ok: true,
        answer: spoken,
        recovered: false,
        attempts: 0,
        gate,
        answerKind: "validated"
      };
    }

    // One recovery only.
    let recovered = String(recoveryAnswer || "").trim();
    if (!recovered) recovered = buildDirectTechnicalFallback(question);
    recovered = sanitizeSpokenAnswer(recovered);
    if (recovered && !isMetaProcedureResponse(recovered)) {
      const recoveredGate = evaluateSpokenAnswerIntegrity({
        question,
        answer: recovered,
        interviewContext
      });
      if (recoveredGate.ok) {
        return {
          ok: true,
          answer: recovered,
          recovered: true,
          attempts: 1,
          gate: recoveredGate,
          priorGate: gate,
          answerKind: "recovered_direct_technical"
        };
      }
    }

    const inability = sanitizeSpokenAnswer(buildInabilitySpokenAnswer(question));
    return {
      ok: false,
      answer: inability,
      recovered: true,
      attempts: 1,
      gate,
      answerKind: "inability",
      rejected: true
    };
  } catch {
    return {
      ok: false,
      answer: buildInabilitySpokenAnswer(question),
      recovered: true,
      attempts: 0,
      gate: { ok: false, reasons: ["integrity-gate-error"] },
      answerKind: "inability",
      rejected: true
    };
  }
}

/**
 * Single finalization boundary for every candidate-visible answer route.
 * Sanitize → validate → at most one recovery → never return rejected first-pass text.
 */
function finalizeSpokenAnswerForDisplay({
  question = "",
  answer = "",
  interviewContext = {},
  recoveryAnswer = ""
} = {}) {
  return validateAndRecoverSpokenAnswer({
    question,
    answer,
    interviewContext,
    recoveryAnswer: recoveryAnswer || buildDirectTechnicalFallback(question)
  });
}

module.exports = {
  detectQuestionContractFamily,
  isMetaProcedureResponse,
  isProviderDisabledOperationalMessage,
  hasWrongProductContamination,
  buildDirectTechnicalFallback,
  buildInabilitySpokenAnswer,
  evaluateSpokenAnswerIntegrity,
  validateAndRecoverSpokenAnswer,
  finalizeSpokenAnswerForDisplay,
  META_PROCEDURE_RESPONSE
};
