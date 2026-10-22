# SAP BW/4HANA Analysis Authorizations Architecture

Spoken architect style: Decision → Mechanism → Governance → Validation.

**Product boundaries:** BW and BW/4HANA **analysis authorizations** (RSECADMIN / `S_RS_AUTH`) govern authorization-relevant characteristic values for query data. They are **not** a substitute for standard ABAP execution authorizations (`S_RS_COMP`, `S_RS_COMP1`, InfoProvider execute). SAC model DAC and HANA analytic privileges are separate planes when those products sit in front of or under BW.

**Anti-surface rule:** Prefer 0TCA* technical characteristics, hierarchy authorization, colon vs range design, and RSECADMIN trace over “BW has roles.”

## Q1: How do you separate standard BW authorizations from analysis authorizations in a Production design?

- **Decision:** PFCG roles grant *who may execute which query/InfoProvider*; analysis authorizations grant *which characteristic values they may see*. Both are required; neither replaces the other.
- **Mechanism:** PFCG: `S_RS_COMP` / `S_RS_COMP1` (query component), InfoProvider objects (`S_RS_ICUBE`, `S_RS_ADSO`, etc. by release), and `S_RS_AUTH` listing analysis authorization names. RSECADMIN: create analysis authorization objects with characteristics and values. Assign analysis auth names into `S_RS_AUTH` field `BIAUTH`. Do not put company-code ranges only in PFCG org fields and expect query data restriction—BW data slice uses analysis auth.
- **Governance:** Business roles never receive `0BI_ALL` as a convenience default. Query developers get broader analysis auths only in DEV, not Production business composites.
- **Validation:** User with execute auth but empty/wrong analysis auth sees “no authorization” / empty result; `RSECADMIN` → Analysis Authorization Trace shows missing characteristic; `SU53` alone is insufficient for value misses.

## Q2: How do you design authorization-relevant characteristics and technical characteristics (0TCA*) correctly?

- **Decision:** Mark only business-critical characteristics authorization-relevant; always cover special technical characteristics required by the authorization concept for the InfoProvider.
- **Mechanism:** In InfoObject maintenance, set Authorization Relevant. Typical business: `0COMP_CODE`, `0PLANT`, `0SALESORG`, controlling area, profit center. Include technical: `0TCAACTVT` (activity), `0TCAIPROV` (InfoProvider), `0TCAVALID` (validity) as required by the BW authorization concept for that release/scenario. Missing technical characteristics cause fail-closed query behavior that looks like “random” empty data.
- **Governance:** Architecture board approves adding a new authorization-relevant characteristic—each one multiplies role maintenance cost.
- **Validation:** RSECADMIN check/generation against query; execute with test user; trace lists each checked characteristic and value; confirm `0TCAIPROV` includes the ADSOs/CompositeProviders in scope.

## Q3: How do you implement hierarchy-based versus flat value analysis authorizations?

- **Decision:** Use hierarchy node authorizations when org structures are hierarchical (cost center / profit center trees); use flat lists/ranges for stable enumerations (few company codes).
- **Mechanism:** In RSECADMIN, for a characteristic with hierarchy, authorize nodes (including subtree aggregation behavior as designed). Maintain hierarchy version/date alignment with query key dates. For flat: include single values, ranges, or exclusion patterns per policy. Design colon authorization (`:`) explicitly when aggregation without detail is allowed—do not discover it in Production incidents.
- **Governance:** Hierarchy change management is a security event: new nodes can grant or deny unintended access. Owners approve hierarchy auth role impacts before Production transport.
- **Validation:** User authorized to parent node sees child values per design; user without node sees deny in analysis auth trace; after hierarchy remapping, retest same queries.

## Q4: How do you prevent and remediate 0BI_ALL and over-broad analysis authorizations?

- **Decision:** `0BI_ALL` is full analytical access—treat it as privileged, equivalent in spirit to standing wide data access, not a developer shortcut in Production.
- **Mechanism:** Inventory `S_RS_AUTH` values via `SUIM` / role export; replace `0BI_ALL` with named analysis auths per persona (Finance controller, Plant analyst). Generate from query only as a starting point, then strip excess characteristics/values. Separate BI admin analysis auths from business consumer auths.
- **Governance:** Automated or periodic SoD/critical access check flags `0BI_ALL` in business roles as audit finding. Exception requires risk acceptance with expiry.
- **Validation:** `SUIM` shows zero business users with `0BI_ALL`; representative queries still return expected slices; privileged BI admin role is Firefighter or tightly owned.

## Q5: How do you authorize BW/4HANA modelling, administration, and business-user access differently?

