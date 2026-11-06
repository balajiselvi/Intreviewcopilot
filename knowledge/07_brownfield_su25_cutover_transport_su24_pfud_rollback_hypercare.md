# SAP Implementation, Migration, Cutover, and Hypercare — Security Workstream

Spoken Principal Architect reference for greenfield / brownfield / selective transition security execution, SU25 Steps 1 and 2A–2D, SIT/UAT/negative testing, production cutover transport sequencing, rollback, and hypercare war-room triage. Do not invent customer go-live metrics. Prefer methodology language (“I would…”) unless CV evidence is supplied.

---

## 1. Path strategy — Greenfield vs Brownfield vs Selective (Bluefield)

| Path | Security execution | Refuse to carry blindly |
|---|---|---|
| **Greenfield** | Clean-core role design from Activate Fit-to-Standard workshops; standard Fiori Business Catalogs; zero legacy profile carry-over; baseline SoD-free build in GRC BRM + ARA before mass assignment | Cloned ECC composites, unowned derived roles, `SAP_ALL`-shaped project users promoted to BAU |
| **Brownfield (ECC → S/4 conversion)** | Full **SU25** reconciliation of authorization defaults + PFCG Expert Mode merge; Simplification Item–driven T-code swaps; parallel Fiori catalog / OData track | Untouched SU24 after conversion; obsolete T-codes left in menus; “worked in ECC” as go-live evidence |
| **Selective Data Transition (Bluefield)** | Redesign target roles on a clean template for in-scope processes; migrate selected org/data slices; run SU25 wherever technical conversion still touches authorization defaults | Half-finished SU25 plus greenfield catalogs with two conflicting SoD ruleset sources of truth |

Path choice is a business + technical ADR. Security owns: role-model strategy, SU25 plan, Fiori IAM track, GRC sync windows, cutover transport order, rollback packs, and hypercare triage SLAs.

---

## 2. Brownfield — exact SU25 technical execution

SU25 reconciles SAP delivered authorization defaults with customer `SU24` tables (`USOBT_C` / `USOBX_C`) and every impacted PFCG role after upgrade or S/4 conversion.

### Step 1 — Initial fill (initial runs only)

Copies SAP authorization defaults into customer tables: `USOBT` / `USOBX` → `USOBT_C` / `USOBX_C`. **Only** for first-time / initial population. Re-running Step 1 on a live customer landscape can overwrite years of SU24 work — require backup and change control.

### Step 2A — Automatic preparation and comparison

Automatically prepares and compares customer `USOBT_C` / `USOBX_C` against new SAP release defaults (`SU22`). Applies automatic adjustments where SAP can safely align without human conflict resolution.

### Step 2B — Manual reconciliation of customer SU24 vs SU22

Where customer-modified check indicators and field proposals conflict with new SAP `SU22` defaults, Step 2B forces **manual** decide-and-keep / adopt-SAP / merge judgment. Document why a customer check stays (custom transaction, intentional restriction) versus adopting SAP’s new proposal — this is audit evidence for the conversion.

### Step 2C — Role adjustment list and Expert Mode merge

Identifies every PFCG role impacted by changed authorization defaults. For each role:

1. Enter **PFCG Expert Mode** — *Read old status and merge with new data*.  
2. Populate newly added **org levels** and authorization fields.  
3. Regenerate profiles.  
4. Execute user-master / profile alignment: `PFUD` and/or `RHAUTUPD_NEW` as appropriate for volume and release.

Skipping Expert Mode merge leaves roles with stale authorization data relative to new SU24 — classic “random” post-go-live auth failures.

### Step 2D — Obsolete / replaced transactions + Fiori OData

Drive remediation from the **S/4HANA Simplification Item Check** (and conversion cockpit evidence). Update PFCG menus, pull updated `SU24` defaults, and add required Fiori authorizations.

| Legacy transactions | S/4 successor direction |
|---|---|
| `FK01` / `XK01` / `FD01` / `MK01` / `VD01` (and related master T-codes) | Consolidated into Business Partner **`BP`** |
| `MB01` / `MB1A` / `MB1B` / `MB1C` | Replaced by **`MIGO`** (modern goods-movement UX) |

Procedure: remove obsolete T-code from PFCG menu → add successor → merge SU24 proposals → regenerate → re-test with `STAUTHTRACE`. Add Fiori **Business Catalog** / Spaces-Pages content and OData service authorizations: `S_SERVICE` for V2 (`IWSG` frontend / `IWSV` backend as applicable) and corresponding V4 service-group authorizations where used. Do not leave legacy + successor without a fresh ARA SoD pass — successor risk shape often changes.

**Validation after SU25:** Sample critical roles show merged new objects; obsolete T-codes absent from production-bound menus; ARA re-run on converted role set; SU25 worklist cleared or consciously deferred with risk log.

---

## 3. Fiori IAM — parallel track (brownfield and greenfield)

1. Map classic GUI role menus → Frontend catalogs + Spaces/Pages and Backend business authorizations.  
2. Activate / expose OData; authorize with `S_SERVICE` (`IWSG` / `IWSV`).  
3. Separate defects: **missing tile** (catalog/space/role assignment) vs **app opens then fails** (`/IWFND/ERROR_LOG`, `/IWBEP/ERROR_LOG`, backend auth, `STAUTHTRACE`).  
4. Greenfield prefers standard Best Practice Business Catalogs; customize only with owned deltas and SoD simulation.

---

## 4. SIT, UAT, negative testing, and SOX / GRC go-live gate

