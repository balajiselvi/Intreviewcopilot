# Interview Copilot V2.3 — Pre-Live Release Readiness Report

**Date:** 2026-11-03  
**Branch:** `feature/interview-engine-v2`  
**HEAD (unchanged):** `9a3b2da75fa9e2c7e3e528d446e2eb966ba404d2`  
**Commit/push:** none  
**Paid live provider:** not invoked  

Artifact: `eval/results/_acceptance/v23-prelive-readiness.json`  
Harness: `node --import ./eval/harness/registerNextResolve.mjs eval/v23PreliveReadinessAssert.mjs`

---

## 1. Git baseline

| Item | Value |
|---|---|
| Initial branch | `feature/interview-engine-v2` |
| Initial HEAD | `9a3b2da75fa9e2c7e3e528d446e2eb966ba404d2` |
| Working tree | Dirty throughout (preserved; no stash/reset/clean) |
| Dirty entry count (approx.) | ~407 porcelain lines at Phase 1 |
| Final HEAD | Same (`9a3b2da…`) — no commit |

SECTION9_13 claims were re-executed, not trusted from the markdown alone. BRM/PFCG re-verified under MOCK.

---

## 2. Q&A production isolation (Phase 2)

| Finding | Evidence |
|---|---|
| **A. Can banks enter ordinary technical retrieval?** | Filtered at `selectProductScopedChunks`: interview/architect-bank sources demoted; technical primary preferred. Critical Actions scoped bank hits = **0**. |
| **B. Do bank chunks remain in the index?** | **Yes — 413 / 3443** chunks still indexed (`architect-bank` / `interview-bank` / gap-filler). Files preserved on disk by design. |
| **C. Exact-question / keyword substitution override?** | Prepared scripts / verified workflows are **admission routes**, not retrieval overrides of arbitrary questions. BRM uses `VERIFIED_WORKFLOW`; PFCG uses `RETRIEVED_PROCEDURE` from `pfcg.md`. |
| **D. Rehearsal workflows** | Prepared/verified paths remain available without forcing banks into normal technical scoping. |
| **E. Provenance** | **100%** of enumerated index chunks carry `sourceFile` / `documentId`. Chunk ingest sets `metadata.interviewBank`. |

**Unresolved risk (non-blocking for MOCK readiness):** Banks remain *inside* the production vector index. Isolation is retrieval-time filtering, not physical index purge. A future index rebuild that omits bank files would harden §9 further; not done in this pass (would be a rebuild, not a redesign).

---

## 3. Retrieval quality + multi-domain matrix (Phases 3–4)

All 10 matrix cases **PASS** under MOCK (no live LLM accuracy claim).

| ID | Question | Route | Coverage / notes |
|---|---|---|---|
| grc-brm | Why do organizations implement BRM? | `VERIFIED_WORKFLOW` | RELEVANT_SUFFICIENT; `brm.md` |
| sec-pfcg | Explain how do you use PFCG? | `RETRIEVED_PROCEDURE` | RELEVANT_SUFFICIENT; Menu→Auth→Generate |
| sec-su24-su25 | Explain the difference between SU24 and SU25. | `VERIFIED_WORKFLOW` | PASS |
| grc-msmp | Explain MSMP architecture. | `VERIFIED_WORKFLOW` | PASS |
| grc-critical-actions | Explain critical actions and their significance. | `GENERATION` (mock) | RELEVANT_SUFFICIENT; Critical Action definition |
| bw-analysis-auth | Explain analysis authorizations. | `VERIFIED_WORKFLOW` | Fixed: was DEFER + empty folders |
| idm-ips-lifecycle | Explain the identity provisioning lifecycle. | `RETRIEVED_PROCEDURE` | Fixed: configure intent + direct fallback |
| btp-authz | Explain authentication and authorization architecture. | `PREPARED_SCRIPT` | No SAP GUI dump |
| s4-experience | Tell me about your S/4HANA transformation experience. | `GENERATION` (mock) | IRRELEVANT_RETRIEVAL OK; no Activate checklist |
| outside-inventory | ZZX99_FAKE / Quantum Ledger Controllers | `GENERATION` (mock) | NO_RELEVANT_KNOWLEDGE; no fabrication |

---

## 4. Intent / route regression (Phase 5) — PASS

