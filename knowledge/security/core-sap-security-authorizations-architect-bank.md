# Core SAP Security & Authorizations Architecture

Spoken architect style: Decision → Mechanism → Governance → Validation.

**Product boundaries:** ABAP authorization (PFCG / SU24 / SU25) on ECC and S/4HANA on-premises or Private Edition. This is **not** SuccessFactors RBP, **not** BTP XSUAA role collections, and **not** S/4HANA Cloud Public Edition Maintain Business Roles / IAM apps—name the edition before describing role maintenance.

**Anti-surface rule:** Prefer authorization objects, org levels, user comparison, transport of generated profiles, and trace evidence over textbook definitions of “what is a role.”

## Q1: How do you design a least-privilege role architecture for ECC versus S/4HANA Private Edition without collapsing into mega-roles?

- **Decision:** Separate single roles by task (display / change / approve) and org scope; use composites only as assignment packages—not as the place where authorization objects are maintained. Treat derived roles as org-value overlays on a stable master, not as copies of divergent menus.
- **Mechanism:** In `PFCG`, maintain master single roles with menus and authorization data; derive child roles and maintain only organizational levels (`$BUKRS`, `$WERKS`, `$VKORG`, etc.). Keep S_TCODE / app catalogs aligned to the menu. For S/4 Private Edition, bind Fiori business catalogs to backend PFCG roles; do not grant `SAP_ALL` / `SAP_NEW` outside break-glass. Prefer explicit authorization objects over `*` in critical fields (`ACTVT`, company code, document type).
- **Governance:** Naming convention enforces task + org + system (`Z_<AREA>_<TASK>_<ORG>`); SoD-sensitive pairs (create vs approve) never share a single role. Role owners approve every Production assignment change.
- **Validation:** `SUIM` → Users by Complex Selection / Roles by Complex Selection; `PFCG` user comparison (`User` tab → Compare); negative test that create-only user cannot approve (`SU53` / `STAUTHTRACE` shows missing `ACTVT=02` or workflow object).

## Q2: How do you administer users (SU01) so technical, dialog, and communication identities stay in separate risk classes?

- **Decision:** Classify every identity by user type and purpose before granting roles—Dialog, System, Communication, Service, Reference—and never reuse a Dialog user as an interface identity.
- **Mechanism:** `SU01`: set User Type, Validity From/To, User Group, Company Address, and SNC/alias where used. Technical RFC/OData users: System or Communication type; password policy via `RZ10`/`RZ11` (`login/min_password_lng`, `login/fails_to_user_lock`) and preferably certificate or Secure Store rather than shared passwords. Lock leavers via `SU01` lock + validity end; mass via `SU10`. Assign roles on the Roles tab; execute User Comparison so generated profiles attach (`AGR_USERS` / `UST04` consistency).
- **Governance:** Dialog users prohibited on `SM59` destinations; interface users prohibited from SAP GUI interactive login where policy requires (logon ticket / SNC only). Privileged Dialog IDs (security admins) in dedicated user group with dual-control for role assignment.
- **Validation:** `SUIM` → Users by Logon Date / Users with Critical Authorizations; confirm User Type and locked status; attempt GUI logon to Communication user—must fail; `SM59` connection test succeeds with that technical user.

## Q3: How do you use SU24 and SU25 so upgrades do not silently widen Production authorizations?

