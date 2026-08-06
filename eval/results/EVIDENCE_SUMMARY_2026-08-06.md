# Evidence Summary — Session of 2026-08-06

Written as a handoff document at the end of a long evaluation session, before stepping away.
Everything below is stated with the confidence level it actually earned — proven, retracted, or still open.

## What is actually proven (survives the n=5 noise floor)

1. **The Critic→Improve→Judge pipeline is real infrastructure, working correctly.** `eval/lib/{critic,improver,judge,generateAnswer}.js`. This is an *offline evaluation harness* — it does not run live, and should not, because the live product is deliberately single-pass for interview-time latency.
2. **The Judge does not grade-inflate.** It reliably produces differentiated 6-7/10 scores rather than rubber-stamping 9s, which is what makes every measurement below meaningful rather than decorative.
3. **Two real, verified code bugs existed and are now fixed**, independent of what any single judge pass detects:
   - `services/vectorSearch.js`: `DOMAIN_BOOST_MAP` didn't contain the exact domain strings `interviewAnalyzer.js` actually emits (`"SAP Cloud Identity / BTP"`, `"SAP Platform"`), so domain-boost scoring silently never fired for BTP/IAS/IPS/IAG/S4HANA/HANA/BW questions.
   - `pages/api/chat.js`: `fetchKnowledgeContext` called `searchKnowledge(retrievalQuery, topK)` against a function signature of `(question, analysis, topK, options)` — the `topK` number landed in the `analysis` parameter slot. This meant `analysis.domain`/`analysis.primaryIntent` were `undefined` for **every single request, site-wide**, so domain/intent boost scoring was dead code everywhere, and the carefully tuned per-category `topK` values (`TOP_K_BY_CATEGORY`) were never actually applied — every request silently used the function's internal default instead.
   - Both fixes are correct and committed. Keep them regardless of benchmark impact — they are correctness defects, not optimizations.
4. **The knowledge build/reindex pipeline (`npm run build:knowledge`) was completely broken** — `config/appConfig.js` was missing 8 fields the pipeline code required (`indexFile`, `manifestFile`, `reportFile`, `schemaVersion`, `parserVersion`, `chunkVersion`, `embeddingModel`, `source`, `documentVersion`, `indexVersion`), causing an immediate crash before processing a single document. Live retrieval survived only because of an unrelated hardcoded fallback path. Fixed; verified working (113 documents, 2595 chunks, 0 errors).
5. **A stray Windows environment variable (`OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here`, a placeholder) was silently hijacking every OpenAI-bound production request**, causing bare 404 errors that looked identical to a credentials problem and cost significant time misdiagnosed as a billing issue. Fixed by reordering provider-selection priority in `pages/api/chat.js` to prefer an explicitly configured OpenAI key. Per your instruction, all provider keys now live only in `.env.local`, never in system environment variables.
6. **The live single-pass system does not push back on false interviewer premises.** Adversarial testing showed it complying with and elaborating on a factually incorrect claim about GRC ARM's default behavior, including citing a transaction code (`GRAC_SOD_RULES`) that a live web search could not confirm as real. This is the single highest-priority production risk identified this session — a candidate using this tool live could be led into confidently repeating unverified specifics.
7. **The measurement noise floor for this evaluation setup is real and non-trivial**: average within-domain standard deviation ≈0.18 across 5 runs (2σ ≈ 0.35), on the current build (real-CV grounding + both retrieval fixes applied). **Any single-run (n=1) delta smaller than ~0.35 is not distinguishable from ordinary generation variance and should not be reported as a proven effect.**

## What is retracted (measured at n=1, below the now-known noise floor)

- "Real-CV grounding: +0.16 avg" — retracted as a *proven* claim. It may be real; it was never validated at adequate sample size.
- "CV grounding + retrieval fix: +0.11 avg" — same retraction, same reason.
- The n=5 properly-measured mean across a 6-domain representative sample (SAP Security, SAP GRC, SAP BTP Security, HANA, SAC, Audit), on the *current, fully-fixed build with real-CV grounding applied*, is **6.93/10** — statistically identical to the very first baseline measured at the start of this evaluation effort, before any of the fixes above existed.

## What this honestly means

Every intervention tested this session that could be measured with any rigor — knowledge base expansion, generic experience categories, real CV grounding, the retrieval-layer bug fixes, a diagnostic-methodology prompt directive, a token-budget increase — has produced an effect at or below the noise floor when measured properly. The one exception: the token-budget increase, which produced a **clear, reproducible regression** (-0.66 on Production Support) and was correctly rejected.

