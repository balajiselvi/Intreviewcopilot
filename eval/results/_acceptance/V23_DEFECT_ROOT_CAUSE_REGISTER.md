# V23 Defect Root-Cause Register

Generated: 2026-11-03T12:36:00Z  
Evidence basis: genuine LIVE OpenAI replay (`registerNextResolveLive.mjs`) + postfix probes.

---

## D1 — Malformed phrase: `not confirmed in supporting knowledge`

| Field | Evidence |
|---|---|
| Symptom | Spoken answers contained the meta phrase (historical sessions; earlier probes). |
| Reproduction | Historical answers in `data/interview-sessions`; prior simplified-architecture probes. Genuine LIVE baseline (141 Q): **0** occurrences in final answers. |
| Source | `lib/generationGuard.js` → `stripUngroundedSapEntities` (pre-fix injected hedge text when entities were stripped). |
| Root cause | Integrity strip removed ungrounded T-codes/tables and substituted / left meta hedge language into user-facing text. |
| Impact | Any answer mentioning entities absent from retrieval allowlist. |
| Correction | Quiet strip (no hedge injection) + `WELL_KNOWN_SAP_KEEP` allowlist for established admin/diagnostic codes. |
| Regression test | Replay harness flags `malformedPhrase`; historical inventory scan. |
| LIVE verification | Genuine + postfix: `malformedPhrase=false` on defect/benchmark set. |

---

## D2 — ST03N / AGR conflation + stripped T-code placeholders

| Field | Evidence |
|---|---|
| Symptom | "utilizing transaction," (empty) + AGR_USERS/AGR_1251 presented alongside usage export. |
| Reproduction | Exact Q: `How do you export all the T-codes used by a user?` |
| Source (strip) | `stripUngroundedSapEntities` removed `ST03N` when not in KB allowlist → `unsupported_detail:ST03N` + empty "transaction,". |
| Source (AGR pairing) | Prompt teaching in `lib/prompt/interviewPrompt.js` paired ST03N with AGR_USERS/AGR_1251 in one evidence sentence; `lib/technicalReasoner.js` Role Design note listed AGR tables under "Mine usage". |
| Root cause | (1) Over-aggressive entity strip without well-known keep list. (2) Prompt/reasoning text encouraged citing assignment tables in the same breath as usage tools; model then bundled them into usage-export answers. |
| Impact | Any usage / workload / "transactions used" question. |
| Correction | `WELL_KNOWN_SAP_KEEP` includes ST03/ST03N/STAD/SM20…; prompt + technicalReasoner wording clarified assignment ≠ execution. |
| Regression test | Harness `agrUsersAsExecutionHistory` + missing-ST03N checks. |
| LIVE verification | Postfix: ST03N **retained**. AGR still mentioned as assignment context on the same usage-export answer → **still release-blocking** until answers stop mixing planes for that ask. |

---

## D3 — MSMP expanded as "Multi-Step Multi-Process"

| Field | Evidence |
|---|---|
| Symptom | LIVE answers: "MSMP, or Multi-Step Multi-Process". |
| Reproduction | `Explain MSMP architecture.` |
| Source | `knowledge/grc/msmp.md` and retrieved chunks in `data/knowledgeIndex.json` authored the wrong expansion. |
| Root cause | Contaminated KB content retrieved and echoed by the LIVE LLM — not a random hallucination. |
| Impact | All MSMP concept/architecture questions. |
| Correction | Source markdown + active `data/knowledgeIndex.json` updated to **Multi-Stage Multi-Path**. Candidate-index backups left as historical archives. |
| Regression test | Benchmark `bench_msmp` must not contain `Multi-Step Multi-Process`. |
| LIVE verification | Postfix2: wrong phrase gone; answer said "Multi-Step Multi-Path Workflow" — **still not fully correct** (Stage, not Step). Residual model paraphrase risk. |

---

## D4 — PFCG repetitive / incomplete / recovered-procedure voice

