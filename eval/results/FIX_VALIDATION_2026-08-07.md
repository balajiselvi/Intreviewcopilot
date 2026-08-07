# Fix Validation: REASONING TEMPLATE / MANDATORY STRUCTURE / DOMAIN DEPTH / RULES / TECHNICAL REASONING grounding clauses

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
real-background usage, at less than half the byte cost of DETERMINISTIC CONSTRAINTS (no
effect). Disproves pure cumulative-size/density as the mechanism. Actual mechanism: several
sections (REASONING TEMPLATE, MANDATORY STRUCTURE, DOMAIN-SPECIFIC DEPTH, RULES, TECHNICAL
REASONING) each give the model an explicit "how to structure/what to include" recipe that
never mentions CANDIDATE BACKGROUND -- the model follows the explicit recipe over the softer,
separate grounding instruction stated earlier in the prompt.

## Fixes applied (lib/prompt/interviewPrompt.js, lib/prompt/speechOptimizer.js, pages/api/chat.js)
- REASONING TEMPLATE: one clause tying its structure back to background when applicable.
- MANDATORY STRUCTURE: same clause pattern on the "NAME 3-5 POINTS" instruction, plus stripped
  the literal quoted examples the model was copying verbatim (round 2 finding).
- `getDomainDepthGuidance()`: same clause pattern on the bullet list.
- RULES: a new, separate MANDATORY bullet requiring at least one real number/scope from
  CANDIDATE BACKGROUND when it covers the question (the first attempt -- softening the
  anti-fabrication line's wording alone -- did NOT work in isolation; this direct, forceful
  reformulation did).
- TECHNICAL REASONING: one clause tying the SAP component list back to real usage scope.
- `speechOptimizer.js`: removed a hardcoded tone directive that contradicted the RULES
  banned-phrase list on 100% of requests.
- `pages/api/chat.js`: `isFollowUpUtterance()` no longer misclassifies first-turn "how"/"why"
  questions as follow-ups (was silently skipping RAG retrieval).

## Full-production validation (live /api/chat, true ~17.5-17.8KB prompt, all sections present, real retrieval)

| State | n | Raw hit rate | Corrected hit rate |
|---|---|---|---|
| Before any fixes | 5 | 0/5 | 0/5 |
| + follow-up/tone fixes + REASONING TEMPLATE/MANDATORY STRUCTURE/DOMAIN DEPTH clauses | 5 | 1/5 | 1/5 |
| + RULES mandatory-grounding bullet + TECHNICAL REASONING clause | 5 | 4/5 | **5/5** |

The one apparent miss in the last round ("To effectively design... First, I would assess...")
was a test-harness regex gap, not a real miss: the answer said "in my recent project involving
an **11-country rollout**, we established a **250+ rule** segregation of duties (SoD)
framework" -- genuinely grounded, just phrased as "11-country" (hyphenated) instead of "11
countries", which the original `/11 countries|8,?700|45 systems|28 legal entities/i` regex
didn't match. Manually verified all 5 runs reference the real "11 countries" figure.

## Status: root cause confirmed and fixed, verified at true full production size
This is the first fully clean result -- not a partial one. The mechanism (explicit
structural/rule recipes silently competing with background grounding) is understood, the fix
pattern (one clause tying each such recipe back to CANDIDATE BACKGROUND) is validated across 5
different prompt sections, and the live endpoint holds 5/5 with the true production prompt,
not just isolated test combinations.

## Recommended follow-up (not blocking, not yet done)
- Re-run this same n=5 check across a few other categories/questions (not just the one
  multi-country Architecture question used throughout this investigation) to confirm the fix
  generalizes, since all tuning so far has been against a single question.
- Fix the eval harness's hit-detection regex to catch hyphenated number phrasing generally
  (e.g. `/11[\s-]?countr/i` style patterns) so future runs don't need manual miss inspection.
