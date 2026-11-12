# Architecture X-Ray & InterviewCopilot V2 Clean-Room Plan

**Date:** 2026-11-05  
**Source (legacy, preserved):** `D:\My Projects\InterviewCopilot`  
**Target (clean-room):** `D:\My Projects\InterviewCopilot_V2`  
**Constraint:** Original tree treated as read-only during extraction (this report is the only intentional write into legacy root for this workstream).

---

## 1. Current request lifecycle (legacy V1)

Exact production path for a typed/live interview question:

```
UI pages/interview.js (~1982 lines)
  → POST pages/api/chat.js (~3301 lines)
    → interviewContext / questionAdmission / turnDecision / safeModeRouter
    → analyzeInterviewQuestion (lib/interviewAnalyzer.js)
    → buildReasoningContract (lib/reasoningPlanner.js)
    → selectSapComponents (lib/componentSelector.js)
    → buildTechnicalReasoning (lib/technicalReasoner.js)
    → profileInterviewer (lib/interviewerProfiler.js)
    → searchKnowledge (services/vectorSearch.js)  [TOP_K typically 3–4]
    → procedureRetention / shouldPreferRetrievedProcedure
    → buildSapInterviewPrompt (lib/prompt/interviewPrompt.js ~1379 lines)
    → OpenAI / Gemini / Anthropic stream (tokens buffered, not shown live)
    → stripUngroundedSapEntities (lib/generationGuard.js ~1047 lines)
    → recoverNonEmptySpokenAnswer / sanitizeSpokenAnswer
    → evaluateAnswerConceptCoverage (lib/knowledgeCoverage.js)
    → validateAndRecoverSpokenAnswer (lib/answerIntegrityGate.js)
      → may REPLACE answer with buildDirectTechnicalFallback(...)
    → SSE answer_final + UI render
```

Supporting planes also in the hot path: session store, verified workflow short-circuits, prepared spoken scripts, expertise cards (`eval/lib/expertiseCards.js` imported into production chat), engineering memory, scenario timeline, Layer-7 clarification.

### Scale indicators (legacy)

| Asset | Approx size |
|---|---|
| `pages/api/chat.js` | ~3,301 lines |
| `lib/prompt/interviewPrompt.js` | ~1,379 lines |
| `lib/generationGuard.js` | ~1,047 lines |
| `pages/interview.js` | ~1,982 lines |
| `lib/` | ~83 files |
| `eval/` | ~561 files (harnesses, jsonl, acceptance debt) |
| `knowledge/**/*.md` | ~167 markdown docs (gold) |
| Working tree | ~408 dirty porcelain entries |

---

## 2. Root cause of shallow / degraded answers

Depth is not lost primarily because the KB is empty. It is lost **after** (and sometimes **before**) a capable LLM completion, through stacked middlewares:

### 2.1 Aggressive retrieval clipping

- `TOP_K_BY_CATEGORY` in `chat.js` defaults to **3–4 chunks**.
- Vector search returns short chunk windows, not full architect-bank sections.
- High-value procedure text can lose sibling headings unless `procedureRetention` enrichment fires.

### 2.2 Prefer-strip → hollow recovery (proven defect class)

- Path: `preferDecision.spoken` → `stripUngroundedSapEntities` → optional `recoverNonEmptySpokenAnswer`.
- Incomplete grounding caused AGR table names to be stripped → hollow phrases like `"Review table for…"`.
- Mitigations were layered on (`isDestructiveEntityStripResult`, WELL_KNOWN keep-lists) — treating symptoms of an over-zealous stripper.

### 2.3 Integrity / concept gates that **replace** good answers

- `evaluateAnswerConceptCoverage` + `validateAndRecoverSpokenAnswer` can mark a legitimate answer as failing (e.g. plural `"Critical Actions"` vs singular regex) and **swap in** `buildDirectTechnicalFallback`.
- Fallbacks are shorter, flatter, and sometimes **wrong-plane** (e.g. IPS-shaped lifecycle for an IDM-intent question).

### 2.4 Conflicting prompt pressure

- V3.1 adaptive contract coexists with reasoning templates, mode structures, plane locks, procedure prefer, safe-mode, and bank cues.
- Token budgets (`getMaxTokensForCategory`) historically truncated deep architecture answers.
- “Ban fluff” + “conditional artifacts” + recovery fallbacks interact unpredictably.

