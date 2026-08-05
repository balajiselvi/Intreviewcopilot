# RISE Security and Compliance

## Overview

RISE security differs fundamentally from on-premise SAP implementations. In a cloud environment, organizations no longer control infrastructure; they rely on SAP Cloud Infrastructure (SCI) or BTP to provide foundational security, compliance controls, and audit capabilities. RISE security strategy spans three layers: infrastructure security (SAP's responsibility via SCI/BTP), data security (encryption, masking, access controls), and application security (authorization, audit logging, secure coding). Understanding cloud security shared responsibility models, data residency requirements, compliance frameworks (SOX, GDPR, industry-specific regulations), and RISE-specific authorization architecture is critical for anyone implementing or governing RISE deployments at enterprise scale.

## Interview Summary

RISE operates in a shared security model: SAP provides foundational infrastructure security (encryption, network isolation, DDoS protection); the customer provides data governance (classification, access controls, audit oversight). Success requires understanding cloud security principles, authorization design, compliance obligations, and data protection strategies.

## 30 Second Interview Answer

RISE security operates on a shared responsibility model: SAP Cloud Infrastructure (SCI) provides foundational security (encryption, network, firewalls, DDoS protection); the customer implements data security (access controls, encryption at rest, masking sensitive data, audit logging). Key RISE security domains: user access control (who can do what), data access control (which data can be viewed/changed), compliance (audit trail, retention, regulatory requirements), and secure communications (TLS, API authentication). Most RISE security incidents result from misconfigured authorization, not infrastructure failures.

## 60 Second Interview Answer

RISE security spans infrastructure (SAP's responsibility) and application/data (customer's responsibility). Infrastructure security includes encryption in transit (TLS), encryption at rest (HANA encryption), network isolation, DDoS protection, and regular penetration testing by SAP. Customer responsibilities include designing authorization (roles, authorizations assignments), implementing data governance (what data is sensitive, who can access), enabling audit logging, and managing user lifecycle. RISE uses role-based access control (RBAC) with pre-configured industry roles that match RISE best practices—organizations customize roles, assign to users. Key security considerations: segregation of duties (prevent fraud, ensure controls), data masking (hide sensitive data like salary, bank account from non-authorized users), encryption of sensitive data elements, and comprehensive audit trail. Compliance depends on customer choice: RISE can support SOX (financial controls), GDPR (data privacy), HIPAA (healthcare), industry-specific regulations based on configuration. Common security challenges: misconfigured authorization (too permissive, users have access they don't need), inadequate segregation of duties (one user can both create purchase orders and approve invoices), and insufficient audit logging (unable to trace who changed what, when).

## 90 Second Interview Answer

RISE security is shared responsibility: SAP provides certifications (SOC 2, ISO 27001, GDPR-ready, FedRAMP for US government) and infrastructure hardening. Customer implements application and data security controls. Authorization design is critical: RISE provides pre-built role templates (Finance Manager, Procurement Manager, HR Manager) that implement segregation of duties, authorization objects (what can be done), and risk areas (transactions needing approval). Configuration involves customizing roles (add/remove authorizations based on organizational needs), assigning roles to users, and testing segregation of duties (ensure Finance Manager can't also approve invoices they create). Data security spans multiple layers: user authentication (password policy, multi-factor authentication if required), data classification (marking sensitive fields: salary, bank account), field-level encryption (encrypt sensitive data at HANA database level), and data masking (show only last 4 digits of account numbers to non-authorized users). Audit logging is non-negotiable for compliance: RISE captures who accessed what data, who changed what configuration, when changes were made. Organizations must define audit retention (typically 7 years for financial data), audit analysis workflows (quarterly review of sensitive transactions), and incident response (if suspicious access detected). Common security design decisions: centralized vs decentralized authorization (one global authorization model vs regional variations), degree of customization (use pre-built roles vs build custom to match org structure exactly), encryption scope (encrypt all sensitive fields vs subset). Security assessment during RISE project should identify compliance obligations (SOX, HIPAA, industry regulation), map those to RISE authorization architecture, and validate that controls can be implemented and tested.

## Architecture

RISE security architecture operates across multiple layers:

1. **Infrastructure Layer (SAP Responsibility)**
   - SCI/BTP provides encrypted network (TLS 1.2+ for all external communications)
   - Data encryption at rest (SAP HANA Transparent Data Encryption)
   - DDoS protection and network firewalls
   - Regular security patches and updates
   - Compliance certifications (SOC 2, ISO 27001, GDPR-ready)

2. **Authentication & Identity Management**
   - User master records (SU01) with password policies
   - Optional: Integration with corporate identity provider (Active Directory, Azure AD, LDAP via SAML/OIDC)
   - Multi-factor authentication (MFA) optional but recommended
   - Session timeout policies (auto-logout after inactivity)

3. **Authorization Architecture**
   - Roles (PFCG) — bundle of authorization objects
   - Authorization objects — define what transaction/data can be accessed
   - User-role assignment — which users have which roles
   - Segregation of duties (SoD) — organizational controls to prevent conflicting duties

4. **Data Security**
   - Field-level encryption — sensitive fields (salary, bank account) encrypted at HANA level
   - Data masking — restricts display of sensitive data based on user role
   - Audit logging — captures all data access, changes, deletions
   - Data retention — retain audit logs per compliance requirement (typically 7 years)

5. **Compliance Framework**
   - SOX controls — financial close controls, segregation of duties
   - GDPR — data privacy, right-to-be-forgotten, data breach notification
   - HIPAA — healthcare data protection
   - Industry-specific — e.g., banking regulations on transaction monitoring
   - Audit trail — evidence of controls for auditors

## Runtime Flow

1. **Security Planning Phase (Discover)**
   - Identify compliance requirements (legal, regulatory, industry-specific)
   - Map compliance requirements to RISE authorization and controls
   - Document current authorization practices (who can create orders, approve invoices)
   - Assess security risks (what data is sensitive, who needs access)

2. **Authorization Design Phase (Explore)**
   - Review RISE pre-built role templates (does Finance Manager role align with organizational needs?)
   - Design custom roles (if pre-built roles don't match organization)
   - Define segregation of duties (Finance can't approve their own invoices; Procurement can't be vendor)
   - Design data masking (hide salary, SSN from non-authorized users)
   - Plan audit logging (which transactions to audit, how long to retain)

3. **Configuration Phase (Execute)**
   - Configure roles in PFCG (transaction, authorization objects)
   - Customize pre-built roles (add, remove, modify authorizations)
   - Create user master records (SU01) with password policy
   - Assign roles to users (one user can have multiple roles)
   - Configure audit logging (enable for sensitive transactions, set retention)
   - Configure MFA if organizational requirement

4. **Testing Phase (Execute)**
   - Test segregation of duties (create test scenario: user tries to create and approve order, verify system blocks it)
   - Test data masking (user with limited role logs in, verify sensitive data not visible)
   - Test audit logging (perform sensitive transaction, verify logged in audit table)
   - Validate authorization effectiveness (no unauthorized access)

5. **UAT Phase (Prepare for Go-Live)**
   - Business users participate in security testing (confirm expected access, identify gaps)
   - Compliance/audit team validates controls map to compliance requirements
   - Security audit (internal or external) validates RISE configuration

6. **Post-Go-Live (Operations)**
   - Monitor user access and audit logs (weekly review for suspicious activity)
   - Manage user lifecycle (onboarding, role changes, offboarding)
   - Quarterly security review (analyze audit logs for anomalies)
   - Annual compliance audit (validate controls operating as designed)

## Configuration

RISE security configuration includes:

1. **Role Configuration (PFCG)**
   - Standard roles provided by RISE (Finance Manager, Procurement Manager, HR Manager)
   - Customization (add/remove transactions, authorization objects)
   - Role assignment (user assigned to role via SU01)
   - Example: Finance Manager role includes authorization to post GL entries (transaction FB01), view AR (FBL5N), but NOT delete GL entries or modify customer credit limits

2. **Authorization Objects**
   - PLOG (logistics purchase order) — create, change, display PO
   - FIKS (invoice) — create, change, post, display
   - PFCG (authorization assignment) — assign roles to users
   - Authorization level (can be set to plant-level, company code-level, etc.)

3. **Segregation of Duties (SoD)**
   - Procurement SoD: Requester can't approve requisitions they create; Buyer can't be Vendor; Approver can't be Requestor
   - Finance SoD: GL Poster can't Approve GL entries; AR Collector can't create invoices; AP Processor can't approve payments
   - Pre-configured in RISE industry templates; organizations validate and customize

4. **Data Masking**
   - Field-level masking (salary field in personnel master masked for users without HR role)
   - Bank account masking (show only last 4 digits unless user has accounting authorization)
   - Configured in data access layer (not visible to end users)

5. **Audit Logging**
   - Transaction logs (every transaction logged — user, transaction code, timestamp, data changed)
   - Sensitive data access logs (access to salary, customer credit limit, bank account)
   - Configuration change logs (every authorization, role, user change logged)
   - System logs (security-related events, failed login attempts, authentication changes)
   - Retention: typically 7 years for financial data, industry-specific for healthcare/banking

6. **Compliance Configuration**
   - SOX controls (GL reconciliation, monthly close controls, segregation of duties for financial processes)
   - GDPR (data retention policy, right-to-be-forgotten procedures, data breach notification)
   - Audit evidence (configuration snapshots, role assignments, user access lists)

## Implementation Activities

1. **Security Requirements Gathering**
   - Understand compliance obligations (SOX, GDPR, industry regulation)
   - Identify sensitive data (salary, SSN, medical records, financial transactions)
   - Identify critical processes (GL close, AP payment, payroll)
   - Develop security requirements matrix (process X requires segregation of duties Y)

2. **Authorization Design and Documentation**
   - Document current authorization model (who can create, approve, post, delete in legacy system)
   - Design target authorization model in RISE (map legacy to RISE roles, identify gaps)
   - Build segregation of duties matrix (which combinations of duties are not allowed?)
   - Get business review and sign-off (Finance leader confirms authorization design aligns with control requirements)

3. **Role Configuration**
   - Review RISE pre-built roles (does "Finance Manager" role match organizational Finance Manager role?)
   - Customize roles (add/remove authorizations to align with organizational needs)
   - Document role definitions (what each role can do, examples of users in each role)
   - Test role configurations (user assigned test role, verify can/can't do expected actions)

4. **User Provisioning Strategy**
   - Identify user population (how many users, which users need which roles)
   - Design user onboarding process (new hire, how long from hire date to RISE access)
   - Design user offboarding process (employee termination, how quickly to revoke access)
   - Plan role-change process (promotion, different department, how to update roles)

5. **Audit Logging and Monitoring**
   - Enable audit logging for sensitive transactions (GL posting, invoice approval, payment)
   - Configure audit retention (7 years for financial, per-regulation for HIPAA/GDPR)
   - Design audit review process (quarterly analysis of audit logs for anomalies)
   - Establish alert thresholds (if 100 GL entries posted by one user in 1 hour, trigger alert)

6. **Compliance Validation**
   - Document how RISE controls satisfy compliance requirements (SOX: segregation of duties achieved via PFCG role configuration)
   - Prepare audit evidence (configuration screenshots, role assignments, user lists)
   - Conduct internal audit (validate controls operating as designed)
   - Prepare for external audit (auditors review configuration, confirm adequacy)

## Migration Activities

1. **Legacy Authorization Migration**
   - Audit legacy system authorization (who has what access currently)
   - Map legacy roles to RISE roles (legacy "GL Poster" = RISE "GL Accountant" + "Invoice Reviewer")
   - Identify access that won't be replicated in RISE (legacy system had weaker segregation of duties; RISE enforces stricter controls)
   - Plan adjustments (some users must be split into multiple RISE users, some roles require restructuring)

2. **Cloud Compliance Assessment**
   - Review SAP RISE compliance certifications (SOC 2, ISO 27001, GDPR-ready, industry-specific)
   - Map organization's compliance requirements to RISE capabilities
   - Identify compliance gaps (if organization requires HIPAA, validate RISE HIPAA readiness)
   - Document shared responsibility (what SAP provides, what customer must configure)

3. **Data Residency and Sovereignty**
   - Determine data residency requirements (some regulations require data in specific geographic regions)
   - Confirm RISE region selection aligns with data residency (data center location)
   - Document data location for compliance (where customer data stored, how SAP protects it)

## Rollout Activities

1. **User Access Implementation**
   - Wave 1 users (core finance team) — assigned RISE roles, tested
   - Wave 2 users (supply chain team) — assigned roles in Wave 2 implementation
   - Staggered rollout reduces support burden (not all users need access Day 1)

2. **Security Training**
   - User security training (password policy, what they can/can't do, how to report security concerns)
   - Manager training (responsible for user lifecycle — onboarding, role changes, offboarding)
   - Audit team training (how to review audit logs, what anomalies to look for)

3. **Access Control Testing**
   - Penetration testing (external security firm tests RISE system for vulnerabilities)
   - Authorization testing (confirm segregation of duties enforced, data masking working)
   - Audit log validation (perform sensitive transaction, confirm logged correctly)

## Production Support Activities

1. **Ongoing User Access Management**
   - New user onboarding (request received, role assigned, access provisioned)
   - Role changes (user promotion/transfer, roles updated)
   - User offboarding (employee termination, access revoked within 24 hours)
   - Quarterly access review (manager reviews who has what access, approves/removes)

2. **Audit and Monitoring**
   - Weekly review of system access (significant access changes, failed login attempts)
   - Monthly sensitive transaction review (who accessed salary data, who approved large payments)
   - Quarterly audit log analysis (trends, anomalies, unusual access patterns)
   - Annual compliance audit (validate controls operating as designed, evidence collection)

3. **Incident Response**
   - Suspicious access detected → immediate investigation (was it authorized, what was accessed)
   - Unauthorized access discovered → incident response (disable access, investigate, audit trail)
   - Security breach → escalate (notify stakeholders, audit trail review, notification to affected parties if required)

4. **Compliance Maintenance**
   - SOX — maintain evidence of segregation of duties, quarterly testing
   - GDPR — maintain audit trail for data access, handle right-to-be-forgotten requests, data breach notification
   - Industry-specific — adapt to regulatory changes (new compliance requirement issued, update RISE controls)

## Troubleshooting

### Issue 1: Segregation of Duties Violation Discovered Post-Go-Live
**Symptoms:** User can both create purchase orders and approve them (should be segregated). Discovery during first compliance audit.

**Root Cause:** Authorization design inadequate; didn't properly separate Requester and Approver roles. Or: user needed both roles for their business function (and violation was accepted but documented).

**Resolution:**
- Identify affected users (who has conflicting roles)
- Assess business impact: can these duties be genuinely segregated (split user responsibilities) or is there legitimate business need for one user to perform both (requires exception, documented in audit trail)
- If can segregate: create second user ID for approval activities, reassign roles
- If must combine (legitimate exception): document exception in audit trail (formal authorization to violate SoD), get audit sign-off
- Update SoD matrix (document known exceptions and why)

---

### Issue 2: User Access Not Revoked After Termination
**Symptoms:** Employee terminated; 2 weeks later, audit discovers they still have access to RISE (can still log in). Security violation.

**Root Cause:** User offboarding process failed (HR didn't notify IT, IT didn't revoke access, no follow-up validation).

**Resolution:**
- Immediately revoke access (disable user in SU01)
- Audit what data was accessed by terminated employee post-termination
- Investigate access (was data actually accessed after termination date, or just credential available?)
- Implement control: HR-to-IT notification process, weekly validation that terminated users can't access RISE
- Escalate to compliance/audit (policy violation, ensure it doesn't happen again)

---

### Issue 3: Audit Logs Growing Excessively, Storage Issues
**Symptoms:** Audit logs consuming 500GB/month; storage costs high, data retrieval slow. System performance impact.

**Root Cause:** Audit logging configuration too broad (logging every transaction instead of just sensitive ones).

**Resolution:**
- Analyze what's being logged (is it necessary, or can it be pruned?)
- Refine logging scope (log sensitive transactions only: GL posting, invoice approval, payment; don't log routine transactions)
- Archive old logs (move logs >6 months to archive storage, retain only recent logs in hot storage)
- Configure retention policy (delete logs after 7 years per compliance requirement, not keep forever)
- Optimize storage (compress logs if possible, use cloud storage for archive)

---

### Issue 4: Compliance Audit Fails – Insufficient Audit Trail Evidence
**Symptoms:** Auditor requests evidence of segregation of duties (who approved this GL entry?). System can't provide evidence (audit logs don't capture approval).

**Root Cause:** Authorization design didn't capture approval workflows; transactions logged but not with approval evidence.

**Resolution:**
- Identify what evidence is missing (approval chain, who reviewed/approved)
- Implement workflow-based approval (configure workflow in RISE to require approval, capture approver in audit trail)
- Retroactively gather evidence (if possible, manually compile evidence for past transactions)
- Update audit logging (ensure approval events are logged with approver ID, timestamp)
- Document control design (how approval is evidenced, how auditor can verify)

---

### Issue 5: Data Breach – Unauthorized Access to Sensitive Data Discovered
**Symptoms:** Audit logs show unauthorized user accessed salary data, customer credit limits, bank account numbers. User didn't have authorization for this data.

**Root Cause:** Data masking not implemented; sensitive fields visible to all users. Or: authorization misconfigured (user had broader access than intended).

**Resolution:**
- Immediate action: revoke user access (disable user until investigation complete)
- Investigation: audit logs to understand scope (how much data accessed, how long unauthorized access existed)
- Remediation: if data masking not implemented, implement it immediately (mask sensitive fields for unauthorized users)
- If authorization misconfigured: correct authorization (remove unauthorized access), audit other users with same misconfiguration
- Compliance notification: if applicable (GDPR breach notification), notify affected parties, regulators
- Control enhancement: implement periodic access review (quarterly check of who can access sensitive data)

## Common Interview Questions

1. **What is shared responsibility in RISE security?**
   SAP provides infrastructure security (encryption, network, DDoS, certifications). Customer provides application/data security (authorization, user access management, audit logging, compliance oversight).

2. **What is segregation of duties and why does it matter?**
   Segregation of duties (SoD) prevents fraud and errors by ensuring no one person can perform all steps in a critical process (one person can't create, approve, and post GL entries). RISE enforces SoD through authorization controls.

3. **How do you design authorization in RISE?**
   Identify business roles (Finance Manager, Procurement Manager). Map to RISE pre-built roles (or customize). Assign authorization objects (what each role can do). Test segregation of duties (ensure system blocks unauthorized combinations).

4. **What is field-level encryption and when is it used?**
   Field-level encryption encrypts sensitive data elements (salary, bank account) at the database level. Only users with authorization can see decrypted data; others see encrypted or masked values.

5. **What is audit logging and what should be logged?**
   Audit logging captures who did what, when. Should log sensitive transactions (GL posting, invoice approval, payment), data access (who viewed salary data), configuration changes (role assignments, authorization changes).

6. **How do you ensure compliance in RISE?**
   Map compliance requirements to RISE authorization controls. Implement segregation of duties per compliance requirement. Enable audit logging. Perform periodic compliance testing (quarterly review). Gather audit evidence for auditors.

7. **What is GDPR and how does RISE support it?**
   GDPR (EU data privacy regulation) requires: consent for data collection, right-to-be-forgotten (delete personal data), data breach notification, privacy impact assessment. RISE supports GDPR through: authorization controls (access restricted), audit logging (track access), data retention policies, and compliance certifications.

8. **What is SOX and what controls does RISE provide?**
   SOX (financial regulation) requires: internal controls over financial reporting, segregation of duties, audit trails, management certification. RISE supports SOX through: segregation of duties authorization, GL reconciliation controls, approval workflows, comprehensive audit logging.

9. **How do you handle user onboarding in RISE?**
   Receive hire notification, create user master record (SU01), assign roles based on job function, validate access, provide security training. Process typically 1–3 days from hire to access.

10. **How do you handle user offboarding in RISE?**
    Receive termination notification, revoke all roles/access (disable user), verify system blocks access, audit any post-termination access attempts. Should be completed within 24 hours of termination.

11. **What is multi-factor authentication and when should it be used?**
    MFA requires two forms of authentication (password + code from phone, or password + smart card) to log in. Recommended for high-risk users (Finance Manager, System Admin) or if compliance requires it.

12. **What is data masking and give an example.**
    Data masking restricts display of sensitive data to unauthorized users. Example: HR Manager can see full salary; non-HR users see only masked salary (e.g., ****). Implementation is field-level, controlled by authorization.

13. **How do you validate segregation of duties is working?**
    Test scenario: create purchase order as Requester, try to approve as Approver (same user, should be blocked). If system allows, SoD not enforced. Test should be part of UAT before go-live.

14. **What is an audit trail and how is it used?**
    Audit trail (audit logs) captures every transaction: user, what they did, when, what data changed. Used for compliance verification (auditors review trail), incident investigation (what happened?), and anomaly detection (unusual patterns).

15. **How do you handle a security incident in RISE?**
    Declare incident, revoke compromised access, investigate scope (what data, how long?), preserve evidence (audit logs), notify stakeholders, communicate to affected parties if required (GDPR), remediate root cause.

## Tough Follow-up Questions

1. **If compliance audit finds segregation of duties violated for critical transactions, how do you remediate?**
   Assess scope: which users, which transactions affected? If structural (many users), may require workflow redesign. Immediate action: restrict access for violators. Root cause: was authorization misconfigured, or legitimate business need? If misconfig: fix. If legitimate: document exception, get audit sign-off, implement compensating control (increased monitoring).

2. **What if organization requires HIPAA compliance but RISE isn't certified for HIPAA?**
   Negotiate with SAP (RISE roadmap for HIPAA certification?). Assess gap (what HIPAA controls are missing?). Implement compensating controls (additional encryption, monitoring, access logging outside RISE if necessary). Document risk in audit trail (identified gap, compensating control in place, residual risk accepted by business).

3. **If data breach occurs and organization must notify customers under GDPR, what's the process?**
   Investigate (scope of breach: what data, how many customers). Assess risk (is breach actually high-risk, or low-risk personal data?). If high-risk: notify customers within 72 hours, notify regulators. Document investigation findings. Remediate root cause (prevent future breach). Consider credit monitoring for customers.

4. **What if audit discovers user had overly broad access for 6 months before termination?**
   Investigate (what did user do with access? any suspicious transactions?). Audit logs (review all user activity during period). If suspicious activity: escalate (potential fraud/theft). If no suspicious activity: remove access, remediate root cause (authorization misconfiguration). Lessons learned: improve access review process.

5. **If authenticating users via corporate Active Directory fails during go-live, how do you handle?**
   Fallback: use local RISE user master (SU01) for authentication (pre-established backup users). Resolve AD issue (network problem, certificate issue?). Once AD restored, switch back to AD authentication. Analyze failure (why did AD connectivity break?). Implement redundancy (backup auth method, network monitoring).

6. **How do you handle a custom development that bypasses authorization controls?**
   Immediately stop use of custom development (security vulnerability). Code review (how does it bypass controls?). Remediation: rebuild custom code to respect authorization. If rebuild not feasible short-term: disable feature, users use standard RISE transaction instead. Escalate: custom development security review process needed.

7. **If organization wants to log every transaction for compliance, but logs are consuming all storage, what do you recommend?**
   Distinguish: what must be logged for compliance (sensitive transactions), what is nice-to-have (routine transactions). Prioritize compliance requirements (log those, live with storage cost). Optimize non-compliance logging (reduce verbosity, archive regularly). Negotiate storage investment with business (compliance cost).

## SAP Transactions

- SU01: User maintenance (create/modify users)
- PFCG: Role maintenance (define roles, assign permissions)
- SUIM: User information system (query user access, role assignments)
- SM18: ALE distribution (if integrating with non-SAP systems, secure APIs)
- SMLT: Load testing tool (test performance under high audit log volume)
- GRAC: Governance risk and compliance (analyze segregation of duties)
- SLG1: Application log (application-specific logging)
- ST03: Workload analysis (monitor performance, unusual patterns)
- SUTE: System trace (detailed tracing for debugging, not for routine use)
- AL08: Logged-on users (monitor who's logged in)

## SAP Tables

- USR01: User master
- USR02: Logon data (password, failed attempts)
- USR03: User profile (defaults, settings)
- PFCG: Roles
- AGR_1249: User-role assignment
- USOBX: Authorization value (segregation of duties data)
- CDPOS: Change document position (audit trail of configuration changes)
- ADM_LOG: Application log
- TLOG: Transaction log (not directly used but related to audit logging)

## Best Practices

- **Security is not negotiable:** Budget time for security design, testing, and validation.
- **Segregation of duties first:** Design authorization to prevent fraud before anything else.
- **Audit logging comprehensive:** Log all sensitive transactions, not just high-value ones.
- **Regular access review:** Quarterly check of who has access, remove access for unused roles.
- **User lifecycle discipline:** Onboarding within 1 day, offboarding within 24 hours of termination.
- **Compliance mapping:** Map compliance requirements to RISE controls; document how each requirement is met.
- **Security testing in UAT:** Test segregation of duties, authorization, data masking before go-live.
- **Training and awareness:** Users understand their security responsibilities, know how to report security concerns.

## Common Mistakes

- **Security as afterthought:** Designing security late in project; no time for UAT, missed requirements.
- **Ignoring segregation of duties:** Authorization designed for convenience (one user role = all permissions), violates controls.
- **Inadequate audit logging:** Logging too much (storage overload) or too little (no evidence for auditors).
- **No access review process:** Users accumulate access over time; no one removes access from roles no longer needed.
- **Weak password policy:** Simple passwords, no expiration, no MFA; easy to compromise.
- **Poor user lifecycle management:** Terminated employee access not revoked; contractor access never expires.
- **Compliance documentation missing:** Can't demonstrate how RISE satisfies SOX/GDPR/industry requirements.

## Interviewer's Hidden Expectations

- **Appreciate shared responsibility:** Understand that SAP provides infrastructure, customer provides application security.
- **Security by design:** Show you think about security early, not as post-launch patch.
- **Compliance mapping:** Understand how business requirements (SOX, GDPR) translate to RISE configuration.
- **Risk management:** Identify security risks, mitigation strategies, residual risks.
- **Incident response:** If breach occurs, know how to investigate, remediate, communicate.

## What Makes This a 10/10 Answer

- Candidate explains shared responsibility model clearly
- Discusses segregation of duties with concrete examples (Requester/Approver, Vendor/Buyer)
- Mentions field-level encryption, data masking, audit logging as key security controls
- Addresses compliance (SOX, GDPR) with specific RISE implementations
- Shares example of real security challenge (auth misconfiguration, violation, remediation)
- Demonstrates understanding of user lifecycle (onboarding, offboarding, access review)
- Shows awareness of compliance audit process (evidence gathering, auditor interactions)

## Red Flags

- Treats security as IT-only concern (no mention of business compliance, audit requirements)
- No understanding of shared responsibility (thinks SAP provides all security)
- Hasn't participated in actual security configuration but claims expertise
- No awareness of segregation of duties or why it matters
- Assumes audit logging is optional ("we'll log if we have time")
- Unfamiliar with compliance frameworks (SOX, GDPR)
- No contingency planning for security incidents

## Keywords

- Shared responsibility
- Segregation of duties (SoD)
- Role-based access control (RBAC)
- Field-level encryption
- Data masking
- Audit logging
- Compliance (SOX, GDPR, HIPAA)
- Authorization
- User lifecycle
- Incident response
- Audit trail

## Related Topics

- [RISE Overview](./rise-overview.md)
- [RISE Project Management](./rise-project.md)
- [SAP Security Fundamentals](../security/sap-security.md)
- [SAP Authorization and PFCG](../security/authorization-design.md)
- [GRC and Compliance](../grc/grc-overview.md)
- [Audit and Compliance](../audit/audit-overview.md)
