# SAP Identity Provisioning Service (IPS)

## Overview

SAP Identity Provisioning Service (IPS) reads users and groups from configured source systems, applies source and target JSON transformations, and provisions entities to configured targets. A job can read, delta-read, or resynchronize entities, depending on its type and system properties. IPS records per-job status and entity outcomes. It is the provisioning plane; authentication, approval, and target authorization belong to their respective services and applications.

## Interview Summary

Identity Provisioning is part of SAP Cloud Identity Services. It reads users and groups from a source system and writes them to one or more target systems. The job starts from the source system's Jobs tab, as a full read or a delta read. Transformations map and filter attributes before the write. Job Logs in the Identity Provisioning administration console show the job status and the failed entities. IPS does not authenticate users and does not approve access. IAS authenticates. IAG or GRC governs. The target system enforces.

## 30 Second Interview Answer

IPS is the provisioning plane. A joiner, mover, or leaver in SuccessFactors is read through a source connector, transformed (mappings, filters, correlation), and written to targets on delta or full jobs. Birthright can be mapped in IPS; high-risk roles still go through IAG or GRC simulation and approval. Mover design must replace or reconcile old access, not append it.

## 60 Second Interview Answer

IPS is the enterprise provisioning engine for multi-system environments. You connect source systems (HR, Active Directory, Okta) and target systems (BTP, SuccessFactors, custom apps), define attribute mappings and transformation rules, and IPS automatically syncs users. When an employee joins and is added to an HR system, IPS reads that, applies business rules (determine which roles based on department), and creates accounts in all relevant target systems simultaneously.

Transformations map source attributes to an intermediate representation and then to each target schema. Conditions can include or skip entities. Preserve stable entity identifiers in the configured read and write mappings; do not assume that IPS automatically merges independent source records. Define source precedence and target-account correlation for the connected systems.

Deprovisioning is equally automated. When a user leaves (HR record marked terminated), IPS automatically disables their accounts in all systems, revokes access, sends notifications to managers.

## 90 Second Interview Answer

IAS authenticates. Identity Provisioning reads a source system and writes users and groups to targets. IAG governs the request. The target enforces the authorization. The job runs from the source system's Jobs tab, and Job Logs show the failed entities.

For IAG, Identity Provisioning is the proxy when IAG provisions to a cloud application over SCIM and there is no direct connection. For SAP S/4HANA Cloud, connector version 3 uses communication scenario SAP_COM_0465 for business users, business role assignments, and user groups. Do not use PFCG on Public Edition. For S/4HANA on-premise, use the SAP S/4HANA On-Premise connector through Cloud Connector and a BTP destination. The property s4hana.onprem.sap-client selects the client. For a BTP application, set the target properties from that application's service key. Role collections stay in the subaccount. They are not the IPS job.

## Architecture

- **Source System(s):** HR system, corporate directory (AD, LDAP), identity hub (Okta, Azure AD, Cloud Identity), or other IAM system
- **Connector:** Lightweight agent deployed on-premise (if connecting to on-premise systems) or cloud-hosted connector for cloud sources
- **Transformation Engine:** JSON mappings, conditions, filtering, and source-to-target entity identity handling
- **Target System(s):** Cloud applications (BTP, SuccessFactors, Concur, Analytics Cloud), on-premise SAP (ECC, S/4HANA), non-SAP legacy systems
- **Provisioning Jobs:** Scheduled or event-driven jobs that read source, apply transformations, write to targets
- **Audit Log:** Complete history of all provisioning decisions and executions
- **State Management:** Tracks which users have been provisioned to which targets and current sync state

## Runtime Flow

1. **Trigger:**
   - Scheduled job (e.g., every 4 hours): IPS checks all sources for new/changed users
   - Event-driven: New hire event from HR system triggers IPS

2. **Source read:**
   - IPS connects to source system(s) via connector (SCIM, LDAP, API, etc.)
   - Reads users, groups, attributes from source(s)
   - A source read does not by itself define precedence when multiple sources represent the same person; configure source-to-target identity mappings and verify target behavior.

