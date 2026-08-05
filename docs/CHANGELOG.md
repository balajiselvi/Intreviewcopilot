# Changelog

All notable changes to Interview Copilot are documented here. This file records the development history, bug fixes, feature additions, and architectural decisions with dates and context.

## [Unreleased] — Current Development Phase

### In Progress
- Populating project-management domain knowledge (0 of 11 files)
- Planning: Populate remaining 15 domains (58 files total)

### Tasks Completed This Session (2026-08-05)
- Created QUALITY_GATE.md — permanent quality standards for entire knowledge platform
- Completed RISE domain: populated 4 remaining files (rise-project.md, rise-migration.md, rise-cutover.md, rise-security.md)
- Fixed configuration bugs blocking knowledge index build:
  - chunkService.js: corrected config path and property names (appConfig.knowledge.chunking, maxChunkSizeTokens/minChunkSizeTokens)
  - appConfig.js: added missing sourceDirectory configuration
- RISE domain now complete: 9/9 files (3,196 total lines), ready for index rebuild and retrieval validation

---

## [1.1.0] — Stable Interview Copilot v1 — 2026-08-XX

### Major Features
- **Knowledge Platform Foundation**
  - 110 markdown files across 20 semantic domains
  - Fixed 24-section template for every knowledge file
  - 28 files populated (25% complete)
  - 3 domains frozen and validated: Security (9/9), GRC (15/15), S4HANA (4/4)

- **Retrieval Pipeline (Query-Aware)**
  - Semantic scoring (vector similarity via local embeddings)
  - Lexical scoring (BM25-style term relevance)
  - Component scoring (SAP component name matching)
  - Intent scoring (question intent detection bonus)
  - Section bonuses (prioritize quick-answer sections for quick questions)
  - Full mechanics in docs/RETRIEVAL.md

- **Production-Ready Configuration**
  - `LLM_VALIDATION_MODE=retrieval-only` for zero-cost validation
  - `LLM_VALIDATION_MODE=full` for real LLM generation
  - Bring-your-own-key (BYOK) design: client-supplied API key takes priority
  - Optional server-side env var fallback for shared deployments
  - Provider routing: model name → OpenAI vs Gemini (auto-detect)

- **Single-Pass Generation (Hard Constraint)**
  - No answer regeneration loop
  - No second LLM call for refinement
  - Prompt quality and retrieval quality are the levers for answer quality

### Architecture
- Markdown parsing (`services/knowledgeService.js`)
- Markdown-aware chunking (`services/chunkService.js`) — respects heading structure
- Local embeddings (`services/embeddingService.js`) — @xenova/transformers, no external API
- Incremental index building (`services/knowledgeIndexService.js`) — version-hash-based rebuild
- Hybrid retrieval (`services/retrievalService.js`) — query-aware scoring
- DI wiring (`lib/container.js`)
- Interview generation prompt (`lib/prompt/interviewPrompt.js`)
- Heuristic answer evaluation (`lib/prompt/evaluation.js`) — no second LLM call

### Client Features
- Azure Speech SDK audio capture (system + microphone)
- Real-time answer streaming (SSE)
- AnswerQualityPanel with retrieval visibility
- Settings dialog: provider selection, model selection, API key entry (BYOK)

### Bug Fixes (This Milestone)
- **Query-aware scoring in retrieval** — Removed content-only scoring bonuses that were causing regressions. All scoring now anchored to user question intent, component names, and section type appropriate to question depth. See RETRIEVAL.md for full scoring formula.
- **Component detection accuracy** — Improved SAP component extraction to avoid false positives on common words (e.g., "role" vs "role object in GRC")

### Known Limitations (Documented)
- Comparison questions ("difference between X and Y") don't reliably surface both docs — single query vector limitation
- Answer evaluation is heuristic (regex-based), not semantic
- No rate limiting on `/api/chat` — acceptable for internal tool
- In-memory vector search — will need vector DB for 10k+ chunks

### Frozen Components (No Redesign Without Production-Blocking Defect)
- Markdown parsing
- Markdown-aware chunking
- Embedding generation (local @xenova)
- Knowledge indexing and rebuild
- Hybrid retrieval and ranking (query-aware)
- Knowledge folder structure (20 semantic domains)
- Interview generation prompt
- Single-pass architecture

### Documentation
- docs/RETRIEVAL.md — Full retrieval mechanics, scoring formula, deduplication
- docs/INDEXING.md — Index structure, versioning, rebuild triggers
- docs/INTERVIEW_ENGINE_SPEC.md — Prompt shape, question analysis, evaluation
- docs/PRODUCTION_READINESS.md — Deployment, configuration, security, verified posture
- docs/PROJECT_STATE.md — Current progress tracking, domain completion, next tasks

---

## [1.0.0] — MVP Release (Pre-Current Session)

### Initial Release Features
- Basic RAG pipeline (retrieval + single-pass generation)
- Azure Speech SDK integration
- OpenAI API support
- Next.js full-stack app with React client
- Settings dialog for API key entry (BYOK)
- Streaming response via SSE

### Initial Limitations
- No retrieval query-awareness (content-only scoring)
- Limited knowledge base (structure only, few content files)
- No production configuration (no retrieval-only mode, no env var support)
- No answer evaluation (no quality panel)

---

## Development Notes

### Retrieval Query-Awareness (Key Fix)

**Problem:** Content-only scoring bonuses (e.g., all chunks from a specific domain got a boost regardless of whether they answered the actual question) caused regressions. Example: A question about S/4HANA security was retrieving general GRC chunks because they came from a high-value domain, not because they answered the question.

**Solution:** All scoring now anchored to:
- User question embedding and intent
- Named SAP components in the question
- Section type appropriate to question depth (prioritize "30 Second Answer" for quick questions)
- No domain-wide bonuses, only query-specific bonuses

**Result:** Improved retrieval precision across all domains, especially for cross-domain questions.

### Knowledge Base Restructuring

**Rationale:** The project philosophy is that runtime retrieval is grounded in structured markdown only. Raw PDFs, DOCX, TXT are used only during authoring, never at runtime.

**Action:** Removed uploaded reference documents from `knowledge/` directory. These files remain available in a separate archive for knowledge authoring reference, but the runtime system only queries `.md` files.

**Impact:** Cleaner knowledge base, clearer separation of concerns (authoring inputs vs runtime retrieval source).

---

## Deployment Checklist

Before public/production deployment:

- [ ] Add rate limiting to `/api/chat` (flagged in PRODUCTION_READINESS.md)
- [ ] Decide on knowledge index storage (commit to repo vs generate at build time)
- [ ] Configure environment variables per deployment target
- [ ] Test with real LLM API keys (validation mode supports zero-cost retrieval-only testing first)
- [ ] Set up monitoring for API latency, error rates, knowledge retrieval quality
- [ ] Document knowledge update process (how to add new files, rebuild index, deploy)

---

## Future Roadmap

See [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md) for:
- Multi-query expansion for comparison questions
- Vector database scaling
- Real-time knowledge updates
- Team collaboration features
- Analytics and quality monitoring

---

**Last updated:** 2026-08-05
**Next checkpoint:** After BTP domain completion and before RISE domain start.
