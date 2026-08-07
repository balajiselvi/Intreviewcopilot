# Fix Validation: REASONING TEMPLATE / MANDATORY STRUCTURE / DOMAIN DEPTH grounding clauses

## Root cause (confirmed, not assumed)
`eval/ablationMatrix5.js` subdivided the "checkpoint A" block (RULES + REASONING TEMPLATE +
DETERMINISTIC CONSTRAINTS, which together broke 5/5 -> 0/5 at only 7.6KB) into its 3 parts,
added individually to the proven 5.5KB/5-of-5 core:

| Addition | Size delta | Hit rate |
|---|---|---|
| + RULES only | +1,295 | 0/5 |
| + REASONING TEMPLATE only | **+266** | **0/5** |
| + DETERMINISTIC CONSTRAINTS only | +601 | 5/5 |

REASONING TEMPLATE alone -- a ~90-byte category structure line -- independently suppressed
real-background usage, at less than half the byte cost of DETERMINISTIC CONSTRAINTS (which had
no effect). This disproves pure cumulative-size/density as the mechanism. The actual mechanism:
REASONING TEMPLATE (and, separately, MANDATORY STRUCTURE, and DOMAIN-SPECIFIC DEPTH) each give
the model an explicit "how to structure this answer" recipe that never mentions CANDIDATE
BACKGROUND -- and the model follows the explicit recipe over the separate, softer grounding
instruction stated earlier in the prompt.

## Fix tested and applied
`eval/ablationMatrix6.js`: adding one clause to REASONING TEMPLATE tying its structure back to
background ("If CANDIDATE BACKGROUND above covers this scenario, at least one step in this
structure must be grounded in its real scope or numbers, not left generic.") restored 5/5 in
isolation and in combination with RULES. Applied to `lib/prompt/interviewPrompt.js`:
- REASONING TEMPLATE section (the fix that was directly measured).
- MANDATORY STRUCTURE's "NAME 3-5 POINTS" instruction (same shape of defect, same fix pattern;
  also stripped the literal quoted examples the model was copying verbatim, per round 2).
- `getDomainDepthGuidance()`'s bullet list (same shape of defect, same fix pattern).
- `lib/prompt/speechOptimizer.js`'s `buildAnswerStyle()`: removed the hardcoded "Open in the
  tone of 'From an enterprise perspective'... close... 'That's the architectural pattern'"
  line, which directly contradicted the RULES banned-phrase list on 100% of requests
  (audienceLevel was hardcoded to 'architect', so this fired every time, not conditionally).
- `pages/api/chat.js`'s `isFollowUpUtterance()`: gated the FOLLOW_UP_PATTERNS check (which
  included bare "how"/"why") behind `history.length > 0`, so first-turn "How would you..."
  questions are no longer misclassified as follow-ups (which was also silently skipping RAG
  retrieval).

## Full-production validation (the honest result)
Small isolated/combined tests (5.5-7.3KB reconstructed prompts) hit 5/5 after the REASONING
TEMPLATE fix. Tested directly against the live `/api/chat` endpoint with the true, unmodified
production prompt (~17.5-17.8KB, every block present -- MANDATORY STRUCTURE, TECHNICAL
REASONING, INTERVIEWER CONTEXT, real retrieval, DETERMINISTIC CONSTRAINTS):

| State | n | Hit rate |
|---|---|---|
| Before any of today's fixes | 5 | 0/5 |
| After all 3 grounding-clause fixes + both bug fixes | 5 | 1/5 |

Real, measurable improvement (0/5 -> 1/5), not a full fix. The isolated-block tests do not fully
predict full-prompt behavior -- something in the full 17.5KB prompt still suppresses grounding
most of the time, most likely the RULES block (its own isolated fix attempt in
ablationMatrix6.js did NOT restore 5/5 on its own, unlike REASONING TEMPLATE's) and/or
TECHNICAL REASONING, neither of which has had the same grounding-clause treatment applied and
verified yet.

## Honest status
Real bugs fixed (follow-up misclassification, tonal contradiction) and real, evidence-based
improvement (0/5 -> 1/5) at full production size. Not solved. Next step, not yet done: apply
and test the same grounding-clause pattern to RULES specifically (its first attempted fix
failed in isolation, so it needs a different formulation, not just the same clause pattern
reused) and to TECHNICAL REASONING, verified against the live full-size endpoint each time
rather than assumed from isolated-block results.