3. **Transformation:**
   - IPS applies transformation rules: attribute mappings, filters, complex logic
   - Example: "if user.department = Finance, add user to BTP Finance subaccount with role Finance-Analyst"
   - Filters: exclude test users, non-active employees, etc.
   - Conditions and mappings: map or skip entities according to the configured transformations.

4. **Write to targets:**
   - For each target system, IPS applies target-specific transformation rules (different attributes for different targets)
   - Writes user account via SCIM API or custom connector
   - Tracks which user was written to which target

5. **State tracking:**
   - IPS records: user was provisioned to BTP (date, attributes), user was provisioned to SuccessFactors (date, attributes)
   - Next run: IPS compares source current state vs known state in targets; only updates what changed

6. **Deprovisioning (when triggered):**
   - User is marked deleted/inactive in source
   - IPS detects the change, applies deprovisioning rules
   - Removes user from all targets or deactivates accounts (depending on policy)
   - Audit log records deprovisioning

7. **Notifications:**
   - Optional: send manager notifications (new hire added, departing employee deprovisioned)
   - Integrates with workflow systems (SAP Process Orchestration, etc.)

## Configuration

- **Source System Connection:** Define connection details (URL, credentials, query scope), attribute retrieval (which attributes to read), entity type (users, groups, or both)
- **Target System Connections:** Define connection details, SCIM endpoints, authentication
- **Transformation Rules:** Attribute mappings (HR.department → BTP.role), filters (active employees only), complex logic (if-then-else provisioning)
- **Provisioning Jobs:** Execution schedule (hourly, daily, on-demand), source/target pair, job logic
- **Deprovisioning Policies:** When is a user considered deprovisioned (deleted, inactive), grace period (if any), notification
- **Attribute Transformation:** Standardize data (map values: "Sr. Analyst" in HR → "Senior Analyst" in BTP), clean up (strip spaces, lowercase), enrich (add domain to email)
- **Entity Identity:** Keep stable source and target identifiers in the configured entity ID mappings; do not use display attributes as unique keys without validating source and target semantics.
- **Audit Configuration:** Log detail level, retention, export

## Implementation Activities

- Assess current provisioning landscape (manual processes, spreadsheets, legacy systems involved)
- Identify source systems (HR, AD, Okta, etc.) and target systems (BTP, SuccessFactors, legacy SAP, etc.)
- Define the authoritative source and stable entity identifier for each source-to-target path
- Define transformation rules for each source-to-target combination
- Define deprovisioning policies and grace periods
- Install on-premise connector (if connecting to on-premise systems)
- Test provisioning rules in non-prod (create sample users, verify correct accounts created in targets)
- Plan user data migration strategy (bulk initial load vs incremental)
- Configure notifications and integration with workflow systems
- Train operations team on IPS monitoring and troubleshooting
- Plan rollout (all users immediately vs phased approach)

## Migration Activities

- When consolidating IAM systems, migrate user data to new provisioning source (new HR system, new identity hub)
- Re-validate transformation rules for consolidated system
- Reconcile target accounts against source identifiers and approved lifecycle state
- Test deprovisioning works correctly with new source system

## Rollout Activities

- For multi-geography rollout: define geography-specific provisioning rules (users in EMEA region get different target systems than APAC)
- Configure region-specific policies (GDPR compliance for EU users, data residency rules)
- Test provisioning for each geography before full rollout

## Production Support Activities

