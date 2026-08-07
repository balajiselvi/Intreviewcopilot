# Engineering Memory Platform — chat.js Integration: mechanical wiring works, value at full scale does not yet

Per the revised sequence: wire Engineering Memory retrieval into `pages/api/chat.js` before
building the acquisition UI, so the UI can be informed by real usage rather than assumptions.

## A real bug found and fixed: `__dirname` resolves wrong under Next.js's webpack bundling
`lib/engineeringMemory/store.js` originally resolved its data file paths via
`path.join(__dirname, "..", "..", "data")`. Diagnosed directly (not assumed) by writing the
resolved paths to a debug file at runtime: under Next.js's webpack bundling for API routes,
`__dirname` resolves to the **bundle's** location (`.next/server/pages/api`), not this source
file's real location. `RECORDS_PATH` was silently pointing at a nonexistent path the entire
time this was live -- `loadJudgmentRecords()`'s `if (!fs.existsSync(filePath)) return [];`
swallowed this with no error, so every retrieval call from the live chat pipeline silently
returned empty, while the exact same call from a plain `node` script (this project's own
offline tests) worked correctly, because plain `node` doesn't rewrite `__dirname`. Fixed by
switching to `process.cwd()`, matching the pattern `services/retrievalService.js` already uses
for `data/knowledgeIndex.json`. Confirmed fixed: the `ENGINEERING MEMORY` prompt section now
appears correctly in the live-dumped production prompt.

This is exactly the kind of defect offline unit tests cannot catch by construction (they never
run inside webpack) -- worth noting as a gap in the test strategy, not just a one-off bug.

## The honest result once the section actually reaches the model
With the path bug fixed and one Judgment Record seeded (the design doc's own worked example --
derived roles vs. global role, 320 SoD rules), the `ENGINEERING MEMORY` section is confirmed
present in the real, full production prompt (~18KB, every other section still active). n=5
against the live endpoint:

| Run | Cites a number from the seeded record | Actually uses the seeded DECISION (derived vs. global role) |
|---|---|---|
| 1 | Yes ("320... across 11 countries") | **No** |
| 2 | No | No |
| 3 | Yes | Not confirmed by full read |
| 4 | Yes | Not confirmed by full read |
| 5 | No | No |

Manually read runs 1 and 2 in full. Run 1's citation is not a clean win: it states "320
conflicting SoD rules across 11 countries" -- **320 comes from the seeded Judgment Record, 11
countries comes from the unrelated old `CANDIDATE_BACKGROUND` text**, merged into one composite
claim that matches neither source. Neither run 1 nor run 2 mentions the actual decision the
record exists to teach (derived role model chosen over a single global role, and why). The
isolated test's 90% leverage rate, which drove the decision to wire this in, has NOT been shown
to reproduce at full production scale on this domain -- consistent with, not contradicting, this
session's repeated finding that isolated prompt wins don't reliably survive merging into the
full ~17-18KB production prompt.

## Why this matters, and why it's not being silently patched
This is the same symptom class as the still-unresolved GRC finding from earlier this session
(`eval/results/LEVERAGING_BENCHMARK_2026-08-07.md`'s "GRC repair attempt" section): GRC/SoD-
remediation questions have shown unusual resistance to every kind of targeted prompt
intervention tried against the full production prompt, including a topic-filter fix and an
isolated alternative-generation instruction, both of which worked in isolation and both of which
failed at full scale. This is now a THIRD data point for the same open question ("why is this
specific domain so resistant"), not a new, unrelated problem -- and per that section's own
conclusion, it should not be patched with another guessed prompt tweak without a new,
specific, falsifiable hypothesis and its own controlled test.

The number-conflation risk (320 + 11 countries merged) is arguably more concerning than a clean
miss, since it's a small step toward the kind of plausible-but-inaccurate claim this entire
project has been built to prevent -- worth flagging explicitly rather than treating "it cited a
number" as success.

## Status
Mechanical integration (retrieval fires, section renders, section reaches the model) is DONE
and verified. Demonstrated VALUE at full production scale, for this domain, is NOT yet shown --
the opposite of what was hoped going in. Recommend: do not proceed to seeding a full
representative record set or building the acquisition UI on the assumption that this
integration already works end-to-end. The right next step is diagnostic (why does GRC
specifically resist this, across three independent interventions now), not another blind
seeding-and-hope pass.
