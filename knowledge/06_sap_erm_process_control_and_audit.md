# SAP Enterprise Risk Management, Process Control, and Audit Governance

Spoken Principal Architect reference. Distinguishes **GRC Access Control (AC 12.0)**, **Process Control (PC 12.0)**, and **Risk Management / Enterprise Risk Management (RM 12.0)**, then closes the loop into **SAP Audit Management**. Do not collapse SoD rulesets into CCM rules, and do not answer KRI / Monte Carlo questions with `PFCG` or `GRAC*` maintenance alone.

---

## 1. Architectural boundaries — AC vs PC vs RM

| Plane | Question it answers | Primary content | Typical tables / objects |
|---|---|---|---|
| **Access Control (AC)** | *Who* may execute what, and which **user/role** combinations create SoD or critical-access risk? | ARA, ARM, BRM, EAM, Mitigating Controls on access risks | `GRAC*` (functions, risks, rules, requests, FF) |
| **Process Control (PC)** | Are **business-process controls and ITGCs** designed correctly and **operating effectively**? | Shared Master Data, CCM/ACM, manual tests, deficiencies, SOX 302/404 sign-off | `GRPC*` + Foundation Shared Master Data |
| **Risk Management (RM / ERM)** | What are the enterprise **strategic, operational, financial, compliance** risks, and how do KRIs / responses move residual risk? | Risk hierarchy, templates, qualitative & quantitative analysis, KRIs, responses, bow-tie | `GRRM*` |
| **Audit Management** | How does independent assurance plan the universe, document working papers, and track findings? | Audit universe, engagements, findings vs PC issues / RM risks | Audit Management content (linked to GRC governance objects) |

**Hard disambiguation**

- AC Mitigating Controls compensate **access** conflicts that cannot be role-split. They are **not** the same artifact as a PC automated three-way-match control — though the **control master** often lives in **Shared Master Data** so PC can test operating effectiveness.
- PC Continuous Control Monitoring evaluates **process/ITGC evidence** from data sources. It is **not** Access Risk Analysis.
- RM KRIs and Monte Carlo quantify / monitor **enterprise risk**. They are **not** SoD simulation in ARA.
- Never lead an RM/PC interview answer with “open `PFCG` / maintain `AGR_1251`” unless the question is hybrid identity assignment into GRC work centers.

---

## 2. SAP GRC Risk Management (RM 12.0) — mechanics

### Risk taxonomy and catalogs

Enterprise risks are structured in a hierarchy (category → risk → assessment instances) using risk catalogs and reusable **risk templates**. Templates carry default analysis methods, suggested responses, and KRI stubs so business units do not invent incompatible scoring every quarter.

### Qualitative vs quantitative analysis

| Method | What it does | When architects choose it |
|---|---|---|
| **Qualitative** | Probability × impact scoring, heat maps, ordinal scales agreed with risk appetite | Board / ERM reporting, early assessment, sparse loss data |
| **Quantitative** | Numeric loss models; **Monte Carlo** simulation over distributions; scored expected / unexpected loss | Capital-sensitive operational risk, insurance transfer decisions, where historical loss data exists |
| **Bow-tie** | Left: threats / causes + preventive controls; center: risk event; right: consequences + detective/corrective controls | Shows control placement against causes and impacts; bridges RM narrative to PC control inventory |

Risk responses are explicit: **Mitigate**, **Accept**, **Transfer**, **Avoid**. Each response plan must recompute **residual risk** after effectiveness assumptions — acceptance without residual documentation fails audit challenge.

### Key Risk Indicators (KRIs)

KRIs are measurable signals owned by a Risk Owner, bound to appetite **thresholds** (green / amber / red). **Automated KRI monitoring** runs on a schedule against configured data sources; breaches create alerts and can escalate residual risk on the linked enterprise risk.

**Validation:** Change a threshold in non-prod → force a breach via test data → confirm alert, owner workflow, and residual-risk movement on the risk assessment — not just an email without RM evidence.

---

## 3. SAP GRC Process Control (PC 12.0) — Shared Master Data and CCM

### Shared Master Data (governance spine)

PC (and often RM/AC mitigating-control linkage) rests on Shared Master Data:

1. **Organization hierarchy** — legal entities, plants, shared-service centers under attestation scope.  
2. **Process / Subprocess catalog** — e.g. Order-to-Cash → Credit Management; Record-to-Report → Journal entry.  
3. **Control objectives and Controls** — design description, frequency, nature (automated / manual / ITGC).  
4. **Regulation / Policy mapping** — SOX, COSO principles, GDPR, customer policies mapped to controls and org units.

Without clean Shared Master Data, CCM rules and 404 sign-off certify the wrong scope.

### Continuous Control Monitoring (CCM) / Automated Control Monitoring (ACM)

Technical chain (interview-grade sequence):

