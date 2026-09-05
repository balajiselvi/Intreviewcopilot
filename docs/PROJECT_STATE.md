# Project State — Single Source of Truth

Last updated: see `CHANGELOG.md` for the date of the most recent entry. This document is
about the *current* state; history lives in `CHANGELOG.md`.

## Project Vision

Interview Copilot is a live interview-assistance tool for SAP Security, SAP GRC, SAP
IDM, SAP BTP, and RISE with SAP interviews. It listens to system audio (interviewer)
and microphone (candidate) via Azure Speech SDK, transcribes both, and generates a
spoken-style answer to the interviewer's question using a RAG pipeline grounded in a
structured markdown knowledge base — not raw uploaded reference documents, and not
model general knowledge alone.

The structured markdown repository under `knowledge/` is the product. The retrieval
pipeline, chunking, embeddings, and interview-generation prompt are supporting
infrastructure, now considered stable (see "Frozen Components" below). Knowledge
quality is the current primary development lever.

## Current Development Phase

**Phase: Principal Architect reasoning & answer-quality layer** (starting fresh as of
2026-09-06). The prior phase — **retrieval/classification stabilization** — is
complete as of 2026-09-05 (branch `feature/interview-engine-v2`): a candidate-recall
bug that made 96.7% of the knowledge corpus structurally unreachable was found and
fixed, stage-1 scoring's scale-imbalance defect was normalized (causally proven, not
just correlated), several category/domain contract mismatches were fixed, SAC and PMP
were made first-class categories, an experience-fabrication defect was fixed at the
prompt-contract level, and BW got its first real knowledge content (was a confirmed
0-byte gap). Full detail: `CHANGELOG.md`'s 2026-09-05 entry. Retrieval/scoring/
classification are now considered stable — see "Frozen Components" below, which
carries forward the same "do not reintroduce content-only scoring bonuses" principle
that was already documented here from an earlier fix of the identical bug class,
confirming this defect shape has recurred more than once and deserves permanent
vigilance in code review, not just a one-time fix.

The current focus is generation quality: causal reasoning structure, trade-off
articulation, follow-up anticipation, and stronger reasoning for complex/scenario/
hybrid questions — not further retrieval or classification tuning.

## High-Level Architecture

```
Client (pages/interview.js)
  → Azure Speech SDK transcribes system/mic audio
  → POST /api/chat (pages/api/chat.js)
      → question analysis (lib/interviewAnalyzer.js, reasoningPlanner.js, componentSelector.js,
        interviewerProfiler.js, technicalReasoner.js)
      → knowledge retrieval (services/vectorSearch.js → lib/container.js → services/retrievalService.js)
      → prompt construction (lib/prompt/interviewPrompt.js + speechOptimizer.js)
      → single LLM call, streamed (OpenAI or Gemini, model-agnostic)
      → post-answer heuristic evaluation (lib/prompt/evaluation.js, scoring.js, followupAnalyzer.js) — no LLM call
  → client renders streamed answer + AnswerQualityPanel
```

Single-pass generation is a hard architectural constraint: no second LLM call, no
answer rewriting/regeneration stage, ever. This was decided explicitly after an earlier
design direction (regenerate answers until they "pass" a quality bar) was rejected —
it adds latency a live interview tool can't afford and risks encouraging embellishment.

## Current Folder Structure

```
knowledge/
  security/  grc/  s4hana/  btp/  rise/  project-management/  project-types/
  interview-scenarios/  behavioral/  leadership/  cloud/  idm/  fiori/  bw/
  troubleshooting/  audit/  compliance/  transports/  cutover/  hypercare/
```

20 semantic-named domains, 110 markdown files total. No numbered folders remain —
migrated from a `01-security`/`02-grc`/... scheme; confirmed via full-repo grep that
nothing in code ever referenced the numbering, so the rename had zero code impact.

`lib/prompt/` holds the prompt-construction and post-answer evaluation modules (see
`lib/prompt/README.md` for that subsystem's own design-principles doc — don't duplicate
it here).

## Retrieval Architecture

`services/knowledgeService.js` (scan + parse) → `services/chunkService.js` (markdown-
aware chunking) → `services/embeddingService.js` (local `@xenova/transformers`
embeddings) → `services/knowledgeIndexService.js` (incremental index build, writes
`data/knowledgeIndex.json`) → `services/retrievalService.js` (hybrid semantic + lexical
+ component + intent scoring, ranking, dedup) → `services/vectorSearch.js` (thin
compatibility wrapper) → `lib/container.js` (DI wiring) → `pages/api/chat.js`.

