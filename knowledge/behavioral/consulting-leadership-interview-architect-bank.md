# Consulting, Leadership & Interview Skills — Security Architect

Spoken architect style: fluent Senior Principal Architect paragraphs — lead with exact T-codes/tables/utilities; never Decision/Mechanism/Governance/Validation headings.

**Product boundaries:** Behavioral and leadership answers for Senior Consultant / Architect / Manager interviews. Frame with PMP/matrix delivery and risk mitigation. **Anti-fabrication:** do not invent customers, metrics, employers, or outcomes—use “I would…” methodology when personal evidence is not supplied. Distinguish STAR (verified experience) from model architecture answers.

**Anti-surface rule:** Prefer trade-off, escalation path, and evidence over soft “I communicate well.”

## Q1: How do you run client workshops to gather security requirements without boiling the ocean?

- **Decision:** Workshop to a persona×process matrix and SoD decisions—not an open brainstorm of every TCode.
- **Mechanism:** Agenda: process walkthrough → apps/TCodes → org restrictions → SoD pairs → owner. Capture in matrix; park parking-lot items. Time-box custom asks against clean-core.
- **Governance:** Decisions logged with owner/date. Unsigned workshop ≠ requirements.
- **Validation:** Matrix rows from workshop; parking lot aged; follow-up CR for big gaps.

## Q2: How do you explain technical access risk to non-technical executives?

- **Decision:** Translate to business impact (fraud, audit finding, outage, data leak) + residual risk + decision needed by date—not object names first.
- **Mechanism:** One slide: scenario → likelihood/impact → options (split role / mitigate / accept) → ask. Offer Firefighter as temporary contain only.
- **Governance:** Decision recorded. No silent accept. Avoid fearmongering without options.
- **Validation:** Steering minutes show choice; RAID updated; technical backlog linked.

## Q3: How do you propose solutions and estimates for security scope?

- **Decision:** Estimate by waves (matrix, build, IAM, test, cutover) with assumptions on edition/tooling—not a single magic hours number.
- **Mechanism:** Assumptions list (IAG vs GRC, IdP ready); risks; dependencies; acceptance criteria including negative tests. Options A/B with risk.
- **Governance:** Change order when assumptions break. Partner SOW mirrors DoD.
- **Validation:** Estimate WBS; assumption log; customer sign on option.

## Q4: How do you lead and mentor a mixed security/GRC/IAM team?

- **Decision:** Clear ownership by plane (roles, GRC, IAS/IPS) with shared DoD and peer review—avoid hero culture on Production hotfixes.
- **Mechanism:** Board of stories; review checklist; pairing on SU25/MSMP; KT sessions; escalate blockers early.
- **Governance:** Production access least privilege for team. Quality gates not skipped for velocity.
- **Validation:** Peer review samples; defect escape rate; mentee runs runbook independently.

## Q5: How do you manage conflict with Functional, Basis, or Audit stakeholders?

- **Decision:** Conflict is usually risk vs schedule vs ownership—restate shared Deploy gate criteria and evidence needed.
- **Mechanism:** Facts (trace, SoD hit, R&R clause); options; escalate with RAID if deadlock before gate. Separate person from process.
- **Governance:** Audit findings not bargained away without control owner. Basis “temporary SAP_ALL” challenged.
- **Validation:** Written agreement; ticket/RAID update; gate status honest.

## Q6: How do you escalate risks without losing delivery focus?

- **Decision:** Escalate with impact to gate date, mitigation options, and clear ask—not blame threads.
- **Mechanism:** Early warning in status; amber→red rules; decision deadline; interim contain (Firefighter) while permanent CR builds.
- **Governance:** No surprise red at Deploy. Escalation path published.
- **Validation:** Timestamped early warning; decision received; contain+CR both evidenced.

## Q7: How do you handle go-live pressure and competing priorities?

- **Decision:** Protect Deploy checklist items that prevent critical access failure; negotiate scope deferrals explicitly—not silent risk.
- **Mechanism:** Must-fix vs defer list; residual risk register; staffing for hypercare; freeze noise changes.
- **Governance:** Executive accept required to ship with open critical SoD. Freeze board.
- **Validation:** Checklist; acceptance letter if any; deferred backlog dated.

## Q8: How do you demonstrate architecture trade-offs in interview answers?

- **Decision:** State two viable options, selection criteria (risk, cost, R&R, clean-core), and validation—avoid single “best practice” absolutism.
- **Mechanism:** Example: IAG vs GRC Bridge; derived vs organizational single roles; propagation vs technical user. Name edition constraints.
- **Governance:** Trade-off recorded in ADR when on a program. Interview: no fake customer proof.
- **Validation:** Answer names criteria + reject reason for alternative; validation step included.

## Q9: How do you structure STAR answers for security challenges without fabrication?

- **Decision:** STAR only for verified personal experience; otherwise methodology (“I would”)—never invent metrics or clients.
- **Mechanism:** Situation (landscape constraint); Task (gate/risk); Action (planes/tools); Result (evidence type). If CV lacks detail, stay methodological.
- **Governance:** Copilot/anti-fabrication policy. Interviewers detect fake precision.
- **Validation:** Story matches CV facts; no numeric claims absent from evidence; technical mechanism still present.

## Q10: How do you differentiate genuine experience from model answers when coaching or self-checking?

- **Decision:** Genuine answers cite landscape-specific constraints and failure modes you can defend; model answers stay general with clear “I would.”
- **Mechanism:** Checklist: edition named? SoR named? Validation artifact? Any unverifiable KPI? Replace KPI with evidence type.
- **Governance:** Team interview prep forbids fabricated war stories. Knowledge banks are technical, not biography.
- **Validation:** Peer challenge removes invented claims; remaining answer still architect-grade on mechanism/governance.
