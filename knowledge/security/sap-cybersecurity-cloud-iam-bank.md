# SAP Cybersecurity, Platform Hardening & Cloud IAM Architecture

Spoken architect style: Decision → Mechanism → Governance → Validation. Technical boundaries: enterprise IdP (Okta/Azure AD), SAP IAS, SAL/`RSAU_CONFIG`, ATC/SCI, HANA encryption/SecStore, IAG PAM, Web Dispatcher/ICM, STMS/SCC4, OAuth/mTLS, ETD/SIEM—not classic PFCG role design unless the question bridges identity or hardening controls.

## Q1: How do you architect a Zero Trust Access model for SAP S/4HANA and BTP using Okta/Azure AD, SAP IAS, and Conditional Access?

- **Decision:** Position Okta/Azure AD as the primary Identity Provider (IdP) enforcing risk-based Multi-Factor Authentication (MFA), and SAP Identity Authentication Service (IAS) as the proxy IdP converting enterprise claims into SAP SAML/OIDC assertions.
- **Mechanism:** User accesses Fiori Launchpad. Request redirects to SAP IAS. IAS forwards authentication to Azure AD/Okta via SAML 2.0. Azure AD evaluates device compliance, IP range, and user risk before triggering MFA. Upon success, Azure AD issues a SAML assertion to IAS, which maps `NameID` and user groups before delegating execution to S/4HANA or BTP via Principal Propagation.
- **Governance:** Enforce strict Zero Trust rule: No direct password or basic authentication allowed for business users on backend ABAP/HANA systems.
- **Validation:** Test authentication flows from an untrusted network; confirm Azure AD dynamically forces step-up MFA before IAS issues the authenticated SAML token.

## Q2: How do you configure and harden the Security Audit Log (SAL) using `RSAU_CONFIG` for SIEM/SoC integration (e.g., Microsoft Sentinel, Splunk)?

- **Decision:** Enable real-time Security Audit Logging across all clients and stream event audit files continuously to enterprise SIEM platforms.
- **Mechanism:** Configure SAL profiles via transaction `RSAU_CONFIG` (or legacy `SM19`). Define audit filters capturing critical events: User creation (`CU*`), authorization changes (`CA*`), failed logins (`AU*`), RFC calls (`DU*`), and critical transaction execution (`SE16`, `SU01`, `SCC4`). Configure SAP Enterprise Threat Detection (ETD) or syslog extractors to forward SAL audit logs continuously from system work directories (`/usr/sap/<SID>/.../log`) to Splunk/Sentinel.
- **Governance:** Maintain SAL file retention policies matching statutory compliance mandates (e.g., 365 days minimum).
- **Validation:** Execute transaction `SM20` / `RSAU_READ_LOG` or inspect SIEM dashboards to confirm critical system events generate real-time security alerts.

## Q3: How do you execute static code security analysis on custom ABAP developments using ABAP Test Cockpit (ATC) and Code Inspector (`SCI`)?

- **Decision:** Embed automated security quality gates into the transport release pipeline using ABAP Test Cockpit (ATC).
- **Mechanism:** Configure ATC check variants in transaction `ATC` / `SCI` incorporating standard security checks: `SECURITY_CHECKS` (detecting missing `AUTHORITY-CHECK` statements, hardcoded user credentials, and SQL injection vulnerabilities). Enforce transport blocking in `SE09`/`SE10` if ATC returns Priority 1 or 2 security findings.
- **Governance:** Require mandatory Security Lead sign-off for any transport requiring an ATC error override exception.
- **Validation:** Execute `ATC` scan on a custom package containing a mock un-sanitized dynamic SQL query; verify ATC flags a Priority 1 SQL Injection finding and blocks transport export.

## Q4: How do you secure database encryption and key management in SAP HANA using SecStore and Native Encryption?

- **Decision:** Enable SAP HANA Data-at-Rest Encryption (DARE) for data and log volumes, managed through NetWeaver Secure Storage (`SECSTORE`).
- **Mechanism:** Enable persistence encryption in HANA Cockpit / `hdbsql` (`ALTER SYSTEM ALTER ENCRYPTION ROOT KEYS`). Store application credentials, RFC passwords, and DB keys inside ABAP Secure Storage (`SECSTORE`). Execute transaction `SECKEY` to rotate SSFS (Secure Store in the File System) master encryption keys periodically.
- **Governance:** Restrict root key management access strictly to designated Security Officers, separating duties from DBAs.
- **Validation:** Execute transaction `SECSTORE` check reports to verify entry integrity and confirm zero unencrypted fallback credentials exist in table `PBC_KEYS`.

## Q5: How do you configure Privileged Access Management (PAM) for cloud-native BTP applications where traditional EAM Firefighting is unavailable?

