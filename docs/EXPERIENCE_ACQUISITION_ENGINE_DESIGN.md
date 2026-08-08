# Engineering Memory Platform — Architectural Design

Status: **Version 1 ready for internal use and iterative validation. Phase 1 (this design +
retrieval/chat.js integration) frozen.** Interview Copilot is the first consumer of this
platform, not the platform itself — a distinction that matters for section 0.5 and everything
downstream of it.

## Known Limitation (deferred, not blocking Version 1)

**Engineering Memory participates in prompt generation but is not yet explicitly included in the
experience-selection reasoning step.** Confirmed by direct investigation
(`eval/results/MEMORY_ARBITRATION_INVESTIGATION.md`): the model's "does real experience apply
here" check in `lib/prompt/interviewPrompt.js` is structurally anchored to `CANDIDATE BACKGROUND`
by name only. `ENGINEERING MEMORY` was added as a separate, unreferenced section — not
competing with `CANDIDATE BACKGROUND`, simply invisible to the one reasoning step that decides
whether to speak from real experience at all. Measured consequence: with Engineering Memory as
the *only* candidate-specific source in the prompt (no `CANDIDATE BACKGROUND`, nothing to
compete with), the seeded decision was still only used 1/5 times — ruling out simple source
competition as the full explanation, and pointing at the missing reference itself as the root
cause.

- **Status:** Deferred.
- **Reason:** Not blocking Version 1 — the mechanical pipeline (retrieval, storage, extraction,
  question-generation logic) is sound and tested; this is specifically about how strongly the
  live prompt directs the model to use what's retrieved.
- **Revisit:** after collecting real production usage data (per the decision below), not by
  further benchmark iteration now.

Revision history:
- v1: subsystem named "Judgment Store," atomic unit "Judgment Record."
- v2: renamed to **Engineering Memory** — not everything a senior architect carries forward is a
  clean decision; production failures, audit findings, and stakeholder situations are real
  inputs too. Flattened the record into an explicit 8-stage pipeline. Governing principle
  stated explicitly: *store engineering judgment that happens to have been learned through
  experience, not experience itself.*
- v3: adds the layer above individual records — **Engineering Principles**,
  reverses the retrieval sequence to be reasoning-first rather than similarity-first, and adds a
  human-stated recall-confidence field. This is the change that takes the system from "a memory
  of what happened" to "a model of how this person thinks" — see section 4.
- v4 (this revision): renamed to **Engineering Memory Platform**, and adds the mindset section
  below (0.5) that governs everything downstream of it — the design was previously being treated
  as a thing to finish, when it's actually a thing that has to keep changing shape as real usage
  reveals what today's understanding is missing.

## 0. Why prompt engineering hit a ceiling (one paragraph, for context)

Across this session, five separate isolated prompt fixes were tested with rigorous
before/after measurement. All five worked when tested in a small, isolated harness. Three
survived merging into the full ~17KB production prompt; two did not, including the most recent
one (an alternative-generation instruction: 0/10 → 10/10 isolated, 0/10 at full scale). The
pattern is consistent enough to trust: **the bottleneck is not instruction wording, it's that
the model has nothing candidate-specific and decision-shaped to reach for**, so more
instructions just compete with each other over a mostly-empty well. `CANDIDATE_BACKGROUND`
today is achievement/scope prose ("delivered ARA, ARM, EAM... 11 countries, 250+ rules"), not
judgment ("I did X instead of Y because Z"). No prompt instruction can manufacture judgment that
was never captured.

## 0.5 Continuous learning philosophy — the mindset that governs every section below

This section exists because "the design is done" was the wrong frame, and it's worth stating
why in the document itself, not just in a commit message.

