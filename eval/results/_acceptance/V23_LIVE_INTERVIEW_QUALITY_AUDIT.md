# Interview Copilot V2.3 — LIVE Interview Quality Audit

**Decision: NOT READY**

**Date:** 2026-11-03  
**Branch:** `feature/interview-engine-v2`  
**HEAD:** `9a3b2da75fa9e2c7e3e528d446e2eb966ba404d2`  
**Provider:** OpenAI `gpt-4o-mini` via genuine LIVE harness (`registerNextResolveLive.mjs`)

---

## 1. Executive summary

Genuine LIVE replay through the production generation path completed for **128 historical questions** plus defect probes and a **10-question controlled benchmark**. Several prior defect classes improved (malformed hedge phrase gone; ST03N no longer stripped; bank/script short-circuits demoted; MSMP KB typo corrected at source).

Release is still **NOT READY** because LIVE answers continue to show material technical defects:

1. **Usage vs assignment plane mix** on “export T-codes used by a user” (ST03N retained, but AGR_USERS/AGR_1251 still bundled into the same spoken answer).
2. **MSMP expansion still wrong** after KB fix (“Multi-Step Multi-Path” instead of Multi-**Stage** Multi-Path).
3. **SU24 vs SU25 postfix regression** — difference question answered with an ECC→S/4 migration procedure.
4. **Critical-actions** answers unstable (strip placeholders / SoD blur).
5. First full “LIVE” run was **contaminated by the mock resolve harness** and must never be cited as quality proof.

Mock/offline suite success is **out of scope** for this readiness gate.

---

## 2. Project baseline and preservation

| Check | Result |
|---|---|
| Working tree | Dirty (~407 entries) — **not** reset/cleaned/stashed |
| Commit / push | **None** performed for this audit |
| Session store | Intact under `data/interview-sessions/` |
| Contaminated artifacts | Preserved as `*_CONTAMINATED_MOCK_HARNESS.*` |

Supporting artifacts:

- `V23_HISTORICAL_SESSION_INVENTORY.md`
- `V23_HISTORICAL_REPLAY_DATASET.json`
- `V23_LIVE_REPLAY_RESULTS.jsonl` (= genuine baseline)
- `V23_LIVE_REPLAY_RESULTS_genuine.jsonl`
- `V23_LIVE_REPLAY_RESULTS_postfix.jsonl` / `_postfix2.jsonl`
- `V23_DEFECT_ROOT_CAUSE_REGISTER.md`
- `V23_BEFORE_AFTER_COMPARISON.md`
- `V23_LIVE_REPLAY_MANIFEST.md`

---

## 3. Historical session provenance (Phase 1)

**Persistence (verified in code):** `lib/interviewSessionStore.js` → `data/interview-sessions/<id>.json` via `appendQa` from `pages/api/chat.js`.  
`eval/sessions/` is **not** the production history path.

| Metric | Count |
|---|---|
| Session files | 523 |
| VERIFIED_LIVE | 23 |
| CANDIDATE_LIVE_WEAK | 3 |
| PROVENANCE_UNVERIFIED | 249 |
| TEST_OR_NON_LIVE | 248 |
| Sessions selected | 5 |
| Eligible replay questions | **128** |

Selected IDs: `live_mvt4dz46_5fcq9n4o`, `live_mvt0tarh_4von54md`, `live_mvrki89p_z9ge6ltn`, `live_mvrk1llb_wldgvo5v`, `live_mvqq943r_aavgq6ha` (weak).

These are genuine microphone interview turns with model + token/latency corroboration (except the weak fifth). They represent actual interview usage, not fabricated benchmark rows.

**Limitation:** Session JSON does not store an explicit `LLM_PROVIDER_MODE` receipt; LIVE classification is inferred from source/model/usage/latency.

---

## 4. Controlled LIVE historical replay (Phase 2)

| Evidence class | Result |
|---|---|
| Contaminated mock-harness 141 | Invalid for quality — openai redirected to empty mock |
| Genuine LIVE 128 historical | **128/128** completed; 0 liveFailed; 0 mock; 0 bank/script short-circuit |
| Avg latency / size | ~4.1 s / ~1026 chars |
| Tokens (historical) | ~2.08M prompt + ~24.5k completion (~$0.33 list est.) |
| Malformed phrase in finals | 0 |
| Operational-path commentary | 0 |
| AGR-as-execution flag | 2 |

Raw vs final: integrity strip can still alter raw LLM text (entity removal). Postfix ST03N shows `unsupported_detail:ST03N` quality flag even when keep-list retains the token — strip/allowlist interaction still noisy.

Historical answers were baselines only — **not** injected into generation context.

---

## 5. Known-defect LIVE probes (Phase 3)

### 5.1 PFCG

Genuine and postfix2 answers cover role create → menu → authorizations → profile generate → assign / user comparison at usable depth for interview speech. Remaining issues: recovered-procedure voice; occasional stripped table placeholders (“Review table for…”). Not the old three-line menu/SU24/generate-only trap in the use question; configure remains thinner.

### 5.2 ST03N / usage export

| Run | ST03N present | AGR mixed into usage answer | Verdict |
|---|---|---|---|
| Genuine | No (stripped) | Yes | TECHNICALLY_INCORRECT |
| Postfix / Postfix2 | Yes | Yes | PARTIALLY_INCORRECT (release-blocking) |

Independent check: AGR_USERS / AGR_1251 are assignment / authorization-data tables; they do **not** provide executed T-code history. ST03N/STAD (and SM20 for audit log) are the correct planes — **NOT INDEPENDENTLY VERIFIED** against a specific SAP Help page in this pass, but consistent with standard SAP Security practice.

### 5.3 Malformed phrase

