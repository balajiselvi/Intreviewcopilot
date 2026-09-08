# Security Hypercare After Go-Live

## Overview

Hypercare for SAP security is short-cycle defect handling after cutover, not a second design phase. Access tickets, Firefighter usage, provisioning failures, and SoD exceptions spike. The job is stabilize production while protecting the audit trail.

## Interview Summary

A Principal Architect sets severity, owners, and what may be hotfixed versus what must wait for a role redesign. Firefighter is for true production blockages. Permanent role copies during hypercare recreate the catalog problem you just went live with.

SU53 shows why one AUTHORITY-CHECK failed for one user. It is not evidence that role cutover, Fiori catalogs, or org values are complete. Cutover proof is SUIM versus the approved matrix, UAT smoke tests, PFUD/user comparison, IPS job logs, and Firefighter controller review.

## 30 Second Interview Answer

In hypercare I would treat access defects as production incidents with evidence. A real process blocker gets logged Firefighter or a transported role fix after impact assessment — not an unlogged widen of a shared composite. I would smoke-test critical roles, reconcile SUIM to the gold matrix, drain IPS/IAG error queues, review FF logs daily, and park catalog redesign for the first stabilization transport. SU53 is for triage of a single failure, not the hypercare operating model.

## 60 Second Interview Answer

Typical first-week pattern: missing Fiori catalogs, org values wrong on derived roles, IPS jobs failing for a subset of movers, GRC requests stuck, Firefighter IDs used as a workaround for unfinished roles.

Operating model: a security war-room with business process owners, a freeze on casual role copies, a daily Firefighter review, and a defect backlog tagged as catalog, object, org, provisioning, or data.

Cutover leftover: reference users, emergency SAP_ALL-style fixes, and open FF sessions must be closed and explained. Auditors will look at hypercare, not only design documents.

Trade-off: speed versus least privilege. I would rather a logged Firefighter session for a finance close blocker than an unlogged change to a shared composite used by 2,000 users.

## Stabilization Checks

- Firefighter log review daily (GRAC_SPM / IAG PAM) with ticket-linked reason codes
- Failed IPS/GRC/IAG provisioning queue
- Duplicate users created at cutover
- Roles transported but not generated; PFUD/user comparison not run
- Fiori catalog/space/page mismatches versus backend PFCG
- SoD mitigations that were “temporary” on go-live day
- Rollback pack: prior AGR_USERS extract and transport list

## Related Topics

- knowledge/rise/rise-cutover.md
- knowledge/grc/firefighter.md
- knowledge/idm/idm-provisioning.md
- knowledge/troubleshooting/authorization-errors.md
