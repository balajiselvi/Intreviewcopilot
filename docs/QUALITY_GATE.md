# Quality Gate — Permanent Standards for Interview Copilot Knowledge Platform

**Last Updated:** 2026-08-05  
**Applies To:** All knowledge domains and files  
**Status:** Effective immediately — use for every domain from this point forward

This document defines the mandatory quality standards for every knowledge article in the Interview Copilot knowledge platform. Every domain must pass all quality gates before being frozen. This becomes the single source of truth for content quality decisions.

---

## Part 1: Mandatory Document Template Requirements

Every `.md` file in `knowledge/` must include all 24 sections, in order, with substantive content (no placeholders):

### 1. Overview
- **Purpose:** Context-setting paragraph explaining what this topic is and why it matters in enterprise SAP environments
- **Minimum length:** 150-200 words
- **Quality criteria:**
  - Explains the business context (not just technical mechanics)
  - Clarifies why an interviewer asks about this topic
  - Mentions where this appears in real SAP implementations
  - No marketing language, no hype

### 2. Interview Summary
- **Purpose:** Elevator pitch for a quick conversation starter
- **Minimum length:** 25-50 words (one-liner to one paragraph)
- **Quality criteria:**
  - Captures the core concept in plain language
  - Could be said aloud in a single breath
  - A candidate should memorize this verbatim

### 3. 30 Second Interview Answer
- **Purpose:** Quick answer doable in a single breath or short burst
- **Minimum length:** 75-150 words (1-2 short paragraphs)
- **Quality criteria:**
  - Directly answers a basic "what is this" question
  - Mentions 2-3 key concepts
  - Natural spoken English (not documentation style)
  - No setup required; can stand alone

### 4. 60 Second Interview Answer
- **Purpose:** Medium-depth answer with architectural context
- **Minimum length:** 200-300 words (3-4 paragraphs)
- **Quality criteria:**
  - Expands on the 30-second answer
  - Includes architectural components or key relationships
  - Distinct from the 30-second answer (not just a longer version)
  - Explains "how" or "why" in addition to "what"

### 5. 90 Second Interview Answer
- **Purpose:** Deep answer with nuance, trade-offs, and gotchas
- **Minimum length:** 350-500 words (4-6 paragraphs)
- **Quality criteria:**
  - Adds implementation-level detail
  - Mentions trade-offs and design decisions
  - Includes a real-world complexity or gotcha
  - Covers edge cases or non-obvious aspects
  - Distinct progression from 60-second version

### 6. Architecture
- **Purpose:** System components and how they relate
- **Minimum length:** 200-300 words
- **Quality criteria:**
  - Describes major components (subsystems, modules, services)
  - Explains relationships and data flows
  - Mentions relevant SAP tables, transactions, or modules
  - Diagrams or ASCII art if it clarifies relationships (optional)

### 7. Runtime Flow
- **Purpose:** Step-by-step operational flow during normal operation
- **Minimum length:** 200-300 words or a clear numbered/bulleted flow
- **Quality criteria:**
  - Numbered or sequential flow (not just paragraphs)
  - Covers happy path (normal operation)
  - Mentions decision points or conditional flows
  - Describes what happens at each stage
  - Real enough that an implementer could follow it

### 8. Configuration
- **Purpose:** How to set up or configure this in SAP
- **Minimum length:** 200-300 words
- **Quality criteria:**
  - Transaction codes to use (e.g., "SM50 to monitor...")
  - Configuration settings and their meanings
  - Tables that store configuration (e.g., "TCODE table for transaction definitions")
  - Permission/authorization requirements
  - Common configuration mistakes

### 9. Implementation Activities
- **Purpose:** What a consultant does to implement this
- **Minimum length:** 200-300 words (5-10 bullet points)
- **Quality criteria:**
  - Written as generic consultant responsibilities, not first-person anecdotes
  - Covers discovery, design, configuration, testing phases
  - Mentions key deliverables and sign-offs
  - Real-world timeline expectations
  - Dependency on other domains (if applicable)

### 10. Migration Activities
- **Purpose:** Upgrades, cross-release changes, data migration concerns
- **Minimum length:** 200-300 words
- **Quality criteria:**
  - Covers data migration (if applicable)
  - Mentions release-specific changes (ECC → S/4HANA, version upgrades)
  - Downtime and cutover considerations
  - Rollback scenarios
  - Validation and reconciliation steps