- **Decision:** Treat `SU24` as the controlled proposal source for PFCG, and `SU25` as a gated upgrade workbench—never auto-accept SAP defaults into custom roles without delta review.
- **Mechanism:** `SU24`: maintain Check Indicator and Proposal values per transaction / service (e.g., `FB01` → `F_BKPF_BUK`). After upgrade/conversion: `SU25` steps 2a/2b/2c to compare SAP defaults vs customer tables (`USOBT_C` / `USOBX_C`). Transport customer SU24 via the SU25 transport step. In `PFCG`, Expert Mode → Read old status / Merge with new data only after reviewing changed objects. For Fiori/OData, maintain proposals for services (`/IWFND/MAINT_SERVICE` related objects) the same way—do not leave blank Check Indicators on new apps.
- **Governance:** SU25 execution requires Change Request + Security Architect sign-off; no Production `SU25` without prior QAS merge evidence. Changes that introduce critical objects (`S_DEVELOP`, `S_TABU_DIS`, `S_USER_*`) escalate to CAB.
- **Validation:** After merge, `SUIM` compare role before/after; `STAUTHTRACE` on representative transactions confirms expected checks; role transport RC=0 in `STMS` and user comparison clean (`PFCG` yellow status cleared).

## Q4: How do you troubleshoot “missing authorization” when SU53 lies or is incomplete?

- **Decision:** Prefer system-wide or user-specific authorization traces over a single `SU53` snapshot—especially for RFC, Fiori, batch, and multi-system calls.
- **Mechanism:** Start with `SU53` for the last failed check. Escalate to `STAUTHTRACE` (user/server filter, evaluate with Check Result = Failed). Use `ST01` Authorization Check filter when older landscapes require it. For Fiori: trace both Gateway front-end and backend; inspect `/IWFND/ERROR_LOG` and `/IWBEP/ERROR_LOG`. For batch: `SM37` job user + `STAUTHTRACE` during job window. Distinguish missing `S_TCODE`/service vs missing field value vs org level.
- **Governance:** Temporary `SAP_ALL` for diagnosis is forbidden in Production; use trace + copy of role in non-prod. Any Production role change for a defect requires ticket + post-fix evidence.
- **Validation:** Reproduce with test ID holding only the remediated role; `STAUTHTRACE` shows RC=0 for the prior failing object; business confirms transaction/app completes; document object/field/value in the defect.

## Q5: How do you govern critical transactions and privileged access (security admins, developers, Basis) on ABAP systems?

- **Decision:** Isolate privileged access into firefighter / emergency or tightly owned admin roles; never bury `S_USER_*`, `S_DEVELOP`, `S_TABU_*`, or client-open powers in business composites.
- **Mechanism:** Maintain critical TCode / object lists (e.g., `SCC4`, `SE16`/`SE16N`, `SM30`, `PFCG`, `SU01`, `STMS`, `SE37`/`SE38`/`SA38`). Restrict `S_TABU_DIS`/`S_TABU_NAM` by authorization group; restrict `S_DEVELOP` `ACTVT` and object types. Prefer GRC EAM / IAG PAM for emergency elevation with logging (`GRAC_SPM_*` sync) over standing `SAP_ALL`. Security admin roles: split user admin vs role admin where SoD requires (`S_USER_GRP` vs `S_USER_AGR` / `S_USER_VAL`).
- **Governance:** Standing Production developer change access is an audit finding; mitigating control = Firefighter + code transport path. Quarterly privileged access review with role-owner attestation.
- **Validation:** `SUIM` critical authorization reports; attempt `SE16` on restricted table—denied; Firefighter checkout produces controller reviewable log; no Dialog user retains `SAP_ALL` outside approved break-glass.

## Q6: How do you secure RFC, OData, and technical communication users end-to-end?

- **Decision:** Every interface identity is scoped to the exact function groups/services it calls, with trusted-RFC and destination hardening—no shared “interface mega-user.”
- **Mechanism:** Create Communication/System users; assign roles with `S_RFC` (RFC_NAME / RFC_TYPE) or, preferably, allowlisted function modules via unified connectivity controls where available; for OData, authorize service activation + backend objects. `SM59`: connection type, auth method (current user vs stored), SNC; avoid storing Dialog passwords. Trusted RFC (`SMT1`/`SMT2`) only between controlled systems with least trust. Rotate credentials via PAM/CyberArk or controlled secret store; update destinations after rotation.
- **Governance:** Interface users cannot own wide `S_TABU_*` or `S_DEVELOP`. Password in wiki/email is a security incident. Cross-client RFC reviewed in architecture CAB.
- **Validation:** `SM59` Connection/Unicode/Authorization tests; negative call to non-allowlisted FM fails; `STAUTHTRACE` on technical user shows only expected objects; destination user type ≠ Dialog.

