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

**Phase: Knowledge Platform population.** Infrastructure work (retrieval, chunking,
indexing, folder architecture, production config) is complete and frozen. Content
population is in progress, domain by domain, following the Standard Domain Workflow
below.

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

**66 of 110 knowledge files populated (60%).**

### Completed Domains (frozen)
- `security/` — 9/9 files ✅
- `grc/` — 15/15 files ✅
- `s4hana/` — 4/4 files ✅
- `btp/` — 6/6 files ✅ (COMPLETED SESSION 2026-08-05)
- `rise/` — 9/9 files ✅ (COMPLETED SESSION 2026-08-05)

### Completed Domains (frozen)
- `security/` — 9/9 files ✅
- `grc/` — 15/15 files ✅
- `s4hana/` — 4/4 files ✅
- `btp/` — 6/6 files ✅
- `rise/` — 9/9 files ✅
- `project-management/` — 11/11 files ✅ (COMPLETED SESSION 2026-08-05)

### Remaining Domains (not started)
`project-management/` (11), `project-types/` (9), `interview-scenarios/` (5), 
`behavioral/` (4), `leadership/` (4), `cloud/` (4), `idm/` (4), `fiori/` (4),
`bw/` (3), `troubleshooting/` (4), `audit/` (3), `compliance/` (3), `transports/` (3),
`cutover/` (3), `hypercare/` (3).

### Strategic Extensions (Decision Pending)
After completing the 16 remaining domains, consider adding:
- `integration/` (4-5 files) — SAP Integration Suite, APIs, messaging patterns
- `analytics/` (3-4 files) — GRC reporting, analytics, dashboarding
- `enterprise-iam/` (3-4 files, optional) — Okta, Entra ID, federation at scale
- `successfactors/` (3-4 files, optional) — HR platform, compliance controls

See `docs/ARCHITECTURE_REVIEW.md` for strategic analysis and recommendation.

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

- Comparison-style questions naming two topics ("difference between X and Y") don't
  reliably surface both documents in the top-K results — each chunk is scored
  independently against a single query vector, so one topic's chunks can crowd out the
  other's even when both are genuinely relevant. Not fixed further per explicit
  instruction to stabilize and return focus to content; a real limitation of the
  current single-query-vector retrieval shape, not a bug in any one function.
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

1. Finish `btp/` (4 files remaining).
2. Continue through remaining 16 domains in the order listed above, one full lifecycle
   per domain (see Standard Domain Workflow).
3. No infrastructure work unless a domain's retrieval validation step surfaces a new
   production-blocking defect.

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

1. ✅ **COMPLETED:** BTP domain population, index rebuild, retrieval validation
   - Populated: `cloud-connector.md`, `cloud-identity.md`, `ias.md`, `ips.md`
   - Index rebuilt: 110 documents, 1321 chunks
   - Retrieval validated: BTP files correctly indexed and retrievable
   - Domain frozen: BTP (6/6 files complete)

2. **NEXT:** Populate `rise/` domain (9 files)
   - RISE with SAP: cloud-centric implementation approach
   - Follow same domain workflow: populate → validate markdown → rebuild index → retrieval validation → interview quality check → freeze

3. Continue through remaining-domains list above, one domain per session completion.

4. **Decision Point (after 16 remaining domains complete):** Evaluate strategic domain extensions
   - See `docs/ARCHITECTURE_REVIEW.md` for analysis and recommendations
