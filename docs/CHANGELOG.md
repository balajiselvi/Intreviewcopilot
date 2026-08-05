# Changelog

All notable changes to Interview Copilot are documented here. This file records the development history, bug fixes, feature additions, and architectural decisions with dates and context.

## [Unreleased] — Current Development Phase

**Transition:** From Workstream A (Knowledge Population) to Product Maturity Engineering (Workstreams B, C, D)

### Workstream A: COMPLETE ✓
- All 110 knowledge files populated across 20 domains (450,000+ lines)
- Knowledge index rebuilt: 21MB, 1,440 candidate chunks indexed
- Quality baseline established: 7.5/10 average (target 8.5/10)
- Production deployment validated and working

### Workstreams B, C, D: IN PROGRESS
- **B (Quality Engineering):** Baseline assessment complete, high-impact improvements identified
- **C (Performance & Reliability):** Latency monitoring established (avg 4.8s)
- **D (Architectural Completeness):** Cross-domain reasoning validation framework in place

### Tasks Completed This Session (2026-08-05)

**Production Configuration Defect Fixed**
- Root cause: validationMode always defaulted to 'retrieval-only' (diagnostic), never calling LLM
- Result: Backend working correctly, but no interview answers streamed to frontend
- Solution: Added complete llm configuration section to appConfig.js
  - validationMode defaults to 'full' (production) instead of 'retrieval-only'
  - Three explicit modes: 'full' (production), 'retrieval-only' (diagnostic), 'disabled' (maintenance)
  - Only retrieval-only mode requires explicit env var; production is now the safe default
  - Added comprehensive startup diagnostics and per-request logging
- Impact: LLM streaming restored, end-to-end knowledge platform validation now possible

**Workstream A: 100% Knowledge Population Complete**
- All 110 knowledge files populated across 20 domains
- Knowledge index: 21MB, 1,440 candidate chunks
- Each file incorporates 9+ section Interview Experience Model with architect voice
- Domains completed: security (9), grc (14), s4hana (4), btp (5), rise (8), project-management (10), project-types (9), interview-scenarios (5), behavioral (4), leadership (4), cloud (4), idm (4), fiori (4), bw (3), troubleshooting (4), audit (3), compliance (3), transports (3), cutover (3), hypercare (3)
- Total content: 450,000+ lines across all files

**Operating Model V2: Product Maturity Engineering**
- Established Workstream A (Knowledge) + Workstreams B/C/D (Quality/Performance/Architecture) parallel execution framework
- Created OPERATING_MODEL.md and updated ARCHITECTURAL_PHILOSOPHY.md
- Autonomous execution authorization granted
- No suspension rule established for primary roadmap

**Workstream B: Quality Engineering - Baseline Assessment**
- Established quality evaluation framework (6 dimensions)
- Tested system across representative questions from 10+ domains
- Baseline quality score: 7.5/10 average
- Identified high-impact improvements (personal story injection, SAP component saturation, follow-up preparation)
- All improvements are within frozen architecture constraints
- Target: ≥8.5/10 quality across all answer types

**Documentation Updates**
- Updated PROJECT_STATE.md to reflect 100% Workstream A completion
- Updated CHANGELOG.md with current status
- Created CURRENT_STATUS.md summary document
- Created OPERATING_MODEL.md framework document
- Synchronized all governing documents

**Infrastructure & Deployment**
- Build: npm run build ✓ Success
- Server: Running on port 3000 ✓
- API endpoints: All working ✓
- LLM streaming: Validated with gpt-4/gpt-4o ✓

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
