# SAP BTP Principal Propagation & Identity Trust Deep-Dive

Spoken architect style: fluent Senior Principal Architect paragraphs — lead with exact T-codes/tables/utilities; never Decision/Mechanism/Governance/Validation headings.

**Product boundaries:** BTP Destinations + XSUAA/IAS + Cloud Connector Principal Propagation + S/4HANA X.509 mapping (`STRUST`, `CERTRULE`, ICM profile parameters). This is **not** Cloud Connector install/HA topology, not IPS provisioning, not GRC EAM Firefighting, and not a substitute for backend PFCG/DCL after the user is mapped.

**Anti-surface rule:** Prefer short-lived X.509 principal mapping and `sy-uname` proof over “install the connector JAR” narratives.

## Q1: How do you configure End-to-End Principal Propagation from SAP BTP through Cloud Connector to an S/4HANA backend using X.509 Certificate Mapping?

- **Decision:** Eliminate technical service users for user-driven BTP apps by propagating the authenticated end-user identity so S/4 PFCG/DCL checks remain authoritative across the hybrid boundary.
- **Mechanism:** Four-layer trust:
  1. *BTP / Destination:* User authenticates Corporate IdP → IAS → XSUAA JWT. Destination: `ProxyType=OnPremise`, `Authentication=PrincipalPropagation` (or `OAuth2SAMLBearerAssertion` when SAML bearer is the designed assertion path).
  2. *Cloud Connector:* Synchronize Subaccount Trust (JWKS). Access Control Principal Type = **X.509 Certificate** for the S/4 HTTPS resource.
  3. *Short-lived cert:* SCC Local CA (or Secure Login Server) issues a short-lived client cert with principal (e.g. `CN=${mail}` / `CN=${name}`) after JWT validation.
  4. *S/4:* Import SCC CA into `STRUST` (SSL Server Standard). Set `icm/HTTPS/trust_client_with_issuer` and `icm/HTTPS/trust_client_with_subject` in `RZ10`. Map CN → ABAP user in `CERTRULE` (preferred) or SU01 SNC/cert fields.
- **Governance:** Ban Production HTTP destinations that silently fall back to Basic/technical users for interactive flows; monitor SCC CA expiry.
- **Validation:** Call from CAP/BAS; in S/4 confirm `sy-uname` is the mapped dialog user via `SM50`/`ST01` (`RC=0` on expected objects)—not a connector technical ID.

## Q2: When do you choose Destination Authentication `PrincipalPropagation` versus `OAuth2SAMLBearerAssertion`?

- **Decision:** Choose the assertion mechanism that matches the backend trust model—do not treat the two labels as interchangeable synonyms.
- **Mechanism:**
  - `PrincipalPropagation`: Cloud Connector materializes the cloud principal (commonly short-lived X.509) toward on-premise HTTPS/RFC resources under SCC Access Control.
  - `OAuth2SAMLBearerAssertion`: Destination exchanges the user token for a SAML bearer assertion consumed by the target (typical for certain SAP cloud / OAuth-protected APIs). Configure token service URL, client id/secret or certificate, and audience/`nameIdFormat` consistently with IAS/XSUAA claims.
  - Always set `ProxyType=OnPremise` only when SCC is in path; cloud-to-cloud stays `Internet` / direct.
- **Governance:** Document per-destination auth type + owner in the interface catalog; change requires CAB if Production.
- **Validation:** Decode/inspect the outbound credential type at SCC or destination trace; confirm backend logon method matches design (cert map vs OAuth/SAML), then re-check `sy-uname` / JWT subject.

## Q3: How do you design `CERTRULE` mapping so cloud identities resolve stably to ABAP users?