**The Engineering Memory Platform is not a static database. It is a continuously evolving
representation of the candidate's engineering experience.** Every subsystem below should be
designed assuming today's understanding of that experience is incomplete — not as a hedge, but
as the actual operating assumption. Every future interview, every new project discussed, every
production incident recalled, every architectural discussion had, should have the potential to
improve the Platform. New patterns, new principles, new project types, new domains, and new
engineering habits are expected to emerge over time, not enumerated up front. Design every
subsystem so knowledge quality naturally increases with use — avoid any design that implicitly
assumes the initial Judgment Record set is complete, or that today's `experience_type`
vocabulary, domain taxonomy, or scenario-type list is final. Those are starting points, not
walls.

The practical consequence: **optimize Version 1 for learnability, not completeness.** A smaller,
simpler V1 that captures real signal cleanly and is easy to extend beats a more "complete" V1
that locks in assumptions before any real Judgment Record exists to test them against. Sections
2-9 below describe the full target shape of the system; section 10 (build order) is where this
principle actually bites — it deliberately sequences the simplest, most reversible pieces first
and defers anything that requires volume or usage data to have accumulated.

**Interview Copilot is the first consumer, not the platform.** The schema, extraction pipeline,
and retrieval strategy below are written generically enough that a future Resume Builder,
Technical Mentor, Career Coach, or Knowledge Explorer application could consume the same
Judgment Records and Engineering Principles — none of section 2's schema or section 3's mining
logic is Interview-Copilot-specific. Section 5 (retrieval) and section 9 (the answer-generation
sequence) ARE Interview-Copilot-specific, and that's the correct boundary: the Platform stores
and organizes judgment; each consuming application decides how to reason from it.

## 1. The design question, and why it's the right one

> If Balaji retired tomorrow and spent four days teaching a junior SAP Security Architect
> everything he'd learned, what would that junior need to consistently make the same
> engineering decisions?

Not a resume. Not a transcript. Not a fact database. What a mentor actually transmits in that
scenario is a set of **judgment calls**, and — this is the part v1/v2 of this design undersold —
a smaller set of **principles that generalize across all of them**: *"I always centralize
governance before automating it," said once, explains a dozen decisions the junior will
otherwise have to be told individually.* The junior doesn't retain every project; they retain a
manageable number of situations, and an even smaller number of rules that explain most of the
situations at once.

That reframes the deliverable again. The system is not just a judgment-capture system anymore —
it's a system that **captures judgment, then discovers the principles that judgment keeps
expressing**, and reasons from whichever level (principle or record) actually answers the
question in front of it.

## 2. The Judgment Record — the atomic unit

A Judgment Record is what survives after the Extraction Pipeline (section 6) processes one real
conversation turn about one real piece of experience — a decision, but also a failure
witnessed, an audit finding, or a stakeholder situation navigated, whenever it teaches something
transferable.

The core is a flat pipeline, not a nested object — deliberately, so that every stage is a
first-class thing the extractor must either fill or explicitly leave null, not a sub-field easy
to skip:

```
JudgmentRecord {
  id: string

  // --- the pipeline itself ---
  situation: string           // "multi-country ECC-to-S/4 transformation, ~11 countries"
  problem: string              // what specifically forced attention -- "320 conflicting SoD rules"
  constraint: string           // the thing that ruled out the easy answer -- "country-specific compliance"
  decision: string             // what was actually done -- "derived role model, master + local"
  alternative_rejected: {
    approach: string           // "single global role"
    reason_rejected: string    // "localization impossible with one shared role definition"
  } | null                     // null is valid -- see the completeness rule below
  implementation: string       // the concrete mechanics -- T-codes, config, sequence
  outcome: string               // what actually happened -- "audit passed," "3 rework cycles"
  lesson_learned: string | null // only if the candidate stated one -- never inferred

  // --- who else was in the room, and what this person owned ---
  people: {
    stakeholders: string[]         // roles, not names ("audit committee", "business unit leads")
    personal_responsibility: string // what Balaji himself owned in this decision
  }

  // --- where this came from, and how sure we are it's real ---
  provenance: {
    source_turn_id: string
    candidate_stated_confidence: "explicit" | "implied"  // did extraction have to infer this
                                                            // field, or was it stated directly?
    recall_confidence: "high" | "medium" | "low"           // the CANDIDATE's own certainty about
                                                            // their memory of the event -- distinct
                                                            // from the field above. Set from direct
                                                            // signal ("I don't remember exactly,
                                                            // but...") detected during extraction,
                                                            // or asked directly during acquisition
                                                            // if not volunteered. See 6.3.
    extracted_at: timestamp
  }

  // --- how this gets found again ---
  tags: {
    sap_products: string[]         // ["PFCG", "SU24", "GRC ARA"] -- controlled vocabulary, see 7.2
    domain: string                 // must be one of interviewAnalyzer.js's existing domains
    experience_type: string        // "architecture_decision" | "process_design" |
                                    // "production_failure" | "audit_finding" |
                                    // "stakeholder_conflict" | "mistake_and_lesson" | ...
    reusable_for_categories: string[]  // which CATEGORY_TEMPLATES categories this can answer
                                        // (Architecture, Behavioral, Leadership, Audit,
                                        // Troubleshooting, ... -- one record often serves several)
  }
}
```

