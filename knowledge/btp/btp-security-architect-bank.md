# SAP BTP Security, Authentication & Connectivity Architecture

Senior Principal Architect interview bank. Product boundary: **SAP BTP** (Cloud Foundry / Kyma), **XSUAA**, **SAP Cloud Identity Services (IAS/IPS)**, **Destinations**, **Connectivity / Cloud Connector**, and **Principal Propagation**. Do not answer these as classic PFCG/ECC Security or on-prem GRC Access Control questions unless the question explicitly bridges hybrid landscapes.

Spoken architect style: Decision → Mechanism → Governance → Validation.

## Q1: How do you design the overall SAP BTP security architecture for a hybrid S/4HANA landscape?

- **Decision:** Separate identity (who authenticates), application authorization (scopes / role collections), and connectivity (how the call reaches ABAP or other backends) into distinct control planes.
- **Mechanism:** Place SAP IAS as the corporate IdP for human users; bind BTP applications to XSUAA with an `xs-security.json` declaring scopes and role-templates; assign Role Collections in the subaccount; route on-premise calls through Cloud Connector and Destination Service using Principal Propagation where end-user fidelity is required.
- **Governance:** Document trust, destination authentication types, and break-glass admin Role Collections as controlled assets with named owners.
- **Validation:** Walk a business user login → JWT scopes → destination call → ABAP authorization check end-to-end and retain traces from IAS, XSUAA, Cloud Connector, and `STAUTHTRACE`.

## Q2: What is the architectural boundary between SAP IAS and XSUAA on BTP?

- **Decision:** IAS authenticates and federates identity; XSUAA authorizes the application via OAuth2 scopes and Role Collections—never collapse both into one “login role.”
- **Mechanism:** Configure the BTP subaccount trust to IAS (OIDC/SAML). Applications bind to an XSUAA service instance. IAS issues identity assertions; XSUAA mints application JWTs containing scopes derived from Role Collection assignment.
- **Governance:** Prohibit using XSUAA as the long-term corporate directory; keep HR/workforce identity lifecycle in IAS/IPS (or corporate IdP upstream of IAS).
- **Validation:** Decode the application JWT and confirm `scope` claims match Role Collections while `user_name` / email claims originate from IAS attributes.

## Q3: How do you design `xs-security.json` for a CAP or Node.js application on Cloud Foundry?

- **Decision:** Declare least-privilege scopes and role-templates in `xs-security.json`, then map Role Collections outside the application code.
- **Mechanism:** Define `scopes` (e.g., `$XSAPPNAME.read`), `role-templates` that aggregate scopes, and optional `attributes`. Bind the app to XSUAA (`xsuaa` service). Approuter / CAP middleware validates JWT before business logic runs.
- **Governance:** Change control on `xs-security.json`—scope additions require security review because they expand the authorization surface.
- **Validation:** Call protected endpoints with tokens missing required scopes and confirm HTTP 403; with correct Role Collection assignment confirm HTTP 200.

## Q4: How do Role Collections relate to XSUAA role-templates?

- **Decision:** Treat role-templates as application-declared capability bundles and Role Collections as the subaccount assignment object for users or IdP groups.
- **Mechanism:** After deploying an app that exposes role-templates, create Roles from templates in the BTP cockpit, group them into Role Collections, and assign collections to users or map IAS groups to collections.
- **Governance:** Prefer group-to-Role-Collection mapping over per-user cockpit assignments for enterprise scale.
- **Validation:** Assign a collection, force re-login (old tokens do not gain scopes), and verify new JWT contains expected scopes.

## Q5: How do you configure SAP IAS as the identity provider for a BTP subaccount?

- **Decision:** Establish formal trust between the BTP subaccount and IAS so all interactive application logons federate through IAS MFA and conditional access policies.
- **Mechanism:** In BTP Trust Configuration, create an OpenID Connect (or SAML) trust to IAS. Register the BTP application / XSUAA as a relying party in IAS. Map IAS assertion attributes (email, groups, cost center) into the identity claim set expected by XSUAA.
- **Governance:** Disable local BTP platform IdP for business users in Production; reserve platform users for break-glass operators only.
- **Validation:** Initiate SP-initiated login, complete IAS MFA, and confirm the landing application receives a valid XSUAA JWT with correct subject attributes.

