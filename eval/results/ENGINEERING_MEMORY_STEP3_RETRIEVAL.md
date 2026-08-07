# Engineering Memory Platform — Step 3: Retrieval Integration

Per `docs/EXPERIENCE_ACQUISITION_ENGINE_DESIGN.md` section 10: retrieval tested via the same
before/after leverage-rate measurement used throughout this session. Not yet wired into
`pages/api/chat.js` — this validates the mechanism in isolation (real `CANDIDATE_BACKGROUND` +
the new rendered section + question, generated directly, not through the live endpoint). Full
production-scale wiring and re-verification is a separate, later step, per this session's
repeated finding that isolated wins don't always survive merging into the full prompt.

## What was built
- `services/vectorSearch.js`: widened exports only (no behavior change) so the scoring formula
  could be reused rather than duplicated.
- `lib/engineeringMemory/embed.js`: canonical text renderings + lazy on-demand embedding.
- `lib/engineeringMemory/retrieval.js`: `determineMemoryNeeded()` (deterministic category
  lookup, section 5.2), `synthesizeMemoryQuery()` (problem-frame-driven, section 5.3),
  `searchEngineeringMemory()` (same scoring formula as `vectorSearch.js`, plus a
  `recall_confidence` penalty, section 5.4), `renderEngineeringJudgmentSection()` (section 5.5,
  including the low-confidence hedging instruction).

## Test
Seeded exactly one Judgment Record (the design doc's own worked example — derived roles vs.
global role, 320 SoD rules) for the GRC question that has been stuck at 10% leverage all
session. First confirmed retrieval actually finds its own directly-relevant seed (a hard
blocker check — the script aborts before generating any eval data if this fails, rather than
producing misleading numbers from broken retrieval). Then generated n=10 answers with the
retrieved judgment rendered into the prompt, judged against the same reused (unmodified)
control answers with the same (unmodified) v2 leverage judge.

| | Leverage rate |
|---|---|
| Baseline (no Engineering Memory) | 10% |
| With 1 seeded, directly-relevant Judgment Record | **90% (9/10)** |

Manually spot-checked a LEVERAGED verdict in full: the answer genuinely proposes "a master role
with country-specific derived roles... instead of a single global role," and the judge correctly
identifies this as diverging from the generic control pattern — not a rubber-stamped mention.

## Caveats, stated plainly
- Best-case test: the seeded record was maximally relevant to the question by design. An
  adversarial test (does an irrelevant record get correctly NOT retrieved / not forced into the
  answer) is a reasonable follow-up, not yet run.
- This is still an isolated-prompt result. Given this session's history, it is not assumed to
  reproduce at full production prompt size until actually wired in and re-measured there.

## Status
Step 3 complete and verified at the mechanism level. Not wired into the live app.
