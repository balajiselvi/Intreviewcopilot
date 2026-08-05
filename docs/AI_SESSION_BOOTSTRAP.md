# AI Session Bootstrap

**READ THIS FIRST** when resuming development on Interview Copilot after a context limit, model change, or new session.

This document is the permanent entry point for every future AI session. It replaces dependency on previous chat history.

## Project Purpose

Interview Copilot is a production-quality live interview-assistance tool for SAP professionals (Security, GRC, IDM, BTP, S/4HANA, etc.). It listens to both interviewer and candidate audio via Azure Speech SDK, transcribes both, and generates natural spoken-style interview answers using a Retrieval-Augmented Generation (RAG) pipeline grounded in a **structured markdown knowledge base** — not raw PDFs, not model general knowledge alone.

The structured markdown repository under `knowledge/` is the product. Infrastructure (retrieval, chunking, indexing, prompting) is stable and frozen. Knowledge content quality is the current development priority.

## Repository is the Authoritative Source

The repository documentation is the ONLY source of truth. Previous chat history must never be assumed or referenced.

If you are reading this, the repository state at your current commit is the ground truth. All design decisions, architectural choices, and project status are documented here.

## Mandatory Reading Order

**ALWAYS read these documents in this exact order before making ANY code changes:**

1. **[docs/PROJECT_STATE.md](PROJECT_STATE.md)** — Current development phase, progress tracking (28/110 files, 25%), completed domains, in-progress domains, frozen components, known limitations, immediate next tasks.

2. **[docs/ARCHITECTURE.md](ARCHITECTURE.md)** — System architecture, component responsibilities, data flow, design decisions and trade-offs.

3. **[docs/CHANGELOG.md](CHANGELOG.md)** — Release history, milestones, bugs fixed, architectural decisions with context and dates.

4. **[docs/DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md)** — Long-term product direction, future phases beyond knowledge population, strategic priorities.

5. **[docs/RESUME_GUIDE.md](RESUME_GUIDE.md)** — How to resume from the exact stopping point, standard domain workflow checklist, validation procedures.

6. **[docs/PRODUCTION_READINESS.md](PRODUCTION_READINESS.md)** — Deployment checklist, environment variables, API key configuration, retrieval-only vs full LLM mode, verified security posture.

## Current Development Phase

**Knowledge Platform Population** (infrastructure frozen, content in progress).

- **Total knowledge files:** 110 (110 files exist, waiting for content)
- **Populated:** 28 files (25%)
  - Security: 9/9 (frozen)
  - GRC: 15/15 (frozen)
  - S4HANA: 4/4 (frozen)
  - BTP: 2/6 (in progress — 4 files remaining)
- **Remaining:** 82 files across 16 domains

Next immediate task: Populate remaining 4 BTP files, then move to RISE domain (9 files), then continue through remaining 14 domains.

## Core Engineering Principles

- **Stable Architecture:** Do not redesign frozen components (retrieval, chunking, indexing, prompting) unless a production-blocking defect is discovered. Bug fixes only.
- **Single-Pass Generation:** Hard architectural constraint. No second LLM call, no answer regeneration/rewriting. This was a deliberate decision to minimize latency in a live interview tool.
- **Knowledge-First:** If retrieval quality is poor, the first fix is knowledge content, not infrastructure.
- **Repository Synchronization:** Every major milestone must update the documentation immediately. The repository must stay self-documenting.
- **No Assumptions:** Don't assume chat history or previous sessions. Read the docs.

## Standard Domain Workflow (Follow Exactly)

For every domain, execute in this sequence:

1. **Populate** — Write every empty `.md` file in the domain to the fixed template (24 sections). No placeholder sections.
2. **Validate markdown** — Check template completeness, natural spoken English, no duplication between files (use `## Related Topics` instead), technical accuracy.
3. **Rebuild knowledge index** — Run `node scripts/buildKnowledge.js`. Verify documents indexed, chunks generated, embeddings created.
4. **Validate retrieval** — Run 3-6 representative domain questions through `services/retrievalService.js` directly (no API key needed). Verify correct docs/headings rank near the top with actual score breakdowns.
5. **Validate interview quality** — With `LLM_VALIDATION_MODE=retrieval-only` (default), check diagnostic SSE events to see what `knowledgeContext` the retrieval system would inject for representative questions. Judge sufficiency. (When an LLM API key is available, this becomes actual generation + evaluation.)
6. **Knowledge improvement loop** — If retrieval quality is weak, fix the knowledge content first. Only touch infrastructure if weakness is demonstrably caused by it.
7. **Freeze domain** — No further edits unless a factual error, retrieval defect, or SAP change is found.
8. **Progress report** — Document files completed, chunks generated, retrieval validation results, completion percentage.
9. **Continue automatically** — Move to next domain. No pause between domains.

## What Not to Change

These components are frozen. Do not redesign them:

- Retrieval pipeline, chunking algorithm, embedding generation
- Knowledge indexing and incremental rebuild
- Hybrid retrieval scoring (semantic + lexical + component + intent)
- Knowledge folder structure (20 semantic domains)
- Interview generation prompt shape and single-pass architecture
- Production configuration surface

Bug fixes are acceptable. Architectural rewrites are not.

## How to Resume Development

1. Read this document completely (you're doing this now).
2. Read PROJECT_STATE.md to understand current progress.
3. Identify the exact point development stopped (last completed domain, next domain to start).
4. Follow the Standard Domain Workflow for the next domain(s).
5. Update documentation after each domain completes.
6. Commit changes regularly, referencing the domain name and phase in commit messages.

## Development Workflow

```bash
# Populate markdown files (no build step needed yet)
# Edit knowledge/<domain>/*.md

# Rebuild the knowledge index
node scripts/buildKnowledge.js

# Validate retrieval (no API key needed)
# Run diagnostic tests, inspect retrievalService output directly

# Commit the domain
git add knowledge/<domain>/ docs/
git commit -m "Populate <domain> knowledge files and validate retrieval"

# Update PROJECT_STATE.md with completion status
# (Automatically move to next domain)
```

## Key Files to Know

- `services/knowledgeService.js` — Scans and parses `knowledge/` directory
- `services/chunkService.js` — Markdown-aware chunking
- `services/embeddingService.js` — Local embedding generation
- `services/knowledgeIndexService.js` — Incremental index building
- `services/retrievalService.js` — Hybrid retrieval and ranking
- `lib/prompt/interviewPrompt.js` — Single-pass generation prompt
- `pages/api/chat.js` — Main API endpoint (uses all above)
- `docs/RETRIEVAL.md`, `docs/INDEXING.md` — Pre-existing subsystem docs (accurate for current pipeline shape)

## Known Limitations

- Comparison questions ("difference between X and Y") don't reliably retrieve both docs simultaneously — each chunk scores independently against a single query vector.
- `experienceConsistency` heuristic in `lib/prompt/evaluation.js` is regex-based, not semantic.
- No rate limiting on `/api/chat` (flagged for future deployment).

## When You're Done

Before committing:

1. Update `docs/PROJECT_STATE.md` with new completion percentage and next domain.
2. Update `docs/CHANGELOG.md` with this session's work.
3. Update `docs/RESUME_GUIDE.md` if the workflow changed.
4. Run `git status` to confirm only intended changes are staged.

After committing:

The repository is now self-documenting again. The next AI session can resume exactly from where this one stopped.

---

**Last updated:** See `CHANGELOG.md` for most recent entry.

For detailed architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).
For deployment, see [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md).
