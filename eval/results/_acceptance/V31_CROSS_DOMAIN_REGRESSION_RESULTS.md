# V3.1 Cross-Domain Regression Results

## Offline

| Test | Command / check | Result |
|---|---|---|
| generationGuardAssert (incl. Tests 1–4, ST03N plane, prefer provenance) | `node eval/generationGuardAssert.js` | **PASS** |
| Source-backed AGR preservation when grounding includes procedure | assert in generationGuardAssert | **PASS** |
| Thin grounding hollow + `isDestructiveEntityStripResult` | assert | **PASS** |
| Invented ZX99NINE stripped | assert | **PASS** |
| WELL_KNOWN SU01/SU53 not false-ungrounded | assert | **PASS** |
| ST03N usage sanitize (AGR not execution) | assert | **PASS** |

## Genuine LIVE (bounded) — tag `v31_cross_domain`

Planned: 13 questions (defect + benchmark). Est. cost ≪ $0.10. MOCK disabled (`registerNextResolveLive.mjs`).

Artifact: `V31_CROSS_DOMAIN_LIVE_VERIFICATION.jsonl` (copy of `V23_LIVE_REPLAY_RESULTS_v31_cross_domain.jsonl`)

| # | Question | Expected | Result |
|---|---|---|---|
| 5 | Explain how do you use PFCG? | No hollow table; AGR OK if cited | **PASS** — `validated`; AGR_USERS/AGR_1251 kept; no `Review table for` |
| 6 | How do you configure PFCG? | Preserve pass | **PASS** — `validated` |
| 7 | Export T-codes used by user | ST03N; no AGR-as-exec | **PASS** — ST03N; usage sanitize; agr flag false |
| 8 | MSMP architecture | Multi-Stage Multi-Path | **PASS** |
| 9 | SU24 vs SU25 | Direct comparison | **PASS** |
| 10 | Analysis authorizations | BW/RSECADMIN | **PASS** |
| 11 | Identity provisioning lifecycle | Intact | **PASS** |
| 12 | BTP authN/authZ | Cloud terms | **PASS** |
| 13 | OAuth auth code flow | No GUI force | **PASS** |
| — | BRM / Critical actions / S4 exp | Controls | **PASS** (critical-actions still concept_coverage_fail flag but answer content OK) |

`liveFailed=0`, `mockViolations=0`, `shortCircuits=0`.

## Limitation

`rawProviderHint` still null in harness records — raw LLM bodies not persisted; post-fix quality judged from final displayed answers + flags.
