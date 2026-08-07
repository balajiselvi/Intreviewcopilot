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

| Domain | v1 Leverage | v2 Leverage | v2 Mentioned | v2 Absent | v2 Avg Quality | v2 Consistency |
|---|---|---|---|---|---|---|
| GRC | 100% | **10%** | 90% | 0% | 8.0 | 0.90 |
| BTP | 80% | **60%** | 40% | 0% | 8.0 | 0.60 |
| HANA | 100% | **70%** | 30% | 0% | 8.0 | 0.70 |
| Security | 100% | **30%** | 70% | 0% | 8.0 | 0.70 |
| IDM | 70% | **20%** | 80% | 0% | 7.8 | 0.80 |
| Fiori | 90% | **10%** | 90% | 0% | 8.0 | 0.90 |
| Architecture | 100% | **90%** | 10% | 0% | 8.0 | 0.90 |
| **Overall avg** | **91.4%** | **41.4%** | 58.6% | 0% | -- | -- |

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
- **GRC (10%) and Fiori (10%) barely leverage at all** -- for these questions, the model's
  default-competent answer and the "real experience" answer converge on the same textbook
  decision sequence (ARA -> remediation -> EAM controls; tile security -> CSP/CORS -> caching),
  with real numbers/tools bolted on as evidence rather than changing the recommendation.
- **Security (30%) and IDM (20%) are similarly low** -- generic role-design and provisioning
  questions where the obvious-best-practice answer and the experience-grounded answer are, in
  substance, the same answer.
- **0% ABSENT everywhere** -- confirms Experience Activation is working as intended (background
  is never simply missing); the gap is entirely in the MENTIONED-vs-LEVERAGED split, which is
  exactly the distinction this benchmark was built to isolate.

## Status: baseline established, no prompt changes proposed
Per the phase-transition directive, Experience Activation code (`interviewPrompt.js`,
`chat.js` classification, `vectorSearch.js`) was NOT touched during this benchmark -- this is
measurement only. The corrected baseline is **41.4% average leverage rate**, with domain
variance from 10% (GRC, Fiori) to 90% (Architecture). This is the number to beat, not 91.4%.

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
GRC breadth into an adjacent HANA-privilege answer), not a stated rationale. So 41.4% overall
leverage is currently earned almost entirely through scope-happens-to-match-the-question and
cross-domain capability synthesis -- not through decision rationale, because the background
doesn't contain any.

### Conclusion
**Primary root cause: Option A, background content gap** -- `CANDIDATE_BACKGROUND` is written
as an achievements/scope list, not a decisions log, for every domain, and this is exposed
specifically in GRC/Fiori because their questions ask about the standard playbook those domains'
scope facts don't differentiate. GRC's checklist-style domain-depth block (a weaker form of
Option B) is a secondary, compounding factor -- but Fiori's counterexample shows fixing template
phrasing alone would not be sufficient without also addressing the content gap.

## Recommended next step (not yet done, no prompt change proposed)
Any future experiment here should target background CONTENT (does it contain at least one real
decision-and-rationale statement per domain, not just scope), not prompt template wording, given
Fiori's template already asks for a trade-off and still fails. Per this project's discipline,
that would be its own single-variable test (a revised background payload, re-run through the
existing benchmark) -- not something to implement inside this diagnostic pass.
