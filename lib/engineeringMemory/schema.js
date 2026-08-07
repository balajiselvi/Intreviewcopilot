const { z } = require("zod");

// Engineering Memory Platform -- Version 1 schema. See docs/EXPERIENCE_ACQUISITION_ENGINE_DESIGN.md
// section 2 (Judgment Record) and section 3.1 (Engineering Principle) for the full rationale.
// Per section 0.5 (continuous learning philosophy): this schema is a starting point, not a
// wall -- experience_type, domain, and sap_products are open string fields with a recommended
// vocabulary (below), not closed enums, so new categories can appear as real usage reveals them
// without a schema migration.

// Recommended vocabulary, not enforced as a closed set -- see the continuous-learning note
// above. New values are expected to appear over time.
const RECOMMENDED_EXPERIENCE_TYPES = Object.freeze([
  "architecture_decision",
  "process_design",
  "production_failure",
  "audit_finding",
  "stakeholder_conflict",
  "mistake_and_lesson"
]);

const AlternativeRejectedSchema = z.object({
  approach: z.string().min(1),
  reason_rejected: z.string().min(1)
});

// Every pipeline field is nullable except `situation` -- per the design doc, a partial record
// (most fields null) is valid and useful. `situation` is the one thing that must exist for a
// record to be findable/meaningful at all.
const JudgmentRecordSchema = z.object({
  id: z.string().min(1),

  situation: z.string().min(1),
  problem: z.string().nullable().default(null),
  constraint: z.string().nullable().default(null),
  decision: z.string().nullable().default(null),
  alternative_rejected: AlternativeRejectedSchema.nullable().default(null),
  implementation: z.string().nullable().default(null),
  outcome: z.string().nullable().default(null),
  lesson_learned: z.string().nullable().default(null),

  people: z.object({
    stakeholders: z.array(z.string()).default([]),
    personal_responsibility: z.string().nullable().default(null)
  }).default({ stakeholders: [], personal_responsibility: null }),

  provenance: z.object({
    source_turn_id: z.string().min(1),
    candidate_stated_confidence: z.enum(["explicit", "implied"]),
    recall_confidence: z.enum(["high", "medium", "low"]).default("high"),
    extracted_at: z.number() // epoch ms -- stamped by the caller, not generated inside this module (Date.now() is intentionally not called here so this module stays trivially testable/deterministic)
  }),

  tags: z.object({
    sap_products: z.array(z.string()).default([]),
    domain: z.string().min(1),
    experience_type: z.string().min(1),
    reusable_for_categories: z.array(z.string()).default([])
  }),

  // Embedding of a canonical text rendering (situation + problem + decision), populated by the
  // extraction/indexing step, not required at construction time -- a record can exist and be
  // read back before it's been embedded.
  embedding: z.array(z.number()).nullable().default(null)
});

const EngineeringPrincipleSchema = z.object({
  id: z.string().min(1),
  statement: z.string().min(1),
  status: z.enum(["proposed", "confirmed", "modified", "rejected"]).default("proposed"),
  derived_from: z.array(z.string()).min(1), // Judgment Record ids
  domain_scope: z.array(z.string()).default([]),
  confirmation: z.object({
    confirmed_at: z.number().nullable().default(null),
    candidate_wording: z.string().nullable().default(null)
  }).default({ confirmed_at: null, candidate_wording: null }),
  embedding: z.array(z.number()).nullable().default(null)
});

function parseJudgmentRecord(candidate) {
  return JudgmentRecordSchema.parse(candidate);
}

function parseEngineeringPrinciple(candidate) {
  return EngineeringPrincipleSchema.parse(candidate);
}

module.exports = {
  JudgmentRecordSchema,
  EngineeringPrincipleSchema,
  RECOMMENDED_EXPERIENCE_TYPES,
  parseJudgmentRecord,
  parseEngineeringPrinciple
};
