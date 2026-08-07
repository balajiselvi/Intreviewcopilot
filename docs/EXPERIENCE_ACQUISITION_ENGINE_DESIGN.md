# Engineering Memory — Architectural Design

Status: **design only, not implemented.** Per the project direction change (see
`eval/results/LEVERAGING_BENCHMARK_2026-08-07.md` for the evidence that motivated it), this
document is a proposal to review before any code is written.

Revision note: this design was reviewed and refined once already. The subsystem was originally
named "Judgment Store"; it's renamed **Engineering Memory** here because not everything a
senior architect carries forward is a clean decision — production failures, audit findings,
political stakeholder situations, and mistakes are all real inputs too, and none of them force
a tidy "I chose X over Y" shape. The atomic unit keeps the name **Judgment Record**, because the
governing principle, stated explicitly, is:

> **Do not think of this subsystem as storing experiences. Think of it as storing engineering
> judgment that happens to have been learned through experience.**

That distinction is what makes a single record reusable across technical, behavioral,
architecture, troubleshooting, leadership, audit, and stakeholder-management questions alike
(the same category spread `CATEGORY_TEMPLATES` in `lib/prompt/interviewPrompt.js` already
serves) — a record is stored because of what it teaches about how this person reasons, not
because something happened to them.

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

## 1. The design question, and why it's the right one

> If Balaji retired tomorrow and spent four days teaching a junior SAP Security Architect
> everything he'd learned, what would that junior need to consistently make the same
> engineering decisions?

Not a resume. Not a transcript. Not a fact database. What a mentor actually transmits in that
scenario is a set of **judgment calls**: *"when you see a multi-country rollout, don't build
one global role hierarchy — here's why that fails, here's what I do instead, here's the one
time it bit me."* The junior doesn't retain everything Balaji said; they retain a manageable
number of **heuristics**, each anchored to a real situation, each with the reasoning attached
so it generalizes to situations that aren't identical.

That reframes the deliverable. The system being designed is **not a fact-retrieval index** (that
already exists — `services/vectorSearch.js` does that for the SAP knowledge base). It is a
**judgment-capture system**: it elicits reasoning, not stories; it stores the "why," not the
prose; and at answer time it hands the model a piece of judgment to reason *from*, not a
paragraph to paraphrase.

Everything below is organized around Engineering Memory's atomic unit — the Judgment Record —
not around a generic graph schema. The graph-like connectivity between records (shared SAP
products, shared constraints) is a retrieval convenience that falls out of tagging, not the
starting design goal.

## 2. The Judgment Record — the atomic unit

