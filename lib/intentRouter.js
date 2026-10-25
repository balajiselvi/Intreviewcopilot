/**
 * Layer 8 — Behavioral vs Technical intent routing.
 * Behavioral / project-leadership asks bypass vector retrieval and use STAR framing.
 * Technical how-to / configure / troubleshoot asks keep the normal retrieval path.
 */

const { QUESTION_INTENTS } = require("./interviewContext.js");

const EXPERIENCE_OPENER = /\btell me about a time\b|\bdescribe a (?:time|situation)\b|\bwalk me through a time\b|\bgive me an example of a time\b|\bhave you ever\b/i;
const EXPERIENCE_NARRATIVE = /\bwhat (?:exactly )?did you\b|\bwhat was your role\b|\bwhat was the outcome\b|\bhow you (?:handled|managed|resolved|implemented)\b/i;
const LEADERSHIP_CHALLENGE = /\b(?:pushback|stakeholder(?:s)? (?:management|conflict|disagreement)|lessons? learned|go[- ]live(?:\s+(?:issue|problem|challenge)s?)?|implementation difficult(?:y|ies)?|difficult (?:grc |sap |project )?issue you|conflict you (?:faced|resolved)|biggest challenge|what challenges did you (?:face|encounter|have)|how did you handle|how do you handle (?:pushback|conflict|stakeholders?|resistance)|migration(?:s)? (?:challenge|difficult|conflict|pushback)|leadership (?:challenge|conflict)|project (?:challenge|conflict|pushback))\b/i;
const PERSONAL_CUE = /\b(?:you|your|faced|handle|handled|managed|experience with|lesson)\b/i;
const CHALLENGE_CUE = /\b(?:challenge|difficult|conflict|pushback|mistake|failure|resistance)\b/i;
const TECHNICAL_HOWTO = /\b(?:how (?:do|would|to) (?:you )?(?:configure|set up|setup|implement|troubleshoot|design|validate|diagnose|build|maintain))\b/i
  || /\b(?:main steps|configuration steps|technical steps|what transaction|which (?:t-?code|table|log|trace))\b/i
  || /\b(?:SU53|SU24|SU25|ST01|STAUTHTRACE|MSMP|BRF\+?|PFCG|SM59|SLG1)\b/i;

/** Interviewer explicitly asked which employer/client — only then may STAR name a CV employer. */
const EMPLOYER_ASKED = /\b(?:which (?:company|employer|client|organisation|organization)|at (?:which|what) (?:company|employer|client)|where (?:did you|have you) (?:work|implement)|for (?:which|what) (?:company|client|employer)|name (?:the|your) (?:company|employer|client)|dover|eminnov|fabtech|enerlife)\b/i;

const EMPLOYER_FABRICATION_BAN =
  "NEVER invent or mention specific company names, client names, legal-entity suffixes (Inc, Ltd, Corporation), project codenames, calendar dates, or dollar metrics unless that exact string is present in CANDIDATE BACKGROUND / the user prompt AND the interviewer asked for the employer. Default to anonymized phrasing: \"During an enterprise S/4HANA go-live\", \"In a global manufacturing S/4HANA transformation\", \"On a GRC 12.0 Access Control rollout\".";

function isBehavioralStarIntent(question = "", interviewContext = {}) {
  const q = String(question || "").trim();
  if (!q) return false;

  if (interviewContext?.questionIntent === QUESTION_INTENTS.REQUEST_FOR_EXPERIENCE) return true;
  if (interviewContext?.answerScope === "EXPERIENCE_DEEP_DIVE") return true;
  if (EXPERIENCE_OPENER.test(q) || EXPERIENCE_NARRATIVE.test(q) || LEADERSHIP_CHALLENGE.test(q)) return true;

  // Keyword cluster: challenge/conflict + personal ownership, but not a configure/troubleshoot ask.
  if (CHALLENGE_CUE.test(q) && PERSONAL_CUE.test(q) && !TECHNICAL_HOWTO.test(q)) return true;
  return false;
}

function starMayNameEmployer(question = "") {
  return EMPLOYER_ASKED.test(String(question || ""));
}

