# V3.1 Release Blocker Register

**Reconciled readiness:** `NOT READY`  
**HEAD:** `9a3b2da75fa9e2c7e3e528d446e2eb966ba404d2`  
**Evidence basis:** Phase 2 LIVE re-grade + inventory/KB crosswalk (Phases 4–5)  
**Rule:** Missing raw LLM traces are **Observability limitations**, not user-facing answer defects.

Severity / bucket labels are exactly as required by the audit brief.

---

## Summary counts

| Bucket | Open items |
|---|---|
| Critical technical defect | 0 in displayed finals of this 13-Q sample |
| Material answer-completeness defect | 4 |
| Knowledge Base coverage gap | 8 (inventory-level; see matrix) |
| Response-processing defect | 2 |
| Observability limitation | 3 |
| Minor presentation issue | 2 |

---

## Register

### RB-01 — ST03N export answer incomplete / soft incorrect closing

| Field | Value |
|---|---|
| Bucket | `Material answer-completeness defect` |
| Severity | High (acceptance-sample blocker toward controlled pilot) |
| Domain | SAP Security / usage analytics |
| Evidence | `V31_CROSS_DOMAIN_LIVE_VERIFICATION.jsonl` runId `defect_st03n_export` — `finalDisplayedAnswer`; CQ `unsupported_detail:ST03N`; closing links usage extract to “associated authorizations” |
| Also | `agrUsersAsExecutionHistory=false` and `usage_assignment_plane_sanitized:1` — plane safeguard OK |
| Impact | Interviewer asking “T-codes **used**” may get a thin procedure and a blurred usage↔authorization implication |
| Blocks READY FOR CONTROLLED PILOT? | **Yes** (material incompleteness in acceptance sample) |

### RB-02 — IDM bench answered on IPS/SCIM plane

| Field | Value |
|---|---|
| Bucket | `Material answer-completeness defect` |
| Severity | High |
| Domain | SAP IDM vs IAS/IPS |
| Evidence | runId `bench_idm` final text (SCIM endpoints, source/target sync jobs) vs inventory skillset 4 (Identity Center, jobs/tasks, entry types) and KB `knowledge/idm/sap-idm-identity-management-architect-bank.md` |
| Impact | Product-plane confusion risk on IDM interview questions |
| Blocks controlled pilot? | **Yes** for IDM-labelled paths |

### RB-03 — BTP authentication/authorization answer underspecified

| Field | Value |
|---|---|
| Bucket | `Material answer-completeness defect` |
| Severity | Medium–High |
| Domain | BTP / Cloud Application Security |
| Evidence | runId `bench_btp` — IAS/Entra + role collections only; missing XSUAA / xs-security / scopes depth present in `knowledge/btp/btp-security-architect-bank.md` |
| Blocks controlled pilot? | Contributes to **NOT READY** for BTP-heavy interviews |

### RB-04 — S/4 experience answer incomplete vs CV-available facts

| Field | Value |
|---|---|
| Bucket | `Material answer-completeness defect` |
| Severity | Medium |
| Domain | S/4HANA transformation / experience |
| Evidence | runId `bench_s4_experience`; CV facts in `eval/lib/careerTimeline.js` (e.g. 220 Fiori catalogs, GRC AC module footprint) not fully used; metrics that **are** used match CV (not classified as fabrication) |
| Blocks controlled pilot? | Contributes; not a fabrication critical |

### RB-05 — Critical Actions integrity recovery / concept-coverage false positive

| Field | Value |
|---|---|
| Bucket | `Response-processing defect` |
| Severity | Medium |
| Domain | GRC ARA / Critical Actions |
| Evidence | runId `bench_critical_actions`: `answerFinalMeta.recovered=true`, `flag=integrity_gate`, CQ `concept_coverage_fail:missing-essential-concepts`, `missing_concepts:critical-action`, `integrity_recovered:recovered_direct_technical` while final body correctly defines Critical Action |
| Impact | Unstable processing path; may replace or flag good content incorrectly in other phrasings |
| Note | Final content itself is usable — defect is processing, not technical definition |

### RB-06 — Prefer-strip / hollow recovery class (historically critical) — mitigated in sample

| Field | Value |
|---|---|
| Bucket | `Response-processing defect` (residual risk / regression watch) |
| Severity | Watch — **mitigated** on post-fix PFCG LIVE |
| Domain | PFCG / shared generation path |
| Evidence | Pre-fix: `V31_PFCG_Q1_Q2_ROOT_CAUSE.md` (hollow `"Review table for…"`); Post-fix: `defect_pfcg_use` / `bench_pfcg` retain AGR; integrity audit §5–6 |
| Status | **Not an open answer defect in current 13-Q finals**; keep as regression gate until committed + broader LIVE |

