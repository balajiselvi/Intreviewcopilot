# Experience Acquisition Engine — Architectural Design

Status: **design only, not implemented.** Per the project direction change (see
`eval/results/LEVERAGING_BENCHMARK_2026-08-07.md` for the evidence that motivated it), this
document is a proposal to review before any code is written.

## 0. Why prompt engineering hit a ceiling (one paragraph, for context)

Across this session, five separate isolated prompt fixes were tested with rigorous
before/after measurement. All five worked when tested in a small, isolated harness. Three
survived merging into the full ~17KB production prompt; two did not, including the most recent
one (an alternative-generation instruction: 0/10 → 10/10 isolated, 0/10 at full scale). The
pattern is consistent enough to trust: **the bottleneck is not instruction wording, it's that
the model has nothing candidate-specific and decision-shaped to reach for**, so more
instructions just compete with each other over a mostly-empty well. `CANDIDATE_BACKGROUND`
today is achievement/scope prose ("delivered ARA, ARM, EAM... 11 countries, 250+ rules"), not
decisions ("I did X instead of Y because Z"). No prompt instruction can manufacture a decision
that was never captured.

## 1. The design question, and why it's the right one

> If Balaji retired tomorrow and spent four days teaching a junior SAP Security Architect
> everything he'd learned, what would that junior need to consistently make the same
> engineering decisions?

Not a resume. Not a transcript. Not a fact database. What a mentor actually transmits in that
scenario is a set of **judgment calls**: *"when you see a multi-country rollout, don't build
one global role hierarchy — here's why that fails, here's what I do instead, here's the one
time it bit me."* The junior doesn't retain everything Balaji said; they retain a manageable
number of **decision heuristics**, each anchored to a real situation, each with the reasoning
attached so it generalizes to situations that aren't identical.

That reframes the deliverable. The system being designed is **not a fact-retrieval index** (that
already exists — `services/vectorSearch.js` does that for the SAP knowledge base). It is a
**judgment-capture system**: it elicits decisions, not stories; it stores the reasoning, not the
prose; and at answer time it hands the model a decision to reason *from*, not a paragraph to
paraphrase.

Everything below is organized around that unit — a **Judgment Record** — not around a generic
graph schema. The graph-like connectivity between records (shared SAP products, shared
constraints) is a retrieval convenience that falls out of tagging, not the starting design goal.

## 2. The Judgment Record — the atomic unit

This replaces "Experience Graph node" as the primary concept. A Judgment Record is what survives
after the Extraction Pipeline (section 5) processes one real conversation turn about one real
decision.

```
JudgmentRecord {
  id: string
  situation: {
    project_context: string        // "multi-country ECC-to-S/4 transformation, ~11 countries"
    business_problem: string       // what forced a decision to be made at all
    constraints: string[]          // audit / performance / org / regulatory / timeline
  }
  decision: {
    chosen_approach: string        // what was actually done
    technical_implementation: string  // the concrete mechanics (T-codes, config, sequence)
    rejected_alternatives: [{
      approach: string
      reason_rejected: string      // the engineering reason, not "it was worse"
    }]
  }
  consequence: {
    operational_impact: string     // what this created downstream (support load, monitoring)
    audit_or_compliance_impact: string | null
    lesson_learned: string | null  // only if the candidate stated one — never inferred
  }
  people: {
    stakeholders: string[]         // roles, not names ("audit committee", "business unit leads")
    personal_responsibility: string // what Balaji himself owned in this decision
  }
  provenance: {
    source_turn_id: string         // which acquisition conversation this came from
    candidate_stated_confidence: "explicit" | "implied"  // see section 5.3 on fabrication guard
    extracted_at: timestamp
  }
  tags: {
    sap_products: string[]         // ["PFCG", "SU24", "GRC ARA"] -- controlled vocabulary, see 6.2
    domain: string                 // must be one of interviewAnalyzer.js's existing domains,
                                    // not a new parallel taxonomy (see section 6.1)
    decision_type: string          // "architecture" | "process_design" | "incident_response" | ...
    reusable_for_categories: string[]  // which CATEGORY_TEMPLATES categories this can answer
  }
}
```

Design rules that follow directly from the mentorship framing:

- **No field is free text dumped from the transcript.** Every field is what a mentor would say
  if forced to be concise — the extraction pipeline's job is compression toward transferable
  judgment, not summarization of what was said.
- **`rejected_alternatives` is not optional in spirit**, even though it's technically nullable —
  a record with no rejected alternative is exactly the shape of the "MENTIONED" (decoration,
  not leverage) failure mode this whole investigation has been diagnosing. The Adaptive
  Question Generator (section 4) treats "no alternative captured" as a signal to probe deeper
  on that specific record, not to accept it as complete.
