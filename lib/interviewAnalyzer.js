const INTENT_PATTERNS = Object.freeze([
  {
    name: "Troubleshooting",
    weight: 10,
    pattern: /\b(troubleshoot|troubleshooting|issue|error|failure|fail|failed|root cause|debug|debugging|su53|st01|st22|sm21|slg1|sm37|dump|fix|resolv)/i
  },
  {
    name: "Architecture",
    weight: 9,
    pattern: /\b(architecture|architectural|design|landscape|framework|integration|component|blueprint|topology|tier|interface)/i
  },
  {
    name: "Workflow",
    weight: 9,
    pattern: /\b(workflow|msmp|brf\+?|approval|request flow|path|stage|agent|provisioning flow|escalation)/i
  },
  {
    name: "Migration",
    weight: 8,
    pattern: /\b(migration|migrate|conversion|brownfield|greenfield|rise with sap|transition|side-by-side)/i
  },
  {
    name: "Upgrade",
    weight: 8,
    pattern: /\b(upgrade|upgrading|su25|spau|spdd|s\/4hana upgrade|patch|support package)/i
  },
  {
    name: "Scenario",
    weight: 8,
    pattern: /\b(scenario|suppose|assume|case study|real-time|real time|customer asks|production issue|what would you do|how would you handle)/i
  },
  {
    name: "Comparison",
    weight: 8,
    pattern: /\b(difference|compare|comparison|versus|\bvs\b|better|advantage|disadvantage|trade-off|pros and cons)/i
  },
  {
    name: "Role Design",
    weight: 8,
    pattern: /\b(role design|derived role|composite role|single role|role taxonomy|naming convention|org level|pfcg)/i
  },
  {
    name: "Authorization",
    weight: 7,
    pattern: /\b(authorization|auth object|field|su24|proposal|least privilege|s_tabu|s_tcode|auth check)/i
  },
  {
    name: "Security",
    weight: 7,
    pattern: /\b(security|zero trust|snc|tls|mtls|encryption|cybersecurity|hardening|audit|sox|gdpr|compliance)/i
  },
  {
    name: "Configuration",
    weight: 7,
    pattern: /\b(configure|configuration|spro|customizing|customization|parameter|flag|setup)/i
  },
  {
    name: "Implementation",
    weight: 7,
    pattern: /\b(implement|implementation|deploy|deployment|cutover|go-live|go live|build)/i
  },
  {
    name: "Performance",
    weight: 7,
    pattern: /\b(performance|st03n|trace|index|bottleneck|latency|slow|optimization|tuning|buffer)/i
  },
  {
    name: "Production Support",
    weight: 7,
    pattern: /\b(production support|eam|firefighter|emergency access|sla|incident|triage|p1|p2)/i
  },
  {
    name: "Definition",
    weight: 5,
    pattern: /\b(what is|define|definition|explain the concept|meaning of)/i
  }
]);

const DOMAIN_PATTERNS = Object.freeze([
  // SAC and PMP were confirmed to have zero domain representation before this -- SAC questions
  // fell through to generic "SAP Security"/"SAP Cloud Identity / BTP" domains (giving SAC
  // content zero deserved component credit even when it had the better semantic match), and
  // PMP questions fell to "General SAP" (no protection against generic shared-vocabulary words
  // like "risk" pulling in SAP GRC content instead). Placed first so they aren't shadowed by
  // the broader generic patterns below (first-match-wins remains the mechanism; these two
  // patterns are narrow and distinctive enough not to need reordering the rest).
  {
    domain: "SAC",
    pattern: /\b(sac|sap analytics cloud)\b/i
  },
  {
    domain: "PMP",
    pattern: /\b(stakeholder management|risk register|scope creep|change control|steering committee|project governance|raid log|project charter|behind schedule|vendor management|resource conflict|project schedule)\b/i
  },
  {
    domain: "SAP GRC",
    pattern: /\b(grc|ara|arm|brm|eam|firefighter|sod|segregation of duties|risk analysis|access control|msmp|brf\+?|mitigation|connector)\b/i
  },
  {
    domain: "SAP Cloud Identity / BTP",
    pattern: /\b(ias|ips|iag|btp|cloud identity|identity authentication|identity provisioning|cloud connector|oauth|saml|oidc|principal propagation)\b/i
  },
  {
    domain: "SAP IDM",
    pattern: /\b(idm|identity management|identity center|repository sync|pass vector)\b/i
  },
  {
    domain: "SAP Fiori Security",
    pattern: /\b(fiori|launchpad|catalog|space|page|tile|target mapping|odata|gw\b|gateway)\b/i
  },
  {
    domain: "SAP Security",
    // "role" widened to "roles?" (ROLE plural investigation) -- plural technical questions like
    // "How do you design SAP security roles?" previously resolved domain="General SAP" and lost
    // all components. Safe as a standalone change: this domain's step-4 fallback in
    // componentSelector.js is already gated on mentionsSap (see ROLE/PROFILE fix, 61bf869), so
    // the corroboration boundary applies to this match automatically, without further changes.
    pattern: /\b(pfcg|su24|su25|su01|su53|st01|stauthtrace|authorization|roles?|profile|user master|usr02|agr_1251)\b/i
  },
  {
    domain: "SAP Platform",
    pattern: /\b(s\/?4hana|ecc|hana|abap|bw|successfactors|netweaver|sybase|maxdb)\b/i
  }
]);