- Monitor provisioning jobs for success/failure rates
- Investigate failed provisioning (user not created in target, incomplete attribute sync)
- Handle manual provisioning requests (urgent access needed before next scheduled job)
- Audit user access (verify only authorized users have been provisioned)
- Manage exception handling (users who couldn't be auto-provisioned, manual adjustments needed)
- Reconcile target systems (identify drift between source and target; re-sync if needed)
- Manage user lifecycle: updates (user changed department, need to update role in targets), deprovisioning (user terminated)
- Update transformation rules when business logic changes (new team structure, new role definitions)

## Troubleshooting

### Failed entities and missing target accounts: evidence-led triage

Scope one entity, a pattern, or most of the job; record source/target, job type, ID, and time. In IPS, open Provisioning Logs > Job Logs, inspect status and statistics, select Failed Entities, download the error-log ZIP, and read each exact stage and error. Reconcile source Read and Failed; source Skipped; target Created, Updated, Deleted, Skipped, and Failed. Missing accounts may be unread or skipped; they are not all failed writes. For read failures check source access, credentials, filters, and paging. For skipped entities compare transformation conditions and ignored types. For target-write failures inspect the target response, technical-user permissions, endpoint, schema, mandatory fields, and limits. Compare the affected payload, read/write transformations, and entity ID; change only the evidenced stage. Use SIMULATE if available. Choose Read or Resync deliberately for full/delta behavior and deletion impact. Rerun; verify final status, counts, account, and mapped attributes.

Sources checked 2026-10-14: SAP Help, Monitor Provisioning Job Logs (statistics and status definitions), Manage Provisioning Job Logs (downloaded error logs), Job and Transformation Issues (read/write/skip distinctions), and Read Provisioning Job (full/delta and deletion behavior).

**Common issue:** User created in HR but doesn't appear in BTP target system after provisioning job.
Root cause: Transformation rule didn't match user (e.g., user is marked inactive, or department doesn't match rule), or target system connector failed, or rate limiting from target.
Resolution: Check provisioning job logs; see if rule matched. Check target system's SCIM API is reachable and credentials are valid. Check if target system has rate limiting. Re-run job or trigger manually.

**Common issue:** User has wrong role in target system (provisioned with Finance-Analyst but should be Finance-Manager).
Root cause: Transformation rule logic is incorrect, or source data (salary level, seniority) is wrong, or manual adjustment was made in target system that's now out of sync.
Resolution: Check transformation rule logic. Verify source data (HR system). Decide: reconcile manually in target, or fix rule and re-run provisioning job to re-sync all users.

**Common issue:** User was terminated in HR but still has active account in BTP.
Root cause: Deprovisioning rule didn't match (e.g., user status is "terminated" in HR but rule is checking "active" field), or deprovisioning job failed.
Resolution: Check deprovisioning rule logic in IPS. Check provisioning job logs for errors. Manually deactivate user in BTP if urgent. Fix rule and re-run.

**Common issue:** Provisioning job is extremely slow; takes hours to sync 10,000 users.
Root cause: Target system SCIM API is slow, IPS is waiting for responses, network latency is high, or query is inefficient.
Resolution: Check target system performance (is it under load?). Check IPS connector logs for timeouts. Increase IPS parallelism (if configurable). Consider batching large provisioning jobs into smaller windows.

**Common issue:** Multiple target accounts appear to represent the same person.
Compare source entity IDs, target entity IDs, usernames, and the configured source read and target write mappings. Check whether separate sources are intentionally producing separate target identities or whether the target identifier mapping is inconsistent. Do not delete an account until ownership, lifecycle state, and downstream access are reconciled.

## Common Interview Questions

1. **What is SAP Identity Provisioning Service and when would you use it?**
   IPS automates user provisioning across multiple systems. Use it when you have users in multiple systems (BTP, SuccessFactors, on-premise SAP, legacy apps) and want to stop doing manual spreadsheet provisioning.

2. **How does IPS differ from Cloud Identity's provisioning?**
   IPS provides configurable source-to-target provisioning and transformations. The identity and authorization behavior depends on the connected systems and their mappings.

3. **What's a provisioning transformation rule?**
   A rule that maps attributes from source to target and/or applies business logic. E.g., "if user.department = Finance AND user.level >= 5, provision to SuccessFactors with role Finance-Manager."

