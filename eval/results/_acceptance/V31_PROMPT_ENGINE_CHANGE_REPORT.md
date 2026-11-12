# Prompt Engine V3.1 — Change Report

**Date:** 2026-11-03  
**Branch:** `feature/interview-engine-v2`  
**Scope:** Prompt-only refinement (no architecture changes)

---

## File modified

| File | Change |
|---|---|
| `lib/prompt/interviewPrompt.js` | Replaced Prompt Engine V3.0 senior profile with **V3.1 Adaptive Technical Answer Generation Contract** inside `buildSeniorArchitectResponseProfile`; section title updated to `PROMPT ENGINE V3.1 — ADAPTIVE TECHNICAL ANSWER GENERATION CONTRACT`. |

**Not modified (confirmed):** `pages/api/chat.js`, `lib/generationGuard.js`, KB/index, retrieval, classification, provider config, integrity gates, UI, session store, tests architecture.

---

## Instructions removed or revised

| Removed / revised | Replacement |
|---|---|
| Fixed **4-STEP PRINCIPAL PATTERN** applied to every technical answer | **ADAPTIVE INTENT** patterns (conceptual, comparison, how-to, architecture, troubleshooting, scenario, experience) — match THIS question only |
| Universal **GOLDEN BENCHMARK** (Plant Manager / CO02 / COOIS / Mitigating Control ID exemplar) | **Removed entirely** — no unverified PP/GRC exemplar in active production instructions |
| Mandatory-sounding artifact weave for SAP tasks | **CONDITIONAL ARTIFACTS** — include only when material; prefer few precise references |
| Usage-vs-assignment framed as a recurring step in every answer | **CONDITIONAL DISTINCTIONS** — usage/assignment and SoD/mitigation only when the question needs them |
| Voice labeled V3.0 with forced four-step authority framing | V3.1 voice: answer the asked question; ban fluff and meta-commentary |

**Preserved (not undone):**

- `usageExecutionEvidence` conditional block for ST03N / usage-export asks (same file, separate from V3.1 profile).
- DOMAIN ISOLATION lines: MSMP = Multi-Stage Multi-Path; SU24 ≠ SU25; AGR ≠ execution.
- Existing ST03N sanitization in `lib/generationGuard.js` / `pages/api/chat.js` — **untouched**.

---

## Architecture confirmation

Production flow unchanged:

Knowledge Base retrieval → existing prompt construction → LIVE LLM → existing integrity validation → spoken finalization → UI.

No new processing components introduced.

---

## LIVE acceptance (7 questions)

Harness: `registerNextResolveLive.mjs`  
Tag / artifact: `v31_adaptive` → `eval/results/_acceptance/V23_LIVE_REPLAY_RESULTS_v31_adaptive.jsonl`  
Suite: defect+benchmark (13 Q; evaluation focuses on the 7 acceptance asks). Not a 141-Q replay.

| Question | Result | Notes |
|---|---|---|
| Explain how do you use PFCG? | Pass (usable) | Practical role admin sequence; recovered_procedure voice; residual “Review table for…” from earlier entity strip (not V3.1 prompt regression) |
| SU24 vs SU25 | Pass | Direct comparison — proposals vs post-upgrade adjustment; **not** Activate migration hijack |
| Explain MSMP architecture | Pass | **Multi-Stage Multi-Path**; process/stages/BRF+/provisioning handoff |
| Export T-codes used by a user | Pass | ST03N primary; AGR removed (`usage_assignment_plane_sanitized:1`); agr flag false |
| Why implement BRM? | Pass | Business-role governance / mapping / lifecycle — not a PFCG tutorial |
| Explain analysis authorizations | Pass | BW/RSECADMIN characteristic restriction vs PFCG execute rights |
| OAuth 2.0 auth code flow | Pass | Correct general cloud flow; no forced SAP GUI artifacts |

All 13 LIVE completions: `liveFailed=0`, `mockViolations=0`, `shortCircuits=0`.

Offline: prior `eval/generationGuardAssert.js` ST03N regression still applicable (generationGuard unchanged this turn).

---

## Remaining answer-quality defects

1. PFCG how-to still often served as `recovered_procedure` with stripped table placeholders (“Review table for…”) — integrity/procedure path, not prompt-only.
2. ST03N answers remain light on retention/aggregation caveats.
3. Occasional `unsupported_detail:ST03N` quality flag despite WELL_KNOWN keep (pre-existing strip interaction).
4. Broader audit readiness (outside this 7-Q set) still **NOT READY** until those integrity/procedure issues are addressed separately.

---

## Commit / push

**None** (per instructions).
