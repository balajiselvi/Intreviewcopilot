# SAP Activate Methodology & Quality Gates — Security Architecture

Spoken architect style: fluent Senior Principal Architect paragraphs — lead with exact T-codes/tables/utilities; never Decision/Mechanism/Governance/Validation headings.

**Product boundaries:** SAP Activate phases are **Discover → Prepare → Explore → Realize → Deploy → Run**. This is methodology, not the RISE commercial offering and not ASAP. RISE with SAP *uses* Activate as the implementation framework; RACI still comes from the edition-specific Roles & Responsibilities document. Authorization tooling differs by edition: classic PFCG (Private/on-prem) vs Public Edition business roles / IAM apps.

**Anti-surface rule:** Prefer phase exit criteria, security workstream deliverables, and quality-gate evidence over “Activate has six phases” memorization alone.

## Q1: How do you run the Discover phase so security and identity scope are not deferred to Realize?

- **Decision:** In Discover, lock deployment edition, identity planes (IAS/IPS/IAG/GRC), and in-scope LoBs before commercial/build commitment—security is a scope variable, not a later add-on.
- **Mechanism:** Capture: S/4 Public vs Private vs on-prem; whether GRC AC, IAG, or both; IdP strategy (corporate IdP → IAS); SF/Ariba/BTP in scope; clean-core constraints. Produce initial security risk register and high-level access-control principles (least privilege, SoD owner model). Reject vague “we will use SAP standard security” without naming products.
- **Governance:** Discover exit requires Architecture + Security sign-off on edition and identity pattern. Out-of-scope PAM/IAG deferred explicitly with risk acceptance.
- **Validation:** Signed Discover pack lists edition, identity diagram (one page), and in/out of scope security products; no unresolved “TBD PFCG vs business roles” for the chosen edition.

## Q2: What Prepare-phase security workstream setup do you mandate before Explore workshops?

- **Decision:** Prepare establishes governance, environments, admin access, RAID, and RACI—not role build.
- **Mechanism:** Stand up security workstream charter; name role owner / risk owner / control owner model; provision project IAM (DEV access, sandbox SF/IAS); define naming conventions and transport path; load preliminary critical transaction/SoD assumptions; align with Cloud ALM or project tool for quality gates. Confirm Excluded Tasks under RISE R&R (customer-owned application security concept / SSO) if RISE applies.
- **Governance:** No Explore workshop without named security lead and environment access path. Partner vs customer RACI documented.
- **Validation:** Team can log into project systems; RAID has security risks; quality-gate calendar published; R&R mapping for SSO/security concept attached when RISE.

## Q3: How do you execute Explore fit-to-standard so authorization and SoD gaps are backlog items, not verbal assumptions?

- **Decision:** Explore produces a security backlog: process → app/transaction → persona → SoD conflict → control decision (role split vs mitigate vs change process).
- **Mechanism:** In fit-to-standard workshops, capture Fiori apps / TCodes per persona; mark Public Edition restrictions vs Private PFCG objects; run preliminary SoD heat map (GRC/IAG ruleset or spreadsheet interim); record extension impacts on authorization (custom apps need SU24/service auth). Exit Explore with prioritized Realize backlog for roles, MSMP/IAG workflows, and IAS/IPS patterns.
- **Governance:** Fit-gap that creates SoD without a control owner cannot enter Realize as “approved scope.” Clean-core: prefer standard auth over custom.
- **Validation:** Backlog items have persona, object/app, SoD flag, owner; sample workshop minutes show security attendance; edition-specific tool choice confirmed.

## Q4: How do you structure Realize so role build, integrations, and test evidence stay synchronized?

- **Decision:** Realize builds security iteratively with functional config—unit test roles each sprint; do not big-bang roles in the last week.
- **Mechanism:** Build PFCG / business roles per backlog; configure IAS trust, IPS jobs, IAG/GRC connectors; SU24 maintenance for custom; integrate ticketing; execute positive/negative auth tests; defect triage with `STAUTHTRACE` / RBP check / BTP role collection verification as applicable. Maintain transport sync DEV→QAS.
- **Governance:** Definition of Done for a role story includes negative SoD test and transport ID. Direct Production build forbidden.
- **Validation:** Sprint demo shows persona completing task without toxic sibling action; QAS trace evidence stored; open P1 auth defects = 0 for in-sprint scope.

## Q5: What Deploy-phase quality gates do you require for security go/no-go?

