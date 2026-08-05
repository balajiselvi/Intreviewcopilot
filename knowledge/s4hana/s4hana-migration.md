# S/4HANA Migration (Security Perspective)

## Overview

Migrating to S/4HANA — whether brownfield conversion or greenfield reimplementation — has direct security consequences beyond the technical data migration itself. Roles need reassessment against the new data model, segregation of duties has to be re-baselined, and the migration path chosen fundamentally changes how much of the existing authorization design carries forward versus needing rebuild.

## Interview Summary

A brownfield conversion technically carries over existing roles, but that doesn't mean the authorization design is still correct — consolidated transactions and data model changes mean roles need reassessment, not just a technical pass-through. A greenfield implementation means designing authorization fresh, which is more work upfront but avoids inheriting years of ECC role catalog drift.

## 30 Second Interview Answer

From a security standpoint, migration path matters a lot. A brownfield conversion technically carries your existing roles forward, but that's a trap if you assume the authorization design is still correct — S/4HANA's data model changes mean some transactions got consolidated, and roles need reassessment, not just a technical pass-through. Greenfield means designing security fresh, more upfront work, but you're not inheriting years of accumulated ECC role catalog problems either.

## 60 Second Interview Answer

Migration path is a real security decision, not just a technical one. In a brownfield conversion, existing PFCG roles technically transport and continue functioning, because the underlying authorization mechanism hasn't changed. But "it still works" isn't the same as "it's still correctly designed" — S/4HANA's simplified data model consolidated functionality that used to span multiple ECC transactions, which means the segregation of duties risk profile for those roles may have genuinely changed even though the role definition itself didn't.

Greenfield implementations avoid that trap by designing authorization fresh against actual current business processes, using S/4HANA's Fiori-first business role model from the start rather than inheriting an ECC-era role catalog. That's real upfront investment, but it also means not carrying forward years of accumulated role catalog drift, duplicate roles, and stale SoD assumptions that brownfield conversions inherit by default.

Either path needs the same fundamental discipline: re-baseline segregation of duties analysis against the actual S/4HANA target system, don't assume ECC analysis results are still valid.

## 90 Second Interview Answer

The choice between brownfield conversion and greenfield reimplementation has real security implications that go beyond the technical migration mechanics, and it's a decision security should have real input into, not just technical Basis and functional teams.

Brownfield conversion technically preserves existing PFCG roles — they transport, they generate, they continue functioning against the converted system, because the fundamental authorization mechanism is unchanged between ECC and S/4HANA. The risk is treating that technical continuity as proof the authorization design is still correct. S/4HANA's simplified data model consolidated functionality that used to require multiple separate ECC transactions into fewer, more integrated ones — the universal journal merging FI and CO data is the standard example. A role that was correctly scoped and SoD-clean in ECC can end up granting a materially different risk profile in S/4HANA purely because the underlying transaction now does more, even though nobody touched the role definition itself.

Greenfield reimplementation sidesteps that specific trap by designing authorization from scratch against current business processes, using S/4HANA's Fiori-first, job-function-first business role model as the design starting point rather than inheriting an ECC-era transaction-based role catalog. This is genuinely more upfront work — there's no shortcut to designing a role catalog properly — but it also means not carrying forward years of accumulated role catalog problems: duplicate roles built by copying rather than designing, stale SoD assumptions nobody revisited, and naming conventions that stopped making sense a decade ago.

Whichever path an organization takes, the non-negotiable security activity is the same: segregation of duties analysis has to be re-baselined against the actual S/4HANA target system's transaction and authorization landscape, not assumed to carry over from whatever the ECC analysis concluded. This is the single most common gap in migration security work — treating the migration as primarily a data and technical exercise and leaving authorization risk assessment as an afterthought, discovered only when production access reviews or an audit surfaces conflicts that should have been caught during the project.

## Architecture

- Brownfield conversion: existing PFCG roles carry forward technically, requiring reassessment
- Greenfield implementation: authorization designed fresh against current business processes
- Universal journal and data model consolidation: the specific driver of changed SoD risk profiles
- SoD re-baselining: the non-negotiable activity regardless of migration path

