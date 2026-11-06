# Master Architectural Boundaries & Disambiguation

Authoritative high-collision reference for Interview Copilot V2. Use this document to keep planes separate. Do not collapse products.

---

## 1. GRC ARA — Critical Action / Critical Permission vs SoD

### Critical Action (single-function sensitive executable)

A **Critical Action** risk in SAP GRC Access Control Access Risk Analysis flags a **single** sensitive executable as high risk on its own. It is typically modeled as **one Function ID** whose Actions include privileged transactions or services (illustrative examples often include `SU01`, `SM59`, `SE38`, `SCC4`, `OB52` — always confirm against the customer ruleset). It does **not** require a second conflicting Function.

### Critical Permission (single sensitive authorization pattern)

A **Critical Permission** risk flags a powerful authorization-object / field / value combination alone (for example sensitive `S_TABU_DIS` or `S_DEVELOP` with change activities such as `ACTVT=01/02`), even when the Action looks ordinary.

### Segregation of Duties (SoD)

An **SoD** risk is a **multi-function binary (or multi-leg) conflict**: at least **two incompatible Function IDs** held together (for example Vendor Master Maintenance + AP Payment Run). SoD is not “any critical T-code.”

### Where the definition lives vs where assignment lives

| Layer | Examples | Meaning |
|---|---|---|
| GRC ruleset (definition) | `GRACFUNC`, `GRACFUNCACT`, `GRACFUNCPRM`, `GRACSYSRULE`, `GRACRLCONN` (release-appropriate GRAC* set) | What ARA evaluates as Critical Action, Critical Permission, or SoD |
| Target ABAP assignment | `AGR_USERS`, `AGR_1251`, role menus | Who is assigned what in the backend |
| Sync into GRC | `GRAC_ROLEREP_ROLE_SYNC`, `GRAC_ROLEREP_USER_SYNC` (and related repository sync jobs) | How assignment data arrives for analysis |

**Never** define Critical Action as “looking at `AGR_USERS`.” Assignment tables feed analysis; they do not define the ruleset risk type. **Never** blur Critical Action into classic two-function SoD. Firefighter/EAM is a different capability.

---

## 2. SAP BTP security architecture (zero PFCG on this plane)

Complete authorization chain for Cloud Foundry / XSUAA applications:

1. Developer declares **scopes**, **attributes**, and **role-templates** in design-time `xs-security.json`.
2. Descriptor is bound to an **XSUAA** (SAP Authorization and Trust Management) service instance.
3. Subaccount admin instantiates **Roles** from Role Templates in BTP Cockpit.
4. Roles are bundled into **Role Collections**.
5. Role Collections are assigned to users or mapped from **SAP IAS** / corporate IdP groups via **OIDC or SAML 2.0** assertion attributes (trust on the subaccount).
6. **App Router** validates **OAuth 2.0 JWT** tokens minted by XSUAA before the application enforces scopes.

**IAS** authenticates (who you are). **XSUAA role collections / scopes** authorize the BTP app (what you may do). **IPS** may provision users/groups into that model; IPS does not authenticate and is not PFCG.

Destinations use separate auth types (`OAuth2SAMLBearerAssertion`, client credentials, etc.). Destination technical users are not a substitute for application role collections.

**Do not** answer pure BTP authN/authZ questions with `PFCG`, `AGR_*`, `SU24`, or `SU01` unless the interviewer asks for hybrid on-prem integration.

---

## 3. SAP IAG (five cloud services) vs GRC 12.0 and IAG Bridge

### Native IAG services

1. **Access Analysis** — cloud access-risk / SoD investigation and remediation.  
2. **Access Request** — request, risk simulation, approval, provisioning integrations.  
3. **Role Design** — business-role modelling and maintenance.  
4. **Certification Review** — campaign-based access certification.  
5. **Privileged Access Management (PAM)** — emergency / privileged access with review.

### GRC Access Control 12.0 (on-prem)

ARA, ARM, BRM, EAM/Firefighter, MSMP + BRF+, connectors, repository synchronization, `GRAC*` content.

### IAG Bridge

In hybrid landscapes, **IAG Bridge** connects cloud IAG with on-prem GRC 12.0 so GRC can remain the leading request/analysis engine where that operating model is chosen. Bridge does **not** turn IAS into SoD analysis and does not turn IPS transformations into Access Analysis.

---

## 4. S/4HANA Public Cloud vs Private Cloud / On-Premise