Full mechanics documented in `docs/RETRIEVAL.md` and `docs/INDEXING.md` (pre-existing
docs, still accurate for the pipeline shape — this file doesn't repeat their content).

**Scoring is query-aware as of this milestone** — see `CHANGELOG.md` for the specific
defects found and fixed. Do not reintroduce content-only (query-independent) scoring
bonuses; that was the root cause of a major retrieval-precision regression.

## Knowledge Platform

- Source of truth for RAG retrieval: `knowledge/<domain>/*.md` only. Raw uploaded
  PDFs/DOCX/reference material (if any exist outside `knowledge/`) are for authoring
  assistance only, never queried at runtime — confirmed `services/knowledgeService.js`
  only scans `appConfig.knowledge.sourceDirectory` (`./knowledge`).
- Every file follows one fixed template (24 sections: Overview, Interview Summary,
  30/60/90 Second Interview Answers, Architecture, Runtime Flow, Configuration,
  Implementation/Migration/Rollout/Production Support Activities, Troubleshooting,
  20+ Common Interview Questions, 20+ Tough Follow-up Questions, SAP Transactions, SAP
  Tables, Best Practices, Common Mistakes, Interviewer's Hidden Expectations, What
  Makes This a 10/10 Answer, Red Flags, Keywords, Related Topics).
- Cross-referencing via a `## Related Topics` section (links to other `.md` files by
  name) instead of duplicating content between files.
- Written in natural spoken English for a live interview — not documentation style, not
  SAP Help style. No fabricated personal experience — implementation/rollout/support
  activities are written as generic consultant responsibilities, never first-person
  claims.

## Production Configuration

- `LLM_VALIDATION_MODE` (default `retrieval-only`): runs the full pipeline and returns
  a diagnostic SSE event instead of calling an LLM — no API key needed, zero cost. Set
  to `full` for real generation.
- `OPENAI_API_KEY` / `GEMINI_API_KEY`: optional server-side fallback keys. Client-
  supplied key (Settings dialog, BYOK) always takes priority — this preserves the
  app's original bring-your-own-key design, doesn't replace it.
- `LLM_PROVIDER` / `OPENAI_MODEL`: labels the default; actual provider routing is still
  determined by the model string itself (`gemini-` prefix → Gemini, else OpenAI).
- Full details, setup steps, and what's verified: `docs/PRODUCTION_READINESS.md`.

## Current Progress

**110 of 110 knowledge files populated — 100% COMPLETE ✅**

### All Domains Completed (frozen)
- `security/` — 9/9 files ✅
- `grc/` — 14/14 files ✅  
- `s4hana/` — 4/4 files ✅
- `btp/` — 5/5 files ✅
- `rise/` — 8/8 files ✅
- `project-management/` — 10/10 files ✅
- `project-types/` — 9/9 files ✅
- `interview-scenarios/` — 5/5 files ✅
- `behavioral/` — 4/4 files ✅
- `leadership/` — 4/4 files ✅
- `cloud/` — 4/4 files ✅
- `idm/` — 4/4 files ✅
- `fiori/` — 4/4 files ✅
- `bw/` — 3/3 files ✅
- `troubleshooting/` — 4/4 files ✅
- `audit/` — 3/3 files ✅
- `compliance/` — 3/3 files ✅
- `transports/` — 3/3 files ✅
- `cutover/` — 3/3 files ✅
- `hypercare/` — 3/3 files ✅

**Workstream A Status: COMPLETE ✓**

### Future Roadmap Expansion (Pending Quality Validation)
After Workstreams B, C, D establish production-quality baseline (target ≥8.5/10), consider strategic domain extensions:
- `integration/` (4-5 files) — SAP Integration Suite, APIs, messaging patterns
- `analytics/` (3-4 files) — GRC reporting, analytics, dashboarding
- `enterprise-iam/` (3-4 files, optional) — Okta, Entra ID, federation at scale
- `successfactors/` (3-4 files, optional) — HR platform, compliance controls

Decision on expansion will be informed by quality validation results. See `ARCHITECTURE_REVIEW.md` for prior analysis.

## Frozen Components

Do not redesign these unless a production-blocking defect is found. Bug fixes are
fine; architectural rewrites are not.

- Markdown parsing (`services/knowledgeService.js`)
- Markdown-aware chunking (`services/chunkService.js`)
- Embedding generation (`services/embeddingService.js`)
- Knowledge indexing, incremental rebuild, and hash-based version invalidation
  (`services/knowledgeIndexService.js`, `config/appConfig.js`'s `PARSER_VERSION`/
  `CHUNK_VERSION` hashing)
- Hybrid retrieval and ranking (`services/retrievalService.js`) — now query-aware,
  see Changelog for the fix history
- Knowledge folder semantic structure (20 domains)
- Interview generation prompt shape (`lib/prompt/interviewPrompt.js`) and the
  single-pass, no-regeneration architecture
- Production config surface (env vars listed above)

## Known Limitations

- **SAP+PMP hybrid questions** ("lead a global S/4HANA Security transformation across
  multiple countries") retrieve S/4-only content, never genuine project-management
  evidence, because `analysis.category` is a single mutually-exclusive string that
  can't represent two simultaneously-active dimensions. Deliberately deferred
  (2026-09-05) pending evidence this is common enough in practice to justify a
  multi-dimensional representation change — most cross-product questions that name
  multiple *SAP* products already work correctly (e.g. SuccessFactors→IPS→IAS→BTP), so
  the gap is specifically "SAP product + non-SAP delivery dimension," not multi-product
  questions in general.
- Comparison-style questions naming two topics ("difference between X and Y") don't
  reliably surface both documents in the top-K results — each chunk is scored
  independently against a single query vector, so one topic's chunks can crowd out the
  other's even when both are genuinely relevant. Not fixed further per explicit
  instruction to stabilize and return focus to content; a real limitation of the
  current single-query-vector retrieval shape, not a bug in any one function. Worth
  re-testing now that stage-1 scoring is normalized — this may be partially improved
  as a side effect, not yet verified either way.
- `knowledge/bw/` has one substantive file (`bw-security.md`, added 2026-09-05) but two
  sibling stub files (`analysis-authorizations.md`, `infoproviders.md`) remain 0 bytes
  and unindexed — the "110/110 files" / "bw: 3/3" counts elsewhere in this document
  predate that discovery and should be read as approximate, not as a current literal
  count. Not consolidated or backfilled; out of scope for the session that found it.
- The `experienceConsistency`/`ownership` heuristic in `lib/prompt/evaluation.js` is a
  regex-based approximation (checks whether a mentioned SAP component's name appears
  in the candidate's resume text), not semantic verification — documented as a known
  limitation in `lib/prompt/README.md`.
- No rate limiting or request size limits on `/api/chat` — flagged in
  `docs/PRODUCTION_READINESS.md`, not implemented (deliberate scope decision, not an
  oversight).
- `data/knowledgeIndex.json` is currently an artifact in the working tree, not
  `.gitignore`d. Whether to commit the built index (simpler deploys) or generate it at
  deploy time (smaller repo) is an open decision, not resolved here.

## Current Priorities

**The Workstream A/B/C/D framing below (Aug 2026) has been superseded in practice** —
the actual work since then went through a retrieval/classification stabilization pass
(2026-09-05, see Changelog) rather than the originally-planned quality-benchmarking
track. The Workstream B "7.5→8.5/10" baseline numbers were never revisited after that
pass and should not be treated as current. Kept below for historical continuity, not
as an active tracking framework.

**Actual current priority (2026-09-06 onward): Principal Architect reasoning &
answer-quality layer.** Causal reasoning structure (business objective → architecture →
implementation → runtime → troubleshooting), trade-off articulation, follow-up
anticipation, appropriate technical depth calibration, and stronger reasoning for
complex/scenario/hybrid questions — building on retrieval/classification now being
stable rather than tuning them further.

<details>
<summary>Historical: Workstream A/B/C/D framing (Aug 2026, superseded)</summary>

1. **Workstream A (PRIMARY - COMPLETE):** All 110 knowledge files populated ✓
   - Roadmap: 100% achievement
   - Knowledge index: 21MB, 1,440 candidate chunks indexed
   - Status: Frozen, no further population needed

2. **Workstream B (Quality Engineering - IN PROGRESS):**
   - Baseline quality assessment: 7.5/10 average
   - Target: ≥8.5/10 across all answer types
   - Focus: Architect voice, implementation credibility, business context depth
   - Method: Representative question benchmarking, continuous evaluation

3. **Workstream C (Performance & Reliability - IN PROGRESS):**
   - Monitor: Response latency (target <5s), quality consistency
   - Measure: Deployment stability, retrieval effectiveness
   - Optimize: Incremental improvements within frozen architecture

4. **Workstream D (Architectural Completeness - IN PROGRESS):**
   - Evaluate: Cross-domain reasoning quality
   - Validate: Feature completeness within 20-domain framework
   - Document: Architectural gaps and expansion opportunities

</details>

## Standard Domain Workflow

For every domain, in order, no exceptions:

1. **Populate** — write every empty `.md` file in the domain to the fixed template.
2. **Validate markdown quality** — template completeness, no empty sections, no
   duplicate content between files (use `## Related Topics` instead), technically
   accurate, natural spoken English.
3. **Rebuild the knowledge index** — `node scripts/buildKnowledge.js`. Confirm
   documents indexed, chunks generated, embeddings generated.
4. **Validate retrieval** — run 3-6 domain-representative questions through
   `retrievalService.retrieve()` directly (no API key needed); confirm the correct
   document/heading ranks at or near the top, with a real score breakdown, not just a
   "looks plausible" check.
5. **Validate interview quality** — since this project currently has no funded LLM API
   key, this step is a proxy: inspect what `knowledgeContext` the retrieval system
   would actually inject into the prompt for representative questions (via
   `LLM_VALIDATION_MODE=retrieval-only`'s diagnostic SSE event, or by calling
   `retrievalService.retrieve()` directly) and judge sufficiency. If/when a real key is
   provided, this step should become literal generation + evaluation.
6. **Knowledge improvement loop** — if step 5 shows weak answers, the knowledge
   content is the first thing to fix, not retrieval/indexing/prompts/architecture.
   Only touch infrastructure if the weakness is demonstrably caused by it (as happened
   once, see Changelog).
7. **Freeze the domain** — no further edits unless a factual error, retrieval defect,
   or SAP functionality change is found later.
8. **Progress report** — files completed, chunks generated, retrieval/interview
   validation summary, overall completion percentage.
9. **Continue automatically to the next domain** — no pause for approval between
   domains.

## Next Immediate Tasks

**As of 2026-09-06, starting fresh on:**
1. Evaluate whether generated answers naturally produce causal reasoning chains
   (troubleshooting: symptom→isolation→evidence→root cause→fix→prevention;
   architecture: requirement→constraints→architecture→security→integration→
   operations→trade-offs; migration: current→target→gap→migration→coexistence→
   cutover→validation→contingency; PMP: objective→stakeholders→scope→risk→plan→
   execution→control→change→outcome) or whether they need explicit prompt/structure
   support to get there consistently.
2. Trade-off articulation and follow-up-question readiness as explicit quality
   dimensions, not just factual correctness.
3. Re-verify the "Comparison-style questions" known limitation now that stage-1
   scoring is normalized — may already be partially improved, not yet checked.
4. Continue deferring the SAP+PMP multi-dimensional representation question until
   there's concrete evidence the single-category model is the binding constraint for
   real interview questions, not just the one tested scenario.

<details>
<summary>Historical: Workstream A/B/C/D next-tasks framing (Aug 2026, superseded)</summary>

**Workstream A — COMPLETE ✓**
1. ✅ **COMPLETED:** All 110 knowledge files populated across 20 domains
2. ✅ **COMPLETED:** Knowledge index rebuilt (21MB)
3. ✅ **COMPLETED:** Priority 1 prompt enhancements (architect voice)
4. ✅ **COMPLETED:** System deployed and validated in production

**Workstream B — IN PROGRESS**
1. **Immediate:** Complete Workstream B quality assessment
   - Baseline metrics: 7.5/10 average (target 8.5/10)
   - Identified improvements: Personal story injection, SAP component saturation, follow-up preparation
   - Implement: High-impact prompt enhancements within frozen architecture

2. **Next:** Run systematic benchmarking across all 20 domains
   - Representative questions per domain
   - Quality dimension evaluation (6 criteria)
   - Document findings in `WORKSTREAM_B_QUALITY_REPORT.md`

**Workstreams C & D — Parallel Execution**
1. Monitor: Latency (target <5s), stability, retrieval effectiveness
2. Validate: Cross-domain reasoning, architectural completeness
3. Document: Results and improvement recommendations

**Decision Point (After Workstream B Reaches 8.5+/10):**
- Evaluate strategic domain extensions (integration, analytics, enterprise-iam, successfactors)
- Decide: Continue with current 110 domains or expand roadmap

</details>
