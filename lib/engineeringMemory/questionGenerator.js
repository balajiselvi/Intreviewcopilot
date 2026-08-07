const { loadJudgmentRecords } = require("./store");

// Adaptive Question Generator -- docs/EXPERIENCE_ACQUISITION_ENGINE_DESIGN.md section 6.
// Deliberately templated, not LLM-driven (section 6.2 rationale: low cost of getting it wrong,
// and avoids this project's repeated instruction-competition failure mode by not having a long
// prompt to compete against in the first place).
//
// Domains match lib/interviewAnalyzer.js's existing taxonomy verbatim -- no parallel taxonomy.
// Scenario types are keyword-matched against a record's situation+problem+decision text (same
// idiom as DOMAIN_BOOST_MAP/INTENT_PATTERNS elsewhere in this codebase) rather than requiring a
// new schema field, keeping the schema unchanged. Per section 0.5, this list is a starting
// point -- expected to grow, not meant to be exhaustive on day one.
const SCENARIO_TYPES_BY_DOMAIN = Object.freeze({
  "SAP GRC": [
    { id: "sod_ruleset_design", label: "SoD ruleset design", decisionShaped: true, keywords: ["sod rule", "sod ruleset", "risk rule", "ara rule"] },
    { id: "remediation_workflow", label: "an SoD remediation workflow", decisionShaped: true, keywords: ["remediation", "mitigat"] },
    { id: "emergency_access_governance", label: "Emergency Access / Firefighter governance", decisionShaped: true, keywords: ["firefighter", "emergency access", "eam"] },
    { id: "audit_certification_cycle", label: "an audit or certification cycle", decisionShaped: false, keywords: ["audit", "certif", "recertif"] },
    { id: "production_incident", label: "a production incident involving GRC", decisionShaped: false, keywords: ["incident", "outage", "went wrong", "emergency"] },
    { id: "stakeholder_disagreement", label: "a stakeholder disagreement about GRC scope", decisionShaped: false, keywords: ["disagree", "pushback", "stakeholder", "conflict"] }
  ],
  "SAP Security": [
    { id: "role_architecture", label: "role architecture design from scratch", decisionShaped: true, keywords: ["role design", "role architecture", "pfcg"] },
    { id: "authorization_troubleshooting", label: "a real authorization troubleshooting incident", decisionShaped: false, keywords: ["su53", "troubleshoot", "authorization error"] },
    { id: "least_privilege_redesign", label: "a least-privilege redesign", decisionShaped: true, keywords: ["least privilege", "least-privilege"] },
    { id: "production_incident", label: "a production security incident", decisionShaped: false, keywords: ["incident", "breach", "went wrong"] },
    { id: "stakeholder_disagreement", label: "a stakeholder disagreement about security scope", decisionShaped: false, keywords: ["disagree", "pushback", "stakeholder"] }
  ],
  "SAP Cloud Identity / BTP": [
    { id: "identity_federation", label: "identity federation design", decisionShaped: true, keywords: ["federation", "ias", "saml", "oauth"] },
    { id: "cloud_connector_trust", label: "Cloud Connector / trust configuration", decisionShaped: true, keywords: ["cloud connector", "truststore", "principal propagation"] },
    { id: "production_incident", label: "a BTP production incident", decisionShaped: false, keywords: ["incident", "outage", "went wrong"] },
    { id: "stakeholder_disagreement", label: "a stakeholder disagreement about cloud identity scope", decisionShaped: false, keywords: ["disagree", "pushback", "stakeholder"] }
  ],
  "SAP Fiori Security": [
    { id: "launchpad_security", label: "Fiori launchpad security design", decisionShaped: true, keywords: ["launchpad", "tile", "catalog"] },
    { id: "odata_authorization", label: "OData/Gateway service authorization", decisionShaped: true, keywords: ["odata", "gateway"] },
    { id: "production_incident", label: "a Fiori production incident", decisionShaped: false, keywords: ["incident", "outage", "went wrong"] }
  ],
  "SAP IDM": [
    { id: "provisioning_workflow", label: "an identity provisioning workflow (joiner/mover/leaver)", decisionShaped: true, keywords: ["provisioning", "joiner", "mover", "leaver"] },
    { id: "production_incident", label: "an IDM production incident", decisionShaped: false, keywords: ["incident", "outage", "went wrong"] }
  ],
  "SAP Platform": [
    { id: "migration_strategy", label: "an ECC-to-S/4HANA security migration strategy", decisionShaped: true, keywords: ["migration", "s/4hana", "conversion"] },
    { id: "production_incident", label: "a platform production incident", decisionShaped: false, keywords: ["incident", "outage", "went wrong"] }
  ]
});

