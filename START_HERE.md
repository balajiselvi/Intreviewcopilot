# Interview Copilot — Start Here

Welcome to Interview Copilot. This is the permanent entry point for every developer, whether you're starting a new session, resuming after a context limit, switching machines, or handing off to a teammate.

**This repository is self-documenting.** You do not need previous chat history to resume development. Everything you need is in this directory.

## Quick Start (5 minutes)

You are here for one of three reasons:

### 1. Starting a New Development Session

**Read these documents in this order, then start coding:**

1. [docs/AI_SESSION_BOOTSTRAP.md](docs/AI_SESSION_BOOTSTRAP.md) — 3 min read
   - What Interview Copilot is
   - Mandatory reading order
   - Current development phase
   - Engineering principles

2. [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md) — 3 min read
   - What's been completed: ALL 110 knowledge files across 20 domains ✓
   - Current phase: Workstream A (Knowledge) complete → Workstreams B/C/D (Quality/Performance/Architecture) active
   - Frozen architectural components (don't redesign these)
   - Next immediate tasks: Execute Workstream B quality improvements

3. [OPERATING_MODEL.md](OPERATING_MODEL.md) — 2 min read
   - Product Maturity Engineering framework
   - Workstream orchestration (B, C, D parallel execution)
   - Autonomous execution authorization
   - Universal engineering decision filter

4. **Then proceed to Step 3 below** (Development Tasks)

---

### 2. Resuming After Context Limit or Model Change

**Do this:**

1. Read [docs/AI_SESSION_BOOTSTRAP.md](docs/AI_SESSION_BOOTSTRAP.md) completely (you're the new model; context was dropped)
2. Read [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md) (refreshes you on current progress)
3. Check git log for the most recent commit:
   ```bash
   git log --oneline -5
   ```
   The most recent commit's message tells you the exact stopping point.

4. Proceed to Step 3 below (Development Tasks)

---

### 3. Development Tasks

**⚠️ Workstream A Complete** — All 110 knowledge files populated ✓

**You are now operating under Operating Model V2 (Product Maturity Engineering).**

**Current Workstreams:**

- **Workstream A (Knowledge Platform):** COMPLETE ✓
  - All 110 files across 20 domains populated
  - Status: Frozen, no further population
  - See [CURRENT_STATUS.md](CURRENT_STATUS.md) for completion details

- **Workstream B (Quality Engineering):** IN PROGRESS
  - Objective: Improve answer quality from 7.5/10 baseline to ≥8.5/10
  - Method: Representative question benchmarking, 6-dimension evaluation
  - High-impact improvements identified (within frozen architecture)
  - See [OPERATING_MODEL.md](OPERATING_MODEL.md) for framework

- **Workstream C (Performance & Reliability):** IN PROGRESS
  - Monitor latency, response quality, system stability
  - Target: <5s avg latency (current: 4.8s)

- **Workstream D (Architectural Completeness):** IN PROGRESS  
  - Evaluate cross-domain reasoning, feature completeness
  - Identify expansion opportunities (within 20-domain framework)

**Your task:** Continue according to [OPERATING_MODEL.md](OPERATING_MODEL.md)
- Execute Workstream B improvements
- Run parallel Workstreams C/D continuous monitoring
- Do NOT suspend Workstream A unless production-blocking defect exists
- Act as Principal Software Architect (you have autonomous execution authority)

---

## Documentation Map

**Governing Documents (Read First):**

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [OPERATING_MODEL.md](OPERATING_MODEL.md) | Product Maturity Engineering framework, Workstreams B/C/D | 10 min |
| [ARCHITECTURAL_PHILOSOPHY.md](ARCHITECTURAL_PHILOSOPHY.md) | Core mission: candidate credibility over documentation | 5 min |
| [CURRENT_STATUS.md](CURRENT_STATUS.md) | Workstream A completion summary, current metrics | 5 min |
| [docs/AI_SESSION_BOOTSTRAP.md](docs/AI_SESSION_BOOTSTRAP.md) | Entry point for every session | 5 min |
| [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md) | Current progress, frozen components, next tasks | 5 min |

**Reference Documents:**

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, component design, data flow | 15 min |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Release history, bugs fixed, decisions made | 10 min |
| [docs/DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md) | Future phases (vector DB, analytics, enterprise features) | 10 min |
| [docs/PRODUCTION_READINESS.md](docs/PRODUCTION_READINESS.md) | Deployment, configuration, security | 5 min |
| [docs/RETRIEVAL.md](docs/RETRIEVAL.md) | Detailed retrieval pipeline mechanics | 10 min |
| [docs/INDEXING.md](docs/INDEXING.md) | Knowledge indexing and rebuild process | 5 min |
| [docs/INTERVIEW_ENGINE_SPEC.md](docs/INTERVIEW_ENGINE_SPEC.md) | Prompt construction and generation | 10 min |
| [docs/QUALITY_GATE.md](docs/QUALITY_GATE.md) | Knowledge quality standards and acceptance criteria | 10 min |
| [docs/ANSWER_QUALITY_BENCHMARK.md](docs/ANSWER_QUALITY_BENCHMARK.md) | Quality evaluation framework and benchmarks | 10 min |

**Suggested reading order for new developers:**
1. AI_SESSION_BOOTSTRAP.md (this session's context)
2. PROJECT_STATE.md (current progress)
3. ARCHITECTURE.md (how the system works)
4. RESUME_GUIDE.md (how to do the work)

**Technical deep-dives (as needed):**
- RETRIEVAL.md — detailed retrieval scoring formula
- INDEXING.md — index structure and versioning
- INTERVIEW_ENGINE_SPEC.md — prompt design and evaluation
- PRODUCTION_READINESS.md — deployment and configuration

---

## Project at a Glance

**What is Interview Copilot?**

A live interview-assistance tool for SAP professionals. It listens to both interviewer and candidate audio, transcribes both, and generates natural spoken-style interview answers using RAG grounded in a structured markdown knowledge base — not raw PDFs, not model general knowledge.

**Current Status:**

- **Phase:** Knowledge Platform Population
- **Progress:** 28/110 files populated (25%)
- **Completed domains:** Security (9/9), GRC (15/15), S4HANA (4/4) ✅
- **In progress:** BTP (2/6 complete, 4 remaining)
- **Infrastructure:** Stable and frozen (no redesigns without production-blocking defects)

**Architecture:**

```
User Question
  ↓
Question Analysis (understand intent, components, depth)
  ↓
Retrieval (semantic + lexical + component + intent scoring)
  ↓
Prompt Construction (inject knowledge context)
  ↓
Single-Pass LLM Generation (no regeneration loop)
  ↓
Post-Answer Heuristic Evaluation (no second LLM call)
  ↓
Streamed Answer + Quality Panel
```

**Key Constraints:**

- Single-pass generation (hard constraint for latency)
- Knowledge-only RAG (no emergent model knowledge)
- Query-aware retrieval (scoring tied to actual question, not content alone)
- Markdown-only runtime source (PDFs/DOCX are authoring inputs only)

---

## The Next Steps

**Right now:**

1. ✅ You've read START_HERE.md (you're here)
2. Go read [docs/AI_SESSION_BOOTSTRAP.md](docs/AI_SESSION_BOOTSTRAP.md) (5 min)
3. Go read [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md) (5 min)
4. Go read [docs/RESUME_GUIDE.md](docs/RESUME_GUIDE.md) (20 min) — step-by-step workflow
5. **Start developing:** Populate the remaining 4 BTP files

**By the end of this session:**

- [ ] All 4 BTP files populated
- [ ] Knowledge index rebuilt
- [ ] Retrieval validated for domain
- [ ] Interview quality validated
- [ ] Domain frozen and reported
- [ ] Move to RISE domain (9 files)

**By end of 2026-Q4:**

- [ ] All 110 knowledge files populated and validated (100%)
- [ ] All 17 domains completed and frozen

---

## Project Philosophy

### Three Anchoring Principles

1. **Repository is the Source of Truth**
   - All design decisions are documented here
   - No important context lives only in chat history
   - Future developers can understand the project from the repo alone

2. **Knowledge is the Lever**
   - If an interview answer is weak, the knowledge content is the first thing to fix
   - Infrastructure changes only when knowledge is complete but retrieval is failing
   - Prioritize content authoring over code optimization

3. **Preserve Stability**
   - Infrastructure (retrieval, chunking, indexing, prompting) is frozen
   - No architectural rewrites without production-blocking defects
   - Bug fixes only; code stability comes before feature expansion

### Development Workflow

Every domain follows the same workflow, no shortcuts:

```
Populate → Validate Markdown → Rebuild Index → Validate Retrieval → 
Validate Interview Quality → Improve Knowledge (if weak) → Freeze → Report → 
Continue to Next Domain
```

See [docs/RESUME_GUIDE.md](docs/RESUME_GUIDE.md) for detailed step-by-step instructions.

---

## Common Questions

**Q: I got a context limit and need to resume. What do I do?**
A: Read AI_SESSION_BOOTSTRAP.md and PROJECT_STATE.md. They will tell you exactly where development stopped. No need to search chat history.

**Q: The infrastructure needs to be redesigned. Should I do it?**
A: Probably not. Read ARCHITECTURE.md and PROJECT_STATE.md → "Frozen Components" section. Unless you've found a production-blocking defect, the infrastructure is stable. Focus on knowledge content instead.

**Q: I found a bug in the retrieval pipeline. What should I do?**
A: Document it, fix it, add a comment explaining what broke and why. Then update CHANGELOG.md and PRODUCTION_READINESS.md.

**Q: How do I test my changes?**
A: See RESUME_GUIDE.md → "Step 4: Validate Retrieval" and "Step 5: Validate Interview Quality". Both work without an API key in retrieval-only mode.

**Q: How do I know if a domain is done?**
A: When:
   - All files populated (24 sections each, no empties)
   - Markdown validated (grammar, accuracy, completeness)
   - Index rebuilt successfully
   - Retrieval tests pass (correct docs in top-3 for representative questions)
   - Interview quality is strong (would support good candidate answers)
   - Domain is marked frozen in PROJECT_STATE.md

**Q: What if I disagree with a design decision?**
A: Read ARCHITECTURE.md and CHANGELOG.md to understand the rationale. If it's still a valid concern, document the issue in a new GitHub issue or update CHANGELOG.md with "Future Improvements" section. Don't redesign without discussion.

---

## Support

**If you get stuck:**

1. Check [docs/RESUME_GUIDE.md](docs/RESUME_GUIDE.md) → "Quick Diagnostics" section
2. Search CHANGELOG.md for similar issues (they're usually documented with fixes)
3. Read the relevant technical doc (RETRIEVAL.md, INDEXING.md, INTERVIEW_ENGINE_SPEC.md)
4. Check the code comments in the relevant service file
5. If still stuck, document the issue and move on (don't get blocked on non-blocking problems)

---

## Commit Message Format

When committing your work, use this format:

```
Populate <Domain> knowledge files and validate retrieval

- Populated N files in knowledge/<domain>/
- Validated markdown quality (grammar, accuracy, completeness)
- Rebuilt knowledge index (X documents, Y chunks)
- Validated retrieval: N/N test questions retrieved correct docs
- Interview quality: strong/adequate/weak [note if weak]
- Domain ready for freeze

Signed-off-by: Your Name <your.email@example.com>
```

Example:
```
Populate BTP knowledge domain and validate retrieval

- Populated 6 files: cloud-connector.md, cloud-identity.md, ias.md, ips.md, btp-overview.md, btp-security.md
- Validated markdown quality: all sections complete, no duplication
- Rebuilt knowledge index: 6 documents, 187 chunks
- Validated retrieval: 5/5 test questions retrieved correct docs (scores 0.72-0.91)
- Interview quality: strong (context would support expert-level answers)
- BTP domain ready for freeze

Signed-off-by: Claude Haiku <noreply@anthropic.com>
```

---

## Next: What to Read First

You're ready. Go read these documents in order:

1. **[docs/AI_SESSION_BOOTSTRAP.md](docs/AI_SESSION_BOOTSTRAP.md)** — 5 min
   Gets you oriented for this specific session.

2. **[docs/PROJECT_STATE.md](docs/PROJECT_STATE.md)** — 5 min
   Shows exactly what's been done and what's next.

3. **[docs/RESUME_GUIDE.md](docs/RESUME_GUIDE.md)** — 20 min
   Step-by-step workflow for your first domain population.

Then start working. No other prep needed.

---

**Repository Last Updated:** 2026-08-05
**Documentation Last Updated:** 2026-08-05
**Current Development Phase:** Knowledge Platform Population (28/110 files, 25%)
