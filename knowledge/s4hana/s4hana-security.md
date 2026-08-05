# S/4HANA Security

## Overview

S/4HANA security builds on the same PFCG and authorization object foundation as ECC, but shifts emphasis toward Fiori-based business roles, simplified authorization objects tied to the new data model, and different SoD considerations because S/4HANA consolidates functionality that used to span multiple ECC transactions into fewer, broader ones.

## Interview Summary

The mechanics of authorization checking haven't changed from ECC — it's still AUTHORITY-CHECK against authorization objects assigned through PFCG roles. What's different is the shape of the roles: S/4HANA business roles are Fiori-app-centric, some authorization objects were simplified or consolidated with the move away from classic tables, and SoD analysis has to account for transactions that now do more than their ECC equivalent did.

## 30 Second Interview Answer

S/4HANA security runs on the same authorization mechanics as ECC — PFCG roles, authorization objects, AUTHORITY-CHECK at runtime. What changes is the role shape. S/4HANA is Fiori-first, so business roles are built around app catalogs and groups rather than transaction lists, and some transactions got consolidated or simplified, which means segregation of duties analysis has to be re-baselined rather than just carried over from ECC.

## 60 Second Interview Answer

S/4HANA security is built on the same foundation as ECC security — PFCG roles, authorization objects, the same AUTHORITY-CHECK runtime mechanism. Nothing about the fundamental enforcement model changed.

What's different is the shape of the access. S/4HANA is designed around Fiori as the primary user interface, so business roles are built around Fiori catalogs and groups that determine which apps show up on a user's launchpad, in addition to the traditional backend authorization objects those apps still need. Some classic transactions were consolidated or simplified in S/4HANA's data model — the new MM/FI integration, for example, changed how certain authorization checks apply compared to their ECC equivalent.

The practical consequence for security teams is that segregation of duties analysis can't just be copied over from ECC. A transaction that did one narrow thing in ECC might now be part of a broader Fiori app doing more, which changes what functions and risks actually apply, and rulesets need to be re-evaluated against the S/4HANA-specific transaction and app landscape rather than assumed to carry over unchanged.

## 90 Second Interview Answer

S/4HANA security doesn't change the fundamental authorization enforcement model — it's still PFCG-built roles carrying authorization objects, checked at runtime through the same AUTHORITY-CHECK mechanism that's been in SAP since the ECC days and before. Anyone who understands classic SAP security mechanics already understands the runtime layer of S/4HANA security.

What genuinely changes is the shape of what gets built. S/4HANA is architected Fiori-first, meaning the primary user experience is app tiles on a launchpad rather than transaction codes typed into a command field. Business roles in S/4HANA are built around Fiori catalogs and groups — catalogs determine which apps a role can access, groups determine how those apps are organized on the launchpad — layered on top of the traditional backend authorization objects those apps still ultimately depend on. A well-designed S/4HANA role has to get both layers right: the Fiori catalog and group assignment for launchpad access, and the underlying authorization objects for what the app is actually allowed to do once opened.

The other significant shift is in the transaction and data model landscape itself. S/4HANA consolidated a lot of functionality that spanned multiple separate ECC transactions into fewer, more integrated apps — the universal journal in FI is the classic example, merging what used to be separate FI and CO data structures. This has a direct security consequence: authorization objects and the business functions they represent don't map one-to-one from ECC to S/4HANA in every case, which means segregation of duties rulesets built for an ECC landscape can't simply be ported over and trusted. They need to be re-evaluated against what the S/4HANA transactions and Fiori apps actually do, because a function that was narrow and separable in ECC might now be part of a broader, more integrated app in S/4HANA, changing what combinations actually represent genuine conflict risk.

## Architecture

- PFCG roles and authorization objects: unchanged foundational mechanism from ECC
- Fiori catalogs: determine which apps a role grants launchpad access to
- Fiori groups: organize app tiles on the launchpad
- Backend authorization objects: still required for what an app is allowed to do
- Simplified/consolidated data model: changes what some authorization objects and transactions actually represent

## Runtime Flow