| Topic | Public Edition | Private / On-Prem |
|---|---|---|
| Role maintenance | Maintain Business Roles, Business Catalogs, IAM apps | PFCG single/composite/derived |
| Org / field restrictions | Restriction Types (read/write/value help) | Org levels in PFCG authorization data |
| User admin | Cloud IAM / IAS-centric processes | `SU01` / `SU10` (and provisioning tools) |
| Integrations | Communication Arrangements | RFC, classic destinations, etc. |

**Public Edition answers must not** lead with “open PFCG / SU01” as the primary design path.

---

## 5. Fiori troubleshooting split

### Missing tile (content / assignment)

Frontend catalog, space, page, or target-mapping gap; role not assigned to the catalog/space content. Tools such as `/UI2/FLPD_CONF` (or current Launchpad content manager for the release). Fix is content + role assignment — not first assuming a backend object miss.

### App launches but fails / no data (runtime auth)

OData service activation (`/IWFND/MAINT_SERVICE`), `/IWFND/ERROR_LOG`, missing `S_SERVICE` (`IWSG` frontend / `IWSV` backend), or backend business authorization failure — prove with `STAUTHTRACE` / `SU53` on the correct system.

Never treat “no tile” and “tile opens then auth error” as the same defect class.

---

## 6. SuccessFactors RBP and SAC security

### SuccessFactors RBP (three pillars)

1. **Permission Roles** — *what* capabilities are granted.  
2. **Permission Groups** — *who* receives the role.  
3. **Target Populations** — *upon whom* the permissions apply.  

Plus MDF object permissions for metadata-driven objects. RBP is **not** PFCG.

### SAP Analytics Cloud

- **Application roles** — what the user can do in SAC (admin vs viewer, etc.).  
- **Model-level Data Access Control** — read/write locks on dimension members.  

Do not confuse app-role administration with model DAC, and do not answer SAC with RSECADMIN unless the question is about BW live connections’ backend analysis authorizations.

---

## 7. GRC Access Control vs Process Control vs Enterprise Risk Management

Keep the three GRC planes separate. Retrieval should anchor ERM / PC / CCM / KRI questions here — not into ARA ruleset maintenance alone.

| Plane | Governs | Core mechanics | Do not confuse with |
|---|---|---|---|
| **GRC Access Control (AC 12.0)** | *Who* has access; user/role **SoD** and critical access | **ARA / ARM / BRM / EAM**; Mitigating Controls on access risks; `GRAC*` | Process control testing or enterprise KRI scoring |
| **GRC Process Control (PC 12.0)** | Whether **business-process controls and ITGCs** are designed and **operating effectively** | Shared Master Data; **CCM / ACM**; manual OE tests; deficiencies; **SOX 302 / 404** sign-off; `GRPC*` | Access Risk Analysis / Firefighter |
| **SAP Enterprise Risk Management (RM 12.0)** | Enterprise **strategic / operational / financial / compliance** risk | Risk catalogs & templates; qualitative scoring; **quantitative / Monte Carlo**; **KRIs** & appetite thresholds; responses (Mitigate / Accept / Transfer / Avoid); **bow-tie**; `GRRM*` | SoD simulation or PFCG role design |

**Closed loop:** Unremediated ARA SoD → **Mitigating Control** (AC) whose master sits in **Shared Master Data** → PC tests **operating effectiveness** → failed OE raises **residual risk** on the linked RM risk → **SAP Audit Management** tracks findings / working papers.

**Never** answer a CCM / Shared Master Data / SOX 404 question with only `GRACFUNC` ruleset steps. **Never** answer automated KRI / Monte Carlo / bow-tie questions as Access Control configuration.

---

## 8. Implementation, SU25 2A–2D, Cutover Transport Order & Hypercare Protocol

Anchor brownfield conversion, cutover sequencing, and hypercare P1 questions here (with gold module `07_brownfield_su25_cutover_transport_su24_pfud_rollback_hypercare.md`). Do not answer SU25 with only “run PFCG” and do not fix PRD auth gaps by unlocking client change.

### SU25 (brownfield / upgrade) — step contract

