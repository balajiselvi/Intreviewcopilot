# Autonomy DECISIONS

## 2026-10-29 — Current checkpoint overrides long-term autonomy
- **Decision:** Obey CURRENT CHECKPOINT: no commit/push/branch change, no index rebuild, $0 paid, taxonomy BLOCKED, wiring needs explicit approval.
- **Alternatives:** Follow long-term §2 local autonomy branch+commit — **rejected** (checkpoint overrides).
- **Rollback:** N/A (process decision).

## 2026-10-29 — Retrieved allowlist ≠ verified
- **Decision:** `buildEntityAllowlistFromKnowledge` returns `provenance: RETRIEVED_CANDIDATE`, `verified: false`. Separate `loadVerifiedEntityRegistry` / `isVerifiedEntity` only accept explicit VERIFIED unexpired rows.
- **Why:** Checkpoint: “Entity allowlists must not automatically treat all existing knowledge as verified.”
- **Rollback:** Restore `lib/generationGuard.js` from `D:\My Projects\_InterviewCopilot_file_backups\2026-10-29-phase2-g1g2\`.

## 2026-10-29 — Edition alignment before prefer
- **Decision:** Add `procedureEditionAligned`; `shouldPreferRetrievedProcedure` refuses prefer on public↔private plane mismatch. Emit `wrapMode: senior-backbone` when seniority signals senior/manager/director.
- **Why:** Master prompt Stage 1 amendments (a)(b).
- **Rollback:** Same backup of `lib/procedureRetention.js`.

## 2026-10-29 — Dual servers not stopped
- **Decision:** Leave `:3000` and `:3102` running; both project-owned; browser active target unknown; `:3000` `/interview` timed out.
- **Why:** Runtime safety rule — stop neither when active target unclear.
- **Rollback:** N/A.

## 2026-10-29 — Chat/prompt wiring deferred
- **Decision:** Present amended diffs; do not apply until user approval.
- **Why:** Prompt/routing changes require explicit approval this checkpoint.

## 2026-10-29 — Apply amended Stage 1 wiring (addendum-approved)
- **Decision:** Wire prefer/strip/coherence/principle fallback + senior backbone; keep max_tokens=2048; do not hard-code domain T-codes in prompts; draft NEEDS_REVIEW cards instead; incomplete streams `excludeFromContext`.
- **Commit policy:** NO commits (placeholders unfilled + V2.1 preserve).
- **Rollback:** `D:\My Projects\_InterviewCopilot_file_backups\2026-10-29-stage1-wiring\`