A user opens their Fiori launchpad, and the tiles they see are determined by the Fiori catalogs and groups assigned through their role. Selecting a tile launches the underlying app, which — exactly like a classic ECC transaction — executes AUTHORITY-CHECK statements against the backend authorization objects required for that app's functionality. The Fiori layer controls visibility and access to the app itself; the backend authorization objects control what the app is allowed to actually do once opened.

## Configuration

- Build S/4HANA business roles combining Fiori catalog/group assignment with backend authorization objects
- Maintain SU24 defaults for S/4HANA-specific and custom Fiori apps
- Re-evaluate segregation of duties rulesets against the S/4HANA transaction and app landscape
- Validate authorization object behavior against the simplified data model where relevant

## Implementation Activities

- Design S/4HANA business roles around Fiori app groupings tied to actual job functions
- Map Fiori catalogs and groups alongside backend authorization content for each role
- Re-baseline segregation of duties analysis for the S/4HANA-specific transaction landscape
- Validate authorization behavior for consolidated or simplified transactions against ECC expectations

## Migration Activities

- Compare ECC role authorization content against equivalent S/4HANA business roles during a conversion
- Identify transactions that were consolidated or simplified and reassess their authorization impact
- Re-run segregation of duties analysis against the S/4HANA target rather than assuming ECC results carry over

## Rollout Activities

- Extend S/4HANA business role templates to new business units with Fiori-appropriate catalog and group assignments
- Validate localized Fiori app availability matches the rollout entity's actual business processes
- Re-test segregation of duties for the expanded S/4HANA user population

## Production Support Activities

- Investigate Fiori app access issues distinguishing catalog/group problems from backend authorization problems
- Maintain SU24 data for custom S/4HANA Fiori apps
- Support ongoing segregation of duties monitoring as the S/4HANA landscape evolves

## Troubleshooting

Common issue: a user can see a Fiori tile but the app fails with an authorization error when opened.
Root cause: Fiori catalog/group access was granted, but the backend authorization objects the app needs weren't included in the role.
Resolution: identify the missing backend authorization object, typically via trace, and add it to the role.

Common issue: a segregation of duties conflict wasn't caught that should have been, based on the ECC ruleset.
Root cause: the S/4HANA transaction or app consolidates functionality differently than its ECC equivalent, and the ruleset wasn't updated to reflect that.
Resolution: re-evaluate the ruleset's function definitions against actual S/4HANA transaction behavior.

Common issue: a Fiori app doesn't appear on the launchpad even though the role seems correctly assigned.
Root cause: the Fiori catalog or group assignment is missing or misconfigured, separate from the backend authorization content.
Resolution: verify catalog and group assignment specifically, independent of backend authorization checks.

## Common Interview Questions

1. Does the authorization check mechanism differ between ECC and S/4HANA?
2. What's the role of Fiori catalogs and groups in S/4HANA security?
3. How do you design a business role for S/4HANA?
4. Why can't ECC segregation of duties rulesets be directly reused for S/4HANA?
5. What's the relationship between Fiori launchpad access and backend authorization?
6. How would you troubleshoot a Fiori tile visible but the app failing?
7. What changed in the S/4HANA data model that affects security?
8. How do you handle SU24 maintenance for custom Fiori apps?
9. What's the universal journal and why does it matter for security?
10. How would you migrate ECC roles to S/4HANA business roles?
11. What's the difference between a Fiori catalog and a Fiori group?
12. How do you validate segregation of duties for consolidated S/4HANA transactions?
13. What's your approach to re-baselining SoD analysis during an S/4HANA conversion?
14. How do you handle authorization for apps spanning multiple functional areas?
15. What's the risk of assuming ECC and S/4HANA authorization objects map one-to-one?
16. How would you design roles for a greenfield S/4HANA implementation?
17. What's your process for validating Fiori app authorization before go-live?
18. How do you handle S/4HANA security for a brownfield conversion from ECC?
19. What's the impact of simplified transactions on authorization object design?
20. How do you troubleshoot inconsistent access between two users with the same S/4HANA role?

## Tough Follow-up Questions

