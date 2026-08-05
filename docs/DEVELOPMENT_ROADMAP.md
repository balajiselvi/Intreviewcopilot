# Development Roadmap

This document outlines the long-term product direction and future development phases beyond the current knowledge-population phase.

## Current Phase: Knowledge Platform Population

**Duration:** Ongoing (started 2026-08-XX, estimated completion 2026-Q4)

**Objective:** Populate all 110 markdown knowledge files across 20 semantic domains.

**Progress:** 28/110 files (25%)
- Completed: Security (9/9), GRC (15/15), S4HANA (4/4) ✅
- In progress: BTP (2/6)
- Remaining: RISE (9), Project-Management (11), Project-Types (9), Interview-Scenarios (5), Behavioral (4), Leadership (4), Cloud (4), IDM (4), Fiori (4), BW (3), Troubleshooting (4), Audit (3), Compliance (3), Transports (3), Cutover (3), Hypercare (3)

**Process:** Standard Domain Workflow (populate → validate markdown → rebuild index → validate retrieval → validate interview quality → freeze domain → report)

**Deliverable:** Fully-populated, validated, retrieval-ready knowledge platform.

---

## Phase 2: Retrieval Optimization (Post-Knowledge Population)

**Estimated start:** 2026-Q4 (after knowledge population complete)

### 2.1 Multi-Query Expansion for Comparison Questions

**Problem:** Current single-query-vector approach doesn't reliably retrieve both docs for "difference between X and Y" questions.

**Solution:** 
- Detect comparison question intent
- Generate multiple query vectors (one per topic)
- Run parallel retrieval passes
- Merge and deduplicate results
- Rerank combined results

**Effort estimate:** 2–3 days

**Trade-off:** Slight latency increase (2–3 additional vector operations per comparison question)

### 2.2 Semantic Answer Evaluation

**Problem:** Current evaluation is heuristic/regex-based.

**Solution:**
- Use a lightweight distilled model for semantic matching (no external API)
- Check whether answer actually addresses the question (semantic entailment)
- Check consistency with retrieved context (no hallucination)
- Generate structured quality signals: relevance_score, completeness_score, hallucination_risk

**Effort estimate:** 3–5 days

**Trade-off:** Adds processing time post-generation (acceptable since evaluation is already post-generation, no additional LLM call)

### 2.3 Knowledge Source Attribution

**Problem:** Answer quality panel shows retrieved docs, but answer doesn't cite which chunk backs each claim.

**Solution:**
- Track which retrieved chunk each generated sentence is grounded in
- Display inline citations in answer ("... [from SAP Security > PFCG]")
- Allow candidate to drill into source context

**Effort estimate:** 2–3 days

**Trade-off:** Requires prompt modification to output cite markers; LLM support varies (simpler with structured output APIs if available)

---

## Phase 3: Knowledge Infrastructure

**Estimated start:** 2026-Q4–2027-Q1 (concurrent with Phase 2)

### 3.1 Vector Database Integration

**Problem:** In-memory vector search doesn't scale beyond ~5k chunks.

**Solution:**
- Integrate Pinecone (managed SaaS), Weaviate (self-hosted), or local Qdrant
- Move from in-memory to persistent vector index
- Support incremental index updates (add one file without rebuilding entire index)
- Support hybrid search (vector + sparse)

**Candidates:**
- **Pinecone:** Easiest setup, managed, pay-per-query, integrates with LangChain
- **Weaviate:** Self-hosted option, GraphQL API, good for hybrid search
- **Qdrant:** Lightweight, fast, good self-hosted option

**Effort estimate:** 5–7 days

**Trade-off:** Added infrastructure dependency; vendor lock-in for SaaS options

### 3.2 Real-Time Knowledge Updates

**Problem:** Every knowledge file change requires full index rebuild and redeployment.

**Solution:**
- Support incremental index updates (add/update single file)
- Hot-reload capability (update knowledge without restarting app)
- Background index refresh (rebuild in background, swap atomically)

**Effort estimate:** 2–3 days

**Trade-off:** Adds complexity to index versioning and deployment

### 3.3 Knowledge Versioning and Rollback

**Problem:** No way to roll back to previous knowledge if a file update degrades answer quality.

**Solution:**
- Store index snapshots with timestamps
- Support rolling back to previous index version
- Tag releases ("stable", "staging", "experimental")
- A/B testing: route % of questions to different index versions

**Effort estimate:** 3–4 days

**Trade-off:** Adds disk/storage overhead for snapshots; complicates deployment pipeline

---

## Phase 4: Live Interview Features

**Estimated start:** 2027-Q1–Q2

### 4.1 Interview Context Carryover

**Problem:** Each question is answered in isolation; no memory of previous Q&A.

**Solution:**
- Maintain conversation context (previous questions + answers)
- Incorporate context into follow-up question retrieval ("given that we just discussed PFCG, now we're talking about profiles...")
- Personalize answer depth based on demonstrated knowledge level

**Effort estimate:** 2–3 days

**Trade-off:** Increases context window size; may affect latency

### 4.2 Real-Time Feedback Loop

**Problem:** Interview coach/observer can't signal when answer is weak; candidate doesn't know to pivot.

