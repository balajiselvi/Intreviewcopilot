# V3.1 Shared Pipeline Call-Path Map

**HEAD:** `9a3b2da75fa9e2c7e3e528d446e2eb966ba404d2` · **Branch:** `feature/interview-engine-v2`  
**Mapped from:** `pages/api/chat.js`, `lib/generationGuard.js`, `lib/prompt/interviewPrompt.js` (read-only mapping; later corrections noted separately)

## Shared stages (not always linear)

```
Question
→ admission / turn routing (GENERATION when live)
→ retrieval → knowledgeContext / procedureText / preferDecision.spoken
→ procedure prefer (optional)
     → stripUngroundedSapEntities(candidate, grounding)
     → expectedSpokenAnswer = cleaned (kb-evidence-backbone when live)
→ prompt construction (interviewPrompt.js + expectedSpokenAnswer backbone)
→ LIVE LLM stream
→ stripUngroundedSapEntities(spoken, stripGrounding)
→ sanitizeUsageVsAssignmentPlanes (usage-history asks only)
→ postStripCoherenceCheck
→ recoverNonEmptySpokenAnswer(spoken, procedureSpoken←expectedSpokenAnswer|_spoken, …)
→ leakCheck findUngroundedTransactionClaims
→ concept / unsupported-detail / validateAndRecoverSpokenAnswer
→ sanitizeSpokenAnswer → answer_final / UI
```

## Shared functions

| Function | File | Shared? | Domains |
|---|---|---|---|
| `stripUngroundedSapEntities` | `lib/generationGuard.js` | Yes | All GENERATION paths that reach strip |
| `findUngroundedTransactionClaims` | `lib/generationGuard.js` | Yes | Recovery gate + post flags |
| `recoverNonEmptySpokenAnswer` | `lib/generationGuard.js` | Yes | When spoken empty/incomplete/ungrounded |
| `sanitizeUsageVsAssignmentPlanes` | `lib/generationGuard.js` | Yes | Usage-history asks only |
| `expectedSpokenAnswer` assignment | `pages/api/chat.js` | Yes | Prefer / verified / prepared |
| V3.1 prompt contract | `lib/prompt/interviewPrompt.js` | Yes | Senior technical domains |

## Conditional bypasses

- ANSWER_BANK / PREPARED_SCRIPT demoted to GENERATION when `llmMustGenerate` (live/mock).
- Usage-plane sanitize only if `isTransactionUsageHistoryAsk`.
- Procedure prefer may be absent → no `expectedSpokenAnswer` backbone.
- Recovery skipped when spoken validates (`answer_kind:validated`).

## Critical prefer-strip branch (PFCG Q1)

`chat.js` ~2460–2495: cleans KB procedure with `stripUngroundedSapEntities`.  
If grounding omits identifiers present only in the procedure candidate, strip hollows sentences; cleaned value becomes `expectedSpokenAnswer` and may later be served by recovery.
