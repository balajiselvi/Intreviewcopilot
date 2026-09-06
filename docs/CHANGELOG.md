# Changelog

All notable changes to Interview Copilot are documented here. This file records the development history, bug fixes, feature additions, and architectural decisions with dates and context.

## 2026-09-06 — Principal Architect reasoning & answer-quality layer (feature/interview-engine-v2)

Two-part session: (1) audit-then-implement the reasoning/generation layer named as the next
phase in the 2026-09-05 entry below, (2) a controlled experiment and evaluation to determine
whether the resulting change actually improves answer quality, not just prompt correctness.

**Audit findings (no code changed in this pass):** traced question → classification →
retrieval → prompt → generation precisely. `lib/reasoningPlanner.js`'s entire output
(`buildReasoningPlan`) was confirmed 100% dead — computed every request, never destructured by
`buildSapInterviewPrompt`. `lib/technicalReasoner.js` was ~90% dead (only `.businessObjective`
and `.recommendedComponents` reached the prompt). `lib/interviewerProfiler.js`'s 6 persona
regexes had no word boundaries, causing live-confirmed substring misfires (`provisioning` →
executive via `vision`; `team`/`farm`/`harm` → securityLead via `arm`/`eam`). `lib/
componentSelector.js` and `technicalReasoner.js` both defaulted to fabricated `PFCG`/`SU24`
components for any question where nothing else matched, including pure Behavioral/PMP
questions with zero SAP content.

Commits (chronological), each live-verified via `DEBUG_DUMP_PROMPT` against the running app and
regression-tested against the existing classifier suites:

1. **`isSimpleFactualQuestion` depth override** (`58e1274`) — a category-independent detector
   (same cross-cutting-override shape as the existing `isCompoundQuestion`) that forces the
   `simple` length tier and neutral interviewer framing for a bare factual question regardless
   of which category won classification. "What is IAS?" dropped from 108 words with
   architecture-flavored drift to ~65-75 words of direct definition, with zero regression on
   complex questions on the same products.
2. **Persona regex word-boundary fix** (`58e1274` follow-up / `b834a6e`) — wrapped all 6
   `interviewerProfiler.js` patterns in `\b...\b`. 15/15 negative+positive cases pass; no new
   keywords added.
3. **`componentSelector.js` step-4 fallback fix** (`b834a6e`) — first attempt used a category
   blacklist (Behavioral/PMP/Leadership); later superseded (see commit 5 below).
4. **`reasoningPlanner.js` repurposed into a minimal reasoning contract** (`f20368f`) — replaced
   the fully-dead `REASONING_PATTERNS`/`COMPONENT_TRIGGERS` content with
   `buildReasoningContract(question, analysis)`, returning exactly `{ answerIntent,
   reasoningMode, requiredElements }`. `requiredElements` are looked up by `reasoningMode` only
   (never by question text or product name) and phrased as concrete, checkable instructions
   ("state the primary decision in one sentence") rather than abstract discourse instructions
   ("be strategic") — validated by a same-day controlled experiment (below) that found the
   model reliably follows the former and not the latter, regardless of prompt position. Wired
   through the exact existing (previously-dead) plumbing: `chat.js`'s `reasoningPlan` variable
   renamed end-to-end to `reasoningContract`, surfaced in one new compact `REQUIRED ANSWER
   ELEMENTS` prompt section. Same commit closed `technicalReasoner.js`'s own independent
   PFCG/SU24 fallback (it re-injected the same fabricated components even after
   `componentSelector.js` was fixed).
5. **Evidence-based component fallback redesign** (`ad68db9`) — a paraphrased PM question
   classified as `General` (not `PMP`) exposed the gap in commit 3's category-blacklist
   approach. Replaced the blacklist entirely, in both `componentSelector.js` and
   `technicalReasoner.js`, with a positive check: only fall back to SAP-technical default
   components when `analysis.domain` is itself a genuine matched SAP-technical domain (a real
   `DOMAIN_PATTERNS` hit). Category is no longer inspected in this fallback at all, so it
   generalizes to any category, including `General`, without a growing exception list.

