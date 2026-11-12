# V3.1 Cross-Domain Defect Register

## D-CD-01 — Prefer-strip hollows KB procedure identifiers (CONFIRMED)

| Field | Detail |
|---|---|
| Symptom | “Review table for the user assignment…”; `recovered_procedure` |
| Domains | **SAP Security / PFCG use** CONFIRMED_AFFECTED; other domains POTENTIALLY_AFFECTED via same prefer→strip→expectedSpokenAnswer→recovery path |
| Root cause | Prefer-time `stripUngroundedSapEntities` with incomplete grounding vs KB seed |
| Source | `pages/api/chat.js` prefer block; `lib/generationGuard.js` strip |
| Correction | Include procedure candidate in grounding; reject destructive strip results |
| Status | **CORRECTED** (offline + LIVE verified) |

## D-CD-02 — False `recovered_procedure` from thin ungrounded T-code checks

| Field | Detail |
|---|---|
| Symptom | LIVE answers with SU01/SU53 flagged ungrounded → procedure recovery |
| Domains | POTENTIALLY_AFFECTED wherever WELL_KNOWN admin T-codes appear |
| Root cause | `findUngroundedTransactionClaims` ignored `WELL_KNOWN_SAP_KEEP` |
| Correction | Align ungrounded filter with WELL_KNOWN keep-list for those T-codes only |
| Status | **CORRECTED** |

## D-CD-03 — Destructive strip on LLM path (historical)

| Field | Detail |
|---|---|
| Symptom | “utilizing transaction,” empty T-code (pre-WELL_KNOWN / thin grounding) |
| Domains | Historical genuine sample ~malformed finals; ST03N previously CONFIRMED |
| Correction | WELL_KNOWN keep (prior) + destructive-strip revert on LLM path |
| Status | Mitigated; ST03N usage-plane sanitize preserved |

## Domain impact summary

| Domain | Classification | Notes |
|---|---|---|
| SAP Security / PFCG | CONFIRMED_AFFECTED → **CORRECTED** | Q1 hollow table + recovery |
| SAP GRC | POTENTIALLY_AFFECTED / controls pass | MSMP/BRM/Critical Actions validated post-fix |
| BW | NOT_AFFECTED (sample) | RSECADMIN retained |
| IDM/IAM | NOT_AFFECTED (sample) | Lifecycle terms retained |
| BTP / OAuth | NOT_AFFECTED (sample) | No GUI force-fit |
| S/4 experience | INSUFFICIENT_EVIDENCE for strip defect | Validated sample; raw LLM still not persisted |
| Open-world OAuth | NOT_AFFECTED (sample) | Pass |

One shared function ≠ every domain broken. One passing control ≠ entire domain immune forever.
