# Role Design

## Overview

Role design is the discipline of translating business job functions into a maintainable, least-privilege set of SAP roles. It's the decision layer above PFCG mechanics — naming conventions, single versus derived versus composite structure, org level strategy, and how the whole catalog stays clean as the business changes.

## Interview Summary

Good role design starts with job function analysis, not with copying an existing role. You decide the role taxonomy — single roles for functional access, derived roles for org-level reuse, composite roles for provisioning — then apply a consistent naming convention and validate every design decision against segregation of duties before it reaches production.

## 30 Second Interview Answer

Role design is about translating what someone actually does in their job into the smallest set of access that lets them do it. You start with the business process, not an existing role template. Then you decide the structure — single role, derived if it repeats across org units, composite if it bundles multiple functions — and you run segregation of duties analysis before anything goes live, not after.

## 60 Second Interview Answer

Role design is the strategic layer that sits above PFCG. PFCG is just the tool; role design is the set of decisions about how roles map to the business.

It starts with understanding the actual job function — what transactions someone needs, what data they touch, and at what organizational scope. From there you decide structure: a single role if the access is self-contained, a derived role if the same function repeats across company codes or plants, and a composite role if the job function naturally bundles several single roles together for provisioning.

The parts that separate good role design from bad are the naming convention, so a growing role catalog stays navigable, and running segregation of duties analysis at design time, not as an afterthought. A role that technically works but creates an SoD conflict, or that's copied from an unrelated role and carries access nobody asked for, is bad design even if nobody notices immediately.

## 90 Second Interview Answer

Role design is the decision-making layer above PFCG. PFCG is just the mechanism for building a role — role design is everything that determines whether the resulting role catalog is maintainable, secure, and aligned with the actual business.

It starts with job function analysis: understanding exactly what a person in a given role needs to do, not just what transactions they've historically had access to. From there, the structural decision is single versus derived versus composite. A single role fits self-contained access. A derived role fits when the same functional access repeats across organizational units, letting you maintain the menu and authorization logic once and only vary org level values per unit. A composite role fits when a job function naturally needs several single roles bundled for one-shot provisioning.

Naming convention matters more than it sounds like it should. A role catalog with a hundred roles and no consistent naming becomes unmaintainable within a year — nobody can tell what a role does without opening it, and duplicate or near-duplicate roles start appearing because people can't find what already exists.

The non-negotiable part is segregation of duties. Every role design decision has to be validated against SoD rules before it reaches production, because retrofitting SoD controls after roles are already live and assigned is dramatically more expensive than catching the conflict at design time. That usually means running the design through GRC Access Risk Analysis before go-live, not just at the annual audit.

The failure mode that shows up most in production is role design by copying — taking an existing role that's "close enough," duplicating it, and tweaking it, instead of designing from the actual requirement. That approach silently carries over access nobody explicitly asked for, and it's how role catalogs end up bloated with near-duplicate roles that all slightly diverge from what they're supposed to represent.

## Architecture

- Job function analysis: the business input that drives role scope
- Role taxonomy: the decision of single, derived, or composite structure
- Naming convention: the standard that keeps a growing catalog navigable
- Organizational level strategy: how org values are handled across derived roles
- Segregation of duties validation: the control gate before go-live

## Runtime Flow

Role design itself has no runtime — it's a design-time discipline. Its output is the actual roles built in PFCG, which is where the runtime AUTHORITY-CHECK mechanics take over. The connection to runtime is indirect but critical: a bad role design decision, like an overly broad single role instead of a properly scoped derived structure, directly determines what gets checked and passed at runtime for every user assigned to it.

## Configuration

- Define the role naming convention before building the first role
- Document the role taxonomy decision for each job function
- Set the standard for when a role should be derived versus single
- Establish the segregation of duties validation checkpoint in the build process

## Implementation Activities

- Gather job function requirements directly from business process owners
- Decide role structure — single, derived, or composite — for each job function
- Apply the naming convention consistently across the new role catalog
- Run segregation of duties analysis on every new role design before build
- Document the role catalog for future maintenance and onboarding

## Migration Activities

- Reassess whether existing role structure still fits the target system's process changes
- Identify roles that should be redesigned rather than just transported as-is
- Validate naming convention consistency survives the migration

## Rollout Activities

- Apply the existing role design template to the new business unit or country
- Extend derived roles rather than designing new master roles when only org scope differs
- Re-validate segregation of duties for the expanded user population

## Production Support Activities

- Evaluate whether a reported access gap is a role design issue or a simple provisioning issue
- Recommend role redesign when incremental fixes are no longer sustainable
- Support periodic role catalog cleanup and recertification

## Troubleshooting

Common issue: the role catalog has grown into hundreds of near-duplicate roles.
Root cause: roles were built by copying existing roles instead of designing from requirements.
Resolution: audit the catalog for duplication, consolidate where possible, and enforce design-from-requirements going forward.