### 2.5 Observability gap

- Provider tokens buffered; UI only sees post-integrity text.
- Until late harness work, `rawProviderHint` was hardcoded `null`, hiding whether depth died in the model or in post-processing.

**Diagnosis (one sentence):**  
Legacy V1 optimizes for **risk avoidance via mutation** (strip / recover / replace) rather than **high-context generation with light validation**, so Principal-Architect technical artifacts are the first casualties.

---

## 3. File inventory classification

### KEEP (Gold Assets)

| Class | Paths |
|---|---|
| Knowledge Base | `knowledge/**/*.md` (SAP Security, GRC, IAG, IDM, IAS/IPS, BTP, BW, S/4, Fiori, Activate, RISE, behavioral, etc.) |
| Master skill inventory | `c:\Users\balaj\OneDrive\Desktop\Core SAP Security & Authorizatio.txt` |
| CV / experience facts (reference) | `eval/lib/careerTimeline.js` (content reference only — not as production import spaghetti) |
| Env contract | `.env.example` |
| Dependency truth | `package.json` (trim for V2) |
| UI/audio intent | Speech SDK dependency + interview capture patterns in `pages/interview.js` (re-implement cleanly; do not copy 2k-line debt) |

### SIMPLIFY / REFACTOR

| Class | Legacy | V2 approach |
|---|---|---|
| Retrieval | `services/vectorSearch.js` + container + embeddings | Full-document / large-section keyword+overlap retrieval, Top-K higher, generous context budget |
| Prompt | `lib/prompt/interviewPrompt.js` | Single `src/prompts/principalArchitect.js` |
| Provider | Multi-provider branches inside `chat.js` | `src/core/llmProvider.js` with raw trace logging |
| API | 3k-line `chat.js` | Thin `pages/api/chat.js` → core pipeline |
| Router | analyzer + planner + reasoner + admission | Lightweight domain/intent router |

### DROP (Technical Debt) — do **not** copy into V2

- `lib/generationGuard.js` destructive strip / hollow recovery stacks
- `lib/answerIntegrityGate.js` answer-replacement recovery
- Concept-coverage false-fail → fallback replacement loops
- Safe-mode / verified-workflow / prepared-script short-circuit maze (eval fixtures only if needed later)
- Entire `eval/results/**` acceptance log forests, mock hooks, 500+ harness files
- Backup `*.backup-*`, `*.replace-backup-*`, worktrees, `.next*`, `node_modules`, `.claude-flow` runtime state
- Duplicate architect banks that are empty stubs (`leadership/*.md` zero-byte, etc.) — copy structure but prefer populated docs only

---

## 4. V2 Clean-Core target architecture

```
Question
  → Intent & Domain Router          (src/core/router.js)
  → Top-K Full-Context KB Retrieval (src/core/retrieval.js)
  → Senior Principal Architect Prompt (src/prompts/principalArchitect.js)
  → LLM Stream + raw trace          (src/core/llmProvider.js)
  → UI                              (src/ui + pages/interview.js)
```

**Hard rule:** No post-generation sanitizer may mutate or truncate valid technical explanations. Optional future validators may **flag** — never silently replace.

---

## 5. Extraction checklist (executed in this workstream)

1. Write this X-ray (done).
2. Scaffold `D:\My Projects\InterviewCopilot_V2`.
3. Copy `knowledge/` gold markdown + master skill inventory.
4. Implement streamlined core + prompt + API + minimal interview UI + one eval script.
5. Verify install/start scripts and document launch commands.

**Original `InterviewCopilot` remains intact** — no `git reset`, no `git clean`, no deletion of legacy sources.

---

## 6. V2 extraction status

| Item | Status |
|---|---|
| Clean-room root | `D:\My Projects\InterviewCopilot_V2` |
| Knowledge copied | 167 markdown files + `_master_skill_inventory.txt` |
| Destructive sanitizers | **Not present** in V2 pipeline |
| Boot | `npm install` succeeded; retrieval smoke OK; see V2 `README.md` for launch |
| File count (excl node_modules) | ~191 vs legacy lib+eval+pages alone ~660 |
