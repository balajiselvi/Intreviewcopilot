# V3.1 — PFCG Q1 vs Q2 Question-Dependent Recovery Root Cause

**Diagnostic only — no application source modified.**  
**Date:** 2026-11-03  
**Branch:** `feature/interview-engine-v2`  
**HEAD:** `9a3b2da75fa9e2c7e3e528d446e2eb966ba404d2`  
**Working tree:** dirty (~408 porcelain entries) — preserved; no reset/stash/commit/push  
**V3.1 prompt:** unchanged for this investigation  
**Primary evidence:** `V23_LIVE_REPLAY_RESULTS_v31_adaptive.jsonl` + `V31_PFCG_PHASE6_ACCEPTANCE.md`  
**LIVE re-calls:** none (existing records sufficient for root cause of the malformed phrase)

---

## 1. Baseline

| Item | Value |
|---|---|
| Provider mode | live (`openai-sdk`, `gpt-4o-mini`) |
| Q1 runId | `defect_pfcg_use` (same outcome as `bench_pfcg`) |
| Q2 runId | `defect_pfcg_configure` |
| Admission (both) | `ANSWER` / `GENERATION` / `well-formed-question-or-technical-issue` |

---

## 2. Side-by-side execution comparison

| Checkpoint | Q1 — “Explain how do you use PFCG?” | Q2 — “How do you configure PFCG?” |
|---|---|---|
| Intent / admission | GENERATION, technical, medium | Same |
| Procedure prefer | `prefer: true`, `sourceTag: procedure-pool`, `heading: Troubleshooting`, `stepCount: 7`, `servedAs: kb-evidence-backbone` | `prefer: true`, `sourceTag: primary`, `heading: Configuration`, `stepCount: 3`, `servedAs: kb-evidence-backbone` |
| Procedure seed source | `knowledge/security/pfcg.md` — “Generate and assign a single role” full spoken paragraph | `pfcg.md` — Configuration bullets rendered to short spoken steps |
| `procedurePrefer._spoken` (pre-display meta) | Intact prose including `table AGR_USERS` / `table AGR_1251` | Short menu → SU24 → generate text (**no AGR tables**) |
| LIVE transport | 1 invocation; `completion_tokens: 193` | 1 invocation; `completion_tokens: 176` |
| Raw provider body in artifact | **`rawProviderHint: null`** (not persisted) | Same limitation |
| Integrity / recovery | `empty_fallback_procedure` + `answer_kind:recovered_procedure` | `answer_kind:validated` (no recovery) |
| Strip signal | `strippedEntityCount: -3`; final missing AGR table names | `strippedEntityCount: 0` |
| Final quality flags | `ungrounded_tcodes:SU01,SU53` | none of those |
| Final display | Recovered procedure with **“Review table for the user assignment and table for authorization values”** | Natural first-person configure answer |

Both questions stay on the GENERATION path (no ANSWER_BANK / PREPARED_SCRIPT short-circuit). Divergence is **which procedure seed is preferred** and **whether post-generation recovery replaces the LLM answer**.

---

## 3. Retrieval / procedure evidence

### Q1 seed (exact KB origin of the defective sentence)

File: `knowledge/security/pfcg.md` (section “Generate and assign a single role”):

> Review table **AGR_USERS** for the user assignment and table **AGR_1251** for authorization values, and do not treat AGR_USERS as a transaction.

Indexed copy of the same paragraph exists in `data/knowledgeIndex.json`.

Chunk metadata in LIVE record:  
`sourceFile: pfcg.md`, enrichment `heading: Troubleshooting`, `chunkIds: [chunk_bec64631…]`.

### Q2 seed

Configuration heading in the same file (bullet list: menu → SU24 → org levels → generate). LIVE `_spoken`:

> First, maintain the menu tab… Next, review and adjust SU24-proposed… Finally, generate the profile…

No AGR_USERS / AGR_1251 sentence → nothing for the table-stripper to hollow out.

---

## 4. Assembled prompts / raw responses

| Item | Status |
|---|---|
| Full prompt text | Not stored in jsonl (`promptChars` only: Q1 ≈ 68 576, Q2 ≈ 84 894) |
| Raw LIVE completion text | **Not stored** (`rawProviderHint: null`) |
| Proven provider activity | `liveTransportInvocations: 1`, non-zero `completion_tokens`, streaming timestamps |

Limitation: exact Q1 LLM wording before recovery cannot be reconstructed from artifacts. Completion length proves a LIVE generation occurred and was later replaced.

