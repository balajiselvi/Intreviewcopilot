# Activate, RISE, Security Workstream, and Principal Architect Leadership

## 1. SAP Activate — security deliverables by phase

| Phase | Security concrete outputs |
|---|---|
| **Discover** | Security scope in transformation case; edition (Public/Private); identity strategy sketch (IAS/IPS/IAG/GRC); initial risk themes |
| **Prepare** | Security workstream charter, RACI, landscape access for project users, tooling (GRC/IAG tenants), RAID for security |
| **Explore** | Fit-to-Standard workshops with **role mapping**, SoD baseline, restriction/org model, Fiori persona catalogs, gap list with security impact |
| **Realize** | Build roles/business roles, MSMP/IAG workflows, IPS transforms, SIT + **UAT positive and negative** auth tests, SoD simulation before transport |
| **Deploy** | Cutover rehearsal of provisioning, EAM/Firefighter or IAG PAM readiness, access go/no-go criteria, rollback of role transports, break-glass |
| **Run** | Hypercare defect triage (minimal widening), UAR/certification, SOX ITGC evidence packs, continual rule/role hygiene |

Security is not a Realize-only activity. Explore without SoD baseline creates Deploy surprises.

---

## 2. RISE with SAP vs Activate

- **Activate** = implementation methodology (phases above).
- **RISE with SAP** = commercial / transformation offering (often S/4HANA Cloud Private Edition + BTP + operating model).

They nest; they are not synonyms.

### Shared responsibility (Private Cloud Edition — typical split)

| Layer | Usually SAP / hyperscaler ops | Usually Customer / SI |
|---|---|---|
| OS / DB / infra patching (RISE PCE pattern) | Provider | — |
| Network landing / connectivity design | Shared | Customer defines requirements |
| BTP subaccount structure / XSUAA | Customer | Customer/SI builds |
| Application security (PFCG/business roles, GRC/IAG, IAS policies) | — | **Customer owns** |
| Software logistics / transports of roles | Customer process | Customer/SI executes |

**Clean Core:** Prefer released APIs, BTP extensions, minimize core mods; security reviews every extension for new auth surfaces.

---

## 3. End-to-end security workstream (12 beats)

1. Assess landscape and requirements
2. Role-design strategy + naming governance
3. SoD / critical access baseline
4. Role matrices / access requirements
5. JML / approval / provisioning design
6. Configure GRC/IAG/IAS/IPS/BTP as in scope
7. Integrate identities and targets
8. Unit / SIT / UAT / regression (including negative tests)
9. Remediate + re-simulate
10. Cutover + emergency access + rollback
11. Readiness approvals
12. Hypercare to ops + audit handoff

---

## 4. Testing and ops evidence

- Positive: persona completes process.
- Negative: SoD partner action denied; Public restriction blocks cross-company.
- Transport: import RC=0 + user comparison / business-user sync evidence.
- Cutover rehearsal includes Firefighter/PAM checkout.
- SOX: role change tickets, SoD reports, UAR attestations, privileged log reviews.

---

## 5. Principal Architect STAR frameworks (reusable)

### A. Functional vs Audit SoD deadlock

**Situation:** Business wants one composite for speed; Audit flags toxic pair.
**Task:** Preserve control without blocking go-live.
**Action:** Split single roles (create vs approve); composite only as assignment shell; temporary mitigation with monitor + expiry; ruleset false-positive fix if warranted.
**Result:** Process runs with two users; residual risk documented; no standing mitigation forever.

### B. Broken Fiori / S/4 cutover recovery

**Situation:** Tiles missing or OData 403 after cutover.
**Task:** Restore critical personas within hypercare SLA.
**Action:** Branch missing-tile (catalog/space/`/UI2/*`) vs launch-fail (`S_SERVICE`, `/IWFND/ERROR_LOG`, `STAUTHTRACE`); Firefighter only for P1; permanent fix transported.
**Result:** Personas green; root cause logged; no blanket `SAP_ALL`.

### C. Global role template rollout (EMEA / APAC / ME)

**Situation:** Multi-region template drift.
**Task:** One master design, local org overlays.
**Action:** Global single-role masters; derived/restriction org values per region; BRM/IAG business roles for language; SoD sim per wave; regional owners in MSMP/IAG.
**Result:** Consistent task design; org isolation proven; wave gates evidence-based.

### D. Legacy IDM/GRC to hybrid IAG / IAS / IPS

**Situation:** Aging IDM jobs; cloud apps out of sync.
**Task:** Move identity/governance without losing audit trail.
**Action:** Plane map — IAS auth, IPS provision, IAG govern, GRC Bridge where on-prem leads; parallel run; exit criteria on JML SLA + SoD parity.
**Result:** Decommission IDM jobs with evidence; no IPS-only "SoD."

---

## Interview hooks

- "RISE is the commercial wrapper; Activate is how we deliver; customer still owns app security."
- "Explore SoD baseline prevents Deploy theatre."
- "STAR answers show trade-offs — never invent clients or metrics."
