/**
 * Structured recall cards from:
 * "SAP IAM & Security Technical Expertise Documentation - Balaji Chandran.docx"
 * plus rehearsed spoken scripts for a hands-on technical deep-dive.
 * Never invent employers, countries, or partners.
 */
const EXPERIENCE_CARDS = [
  {
    id: "s4-blueprint",
    tags: ["blueprint", "hana cloud", "cds"],
    project: "Enterprise S/4HANA security / role architecture (unnamed client in the expertise document)",
    role: "SAP IAM & Security specialist — security blueprint and role architecture",
    context: "S/4HANA landscapes requiring PFCG plus Fiori catalog/space/page authorizations and HANA Cloud security models.",
    problem: "Multi-layer S/4 security (backend objects, Fiori content, CDS row-level) must be designed together.",
    responsibility: "Designed and audited security blueprints, PFCG roles, Fiori launchpad catalog/space authorizations, S/4 HANA Cloud security models.",
    actions: ["PFCG role design", "Fiori catalog/space/page mapping", "HANA Cloud security model work"],
    decision: "Treat Fiori content and PFCG as one business-role model, not separate catalogs of tiles vs objects.",
    why: "Launchpad visibility without backend authorization (or the reverse) fails UAT and SoD.",
    governance: "Blueprint as the audit/build baseline for role build.",
    result: "Documented as capability; no named employer or country in this document.",
    terms: ["PFCG", "Fiori catalogs", "spaces/pages", "S_SERVICE", "CDS"],
    followUps: ["Where does CDS/DCL sit vs catalog?", "Who owns SU24?"],
    strength: "direct"
  },
  {
    id: "rationalize-ecc-s4",
    tags: ["rationaliz", "st03", "st10", "excel", "10000", "10,000", "legacy", "ecc", "redesign", "migrat", "composite"],
    project: "Major enterprise S/4HANA transformation — ECC 6.0 legacy role cleanup (Example 1)",
    role: "Role architecture / rationalization / Fiori mapping / UAT auth tracing",
    context: "Legacy ECC with thousands of unmaintained over-privileged custom roles and broad S_TABU_DIS / direct T-code assignments.",
    problem: "Legacy roles did not match Fiori apps: SU53 dumps, access gaps, SoD in finance and logistics.",
    responsibility: "Usage mining, clean task-role design, Excel-based remediation across 10,000+ user records, UAT tracing without widening access.",
    actions: [
      "ST03N and ST10 over a 90-day window",
      "Filter T-codes not executed in over a year",
      "PFCG single task roles mapped to Fiori catalogs, spaces, and pages",
      "Excel Power Query across 10,000+ user records",
      "TRACEUSER, ST01, STAUTHTRACE in UAT"
    ],
    decision: "Usage-based clean-core task roles instead of copying ECC composites into S/4.",
    why: "Copied ECC roles recreate SoD and unused T-codes on Fiori.",
    governance: "Eliminate critical default SoD before go-live; no broad grants to pass UAT.",
    result: "Speak about 20 to 25 percent custom role reduction. Zero security-related hypercare access downtime if asked about go-live quality.",
    spoken: "Instead of lifting and shifting legacy ECC composite roles, which usually carry broad permissions like S_TABU_DIS, I ran ST03N and ST10 over 90 days. I purged T-codes that hadn't been touched in a year. I built single task-based PFCG roles mapped to Fiori catalogs, spaces, and pages. Using Excel Power Query on 10,000 plus user records, I cut redundant custom roles by about 20 to 25 percent with zero security-related hypercare access downtime. That S/4 security work sits in my Dover IAG/IAS/IPS and S/4 Cloud scope.",
    employer: "Dover Corporation",
    terms: ["ST03N", "ST10", "PFCG", "S_TABU_DIS", "Power Query", "STAUTHTRACE"],
    followUps: ["How did you prove usage?", "What did you do with composites?", "Why not 35 percent?"],
    strength: "direct",
    verify: ["20-25% role reduction", "90-day ST03N/ST10", "T-codes unused over a year"]
  },
  {
    id: "fiori-auth-dump",
    tags: ["blank tile", "access dump", "su53", "su56", "pfud", "stauthtrace", "s_service", "odata"],
    project: "S/4 Fiori UAT / hypercare authorization dumps (same transformation as Example 1)",
    role: "Hands-on auth tracing — frontend catalog plus backend objects",
    context: "Users hit dumps or blank tiles after Fiori go-live.",
    problem: "SU53 shows only the last failed check and is often misleading.",
    responsibility: "Separate catalog assignment from backend OData and table checks; refresh stale buffers.",
    actions: [
      "Confirm tile catalog on the front-end user role",
      "STAUTHTRACE or ST01 while the user reproduces",
      "Catch missing S_SERVICE (OData) or S_TABU_NAM",
      "SU56 authorization buffer, PFUD user comparison"
    ],
    decision: "Never treat SU53 as sufficient for Fiori.",
    why: "Blank tile is often catalog; dump is often S_SERVICE or table object; stale buffer looks like a role gap.",
    governance: "Fix the missing object or catalog; do not widen ACTVT to pass UAT.",
    result: "No percentage. Speak the trace sequence.",
    spoken: "I never rely solely on SU53 because it only shows the last failed check, which can be misleading. First I verify the tile catalog is assigned to the front-end user role. Next I run STAUTHTRACE or ST01 in the backend while the user reproduces the issue to catch missing OData services on S_SERVICE or missing table objects on S_TABU_NAM. If the authorization buffer is stale, I check SU56 and run a user comparison via PFUD.",
    terms: ["SU53", "STAUTHTRACE", "ST01", "S_SERVICE", "S_TABU_NAM", "SU56", "PFUD"],
    followUps: ["Frontend vs backend role?", "When is SU24 involved?"],
    strength: "direct"
  },
  {
    id: "clean-core-su24",
    tags: ["clean core", "cleancore", "role bloat", "su24", "derived role", "direct t-code"],
    project: "Ongoing S/4 role hygiene after rationalization",
    role: "Role governance — stop bloat after go-live",
    context: "Custom roles grow back if SU24 and composites are sloppy.",
    problem: "Direct T-codes and overlapping composites recreate S_TABU_DIS-style width.",
    responsibility: "Single functional roles, derived org structure, SU24 defaults kept current.",
    actions: [
      "Single functional PFCG roles with derived organizational variants",
      "No direct T-code assignment; no overlapping composites",
      "Custom authorization object changes updated in SU24 so PFCG stays consistent across DEV QA PRD"
    ],
    decision: "SU24 is the standardization layer, not a one-time migration artefact.",
    why: "Without SU24, every landscape rebuilds objects differently and bloat returns.",
    governance: "Role maintenance standard across the transport path.",
    result: "No percentage. Speak SU24 and derived roles.",
    spoken: "I enforce single functional roles with clear organizational derived role structures. I avoid assigning direct T-codes or composite roles with overlapping authorization objects. Any custom authorization object changes must be updated in SU24 defaults so PFCG role maintenance stays standardized across dev, test, and prod.",
    terms: ["SU24", "derived roles", "PFCG"],
    followUps: ["Who approves SU24 changes?", "How do you stop emergency composites?"],
    strength: "direct"
  },
  {
    id: "iag-ias-ips-sf",
    tags: ["iag", "ias", "ips", "successfactors", "jml", "scim", "joiner", "leaver", "mover", "onboard", "provisioning", "identity provision"],
    project: "Global cloud-first IAM across on-prem S/4, SuccessFactors, BTP (Example 2)",
    role: "IAM architecture — IAG on BTP, IAS SSO, IPS provisioning, JML from SF",
    context: "Inconsistent identity stores; slow onboarding; manual access requests.",
    problem: "No unified lifecycle; delayed joiners; no cloud SoD visibility.",
    responsibility: "IAS as IdP; IPS as provisioning; IAG as governance; JSON transforms; JML from SuccessFactors.",
    actions: [
      "SuccessFactors as IPS source on BTP",
      "Custom JSON transformation mapping SCIM attributes",
      "Joiner: IAS account for federated SSO plus S/4 baseline single roles",
      "Leaver: HR termination triggers IPS revoke/lock on IAS, ABAP, and BTP"
    ],
    decision: "IAS authenticates; IPS provisions; IAG governs; S/4 still enforces PFCG.",
    why: "One store cannot own authn, provision, and SoD.",
    governance: "High-risk access still goes through IAG request and analysis, not a silent IPS dump.",
    result: "Onboarding SLA from about 3 days to under 30 minutes. Immediate leaver revocation. Do not say 100 percent automated or 15 minutes.",
    spoken: "At Dover, SuccessFactors is the HR source and IPS executes JML. I only create the IAS account and baseline S/4 roles when the hire is effective, not merely because an HR row exists. Movers get new access and explicit revoke of the old. Leavers are deprovisioned through IPS across IAS, S/4, BTP, and SAC in that lifecycle — not a Friday SU01 lock and not wait until Monday. Onboarding SLA from about 3 days to under 30 minutes.",
    employer: "Dover Corporation",
    terms: ["IAS", "IPS", "IAG", "SCIM", "JSON transformation", "SuccessFactors"],
    followUps: ["What does IPS not decide?", "Did SF RBP change or only HR attributes?", "What was the baseline role type?"],
    strength: "direct",
    verify: ["3 days to under 30 minutes", "baseline single roles not a wide composite dump"]
  },
  {
    id: "identity-planes",
    tags: ["overlap", "work together", "difference between ias", "ias vs", "ips vs", "iag vs"],
    project: "Identity-plane teaching answer (same landscape as Example 2)",
    role: "Clarify IAS vs IPS vs IAG vs application enforcement",
    context: "Interviewers often treat Cloud Identity products as one overlapping suite.",
    problem: "If planes blur, JML and SoD answers collapse into a product list.",
    responsibility: "Keep four planes distinct in every follow-up.",
    actions: ["IAS: authentication, SSO, MFA", "IPS: SCIM provisioning", "IAG on BTP: access request, SoD analysis, PAM, certification", "Target app: PFCG or equivalent enforcement"],
    decision: "Do not say the products overlap.",
    why: "Each plane fails differently in production.",
    governance: "IAG decides if access should exist; IPS only executes; IAS only authenticates.",
    result: "No metric.",
    spoken: "They have distinct jobs. IAS is the identity provider for authentication, SSO, and MFA. IPS is the sync engine that executes SCIM provisioning. IAG sits on BTP as governance: access requests, SoD analysis, privileged access, and certification. S/4 still enforces in PFCG. That IAG/BTP stack is what I run at Dover. It is not SAP IDM 8.0 from Eminnov — IDM uses Developer Studio passes, not IAG modules.",
    employer: "Dover Corporation (planes); Eminnov only if they ask IDM 8.0",
    terms: ["IAS", "IPS", "IAG"],
    followUps: ["Where does Entra ID sit?", "Does IAG provision?"],
    strength: "direct"
  },
  {
    id: "ias-federation",
    tags: ["federation", "saml", "oidc", "okta", "azure ad", "entra", "nameid", "mfa conditional"],
    project: "IAS trust with enterprise IdP (Dover)",
    role: "IAS authentication / federation",
    context: "Corporate IdP is Azure AD or Okta; SAP apps consume IAS.",
    problem: "Wrong NameID or missing MFA policy looks like an IPS provisioning failure.",
    responsibility: "SAML 2.0 or OIDC trust, attribute mapping, conditional MFA. IAS authenticates only.",
    actions: [
      "SAML 2.0 or OIDC trust between Azure AD/Okta and IAS",
      "Map email or employee ID as NameID",
      "MFA conditional policies on the IdP/IAS side"
    ],
    decision: "Federation is an IAS job. Group-to-role sync is IPS. SoD is IAG.",
    why: "SSO outages are trust/certificate/NameID, not PFCG.",
    governance: "Do not grant access inside IAS to compensate for a failed SAML assertion.",
    result: "No percentage.",
    spoken: "At Dover I set IAS as the SAP authenticating IdP federated to Azure AD or Okta over SAML 2.0 or OIDC. We mapped email or employee ID as the NameID and put MFA on conditional policies. IPS still provisions the account; IAG still governs the request. If SSO fails I look at trust, certificates, and NameID, not at PFCG.",
    employer: "Dover Corporation",
    terms: ["IAS", "SAML 2.0", "OIDC", "Azure AD", "Okta"],
    followUps: ["What if Entra is already the enterprise IdP?", "Where is MFA enforced?"],
    strength: "direct"
  },
  {
    id: "idm80-eminov",
    tags: ["idm 8", "idm8", "developer studio", "idm 7", "repository type", "idm pass", "nw idm"],
    project: "SAP IDM 8.0 at Eminnov Technologies",
    role: "IDM 8.0 developer / connector work, plus IPS/IAS deployment",
    context: "On-prem IDM 8.0 identity store and custom connectors, then early IPS/IAS.",
    problem: "Interviewers collapse IDM 8.0 into IAG on BTP.",
    responsibility: "Developer Studio jobs: Passes, Scripts, Constants, Variants, JavaScript payload parsing for custom connectors and repository types.",
    actions: [
      "IDM 8.0 Developer Studio",
      "Passes, Scripts, Constants, Variants",
      "JavaScript payload parsing for custom connectors",
      "Repository types; later IPS/IAS deployment — still not IAG"
    ],
    decision: "Speak IDM 8.0 as its own stack. Do not call it IAG or IPS Admin UI.",
    why: "A follow-up on IAG Access Analysis will expose mixing the products.",
    governance: "IDM approvals are IDM workflow, not IAG Access Request.",
    result: "No IAG metric on this card.",
    spoken: "At Eminnov I worked SAP IDM 8.0 in Developer Studio — passes, scripts, constants, variants, and JavaScript to parse payloads for custom connectors and repository types. We also deployed IPS and IAS there. That is not the Dover IAG-on-BTP stack. IAG does access request and SoD; IDM 8.0 does not become IAG by renaming it.",
    employer: "Eminnov Technologies",
    terms: ["IDM 8.0", "Developer Studio", "Passes", "Variants"],
    followUps: ["IDM 8.0 vs IPS jobs?", "Did you run IAG at Eminnov?"],
    strength: "direct"
  },
  {
    id: "azure-idaas-fabtech",
    tags: ["idaas", "fabtech", "azure cloud", "hybrid identity", "srm", "grc blueprint"],
    project: "Fabtech International — HCM integration and Azure IDaaS analysis",
    role: "HCM-ECC integration, GRC blueprinting, Azure IDaaS option analysis",
    context: "SAP HCM feeding ECC, BI, SRM, CRM; evaluating Azure as IDaaS for hybrid identity.",
    problem: "On-prem AD plus multiple SAP backends without a single lifecycle.",
    responsibility: "HCM integration; GRC Access Control blueprint of that era; Azure IDaaS analysis bridging AD, HCM, ECC/SRM/CRM.",
    actions: [
      "SAP HCM integration to ECC, BI, SRM, CRM",
      "GRC Access Control blueprinting (not IAG)",
      "Azure Cloud IDaaS analysis for hybrid AD plus SAP backends"
    ],
    decision: "Treat this as hybrid identity strategy and classic GRC, not as IAG on BTP.",
    why: "Fabtech predates the Dover IAG/BTP work.",
    governance: "GRC blueprint is the governance artefact of that period.",
    result: "No IAG metric.",
    spoken: "At Fabtech I integrated SAP HCM with ECC, BI, SRM, and CRM, and did GRC Access Control blueprinting. I also analysed Azure Cloud IDaaS as a hybrid identity option between on-prem AD, HCM, and those SAP backends. That was not IAG on BTP — IAG and IPS JSON at Dover came later.",
    employer: "Fabtech International",
    terms: ["SAP HCM", "GRC", "Azure IDaaS"],
    followUps: ["What did Azure replace?", "Was IAG in that landscape?"],
    strength: "direct"
  },
  {
    id: "joule",
    tags: ["joule"],
    project: "Not a case study",
    role: "Capability awareness only",
    context: "Joule is mentioned for AI role recommendations under IAG/RISE, without a documented implementation story.",
    problem: "No scenario, client, or outcome documented.",
    responsibility: "PERSONAL EXPERIENCE DETAIL NOT EXPLICITLY DOCUMENTED beyond awareness.",
    actions: [],
    decision: "Awareness then pivot.",
    why: "Inventing a Joule tenant will not survive a JSON/config follow-up.",
    governance: "",
    result: "Do not claim a Joule programme.",
    spoken: "I treat Joule as an assistive layer in IAG for role recommendations and natural-language requests. Core policy, SoD, and enforcement stay in IAG and the target app. In RISE I separate customer-owned role, IAM, and governance design from SAP-managed cloud operations. My hands-on depth is IAG rulesets, IPS JSON, IAS SSO, and S/4 PFCG, not a Joule tenant I can click through.",
    terms: ["Joule"],
    followUps: ["What exactly did you configure in Joule?"],
    strength: "thin",
    verify: ["Any real Joule tenant work"]
  },
  {
    id: "sod-audit",
    tags: ["sod", "grc", "ruleset", "false positive", "actvt", "s_tabu_nam", "access analysis"],
    project: "Audit-driven multi-system SoD and privileged-access remediation (Example 3)",
    role: "SoD ruleset, role remediation, access certification",
    context: "External auditors flagged SoD governance gaps.",
    problem: "Outdated ruleset with thousands of false positives at S_TCODE level.",
    responsibility: "Tune IAG/GRC to object and field; remediate PFCG; mitigate only with named owners.",
    actions: [
      "IAG Access Analysis at object and field: ACTVT 01/02 vs 03, S_TABU_NAM not T-code-only",
      "Risk analysis at both role and user level",
      "PFCG redesign of conflict roles"
    ],
    decision: "Remediate where possible; mitigate only with named owner and evidence.",
    why: "False-positive rulesets destroy business trust.",
    governance: "External audit evidence; manager attestation.",
    result: "70 to 80 percent reduction in unmitigated / false-positive SoD.",
    spoken: "False positives happen when rulesets check broad S_TCODE access instead of granular field permissions. I fine-tune the IAG ruleset down to authorization objects and field values, specifically isolating ACTVT 01 and 02 create/change from 03 display. I also run risk analysis at both role and user levels. That usually clears 70 to 80 percent of unmitigated false positives.",
    terms: ["ACTVT", "S_TABU_NAM", "IAG Access Analysis"],
    followUps: ["Who accepted residual risk?", "How did you cut false positives?"],
    strength: "direct",
    verify: ["70-80% unmitigated/false-positive reduction", "ACTVT create/change vs display"]
  },
  {
    id: "mitigating-controls",
    tags: ["mitigat", "cannot be removed", "business-critical", "residual", "plant manager"],
    project: "Same SoD programme as Example 3 — residual operational conflicts",
    role: "Control design with business owners",
    context: "Some plant-level conflicts are operationally required.",
    problem: "Removing the access would break the process.",
    responsibility: "Document mitigating controls in IAG with a named owner and evidence trail.",
    actions: [
      "Formal mitigating control in IAG",
      "Secondary supervisor review workflow",
      "Automated audit logging for external auditors"
    ],
    decision: "Do not leave unmitigated residual risk because the process needs the access.",
    why: "Auditors accept documented, owned, evidenced mitigations; they do not accept silent exceptions.",
    governance: "Named control owner in IAG.",
    result: "No extra percentage beyond the 70-80 percent cleanup of false positives.",
    spoken: "When a conflict is operationally necessary, like a local plant manager who must process and approve emergency purchases, I design formal mitigating controls. We document specific supervisory review workflows, assign the mitigating control owner in IAG, and keep automated audit logging so it stays defensible for external auditors.",
    terms: ["mitigating control", "IAG"],
    followUps: ["Who is the control owner?", "What is the review frequency?"],
    strength: "direct"
  },
  {
    id: "firefighter-pam",
    tags: ["firefighter", "eam", "pam", "privileged", "emergency access"],
    project: "Privileged access / Firefighter in production (Example 3)",
    role: "EAM configuration and log-review governance",
    context: "Firefighter without reason codes and log review fails audit.",
    problem: "Unreviewed privileged sessions.",
    responsibility: "IAG Emergency Access Management with workflow, reason, ticket, and 24-hour log sign-off.",
    actions: [
      "IAG EAM with workflow approval",
      "Firefighter ID requires reason code and ticket ID before activation",
      "Session traces logged; auto report to secondary supervisor for sign-off within 24 hours"
    ],
    decision: "No firefighter without a ticket and a reviewer.",
    why: "Unreviewed FF is an audit finding even if SoD roles are clean.",
    governance: "Mandatory supervisor sign-off within 24 hours.",
    result: "No landscape-wide metric. Speak the control design.",
    spoken: "We configure Emergency Access Management in IAG with strict workflow approvals. Firefighter IDs require a mandatory reason code and ticket ID before activation. Session activity is logged, and an auto-generated log report goes to the designated secondary supervisor for mandatory sign-off within 24 hours.",
    terms: ["EAM", "Firefighter", "IAG PAM"],
    followUps: ["What if the supervisor misses 24 hours?", "FF ID vs FF role?"],
    strength: "direct"
  },
  {
    id: "ips-sync-hypercare",
    tags: ["ips", "regex", "hypercare", "delta", "sync", "lockout", "json payload"],
    project: "Hypercare stabilization — IPS/IAS sync failures affecting BTP and SAC (Example 4)",
    role: "Identity-sync incident owner during hypercare",
    context: "Delta syncs failed; SAC and BTP authorization locks.",
    problem: "Special characters in org-unit strings corrupted JSON payloads.",
    responsibility: "IPS job/SCIM payload RCA; regex sanitization; skip-record not fail-batch.",
    actions: [
      "IPS execution logs and HTTP SCIM traces",
      "Regex sanitize org-unit special characters in JSON transforms",
      "Skip corrupt records; do not abort full batch"
    ],
    decision: "Fix the transform and isolation, not disable delta sync.",
    why: "Batch abort on one bad HR attribute takes down provisioning.",
    governance: "Ongoing monitoring of hybrid identity sync.",
    result: "Zero cloud identity-sync downtime in that hypercare window after skip-record handling. Do not claim the whole landscape had zero incidents.",
    spoken: "During hypercare at Dover, hourly IPS delta syncs started failing and caused SAC and BTP authorization locks. I inspected IPS logs and SCIM HTTP payloads and found special characters in org-unit strings corrupting JSON. I added regex sanitization in the IPS transform, skip-record handling so one bad row does not abort the batch, plus failure alerts and Excel reconciliation to prove data integrity.",
    employer: "Dover Corporation",
    terms: ["SCIM", "delta sync", "IPS JSON transformation"],
    followUps: ["IAS vs IPS in this failure?", "Why SAC not PFCG?", "What was the exact attribute?"],
    strength: "direct",
    verify: ["exact attribute name", "which landscape"]
  },
  {
    id: "sac-security",
    tags: ["analytics cloud", "sac story", "sac team", "sac go-live"],
    project: "Enterprise analytics IAM — SAC as a consuming app",
    role: "Enterprise security architect — SAC in the IAM landscape",
    context: "SAC with S/4, Datasphere, BW, BTP. IAM planes are hands-on; not every SAC tenant toggle.",
    problem: "Story access treated as data authorization.",
    responsibility: "Separate authentication, SAC content/teams, and underlying data security.",
    actions: ["IAS federation for SAC SSO", "IPS provisions SAC users", "SAC teams/stories are SAC's model", "Align Datasphere data controls when SAC consumes Datasphere"],
    decision: "A SAC story permission is not Datasphere or S/4 data authorization.",
    why: "Login success is not story access.",
    governance: "IAG can govern the request; SAC enforces content.",
    result: "No S/4 role-cut metric.",
    spoken: "My SAC work sits in enterprise IAM, not as a SAC-only consultant. I authenticate through IAS, provision with IPS, and keep SAC teams and stories separate from Datasphere or S/4 data rights. If login works but a story fails, I check team and content, then the model, then the source — I do not just assign a wider role.",
    employer: "Dover Corporation for IAS/IPS/IAG; SAC enforces content",
    terms: ["SAC teams", "IAS", "IPS"],
    followUps: ["SAC vs Datasphere?", "Go-live checks?"],
    strength: "direct"
  },
  {
    id: "datasphere-security",
    tags: ["datasphere", "space-level", "data platform"],
    project: "Datasphere data-platform security in the analytics landscape",
    role: "Security architecture — data access vs consumption",
    context: "Multi-cloud role blueprint; not a Datasphere admin case study.",
    problem: "Copying SAC teams onto Datasphere spaces.",
    responsibility: "Spaces, object privileges, source connections, sensitive-data boundaries.",
    actions: ["IAS authenticates", "Datasphere space and object permissions", "SAC must not bypass Datasphere finance restrictions"],
    decision: "Datasphere is data platform security; SAC is consumption.",
    why: "A secure story on an open space leaks finance data.",
    governance: "IAG evaluates combined access; Datasphere enforces data.",
    result: "Blueprint plus IAM alignment. No invented tenant metric.",
    spoken: "I treat Datasphere as the data platform, not the identity layer. IAS authenticates, spaces and object privileges control data, and SAC must not offer a path around those restrictions. For sensitive finance data I name the population, apply Datasphere controls, then prove a test user cannot reach it from SAC.",
    employer: "Dover Corporation — IAM plane",
    terms: ["Datasphere spaces", "IAS"],
    followUps: ["How does it sit with BW and S/4?"],
    strength: "direct"
  },
  {
    id: "ariba-iam",
    tags: ["ariba"],
    project: "Ariba as a connected procurement app in enterprise IAM",
    role: "IAM / hybrid integration — not deep Ariba module config",
    context: "Satellite in the multi-cloud role blueprint.",
    problem: "Provisioning success mistaken for correct business access.",
    responsibility: "IAS SSO, IPS SCIM to Ariba, IAG for SoD with procurement.",
    actions: ["IAS SAML for Ariba SSO", "IPS SCIM JML into Ariba groups", "IAG toxic combinations with S/4", "Validate correlation and stale groups"],
    decision: "Ariba groups enforce Ariba. IPS does not decide entitlement.",
    why: "Biggest mistake is stopping at a successful createUser.",
    governance: "SoD is business function, not the product name.",
    result: "Central JML SLA if asked; no Ariba-only invented metric.",
    spoken: "My Ariba depth is enterprise IAM, not every Ariba security switch. I connect Ariba to IAS for SSO and IPS for SCIM JML, and IAG looks at procurement SoD with S/4. A mover or leaver must revoke Ariba groups, not only S/4. Provisioning success is not proof of the right business access.",
    employer: "Dover Corporation — central IAM",
    terms: ["Ariba groups", "IPS", "IAS", "IAG"],
    followUps: ["Ariba SoD with S/4?"],
    strength: "direct"
  },
  {
    id: "car-blueprint",
    tags: ["customer activity repository", "sap car"],
    project: "CAR in a retail-oriented SAP landscape — role blueprint only",
    role: "Enterprise security architecture, not CAR module configuration depth",
    context: "Named in the multi-cloud role blueprint.",
    problem: "Copying S/4 PFCG into CAR.",
    responsibility: "Identity path, CAR app authorization concept, data sensitivity, IAG alignment.",
    actions: ["Do not copy S/4 roles into CAR", "Map processes to CAR app permissions", "IAS authenticates; IPS provisions; IAG governs; CAR enforces"],
    decision: "Common governance, product-specific enforcement.",
    why: "Retail data is not an S/4 company-code role.",
    governance: "IAG sees combined retail plus S/4 risk.",
    result: "Do not claim CAR POS config you cannot defend.",
    spoken: "My CAR exposure is enterprise role-blueprint in a retail landscape, not the same configuration depth as S/4, IAG, IAS, and IPS. I would not copy the S/4 model. I map business functions to CAR app permissions, keep IAS for SSO, IPS for lifecycle, and IAG for governance. CAR still enforces its own authorization.",
    employer: "Speak architecture on the Dover IAM stack; do not invent a CAR client",
    terms: ["CAR", "IAS", "IAG"],
    followUps: ["CAR vs S/4 security?"],
    strength: "thin"
  },
  {
    id: "five-tier",
    tags: ["end-to-end", "role explosion", "same role model"],
    project: "Cross-domain architecture — five planes",
    role: "Principal architect",
    context: "S/4, SF, IAG, IAS, IPS, SAC, Ariba, CAR together.",
    problem: "One technical role cloned into every product.",
    responsibility: "Keep five tiers distinct; map business roles to app entitlements.",
    actions: ["SF lifecycle", "IAS authn", "IPS SCIM", "IAG governance", "App enforcement"],
    decision: "Common business role, application-specific entitlements. Combined access is a governance decision.",
    why: "Identical technical roles explode and hide SoD.",
    governance: "Who should have S/4 plus SAC plus Ariba is IAG plus business, not IAS and not IPS.",
    result: "No extra metric unless they asked JML.",
    spoken: "I split it into five tiers. SuccessFactors is the lifecycle source. IAS authenticates. IPS provisions with SCIM. IAG governs requests, SoD, and PAM. S/4, SAC, Datasphere, Ariba, and CAR each enforce their own model. I use one enterprise business role, not one technical role cloned everywhere. IPS maps entitlements; it does not decide them.",
    employer: "Dover Corporation for the live IAM stack",
    terms: ["business role", "IAS", "IPS", "IAG"],
    followUps: ["Who determines combined access?"],
    strength: "direct"
  },
  {
    id: "ias-not-authz",
    tags: ["can ias authorize"],
    project: "Trap — IAS is not application authorization",
    role: "Authentication vs authorization",
    context: "SAC, Datasphere, Ariba.",
    problem: "IAS treated as who grants stories or groups.",
    responsibility: "Say no; name the enforcing app.",
    actions: ["IAS trust and SSO only"],
    decision: "IAS is not the authorization authority.",
    why: "Principal-architect probe.",
    governance: "IAG still does not replace app enforcement.",
    result: "No metric.",
    spoken: "No. IAS is authentication and trust. It is not the authorization authority for SAC, Datasphere, Ariba, or S/4. Those apps enforce their own models after IPS has provisioned the account and IAG has governed the request.",
    employer: "Dover Corporation",
    terms: ["IAS"],
    followUps: ["Can IPS assign business roles?"],
    strength: "direct"
  },
  {
    id: "ips-not-gov",
    tags: ["can ips assign", "ips as the governance"],
    project: "Trap — IPS is not the governance decision-maker",
    role: "Provisioning vs entitlement",
    context: "IPS can write assignments.",
    problem: "IPS treated as who decides the business role.",
    responsibility: "Provisioning executes approved mappings.",
    actions: ["IAG or role model decides", "IPS executes"],
    decision: "IPS is not the authority for business entitlement.",
    why: "Otherwise SoD is bypassed by a transform.",
    governance: "Risk stays in IAG/GRC.",
    result: "No metric.",
    spoken: "IPS can provision identities, attributes, and target assignments from the mapping. I would not use IPS as the governance decision-maker. The business entitlement and SoD decision sit in the role and IAG model. IPS executes; it does not approve.",
    employer: "Dover Corporation",
    terms: ["IPS", "IAG"],
    followUps: ["Where does the mapping live?"],
    strength: "direct"
  },
  {
    id: "mover-cross-app",
    tags: ["finance to retail", "from finance to"],
    project: "Mover across S/4, SAC, Ariba, CAR",
    role: "JML mover with revoke",
    context: "HR attribute change to Retail.",
    problem: "Adding Retail without dropping Finance.",
    responsibility: "IAG evaluate, IPS provision new, revoke old everywhere.",
    actions: ["SF attribute change", "IAG SoD on Retail", "IPS provision and revoke Finance", "IAG audit evidence"],
    decision: "Revoke is the mover.",
    why: "Privilege accumulation is the SoD event.",
    governance: "One identity, combined access.",
    result: "JML SLA only if they ask timing.",
    spoken: "That is a mover. HR changes the attribute in SuccessFactors, IAG evaluates the Retail business role and SoD, IPS provisions new entitlements on S/4, SAC, Ariba, and CAR, and it must revoke obsolete Finance access so privileges do not accumulate. IAG keeps the audit trail. IAS only authenticates the same person.",
    employer: "Dover Corporation",
    terms: ["mover", "IPS", "IAG"],
    followUps: ["What if Ariba group revoke lags S/4?"],
    strength: "direct"
  },
  {
    id: "data-quality",
    tags: ["excel", "power query", "orphan", "duplicate", "inactive", "data quality", "thousands of user", "parallel workstream"],
    project: "Cross-programme data-quality method for role/user extracts (Section 4)",
    role: "Security data analyst / role-remediation quality gate",
    context: "Migrations fail when assignment extracts are dirty.",
    problem: "Orphans, duplicates, inactive accounts, over-wide ACTVT/BEGRU/BUKRS.",
    responsibility: "Power Query / reconciliation templates; challenge functional assumptions; scrub before migrating security tables.",
    actions: ["Power Query", "dynamic reconciliation templates", "orphan/duplicate/inactive detection", "challenge broad authorization requests"],
    decision: "Do not remediate roles on unreconciled extracts.",
    why: "Dirty data creates false SoD and hides real SoD.",
    governance: "Audit-reproducible filters.",
    result: "No single named programme metric in this section.",
    spoken: "I rely on advanced Excel validation, Power Query and dynamic reconciliation templates, to audit bulk user-role assignments across parallel workstreams. I independently validate inputs, challenge assumptions on broad authorization requests, and scrub redundant or orphaned accounts before migrating security tables.",
    terms: ["Power Query", "ACTVT", "BEGRU", "BUKRS"],
    followUps: ["What was the extract source?", "How did you reconcile to SUIM?"],
    strength: "direct"
  }
];

