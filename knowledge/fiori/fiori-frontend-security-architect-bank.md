# SAP Fiori & Front-End Security Architecture

Spoken architect style: fluent Senior Principal Architect paragraphs — lead with exact T-codes/tables/utilities; never Decision/Mechanism/Governance/Validation headings.

**Product boundaries:** Fiori launchpad visibility (catalogs / spaces / pages) is **not** the same as backend execution authorization. Front-end roles grant tiles and target mappings; backend PFCG (or Public Edition business roles) enforce OData/S_SERVICE and business object checks. Gateway (`/IWFND/*`) and backend are often separate systems in hub deployments.

**Anti-surface rule:** Prefer space/page content, OData service activation, `STAUTHTRACE` on backend, and missing-tile vs 403 diagnosis over “assign the Fiori role.”

## Q1: How do you design front-end versus backend roles so tiles appear only when the user can execute?

- **Decision:** Pair every launchpad content assignment with backend authorizations for the same apps—never ship a “tile-only” composite in Production.
- **Mechanism:** Front-end: business catalogs + spaces/pages (or groups/catalogs on older releases) in a Fiori PFCG role. Backend: OData service authorizations (`S_SERVICE` / start authorizations) and application objects from SU24 proposals. In embedded deployments one role may hold both; in hub, transport FE and BE roles as a set and assign both.
- **Governance:** Definition of Done for an app role includes FE content + BE auth + negative test. Orphan FE catalogs without BE are audit defects.
- **Validation:** User sees tile; app loads; `STAUTHTRACE` RC=0; remove BE auth → tile may show but app fails with auth error—treat as failed design and fix pairing.

## Q2: How do you use spaces and pages without creating uncontrolled personalization shadow access?

- **Decision:** Spaces/pages are the governed navigation structure; personalization must not become a path to unauthorized apps.
- **Mechanism:** Maintain spaces/pages via Fiori Launchpad App Manager / Manage Launchpad Spaces (release-dependent). Assign space to role. Restrict who can create public content. Avoid assigning broad catalogs “SAP_*” wholesale to business users.
- **Governance:** Content owners approve space changes; Security reviews addition of admin/diagnostic apps to business spaces.
- **Validation:** User role shows only intended pages; app not in space is unreachable via search if catalog not assigned; transport of space content RC=0.

## Q3: How do you troubleshoot missing tile versus application launch failure?

- **Decision:** Missing tile = content/assignment problem; tile present but error = service/backend auth or configuration problem—do not conflate.
- **Mechanism:** Missing tile: check role catalogs, space/page assignment, cache (`/UI2/INVALIDATE_*` where applicable), user comparison. Launch failure: `/IWFND/ERROR_LOG`, `/IWBEP/ERROR_LOG`, `STAUTHTRACE` on backend user, ICF node active (`SICF`), service activated (`/IWFND/MAINT_SERVICE`). Confirm system alias and RFC to backend in hub.
- **Governance:** Production cache indiscriminate clears scheduled; auth fixes via transport. Temporary `SAP_ALL` banned.
- **Validation:** Catalog assign → tile appears; BE object add → app runs; error log empty on success path.

## Q4: How do you authorize OData and ICF dependencies for custom and standard Fiori apps?

- **Decision:** Every app’s OData services are allowlisted and proposed in SU24—custom services get the same discipline as standard.
- **Mechanism:** Identify services from app documentation / `/IWFND/MAINT_SERVICE`; maintain SU24 proposals; activate ICF nodes needed; assign in backend role. For draft/UI5 freestyle apps, include additional RFC/function auth if used. CDS service bindings follow the release’s auth model (`S_SERVICE`, DCL where applicable).
- **Governance:** Unregistered custom OData in Production is a security finding. Service activation changes require change control.
- **Validation:** `STAUTHTRACE` shows service check pass; deactivate service → controlled failure; custom app UAT with least-privilege role.

## Q5: How do you integrate Fiori SSO (IAS / SAML / OIDC) without weakening backend authorization?

