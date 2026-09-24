/**
 * Live-interview career facts from the candidate CV (authoritative).
 * Employer/client names below are allowed in spoken answers. Do not add Accenture, Chalhoub, or extra clients.
 */
const DEFAULT_CAREER_BACKGROUND = `Balaji Chandran — SAP GRC Consultant / Security & GRC Architect. This CV is the source of truth for first-person experience. Do not invent employers, tools, metrics, or incidents that are not written here.

CAREER TIMELINE (pick the strongest matching engagement for THIS question; do not rotate employers; do not merge programmes into one fictional project):
- Dover Corporation via Ascent Staffing (08/2022–06/2026): Security & GRC lead, Fortune 500 ECC-to-S/4HANA, 11 countries, 28 legal entities, 8,700+ users, 45 systems, team of 8, three phased go-lives on a 15-month schedule. GRC AC 12.0 (ARA, ARM, BRM, EAM): 18 connected systems, 250+ custom SoD rules, 300 mitigating controls, 4,000+ ARM requests/year, 95 firefighter owners. S/4 role landscape: 1,650 PFCG roles, 350 business roles, 220 Fiori catalogs; every role SoD-simulated in ARA/BRM before transport; 2,400+ SoD conflicts cleared before cutover. ARM MSMP (manager, role owner, security, SoD reviewer) with BRF+ and auto-provisioning replacing manual SU01. UAR/role-owner certification for SOX windows. Testing: 2,500 test cases, UAT with 200 business users; cutover/hypercare for all three go-lives; L2/L3 GRC support. Primary contact for internal and Big-4 auditors; SOX 404/ITGC evidence; no significant access-control findings. IAG with S/4HANA and BTP via IPS and Cloud Connector; IAS/IPS trust; Azure AD SAML 2.0 SSO and MFA; BTP role collections under the same request/review process as on-prem roles. Authored GRC workbook, rule-set design, role-design standard, SOPs, RACI. Do not claim IDM Developer Studio at Dover.
- Eminnov Technologies (11/2019–07/2022): Security & GRC lead for S/4HANA conversion, 9 countries, 6,500 users, teams of 4–7, single global cutover, 8-week hypercare, no P1 access incidents. GRC AC upgraded to 12.0 (ARA, ARM, BRM, EAM). Rebuilt ECC roles for S/4HANA with ARA simulation; 1,300 roles and 180 Fiori catalogs; 110 firefighter IDs; BRM business-role packaging. SoD workshops; SOX/ITGC evidence. Do not describe this as IDM 8.0 Developer Studio delivery. SAP IDM may appear as a skill, not as this project's architecture.
- Fabtech International, Dubai (11/2016–09/2019): Role landscape rebuilt in three phases for ~2,000 users (replace SAP_ALL/wide access); GRC AC 10.1 ARA/ARM/EAM; periodic UARs with department heads. Production support: user admin, SU53/STAUTHTRACE, SU24/SU25 during upgrades, audit evidence.
- Enerlife / Nabati Group (04/2015–10/2016): ECC roles for new plants/BUs; SoD analysis; provisioning; CUA; SU24 defaults; change-controlled transports; statutory/internal audit reports.
- WMS Middle East (12/2012–03/2015): L1/L2 SAP user administration, role assignments, password/authorization issues, L2 coordination, access reviews.
- MMT (06/2007–03/2010): Windows/AD administration and access controls. Not SAP GRC.

CV METRICS — emit only when the question is in that domain; never dump the full set:
- Global S/4/role design/rollout (prefer Dover): 11 countries, 28 legal entities, 8,700+ users, 1,650 PFCG, 350 business roles, 220 Fiori catalogs.
- GRC implementation (prefer Dover 12.0; Eminnov also 12.0; Fabtech 10.1): 18 connected systems, 250+ custom SoD rules, 300 mitigating controls, 4,000+ ARM/year, 95 firefighter owners (Dover).
- SoD remediation (Dover): 2,400+ conflicts cleared before cutover.
- Testing/UAT (Dover): 2,500 test cases, 200 business users; three phased go-lives.
- Eminnov conversion: 9 countries, 6,500 users, 1,300 roles, 180 Fiori catalogs, 110 firefighter IDs, 8-week hypercare.
- Fabtech: 450 roles, 2,000 users, GRC 10.1.
Do not use 20-25 percent role-cut, 3-days-to-30-minutes JML, or 70-80 percent SoD false-positive figures — they are not on this CV.

Do not invent Accenture, Chalhoub, SuccessFactors as the HR source, or unscripted STAR refusals. IAS authenticates; IPS syncs/provisioning writes; IAG/GRC govern. IPS does not independently own JML.`;

