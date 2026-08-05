# Interview Copilot — System Architecture

This document describes the technical architecture, component responsibilities, data flow, and design decisions for Interview Copilot.

See [PROJECT_STATE.md](PROJECT_STATE.md) for current development phase and progress. This document does not repeat project status; it focuses on how the system works.

## System Overview

```
User Browser (React)
  ↓
Azure Speech SDK
  ├→ Transcribe interviewer audio (system audio capture)
  └→ Transcribe candidate audio (microphone)
  
  ↓
pages/interview.js (React component)
  ↓
POST /api/chat (pages/api/chat.js)
  ├→ Question Analysis Layer
  ├→ Knowledge Retrieval Layer
  ├→ Prompt Construction Layer
  ├→ LLM Generation Layer
  └→ Answer Evaluation Layer (no second LLM call)
  
  ↓
Streaming SSE Response
  ↓
Client renders answer + AnswerQualityPanel
```

## Core Architectural Constraints

### Single-Pass Generation (Hard Constraint)

- No second LLM call
- No answer regeneration or rewriting stage
- No multi-turn refinement loop
- **Rationale:** Live interview setting has strict latency requirements. Answer embellishment risk is higher with regeneration. Model-based answer quality already factors into prompt design and retrieval quality.

### Knowledge-First Data Flow

- Runtime retrieval queries only the `knowledge/` directory markdown repository
- Raw PDFs, DOCX, TXT are used only during knowledge authoring (outside the running system)
- No open-ended model general knowledge — all context is retrieval-grounded
- **Rationale:** Ensures reproducibility, auditability, and control over answer grounding. Interview tool must never make up facts.

### Single Query Vector per Question

- Question is embedded once into a vector
- All chunks scored independently against this single vector
- No multi-query expansion or query reformulation
- **Rationale:** Simplicity and determinism. Trade-off: comparison questions ("difference between X and Y") don't reliably surface both docs in top-K (known limitation, documented).

## Component Architecture

### 1. Knowledge Platform (`knowledge/` directory)

**Purpose:** Single source of truth for all interview answers.

**Structure:**
- 20 semantic domains: `security/`, `grc/`, `s4hana/`, `btp/`, `rise/`, `idm/`, `fiori/`, `bw/`, `cloud/`, `project-management/`, `project-types/`, `interview-scenarios/`, `behavioral/`, `leadership/`, `troubleshooting/`, `audit/`, `compliance/`, `transports/`, `cutover/`, `hypercare/`
- 110 markdown files total, one fixed 24-section template per file
- Cross-linking via `## Related Topics` instead of content duplication

**Template sections (24 total):**
1. Overview — context-setting paragraph
2. Interview Summary — elevator pitch
3. 30/60/90 Second Answers — tiered depth
4. Architecture — system components
5. Runtime Flow — how it works operationally
6. Configuration — how it's set up
7. Implementation Activities — what consultants do
8. Migration Activities — upgrades and cross-release changes
9. Rollout Activities — multi-site/multi-entity deployments
10. Production Support Activities — day-to-day ops
11. Troubleshooting — common issues and fixes
12. Common Interview Questions (20+)
13. Tough Follow-up Questions (20+)
14. SAP Transactions
15. SAP Tables
16. Best Practices
17. Common Mistakes
18. Interviewer's Hidden Expectations
19. What Makes This a 10/10 Answer
20. Red Flags (warning signs of weak knowledge)
21. Keywords
22. Related Topics

**Content Philosophy:**
- Written in natural spoken English for a live interview (not documentation style)
- No fabricated personal experience (implementation activities are generic consultant responsibilities)
- Technically accurate, SAP-correct, up-to-date for current SAP releases
- Each file stands alone with sufficient context (no requirement to read other files first)

### 2. Knowledge Indexing Pipeline

**Flow:** `knowledge/` scan → parse → chunk → embed → index build → saved to disk

**Components:**

#### `services/knowledgeService.js`
- Recursively scans `knowledge/` directory for `.md` files
- Parses markdown into structured document + heading-level sections
- Output: structured knowledge objects (documentId, filename, sections with content)
- **Note:** No document references are cached; scans the filesystem every time the app loads or index rebuild is triggered