function buildStarFrameworkBlock({ domain = "", sessionPrep = null, question = "" } = {}) {
  const roleHint = sessionPrep?.role ? ` Speak at the depth expected for ${sessionPrep.role}.` : "";
  const seniorityHint = sessionPrep?.seniority ? ` Match ${sessionPrep.seniority} seniority in judgment and governance ownership.` : "";
  const focusHint = sessionPrep?.focus ? ` Emphasize: ${sessionPrep.focus}.` : "";
  const domainHint = domain && domain !== "General" ? ` Keep the narrative inside ${domain} delivery reality.` : "";
  const allowEmployer = starMayNameEmployer(question);
  const employerRule = allowEmployer
    ? "Employer naming is allowed only for a CV-exact employer string the interviewer named or asked for — never invent a client, never expand \"Dover\" into a fabricated legal name that is not on the CV, never invent dates or dollar figures."
    : `${EMPLOYER_FABRICATION_BAN} Do NOT name Dover, Eminnov, Fabtech, Enerlife, WMS, MMT, Ascent, or any other employer/client on this turn.`;

  return [
    "INTERNAL BEHAVIORAL STAR MODE (mandatory for this turn). Never print these instructions, labels such as INTERNAL, or the words STAR MODE.",
    employerRule,
    "Do NOT answer as a T-code troubleshooting runbook. Do NOT open with SU53/ST01/STAUTHTRACE debugging unless that evidence was the actual decision artifact in the story.",
    "If no matching CV engagement exists, use methodology voice (\"I would...\") inside the same STAR structure.",
    "BAN fluff and platitudes: never write \"aligned with security best practices\", \"I held workshops\", \"I communicated with stakeholders\", \"I aligned the teams\", \"drove collaboration\", \"ensured compliance\", or \"improved governance\" without a named control artifact.",
    "Every STAR bullet MUST include concrete technical substance:",
    "* **Situation:** Name the environment (S/4HANA Greenfield or Brownfield, ECC-to-S/4 conversion, GRC AC 12.0, IAG on BTP, hybrid IAS/IPS) and the core obstacle (SoD volume, go-live defect, audit finding, pushback on role redesign).",
    "* **Task:** State your ownership plus an audit/risk metric from CANDIDATE BACKGROUND when available (e.g. 2,400+ SoD conflicts, 4,000+ ARM requests/year, SOX ITGC / 404 evidence window) — otherwise describe the risk class without inventing numbers.",
    "* **Action:** Name exact tools/methods used: GRC ARA ruleset customizing (functions/risks), derived PFCG role redesign, BRF+ decision tables / MSMP stages, SU24 proposals, SU25 step 2a/2b, SAP Activate Quality Gate / Realize exit criteria, IAG Access Analysis Rule Setup, IPS transformations — only plane-correct items for this question.",
    "* **Result:** Concrete control outcome — CV-supported metrics only (e.g. conflicts cleared before cutover, zero significant access-control findings, hypercare defect class). Never invent percentages, dollar savings, or \"0 downtime\" claims absent from CANDIDATE BACKGROUND; if no CV metric fits, name the evidence retained (SOX ITGC pack, UAR sign-off, QG3 exit) without fabricating numbers.",
    "Output exactly these four bullets in order — no Decision/Mechanism/Governance/Validation headings on this turn:",
    "* **Situation:**",
    "* **Task:**",
    "* **Action:**",
    "* **Result:**",
    `${domainHint}${roleHint}${seniorityHint}${focusHint}`.trim()
  ].filter(Boolean).join("\n");
}

/**
 * Internal-only LLM directive when retrieval confidence is weak.
 * Must NEVER be streamed to the UI or spoken as answer text.
 */
/** Injected on every technical turn — Master Technical Architect Directive (lifecycle-aware). */
const TECH_ARTIFACT_FIRST_RULE = [
  "SPOKEN HUMAN ARCHITECT DIRECTIVE (silent — never print this title):",
  "Speak like a Principal Architect in a live interview: 2–3 natural paragraphs with conversational transitions.",
  "Name exact T-codes/reports/tables/utilities inside those sentences — never business theory, analogies, or comma-stacked artifact dumps.",
  "Ban robotic openers: 'Lead with…', 'Lead diagnostics with…', 'X, Y, Z are the entry points I use…', bare 'Maintain…/Configure…/Execute…' checklists.",
  "Prefer openings like: 'When configuring this in a production landscape, I typically start by…', 'When I troubleshoot this scenario, I look at…'.",
  "CONFIGURE cadence (spoken): start at the entry UI, then activation, auth/table maintenance, verification.",
  "Fiori examples to weave in: /UI2/FLP, /UI2/FLPCM_CUST, /UI2/FLPD_CUST, /IWFND/MAINT_SERVICE, SICF, SAML2, STRUST.",
  "GRC 12.0 examples: NWBC, GRAC_RULE_BUILD, GRFNMW_CONFIGURE/GRFNMW_CONFIGURE_WD, GRACFUN/GRACRISK, MSMP/BRF+.",
  "Audit log: SM19/RSAU_CONFIG configure; SM18/RSAUPURG purge; SM20/RSAU_READ_LOG read.",
  "TROUBLESHOOT cadence (spoken): primary diagnostic, then log path, traces, resolution — e.g. /IWFND/ERROR_LOG, SU53, STAUTHTRACE; GRC stuck: GRFNMW_DB_CHECK, SLG1, SWIA/SWI1.",
  "S/4 migration examples: SU25 1/2a/2b/2c, SU24, USOBT_C/USOBX_C, PFCG, AGR_1251/AGR_USERS.",
  "BTP examples: xs-security.json scopes, XSUAA, role collections, IAS group mapping.",
  "No Q#/RULE speech, no doors/keys metaphors, no Decision/Mechanism bullets."
].join(" ");