4. **How do you investigate duplicate target accounts?**
   Compare source entity IDs, target entity IDs, usernames, and the source/target transformation mappings. Verify whether the connected systems are intended to share a target identity. Do not assume IPS merges independent source records automatically or delete an account before reconciling ownership and downstream access.

5. **Can IPS handle deprovisioning (removing access when users leave)?**
   Yes. When a user is marked inactive/terminated in the source, IPS detects it and removes them from all target systems. You can configure grace periods (keep access for 30 days before removing) or immediate deprovisioning.

6. **What's the difference between IPS and a traditional IAM product like Okta?**
   Okta is an identity platform (authentication, authorization, lifecycle management). IPS is SAP's purpose-built provisioning engine for BTP and SAP landscapes. Okta is more general-purpose; IPS is more specialized for SAP.

7. **How do you handle users with multiple roles across different systems?**
   Use IPS transformation rules. E.g., create a rule for each role/system combination. User gets provisioned with the appropriate role to each target based on their attributes.

8. **Can IPS provision to on-premise SAP systems?**
   Yes. You deploy an on-premise connector in your data center, and IPS can provision to ECC, S/4HANA, etc. The connector securely communicates between IPS (in the cloud) and your on-premise systems.

9. **How often does IPS run provisioning jobs?**
   Depends on configuration. Typically hourly or every 4 hours. You can also trigger on-demand or via event (e.g., new hire event from HR system triggers immediate provisioning).

10. **What audit trail does IPS provide?**
    Complete history: every provisioning decision, every user created/updated/deactivated, which system, when, with which attributes. Exportable for compliance audits.

11. **Can IPS integrate with workflow systems?**
    Yes. IPS can trigger notifications, approval workflows (manager approves new hire before provisioning), and integration with SAP Process Orchestration or other BPM systems.

12. **How do you test provisioning rules before deploying to production?**
    Use a test source system (test HR data) and test target systems. Define transformation rules. Run provisioning job on test environment. Verify correct accounts were created with correct attributes.

## Tough Follow-up Questions

1. **How would you architect IPS for a company with 100,000 employees across 50 systems?**
   Multiple provisioning jobs (one per target system, running in parallel). On-premise connectors for on-premise systems. Sophisticated transformation rules with filters and role logic. Monitoring to ensure jobs complete within SLA.

2. **What happens if your HR system goes down? Can users still get provisioned?**
   No. IPS can't read from the source. For high-availability, you'd need a backup source system or a way to manually trigger provisioning from a cache. Most enterprises accept this risk and assume HR system outages are rare.

