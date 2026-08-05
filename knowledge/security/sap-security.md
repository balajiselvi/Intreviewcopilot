# SAP Security

## Overview

SAP Security controls who can do what inside an SAP system. It's built on authorization objects, roles, and profiles, all maintained through PFCG and checked at runtime by the kernel every time a user executes a transaction, calls a function module, or accesses a report. The discipline covers user administration, role design, authorization object maintenance, segregation of duties, and audit evidence. It sits at the intersection of IT and compliance — a misconfigured role isn't just a technical bug, it's a control failure an auditor can cite.

## Interview Summary

SAP Security is the layer that decides whether a user's request is allowed to execute. Every transaction call triggers AUTHORITY-CHECK statements against authorization objects assigned through roles. Roles are built in PFCG, authorization defaults come from SU24, and the whole model has to balance least privilege against usability while staying clean enough to pass a SoD audit.

## 30 Second Interview Answer

SAP Security is about controlling access at the transaction and data level, not just login access. Every ABAP program can run AUTHORITY-CHECK statements against authorization objects like S_TCODE or S_TABU_DIS. Those objects get their values from roles built in PFCG. The real skill is designing roles tight enough to satisfy least privilege and segregation of duties, but broad enough that users aren't submitting access requests every week.

## 60 Second Interview Answer

SAP Security enforces access control at runtime, inside the application layer, not just at login. When a user executes a transaction, the ABAP program runs AUTHORITY-CHECK statements against specific authorization objects — things like S_TCODE for transaction access or S_TABU_DIS for table maintenance. Those checks pass or fail based on the authorization values assigned to the user through their roles.

Roles are built in PFCG, and the authorization objects that get pulled into a role start from SU24 default proposals tied to each transaction in the menu. From there it's a matter of maintaining field values, activity codes, and org levels correctly.

The hard part isn't the transaction — it's the design. You're constantly balancing least privilege against day-to-day usability, and every role change has to be checked against segregation of duties conflicts before it goes to production. That's what separates a role that works from a role that also survives an audit.

## 90 Second Interview Answer

SAP Security is enforcement at the application layer. Every time a user runs a transaction, calls a function module, or opens a report, the underlying ABAP code executes AUTHORITY-CHECK statements against specific authorization objects — S_TCODE for the transaction itself, plus whatever business objects that transaction touches, like S_TABU_DIS for table access or M_MSEG_WMB for goods movements.

Those authorization objects live inside roles, and roles are built in PFCG. When you add a transaction to a role's menu, SU24 supplies default authorization values for the objects that transaction typically needs. From there, the role builder generates the profile, and you fine-tune field values, activity codes, and organizational level restrictions like company code or plant.

Beyond the mechanics, the job is design and governance. You're constantly trading off least privilege against usability — too tight and users flood the help desk with access requests, too loose and you fail a segregation of duties review. Composite roles group related single roles for provisioning. Derived roles inherit menu and authorization structure from a master role but let org values vary by user population, which keeps large role catalogs maintainable instead of exploding into hundreds of near-duplicate roles.

On top of the design work, there's ongoing operational responsibility — SU25 reconciliation after upgrades, periodic role recertification, mass user changes, and being the first call when someone gets an authorization error in production. Security isn't a one-time build, it's a system that has to stay correct as the business and the SAP system both keep changing.

## Architecture

- Authorization objects: the unit of permission, made up of fields with specific values (activity, company code, plant, etc.)
- Roles: containers built in PFCG that bundle transactions and their authorization objects
- Profiles: generated automatically from a role, this is what actually gets assigned to the user buffer
- User master record: maintained in SU01, holds the role assignments and validity dates
- SU24: the table-driven default proposal engine that seeds authorization values when a transaction is added to a role
- Composite roles: a shell that references multiple single roles for one-shot provisioning
- Derived roles: child roles that inherit the menu and authorization structure of a master role but allow different organizational level values

## Runtime Flow

A user logs in and SAP loads their authorization profile into the user buffer. When they execute a transaction, the kernel first checks S_TCODE to confirm they're allowed to call it at all. Then the ABAP program itself runs additional AUTHORITY-CHECK statements as it hits protected operations — reading a table, posting a document, releasing a workflow step. Each check compares the object and field values in the user's buffer against what the program is asking for. If any required field value is missing, the check fails and the user gets an authorization error with the object, field, and missing value named directly in the message.

## Configuration

- Maintain authorization objects and default values in SU24 for custom or modified transactions
- Build roles in PFCG, assign transactions, and generate the authorization profile
- Set organizational level restrictions on derived roles per business unit
- Configure SU25 steps after a support pack or upgrade to reconcile changed defaults
- Maintain user master records and role assignments in SU01 or mass tools like SU10

## Implementation Activities

- Gather business process requirements and translate them into role scope
- Design a role naming convention and role-to-job mapping
- Build single, derived, and composite roles in PFCG
- Maintain SU24 default values for custom transactions and Z-programs
- Run and document segregation of duties analysis before go-live
- Define emergency access process for cutover and hypercare

## Migration Activities

- Compare authorization object defaults between source and target releases using SU25
- Re-test role authorizations against new or changed transactions
- Identify deprecated authorization objects and update dependent roles
- Validate that custom Z-transactions still have correct SU24 proposals after transport

## Rollout Activities

- Localize roles for new country or company code org values
- Extend derived roles with new organizational level values for the rollout entity
- Re-run segregation of duties analysis against the expanded user population
- Align role naming and provisioning process with the template already in production

## Production Support Activities

- Investigate and resolve authorization error tickets
- Run SU53 or the authorization trace to pinpoint the failing object
- Process periodic access recertification and role cleanup
- Support mass user changes during reorganizations
- Maintain audit evidence for SOX or internal control reviews

