# Phase 6 — PFCG Technical Answer Quality Acceptance

**Evaluated:** 2026-11-03  
**Evidence:** LIVE OpenAI `gpt-4o-mini` via `registerNextResolveLive.mjs`  
**Artifact:** `V23_LIVE_REPLAY_RESULTS_v31_adaptive.jsonl`  
**Prompt layer:** V3.1 (unchanged for this evaluation)

Scoring: 0–4 per dimension. Reference points A–E are optional relevance checks, not mandatory keyword lists.

---

## Q1 — "Explain how do you use PFCG?"

**Source turns:** `defect_pfcg_use` / `bench_pfcg` (identical recovered procedure)

**Final displayed answer:**  
> Use transaction PFCG to create the single role, add the required transactions on the Menu tab, and maintain organizational levels on the Authorizations tab. Generate the authorization profile in PFCG after that authorization data is complete, because the generated profile is what the user buffer checks. Assign the role on the PFCG User tab or in transaction SU01, then run user comparison so the profile enters the user buffer. Review table for the user assignment and table for authorization values, and do not treat AGR_USERS as a transaction. Transport the released role change with the Change and Transport System and import it in the target system. Use transaction SU53 only to read the last failed authorization check, and do not treat that display as proof that the business action succeeded.

| Dimension | Score | Evidence |
|---|---|---|
| Technical accuracy | 3 | Correct create → menu → auth/org → generate → assign → user comparison → SU53 caveat. No invented PFGEN/AUTH*. |
| Relevant operational detail | 3 | Covers A/C/D/E at practical depth for a “use” ask. Derived/composite, SU24, PFUD, SU56, STAUTHTRACE omitted — not required. |
| Completeness | 3 | Operational lifecycle present; not a full encyclopedia (acceptable). |
| Logical sequence | 4 | Natural admin order. |
| Natural spoken delivery | 2 | Served as `recovered_procedure` — imperative checklist voice, not conversational practitioner speech. |
| Absence of irrelevant / malformed | **1** | **Release-blocking fragment:** “Review table for the user assignment and table for authorization values” (table names stripped). Mildly odd “do not treat AGR_USERS as a transaction” after tables were removed. |

**Reference coverage (optional):** A partial (single role, menu, org) · B thin (org only; no SU24 — OK) · C yes · D yes (PFCG/SU01 + comparison; no PFUD/SU56 — OK) · E partial (SU53 + correct limit; no trace — OK)

**Classification:** `CORRECT_BUT_INCOMPLETE` with **malformed-output defect**  
**Acceptance:** **FAIL** — practical knowledge is present, but malformed table prose makes the answer unsuitable for live interview display.

**Path note:** `empty_fallback_procedure` / `answer_kind:recovered_procedure` / `ungrounded_tcodes:SU01,SU53` — LLM path fell through to procedure recovery; strip then damaged AGR table names. Not a “missing keyword” failure.

---

## Q2 — "How do you configure PFCG?"

**Source turn:** `defect_pfcg_configure` (`answer_kind:validated`)

**Final displayed answer:**  
> To configure PFCG, I start by maintaining the menu tab with the correct transaction codes that align with the business processes… Next, I review and adjust the SU24-proposed authorization values on the authorization tab… After making any changes… I generate the profile… This profile must be regenerated after every authorization change… Finally, I validate the generated profile against test scripts…

| Dimension | Score | Evidence |
|---|---|---|
| Technical accuracy | 4 | Menu → SU24 proposals → generate/regenerate → UAT-style validation. No invented T-codes. |
| Relevant operational detail | 3 | Strong on B/C for a configure ask. Assignment/comparison/SU53 lightly absent — acceptable for configure focus. |
| Completeness | 3 | Sufficient for configure; not forced into full A–E inventory. |
| Logical sequence | 4 | Clear configure sequence. |
| Natural spoken delivery | 3 | First-person practitioner prose; slightly generic close (“end-to-end process…”). |
| Absence of irrelevant / malformed | 4 | No SoD lecture, no AGR-as-execution, no strip debris. |

**Reference coverage (optional):** A partial (menu) · B yes (SU24 + auth tab) · C yes (generate + regenerate rule) · D omitted (OK for configure) · E via test scripts (OK; not SU53-centric)

**Classification:** `CORRECT_AND_COMPLETE` (for configure intent)  
**Acceptance:** **PASS**

---

## Verdict

| Question | Acceptance |
|---|---|
| Explain how do you use PFCG? | **FAIL** (malformed recovered-procedure fragment) |
| How do you configure PFCG? | **PASS** |

**Overall Phase 6 PFCG gate:** **NOT PASSED**

The configure answer shows practical PFCG understanding without keyword stuffing. The use answer’s technical substance is largely sound but is undermined by recovered-procedure delivery and strip-induced malformed table wording — that is an integrity/procedure-recovery issue, not missing PFCG checklist items.

**Smallest justified follow-up (out of prompt-only V3.1 scope):** stop serving damaged recovered procedures for PFCG use (fix strip of AGR_* table labels in procedure text, or prefer validated LLM answer when procedure recovery produces incomplete table sentences).
