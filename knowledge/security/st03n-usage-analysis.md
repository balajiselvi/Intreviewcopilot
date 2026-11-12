# ST03N Usage Analysis vs Authorization Assignment

Spoken architect style: fluent Senior Principal Architect paragraphs. Lead with the usage-versus-assignment boundary before any procedure.

**Product boundary:** `ST03N` (and related workload statistics) prove **historical transaction execution**. `AGR_USERS`, `AGR_1251`, and PFCG role content prove **static assignment and authorization design**. Never treat assignment tables as proof that a user actually ran a transaction.

## Direct architectural hook

When an interviewer asks how I export the T-codes a user **used**, I start in workload analysis — typically transaction `ST03N` — not in PFCG assignment tables. `ST03N` aggregates actual dialog and task execution over a chosen period. `AGR_USERS` only tells me which roles are assigned; `AGR_1251` tells me which authorization values those roles contain. A user can hold `FB01` in a role and never execute it; conversely, usage without a clean role model is a different remediation problem.

## Architect workflow — usage mining for least privilege

1. **Capture execution:** In `ST03N`, select the workload period (day/week/month as retained in the landscape), drill to user or user+transaction views, and export the executed T-code set for the identities in scope. Where detailed statistics are still retained, `STAD` can supplement short windows; do not invent retention the Basis team has not confirmed.
2. **Capture assignment:** Separately extract `AGR_USERS` (who has which role) and role menu / `AGR_TCODES` / `AGR_1251` (what those roles authorize). This is the **assignment plane**.
3. **Reconcile:** Compare executed T-codes to assigned T-codes. Unused assigned transactions are remediation candidates; executed transactions missing from the intended role model need design or firefighting follow-up — not a silent grant of `*`.
4. **Confirm authorization reality:** For contested objects, use `STAUTHTRACE` (or `ST01` where older landscapes require it) while the user performs the business step. Trace proves the **check**, not the historical workload aggregate.
5. **Remediate through design, not guesswork:** Remove unused menu items and tighten field values using `SU24` proposals where appropriate, regenerate profiles in `PFCG`, transport, and run user comparison. Re-simulate SoD in GRC ARA / IAG when the role is risk-relevant.
6. **Validate:** Business UAT for required paths; negative tests for removed access; confirm `ST03N` no longer shows the retired unused path as required for the job — assignments and traces stay consistent with the new design.

## What I never say

- I never say "`AGR_USERS` shows what the user executed."
- I never say `S_TCODE` in a role proves the transaction was used.
- I never use Security Audit Log `SM20` as a general substitute for workload export unless the question is specifically about audited security events.

## Governance impact

Usage-based role remediation is how Clean Core and SOX ITGC programmes shrink toxic access before cutover: you remove what was never executed, keep what the business proved in trace and UAT, and retain evidence that assignment changes followed measured usage — not opinion.

## Related Topics

- knowledge/security/role-rationalization.md
- knowledge/security/pfcg.md
- knowledge/security/core-sap-security-authorizations-architect-bank.md
- knowledge/troubleshooting/authorization-errors.md
