# CODEX EXECUTION PROMPT — IMPORT AND INTEGRATE THE PROVIDED TOP-100 Q&A BANK

## Context

The prepared question bank has already been authored outside the repository. Do **not** ask Codex or another model to generate, rewrite, expand, or replace the 100 answers. Your task is to import the supplied files into the existing Interview Copilot repository, wire the data into the existing question/answer resource pool, and test the matching and fallback logic.

Files supplied alongside this instruction:
- `SAP_Security_GRC_Senior_Consultant_Top_100_QA.md` — readable canonical bank.
- `SAP_Security_GRC_Senior_Consultant_Top_100_QA.json` — structured machine-readable source of truth, containing exactly 100 unique entries and matching metadata.

Target repository: `D:\My Projects\InterviewCopilot`

Read `.cursor/task_state.md` first and inspect the existing repository. The latest report states Phase E is CONDITIONAL GO: typed UI/admission is verified; microphone/system-audio is NOT TESTED. Do not mark audio as verified. Phase E also fixed a close-score cross-product merge and ARM workflow over-selection; preserve those fixes.

## Required implementation

1. Copy both supplied assets into a sensible, existing resource-bank location in the repository, or use a currently established Q&A resource convention if one exists. Prefer the JSON as the canonical runtime data source and keep Markdown as the readable reference. Avoid creating a second competing resource pool if the project already has one. If a current question-bank file exists, inspect its schema and choose a backwards-compatible import or migration.
2. Preserve all 100 canonical records and stable IDs (`SAPSC-001` through `SAPSC-100`). Validate that there are exactly 100 unique canonical questions. Do not silently edit answers. If an integration requirement forces schema adaptation, preserve the answer text byte-for-byte and report any metadata-only transformation.
3. Integrate the bank into the existing answer-resolution pipeline at the correct shared layer. Reuse existing question admission, product/task resolution, retrieval, answer formatting and streaming. Do not make a parallel UI or separate answering route.
4. Prefer, in order: exact normalized canonical question/approved variant match; high-confidence semantic match using the project's existing matching/retrieval infrastructure; existing knowledge-base retrieval; configured generation model as fallback when it is actually reachable. Only accept a prepared answer directly when both product/domain and task/intent match and material constraints are compatible.
5. Do not use product name or shared keywords alone. A question about IAG Access Analysis must not match IAG Role Design. A question about ARM must not match ARA or MSMP. Setup must not match troubleshooting. Public Edition must not merge with Private Edition procedures. Compare question intent and explicit deployment/version context before taking an answer-bank hit.
6. Keep answer matching efficient. Do not stuff all 100 answers into every model prompt. Retrieve only a small number of candidates, retain a clear confidence/compatibility decision, and fall back when no safe match exists. Do not add arbitrary thresholds without testing them against existing cases.
7. Preserve candidate truth: the technical bank is not the CV. General technical questions can use this bank even if a skill is not named in the two-page CV. Personal project claims, responsibilities, metrics and achievements must still be grounded in verified candidate records. The two entries flagged `candidate_specific` are safe response frameworks, not permission to invent facts.
8. Preserve the Phase A/B UI fix and Phase C/D/E task boundaries, response streaming, idempotency, index state, uncommitted work, backups and existing evaluation artifacts. No reset, clean, commit or push.
9. Use minimal focused tests; do not rebuild a validated knowledge index just to add these direct data records. Update `.cursor/task_state.md` with the bank path, schema, integration point, verification results and next action while preserving useful history.

## Required regression tests

- All 100 records load, have unique IDs and unique canonical questions, and required fields validate.
- Exact canonical match returns its prepared answer and bank ID.
- Normalized text/punctuation or an approved wording variant matches only when product and task agree.
- A near-match that asks a different task is rejected.
- Cross-product same-keyword matches are rejected.
- A follow-up using prior context does not incorrectly reuse a stale bank answer when task changed.
- An unrelated new question falls back to the existing knowledge base/generation path.
- No provider availability assumption: if the generation route is unavailable, report it honestly and verify the other deterministic paths.
- The existing regression examples remain correct: IAG Role Design vs Access Analysis/Request/Certification/PAM; ARA vs ARM vs MSMP/BRF+; GRC Access Control vs Process Control; S/4 Public vs Private; SAP Security/PFCG vs IAG Role Design.
- Typed UI still renders a completed answer visibly in the AI Assistant Log. Do not claim microphone/system-audio readiness unless actually tested.

Run relevant focused tests plus the existing offline suite after changes. Reuse existing result files and avoid repeating large live evaluations unless required to verify the new integration.

## Final report

Report the exact destination paths, confirmation that all 100 authored entries were imported without answer rewriting, the integration/matching path, tests and exit codes, UI proof, fallback behaviour, and remaining limitations. Do not claim the answer bank is active until an actual API/UI test demonstrates a bank match. Do not commit or push.