## Troubleshooting

Common issue: user gets "No authorization" on a transaction that used to work.
Root cause: role assignment was removed, validity date expired, or an authorization object value was tightened in a role change.
Resolution: run ST01 trace or SU53 immediately after the failure, identify the exact object and field, compare against the role's current authorization values, and correct the role or reassign it.

Common issue: authorization works in QA but fails in production.
Root cause: SU24 proposals differ between systems, or a transport didn't include a manual authorization change.
Resolution: compare SU24 data and role authorization values across systems, and rebuild the transport if manual PFCG changes were missed.

Common issue: user has access to more than expected after a role change.
Root cause: a derived role inherited a broader org value than intended, or a composite role pulled in an unrelated single role.
Resolution: review the composite role's member list and the derived role's org level assignment, then correct and regenerate the profile.

## Common Interview Questions

1. What is the difference between a role and a profile?
2. How does AUTHORITY-CHECK work at runtime?
3. What's the purpose of SU24?
4. How do derived roles differ from composite roles?
5. Walk me through how you'd design roles for a new module rollout.
6. What is S_TCODE used for?
7. How do you handle segregation of duties conflicts during role design?
8. What happens when SU24 data is missing for a transaction?
9. How do you troubleshoot an authorization error?
10. What's the difference between SU53 and an authorization trace?
11. How do organizational levels work in derived roles?
12. What's a naming convention you'd use for role design?
13. How do you handle emergency access during go-live?
14. What changes in SU24 after an upgrade?
15. How do you validate role authorizations before go-live?
16. What's the risk of using SAP_ALL in a role?
17. How do you manage mass user changes?
18. What's the difference between single, composite, and derived roles?
19. How do you keep roles maintainable as the org structure grows?
20. What's your approach to periodic access recertification?
21. How do you handle authorization objects for custom Z-transactions?
22. What's the difference between an activity value and a field value in an authorization object?

## Tough Follow-up Questions

1. If a user reports missing access but the role looks correct, what's your next diagnostic step?
2. How would you redesign a role catalog that's grown to hundreds of near-duplicate roles?
3. What's the trade-off between fewer, broader roles versus many narrow roles?
4. How do you validate that SU24 changes didn't silently loosen access on unrelated roles?
5. If two business units need different org level access but the same functional access, how do you structure that?
6. How would you detect a role that grants more access than its job description implies?
7. What's your process when a segregation of duties conflict can't be avoided by design?
8. How do you handle authorization design for a transaction with no SU24 entry at all?
9. What happens to derived roles if the master role's menu changes after go-live?
10. How would you audit whether SAP_ALL or SAP_NEW is assigned anywhere in production?
11. If a role works for 95% of users but fails for a subset, what would you check first?
12. How do you decide when a new authorization object needs to be added to SU24 versus handled as an exception?
13. What's your strategy for role design when the business process spans multiple company codes?
14. How would you explain to an auditor why a mitigating control exists instead of removing the conflict?
15. What's the risk of copying an existing role instead of building one from a template?
16. How do you handle authorization requirements that differ only by activity value, not by object?
17. If a transport moves a role but not its SU24 dependency, what breaks?
18. How would you identify orphaned roles nobody uses anymore?
19. What's your approach when business wants access broader than what compliance will approve?
20. How do you validate role design decisions against a future rollout, not just the current go-live?
21. What would make you recommend a full role redesign instead of incremental fixes?

## SAP Transactions

PFCG, SU01, SU10, SU24, SU25, SU53, ST01, SUIM, PFUD, SU21

## SAP Tables

AGR_1251, AGR_USERS, AGR_TCODES, AGR_DEFINE, USR02, USOBT_C, USOBX_C, TOBJ

## Best Practices

- Build roles from a template and naming convention, never from a blank role
- Keep SU24 defaults current so new transactions inherit correct proposals automatically
- Restrict SAP_ALL and SAP_NEW to firefighter or emergency access only, never standing access
- Run segregation of duties analysis before every role change goes to production, not after
- Use derived roles for org-level variation instead of duplicating master roles

## Common Mistakes

- Copying an existing role instead of designing from requirements, which silently carries over unrelated access
- Ignoring SU24 maintenance, which forces every future role build to add missing objects manually
- Assigning SAP_ALL temporarily and forgetting to remove it after go-live
- Treating segregation of duties as a one-time check instead of an ongoing control
- Building roles too broad because it's faster than negotiating scope with the business

## Interviewer's Hidden Expectations

Interviewers want to know you think about authorization design as a control, not a checkbox. They're listening for whether you understand runtime enforcement mechanics, not just PFCG button clicks. They also want evidence you've handled the messy parts — SoD conflicts, audits, and production incidents — because that's where real experience shows up.

## What Makes This a 10/10 Answer

An average answer defines authorization objects and describes PFCG. A 10/10 answer explains the runtime mechanism — how AUTHORITY-CHECK actually fires, why SU24 matters for role building, and how design decisions like derived versus composite roles affect long-term maintainability and audit outcomes. It connects the technical mechanism to the business risk it controls.

## Red Flags

- Describing SAP Security only as "giving people access to transactions"
- Not knowing the difference between a role and a profile
- Recommending SAP_ALL as a quick fix without flagging the risk
- No mention of segregation of duties when asked about role design
- Treating authorization errors as something only Basis handles

## Keywords

authorization object, AUTHORITY-CHECK, PFCG, role, profile, SU24, SU25, S_TCODE, segregation of duties, least privilege, derived role, composite role, user buffer, authorization trace