const PROCESS_PATTERNS = Object.freeze([
  { process: "Emergency Access", pattern: /\b(eam|firefighter|emergency access|privileged access|reason code)\b/i },
  { process: "Provisioning", pattern: /\b(provisioning|access request|arm|user onboarding|offboarding)\b/i },
  { process: "Risk Analysis", pattern: /\b(risk analysis|ara|sod|sox|mitigation|rulebook|rule set)\b/i },
  { process: "Role Design", pattern: /\b(role design|brm|derived role|composite role|role matrix)\b/i },
  { process: "Repository Sync", pattern: /\b(repository sync|master data sync|user sync|role sync)\b/i },
  { process: "Audit & Compliance", pattern: /\b(audit|compliance|sox|gdpr|least privilege|inspection)\b/i },
  { process: "Migration & Cutover", pattern: /\b(migration|cutover|go-live|upgrade|conversion|greenfield|brownfield)\b/i },
  { process: "Finance", pattern: /\b(finance|payment|invoice|gl\b|ap\b|ar\b|fi\b|co\b)\b/i },
  { process: "Procurement", pattern: /\b(procurement|vendor|purchase|po\b|mm\b|srm)\b/i },
  { process: "Logistics", pattern: /\b(warehouse|inventory|logistics|supply chain|sd\b|wm\b)\b/i },
  { process: "Human Resources", pattern: /\b(hr\b|hcm|employee|payroll|successfactors)\b/i }
]);

const INDUSTRY_PATTERNS = Object.freeze([
  { industry: "Defense", pattern: /\b(defen[sc]e|military|army|navy|air force|munition|border|homeland security)\b/i },
  { industry: "Banking", pattern: /\b(bank|banking|swift|payment|treasury|financial|pci-?dss)\b/i },
  { industry: "Healthcare", pattern: /\b(hospital|patient|healthcare|hipaa|medical|pharma)\b/i },
  { industry: "Oil & Gas", pattern: /\b(oil|gas|energy|refinery|petrochemical)\b/i },
  { industry: "Government", pattern: /\b(government|public sector|ministry|authority|municipality)\b/i },
  { industry: "Manufacturing", pattern: /\b(manufacturing|factory|production|plant|ot\/it)\b/i },
  { industry: "Retail", pattern: /\b(retail|consumer|store|commerce)\b/i }
]);

const FOLLOW_UP_PATTERN = /\b(this|that|same|previous|above|why|how so|what about|then|after that|can you elaborate|furthermore|continued)\b/i;

function scoreIntents(q) {
  const scored = [];
  for (let i = 0; i < INTENT_PATTERNS.length; i++) {
    const item = INTENT_PATTERNS[i];
    if (item.pattern.test(q)) {
      scored.push({ name: item.name, weight: item.weight });
    }
  }
  scored.sort((a, b) => b.weight - a.weight);
  
  if (scored.length === 0) {
    return { primary: "General", secondaries: [] };
  }
  
  const primary = scored[0].name;
  const secondaries = scored.slice(1, 3).map(s => s.name);
  return { primary, secondaries };
}

function detectAnswerType(q, primaryIntent) {
  if (/\b(which|list|name)\b/i.test(q) || /\b(t-?codes?|tables?|authorization objects?|reports)\b/i.test(q)) {
    return "inventory";
  }
  if (primaryIntent === "Comparison") return "comparison";
  if (primaryIntent === "Architecture") return "architecture";
  if (primaryIntent === "Workflow") return "workflow";
  if (primaryIntent === "Scenario") return "scenario";
  if (primaryIntent === "Troubleshooting") return "troubleshooting";
  return "explanation";
}

