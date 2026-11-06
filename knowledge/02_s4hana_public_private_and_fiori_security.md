# S/4HANA Public vs Private Security and Fiori Deep Troubleshooting

Plane 1 vs Plane 2 discipline: never answer Public Edition with “open PFCG/SU01” as the primary path.

## 1. Public Edition vs Private Cloud / On-Premise

| Topic | Private / On-Prem (Plane 1) | Public Edition (Plane 2) |
|---|---|---|
| Role design | `PFCG` single / derived / composite | **Maintain Business Roles** |
| App exposure | Menu + Fiori catalogs bound into PFCG | **Business Catalogs** assigned to business roles |
| Field/org restriction | Org levels in PFCG auth data | **Restriction Types** (read / write / value help) |
| User admin | `SU01` / `SU10` (+ provisioning) | **Maintain Business Users** + IAS-centric identity |
| Defaults / upgrade | `SU24` / `SU25`, `USOBT_C` / `USOBX_C` | Cloud IAM content updates — not classic SU25 Expert Mode |
| Integrations | RFC, `SM59`, classic interfaces | **Communication Arrangements**, Communication Systems/Users |

**Clean Core:** Prefer released APIs and side-by-side BTP extensions over core modification. Custom Z-TCode sprawl on Private still needs `SU24` + object design; Public custom extensions follow cloud IAM and communication user least privilege.

**Validation (Private):** `STAUTHTRACE` / negative test on org field. **Validation (Public):** Restriction denies cross-company data; wrong catalog → missing app, not a PFCG profile generation issue.

---

## 2. Fiori troubleshooting decision tree

### Branch A — Missing tile / visual catalog failure (frontend content)

**Symptom:** User logs in, Launchpad loads, expected app tile absent.

**Plane:** Frontend content + role assignment — usually **not** first a backend `S_TCODE` miss.

**Check sequence:**

1. Business role / PFCG role assignment to the user (edition-appropriate).  
2. **Spaces / Pages** and catalog assignment for that role.  
3. Target mapping and tile in catalog — `/UI2/FLPD_CONF` (or current Launchpad content manager for the release).  
4. Cache: `/UI2/CACHE` / UI2 cache invalidation after content transport.  
5. Confirm correct FLP intent/semantic object — wrong catalog version after transport is common.

**Do not** jump to `SU53` as proof the tile should appear.

### Branch B — Tile present; app launch / OData failure (runtime)

**Symptom:** Tile visible; click fails, empty data, HTTP 403/500, or gateway error.

**Check sequence:**

1. `/IWFND/ERROR_LOG` (and `/IWBEP/ERROR_LOG` where applicable) for service and user.  
2. Service activation: `/IWFND/MAINT_SERVICE` (V2) and release-appropriate V4 admin.  
3. Authorization object **`S_SERVICE`**: frontend service group hash (`IWSG`) vs backend service (`IWSV`) — hashes must match activated services; regenerate/assign after service add.  
4. Backend business authorization: `STAUTHTRACE` / `SU53` on the **backend** system during reproduce.  
5. RFC / trust / principal propagation if hub-gateway architecture — destination user type and trust (`SMT1`/`SMT2` patterns where used).

| Failure class | Primary artifacts |
|---|---|
| Missing tile | Catalogs, spaces/pages, `/UI2/FLPD_CONF`, `/UI2/CACHE`, role-catalog link |
| Launch / OData | `/IWFND/MAINT_SERVICE`, error logs, `S_SERVICE` IWSG/IWSV, `STAUTHTRACE` |

---

## 3. ECC → S/4 brownfield / selective — security workstream

### SU25 (Private / on-prem conversion landscapes)

After upgrade/conversion, run gated **SU25** reconciliation — never blind-accept SAP defaults into Production roles:

- **2A** — Compare SAP defaults vs customer tables; identify changed proposals.  
- **2B** — Adjust modified check indicators / proposals into `USOBX_C` / `USOBT_C` customer maintenance.  
- **2C** — Roles impacted by changed defaults; Expert Mode merge carefully in `PFCG`.  
- **2D** (where used in procedure) — Transport / follow-on customer transport of SU24 customer tables per landscape standard.

**Governance:** SU25 in Production without QAS evidence is an audit finding. Critical objects (`S_DEVELOP`, `S_TABU_*`, `S_USER_*`) escalate.

### Simplification items and Fiori successors

1. Inventory obsolete T-codes from simplification list.  
2. Map successors to Fiori apps / OData services / new auth objects.  
3. Rebuild catalogs and backend roles; update GRC/IAG functions for new Actions.  
4. Positive + negative UAT on O2C / P2P / R2R personas.  
5. Cutover gate: no critical process on retired T-code without successor role evidence.

**Selective / brownfield:** Usage mining (`ST03N`/`STAD`) vs assignment (`AGR_*`) drives what to rebuild — assignment alone is not proof of need.

---

## Interview hooks

- “Public Edition IAM apps ≠ PFCG with a new skin.”  
- “No tile is content; tile-then-fail is gateway/backend auth.”  
- “SU25 is gated delta work — not a single green button.”
