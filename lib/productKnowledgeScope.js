const { explicitProductTopics } = require("./interviewContext.js");

// A product explicitly named in the question is a hard retrieval boundary for
// a single-product answer. Cross-product questions union the requested lanes.
// Broad troubleshooting content is only a fallback when no matching product
// evidence was retrieved; it must never displace an available product procedure.
const FOLDERS_BY_PRODUCT = Object.freeze({
  SAC: ["sac"],
  Datasphere: ["datasphere"],
  Ariba: ["lob"],
  SuccessFactors: ["successfactors"],
  "SAP IDM": ["idm"],
  BW: ["bw"],
  HANA: ["hana"],
  CAR: ["lob"],
  MDG: ["mdg", "s4hana", "security"],
  Fiori: ["fiori", "s4hana", "rise"],
  Joule: ["btp"],
  Activate: ["project-management"],
  Transformation: ["project-types", "project-management", "cutover", "hypercare", "rise"],
  BTP: ["btp", "cloud"],
  IAS: ["btp", "cloud"],
  IAG: ["iag"],
  IPS: ["btp", "cloud"],
  GRC: ["grc"],
  "Process Control": ["grc"],
  RISE: ["rise", "s4hana"],
  "S/4": ["s4hana", "fiori", "security"],
  ECC: ["security", "grc"],
  Authorization: ["security", "s4hana", "fiori"],
  CyberArk: ["cyberark"],
  Integration: ["integration", "cloud", "btp"]
});

