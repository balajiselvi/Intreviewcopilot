# RISE Cutover and Go-Live Execution

## Scope and scheduling

A RISE with SAP cutover is a project-specific transition into the contracted production landscape. SAP does not prescribe a universal Friday-to-Monday schedule, 48–72-hour window, hypercare duration, or hour-by-hour activity sequence. Set timing from the migration approach, source and target landscape, integrations, business downtime limits, rehearsal evidence, service responsibilities, and approved fallback plan. Distinguish customer, SAP, and partner responsibilities using the contract and the project's RACI; do not assume the customer operates SAP-managed infrastructure or that every operational responsibility is SAP's.

## Technical delivery approach

I organize cutover as controlled change execution with explicit dependencies and evidence:

1. **Baseline and scope:** confirm source and target systems, migration objects, in-scope business processes, interfaces, identity flows, transports/configuration, data freeze rules, outage limit, and service ownership.
2. **Rehearse:** execute the full sequence in a representative environment. Record actual durations, errors, prerequisites, handoffs, reconciliation results, and recovery actions. Use rehearsal results to size the approved window; do not use generic sample times.
3. **Readiness gate:** confirm test exit, migration reconciliation, transport/change readiness, interface and identity dependencies, monitoring, access controls, support roster, decision authority, and a tested fallback path. Record evidence and approvers.
4. **Execute:** use a dependency-ordered runbook. Each step has an owner, executor, validator, prerequisite, planned window, success criterion, evidence location, and escalation/hold condition. Record actual start/end, result, and linked incident or change.
5. **Validate before release:** verify platform and interface health with the accountable Basis/integration owners; verify business-critical end-to-end processes with business owners; verify designated users, business roles, emergency access and auditability with security. Reconcile agreed data/control totals and log exceptions. Release users only after authorized go/no-go evidence is accepted.
6. **Stabilize and hand over:** triage incidents by severity and business impact, assign an accountable owner and workaround, track access and integration defects separately, and transfer the remaining backlog against explicit operational acceptance and hypercare exit criteria.

## Cutover and Hypercare

I would not assume a standard weekend duration for RISE. I would derive the window from the migration scope and downtime limit, then validate it in a full rehearsal. My runbook would sequence the data and configuration changes, integrations, identity/provisioning dependencies, security checks, business validation, and release gate. Every step would have an owner, prerequisite, evidence and stop condition. Before release I would require reconciled data, working critical interfaces, representative user access, emergency-access controls, business sign-off and an approved fallback. During hypercare I would manage severity, ownership, workarounds, trend review and a measurable handover to operations. Customer/SAP/partner responsibilities would follow the contract and project RACI.

## Security and identity validation

Include these checks when they are in the project scope; do not imply that one identity architecture applies to every RISE customer:

- Confirm the approved identity source, authentication/federation path, provisioning path, and accountable owners for each boundary.
- Verify representative named business users can authenticate and reach only their assigned applications and business functions. Include negative authorization checks for high-risk roles.
- Verify role/catalog or business-role assignments and their transport/change evidence using the tools applicable to the deployed edition. Do not mix Public Edition business-role apps with Private Edition/on-premise PFCG procedures.
- Validate emergency access, firefighter or privileged-access controls where deployed: assignment, time bounds, logging, review owner, and evidence retention.
- Test scoped provisioning and deprovisioning events end to end where in scope. Check source event, mapping/transformation outcome, target write, and reconciliation; keep identity synchronization failures distinct from SAP application authorization failures.
- Confirm audit logging, support ownership, escalation, and the evidence repository before handover.

## Runbook and go/no-go controls

For each activity record: unique step ID; dependency; environment/system; change or migration reference; owner and validator; approved time window; command/tool or manual action; expected result; evidence; rollback/fallback action; and escalation authority. Do not place credentials or secrets in the runbook.

Readiness and release decisions should use approved project thresholds, not generic invented thresholds. Typical evidence categories are test completion and defect disposition, migration/control-total reconciliation, transport and interface readiness, security/access validation, monitoring and support readiness, business sign-off, and the fallback decision. A missed criterion is a hold/escalation decision for the named authority; never silently skip validation to recover schedule.

Fallback is not automatically a database restore or a reversal of every change. Document the actual technical and business recovery path, its decision deadline, data consistency implications, required owners, and how users are redirected or operations continue. If no safe fallback exists for a step, surface that residual risk before go/no-go.

## Hypercare and exit

Use an agreed coverage model and duration. Record each issue with severity, affected process/users, system boundary, owner, workaround, target resolution, and evidence. Review access incidents, provisioning/interface failures, business-process defects, data reconciliation exceptions, and operational alerts as distinct categories. Exit when agreed service and business criteria are met, critical defects are closed or formally accepted, runbooks/monitoring/support ownership are handed over, and the business and operations owners accept the residual backlog.

## Troubleshooting method

When a cutover validation fails, identify the failed step and boundary first. Preserve timestamps, system/environment, change or migration ID, correlation/message ID, exact error, and last successful checkpoint. Check the responsible layer's approved logs and monitoring; compare the actual result with the runbook criterion; determine scope and business impact; then recover through the documented retry, hold, workaround, or fallback decision. Do not prescribe a transaction code or log path without knowing the product, edition, component, and where the failure occurred.

For SAP identity/security symptoms, distinguish at minimum: authentication/federation; provisioning/source mapping/target write; launchpad or business-role assignment; application/service authorization; and business-process/data restriction. Route evidence to the owner of that layer rather than treating every access problem as a PFCG issue.

## Source and currency

- SAP Help Portal, SAP Cloud ALM / SAP Activate road maps: [What's New SAP Activate Road Maps](https://help.sap.com/docs/cloud-alm/a35c4ebc43294c9a9937325cfc8931f7/7ffaecc55fb54d899c3b31465a9a9a24.html?locale=en-US), checked 2026-10-14. Use the roadmap and the customer's approved project plan for applicable activities; the roadmap is not evidence for a universal cutover duration.
- Project-specific dates, times, durations, thresholds, product transactions, and customer/SAP/partner responsibilities must be verified against the current landscape, contract, SAP service documentation, and approved project artifacts before being presented as facts.