Design rules unchanged from v2, still load-bearing:
- No field is free text dumped from the transcript — every field is compression toward
  transferable judgment.
- A record without `alternative_rejected` is valid but lower-priority coverage for
  decision-shaped `experience_type`s specifically.
- `lesson_learned` stays a top-level field, not buried, because interviewers ask for it
  directly.
- One real implementation → many records (3-6 per project, one per situation-to-lesson arc).

## 3. Engineering Principles — the derived layer

This is the addition that changes what kind of system this is. Individual Judgment Records
answer "what did you do, once." Engineering Principles answer "what do you always do, and why"
— the thing a mentor states as a rule after having demonstrated it a dozen times without ever
stating it as a rule.

### 3.1 What a principle is

```
EngineeringPrinciple {
  id: string
  statement: string              // "Prefer localization (derived roles) over a single global
                                  //  role when governance complexity would exceed the
                                  //  maintenance cost of managing it centrally"
  status: "proposed" | "confirmed" | "modified" | "rejected"
  derived_from: string[]         // Judgment Record ids that formed the pattern -- minimum 3,
                                  // from DIFFERENT projects/situations, not 3 mentions of the
                                  // same project
  domain_scope: string[]         // which domains this principle applies to -- often more than
                                  // one, since a real principle usually generalizes past the
                                  // domain it was first observed in
  confirmation: {
    confirmed_at: timestamp | null
    candidate_wording: string | null   // if the candidate rephrased it during confirmation --
                                        // their wording always wins over the inferred draft
  }
}
```

### 3.2 Discovery is inference; adoption is never automatic

This is the section where this design has to hold the line this whole project has held all
along: **never assert something the candidate didn't confirm.** An inferred principle is
exactly the shape of thing that could quietly become fabrication if it started shaping live
interview answers before a human ever agreed it was true. So:

1. **Mining (automatic, cheap, no new infrastructure):** triggered after every N new Judgment
   Records (e.g. every 10), a clustering pass groups records by embedding similarity of their
   `decision` + `alternative_rejected.approach` fields (reusing the same
   `Xenova/all-MiniLM-L6-v2` embeddings and cosine-similarity function already in
   `services/vectorSearch.js` — no new ML infrastructure). A cluster of ≥3 records from
   different `situation`s that share a decision shape is a **candidate** principle.
2. **Drafting (one LLM call, `chatJSON` pattern):** for each qualifying cluster, one call drafts
   a `statement` generalizing the pattern, citing the `derived_from` records as evidence. This
   is the ONLY generative step — it produces a `status: "proposed"` record, nothing more.