function productKnowledgeFolders(question) {
  const topics = explicitProductTopics(question);
  let folders = [...new Set(topics.flatMap((topic) => FOLDERS_BY_PRODUCT[topic] || []))];
  const q = String(question || "");
  const asksAuditEvidence = /\b(?:audit|sox|itgc|control evidence|audit evidence|access review evidence|gdpr|iso\s*27001|isms|soc\s*[12]|cobit|nist|pci\s*dss)\b/i.test(String(question || ""));
  const asksPublicEdition = /\bpublic\s+(?:cloud\s+)?edition\b|\bpublic\s+cloud\b/i.test(String(question || ""));
  const asksAbapGateway = /\b(?:on[- ]premise|ABAP Gateway|embedded Gateway)\b/i.test(String(question || ""));
  const asksCutover = /\b(?:cutover|go[- ]live|deployment readiness|transition to production)\b/i.test(q);
  const asksHypercare = /\b(?:hypercare|post[- ]go[- ]live|stabilization)\b/i.test(q);
  const namesProject = /\b(?:SAP\s+)?(?:project|programme|program)\b/i.test(q);
  const asksProjectManagement = /\b(?:project management|governance|planning|estimation|risk management|risks?|milestones?|delivery management|RAID)\b/i.test(q);

  // Bare ABAP role-administration tools (PFCG/SU24/SU25/…) must open the Authorization
  // security lane even when the interviewer never says "S/4" (forensic: PFCG folders=[]).
  if (/\b(?:PFCG|SU24|SU25|SU01|SU10|SUIM|PFUD|AGR_USERS|AGR_1251|Profile Generator)\b/i.test(q)) {
    folders = [...new Set([...folders, ...(FOLDERS_BY_PRODUCT.Authorization || [])])];
  }

  // BW analysis authorizations are a first-class authorization plane — open bw even when
  // the interviewer never says "BW" (pre-live: "Explain analysis authorizations." → folders=[]).
  if (/\banalysis\s+authorizations?\b|\bRSECADMIN\b|\bRSEC\w*\b/i.test(q)) {
    folders = [...new Set([...folders, "bw", ...(FOLDERS_BY_PRODUCT.Authorization || [])])];
  }

  if (asksCutover) folders = [...new Set([...folders, "cutover"])];
  if (asksHypercare) folders = [...new Set([...folders, "hypercare"])];
  if (namesProject && asksProjectManagement) folders = [...new Set([...folders, "project-management"])];

  // Transition-path comparison / explain asks need project-types (greenfield/brownfield/SDT).
  const asksTransitionPaths = /\b(?:greenfield|brownfield|selective data transition|bluefield|system conversion|new implementation)\b/i.test(q);
  if (asksTransitionPaths) {
    folders = [...new Set([...folders, "project-types", "project-management", "cutover"])];
  }

  // ARA / ruleset / critical-access / mitigation vocabulary must open GRC even when the
  // interviewer omits the product name (prevents empty-folder retrieval and prior-topic contamination).
  if (
    /\brisk\b.+\bfunction\b.+\baction\b.+\bpermission\b|\brule\s*sets?\b|\bcritical access risks?\b|\bcritical actions?\b|\bcritical permissions?\b|\bmitigation lifecycle\b|\bmitigating controls?\b|\bfirefighter\b.{0,40}\blogs?\b/i.test(q)
  ) {
    folders = [...new Set([...folders, "grc"])];
  }

  // SoD/ARA questions are correctly classified as GRC, but a GRC-only boundary
  // removed audit evidence from questions whose actual objective is SOX/ITGC
  // preparation. Keep both lanes when audit evidence is explicitly requested.
  // Compliance interview questions often name no SAP product; still open the
  // compliance folder so SOX/GDPR/ISO procedures can be retrieved.
  if (asksAuditEvidence) folders = [...new Set([...folders, "audit", "compliance", "grc"])];

  // Client-delivery questions name a product only in passing. Keep the product
  // lane and add the senior-consultant delivery lane so the answer can use the
  // workplan, RAID, and quality-gate procedure without opening every GRC
  // question to that folder.
  const asksIdentityManagement = /\b(?:SAP\s+)?IDM\b|\bIdentity Management\b|\b(?:SAP\s+)?Identity Center\b/i.test(String(question || ""));
  const asksIdentityPlane = /\b(?:SAML|SAML 2\.0|identity provider|identity provisioning|Cloud Identity Services|IdP|sign-in|single sign-on|SSO)\b/i.test(String(question || ""));
  // Named SAP IDM stays on the idm lane. Do not open CIS/cloud merely because the question
  // also says "identity provisioning" (that wording is shared with IPS/CIS).
  if (asksIdentityPlane && !asksIdentityManagement) {
    folders = [...new Set([...folders, "cloud"])];
  }
  if (asksIdentityManagement) folders = [...new Set([...folders, "idm"])];

  // SuccessFactors intent split (do not treat every SF mention as IDM or IPS):
  // - RBP / in-suite employee-data authorization → successfactors only
  // - HR-driven JML / provisioning / user sync → successfactors + IPS plane (btp/cloud)
  // - Explicit SAP IDM remains via topics / asksIdentityManagement above
  const namesSuccessFactors = topics.includes("SuccessFactors")
    || /\b(?:SAP\s+)?SuccessFactors\b|\bEmployee Central\b|\bSF\s+RBP\b/i.test(q);
  const asksSfRbpOrEmployeeData = namesSuccessFactors
    && /\b(?:employee\s+data\s+access|target\s+populations?|SF\s+RBP|\bRBP\b|permission\s+roles?|permission\s+groups?|role[- ]based\s+permissions?|SF\s+permissions?|Manage Permission Roles)\b/i.test(q)
    && !/\b(?:provision(?:ing|ed|s)?|JML|joiners?|movers?|leavers?|user\s+sync|HR[- ]?driven|Identity Provisioning|\bIPS\b|(?:SAP\s+)?IDM\b|Identity Management)\b/i.test(q);
  const asksSfLifecycleProvision = namesSuccessFactors
    && !asksSfRbpOrEmployeeData
    && /\b(?:JML|joiners?|movers?|leavers?|HR[- ]?driven(?:\s+identity)?|user\s+sync|SF\s+user\s+sync|provision(?:ing|ed|s)?\s+joiners?|provision(?:ing|ed|s)?)\b/i.test(q)
    && !/\b(?:permission\s+roles?|permission\s+groups?|target\s+populations?|SF\s+RBP|\bRBP\b|role[- ]based\s+permissions?|employee\s+data\s+access)\b/i.test(q);
  if (asksSfRbpOrEmployeeData) {
    folders = [...new Set([...folders.filter((folder) => folder !== "idm"), "successfactors"])];
  } else if (asksSfLifecycleProvision) {
    // Keep the SF HR source lane. Open the IPS plane (btp/cloud) for SF-driven JML unless
    // the question already named SAP IDM as the provisioning engine — do not synonymize IDM/IPS.
    folders = [...new Set([...folders, "successfactors"])];
    if (!asksIdentityManagement) {
      folders = [...new Set([...folders, "btp", "cloud"])];
    }
  }

  const asksSeniorDelivery = /\b(?:client security assessment|nontechnical stakeholder|junior consultant|security workstream|critical defect|audit finding|security proposal|disagreement between|vendor delay|missed milestone|delivery recovery|recovery and escalation|resource and budget forecast|RAID|cutover recovery)\b/i.test(String(question || ""));
  if (asksSeniorDelivery) folders = [...new Set([...folders, "project-management"])];

  // S/4HANA public and private editions share product words, but their admin
  // surfaces differ. A named Public Edition question must not pull the RISE
  // private-cloud lane or generic ABAP security into its answer candidates.
  // "S/4HANA Cloud" without Private Edition or on-premise uses the same boundary.
  // The generic PFCG lane was answering that question as an ABAP role design.
  const namesPrivateOrOnPrem = /\b(?:private\s+(?:cloud\s+)?edition|private\s+cloud|on[- ]premise)\b/i.test(String(question || ""));
  const asksUnqualifiedS4Cloud = /\bS\/?4(?:HANA)?\s+Cloud\b/i.test(String(question || "")) && !namesPrivateOrOnPrem;
  if ((asksPublicEdition || asksUnqualifiedS4Cloud) && topics.some((topic) => ["S/4", "Fiori"].includes(topic))) {
    folders = folders.filter((folder) => !["rise", "security"].includes(folder));
  }
  if (asksAbapGateway && topics.includes("Fiori")) {
    folders = folders.filter((folder) => folder !== "rise");
  }

  // Deployment-unspecified Fiori launchpad/configure asks need modern Spaces/Pages
  // (s4hana) plus Fiori security procedure sources. Keep RISE out so private-cloud
  // transformation banks do not outrank launchpad content managers.
  const asksFioriConfigure = topics.includes("Fiori")
    && /\b(?:configur\w*|set\s*up|setup|activat\w*|assign(?:s|ed|ing|ment)?|authoriz\w*)\b/i.test(q)
    && /\b(?:app|application|catalog|tile|launchpad|target mapping)\b/i.test(q);
  const namesFioriDeployment = /\b(?:public\s+(?:cloud\s+)?edition|public\s+cloud|private\s+(?:cloud\s+)?edition|private\s+cloud|on[- ]premise|odata\s*v[24]|\/ui2\/|\/iwfnd\/)\b/i.test(q);
  if (asksFioriConfigure && !namesFioriDeployment && !namesPrivateOrOnPrem && !asksPublicEdition) {
    folders = [...new Set([...folders.filter((folder) => folder !== "rise"), "fiori", "s4hana"])];
  }

  // Bare BRF+/BRFplus configure asks are GRC MSMP-rule work with optional S/4
  // application-rule context. Keep both lanes for GENERATION retrieval.
  const asksBrf = /\bBRF(?:\+|plus)(?!\w)/i.test(q);
  if (asksBrf) {
    folders = [...new Set([...folders, "grc", "s4hana"])];
  }
  // MSMP / Access Request workflow configure asks stay on the GRC lane (MSMP + BRF+).
  const asksMsmp = /\bMSMP\b|\bGRFNMW_CONFIGURE\b|\bmaintain msmp workflows\b/i.test(q);
  if (asksMsmp) {
    folders = [...new Set([...folders, "grc"])];
  }
  // BTP security / identity asks keep cloud + BTP so IAS/IPS/XSUAA material stays in scope.
  const asksBtpSecurity = topics.includes("BTP")
    && /\b(?:security|xsuaa|role collection|subaccount|cloud connector|trust|pillar|identity)\b/i.test(q);
  if (asksBtpSecurity) {
    folders = [...new Set([...folders, "btp", "cloud"])];
  }
  return folders;
}

