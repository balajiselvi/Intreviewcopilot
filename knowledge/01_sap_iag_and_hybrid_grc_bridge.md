# SAP IAG and Hybrid GRC Bridge Architecture

Spoken Principal Architect reference. Plane 4 — Cloud IAG vs on-premise GRC Access Control 12.0. Do not collapse IAG into IAS/IPS or into PFCG.

## Architectural core

**SAP Cloud Identity Access Governance (IAG)** is SAP’s cloud governance suite for access risk, request, role design, certification, and privileged access. **SAP GRC Access Control 12.0** remains the on-premise engine (ARA, ARM, BRM, EAM, MSMP/BRF+). In hybrid landscapes, **IAG Bridge** connects them so GRC can stay the leading request/analysis system while cloud targets and IAG services participate in provisioning and risk outcomes.

IAS authenticates users into IAG. IPS may sync identities/groups. Neither replaces Access Analysis.

---

## The five IAG services — mechanics

### 1. Access Analysis

Cloud access-risk analysis: SoD, critical access, investigation, remediation tracking against connected systems’ access models. Findings are triaged to remediation (remove access), mitigation (time-bound compensating control), or acceptance with documented residual risk. Rulesets and risk definitions are maintained for the IAG tenant’s connected applications — not by editing ABAP `AGR_1251` directly inside IAG.

**Validation:** Simulate a toxic combination for a test user; confirm hit, owner, and remediation status in Access Analysis evidence.

### 2. Access Request

Cloud access request with risk simulation before approval, approval routing, and provisioning hand-off to connected targets (often via IPS or bridge-connected GRC provisioning paths depending on landscape design). Request types map to business language (business role / privilege), not raw T-code shopping lists.

**Validation:** Submit request → risk simulation fires → approvers resolve → target assignment appears; failed provisioning shows in job/provisioning monitoring, not silent green UI.

### 3. Role Design

Business-role modelling, optimization, and maintenance in the cloud role-design service. Business roles map to technical entitlements on targets. Owners approve lifecycle changes. This is not PFCG Expert Mode and not BRM’s on-prem NWBC screens — same governance idea, different runtime.

**Validation:** Change business-role content in non-prod; provisioning/request path consumes the new definition; SoD simulation reflects the change.

### 4. Certification Review

Campaign-based access certification: reviewers attest retain/remove/revise. Campaigns produce audit evidence for SOX UAR windows. Remediation from declined items must flow back into request/provisioning — certification without revocation is theatre.

**Validation:** Campaign completes with reviewer decisions; remove decisions deprovision within SLA; evidence export for ITGC.

### 5. Privileged Access Management (PAM)

IAG PAM: privileged access IDs/sessions with reason codes, approvers/reviewers, provisioning to target, session usage, log sync, and review inbox. Distinct from classic GRC EAM Firefighter ID sync (`GRAC_SPM_*` patterns on-prem). Do not call a PAM ID an IAS user or an IPS-created account — IAS authenticates the person; PAM governs elevated entitlement on the target.

**Validation:** PAM ID Active after provisioning job; session + log sync; reviewer completes Privileged Access review; no standing `SAP_ALL` substitute without logging.

---

## IAG Bridge — hybrid architecture

### Design pattern (common enterprise choice)

1. **Leading request system:** On-prem GRC AC 12.0 ARM (MSMP + BRF+) remains the governed request UI for many hybrids.  
2. **Risk engine:** ARA on GRC and/or IAG Access Analysis depending on which repositories hold which systems.  
3. **Cloud targets:** S/4 Public, BTP role collections, Ariba, SF, etc. reachability via IAG Bridge + connectors / IPS.  
4. **Identity planes stay separate:** IAS login to IAG/GRC portals; IPS attribute sync; IAG/GRC decide *whether* access is appropriate.

### GRC `GRAC*` vs IAG cloud repositories

| Concern | On-prem GRC 12.0 | IAG cloud |
|---|---|---|
| Ruleset / functions / risks | `GRACFUNC`, `GRACFUNCACT`, `GRACFUNCPRM`, `GRACSYSRULE`, … | IAG Access Analysis content in tenant |
| User/role repository sync | `GRAC_ROLEREP_USER_SYNC`, `GRAC_ROLEREP_ROLE_SYNC`, connector RFC | Cloud repository sync jobs / bridge connectivity |
| Request workflow | MSMP `GRFNMW_CONFIGURE` + BRF+ | IAG Access Request paths / delivered mappings |
| Emergency access | EAM Firefighter + log sync | IAG PAM |

Bridge does **not** mean “paste PFCG tables into BTP.” It means governed connectivity and orchestration between GRC and IAG for hybrid request/risk/provisioning.

### IPS role in hybrid

IPS often acts as **proxy/connector sync** for cloud account/group writes after approval. Transformations map source attributes to target entitlements. IPS success ≠ SoD clean — Access Analysis / ARA still own risk truth.

### Troubleshooting sync / provisioning failures

1. Confirm trust and connectivity (IAS groups for workflow approvers where required; bridge/connector status).  
2. Confirm repository sync / job history — which system, which job category, RC/error text.  
3. Distinguish **identity missing** (IPS/IAS) from **risk engine stale** (sync lag) from **provisioning reject** (target auth / role collection / business role).  
4. Re-test with a known joiner and a known SoD-positive request; capture job IDs for audit.

**Governance:** Dual maintenance of rulesets (GRC + IAG) without a source-of-truth ADR creates false negatives. Document which engine is authoritative per system ID.

---

## Interview hooks

- “IAG is five services; Bridge is the hybrid glue — not a sixth random synonym for IPS.”  
- “GRAC* defines on-prem ruleset/sync; AGR_* is target ABAP assignment data fed into GRC.”  
- “PAM ≠ Firefighter ID lifecycle, even when business intent looks similar.”
