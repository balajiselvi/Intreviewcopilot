# Resume Guide: How to Continue Development

This is the practical operational guide for resuming Interview Copilot development. It complements AI_SESSION_BOOTSTRAP.md and PROJECT_STATE.md with step-by-step procedures.

## Finding Your Starting Point

**Always start here:**

1. Read `docs/AI_SESSION_BOOTSTRAP.md` (entry point for every session)
2. Read `docs/PROJECT_STATE.md` (current progress and frozen components)
3. Identify the exact stopping point:
   ```bash
   git log --oneline -20
   ```
   Look for the most recent "Populate <domain> knowledge files" commit.

4. Check which domain is next in the roadmap:
   - Current: BTP (2/6 complete) → finish remaining 4 files
   - After BTP: RISE (9 files)
   - Then: Project-Management (11 files), Project-Types (9 files), ...
   - See PROJECT_STATE.md for full order

---

## Standard Domain Workflow (Step-by-Step)

Follow this process for every domain, without exception. No shortcuts.

### Step 1: Populate Markdown Files

**Goal:** Write every empty `.md` file in the domain to the full 24-section template.

**How to identify empty files:**
```bash
cd knowledge/<domain>
for f in *.md; do echo "=== $f ==="; wc -l "$f"; done
```

Files with 0 lines need content. Files with >100 lines are likely complete.

**Template structure (24 sections):**

```markdown
# <Topic Title>

## Overview
[Context-setting paragraph explaining what this topic is and why it matters]

## Interview Summary
[Elevator pitch: one-liner for a quick conversation starter]

## 30 Second Interview Answer
[Quick 1-paragraph answer: just the essentials]

## 60 Second Interview Answer
[Medium answer: 2-3 paragraphs, adds architectural context]

## 90 Second Interview Answer
[Deep answer: 4-5 paragraphs, includes nuance and trade-offs]

## Architecture
[System components and how they relate]

## Runtime Flow
[Step-by-step operational flow]

## Configuration
[How to set up or configure this in SAP]

## Implementation Activities
[What a consultant does to implement this]

## Migration Activities
[Upgrades, cross-release changes]

## Rollout Activities
[Multi-site or multi-entity deployments]

## Production Support Activities
[Day-to-day operational responsibilities]

## Troubleshooting

Common issue: [specific problem]
Root cause: [why it happens]
Resolution: [how to fix it]

[Repeat 2-3 times with real issues]

## Common Interview Questions

1. [Question]
   [Answer]

2. [Question]
   [Answer]

[Continue for 20+ questions]

## Tough Follow-up Questions

1. [Question]
   [Answer]

[Continue for 20+ questions]

## SAP Transactions
- T-Code: Description
- [List 10-20 relevant transactions]

## SAP Tables
- ZXXXX: Description
- [List 10-20 relevant tables]

## Best Practices
- [Practice 1]
- [Practice 2]
- [Practice 3...]

## Common Mistakes
- [Mistake 1]
- [Mistake 2]
- [Mistake 3...]

## Interviewer's Hidden Expectations
[What the interviewer is really listening for: hidden signals of expertise, red flags, dealbreakers]

## What Makes This a 10/10 Answer
[The elements an expert answer would include; what separates a good answer from an excellent one]

## Red Flags
[Warning signs of weak knowledge, misunderstanding, or poor judgment]

## Keywords
[Key terms and acronyms to know and use naturally]

## Related Topics
- [Related topic 1](../other-domain/related-file.md)
- [Related topic 2](../other-domain/related-file.md)
```

**Writing guidelines:**
- Natural spoken English (how an expert SAP consultant would explain it over coffee)
- No first-person anecdotes ("I remember when..." or "At one client I worked with...") — write as generic consultant responsibilities
- No fabrication or speculation — stick to official SAP behavior
- Technically accurate for current SAP releases (ECC and S/4HANA)
- Each section should be substantive, not placeholder text
- Cross-reference using `## Related Topics` instead of duplicating content

**Quality checklist before moving to Step 2:**
- [ ] All 24 sections present and filled
- [ ] No section is empty or has only one sentence
- [ ] Interview answers (30/60/90) are distinct in depth (not just repeats)
- [ ] Troubleshooting has 2-3 real issues (not generic)
- [ ] Common questions list has 20+
- [ ] Tough follow-ups list has 20+
- [ ] No duplication with other files in the domain (use Related Topics instead)
- [ ] Spelling, grammar, SAP terminology correct
- [ ] Links to related topics are accurate (files exist and make sense)

**Populate all files in the domain before proceeding to Step 2.**

---

### Step 2: Validate Markdown Quality

**Goal:** Ensure all populated files are complete, accurate, and well-written.

**Checklist:**

1. **Template completeness:**
   ```bash
   grep -c "^##" knowledge/<domain>/*.md
   ```
   Each file should have ~24 headings. Investigate files with <20.