## Q7: How do you redesign and remediate roles when SoD and usage data show toxic combinations?

- **Decision:** Remediate by splitting duties into separate single roles and reassigning composites—not by mass-mitigating every risk in GRC without design change.
- **Mechanism:** Pull usage from `ST03N`/`STADL`/`SUIM` change docs and GRC ARA / IAG Access Analysis hits. Split create vs approve objects into different single roles; remove unused TCodes via menu cleanup and SU24-driven rebuild. Use role comparison (`PFCG` Utilities → Cross-System Comparison / `PFCG_COMPARE`) and download/upload carefully. Transport remediated roles; schedule user comparison job (`PFCG_TIME_DEPENDENCY` / `RHAUTUPD_NEW`) so profiles stay current.
- **Governance:** Risk owners accept residual risk only with mitigating control ID and expiry; false positives fixed in ruleset, not by ignoring Production conflicts forever.
- **Validation:** Re-run ARA/IAG simulation for impacted users—risk count drops or is mitigated with evidence; UAT scripts pass for both duties with two users; transport RC=0 and `PFCG` status green.

## Q8: How do you transport security changes so Production authorizations match QAS test evidence?

- **Decision:** Roles, SU24 customer tables, and related customizing move only via CTS with the same sequence used in testing—no direct Production `PFCG` edits outside emergency procedure.
- **Mechanism:** Record role changes in `PFCG` → transport; include generated authorization profiles. SU24 via `SU25` transport. For mass: `PFCG` download/upload or business-role tools only in controlled landscapes. Import queue in `STMS`; post-import run user comparison. Coordinate with ChaRM/ITSM change numbers when the landscape mandates it.
- **Governance:** Production direct maintenance locked; emergency change requires dual approval + retrospective transport. Role owner + Security sign import to Production.
- **Validation:** `STMS` import RC=0; `SUIM` role content matches QAS hash/compare; test user in Production exhibits same `STAUTHTRACE` pattern as QAS; no yellow user comparison status left unresolved.

## Q9: How do you structure access testing and Production support for authorization defects without widening roles blindly?

- **Decision:** Every defect follows reproduce → trace → minimal object delta → positive/negative retest—never “add `*`" as first response.
- **Mechanism:** Capture exact TCode/app, user, time, and message. Trace with `STAUTHTRACE`. Add only the failing authorization field values into the correct single role (via SU24 proposal where possible). Retest with a clean ID that has only that composite. For Production support SLAs: temporary Firefighter if business-critical, then permanent role fix in next transport window.
- **Governance:** SLA distinguishes P1 business stoppage (Firefighter) vs design defect (normal CR). Recurring defects trigger role redesign, not endless one-off grants.
- **Validation:** Defect ticket closed with before/after trace screenshots, transport number, and negative test proving SoD partner action still denied.

## Q10: How do you keep org-level and derived-role design aligned when company codes and plants change?

- **Decision:** Org values are data-driven overlays on masters; landscape org changes require a controlled derived-role refresh—not ad-hoc manual field edits in every child.
- **Mechanism:** Maintain master without org-specific values where derivation applies; child roles get org levels via `PFCG` Org Level maintenance or derived-role tools. When BUKRS/WERKS sets change, update derivation matrix and regenerate affected derived roles; transport as a set. Align BW analysis characteristics and S/4 org roles to the same enterprise org model where shared.
- **Governance:** Master menu/object changes go through one governance path; local plants cannot invent divergent masters. Quarterly org-role attestation by business owners.
- **Validation:** User in plant A derived role sees only plant A documents (`STAUTHTRACE` on org object); plant B attempt fails; `SUIM` shows correct derived role assignment after mover HR event.