const PHRASE_BOOSTS = [
  { re: /role redesign|rationaliz|lift.{0,12}shift|st03|st10|legacy ecc|role bloat during.{0,12}migrat/i, id: "rationalize-ecc-s4", pts: 12 },
  { re: /blank tile|access dump|authorization dump|su53|stauthtrace|su56|pfud|odata/i, id: "fiori-auth-dump", pts: 12 },
  { re: /clean core|role bloat|su24|derived role/i, id: "clean-core-su24", pts: 12 },
  { re: /identity provision|user identity|provisioning during|s\/4hana cloud/i, id: "iag-ias-ips-sf", pts: 18 },
  { re: /joiner|leaver|mover|\bjml\b|successfactors|onboard|bukrs|werks/i, id: "iag-ias-ips-sf", pts: 12 },
  { re: /overlap|work together|ias,?\s*ips,?\s*and iag|difference between ias|ias vs|don't their/i, id: "identity-planes", pts: 14 },
  { re: /federat|saml|oidc|okta|azure ad|entra|nameid|conditional mfa/i, id: "ias-federation", pts: 14 },
  { re: /\bidm\b|developer studio|repository type|idm 8|idm8|idm 7/i, id: "idm80-eminov", pts: 16 },
  { re: /idaas|fabtech|hybrid identity|srm\/crm|hcm integration/i, id: "azure-idaas-fabtech", pts: 14 },
  { re: /joule/i, id: "joule", pts: 16 },
  { re: /false.?positive|sod|segregation of dut/i, id: "sod-audit", pts: 10 },
  { re: /cannot be removed|business-critical|mitigat|residual/i, id: "mitigating-controls", pts: 14 },
  { re: /firefighter|privileged access|\bpam\b|emergency access|\beam\b/i, id: "firefighter-pam", pts: 14 },
  { re: /hypercare/i, id: "ips-sync-hypercare", pts: 10 },
  { re: /analytics cloud|\bsac\b|sac story|sac team/i, id: "sac-security", pts: 16 },
  { re: /datasphere/i, id: "datasphere-security", pts: 16 },
  { re: /ariba/i, id: "ariba-iam", pts: 16 },
  { re: /\bcar\b|customer activity/i, id: "car-blueprint", pts: 16 },
  { re: /same role model|role explosion|who determines whether they should have|work together end-to-end|s\/4.{0,80}successfactors.{0,120}(sac|ariba|datasphere)|iag.{0,40}ias.{0,40}ips.{0,40}sac/i, id: "five-tier", pts: 22 },
  { re: /can ias authorize|does ias authorize/i, id: "ias-not-authz", pts: 20 },
  { re: /can ips assign|ips assign the business/i, id: "ips-not-gov", pts: 20 },
  { re: /finance to retail|from finance to retail|changes from finance/i, id: "mover-cross-app", pts: 20 },
  { re: /data quality|power query|thousands of user|orphan|50,000|50000/i, id: "data-quality", pts: 12 }
];

function recallExperience(question = "") {
  const q = String(question).toLowerCase();
  const bonus = {};
  for (const boost of PHRASE_BOOSTS) {
    try {
      if (boost.re.test(question) || boost.re.test(q)) {
        bonus[boost.id] = (bonus[boost.id] || 0) + boost.pts;
      }
    } catch (error) {
      // ignore a single malformed boost; scoring must not throw into /api/chat
    }
  }
  const scored = EXPERIENCE_CARDS.map((card) => {
    let score = bonus[card.id] || 0;
    for (const tag of card.tags) {
      if (q.includes(String(tag).toLowerCase())) score += tag.length > 4 ? 2 : 1;
    }
    return { card, score };
  }).sort((a, b) => b.score - a.score);
  const hits = scored.filter((s) => s.score > 0);
  return {
    strongest: (hits[0] && hits[0].score > 0 ? hits[0].card : null),
    secondary: hits.slice(1, 3).map((h) => h.card),
    allScored: scored
  };
}

function formatMemoryCard(card) {
  if (!card) {
    return "PERSONAL EXPERIENCE DETAIL NOT EXPLICITLY DOCUMENTED in the expertise narrative. Use technical knowledge only, labelled as such.";
  }
  const verify = (card.verify || []).length
    ? `\nVERIFY FROM MEMORY BEFORE SAYING: ${card.verify.join("; ")}`
    : "";
  const spoken = card.spoken
    ? `SPOKEN ANSWER (prefer this wording; stay first-person; no client names):\n${card.spoken}\n`
    : "";
  return [
    spoken,
    "CLAIM CLASSES: CV/DOCUMENT SUPPORTED = PROJECT, EMPLOYER, RESULT, VERIFY lines only. TECHNICAL KNOWLEDGE = T-codes and product mechanics. MEMORY VERIFICATION REQUIRED = any extra incident, partner split, or business-refusal anecdote not written here — omit those.",
    `PROJECT: ${card.project}`,
    `MY ROLE: ${card.role}`,
    `BUSINESS CONTEXT: ${card.context}`,
    `PROBLEM: ${card.problem}`,
    `MY PERSONAL RESPONSIBILITY: ${card.responsibility}`,
    `TECHNICAL ACTIONS: ${card.actions.join("; ") || "(none documented)"}`,
    `KEY DECISION: ${card.decision || "not documented"}`,
    `WHY: ${card.why || "not documented"}`,
    `GOVERNANCE: ${card.governance || "not documented"}`,
    `RESULT (as written in the document): ${card.result}`,
    `KEY TECHNICAL TERMS: ${card.terms.join(", ")}`,
    `LIKELY FOLLOW-UP: ${(card.followUps || []).join(" | ")}`,
    `STRENGTH: ${card.strength}`,
    card.employer ? `EMPLOYER TO NAME IF ASKED CHRONOLOGY: ${card.employer}` : "",
    verify
  ].filter(Boolean).join("\n");
}

module.exports = { EXPERIENCE_CARDS, recallExperience, formatMemoryCard, PHRASE_BOOSTS };
