# Role Rationalization and Catalog Remediation

## Overview

Rationalizing thousands of SAP roles is a governance program, not a PFCG tidy-up. The decision is what access the business still needs, who owns it, and what can be retired without breaking production. Bundling everything into new composite roles usually hides the problem.

## Interview Summary

Start with a trustworthy extract: AGR_USERS, AGR_1251, user lock flags, last logon, ST03N/STAD usage, GRC ARA hits. Then cluster near-duplicates, unused roles, org-copied masters that should have been derived, and composites that exist only because naming failed. Remediate in waves with business owners, SoD simulation, and a backout assignment list.

## 30 Second Interview Answer

I would not rationalize 8,000 roles by creating more composites. I would profile the catalog: unused roles, duplicate menus, derived-vs-copy, SoD-dense composites, and users with extreme role counts. Then I would retire or merge with owner sign-off, keep derived roles for org variance, and only use composites as a thin provisioning shell over already-clean singles.

## 60 Second Interview Answer

Method:

1. Reconcile the extract to SUIM and HR active population so you are not mining stale dumps.
2. Role mining: usage versus assigned; roles never executed; transactions in the menu that never run.
3. Duplicate and near-duplicate detection (name suffix, cloned AGR_DEFINE, identical AGR_1251).
4. Structure: promote copy-paste org variants to derived roles off one master; shrink fat composites; do not invent a super-composite to "simplify" SoD.
5. Map survivors to job functions and named business owners.
6. Simulate SoD (GRC ARA / IAG Access Analysis) on the to-be catalog before cutover.
7. Wave-based assignment: pilot, PFUD/user comparison, hypercare defects, then next wave.
8. Recertify remaining high-risk access; keep a rollback mapping of old-to-new assignments.

Trade-off: speed versus residual risk. A freeze on new copy-roles during the program is usually cheaper than a big-bang swap.

## Architecture Notes

- Data: AGR_USERS, AGR_1251, USR02, STAD/ST03N, SUIM, ARA results
- Controls: owner, SoD, certification, change freeze
- Anti-pattern: composite-of-composites, SAP_ALL remnants, derived-role masters edited per country

## Related Topics

- knowledge/security/role-design.md
- knowledge/security/composite-roles.md
- knowledge/security/derived-roles.md
- knowledge/security/role-data-quality.md
