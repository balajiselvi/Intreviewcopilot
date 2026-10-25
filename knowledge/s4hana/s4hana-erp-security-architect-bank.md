# SAP ECC, S/4HANA & ERP Security Architecture (Edition-Aware)

Spoken architect style: fluent Senior Principal Architect paragraphs — lead with exact T-codes/tables/utilities; never Decision/Mechanism/Governance/Validation headings.

**Product boundaries:** Authorization mechanics differ by deployment:
- **ECC / S/4HANA on-premises / Private Edition:** PFCG single/composite/derived roles, SU24/SU25, classic TCodes + Fiori.
- **S/4HANA Cloud Public Edition:** Maintain Business Roles / Business Catalogs / restriction types via IAM apps—**not** classic PFCG expert mode as the primary design tool.
Never answer a Public Edition question with “open PFCG and derive org levels” as the main path.

**Anti-surface rule:** Prefer edition-specific IAM tooling, simplification-item auth impacts, and business-process SoD over generic “S/4 security.”

## Q1: How do you choose the authorization design approach for Public Edition versus Private Edition?

- **Decision:** Start from edition: Public Edition = business roles + catalogs + restrictions; Private/on-prem = PFCG + org levels + SU24, with Fiori catalogs bound into roles.
- **Mechanism:** Public: use Maintain Business Roles, assign business catalogs, maintain restriction fields (e.g., company code) in the IAM UI; provision users via IAS/IPS. Private: `PFCG` masters/derived, `SU24` proposals, spaces/pages assignment, transport via CTS. Document hybrid landscapes explicitly when both exist.
- **Governance:** Architecture Decision Record names the edition per system ID. Mixing advice across editions in runbooks is a finding.
- **Validation:** Public: restriction denies cross-company app data; Private: `STAUTHTRACE` shows classic object checks; wrong-tool procedure fails peer review.

## Q2: How do you handle simplification-item and Fiori successor impacts on roles during ECC→S/4 conversion?

- **Decision:** Role remediation is a first-class conversion workstream driven by simplification items and app successors—not a post-go-live tidy-up.
- **Mechanism:** Analyze simplification list for removed TCodes; map to Fiori successors; rebuild menus/catalogs; run `SU25` where applicable for Private; retire obsolete authorizations; regression-test end-to-end processes (O2C, P2P, R2R). Update GRC/IAG rulesets for new apps/objects.
- **Governance:** Critical process without successor role mapping = conversion risk to Deploy gate. Business owns process sign-off; Security owns auth mapping.
- **Validation:** Persona completes process on S/4 with new apps; obsolete TCode removed from role; ARA/IAG rules updated and simulation clean or mitigated.

## Q3: How do you design finance, procurement, and OTC authorizations without packing SoD into one composite?

- **Decision:** Split create / change / display / approve by process step into single roles (or Public restriction-aware business roles), then package composites carefully for assignment only.
- **Mechanism:** Examples: PR create vs approve; vendor master maintain vs payment run; billing vs receipt of payment posting. Use org restrictions (BUKRS, EKORG, VKORG). Align Fiori apps to the same splits. Feed GRC ARA / IAG Access Analysis with the resulting functions.
- **Governance:** Risk owners for each SoD pair; mitigations time-bound. Composite that recombines toxic singles requires explicit acceptance.
- **Validation:** Two-user path succeeds; single-user toxic path fails auth or workflow; simulation shows expected risk when wrongly combined.

## Q4: How do you secure custom transactions, custom Fiori, and clean-core extensions?

- **Decision:** Custom capability follows clean-core preference: side-by-side BTP or released APIs before core modification—and every custom entry point gets SU24/service auth design.
- **Mechanism:** Register custom TCode in `SE93` with auth object checks; maintain `SU24`; for custom OData/CDS, define DCL/authorizations; on BTP extensions, use XSUAA scopes + principal propagation to S/4. Prohibit wildcard `S_TCODE` ranges that include `Z*` broadly in business roles.
- **Governance:** Extension review board includes Security. Unregistered `Z` TCode in Production is a defect.
- **Validation:** Custom app denied without object; DCL filters company code; BTP call without scope fails; with scope + S/4 auth succeeds.