## Q6: How does SAP IPS fit into BTP identity provisioning?

- **Decision:** Use IPS for lifecycle provisioning and group synchronization into IAS (and optionally other targets)—not for runtime authentication.
- **Mechanism:** Configure IPS source systems (e.g., Azure AD / SuccessFactors) and target IAS. Map groups that will later drive BTP Role Collection assignment. Schedule or event-trigger sync jobs; monitor IPS job logs for failed transformations.
- **Governance:** Separate Joiner-Mover-Leaver ownership: HR/IdP → IPS → IAS → BTP Role Collections; BTP admins do not manually create business users in Production.
- **Validation:** Create a test identity in the source, run IPS, confirm IAS user/group presence, then confirm BTP Role Collection mapping resolves after login.

## Q7: How do you choose Destination authentication types on BTP?

- **Decision:** Select destination authentication by trust requirement: Principal Propagation for end-user authorization fidelity; OAuth2 Client Credentials or Basic for technical integrations; never default to a broad technical user when user-level checks matter.
- **Mechanism:** In Destination Service, set Authentication to `PrincipalPropagation`, `OAuth2ClientCredentials`, `BasicAuthentication`, `ClientCertificateAuthentication`, or `NoAuthentication` as appropriate. Point Proxy Type to `OnPremise` when routing via Cloud Connector.
- **Governance:** Catalog destinations with owner, purpose, and authentication rationale; prohibit shared “god” technical users for business APIs.
- **Validation:** Call the destination from the application and verify backend logs show the expected identity (propagated user vs technical client).

## Q8: How does Principal Propagation work from BTP through Cloud Connector to ABAP?

- **Decision:** Propagate the authenticated end-user identity so ABAP authorization checks evaluate the real user, not a generic RFC user.
- **Mechanism:** User authenticates via IAS → XSUAA. Destination uses `PrincipalPropagation` with Proxy Type `OnPremise`. Cloud Connector maps the cloud identity to a short-lived X.509 or header-based identity trusted by the ABAP system. ABAP trust is configured for the Cloud Connector / system certificate; authorization objects still check the mapped ABAP user.
- **Governance:** Maintain a controlled identity mapping policy (email → ABAP user, or alias rules) with auditability of mapping changes.
- **Validation:** Trace the ABAP call with `STAUTHTRACE` / `ST01` and confirm the dialog/technical mapped user matches the IAS subject; confirm denial when mapping is removed.

## Q9: How do you harden the SAP Cloud Connector for Production?

- **Decision:** Expose only required backend systems, resources, and protocols—Cloud Connector is an allow-list, not a VPN to the whole LAN.
- **Mechanism:** Install Cloud Connector in the corporate DMZ/network zone; register the BTP subaccount; define Access Control entries for specific HTTPS/RFC hosts and URL paths; enable audit logging; use principal propagation configuration and certificate trust carefully.
- **Governance:** Dual-control changes to Access Control lists; periodic review of exposed resources against application inventory.
- **Validation:** Attempt access to a non-allow-listed host/path and confirm Cloud Connector rejects; review Cloud Connector audit log for the deny event.

## Q10: How do you separate Cloud Foundry Org, Space, and Subaccount security responsibilities?

- **Decision:** Align platform RBAC (Org/Space roles) with application security (XSUAA Role Collections)—they solve different problems.
- **Mechanism:** Subaccount hosts trust, destinations, and entitlements. Org Managers / Space Developers control CF deployments and service bindings. Application end-users receive Role Collections—not SpaceDeveloper.
- **Governance:** Deny business users any SpaceDeveloper / OrgManager entitlements; break-glass platform roles are time-bound and logged.
- **Validation:** Confirm a business test user can run the app via Role Collections but cannot `cf push` or view service keys.

## Q11: How do you secure the Application Router (approuter) in front of BTP microservices?

- **Decision:** Terminate authentication at approuter with XSUAA, forward only validated identity to protected routes, and keep backend services unreachable from the public internet where possible.
- **Mechanism:** Configure `xs-app.json` routes with `authenticationType: xsuaa`, CSRF protection, and scopes on routes. Bind approuter to the same XSUAA instance as backend services. Prefer private destinations / internal routes for service-to-service calls.
- **Governance:** No anonymous routes to privileged APIs; security review for any `authenticationType: none` exceptions.
- **Validation:** Call backend URL directly without JWT and confirm failure; call via approuter with valid token and confirm success.