const PROGRAMMES = [
  {
    id: "dover",
    aliases: ["dover"],
    label: "Dover Corporation via Ascent Staffing (08/2022–06/2026)",
    domains: ["grc", "security"],
    profile: "Security and GRC lead, ECC-to-S/4HANA.",
    domainFacts: {
      grc: "GRC AC 12.0 (ARA, ARM, BRM, EAM). 250+ custom SoD rules, 300 mitigating controls, 4,000+ ARM requests/year, 95 firefighter owners, 2,400+ SoD conflicts. Team of 8. 15-month schedule, three phased go-lives. 11 countries, 8,700+ users.",
      security: "S/4 role landscape: 1,650 PFCG roles, 350 business roles, 220 Fiori catalogs. 8,700+ users, 11 countries, team of 8, 15-month schedule."
    },
    facts: "Security and GRC lead on an ECC-to-S/4HANA programme. 11 countries, 28 legal entities, 8,700+ users, 45 systems, team of 8, three phased go-lives on a 15-month schedule. GRC AC 12.0 (ARA, ARM, BRM, EAM): 18 connected systems, 250+ custom SoD rules, 300 mitigating controls, 4,000+ ARM requests/year, 95 firefighter owners. S/4 role landscape: 1,650 PFCG roles, 350 business roles, 220 Fiori catalogs. 2,400+ SoD conflicts cleared before cutover. Testing: 2,500 test cases, UAT with 200 business users. Not documented: individual country names, a host city, or a regional delivery label."
  },
  {
    id: "eminnov",
    aliases: ["eminnov", "eminov"],
    label: "Eminnov Technologies (11/2019–07/2022)",
    domains: ["grc", "security"],
    profile: "Security and GRC lead, S/4HANA conversion.",
    domainFacts: {
      grc: "GRC AC 12.0. 1,300 roles, 180 Fiori catalogs, 110 firefighter IDs, 6,500 users, 9 countries, teams of 4–7, 8-week hypercare.",
      security: "1,300 roles, 180 Fiori catalogs, 6,500 users, 9 countries, teams of 4–7."
    },
    facts: "Security and GRC lead for an S/4HANA conversion. 9 countries, 6,500 users, teams of 4–7, one global cutover, 8-week hypercare, no P1 access incidents. GRC AC 12.0. 1,300 roles, 180 Fiori catalogs, 110 firefighter IDs. Not documented: a host city, a regional delivery label, individual country names, a 15-month plan, or another employer's volumes."
  },
  {
    id: "fabtech",
    aliases: ["fabtech"],
    label: "Fabtech International, Dubai (11/2016–09/2019)",
    domains: ["grc", "security"],
    profile: "Role landscape and GRC AC 10.1, Dubai.",
    domainFacts: {
      grc: "GRC AC 10.1 (ARA, ARM, EAM). About 2,000 users, 450 roles, three phases. Location: Dubai. Team size, duration in months, and country count are not documented.",
      security: "Role landscape rebuilt in three phases. About 2,000 users, 450 roles. Location: Dubai. SU53, STAUTHTRACE, SU24/SU25."
    },
    facts: "Role landscape rebuilt in three phases for about 2,000 users and 450 roles, replacing SAP_ALL and wide access. GRC AC 10.1 (ARA, ARM, EAM). Periodic UARs with department heads. Production support: user admin, SU53, STAUTHTRACE, SU24/SU25 during upgrades, audit evidence. Location documented: Dubai. Not documented: team size, duration in months, country count, SoD rule count, ARM request volume, firefighter count."
  },
  {
    id: "enerlife",
    aliases: ["enerlife", "nabati"],
    label: "Enerlife / Nabati Group (04/2015–10/2016)",
    domains: ["security"],
    profile: "ECC roles for new plants and business units.",
    domainFacts: {
      security: "ECC roles, SoD analysis, provisioning, CUA, SU24 defaults. User count, country list, team size, and duration in months are not documented."
    },
    facts: "ECC roles for new plants and business units. SoD analysis, provisioning, CUA, SU24 defaults, change-controlled transports, statutory and internal audit reports. Not documented: user count, country list, team size, duration in months."
  },
  {
    id: "wms",
    aliases: ["wms"],
    label: "WMS Middle East (12/2012–03/2015)",
    domains: ["security"],
    profile: "L1/L2 SAP user administration, Middle East.",
    domainFacts: {
      security: "User administration, role assignments, access reviews. Region: Middle East. User count and GRC module volumes are not documented."
    },
    facts: "L1/L2 SAP user administration, role assignments, password and authorization issues, L2 coordination, access reviews. Region documented: Middle East. Not documented: user count, GRC module volumes, team size, country list beyond Middle East."
  },
  {
    id: "mmt",
    aliases: ["mmt"],
    label: "MMT (06/2007–03/2010)",
    domains: [],
    profile: "Windows and Active Directory administration. Not an SAP GRC engagement.",
    domainFacts: {},
    facts: "Windows and Active Directory administration and access controls. Not an SAP GRC engagement. Not documented: SAP user counts, GRC metrics, country delivery."
  }
];