### 11. Rollout Activities
- **Purpose:** Multi-site or multi-entity deployments
- **Minimum length:** 200-300 words
- **Quality criteria:**
  - Describes how to scale across multiple sites/entities
  - Mentions parallel processing, phased rollout, or big-bang approaches
  - Addresses consistency and synchronization needs
  - Real-world phasing strategy (often prioritize by criticality)
  - Success criteria for each phase

### 12. Production Support Activities
- **Purpose:** Day-to-day operational responsibilities
- **Minimum length:** 200-300 words (6-10 bullet points)
- **Quality criteria:**
  - Monitoring and alerting
  - Common operational tasks
  - Escalation paths and support matrix
  - Incident response workflows
  - Metrics and KPIs to track
  - How to handle production incidents

### 13. Troubleshooting
- **Purpose:** Common issues and their fixes
- **Minimum length:** 3-5 detailed issue → root cause → resolution blocks (400+ words total)
- **Quality criteria:**
  - Real issues from actual implementations (not hypothetical)
  - Clear description of symptoms
  - Root cause analysis (why it happens)
  - Step-by-step resolution
  - Prevention tips
  - SAP transaction codes for diagnosis
  - At least one issue should be non-obvious (not just "missing authorization")

### 14. Common Interview Questions
- **Purpose:** 20+ questions an interviewer might ask
- **Minimum count:** 20+ questions and brief answers
- **Minimum length:** 500+ words total
- **Quality criteria:**
  - Cover definition, use cases, architecture, configuration, troubleshooting
  - Range from easy to moderately difficult
  - Each answer: 30-100 words (concise but substantive)
  - No overlap with other sections (those are already covered)
  - Natural phrasing ("What is..." "How do you..." "When would you...")
  - Answers are complete sentences, not bullet points

### 15. Tough Follow-up Questions
- **Purpose:** Interviewer's probing questions after the first answer
- **Minimum count:** 20+ questions and answers
- **Minimum length:** 600+ words total
- **Quality criteria:**
  - Test depth of understanding, not just knowledge
  - Examples: "How would you handle X when Y changes?" or "What if the business requirement was Z instead?"
  - Answers show architectural thinking, not just procedure recall
  - 50-150 words per answer (more substantive than common questions)
  - Separate from "Common Interview Questions" (no duplication)

### 16. SAP Transactions
- **Purpose:** Relevant T-codes for this topic
- **Minimum count:** 10-20 transaction codes
- **Quality criteria:**
  - Format: `TCODE: Description`
  - Real SAP transaction codes only (verify against SAP Help)
  - Each description is 1-2 lines (not a paragraph)
  - Organized by category if possible (e.g., "Configuration" vs "Monitoring")
  - Codes are currently valid for ECC and/or S/4HANA

### 17. SAP Tables
- **Purpose:** Relevant database tables
- **Minimum count:** 10-20 table names
- **Quality criteria:**
  - Format: `TABLENAME: Description`
  - Real SAP table names (verify against SAP Help or data dictionary)
  - Each description is 1-2 lines (field names if relevant)
  - Tables that an implementer would actually query or configure
  - Organized by category if possible

### 18. Best Practices
- **Purpose:** Wisdom from successful implementations
- **Minimum count:** 5-10 distinct practices
- **Quality criteria:**
  - Actionable and specific (not generic advice)
  - Reflect real enterprise experience
  - Include performance, security, operational, or design considerations
  - Each practice is 1-3 sentences (not a paragraph)
  - Address trade-offs (e.g., "Use role hierarchy to reduce PFCG maintenance, but test role composition carefully")

### 19. Common Mistakes
- **Purpose:** What goes wrong when people don't know this well
- **Minimum count:** 5-10 distinct mistakes
- **Quality criteria:**
  - Based on actual implementation failures (not hypothetical)
  - Each mistake is specific and unambiguous
  - Include the consequence (why this is bad)
  - Suggest how to avoid it (brief correction)
  - Range from configuration mistakes to architectural oversights

### 20. Interviewer's Hidden Expectations
- **Purpose:** What the interviewer is really listening for
- **Minimum length:** 200-300 words (5-8 bullet points)
- **Quality criteria:**
  - Signal what separates "sounds like they know the buzzwords" from "genuinely understands this"
  - Real red flags: missing concepts, misunderstandings, poor judgment
  - Hidden signals: mentions trade-offs, recognizes limits, knows when to escalate
  - Answers what the interviewer thinks: "If they don't mention X, I'm skeptical"