3. **Confirmation (human-in-the-loop, mandatory):** proposed principles are surfaced back to
   the candidate through the same acquisition UI, phrased exactly as the pattern that motivated
   this section: *"I've noticed something. In five different projects you solved role redesign
   by reducing custom roles before touching SoD rules. Is that an intentional engineering
   principle?"* The candidate confirms, edits the wording, or rejects it. This is not a nice-to
   -have UX flourish — it's the fabrication guardrail. **A `proposed` principle is never
   retrievable at answer-generation time.** Only `confirmed` (including `modified`-then-
   reconfirmed) principles enter the retrieval pool in section 5.

### 3.3 Where this leads (stated as direction, not committed scope)

Once this loop exists, its natural extension is the apprentice framing directly: after enough
volume, the system isn't just mining passively between sessions, it's noticing *during*
acquisition and asking in the moment. That's a UX refinement on top of the same
mine-draft-confirm loop, not a different mechanism — worth naming as the intended trajectory,
not worth scoping into v1.

## 4. Revised pipeline

```
Judgment Records
      ↓
Engineering Memory  (the store -- section 7)
      ↓
Engineering Principles  (mined from Memory, confirmed by the candidate -- section 3)
      ↓
Reasoning  (retrieval + generation -- section 5)
      ↓
Interview Copilot
```

Principles and records are not a strict hierarchy at retrieval time — a principle without a
concrete record to cite is a slogan; a record without the principle that explains it is trivia.
Section 5 retrieves both together.

## 5. Retrieval Strategy — reasoning-first, not similarity-first

### 5.1 The reversal, and why it's smaller than it sounds

The instinct to avoid is: `Question → embed → cosine-search Engineering Memory → done`. That
retrieves whatever sounds similar to the question's words, not whatever the question is actually
*asking about* as an engineering matter. The correct sequence:

```
Question
   ↓
Determine Engineering Problem   [classify category/domain/intent]
   ↓
Determine Memory Needed          [principle-first, record-first, or both -- by category]
   ↓
Retrieve                          [query built from the problem frame, not raw question text]
   ↓
Reason                            [generate, with both levels available]
```

The first step is **not new machinery**. `pages/api/chat.js` already runs
`analyzeInterviewQuestion()` — a rule-based, non-LLM classifier — before any retrieval call
today (`fetchKnowledgeContext` is called with `analysis` already computed). This design extends
that existing step rather than adding a new LLM call in front of retrieval, which matters given
this project's hard single-pass-latency constraint (established early this session: multi-pass
generation was tested and rejected at +0.14 quality for 4.2x latency). Reasoning-before-retrieval
is achievable for free because the reasoning step already exists structurally; it just wasn't
being used to shape the Engineering Memory query yet.

### 5.2 "Determine memory needed" — a lookup, not a model call

A small static table, keyed on `analysis.category` (reusing `CATEGORY_TEMPLATES`' existing
categories, no new taxonomy), decides retrieval shape:

| Category shape | Retrieve principles? | Retrieve records? |
|---|---|---|
| Architecture, Role Design, Security (design-oriented) | Yes, first | Yes, as supporting evidence |
| Troubleshooting, Production Support | No (rarely principle-shaped) | Yes, primary |
| Behavioral, Leadership | Yes, if `reusable_for_categories` matches | Yes, primary |
| Audit | Yes, if scoped to Audit domain | Yes, primary |

This is the same kind of deterministic, low-latency lookup already used for
`getDomainDepthGuidance()` in `lib/prompt/interviewPrompt.js` — consistent with the project's
existing pattern, not a new design idiom.

### 5.3 Retrieval query construction

Instead of embedding the raw question, the retrieval query is synthesized from the problem
frame — reusing the existing pattern in `pages/api/chat.js`'s `synthesizeRetrievalQuery()`
(currently used to enrich follow-up retrieval with prior-turn topic tokens) and extending it to
also incorporate `analysis.category`/`analysis.domain` terms, so "how would you design X" and
"walk me through implementing X" retrieve the same underlying judgment even when their surface
wording differs.

### 5.4 Scoring