Common issue: a role passes functional testing but fails a segregation of duties review.
Root cause: SoD wasn't validated at design time, only discovered at audit.
Resolution: rework the role design, potentially splitting it, and move SoD validation earlier in the build process.

Common issue: nobody can tell what a role does without opening it in PFCG.
Root cause: no naming convention was ever established or enforced.
Resolution: introduce and retroactively apply a naming convention, prioritizing the most-used roles first.

## Common Interview Questions

1. What is role design and how is it different from just using PFCG?
2. How do you decide between single, derived, and composite role structure?
3. Why does a naming convention matter for role design?
4. When should segregation of duties be checked during role design?
5. What's wrong with designing a role by copying an existing one?
6. How do you gather requirements for a new role?
7. What's the risk of a role catalog with no consistent structure?
8. How do you decide when a role should be split into two?
9. What's your process for validating a new role design before go-live?
10. How do you handle role design for a job function that spans multiple modules?
11. What's the difference between designing for least privilege and designing for convenience?
12. How would you redesign a bloated role catalog?
13. What's the role of business process owners in role design?
14. How do you handle role design decisions during a rollout to a new country?
15. What's your approach to periodic role catalog cleanup?
16. How do you balance role granularity against maintainability?
17. What's the risk of over-engineering role design with too many narrow roles?
18. How would you onboard a new team member to an existing role catalog?
19. What's your strategy for documenting role design decisions?
20. How do you handle conflicting requirements from different business units for the same job function?

## Tough Follow-up Questions

1. If business wants broader access than compliance will approve, how do you resolve the role design conflict?
2. How would you redesign a role catalog under a deadline without introducing new segregation of duties risks?
3. What's your process for detecting roles that have silently drifted from their original design intent?
4. How do you decide between splitting a role and adding a mitigating control for an unavoidable SoD conflict?
5. What's the risk of role design decisions made without business process owner involvement?
6. How would you handle role design for a job function that genuinely needs different access in different contexts?
7. What's your approach to role design when the organization is mid-reorganization and job functions are unstable?
8. How do you validate that a role design decision will still make sense after a planned system upgrade?
9. What's the trade-off between designing roles per job function versus per individual?
10. How would you explain to leadership why role redesign is worth the investment versus incremental patching?
11. What's your process for role design in a multi-system landscape where the same job function spans SAP and non-SAP systems?
12. How do you handle role design disagreements between security, audit, and business stakeholders?
13. What's the risk of role design that optimizes purely for minimizing the number of roles?
14. How would you design roles for a job function that's expected to change significantly within a year?
15. What's your strategy for role design governance across multiple parallel projects touching the same role catalog?
16. How do you handle legacy roles that predate any documented design standard?
17. What's the risk of role design decisions that aren't validated against actual usage data?
18. How would you measure whether a role redesign initiative actually improved maintainability?
19. What's your approach when a role design decision made years ago no longer fits current compliance requirements?
20. How do you handle role design for temporary or project-based access that shouldn't become permanent?

## SAP Transactions

PFCG, SUIM, SU24, SU01

## SAP Tables

AGR_DEFINE, AGR_1251, AGR_USERS, AGR_TCODES

## Best Practices

- Design from documented business requirements, never by copying an existing role
- Establish and enforce a naming convention before the catalog grows
- Validate segregation of duties at design time, not after go-live
- Choose derived roles for org-level reuse instead of duplicating master roles
- Periodically review the role catalog for drift and unnecessary duplication

## Common Mistakes

- Copying an existing role as a starting point instead of designing from requirements
- Skipping segregation of duties validation until an audit forces the issue
- Letting role naming conventions go unenforced as the catalog grows
- Designing roles around convenience for provisioning rather than least privilege
- Not involving business process owners in defining what access is actually needed

## Interviewer's Hidden Expectations

Interviewers want to hear that you think about role design as an ongoing discipline with real governance, not a one-time PFCG exercise. They're listening for whether you've had to make the hard trade-off calls — splitting a role, pushing back on scope creep, catching an SoD conflict before go-live — because that's where real design judgment shows up.

## What Makes This a 10/10 Answer

An average answer describes role design as "building roles in PFCG." A 10/10 answer explains the decision framework — how job function analysis drives structure, why naming conventions and SoD validation are non-negotiable, and how to recognize when a role catalog needs redesign rather than incremental patching.

## Red Flags

- Describing role design as synonymous with using PFCG
- No mention of segregation of duties as part of the design process
- Recommending copying existing roles as a standard practice
- No awareness of naming convention as a maintainability concern
- Treating role design as a one-time activity rather than ongoing governance

## Keywords

role design, role taxonomy, naming convention, segregation of duties, least privilege, single role, derived role, composite role, job function analysis

## Related Topics

- pfcg.md
- derived-roles.md
- composite-roles.md
- sap-security.md