2. **Cross-file duplication:**
   ```bash
   grep -r "^## " knowledge/<domain>/ | sort | uniq -c | sort -rn
   ```
   If a phrase appears in multiple files, that section should be in Related Topics, not duplicated.

3. **Natural English:**
   - Read 2-3 files aloud (mentally or actually). Do they sound like conversation?
   - Check for excessive jargon density, technical verbosity, or bulleted-list-style writing
   - SAP documentation often uses passive voice and acronym overload — interview style should be more active and conversational

4. **Technical accuracy:**
   - Check facts against official SAP Help (sap.com/help)
   - Verify transaction codes exist
   - Verify table names are correct
   - Check that architectural descriptions match current SAP releases

5. **Interview answer progression:**
   - 30 Second should be doable in a single breath
   - 60 Second should add concrete architectural context
   - 90 Second should include nuance, trade-offs, gotchas
   - All three should be about the same topic (not three different takes)

**For each domain, create a validation notes file:**
```bash
cat > knowledge/<domain>/VALIDATION_NOTES.md << 'EOF'
# <Domain> Validation Notes

## Files Completed
- file1.md ✅ (checked)
- file2.md ✅ (checked)
- ...

## Issues Found and Resolved
- [Issue 1: Description + Fix]
- [Issue 2: Description + Fix]

## Final Sign-Off
All files complete, accurate, and ready for index rebuild.
Date: YYYY-MM-DD
EOF
```

**Validation checklist (before proceeding to Step 3):**
- [ ] All files read for grammar and flow
- [ ] No content duplication (all cross-references use Related Topics)
- [ ] Technical facts verified against SAP Help
- [ ] Interview answers are distinct in depth
- [ ] Troubleshooting, Q&A, and best-practices sections are substantive
- [ ] SAP transaction codes and tables are real
- [ ] No first-person anecdotes

---

### Step 3: Rebuild Knowledge Index

**Goal:** Parse all markdown files, generate chunks, create embeddings, build the index.

**Command:**
```bash
node scripts/buildKnowledge.js
```

**Expected output:**
```
✓ Scanned 9 files in knowledge/security
✓ Generated 120 chunks
✓ Created embeddings (8.5s)
✓ Built index: 9 documents, 120 chunks
✓ Wrote data/knowledgeIndex.json (2.4MB)
```

**Troubleshooting:**

| Problem | Solution |
|---------|----------|
| "Cannot find module scripts/buildKnowledge.js" | Check that scripts/ directory exists and contains buildKnowledge.js |
| "Out of memory" | Increase Node.js heap: `NODE_OPTIONS=--max-old-space-size=4096 node scripts/buildKnowledge.js` |
| "SyntaxError in knowledge file" | Fix the markdown file syntax (unclosed code blocks, bad links, etc.) |
| Embedding generation extremely slow | Normal for first run. Check that @xenova/transformers is installed: `npm list @xenova/transformers` |

**Validation checklist (after rebuild completes):**
- [ ] Index file created: `ls -lh data/knowledgeIndex.json` (should be 2-5MB)
- [ ] Index contains all files: `grep -c "\"id\":" data/knowledgeIndex.json` (should match domain file count)
- [ ] Index has chunks: `grep -c "\"text\":" data/knowledgeIndex.json` (should be >50 for non-tiny domain)
- [ ] Index has embeddings: `grep -c "\"embedding\":" data/knowledgeIndex.json` (should equal chunk count)

---

### Step 4: Validate Retrieval

**Goal:** Test that the retrieval system returns correct knowledge for representative domain questions.

**Prepare 3-6 test questions** representative of the domain:

Example for BTP domain:
- "What is BTP and how does it relate to SAP ECC?"
- "How do I secure communication between on-premise and BTP?"
- "What's the difference between identity provisioning and cloud connectors?"
- "How do I troubleshoot a BTP connectivity issue?"
- "What are the key architectural components of BTP security?"
- "How does SAML fit into BTP identity management?"

**Create a test script** (or run manually in Node REPL):

```javascript
// test-retrieval.js
const { retrievalService } = require('./lib/container');

async function testRetrieval() {
  const questions = [
    "What is BTP and how does it relate to SAP ECC?",
    "How do I secure communication between on-premise and BTP?",
    "What's the difference between identity provisioning and cloud connectors?",
    // ... add all test questions
  ];

  for (const question of questions) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Q: ${question}`);
    console.log('='.repeat(60));
    
    try {
      const result = await retrievalService.retrieve(question, {
        topK: 5,
        category: 'general'
      });
      
      console.log(`Top ${result.chunks.length} chunks:`);
      result.chunks.forEach((chunk, i) => {
        console.log(`\n${i + 1}. [${chunk.score.toFixed(3)}] ${chunk.source}`);
        console.log(`   Section: ${chunk.section}`);
        console.log(`   Heading: ${chunk.heading}`);
        console.log(`   Text preview: ${chunk.text.substring(0, 100)}...`);
      });
      
      console.log(`\nRetrieval timing: embedding=${result.timing.embedding}ms, ranking=${result.timing.ranking}ms`);
    } catch (err) {
      console.error(`ERROR: ${err.message}`);
    }
  }
}