| Field | Evidence |
|---|---|
| Symptom | Menu → SU24 → generate loops; or recovered procedure with "Review table for…" after strip. |
| Reproduction | `Explain how do you use PFCG?` / `How do you configure PFCG?` |
| Source | Generation path + procedure recovery (`answer_kind:recovered_procedure`, `empty_fallback_procedure`); strip removing AGR_* table names leaving "Review table for". |
| Root cause | Not a hardcoded PFCG wrap (removed earlier). Mixture of LLM brevity + procedure-recovery backbone + residual strip damage on table tokens. |
| Impact | Authorization / role-admin how-to questions. |
| Correction | Prior session removed PFCG spoken wrap; keep-list covers PFCG/SU01/SU24. No new canned PFCG answer added. |
| LIVE verification | Postfix use-question covers create/menu/auth/generate/assign/comparison — usable but still template-like; configure answer thinner on assignment. |

---

## D5 — Internal commentary leakage ("operational path end to end…")

| Field | Evidence |
|---|---|
| Symptom | Coaching / construction meta in spoken answers (historical). |
| Reproduction | Historical inventory flagged some turns; genuine LIVE defect/benchmark: **0**. |
| Source | Prompt `INTERNAL CONSTRUCTION` blocks / recovered procedure coaching — when leaked past sanitization. |
| Root cause | Historical leakage from construction instructions or recovered scripts; current LIVE path did not reproduce on the audited defect set. |
| Correction | No broad regex scrubber added (risk of deleting legitimate technical prose). Monitor via harness `operationalPathPhrase`. |
| LIVE verification | Genuine + postfix: clear. |

---

## D6 — Contaminated first "LIVE" harness run

| Field | Evidence |
|---|---|
| Symptom | ~0.45s/Q, principle/local-KB style answers labeled LIVE. |
| Source | `eval/harness/registerNextResolve.mjs` redirected `openai` → empty mock. |
| Root cause | Eval harness pollution — not production `chat.js` silent MOCK. |
| Correction | Use `registerNextResolveLive.mjs` for genuine LIVE. Contaminated artifacts preserved as `*_CONTAMINATED_MOCK_HARNESS.*`. |
| LIVE verification | Direct OpenAI probe + `providerStats.liveTransportInvocations≥1`, latency ~3–5s. |

---

## D7 — SU24 vs SU25 relevance regression (postfix)

| Field | Evidence |
|---|---|
| Symptom | Postfix answers with Activate migration narrative instead of SU24≠SU25 distinction. |
| Source | `answer_kind:recovered_procedure` serving ECC→S/4 migration workflow text. |
| Root cause | Procedure-recovery path over-matching difference questions. |
| Impact | Difference / compare questions near upgrade procedures. |
| Correction | **Not fixed in this audit pass** — documented as remaining defect. |
| LIVE verification | Genuine baseline SU24/SU25 was acceptable; postfix2 regressed. |

---

## Q&A production isolation (Phase 8)

| Check | Result |
|---|---|
| Static | `pages/api/chat.js`: when `llmMustGenerate` (live/mock), ANSWER_BANK and PREPARED_SCRIPT are demoted to `GENERATION` / `knowledge-grounded-llm`. |
| Runtime genuine 141 | `shortCircuits=0`, `mockViolations=0`, routes `GENERATION`, live transport invocations present. |
| `promptHasBankCue` | Often true — regex hits bank-related words inside system prompt text; **not** evidence that bank answers were served. |
| Claim "54/54" | Not used as readiness proof in this audit. |

---

## Minimal corrections applied (this audit)

1. `lib/liveReliability.js` — LLM timeout 4s → 60s (pre-genuine run).
2. `pages/api/chat.js` — demote bank/script short-circuits for live/mock.
3. `lib/generationGuard.js` — quiet strip + `WELL_KNOWN_SAP_KEEP`.
4. `knowledge/grc/msmp.md` + `data/knowledgeIndex.json` — Multi-Stage Multi-Path.
5. `lib/prompt/interviewPrompt.js` — assignment vs execution plane language.
6. `lib/technicalReasoner.js` — Role Design governance note separated assignment vs usage.

**Not done:** full historical 128-Q post-fix replay after (4)–(6); canned PFCG/ST03N answers (forbidden).