Offline reproduction (no LIVE call) proves the malformed phrase from strip alone — see §6.

---

## 5. Integrity and recovery decisions (code path)

Relevant functions (read-only inspection):

1. **Procedure prefer + strip** — `pages/api/chat.js` ≈ **2467–2483**  
   - `cleaned = stripUngroundedSapEntities(candidate, groundedKnowledge)`  
   - `groundedKnowledge = primaryKnowledge \|\| knowledgeContext \|\| preferDecision.spoken`  
   - If `primaryKnowledge` / `knowledgeContext` is non-empty but **omits** `AGR_1251` / `AGR_USERS` as table tokens, the **candidate procedure itself** is stripped.  
   - `promptPayload.expectedSpokenAnswer = cleaned` (may already contain “Review table for…”).  
   - `procedurePreferMeta._spoken = preferDecision.spoken` remains **intact** (set earlier at ≈ 2458–2459) — explains why meta still shows AGR while UI does not.

2. **Post-stream strip of LLM text** — `pages/api/chat.js` ≈ **2974**  
   - `spokenForGate = stripUngroundedSapEntities(spokenForGate, stripGrounding)`.

3. **Recovery gate** — `lib/generationGuard.js` `recoverNonEmptySpokenAnswer` ≈ **717–745**  
   - If current spoken is empty/incomplete **or** `findUngroundedTransactionClaims(spoken, knowledgeText)` is non-empty → treat spoken as unusable.  
   - Then, if `procedureEligibleForRecovery` passes, **return procedureSpoken as `recovered_procedure` / `empty_fallback_procedure`**.  
   - Procedure path does **not** re-run strip; it serves whatever was passed as `procedureSpoken`.

4. **ProcedureSpoken selection** — `pages/api/chat.js` ≈ **3029–3033**  
   - Prefers `promptPayload.expectedSpokenAnswer` (cleaned) over `_spoken` (intact).  
   - **This is why the UI gets the hollowed table sentence even though `_spoken` still has AGR_*.**

5. **Observational ungrounded flag** — `pages/api/chat.js` ≈ **3146–3148**  
   - After recovery, `findUngroundedTransactionClaims(final, knowledgeContext)` still reports `SU01,SU53` for Q1 — flag only; answer already replaced.

`findUngroundedTransactionClaims` / `extractClaimedTransactions` only match phrases like `transaction SU01` (not bare `SU24-proposed`).  
`WELL_KNOWN_SAP_KEEP` protects strip for SU01/SU53/PFCG but **does not** exempt those codes from `findUngroundedTransactionClaims`, and **does not** include `AGR_USERS` / `AGR_1251`.

---

## 6. Transformation-by-transformation (malformed phrase)

| Stage | Q1 input → output |
|---|---|
| KB / prefer seed | Intact: `Review table AGR_USERS … table AGR_1251 …` |
| Prefer-time strip (`chat.js` ~2468) | **First corruption:** `Review table for the user assignment and table for authorization values` when grounding knowledge lacks those table tokens |
| Stored expectedSpokenAnswer | Malformed cleaned procedure |
| `_spoken` meta | Still intact (not what recovery prefers) |
| LIVE LLM | Generated (~193 tokens) — body not persisted |
| Recovery | Replaces spoken with **expectedSpokenAnswer** → `recovered_procedure` |
| Final UI | Malformed procedure (Validate sentence also dropped vs full `_spoken`; consistent with cleaned/fit path) |

**Offline proof** (diagnostic reproduction, no LIVE):

```text
stripUngroundedSapEntities(<pfcg.md generate-and-assign paragraph>, <thin config-only grounding>)
→ contains "Review table for the user assignment and table for authorization values"
→ matches LIVE Q1 final fragment
```

Q2 never contains that KB sentence → strip cannot create that fragment → LLM answer validates → no recovery.

---

## 7. First point of corruption

| Layer | Finding |
|---|---|
| Origin of wording | KB `knowledge/security/pfcg.md` “Generate and assign a single role” (technically fine with AGR names) |
| **First observable corruption** | Prefer-time `stripUngroundedSapEntities` in **`pages/api/chat.js` ~2467–2483** when cleaning the procedure candidate against incomplete `primaryKnowledge`/`knowledgeContext` |
| Why it reaches the UI | Recovery in **`lib/generationGuard.js` `recoverNonEmptySpokenAnswer` ~735–745** serves `promptPayload.expectedSpokenAnswer` (cleaned) after the LIVE answer fails the ungrounded-transaction gate |
| Q2 bypass | Different procedure seed (no AGR table sentence) + validated LLM answer (no recovery) |