testRetrieval().catch(console.error);
```

**Run the test:**
```bash
node test-retrieval.js
```

**Validation checklist:**

For each question:
- [ ] Top-3 chunks come from expected documents (correct files retrieved)
- [ ] Score breakdown is present (semantic, lexical, component, intent, section scores all > 0)
- [ ] Retrieved sections make sense for the question (not random noise)
- [ ] Scores trend downward through top-5 (ranking is meaningful)
- [ ] No obvious "wrong" documents in top-5 (e.g., behavioral questions when asking about technical BTP)

**If retrieval is weak:**
- Check that knowledge files actually contain the answer (Step 2 validation)
- Verify that question keywords appear in the retrieved chunks (lexical scoring)
- Check component detection (does the question mention "BTP"? Is it being recognized?)
- Review retrieval scores (are top scores >0.5? If all scores <0.3, knowledge might be too sparse)

**Typical score ranges:**
- Semantic score alone: 0.3–0.7 for relevant chunks
- Final combined score: 0.5–0.9 for top-K results
- If all final scores <0.3, knowledge might lack depth or question is not well-covered

---

### Step 5: Validate Interview Quality (Without LLM)

**Goal:** Inspect what knowledge context would be injected into the prompt, judge sufficiency.

**Method 1: Retrieval-only mode (no API key needed)**

```bash
export LLM_VALIDATION_MODE=retrieval-only
npm run dev
# Navigate to http://localhost:3000/interview
# Ask a test question
# Look at the SSE diagnostic event in browser DevTools
```

**DevTools inspection:**

1. Open DevTools (F12) → Console or Network tab
2. Ask a test question
3. Watch Network tab for POST to `/api/chat`
4. Look for SSE event named `retrieval_only`:
   ```json
   {
     "event": "retrieval_only",
     "data": {
       "model": "gpt-4o-mini",
       "tokenCeiling": 8000,
       "category": "definition",
       "knowledgeContext": "# BTP Overview\n\n## Architecture\nBTP consists of...",
       "retrievedDocs": [
         { "source": "knowledge/btp/btp-overview.md", "score": 0.87 },
         ...
       ]
     }
   }
   ```

**Method 2: Direct retrieval service call (programmatic)**

```javascript
// Already done in Step 4; same output but without UI
```

**Validation questions to ask:**

For each test question, inspect the `knowledgeContext`:

- [ ] Does it actually answer the question?
- [ ] Is it substantive (>500 characters)?
- [ ] Does it mention relevant SAP components (S/4HANA, transactions, tables)?
- [ ] Would a candidate be able to give a good answer based on this context alone?
- [ ] Are there obvious gaps or irrelevant tangents?

**Red flags:**

- "knowledgeContext" is empty → No knowledge retrieved, retrieval is completely failing
- "knowledgeContext" is very short (<200 chars) → Domain is too sparse, needs more content
- Retrieved docs are from wrong domain → Retrieval scoring needs tuning
- "knowledgeContext" has lots of "Troubleshooting" sections but question was about architecture → Section bonuses need adjustment

**If interview quality is weak:**
- Go back to Step 2 and expand knowledge content (more details, more examples)
- Do NOT try to fix this by tuning retrieval scoring (knowledge-first approach)
- If knowledge is dense and retrieval is still weak, only then debug retrieval tuning

---

### Step 6: Knowledge Improvement Loop

**Goal:** Iterate on knowledge content until retrieval quality is high and interview answers would be strong.

**Process:**

1. **Identify weak areas:**
   - Run Step 4 retrieval tests
   - Run Step 5 interview quality validation
   - Note which questions don't return good context

2. **Improve knowledge:**
   - Edit the markdown file to add more detail, examples, or structure
   - Don't redesign retrieval or re-tune scoring yet
   - Focus on: is the answer actually in the knowledge file? Is it clear and complete?

3. **Rebuild and re-test:**
   ```bash
   node scripts/buildKnowledge.js
   # Re-run retrieval tests (Step 4) and interview validation (Step 5)
   ```

4. **Repeat until satisfied:**
   - Interview quality scores are 0.7+
   - All test questions return appropriate knowledge
   - No obvious gaps or hallucination risks

**When to stop iterating:**
- Retrieval precision is high (correct docs in top-3)
- Interview quality would be strong based on retrieved context
- No more obvious knowledge gaps
- Move to Step 7

---

### Step 7: Freeze Domain

**Goal:** Mark this domain as complete and stable; no further edits unless a factual error or retrieval defect is found.

**Action:**
1. Remove the VALIDATION_NOTES.md file (internal artifact):
   ```bash
   rm knowledge/<domain>/VALIDATION_NOTES.md
   ```

2. Create a DOMAIN_STATUS.md file at the root:
   ```bash
   cat >> docs/DOMAIN_STATUS.md << 'EOF'