1. If a brownfield conversion carries over ECC roles unchanged, what specific S/4HANA risks would you check for before go-live?
2. How would you validate that a consolidated S/4HANA transaction doesn't create a new segregation of duties conflict that didn't exist in ECC?
3. What's your process for mapping Fiori catalog and group design to actual job functions rather than copying a standard template?
4. How do you handle authorization design for a custom Fiori app built on the S/4HANA platform?
5. What's the risk of Fiori launchpad personalization creating a false sense of restricted access?
6. How would you audit an S/4HANA role catalog for leftover ECC-era assumptions that no longer apply?
7. What's your strategy for validating SoD ruleset accuracy specifically for the universal journal's merged FI/CO functionality?
8. How do you handle S/4HANA security for a hybrid landscape running both ECC and S/4HANA in parallel during migration?
9. What's the risk of over-relying on Fiori catalog restrictions without validating backend authorization independently?
10. How would you explain to an auditor why S/4HANA requires a fresh SoD baseline rather than reusing ECC's?
11. What's your process for testing S/4HANA role design against both Fiori and classic SAP GUI access paths, if both are still in use?
12. How do you handle authorization object simplification when a custom Z-transaction was built against an old ECC authorization model?
13. What's the risk of S/4HANA business role design being driven purely by Fiori app availability rather than actual business need?
14. How would you validate performance impact of authorization checks in S/4HANA's in-memory architecture compared to ECC?
15. What's your strategy for role design consistency across a multi-system S/4HANA landscape with different implementation timelines?
16. How do you handle S/4HANA security governance when business teams want faster Fiori app rollout than security review allows?
17. What's the risk of authorization gaps specifically at the boundary between Fiori app access and backend OData service authorization?
18. How would you design a validation process to catch S/4HANA-specific SoD conflicts before they reach production?
19. What's your approach to documenting the ECC-to-S/4HANA authorization mapping for future audit reference?
20. How do you handle S/4HANA security for embedded analytics apps that pull data across traditionally separate authorization domains?

## SAP Transactions

PFCG, SU24, SU25, /UI2/FLPD_CUST, /IWFND/MAINT_SERVICE

## SAP Tables

AGR_1251, AGR_TCODES, USOBT_C, USOBX_C

## Best Practices

- Design S/4HANA business roles around both Fiori catalog/group and backend authorization together, not separately
- Re-baseline segregation of duties analysis specifically for the S/4HANA transaction and app landscape
- Maintain SU24 data for every custom Fiori app built on the platform
- Validate consolidated transaction authorization behavior against ECC-era assumptions before trusting them
- Test both Fiori app access and backend authorization independently when troubleshooting

## Common Mistakes

- Assuming ECC segregation of duties rulesets carry over unchanged to S/4HANA
- Designing roles around Fiori catalog access without validating backend authorization needs
- Not maintaining SU24 for custom S/4HANA Fiori apps
- Treating a visible Fiori tile as proof the underlying access is correctly configured
- Copying ECC roles directly into S/4HANA without reassessing consolidated transaction impact

## Interviewer's Hidden Expectations

Interviewers want to hear that you understand S/4HANA security as an evolution of the same authorization mechanics, not a completely different system — while also clearly articulating what specifically changed and why that requires fresh SoD analysis rather than reused ECC assumptions.

## What Makes This a 10/10 Answer

An average answer says S/4HANA security uses Fiori and PFCG. A 10/10 answer explains that the runtime mechanism is unchanged from ECC, precisely what changed — Fiori catalog and group design, transaction consolidation — and why that specifically breaks the assumption that ECC SoD rulesets can be reused as-is.

## Red Flags

- Describing S/4HANA authorization as a fundamentally different mechanism from ECC
- Not distinguishing Fiori launchpad access from backend authorization objects
- Assuming ECC segregation of duties analysis transfers directly without re-evaluation
- No mention of SU24 maintenance for custom Fiori apps
- Not knowing what the universal journal is or why it matters for security

## Keywords

S/4HANA security, Fiori catalog, Fiori group, business role, universal journal, brownfield, greenfield, segregation of duties re-baseline

## Related Topics

- s4hana-fiori.md
- s4hana-business-roles.md
- s4hana-migration.md