- **Decision:** Split modeller/developer, BW operations admin, and business query consumer into separate PFCG + analysis auth packages.
- **Mechanism:** Modellers: DTPs, transformations, HANA-embedded artefacts permissions as per BW/4 role templates—restricted in Production. Admins: process chains (`RSPC`), administration cockpit, user/analysis auth maintenance (`RSECADMIN`)—owned by platform. Consumers: query execute + narrow analysis auths only. Transport modelling objects via CTS; do not grant Production change to modellers for break-glass without EAM.
- **Governance:** Production modelling change requires transport path; direct Production modelling is incident-level. Separation of duty between who maintains analysis auths and who owns finance data.
- **Validation:** Business user cannot open RSECADMIN; modeller cannot run Production process-chain alter without admin role; consumer query works with data slice only.

## Q6: How do you troubleshoot “user logs in and opens query but sees no data / wrong orgs”?

- **Decision:** Classify failure: (A) execution authorization, (B) analysis authorization value miss, (C) query/variable default, (D) data not loaded—trace before changing roles.
- **Mechanism:** Confirm `S_RS_COMP` execution succeeds. Run Analysis Authorization Trace in RSECADMIN for the user/query. Check missing characteristic values, hierarchy nodes, `0TCAIPROV`, activity. Compare variable exits/default org fills. Verify InfoProvider data in admin tools independently of authorization.
- **Governance:** Ban granting `0BI_ALL` to “make the query work” in Production. Defect fix must cite trace object/value.
- **Validation:** After adding precise values to analysis auth and transporting, trace shows green/authorized for prior misses; control user without those values still empty/denied.

## Q7: How do you align BW analysis authorizations with S/4 org roles and HR movers?

- **Decision:** Use one enterprise org model: the same company code/plant sets that drive S/4 derived roles should drive BW analysis auth values—or an explicit mapping table owned by Security Architecture.
- **Mechanism:** Maintain mapping (job/dept → analysis auth → characteristic values). On mover, IAM/IPS or GRC provisioning assigns the BW consumer role with the matching `S_RS_AUTH` value. Prefer fewer reusable analysis auths parameterized by org sets over thousands of one-off objects.
- **Governance:** HR attribute change without BW role update is a control failure. Quarterly reconciliation: S/4 org assignment vs BW analysis auth inventory.
- **Validation:** Mover test: S/4 plant role and BW plant analysis auth both update; query slice matches new plant; old plant denied in trace.

## Q8: How do you secure HANA-sourced and Mixed modelling scenarios used by BW/4?

- **Decision:** When queries hit HANA calculation views or mixed scenarios, enforce authorization at the agreed layer—BW analysis auth and/or HANA analytic privileges—without assuming one plane covers both.
- **Mechanism:** Document whether the query is BW-managed InfoProvider (analysis auth primary) or exposes HANA views requiring `_SYS_BI` analytic privileges / repository roles. Technical users for data acquisition get schema privileges least-privilege; business users should not receive broad HANA catalog roles. Align STS/SAML users if SAC live-connects to HANA/BW.
- **Governance:** Architecture Decision Record states the enforcement layer per data product. Dual maintenance without ADR is rejected.
- **Validation:** Deny test at BW layer and, if applicable, at HANA analytic privilege; SAC/BW user cannot bypass via raw HANA DB login.

## Q9: How do you transport and test analysis authorizations across the BW landscape?

- **Decision:** Analysis authorizations and dependent roles move with the same CTS discipline as BW content—test value sets in QAS with Production-like org data.
- **Mechanism:** Transport RSECADMIN objects and PFCG roles together where interdependent. Include test users per persona. Execute positive (authorized slice) and negative (cross-company) query scripts. After import, verify `S_RS_AUTH` assignments and analysis auth active version.
- **Governance:** No direct Production RSECADMIN edits outside emergency + retrospective transport. Role owner signs off data-slice UAT.
- **Validation:** Transport RC=0; QAS and PRD analysis auth definition compare equal for in-scope objects; UAT evidence archived with query names and expected row constraints.

## Q10: What audit evidence proves BW data-access control is operating?

- **Decision:** Auditors need analysis-auth design, absence of `0BI_ALL` in business roles, trace samples, and joiner/mover reconciliation—not only PFCG role lists.
- **Mechanism:** Provide inventory of authorization-relevant InfoObjects; analysis auth catalog; role → `S_RS_AUTH` mapping; privileged BI admin list; sample RSECADMIN traces; change tickets for auth updates.
- **Governance:** Periodic access certification includes BW consumer and admin roles; critical query access reviewed with data owners.
- **Validation:** Walkthrough: user without company code 1000 cannot see 1000 in query result/trace; admin path to grant `0BI_ALL` is controlled; evidence pack matches system extracts.
