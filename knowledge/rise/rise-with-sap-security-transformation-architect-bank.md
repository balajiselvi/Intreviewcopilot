# RISE with SAP & Cloud Transformation — Security Architecture

Spoken architect style: fluent Senior Principal Architect paragraphs — lead with exact T-codes/tables/utilities; never Decision/Mechanism/Governance/Validation headings.

**Product boundaries:** **RISE with SAP** is a business-transformation / commercial cloud offering framework. **SAP Activate** is the implementation methodology (six phases). They are related, not synonyms. Security RACI comes from edition-specific **Roles & Responsibilities**—many application-security and SSO tasks are **customer Excluded Tasks**. Private Edition ≠ Public Edition tooling.

**Anti-surface rule:** Prefer R&R clause mapping, shared responsibility, clean-core auth impact, and quality gates over “RISE means SAP does security.”

## Q1: How do you explain RISE versus Activate in a security-architect interview?

- **Decision:** RISE frames transformation + cloud operating model; Activate sequences delivery phases; security workstream runs through Activate phases under RISE R&R constraints.
- **Mechanism:** State Discover→Run phases for delivery; cite RISE clean-core/quality-gate additions; pull SSO/application-security ownership from current R&R PDF for the edition (Private/Public). Do not invent SAP-owned app role design if Excluded Task.
- **Governance:** Contract R&R overrides marketing slides. Misstated RACI is a delivery risk.
- **Validation:** Point to R&R line IDs for security concept/SSO; Activate phase-exit checklist still has customer security signature.

## Q2: How do you map customer vs SAP vs partner security responsibilities under RISE?

- **Decision:** Build a RACI from the contracted R&R: infrastructure vs application security vs identity provider integration are different rows.
- **Mechanism:** Extract tasks: hyperscaler/infra controls, SAP standard services, customer application security concept, SSO design/implementation, AD/IdP integration. Assign partners only where contract allows. Document gaps as project risks.
- **Governance:** Steering reviews RACI before Realize. Scope creep of “SAP will build roles” challenged with R&R.
- **Validation:** Workshop minutes show RACI agreement; RAID entry for any unclear row; no delivery plan assumes SAP builds PFCG if excluded.

## Q3: How do you design identity, network, and technical-user connectivity for RISE Private Edition?

- **Decision:** IAS as SAP-facing IdP hub; corporate IdP upstream; Cloud Connector / private connectivity for hybrid; technical users vaulted; Principal Propagation where interactive cloud→on-prem calls need user context.
- **Mechanism:** IAS trusts; BTP destinations; Cloud Connector mappings least privilege; PAM for OS/DB if in customer scope; S/4 technical users Communication type. Align with hyperscaler network patterns approved for the engagement.
- **Governance:** CC exposure review. Secrets not in partner mail. Shared-responsibility for network vs app authz clear.
- **Validation:** SSO to S/4/Fiori; CC deny excess; technical user type correct; propagation test user mapped.

## Q4: How do you drive role redesign and remediation in a RISE conversion/migration?

- **Decision:** Conversion triggers simplification + Fiori successors + SoD reassessment—role remediation is on the critical path, not hypercare debt.
- **Mechanism:** SU25/delta for Private; business-role redesign for Public; map obsolete TCodes; rebuild catalogs; update GRC/IAG rulesets; test personas. Clean-core: reduce custom auth surface.
- **Governance:** Deploy gate blocked on open critical SoD without acceptance. Business owns process sign-off.
- **Validation:** Persona UAT on successors; ARA/IAG simulation; obsolete access removed; evidence in cutover pack.

## Q5: How do you apply clean-core principles to security design under RISE?

- **Decision:** Prefer standard auth and released APIs; side-by-side BTP extensions with XSUAA; avoid core modifications that create unmaintainable Z-auth.
- **Mechanism:** Extension ADR; SU24 for unavoidable custom; BTP scopes + propagation; document upgrade impact. Reject wildcard Z* TCode ranges in business roles.
- **Governance:** Clean-core review board includes Security. Exceptions time-bound.
- **Validation:** Extension uses scoped call; custom entry has proposals; upgrade regression set includes extension auth.

## Q6: How do you use Cloud ALM and quality gates for security readiness?

- **Decision:** Security tasks and defects tracked in the program tool (Cloud ALM or equivalent) with Activate/RISE gates—not spreadsheet-only.
- **Mechanism:** Link role stories, IAS/IPS tasks, IAG config, test evidence to gates; report blockers to steering; align with cutover checklist.
- **Governance:** Gate exit requires Security lead status. Red security gate = no go without executive acceptance.
- **Validation:** Gate dashboard shows security artifacts linked; sample defect trail from find→fix→retest.

## Q7: How do you plan test, cutover, and operational readiness for security on RISE?

- **Decision:** Auth tests in Realize; cutover imports/publish; Production smoke; hypercare SLAs; BAU ownership transfer—including IdP and break-glass.
- **Mechanism:** Test matrix; transport sequence; IPS freeze/thaw; Firefighter/PAM ready; monitoring (audit logs, sync jobs). Rollback of security transports defined.
- **Governance:** Go/no-go checklist includes critical access review. Project admins removed post-hypercare.
- **Validation:** Smoke pass; leaver test; sync green; KT signed; R&R-aligned ops contacts listed.

## Q8: How do you handle incident and shared-responsibility security events post-go-live?

- **Decision:** Classify events: hyperscaler/SAP infra vs customer app/IdP vs partner iFlow—route to correct party per R&R without delaying containment.
- **Mechanism:** Runbooks with contact trees; preserve logs; revoke access; rotate secrets; engage SAP support channels when infra. Customer owns app role misuse response.
- **Governance:** Sev-1 access incident SLA. Post-incident review updates RACI if gaps found.
- **Validation:** Tabletop exercise completes; correct party engaged; evidence retained.

## Q9: How do you communicate RISE security risk to executives without false assurance?

- **Decision:** Report residual risk, open SoD, RACI gaps, and gate status—never “RISE makes us compliant.”
- **Mechanism:** Steering pack: risk heat map, Excluded Task completion %, test coverage, break-glass readiness. Tie asks to Deploy gate.
- **Governance:** Risk acceptance recorded with owner/expiry. No verbal-only acceptance for critical access.
- **Validation:** Steering minutes show decision; RAID updated; Deploy checklist mirrors decisions.

## Q10: What evidence pack proves RISE security transformation readiness?

- **Decision:** R&R-mapped RACI, identity diagram, role remediation evidence, gate artifacts, and operational runbooks.
- **Mechanism:** Document set in program repository; sample SSO; SoD report; CC inventory; PAM/EAM proof; Activate phase exits for security.
- **Governance:** Audit can request Excluded Task completion evidence from customer.
- **Validation:** Walkthrough RACI→SSO→role→SoD→cutover; each hop has artifact ID.
