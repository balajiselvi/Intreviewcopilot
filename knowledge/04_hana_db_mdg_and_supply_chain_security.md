# HANA Database, MDG, and Supply-Chain SoD Security

## 1. SAP HANA database security

### Privilege classes

| Class | Purpose |
|---|---|
| **System privileges** | Instance administration (USER ADMIN, ROLE ADMIN, AUDIT ADMIN, …) — tightly owned |
| **Object privileges** | SELECT/INSERT/UPDATE/DELETE/EXECUTE on schemas/objects |
| **Analytic privileges** | Row/analytic model restrictions for calculation views |
| **Package privileges** | Design-time package REPO.* access (classic XS) |
| **Application privileges** | App-specific privilege names consumed by XS/CAP apps |

### Design-time `.hdbrole` vs runtime catalog roles

- **HDI / XSA / CAP:** Design-time **`.hdbrole`** (and related HDI artifacts) deployed into containers — roles versioned with the app.
- **Runtime catalog:** `CREATE ROLE` in the database catalog — operational roles, often for technical users or legacy patterns.

Do not pretend HDI container roles are maintained like ECC `PFCG`. S/4HANA ABAP still enforces business auth in the app server; HANA privileges protect **schema/DB** access underneath (`SAPHANADB` / customer schema naming per landscape).

### Privileged DB users

- Restrict **`SYSTEM`** / **`DBADMIN`** (revision-dependent naming) — no daily business use.
- Technical users for S/4, SLT, SDI, SAC live: **least privilege**, no blanket SELECT ANY.
- `_SYS_REPO` and repository technical patterns: understand classic XS vs HDI — do not grant developers standing production REPO ADMIN.

### Audit and connectivity

- HANA **audit policies** for USER ADMIN, privilege grants, critical object access.
- TLS for clients; restrict SQL ports; connection pooling accounts are not personal interactive users.

**Validation:** App works with narrowed technical user; revoked analytic privilege yields empty view; audit shows ROLE ADMIN grants.

---

## 2. SAP MDG — change request SoD

MDG separates **data maintenance** from **approval** via change-request (CR) workflows:

| Duty | Typical MDG CR participation |
|---|---|
| Requester | Creates CR, proposes create/change |
| Specialist / data steward | Enriches, validates quality |
| Approver | Final approve/activate |

**SoD:** Same user must not request and approve material/vendor/customer master activation in Production. Parallel SoD with ERP: MDG approver who also posts AP or maintains bank details needs risk analysis.

**Integration:** Replication to S/4; GRC/IAG functions for MDG UI / activation privileges; IPS for MDG dialog users.

**Validation:** Two-person CR path succeeds; single-user request+approve blocked by workflow or SoD simulation.

---

## 3. Supply-chain and OTC SoD (MM / Ariba / SRM / SD / CRM)

### Procure-to-Pay (illustrative conflicts)

- Vendor master maintain + AP payment run
- PO create + goods receipt + invoice post (three-way toxic combinations)
- Ariba award / contract negotiate + vendor bank change
- SRM vs classic MM — encode actual Actions in ARA/IAG, not folklore

### Order-to-Cash

- Customer credit master + sales order release
- Billing + incoming payment clearing without dual control
- CRM opportunity discount authority + order create without margin control

**Cross-system:** SoD must span ECC/S/4 + Ariba + CRM when one person holds legs in multiple systems — single-system ARA alone understates risk.

**Governance:** Risk owners per process; mitigations time-bound with monitor evidence; Clean Core prefers standard process splits over custom bypass T-codes.

---

## 4. Integration security (cross-app)

RFC / OData / REST identities: Communication/System users, `S_RFC` or allowlisted FMs, OAuth client credentials vs principal propagation. Certificates in secure store — never wiki passwords. Hybrid: Cloud Connector scope least exposure; destination auth type explicit.

**Validation:** Negative call to non-allowlisted FM fails; destination user is not Dialog; leaver disables interface user on schedule.

---

## Interview hooks

- "HANA `.hdbrole` is design-time; catalog ROLE is runtime — different ops model than PFCG."
- "MDG CR SoD is requester vs approver — same idea as payment vs vendor master."
- "P2P SoD that ignores Ariba is incomplete."