## Runtime Flow

During a brownfield conversion, existing roles are transported and regenerated against the S/4HANA target system using the same PFCG mechanics as any role change. During greenfield, roles are built from scratch using standard PFCG role-building activities against newly designed business role definitions. In both cases, the resulting profiles are checked at runtime through the same unchanged AUTHORITY-CHECK mechanism.

## Configuration

- For brownfield: run SU25 to reconcile SU24 default changes introduced by the S/4HANA target release
- For greenfield: configure business roles fresh using S/4HANA's Fiori-first design approach
- Re-baseline the segregation of duties ruleset against the S/4HANA target system regardless of path
- Validate consolidated transaction authorization behavior specifically before go-live

## Implementation Activities

- Assess existing ECC roles for S/4HANA-specific SoD risk changes during brownfield conversion planning
- Design fresh business roles against current business processes for greenfield implementations
- Run SU25 reconciliation as part of the brownfield technical migration
- Re-baseline and validate segregation of duties analysis against the S/4HANA target before go-live

## Migration Activities

- Compare ECC and S/4HANA authorization object behavior for consolidated transactions
- Validate transported roles generated correctly in the S/4HANA target environment
- Re-run comprehensive segregation of duties analysis post-conversion, not just spot checks

## Rollout Activities

- Apply the established S/4HANA role design approach — brownfield-carried or greenfield-designed — to new rollout entities
- Validate SoD analysis for the expanded population against the S/4HANA-specific ruleset
- Ensure new business units don't inherit brownfield-era assumptions if the organization is otherwise greenfield

## Production Support Activities

- Investigate authorization issues that trace back to unaddressed brownfield-era role assumptions
- Support ongoing SoD monitoring specifically calibrated to the S/4HANA transaction landscape
- Maintain role documentation reflecting the actual post-migration authorization design

## Troubleshooting

Common issue: a segregation of duties conflict surfaces in production that wasn't caught during the migration project.
Root cause: SoD analysis wasn't re-baselined against the S/4HANA target, and the ECC-era analysis missed a conflict created by consolidated transaction functionality.
Resolution: run a comprehensive SoD re-baseline against the current S/4HANA landscape and remediate findings.

Common issue: a brownfield-converted role behaves differently than expected after go-live.
Root cause: SU24 default changes for the S/4HANA release weren't reconciled through SU25 before the role was regenerated.
Resolution: complete SU25 reconciliation and regenerate the role against corrected authorization data.

Common issue: greenfield-designed roles take significantly longer to build than the project timeline allowed.
Root cause: the upfront investment of designing authorization from scratch was underestimated during project planning.
Resolution: adjust timeline expectations and prioritize role design for the highest-risk or highest-volume job functions first.

## Common Interview Questions

1. What's the security difference between a brownfield conversion and a greenfield implementation?
2. Why can't you assume ECC segregation of duties analysis still applies after a brownfield conversion?
3. What role does SU25 play in a brownfield S/4HANA migration?
4. What's the risk of treating S/4HANA migration as purely a technical data exercise?
5. How would you decide between brownfield and greenfield from a security perspective?
6. What's the impact of the universal journal on migration-related SoD risk?
7. How do you re-baseline segregation of duties analysis for S/4HANA?
8. What's the advantage of greenfield role design over inherited brownfield roles?
9. How would you assess existing ECC roles for S/4HANA-specific risk before converting?
10. What's your process for validating transported roles generated correctly post-migration?
11. How do you handle role design timeline expectations for a greenfield implementation?
12. What's the risk of brownfield conversion carrying forward years of role catalog drift?
13. How would you prioritize which roles to review first during a brownfield conversion?
14. What's your approach to SoD validation before a migration go-live?
15. How do you handle migration security when the organization is doing a hybrid brownfield-greenfield approach?
16. What's the audit risk of undiscovered SoD conflicts after a migration?
17. How would you communicate migration security risk to project leadership focused on timeline?
18. What's the relationship between data model simplification and authorization risk?
19. How do you validate consolidated transaction behavior before trusting existing role design?
20. What's your process for post-go-live SoD monitoring after a migration?

## Tough Follow-up Questions