## Q5: How do you govern technical communications (RFC, OData, IDoc) for ERP landscapes?

- **Decision:** Interface identities are system/communication users with allowlisted function groups/services—separate from Dialog process users.
- **Mechanism:** `SM59` destinations with least auth; `S_RFC` / service allowlists; IDoc partner profiles with controlled users; monitor `ST03`/`SM58`/`SXMB*`/`SRT*` as applicable. Rotate secrets via PAM. Trusted RFC only where architected.
- **Governance:** No Dialog user in interface destinations. Certificate expiry owned jointly by Basis + Security.
- **Validation:** Destination test OK; unauthorized FM call fails; Dialog password rejected by policy scan; rotation reconnect test logged.

## Q6: How do you approach SoD and access risk across ECC/S/4 business processes?

- **Decision:** SoD is process-driven (functions in ruleset), not “role name” driven—remediate design before stacking mitigations.
- **Mechanism:** Maintain functions/actions in GRC ARA or IAG Access Analysis; run user/role level analysis; remediate by splitting roles; mitigate with control owners where unavoidable; certify periodically. Include Fiori apps/services in ruleset coverage, not only TCodes.
- **Governance:** Critical risk open without owner blocks Deploy. False positives fixed in ruleset with change control.
- **Validation:** Before/after risk counts; mitigating control tested; user-level report clear or accepted with evidence.

## Q7: How do you manage privileged ERP access (Basis, Security, Developer) in Production?

- **Decision:** Standing Production development and wide table access are eliminated; emergency via Firefighter/IAG PAM with log review.
- **Mechanism:** Remove `S_DEVELOP` change, wide `S_TABU_*`, `SCC4` from business/job roles; use GRC EAM / IAG PAM for temporary elevation; client open procedures dual-controlled. Security admin roles split per SoD (user admin vs role admin) where required.
- **Governance:** Firefighter logs reviewed by controllers within SLA. Permanent Production developer key = audit finding.
- **Validation:** Developer Dialog cannot change Production code; Firefighter path works with log; `SUIM` critical auth report clean for business users.

## Q8: How do you test ERP authorization for transport and cutover?

- **Decision:** Every role wave has QAS evidence before Production import; cutover includes user compare / business-role publish and smoke tests for tier-0 processes.
- **Mechanism:** Transport roles; run `PFCG` user comparison or Public role activation steps; execute smoke scripts (post journal, create PR, display customer); verify batch users. Rollback = reimport prior role transport.
- **Governance:** Deploy checklist requires Security signature. Hotfix without QAS evidence needs executive acceptance.
- **Validation:** STMS RC=0; smoke pass; negative SoD still denied; batch jobs green under technical users.

## Q9: How do you explain organizational restrictions consistently across derived roles and Public Edition restrictions?

- **Decision:** Org restriction is a first-class design artifact—derived-role org levels (Private) or business-role restrictions (Public)—kept aligned to the enterprise org model.
- **Mechanism:** Private: master + derived via `PFCG` org levels. Public: maintain restriction types/values on business roles. HR movers update assignments via IPS/IAG/GRC. Do not hard-code org in unrelated authorization fields inconsistently.
- **Governance:** Single org master data ownership; security mapping updated when company codes plants change.
- **Validation:** User restricted to BUKRS 1000 fails 2000 posting/display as designed in that edition’s tool; mover updates verified.

## Q10: What Principal Architect narrative ties clean-core, identity planes, and ERP authorization together?

- **Decision:** Identity authenticates (IAS), provisioning assigns (IPS/IDM), governance simulates/approves (IAG/GRC), ERP enforces (PFCG or business roles), and extensions stay clean-core with their own XSUAA boundaries.
- **Mechanism:** Draw the path for a joiner: HR → IPS → IAS → ERP role/business role → Fiori app → object check. State edition. State where SoD is analyzed. State where secrets for interfaces live (PAM).
- **Governance:** No plane is asked to do another’s job (e.g., IAS groups alone are not ERP SoD control).
- **Validation:** End-to-end joiner test; SoD simulation; app trace; leaver revocation across planes within SLA.
