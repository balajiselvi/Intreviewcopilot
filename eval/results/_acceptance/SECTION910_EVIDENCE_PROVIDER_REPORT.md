# §9 Technical Evidence + §10 Provider Mode — Acceptance Report

**Branch:** `feature/interview-engine-v2`  
**HEAD:** `9a3b2da75fa9e2c7e3e528d446e2eb966ba404d2` (unchanged; no commit/push)  
**Verdict:** **CONDITIONAL GO** (live paid provider still not run)

## Defects found and fixed

1. **DISABLED operational message rewritten by integrity** into a technical Critical Actions answer — violated “do not misrepresent disabled as knowledge gap / do not hide operational disable.”  
   - Fix: `isProviderDisabledOperationalMessage` short-circuit in integrity gate; chat.js emits `answer_final` for `PROVIDER_DISABLED` without concept recovery rewrite.  
   - Message clarified as **operational configuration**, not missing SAP knowledge.

2. **`PROVIDER_DISABLED` skipped buffered integrity emission** (`routeNeedsIntegrityGate` omitted it) → client could get no final text under `bufferBeforeDisplay`.  
   - Fix: include `PROVIDER_DISABLED` and `STAR_LOCAL_FALLBACK` in the gate set.

3. **`S4_TRANSFORM` vs `S4_TRANSFORMATION` ReferenceError** in integrity gate (non-family conceptual path).  
   - Fix: use `S4_TRANSFORMATION_BLUEPRINT_LEAK` consistently.

4. **Retrieved-procedure route** finalized but lacked `answer_final` observability event.  
   - Fix: emit `answer_final` after `finalizeSpokenAnswerForDisplay` on procedure path.

5. **Mock outside-inventory** could echo invented artifact names.  
   - Fix: deterministic mock refuses `ZZX99_FAKE` / invented module paths without fabricating T-codes.

## §9 evidence (integrity independent of generation)

| Check | Result |
|---|---|
| Alternative terminology for Critical Actions accepted | PASS |
| Fabricated wrong-subject + S/4 leak rejected | PASS |
| DISABLED message not rewritten to technical answer | PASS |
| Finalization rejects S/4 blueprint leak | PASS |
| Ungrounded T-code / unsupported-detail gates remain in generation path | present (`findUngroundedTransactionClaims`, `evaluateUnsupportedTechnicalDetail`) |

## §10 acceptance matrix (21/21)

Evidence: `eval/results/_acceptance/section910-acceptance-matrix.json`

| Criterion | Result |
|---|---|
| Existing indexed / bank-style definition | PASS (mock GENERATION, finalized) |
| New paraphrased question in indexed domain | PASS |
| Skill domain without exact bank match (FF logs) | PASS |
| Outside inventory (no invented T-code) | PASS |
| Zero/irrelevant RAG detection | PASS |
| Acronym with IPS context | PASS |
| Ambiguous acronym (`What about AC?`) safe/defer path | PASS |
| MOCK zero live transport | PASS |
| DISABLED zero LLM + operational message / local route | PASS |
| LIVE resolve + guard allows only in live | PASS (no paid call) |
| Contamination (IAG BFG as entire GRC ruleset) rejected/recovered | PASS |
| Finalization before client delivery | PASS (`answer_final` on generation + procedure + disabled) |

## Non-regression

- `node eval/runOffline.js` → **54/54 PASS**
- `responseIntegrityAssert` → PASS
- `providerModeIsolationAssert` → PASS

## Provider-mode semantics (contract)

| Mode | Behaviour verified |
|---|---|
| LIVE | Guard allows transport; not exercised with paid keys |
| MOCK | Same pipeline; deterministic answers; validates pipeline not live LLM accuracy |
| DISABLED | No LLM; operational message when generation required; local/prepared may still answer |

## Remaining

- Paid **LIVE** technical-accuracy evaluation still requires explicit authorization.
- No commit/push performed.