1. **Data Source** configuration (NWBC / PC administration; data-source content often discussed with `GRPC_DS`-class maintenance) pointing at the system of record.  
2. **Business Rule** creation selecting rule technology:  
   - Configurable Rule  
   - ABAP Report  
   - BW Query  
   - HANA Calculation View  
   - BRF+ function  
3. **Job Scheduler** executes the rule on the control’s frequency (daily / weekly / period-end).  
4. **Deficiency / Alert** generation when the rule’s exception criteria fire.  
5. **Workflow** routes to Control Owner / subprocess owner for remediation, retest, and evidence attach.

**Manual path:** Control effectiveness testing, self-assessments, and surveys still produce issues when design or OE fails — CCM does not replace judgmental ITGCs (change management, access reviews) that need sampling evidence.

### SOX 302 / 404 sign-off

Certification / Sign-Off campaigns walk the Shared Master Data ownership chain: org unit and process owners attest control operation for the period. Section **302** (disclosure controls / certifying officers) and **404** (internal control over financial reporting) evidence packs must show: control inventory in scope, testing results (CCM + manual), open deficiencies with remediation status, and sign-off completion — not a screenshot of an AC SoD clean run alone.

**Validation:** Period-end campaign closes with all required sign-offs; open PC deficiencies of agreed severity block or qualify attestation per policy; exportable evidence for external audit.

---

## 4. Closed-loop governance — AC → PC → RM → Audit

```
ARA SoD / Critical Access hit
        │
        ├─ Remediable → role split / removal (AC)
        │
        └─ Not remediable → Mitigating Control assignment (AC)
                 │
                 ▼
     Control master in Shared Master Data
                 │
                 ▼
     PC tests operating effectiveness (CCM and/or manual OE)
                 │
        ┌────────┴────────┐
        │ Pass            │ Fail / deficiency
        ▼                 ▼
   Residual access     Issue remediation in PC
   risk accepted       + residual risk ↑ on linked
   with evidence         RM enterprise / compliance risk
                              │
                              ▼
                    Audit Management: finding,
                    working paper, follow-up closure
```

**Architect rule:** A Mitigating Control that is never tested in PC is theatre. A PC deficiency that never updates RM residual risk leaves ERM heat maps lying. Audit Management that never binds findings to PC issues / RM risks produces unowned follow-ups.

Three lines of defense mapping:

- **1st line:** Business + IT operating controls; AC prevents toxic access where possible.  
- **2nd line:** PC (control framework / OE) and RM (enterprise risk & KRIs); GRC Foundation roles secure who may maintain Shared Master Data.  
- **3rd line:** SAP Audit Management — independent assurance over the universe.

---

## 5. NWBC work centers and security roles (ERM / PC)

Typical delivered role families (confirm exact composite names on the customer release):

| Family | Intent |
|---|---|
| `SAP_GRC_RM_*` | Risk Management work centers — risk owner, risk manager, KRI maintenance |
| `SAP_GRC_SPC_*` | Process Control / Shared master / testing / CCM administration |
| `SAP_GRC_FN_*` | GRC Foundation — Shared Master Data, organization, cross-component services |

**Entity-level security:** Foundation authorization objects in the `GRFN*` space restrict maintenance and display by organization unit, process, regulation, and related entities. Architects must design **org-scoped** PC/RM roles — a global `SAP_ALL`-shaped GRC admin destroys SoD inside the control system itself.

**Validation:** User with plant-scoped PC role cannot open another company’s control tests; RM KRI admin cannot alter unrelated risk hierarchies; MSMP/workflow agents for deficiency remediation resolve without falling back to unscoped foundation admins.

---

## 6. S/4HANA and cloud evolution

Many landscapes keep **GRC PC/RM 12.0** as the on-premise control and enterprise-risk runtime while S/4 moves to Private or Public Edition. Access risk may also sit in **IAG** / Bridge hybrids (see IAG gold module) — that does **not** replace PC CCM or RM KRIs.

**SAP Financial Compliance Management** and cloud assurance workflows increasingly cover automated financial-control monitoring in cloud-first programs. Principal Architect posture:

- Map which controls remain in classic PC CCM vs which move to Financial Compliance Management.  
- Keep a single **control inventory / attestation narrative** for auditors (Shared Master Data or successor inventory as source of truth).  
- Do not double-count the same control as “green” in two tools with divergent test results.

---

## 7. Spoken close (interview pattern)

Lead with the plane: access risk (AC) vs process/ITGC effectiveness (PC) vs enterprise residual risk (RM). Then walk CCM or KRI automation as **data source → business rule → scheduler → deficiency/alert → owner workflow**. Close with the Mitigating Control closed loop into PC testing and RM residual impact, and name Audit Management as the assurance tracker. Validate with a forced CCM exception or KRI breach and a completed 404 sign-off evidence pack.