### 21. What Makes This a 10/10 Answer
- **Purpose:** Elements of an expert answer; what separates good from excellent
- **Minimum length:** 200-300 words (5-8 elements)
- **Quality criteria:**
  - Specific behavioral signals
  - Examples: "mentions authorization first", "explains why, not just how", "acknowledges trade-off"
  - Range from technical depth to soft skills (communication, judgment)
  - Actionable for a candidate studying for the interview

### 22. Red Flags
- **Purpose:** Warning signs of weak knowledge or misunderstanding
- **Minimum count:** 5-8 red flags
- **Quality criteria:**
  - What an interviewer hears and immediately gets skeptical
  - Examples: "says you can do X without authorization" or "claims it's never a problem in production"
  - Specific, not vague ("doesn't know the difference between..." not "lacks depth")
  - Include why it's a red flag (interviewer's perspective)

### 23. Keywords
- **Purpose:** Key terms and acronyms to know and use naturally
- **Minimum count:** 15-20 keywords/acronyms
- **Quality criteria:**
  - Core terminology relevant to this topic
  - Acronyms defined (e.g., "PFCG — Profile Generator")
  - Keywords candidates should use naturally in conversation
  - Organize by category if helpful (system components, concepts, tools)
  - Only keywords that matter (not verbose lists)

### 24. Related Topics
- **Purpose:** Cross-references to related knowledge files
- **Minimum count:** 3-5 related files
- **Quality criteria:**
  - Link to existing `.md` files by relative path
  - Format: `[Topic Name](../other-domain/file.md)`
  - Only true relationships (not "nice to know also")
  - No duplication: if content overlaps with a related file, link instead of duplicate
  - Check that linked files actually exist before committing

---

## Part 2: Minimum Interview Question Requirements

### Minimum Coverage
- **Common Interview Questions:** 20+ questions across all categories (definition, architecture, configuration, troubleshooting, best practices)
- **Tough Follow-up Questions:** 20+ questions that probe deeper, test judgment, challenge assumptions
- **Combined minimum:** 40+ distinct Q&A pairs per knowledge file

### Question Quality Criteria
1. **Clarity:** Question is unambiguous; a candidate knows what's being asked
2. **Enterprise relevance:** Question reflects real interview scenarios (not trivia)
3. **Answer sufficiency:** Answer can be given fully in 1-3 minutes (not an essay)
4. **Breadth:** Questions span definition, architecture, implementation, troubleshooting, trade-offs
5. **Depth:** Follow-ups test whether the candidate truly understands the concept

---

## Part 3: Mandatory Architecture Coverage

Every topic file must address:

1. **Components & Relationships** — What parts does this consist of? How do they relate?
2. **Data Flow** — How does data move through the system?
3. **Security Considerations** — Authorization, encryption, audit trail
4. **Performance Implications** — What can go wrong performance-wise?
5. **Integration Points** — How does this connect to other SAP/enterprise systems?
6. **Scalability** — How does this scale in large implementations?

If a section is N/A for the topic, explicitly note "N/A — [reason]" rather than leaving it empty.

---

## Part 4: Mandatory Implementation Coverage

Every topic file must include:

1. **Pre-implementation decisions** — What choices must be made before implementation?
2. **Configuration steps** — What does an implementer actually do?
3. **Data setup** — What master data or configuration tables need populating?
4. **Testing approach** — How to validate the implementation works
5. **Cutover preparation** — What happens on go-live day
6. **Success criteria** — How do you know it's working correctly

---

## Part 5: Mandatory Troubleshooting Coverage

Every topic file must include:

1. **At least 1 authorization/permission issue** — Real permission configuration mistakes
2. **At least 1 configuration error** — Setup mistakes that break functionality
3. **At least 1 runtime/production issue** — What fails in production? How to diagnose?
4. **At least 1 performance issue** — Slow queries, locks, resource exhaustion (if applicable)
5. **At least 1 non-obvious problem** — Something that surprises consultants (edge case, undocumented behavior)

Each issue must include symptoms, root cause, and resolution steps.

---

## Part 6: Mandatory Project Scenario Coverage

Every topic file should address these scenarios:

1. **Greenfield implementation** — How to implement this from scratch
2. **Brownfield/legacy upgrade** — How to migrate existing configuration forward
3. **Multi-site rollout** — How to scale this across multiple environments
4. **Production incident** — How to diagnose and fix an issue in production
5. **High-availability scenario** — How does this work in HA/DR setups (if applicable)

At least 3-4 of these should be explicitly addressed in the Implementation/Migration/Rollout/Production Support sections.

---

## Part 7: Mandatory Cross-Reference Requirements

### Knowledge Graph Integrity
1. **No content duplication** — If two files cover the same topic, one must link to the other via "Related Topics"
2. **Explicit relationships** — "Related Topics" section lists:
   - Prerequisite knowledge (must understand X first)
   - Dependent knowledge (this enables X)
   - Complementary knowledge (works well with X)
   - Trade-off topics (choose between X and Y)

### Grep for Duplication
Before finalizing a domain, run:
```bash
grep -r "^## " knowledge/<domain>/ | cut -d: -f2 | sort | uniq -c | sort -rn
```
If a heading appears in multiple files, investigate. If content overlaps, consolidate and link.

---

## Part 8: Interview Quality Acceptance Criteria

### Retrieval Quality (Objective)
- [ ] **Top-3 retrieval precision >90%** — For 5+ representative domain questions, the correct document/section appears in top-3 retrieved chunks
- [ ] **Score breakdown meaningful** — Scores are in the 0.5–0.9 range for top results (not all <0.3, not all >0.95)
- [ ] **No obvious noise** — Retrieved chunks are contextually relevant (not just keyword-matching)

### Knowledge Sufficiency (Subjective)
- [ ] **Answer depth adequate** — Retrieved context + answer would support a candidate giving a strong 60-90 second response
- [ ] **Architecture visible** — Retrieved context mentions components, relationships, data flows
- [ ] **Troubleshooting covered** — If question is about a problem, resolution approach is visible
- [ ] **Enterprise context clear** — Retrieved context shows why this matters at scale

### Span & Coverage
- [ ] **All 24 sections present** — No empty sections, no placeholders
- [ ] **Cross-domain linking** — Related Topics points to relevant knowledge in other domains
- [ ] **Comprehensive Q&A** — 40+ interview questions covered across Common + Tough Follow-ups

---

## Part 9: Retrieval Validation Requirements

### Pre-Freeze Validation Checklist

For every domain, before marking complete:

1. **Run retrieval tests** (no API key needed):
   ```bash
   node test-retrieval.js
   # 5-6 representative questions for this domain
   ```

2. **Validate retrieval precision:**
   ```javascript
   // Top-3 chunks should be from expected documents
   // Scores should be 0.5+ for top result
   // Ranking should be meaningful (scores trend downward)
   ```

3. **Validate knowledge context:**
   - With `LLM_VALIDATION_MODE=retrieval-only`, for each test question:
     - Is `knowledgeContext` substantive (>500 chars)?
     - Does it actually answer the question?
     - Does it mention relevant SAP components?

4. **Interview quality judgment:**
   - Could a candidate give a good answer based solely on retrieved context?
   - If not, improve knowledge content before freezing

---

## Part 10: Documentation Synchronization Requirements

### After Every Domain Completion

1. **Update PROJECT_STATE.md:**
   - Move domain from "In Progress" to "Completed Domains (frozen)"
   - Update file counts: `N completed, X/Y remaining (percentage)`
   - Note completion date

2. **Update CHANGELOG.md:**
   - Add entry for domain completion
   - Record files populated, chunks generated, retrieval precision
   - Note any quality issues found and fixed

3. **Update RESUME_GUIDE.md:**
   - If workflow changed, document the change
   - Update the domain roadmap in Step 9 (reflect new progress)

4. **Update DEVELOPMENT_ROADMAP.md:**
   - If new strategic insights emerged, note them
   - Update Phase 1 progress percentage

5. **Commit:**
   ```bash
   git add knowledge/<domain>/ docs/
   git commit -m "Populate <domain> domain and validate retrieval

   - Populated N files: file1.md, file2.md, ...
   - Validated markdown quality: all 24 sections complete, no duplication
   - Rebuilt knowledge index: N documents, X chunks
   - Validated retrieval: N/N test questions retrieved correct docs (scores 0.5–0.9)
   - Interview quality: strong (context sufficient for expert answers)
   - Domain ready for freeze

   Signed-off-by: Claude Haiku <noreply@anthropic.com>"
   ```