- **One real implementation → many records.** The engineering principle from the directive
  ("capture decisions reusable across many questions, not stories") means one conversation
  about one project should typically decompose into 3-6 Judgment Records (one per distinct
  decision made on that project), not one large record. This is what makes a single
  four-day mentorship transfer decades of situational judgment — it's decomposed into discrete,
  addressable units.

## 3. Experience Acquisition Engine — orchestration

This is the top-level subsystem that decides *what to ask about next*. It does not talk to the
candidate directly in natural language generation terms — it identifies a coverage gap and hands
a targeted prompt to a conversational UI (new, see section 7).

### 3.1 Coverage model

Maintains a coverage matrix: rows = the domain taxonomy already defined in
`lib/interviewAnalyzer.js` (SAP Security, SAP GRC, SAP Cloud Identity/BTP, SAP Fiori Security,
SAP IDM, SAP Platform — reusing the existing taxonomy, not inventing a parallel one), columns =
a small, fixed set of **representative scenario types** per domain (not hundreds of questions —
per the directive, the minimum set that captures the majority of practical experience). Example
for SAP GRC, capped at 4-5 scenario types:

1. SoD ruleset design (how rules get built/prioritized)
2. Remediation workflow (what happens when a violation is found)
3. Emergency access governance (Firefighter model)
4. Audit/certification cycle (how compliance evidence gets produced)
5. A production incident involving GRC (something that went wrong)

A cell is "covered" once at least one Judgment Record exists for that (domain, scenario type)
pair **and** that record has a non-null `rejected_alternatives` entry (an alternative-free
record is treated as partial coverage — this is deliberately stricter than "the candidate said
something," per the whole point of this subsystem).

### 3.2 Gap-driven prompting

Each acquisition session, the engine:
1. Computes the coverage matrix from existing Judgment Records.
2. Picks the highest-priority gap — priority = (domain frequency in real interview traffic, from
   existing analytics already logged via `lib/logger.js`) × (scenario types still uncovered in
   that domain).
3. Generates ONE targeted elicitation prompt for that gap, in the mentor-directive's own style:
   *"I already understand your Joiner/Mover process. I still need one representative production
   emergency involving Firefighter IDs."* This is a templated fill, not freeform LLM generation
   at this stage — the domain/scenario-type pairing already determines almost all of the
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
`rejected_alternatives`-complete record:
1. Open scenario prompt (as in 3.2).
2. If the response has a situation and decision but no rejected alternative: **direct
   follow-up**, generated by filling a template with the specific `chosen_approach` just
   extracted — *"What made you choose that over [most common alternative for this decision_type,
   from a small static lookup keyed by decision_type — e.g. 'a single global role' for
   architecture-type decisions]?"* Still templated, not open generation.
3. If still incomplete after one follow-up: mark the cell "attempted, low-confidence" and move
   on — per the extraction pipeline's fabrication guard (5.3), the system does not keep pushing
   a candidate toward inventing a rejected alternative that doesn't exist.

## 5. Experience Extraction Pipeline

Natural-language answer → Judgment Record(s). Structurally this is the same pattern already
proven in `eval/lib/judge.js` and `eval/lib/evalLeveraging.js` this session: an LLM call
constrained to a JSON schema via `response_format: { type: "json_object" }` (see
`eval/lib/openaiClient.js`'s `chatJSON` for the exact existing pattern to reuse), not a new
mechanism.

### 5.1 Segmentation
One acquisition answer may describe multiple decisions (a whole project). A first-pass LLM call
segments the raw transcript into decision-sized spans before per-span extraction — this
directly implements "one implementation should naturally support dozens of interview answers"
by not collapsing a multi-decision narrative into one lossy record.

### 5.2 Per-span extraction
Each span → one `chatJSON` call with the Judgment Record schema (section 2) as the required
output shape. System prompt instructs the extractor to leave any field `null` rather than infer
it — this is the compression step, and it must be lossy in the safe direction (drop unclear
content) not the unsafe direction (invent structure that sounds complete).

### 5.3 Fabrication guard (non-negotiable, given this project's established anti-fabrication
discipline)
The extractor NEVER invents a `rejected_alternatives` entry, a `lesson_learned`, or a specific
consequence that the candidate didn't state. `provenance.candidate_stated_confidence` records
whether a field was explicit or implied, and downstream retrieval (section 6) should prefer
`explicit` records when multiple candidates exist for the same query — mirroring the
`candidateResume` "ground truth" framing already used in `lib/prompt/interviewPrompt.js`. A
Judgment Record with several null fields is a valid, useful, partial record — not a failure to
be papered over with inference.

