# Interview Copilot V3.1 — Cross-Domain Answer Integrity Audit

**Decision: NOT READY** (PFCG strip/recovery defect corrected; broader product readiness still gated by prior audit limitations and missing raw-LLM persistence)

**Date:** 2026-11-03  
**Branch:** `feature/interview-engine-v2`  
**HEAD:** `9a3b2da75fa9e2c7e3e528d446e2eb966ba404d2`  
**Working tree:** dirty (~408 entries) — preserved; **no commit/push**  
**V3.1 prompt:** unchanged

---

## 1. Preservation baseline

- Inspected: `V31_PFCG_Q1_Q2_ROOT_CAUSE.md`, `V31_PFCG_PHASE6_ACCEPTANCE.md`, `V31_PROMPT_ENGINE_CHANGE_REPORT.md`, genuine 141 LIVE jsonl, v31_adaptive LIVE.
- Original 141-question audit artifacts retained.
- No reset/stash/revert; no KB rebuild; no architecture redesign.

---

## 2. Shared pipeline call-path map

See `V31_SHARED_PIPELINE_CALLPATH_MAP.md`.

Critical shared path:

`preferDecision.spoken` → `stripUngroundedSapEntities` → `expectedSpokenAnswer` → (LIVE) → strip → `recoverNonEmptySpokenAnswer` may serve cleaned procedure.

---

## 3. Grounding / provenance

See `V31_GROUNDING_PROVENANCE_ANALYSIS.md`.

Rule applied: KB procedure candidates must be grounded with their own source text; LLM completions must not self-ground.

---

## 4. Domain blast radius

| Domain | Classification |
|---|---|
| PFCG / SAP Security (use path) | CONFIRMED_AFFECTED → **CORRECTED** |
| GRC (BRM/MSMP/Critical Actions) | POTENTIALLY_AFFECTED; LIVE controls pass |
| BW | NOT_AFFECTED (representative LIVE) |
| IDM/IAM | NOT_AFFECTED (representative LIVE) |
| BTP / OAuth open-world | NOT_AFFECTED (representative LIVE) |
| S/4 experience | INSUFFICIENT_EVIDENCE for this strip defect |

Register: `V31_CROSS_DOMAIN_DEFECT_REGISTER.md`.

---

## 5. Confirmed root causes & corrections

### Root cause (PFCG Q1)

Compound: incomplete prefer-strip grounding hollowed AGR table names in KB procedure; recovery could serve that hollow text; thin ungrounded checks on SU01/SU53 amplified recovery.

Raw LIVE body was historically `rawProviderHint: null` — generation quality of the replaced LLM turn remains incompletely verified for older runs.

### Files / functions changed

| File | Change |
|---|---|
| `pages/api/chat.js` | Prefer strip grounding unions `primaryKnowledge`, `knowledgeContext`, `preferDecision.spoken`, `candidate`; reject destructive strip → keep KB candidate; LLM-path destructive strip revert flag |
| `lib/generationGuard.js` | `isDestructiveEntityStripResult`; `findUngroundedTransactionClaims` respects `WELL_KNOWN_SAP_KEEP` |
| `eval/generationGuardAssert.js` | Regression coverage for provenance / destructive strip / ST03N / WELL_KNOWN |

**Not changed:** V3.1 prompt, KB/index, retrieval, ST03N usage sanitizer logic (preserved), provider/UI/session.

---

## 6. Regression & LIVE verification

- Offline: `node eval/generationGuardAssert.js` → PASS  
- LIVE: 13 Q via `registerNextResolveLive.mjs`, tag `v31_cross_domain`  
- Detail: `V31_CROSS_DOMAIN_REGRESSION_RESULTS.md`  
- Records: `V31_CROSS_DOMAIN_LIVE_VERIFICATION.jsonl`

**PFCG Q1 after fix (excerpt):** validated answer retains `AGR_USERS` / `AGR_1251`; no “Review table for…”; no `recovered_procedure`.

**Controls:** PFCG configure, ST03N (no AGR-as-exec), MSMP Multi-Stage Multi-Path, SU24≠SU25 comparison, BW, IDM, BTP, OAuth — no regressions observed in this sample.

---

## 7. Remaining defects / limitations

1. Raw provider responses still not persisted by the audit harness (`rawProviderHint: null`).  
2. Critical-actions may still trip concept-coverage flags while content is usable.  
3. Historical genuine 141 answers are unchanged archives — not re-written.  
4. Product-wide **NOT READY** until broader LIVE quality bar (prior audit) is closed; this work corrects the demonstrated shared strip/recovery corruption path.

---

## 8. Final readiness

| Gate | Status |
|---|---|
| Shared prefer-strip → hollow recovery defect | **CORRECTED** (PFCG proven + LIVE) |
| ST03N usage≠assignment | Preserved |
| V3.1 prompt | Preserved |
| Overall product LIVE readiness | **NOT READY** |

No commit. No push.

---

## V3.1 Stabilization Closure & Coverage Baseline Links

Independent read-only closure audit (application/KB frozen; no LIVE re-runs). Links only — prior sections above are unchanged.

| Deliverable | Path |
|---|---|
| Stabilization closure + freeze snapshot + readiness verdict | [`V31_STABILIZATION_CLOSURE_REPORT.md`](./V31_STABILIZATION_CLOSURE_REPORT.md) |
| Question-by-question LIVE quality scorecard | [`V31_FINAL_LIVE_ANSWER_QUALITY_SCORECARD.md`](./V31_FINAL_LIVE_ANSWER_QUALITY_SCORECARD.md) |
| Categorized unresolved issue register | [`V31_RELEASE_BLOCKER_REGISTER.md`](./V31_RELEASE_BLOCKER_REGISTER.md) |
| Full skill inventory ↔ KB coverage matrix | [`V31_COMPLETE_SKILL_KB_COVERAGE_MATRIX.md`](./V31_COMPLETE_SKILL_KB_COVERAGE_MATRIX.md) |
| Prioritized knowledge completion roadmap | [`V31_KNOWLEDGE_COMPLETION_ROADMAP.md`](./V31_KNOWLEDGE_COMPLETION_ROADMAP.md) |