- **Decision:** Utilize SAP Cloud IAG Privileged Access Management (PAM) or CyberArk credential vaulting for time-boxed administrative privilege elevation.
- **Mechanism:** In SAP Cloud IAG PAM, create Emergency Access roles for cloud apps. Requester submits PAM request with business ticket justification. Upon approval, IAG dynamically binds elevated BTP Role Collections to the user's IAS identity for a fixed duration (e.g., 2 hours). All HTTP/REST API actions executed during the elevated window are captured in BTP audit logs.
- **Governance:** Require 100% post-session audit log review by Security Leads within 24 hours of PAM expiration.
- **Validation:** Request emergency PAM access in IAG, execute BTP administrative tasks, and verify automatic access revocation upon session expiration.

## Q6: How do you secure Web Dispatcher and ICM against HTTP Request Smuggling, Clickjacking, and CORS vulnerabilities?

- **Decision:** Apply strict security header parameters in SAP Web Dispatcher and ICM configuration files (`icm/HTTP/user_defined_header_*`).
- **Mechanism:** Update Web Dispatcher / ICM profile parameters:
  - `icm/HTTP/user_defined_header_0 = Set-Cookie: *; Secure; HttpOnly; SameSite=Strict`
  - `wdisp/frame_options = SAMEORIGIN` (prevents Clickjacking).
  - Configure CORS whitelisting restricting allowed origin domains (`icm/HTTP/cors/origin`).
  - Disable HTTP TRACE and OPTIONS methods to prevent XSS credential harvesting.
- **Governance:** Mandate annual external web penetration testing against all internet-facing Web Dispatcher nodes.
- **Validation:** Perform HTTP vulnerability scans using OWASP ZAP or Burp Suite and verify 100% mitigation of frame-injection and cookie-hijacking vulnerabilities.

## Q7: How do you audit and harden Transport Security in SAP NetWeaver (`STMS` / `SCC4`) to prevent malicious transport injection?

- **Decision:** Enforce transport integrity controls across `STMS`, disable direct client modifications in Production, and secure file-system transport directories.
- **Mechanism:** Set client changeability in `SCC4` to *No Changes Allowed* in QA and Production. Enable transport signature checks using parameter `SYSTEM_CHANGE_OPTION = RESTRICTED`. Secure file directory permissions on `/usr/sap/trans` at the OS level (restricting write access strictly to `<sid>adm`). Audit transport imports using report `RSUSR200` and table `E070`/`E071`.
- **Governance:** Prohibit manual transport file uploads (`CG3Z`/`DATA` folder copies) directly to Production app servers.
- **Validation:** Attempt to import an unsigned transport file into Production and confirm system rejection via `STMS` transport logging checks.

## Q8: How do you secure API communication between SAP S/4HANA and external platforms using OAuth 2.0 Mutual TLS (mTLS)?

- **Decision:** Enforce mTLS client certificate authentication and OAuth 2.0 Bearer tokens for all inbound REST/OData API endpoints.
- **Mechanism:** Configure SSL server node in transaction `STRUST` with CA-signed certificates. Register OAuth 2.0 client in transaction `SOAUTH2`. Bind incoming mTLS client certificates to backend system users in table `USRACLEXT` / `CERTRULE`. Require calling external platforms to present both a valid X.509 client certificate and a signed OAuth JWT token.
- **Governance:** Rotate mTLS client certificates annually and revoke expired certificates immediately via CRL/OCSP checking.
- **Validation:** Issue a REST API call via Postman using a missing or expired X.509 certificate and verify TLS handshake failure prior to application layer processing.

## Q9: How do you design continuous vulnerability management for an SAP landscape using SAP Enterprise Threat Detection (ETD) or SecurityBridge?

- **Decision:** Implement real-time SAP-native threat detection engines to continuously scan for anomalous user behavior, authorization bypasses, and system configuration drifts.
- **Mechanism:** Connect backend ABAP audit logs, gateway traces, and HANA DB logs to SAP ETD or SecurityBridge. Configure detection patterns:
  - Execution of critical T-codes outside business hours.
  - Direct database updates bypassing application layer.
  - Unexpected assignments of `SAP_ALL` or authorization object `S_DEVELOP`.
- **Governance:** Establish 24/7 SoC alerting operational SLAs for High/Critical threat events.
- **Validation:** Execute a test unauthorized table edit via background report; confirm ETD triggers an automated Security Incident ticket within 60 seconds.

## Q10: How do you prepare a comprehensive SAP Cybersecurity and Platform Hardening compliance report for an enterprise CISO?

- **Decision:** Deliver a structured executive dashboard categorizing platform security into Identity Governance, Perimeter Hardening, Code Security, and Real-Time Threat Monitoring.
- **Mechanism:** Compile metrics into four key pillars:
  1. *Identity Governance:* 0% unmitigated Critical SoD violations, 100% UAR completion.
  2. *Platform Hardening:* 100% SAL coverage, 0 unencrypted database backups, clean `RZ11` parameters.
  3. *Code Security:* 0 Priority 1 ATC security violations released to Production.
  4. *Threat Monitoring:* 100% log ingestion rate into SIEM/ETD with sub-5 minute incident response SLAs.
- **Governance:** Conduct quarterly CISO security reviews to track platform hardening trends over time.
- **Validation:** Walk executive leadership through live threat monitoring dashboards demonstrating real-time risk reduction across hybrid landscapes.