- **Decision:** Prefer **rule-based** certificate mapping (`CERTRULE`) over one-off SU01 entries so JML churn does not break hybrid access.
- **Mechanism:**
  - Align SCC principal template (`CN=${mail}` vs login name) with IAS assertion attributes (`mail`, `uid`, `login_name`).
  - In `CERTRULE`, define filter on Issuer (SCC Local CA DN) + Subject pattern; map extracted CN/email to ABAP user alias/ID.
  - Ensure every mapped ABAP user exists, is not locked (`USR02`), and holds required RAP/OData/`S_SERVICE` authorizations.
  - Avoid mapping many cloud subjects onto one shared technical user—that destroys SoD and audit fidelity.
- **Governance:** Dual-control on `CERTRULE` changes; quarterly orphan-rule review; no Production wildcard maps to `SAP*` / broad dialog admins.
- **Validation:** Present two users with different CNs; confirm distinct `sy-uname`. Remove/break one rule → expect cert logon failure before app authorization.

## Q4: Which ICM / `RZ10` parameters are mandatory for trusting Cloud Connector client certificates?

- **Decision:** Explicitly trust only the SCC-issued client cert chain at ICM—do not open anonymous client-cert logon.
- **Mechanism:**
  - Import SCC system/CA cert into `STRUST` PSE used by HTTPS (commonly SSL Server Standard; confirm active PSE for the ICM port).
  - Maintain profile parameters (names as configured on the release): `icm/HTTPS/trust_client_with_issuer`, `icm/HTTPS/trust_client_with_subject` (and related HTTPS client-cert trust settings per SAP note/release).
  - Restart ICM / instance as required after profile activation (`RZ10` → profile → activate).
  - Verify ICM HTTPS port and cipher/profile via `SMICM`.
- **Governance:** Parameter baselines in security hardening checklist; deviations tracked as risk acceptances.
- **Validation:** `SMICM` → trace / certificate list shows trusted issuer; successful PP call uses client cert; untrusted issuer fails TLS/cert logon before PFCG.

## Q5: How should Cloud Connector Local CA versus Secure Login Server (SLS) be chosen for principal certificates?

- **Decision:** Use SCC Local CA for contained landscapes; use enterprise SLS/PKI when corporate crypto policy forbids local CAs or requires centralized issuance/revocation.
- **Mechanism:**
  - *Local CA:* Enable SCC certificate scenario for Principal Propagation; export CA cert to S/4 `STRUST`; rotate per SCC guidance.
  - *SLS / enterprise CA:* SCC requests certs from SLS; ABAP trusts the enterprise issuing CA; revocation via CRL/OCSP per policy.
  - Principal Type remains X.509 in Access Control; only the signing authority changes.
- **Governance:** CA private key custody, rotation SLA, and break-glass recovery documented; Security owns trust anchors, not app developers.
- **Validation:** Inspect issued cert Issuer DN on a live call (ICM/SCC audit); confirm it matches the planned CA; force expiry/rotation rehearsal in non-Production.

## Q6: A BTP call reaches S/4 but `sy-uname` is a technical user—how do you diagnose Principal Propagation failure?

- **Decision:** Treat “technical `sy-uname`” as an identity-plane defect, not an application bug—walk Destination → SCC → ICM/cert map before changing PFCG.
- **Mechanism:** Checklist:
  1. Destination Authentication still `PrincipalPropagation` / correct SAML bearer—not Basic/ClientCredentials.
  2. SCC Access Control Principal Type = X.509; resource path allow-listed; tunnel Connected.
  3. SCC Trust sync current (JWKS); JWT subject present.
  4. Short-lived cert generated (SCC audit/log).
  5. `STRUST` + ICM trust parameters active.
  6. `CERTRULE` match for that CN; user unlocked.
  7. CAP/approuter forwarded user token (not only client-credentials bind).
- **Governance:** Incident ticket must capture Destination name, SCC location ID, cert CN, mapped user, and before/after `sy-uname`.
- **Validation:** After fix, `ST01`/`STAUTHTRACE` shows checks under the person; negative test with Client Credentials destination proves contrast (technical user).

