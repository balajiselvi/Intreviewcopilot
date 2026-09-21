const crypto = require("crypto");

const QUESTION_INTENTS = Object.freeze({
  DIRECT_QUESTION: "DIRECT_QUESTION",
  FOLLOW_UP: "FOLLOW_UP",
  CLARIFICATION: "CLARIFICATION",
  CORRECTION: "CORRECTION",
  CHALLENGE: "CHALLENGE",
  PROBE_DEEPER: "PROBE_DEEPER",
  REQUEST_FOR_EXAMPLE: "REQUEST_FOR_EXAMPLE",
  REQUEST_FOR_TECHNICAL_STEPS: "REQUEST_FOR_TECHNICAL_STEPS",
  REQUEST_FOR_VALIDATION: "REQUEST_FOR_VALIDATION",
  REQUEST_FOR_REMEDIATION: "REQUEST_FOR_REMEDIATION",
  REQUEST_FOR_ARCHITECTURE: "REQUEST_FOR_ARCHITECTURE",
  REQUEST_FOR_EXPERIENCE: "REQUEST_FOR_EXPERIENCE",
  SCENARIO_DESCRIPTION: "SCENARIO_DESCRIPTION",
  CONFIRMATION: "CONFIRMATION",
  FRAGMENT: "FRAGMENT",
  NON_QUESTION: "NON_QUESTION",
  UNKNOWN: "UNKNOWN"
});

const ENTITY_RULES = Object.freeze([
  ["SAC", /\b(SAC|SAP Analytics Cloud)\b/i],
  ["Fiori", /\b(Fiori|launchpad|catalogs?|spaces?|pages?|tiles?|target mapping|Manage Purchase Order)\b/i],
  ["BTP", /\b(BTP|role collections?|XSUAA)\b/i],
  ["IAS", /\b(IAS|Identity Authentication)\b/i],
  ["IPS", /\b(IPS|Identity Provisioning|SCIM|provisioning|JML)\b/i],
  ["IAG", /\b(IAG|Identity Access Governance)\b/i],
  ["GRC", /\b(GRC|ARA|ARM|EAM|BRM|SoD|ruleset|conflicts?|risks?)\b/i],
  ["S/4HANA", /\b(S\/?4(?:HANA)?|PFCG|SU24|authorization objects?|master roles?|derived roles?|composite roles?)\b/i],
  ["Excel", /\bExcel|spreadsheet|export(?:ing|ed)?\b/i],
  ["JML", /\bJML|joiner|mover|leaver|lifecycle\b/i],
  ["SuccessFactors", /\bSuccessFactors|Employee Central\b/i]
]);