A Judgment Record is what survives after the Extraction Pipeline (section 5) processes one real
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
    candidate_stated_confidence: "explicit" | "implied"  // see 5.3, fabrication guard
    extracted_at: timestamp
  }

  // --- how this gets found again ---
  tags: {
    sap_products: string[]         // ["PFCG", "SU24", "GRC ARA"] -- controlled vocabulary, see 6.2
    domain: string                 // must be one of interviewAnalyzer.js's existing domains
    experience_type: string        // "architecture_decision" | "process_design" |
                                    // "production_failure" | "audit_finding" |
                                    // "stakeholder_conflict" | "mistake_and_lesson" | ...
                                    // broadened deliberately -- not every record is a clean
                                    // decision, see the revision note above
    reusable_for_categories: string[]  // which CATEGORY_TEMPLATES categories this can answer
                                        // (Architecture, Behavioral, Leadership, Audit,
                                        // Troubleshooting, ... -- one record often serves several)
  }
}
```

Worked example, matching the reviewed proposal exactly:

```
situation:            "Global S/4HANA rollout across multiple countries"
problem:               "320 conflicting SoD rules surfaced during role consolidation"
constraint:             "Country-specific compliance requirements couldn't be waived"
decision:               "Derived role model -- one master role, country-specific derived roles"
alternative_rejected:   { approach: "Single global role for all countries",
                          reason_rejected: "Localization becomes impossible once every country
                                             shares one role definition" }
implementation:         "Master roles built centrally in PFCG; derived roles generated per
                          country with org-level restrictions; SU24 proposals maintained once
                          at master level"
outcome:                "Audit passed with the derived-role structure cited as the control
                          evidence"
lesson_learned:         "Governance gets easier long-term if role ownership is centralized
                          early, even though it's slower to set up initially"
```

Design rules that follow directly from the mentorship framing:

- **No field is free text dumped from the transcript.** Every field is what a mentor would say
  if forced to be concise — the extraction pipeline's job is compression toward transferable
  judgment, not summarization of what was said.
- **A record without `alternative_rejected` is valid but treated as lower-priority coverage.**
  Not every real experience worth remembering has a clean rejected alternative (a production
  failure, an audit finding) — those are still stored, and still valuable, but the Adaptive
  Question Generator (section 4) specifically prioritizes closing gaps where a real
  architecture/process decision exists with no alternative captured yet, since that's exactly
  the "MENTIONED not LEVERAGED" failure mode this whole investigation diagnosed.
- **`lesson_learned` is deliberately elevated to a top-level field**, not buried under
  consequence, because interviewers ask for it directly and constantly ("what did you learn
  from that?") — a record that can't answer that question unprompted is incomplete for a whole
  class of real interview questions (Behavioral, Leadership).
- **One real implementation → many records.** The engineering principle from the directive
  ("capture judgment reusable across many questions, not stories") means one conversation about
  one project should typically decompose into 3-6 Judgment Records (one per distinct
  situation-to-lesson arc on that project), not one large record. This is what makes a single
  four-day mentorship transfer decades of situational judgment — it's decomposed into discrete,
  addressable units.

## 3. Experience Acquisition Engine — orchestration

This is the top-level subsystem that decides *what to ask about next*. It does not talk to the
candidate directly in natural language generation terms — it identifies a coverage gap and hands
a targeted prompt to a conversational UI (new, see section 9).

### 3.1 Coverage model

Maintains a coverage matrix: rows = the domain taxonomy already defined in
`lib/interviewAnalyzer.js` (SAP Security, SAP GRC, SAP Cloud Identity/BTP, SAP Fiori Security,
SAP IDM, SAP Platform — reusing the existing taxonomy, not inventing a parallel one), columns =
a small, fixed set of **representative scenario types per domain**, deliberately spanning more
than architecture decisions — matching the broadened `experience_type` vocabulary in section 2.
Example for SAP GRC, capped at 5-6 scenario types:

1. SoD ruleset design (how rules get built/prioritized) — `architecture_decision`
2. Remediation workflow (what happens when a violation is found) — `process_design`
3. Emergency access governance (Firefighter model) — `architecture_decision`
4. Audit/certification cycle (how compliance evidence gets produced) — `audit_finding`
5. A production incident involving GRC (something that went wrong) — `production_failure`
6. A stakeholder disagreement about GRC scope or control strictness — `stakeholder_conflict`

A cell is "covered" once at least one Judgment Record exists for that (domain, scenario type)
pair. For `architecture_decision`/`process_design` types specifically, a record without
`alternative_rejected` counts as partial coverage only — per the priority rule in section 2, the
engine will still surface a follow-up for that cell even though something was captured, because
an alternative-free architecture record is the specific shape of the leverage failure this whole
investigation exists to fix. `production_failure`, `audit_finding`, and `stakeholder_conflict`
records don't require a rejected alternative to count as fully covered — that shape doesn't
apply to them.

### 3.2 Gap-driven prompting

Each acquisition session, the engine:
1. Computes the coverage matrix from existing Judgment Records.
2. Picks the highest-priority gap — priority = (domain frequency in real interview traffic, from
   existing analytics already logged via `lib/logger.js`) × (scenario types still uncovered in
   that domain), with `architecture_decision`/`process_design` gaps missing an
   `alternative_rejected` weighted above brand-new empty cells, since closing those has the most
   direct effect on measured leverage.
3. Generates ONE targeted elicitation prompt for that gap, in the mentor-directive's own style:
   *"I already understand your Joiner/Mover process. I still need one representative production
   emergency involving Firefighter IDs."* This is a templated fill, not freeform LLM generation
   at this stage — the (domain, scenario type) pairing already determines almost all of the
   wording; only the "already understand X" clause needs to reference the specific covered
   scenario, filled from existing coverage data.
4. As coverage grows, prompts get more specific automatically, because they're always phrased
   against the *next* uncovered cell, not a generic "tell me about GRC" — specificity is a
   side effect of the coverage model, not a separate mechanism to build.

### 3.3 Termination / re-engagement

Not a one-time onboarding flow. The engine re-surfaces a gap opportunistically: after a live
interview session ends, if the transcript shows the candidate got a follow-up question they
answered weakly in a domain with a coverage gap, that's a strong, contextual prompt for the
*next* acquisition session ("you got asked about BRF+ conditions last week and the answer was
generic — want to walk me through a real one now?"). This ties acquisition demand directly to
observed weakness, rather than running acquisition and live interview support as two unrelated
tracks.

## 4. Adaptive Question Generator (detail on 3.2)

Kept deliberately simple and templated rather than a separate LLM-driven system, for two
reasons: (a) it's the one part of this design where getting it wrong has low cost and high
observability (a bad question just gets a shrug from the candidate, not a bad interview
answer), and (b) grounding it in the coverage matrix rather than open LLM generation avoids
this whole project's repeated lesson about instruction competition — there's no long prompt to
compete against here, because there's no prompt at all, just a lookup and a fill.

Escalation ladder per gap cell, only advancing if the previous rung didn't yield a
complete-enough record for that experience_type:
1. Open scenario prompt (as in 3.2), phrased for the specific `experience_type` — a
   `production_failure` prompt asks "walk me through a time this broke," not "what did you
   decide," since forcing a decision-shaped question onto a failure-shaped memory produces
   nothing useful.
2. If the response has situation/problem/decision but no `alternative_rejected` (and the
   experience_type is one where that matters): **direct follow-up**, generated by filling a
   template with the specific `decision` just extracted — *"What made you choose that over
   [most common alternative for this experience_type, from a small static lookup — e.g. 'a
   single global role' for architecture decisions]?"* Still templated, not open generation.
3. If the response has situation/problem/decision but no `lesson_learned`: a second templated
   follow-up — *"Looking back, what would you tell someone about to make that same call?"*
4. If still incomplete after these follow-ups: mark the cell "attempted, low-confidence" and
   move on — per the extraction pipeline's fabrication guard (5.3), the system does not keep
   pushing a candidate toward inventing a rejected alternative or a lesson that doesn't exist.

## 5. Experience Extraction Pipeline

Natural-language answer → Judgment Record(s). Structurally this is the same pattern already
proven in `eval/lib/judge.js` and `eval/lib/evalLeveraging.js` this session: an LLM call
constrained to a JSON schema via `response_format: { type: "json_object" }` (see
`eval/lib/openaiClient.js`'s `chatJSON` for the exact existing pattern to reuse), not a new
mechanism.

### 5.1 Segmentation
One acquisition answer may describe multiple pieces of experience (a whole project). A
first-pass LLM call segments the raw transcript into experience-sized spans before per-span
extraction — this directly implements "one implementation should naturally support dozens of
interview answers" by not collapsing a multi-experience narrative into one lossy record.

### 5.2 Per-span extraction
Each span → one `chatJSON` call with the Judgment Record schema (section 2) as the required
output shape, including a classification of which `experience_type` the span represents (which
determines whether `alternative_rejected` is expected). System prompt instructs the extractor to
leave any field `null` rather than infer it — this is the compression step, and it must be
lossy in the safe direction (drop unclear content) not the unsafe direction (invent structure
that sounds complete).

### 5.3 Fabrication guard (non-negotiable, given this project's established anti-fabrication
discipline)
The extractor NEVER invents an `alternative_rejected`, a `lesson_learned`, or a specific
`outcome` that the candidate didn't state. `provenance.candidate_stated_confidence` records
whether a field was explicit or implied, and downstream retrieval (section 7) should prefer
`explicit` records when multiple candidates exist for the same query — mirroring the
`candidateResume` "ground truth" framing already used in `lib/prompt/interviewPrompt.js`. A
Judgment Record with several null fields is a valid, useful, partial record — not a failure to
be papered over with inference.

### 5.4 Validation before storage
Before a record is written, run it back through a variant of the leverage judge already built
this session (`eval/lib/evalLeveraging.js`'s decision-fork detection) as a **quality gate**, for
`architecture_decision`/`process_design` records specifically: does this record contain an
actual decision fork, or did extraction just reproduce a generic best-practice statement?
Records that fail this check are flagged for a targeted follow-up (loops back into section 4's
escalation ladder) rather than stored as if complete. This reuses the exact judge logic already
validated this session instead of inventing a new completeness heuristic.

## 6. Storage

### 6.1 No new infrastructure
The codebase currently has zero database dependencies — `data/knowledgeIndex.json` (34MB,
chunk+embedding pairs, loaded fully into memory and cosine-searched in
`services/vectorSearch.js`) is the only persistence layer, alongside flat config JSON. Engineering
Memory follows the exact same pattern: `data/engineeringMemory.json`, an array of Judgment
Records, each carrying a pre-computed embedding of a canonical text rendering (situation +
problem + decision, concatenated) generated via the SAME local `Xenova/all-MiniLM-L6-v2`
pipeline already used in `services/embeddingService.js` — zero new dependencies, zero new API
cost, consistent with the existing build step in `scripts/buildKnowledge.js`.

### 6.2 Controlled vocabulary, not a new taxonomy
`tags.domain` reuses `lib/interviewAnalyzer.js`'s existing domain strings verbatim (the same
ones `DOMAIN_BOOST_MAP` in `services/vectorSearch.js` already keys on) so a Judgment Record and
a knowledge-base chunk can be scored by the same domain-boost logic without a translation layer.
`tags.sap_products` reuses the SAP artifact vocabulary already implicit in
`SAP_ARTIFACT_REGEX` (T-codes, GRAC_* objects). No new categorical system is introduced.

### 6.3 "Graph" as an emergent property, not a stored structure
Per the reframing: no adjacency-list graph database is proposed. Connectivity between records
(this GRC decision relates to that Fiori decision because both cite PFCG role design) is
computed at retrieval time from shared tags and embedding similarity — the same
`RELATED_DOMAINS` half-weight cross-domain boost mechanism already implemented and measured in
`services/vectorSearch.js`. If a genuine need for explicit relationship edges (not just shared
tags) emerges later, that's a targeted, evidence-driven addition to this store's schema, not a
reason to introduce graph-database infrastructure up front.

## 7. Retrieval Strategy

At answer-generation time, extends the existing retrieval step in `pages/api/chat.js`
(currently `fetchKnowledgeContext` → `searchKnowledge`) with a parallel call:
`searchEngineeringMemory(question, analysis, topK)`, scored with the **same formula already
proven** in `services/vectorSearch.js`:

```
finalScore = semanticScore * 0.55 + keywordScore * 0.20 + domainBoost + artifactBoost + intentBoost
```

applied to Judgment Records instead of knowledge chunks, with one addition: a
`reusable_for_categories` match against the question's classified category
(`analysis.category`) contributes an extra boost term, since a record explicitly tagged as
reusable for the current question's category (e.g. `Behavioral`) is stronger evidence of
relevance than semantic similarity alone.

Retrieved records are formatted into a new, dedicated prompt section — `RELEVANT ENGINEERING
JUDGMENT`, placed adjacent to `CANDIDATE BACKGROUND & CONTEXT` (both are candidate-sourced
ground truth) — rendering each record as the full pipeline, not just the decision, so the model
has the same "why" a mentor would give:

```
Situation: <situation>
Problem: <problem>
Constraint: <constraint>
Decision: <decision>
Rejected: <alternative_rejected.approach> -- <alternative_rejected.reason_rejected>  [if present]
Outcome: <outcome>
Lesson: <lesson_learned>  [if present]
```

This is a **new prompt section**, additive to the existing pipeline, not a re-tuning of
`CANDIDATE BACKGROUND`'s existing grounding clauses — it does not touch the currently-frozen
activation mechanism. Whether `CANDIDATE_BACKGROUND` (raw CV prose) should eventually be
retired in favor of Judgment Records entirely, or kept as a fallback when no record matches, is
an open question for the validation phase (section 9), not decided here.

## 8. Answer Generation (the sequence from the directive)

```
Question
  → analyzeInterviewQuestion()   [existing, unchanged]
  → searchEngineeringMemory()    [new -- retrieves relevant Judgment Records]
  → fetchKnowledgeContext()      [existing, unchanged -- SAP factual knowledge base]
  → buildSapInterviewPrompt()    [existing, extended with one new prompt section]
  → Interview Answer
```

`CANDIDATE_BACKGROUND` (raw CV) is not deleted from this sequence in this design — it remains
the fallback ground-truth source for domains where no Judgment Record yet exists (coverage is
necessarily partial for a long time). The system reasons from Engineering Memory first when
available, and falls back to CV prose only for gaps — this is the literal implementation of "do
not reason from the CV alone."

## 9. Integration and validation plan (still design, not implementation)

Proposed build order, each gated on the same evidence-before-code discipline as the rest of this
project:
1. Judgment Record schema + `data/engineeringMemory.json` read/write helpers (no LLM yet) —
   trivial, low-risk, unblocks everything else.
2. Extraction pipeline (5.1-5.4), validated OFFLINE against a small set of hand-written
   transcripts with known-correct expected records, covering multiple `experience_type` values
   (not just architecture decisions), before ever touching a live conversation — mirrors how
   `eval/lib/judge.js` was validated before being trusted.
3. `searchEngineeringMemory()` + the new prompt section, tested via the SAME kind of
   before/after measurement used throughout this session (generate answers with 0 vs. N seeded
   Judgment Records for one domain, measure leverage rate with the existing
   `eval/lib/evalLeveraging.js` judge) — this is the one place a full-production-scale check
   matters most, given this session's repeated finding that isolated wins don't always
   transfer.
4. Adaptive Question Generator + acquisition UI (section 3-4) — last, since it depends on
   1-3 being trustworthy, and is the highest-effort, most user-facing piece.

Each step should produce its own before/after evidence in `eval/results/` before the next step
begins, consistent with how every change this session has been gated.
