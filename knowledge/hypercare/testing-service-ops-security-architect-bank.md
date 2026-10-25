# Testing, Service Management & Operational Support — Security Architecture

Spoken architect style: fluent Senior Principal Architect paragraphs — lead with exact T-codes/tables/utilities; never Decision/Mechanism/Governance/Validation headings.

**Product boundaries:** Covers authorization test strategy, cutover rehearsals, Production incident/problem/change for security, and BAU evidence. Applies across PFCG, Fiori, IAG/GRC, IAS/IPS, and cloud apps—with product-specific traces.

**Anti-surface rule:** Prefer positive/negative test matrices, transport verification, RCA tied to control failure, and SLA metrics over “we do UAT.”

## Q1: How do you structure unit, SIT, UAT, and regression tests for authorizations?

- **Decision:** Every in-scope persona has positive path, negative SoD/org path, and regression pack after each role transport wave.
- **Mechanism:** Unit: single-role object checks (`STAUTHTRACE`). SIT: IPS→IAS→app. UAT: business scripts. Regression: prior P1 defects + critical TCode/app list. Test IDs never use `SAP_ALL`.
- **Governance:** UAT sign-off invalid without negative tests. Test data privacy respected.
- **Validation:** Matrix maps case→result→defect; Deploy gate references completion %.

## Q2: How do you validate SoD, critical access, and mitigations before go-live?

- **Decision:** Simulation in GRC ARA / IAG Access Analysis is mandatory for in-scope systems; mitigations tested for operating effectiveness, not only assigned.
- **Mechanism:** Run user/role analysis; remediate design hits; assign mitigating controls with owners; sample test control (review evidence). Include Fiori/cloud entitlements in ruleset coverage.
- **Governance:** Open critical risk without owner = no-go or executive acceptance. Mitigation expiry monitored.
- **Validation:** Before/after risk counts; control sample pass; acceptance letter if residual.

## Q3: How do you verify role transports post-import?

- **Decision:** Import RC=0 is necessary but insufficient—compare content and run user comparison / business-role activation checks.
- **Mechanism:** `STMS` logs; `PFCG` status; user comparison job; Public Edition publish steps; smoke tests; `SUIM` before/after for critical objects.
- **Governance:** Production import dual-approved. Hotfix without QAS evidence escalated.
- **Validation:** QAS≈PRD compare; smoke pass; yellow comparison cleared; rollback plan tested in rehearsal.

## Q4: How do you rehearse cutover and rollback for security?

- **Decision:** Cutover rehearsal includes role import, provisioning freeze/thaw, break-glass test, and rollback of security transports.
- **Mechanism:** Timed runbook; IPS job pause; Firefighter checkout; Production smoke; decision checkpoint. Rollback = prior transport reimport + user compare.
- **Governance:** Rehearsal defects must close or be accepted before go-live. Security lead on bridge.
- **Validation:** Rehearsal minutes; timing metrics; rollback drill evidence; open defects list.

## Q5: How do you manage Production security incidents vs defects vs changes?

- **Decision:** Incident restores service (often Firefighter); defect fixes root design; change transports permanent fix—do not leave Firefighter as BAU.
- **Mechanism:** ITIL-like triage: impact/urgency; contain with EAM/IAG PAM if needed; RCA with traces; CR for permanent role; post-implementation review.
- **Governance:** SLA by severity. Standing emergency access reviewed daily in hypercare.
- **Validation:** Ticket shows contain→RCA→change→verify; Firefighter closed; negative test after fix.

## Q6: How do you perform root-cause analysis on authorization failures?

- **Decision:** RCA states failing plane (AuthN, provision, FE content, BE object, data auth, network)—not “user issue.”
- **Mechanism:** Timeline; logs (`STAUTHTRACE`, IPS, IAS, Gateway); compare last transport; identify missing test. Corrective + preventive actions (SU24, provisioning map).
- **Governance:** Repeat incidents trigger redesign. Blame-free but control-owner accountable.
- **Validation:** RCA approved; CAPA closed with evidence; regression case added.

## Q7: How do you report security SLAs and KPIs to service management?

- **Decision:** Track auth incident MTTR, open SoD aging, provisioning failure rate, Firefighter usage, and access-review completion—not vanity ticket counts alone.
- **Mechanism:** Dashboards from ITSM + GRC/IAG + IPS; hypercare daily, BAU weekly/monthly. Tie to contractual SLAs.
- **Governance:** Red KPIs escalate to steering. Data quality of tickets enforced (plane tagged).
- **Validation:** Sample month report reconciles to source systems; escalation path evidenced.

## Q8: How do you build runbooks and knowledge transfer for BAU security ops?

- **Decision:** Runbooks cover top incident types per plane with exact TCodes/consoles—KT is exit criterion for project security admins.
- **Mechanism:** Runbook: symptoms→checks→fix→escalate. Shadow support during hypercare; remove project elevating roles on exit date.
- **Governance:** KT checklist signed by BAU owner. Undocumented break-glass forbidden.
- **Validation:** BAU resolves seeded incident via runbook; project IDs locked; checklist complete.

## Q9: How do you retain operational and audit evidence continually?

- **Decision:** Evidence pipeline is continuous: change tickets, analysis reports, certification campaigns, Firefighter logs, IPS job history—retention per policy.
- **Mechanism:** Automate exports where possible; store immutable; map to SOX ITGC controls. Periodic control testing samples.
- **Governance:** Evidence tampering controls. Incomplete retention = audit finding risk.
- **Validation:** Pull sample control evidence within SLA; trail complete end-to-end.

## Q10: What does continual improvement look like for SAP security operations?

- **Decision:** Post-incident and post-audit themes drive backlog: ruleset tuning, role split, provisioning quality, monitoring—measured by KPI trend.
- **Mechanism:** Quarterly improvement plan; prioritize by risk; verify with retest. Feed Activate Run / BAU roadmap.
- **Governance:** Improvement owners and due dates. Vanity rewrites without risk reduction rejected.
- **Validation:** KPI trend down for repeat auth incidents; ruleset false positives reduced; audit findings closed on time.