function detectInterviewerIntent(primaryIntent) {
  switch (primaryIntent) {
    case "Architecture": return "Solution Design";
    case "Troubleshooting": return "Production Support";
    case "Scenario": return "Decision Making";
    case "Workflow": return "Implementation";
    case "Migration":
    case "Upgrade": return "Transformation";
    case "Comparison": return "Conceptual Clarity";
    case "Security":
    case "Authorization": return "Compliance & Control";
    case "Production Support": return "Incident Management";
    default: return "Technical Knowledge";
  }
}

function detectComplexity(q, domainCount, intentCount) {
  const isArchitectural = /\b(landscape|topology|blueprint|integration|zero trust|multi-system|cross-module|s\/4hana transition)\b/i.test(q);
  const isScenario = /\b(production outage|high availability|audit failure|sox non-compliance|complex cutover)\b/i.test(q);

  if (isArchitectural || (domainCount >= 2 && intentCount >= 2)) return "Architect";
  if (isScenario || domainCount >= 2 || intentCount >= 2 || q.length > 120) return "Advanced";
  if (q.length > 50 || intentCount === 1) return "Intermediate";
  return "Basic";
}

export function analyzeInterviewQuestion(question = "", historyOrContext = []) {
  const rawQ = String(question || "").trim();
  const q = rawQ.toLowerCase();

  // 1. Follow-up detection
  let isFollowUp = false;
  if (Array.isArray(historyOrContext) && historyOrContext.length > 0) {
    isFollowUp = true;
  } else if (typeof historyOrContext === "object" && historyOrContext !== null && historyOrContext.isFollowUp) {
    isFollowUp = true;
  } else if (FOLLOW_UP_PATTERN.test(q) && rawQ.length < 60) {
    isFollowUp = true;
  }

  // 2. Weighted intent scoring
  const { primary: primaryIntent, secondaries: secondaryIntents } = scoreIntents(q);

  // 3. Domain detection
  let domain = "General SAP";
  let domainCount = 0;
  for (let i = 0; i < DOMAIN_PATTERNS.length; i++) {
    if (DOMAIN_PATTERNS[i].pattern.test(q)) {
      if (domainCount === 0) domain = DOMAIN_PATTERNS[i].domain;
      domainCount++;
    }
  }

  // 4. Business process detection
  let businessProcess = "General";
  for (let i = 0; i < PROCESS_PATTERNS.length; i++) {
    if (PROCESS_PATTERNS[i].pattern.test(q)) {
      businessProcess = PROCESS_PATTERNS[i].process;
      break;
    }
  }

  // 5. Industry focus
  let industry = "General Enterprise";
  for (let i = 0; i < INDUSTRY_PATTERNS.length; i++) {
    if (INDUSTRY_PATTERNS[i].pattern.test(q)) {
      industry = INDUSTRY_PATTERNS[i].industry;
      break;
    }
  }

  // 6. Metadata derivations
  const answerType = detectAnswerType(q, primaryIntent);
  const interviewerIntent = detectInterviewerIntent(primaryIntent);
  const totalIntents = (primaryIntent !== "General" ? 1 : 0) + secondaryIntents.length;
  const complexity = detectComplexity(q, domainCount, totalIntents);

  const expectedStructure = answerType === "inventory" ? "category"
    : answerType === "comparison" ? "table"
    : (answerType === "workflow" || answerType === "architecture") ? "flow"
    : "paragraph";

  const expectedDepth = (complexity === "Architect" || complexity === "Advanced") ? "deep" : "medium";

  return {
    intent: primaryIntent.toLowerCase(),
    primaryIntent,
    secondaryIntents,
    category: primaryIntent,
    secondaryCategories: secondaryIntents,
    domain,
    industry,
    businessProcess,
    candidateLevel: "Lead",
    interviewerIntent,
    complexity,
    expectedAnswer: primaryIntent,
    answerStyle: primaryIntent === "Scenario" ? "Business First" : primaryIntent === "Architecture" ? "Architectural" : "Direct",
    followUpRisk: (complexity === "Architect" || complexity === "Advanced") ? "High" : "Medium",
    answerType,
    expectedStructure,
    expectedDepth,
    isFollowUp
  };
}