### 5.4 Validation before storage
Before a record is written, run it back through a variant of the leverage judge already built
this session (`eval/lib/evalLeveraging.js`'s decision-fork detection) as a **quality gate**: does
this record contain an actual decision fork, or did extraction just reproduce a generic
best-practice statement? Records that fail this check are flagged for a targeted follow-up
(loops back into section 4's escalation ladder) rather than stored as if complete. This reuses
the exact judge logic already validated this session instead of inventing a new completeness
heuristic.

## 6. Storage

### 6.1 No new infrastructure
The codebase currently has zero database dependencies — `data/knowledgeIndex.json` (34MB,
chunk+embedding pairs, loaded fully into memory and cosine-searched in
`services/vectorSearch.js`) is the only persistence layer, alongside flat config JSON. The
Judgment Store follows the exact same pattern: `data/judgmentStore.json`, an array of Judgment
Records, each carrying a pre-computed embedding of a canonical text rendering (situation +
decision, concatenated) generated via the SAME local `Xenova/all-MiniLM-L6-v2` pipeline already
used in `services/embeddingService.js` — zero new dependencies, zero new API cost, consistent
with the existing build step in `scripts/buildKnowledge.js`.

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
`searchJudgmentRecords(question, analysis, topK)`, scored with the **same formula already
proven** in `services/vectorSearch.js`:

```
finalScore = semanticScore * 0.55 + keywordScore * 0.20 + domainBoost + artifactBoost + intentBoost
```

applied to Judgment Records instead of knowledge chunks. Retrieved records are formatted into a
new, dedicated prompt section — proposed name `RELEVANT ENGINEERING JUDGMENT`, placed adjacent
to `CANDIDATE BACKGROUND & CONTEXT` (both are candidate-sourced ground truth) — rendering each
record compactly:

```
Situation: <situation.project_context> -- <situation.business_problem>
Decision: <decision.chosen_approach>, rejecting <rejected_alternatives[0].approach>
  because <rejected_alternatives[0].reason_rejected>
Consequence: <consequence.operational_impact>
```

This is a **new prompt section**, additive to the existing pipeline, not a re-tuning of
`CANDIDATE BACKGROUND`'s existing grounding clauses — it does not touch the currently-frozen
activation mechanism. Whether `CANDIDATE_BACKGROUND` (raw CV prose) should eventually be
retired in favor of Judgment Records entirely, or kept as a fallback when no record matches, is
an open question for the validation phase (section 9), not decided here.

## 8. Answer Generation (the sequence from the directive)

```
Question
  → analyzeInterviewQuestion() [existing, unchanged]
  → searchJudgmentRecords()    [new — retrieves relevant Judgment Records]
  → fetchKnowledgeContext()    [existing, unchanged — SAP factual knowledge base]
  → buildSapInterviewPrompt()  [existing, extended with one new prompt section]
  → Interview Answer
```

`CANDIDATE_BACKGROUND` (raw CV) is not deleted from this sequence in this design — it remains
the fallback ground-truth source for domains where no Judgment Record yet exists (coverage is
necessarily partial for a long time). The system reasons from the Experience [Judgment] source
first when available, and falls back to CV prose only for gaps — this is the literal
implementation of "do not reason from the CV alone."

## 9. Integration and validation plan (still design, not implementation)

Proposed build order, each gated on the same evidence-before-code discipline as the rest of this
project:
1. Judgment Record schema + `data/judgmentStore.json` read/write helpers (no LLM yet) —
   trivial, low-risk, unblocks everything else.
2. Extraction pipeline (5.1-5.4), validated OFFLINE against a small set of hand-written
   transcripts with known-correct expected records, before ever touching a live conversation —
   mirrors how `eval/lib/judge.js` was validated before being trusted.
3. `searchJudgmentRecords()` + the new prompt section, tested via the SAME kind of before/after
   measurement used throughout this session (generate answers with 0 vs. N seeded Judgment
   Records for one domain, measure leverage rate with the existing `eval/lib/evalLeveraging.js`
   judge) — this is the one place a full-production-scale check matters most, given this
   session's repeated finding that isolated wins don't always transfer.
4. Adaptive Question Generator + acquisition UI (section 3-4) — last, since it depends on
   1-3 being trustworthy, and is the highest-effort, most user-facing piece.

Each step should produce its own before/after evidence in `eval/results/` before the next step
begins, consistent with how every change this session has been gated.