**Controlled experiment (real generation path, not a toy prompt):** compared the current full
prompt against two variants — the relevant `CATEGORY_TEMPLATES` `PRIORITY` clause isolated as
its own top-level section, and the global `ROLE & RULES` anchor/decision-structure mandate
isolated the same way. Concrete, single-fact asks ("name one edge case", "state a trade-off")
were followed reliably once elevated to their own section, regardless of category. Abstract
discourse-structure asks ("open with a confident anchor sentence", "name decisions before
expanding") were not followed in any condition, including maximum elevation — this is why the
reasoning contract's `requiredElements` are written exclusively in the former style.

**Evaluation (A/B: reasoning contract on vs. the same prompt with that section removed,
otherwise identical) across 7 unseen questions, one per mode:** materially improved 3 of 7 —
Troubleshooting (commits to an explicit root cause and remediation instead of listing checks and
deferring to escalation), Architecture, and the SAP+PMP hybrid "lead" mode (both produce an
explicit trade-off/rejected-alternative that the no-contract condition never states, despite
covering similar ground otherwise). Negligible-to-zero difference in 2 of 7 — Behavioral (`
CATEGORY_TEMPLATES.Behavioral`'s own STAR structure already demands the same content
independently of the contract) and a PMP question that classification (unchanged) routed to
`General`, which meant the contract even injected the *wrong* (architecture-flavored)
`requiredElements` — yet both A and B produced near-identical, already-solid answers, showing
the contract's contribution is gated by correct mode assignment and is null (not harmful) when
that assignment is wrong or already redundant with the category template. Factual showed a
small, consistent, real improvement (explicit worked example present in the on-condition,
absent in the off-condition). Implementation was a wash.

**Known residuals, explicitly not fixed this session (see report exchanges in session history
for full reasoning):** a Behavioral question phrased with "resolved" still triggers
`componentSelector.js` step 2 (intent-based, not the fallback path fixed above) via
`interviewAnalyzer.js`'s own unrelated "resolv" substring match — classification is frozen, out
of scope. PMP's "decide" mode tension-naming element was the single most-tested, least-reliably-
satisfied required element across every run this session, independent of prompt wording.
Behavioral tense discipline (conditional vs. fabricated past-tense framing) showed run-to-run
variance under the model's own sampling on repeated identical prompts.

**Now frozen** (do not reopen without concrete regression evidence): retrieval, scoring,
classification, domain routing, SAC/PMP/BW routing, component selection/fallback,
`interviewerProfiler.js` regex behavior, `isSimpleFactualQuestion`, anti-fabrication rules, the
current reasoning contract, and single-pass generation.

**Next phase:** evaluation-only, not yet implementation — determine whether the reasoning
contract's demonstrated per-mode pattern (strong where it adds content the category template
doesn't already demand; null where it duplicates or is misrouted) is sufficient to build on, or
whether mode-assignment robustness needs to be solved first.

## 2026-09-05 — Retrieval/classification stabilization (feature/interview-engine-v2)

The single biggest finding of this session: **96.7% of the knowledge corpus was
structurally unreachable by retrieval**, for every query, regardless of topic — a
candidate-truncation-before-scoring bug in `retrievalService.js` (`candidateLimit`
sliced the eligible-candidate array in raw file order *before* any relevance scoring
ran, so only `knowledge/audit/`'s first ~50 chunks could ever reach the scorer). This
was not visible from generation quality alone — hand-authored `CATEGORY_TEMPLATES`
content was silently carrying nearly all real answer grounding. Fixed and proven with
before/after ranking data (see commits below); do not reintroduce this pattern.

Commits (chronological), each independently regression-tested and live-verified against
the running app, not just unit-level:

1. **Dead category templates reactivated** — `Behavioral`, `Leadership`, `Hypercare`,
   `Transports`, `Audit`, `Cutover`, `RISE`, `HANA`, `Datasphere` all existed in
   `CATEGORY_TEMPLATES` with no matching `CATEGORY_RULES` entry ever producing that
   exact string — silently falling through to the generic template. Behavioral was the
   highest-stakes instance: its anti-fabrication guard never activated for a single
   real behavioral question.
2. **Category precedence fixes** — BTP-vs-IAS and IAG-vs-RISE ties were previously
   resolved only by accidental `CATEGORY_RULES` array order. Made explicit
   (`applyCategoryPrecedence`).
3. **Markdown/token-budget fixes** — asterisk bleed-through in streamed answers
   (prompt-only "no markdown" instruction proven unreliable; fixed with a deterministic
   per-token strip, not a second LLM pass), and a token-ceiling too small for the
   enriched Authorization/Troubleshooting templates.
4. **Candidate-recall bug (the big one)** — see above. Fixed by scoring the full
   eligible candidate set before applying `candidateLimit`, not after.
5. **Stage-1 scoring scale-imbalance bug** — `semanticScore` (bounded 0-1) was combined
   with `lexicalScore`/`componentScore`/`intentScore` (unbounded raw counts) under
   nominal weights that didn't represent those proportions. Normalized each signal to
   its own validated ceiling (query-relative for lexical/intent, domain-relative for
   component). Causally proven: `hana-authorization.md` moved from rank #38 of 1775 to
   rank #1 using the same real production sub-scores, no domain-classification change.
6. **Contract-mismatch audit** — `COMPONENT_KEYWORDS` (retrievalService.js) was missing
   two domain keys that `analyzeInterviewQuestion()` actually emits ("SAP Cloud
   Identity / BTP", "SAP Platform"), silently zeroing component credit for BTP/IAS/
   IPS/IAG/SAC and S/4/ECC/HANA/BW questions respectively. Fixed.
7. **SAC and PMP made first-class** (classifier category, domain pattern, component
   keywords, stage-2 domain-boost, `CATEGORY_TEMPLATES` entry) — both previously had
   zero representation anywhere in the pipeline. SAC was also misrouting into the
   `Datasphere` category via an overly broad keyword. PMP context-classification uses
   co-occurrence pairs (anchor + context word, e.g. `stakeholder` + `blocking`), not
   bare single words — bare `risk` was tested and rejected as too collision-prone with
   SAP GRC's own risk-analysis vocabulary.
8. **Experience-fabrication fix** — a global tense-discipline rule added to `ROLE &
   RULES` (previously this discipline only existed inside the Behavioral-question
   special case). A live test caught a plain S/4 architecture question with no
   candidate background inventing "during a previous project involving multiple
   countries..."; re-tested clean after the fix.
9. **BW knowledge authored** — `knowledge/bw/bw-security.md` replaces a confirmed
   0-byte stub (two sibling stub files, `analysis-authorizations.md`/
   `infoproviders.md`, remain empty and unindexed — not yet consolidated into the new
   file). Covers the execution-authorization-vs-analysis-authorization distinction,
   RSECADMIN, S_RS_AUTH, S_RS_COMP/S_RS_COMP1, 0TCAIPROV/0TCAVALID/0TCAACTVT, and the
   "login works but query returns no data" scenario.

**Known limitation carried forward, not fixed this session:** SAP+PMP hybrid questions
("lead a global S/4HANA Security transformation") still retrieve S/4-only content —
`analysis.category` is a single mutually-exclusive string, so a question spanning two
genuinely separate dimensions can't be represented simultaneously. Deferred pending
evidence that the common cases (single-product cross-references, e.g. SuccessFactors→
IPS→IAS→BTP, already work fine) don't already cover most real interview questions.

**Next phase (starting fresh):** Principal Architect reasoning and answer-quality layer
— causal reasoning structure, trade-off articulation, follow-up anticipation — now that
retrieval and classification are stable. Not a retrieval/classification task.

## [Unreleased] — Prior Development Phase (superseded by the above; kept for history)

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