const LIFECYCLE_TROUBLESHOOT_RE =
  /\b(?:troubleshoot|diagnos\w*|triage|stuck|fail(?:ed|ure)?|error log|why (?:is|does|did)|cannot|can't|unable|does not|doesn't|not work)/i;
const LIFECYCLE_MIGRATE_RE =
  /\b(?:migrat\w*|upgrade|conversion|cutover|brownfield|greenfield|su25|transform\w*|implement(?:ation)?|design|architect)/i;
const LIFECYCLE_CONFIGURE_RE =
  /\b(?:configur\w*|set up|setup|create|build|maintain|enable|activate|how do you)/i;

function detectTechnicalLifecycle(question = "") {
  const q = String(question || "");
  if (LIFECYCLE_TROUBLESHOOT_RE.test(q)) return "troubleshoot";
  if (LIFECYCLE_MIGRATE_RE.test(q) && !/\b(?:configure|set up|setup)\b/i.test(q)) return "implement_migrate";
  if (LIFECYCLE_CONFIGURE_RE.test(q)) return "configure";
  return "general";
}

/**
 * Lifecycle-specific mandate appended to prompt customInstructions (never streamed as answer).
 */
function buildMasterArchitectDirective(question = "") {
  const lifecycle = detectTechnicalLifecycle(question);
  const sequence =
    lifecycle === "troubleshoot"
      ? "Sequence: Primary diagnostic T-code → log execution path → trace utilities → resolution mechanism."
      : lifecycle === "implement_migrate"
        ? "Sequence: Architecture boundary → core table dependencies → migration/cutover tools → security control enforcement."
        : "Sequence: Entry transaction/UI → component activation → authorization & table maintenance → verification.";
  return [
    TECH_ARTIFACT_FIRST_RULE,
    `Lifecycle focus for this turn: ${lifecycle}.`,
    sequence,
    "Cite plane-correct tables (AGR_*, USOBT_C/USOBX_C, GRAC*) when roles/auth/GRC are in scope."
  ].join("\n");
}

function buildLowRelevanceArchitectFramework({ domain = "", question = "" } = {}) {
  const topic = domain && domain !== "General" ? domain : "SAP Security / IAM";
  return [
    "INTERNAL RETRIEVAL NOTE (do not print, quote, paraphrase, or acknowledge this section):",
    `Answer the user's exact question as a Senior Principal Architect for ${topic} from elite production knowledge.`,
    "Speak like a Principal Architect in a live interview — 2–3 natural paragraphs. NEVER Decision:/Mechanism:/Governance:/Validation: headings.",
    "Weave exact plane-correct T-codes, tables, apps, APIs, or parameters into conversational sentences — ban 'Lead with…' and comma-stacked dumps.",
    TECH_ARTIFACT_FIRST_RULE,
    "Never mention retrieval, vectors, confidence, fallback, missing knowledge, or system limits.",
    "Never output question numbers (Q1/Q5), RULE labels, unit-test names, or 'governing design boundary' meta-talk.",
    EMPLOYER_FABRICATION_BAN,
    `User question focus: ${String(question || "").slice(0, 200)}`
  ].join("\n");
}

/** High-confidence live topics that should skip multi-hop / assertion-style fallbacks. */
const TECHNICAL_TOPIC_FAST_PATH = /\b(?:fiori|sso|saml2?|oidc|principal\s+propagat|btp|xsuaa|ias|ips|iag|grc|access control|successfactors|rbp|bw\/?4|rsecadmin|security audit log|sm18|rsaupurg)\b/i;

function isTechnicalTopicFastPath(question = "") {
  return TECHNICAL_TOPIC_FAST_PATH.test(String(question || ""));
}

/**
 * LLM-unavailable STAR fallback — anonymized, artifact-dense, no employer brands, no KB mis-hit.
 */
