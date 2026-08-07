# Ablation Investigation: Experience-Activation Suppression

Question tested throughout: "How would you design the authorization architecture for a
multi-country S/4HANA rollout where each country has different regulatory requirements?"
Hit = real CANDIDATE BACKGROUND numbers ("11 countries", "8,700", "45 systems", "28 legal
entities") appear in the answer. n=5 per variant, gpt-4o-mini, temp=0.1.

## Prior known facts (before this investigation)
- Minimal 4.8KB standalone prompt: 5/5 (`isolateExperienceActivation.js`).
- Real production full prompt (captured via `DEBUG_DUMP_PROMPT`), trimmed to 15.5KB after
  removing unconditional domain-guidance bloat: 0/3.

## New finding 1: follow-up misclassification bug (real, independent, but not causal here)
`isFollowUpUtterance()` in `pages/api/chat.js` matches bare `"how"` / `"why"` as follow-up
openers via `normalized.startsWith("how ")`, **ungated by `history.length`**. A first-turn
question starting with "How would you..." is misclassified as a follow-up, which (a) skips
retrieval entirely (`knowledgeContext = ""`) and (b) injects "Do NOT ... repeat background
information." Confirmed by code read. **Verified empirically it does NOT explain the gap on
its own**: correcting only that one line (`verifyFollowUpBug.js`) still scored 0/5. Real bug,
still worth fixing (it affects most real "how"/"why" first-turn questions in production), but
not the mechanism behind the activation gap.

## Round 1 — single-block ablation (`ablationMatrix.js`)
Starting from the corrected (DIRECT MODE) 15.4KB baseline, removed exactly one block at a time:

| Variant | Size | Hit rate |
|---|---|---|
| Baseline (fixed) | 15,420 | 0/5 |
| − REASONING TEMPLATE | 15,207 | 0/5 |
| − INTERVIEWER CONTEXT | 14,945 | 0/5 |
| − TECHNICAL REASONING | 14,776 | 0/5 |
| − DETERMINISTIC CONSTRAINTS | 14,879 | 0/5 |
| − entire Decision Accountability reasoning sequence | 11,610 | 0/5 |
| − "SIMULATE BEFORE..." paragraph only | 14,231 | 0/5 |
| − DOMAIN-SPECIFIC TECHNICAL DEPTH | 14,908 | 0/5 |

No single block is "the" competitor — not even the largest, most abstract one.

## Round 2 — MANDATORY STRUCTURE / example-imitation hypothesis (`ablationMatrix2.js`)
~100% of all answers so far opened with a near-verbatim copy of the literal example string
inside MANDATORY STRUCTURE ("Sure, I'll walk through that from an implementation angle") —
evidence of example imitation, not instruction-following. Tested removing/neutralizing it:

| Variant | Size | Hit rate |
|---|---|---|
| − entire MANDATORY STRUCTURE block | 14,266 | 0/5 |
| Strip only the two literal quoted examples, keep the structural instruction | 15,310 | 0/5 |
| Same + explicit instruction linking the 3-5 named points to CANDIDATE BACKGROUND | 15,505 | 0/5 |

Removing the block that was visibly being imitated changed the imitated phrase, not the
underlying suppression.

## Round 3 — cumulative-strip test (`ablationMatrix3.js`)
Departure from strict one-at-a-time ablation, justified because every individually-tested
block failed to reproduce the effect on its own. Removed REASONING TEMPLATE + INTERVIEWER
CONTEXT + TECHNICAL REASONING + DETERMINISTIC CONSTRAINTS + MANDATORY STRUCTURE + the
banned-phrase RULES list + SPECIAL HANDLING FOR BEHAVIORAL **simultaneously**, keeping the
real (unmodified) CANDIDATE BACKGROUND block plus one short activation instruction:

| Variant | Size | Hit rate |
|---|---|---|
| Full baseline | 15,420 | 0/5 |
| Real background + minimal role instruction only | 5,471 | **5/5** |

## Conclusion
Confirmed, not assumed: suppression is a **cumulative instruction-density effect**, not
competition from any single named block. Every block tested alone is individually harmless;
together they suppress activation to ~0%. This rules out "trim the biggest offender" as a
strategy — there isn't one offender.

## Not yet done
Binary-search reintroduction: starting from the working 5.5KB prompt, add blocks back one at a
time (or in small groups) to find the largest feature-complete prompt that still holds a high
hit rate — i.e. find the actual threshold, not just prove it exists. That is the next concrete
step, not yet run.