**Solution:**
- Real-time feedback channel (WebSocket or SSE)
- Interviewer can mark answer as "weak" or "strong"
- System learns weak-answer patterns
- Suggest follow-up questions in real time

**Effort estimate:** 3–4 days

**Trade-off:** Requires real-time infrastructure (WebSocket, session management)

### 4.3 Interview Analytics

**Problem:** No data on what questions are asked, what answers are weak, what domains need improvement.

**Solution:**
- Log all questions, answers, retrieval context, quality scores
- Dashboard: question distribution by domain, weak-answer hotspots, common follow-ups
- Use analytics to drive knowledge improvement priorities

**Effort estimate:** 3–4 days

**Trade-off:** Privacy considerations (no PII in logs); need consent for recording

---

## Phase 5: Candidate Preparation Tools

**Estimated start:** 2027-Q2–Q3

### 5.1 Interview Practice Mode

**Problem:** Users can only practice during live interviews; no dedicated prep environment.

**Solution:**
- Practice mode with recorded feedback
- Candidate practices a question, gets answer quality score
- Replay and compare against reference answer
- Practice progress tracking

**Effort estimate:** 4–5 days

**Trade-off:** Increases app complexity; requires evaluation model quality

### 5.2 Knowledge Gap Analysis

**Problem:** Candidate doesn't know which domains to study.

**Solution:**
- Quiz candidate across all domains (quick scan)
- Identify weak areas
- Recommend focused study plan
- Track improvement

**Effort estimate:** 4–5 days

**Trade-off:** Adds interactive quiz infrastructure

### 5.3 Resume Parsing and Personalization

**Problem:** Answers are generic; not tailored to candidate's actual experience.

**Solution:**
- Parse resume for technologies, roles, experience length
- Customize answers based on candidate background
- Flag if candidate's claimed experience doesn't match answer quality (potential red flag)
- Adjust answer depth based on seniority level

**Effort estimate:** 3–4 days

**Trade-off:** Resume parsing is error-prone; needs human review fallback

---

## Phase 6: Enterprise Features (Future, 2027+)

### 6.1 Multi-Tenant Support
- Separate knowledge bases per customer
- Custom domain extensions
- Branded interview interface

### 6.2 Team Collaboration
- Interview panel (multiple interviewers, live comments)
- Shared evaluation rubric
- Debrief notes and scoring

### 6.3 Integration with ATS/Hiring Platform
- Connect to Greenhouse, Lever, LinkedIn Recruiter
- Auto-fetch candidate info
- Post-interview scoring to ATS
- Interview history and comparisons

### 6.4 Advanced Analytics
- Hiring outcomes (interview score vs hire/no-hire)
- Bias detection (score consistency across demographics)
- Interviewer training based on bias feedback

---

## Technology Debt and Maintenance

### Ongoing
- Keep SAP knowledge accurate as new releases and updates are announced
- Monitor SAP security advisories and update content accordingly
- Periodic embedding model updates (when new/better models become available)
- Performance monitoring and optimization

### Known Candidates for Future Work
- Rate limiting on `/api/chat` (flagged for production deployment)
- Knowledge index storage decision (commit to repo vs generate at deploy time)
- Comprehensive error logging and monitoring
- Integration tests for end-to-end retrieval + generation flows

---

## Success Metrics

**Knowledge Quality:**
- Interview quality panel scores trending toward 0.8+ (high quality)
- Retrieval precision (correct doc in top-3) >90% for representative questions
- No hallucination flags in answer evaluation

**Product Adoption:**
- Candidate interview pass rate increases with use of Interview Copilot
- Interviewer feedback: "Candidate seemed better prepared"
- Time-to-prepared-answer decreases (faster responses during live interview)

**Operational:**
- P95 end-to-end latency <5 seconds
- Zero hallucinations in production (audit every week)
- Knowledge update frequency: new content/fixes deployed within 24 hours

---

## Decision Framework: When to Expand vs Stabilize

**Expand infrastructure when:**
- Knowledge base reaches 10k+ chunks (in-memory search becomes bottleneck)
- Multi-query retrieval needed for >10% of questions
- Multiple concurrent interview sessions needed

**Stabilize and freeze when:**
- Retrieval quality plateaus (no improvement from further tuning)
- Interview quality scores plateau
- Infrastructure is predictable and low-maintenance

**Prioritize knowledge over infrastructure:**
- If a question gets a weak answer, assume knowledge gap first
- Only invest in infrastructure optimization if knowledge is complete but retrieval is failing

---

## Milestones

| Milestone | Target Date | Deliverable |
|-----------|-------------|-------------|
| Knowledge population 50% complete | 2026-09-30 | RISE (9) + Project-Management (11) domains |
| Knowledge population 100% complete | 2026-12-31 | All 110 files populated, validated, retrieval-ready |
| Phase 2 (Retrieval Optimization) complete | 2027-03-31 | Multi-query, semantic eval, source attribution |
| Phase 3 (Infrastructure) complete | 2027-06-30 | Vector DB, real-time updates, versioning |
| Phase 4 (Live Interview) complete | 2027-09-30 | Context carryover, real-time feedback, analytics |
| Phase 5 (Candidate Prep) complete | 2027-12-31 | Practice mode, knowledge gap analysis, resume personalization |

---

**Last updated:** 2026-08-05
**Next review:** After BTP domain completion
