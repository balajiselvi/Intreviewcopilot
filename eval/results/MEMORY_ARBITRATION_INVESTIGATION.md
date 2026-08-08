# Memory Arbitration Investigation

Cognitive debugging, not retrieval debugging, per explicit direction: the composite claim found
in `ENGINEERING_MEMORY_STEP5_CHAT_INTEGRATION.md` ("320 rules across 11 countries" — 320 from
the seeded Engineering Memory record, 11 countries from the unrelated `CANDIDATE_BACKGROUND`
text) is evidence of memory *synthesis*, not evidence that retrieval failed. This investigates
how the model chooses — or fails to choose — between multiple valid memory sources before
language generation. No prompt files touched. No new records seeded beyond the one test record.
No UI work. Investigation only, per instruction.

## Dimension 1: how many Engineering Memory records were active?
Answered by code inspection, not a test run: `searchEngineeringMemory()` is called with
`topK: 3`, but only ONE Judgment Record existed in the store for the entire prior test. A
`.slice(0, 3)` on a 1-item array returns exactly that 1 item. **Confirmed: exactly 1 record was
ever active.** This rules out intra-Engineering-Memory competition (multiple retrieved records
fighting each other) as a contributing factor here — whatever is happening, it isn't that.

## Dimension 4 (checked before running new experiments, since it's answerable by inspection too):
does any instruction ask the model to arbitrate between sources?
`grep -n "ENGINEERING MEMORY" lib/prompt/interviewPrompt.js` returns exactly one match: the line
that pushes the section itself. **Zero instructions anywhere in `ROLE & RULES` (or any other
section) reference `ENGINEERING MEMORY` by name.** The existing experience-check instruction
("FIRST, before anything else: does CANDIDATE BACKGROUND above contain genuine experience...")
was written before Engineering Memory existed and was never extended to mention it. This is a
literal, confirmed gap, not a theory: **the model was never told Engineering Memory is a second
place to check for real experience.**

## Dimension 2 & 3: does removing the competing source unlock coherent Engineering Memory usage?
Tested behaviorally against the live endpoint (n=5), with the seeded record present, the model
never told about it via any name (per dimension 4's finding), only through the prompt content
itself:

| Condition | Uses the actual seeded decision (derived roles vs. global role) | Cross-source blending |
|---|---|---|
| **B: Engineering Memory alone** (no `candidateResume` at all) | **1/5** | 0/5 (nothing to blend with — sanity check) |
| **C: Both sources together** (the live wiring, from the prior step's n=5) | 0/2 on full manual read; 1 sample showed cross-source number blending | Observed |

**This is the key finding, and it complicates the pure "sources compete" framing:** if
competition with `CANDIDATE_BACKGROUND` were the whole explanation, removing it should have
unlocked high, coherent use of Engineering Memory in Condition B. It didn't — usage stayed low
(1/5) even with nothing else to compete against. Reading all 5 Condition B answers in full: four
of them open with the exact same generic "structured approach... first, I would conduct a
comprehensive risk assessment using ARA" pattern seen everywhere else this session, completely
ignoring the seeded content even though it's the *only* candidate-specific material in the
prompt.

## Refined hypothesis
The mechanism isn't simply "two active sources compete for attention and get blended." It's
more specific: **the model's decision procedure for "should I speak from real experience" is
structurally anchored to `CANDIDATE BACKGROUND` by name, and Engineering Memory is not part of
that procedure at all** — not competing with it, just invisible to it. Two consequences follow,
matching both observed behaviors:
- When `CANDIDATE BACKGROUND` says "Not provided... knowledge-framing only" (Condition B), the
  model's experience-check short-circuits there and never separately evaluates whether the
  `ENGINEERING MEMORY` section (present in the very same prompt) contains something usable —
  explaining the persistently low 1/5 even in isolation.
- When `CANDIDATE BACKGROUND` IS present (Condition C, the live wiring), the model's one
  experience-check keys on it, and `ENGINEERING MEMORY`'s content gets absorbed opportunistically
  as loose facts floating in the prompt rather than reasoned from as its own coherent source —
  explaining why a stray number leaks through sometimes but the actual decision structure
  (situation → constraint → decision → rejected alternative) essentially never does, and why
  numbers from both blocks can end up merged into one claim with no source discipline governing
  either.

In short: this isn't (only) an arbitration-under-competition problem. It's that no arbitration
procedure exists for Engineering Memory in the first place — dimension 4's finding is the root,
and dimensions 2/3's results are its direct, measured consequence.

## What this is not
Not evidence Engineering Memory retrieval is broken (dimension 1 rules that out — exactly the
right, single, relevant record was retrieved every time). Not a GRC-specific quirk (the earlier
framing) — the mechanism identified here (an experience-check anchored to one named section) has
nothing GRC-specific about it and would presumably reproduce on any domain.

## Status
Diagnosis only, per instruction — no prompt refinement implemented, no additional records
seeded, no UI work. This finding (the experience-check is structurally scoped to
`CANDIDATE BACKGROUND` alone and never references `ENGINEERING MEMORY`) is precise enough to
motivate a specific, falsifiable next hypothesis, but implementing and testing that fix is a
decision for the next step, not taken here.
