# lib/prompt — Answer Quality Pipeline

## Design principles

1. **Knowledge vs. experience.** The model may state SAP/GRC technical knowledge confidently at
   any time. It may only phrase something as first-person experience ("I implemented...", "in my
   project...") when it's grounded in the candidate's real background (`candidateResume`).
   Ownership language is never invented — project names, client names, and specifics not present
   in the candidate's background must not appear. This is enforced in the prompt itself
   (`interviewPrompt.js`'s `ROLE & RULES` and `CANDIDATE BACKGROUND & CONTEXT` sections), not by
   the evaluator — the evaluator only audits it after the fact.
2. **Never a second LLM call, never regeneration.** Evaluation, scoring, and follow-up analysis
   are informational only. They run strictly *after* the answer has already streamed to the user
   and never trigger a rewrite. An earlier design that regenerated answers until they "survived"
   tough follow-up questions was explicitly rejected — it encourages embellishment and adds
   latency a live interview tool can't afford. Do not reintroduce either pattern here.

## Module map

| File | Role |
|---|---|
| `interviewPrompt.js` | Builds the single system prompt sent to the model (moved from the old `lib/sapInterviewPrompt.js`). |
| `speechOptimizer.js` | Duration/pacing/verbosity/tone guidance fed into the prompt (moved from `lib/answerStyleEngine.js`, with the previously-broken `buildAnswerStyle` export fixed). |
| `evaluation.js` | Post-hoc heuristic scorer — 7 of the 8 rubric categories (all but `followUpReadiness`). Pure regex/string checks, no LLM call. |
| `followupAnalyzer.js` | Template-based follow-up question generator + gap detection; produces the 8th rubric category (`followUpReadiness`). |
| `scoring.js` | Pure weighted-average arithmetic over the 8 category scores. No detection logic — weights live in config. |
| `index.js` | Orchestrator (`runPostAnswerEvaluation`) — the only symbol `pages/api/chat.js` imports from this directory. |

## Execution flow

```
client (pages/interview.js)
  → POST /api/chat
      → existing analyzers (unchanged): interviewAnalyzer, reasoningPlanner,
        componentSelector, interviewerProfiler, technicalReasoner, vectorSearch
      → interviewPrompt.js + speechOptimizer.js build ONE system prompt
      → single streamed LLM call (OpenAI/Gemini) — chunks written to the client as they arrive
      → on natural stream end (all content already delivered):
          index.js → evaluation.js + followupAnalyzer.js (pure JS, sub-millisecond)
                   → scoring.js (weighted average)
      → trailing `event: analysis\ndata: {...}\n\n` SSE frame, then `data: [DONE]\n\n`
  → client's SSE reader attaches the parsed `analysis` object to the history item
  → components/AnswerQualityPanel.js renders it under the answer
```

First-token and full-answer latency to the user are unaffected — evaluation only starts after
every content chunk is already on the wire, and any evaluator error is caught and swallowed
(the trailing event is simply omitted; the already-delivered answer is never affected).

## How to tune

- **Scoring weights/thresholds/phrase lists**: edit `config/appConfig.js`'s `evaluation` block.
  No code changes needed — `evaluation.js` and `scoring.js` read everything from there.
- **Follow-up questions for a category**: edit `FOLLOWUP_TEMPLATES` in `followupAnalyzer.js`.
  This is narrative content, not a tunable number, so (like `CATEGORY_TEMPLATES` in
  `interviewPrompt.js`) it lives in code rather than config.

## Known limitation

The `experienceConsistency`/`ownership` check in `evaluation.js` is a heuristic approximation,
not semantic verification: it flags ownership-sounding phrases and checks whether any mentioned
SAP component's name literally appears in `candidateResume`'s text. It cannot verify that a claim
is *true*, only that it's *plausible given the stated background*. The real anti-fabrication
mechanism is the prompt rule in `interviewPrompt.js`, not this score.