This is not a conclusion that 9.0-9.5 is impossible. Per the Evidence Integrity policy governing this session, that conclusion is *not* supported by the evidence gathered — only the narrower, honest claim above is: **none of the interventions tried so far, at the sample sizes tested, have produced a statistically defensible improvement.** Several plausible levers remain genuinely untested at adequate rigor (see below).

## Additional experiments completed after the first version of this document (same session, continued overnight)

8. **Cross-domain retrieval boost, tested properly at n=3**: added a half-weight `RELATED_DOMAINS` boost to `computeDomainBoost` in `vectorSearch.js` (surfaces adjacent-domain content — e.g. Fiori/IDM context for a GRC question — the way real architect reasoning connects domains). Measured against the n=5 baseline for SAP GRC, SAP BTP Security, and HANA: deltas of +0.03, -0.20, 0.00 — all within the noise floor. **No measurable effect.** Kept the change anyway on independent merit (it's a reasonable retrieval improvement regardless of whether this judge detects it), but it is not a proven quality lever.
9. **The proposed 3-pass "generate → architect critique → interviewer judge → refine" live architecture was explicitly tested, not just discussed.** This is exactly what `eval/lib/{critic,improver,judge}.js` already do, reused directly. Measured at n=3 on the same 3-domain sample with real wall-clock timing per stage:
   - **Quality**: avg delta +0.14 vs single-pass — within the ~0.35 noise floor. Per-domain: SAP GRC -0.03, HANA +0.11, SAP BTP Security +0.35 (borderline, but stdDev 0.57 at n=3 — not solid evidence on its own).
   - **Latency**: single-pass avg 5.4s → 3-pass avg 22.6s. **A 4.2x multiplier.**
   - **Decision: reverted / not wired into the live path.** A 4.2x latency cost for a quality delta indistinguishable from noise fails on its own terms, independent of any architecture-freeze question. This was tested entirely through existing offline infrastructure, so no live code ever needed to change to get this answer — there was nothing to roll back.

## Updated bottom line

Nine independent interventions tested this session, eight of them properly measured against a real noise floor by the end: knowledge base expansion, generic experience categories, real CV grounding, two retrieval-layer bug fixes, cross-domain retrieval boost, a diagnostic-methodology prompt directive, a token-budget increase, and a full 3-pass generate-critique-improve-judge architecture. **One (token-budget increase) produced a clear, reproducible regression and was rejected. None of the remaining eight produced an effect that clears the noise floor at proper sample size**, including the specific 3-pass "self-reviewing expert" architecture proposed as the most promising remaining idea, which was fully implemented and measured, not just estimated.

This still does not prove 9.0-9.5 is unreachable — it means every mechanism tried so far, tested with real rigor, has not moved this specific 6-dimension judge on these 19 domains in a way that survives noise. The two things most likely to actually matter, based on everything gathered, are outside the scope of "try another retrieval or prompt tweak":

1. **Real story-level anecdotes**, not CV bullets — never supplied, never tested. This remains the most plausible lever nothing else has substituted for.
2. **Whether the judge rubric itself is asking a coherent question of a 150-300 word single-pass answer** — six dimensions including leadership on a HANA privilege config question is arguably measuring something a real architect's honest live answer wouldn't naturally hit either. This is a measurement-design question, not an implementation gap, and no amount of further implementation experimentation resolves it.

## Recommended next steps (in priority order)

1. Any further comparison test must run at **n≥3 per domain minimum**. This is now firmly established as a hard requirement, confirmed twice over (the original noise-floor measurement, and again by the cross-domain/3-pass results landing well within it).
2. Supply real story-level anecdotes and test their effect properly (n≥3) — the one lever left that hasn't been tried in its strongest form.
3. Decide, explicitly, whether the judge rubric should be reweighted by question type (e.g., leadership near-zero-weighted on pure config questions) — this is a measurement-validity question, separate from further implementation experiments, and no further code change will resolve it on its own.
4. Address the false-premise-compliance finding (#6 above) — a genuine production risk independent of the score-optimization work, and arguably higher priority than continuing to chase the benchmark.

## Current repo state

Working tree clean as of this document. All code changes and eval artifacts referenced above are committed to `feature/interview-engine-v2`. Dev server running locally with all fixes active.
