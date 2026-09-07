# Security Hypercare After Go-Live

## Overview

Hypercare for SAP security is short-cycle defect handling after cutover, not a second design phase. Access tickets, Firefighter usage, provisioning failures, and SoD exceptions spike. The job is stabilize production while protecting the audit trail.

## Interview Summary

A Principal Architect sets severity, owners, and what may be hotfixed versus what must wait for a role redesign. Firefighter is for true production blockages. Permanent role copies during hypercare recreate the catalog problem you just went live with.

## 30 Second Interview Answer

In hypercare I would treat access defects as production incidents with evidence. Unlock a real go-live blocker quickly, preferably through privileged access with logging if the role change cannot be transported the same day. I would not solve volume tickets by widening roles globally. I would trend defects into design fixes for the first stabilization release.

## 60 Second Interview Answer

Typical first-week pattern: missing Fiori catalogs, org values wrong on derived roles, IPS jobs failing for a subset of movers, GRC requests stuck, Firefighter IDs used as a workaround for unfinished roles.

Operating model: a security war-room with business process owners, a freeze on casual role copies, a daily Firefighter review, and a defect backlog tagged as catalog, object, org, provisioning, or data.

Cutover leftover: reference users, emergency SAP_ALL-style fixes, and open FF sessions must be closed and explained. Auditors will look at hypercare, not only design documents.

Trade-off: speed versus least privilege. I would rather a logged Firefighter session for a finance close blocker than an unlogged change to a shared composite used by 2,000 users.

## Stabilization Checks

- Firefighter log review daily
- Failed IPS/GRC provisioning queue
- Duplicate users created at cutover
- Roles transported but not generated
- SoD mitigations that were “temporary” on go-live day

## Related Topics

- knowledge/rise/rise-cutover.md
- knowledge/grc/firefighter.md
- knowledge/idm/idm-provisioning.md
- knowledge/troubleshooting/authorization-errors.md