3. **How do you handle data privacy (GDPR, data residency) in IPS provisioning?**
   Configure region-specific provisioning rules (EU users only provisioned to EU-based systems). Mask sensitive data during provisioning (don't send salary to all targets). Audit logs for GDPR "right to erasure" (delete user data on request).

4. **How do you detect and reconcile drift (users in target systems that shouldn't be there)?**
   IPS can reconcile: read all users from target, compare against source authoritative list, identify orphaned accounts or inconsistencies. Either manually remove drift or re-run provisioning to bring everything in sync.

5. **What's your strategy for handling users who appear in multiple source systems with different attributes?**
   Define which source owns each attribute, preserve source and target entity identifiers, and configure the transformations and source selection accordingly. Verify how the target resolves an existing account before provisioning changes.

6. **How do you provision to a legacy system that doesn't support SCIM or modern APIs?**
   Build a custom connector using IPS's extension framework, or use a legacy system-specific connector (if SAP provides one). Worst case, export to CSV and use the legacy system's native import tool.

7. **Can you use IPS to govern access (who gets which role, who's approved for what)?**
   IPS is provisioning-focused, not approval-focused. For access governance with approvals, you'd use SAP Identity Governance (separate product). IPS can enforce rules automatically; IG adds approval workflows.

8. **How do you handle the initial load of 100,000 existing users into IPS?**
   Validate source completeness and stable identifiers, test target transformations on representative entities, choose the intended Read or Resync behavior, and reconcile target counts and sample accounts before expanding the run.

## SAP Transactions

Identity Provisioning has no ABAP transaction. Use the Identity Provisioning administration console. Source Systems and Target Systems hold the connectors and their properties. The Jobs tab on the source system runs the job. Job Logs show the failed entities. Do not start an IPS failure in PFCG or SU01. Those transactions show an ABAP user only after a successful write to an ABAP target. For SAP S/4HANA Cloud, connector version 3 uses communication scenario SAP_COM_0465. For an on-premise ABAP target, the connection uses Cloud Connector and a BTP destination, and s4hana.onprem.sap-client selects the client. IAG reaches a cloud application through an Identity Provisioning proxy system when there is no direct SCIM connection.

## SAP Tables
- **USR01** — User master records (for users provisioned by IPS)
- **USGRP** — User group assignments (for users provisioned by IPS)

## Best Practices
- Define stable source and target identifiers and attribute ownership for each source-to-target path
- Keep transformation rules simple; don't encode complex business logic (that belongs in HR/source system)
- Test rules in non-prod before deploying to production
- Monitor provisioning jobs for success/failure rates
- Maintain documentation of all provisioning rules and business logic
- Use deprovisioning to remove access when users leave (don't leave orphaned accounts)
- Reconcile periodically (verify target systems match source; identify drift)
- Keep audit logs for compliance (GDPR, SOX, internal audits)
- Plan for high-availability (multiple connectors, backup sources if possible)
- Implement rate limiting and error handling (target systems may have API limits)

## Common Mistakes
- Over-complicating transformation rules (makes them hard to maintain and debug)
- Not defining deprovisioning rules (terminated employees keep access forever)
- Not testing rules in non-prod (deploy broken rule to production, 1,000 users provisioned incorrectly)
- Assuming IPS is a replacement for data governance (it's not; it automates workflow, doesn't ensure data quality)
- Forgetting about error handling (what if a target system is down? does IPS retry? does it notify admins?)
- Not monitoring provisioning jobs (discover a 3-month-old backlog only when users complain)
- Treating IPS as source of truth (it's not; it reads from source systems; don't modify users only in IPS)

## Interviewer's Hidden Expectations

Strong answers demonstrate: (1) understanding of source-to-target provisioning, (2) correct read/transform/write distinctions, (3) lifecycle and deprovisioning controls, (4) awareness of stable identifiers, filters, and target-specific mappings, and (5) job-level evidence and reconciliation.

Listen for operational maturity: does the candidate think about monitoring, testing, error handling, disaster recovery?

## What Makes This a 10/10 Answer
- Clear explanation of IPS as an **automation engine** for user lifecycle management
- Understanding of source-to-target architecture and transformation rules
- Specific mention of attribute mapping, filtering, and complex business logic
- Awareness of source precedence, stable entity identifiers, and target correlation for multi-source scenarios
- Understanding of deprovisioning as equally important to provisioning
- Discussion of audit trails and compliance requirements
- Awareness that IPS can provision to on-premise systems via connector
- Mention of reconciliation (detecting and fixing drift between source and targets)
- Job Logs and the failed entity, rather than an invented volume or duration

## Red Flags
- Treating IAS and IPS as the same service. Both belong to Cloud Identity Services. IAS authenticates. IPS provisions.
- Thinking IPS is a replacement for the source system (it reads from source, doesn't replace it)
- Not mentioning deprovisioning or thinking access control is provisioning's job
- Assuming all source systems can connect to IPS (some legacy systems may not have connectors)
- Forgetting about audit logs or compliance requirements

## Keywords
- Identity Provisioning Service (IPS), transformation rules, attribute mapping
- Source system, target system, SCIM protocol, connector
- Entity IDs, source-to-target correlation, reconciliation
- Provisioning job, scheduled/event-driven, deprovisioning
- Audit trail, compliance, drift detection

## Related Topics
- [SAP Cloud Identity](cloud-identity.md)
- [SAP Identity Authentication Service](ias.md)
- [BTP Security](btp-security.md)