## <Domain Name> — FROZEN
- Date: YYYY-MM-DD
- Files: N/N (all complete)
- Chunks: X total
- Validation result: ✅ Pass
- Retrieval precision: >90%
- Ready for production

EOF
   ```

3. Update PROJECT_STATE.md:
   - Move domain from "In Progress" to "Completed Domains (frozen)"
   - Update file counts and percentages
   - Note the completion date

4. Commit:
   ```bash
   git add knowledge/<domain>/ docs/
   git commit -m "Freeze <domain> domain — 100% knowledge population and retrieval validation complete"
   ```

---

### Step 8: Progress Report

**Create a session summary:**

```markdown
# <Domain> Completion Report — 2026-08-XX

## Summary
- Domain: <Domain Name>
- Files: N/N complete (100%)
- Total chunks: X
- Session date: 2026-08-XX

## Validation Results
- Markdown quality: ✅ Pass
- Retrieval precision: 90%+ (X/Y test questions retrieved correct docs)
- Interview quality: ✅ Strong (would support good candidate answers)
- Time to populate and validate: Y hours

## Next Domain
<Next domain name>, N files to populate

## Files Completed
- file1.md
- file2.md
- ...

## Changes Made
- [Summary of what was written and validated]

## Known Issues / Future Improvements
- [If any discovered during validation, list here]
```

---

### Step 9: Continue Automatically to Next Domain

No pause, no approval gate. Move to Step 1 for the next domain in the roadmap.

**Current roadmap:**
1. BTP (2/6 in progress) ← Resume here
2. RISE (9 files)
3. Project-Management (11 files)
4. Project-Types (9 files)
5. Interview-Scenarios (5 files)
6. Behavioral (4 files)
7. Leadership (4 files)
8. Cloud (4 files)
9. IDM (4 files)
10. Fiori (4 files)
11. BW (3 files)
12. Troubleshooting (4 files)
13. Audit (3 files)
14. Compliance (3 files)
15. Transports (3 files)
16. Cutover (3 files)
17. Hypercare (3 files)

---

## Quick Diagnostics

### Retrieval is returning wrong documents

**Checklist:**
1. Run Step 4 retrieval test with debugging
2. Check semantic score: `chunk.score` breakdown should show what's contributing
3. Check component detection: is the SAP component in the question being recognized?
4. Check lexical score: are question keywords appearing in top-3 chunks?

**Common causes:**
- Knowledge files lack depth (not enough detail for the question)
- Component detection is failing (check `componentSelector.js`)
- Retrieval scoring formula needs tuning (last resort; try knowledge improvement first)

### Index rebuild hangs or runs out of memory

**Checklist:**
```bash
# Check current Node.js memory limit
node -e "console.log(require('v8').getHeapStatistics().heap_size_limit / 1024 / 1024 + ' MB')"

# Increase if needed
NODE_OPTIONS=--max-old-space-size=4096 node scripts/buildKnowledge.js
```

### Knowledge files have validation errors

**Common markdown syntax issues:**
- Unclosed code blocks (`` ` `` without closing)
- Bad link syntax: `[text](../invalid/path.md)` — file doesn't exist
- Heading levels jump (e.g., # → ### without ##)
- Non-ASCII characters in filenames (stay ASCII alphanumeric + hyphens)

**Fix:**
```bash
# Validate markdown syntax
node -e "const fs = require('fs'); const files = require('glob').sync('knowledge/**/*.md'); files.forEach(f => { try { fs.readFileSync(f, 'utf8'); console.log('✓', f); } catch(e) { console.log('✗', f, e.message); } });"
```

---

## Reference: Key Files

| File | Purpose |
|------|---------|
| `services/knowledgeService.js` | Scans and parses markdown |
| `services/chunkService.js` | Markdown-aware chunking |
| `services/embeddingService.js` | Embedding generation |
| `services/knowledgeIndexService.js` | Index orchestration |
| `services/retrievalService.js` | Retrieval and ranking |
| `scripts/buildKnowledge.js` | Index rebuild script |
| `lib/container.js` | Dependency injection |
| `docs/RETRIEVAL.md` | Detailed retrieval mechanics |
| `docs/INDEXING.md` | Detailed indexing mechanics |

---

**Last updated:** 2026-08-05
**Questions?** Check AI_SESSION_BOOTSTRAP.md for mandatory reading order, then PROJECT_STATE.md for current status.