#### `services/chunkService.js`
- Markdown-aware chunking: respects heading boundaries
- Produces semantic units (not arbitrary token windows)
- Each chunk includes:
  - Chunk text
  - Source document path
  - Heading hierarchy (h2, h3, h4 context)
  - Section name (e.g., "Common Interview Questions")
- **Design decision:** Preserve structure to enable scoring by section type (e.g., bonus points for chunks from "30 Second Answer" sections)

#### `services/embeddingService.js`
- Uses local `@xenova/transformers` library (no external API calls)
- Generates embeddings client-side on the server (runs in Node.js, not browser)
- Default model: Xenova's local transformer (no OpenAI, no Gemini embedding API)
- **Rationale:** No dependency on external embedding services, no latency risk, no API key required, fully reproducible

#### `services/knowledgeIndexService.js`
- Orchestrates full indexing pipeline: scan → parse → chunk → embed
- Incremental rebuild detection via content hash
- Stores index to `data/knowledgeIndex.json`
- Includes version metadata: `PARSER_VERSION`, `CHUNK_VERSION`, `EMBEDDING_VERSION` (triggers full rebuild if any change)
- Called at build time (`node scripts/buildKnowledge.js`) and optionally at runtime

**Index structure (in `data/knowledgeIndex.json`):**
```javascript
{
  version: "1.0",
  builtAt: "2025-...",
  documents: [
    {
      id: "security/sap-security",
      path: "knowledge/security/sap-security.md",
      filename: "sap-security.md",
      title: "SAP Security",
      chunks: [
        {
          id: "chunk_0",
          text: "...",
          heading: "## Overview",
          sectionName: "Overview",
          embedding: [...768-dim array...]
        },
        // ... more chunks
      ]
    },
    // ... more documents
  ]
}
```

### 3. Retrieval Pipeline

**Purpose:** Given a question, find the most relevant markdown sections to inject into the prompt.

**Flow:** Vector search + Lexical search + Component scoring + Intent scoring → Ranking → Deduplication

**Components:**

#### `services/retrievalService.js` (Main retrieval orchestrator)

**Scoring system (query-aware):**

1. **Semantic Score** (vector similarity)
   - Embed the user's question (same model as chunk embeddings)
   - Cosine similarity between question vector and each chunk's embedding
   - Range: 0–1

2. **Lexical Score** (BM25-like)
   - Term frequency in chunk vs term rarity across all chunks
   - Rewards chunks containing exact question keywords
   - Range: 0–1

3. **Component Score** (SAP-specific bonus)
   - Detects if chunk mentions SAP components named in the question (S_TCODE, PFCG, S/4HANA, etc.)
   - Bonus: +0.1 if the question and chunk mention the same SAP component
   - Range: 0–1.1

4. **Intent Score** (heuristic)
   - Detects question intent (definition, troubleshooting, best-practice, comparison, etc.)
   - Bonus scores for chunks matching detected intent
   - E.g., "why does X fail" → bonus for troubleshooting sections
   - Range: 0–1.1

5. **Section Bonus**
   - Chunks from "30 Second Answer" sections get higher weight than "Common Mistakes" (candidate should nail the quick answer first)
   - Different question types get different section bonuses
   - Range: 0–0.15

**Final rank score:** `semanticScore * 0.4 + lexicalScore * 0.3 + componentScore * 0.15 + intentScore * 0.1 + sectionBonus`

**Deduplication:**
- Returns unique source documents (no more than one chunk per source document in top-K)
- Ensures retrieval breadth across different knowledge files

**Output:**
```javascript
{
  chunks: [
    {
      text: "...",
      score: 0.87,
      source: "knowledge/security/sap-security.md",
      section: "Overview",
      heading: "## Authorization Objects"
    },
    // ... top-K chunks
  ],
  timing: { embedding: 45, ranking: 12 } // milliseconds
}
```

#### `services/vectorSearch.js`
- Thin compatibility wrapper over `retrievalService`
- Provides legacy interface if needed, delegates to `retrievalService` for actual work
- **Design note:** Not a separate vector database (no Redis, no Pinecone). All vectors loaded from `knowledgeIndex.json` in memory.

#### `lib/container.js` (Dependency injection)
- Wires up all service instances
- Singleton pattern for embeddings, index, retrieval
- Ensures single in-memory copy of the knowledge index

### 4. Question Analysis Layer

**Purpose:** Understand the question before retrieval, to improve scoring and component detection.

