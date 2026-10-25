# SAP Integration & Cross-Application Security Architecture

Spoken architect style: fluent Senior Principal Architect paragraphs — lead with exact T-codes/tables/utilities; never Decision/Mechanism/Governance/Validation headings.

**Product boundaries:** Covers the access path **identity source → authentication → application authorization → data access → provision/deprovision**. Includes RFC/trusted-RFC, OData/SOAP/REST, SAML/OIDC/OAuth, Integration Suite/CPI, certificates/secrets, and hybrid connectivity. Not a substitute for product-specific banks (PFCG, RBP, XSUAA).

**Anti-surface rule:** Prefer destination auth methods, principal propagation vs technical user, allowlists, and secret rotation runbooks over “secure the interface.”

## Q1: How do you secure RFC and trusted-RFC between SAP systems?

- **Decision:** Prefer non-trusted RFC with least-privilege technical users; enable trusted-RFC only for architected system pairs with controlled trust relationships.
- **Mechanism:** `SM59` destinations: connection type, auth (stored user vs current user), SNC. Trusted systems via `SMT1`/`SMT2`. Restrict `S_RFC` / allowlisted FMs. Avoid Dialog users in destinations. Monitor `SM58`/`ST03` RFC usage.
- **Governance:** New trusted-RFC = CAB. Password in destination owned by PAM rotation. Annual trust inventory.
- **Validation:** Destination test OK; unauthorized FM denied; Dialog user rejected by policy scan; trust removal breaks only intended path.

## Q2: How do you choose technical user versus principal propagation for OData/API calls?

- **Decision:** Interactive user context → principal propagation; system batch/integration → dedicated technical user—never mix without ADR.
- **Mechanism:** BTP Destinations: `PrincipalPropagation` vs `BasicAuthentication`/`ClientCertificate`. Cloud Connector CERTRULE / short-lived certs for ABAP mapping. CPI/Integration Suite credential artifacts. Document which APIs mutate finance/HR.
- **Governance:** Propagation identity must map to least ABAP/cloud auth. Technical users banned from UI login.
- **Validation:** Propagation test shows correct `SY-UNAME`; technical user batch succeeds; stolen technical user cannot SSO as human.

## Q3: How do you secure SAP Integration Suite / Cloud Integration iFlows?

- **Decision:** Each iFlow uses least-privilege credentials, input validation, and segregated packages for sensitive domains (HR/payroll vs commodity master).
- **Mechanism:** Deploy OAuth/client cert to adapters; store secrets in Secure Store; restrict package transport roles; enable logging without leaking PII payloads to broad ops roles; network allowlists to backends.
- **Governance:** Production deploy via transport/CI; no ad-hoc credential paste. Data-classification labels on packages.
- **Validation:** iFlow runs; revoked secret fails; ops user without package auth cannot deploy; payload log redaction verified where required.

## Q4: How do you manage certificates and secrets across hybrid landscapes?

- **Decision:** Enterprise PKI + vault (CyberArk/CCP) for secrets; certificate inventory with expiry SLAs—no unmanaged PSE sprawl.
- **Mechanism:** `STRUST` PSEs for ABAP; IAS/BTP cert stores; CPI keys; rotate with coordinated cutover. Prefer mTLS for server-to-server. Document owners in CMDB.
- **Governance:** Expiry < 30 days = incident risk. Shared mailbox private keys forbidden.
- **Validation:** Rotation rehearsal in QAS; Production cutover checklist; monitoring alerts on expiry; failed handshake after revoke.

## Q5: How do you design LDAP/AD integration securely for SAP and cloud apps?

- **Decision:** AD is often account/group plane; SAP apps consume groups via IAS/IPS—IDM/IPS writes least attributes; no Domain Admin for connectors.
- **Mechanism:** LDAPS; service accounts least privilege; OU placement standards; group naming for BTP/Ariba/SF mappings; disable vs delete policy. Monitor failed binds.
- **Governance:** Privileged AD group changes dual-controlled. Orphan AD accounts reconciled.
- **Validation:** LDAPS only; service account denied admin; group membership drives app access test; leaver disables AD + targets.

## Q6: How do you prevent identity mismatches across SAP and non-SAP systems?

- **Decision:** One correlation strategy (employee ID / UUID) owned by IAM—email as sole key is fragile.
- **Mechanism:** IPS/IDM transforms enforce key; IAS loginName policy; ABAP alias/`BNAME` rules; Ariba/SF keys aligned. Reconciliation jobs detect duplicates/orphans.
- **Governance:** Key change = migration project. Manual rename without IAM ticket banned.
- **Validation:** Duplicate email caught; correlation report clean; mover keeps key; provisioned targets share same external ID.

## Q7: How do you troubleshoot provisioning and synchronization defects end-to-end?

- **Decision:** Follow the path: source record → transform → target API → app authz—fix each hop’s logs before redesigning roles.
- **Mechanism:** IPS job logs / IDM task logs; target `SU01`/SCIM; IAS troubleshooting; app-side RBP/PFCG/role collections. Capture entity ID and timestamps.
- **Governance:** Hotfix at wrong hop creates drift—document SoR. SLA on failed jobs.
- **Validation:** Injected failure surfaces in correct log; fix restores sync; no duplicate target accounts.

## Q8: How do you secure API management and external developer access?

- **Decision:** External APIs fronted by API Management/gateway with OAuth scopes, rate limits, and app registration—not exposed raw ERP services.
- **Mechanism:** Register clients; issue scoped tokens; map to backend technical user or propagation; throttle; threat protect. Separate sandbox vs Production clients.
- **Governance:** Client owner + data owner approval. Scope expansion = CR.
- **Validation:** Token without scope denied; rate limit triggers; revoked client fails; backend user least privilege proven.

## Q9: How do you architect security across multi-cloud and hybrid SAP estates?

- **Decision:** Segment by trust zone (corporate, SAP cloud, hyperscaler, partners); identity hub (IAS) + governance (IAG/GRC) + vault for secrets; product authz stays local.
- **Mechanism:** Network paths via Cloud Connector/Private Link patterns; IdP federation; consistent naming; central logging to SIEM; per-platform break-glass.
- **Governance:** Shared-responsibility matrix per platform (RISE R&R, hyperscaler, SaaS). Cross-cloud admin SoD.
- **Validation:** Zone diagram matches runtime; CC exposure least; SIEM shows auth events; partner access time-bound.

## Q10: What evidence proves integration security for audit/go-live?

- **Decision:** Inventory of interfaces, auth methods, technical users, cert expiry, and sample deny tests—not a Visio alone.
- **Mechanism:** Interface register; destination auth report; PAM ownership; IPS job SLA; negative API tests; incident runbooks.
- **Governance:** Deploy gate requires Security sign-off on tier-0 interfaces (payments, HR, identity).
- **Validation:** Walkthrough one human SSO path and one technical API path with deny proofs; rotation evidence; orphan report clear.