## Q7: How do you wire a CAP (or Approuter) application so Destination calls carry the user principal?

- **Decision:** Require an interactive user JWT into the CAP/Approuter runtime; exchange/propagate that identity into Destination Service—never call OnPremise destinations with only client-credentials when PP is mandated.
- **Mechanism:**
  - Bind XSUAA; Approuter `xs-app.json` routes `authenticationType: xsuaa`.
  - CAP uses Destination reuse / connectivity library with user token forwarding (IAS→XSUAA scopes intact).
  - Destination name referenced by the app matches cockpit entry (`PrincipalPropagation`, `OnPremise`).
  - Separate technical destinations for jobs; do not reuse the PP destination for batch.
- **Governance:** Code review rejects hardcoded Basic passwords; CI checks destination auth type metadata where available.
- **Validation:** Log correlation id: XSUAA `user_name`/`email` → SCC principal → ABAP `sy-uname` identical subject mapping; missing user token yields 401/403 before backend write.

## Q8: How do you keep Principal Propagation correct when IAS brokers Azure AD / Okta (proxy IdP)?

- **Decision:** Stabilize the **subject attribute** used for CN mapping across Corporate IdP → IAS → XSUAA → SCC → `CERTRULE`—attribute drift is the #1 silent break.
- **Mechanism:**
  - Corporate IdP emits immutable identifier (employee ID or UPN/email).
  - IAS application attribute mapping forwards that claim into the assertion consumed by BTP trust.
  - XSUAA JWT claim used by SCC principal template must be the same attribute `CERTRULE` extracts.
  - Ban ad-hoc dual trusts (some apps direct to Azure AD, others via IAS) for the same S/4 mapping set.
- **Governance:** Identity Architecture owns the canonical subject; changes require cross-team impact analysis (BTP + SCC + ABAP).
- **Validation:** For a pilot user, dump IdP assertion attribute, JWT claim, SCC cert CN, and ABAP mapped user—four equal values; change Azure mail nickname and prove mapping policy still holds or fails safely.

## Q9: What is the definitive validation pack for Principal Propagation go-live?

- **Decision:** No Production cutover without positive **and** negative identity proofs plus evidence retention.
- **Mechanism:** Evidence set:
  1. Destination screenshot: Auth + ProxyType.
  2. SCC Access Control: host/path + Principal Type X.509.
  3. `STRUST` CA present; `RZ10` trust parameters active.
  4. `CERTRULE` rule export for Issuer/Subject.
  5. Live call: `SM50`/`ST01` with business user `sy-uname`; expected auth `RC=0` / deny as designed.
  6. Negative: Basic/ClientCredentials destination or broken `CERTRULE` → no business write as wrong identity.
  7. SCC + ICM log excerpts for cert issuance/trust.
- **Governance:** Attach pack to CAB / go-live checklist; Security Architect sign-off.
- **Validation:** Steering review walks the pack; random sample of 3 users across regions shows correct mapping.

## Q10: How do you govern Production Principal Propagation against secret sprawl and break-glass?

- **Decision:** Treat PP as a controlled trust fabric: least destinations, no standing technical bypass, time-boxed break-glass only.
- **Mechanism:**
  - Inventory all OnPremise destinations; flag any Basic/ClientCredentials used by interactive UIs for remediation.
  - Rotate SCC CA / SLS credentials per crypto calendar; alert on expiry &lt; 30 days.
  - Break-glass: temporary technical destination or Firefighter path with ticket, expiry, and mandatory post-review—never permanent.
  - Separate Subaccounts Dev/Test/Prod trusts and CAs—no copying Production secrets downward.
- **Governance:** Quarterly access review of Destination editors + SCC admins; SoD between Destination change and `CERTRULE` change where staffing allows.
- **Validation:** Audit sample shows zero interactive Production apps on Basic destinations; last CA rotation evidence dated; break-glass tickets closed with log review.