const PORTFOLIO_EVIDENCE = `Clients documented on the CV, kept separate:
- Dover Corporation: multi-country, 11 countries. Individual country names are not documented.
- Eminnov Technologies: multi-country, 9 countries. Individual country names are not documented. Middle East is not documented for Eminnov.
- Fabtech International: Dubai.
- WMS Middle East: Middle East.
- Enerlife / Nabati Group: geography is not documented.
- MMT: not an SAP client geography.
Do not move a region, user count, duration, or team size from one client to another.`;

const METHODOLOGY_EVIDENCE = `No single engagement is named for this historical figure.
Documented employers, without metrics: Dover Corporation, Eminnov Technologies, Fabtech International, Enerlife / Nabati Group, WMS Middle East, MMT.
A user count, country list, duration, team size, or total years of experience is not identified for an unnamed engagement.
Use methodology: the figure depends on which engagement is being discussed.`;

function namedProgrammes(question = "") {
  const text = String(question || "").toLowerCase();
  return PROGRAMMES.filter((programme) => programme.aliases.some((alias) => text.includes(alias)));
}

function namedProgrammeIds(question = "") {
  return namedProgrammes(question).map((programme) => programme.id);
}

function demandsSpecificFact(question = "") {
  return /\b(how many|how long|how much|team members|team size|how many years|years of experience)\b/i.test(question);
}

function asksPortfolio(question = "") {
  return /\b(clients?|customers?|geograph\w*|countries|country|industr\w*|where (?:did|was|were)|based in|other projects|middle east|dubai|uae|qatar)\b/i.test(question);
}

function widensScope(question = "") {
  return /\b(other projects|another project|other clients|what else|middle east)\b/i.test(question);
}

function renderProgramme(programme) {
  return `${programme.label}. ${programme.facts}`;
}

function technicalHowTo(question = "") {
  return /\b(how (?:do|would|should|can)|design an?|debug|trace|troubleshoot)\b/i.test(question);
}

function personalHistory(question = "") {
  return /\b(your|you)\b/i.test(question) && /\b(experience|background|career|worked|project|programme|program|role)\b/i.test(question);
}

function domainOf(question = "") {
  const domains = [
    ["grc", /\b(grc|sod|segregation|access control|access[- ]risk|business role|firefighter|ara|arm|eam|brm)\b/i],
    ["security", /\b(security|authorization|authorisation|pfcg|role design)\b/i],
    ["presales", /\bpre[-\s]?sales\b/i],
    ["identity", /\b(\bias\b|\bips\b|\biag\b|\biam\b|sso|mfa)\b/i]
  ];
  return domains.find(([, pattern]) => pattern.test(question))?.[0] || "";
}

function renderAttributed(programmes, lineFor) {
  return programmes.map((programme) => `- ${programme.label}: ${lineFor(programme)}`).join("\n");
}