Origin: `lib/generationGuard.js` `stripUngroundedSapEntities` (historical injection). Fix: quiet strip + keep-list. Genuine LIVE sample: **absent**.

### 5.4 Internal commentary

“I walk the operational path end to end…” — not observed on genuine/postfix defect+benchmark finals. Historical inventory still shows older contaminated answers in session files.

---

## 6. Supplementary LIVE benchmark (Phase 4)

Postfix2 classifications (independent rubric, not LLM-as-sole-judge):

| ID | Question theme | Classification | Critical note |
|---|---|---|---|
| bench_brm | Why BRM | CORRECT_AND_COMPLETE | Business vs technical role mapping OK |
| bench_pfcg | Use PFCG | CORRECT_AND_COMPLETE* | *template/recovered voice |
| bench_su24_su25 | SU24 vs SU25 | IRRELEVANT / incomplete | Migration procedure instead of difference — **regression** |
| bench_msmp | MSMP architecture | PARTIALLY_INCORRECT | Expansion still wrong |
| bench_critical_actions | Critical actions | PARTIALLY_INCORRECT | SoD blur + stripped “transaction,” |
| bench_bw | Analysis authorizations | CORRECT_AND_COMPLETE | Distinct from classic ABAP checks |
| bench_idm | Provisioning lifecycle | CORRECT_BUT_INCOMPLETE | IPS-leaning; OK for open lifecycle ask |
| bench_btp | AuthN/AuthZ architecture | CORRECT_BUT_INCOMPLETE | IAS + role collections; light on XSUAA/scopes detail |
| bench_s4_experience | S/4 transformation role | CORRECT_BUT_INCOMPLETE | CV metrics used; “2400 conflicts” unverified here |
| bench_oauth | OAuth auth code flow | CORRECT_AND_COMPLETE | Open-world OK; no false KB claim required |

---

## 7. Technical cross-verification (Phase 5)

| Claim class | Method | Outcome |
|---|---|---|
| MSMP expansion | SAP GRC Access Control naming (Multi-Stage Multi-Path) vs KB | KB had wrong string; fixed at source; model still paraphrased incorrectly |
| AGR ≠ execution | Domain knowledge / Security practice | Confirmed defect when answers treat AGR as usage export |
| OAuth code flow | Standard OAuth 2.0 authorization code behavior | LIVE answer coherent; PKCE optional/not always required |
| Dover 1650/350 roles | Prior CV grounding in product | Appears in experience answers; treat as CV-backed only if still in candidate profile |
| “2400 conflicts” | Not re-verified against CV in this pass | **NOT INDEPENDENTLY VERIFIED** |

Scoring used 0–4 dimensions in analyzer scripts; any material technical error overrides a high aggregate (see register).

---

## 8. Root causes and minimal corrections (Phase 6)

See `V23_DEFECT_ROOT_CAUSE_REGISTER.md`.

Applied (evidence-backed, non-canned):

1. LIVE timeout 4s → 60s (`lib/liveReliability.js`)
2. Demote ANSWER_BANK / PREPARED_SCRIPT when live/mock (`pages/api/chat.js`)
3. Quiet strip + `WELL_KNOWN_SAP_KEEP` (`lib/generationGuard.js`)
4. MSMP expansion corrected in `knowledge/grc/msmp.md` + active `data/knowledgeIndex.json`
5. Assignment vs execution wording in `lib/prompt/interviewPrompt.js` and `lib/technicalReasoner.js`

**Not applied:** hardcoded PFCG/ST03N answer banks; full 128-Q post-fix after (4)–(5).

---

## 9. Post-fix LIVE (Phase 7)

| Suite | Status |
|---|---|
| Defect + 10-Q benchmark postfix | Done |
| Defect + 10-Q benchmark postfix2 | Done |
| Full 128 historical post-fix | **Not re-run** after MSMP/prompt fixes |

Before/after detail: `V23_BEFORE_AFTER_COMPARISON.md`.

---

## 10. Q&A production isolation (Phase 8)

| Evidence | Finding |
|---|---|
| Static | Live/mock demotes bank/script routes to GENERATION before answer serve |
| Runtime genuine 141 | shortCircuits=0; mockViolations=0; liveTransportInvocations≥1 |
| promptHasBankCue | Regex on prompt text — **not** proof of bank substitution |
| Offline “N/N passed” | Not used as LIVE readiness proof |

---

## 11. Remaining defects / limitations

- ST03N usage-export answers still mention AGR tables without a hard plane separation in speech.
- MSMP expansion residual error after KB fix.
- Procedure-recovery can hijack difference questions (SU24/SU25).
- Entity strip still produces “transaction,” / “Review table for” artifacts.
- Candidate-index backups still contain old MSMP wording (inactive unless selected).
- Session provenance lacks signed live-transport receipt.
- Full historical post-fix after latest prompt/KB edits not completed.

---

## 12. Final release-readiness decision

### **NOT READY**

Genuine LIVE replay was executed and evaluated. Unresolved material technical defects remain in the LIVE sample (ST03N plane mix, MSMP naming, SU24/SU25 relevance regression, critical-actions instability). The product must not be declared ready for live interview reliance on the strength of pipeline HTTP success, MOCK tests, or the contaminated mock-harness run.

**Next engineering steps (smallest justified):**

1. Harden generation instructions / integrity so usage-export questions cannot cite AGR_* as complementary “usage” without an explicit non-execution disclaimer — prefer omitting AGR on pure usage asks.
2. Add a generalized acronym-expansion guard or KB synonym for MSMP → Multi-Stage Multi-Path (without canned full answers).
3. Prevent recovered_procedure from replacing compare/difference intents (SU24 vs SU25).
4. Re-run genuine LIVE defect+benchmark (and a sample of historical usage questions) after those fixes.

---

*End of audit report.*
