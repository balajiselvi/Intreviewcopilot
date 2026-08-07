# Architectural Leveraging Benchmark

Distinct from Experience Activation (frozen as of commit 49317ab -- activation measures whether
background FACTS appear in an answer). This measures something harder: whether the candidate's
real background genuinely changes the ENGINEERING REASONING, or is only cited as illustration
on top of a decision every generic answer would also make.

## Method
For each of 7 domains (GRC, BTP, HANA, Security, IDM, Fiori, Architecture), against the live
`/api/chat` endpoint:
- 3 CONTROL answers: same question, no `candidateResume` (the pipeline's real generic-mode
  output).
- 10 TEST answers: same question, real production `CANDIDATE_BACKGROUND`.
- Each TEST answer judged (LLM-as-judge, `eval/lib/evalLeveraging.js`) against the 3 controls
  with a counterfactual test: would this answer's actual engineering decisions collapse into
  the control pattern if the background were removed?
- Classification: LEVERAGED (a real decision fork resolved differently in kind than every
  control) / MENTIONED (background illustrates a decision every control also makes) / ABSENT.

Scripts: `eval/runLeveragingBenchmark.js` (generation + v1 judging), `eval/rejudgeLeveraging.js`
(re-judges the same saved answers with a revised judge, zero new generation calls).

## v1: judge heuristic collapse (a real finding, not a wasted run)
v1's judge prompt asked "would removing this detail make the answer more generic?" -- a
question almost any specific detail (real or decorative) trivially satisfies. Raw v1 result:
**91.4% average leverage rate**. Spot-checking v1's own evidence and `counterfactual_explanation`
fields showed it classifying pure decoration as LEVERAGED -- e.g. a GRC answer whose own stated
justification was "removing the specific project experience... would strip the answer of its
unique context and detail, making it more generic," which is the definition of MENTIONED the
judge had just been given, yet it selected LEVERAGED. v1's judge had collapsed back into the
same "did it mention something real" heuristic that Experience Activation already measures --
exactly the failure mode this benchmark exists to screen out.

## v2: single-variable re-judge (same data, tightened judge only)
Per this project's established experimental discipline: reused the exact same 91 live-generated
answers and control sets from v1 -- zero new generation calls -- and changed exactly one
variable, the judge's decision criteria:
- Requires naming a specific decision FORK (a point where more than one reasonable approach
  exists) and confirming every control answer resolves it the same way.
- Explicit hard calibration rule: citing a real number as an example of a step every control
  also takes, or naming a mainstream default tool (Azure AD as IdP, PFCG for roles, GRC ARA for
  SoD), does NOT count as leverage on its own -- naming the obvious default isn't evidence
  experience changed anything.

**Correction (2026-08-07, later pass):** the table below originally misreported Fiori as 10%
(actual: 0%), Security as 30% (actual: 20%), and the overall average as 41.4% (actual: 38.6%) --
a transcription error made when relaying console output to the user, not a bug in the script or
the saved data. The saved JSON (`eval/results/leveraging_benchmark_v2.json`) was correct
throughout; verified by recomputing each domain's leverage rate directly from its `judged[]`
array. Corrected values below.

| Domain | v1 Leverage | v2 Leverage | v2 Mentioned | v2 Absent | v2 Avg Quality | v2 Consistency |
|---|---|---|---|---|---|---|
| GRC | 100% | **10%** | 90% | 0% | 8.0 | 0.90 |
| BTP | 80% | **60%** | 40% | 0% | 8.0 | 0.60 |
| HANA | 100% | **70%** | 30% | 0% | 8.0 | 0.70 |
| Security | 100% | **20%** | 80% | 0% | 8.0 | 0.80 |
| IDM | 70% | **20%** | 80% | 0% | 7.8 | 0.80 |
| Fiori | 90% | **0%** | 100% | 0% | 8.0 | 1.00 |
| Architecture | 100% | **90%** | 10% | 0% | 8.0 | 0.90 |
| **Overall avg** | **91.4%** | **38.6%** | 61.4% | 0% | -- | -- |

Manually verified both directions of the shift: a flipped HANA case correctly identifies that
"11-country," "8,700 users" are attached to the exact same generic steps (define roles, analytic
privileges, integrate PFCG) every control answer also takes -- genuine decoration. A retained
Architecture LEVERAGED case names a specific, real fork ("global baseline roles adapted per
country" vs. pure per-country role design, present in the test answer but absent from all 3
controls) with a concrete, substantive justification.