**Aliases / interview phrasing:** configure Fiori SSO; Fiori SSO setup; IAS Fiori setup; SAML2 Fiori Launchpad; Principal Propagation; OIDC FLP trust.

- **Decision:** SSO establishes identity to FLP; backend still enforces ABAP authorizations for the mapped user—trusted RFC must not become universal trust.
- **Mechanism:** Configure FLP authentication (SAML/OIDC via IAS); ensure principal propagation / user mapping to backend. Harden `SM59` trusted connections; avoid hard-coded technical users for interactive apps. For Principal Propagation scenarios, validate CERTRULE / short-lived X.509 patterns where used with Cloud Connector.
- **Governance:** Technical user fallback for interactive Fiori is prohibited. IdP group ≠ backend role unless explicitly provisioned.
- **Validation:** SSO user without BE role denied on app data calls; propagation test shows correct backend `SY-UNAME`; trusted RFC misconfig caught in negative test.

## Q6: How do you secure Fiori apps used for GRC and other privileged admin tools?

- **Decision:** GRC/IAG/admin Fiori apps are privileged—assigned via admin composites or Firefighter, not business employee launches.
- **Mechanism:** Isolate GRC NWBC/Fiori catalogs into security-admin roles; require GRC/IAG entitlements behind them. Do not place Access Request admin apps in employee spaces.
- **Governance:** Quarterly review of who has GRC Fiori admin catalogs. Break-glass for emergency access management UI.
- **Validation:** Business user search cannot launch GRC config apps; admin user can; SUIM shows catalog restricted.

## Q7: How do you validate Fiori security during S/4HANA conversion or Fiori upgrade?

- **Decision:** Treat content delta (deprecated apps, successor apps, new services) as a security work item in Realize—not a Basis-only upgrade task.
- **Mechanism:** Run app obsolescence analysis; remap catalogs to successor apps; SU25/SU24 for new checks; regression test persona scripts; invalidate caches post-import. Update spaces/pages to remove dead tiles.
- **Governance:** Go-live blocked if critical process apps lack FE+BE pairing after upgrade. Defects tracked with app IDs.
- **Validation:** Persona UAT on successor apps; `STAUTHTRACE` clean; no critical missing tiles in Production smoke.

## Q8: How do you handle key-user extensibility and custom tiles safely?

- **Decision:** Key-user and custom UI adaptations are extensions—authorize who can adapt, and ensure underlying services remain least privilege.
- **Mechanism:** Restrict adaptation authorizations; transport adaptations where required; ensure custom tile target mappings point to approved services. Review custom CDS DCLs for data exposure.
- **Governance:** Clean-core preference: prefer in-app extensibility with security review over uncontrolled IDE deploys. Production direct adapt limited.
- **Validation:** Key user without adapt auth cannot change UI; custom tile denied without service auth; DCL deny evidenced for restricted company code.

## Q9: How do you performance- and security-test catalog assignment at scale?

- **Decision:** Avoid mega-catalogs that dump thousands of apps into a role—performance and audit both suffer.
- **Mechanism:** Build persona-sized catalogs; use spaces to structure; monitor FLP load; periodically remove unused apps via usage analytics where available. Composite assignment still requires user comparison.
- **Governance:** Catalog size standards in naming/design guidelines. Security rejects “assign all SAP business catalogs.”
- **Validation:** FLP loads within accepted SLA; SUIM shows intentional catalog set; unused admin apps absent from business roles.

## Q10: What evidence proves Fiori access control for audit or Deploy gate?

- **Decision:** Evidence = role→space/catalog matrix, backend object pairing, SSO config summary, and positive/negative test results per critical app.
- **Mechanism:** Export role menus/catalogs; list OData services; attach traces; document hub vs embedded; include cache-refresh procedure in runbook.
- **Governance:** Deploy quality gate requires security sign-off on critical persona apps.
- **Validation:** Walkthrough: missing BE auth fails app; missing catalog hides tile; SSO user mapping correct; transport list matches QAS tested content.
