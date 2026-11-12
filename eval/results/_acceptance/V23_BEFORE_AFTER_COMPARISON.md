# V23 Before / After LIVE Comparison

Evidence categories are kept separate. Contaminated mock-harness run is **not** a baseline.

| Legend | Meaning |
|---|---|
| Historical | Persisted session answer (may include strip damage / old routes) |
| Genuine baseline | First real OpenAI LIVE via `registerNextResolveLive.mjs` (tag=genuine) |
| Postfix | After WELL_KNOWN keep (tag=postfix) |
| Postfix2 | After MSMP KB fix + prompt/reasoner plane wording (tag=postfix2) |

---

## Defect: ST03N export

**Question:** How do you export all the T-codes used by a user?

| Stage | Classification | Notes |
|---|---|---|
| Historical (session sample) | TECHNICALLY_INCORRECT | "transaction not confirmed in supporting knowledge" + AGR_USERS/AGR_1251 as usage. |
| Genuine baseline | TECHNICALLY_INCORRECT | ST03N stripped → "utilizing transaction,"; AGR as execution. Issues: `missing-st03n-stad`, `stripped-tcode-placeholder`, `agr-as-execution`. |
| Postfix | PARTIALLY_INCORRECT | ST03N retained; still cites AGR_USERS/AGR_1251 on usage-export ask. |
| Postfix2 | PARTIALLY_INCORRECT | ST03N retained; AGR cited as assignment context but still mixed into usage-export answer. Release-blocking plane mix remains. |
| Acceptance fix LIVE (`st03n_acceptance`) | CORRECT_BUT_INCOMPLETE | ST03N primary path; AGR sentence removed by `usage_assignment_plane_sanitized`; `agrUsersAsExecutionHistory=false`. Export described as system-dependent GUI export — no invented universal menu path. Retention/STAD caveats still thin. |

**Acceptance-fix final (excerpt):**  
> …utilizing transaction ST03N, which provides workload analysis… select the relevant user and specify the time period… export it… using the standard export functionality available in the SAP GUI…

---

## Defect: PFCG use

**Question:** Explain how do you use PFCG?

| Stage | Classification | Notes |
|---|---|---|
| Genuine baseline | CORRECT_BUT_INCOMPLETE | Lifecycle present; SU01 stripped → "through transaction,". |
| Postfix / Postfix2 | CORRECT_AND_COMPLETE (lifecycle) / usability caution | Menu, auth, generate, assign, user comparison present; recovered_procedure voice; "Review table for" after AGR table strip. |

---

## Defect: PFCG configure

| Stage | Classification | Notes |
|---|---|---|
| Genuine baseline | CORRECT_BUT_INCOMPLETE | Menu / SU24 / generate; weak assignment. |
| Postfix2 | CORRECT_BUT_INCOMPLETE | Same core triad + validation; still thin on user assignment / comparison. |

---

## Benchmark: MSMP

**Question:** Explain MSMP architecture.

| Stage | Classification | Notes |
|---|---|---|
| Genuine baseline | PARTIALLY_INCORRECT | Expansion **Multi-Step Multi-Process** (KB-sourced). Workflow structure otherwise plausible. |
| Postfix | PARTIALLY_INCORRECT | Same wrong expansion. |
| Postfix2 | PARTIALLY_INCORRECT | Wrong phrase removed; said **Multi-Step Multi-Path** (should be Multi-**Stage** Multi-Path). |

---

## Benchmark: SU24 vs SU25

| Stage | Classification | Notes |
|---|---|---|
| Genuine baseline | CORRECT_AND_COMPLETE | Clear proposal vs upgrade-adjustment distinction. |
| Postfix2 | IRRELEVANT / CORRECT_BUT_INCOMPLETE | Recovered ECC→S/4 migration procedure — does not answer the difference ask. **Regression.** |

---

## Benchmark: Critical actions

| Stage | Classification | Notes |
|---|---|---|
| Genuine baseline | PARTIALLY_INCORRECT | Blurred into general SoD / risk management. |
| Postfix | CORRECT_BUT_INCOMPLETE | Better Critical Action vs Permission distinction; stripped "transaction,". |
| Postfix2 | PARTIALLY_INCORRECT | Drifted back toward SoD/BRM; stripped "transaction,". |

---

## Benchmark: OAuth 2.0 (open-world)

| Stage | Classification | Notes |
|---|---|---|
| Genuine / Postfix2 | CORRECT_AND_COMPLETE | Auth code → token exchange → access token; no forced SAP plane injection. |

---

## Benchmark: S/4 experience

| Stage | Classification | Notes |
|---|---|---|
| Genuine / Postfix2 | CORRECT_BUT_INCOMPLETE / evidence caution | CV metrics 1650/350 appear when experience asked; Postfix2 also "2,400 conflicts" — treat as **NOT INDEPENDENTLY VERIFIED** against CV in this pass unless separately confirmed. |

---

## Historical 128-Q genuine LIVE (aggregate only)

| Metric | Value |
|---|---|
| Completed | 128 / 128 |
| LIVE failed | 0 |
| Mock substituted | 0 |
| Short-circuit bank/script | 0 |
| Malformed phrase in finals | 0 |
| Operational-path commentary | 0 |
| AGR-as-execution flag | 2 |
| Avg latency | ~4092 ms |
| Avg answer chars | ~1026 |
| Token usage (prompt/completion) | ~2.08M / ~24.5k (~$0.33 list est.) |

Full historical post-fix replay after MSMP/prompt fixes: **not re-run** (budget/time); defect+benchmark postfix2 is the post-fix sample.