## Q12: When should a BTP application use OAuth2 Client Credentials instead of a user token?

- **Decision:** Use client credentials only for system-to-system jobs with no interactive user; use user tokens / Principal Propagation whenever a person initiates the action.
- **Mechanism:** Create an XSUAA client with grant type `client_credentials` and limited scopes. Store credentials in Destination Service or secure service bindings—not in source code. Token endpoint issues an application token without user subject.
- **Governance:** Scope client-credentials clients narrowly; rotate secrets; monitor usage.
- **Validation:** Obtain a client-credentials token, confirm absence of user claims, and confirm the backend rejects the call if user-context authorization is required.

## Q13: How do you validate JWT tokens issued by XSUAA?

- **Decision:** Rely on platform libraries (CAP, `@sap/xssec`) to validate issuer, signature, audience, and scopes—do not parse JWTs ad hoc in business code.
- **Mechanism:** Bind the app to XSUAA; middleware fetches JWKS from the UAA; validates `iss`, `aud` / `clientid`, expiry, and required scopes before handler execution.
- **Governance:** Reject tokens from foreign UAA issuers; separate Dev/Test/Prod XSUAA instances and destinations.
- **Validation:** Replay an expired token and a token with wrong audience; confirm both are rejected with 401/403.

## Q14: How do you design multi-tenant security on BTP (SaaS provisioning)?

- **Decision:** Isolate tenant identity and data; never share Role Collections or destinations across tenant boundaries without an explicit SaaS tenancy model.
- **Mechanism:** Use SaaS Provisioning service / tenant-aware XSUAA (`tenant-mode`). Onboarding creates tenant-specific subscriptions; each tenant trusts its IdP or shared IAS with tenant routing. Persist tenant id in data access layer.
- **Governance:** Tenant offboarding must revoke subscriptions, destinations, and lingering tokens.
- **Validation:** Log in as Tenant A and attempt Tenant B data APIs; confirm isolation and authorization failure.

## Q15: How do you configure mutual TLS or client certificates for BTP destinations?

- **Decision:** Prefer client-certificate authentication for high-assurance technical integrations when the backend supports mTLS.
- **Mechanism:** Upload client key pair to Destination Service / Keystore; set destination Authentication to `ClientCertificateAuthentication`; ensure Cloud Connector or direct TLS trust stores trust the issuing CA.
- **Governance:** Certificate lifecycle (issuance, rotation, revocation) owned by Security/Platform; expiry monitoring mandatory.
- **Validation:** Rotate or remove the certificate and confirm destination calls fail; restore and confirm success with backend access logs showing certificate DN.

## Q16: How do you integrate a corporate IdP (e.g., Azure AD / Okta) with IAS and BTP?

- **Decision:** Keep corporate IdP upstream for workforce authentication; use IAS as the SAP-facing IdP hub that brokers trust to BTP applications.
- **Mechanism:** Configure corporate IdP as a trusted IdP in IAS (OIDC/SAML). IAS applies risk-based MFA and conditional rules, then federates to BTP XSUAA trust. Map groups from corporate IdP → IAS → BTP Role Collections.
- **Governance:** Single onboarding path for SAP cloud apps through IAS to avoid divergent trusts per subaccount.
- **Validation:** Disable direct BTP trust to Azure AD (if previously present), login via IAS broker flow, and confirm group-based Role Collection assignment.

## Q17: How do you troubleshoot HTTP 401/403 errors in a BTP Fiori / CAP application?

- **Decision:** Isolate whether the failure is authentication (no/invalid token), application authorization (missing scope), or backend authorization (ABAP/HANA denial after connectivity).
- **Mechanism:** Check browser network for 401 from approuter/XSUAA; decode JWT scopes; verify Role Collection assignment and IAS group mapping; for backend calls inspect Destination auth type, Cloud Connector Access Control, and ABAP `STAUTHTRACE` / Gateway `/IWFND/ERROR_LOG`.
- **Governance:** Maintain a standard troubleshooting runbook separating identity vs authorization vs connectivity layers.
- **Validation:** Reproduce with a known-good user and a known-missing-scope user; capture evidence at each layer before changing configuration.