## Reading the domain spread
- **Architecture (90%) and HANA (70%) leverage genuinely** -- these questions have more room for
  a real architectural fork (global-vs-local role strategy, GRC-integration-vs-PFCG-alone), and
  the candidate's real multi-country/large-landscape scope gives the model material for a
  substantively different answer.
- **GRC (10%) and especially Fiori (0%) barely leverage at all** -- for these questions, the
  model's default-competent answer and the "real experience" answer converge on the same
  textbook decision sequence (ARA -> remediation -> EAM controls; tile security -> CSP/CORS ->
  caching), with real numbers/tools bolted on as evidence rather than changing the
  recommendation.
- **Security (20%) and IDM (20%) are similarly low** -- generic role-design and provisioning
  questions where the obvious-best-practice answer and the experience-grounded answer are, in
  substance, the same answer.
- **0% ABSENT everywhere** -- confirms Experience Activation is working as intended (background
  is never simply missing); the gap is entirely in the MENTIONED-vs-LEVERAGED split, which is
  exactly the distinction this benchmark was built to isolate.

## Status: baseline established, no prompt changes proposed
Per the phase-transition directive, Experience Activation code (`interviewPrompt.js`,
`chat.js` classification, `vectorSearch.js`) was NOT touched during this benchmark -- this is
measurement only. The corrected baseline is **38.6% average leverage rate**, with domain
variance from 0% (Fiori) to 90% (Architecture). This is the number to beat, not 91.4%.

## Root cause diagnosis: GRC/Fiori low leverage (read-only, no prompt files touched)

### Method
Set `DEBUG_DUMP_PROMPT` and ran one live diagnostic generation for each question (real
`CANDIDATE_BACKGROUND`), then inspected the exact prompt actually sent -- category classified,
`REASONING TEMPLATE` used, and `DOMAIN-SPECIFIC TECHNICAL DEPTH` block injected. No
`interviewPrompt.js`/`chat.js`/`vectorSearch.js` edits were made.

### What was actually injected
- **GRC** ("SoD remediation + EAM" question) classified as `Category: Architecture` --
  `CATEGORY_TEMPLATES` has no dedicated GRC entry, so it falls back to the generic 4-step
  architecture structure (`Component Topology -> Runtime Protocols -> Integration Mechanisms ->
  Production Considerations`). Its `DOMAIN-SPECIFIC TECHNICAL DEPTH` block is a 5-bullet
  **coverage checklist** (ARA rule evaluation, ARM control design, rule types, certification
  cycles, SoD monitoring) -- it asks the model to *cover* facts; it never asks for a trade-off
  or a rejected alternative.
- **Fiori** also has no dedicated `CATEGORY_TEMPLATES` entry, so it falls back to the **General**
  template -- which, unlike GRC's, explicitly demands "Explicit Trade-off or Rejected
  Alternative (name what you didn't choose and why, not just what you recommend)."

### Option A vs Option B
If template rigidity (Option B) were the dominant cause, Fiori's trade-off-mandating template
should produce meaningfully more leverage than GRC's plain coverage checklist. It doesn't --
both land at 10%. That rules out template rigidity as the primary driver: a template that
explicitly asks for a trade-off still failed to produce one, because there was no
candidate-specific trade-off available to surface.

Checking `CANDIDATE_BACKGROUND` directly confirms **Option A**: for GRC it states *"Full SAP GRC
Access Control delivery -- ARA, ARM, BRM, EAM/Firefighter... supporting SOX 404, ITGC"*; for
Fiori, *"Fiori and Gateway/OData authorization models (catalogs, groups, spaces, pages...)"*.
Both are **inventories of modules/scope touched**, never a **decision-and-rationale** statement
("we used X instead of Y because Z constraint"). Every GRC/Fiori MENTIONED verdict in the raw
judge output says the same thing in different words: the test answer's decision sequence (ARA ->
remediation -> Firefighter; tile mapping -> CSP/CORS -> caching) is the same sequence every
control answer also reaches on its own, with the same recycled scale numbers (11 countries,
8,700 users, "Fortune 500 client") attached regardless of relevance to the specific question --
because the background gives the model scope to cite but no decision to differ on.