| Step | Meaning |
|---|---|
| **1** | Initial copy `USOBT`/`USOBX` → `USOBT_C`/`USOBX_C` — **initial runs only** |
| **2A** | Automatic compare/adjust customer defaults vs new SAP `SU22` |
| **2B** | Manual reconcile customer-modified `SU24` vs new `SU22` |
| **2C** | Role list → PFCG Expert Mode *Read old status and merge with new data* → org levels/fields → regenerate → `PFUD` / `RHAUTUPD_NEW` |
| **2D** | Simplification Item obsolete T-codes (e.g. `XK01`/`FK01`… → `BP`; `MB1*` → `MIGO`) + menu/`SU24` + Fiori `S_SERVICE` (`IWSG`/`IWSV`) / catalogs |

**SU24 = proposals. SU25 = post-upgrade / conversion reconciliation of those proposals and impacted roles.**

### Mandatory production cutover transport order (`STMS`)

1. `SU24` defaults (`USOBT_C` / `USOBX_C`) **first**  
2. Master / Single roles  
3. Derived roles  
4. Composite roles  
5. `SUPC` + `PFUD` / `RHAUTUPD_NEW` in PRD client  
6. GRC sync: `GRAC_ROLEREP_OBJECT_SYNC` → `PROFILE` → `ROLE` → `USER` → verify EAM + MSMP/BRF+

Roles before SU24 = wrong merges and silent proposal drift.

### Hypercare SOX ITGC lock

P1 Fiori/ABAP auth failure: `STAUTHTRACE` + `SU53` + `/IWFND/ERROR_LOG` / `/IWBEP/ERROR_LOG` → **Firefighter** for continuity → fix in DEV (`PFCG`+`SU24`) → emergency transport → QAS → PRD. **Never** open `SCC4` or edit `PFCG` in Production for convenience.

---

## 9. Core PFCG Role Build Mechanics (never hand-insert auth objects)

Anchor every “how do you build PFCG roles / design roles / SU24 pull” question on this sequence. **Never** manually insert authorization objects such as `S_TCODE` in the Authorizations tab as the primary design method.

1. **Role design & naming** — choose Single vs **Master/Derived** (org-level inheritance) vs **Composite** (bundle only; no direct auth data). Name by process + org scope; owner assigned before build.
2. **Menu tab first** — add Transactions, Fiori catalogs/groups/tiles, and required OData services (`IWSG` / `IWSV` → `S_SERVICE`). Menu drives proposals; do not hardcode `S_TCODE=*`.
3. **Maintain SU24** — customer check indicators / field proposals in `USOBT_C` / `USOBX_C` so objects and defaults **pull automatically** into PFCG when the menu changes.
4. **Authorizations tab → Expert Mode** — *Read old status and merge with new data*. Populate **Organizational Levels** first (`BUKRS`, `WERKS`, `EKORG`, `VKORG`, …). Resolve open yellow traffic lights with least privilege — **never** `*` on sensitive fields such as `ACTVT` for change/create where display-only is required.
5. **Generate profile** — profile linkage in `AGR_1016`; auth values in `AGR_1251`; org levels in `AGR_1252`. Then **GRC ARA role-level risk simulation** — zero unmitigated High/Critical SoD or Critical Action before release.
6. **Transport & user compare** — `STMS`: `SU24` tables (`USOBT_C`/`USOBX_C`) **before** roles; then mass generation **`SUPC`** and user master comparison **`PFUD`** (and `RHAUTUPD_NEW` when mass-aligning) so the user buffer matches generated profiles. Say **`PFUD`/`SUPC` by name** — “user comparison” alone is incomplete.

**Spoken chain to retain:** Menu tab → SU24 pull (`USOBT_C`/`USOBX_C`) → Expert Mode merge → Org Levels → generate → GRC ARA simulation → `STMS` → **`PFUD`/`SUPC`**.

---

## 10. Quick plane lock reminders

- **IDM ≠ IPS ≠ IAG ≠ IAS.**  
- **MSMP = Multi-Stage Multi-Path.**  
- **SU24 = proposals; SU25 = post-upgrade reconciliation (Steps 1, 2A–2D).**  
- **PFCG build: Menu → SU24 pull → Expert Mode merge → Org Levels → generate → ARA → STMS → PFUD/SUPC.**  
- **Cutover order: SU24 → Master/Single → Derived → Composite → SUPC/PFUD → GRAC_ROLEREP_*_SYNC.**  
- **ST03N execution ≠ AGR assignment.**  
- **Critical Action ≠ SoD ≠ Firefighter.**  
- **AC (ARA/ARM/BRM/EAM) ≠ PC (CCM/SOX OE) ≠ RM (KRI/Monte Carlo/bow-tie).**  
- **PRD PFCG = display-only; P1 workaround = EAM, not SCC4 unlock.**