## Q18: How should technical communication users be designed for BTP-to-S/4 integrations?

- **Decision:** Prefer Principal Propagation for user-driven actions; if a technical user is unavoidable, use a least-privilege Communication / System user scoped to the exact API set.
- **Mechanism:** In S/4HANA create Communication Arrangements / users with narrow catalogs. In BTP store credentials only in Destinations or Credential Store. Never reuse Firefighter or broad `SAP_ALL`-style technical users.
- **Governance:** Inventory all technical destinations; quarterly access review; secret rotation SLA.
- **Validation:** Attempt APIs outside the communication scenario and confirm rejection; review S/4 security audit log for the technical user.

## Q19: How do you govern BTP subaccount entitlements and service entitlements from a security perspective?

- **Decision:** Treat entitlements as part of the attack surface—unused runtimes and services increase exposure.
- **Mechanism:** Assign only required entitlements (XSUAA, Destination, Connectivity, HTML5 repo, etc.) per landscape stage. Separate Dev/Test/Prod subaccounts. Restrict who can create service keys.
- **Governance:** Entitlement changes require architecture approval; Production service key creation is break-glass only.
- **Validation:** Review Cockpit entitlements vs application architecture diagram; remove unused services and confirm apps still operate.

## Q20: How do you enable and use BTP audit logs for security investigations?

- **Decision:** Centralize platform and application audit evidence for access, configuration, and authentication events.
- **Mechanism:** Enable Audit Log service / viewing rights for security operators. Correlate IAS authentication logs, BTP audit events (Role Collection changes, trust changes), Cloud Connector audits, and application business logs.
- **Governance:** Immutable retention aligned to corporate policy; alert on Role Collection grants to privileged collections.
- **Validation:** Change a Role Collection assignment and retrieve the corresponding audit log entry with actor, timestamp, and target.

## Q21: How do you design network connectivity for BTP privately (Private Link / IP allowlisting) versus public endpoints?

- **Decision:** Prefer private connectivity patterns for Production backends; treat public internet exposure as an explicit risk acceptance.
- **Mechanism:** Use Cloud Connector for on-prem; evaluate SAP Private Link / private connectivity options for supported hyperscaler setups; restrict admin API access; place approuter behind hardened ingress controls where available.
- **Governance:** Document data flows and trust boundaries in an architecture decision record before go-live.
- **Validation:** Confirm production backends are unreachable from the public internet except through approved ingress; penetration or network scan evidence retained.

## Q22: How do you secure service bindings and service keys on Cloud Foundry?

- **Decision:** Minimize long-lived service keys; prefer runtime service bindings injected as VCAP_SERVICES.
- **Mechanism:** Bind XSUAA, Destination, and other services directly to the application. If a service key is required for CI, scope it narrowly, store in a secret manager, and rotate.
- **Governance:** Ban unchecked service key proliferation; periodic orphan key cleanup.
- **Validation:** Delete an unused service key and confirm no Production dependency; attempt use of revoked key and confirm failure.

## Q23: How do you implement attribute-based access hints (XSUAA attributes) without confusing them with ABAP org levels?

- **Decision:** Use XSUAA attributes for cloud-app fine-grained checks; keep S/4 organizational authorization in PFCG/ABAP when the system of record is ABAP.
- **Mechanism:** Declare attributes in `xs-security.json`; map IdP claims into attributes via Role Collection configuration; enforce in CAP CDS/`@restrict` or application guards. For hybrid writes to S/4, still rely on Principal Propagation + PFCG.
- **Governance:** Do not assume cloud attributes replace backend SoD or org-level controls.
- **Validation:** Two users with identical scopes but different attributes see different cloud data; both still fail ABAP calls outside their PFCG org levels.

## Q24: How do you handle break-glass administration on BTP?

- **Decision:** Provide time-bound privileged Role Collections / platform roles with mandatory logging—never standing `Admin` for named engineers in Production.
- **Mechanism:** Maintain a break-glass IAS group mapped to privileged Role Collections and limited Subaccount Administrator. Activation via ITSM ticket; session recording or audit review after use.
- **Governance:** 24-hour access reviews after each break-glass event; quarterly dormant account check.
- **Validation:** Activate break-glass, perform a controlled change, revoke access, and produce the audit trail linking ticket → actor → change.