**Why Architecture/HANA leverage higher, for honesty's sake:** neither succeeds via genuine
trade-off narrative either -- there isn't one anywhere in `CANDIDATE_BACKGROUND` for any domain.
Architecture leverages because the question is *literally about* multi-country regulatory
variance, so the 11-country/28-entity scope **is** the substance of that specific question, not
decoration. HANA leverages via cross-domain synthesis (the model pulling the candidate's real
GRC breadth into an adjacent HANA-privilege answer), not a stated rationale. So the 38.6% overall
leverage rate is currently earned almost entirely through scope-happens-to-match-the-question and
cross-domain capability synthesis -- not through decision rationale, because the background
doesn't contain any.

### Conclusion
**Primary root cause: Option A, background content gap** -- `CANDIDATE_BACKGROUND` is written
as an achievements/scope list, not a decisions log, for every domain, and this is exposed
specifically in GRC/Fiori because their questions ask about the standard playbook those domains'
scope facts don't differentiate. GRC's checklist-style domain-depth block (a weaker form of
Option B) is a secondary, compounding factor -- but Fiori's counterexample shows fixing template
phrasing alone would not be sufficient without also addressing the content gap.

## Single-variable experiment: enriched background content (Option 1)

### Method
Per the freeze directive, `interviewPrompt.js`/`chat.js`/`vectorSearch.js` and
`eval/lib/evalLeveraging.js` (judge logic) were NOT modified. `eval/lib/enrichedBackgrounds.js`
takes the real `CANDIDATE_BACKGROUND` and inserts exactly ONE sentence of genuine
decision-and-rationale narrative into the existing GRC and Fiori project bullets -- everything
else (scope numbers, structure, anti-fabrication rules) held constant:
- **GRC**: added a sentence about rejecting a single global MSMP approval workflow in favor of
  localized per-country stage-level paths (data-privacy driven), and overriding default SU24
  proposals to prevent cross-system authorization inflation.
- **Fiori**: added a sentence about rejecting a monolithic role-to-catalog assignment in favor
  of fine-grained per-functional-area OData catalog splits, to fix a concurrent-load performance
  problem, accepting higher maintenance overhead as the trade-off.

`eval/testEnrichedBackgrounds.js` generated 10 fresh test answers per domain (live `/api/chat`,
enriched background) and judged each against the *same, reused* control answers from the
original benchmark run (control generation never used a background at all, so reuse doesn't
introduce a confound) -- isolating background content as the only variable.

### A methodology note on data integrity
Numbers below are verified by reading `eval/results/enriched_background_experiment.json`
directly and recomputing counts from its `judged[]` array -- NOT by trusting the live console
output of the backgrounded run. This is the third time in this project that console output from
a `run_in_background` script has diverged from what the same process actually persisted to disk
(the console log for this run claimed GRC=0%/Fiori=100%; the file shows GRC=10%/Fiori=80%).
Going forward, any number from a backgrounded script should be re-derived from its saved output
file before being reported, not read off the console.

### Results (verified against saved file)

| Domain | Baseline (v2) | Enriched | Change | Narrative actually appears in answer text |
|---|---|---|---|---|
| GRC | 10% (1/10) | 10% (1/10) | **no change** | **0/10** |
| Fiori | 0% (0/10) | 80% (8/10) | **+80pp** | 7/10 |

**Fiori: hypothesis strongly confirmed.** Enriching the background with a genuine
performance-vs-maintainability trade-off took leverage from 0% to 80%. Spot-checked verdicts
show the judge citing real, specific forks lifted straight from the new content ("monolithic
role-to-catalog assignment vs. splitting OData catalogs into functional groups").

**GRC: hypothesis not confirmed -- but not refuted either, because the enrichment was never
used.** Directly scanning all 10 generated answers' raw text for the new content (MSMP,
"localized stage", "dynamic agent routing", "overrode", "SU24") found it in **zero** of them.
Every GRC answer independently converged on the same structure: risk assessment -> SoD rule set
-> ARA monitoring -> Firefighter EAM -> the same recycled scale numbers (8,700 users, 11
countries, 250+ rules) attached as illustration. The model never had a chance to leverage the
new narrative because it never surfaced it in the first place -- this is an ACTIVATION-layer
finding, not a leverage-judge finding.

