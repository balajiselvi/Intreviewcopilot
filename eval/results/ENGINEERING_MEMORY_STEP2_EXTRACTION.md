# Engineering Memory Platform — Step 2: Extraction Pipeline (offline validation)

Per `docs/EXPERIENCE_ACQUISITION_ENGINE_DESIGN.md` section 10: validated offline against
hand-written transcripts before touching any live conversation. No wiring into
`pages/api/chat.js` or any acquisition UI in this step — `lib/engineeringMemory/extraction.js`
only, exercised via `eval/testEngineeringMemoryExtraction.js`.

## Method
Three hand-written transcripts, each targeting one specific claim from the design doc, not a
generic smoke test:
- **Transcript A** — two genuinely distinct decisions in one narrative, with a deliberate decoy
  use of the word "alternative" in the second decision where no real alternative was rejected.
  Tests segmentation correctness AND the fabrication guard adversarially (a naive extractor
  could easily invent an alternative just because the word appears in the source text).
- **Transcript B** — a production incident with no alternative considered and no sentence framed
  as a generalized lesson, only an outcome. Tests that `alternative_rejected` and
  `lesson_learned` stay `null` rather than getting fabricated to "complete" the record.
- **Transcript C** — explicit, repeated hedging language about facts ("I think," "I don't
  remember the exact numbers," "roughly," "I'm fairly sure," "I don't recall"). Tests
  `recall_confidence` detection specifically — the feature explicitly called out as the
  favorite addition in review.

## Round 1: two real bugs found, not assumed fixed

**Bug 1 — segmentation over-split a single incident.** Transcript B, which describes one
coherent situation→decision→outcome arc, was split into 3 spans. The outcome sentence ("After
that we didn't have another lapse like it") ended up isolated from the situation it belonged to
and produced a useless all-null record. Root cause: the segmentation prompt's original
instruction only weakly discouraged this. Fixed by adding an explicit anti-fragmentation rule
("if a span would be meaningless without having seen the previous span, merge it back") and a
concrete test the model must apply before finalizing any split.

**Bug 2 — `recall_confidence` returned "high" despite blatant hedging.** Initial hypothesis was
instruction competition (the same "isolate a competing instruction as its own step" pattern
that fixed several production-prompt issues earlier this session), so `recall_confidence` was
pulled out of the main extraction call into its own dedicated `classifyRecallConfidence()` call.
**That fix alone did not work** — re-testing showed `recall_confidence` was still "high."
Investigating the actual span text (not just the printed preview) revealed the real bug was
upstream: segmentation's "trim leading/trailing filler" instruction was treating the entire
hedging sentence ("This was a while back, I think maybe two or three years... I don't remember
the exact numbers... something like two thousand users, roughly") as disposable preamble and
discarding it before extraction ever saw it. The recall-confidence classifier was working
correctly on the input it was given — the input was wrong. Fixed by restricting the "trim
filler" permission to pure discourse filler only ("so," "okay") and explicitly forbidding
trimming any sentence that hedges on facts.

This is recorded because the first fix attempt (isolating the instruction) was a reasonable
hypothesis drawn directly from this session's prior findings, and it was wrong for this specific
case — the actual defect was one layer upstream. Verifying against the real span text before
declaring the fix successful is what caught it, consistent with this project's established
discipline of not trusting a plausible-sounding fix without checking the actual data.

## Round 2: all three transcripts verified correct

| Transcript | Check | Result |
|---|---|---|
| A | 2 spans, span 1 has real `alternative_rejected` | ✅ |
| A | Span 2's `alternative_rejected` is `null` despite decoy "alternative" text | ✅ (fabrication guard held on both rounds) |
| B | Segments into 1 coherent span, not 3 | ✅ (fixed) |
| B | `alternative_rejected` null, `lesson_learned` null (outcome correctly separated from lesson) | ✅ |
| C | `recall_confidence` = "low" | ✅ (fixed) |

Full transcripts, prompts, and raw model output in
`eval/results/engineering_memory_extraction_test.json`.

## Status
Step 2 of the Version 1 build order is complete and verified offline. Not yet wired into any
live conversation or acquisition UI — that's step 3 (retrieval) and step 4 (acquisition UI) per
the build order, in sequence, each with its own gate.
