// Engineering Memory Platform -- Version 1, build order step 2 (extraction pipeline).
// See docs/EXPERIENCE_ACQUISITION_ENGINE_DESIGN.md section 7.
//
// `chatJSON` is injected, not imported directly, so this module has no dependency on any
// particular OpenAI client wiring (eval-harness or production) -- callers pass in whatever
// structured-output function they have. This mirrors the existing DI pattern already used in
// lib/container.js / services/retrievalService.js (embedder and queryExpander are injected
// there too), and keeps this module usable from an offline test today without any change
// needed when it's wired into a live path later.

const SEGMENTATION_SYSTEM_PROMPT = `You segment a candidate's spoken answer about their real SAP engineering career into distinct, self-contained pieces of experience.

One raw answer may describe multiple separate situations -- different decisions, different incidents, different projects -- even within one project. Your job is to split the transcript into spans, where each span is ONE situation-to-outcome arc that could stand alone as its own memory.

Rules:
- Do not summarize or rewrite the candidate's words. Each span is a verbatim contiguous excerpt from the transcript. You may trim ONLY pure discourse filler that carries zero information (e.g. a bare "so," "okay," "right" at the very start with nothing else). NEVER trim a sentence that hedges on facts ("I think," "roughly," "I don't remember exactly," "something like," "I'm fairly sure") -- that hedging is itself meaningful content a later step depends on, not disposable preamble, even when it comes before the "real" content starts.
- If the transcript genuinely describes only one situation, return exactly one span containing the whole thing -- do not force a split that isn't there.
- CRITICAL -- do not split a single incident's internal chain apart. If a sentence describes the cause/situation, the next describes what was done about it, and a further sentence describes the result -- that is ONE arc and belongs in ONE span, even though it's several sentences. A sentence only earns its own span if it introduces a genuinely NEW situation (a different project, a different problem, a different decision) -- never split purely because there's a paragraph break or a new sentence.
- Test before finalizing a split: could this span stand alone and still name what situation it's about, without the reader having seen the previous span? If a span would be meaningless or would have to invent its own vague situation to make sense on its own (e.g. it's just the outcome sentence of the previous span's story), merge it back into the span before it instead of emitting it separately.
- Do not invent spans for things the candidate didn't say.

Return ONLY valid JSON: { "spans": ["...", "..."] }`;

function buildExtractionSystemPrompt() {
  return `You extract ONE piece of structured engineering judgment from a single span of a candidate's real, spoken account of their SAP engineering career. This is not summarization -- it is compression toward what a mentor would tell a junior architect, in the mentor's own reasoning shape.

Extract these fields, in this order, from the span:
- situation: the project/context this happened in. REQUIRED -- if the span genuinely doesn't establish any situation, that's a sign this span shouldn't have been extracted at all.
- problem: what specifically forced attention or a decision. Null if not stated.
- constraint: the thing that ruled out the easy/obvious answer. Null if not stated.
- decision: what was actually done. Null if not stated.
- alternative_rejected: { approach, reason_rejected } -- ONLY if the candidate explicitly describes an alternative they considered and rejected, with a reason. Null otherwise. Do NOT invent a plausible-sounding alternative the candidate didn't mention -- a null here is far more valuable than a fabricated one, because a real candidate cannot defend a rejected alternative they never actually considered.
- implementation: the concrete technical mechanics (T-codes, config, sequence) if stated. Null otherwise.
- outcome: what actually happened as a result, if stated. Null otherwise -- do not assume a decision "worked" if the candidate didn't say so.
- lesson_learned: ONLY if the candidate states something they'd tell someone else, or explicitly reflects on what they'd do differently or reinforce. Null otherwise -- do not manufacture a moral to the story.

Also classify:
- experience_type: one of "architecture_decision", "process_design", "production_failure", "audit_finding", "stakeholder_conflict", "mistake_and_lesson" -- pick whichever best fits. If none genuinely fit, you may use a new short snake_case label instead of forcing a bad fit (this vocabulary is expected to grow over time, it is not a closed list).
- candidate_stated_confidence: "explicit" if most extracted fields came directly from what was said, "implied" if you had to read between the lines for most of them.
- reusable_for_categories: which of these interview question categories this experience could answer if asked directly: Architecture, Role Design, Security, Behavioral, Leadership, Audit, Troubleshooting, Production Support, Workflow, Migration. List every category this plausibly serves, not just the most obvious one -- a real production failure often serves Behavioral and Troubleshooting and Leadership at once.
- sap_products: array of any specific SAP transaction codes, modules, or named tools mentioned (e.g. "PFCG", "SU24", "GRC ARA"). Empty array if none named.
- domain: the single best-fit SAP domain for this experience, from: "SAP Security", "SAP GRC", "SAP Cloud Identity / BTP", "SAP Fiori Security", "SAP IDM", "SAP Platform".

Return ONLY valid JSON in this exact shape:
{
  "situation": "...",
  "problem": "..." | null,
  "constraint": "..." | null,
  "decision": "..." | null,
  "alternative_rejected": { "approach": "...", "reason_rejected": "..." } | null,
  "implementation": "..." | null,
  "outcome": "..." | null,
  "lesson_learned": "..." | null,
  "experience_type": "...",
  "candidate_stated_confidence": "explicit" | "implied",
  "reusable_for_categories": ["..."],
  "sap_products": ["..."],
  "domain": "..."
}`;
}