### Why GRC suppressed the new content but Fiori didn't (read-only inference, not verified by a further experiment)
GRC's `DOMAIN-SPECIFIC TECHNICAL DEPTH` block is a 5-bullet checklist naming specific topics:
ARA rule evaluation, ARM control design, rule types, certification cycles, SoD monitoring. None
of those bullets names "approval workflow design" or "routing" -- the topic the new GRC
narrative is about. The checklist may be acting as a topic filter with no open slot for that
content to land in. Fiori's fallback template, by contrast, asks generically for "Explicit
Trade-off or Rejected Alternative" with no fixed topic list -- and the new Fiori narrative IS a
trade-off, so it fits directly into an already-open slot. This reframes the original Option A/B
framing: it's not simply "content gap vs. template rigidity" as two independent explanations --
for GRC specifically, it may be a content-topic/template-topic MISMATCH (Option A content that
doesn't match any of Option B's checklist topics), which is a different, more specific claim
than either original hypothesis alone. This inference has NOT been tested with a further
experiment (e.g. rewording the GRC narrative to match one of the 5 existing checklist topics)
and should be treated as a hypothesis, not a conclusion.

## GRC repair attempt: topic-filtering hypothesis tested and DISPROVEN

### Root cause diagnosis first: ruled out retrieval/truncation with hard evidence
Before touching any code, checked whether `candidateResume` goes through `vectorSearch.js`
chunking/retrieval at all -- it does not. `grep candidateResume services/vectorSearch.js`
returns zero matches; `lib/prompt/interviewPrompt.js` interpolates `candidateResume` directly
into the prompt string (`` `CANDIDATE BACKGROUND (ground truth...): ${candidateResume}` ``) with
no chunking, no similarity threshold, no length limit. Confirmed empirically via
`DEBUG_DUMP_PROMPT`: the enriched GRC sentence ("rejected a single global MSMP...") is present
verbatim in the actual prompt sent to the model. This rules out payload truncation/retrieval as
the mechanism -- the content reaches the model's context every time; something at generation
time causes the model not to use it.

### Fix applied (single-variable, per the freeze's own regression-exception clause)
Added one clause to `getDomainDepthGuidance()` in `lib/prompt/interviewPrompt.js`: "These
bullets are areas to prioritize, not an exhaustive limit -- if CANDIDATE BACKGROUND describes a
specific real decision, trade-off, or rejected alternative in this domain that isn't covered by
the bullets above, include that instead of or alongside them." This tested the hypothesis that
GRC's 5-bullet checklist (ARA rule evaluation, ARM control design, rule types, certification,
monitoring) was acting as a topic filter with no slot for "approval workflow design" content.

### Result: null, not just unconfirmed
Re-ran n=10 for GRC with the enriched background (foreground, not backgrounded, to avoid the
console/file reliability issue noted above; result independently verified by reading the saved
file and recomputing counts from its `judged[]` array -- confirmed to match in-memory counts).

| | Narrative surfaced | Leverage rate |
|---|---|---|
| Before fix | 0/10 | 10% (1/10) |
| After fix | 0/10 | 0% (0/10, within noise of the 10% baseline at n=10) |

Both the enriched narrative AND the new clause were confirmed present in the actual prompt sent
for every one of these 10 requests. The model still never engaged with the workflow-design
content -- every answer independently converged on the same "risk assessment -> control
design/remediation -> continuous monitoring" three-part structure, with the same recycled scale
numbers (8,700 users, 45 systems) attached as illustration, regardless of the new instruction.
The topic-filtering hypothesis is **disproven for GRC**, not merely unconfirmed: the fix
targeted exactly the mechanism the diagnosis proposed, and produced zero measurable change.

### Change reverted
Per this project's discipline, an addition with no measured benefit is not kept as unproven
prompt bulk -- the clause was removed from `getDomainDepthGuidance()`, restoring it to its
pre-experiment state (the original, previously-validated grounding clause is unchanged and
still in place). See the comment above `getDomainDepthGuidance()` for the full negative-result
note left in the source for future reference.