function renderDomain(domain) {
  const rows = PROGRAMMES.filter((programme) => (programme.domains || []).includes(domain) && programme.domainFacts?.[domain]);
  return renderAttributed(rows, (programme) => programme.domainFacts[domain]);
}

function renderProfile() {
  return renderAttributed(PROGRAMMES, (programme) => programme.profile || programme.label);
}

function scopeCareerEvidence(question = "", priorQuestion = "") {
  const named = namedProgrammes(question);
  const priorNamed = named.length || widensScope(question) ? [] : namedProgrammes(priorQuestion);
  const selected = named.length ? named : priorNamed;
  if (selected.length === 1) {
    return {
      mode: "programme",
      programmeId: selected[0].id,
      text: renderProgramme(selected[0])
    };
  }
  if (selected.length > 1) {
    return {
      mode: "multi",
      programmeId: null,
      text: selected.map(renderProgramme).join("\n")
    };
  }
  if (!selected.length && demandsSpecificFact(question)) {
    return { mode: "methodology", programmeId: null, text: METHODOLOGY_EVIDENCE };
  }
  if (asksPortfolio(question) || asksPortfolio(priorQuestion)) {
    return { mode: "portfolio", programmeId: null, text: PORTFOLIO_EVIDENCE };
  }
  if (technicalHowTo(question)) {
    return { mode: "full", programmeId: null, text: DEFAULT_CAREER_BACKGROUND };
  }
  const domain = domainOf(question) || (personalHistory(priorQuestion) ? domainOf(priorQuestion) : "");
  if (domain && (personalHistory(question) || /\b(you|your|experience|background|worked)\b/i.test(question))) {
    return { mode: "domain", programmeId: null, domain, text: renderDomain(domain) };
  }
  if (personalHistory(question)) {
    return { mode: "profile", programmeId: null, text: renderProfile() };
  }
  return { mode: "full", programmeId: null, text: DEFAULT_CAREER_BACKGROUND };
}

const CLAIM_PATTERNS = [
  { label: "years", re: /\b(\d{1,2})\s*\+?\s*years?\b/gi, evidence: (value) => new RegExp(`\\b${value}\\s*\\+?\\s*years?\\b`, "i") },
  { label: "months", re: /\b(\d{1,3})\s*-?\s*months?\b/gi, evidence: (value) => new RegExp(`\\b${value}\\s*-?\\s*months?\\b`, "i") },
  { label: "team", re: /\bteam of\s+(\d{1,3})\b/gi, evidence: (value) => new RegExp(`\\bteam of\\s+${value}\\b`, "i") },
  { label: "users", re: /\b(\d[\d,]*)\s*\+?\s*users?\b/gi, evidence: (value) => new RegExp(`\\b${value.replace(/,/g, "")}\\s*\\+?\\s*users?\\b`, "i") },
  { label: "countries", re: /\b(\d{1,3})\s+countries\b/gi, evidence: (value) => new RegExp(`\\b${value}\\s+countries\\b`, "i") }
];

const REGION_WORDS = ["india", "dubai", "uae", "qatar", "canada", "europe", "asia", "germany", "singapore", "australia", "america", "middle east"];

function auditHistoricalClaims(answer = "", evidenceText = "") {
  const evidence = String(evidenceText || "").replace(/,/g, "");
  const unsupported = [];
  const source = String(answer || "");
  for (const pattern of CLAIM_PATTERNS) {
    const matches = source.matchAll(pattern.re);
    for (const match of matches) {
      const value = String(match[1] || "").replace(/,/g, "");
      if (!pattern.evidence(value).test(evidence)) unsupported.push(`${pattern.label}:${match[0]}`);
    }
  }
  const lowerEvidence = evidence.toLowerCase();
  const lowerAnswer = source.toLowerCase();
  for (const region of REGION_WORDS) {
    const regionRe = new RegExp(`\\b${region}\\b`, "i");
    if (regionRe.test(lowerAnswer) && !lowerEvidence.includes(region)) unsupported.push(`region:${region}`);
  }
  return unsupported;
}

module.exports = {
  DEFAULT_CAREER_BACKGROUND,
  PROGRAMMES,
  namedProgrammes,
  namedProgrammeIds,
  scopeCareerEvidence,
  auditHistoricalClaims
};
