# SAP Project Management & Delivery Governance — Security Workstream

Spoken architect style: Decision → Mechanism → Governance → Validation.

**Product boundaries:** PMP-style delivery controls applied to SAP security/IAM programs. Complements Activate phase banks and product technical banks. STAR stories must not invent employers, metrics, or customers—use methodology framing when experience is not supplied.

**Anti-surface rule:** Prefer RAID triggers, quality gates, RACI, and go/no-go criteria tied to security evidence over soft leadership platitudes.

## Q1: How do you define scope and charter for a security/IAM workstream?

- **Decision:** Charter states in-scope systems/editions, identity planes, SoD tool, deliverables, and exclusions before Explore workshops scale.
- **Mechanism:** Scope statement; success metrics (e.g., critical SoD open=0 at Deploy); assumptions; constraints (RISE R&R). Align to program WBS.
- **Governance:** Scope change via CR only. Silent add of Ariba/IAG mid-Realize escalated.
- **Validation:** Signed charter; WBS nodes for security; exclusion list present.

## Q2: How do you plan WBS, estimates, and milestones for role build and IAM?

- **Decision:** Estimate by persona waves + connector onboard + ruleset + test—not by “number of roles” alone.
- **Mechanism:** WBS: standards, matrix, build waves, IAS/IPS, IAG/GRC, test, cutover, KT. Dependencies on functional config and IdP. Milestones = Activate gates.
- **Governance:** Contingency for SU25/ruleset unknowns. Partner vs customer capacity in plan.
- **Validation:** Plan shows dependencies; critical path includes IdP; gate dates match steering calendar.

## Q3: How do you run RAID for security risks and dependency delays?

- **Decision:** Every security risk has trigger date linked to a gate; vendor/IdP delays automatically escalate before Deploy.
- **Mechanism:** RAID log; likelihood/impact; mitigation; residual; owner. Examples: IdP not ready, ruleset gaps, CC delay, open critical SoD.
- **Governance:** “Fix in hypercare” banned for Deploy-critical SoD. Risk acceptance written.
- **Validation:** RAID extract in steering pack; closed risks have evidence; overdue mitigations escalated.

## Q4: How do you establish RACI across Security, Basis, Functional, Audit, and Partners?

- **Decision:** RACI per deliverable (role design, SSO, Firefighter, ruleset, evidence)—especially under RISE Excluded Tasks.
- **Mechanism:** Matrix workshop; map to R&R; publish; revisit at Realize start. Clarify who runs SU25 vs who approves org values.
- **Governance:** Two Accountables for same task forbidden. Gaps become RAID.
- **Validation:** Sample task has one A; R&R citation where RISE; team quiz pass.

## Q5: How do you manage budget, partner coordination, and commercial constraints for security?

- **Decision:** Security capacity and license (IAG/GRC/PAM) are explicit cost lines; partner role-build quality gates prevent rework burn.
- **Mechanism:** Forecast role waves; license checks; SOW acceptance criteria (negative tests included); change orders for scope adds.
- **Governance:** Partner deliverables rejected without evidence. Commercial constraint communicated early if tooling cut.
- **Validation:** SOW checklist; rejected sample pack; forecast vs actual burn visible.

## Q6: How do you run steering communication for security without false green status?

- **Decision:** Status = gate readiness + open critical risks + test coverage—not “roles in progress” alone.
- **Mechanism:** One-page: RAG, top risks, decisions needed, evidence links. Separate issue vs risk. Ask for decisions with dates.
- **Governance:** Green requires evidence. Verbal green overruled by open critical SoD.
- **Validation:** Steering minutes capture decisions; RAID updated same day; RAG matches evidence.

## Q7: How do you apply Agile/sprint patterns to security build safely?

- **Decision:** Sprint role waves with Definition of Done (FE+BE+negative test+transport); SoD simulation each sprint—not only waterfall big-bang.
- **Mechanism:** Backlog from matrix; sprint review demos persona; defect SLA; freeze before Deploy.
- **Governance:** DoD enforced. Spike for unknown SU25 sized. No Production hotfix as sprint norm.
- **Validation:** Sprint burndown of auth defects; DoD audit sample; demo recordings/evidence.

## Q8: How do you control change requests impacting authorization or identity?

- **Decision:** CRs assessed for SoD, provisioning, and cutover impact before approval—functional-only approval insufficient.
- **Mechanism:** Impact template: systems, roles, ruleset, IPS, test effort, gate impact. Security Architect signs.
- **Governance:** Emergency CR path with dual approval. Scope board rejects incomplete impacts.
- **Validation:** Sample CR with security section; rejected CR without SoD assessment; schedule updated.

## Q9: How do you define go/no-go and production readiness for security?

- **Decision:** Checklist: transports, smoke, SoD, break-glass, IdP/IPS health, rollback, KT plan, residual risks accepted.
- **Mechanism:** Deploy gate meeting; evidence links; Security lead vote. No-go triggers remediation plan with date.
- **Governance:** Executive acceptance required to override no-go on critical access. Documented.
- **Validation:** Completed checklist; signatures; override letter if any; hypercare staffing confirmed.

## Q10: How do you run post-implementation review for the security workstream?

- **Decision:** PIR measures defect root causes by plane, gate effectiveness, RACI gaps, and improvement backlog—no fabricated savings claims.
- **Mechanism:** Data from ITSM/GRC/IPS; workshops; actions with owners. Feed BAU continual improvement.
- **Governance:** Actions tracked to closure. Lessons shared to next program.
- **Validation:** PIR published; actions in backlog tool; follow-up review scheduled.