1. If a brownfield conversion project deprioritized security re-baselining to meet a deadline, how would you advocate for it without derailing the timeline?
2. How would you design a risk-based approach to reviewing which brownfield-converted roles need the most urgent reassessment?
3. What's your process for validating that a greenfield role design genuinely avoids inheriting ECC-era problems rather than just recreating them with new names?
4. How do you handle migration security for an organization doing a phased, multi-year S/4HANA rollout across business units?
5. What's the risk of migration security work being owned entirely by a project team that disbands after go-live, with no ongoing accountability?
6. How would you build a business case for the additional time greenfield role design requires?
7. What's your strategy for validating SoD re-baselining actually caught the conflicts introduced by data model consolidation, not just superficial rule reapplication?
8. How do you handle migration security when brownfield conversion timeline pressure leads to "lift and shift" role migration with a promise to "fix it later"?
9. What's the risk of migration security testing happening only in a sandbox that doesn't reflect actual production data volume and complexity?
10. How would you explain to an audit committee why migration-related SoD risk deserves dedicated project budget, not just technical migration budget?
11. What's your process for validating custom Z-transaction authorization behavior specifically survived the S/4HANA conversion correctly?
12. How do you handle a scenario where post-go-live SoD analysis finds far more conflicts than expected, threatening the go-live decision?
13. What's the risk of migration security being treated as complete once go-live happens, with no post-go-live monitoring plan?
14. How would you design a rollback or contingency plan specifically for security-related migration failures?
15. What's your strategy for training the organization's ongoing security team on S/4HANA-specific risk patterns introduced by the migration?
16. How do you handle migration security governance when multiple system integrators are involved with different security practices?
17. What's the risk of underestimating the effort required for SoD re-baselining and having it become the critical path blocking go-live?
18. How would you validate that emergency access processes are properly reconfigured for the new S/4HANA landscape before go-live?
19. What's your approach to documenting migration-specific security decisions for future audit and knowledge transfer?
20. How do you handle a scenario where business stakeholders want to defer security re-baselining until after go-live to hit a deadline?

## SAP Transactions

SU25, PFCG, SU24, SPAU, SPDD

## SAP Tables

USOBT_C, USOBX_C, AGR_1251, AGR_TCODES

## Best Practices

- Give security genuine input into the brownfield versus greenfield decision, not just technical teams
- Never assume brownfield-converted roles are still correctly designed just because they still function
- Re-baseline segregation of duties analysis against the S/4HANA target system as a non-negotiable activity
- Complete SU25 reconciliation as part of every brownfield conversion, not an optional step
- Plan realistic timeline for greenfield role design rather than underestimating the effort

## Common Mistakes

- Treating S/4HANA migration as purely a technical data exercise with security as an afterthought
- Assuming brownfield-converted roles are still correctly designed because they still technically function
- Skipping or rushing SU25 reconciliation under timeline pressure
- Deferring segregation of duties re-baselining until after go-live
- Underestimating the effort required for genuine greenfield role design

## Interviewer's Hidden Expectations

Interviewers want to hear that you understand migration path as a real security decision with lasting consequences, not just a technical implementation choice. They're listening for whether you can articulate specifically why brownfield conversion creates hidden SoD risk, not just that "migration requires security review" generically.

## What Makes This a 10/10 Answer

An average answer says migration requires reviewing security afterward. A 10/10 answer explains specifically why brownfield conversion's technical role continuity masks genuine SoD risk changes from data model consolidation, and why greenfield's fresh design trades upfront effort for avoiding inherited role catalog drift.

## Red Flags

- Treating brownfield conversion as automatically security-safe because roles technically transport
- No mention of SU25 as part of brownfield migration security work
- Describing migration security review as optional or purely post-go-live
- Not connecting data model consolidation specifically to changed SoD risk
- No awareness of the timeline trade-off between brownfield and greenfield from a security design perspective

## Keywords

S/4HANA migration, brownfield conversion, greenfield implementation, SU25, universal journal, SoD re-baselining, data model consolidation

## Related Topics

- s4hana-security.md
- brownfield.md
- greenfield.md
- su25.md