---

## Part 11: Domain Freeze Checklist

Before marking a domain frozen (no further edits):

- [ ] All 24 sections populated with substantive content
- [ ] No duplication between files (Related Topics used instead)
- [ ] Markdown quality validated: grammar, spelling, SAP accuracy
- [ ] Knowledge index rebuilt: all documents indexed, chunks generated, embeddings created
- [ ] Retrieval validated: 5+ representative questions tested, top-3 precision >90%
- [ ] Interview quality validated: retrieved context sufficient for strong answers
- [ ] Troubleshooting coverage: 5+ distinct issues with symptoms, root causes, resolutions
- [ ] Architecture coverage: components, data flows, security, performance addressed
- [ ] Implementation coverage: greenfield, brownfield, rollout, production support addressed
- [ ] Interview question coverage: 40+ distinct Q&A pairs (20+ Common, 20+ Tough Follow-ups)
- [ ] Cross-references valid: Related Topics links point to existing files
- [ ] Documentation updated: PROJECT_STATE.md, CHANGELOG.md reflect completion
- [ ] Committed to git with clear message

**Freeze Status:** Update PROJECT_STATE.md to mark domain as "✅ Frozen"

---

## Part 12: Repository Update Checklist

Before and during domain population:

- [ ] No `.gitignore`d files accidentally added (no `.env`, no `node_modules`)
- [ ] No hardcoded secrets or API keys in markdown
- [ ] No file paths or personal names that should be generic (e.g., "at one client I worked with" → generic responsibility description)
- [ ] No first-person anecdotes ("I remember when..." → "consultants often encounter...")
- [ ] Markdown syntax valid: no unclosed code blocks, bad links, or heading jumps
- [ ] Links to related topics are relative paths: `[Topic](../other-domain/file.md)`

---

## Part 13: Completion Criteria for Every Knowledge Article

A knowledge article is complete when:

1. ✅ **All 24 sections present** — No empty sections, no placeholders
2. ✅ **Substantive content** — Each section meets its minimum length/quality requirement
3. ✅ **Natural interview language** — Reads as if an expert is speaking (not documentation prose)
4. ✅ **No fabrication** — All implementation activities are generic responsibilities (not first-person claims)
5. ✅ **Technically accurate** — All SAP components, transactions, tables are real and current
6. ✅ **Cross-reference complete** — Related Topics section links to relevant other files (no duplication)
7. ✅ **Troubleshooting substantial** — 3+ real issues with root cause analysis
8. ✅ **Interview Q&A comprehensive** — 40+ distinct questions across Common + Tough Follow-ups
9. ✅ **Architecture clear** — Components, relationships, data flows are explicit
10. ✅ **Implementation practical** — An implementer could follow the guidance

---

## Part 14: Completion Criteria for Every Domain

A domain is complete and ready for freeze when:

1. ✅ **All files complete** — Every knowledge article meets Part 13 criteria
2. ✅ **Markdown quality validated** — No duplication, natural language, technical accuracy verified
3. ✅ **Knowledge index rebuilt** — `node scripts/buildKnowledge.js` completes successfully
4. ✅ **Retrieval validated** — 5-6 representative questions tested, top-3 precision >90%, meaningful scores
5. ✅ **Interview quality validated** — Retrieved context is sufficient for strong candidate answers
6. ✅ **Knowledge graph integrity** — No broken cross-references, no isolated files
7. ✅ **Documentation synchronized** — PROJECT_STATE.md, CHANGELOG.md, RESUME_GUIDE.md updated
8. ✅ **Committed to git** — All changes committed with clear message

**Domain Status:** Mark as "✅ Frozen" in PROJECT_STATE.md. No further edits unless a factual error, retrieval defect, or SAP change is discovered.

---

## Part 15: Quality Scoring Rubric

### Markdown Quality (0–10 points)
- **10:** All sections present, substantive, well-written, no errors
- **8–9:** All sections present, mostly substantive, minor grammar/style issues
- **6–7:** All sections present, some sparse or unclear sections
- **4–5:** Missing sections or very sparse content
- **0–3:** Major gaps, placeholders, or incomplete sections

