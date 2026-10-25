# SAP Cloud Identity Services — IAS & IPS Architecture

Spoken architect style: fluent Senior Principal Architect paragraphs — lead with exact T-codes/tables/utilities; never Decision/Mechanism/Governance/Validation headings.

**Product boundaries:**
- **IAS** = authentication, SSO, MFA, corporate IdP federation, application trust.
- **IPS** = provisioning/synchronization with transformations between source and target systems.
- Neither replaces **PFCG**, **IAG SoD**, nor **SF RBP**. BTP **XSUAA** consumes IAS trust for app authz via role collections.

**Anti-surface rule:** Prefer trust config, conditional auth, IPS transforms, proxy systems, and job error codes over “IAS is the IdP.”

## Q1: How do you place IAS in a corporate IdP federation without making IAS a shadow HR directory?

- **Decision:** Corporate IdP remains workforce authenticator where required; IAS is the SAP-facing IdP/hub that trusts the corporate IdP and brokers apps (S/4, BTP, SF, Ariba).
- **Mechanism:** In IAS Administration Console: add Corporate Identity Provider (SAML/OIDC); configure NameID/attributes; set Application SSO to prefer corporate IdP; optionally Identity Federation / conditional linking. Maintain application configurations per SAP cloud app with correct ACS URLs and certificates.
- **Governance:** Break-glass local IAS passwords limited to named admins. Attribute contract (email, employeeNumber) owned by IAM architecture.
- **Validation:** User SSO via corporate IdP into test app; local password path disabled for workforce; wrong NameID fails uniquely; certificate expiry monitored.

## Q2: How do you design MFA and risk-based authentication in IAS for privileged SAP admins?

- **Decision:** Step-up / MFA mandatory for privileged application access and IAS admin consoles; baseline MFA for workforce per policy.
- **Mechanism:** Configure Risk-Based Authentication / Authentication Rules on applications: network, group, or app-specific MFA requirements. Integrate TOTP/SMS/WebAuthn per corporate standard. Exclude only break-glass IDs with compensating controls.
- **Governance:** MFA bypass exceptions time-bound and ticketed. Admin rule changes dual-approved.
- **Validation:** Privileged app prompts MFA; non-privileged baseline behaves per rule; bypass ID logged; failed MFA does not fall open.

## Q3: How do you configure IPS source, target, and proxy systems for hybrid SAP landscapes?

- **Decision:** Explicitly classify each connector: **source** (HR/SF/IDM), **target** (IAS, S/4, BTP, AD), **proxy** (read-through patterns)—never ambiguous dual-write without ADR.
- **Mechanism:** In IPS: create systems with auth (OAuth/cert/basic per connector); set properties (URL, client ID); schedule jobs; use proxy only when architecture requires. Map SF → IAS → BTP/S/4 chains with clear order.
- **Governance:** Production connector secret rotation owned by IAM. Dual sources for same person banned without merge rules.
- **Validation:** Job reads source count; provisions target sample; proxy read returns expected; secret rotation reconnects.

## Q4: How do you write IPS transformations that implement joiner–mover–leaver without silent wrong-access?

- **Decision:** Transformations encode correlation keys, filters, and role/group mappings as reviewed code—not ad-hoc UI clicks in Production.
- **Mechanism:** Use JSON transforms: `sourcePath`/`targetPath`, conditions on `employeeStatus`, mappings from jobCode to groups/role collections, `skipOperations` for deletes where soft-disable required. Filter test users. Version transforms in export/change control.
- **Governance:** Transform change = CR + peer review. Production edit without export backup forbidden.
- **Validation:** Terminate user → target inactive; mover updates group; wrong department does not receive privileged mapping; job log shows skipped filtered users.

## Q5: How do you provision BTP role collections via IAS groups and IPS safely?

- **Decision:** Map IdP/IAS groups to BTP role collections in trust configuration; IPS maintains group membership—do not manually accumulate Production role collections on users.
- **Mechanism:** IAS groups asserted or provisioned; BTP Cockpit trust → role collection mappings; XSUAA `xs-security.json` defines templates; apps enforce scopes. IPS target for BTP platform users/groups as supported.
- **Governance:** Privileged role collections (Admin, SecurityAdmin) not in open HR job mappings. Quarterly review of mappings.
- **Validation:** User in group gets role collection; removal drops access; app scope missing denies API; Admin mapping absent for normal job codes.

## Q6: How do you troubleshoot “SSO works but user has no access” across IAS/IPS/app?

- **Decision:** Separate authentication success from provisioning/authorization failure—check IAS subject, IPS assignment, then app authz plane.
- **Mechanism:** IAS troubleshooting: authentication logs, NameID, app config. IPS: job logs, failed entities, transform errors. App: SF RBP / PFCG / BTP role collections / Ariba groups. Confirm correlation key consistency.
- **Governance:** Ban granting temporary Admin in every plane to “make it work.” Ticket records which plane failed.
- **Validation:** After fix at correct plane, access works; other planes unchanged; regression user still denied appropriately.

## Q7: How do you manage certificates, secrets, and technical users for IAS/IPS connectors?

- **Decision:** Prefer certificates/OAuth clients over long-lived passwords; vault secrets; separate technical users per connector purpose.
- **Mechanism:** Upload signing/encryption certs in IAS apps; IPS system auth with client credentials; rotate before expiry; restrict who can download keystores. Monitor job failures after rotation.
- **Governance:** Shared connector password in chat = incident. CMDB ownership per client ID.
- **Validation:** Rotation test job success; revoked secret fails; cert expiry alert tested; least privilege technical user cannot admin IAS UI.

## Q8: How do you orchestrate identity lifecycle across SAP cloud and on-premises with Cloud Connector?

- **Decision:** IPS reaches on-prem ABAP/LDAP via secure connectivity (Cloud Connector / tunnel patterns per connector)—identity flow remains HR → IPS → targets, with IAG/GRC for governed assignments when in scope.
- **Mechanism:** Configure Cloud Connector exposures least privilege; IPS ABAP connector properties; provision users/roles; coordinate with GRC ARM/IAG for SoD-gated role assigns if required. Principal propagation for app calls is separate from IPS provisioning.
- **Governance:** Cloud Connector access mappings reviewed; no full RFC wildcards. SoD path documented.
- **Validation:** On-prem user created/locked by IPS job; CC denylist blocks excess; SoD-gated assign still requires IAG/GRC when designed.

## Q9: How do you use SCIM / OIDC / SAML appropriately per application capability?

- **Decision:** Protocol choice is app-driven: SAML/OIDC for SSO; SCIM where provisioning APIs exist; do not force SCIM onto apps that only support IPS connectors/APIs.
- **Mechanism:** Per app: configure SAML2/OIDC in IAS; enable SCIM target if supported; otherwise IPS connector. Document attribute mandates (persistent NameID vs email).
- **Governance:** Protocol ADR per application. Deviations require security review.
- **Validation:** SSO handshake succeeds; SCIM create/patch/disable works where claimed; unsupported SCIM attempt fails with clear design note.

## Q10: What operating evidence do auditors need for IAS/IPS?

- **Decision:** Evidence = trust diagrams, MFA policy, transform exports, job SLAs, privileged group mappings, and leaver samples—not only “we have IAS.”
- **Mechanism:** Export application list + IdP trusts; MFA rules; IPS job history; sample JML; admin roster; incident records for sync failures.
- **Governance:** Control owners for SSO and provisioning separately if org splits AuthN/AuthZ ops.
- **Validation:** Walkthrough leaver within SLA; MFA on privileged app; transform change ticket trail; failed job alert evidence.