### Status: true root cause still unresolved
What's established: the enriched content reaches the model every time (verified), and it is a
specific, resistant pattern -- the same rigid three-part structure appears in 100% of the ~30
GRC generations across this investigation (original benchmark, first enrichment test, and this
retest), independent of background content or the domain-depth clause. What's NOT established:
why this specific question/category is so much more resistant to structural deviation than
Fiori's. Candidate explanations not yet tested: (a) `MANDATORY STRUCTURE`'s "name 3-5 points"
instruction may be the actual source of the fixed three-part shape, not the domain-depth
checklist; (b) the model's pretrained default answer shape for "SoD remediation + EAM" questions
may simply be a very strong prior that a single instruction clause can't override, regardless of
where in the prompt it lives; (c) the new sentence's position (mid-paragraph, buried in an
already-dense background bullet) may matter more than its topic, though this doesn't obviously
explain why the similarly-positioned Fiori insertion worked. None of these should be acted on
without their own single-variable test -- this section documents what was ruled out, not a new
recommendation to implement blind.

## Research-engineer cycle: Builder -> Examiner -> Researcher -> Hypothesis -> Experiment

Candidate explanation (a) from the section above was tested next, using a strict 5-phase
methodology instead of another ad hoc prompt tweak.

**Phase 1 (Builder):** generated one real production answer (live `/api/chat`, real
`CANDIDATE_BACKGROUND`, unmodified system) for the GRC question. No critique, no changes.

**Phase 2 (Examiner):** read it as a skeptical senior architect interviewing another architect.
Weaknesses only, no fixes proposed. Key findings: the opening announces a generic 3-part
taxonomy instead of engaging with what makes *this* landscape complex; a cited number (11
countries, 250+ rules) illustrates a step every generic answer also takes rather than explaining
a decision; several sentences read as textbook definitions ("this framework would help classify
risks...") despite the system being told to assume the interviewer already understands SAP;
exactly one concrete technical artifact (`GRAC_SPM`) in the whole answer; and, most
importantly, **no alternative is ever named and rejected**, despite the prompt already asking
for one.

**Phase 3 (Researcher):** mapped each weakness to a failed reasoning operation, not a wording
problem. The generic/textbook sentences trace to **decision commitment never occurring** --
the model describes a solution's shape without picking a defensible side on anything
contestable. The missing rejected alternative traces to **alternative generation never
happening** -- and this is upstream of decision commitment, since there's nothing to commit
against without a competing option in view.

**Phase 4 (Hypothesis, exactly one):** for GRC/SoD-remediation-shaped questions, the model
begins composing the three-part textbook structure before generating and comparing even one
alternative -- even though an explicit "name a realistic alternative" instruction already
exists in the current prompt, because it's buried inside a dense multi-question paragraph
rather than isolated as a first-class step.

**Phase 5 (Experiment):** isolated the SAME existing instruction (no new content) as a
standalone mandatory step, in a minimal test harness (`eval/testAlternativeGenerationHypothesis.js`).
Measured ONE outcome: does a genuine rejected alternative appear in the text (manually
verified, not regex-trusted). Result: **0/10 control -> 10/10 treatment**, and the alternatives
were real and substantive when read in full ("a purely automated SoD remediation tool... I
reject this because it can lead to over-reliance on automation, missing nuanced business
context").

**Production verification (the step that changed the outcome):** implemented the minimum
change -- isolated the same instruction inside `ROLE & RULES` in `lib/prompt/interviewPrompt.js`,
adding no new content -- and re-ran n=10 against the TRUE full production prompt
(`eval/retestGrcAfterAltGenFix.js`), not the minimal harness. Result: **0/10 rejection
language**, leverage 2/10 (statistically unchanged from the 10% pre-fix baseline at this n).
The isolated-prompt effect did not survive merging into the full ~17KB production prompt.
**Reverted** -- net diff to `interviewPrompt.js` is a comment documenting the negative result,
no functional change.

### What this cycle actually established
The specific fix failed, but the diagnostic method worked exactly as intended: it correctly
identified alternative generation as the failed reasoning operation (Phase 5's minimal-harness
result confirms this precisely), and it correctly avoided shipping an ineffective change by
insisting on full-production verification before declaring success. Three separate isolated
fixes this session (the domain-depth topic clause, this alternative-generation clause, and by
extension the original REASONING TEMPLATE/RULES/TECHNICAL REASONING clauses that DID survive at
scale during the earlier Activation investigation) show a consistent pattern: whether an
isolated instruction survives full-prompt merging is not predictable from the isolated-harness
result alone, and needs to be measured every time, not assumed. Per the project direction change
following this cycle, further single-clause prompt patching is no longer the primary path
forward -- see the Experience Acquisition Engine design doc for the new direction.