### RB-07 — Raw provider bodies not persisted

| Field | Value |
|---|---|
| Bucket | `Observability limitation` |
| Severity | Medium (forensics) |
| Domain | Eval harness / LIVE auditability |
| Evidence | All 13 rows: `rawProviderHint: null` (`V31_CROSS_DOMAIN_LIVE_VERIFICATION.jsonl`); also called out in `V31_CROSS_DOMAIN_ANSWER_INTEGRITY_AUDIT.md` §7 |
| Note | **Does not** by itself prove the displayed answer is defective |

### RB-08 — Model string not recorded per invocation

| Field | Value |
|---|---|
| Bucket | `Observability limitation` |
| Severity | Low–Medium |
| Evidence | `generation` object lacks `model`; only `providerImplementation=openai-sdk` + token counts; config default `gpt-4o-mini` in `config/appConfig.js` is inference only |

### RB-09 — Duplicate question in “13/13” sample reduces unique coverage

| Field | Value |
|---|---|
| Bucket | `Observability limitation` |
| Severity | Low |
| Evidence | 13 invocations / **12** unique questions (PFCG use duplicated) |
| Impact | Slightly overstates breadth of the acceptance sample |

### RB-10 — Empty / zero-byte KB stubs in inventory-adjacent paths

| Field | Value |
|---|---|
| Bucket | `Knowledge Base coverage gap` |
| Severity | High for affected subtopics |
| Evidence (file size 0) | `knowledge/bw/infoproviders.md`; `knowledge/transports/chaRM.md`; `knowledge/transports/release-process.md`; `knowledge/troubleshooting/debugging.md`; `knowledge/troubleshooting/job-failures.md`; `knowledge/troubleshooting/performance.md`; `knowledge/leadership/client-management.md`; `knowledge/leadership/delivery-management.md`; `knowledge/leadership/team-management.md`; `knowledge/leadership/vendor-management.md` |
| Impact | Retrieval cannot ground deep answers from empty stubs |

### RB-11 — Inventory domains with Partial / Missing depth (aggregate)

| Field | Value |
|---|---|
| Bucket | `Knowledge Base coverage gap` |
| Severity | Mixed High/Medium (see matrix) |
| Domains | Full SF RBP module depth beyond bank; Ariba project/document ACL depth; SRM/IBP depth; CRM/CX; SAC planning DAC edge cases; IDM connector/script depth vs IPS; IAG Bridge migration scenarios; Public Edition IAM-app model vs Private PFCG |
| Detail | `V31_COMPLETE_SKILL_KB_COVERAGE_MATRIX.md` |

### RB-12 — Thin spoken phrasing / awkward wording (ST03N)

| Field | Value |
|---|---|
| Bucket | `Minor presentation issue` |
| Severity | Low |
| Evidence | `defect_st03n_export` phrasing (“T-codes by that user”, truncated “transaction”) |
| Related | Escalates via RB-01 when combined with incompleteness |

### RB-13 — Critical-actions denser-than-spoken register

| Field | Value |
|---|---|
| Bucket | `Minor presentation issue` |
| Severity | Low |
| Evidence | `bench_critical_actions` final tone after integrity recovery |

---

## Resolved / not blocking this register as open criticals

| Item | Status |
|---|---|
| PFCG hollow `"Review table for…"` in post-fix LIVE | **Closed in sample** (watch via RB-06) |
| ST03N AGR-as-execution confusion | **Not observed** in post-fix LIVE |
| MSMP “Multi-Step” terminology regression | **Not observed** |
| Mock / Q&A-bank substitution in this LIVE tag | **Not observed** |
| Fabricated Dover metrics in S/4 experience row | **Not sustained** — matches CV timeline facts |

---

## Release decision linkage

Because **RB-01, RB-02, RB-03, RB-05** remain open in the acceptance sample (plus inventory KB gaps RB-10/RB-11 outside the 13-Q set):

**Overall: `NOT READY`**

Upgrade to `READY FOR CONTROLLED PILOT` requires, at minimum:

1. Re-verified LIVE finals with ST03N complete + plane-explicit wording  
2. IDM-labelled questions emitting IDM mechanisms (or explicit product disambiguation)  
3. Critical-actions path without false `concept_coverage_fail` recovery  
4. No new critical technical defects in the acceptance sample  

`BLOCKED` is **not** selected: essential displayed-answer evidence exists and is readable.