**Components:**

#### `lib/interviewAnalyzer.js`
- Detects question category (definition, troubleshooting, architecture, best-practice, comparison, scenario, etc.)
- Extracts named SAP components (S_TCODE, PFCG, GRC, BW, etc.)
- Detects question intent (what/how/why, implementation, production support, etc.)

#### `lib/reasoningPlanner.js`
- Determines multi-step reasoning path if question is complex
- Flags "comparison" questions for special handling
- Plans whether multiple retrieval passes are needed (not currently implemented; single pass only)

#### `lib/componentSelector.js`
- Builds a whitelist of relevant SAP components for this question
- Used by component-scoring logic in retrieval

#### `lib/interviewerProfiler.js`
- Estimates question depth based on wording, number of named topics, and interview context
- Helps score whether a "30 Second Answer" section is appropriate or if the candidate needs "90 Second" depth

#### `lib/technicalReasoner.js`
- Builds a technical reasoning context (not sent to LLM, used locally)
- Identifies whether question is about architecture, configuration, troubleshooting, etc.

### 5. Prompt Construction Layer

**Purpose:** Build the final prompt that gets sent to the LLM for generation.

**Components:**

#### `lib/prompt/interviewPrompt.js`
- Main prompt builder
- Takes:
  - User's question
  - Retrieved knowledge context (chunks)
  - Candidate's resume (if available)
  - Interview context (how deep should the answer go)
- Constructs system prompt + user message
- **Key principle:** Prompt should be reproducible from markdown content (not emergent from model knowledge)

#### `lib/prompt/speechOptimizer.js`
- Optimizes prompt for spoken delivery (not written text)
- Removes markdown formatting, excessive bullets, overly technical jargon density
- Adds pacing cues (natural pauses, breath points)
- Ensures answer sounds natural when read aloud by TTS