Principles and records are scored with the same formula already proven in
`services/vectorSearch.js` (`semanticScore * 0.55 + keywordScore * 0.20 + domainBoost +
artifactBoost + intentBoost`), plus:
- A `reusable_for_categories` match boost (as in v2).
- A `recall_confidence` penalty: `low`-confidence records are still retrievable (a hedged real
  memory beats a fabricated confident one) but scored down slightly and, critically, **rendered
  differently in the prompt** — see 5.5.

### 5.5 Prompt rendering

```
RELEVANT ENGINEERING PRINCIPLE (if retrieved):
"<statement>" -- established across <N> prior situations, most recently: <newest derived_from record's situation>.

RELEVANT ENGINEERING JUDGMENT:
Situation: <situation>
Problem: <problem>
Constraint: <constraint>
Decision: <decision>
Rejected: <alternative_rejected.approach> -- <alternative_rejected.reason_rejected>  [if present]
Outcome: <outcome>
Lesson: <lesson_learned>  [if present]
```

If `recall_confidence` is `low`, the record is prefixed with an explicit instruction (not
silently dropped, not silently asserted): *"The candidate was uncertain about the exact details
of this one -- speak from it in general/methodology terms, not as a precisely recalled
incident."* This directly reuses the conditional-tense mechanism already validated in
`lib/prompt/interviewPrompt.js`'s DEEPEN MODE fabrication guard (present-tense specific claims
only when the source is certain; conditional phrasing otherwise) rather than inventing a new
hedging mechanism.

This whole section is a **new prompt section**, additive to the existing pipeline, not a
re-tuning of `CANDIDATE BACKGROUND`'s existing grounding clauses — it does not touch the
currently-frozen activation mechanism.

## 6. Experience Acquisition Engine — orchestration

Unchanged in structure from v2, with one addition: the acquisition flow now also surfaces
principle-confirmation prompts (section 3.2, step 3) interleaved with gap-driven scenario
prompts, prioritized by cluster size (a pattern seen in 5 projects is a higher-priority
confirmation ask than one seen in 3).

### 6.1 Coverage model
Rows = `interviewAnalyzer.js` domains, columns = a small, fixed set of representative scenario
types per domain, spanning decision-shaped and non-decision-shaped `experience_type`s alike
(SoD ruleset design, remediation workflow, Firefighter governance, audit cycle, a production
incident, a stakeholder disagreement — capped at 5-6 per domain, not hundreds of questions).

### 6.2 Gap-driven prompting
Templated, not open LLM generation, filling `"I already understand your X. I still need one
representative Y."` from the coverage matrix directly.

### 6.3 Recall confidence capture
If the candidate's answer contains hedging language ("I think," "roughly," "if I remember
right") the extractor (section 8) sets `recall_confidence: "low"` automatically. If a
record's confidence is ambiguous, the acquisition UI asks directly once: *"How confident are
you in those specifics?"* — a single templated question, not a repeated interrogation.

### 6.4 Termination / re-engagement
Unchanged from v2: re-surfaces gaps opportunistically after live interview sessions where a
follow-up was answered weakly in an uncovered domain.

## 7. Experience Extraction Pipeline