### Technical Accuracy (0–10 points)
- **10:** All SAP components, transactions, tables verified correct, current for ECC/S4H
- **8–9:** Mostly accurate, 1-2 minor issues (old transaction name, unclear context)
- **6–7:** Generally accurate but some vague or unverified claims
- **4–5:** Several inaccuracies or outdated information
- **0–3:** Major technical errors or misinformation

### Interview Relevance (0–10 points)
- **10:** 40+ questions, natural language, span definition/architecture/implementation/troubleshooting
- **8–9:** 30+ questions, mostly natural, good coverage
- **6–7:** 20+ questions, adequate coverage, some awkward phrasing
- **4–5:** <20 questions, sparse coverage
- **0–3:** <10 questions or poor quality

### Retrieval Quality (0–10 points)
- **10:** Top-3 precision 95%+, meaningful score breakdown, context sufficient for answers
- **8–9:** Top-3 precision 90–95%, mostly good scores, context generally sufficient
- **6–7:** Top-3 precision 80–90%, some noise in results
- **4–5:** Top-3 precision 60–80%, significant noise
- **0–3:** Top-3 precision <60%, most retrieved content irrelevant

### Domain Pass Threshold
- **Total:** 30+ points out of 40 minimum acceptable
- **No single category below 6:** If any category scores <6, domain fails and needs remediation

---

## Part 16: When to Stop Iterating

Stop improving a domain when:

1. **Retrieval precision >90%** for representative domain questions
2. **All quality rubric categories score 8+** (or 30+ total points)
3. **No obvious knowledge gaps** for core interview scenarios
4. **Interview quality is strong** — context would support good candidate answers
5. **Cross-references complete** — no orphaned files, no broken links

**Do not pursue perfection.** Once a domain meets these thresholds, freeze it and move to the next. Marginal improvements (90% → 92% precision, or a few additional edge-case questions) are not worth the opportunity cost of completing the remaining 17 domains.

---

## Part 17: Special Rules for Sensitive Domains

Some domains require extra care:

### Security Domain
- [ ] All authorization concepts are accurate (no casual "just give permission to user" advice)
- [ ] Security trade-offs are explicit ("this is more secure but slower")
- [ ] Compliance context is clear (GDPR, SOX, or regulatory relevance if applicable)

### GRC Domain
- [ ] All regulatory references are current (audit trail requirements, approval workflows)
- [ ] Risk concepts are explained clearly (risk vs control vs audit)
- [ ] Compliance evidence/documentation is mentioned (who audits this, what do they look for)

### Production Support / Troubleshooting Domains
- [ ] Escalation paths are clear (when to call support, when to open a ticket)
- [ ] Monitoring/alerting is covered (what metrics matter, what thresholds trigger alerts)
- [ ] Incident response is practical (realistic steps for a production incident)

---

## Part 18: Exceptions and Override Authority

This QUALITY_GATE.md is the permanent standard. Exceptions are only allowed if:

1. **Architectural justification:** A specific section is genuinely N/A (e.g., "Transactions" for a cross-cutting concept)
2. **Documented in the knowledge file:** "N/A — [reason]" noted explicitly
3. **Approved by domain review:** Project lead or subject-matter expert confirms the exception

**No undocumented exemptions.** If a section is missing and not marked N/A, the file fails validation.

---

## Part 19: Continuous Improvement

After the current roadmap reaches 100% completion:

1. **Architectural review:** Evaluate whether the knowledge graph covers the full SAP ecosystem
2. **Strategic gap analysis:** Identify missing domains based on business value and interview frequency
3. **Quality audit:** Sample-audit completed domains for drift or outdated information
4. **Refresh cycle:** Plan annual reviews to keep content current as SAP releases new features

---

## Summary

**Every knowledge file must:**
- Have all 24 sections with substantive content
- Be technically accurate and enterprise-relevant
- Support 40+ interview questions
- Retrieve well (top-3 precision >90%)
- Link to related knowledge (no duplication)
- Follow natural spoken English, not documentation style

**Every domain must:**
- Pass markdown quality validation
- Pass retrieval validation (5+ test questions)
- Pass interview quality judgment
- Be documented and committed
- Be marked frozen (no further edits)

**This standard is not negotiable.** Apply it consistently to all remaining 16 domains.

---

**QUALITY_GATE.md is now the authoritative source for all content decisions. Use it as the checklist for every file, every domain, and every review.**