## Q25: How do you promote BTP security configuration across Dev, Test, and Production?

- **Decision:** Promote application code and declarative security (`xs-security.json`) via CI/CD; re-establish trust, secrets, and destinations per landscape—do not copy Production secrets downward.
- **Mechanism:** Transport MTA archives through CF spaces/subaccounts. Recreate Destination URLs and credentials per stage. Re-bind IAS trust separately for Production. Use config-as-code where supported (Terraform / btp CLI) for repeatability.
- **Governance:** Production destination and trust changes require CAB / dual control.
- **Validation:** After promotion, run automated smoke tests for login, scope enforcement, and destination connectivity in each stage.

## Q26: How do you secure Kyma / Kubernetes-based BTP extensions differently from Cloud Foundry?

- **Decision:** Apply the same IAS/XSUAA identity model, but add Kubernetes RBAC, network policies, and secret management controls for the cluster plane.
- **Mechanism:** Use IAS/XSUAA for application OAuth; Kubernetes service accounts for in-cluster auth; NetworkPolicies to limit east-west traffic; store secrets in approved secret stores; expose services via secured API gateway / API rules.
- **Governance:** Separate cluster-admin from application deployer roles; enforce image signing / admission policies where available.
- **Validation:** Confirm a pod without required NetworkPolicy paths cannot reach a sensitive service; confirm JWT still required at the application gateway.

## Q27: How do you connect SAP Analytics Cloud or other SAP cloud apps to BTP/S/4 with consistent identity?

- **Decision:** Use IAS as the common IdP and Principal Propagation / SAML attribute mapping so analytical and transactional access follow the same identity.
- **Mechanism:** Trust SAC and BTP apps to IAS. For live connections to S/4 or HANA, configure SAML/OAuth and propagation so row-level or PFCG checks remain authoritative.
- **Governance:** Align SAC teams/roles with backend analysis authorizations—no “open” live connections.
- **Validation:** Log in as two regional users and confirm SAC live queries and transactional apps show consistent org-scoped data.

## Q28: How do you detect and prevent OAuth scope inflation in BTP applications?

- **Decision:** Treat every new scope as a privileged expansion requiring design review and regression tests.
- **Mechanism:** Review `xs-security.json` diffs in pull requests; map scopes to business capabilities; avoid wildcard or catch-all scopes; split admin scopes from business scopes.
- **Governance:** Security architecture sign-off for scope additions in Production apps.
- **Validation:** Automated tests assert endpoints reject tokens lacking exact scopes; CI fails if new scopes ship without tests.

## Q29: How do you design a hybrid RISE with SAP + BTP security control matrix?

- **Decision:** Clarify ownership: hyperscaler/RISE basis vs customer IAS/BTP apps vs customer ABAP authorization—security is shared, not outsourced entirely.
- **Mechanism:** Document controls for IAS MFA, BTP Role Collections, Cloud Connector ACLs, S/4 PFCG/Fiori, and GRC/IAG where used. Define who operates certificates, destinations, and emergency access.
- **Governance:** RACI for identity incidents, connectivity outages, and SoD remediation across RISE and customer teams.
- **Validation:** Tabletop an identity compromise and a Cloud Connector outage; confirm runbooks name the correct operator per control.

## Q30: What is your go-live security checklist for a BTP application releasing to Production?

- **Decision:** No Production release without verified identity trust, least-privilege Role Collections, hardened destinations/Cloud Connector, secret hygiene, and audit readiness.
- **Mechanism:** Checklist items: IAS trust + MFA enforced; platform IdP disabled for business users; `xs-security.json` reviewed; Role Collection mappings tested; destinations use correct auth type; Cloud Connector ACL minimized; service keys inventoried; approuter routes authenticated; logging/alerts enabled; rollback plan for trust/destination changes.
- **Governance:** Security architect and client cyber sign-off attached to the go-live package.
- **Validation:** Execute negative tests (missing scope, wrong destination auth, non-allow-listed Cloud Connector resource) and retain evidence packs with the release record.