---

## 8. Root-cause classification

### **CASE C — COMPOUND FAILURE**

**Cause 1 (post-processing / prefer strip) — produces the malformed phrase**

- Defective behavior: hollowed “Review table for…”  
- Root cause: `stripUngroundedSapEntities` removes `AGR_USERS` / `AGR_1251` from a **source-backed procedure** because strip grounding is `primaryKnowledge || knowledgeContext` and may not include those table identifiers, even though they appear in the candidate being cleaned.  
- File/function: `pages/api/chat.js` procedure-prefer block (~2467–2483); strip implementation `lib/generationGuard.js` `stripUngroundedSapEntities` (table scrub ~342).  
- Trigger: procedure prefer selects the full generate-and-assign paragraph; grounding knowledge thinner than that paragraph.

**Cause 2 (recovery substitution) — selects the damaged text over LIVE**

- Defective behavior: `answer_kind:recovered_procedure` / `empty_fallback_procedure`  
- Root cause: `recoverNonEmptySpokenAnswer` rejects the LIVE spoken answer when `findUngroundedTransactionClaims` reports codes (LIVE flags show `SU01,SU53`) relative to `knowledgeText`, then substitutes `expectedSpokenAnswer` (already stripped).  
- File/function: `lib/generationGuard.js` `recoverNonEmptySpokenAnswer` (~717–745); caller `pages/api/chat.js` (~3056–3064).  
- Trigger: Q1 “use” path surfaces `transaction SU01` / `transaction SU53` in served/procedure text while retrieval `knowledgeContext` used for the check does not allowlist them; Q2 configure prose largely avoids `transaction <CODE>` claim patterns and validates.

**Not CASE A alone:** the malformed table sentence is **not** invented by the LLM; it is a degraded form of KB procedure text.  
**Not pure CASE B alone:** recovery is what **selects** that degraded text as the user-visible answer for Q1.

---

## 9. Proposed minimal correction (DO NOT IMPLEMENT IN THIS PHASE)

| Field | Proposal |
|---|---|
| Defect | Q1 UI shows hollowed AGR table sentence via recovered procedure |
| Root cause | Prefer-time strip of procedure against incomplete grounding + recovery preferring cleaned `expectedSpokenAnswer` |
| Smallest fix | In `pages/api/chat.js` prefer strip (~2467), **always union the procedure candidate into strip grounding**, e.g. `groundedKnowledge = [primaryKnowledge, knowledgeContext, preferDecision.spoken].filter(Boolean).join("\n")` so identifiers present in the source procedure are never stripped from that same procedure. |
| Optional complementary (still minimal) | When recovering `recovered_procedure`, prefer intact `_spoken` / re-strip with candidate-inclusive grounding; and/or align `findUngroundedTransactionClaims` with `WELL_KNOWN_SAP_KEEP` so SU01/SU53 do not force recovery when strip already trusts them. |
| Effect on Q1 | Keeps AGR table names in procedure evidence; reduces malformed “Review table for…”; may allow validated LLM more often if ungrounded gate is also aligned |
| Effect on Q2 | None expected (already validated; no AGR sentence) |
| Must not | Hardcode PFCG answers; disable `recovered_procedure` globally; broad regex scrubbers; change V3.1; alter ST03N usage sanitizer; redesign retrieval |
| Regressions to preserve | ST03N usage-vs-assignment sanitize; quiet strip (no “not confirmed in supporting knowledge”); bank/script demotion for live; MSMP Multi-Stage Multi-Path KB wording |

---

## 10. Missing evidence / limitations

1. **Raw LIVE completion text** for Q1/Q2 not persisted (`rawProviderHint: null`) — cannot quote the exact pre-recovery LLM answer without new instrumentation or a targeted LIVE replay that captures stream buffers.  
2. Full assembled prompt bodies not in jsonl — only sizes and `procedurePrefer` meta.  
3. Exact `primaryKnowledge` string at prefer-strip time not logged — offline thin-grounding reproduction matches the defect signature.  
4. No application source was modified; no new instrumentation added (per phase rules).

---

## 11. Confirmation

- **No application source files modified** in this diagnostic phase.  
- V3.1 prompt contract left unchanged.  
- ST03N usage-vs-assignment correction untouched.  
- PFCG is **not** declared fixed.  
- One comparison, one failure path, one proven compound root cause, one proposed minimal correction.

---

*End of diagnostic report.*