- **Decision:** Deploy go-live approval is gated on cutover auth checks, critical access review, firefighter readiness, and rollback of security transports—not only functional UAT sign-off.
- **Mechanism:** Cutover runbook steps: import role transports; user comparison / business role publish; IPS delta; validate break-glass (GRC EAM / IAG PAM); freeze risky admin roles; execute Production smoke auth tests for tier-0 processes; confirm monitoring (audit logs, GRC jobs). Go/no-go checklist includes security lead signature.
- **Governance:** Any open critical SoD without mitigation = automatic no-go or explicit executive risk acceptance. Rollback includes role transport revert plan.
- **Validation:** Checklist complete with evidence links; smoke tests RC/pass; Firefighter checkout tested; IPS/IAS health green; steering records go/no-go decision.

## Q6: How does the Run phase keep Activate from ending at go-live for security operations?

- **Decision:** Run transitions to hypercare SLAs, access certification calendar, defect RCA, and continuous improvement—Activate Run is operationalization, not “project closed.”
- **Mechanism:** Hypercare auth defect queue; knowledge transfer runbooks (SU24, IPS restart, IAG sync); schedule UAR/certification; tune MSMP/IAG agents; close temporary project roles; move standing access to BAU owners.
- **Governance:** Project security admins removed on exit criteria date. Audit evidence retained per SOX/policy retention.
- **Validation:** KT checklist signed; project IDs locked; first BAU access review scheduled; P1 hypercare auth defects trending down.

## Q7: How do you distinguish SAP Activate quality gates from RISE transformation gates without mixing terms?

- **Decision:** Activate quality gates are phase exits (Explore scope locked, Realize test evidence, Deploy readiness). RISE adds transformation/clean-core/responsibility gates from the RISE methodology and contract R&R—they layer on Activate, they do not rename phases.
- **Mechanism:** Maintain two checklists where needed: (A) Activate phase exits, (B) RISE customer vs SAP responsibilities (SSO design Excluded Task, hyperscaler controls, Cloud ALM usage). Clean-core extension decisions recorded in Explore/Realize with auth impact.
- **Governance:** Never tell audit “SAP owns application security” if R&R lists it as customer Excluded Task. Contract overrides slideware.
- **Validation:** RACI row for application security concept cites R&R clause ID; Activate Deploy gate still has customer security signature.

## Q8: How do you manage Activate security risks in RAID across phases?

- **Decision:** Security RAID items carry explicit trigger dates tied to phase gates—risks without a Realize/Deploy owner are invalid.
- **Mechanism:** Examples: late IdP readiness (Prepare/Explore), ruleset gaps (Explore/Realize), SU25 delta overload (Realize), cutover user load errors (Deploy). Each risk: likelihood, impact, mitigation, residual rating, owner. Escalate to steering when Deploy gate threatened.
- **Governance:** Risk acceptance only by named risk owner with expiry. Silent “we will fix in hypercare” for critical SoD rejected at Deploy.
- **Validation:** RAID extract shows security risks linked to gates; closed risks have evidence links; open Deploy-critical risks appear on steering pack.

## Q9: How do you align testing strategy (unit / SIT / UAT / regression) with Activate Realize and Deploy?

- **Decision:** Authorization tests are first-class test cases—positive path, negative SoD path, and regression after every role transport wave.
- **Mechanism:** Unit: single role object checks. SIT: IPS provision → IAS login → app auth. UAT: business persona scripts. Regression: prior defects + critical TCode/app pack. Tools: `STAUTHTRACE`, SF RBP check, BTP cockpit role collections, GRC ARA simulation as in scope.
- **Governance:** UAT sign-off invalid without negative tests for SoD pairs. Test IDs never use `SAP_ALL`.
- **Validation:** Test evidence matrix maps case → persona → result → defect ID; Deploy gate references completed matrix for in-scope processes.

## Q10: What does a Principal Architect answer when asked “where does security sit in Activate”?

- **Decision:** Security is a continuous workstream across all six phases with different deliverables—not a Realize-only build activity and not a Deploy-only checklist.
- **Mechanism:** Summarize: Discover (scope/identity), Prepare (governance/RACI/environments), Explore (persona/SoD backlog), Realize (build/integrate/test), Deploy (cutover/go-no-go), Run (BAU/certification). Name edition-specific tools and identity planes for the engagement.
- **Governance:** Phase exit artifacts required; verbal assurance insufficient for audit or steering.
- **Validation:** Point to the engagement’s phase-exit evidence folders; show one artifact per phase; confirm no phase skipped for security.