function recordMatchesScenario(record, scenarioType) {
  if (record.tags?.domain && !matchesDomain(record, scenarioType)) return false;
  const haystack = [record.situation, record.problem, record.decision].filter(Boolean).join(" ").toLowerCase();
  return scenarioType.keywords.some(kw => haystack.includes(kw));
}

function matchesDomain(record) {
  return true; // domain check happens at the call site (records are pre-filtered by tags.domain)
}

// A cell's coverage status. "covered": a matching record exists, and if the scenario is
// decision-shaped, it has a real alternative_rejected. "partial": a matching record exists but
// a decision-shaped scenario is missing its alternative_rejected -- per section 3, this is
// treated as needing more, not as done. "uncovered": no matching record at all.
function computeCoverageMatrix() {
  const allRecords = loadJudgmentRecords();
  const matrix = {};

  for (const [domain, scenarioTypes] of Object.entries(SCENARIO_TYPES_BY_DOMAIN)) {
    const domainRecords = allRecords.filter(r => r.tags?.domain === domain);
    matrix[domain] = scenarioTypes.map(scenarioType => {
      const matches = domainRecords.filter(r => recordMatchesScenario(r, scenarioType));
      let status = "uncovered";
      if (matches.length > 0) {
        const hasAlternative = matches.some(r => r.alternative_rejected != null);
        status = (!scenarioType.decisionShaped || hasAlternative) ? "covered" : "partial";
      }
      return { ...scenarioType, domain, status, matchingRecordIds: matches.map(r => r.id) };
    });
  }
  return matrix;
}

// Priority = domain frequency (defaults to 1 for every domain if real traffic data isn't
// wired in yet -- section 0.5, don't block on analytics integration that doesn't exist) x cell
// weight (uncovered > partial > covered, matching section 3.2's "closing a missing-alternative
// gap is higher priority than a brand-new empty cell" only in the sense that partial isn't 0 --
// but uncovered still ranks above partial, since a partial cell HAS something, an uncovered
// cell has nothing at all).
const STATUS_WEIGHT = Object.freeze({ uncovered: 3, partial: 2, covered: 0 });

function pickHighestPriorityGap(domainFrequency = {}) {
  const matrix = computeCoverageMatrix();
  let best = null;
  let bestScore = -1;

  for (const [domain, cells] of Object.entries(matrix)) {
    const freq = domainFrequency[domain] ?? 1;
    for (const cell of cells) {
      const score = freq * STATUS_WEIGHT[cell.status];
      if (score > bestScore) {
        bestScore = score;
        best = cell;
      }
    }
  }
  return best; // null only if every cell in every domain is fully covered
}

// Finds the most recently-covered cell in the SAME domain as `gap`, to fill the "I already
// understand your X" clause -- section 6.2. Returns null if nothing else in this domain is
// covered yet (first-ever question for this domain).
function findReferenceCoveredCell(gap) {
  const matrix = computeCoverageMatrix();
  const sameDomainCovered = (matrix[gap.domain] || []).filter(c => c.status === "covered" && c.id !== gap.id);
  return sameDomainCovered[0] || null;
}

// Section 6.2's exact templated pattern. Section 4's escalation ladder step 1 (open scenario
// prompt) -- steps 2/3 (targeted follow-ups after an incomplete answer) belong to the
// acquisition UI/flow that consumes this, not this generator, since they require the
// candidate's actual response text to react to.
function generateElicitationPrompt(gap) {
  if (!gap) return null;
  const reference = findReferenceCoveredCell(gap);
  const askFor = gap.status === "partial"
    ? `Can you tell me about a time you considered a different approach for ${gap.label} and chose not to use it? What made you go the other way?`
    : `I still need one representative example of ${gap.label}. Can you walk me through a real one?`;

  return reference
    ? `I already understand your ${reference.label}. ${askFor}`
    : askFor;
}

module.exports = {
  SCENARIO_TYPES_BY_DOMAIN,
  computeCoverageMatrix,
  pickHighestPriorityGap,
  findReferenceCoveredCell,
  generateElicitationPrompt
};