const ACKNOWLEDGEMENT = /^(?:(?:okay|ok|yes|yeah|right|correct|understood|got it|makes sense|thank you|thanks)(?:\s+|[,.!])*)+$/i;
const CORRECTION = /\b(?:no[, ]+i mean|no[,.]?\s+i(?:'?m| am) not asking|not asking generally|rather|instead|not that|what i mean|i meant)\b/i;
const CHALLENGE = /\b(?:not answering|answering round and round|too generic|you missed|still miss(?:es|ing)?|still not|that'?s not what i asked)\b/i;
const DEEPEN = /\b(?:go deeper|more technical|more detail|be specific|how exactly|drill down)\b/i;
const EXAMPLE = /\b(?:specific|concrete|real)\s+example\b|\bgive me (?:an?|one) example\b/i;
const EXPERIENCE_NARRATIVE = /\bwalk me through your\b(?!\s+(?:investigat|diagnos|troubleshoot|approach|process|plan|handling|method))|\bwalk me through (?:exactly )?what you\b|\bwhat (?:exactly )?did you\b|\bwhat was your role\b|\bwhat was the outcome\b|\btell me exactly how you\b|\bhow you (?:implemented|configured|delivered|owned)\b/i;
const TECHNICAL_STEPS = /\b(?:technical steps|configuration steps|step by step|steps are involved|exact sequence)\b/i;
const VALIDATION = /\b(?:validate|validation|how do you know|prove|verify|which authorization object|which value)\b|(?:evidence|identify|isolate).{0,40}\b(?:object|field|value)\b/i;
// The lexical cues cover "fix/correct/resolve"; the resultative construction covers the same
// request built from a plain verb plus a result word ("put it right", "get it working again",
// "make this work"). Asking for the fix and being answered with more investigation is the
// costlier error, so this closed grammatical pattern -- verb + object + result state -- is
// treated as remediation rather than left to the investigative stage boundary.
const REMEDIATION = /\b(?:remediat|fix|correct|resolve|reduce false positives)\w*\b/i;
const REMEDIATION_RESULTATIVE = /\b(?:put|get|make|set|bring)\s+(?:it|this|that|them|those|the\s+\w+)\s+(?:back\s+)?(?:right|working|work|straight|sorted|correct|clean|in\s+line)\b/i;
const ARCHITECTURE = /\b(?:architecture|design|landscape|topology|integrat)\w*\b/i;
const EXPERIENCE = /\b(?:your experience|have you|did you|tell me about a time|project example|was this something you|after your last)\b/i;
// Possession-of-experience constructions: the same ask as "have you...", built with a different
// auxiliary ("do you have experience", "have you had exposure to") or elliptically ("any
// hands-on experience with IAG?"). Without these, "Do you have hands-on experience with this?"
// was not recognized as an experience question at all and fell through to the scenario stage.
const EXPERIENCE_POSSESSION = /\b(?:do|does|did)\s+you\s+(?:have|possess)\b[^?]{0,48}\bexperience\b|\bhave\s+you\s+had\b[^?]{0,48}\b(?:experience|exposure)\b|^\s*any\b[^?]{0,32}\bexperience\s+(?:with|in|of|on)\b/i;
const EXPERIENCE_STAR = /\btell me about a time\b|\bproject example\b/i;
const SCENARIO = /\b(?:scenario|suppose|assume|the customer|the user|in production)\b/i;
const CLARIFY = /\b(?:do you mean|are you saying|clarify|in other words)\b/i;
const AUTHORIZATION_FIELD_VALUE_OBJECTIVE = "function → action → authorization object → field → value";
const AUTHORIZATION_FIELD_VALUE_ANSWER_TARGET = "Which authorization field value is causing the SoD conflict? No actual field value is supplied in the current context, so explain how you would trace the exact value and do not invent one.";
const AUTHORIZATION_OBJECT_OBJECTIVE = "function → action → authorization object";
const AUTHORIZATION_OBJECT_ANSWER_TARGET = "Which authorization object is causing the SoD conflict? No actual object is supplied in the current context, so explain how you would identify the exact object. Do not present S_TABU_NAM, S_TCODE, or another object as the actual conflict object.";
const SCENARIO_MODES = Object.freeze({ NONE: "NONE", ACTIVE: "ACTIVE", COMPLETED: "COMPLETED" });
const SCENARIO_TYPES = Object.freeze({
  SOD_INVESTIGATION: "SOD_INVESTIGATION",
  TROUBLESHOOTING: "TROUBLESHOOTING",
  ROLE_DESIGN: "ROLE_DESIGN",
  FIORI_DESIGN: "FIORI_DESIGN",
  DISPLAY_ONLY: "DISPLAY_ONLY",
  SAC_SECURITY: "SAC_SECURITY",
  IAM_LIFECYCLE: "IAM_LIFECYCLE",
  HYBRID_ARCHITECTURE: "HYBRID_ARCHITECTURE",
  MIGRATION: "MIGRATION",
  OTHER: "OTHER"
});
const SCENARIO_STEPS = Object.freeze({
  UNDERSTAND_PROBLEM: "UNDERSTAND_PROBLEM",
  IDENTIFY_SCOPE: "IDENTIFY_SCOPE",
  IDENTIFY_EVIDENCE: "IDENTIFY_EVIDENCE",
  DIAGNOSE: "DIAGNOSE",
  VALIDATE: "VALIDATE",
  IDENTIFY_EXACT_CONTROL: "IDENTIFY_EXACT_CONTROL",
  REMEDIATE: "REMEDIATE",
  RETEST: "RETEST",
  GOVERNANCE: "GOVERNANCE"
});
const EXPERIENCE_MODES = Object.freeze({
  HYPOTHETICAL: "HYPOTHETICAL",
  DOCUMENTED_EXPERIENCE: "DOCUMENTED_EXPERIENCE",
  EXPERIENCE_BACKED_EXAMPLE: "EXPERIENCE_BACKED_EXAMPLE",
  EXPERIENCE_CLAIM_GATED: "EXPERIENCE_CLAIM_GATED"
});

// One generalized field that tells the generation layer HOW MUCH of the subject the current
// utterance actually asked for. It is derived from conversational state (scenario stage) and
// question form (polar experience check vs. content request), never from topic vocabulary, so
// an unseen paraphrase resolves the same way a known one does.
const ANSWER_SCOPES = Object.freeze({
  DEFAULT: "DEFAULT",
  STAGE_INVESTIGATION: "STAGE_INVESTIGATION",
  STAGE_REMEDIATION: "STAGE_REMEDIATION",
  EXPERIENCE_CONFIRMATION: "EXPERIENCE_CONFIRMATION",
  EXPERIENCE_DEEP_DIVE: "EXPERIENCE_DEEP_DIVE",
  IMPLEMENTATION_WALKTHROUGH: "IMPLEMENTATION_WALKTHROUGH"
});

// Investigative stages answer "what is true / what must be established", not "what do we do
// about it". The remediation stages are listed separately so an explicit fix request is never
// swept into the investigative stop.
const INVESTIGATIVE_STAGES = new Set([
  SCENARIO_STEPS.UNDERSTAND_PROBLEM,
  SCENARIO_STEPS.IDENTIFY_SCOPE,
  SCENARIO_STEPS.IDENTIFY_EVIDENCE,
  SCENARIO_STEPS.IDENTIFY_EXACT_CONTROL,
  SCENARIO_STEPS.VALIDATE
]);
const REMEDIATION_STAGES = new Set([SCENARIO_STEPS.REMEDIATE, SCENARIO_STEPS.RETEST]);
// Shape of an ABAP authorization object name (S_TCODE, S_TABU_NAM, P_ORGIN, F_BKPF_BUK), used
// only to detect whether one has actually been named in the conversation.
const AUTHORIZATION_OBJECT_NAME = /\b[A-Z]_[A-Z0-9]{2,}(?:_[A-Z0-9]+)*\b/;
const SCENARIO_CONTINUATION_INTENTS = new Set([
  QUESTION_INTENTS.FOLLOW_UP,
  QUESTION_INTENTS.FRAGMENT,
  QUESTION_INTENTS.CORRECTION,
  QUESTION_INTENTS.CHALLENGE,
  QUESTION_INTENTS.PROBE_DEEPER,
  QUESTION_INTENTS.CLARIFICATION,
  QUESTION_INTENTS.REQUEST_FOR_VALIDATION,
  QUESTION_INTENTS.REQUEST_FOR_REMEDIATION,
  QUESTION_INTENTS.REQUEST_FOR_TECHNICAL_STEPS,
  QUESTION_INTENTS.REQUEST_FOR_ARCHITECTURE,
  QUESTION_INTENTS.REQUEST_FOR_EXAMPLE,
  QUESTION_INTENTS.REQUEST_FOR_EXPERIENCE,
  QUESTION_INTENTS.SCENARIO_DESCRIPTION
]);

function text(value, max = 1200) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function isAuthorizationFieldValueUtterance(raw) {
  return /^(?:what|which)\s+values?\??$/i.test(text(raw));
}

function isAuthorizationObjectUtterance(raw) {
  return /^(?:what|which)\s+object\??$/i.test(text(raw));
}

function isAuthorizationFieldValueChain(topic, anchorQuestion, topicChanged) {
  if (topicChanged) return false;
  if (topic !== "GRC" && topic !== "Authorization") return false;
  return /authorization object|\bSoD\b|conflict|Excel/i.test(text(anchorQuestion));
}

function normalizeHistoryItem(item) {
  const role = item?.role || (item?.type === "response" ? "assistant" : "user");
  const content = text(item?.content || item?.text);
  if (!content || !["user", "assistant"].includes(role)) return null;
  return { ...item, role, content };
}

function normalizedHistory(history) {
  return (Array.isArray(history) ? history : []).map(normalizeHistoryItem).filter(Boolean);
}

function lastByRole(history, role) {
  return [...history].reverse().find((item) => item.role === role);
}

function extractEntities(question, anchor = "") {
  const combined = `${question} ${anchor}`;
  return ENTITY_RULES.filter(([, pattern]) => pattern.test(combined)).map(([name]) => name);
}

function explicitEntities(question) {
  return ENTITY_RULES.filter(([, pattern]) => pattern.test(question)).map(([name]) => name);
}

function explicitProductTopic(question) {
  if (/\b(SAC|SAP Analytics Cloud)\b/i.test(question)) return "SAC";
  if (/\b(Fiori|launchpad|Manage Purchase Order)\b/i.test(question)) return "Fiori";
  if (/\b(BTP|XSUAA|role collections?)\b/i.test(question)) return "BTP";
  if (/\b(IAS|Identity Authentication)\b/i.test(question)) return "IAS";
  if (/\b(IAG|Identity Access Governance)\b/i.test(question)) return "IAG";
  if (/\b(GRC|ARA|ARM|EAM|BRM|SoD|ruleset)\b/i.test(question)) return "GRC";
  if (/\b(IPS|Identity Provisioning)\b/i.test(question)) return "IPS";
  if (/\bS\/?4(?:HANA)?\b/i.test(question)) return "Authorization";
  return "";
}

function deriveTopic(question, prior, activeContext) {
  const explicitProduct = explicitProductTopic(question);
  if (explicitProduct) return explicitProduct;
  const inherited = text(activeContext?.questionTopic || prior?.context?.questionTopic || prior?.questionTopic || "");
  if (inherited) return inherited;
  if (/\b(master|derived|composite|authorization object|PFCG)\b/i.test(question)) return "Authorization";
  return explicitEntities(prior?.content || "").find((x) => !["Excel"].includes(x)) || "";
}

function isClearlyIncompleteFragment(raw) {
  const q = text(raw, 240);
  if (!q) return true;
  const words = q.replace(/[?!.]+$/, "").split(/\s+/).filter(Boolean);
  if (/^(?:what|which)\s+(?:object|role|rule|field|app)\??$/i.test(q)) return true;
  if (words.length > 5) return false;
  if (/^(?:(?:this|that|these|those)\s+\w+[.! ]*)+$/i.test(q)) return true;
  return /^(?:how|what|why|where|when|who)\s+(?:do|does|did|would|could|can|is|are|was|were)\s+(?:you|we|they|it|this|that)?$/i.test(q.replace(/[?!.]+$/, "").trim());
}

function removeSubmittedSnapshot(current, submitted) {
  const live = String(current || "");
  const snapshot = String(submitted || "");
  return live.indexOf(snapshot) === 0 ? live.slice(snapshot.length).trimStart() : live;
}

function isExplicitTopicChange(question, priorTopic) {
  const explicit = explicitProductTopic(question);
  if (!explicit || !priorTopic || priorTopic === "General") return false;
  return explicit !== priorTopic;
}

function isSemanticallyDependent(question, hasAnchor) {
  if (!hasAnchor) return false;
  const q = text(question, 400);
  if (/^(?:and then|then what|what next|so then|afterwards)\b/i.test(q)) return true;
  if (/\b(?:how do you (?:validate|fix|know|rerun)|is it genuine|why is that|how does that|what happens then|what about)\b/i.test(q)) return true;
  if (/\b(?:it|that|this|those|these|them|then|afterwards|after that)\b/i.test(q)) return true;
  if (/\bthe (?:\w+\s+){0,2}(?:conflict|value|object|role|rule|result|risk|catalog|design|report|export|analysis|field)\b/i.test(q)) return true;
  return false;
}

function isConceptualDefinition(raw) {
  const q = text(raw, 240);
  return /^(?:what is|what's|whats|what\s+(?:exactly|actually|precisely)\s+is|define)\s+(?:an?\s+)?(?:sod|iag|ias|ips|grc|fiori|sac|composite role|derived role|master role)\b/i.test(q)
    && !/\b(?:would you do|in a role|conflict|user|business)\b/i.test(q);
}

function isExplicitScenarioLanguage(raw) {
  return /\b(?:suppose|assume|let'?s say|imagine|in this situation|what would you do|how would you handle|walk me through|take one specific example|give me a scenario|you have a situation|what happens if)\b/i.test(text(raw));
}

// Same closed grammatical classes as lib/reasoningPlanner.js isSymptomReport:
// negation auxiliaries / contrast / anomalous-result phrasing, not a product phrase list.
// Negation is the core grammatical marker of a reported failure, and an interviewer types or
// speaks it both contracted ("won't start") and uncontracted ("will not start"). Only the
// contracted forms were listed, so an uncontracted symptom report was not recognized as one.
// This is the same closed grammatical class, written out in both forms — not a new vocabulary.
const FAILURE_SYMPTOM_PATTERN = /\b(isn't|aren't|doesn't|don't|didn't|can't|cannot|couldn't|wasn't|weren't|won't|wouldn't|shouldn't|hasn't|haven't|hadn't|no longer|unable to)\b|\b(?:is|are|was|were|will|would|does|do|did|has|have|had|can|could|should)\s+not\b|\b(but|however|yet|although|though)\b|\b(ending up|ended up|turns out|turned out|keeps?\s+\w+ing|stopped\s+\w+ing|started\s+\w+ing|begins?\s+\w+ing|begun\s+\w+ing|fails? to|not working|doesn't work|with errors?|never\s+(?:starts?|reaches|appears|opens|launches))\b/i;
const FUTURE_PLAN_REQUEST_OPENER = /^\s*(how|what)\s+(would|should|could|will)\s+(you\s+)?(recommend|design|architect|build|implement|configure|set\s?up|coordinate|lead)\b|^\s*(would|should|could)\s+you\s+(recommend|design|architect|build|implement|configure|set\s?up|coordinate|lead)\b|^\s*(design|architect|build|implement|configure|coordinate)\b/i;

// "How do you configure this?" is a request for the procedure that brings something into
// existence or into a working state -- a different question from "what is it" (concept),
// "how would you design it" (architecture), "why won't it start" (diagnosis) or "how do you
// fix it" (remediation), each of which already has its own intent ahead of this one.
// The signal is grammatical rather than topical: a HOW-request (or an imperative to be walked
// through it) combined with a realization verb. The verb class is the same closed set already
// used by FUTURE_PLAN_REQUEST_OPENER, minus the analysis verbs (design/architect/recommend),
// so this does not become a phrase list of implementation questions.
// Stems plus a shared inflection group rather than one entry per surface form -- the first
// version of this missed "built", "wired up" and "deprovisioning" purely on morphology.
const REALIZATION_VERB = new RegExp([
  "\\b(?:(?:de)?provision|implement|configur|creat|add|buil|enabl|activat|expos|onboard|deploy",
  "|integrat|connect|register|assign|generat|migrat|establish|restrict|revok|grant|wir)",
  "(?:e|es|ed|d|ds|t|s|ing|ding|ion|ions|ment|ation)?\\b",
  "|\\b(?:set|sett|stand|stood|standing|wire|wires|wired|wiring|hook|hooked|hooking",
  "|switch|switched|switching|roll|rolled|rolling|spin|spun|spinning)\\s+(?:up|on|out)\\b",
  "|\\bsetup\\b",
  "|\\b(?:put|putt|pull|piece|pieced)(?:s|ed|ing)?\\s+[\\w\\s]{0,24}\\btogether\\b"
].join(""), "i");
const PROCEDURE_REQUEST = /\bhow\s+(?:do|did|would|will|can|should|are|is)\b|\b(?:walk|take|talk)\s+me\s+through\b|\bwhat\s+(?:are|were|would be)\s+the\s+(?:\w+\s+){0,2}steps\b|\bwhat\s+steps\b|\bstep by step\b|\bwhat(?:'s| is) the (?:exact )?(?:sequence|procedure|process)\b/i;
// Past-tense second person is asking what the candidate personally did, not how the work is
// done -- that belongs to the experience path, which owns its own fabrication controls.
// Only unambiguous past forms: a past auxiliary, or a second-person verb that can only be past
// tense. "Set" and "built" are not usable bare, because "how do you set up X" is present tense.
const PERSONAL_PAST_DELIVERY = /\b(?:did|have|had)\s+you\b|\byou\s+\w+ed\b|\byou\s+(?:actually|really|personally)\s+\w+ed\b/i;

// "How would you architect identity for a RISE migration?" is a design question that happens to
// contain a realization noun. When the interviewer asks for the design, answering with a
// configuration sequence is the costlier error, so a design verb takes the question back.
// "Model" is deliberately absent: in these products it is nearly always a noun ("data model",
// "role model"), so including it would exclude genuine SAC/Datasphere/BW procedure questions.
const DESIGN_VERB = /\b(?:re-?)?(?:design|architect)(?:s|ed|ing|ure)?\b/i;
// Diagnostic procedure verbs are a different HOW-class from realization. "Walk me through
// investigating an IPS job that stopped creating users" contains a realization verb only in
// the symptom clause; the interviewer asked for diagnosis, not a create/configure sequence.
const DIAGNOSTIC_PROCEDURE = /\b(?:troubleshoot|diagnos|investigat|debug)(?:e|es|ed|is|ing)?\b|\bestablish why\b/i;
// Same delivery-governance class as lib/reasoningPlanner.js DELIVERY_GOVERNANCE_PATTERN,
// plus RAID as a project-control artefact. Used to keep project-objective questions from
// inheriting an investigative scenario stop just because "how would you handle" opened a scenario.
const PROJECT_CONTROL_NOUN = /\b(?:raid|schedule|scope|stakeholders?|committees?|vendors?|milestones?|governance|deadlines?|budgets?|timelines?|pmo|projects?|risks?)\b/i;
const PROJECT_CONTROL_VERB = /\b(?:manage|handle|recover|reduce|escalat|govern|coordinate|lead|mitigat)\b/i;

function isDiagnosticHowRequest(raw) {
  const q = text(raw);
  if (!q) return false;
  if (DESIGN_VERB.test(q) || PERSONAL_PAST_DELIVERY.test(q)) return false;
  if (isConceptualDefinition(q)) return false;
  return PROCEDURE_REQUEST.test(q) && DIAGNOSTIC_PROCEDURE.test(q);
}

function isProjectControlAsk(raw) {
  const q = text(raw);
  if (!q || isDiagnosticHowRequest(q) || isFailureSymptomUtterance(q)) return false;
  if (DESIGN_VERB.test(q) || isImplementationRequest(q) || isConceptualDefinition(q)) return false;
  if (PROJECT_CONTROL_NOUN.test(q) && PROJECT_CONTROL_VERB.test(q)) return true;
  const timeQuantity = /\b(?:\d+\s+)?(?:weeks?|days?|months?|hours?)\b/i.test(q);
  const deliveryPhase = /\b(?:hypercare|cutover|go-?live|stabilization)\b/i.test(q);
  const schedulePressure = /\b(?:behind|delay(?:ed|s|ing)?|slip(?:ping|ped)?|shorten|compress|late|recover)\b/i.test(q);
  if (deliveryPhase && schedulePressure) return true;
  if (PROJECT_CONTROL_NOUN.test(q) && schedulePressure) return true;
  return Boolean(timeQuantity && deliveryPhase && schedulePressure);
}

function isImplementationRequest(raw) {
  const q = text(raw);
  if (!q) return false;
  if (isConceptualDefinition(q)) return false;
  if (PERSONAL_PAST_DELIVERY.test(q)) return false;
  if (DESIGN_VERB.test(q)) return false;
  if (DIAGNOSTIC_PROCEDURE.test(q)) return false;
  return PROCEDURE_REQUEST.test(q) && REALIZATION_VERB.test(q);
}

function isFailureSymptomUtterance(raw) {
  const q = text(raw);
  if (!q || isConceptualDefinition(q)) return false;
  if (FUTURE_PLAN_REQUEST_OPENER.test(q)) return false;
  return FAILURE_SYMPTOM_PATTERN.test(q);
}

function isImplicitSituation(raw) {
  const q = text(raw);
  if (!q || isConceptualDefinition(q)) return false;
  if (isFailureSymptomUtterance(q)) return true;
  if (/\b(?:you find|there is|there'?s)\b.{0,48}\b(?:sod|conflict)\b/i.test(q)) return true;
  if (/\b(?:business user|users?)\b.{0,80}\bdisplay[- ]only\b/i.test(q)) return true;
  if (/\b(?:cannot|can'?t|unable to)\s+access\b.{0,48}\bfiori\b/i.test(q)) return true;
  if (/\bbusiness wants\b.{0,48}\b(?:sac|display[- ]only|fiori)\b/i.test(q)) return true;
  if (/\bconflict\b.{0,48}\bexport(?:ing|ed)?\b.{0,24}\broles?\b/i.test(q)) return true;
  if (/\bafter exporting the (?:sod )?results?\b/i.test(q)) return true;
  if (/\bidentify (?:sod )?conflicts?\b/i.test(q)) return true;
  if (/\bmanage purchase order\b/i.test(q) && /\b(?:deviat|non-standard|non-default|sustainable|not default)\b/i.test(q)) return true;
  if (/\bdesign you use for sac\b|\bhow would you design sac\b|\bdesign security for sac\b|\bdesign sac security\b/i.test(q)) return true;
  if (/\brole architecture\b/i.test(q)) return true;
  if (/\bdisplay[- ]only\b.{0,40}\b(?:fiori|app|access)\b/i.test(q)) return true;
  return false;
}

function isExplicitScenarioClose(raw) {
  return /\blet'?s move (?:on|to)\b|\banother topic\b|\bnow (?:let'?s|we) (?:talk|move|switch)\b|\bswitch(?:ing)? to\b/i.test(text(raw));
}

function isTruncatedScenarioSetup(raw, { activeMode, intent } = {}) {
  const q = text(raw);
  if (!q) return true;
  if (isClearlyIncompleteFragment(q)) return false;
  if (/\?\s*$/.test(q) && !/\b(?:which|that)\s*\?$/i.test(q)) return false;
  if (/\b(?:it could be|we are in|now there are certain things which|let'?s say around defining)(?:[.…]|\.{2,})?$/i.test(q)) {
    return true;
  }
  if (activeMode === SCENARIO_MODES.ACTIVE && SCENARIO_CONTINUATION_INTENTS.has(intent)) return false;
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length < 5) return false;
  if (words.length < 8 && !/\b(?:which|that)(?:[.…]|\.{2,})?$/i.test(q)) return false;
  if (/\b(?:which|that|and|or|the|a|an|to|for|of|in|be)(?:[.…]|\.{2,})?$/i.test(q) && words.length >= 12) return true;
  return false;
}

function deriveExperienceMode(intent, raw) {
  if (intent === QUESTION_INTENTS.REQUEST_FOR_EXAMPLE) return EXPERIENCE_MODES.EXPERIENCE_BACKED_EXAMPLE;
  if (intent === QUESTION_INTENTS.REQUEST_FOR_EXPERIENCE) return EXPERIENCE_MODES.EXPERIENCE_CLAIM_GATED;
  if (/\bhow did you\b|\bin an (?:actual )?engagement\b|\bin your project\b/i.test(raw)) return EXPERIENCE_MODES.DOCUMENTED_EXPERIENCE;
  return EXPERIENCE_MODES.HYPOTHETICAL;
}

function classifyScenarioType(raw, topic) {
  const q = text(raw);
  if (/display[- ]only/i.test(q)) return SCENARIO_TYPES.DISPLAY_ONLY;
  if (isFailureSymptomUtterance(raw)) return SCENARIO_TYPES.TROUBLESHOOTING;
  if (topic === "SAC" || /\bsac\b|sap analytics cloud/i.test(q)) return SCENARIO_TYPES.SAC_SECURITY;
  if (/\bmanage purchase order\b|\bfiori catalog\b/i.test(q) || (topic === "Fiori" && /\bsustainable|deviat|non-standard|non-default\b/i.test(q))) {
    return SCENARIO_TYPES.FIORI_DESIGN;
  }
  if (/\brole architecture\b|\bmaster\b.{0,24}\bderived\b.{0,24}\bcomposite\b/i.test(q) && !/\bsod\b|\bconflict\b/i.test(q)) {
    return SCENARIO_TYPES.ROLE_DESIGN;
  }
  if (topic === "Authorization" && /\brole architecture|master|derived|composite\b/i.test(q)) return SCENARIO_TYPES.ROLE_DESIGN;
  if (topic === "Fiori") return SCENARIO_TYPES.FIORI_DESIGN;
  if (topic === "GRC" || topic === "IAG" || /\bsod\b|\bconflict\b|\bexcel\b/i.test(q)) return SCENARIO_TYPES.SOD_INVESTIGATION;
  if (topic === "IAS" || topic === "IPS" || /\bjml\b/i.test(q)) return SCENARIO_TYPES.IAM_LIFECYCLE;
  return SCENARIO_TYPES.OTHER;
}

function isExactControlAsk(raw) {
  const q = text(raw);
  return isAuthorizationFieldValueUtterance(q)
    || isAuthorizationObjectUtterance(q)
    || /\b(?:what|which)\s+(?:\w+\s+){0,2}(?:authorization\s+)?(?:object|control)\b/i.test(q)
    || /\b(?:authorization object|field value)\b/i.test(q);
}

function isLaterScenarioStepUtterance(raw, intent) {
  const q = text(raw);
  if (isExactControlAsk(q)) return true;
  if (/\bafter fix(?:ing)?\b|\brerun\b|\bre-run\b|\bvalidate after\b|\bgenuine\b|\bhow do you fix\b|\bwhich role\b|\bidentify the (?:role|rule|conflict)\b|\bhow do you identify\b|\bcheck technically\b|\bwhere (?:is )?it(?:'?s)? failing\b|\btechnically\b.{0,24}\bhow do you find\b|\bmanually\b|\bcatalog changes\b/i.test(q)) return true;
  if ([QUESTION_INTENTS.REQUEST_FOR_REMEDIATION, QUESTION_INTENTS.CORRECTION, QUESTION_INTENTS.CHALLENGE].includes(intent)) return true;
  return false;
}

function classifyScenarioStep(raw, intent, { isEntry, priorStep } = {}) {
  if (isEntry && !isLaterScenarioStepUtterance(raw, intent)) return SCENARIO_STEPS.UNDERSTAND_PROBLEM;
  const q = text(raw);
  if (isExactControlAsk(q)) {
    return SCENARIO_STEPS.IDENTIFY_EXACT_CONTROL;
  }
  if (/\bafter fix(?:ing)?\b|\brerun\b|\bre-run\b|\bvalidate after\b/i.test(q)) return SCENARIO_STEPS.RETEST;
  if (priorStep === SCENARIO_STEPS.REMEDIATE && intent === QUESTION_INTENTS.REQUEST_FOR_VALIDATION) {
    return SCENARIO_STEPS.RETEST;
  }
  if (/\bwhere (?:is )?it(?:'?s)? failing\b|\bhow do you know where\b/i.test(q)) return SCENARIO_STEPS.DIAGNOSE;
  if (intent === QUESTION_INTENTS.REQUEST_FOR_REMEDIATION || /\bhow do you fix\b|\bhow would you fix\b/i.test(q)) {
    return SCENARIO_STEPS.REMEDIATE;
  }
  if (/\bgenuine\b|\breal conflict\b/i.test(q) || (intent === QUESTION_INTENTS.REQUEST_FOR_VALIDATION && !/\bafter\b/i.test(q))) {
    return SCENARIO_STEPS.VALIDATE;
  }
  if (intent === QUESTION_INTENTS.CORRECTION || intent === QUESTION_INTENTS.CHALLENGE || /\btechnically\b.{0,24}\bhow do you find\b/i.test(q)) {
    return SCENARIO_STEPS.IDENTIFY_EVIDENCE;
  }
  if (/\bwhere (?:is )?it(?:'?s)? failing\b|\bhow do you know where\b/i.test(q)) return SCENARIO_STEPS.DIAGNOSE;
  if (/\bcheck technically\b|\bwhat do you check\b/i.test(q)) return SCENARIO_STEPS.IDENTIFY_EVIDENCE;
  if (/\bwhich role\b|\bidentify the role\b|\bidentify the rule\b|\bidentify the conflict\b|\bhow do you identify\b|\bwhich rule\b/i.test(q)) {
    return SCENARIO_STEPS.IDENTIFY_SCOPE;
  }
  if (/\btechnically\b.{0,40}\b(?:object|value|find)\b/i.test(q)) return SCENARIO_STEPS.IDENTIFY_EVIDENCE;
  if (/\bmanually\b|\bcatalog changes\b|\bsustainable\b|\boverride\b/i.test(q)) return SCENARIO_STEPS.GOVERNANCE;
  if (intent === QUESTION_INTENTS.FRAGMENT && /how do you/i.test(q)) return SCENARIO_STEPS.IDENTIFY_SCOPE;
  if (intent === QUESTION_INTENTS.REQUEST_FOR_EXAMPLE) return SCENARIO_STEPS.IDENTIFY_SCOPE;
  if (intent === QUESTION_INTENTS.REQUEST_FOR_ARCHITECTURE) return SCENARIO_STEPS.IDENTIFY_SCOPE;
  return SCENARIO_STEPS.UNDERSTAND_PROBLEM;
}

function scenarioCompatible(type, topic, raw) {
  if (isExplicitScenarioClose(raw)) return false;
  const q = text(raw);
  if (type === SCENARIO_TYPES.SOD_INVESTIGATION) {
    if (topic === "SAC" || topic === "BTP") return false;
    if (topic === "Fiori" && /manage purchase order|display[- ]only|cannot access/i.test(q) && !/\bsod\b|\bconflict\b|\biag\b|\bexcel\b/i.test(q)) {
      return false;
    }
    return true;
  }
  if (type === SCENARIO_TYPES.FIORI_DESIGN || type === SCENARIO_TYPES.DISPLAY_ONLY || type === SCENARIO_TYPES.TROUBLESHOOTING) {
    if (topic === "SAC" || topic === "BTP") return false;
    if (topic === "GRC" && /\bsod\b|\bconflict\b/i.test(q)) return false;
    return topic === "Fiori" || topic === "Authorization" || !explicitProductTopic(q);
  }
  if (type === SCENARIO_TYPES.SAC_SECURITY) {
    if (topic === "GRC" && /\bsod\b|\bconflict\b/i.test(q)) return false;
    return topic === "SAC" || topic === "BTP" || !explicitProductTopic(q);
  }
  if (type === SCENARIO_TYPES.ROLE_DESIGN) {
    if (topic === "SAC" || topic === "Fiori") return false;
    return true;
  }
  return !explicitProductTopic(q) || explicitProductTopic(q) === topic;
}

function emptyEvidence() {
  return { confirmed: [], inferred: [], missing: [] };
}

function boundList(values, maxItems, maxChars) {
  return (Array.isArray(values) ? values : []).map((item) => text(item, maxChars)).filter(Boolean).slice(0, maxItems);
}

function emptyScenarioState() {
  return {
    scenarioMode: SCENARIO_MODES.NONE,
    scenarioType: "",
    scenarioId: "",
    problem: "",
    systems: [],
    constraints: [],
    step: "",
    completedSteps: [],
    unresolvedSteps: [],
    evidence: emptyEvidence(),
    experienceMode: EXPERIENCE_MODES.HYPOTHETICAL,
    scenarioConfidence: 0,
    correctionFlag: false,
    incompleteUtterance: false
  };
}

function readPriorScenario(activeContext) {
  if (!activeContext || !activeContext.scenarioMode) return emptyScenarioState();
  return {
    scenarioMode: text(activeContext.scenarioMode, 16) || SCENARIO_MODES.NONE,
    scenarioType: text(activeContext.scenarioType, 32),
    scenarioId: text(activeContext.scenarioId, 80),
    problem: text(activeContext.problem, 200),
    systems: boundList(activeContext.systems, 4, 40),
    constraints: boundList(activeContext.constraints, 3, 200),
    step: text(activeContext.step, 32),
    completedSteps: boundList(activeContext.completedSteps, 8, 32),
    unresolvedSteps: boundList(activeContext.unresolvedSteps, 6, 32),
    evidence: {
      confirmed: boundList(activeContext.evidence?.confirmed, 4, 80),
      inferred: boundList(activeContext.evidence?.inferred, 4, 80),
      missing: boundList(activeContext.evidence?.missing, 4, 80)
    },
    experienceMode: text(activeContext.experienceMode, 40) || EXPERIENCE_MODES.HYPOTHETICAL,
    scenarioConfidence: Number(activeContext.scenarioConfidence) || 0,
    correctionFlag: Boolean(activeContext.correctionFlag),
    incompleteUtterance: false
  };
}

function makeScenarioId(raw, priorId) {
  return `s_${crypto.createHash("sha1").update(`${priorId || ""}|${text(raw, 180)}`).digest("hex").slice(0, 12)}`;
}

function buildEvidence(prior, raw, step, type) {
  const evidence = {
    confirmed: boundList(prior.evidence?.confirmed, 4, 80),
    inferred: boundList(prior.evidence?.inferred, 4, 80),
    missing: boundList(prior.evidence?.missing, 4, 80)
  };
  if (/\bsod conflict\b|\bconflict in a (?:business )?role\b/i.test(raw) && !evidence.confirmed.includes("SoD conflict in a role")) {
    evidence.confirmed = boundList([...evidence.confirmed, "SoD conflict in a role"], 4, 80);
  }
  if (step === SCENARIO_STEPS.IDENTIFY_EXACT_CONTROL && isAuthorizationFieldValueUtterance(raw)) {
    if (!evidence.missing.includes("authorization field value")) {
      evidence.missing = boundList([...evidence.missing, "authorization field value"], 4, 80);
    }
  }
  if (step === SCENARIO_STEPS.IDENTIFY_EXACT_CONTROL && isAuthorizationObjectUtterance(raw)) {
    if (!evidence.missing.includes("authorization object")) {
      evidence.missing = boundList([...evidence.missing, "authorization object"], 4, 80);
    }
  }
  if (type === SCENARIO_TYPES.SOD_INVESTIGATION && step === SCENARIO_STEPS.IDENTIFY_EXACT_CONTROL) {
    evidence.inferred = boundList(evidence.inferred.filter((item) => !/ACTVT\s*0[123]|S_TABU_NAM|S_TCODE/i.test(item)), 4, 80);
  }
  return evidence;
}

function resolveScenarioState({
  raw, intent, topic, entities, activeContext, truncated, conceptual
}) {
  const prior = readPriorScenario(activeContext);
  const experienceMode = deriveExperienceMode(intent, raw);
  if (truncated) {
    return {
      ...emptyScenarioState(),
      experienceMode,
      incompleteUtterance: true,
      scenarioConfidence: 0.2
    };
  }
  if (conceptual) {
    return {
      ...emptyScenarioState(),
      experienceMode,
      scenarioMode: prior.scenarioMode === SCENARIO_MODES.ACTIVE ? SCENARIO_MODES.COMPLETED : SCENARIO_MODES.NONE,
      scenarioType: prior.scenarioMode === SCENARIO_MODES.ACTIVE ? prior.scenarioType : "",
      scenarioId: prior.scenarioId,
      problem: prior.problem,
      scenarioConfidence: prior.scenarioMode === SCENARIO_MODES.ACTIVE ? prior.scenarioConfidence : 0
    };
  }
  // "Walk me through configuring a new tile" reads as scenario language but describes no
  // situation -- it is a procedure request. Only block scenario entry when nothing was actually
  // reported as failing, so "the app won't start, how do you set the catalog up?" still enters.
  const procedureRequestOnly = isImplementationRequest(raw) && !isFailureSymptomUtterance(raw);
  const enter = (isExplicitScenarioLanguage(raw) || isImplicitSituation(raw))
    && !conceptual && !procedureRequestOnly;
  const close = prior.scenarioMode === SCENARIO_MODES.ACTIVE
    && (isExplicitScenarioClose(raw) || !scenarioCompatible(prior.scenarioType, topic, raw));
  const continueActive = prior.scenarioMode === SCENARIO_MODES.ACTIVE
    && !close
    && (SCENARIO_CONTINUATION_INTENTS.has(intent) || enter || isSemanticallyDependent(raw, true));
  let mode = prior.scenarioMode || SCENARIO_MODES.NONE;
  let type = prior.scenarioType;
  let scenarioId = prior.scenarioId;
  let problem = prior.problem;
  let systems = prior.systems;
  let step = prior.step;
  let completedSteps = prior.completedSteps;
  let openedNew = false;
  if (close) {
    mode = SCENARIO_MODES.COMPLETED;
    if (prior.step) completedSteps = boundList([...completedSteps, prior.step], 8, 32);
  }
  if (enter && (mode !== SCENARIO_MODES.ACTIVE || close)) {
    openedNew = true;
    type = classifyScenarioType(raw, topic);
    scenarioId = makeScenarioId(raw, scenarioId);
    problem = text(raw, 200);
    systems = boundList(entities.filter((item) => item !== "Excel").slice(0, 4), 4, 40);
    step = classifyScenarioStep(raw, intent, { isEntry: true });
    completedSteps = close ? completedSteps : [];
    mode = SCENARIO_MODES.ACTIVE;
  } else if (continueActive) {
    mode = SCENARIO_MODES.ACTIVE;
    const nextStep = classifyScenarioStep(raw, intent, { isEntry: false, priorStep: prior.step });
    if (prior.step && nextStep !== prior.step) completedSteps = boundList([...completedSteps, prior.step], 8, 32);
    step = nextStep;
  } else if (mode === SCENARIO_MODES.COMPLETED && !enter) {
    step = prior.step;
  } else if (!enter && mode !== SCENARIO_MODES.ACTIVE) {
    return { ...emptyScenarioState(), experienceMode };
  }
  const unresolved = step && mode === SCENARIO_MODES.ACTIVE ? [step] : [];
  const constraints = [];
  if (type === SCENARIO_TYPES.SOD_INVESTIGATION && isAuthorizationFieldValueUtterance(raw)) {
    constraints.push("Do not invent an authorization field value or ACTVT 01/02/03. Do not introduce S_TABU_NAM or S_TCODE as examples unless the interviewer named them.");
  }
  if (type === SCENARIO_TYPES.SOD_INVESTIGATION && isAuthorizationObjectUtterance(raw)) {
    constraints.push("Do not present S_TABU_NAM, S_TCODE, or another object as the actual conflict object.");
  }
  // In an SoD investigation the conflicting object and field value are facts about THIS case,
  // so they can only come from the interviewer or the ruleset -- unlike a troubleshooting
  // scenario, where naming likely objects is ordinary diagnostic knowledge. The trigger is the
  // evidence state (has any object actually been named in this conversation, matched on the
  // S_* object-name shape), not the wording of the question, so every paraphrase of "which
  // object/artifact/mechanism is it" is covered without listing those nouns.
  if (
    type === SCENARIO_TYPES.SOD_INVESTIGATION
    && mode === SCENARIO_MODES.ACTIVE
    && INVESTIGATIVE_STAGES.has(step)
    && !constraints.length
    && !AUTHORIZATION_OBJECT_NAME.test(`${raw} ${problem} ${(prior.evidence?.confirmed || []).join(" ")}`)
  ) {
    constraints.push("No authorization object or field value has been established here; explain how you would identify it rather than naming one as the conflict.");
  }
  return {
    scenarioMode: mode,
    scenarioType: type,
    scenarioId,
    problem,
    systems,
    // Constraints are instructions the model has to read, not labels: an 80-character bound
    // cut every one of them mid-sentence ("...explain how yo"), so the guard never actually
    // reached the prompt intact. Bound the count tightly instead of the sentence.
    constraints: boundList(constraints, 3, 200),
    step: mode === SCENARIO_MODES.NONE ? "" : step,
    completedSteps,
    unresolvedSteps: boundList(unresolved, 6, 32),
    evidence: buildEvidence(openedNew ? emptyScenarioState() : prior, raw, step, type),
    experienceMode,
    scenarioConfidence: mode === SCENARIO_MODES.ACTIVE ? 0.9 : (mode === SCENARIO_MODES.COMPLETED ? 0.7 : 0),
    correctionFlag: [QUESTION_INTENTS.CORRECTION, QUESTION_INTENTS.CHALLENGE].includes(intent),
    incompleteUtterance: false
  };
}

// "What evidence would you collect before deciding on a fix?" asks for evidence; the fix lives
// in a subordinate clause that only says WHEN the evidence is needed. Cutting the utterance at
// the subordinator before testing the remediation cue keeps that distinction grammatical
// instead of requiring a phrase list for every way of saying "not yet".
const SUBORDINATE_CLAUSE_OPENER = /\b(?:before|prior to|ahead of|instead of|rather than|without|until|so that|in order to)\b/i;

function mainClause(question = "") {
  const q = String(question || "");
  const match = q.match(SUBORDINATE_CLAUSE_OPENER);
  if (!match || match.index === 0) return q;
  return q.slice(0, match.index);
}

function detectIntent(question, hasAnchor) {
  if (ACKNOWLEDGEMENT.test(question)) return QUESTION_INTENTS.NON_QUESTION;
  if (CHALLENGE.test(question)) return QUESTION_INTENTS.CHALLENGE;
  if (CORRECTION.test(question)) return QUESTION_INTENTS.CORRECTION;
  if (EXAMPLE.test(question)) return QUESTION_INTENTS.REQUEST_FOR_EXAMPLE;
  if (TECHNICAL_STEPS.test(question)) return QUESTION_INTENTS.REQUEST_FOR_TECHNICAL_STEPS;
  if (VALIDATION.test(question)) return QUESTION_INTENTS.REQUEST_FOR_VALIDATION;
  if (REMEDIATION.test(mainClause(question)) || REMEDIATION_RESULTATIVE.test(mainClause(question))) {
    return QUESTION_INTENTS.REQUEST_FOR_REMEDIATION;
  }
  if (EXPERIENCE.test(question) || EXPERIENCE_POSSESSION.test(question)) return QUESTION_INTENTS.REQUEST_FOR_EXPERIENCE;
  if (PERSONAL_PAST_DELIVERY.test(question) && (PROCEDURE_REQUEST.test(question) || EXPERIENCE_NARRATIVE.test(question))) {
    return QUESTION_INTENTS.REQUEST_FOR_EXPERIENCE;
  }
  // Checked after remediation/validation/experience so those keep their own paths, and before
  // architecture so "how do you configure X" is not answered as a design discussion.
  if (isImplementationRequest(question)) return QUESTION_INTENTS.REQUEST_FOR_TECHNICAL_STEPS;
  if (ARCHITECTURE.test(question)) return QUESTION_INTENTS.REQUEST_FOR_ARCHITECTURE;
  if (DEEPEN.test(question)) return QUESTION_INTENTS.PROBE_DEEPER;
  if (CLARIFY.test(question)) return QUESTION_INTENTS.CLARIFICATION;
  if (isClearlyIncompleteFragment(question)) return QUESTION_INTENTS.FRAGMENT;
  if (SCENARIO.test(question)) return QUESTION_INTENTS.SCENARIO_DESCRIPTION;
  const explainDirect = /^(?:now\s+)?(?:explain|describe|compare|walk me through|tell me)\b/i.test(question);
  if (explainDirect && !(hasAnchor && isSemanticallyDependent(question, hasAnchor))) {
    return QUESTION_INTENTS.DIRECT_QUESTION;
  }
  if (question.includes("?")) {
    if (hasAnchor && (question.split(/\s+/).length <= 7 || isSemanticallyDependent(question, hasAnchor))) {
      return QUESTION_INTENTS.FOLLOW_UP;
    }
    return QUESTION_INTENTS.DIRECT_QUESTION;
  }
  if (!hasAnchor && question.split(/\s+/).filter(Boolean).length >= 3) return QUESTION_INTENTS.DIRECT_QUESTION;
  return hasAnchor ? QUESTION_INTENTS.FOLLOW_UP : QUESTION_INTENTS.UNKNOWN;
}

// An experience ask is a CONFIRMATION unless the interviewer asked for the content of the
// engagement. The distinction is the question form, not the words: "have you / did you / was
// this something you owned / where have you done this" asks whether (and where) the experience
// exists and is answered by a direct claim plus the documented employer; "what exactly did you
// implement / walk me through your implementation / what was your role and outcome / tell me
// more" asks for the engagement itself and legitimately needs documented detail.
function isExperienceContentRequest(raw, intent) {
  const q = text(raw);
  if (intent === QUESTION_INTENTS.REQUEST_FOR_EXAMPLE || intent === QUESTION_INTENTS.PROBE_DEEPER) return true;
  if (EXPERIENCE_STAR.test(q) || EXAMPLE.test(q) || DEEPEN.test(q)) return true;
  if (EXPERIENCE_NARRATIVE.test(q)) return true;
  if (/\btell me more\b/i.test(q)) return true;
  // A walk-through of what the candidate personally owned is the engagement itself, even when
  // the realization verb is absent ("programme you actually owned").
  if (PERSONAL_PAST_DELIVERY.test(q) && PROCEDURE_REQUEST.test(q)) return true;
  return false;
}

function isExperienceAsk(raw, intent, experienceMode) {
  if (intent === QUESTION_INTENTS.REQUEST_FOR_EXPERIENCE) return true;
  if (experienceMode === EXPERIENCE_MODES.DOCUMENTED_EXPERIENCE) return true;
  const q = text(raw);
  if (EXPERIENCE.test(q) || EXPERIENCE_POSSESSION.test(q)) return true;
  // "Walk/take me through what you implemented" never contains have-you/did-you, but it is
  // still a request for the candidate's own past delivery, not a new investigative scenario.
  if (PERSONAL_PAST_DELIVERY.test(q) && PROCEDURE_REQUEST.test(q) && REALIZATION_VERB.test(q)) return true;
  return false;
}

// "Tell me more" / "go deeper" carries no subject of its own -- what it means depends entirely
// on what was just asked. After an experience question it is a request for the engagement in
// more detail; after an investigative question it is still investigation.
function isBareDeepenRequest(raw, intent) {
  if (intent === QUESTION_INTENTS.PROBE_DEEPER) return true;
  return DEEPEN.test(text(raw)) || /\btell me more\b/i.test(text(raw));
}

function deriveAnswerScope({ raw, intent, experienceMode, scenarioMode, step, priorQuestion }) {
  if (isBareDeepenRequest(raw, intent) && priorQuestion && isExperienceAsk(priorQuestion, null, null)) {
    return ANSWER_SCOPES.EXPERIENCE_DEEP_DIVE;
  }
  // "Walk me through your implementation" / "What was your role and what was the outcome?"
  // never contain a have-you/did-you cue, but they are unambiguous requests for the candidate's
  // own engagement — the request for the narrative IS the experience ask.
  const q = text(raw);
  if (EXPERIENCE_NARRATIVE.test(q) || EXPERIENCE_STAR.test(q) || EXAMPLE.test(q)
    || intent === QUESTION_INTENTS.REQUEST_FOR_EXAMPLE) {
    return ANSWER_SCOPES.EXPERIENCE_DEEP_DIVE;
  }
  if (isExperienceAsk(raw, intent, experienceMode)) {
    return isExperienceContentRequest(raw, intent)
      ? ANSWER_SCOPES.EXPERIENCE_DEEP_DIVE
      : ANSWER_SCOPES.EXPERIENCE_CONFIRMATION;
  }
  // A request for a design or architecture is not an investigative stage, even when a scenario
  // is open at an early step: the interviewer asked for the whole decision, so stage-stopping
  // it would withhold the trade-off and governance the question actually wants.
  if (intent === QUESTION_INTENTS.REQUEST_FOR_ARCHITECTURE) return ANSWER_SCOPES.DEFAULT;
  // HOW + diagnostic verb is investigation even without a reported symptom. It is checked
  // before the technical-steps walkthrough so a HOW-procedure that is itself diagnostic
  // cannot be treated as a realization sequence.
  if (isDiagnosticHowRequest(raw)) return ANSWER_SCOPES.STAGE_INVESTIGATION;
  // A project-control ask can open Scenario Mode via "how would you handle", but the
  // interviewer still wants a governance decision, not an investigative stop.
  if (isProjectControlAsk(raw)) return ANSWER_SCOPES.DEFAULT;
  // The interviewer asked how the work is actually performed, so neither an investigative
  // stop nor the ordinary summary budget answers it.
  if (intent === QUESTION_INTENTS.REQUEST_FOR_TECHNICAL_STEPS || isImplementationRequest(raw)) {
    return ANSWER_SCOPES.IMPLEMENTATION_WALKTHROUGH;
  }
  if (scenarioMode === SCENARIO_MODES.ACTIVE) {
    if (REMEDIATION_STAGES.has(step)) return ANSWER_SCOPES.STAGE_REMEDIATION;
    if (INVESTIGATIVE_STAGES.has(step)) return ANSWER_SCOPES.STAGE_INVESTIGATION;
  }
  return ANSWER_SCOPES.DEFAULT;
}

function deriveDepth(intent, question) {
  if (intent === QUESTION_INTENTS.REQUEST_FOR_EXAMPLE || EXAMPLE.test(question)) return "project";
  if (intent === QUESTION_INTENTS.REQUEST_FOR_EXPERIENCE) return "normal";
  if ([QUESTION_INTENTS.PROBE_DEEPER, QUESTION_INTENTS.REQUEST_FOR_TECHNICAL_STEPS, QUESTION_INTENTS.REQUEST_FOR_VALIDATION].includes(intent)) return "deep";
  if ([QUESTION_INTENTS.NON_QUESTION, QUESTION_INTENTS.CONFIRMATION, QUESTION_INTENTS.FRAGMENT].includes(intent)) return "brief";
  return "normal";
}

function deriveObjective(intent, question) {
  if (/\bdetailed (?:SoD )?report\b/i.test(question)) return "detailed SoD report";
  if (/\bexport\w*.{0,24}\bExcel\b|\bExcel export\b/i.test(question)) return "Excel export analysis";
  if (/rerun|re-run|run (?:it|the analysis) again/i.test(question)) return "rerun analysis and validate regression";
  if (/false positives?|miss(?:ed|ing).{0,12}risks?/i.test(question)) return "rules → functions → actions → permissions; separate remediation and regression validation";
  if (/authorization object.{0,24}(?:field|value)|exact authorization field|exact authorization value/i.test(question)) return "function → action → authorization object → field → value";
  if (/\brole.{0,20}authorization object\b/i.test(question)) return "role → authorization object";
  if (/\bidentify.{0,20}\brule\b|\bwhich rule\b/i.test(question)) return "rule identification";
  if (/\bgenuine\b|\breal conflict\b/i.test(question)) return "genuine conflict determination";
  if (TECHNICAL_STEPS.test(question)) return "technical steps";
  if (intent === QUESTION_INTENTS.REQUEST_FOR_VALIDATION) return "technical validation steps";
  if (/display[- ]only/i.test(question)) return "sustainable display-only access across content, service, and backend object/value layers";
  if (EXAMPLE.test(question)) return "one candidate-supported specific example";
  if (CHALLENGE.test(question)) return "answer the unresolved question directly without repeating rejected material";
  if (intent === QUESTION_INTENTS.REQUEST_FOR_REMEDIATION) return "remediation path";
  return intent.toLowerCase().replaceAll("_", " ");
}

function deriveFeedback(question) {
  if (CHALLENGE.test(question)) return text(question);
  if (CORRECTION.test(question)) return text(question.replace(/^no[, ]*/i, ""));
  return "";
}

function resolvedQuestion(raw, intent, anchor) {
  if (!anchor) return raw;
  if (intent === QUESTION_INTENTS.CORRECTION) return `${anchor} Correction: ${raw}`;
  if (intent === QUESTION_INTENTS.CHALLENGE) return `${anchor} Feedback: ${raw}`;
  if ([QUESTION_INTENTS.FOLLOW_UP, QUESTION_INTENTS.FRAGMENT, QUESTION_INTENTS.PROBE_DEEPER,
    QUESTION_INTENTS.REQUEST_FOR_EXAMPLE, QUESTION_INTENTS.REQUEST_FOR_TECHNICAL_STEPS,
    QUESTION_INTENTS.REQUEST_FOR_VALIDATION, QUESTION_INTENTS.REQUEST_FOR_REMEDIATION,
    QUESTION_INTENTS.REQUEST_FOR_ARCHITECTURE, QUESTION_INTENTS.REQUEST_FOR_EXPERIENCE].includes(intent)) {
    return `${anchor} Follow-up: ${raw}`;
  }
  return raw;
}

function productBoundaries(topic, entities) {
  const required = new Set();
  const forbidden = new Set();
  if (topic === "SAC") { required.add("SAC"); forbidden.add("GRC"); forbidden.add("BTP role collections as SAC content authorization"); }
  if (topic === "Fiori") { required.add("Fiori"); required.add("S/4 backend authorization"); }
  if (topic === "BTP") { required.add("BTP role collections"); forbidden.add("ABAP authorization tools unless a backend is in scope"); }
  if (topic === "IAS") { required.add("authentication"); forbidden.add("provisioning ownership"); forbidden.add("application authorization ownership"); }
  if (topic === "IPS") { required.add("provisioning and synchronization"); forbidden.add("authentication ownership"); forbidden.add("access-governance decisions"); }
  if (topic === "IAG") { required.add("access governance"); forbidden.add("authentication ownership"); forbidden.add("target authorization enforcement"); }
  if (topic === "GRC") { required.add("GRC rules, functions, actions, and permissions as relevant"); forbidden.add("cloud identity products unless the scenario requires them"); }
  if (topic === "Authorization") { required.add("target application authorization enforcement"); }
  if (entities.includes("JML")) {
    required.add("lifecycle source");
    required.add("IPS");
    required.add("IAG");
    required.add("target application");
  }
  return { required: [...required], forbidden: [...forbidden] };
}

function makeQuestionId(raw, priorId) {
  return `q_${crypto.createHash("sha1").update(`${priorId || ""}|${raw}`).digest("hex").slice(0, 12)}`;
}

function retrievalPolicy(intent, confidence, resolved) {
  if ([QUESTION_INTENTS.NON_QUESTION, QUESTION_INTENTS.CONFIRMATION].includes(intent)) return { decision: "skip", query: "" };
  if (intent === QUESTION_INTENTS.FRAGMENT) return confidence >= 0.65
    ? { decision: "active-context", query: resolved } : { decision: "clarify", query: "" };
  return { decision: "retrieve", query: resolved };
}

function resolveInterviewContext({ questionRaw, history = [], source = "unknown", questionId } = {}) {
  const raw = text(questionRaw);
  const prior = normalizedHistory(history);
  const previousQuestionEvent = lastByRole(prior, "user");
  const previousAnswerEvent = lastByRole(prior, "assistant");
  const activeContext = [...prior].reverse().find((item) => item?.context)?.context;
  const previousQuestion = text(previousQuestionEvent?.content, 900);
  const inheritedTopic = text(activeContext?.questionTopic || previousQuestionEvent?.context?.questionTopic || "");
  let intent = detectIntent(raw, Boolean(previousQuestion));
  const topic = deriveTopic(raw, previousQuestionEvent, activeContext);
  const topicChanged = isExplicitTopicChange(raw, inheritedTopic);
  if (topicChanged && intent === QUESTION_INTENTS.FOLLOW_UP && explicitProductTopic(raw) && !isClearlyIncompleteFragment(raw)) {
    intent = QUESTION_INTENTS.DIRECT_QUESTION;
  } else if (!topicChanged && previousQuestion && intent === QUESTION_INTENTS.DIRECT_QUESTION && isSemanticallyDependent(raw, true)) {
    intent = QUESTION_INTENTS.FOLLOW_UP;
  }
  const entities = extractEntities(raw, topicChanged ? "" : previousQuestion);
  if (entities.includes("JML") && !entities.includes("IPS")) entities.push("IPS");
  const confidence = topic || explicitEntities(raw).length ? 0.9 : (previousQuestion ? 0.7 : 0.45);
  const anchorQuestion = topicChanged ? "" : text(activeContext?.questionResolved || previousQuestion, 1200);
  const resolved = resolvedQuestion(raw, intent, anchorQuestion);
  const boundaries = productBoundaries(topic, entities);
  const previousRejections = Number(activeContext?.rejectionCount || previousQuestionEvent?.context?.rejectionCount || 0);
  const rejectionCount = previousRejections + (intent === QUESTION_INTENTS.CHALLENGE ? 1 : 0);
  let objective = deriveObjective(intent, raw);
  if (isAuthorizationFieldValueUtterance(raw) && isAuthorizationFieldValueChain(topic, anchorQuestion, topicChanged)) {
    objective = AUTHORIZATION_FIELD_VALUE_OBJECTIVE;
  } else if (isAuthorizationObjectUtterance(raw) && isAuthorizationFieldValueChain(topic, anchorQuestion, topicChanged)) {
    objective = AUTHORIZATION_OBJECT_OBJECTIVE;
  }
  const answerTarget = (!topicChanged
    && isAuthorizationFieldValueUtterance(raw)
    && objective === AUTHORIZATION_FIELD_VALUE_OBJECTIVE)
    ? AUTHORIZATION_FIELD_VALUE_ANSWER_TARGET
    : (!topicChanged
      && isAuthorizationObjectUtterance(raw)
      && objective === AUTHORIZATION_OBJECT_OBJECTIVE)
      ? AUTHORIZATION_OBJECT_ANSWER_TARGET
      : raw;
  const retrieval = retrievalPolicy(
    intent,
    confidence,
    `${resolved} Topic: ${topic}. Facet: ${objective}.${answerTarget !== raw ? ` Current target: ${answerTarget}` : ""}`
  );
  const conceptual = isConceptualDefinition(raw);
  const truncated = isTruncatedScenarioSetup(raw, {
    activeMode: text(activeContext?.scenarioMode, 16),
    intent
  });
  const scenario = resolveScenarioState({
    raw, intent, topic, entities, activeContext, truncated, conceptual
  });
  if (truncated) {
    retrieval.decision = "clarify";
    retrieval.query = "";
  }
  const constraints = entities.includes("JML") && !entities.includes("SuccessFactors")
    ? ["Do not assume SuccessFactors or another lifecycle source unless supplied."] : [];
  let requestedDepth = deriveDepth(intent, `${raw} ${objective}`);
  // Isolated fragments stay brief. An inherited-scenario fragment is a technical probe
  // (object/field/value/how-do-you), not an acknowledgement — brief/120 tokens cut those mid-sentence.
  if (
    requestedDepth === "brief"
    && intent === QUESTION_INTENTS.FRAGMENT
    && scenario.scenarioMode === SCENARIO_MODES.ACTIVE
    && !scenario.incompleteUtterance
  ) {
    requestedDepth = "normal";
  }
  if (requestedDepth === "normal" && activeContext?.depth === "deep" && intent !== QUESTION_INTENTS.DIRECT_QUESTION && !topicChanged) {
    requestedDepth = "deep";
  }
  const answerScope = deriveAnswerScope({
    raw,
    intent,
    experienceMode: scenario.experienceMode,
    scenarioMode: scenario.scenarioMode,
    step: scenario.step,
    priorQuestion: previousQuestion
  });
  // An experience deep-dive is the one experience form that legitimately needs a full
  // documented narrative; a confirmation is not, and must not inherit a project-length budget.
  if (answerScope === ANSWER_SCOPES.EXPERIENCE_CONFIRMATION && requestedDepth === "project") {
    requestedDepth = "normal";
  }
  return {
    answerScope,
    schemaVersion: 2,
    currentQuestion: raw,
    questionId: text(questionId || makeQuestionId(raw, previousQuestionEvent?.questionId), 80),
    questionRaw: raw,
    answerTarget,
    questionResolved: resolved,
    previousQuestion,
    previousAnswer: text(previousAnswerEvent?.content, 1200),
    questionIntent: intent,
    questionTopic: topic || "General",
    questionSubtopic: entities.filter((x) => x !== topic).slice(0, 4).join(", "),
    interviewerObjective: objective,
    facet: objective,
    depth: requestedDepth,
    correctionDetected: [QUESTION_INTENTS.CORRECTION, QUESTION_INTENTS.CHALLENGE].includes(intent),
    interviewerFeedback: deriveFeedback(raw),
    confidence,
    entities,
    answeredFacets: intent === QUESTION_INTENTS.CHALLENGE
      ? (activeContext?.answeredFacets || [])
      : [...new Set([...(activeContext?.answeredFacets || []), ...(activeContext?.unresolvedFacets || [])])].slice(-8),
    unresolvedFacets: intent === QUESTION_INTENTS.CHALLENGE && activeContext?.unresolvedFacets?.length
      ? activeContext.unresolvedFacets.slice(-6)
      : [objective],
    unresolvedFacet: objective,
    rejectionCount,
    retrievalDecision: retrieval.decision,
    retrievalQuery: retrieval.query,
    requiredProductBoundaries: boundaries.required,
    forbiddenProductBoundaries: boundaries.forbidden,
    experienceRequirement: [QUESTION_INTENTS.REQUEST_FOR_EXAMPLE, QUESTION_INTENTS.REQUEST_FOR_EXPERIENCE].includes(intent)
      ? "candidate-supported-only" : "confidence-gated",
    source: text(source, 40),
    ...scenario,
    constraints: boundList([...(constraints || []), ...(scenario.constraints || [])], 4, 200)
  };
}

function toHistoryContext(context) {
  if (!context || typeof context !== "object") return undefined;
  return {
    questionIntent: text(context.questionIntent, 48),
    questionTopic: text(context.questionTopic, 80),
    questionSubtopic: text(context.questionSubtopic, 120),
    questionResolved: text(context.questionResolved, 1200),
    interviewerObjective: text(context.interviewerObjective, 160),
    depth: text(context.depth, 16),
    correctionDetected: Boolean(context.correctionDetected),
    rejectionCount: Number(context.rejectionCount) || 0,
    answeredFacets: Array.isArray(context.answeredFacets) ? context.answeredFacets.map((x) => text(x, 120)).slice(0, 6) : [],
    unresolvedFacets: Array.isArray(context.unresolvedFacets) ? context.unresolvedFacets.map((x) => text(x, 120)).slice(0, 6) : [],
    scenarioMode: text(context.scenarioMode, 16),
    scenarioType: text(context.scenarioType, 32),
    scenarioId: text(context.scenarioId, 80),
    problem: text(context.problem, 200),
    systems: boundList(context.systems, 4, 40),
    constraints: boundList(context.constraints, 3, 200),
    step: text(context.step, 32),
    completedSteps: boundList(context.completedSteps, 8, 32),
    unresolvedSteps: boundList(context.unresolvedSteps, 6, 32),
    evidence: {
      confirmed: boundList(context.evidence?.confirmed, 4, 80),
      inferred: boundList(context.evidence?.inferred, 4, 80),
      missing: boundList(context.evidence?.missing, 4, 80)
    },
    experienceMode: text(context.experienceMode, 40),
    scenarioConfidence: Number(context.scenarioConfidence) || 0,
    correctionFlag: Boolean(context.correctionFlag),
    incompleteUtterance: Boolean(context.incompleteUtterance)
  };
}

function buildBoundedHistory(events = [], { maxUsers = 8, maxAssistants = 5, maxChars = 7000 } = {}) {
  const selected = [];
  let users = 0;
  let assistants = 0;
  let chars = 0;
  for (const item of [...events].reverse()) {
    const normalized = normalizeHistoryItem(item);
    if (!normalized || item?.status === "pending") continue;
    if (normalized.role === "user" && users >= maxUsers) continue;
    if (normalized.role === "assistant" && assistants >= maxAssistants) continue;
    const remaining = maxChars - chars;
    if (remaining < 80) break;
    const content = text(normalized.content, Math.min(1200, remaining));
    const safe = {
      role: normalized.role, content, source: text(item.source, 40),
      timestamp: text(item.timestamp, 40), questionId: text(item.questionId, 80),
      answerId: text(item.answerId, 80), context: toHistoryContext(item.context)
    };
    let serializedLength = JSON.stringify(safe).length;
    if (serializedLength > remaining) {
      safe.content = text(content, Math.max(0, content.length - (serializedLength - remaining) - 20));
      serializedLength = JSON.stringify(safe).length;
    }
    if (!safe.content || serializedLength > remaining) continue;
    selected.push(safe);
    chars += serializedLength;
    if (safe.role === "user") users += 1; else assistants += 1;
  }
  return selected.reverse();
}

function sanitizeDebugContext(context = {}, runtime = {}) {
  const evidence = Array.isArray(context.retrievalEvidence) ? context.retrievalEvidence : [];
  return {
    answerTarget: text(context.answerTarget || context.questionRaw),
    questionRaw: text(context.questionRaw),
    questionResolved: text(context.questionResolved),
    intent: text(context.questionIntent, 48),
    topic: text(context.questionTopic, 80),
    subtopic: text(context.questionSubtopic, 120),
    depth: text(context.depth, 16),
    correctionDetected: Boolean(context.correctionDetected),
    feedback: text(context.interviewerFeedback, 240),
    scenarioMode: text(context.scenarioMode, 16),
    scenarioType: text(context.scenarioType, 32),
    step: text(context.step, 32),
    experienceMode: text(context.experienceMode, 40),
    answerScope: text(context.answerScope, 32),
    incompleteUtterance: Boolean(context.incompleteUtterance),
    evidence: {
      confirmed: boundList(context.evidence?.confirmed, 4, 80),
      missing: boundList(context.evidence?.missing, 4, 80)
    },
    retrieval: {
      decision: text(context.retrievalDecision, 40),
      evidence: evidence.map((item) => ({ id: text(item.id, 100), label: text(item.label, 160) })).slice(0, 6)
    },
    experience: { confidence: text(runtime.experienceConfidence, 16), label: text(runtime.experienceLabel, 120) },
    requestedAnswerLength: text(runtime.requestedAnswerLength, 24),
    latencyMs: Number(runtime.latencyMs) || 0,
    classification: text(runtime.classification, 80),
    domain: text(runtime.domain, 120),
    reasoning: text(runtime.reasoning?.mode || runtime.reasoning, 80),
    components: Array.isArray(runtime.components) ? runtime.components.map((x) => text(x, 80)).slice(0, 12) : []
  };
}

module.exports = {
  QUESTION_INTENTS,
  SCENARIO_MODES,
  SCENARIO_TYPES,
  SCENARIO_STEPS,
  EXPERIENCE_MODES,
  ANSWER_SCOPES,
  buildBoundedHistory,
  isClearlyIncompleteFragment,
  isTruncatedScenarioSetup,
  removeSubmittedSnapshot,
  resolveInterviewContext,
  sanitizeDebugContext,
  toHistoryContext,
  isDiagnosticHowRequest
};