// Isolated as its own call rather than one of many things asked in buildExtractionSystemPrompt()
// above -- an offline test (eval/testEngineeringMemoryExtraction.js) found recall_confidence
// classification failing when it was bundled alongside ~7 other extraction asks in one prompt,
// even on a transcript with blatant hedging ("I think", "I don't remember the exact numbers",
// "roughly", "I'm fairly sure", "I don't recall"). This mirrors the exact "isolate a competing
// instruction as its own step" fix already proven repeatedly on the production interview prompt
// this session (see eval/results/LEVERAGING_BENCHMARK_2026-08-07.md) -- the same failure mode,
// a different prompt. Unlike the live interview path, extraction runs offline/async during
// acquisition, so an extra call here doesn't touch the single-pass live-latency constraint.
const RECALL_CONFIDENCE_SYSTEM_PROMPT = `You judge ONE thing: how certain the speaker sounds about the FACTS of what they're describing -- not their opinions, not general modesty, specifically their certainty about details like numbers, dates, names, or exact sequence of events.

"low": the speaker hedges on facts -- "I think", "roughly", "something like", "if I remember right", "I don't recall exactly", "maybe around", "I'm not 100% sure", or similar. Even one clear hedge on a specific fact is enough for "low".
"medium": some facts are stated plainly and others are hedged, or the hedging is mild/implicit.
"high": every fact is stated as definite, with no hedging language at all.

Return ONLY valid JSON: { "recall_confidence": "high" | "medium" | "low" }`;

async function classifyRecallConfidence(spanText, { chatJSON }) {
  if (!chatJSON) throw new Error("classifyRecallConfidence requires an injected chatJSON function");
  const result = await chatJSON({ system: RECALL_CONFIDENCE_SYSTEM_PROMPT, user: spanText });
  return result?.recall_confidence || "high";
}

async function segmentTranscript(rawTranscript, { chatJSON }) {
  if (!chatJSON) throw new Error("segmentTranscript requires an injected chatJSON function");
  const result = await chatJSON({ system: SEGMENTATION_SYSTEM_PROMPT, user: rawTranscript });
  if (!Array.isArray(result?.spans) || result.spans.length === 0) {
    throw new Error("Segmentation returned no spans");
  }
  return result.spans;
}

async function extractJudgmentRecordFromSpan(spanText, { chatJSON }) {
  if (!chatJSON) throw new Error("extractJudgmentRecordFromSpan requires an injected chatJSON function");
  const [extracted, recallConfidence] = await Promise.all([
    chatJSON({ system: buildExtractionSystemPrompt(), user: spanText }),
    classifyRecallConfidence(spanText, { chatJSON })
  ]);
  return { ...extracted, recall_confidence: recallConfidence };
}

module.exports = {
  SEGMENTATION_SYSTEM_PROMPT,
  buildExtractionSystemPrompt,
  RECALL_CONFIDENCE_SYSTEM_PROMPT,
  segmentTranscript,
  extractJudgmentRecordFromSpan,
  classifyRecallConfidence
};