| Gate | Security proof |
|---|---|
| **Unit (DEV)** | Role generation OK; menu/catalog links coherent; `STAUTHTRACE` aligns to intended `SU24`; no accidental `S_TCODE=*`, open `S_TABU_*` wildcards |
| **SIT** | End-to-end chains: O2C, P2P, R2R, H2R; **System / Communication** interface users least-privilege — **zero `SAP_ALL`** on technical users |
| **UAT + Negative Testing** | Role owners: **positive** daily job AND **negative** proof — blocked T-codes; `SE16N` / `S_TABU_NAM` / `S_TABU_DIS` restricted; unauthorized Company Codes / Plants denied |
| **SOX / GRC go-live gate** | 100% **user-level and role-level ARA** simulation before UAT sign-off; **zero unmitigated High/Critical SoD** into Production — remediate or mitigate with controls that will be tested |

Positive-only UAT is how SoD and org-level leaks ship. Negative authorization testing is a first-class deliverable.

---

## 5. Production cutover runbook — exact `STMS` transport order

**Mandatory security transport sequence:**

1. Import **`SU24` authorization default** tables (`USOBT_C` / `USOBX_C`) **FIRST** so the target recognizes updated proposals before roles merge against them.  
2. Import **Master Roles** and **Single Roles**.  
3. Import **Derived Roles** (parent–child inheritance / org-level derivation must remain intact — derived after parents as designed).  
4. Import **Composite Roles**.  
5. In the Production client: mass profile generation **`SUPC`** and User Master Comparison **`PFUD`** / **`RHAUTUPD_NEW`** so profiles match role definitions and assignments stay consistent.  
6. GRC repository sync **in order**: `GRAC_ROLEREP_OBJECT_SYNC` → `GRAC_ROLEREP_PROFILE_SYNC` → `GRAC_ROLEREP_ROLE_SYNC` → `GRAC_ROLEREP_USER_SYNC`. Then verify **EAM Firefighter** IDs / owners / connectors and **MSMP / BRF+** workflow paths before opening the floor.

**Why SU24 before roles:** Roles imported against stale customer defaults produce wrong Expert Mode merges, silent proposal drift, and post-cutover auth defects that look like “PFCG corruption” but are sequencing failures.

### Cutover rehearsals and blackout controls

Dress Rehearsals 1 & 2 and Mock Cutover prove transport runtime, dependency locks, blackout messaging, dialog-user lock patterns (`EWZ5` / `SU10`), and time-bound **data-load batch users** with strict validity. Do not improvise `SCC4` client-open for convenience during blackout — follow the approved cutover runbook.

**Validation:** Mock cutover finishes inside the blackout window; GRC sync RC=0; sample Firefighter checkout works; post-sync ARA repository matches expected roles/users.

---

## 6. Rollback and contingency architecture

Before cutover:

- Snapshot / transport backups of existing Production roles (`AGR_*`), `USOBT_C` / `USOBX_C`, and assignment evidence (`AGR_USERS`, `UST04`, related `USR*` / `UST*` per basis standard).  
- Pre-build **rollback role transport packs** and named **time-bound contingency composites** (break-glass, logged, owner-approved).

If a role transport corrupts production access:

1. Stop further role imports.  
2. Re-import snapshot role transports and/or assign pre-built contingency roles — **not** open `PFCG` edit in PRD.  
3. Re-run `PFUD` / `SUPC` as required.  
4. Re-sync GRC; document who / what / when / ticket for SOX ITGC.

---

## 7. Hypercare war-room — Day 1 to Week 6

### P1 production stopper triage protocol

1. Concurrent capture across app servers: filtered / system-wide **`STAUTHTRACE`** + user **`SU53`** + for Fiori/OData **`/IWFND/ERROR_LOG`** and **`/IWBEP/ERROR_LOG`**.  
2. Classify: missing auth object / field / org value vs missing `S_SERVICE` vs missing tile/catalog vs locked / wrong user type.  
3. **Golden SOX ITGC rule:** Never open `SCC4` or edit roles directly in Production (`PFCG` is **display-only** in PRD).  
4. Immediate continuity: controlled **GRC EAM Firefighter** ID (reason code, owner, time-bound).  
5. Permanent fix: remediate in **DEV** (`PFCG` + `SU24` if proposal wrong) → Emergency Transport (`STMS`) → **QAS** confirmation → **PRD** import → `PFUD` / generation → GRC sync if repository stale.  
6. Controller reviews Firefighter logs in the same cycle — unused FF without review fails the control.

### Hypercare exit and BAU / Run handover

- Zero open P1/P2 security defects (or formally accepted residual risk).  
- 100% EAM Firefighter log controller reviews complete.  
- Periodic jobs scheduled: `PFUD`, GRC syncs, UAR / risk analysis as designed.  
- Runbooks handed to L2/L3 AMS with known defect patterns and the DEV→QAS→PRD emergency path.

---

## 8. Spoken close (interview pattern)

State the path (greenfield clean-core vs brownfield SU25 2A–2D + BP/MIGO simplification swaps vs selective hybrid). Gate go-live on **negative UAT + ARA zero unmitigated High/Critical**. Quote cutover order: **SU24 → Master/Single → Derived → Composite → SUPC/PFUD → GRAC_ROLEREP_*_SYNC (object→profile→role→user)**. For hypercare P1 Fiori: trace triad + Firefighter workaround + DEV→QAS→PRD — never unlock PRD `PFCG` for convenience.
