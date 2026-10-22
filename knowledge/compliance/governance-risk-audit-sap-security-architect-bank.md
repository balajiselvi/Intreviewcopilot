# Governance, Risk, Compliance & Audit — SAP Security Architecture

Spoken architect style: Decision → Mechanism → Governance → Validation.

**Product boundaries:** SoD/critical access (GRC ARA / IAG), ITGCs/SOX, access certification, mitigating controls, Firefighter/PAM governance, and Process Control where in scope. Technical tools **support** compliance; they do not by themselves “make the organization SOX/ISO compliant.”

**Anti-surface rule:** Prefer control objectives, evidence, operating effectiveness tests, and owner RACI over generic compliance slogans.

## Q1: How do you design SoD and critical-access risk management operating model?

- **Decision:** Risks owned by business risk owners; Security maintains rulesets/tools; control owners operate mitigations—three roles, not one mega-admin.
- **Mechanism:** Functions/actions in ARA/IAG; user/role analysis schedule; remediation vs mitigation path; escalation aging. Include Fiori/cloud where connected.
- **Governance:** Open critical risk SLA. Ruleset change CAB. False positives fixed in ruleset, not ignored.
- **Validation:** Sample risk with owner; aging report; before/after remediation; mitigation tested.

## Q2: How do SAP security controls map to SOX ITGCs without overclaiming?

- **Decision:** Map access provisioning, privileged access, change control, and authentication to ITGC objectives; evidence operating effectiveness—do not claim automated SOX compliance from installing GRC.
- **Mechanism:** Control matrix: ITGC ID → SAP evidence (ARM/IAG requests, Firefighter logs, transport approvals, UAR). Sample testing quarterly/annually per audit plan.
- **Governance:** Control owners named. Failed tests → remediation with retest. GRC presence ≠ effective control.
- **Validation:** Sample request trail; Firefighter review complete; change ticket with security approve; test sheet signed.

## Q3: How do you run access certification / UAR that auditors trust?

- **Decision:** Campaign scope matches control (systems, privileged, financial apps); reviewers accountable; revokes provisioned; evidence retained.
- **Mechanism:** IAG Certification / GRC UAR; reviewer training; reminders/escalation; remediation jobs; closure report.
- **Governance:** Non-response escalates to manager/control owner. Recertify standing Admin.
- **Validation:** Revoked user access gone; campaign extract matches decisions; late items aged.

## Q4: How do mitigating and compensating controls work in practice?

- **Decision:** Mitigation is temporary risk acceptance with a detective/preventive control—not a permanent substitute for role split when split is feasible.
- **Mechanism:** Assign mitigating control ID in GRC/IAG; define test procedure (e.g., monthly report review); owner executes; evidence filed; expiry dates.
- **Governance:** Expired mitigations reopen risk. Design remediation preferred for standing toxic jobs.
- **Validation:** Control test sample pass; expiry monitored; role split removes need where completed.

## Q5: How do you govern emergency / privileged access for audit?

- **Decision:** Firefighter/IAG PAM/CyberArk checkouts are controlled, logged, reviewed—standing SAP_ALL is a finding.
- **Mechanism:** EAM/PAM config; controller review SLA; sync jobs; CyberArk for OS/DB; SIEM alerts. Separate human Firefighter from tech vaulting.
- **Governance:** Review completion KPI. Unused Firefighter IDs certified. Dual control for owner changes.
- **Validation:** Checkout→log→review chain complete; overdue reviews escalated; no standing SAP_ALL in SUIM.

## Q6: How do role-owner, risk-owner, and control-owner responsibilities differ?

- **Decision:** Role owner approves who gets the role; risk owner accepts SoD residual; control owner operates mitigation/evidence—conflating them weakens accountability.
- **Mechanism:** Document in RACI; configure in IAG/GRC owner fields; train; certify ownership lists.
- **Governance:** Vacant owner = campaign/analysis blocked for that object. HR movers update owners.
- **Validation:** Sample role has owner; risk has owner; mitigation tested by control owner ≠ role assignee alone.

## Q7: How do you produce audit evidence and remediate findings?

- **Decision:** Evidence is system extracts + tickets + test sheets with timestamps; findings get root cause, CAPA, and retest.
- **Mechanism:** Export trails; map to finding; fix design/process; retest; update control matrix. Avoid screenshot-only packs without IDs.
- **Governance:** Finding aging SLA. Repeat finding escalates to steering.
- **Validation:** Closed finding with retest evidence; CAPA owner; no unverifiable claims.

## Q8: How do leaver and joiner controls support compliance?

- **Decision:** Timely deprovision of terminated users is a core ITGC; joiner least privilege with approval trail.
- **Mechanism:** HR trigger → IPS/IDM → targets; privileged same-day SLA; orphan reconcile; request approvals for Production roles.
- **Governance:** Manual lingering access = finding. Shared accounts banned.
- **Validation:** Terminated sample locked everywhere; joiner evidence; orphan report.

## Q9: Where does GRC Process Control fit relative to Access Control / IAG?

- **Decision:** Process Control manages control library, assessments, and evidence workflows; Access Control/IAG manage access risk— complementary, not duplicates.
- **Mechanism:** PC control assessments; link ITGCs; remediate failed assessments; retain evidence. Do not use PC as substitute for ARA simulation.
- **Governance:** Control master data ownership. Assessment cadence per audit plan.
- **Validation:** Assessment complete with evidence; failed control retested; AC/IAG still runs access analysis.

## Q10: How do you report risk escalation and compliance exceptions to management?

- **Decision:** Exceptions are time-bound, owned, and visible in steering—never silent Production toxic access.
- **Mechanism:** Exception register; residual risk rating; compensating control; expiry; management sign-off. Tie to Deploy/ops gates.
- **Governance:** Expired exception = incident. Pattern of exceptions triggers redesign funding ask.
- **Validation:** Register current; sample signature; expired none for critical; redesign backlog linked.