#### `lib/prompt/README.md`
- Subsystem design document (doesn't repeat details here)
- Covers prompt architecture, design principles, special handling for different question types

### 6. LLM Generation Layer

**Location:** `pages/api/chat.js`

**Flow:**
1. Receive POST request with question, model, optional API key
2. Run question analysis
3. Retrieve knowledge context
4. Construct prompt
5. Check `LLM_VALIDATION_MODE`:
   - If `retrieval-only`: return diagnostic SSE event (no LLM call, no cost)
   - If `full`: stream response from LLM (OpenAI or Gemini)
6. Stream tokens back to client via SSE

**Provider routing:**
- Model name starts with `"gemini"` → Gemini API
- Otherwise → OpenAI API
- Configuration in `config/appConfig.js` via env vars (optional, client-supplied key takes priority)

**Streaming:**
- All responses are streamed SSE (Server-Sent Events)
- Allows real-time token display and TTS synthesis on client
- No buffering the entire response before sending

### 7. Answer Evaluation Layer

**Purpose:** Post-generation evaluation (no second LLM call).

**Components:**

#### `lib/prompt/evaluation.js`
- Heuristic-based scoring: **not** LLM-based
- Checks:
  - Did the answer mention the key SAP components from the question?
  - Did the answer mention architectural concepts appropriate to the question depth?
  - Does the answer contradict the resume (e.g., claims experience with component they didn't mention)?
  - Is the answer length in a reasonable range for the question type?
- Output: structured evaluation with weaknesses flagged

#### `lib/prompt/scoring.js`
- Converts evaluation into a 0–100 quality score
- Feeds into `AnswerQualityPanel` on the client (shows confidence/quality indicator)

#### `lib/prompt/followupAnalyzer.js`
- Suggests follow-up questions based on answer quality
- If answer seemed weak, recommends follow-ups to probe deeper

### 8. Client-Side Layer

**Components:**

#### `pages/interview.js` (React, main page)
- Audio capture (system audio + microphone via Azure Speech SDK)
- Question transcription display
- Streams and renders LLM response in real time
- TTS synthesis of answer (optional, for audio playback)
- Calls `/api/chat` endpoint

#### `components/AnswerQualityPanel.js`
- Displays visual confidence/quality indicator
- Shows what knowledge was retrieved
- Suggests follow-up questions if answer was weak

#### `utils/config.js`
- Client-side configuration (API base URL, model selection, API key entry)
- Never has access to server-side env vars

#### `components/SettingsDialog.js`
- User settings: API provider (OpenAI/Gemini), model selection, API key entry (BYOK)
- Settings are client-side only (sent per-request in headers)

## Data Flow: Complete Request Cycle

```
1. User speaks question → Azure Speech SDK transcribes → interview.js receives text

2. POST /api/chat with { question, model, apiKey? }

3. pages/api/chat.js:
   a. Analyze question (category, components, intent)
   b. Retrieve relevant knowledge chunks
   c. Construct prompt with context
   d. If LLM_VALIDATION_MODE=retrieval-only: send diagnostic event (stop)
   e. If LLM_VALIDATION_MODE=full: call LLM with prompt

4. LLM streams tokens back

5. pages/api/chat.js streams tokens to client via SSE

6. Client receives tokens, displays in real time
   - Optionally: TTS synthesis for audio playback
   - AnswerQualityPanel shows evaluation

7. Answer complete
```

## Configuration

**Environment variables** (read once in `config/appConfig.js`, available in `pages/api/chat.js`):

```bash
LLM_VALIDATION_MODE=retrieval-only      # or "full" for real generation
OPENAI_API_KEY=...                       # optional server-side fallback
GEMINI_API_KEY=...                       # optional server-side fallback
OPENAI_MODEL=gpt-4o-mini                 # fallback default model
LLM_PROVIDER=openai                      # label only (for documentation)
NODE_ENV=development                     # or "production"
```

**Client-supplied keys** (via Settings dialog):
- Sent per-request in headers
- Always takes priority over env vars
- Enables bring-your-own-key (BYOK) design

## Design Decisions and Trade-Offs

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| Single query vector per question | Simplicity, determinism, reproducibility | Comparison questions don't reliably surface both docs |
| In-memory vector search (no vector DB) | No external dependency, fast for current scale (110 files), simple deployment | Won't scale to 100k+ documents; eventual vector DB needed |
| Local embeddings (@xenova) | No API latency, no external service dependency, no API key needed | Limited to CPU performance; can't use larger/better embedding models |
| Single-pass generation | Minimize latency for live interview | No refinement loop; answer quality depends on first-pass prompt quality |
| Markdown knowledge base only | Reproducibility, auditability, control | Requires active knowledge maintenance; no emergent model knowledge |
| Heuristic answer evaluation | No second LLM call | Lower precision; regex-based confidence checks only |
| Semantic domain folder structure | Self-documenting knowledge base | Requires judgment on which domain owns each topic; some overlap unavoidable |

## Known Limitations

1. **Comparison questions** ("difference between X and Y")
   - Each chunk scores independently against a single query vector
   - One topic's chunks can crowding out the other's even when both relevant
   - Workaround: craft retrieval to return broader context, or improve question analysis to handle comparison intent

2. **Experience consistency heuristic**
   - Regex-based pattern matching (looks for component name in resume text)
   - Not semantic; can't understand "worked on SAP security but didn't mention PFCG by name"
   - Low-confidence flag, not a hard blocker

3. **No rate limiting on /api/chat**
   - Flagged in PRODUCTION_READINESS.md
   - Acceptable for internal tool; needs attention before public deployment

4. **Vector search scale**
   - Current in-memory approach works for ~110 docs, ~5k chunks
   - Will need vector database (Pinecone, Weaviate, local Qdrant) for 10k+ chunks or high-traffic deployment

## Performance Characteristics

**Latency targets** (typical):
- Question analysis: 50–100ms
- Vector embedding: 100–150ms
- Retrieval (search + ranking): 50–100ms
- Prompt construction: 20–30ms
- LLM generation: 2–5 seconds (network + model latency)
- **Total end-to-end:** target <5 seconds (retrieval + generation)

**Index building:**
- Scan + parse + chunk: ~50ms per document
- Embedding generation: ~500ms per document (depends on chunk count and transformer performance)
- Full index rebuild: ~2–5 minutes for 110 documents

**Memory footprint:**
- In-memory index: ~50–100MB (depends on chunk count and embedding dimensionality)
- Process RSS: ~300–500MB (Node.js + dependencies)

## Deployment Considerations

See [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) for:
- Environment setup
- API key configuration
- Retrieval-only vs full LLM mode
- Secrets management
- Verified security posture

---

**Last updated:** See CHANGELOG.md for most recent entry.