| Check | Result |
|---|---|
| A. `wrapMode=direct` for configure how-to | PASS (Principal seniority) |
| B. Conceptual why not forced to procedure prefer | PASS |
| C. “how do you work in/with…” → configure | PASS |
| D. Experience ≠ Activate checklist | PASS |
| E. Inability is meta / not validated technical | PASS |
| F. `answer_final` emitted after validation | PASS |

---

## 5. Provider modes (Phase 6)

| Mode | Result |
|---|---|
| **MOCK** | Pipeline executes; `liveTransportInvocations=0`; deterministic mock; **not** proof of live LLM accuracy |
| **DISABLED** | LLM blocked (`disabledBlocked≥1`); known Critical Actions may use local knowledge; outside-inventory emits **operational provider-disabled** message (not unrelated IAG PAM prose) |
| **LIVE** | **Not invoked.** Mode resolves to `live`. Prerequisites: explicit authorization, API key, `LLM_PROVIDER_MODE=live`, separate live harness |

---

## 6. BRM / PFCG final answer samples (MOCK)

**BRM** — route `VERIFIED_WORKFLOW`:

> In BRM I govern business-role definitions and their technical-role mappings so ARM requesters pick job-function names while provisioning still assigns the underlying PFCG roles. Define business roles in business language…

**PFCG** — route `RETRIEVED_PROCEDURE`:

> Use transaction PFCG to create the single role, add the required transactions on the Menu tab, and maintain organizational levels on the Authorizations tab. Generate the authorization profile in PFCG after that authorization…

---

## 7. Defects found and fixed in this readiness pass

| Defect | Root cause | Fix |
|---|---|---|
| BW “Explain analysis authorizations.” → `DEFER` / empty folders | Plural `authorizations` missed TECHNICAL_SIGNAL; no BW folder mapping | `questionAdmission.js` + `productKnowledgeScope.js` |
| DISABLED + outside-inventory → unrelated IAG PAM prose | Weak keyword local KB + integrity recovery on empty | Score floor + invented-product short-circuit in `liveReliability.js`; skip integrity on empty local in `chat.js` |
| IPS provisioning lifecycle → inability under MOCK | No configure intent; empty direct fallback; then `q is not defined` crash | Lifecycle intent; IPS direct fallback; **`const q = String(question)`** in `buildDirectTechnicalFallback` |
| Offline 52/54 after inability-as-meta | `buildPrincipleLevelFallback` returned inability text | Principle returns methodology; inability reserved for integrity endpoint |

**Offline regression after fixes:** **54/54** (`node eval/runOffline.js`).

---

## 8. Files changed in this readiness pass

- `lib/questionAdmission.js`
- `lib/productKnowledgeScope.js`
- `lib/liveReliability.js`
- `lib/generationGuard.js`
- `lib/answerIntegrityGate.js`
- `lib/procedureRetention.js`
- `pages/api/chat.js`
- `eval/v23PreliveReadinessAssert.mjs`
- `eval/results/_acceptance/v23-prelive-readiness.json`
- `eval/results/_acceptance/V23_PRELIVE_READINESS_REPORT.md`

---

## 9. Limitations / unresolved risks

1. **MOCK ≠ live LLM accuracy** — generation routes that use deterministic mock/direct fallbacks prove pipeline + integrity, not model knowledge.
2. **Answer banks remain indexed** — retrieval filters them; index purge not performed.
3. **HTTP six-question harness (`:3103`)** — still requires a restarted Next server to reflect these edits; in-process harnesses are authoritative here.
4. **Prepared-script route** for some conceptual IAM/BTP asks — intentional admission path; confirm product preference before live.
5. **No separately authorized live-provider run** yet.

---

## 10. Definitive readiness statement

**The Knowledge Base + LLM architecture is ready for separately authorized live-provider validation** under these conditions:

- Production retrieval prefers technical documentation over Q&A banks (banks still indexed).
- Multi-domain MOCK matrix (10/10) and offline **54/54** pass after confirmed defect fixes.
- MOCK/DISABLED provider isolation verified; LIVE not exercised.

**Not ready to claim production LLM answer quality** until an explicitly authorized live evaluation is run against the same matrix.

**Go for live validation authorization:** YES (pipeline / isolation / MOCK acceptance).  
**Go for production LLM quality claims:** NO until live results exist.
