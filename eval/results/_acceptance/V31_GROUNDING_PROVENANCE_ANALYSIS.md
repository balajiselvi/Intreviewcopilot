# V3.1 Grounding & Provenance Analysis

## Evidence tiers (as implemented)

| Tier | Meaning | How the app uses it |
|---|---|---|
| A — Retrieved KB | Chunks in `knowledgeContext` / prefer enrichment | Allowlist for strip & ungrounded checks; prompt SUPPORTING KNOWLEDGE |
| B — Verified app context | Verified workflows, CV, structured interview context | Prefer / late verified backbone; experience grounding |
| C — LLM generation | Model completion | Subject to strip + ungrounded gate; must not self-ground |
| D — Prepared / procedure | `preferDecision.spoken`, `expectedSpokenAnswer` | KB-authored procedure seed; may be served via recovery |

## Failure mode proven (PFCG Q1)

- Prefer seed (Tier D from `pfcg.md`) contained `AGR_USERS` / `AGR_1251`.
- Prefer strip grounding used `primaryKnowledge || knowledgeContext` first — often **incomplete vs the seed**.
- Strip removed table identifiers → hollow “Review table for…”.
- Damaged text stored as `expectedSpokenAnswer`.
- Recovery could serve that damaged Tier D text when LIVE spoken failed ungrounded checks.

## Mandatory grounding rule (applied correction)

When validating/cleaning a **KB procedure candidate**, grounding must include the **provenance of that candidate** (the procedure source text) plus applicable retrieval context.

- Not: entire KB.
- Not: LLM text as its own evidence.
- Yes: the retrieved procedure seed that is being cleaned.

## Open-world vs SAP KB absence

Absence of an SAP KB hit does not make general OAuth/cloud knowledge invalid. Strip only removes SAP-shaped identifiers against allowlists; open-world answers in LIVE controls retained OAuth flow language without forced GUI artifacts.