Unchanged in mechanism from v2 (segmentation → per-span `chatJSON` extraction → fabrication
guard → validation-before-storage via the leverage judge's decision-fork detection), with
`recall_confidence` extraction added per 6.3, and the fabrication guard explicitly covering
`EngineeringPrinciple.statement` now too: principle statements are drafted by the LLM (section
3.2) but are `proposed`, never `confirmed`, until the candidate says so.

## 8. Storage

### 8.1 No new infrastructure
Zero database dependencies exist today — `data/knowledgeIndex.json` is a flat JSON file, loaded
into memory, cosine-searched. Engineering Memory follows the same pattern:
`data/engineeringMemory.json` (Judgment Records) and `data/engineeringPrinciples.json`
(Engineering Principles, kept as a separate small file since it's mined output, not
directly-captured input — separating them keeps the mining job's read/write boundary clean).
Embeddings via the same local `Xenova/all-MiniLM-L6-v2` pipeline, zero new dependencies.

### 8.2 Controlled vocabulary
`tags.domain` and `tags.sap_products` reuse `lib/interviewAnalyzer.js`/`vectorSearch.js`'s
existing vocabularies verbatim, as in v2.

### 8.3 "Graph" as an emergent property
Unchanged from v2: no adjacency-list graph database. Record-to-record and record-to-principle
connectivity is computed at retrieval time from shared tags and embedding similarity, reusing
the `RELATED_DOMAINS` cross-domain boost mechanism already measured in `services/vectorSearch.js`.

## 9. Answer Generation (full sequence)

```
Question
  → analyzeInterviewQuestion()        [existing, unchanged -- the "determine engineering problem" step]
  → determine memory needed           [new -- static lookup, section 5.2]
  → searchEngineeringMemory()         [new -- principles + records, section 5.3-5.4]
  → fetchKnowledgeContext()           [existing, unchanged -- SAP factual knowledge base]
  → buildSapInterviewPrompt()         [existing, extended with the new prompt section, 5.5]
  → Interview Answer
```

`CANDIDATE_BACKGROUND` (raw CV) remains the fallback ground-truth source for domains where
neither a Judgment Record nor a Principle yet exists — coverage is necessarily partial for a
long time. The system reasons from Engineering Memory and Engineering Principles first when
available, falling back to CV prose only for gaps.

## 10. Integration and build plan — Version 1, status: FROZEN for internal use

Per section 0.5: this build order optimized for learnability, not completeness — Version 1 is
the smallest slice that lets real Judgment Records exist, be extracted correctly, be retrieved,
and reach the live prompt. That's done. What it does NOT yet include (the acquisition UI,
principle mining, and full arbitration between Engineering Memory and CANDIDATE BACKGROUND) is
deliberately deferred, not abandoned — per the decision below, the right way to learn what those
need is real usage, not more benchmark iteration.

1. ✅ Judgment Record schema + `data/engineeringMemory.json` read/write helpers. Verified: 6/6
   checks (`eval/testEngineeringMemoryStore.js`).
2. ✅ Extraction pipeline (section 7). Verified offline against 3 hand-written transcripts,
   found and fixed 2 real bugs (segmentation over-fragmentation, recall_confidence detection)
   before any live use (`eval/results/ENGINEERING_MEMORY_STEP2_EXTRACTION.md`).
3. ✅ `searchEngineeringMemory()` + the new prompt section (section 5). Verified in isolation
   (10% → 90% leverage) and wired into `pages/api/chat.js`, where a real path-resolution bug
   (`__dirname` under Next.js's webpack bundling) was found and fixed
   (`eval/results/ENGINEERING_MEMORY_STEP3_RETRIEVAL.md`,
   `eval/results/ENGINEERING_MEMORY_STEP5_CHAT_INTEGRATION.md`).
4. ⏸️ Adaptive Question Generator backend built and tested (6/6 checks,
   `eval/testEngineeringMemoryQuestionGenerator.js`); the acquisition UI itself is **deferred**
   — a product/UX decision, not yet made, and lower priority than real usage data per the
   decision below.
5. ⏸️ Engineering Principle mining — **deferred**, per its own gating condition (needs ~20-30
   real records, none exist yet without an acquisition surface).

**Known limitation carried forward, not fixed in Version 1:** see the top of this document —
Engineering Memory is not yet part of the model's experience-selection reasoning step. Logged as
a backlog item, revisited after real usage data exists, not fixed speculatively now.

## Decision: what comes after Version 1

- Phase 1 (this design + the retrieval/chat.js integration above): **frozen.**
- Version 1: **ready for internal use and iterative validation.**
- Engineering Memory arbitration (the known limitation above): **deferred backlog item.**
- Next effort: **build out remaining SAP knowledge coverage and validate through real interview
  sessions, not further benchmark iteration.** Real usage is expected to surface what the
  acquisition UI, arbitration fix, and principle mining actually need better than another round
  of synthetic seeding and isolated testing would.