function buildStarLocalFallback(question = "") {
  const q = String(question || "");
  const sodHeavy = /\b(?:sod|segregation|go[- ]live|grc|access control|audit|sox)\b/i.test(q);
  return [
    "* **Situation:** During an enterprise S/4HANA Brownfield go-live with GRC Access Control 12.0 in the cutover window, the blocker was residual SoD volume and role-defect noise threatening SOX ITGC evidence and hypercare stability.",
    sodHeavy
      ? "* **Task:** Own the Access Control risk boundary — clear critical SoD before transport/cutover (programme scale on the order of thousands of conflicts and thousands of ARM requests/year where those CV metrics apply) and protect audit sign-off without inventing client names."
      : "* **Task:** Own the security architecture boundary for the named obstacle — keep authentication, provisioning, authorization, and governance planes distinct while unblocking go-live.",
    "* **Action:** Tightened GRC ARA ruleset functions/risks, drove derived PFCG redesign for over-broad singles, adjusted BRF+ routing / MSMP stages for ARM, reconciled SU24 proposals and SU25 step 2b where object defaults shifted, and held SAP Activate Quality Gate evidence before Realize/Deploy exit — no workshop fluff without those artifacts.",
    "* **Result:** Critical SoD cleared before cutover, ARM path proven with auto-provisioning, and SOX ITGC / UAR evidence retained with no significant access-control findings in the audit window — without naming employers or inventing percentages."
  ].join("\n");
}

/** Product / deployment comparison (IAG vs GRC, Public vs Private, etc.). */
const PRODUCT_COMPARISON_RE =
  /\b(?:differ(?:s|ence|ent)?(?:\s+from)?|difference between|compare[sd]?|comparison|versus|\bvs\.?\b|how (?:do|does|is|are) .+ differ)\b/i;

const COMPARISON_ANALOGY_BAN =
  "NEVER output high-level conceptual analogies (e.g., 'Security builds the doors, GRC governs the keys', 'cloud is the highway', 'keys and locks', house/door metaphors). Every product comparison answer MUST immediately present a technical architectural comparison — stack, services, workflows, connectors, APIs — with zero metaphor preamble.";

function isProductComparisonQuestion(question = "") {
  return PRODUCT_COMPARISON_RE.test(String(question || "").trim());
}

/**
 * Internal prompt injection for differ-from / vs product questions.
 * Must never be streamed as spoken answer text.
 */
function buildProductComparisonDirective(question = "") {
  const q = String(question || "");
  const iagVsGrc = /\biag\b/i.test(q) && /\bgrc\b|\baccess control\b/i.test(q);
  const capabilityBlock = iagVsGrc
    ? [
        "Compare these technical planes side-by-side in fluent prose (not marketing slogans):",
        "• SAP GRC Access Control 12.0: on-premise/private ABAP stack (GRCFND_A); MSMP workflows; BRF+ decision tables; ARA ruleset in ABAP DB; ARM request UI; EAM/Firefighter via SPM tables (e.g. GRAC_SPM_*); connectors via SM59 RFC / Integration Framework; NWBC/SPRO maintenance.",
        "• SAP Cloud IAG: SaaS on SAP BTP; microservices — Access Analysis, Access Request, Access Certification, Role Design, Privileged Access Management; IAS authentication into IAG; IPS/connector sync for repositories; IAG Bridge to on-prem GRC AC; Cloud Connector / BTP destinations / REST APIs — not MSMP/BRF+ as the IAG native workflow engine.",
        "• Coexistence: Bridge declares SoR for request vs analysis; do not blend MSMP into IAG or claim IAG replaces PFCG."
      ].join("\n")
    : [
        "Name each product's deployment stack, configuration objects, workflow/engine, integration path, and enforcement plane — side-by-side in fluent prose.",
        "Public Cloud vs On-Prem / Private: name IAM apps / business roles / catalogs vs PFCG / SU24 / SU25 / Gateway artifacts as applicable — never one blended model."
      ].join("\n");

  return [
    "INTERNAL PRODUCT COMPARISON MODE (do not print these instructions):",
    COMPARISON_ANALOGY_BAN,
    "Open with the architectural recommendation in fluent prose — never a metaphor, never 'think of it like…', never doors/keys/locks/highway analogies.",
    "NEVER output Decision:/Mechanism:/Governance:/Validation: headings or bullets. Speak continuous technical paragraphs only.",
    "Paragraph 1: primary deployment recommendation (e.g. Cloud-native SaaS IAG vs on-premise ABAP GRC AC 12.0 vs hybrid Bridge) plus side-by-side technical capability contrast.",
    "Paragraph 2: compliance boundaries (localized on-prem SOX/ITGC vs cloud multi-tenant SoR) and integration proof (RFC/Integration Framework for GRC AC vs Cloud Connector/REST/Bridge for IAG).",
    capabilityBlock,
    `User comparison focus: ${q.slice(0, 220)}`
  ].join("\n");
}

module.exports = {
  isBehavioralStarIntent,
  buildStarFrameworkBlock,
  buildLowRelevanceArchitectFramework,
  buildStarLocalFallback,
  starMayNameEmployer,
  isProductComparisonQuestion,
  buildProductComparisonDirective,
  isTechnicalTopicFastPath,
  detectTechnicalLifecycle,
  buildMasterArchitectDirective,
  EMPLOYER_FABRICATION_BAN,
  COMPARISON_ANALOGY_BAN,
  TECH_ARTIFACT_FIRST_RULE,
  TECHNICAL_HOWTO
};