/** Process Control–primary evidence (file or heading), not mere co-mention of both GRC products. */
function isProcessControlPrimaryChunk(chunk) {
  const sourceFile = String(chunk?.sourceFile || chunk?.fileName || "").toLowerCase();
  const heading = String(chunk?.heading || chunk?.section || "");
  if (/(?:^|\/)process-control\.md$/i.test(sourceFile) || /process-control|process_control/.test(sourceFile)) {
    return true;
  }
  if (/\bContinuous Control Monitoring\b|\bCCM\b|\bManual Test Plans?\b|\bcontrol assessment\b|\bPlanner assignment\b/i.test(heading)) {
    return true;
  }
  // PC transport / test procedures that stole AC implementation answers in offline audits.
  if (/\bProcess Control\b/i.test(heading) && !/\bAccess Control\b/i.test(heading)) {
    return true;
  }
  if (/^Access Control and Process Control\b/i.test(heading.trim())) {
    return true;
  }
  if (/\bMove a Process Control change\b/i.test(heading)) {
    return true;
  }
  return false;
}

function selectProductScopedChunks(question, chunks = []) {
  const allowedFolders = new Set(productKnowledgeFolders(question));
  if (!allowedFolders.size || !Array.isArray(chunks) || chunks.length === 0) return chunks;

  const q = String(question || "");
  const asksPublic = /\bpublic\s+(?:cloud\s+)?edition\b|\bpublic\s+cloud\b/i.test(q);
  const asksPrivate = /\bprivate\s+(?:cloud\s+)?edition\b|\bprivate\s+cloud\b/i.test(q);
  const asksAbapGateway = /\b(?:on[- ]premise|ABAP Gateway|embedded Gateway)\b/i.test(q);
  const editionComparison = asksPublic && asksPrivate;
  const topics = explicitProductTopics(q);
  const namedComplianceFramework = /\bSOX\b|\bITGC\b/i.test(q)
    ? "sox"
    : /\bGDPR\b/i.test(q)
      ? "gdpr"
      : /\bISO(?:\s*\/\s*IEC)?\s*27001\b/i.test(q)
        ? "iso27001"
        : "";
  // Access Control delivery vs Process Control: both live under knowledge/grc. Term overlap
  // ("Access Control", "implementation", "production") previously ranked PC transport/CCM
  // above ARM/MSMP for explicitly scoped Access Control programme questions.
  const namesProcessControl = topics.includes("Process Control")
    || /\b(?:SAP\s+)?(?:GRC\s+)?Process Control\b|\b(?:automated|manual) control test(?:s| plan)?\b|\bManual Test Plans?\b|\bContinuous Control Monitoring\b|\bCCM\b/i.test(q);
  const namesAccessControlProduct = /\b(?:Access Control|MSMP|ARM|ARA|BRM|EAM|Firefighter|FF\s*(?:ID|IDs|role|roles)|BRF(?:\+|plus)|ruleset|rule\s*sets?|critical access risks?|critical actions?|critical permissions?|mitigation lifecycle|mitigating controls?|access request|GRFNMW_CONFIGURE)\b|\brisk\b.+\bfunction\b.+\baction\b.+\bpermission\b/i.test(q);
  const asksBothAccessAndProcessControl = (namesAccessControlProduct && namesProcessControl)
    || /\bAccess Control\b[\s\S]{0,120}\bProcess Control\b|\bProcess Control\b[\s\S]{0,120}\bAccess Control\b/i.test(q);
  const asksAccessControlDelivery = !asksBothAccessAndProcessControl
    && !namesProcessControl
    && (
      namesAccessControlProduct
      || (/\bGRC\b/i.test(q)
        && /\b(?:implement(?:ation|ing)?|rollout|upgrade|hypercare|support[\s-]*package)\b/i.test(q))
    );
  const scoped = chunks.filter((chunk) => {
    if (!allowedFolders.has(String(chunk?.sourceFolder || "").toLowerCase())) return false;
    const sourceFile = String(chunk?.sourceFile || chunk?.fileName || "").toLowerCase();
    if (sourceFile && topics.includes("CAR") && String(chunk?.sourceFolder || "").toLowerCase() === "lob"
      && !sourceFile.includes("car")) return false;
    if (sourceFile && namedComplianceFramework && String(chunk?.sourceFolder || "").toLowerCase() === "compliance"
      && !sourceFile.includes(namedComplianceFramework)) return false;
    // Process Control–only asks stay on PC files. Dual AC+PC asks must keep both domains.
    if (
      sourceFile
      && topics.includes("Process Control")
      && !asksBothAccessAndProcessControl
      && String(chunk?.sourceFolder || "").toLowerCase() === "grc"
      && !/process-control|process_control|process control/i.test(sourceFile)
      && !/\bprocess control\b/i.test(String(chunk?.heading || chunk?.section || ""))
    ) return false;
    // AC-only delivery: drop Process Control–primary procedures so they cannot displace ARM/MSMP.
    // Dual-product and Process Control–named asks keep PC evidence.
    if (asksAccessControlDelivery && isProcessControlPrimaryChunk(chunk)) return false;
    if (editionComparison) return true;

    const heading = String(chunk?.heading || chunk?.section || "");
    if (asksAbapGateway && /\bpublic\s+(?:cloud\s+)?edition\b/i.test(heading)) return false;
    if (asksPublic && /\bprivate\s+(?:edition|cloud)\b/i.test(heading) && !/\bpublic\s+(?:edition|cloud)\b/i.test(heading)) return false;
    if (asksPrivate && /\bpublic\s+(?:edition|cloud)\b/i.test(heading) && !/\bprivate\s+(?:edition|cloud)\b/i.test(heading)) return false;
    return true;
  });
  if (scoped.length) {
    // Drop bare interview TOC / coaching headings. Keep technical docs even if they also
    // contain Q&A-formatted sections elsewhere — provenance is decided by source file category.
    const coachingHeading =
      /^(?:common )?interview questions$|^(?:tough )?follow-up questions$|^\d+\s*second interview answer$|^what makes this a 10\/10 answer$/i;
    let procedural = scoped.filter((chunk) => !coachingHeading.test(String(chunk?.heading || chunk?.section || "").trim()));
    if (!procedural.length) procedural = scoped;

    // Interview Q&A / prepared-answer banks — hard-exclude from ordinary production retrieval.
    // Provenance filter only (filename / folder). Files remain on disk for regression / rehearsal.
    const isInterviewQaBankSource = (chunk) => isInterviewQaBankFileName(
      chunk?.sourceFile || chunk?.fileName || ""
    ) || /(?:^|\/)(?:interview-banks?|answer-banks?|qa-banks?|prepared-answers?)\//i.test(
      String(chunk?.sourceFolder || chunk?.sourceFile || "")
    );
    // Legacy alias used by Fiori/BTP preferential filters below.
    const isGoldenQaSource = isInterviewQaBankSource;

    // Never fall back to Q&A banks for ordinary technical retrieval — empty tech set stays empty.
    procedural = procedural.filter((chunk) => !isInterviewQaBankSource(chunk));

    // Prefer Configure / procedure / overview technical headings; demote coaching summaries.
    const demoteCoachingHeading =
      /\b(?:interview summary|\d+\s*second interview answer|what makes this a 10\/10|common interview questions|red flags|hidden expectations|keywords(?:\s+to\s+(?:use|include))?|best practices)\b/i;
    const boostConfigureHeading =
      /\b(?:configur\w*|implement\w*|set\s*up|setup|agent rule|initiator rule|maintain msmp|spaces?\b|pages?\b|role collections?|xsuaa|launchpad content|decision|mechanism|validation|architecture|runtime flow|generate and assign|menu tab|authorization tab|single role|derived role)\b/i;
    const asksTroubleshoot = /\b(?:troubleshoot\w*|diagnos\w*|cannot see|can't see|missing app|not (?:visible|showing|generated|created)|failing|why are)\b/i.test(q);
    const asksLifecycle = /\blifecycle\b|\bjoiner\b|\bmover\b|\bleaver\b|\bprovisioning lifecycle\b/i.test(q);
    // Definitional / FF-log asks need ara.md / mitigation.md / firefighter technical refs.
    const asksGrcTechnicalDefinition =
      allowedFolders.has("grc")
      && /\b(?:critical actions?|critical permissions?|critical access risks?|rule\s*sets?\s*components?|mitigation lifecycle|mitigating controls?)\b|\brisk\b.+\bfunction\b.+\baction\b.+\bpermission\b|\bfirefighter\b.{0,60}\blogs?\b/i.test(q);
    const grcTechnicalRefFile = /(?:^|\/)(?:ara|mitigation|risk-analysis|firefighter|eam|sod|grc-ac|brm)\.md$/i;
    // Universal filename-stem boost: if the question names a product token that matches a
    // technical source stem (brm, pfcg, msmp, …), prefer that file — not a question family.
    const questionTokens = String(q || "")
      .toLowerCase()
      .match(/\b[a-z][a-z0-9+]{2,}\b/g) || [];
    const stemBoost = (file) => {
      const stem = String(file || "").toLowerCase().replace(/^.*\//, "").replace(/\.md$/i, "");
      if (!stem || stem.length < 3) return 0;
      return questionTokens.some((tok) => stem === tok || stem.startsWith(`${tok}-`) || stem.endsWith(`-${tok}`))
        ? 16
        : 0;
    };
    const rankProcedureFirst = (rows) => {
      const list = Array.isArray(rows) ? rows.map((chunk, index) => ({ chunk, index })) : [];
      list.sort((a, b) => {
        const ha = String(a.chunk?.heading || a.chunk?.section || "");
        const hb = String(b.chunk?.heading || b.chunk?.section || "");
        const fa = String(a.chunk?.sourceFile || a.chunk?.fileName || "");
        const fb = String(b.chunk?.sourceFile || b.chunk?.fileName || "");
        const score = (heading, file) => {
          let s = 0;
          s += stemBoost(file);
          if (asksGrcTechnicalDefinition && grcTechnicalRefFile.test(file)) s += 14;
          // Banks are already filtered from the primary set; if present as fallback, keep them last.
          if (isInterviewQaBankSource({ sourceFile: file })) s -= 12;
          if (boostConfigureHeading.test(heading)) s += 5;
          if (/generate and assign|menu tab|authorization tab/i.test(heading)) s += 8;
          if (/^configure\b/i.test(heading.trim())) s += 4;
          if (/\b(?:decision|mechanism|governance|validation)\b/i.test(heading)) s += 3;
          if (asksTroubleshoot && /\btroubleshoot\w*\b/i.test(heading)) s += 5;
          if (!asksTroubleshoot && /\btroubleshoot\w*\b/i.test(heading)) s -= 1;
          // Lifecycle / JML asks prefer overview/provisioning sections over failure troubleshooting.
          if (asksLifecycle && /\b(?:lifecycle|overview|joiner|mover|leaver|provisioning)\b/i.test(heading)) s += 8;
          if (asksLifecycle && !asksTroubleshoot && /\btroubleshoot\w*|failing|failures?\b/i.test(heading)) s -= 8;
          if (demoteCoachingHeading.test(heading)) s -= 10;
          if (/^keywords$|^red flags$|^best practices$/i.test(heading.trim())) s -= 12;
          return s;
        };
        const delta = score(hb, fb) - score(ha, fa);
        if (delta !== 0) return delta;
        return a.index - b.index;
      });
      return list.map((row) => row.chunk);
    };

    const preferGoldenThenProcedural = (rows) => {
      const list = Array.isArray(rows) ? rows : [];
      // Technical reference files / stem matches first; banks stay last-resort only.
      if (asksGrcTechnicalDefinition) {
        const tech = list.filter((chunk) => grcTechnicalRefFile.test(String(chunk?.sourceFile || chunk?.fileName || "")));
        if (tech.length) {
          const rest = list.filter((chunk) => !grcTechnicalRefFile.test(String(chunk?.sourceFile || chunk?.fileName || "")));
          return rankProcedureFirst([...tech, ...rest]);
        }
      }
      const technical = list.filter((chunk) => !isInterviewQaBankSource(chunk));
      return rankProcedureFirst(technical.length ? technical : []);
    };

    // Deployment-unspecified Fiori configure/launchpad: prefer Spaces/Pages procedures, keep
    // Fiori golden architect-bank for 5-point technical sequences, drop custom RAP/BAS digressions.
    const asksFioriConfigure = topics.includes("Fiori")
      && /\b(?:configur\w*|set\s*up|setup|activat\w*|assign(?:s|ed|ing|ment)?|authoriz\w*|launchpad)\b/i.test(q)
      && /\b(?:app|application|catalog|tile|launchpad|target mapping|fiori)\b/i.test(q);
    const namesFioriDeployment = asksPublic || asksPrivate || asksAbapGateway
      || /\b(?:odata\s*v[24]|\/ui2\/|\/iwfnd\/)\b/i.test(q);
    if (asksFioriConfigure && !namesFioriDeployment) {
      const preferredFile = /(?:^|\/)(?:s4hana-fiori|spaces-pages|fiori-security|fiori-frontend-security-architect-bank|catalogs|launchpad)\.md$/i;
      const demotedHeading = /custom fiori app:\s*design|design, build, secure, and deploy|RAP service|ADT|service binding/i;
      const hasModern = procedural.some((chunk) => preferredFile.test(String(chunk?.sourceFile || chunk?.fileName || "")));
      if (hasModern) {
        const cleaned = procedural.filter((chunk) => {
          const sourceFile = String(chunk?.sourceFile || chunk?.fileName || "");
          const heading = String(chunk?.heading || chunk?.section || "");
          const text = String(chunk?.text || chunk?.content || "");
          if (demotedHeading.test(heading) && /fiori-security\.md$/i.test(sourceFile)) return false;
          if (demotedHeading.test(heading) || demotedHeading.test(text.slice(0, 240))) return false;
          return true;
        });
        if (cleaned.length) {
          const preferred = cleaned.filter(
            (chunk) => preferredFile.test(String(chunk?.sourceFile || chunk?.fileName || "")) || isGoldenQaSource(chunk)
          );
          return preferGoldenThenProcedural(preferred.length ? preferred : cleaned);
        }
      }
    }

    // MSMP / BRF+ configure: prefer msmp.md + brf-plus.md procedure sections over generic GRC overviews.
    // Workflow-first Fix: keep concrete MSMP procedure files ahead of interview-bank wrappers.
    const asksMsmpOrBrf = /\bMSMP\b|\bBRF(?:\+|plus)\b|\bGRFNMW_CONFIGURE\b|\bstuck (?:approval )?workflow\b|\bno approver\b/i.test(q);
    // ARA / SoD / business-risk-report capability (not MSMP workflow). Must run before the
    // broad GRC lock so msmp.md cannot displace ara.md on SoD violation troubleshooting.
    const asksAraCapability = allowedFolders.has("grc")
      && !asksMsmpOrBrf
      && /\b(?:ARA|access risk analysis|SoD|segregation of duties|risk violations?|excessive (?:SoD |sod )?violations?|business reports?.{0,48}(?:sod|violation|risk)|GRAC_BATCH_RISK_ANALYSIS|toxic (?:combination|access)|ruleset simulation)\b/i.test(q);
    if (asksAraCapability) {
      const preferred = /(?:^|\/)(?:ara|mitigation|sod|grc-principal-architect|grc-.*architect)\.md$/i;
      const demotedMsmp = /(?:^|\/)(?:msmp|brf-plus)\.md$/i;
      const focused = procedural.filter((chunk) => {
        const sourceFile = String(chunk?.sourceFile || chunk?.fileName || "");
        if (demotedMsmp.test(sourceFile)) return false;
        return preferred.test(sourceFile)
          || isGoldenQaSource(chunk)
          || ["grc", "audit", "compliance"].includes(String(chunk?.sourceFolder || "").toLowerCase());
      });
      const araFirst = focused.filter((chunk) => preferred.test(String(chunk?.sourceFile || chunk?.fileName || "")) || isGoldenQaSource(chunk));
      if (araFirst.length) return preferGoldenThenProcedural(araFirst);
      if (focused.length) return preferGoldenThenProcedural(focused);
    }

    if (asksMsmpOrBrf && allowedFolders.has("grc")) {
      const preferred = /(?:^|\/)(?:msmp|brf-plus|arm)\.md$/i;
      const demoted = /interview-questions|grc-overview/i;
      const focused = procedural.filter((chunk) => preferred.test(String(chunk?.sourceFile || chunk?.fileName || "")));
      const cleaned = (focused.length ? focused : procedural).filter(
        (chunk) => !demoted.test(String(chunk?.sourceFile || chunk?.fileName || ""))
      );
      if (cleaned.length) return rankProcedureFirst(cleaned);
    }

    // GRC Access Control domain lock (ARA / EAM / Firefighter / SoD) — keep AC procedure + golden banks
    // plus audit/compliance evidence lanes; drop Fiori/BTP/SuccessFactors bleed on single-product GRC asks.
    const asksGrcAccessControl = allowedFolders.has("grc")
      && (
        topics.includes("GRC")
        || /\b(?:ARA|EAM|Firefighter|SoD|GRAC_BATCH_RISK_ANALYSIS|access risk|ruleset)\b/i.test(q)
      )
      && !asksMsmpOrBrf;
    if (asksGrcAccessControl && topics.length <= 2 && !topics.includes("Fiori") && !topics.includes("BTP") && !topics.includes("SuccessFactors")) {
      const preferred = /(?:^|\/)(?:ara|arm|eam|firefighter|brm|mitigation|sod|msmp|brf-plus|grc-principal-architect|grc-.*architect|access-control)\.md$/i;
      const crossBleed = /(?:^|\/)(?:fiori|spaces-pages|btp-security|successfactors|rbp)/i;
      const keepFolders = new Set(["grc", "audit", "compliance"].filter((folder) => allowedFolders.has(folder)));
      const focused = procedural.filter((chunk) => {
        const sourceFile = String(chunk?.sourceFile || chunk?.fileName || "");
        const folder = String(chunk?.sourceFolder || "").toLowerCase();
        if (crossBleed.test(sourceFile) && !preferred.test(sourceFile)) return false;
        return preferred.test(sourceFile) || isGoldenQaSource(chunk) || keepFolders.has(folder);
      });
      if (focused.length) return preferGoldenThenProcedural(focused);
    }

    // BTP / IAM domain lock: IAS, IPS, SCIM, XSUAA, Cockpit trust — prefer identity banks over GRC/Fiori bleed.
    const asksBtpOrIam = (topics.includes("BTP") || topics.includes("IAS") || topics.includes("IPS"))
      && /\b(?:security|xsuaa|role collection|subaccount|cloud connector|trust|pillar|identity|scim|ias|ips|cockpit)\b/i.test(q);
    if (asksBtpOrIam && (allowedFolders.has("btp") || allowedFolders.has("cloud"))) {
      const preferred = /(?:^|\/)(?:btp-security|btp-security-architect-bank|ias|ips|cloud-identity|ias-ips-cloud-identity|cloud-connector|btp-overview|btp-capability-pillars|joule-security)\.md$/i;
      const focused = procedural.filter((chunk) => preferred.test(String(chunk?.sourceFile || chunk?.fileName || "")) || isGoldenQaSource(chunk));
      const preferredOnly = focused.filter((chunk) => preferred.test(String(chunk?.sourceFile || chunk?.fileName || "")));
      if (preferredOnly.length) return preferGoldenThenProcedural(preferredOnly);
      if (focused.length) return preferGoldenThenProcedural(focused);
    }

    // Fiori domain lock (non-Public-only asks already handled above): keep Spaces/Pages + SU24/S_SERVICE
    // procedure material; demote GRC MSMP/ARA and BTP XSUAA on single-product Fiori asks.
    if (topics.includes("Fiori") && !topics.includes("GRC") && !topics.includes("BTP") && !asksMsmpOrBrf) {
      const preferred = /(?:^|\/)(?:s4hana-fiori|spaces-pages|fiori-security|fiori-frontend-security-architect-bank|catalogs|launchpad)\.md$/i;
      const crossBleed = /(?:^|\/)(?:msmp|brf-plus|ara|firefighter|btp-security|xsuaa|successfactors-rbp)/i;
      const locked = procedural.filter((chunk) => {
        const sourceFile = String(chunk?.sourceFile || chunk?.fileName || "");
        if (crossBleed.test(sourceFile)) return false;
        return preferred.test(sourceFile)
          || isGoldenQaSource(chunk)
          || ["fiori", "s4hana"].includes(String(chunk?.sourceFolder || "").toLowerCase());
      });
      if (locked.length) return preferGoldenThenProcedural(locked);
    }

    // S/4HANA plane lock: CDS DCL / SU25 / Business Partner / Universal Journal when explicitly asked.
    const asksS4Plane = (topics.includes("S/4") || /\b(?:CDS\s*DCL|SU25|Business Partner|Universal Journal)\b/i.test(q))
      && !topics.includes("Fiori")
      && !topics.includes("GRC")
      && !topics.includes("BTP");
    if (asksS4Plane && (allowedFolders.has("s4hana") || allowedFolders.has("security"))) {
      const preferred = /(?:^|\/)(?:s4hana-security|s4hana-erp-security-architect-bank|s4hana-business-roles|cds|dcl|su25|authorization)\.md$/i;
      const focused = procedural.filter((chunk) => {
        const sourceFile = String(chunk?.sourceFile || chunk?.fileName || "");
        const folder = String(chunk?.sourceFolder || "").toLowerCase();
        return preferred.test(sourceFile) || isGoldenQaSource(chunk) || folder === "s4hana" || folder === "security";
      });
      if (focused.length) return preferGoldenThenProcedural(focused);
    }

    // SuccessFactors / S/4 / GRC / hypercare / go-live: surface golden architect banks when present.
    const asksGoldenDomain = topics.some((topic) => ["SuccessFactors", "S/4", "GRC", "Fiori", "BTP", "IAS", "IPS"].includes(topic))
      || /\b(?:go-?live|hypercare|cds\s*dcl|analysis authorization|firefighter|sod|rbp)\b/i.test(q);
    if (asksGoldenDomain) {
      return preferGoldenThenProcedural(procedural);
    }

    if (asksFioriConfigure) {
      return preferGoldenThenProcedural(procedural);
    }
    return preferGoldenThenProcedural(procedural);
  }

  // Shared operational guidance is preferable to a confidently wrong procedure
  // from another SAP product when the exact product lane has no indexed match.
  return chunks.filter((chunk) => ["troubleshooting", "interview-scenarios"].includes(String(chunk?.sourceFolder || "").toLowerCase()));
}

/**
 * When the question names a product token that matches a technical source-file stem
 * (brm.md, pfcg.md, …), inject those indexed chunks into the candidate pool before
 * scoping. Vector search alone often misses the procedure section of a correctly
 * named file. This is provenance-aware enrichment of the existing search path —
 * not a parallel retrieval engine. Interview Q&A banks are never injected.
 */
let _indexChunksCache = null;
function loadIndexChunks() {
  if (_indexChunksCache) return _indexChunksCache;
  try {
    const path = require("path");
    const fs = require("fs");
    const APP_CONFIG = require("../config/appConfig.js");
    const indexPath = path.resolve(
      process.cwd(),
      APP_CONFIG?.knowledge?.indexFile || "./data/knowledgeIndex.json"
    );
    const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    _indexChunksCache = Array.isArray(index?.chunks) ? index.chunks : [];
  } catch {
    _indexChunksCache = [];
  }
  return _indexChunksCache;
}

function isInterviewQaBankFileName(sourceFile = "") {
  const file = String(sourceFile || "").toLowerCase().replace(/\\/g, "/");
  const base = file.replace(/^.*\//, "");
  // Any *-bank.md Q&A / prepared-answer bank (incl. sap-clean-core-soc-integration-bank.md).
  if (/-bank\.md$/i.test(base)) return true;
  if (/(?:^|[-_])(?:architect-bank|interview-bank|gap-filler|deloitte-usi)(?:[-_.]|$)/i.test(base)) return true;
  if (/principal-architect-interview-bank/i.test(file)) return true;
  if (/(?:^|\/)(?:interview-banks?|answer-banks?|qa-banks?|prepared-answers?)\//i.test(file)) return true;
  return false;
}

function augmentStemMatchedChunks(question = "", candidates = [], folders = []) {
  const q = String(question || "");
  const tokens = q.toLowerCase().match(/\b[a-z][a-z0-9+]{2,}\b/g) || [];
  if (!tokens.length) return Array.isArray(candidates) ? candidates : [];
  const allowed = new Set((folders || []).map((f) => String(f || "").toLowerCase()).filter(Boolean));
  const existing = new Set(
    (Array.isArray(candidates) ? candidates : [])
      .map((c) => c.id || c.chunkId || `${c.sourceFolder}/${c.sourceFile}/${c.heading}`)
  );
  const indexChunks = loadIndexChunks();
  const injected = [];
  for (const chunk of indexChunks) {
    const folder = String(chunk?.sourceFolder || "").toLowerCase();
    const file = String(chunk?.sourceFile || chunk?.fileName || "");
    if (allowed.size && !allowed.has(folder)) continue;
    if (isInterviewQaBankFileName(file)) continue;
    const stem = file.toLowerCase().replace(/^.*\//, "").replace(/\.md$/i, "");
    if (!stem || stem.length < 3) continue;
    if (!tokens.some((tok) => stem === tok || stem.startsWith(`${tok}-`) || stem.endsWith(`-${tok}`))) {
      continue;
    }
    const heading = String(chunk?.heading || chunk?.section || "");
    // Prefer procedure / overview sections; skip coaching TOC inside technical files.
    if (/^(?:common )?interview questions$|^\d+\s*second interview answer$|^what makes this a 10\/10|^keywords$|^red flags$/i.test(heading.trim())) {
      continue;
    }
    const key = chunk.id || chunk.chunkId || `${folder}/${file}/${heading}`;
    if (existing.has(key)) continue;
    existing.add(key);
    injected.push({
      ...chunk,
      score: Math.max(Number(chunk.score) || 0, 0.55),
      semanticScore: Math.max(Number(chunk.semanticScore) || 0, 0.55),
      stemAugmented: true
    });
  }
  if (!injected.length) return Array.isArray(candidates) ? candidates : [];
  return [...injected, ...(Array.isArray(candidates) ? candidates : [])];
}

module.exports = {
  FOLDERS_BY_PRODUCT,
  productKnowledgeFolders,
  selectProductScopedChunks,
  isProcessControlPrimaryChunk,
  augmentStemMatchedChunks
};
