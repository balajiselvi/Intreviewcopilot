# SAP Identity Management (IDM) 7.2/8.0 Architecture

Spoken architect style: Decision → Mechanism → Governance → Validation.

**Product boundaries:** SAP IDM (Identity Center, Developer Studio, Runtime) provisions and orchestrates identities across repositories. It is **not** IAS (authentication), **not** IAG (cloud governance services), and **not** GRC ARA (SoD engine)—though it often integrates with them. Modern programs may migrate IDM workloads to IPS + IAG/SailPoint; say so explicitly when that is the strategy.

**Anti-surface rule:** Prefer entry types, attributes, jobs/tasks, ToIdentityStore, provisioning framework, and dispatcher runtime evidence over “IDM does JML.”

## Q1: How do you architect IDM identity stores, entry types, and attributes for enterprise JML?

- **Decision:** Model a clear person entry type with stable identifiers and employment attributes; separate technical accounts from person entries; keep privilege/role assignments as link attributes or role entries per design standard.
- **Mechanism:** In Identity Center / Developer Studio, define entry types (e.g., MX_PERSON), mandatory attributes (employee ID, email, status), and repositories (IDM store, LDAP/AD, ABAP, SF). Use unique keys for correlation. Avoid overloaded free-text attributes for SoD-critical decisions—use controlled values.
- **Governance:** Attribute dictionary owned by IAM architecture; breaking key changes require migration plan. No Production schema edits without transport/change control.
- **Validation:** Create test person; required attributes enforced; duplicate key rejected; links to privilege entries visible in UI/Job log.

## Q2: How do you design provisioning jobs, tasks, and event tasks for joiner–mover–leaver?

- **Decision:** Event-driven tasks react to attribute changes (status, org, job); ordered job chains handle bulk load and reconciliation—never rely on only nightly full replaces for leavers.
- **Mechanism:** Build tasks: create account in target, assign roles, disable account, remove privileges. Triggers: on insert/modify of status=TERMINATED → deprovision chain. Use passes/to-identity-store patterns appropriate to release. Schedule reconciliation jobs to detect orphans. Dispatcher/runtime executes; monitor job log status.
- **Governance:** Same-day leaver SLA for privileged targets. Failed deprovision raises incident, not silent retry forever without alert.
- **Validation:** Terminate attribute flip disables ABAP/AD within SLA; job log RC success; orphan reconcile lists none for that user; mover updates org-driven roles.

## Q3: How do you develop connectors and custom provisioning logic (JS/SQL/REST/SOAP) safely?

- **Decision:** Prefer standard connectors; isolate custom scripts with least privilege service accounts and explicit error handling—custom code is production software.
- **Mechanism:** Configure repository constants (URLs, technical users); implement scripts for edge mappings; call REST/SOAP with timeouts; never hardcode secrets—use secure store/constants protected by ACLs. Version scripts in IDM transport packs / export. Unit-test in DEV with mocked targets where possible.
- **Governance:** Code review for provisioning scripts; secret scan; Performance test bulk jobs before Production.
- **Validation:** Negative test (bad password) fails gracefully with log; positive provision creates correct target objects; secret not visible in plain job log.

## Q4: How do you integrate SAP IDM with LDAP/AD and virtual directory patterns?

- **Decision:** AD/LDAP is often the enterprise account plane for Windows/SaaS; IDM writes controlled attributes/groups only—do not mirror entire HR into unconstrained AD writes.
- **Mechanism:** Repository for LDAP/AD; map person→account; group membership for app access; handle disable vs delete per policy; respect OU placement rules. For VDS patterns, document read/write paths and which system is authoritative per attribute.
- **Governance:** Privileged AD group membership changes dual-controlled. IDM service account least privilege (no Domain Admin).
- **Validation:** Joiner gets correct OU/groups; leaver disabled; IDM service account denied broad AD admin; audit shows group add source=IDM job.

## Q5: How do you connect SuccessFactors / HR as the authoritative joiner source into IDM?

- **Decision:** HR employment status is authoritative for workforce lifecycle; IDM consumes SF/EC (or HCM) feeds and provisions downstream—SF RBP remains a separate in-suite control plane.
- **Mechanism:** Inbound job from SF API/file; map personId/userId to MX_PERSON; transform jobCode→business roles; trigger tasks to ABAP/IAS/AD. Filter test users. Handle rehire as distinct from new hire (reactivate vs create).
- **Governance:** HR data quality SLAs (manager, department populated). Manual IDM create for employees bypassing HR is exception-only.
- **Validation:** SF terminate → IDM deprovision chain; rehire reactivates with correct keys; mismatched email caught in validation pass.

## Q6: How do you provision SAP ABAP systems from IDM without fighting GRC/IAG governance?

- **Decision:** IDM may create users and assign roles, but SoD simulation/approval should sit in GRC ARM / IAG Access Request when those are in landscape—IDM should not silently assign toxic combos.
- **Mechanism:** ABAP repository connector creates `SU01` users, sets validity, assigns roles via BAPI/API patterns supported; optionally call GRC/IAG for request-driven assignment. Coordinate role naming with Security. Technical users may be separate flow with PAM vaulting.
- **Governance:** Production role assign path documented (IDM direct vs GRC/IAG). Dual paths require ADR.
- **Validation:** Request-approved role appears; direct toxic assign blocked by process test; ABAP user type/validity correct; IDM job log matches `SUIM`.

## Q7: How do you operate Runtime Engine, dispatchers, and high availability for IDM?

- **Decision:** Runtime/dispatchers are production services—capacity, HA, and job prioritization are architecture concerns equal to connector design.
- **Mechanism:** Size dispatchers for peak JML; separate heavy reconcile from interactive event processing if needed; monitor queue depth and failed tasks; back up identity store DB; patch per PAM. Document recovery of stuck jobs.
- **Governance:** Job failure alerts to IAM ops with SLA. Change windows for dispatcher upgrades.
- **Validation:** Kill test dispatcher → failover/resume behavior per design; failed task alert fires; backlog clears after recovery.

## Q8: How do you reconcile and manage orphan accounts across targets?

- **Decision:** Reconciliation compares target accounts to IDM persons and flags orphans/mismatches for remediation—critical for audit.
- **Mechanism:** Scheduled reconcile jobs per repository; reports for unmatched accounts; workflows to disable or link. Exclude known shared technical accounts via controlled lists. Feed privileged orphans to PAM owners.
- **Governance:** Orphan SLA (e.g., privileged disable in 24h). Exception list reviewed quarterly.
- **Validation:** Planted orphan appears in report; remediates to disabled; known technical account not false-positive after allowlist.

## Q9: How do you plan migration from SAP IDM to IPS + IAG / SailPoint (or hybrid)?

- **Decision:** Migration is capability remapping: inbound HR, transformations, targets, workflow/approvals, and evidencing—not a binary big-bang unless scope is tiny.
- **Mechanism:** Inventory IDM jobs/scripts; classify replace-with-IPS transformations vs retain-in-IAG request vs move-to-SailPoint connectors; run parallel for critical targets; freeze IDM changes during cutover; reconcile counts. Keep break-glass manual procedures ready.
- **Governance:** Exit criteria: target JML SLAs met on new platform; IDM decommission ticket with data retention plan.
- **Validation:** Parallel run diffs zero critical deltas; leaver test on new path; IDM jobs disabled post-cutover; audit informed of SoR change.

## Q10: What evidence pack proves IDM operating effectiveness?

- **Decision:** Auditors need JML evidence, failed-job handling, orphan reconcile, privileged provisioning path, and SoR diagram with GRC/IAG/IAS.
- **Mechanism:** Provide architecture diagram; job catalog; sample joiner/mover/leaver logs; reconcile reports; access to identity store change history; RACI.
- **Governance:** Control testing samples pulled from Production logs, not DEV. Residual manual steps documented.
- **Validation:** Walkthrough one joiner and one leaver with end-to-end artifacts across IDM and targets; orphan report current; no standing Domain Admin for IDM service account.
