# PFCG

## Overview

PFCG is the Profile Generator, the standard transaction for building and maintaining roles in SAP. It's where you assign transactions to a role's menu, pull in authorization defaults from SU24, maintain field values, and generate the actual authorization profile that gets assigned to users. Every role in the system — single, derived, or composite — is built and maintained through PFCG.

## Interview Summary

PFCG turns a list of transactions into a working authorization profile. You add transactions to the menu tab, the system pulls SU24 default values into the authorization tab, you adjust field values and organizational levels, and then generate the profile. That generated profile is what actually gets checked at runtime, not the role definition itself.

## 30 Second Interview Answer

PFCG is where roles get built. You add transactions to the menu tab, and the system automatically proposes authorization objects and default values based on SU24 data for each transaction. From there you fill in organizational levels like company code, adjust field values, and generate the profile. That generated profile is what actually sits in the user buffer and gets checked at runtime — the role itself is just the design layer.

## 60 Second Interview Answer

PFCG is the transaction that turns a business requirement into a working set of access. You start on the menu tab and add the transactions the role needs. Every time you add one, the system pulls in default authorization objects and values from SU24 for that transaction, and those show up on the authorization tab.

From there, the work is filling in what SU24 couldn't know in advance — organizational level values like company code or plant, and any field values specific to how this role should behave. Once everything's maintained, you generate the profile, which is the actual technical object that gets loaded into the user's authorization buffer.

A role definition by itself doesn't grant anything. It's the generated profile that the kernel checks against at runtime, which is why forgetting to regenerate after a change is one of the most common causes of "I updated the role but the user still can't do it" tickets.

## 90 Second Interview Answer

PFCG is the Profile Generator, and it's the single transaction behind every role in an SAP system, whether it's a single role, a derived role, or a composite role wrapping several of them together.

The workflow starts on the menu tab, where you assign transactions, reports, or web dynpro applications the role needs to support. Each addition triggers SU24 to propose authorization objects and default field values for that transaction, which land on the authorization tab. From there the real design work happens — reviewing which objects actually apply, tightening field values, and filling in organizational level restrictions like company code, plant, or purchasing organization that SU24 can't predict on its own.

Once the authorization data is complete, you generate the profile. This step matters more than people realize — the role definition itself is just metadata. The generated profile is the actual object loaded into the user's authorization buffer at login, and it's what every AUTHORITY-CHECK compares against. If you change a role and forget to regenerate, the user's buffer still reflects the old profile until the next generation and a buffer refresh.

For derived roles, PFCG handles inheritance automatically — the menu and non-organizational authorization values come from the master role, and you only maintain the org level fields specific to that derived role. For composite roles, PFCG doesn't hold authorization data directly at all — it just references the member single roles and assigns their combined profiles at once, which makes it a provisioning convenience rather than a design tool.

## Architecture

- Menu tab: defines which transactions, reports, or apps the role grants access to
- Authorization tab: holds the authorization objects and field values, seeded from SU24
- User tab: assigns users directly to the role, though most orgs manage this through a separate provisioning tool instead
- Profile: the generated technical object actually loaded into the user buffer
- Derived role link: connects a child role to its master for inheritance
- Composite role shell: references member single roles without holding its own authorization data

## Runtime Flow

A role builder adds transactions on the menu tab in PFCG. The system checks SU24 for each transaction and proposes authorization objects with default values on the authorization tab. The role builder reviews and adjusts those values, sets organizational level restrictions, and clicks generate. Generation compiles all of that into a profile, which is what's actually assigned to users, either directly or through a provisioning workflow like GRC ARM. When the user logs in, that profile loads into their authorization buffer and stays there for the session, which is why role changes don't take effect until the user logs off and back on, or the buffer is explicitly reset.

## Configuration

- Maintain the menu tab with the correct transaction codes for the business process
- Review and adjust SU24-proposed authorization values on the authorization tab
- Set organizational level restrictions per role or per derived role
- Generate the profile after every authorization change
- Configure derived role master-child relationships for org-level variation

## Implementation Activities

- Build single roles based on documented business process requirements
- Configure derived roles for organizational variation across business units
- Assemble composite roles for one-shot provisioning of related single roles
- Validate generated profiles against test scripts before go-live
- Document role-to-business-process mapping for future maintenance

## Migration Activities

- Compare role authorization data before and after an SU25 upgrade step
- Regenerate all role profiles after a support pack or upgrade to pick up new SU24 defaults
- Validate that transported roles generated correctly in the target system

## Rollout Activities

- Copy or extend derived roles with new organizational level values for the rollout entity
- Validate menu and authorization content still matches the localized business process
- Regenerate and re-test profiles for the new user population

## Production Support Activities

- Investigate tickets where a role change didn't take effect, usually a missed generation or buffer refresh
- Correct authorization field values without broadening access unnecessarily
- Support mass role changes during reorganizations
- Maintain documentation as roles evolve over time

## Troubleshooting

Common issue: a role was updated but the user still can't perform the action.
Root cause: the profile wasn't regenerated after the change, or the user hasn't logged off and back on since the update.
Resolution: regenerate the profile in PFCG, then have the user log off and log back in, or reset their buffer.

Common issue: SU24 proposed the wrong default values for a transaction.
Root cause: SU24 data is outdated or was never maintained for a custom or modified transaction.
Resolution: correct the SU24 proposal directly, then rebuild the role's authorization data from the updated proposal.

Common issue: a derived role isn't picking up changes made to the master role.
Root cause: the derived role wasn't regenerated after the master role changed.
Resolution: regenerate both the master and all derived roles linked to it.

## Common Interview Questions

1. What does PFCG stand for and what does it do?
2. What's the difference between a role and a generated profile?
3. How does SU24 relate to PFCG?
4. What happens when you generate a role?
5. Why would a role change not take effect immediately?
6. How do derived roles work in PFCG?
7. What's the purpose of the user tab in PFCG?
8. How do composite roles differ from single roles in PFCG?
9. What are organizational levels and where do you maintain them?
10. What's the difference between the menu tab and the authorization tab?
11. How do you troubleshoot a role that isn't granting expected access?
12. What happens if you forget to regenerate a role after a change?
13. How would you mass-update authorization values across many roles?
14. What's the relationship between a master role and its derived roles?
15. How do you validate a role before moving it to production?
16. Can you assign users directly in PFCG, and should you?
17. What's the impact of a buffer refresh on role changes?
18. How do you handle organizational level restrictions for a derived role?
19. What's the process for building a role from scratch?
20. How do transports handle PFCG role changes?

## Tough Follow-up Questions

1. If a user's access changes without anyone touching their role, what would you investigate?
2. How would you audit whether every role in production has been generated after its last change?
3. What's the risk of assigning users directly in PFCG instead of through a provisioning tool?
4. How do you handle a role where SU24 proposals conflict with what the business actually needs?
5. If a derived role's org level values were set incorrectly for years, how would you find and fix every affected user?
6. What's your process for regenerating hundreds of roles after a system-wide SU24 update?
7. How would you explain to a developer why their new transaction isn't showing correct authorization defaults?
8. What happens to a composite role if one of its member single roles is deleted?
9. How do you decide when a role needs to be split versus when it should stay as one?
10. If two role builders modify the same role at the same time, what happens?
11. How would you validate that a transported role generated identically in the target system?
12. What's your approach to cleaning up roles that reference deleted or deprecated transactions?
13. How do you handle emergency PFCG changes during a production incident?
14. If a role generation fails, what would you check first?
15. How do you manage PFCG changes across a landscape with multiple parallel projects?
16. What's the risk of copying a role instead of building it from SU24 defaults directly?
17. How would you detect roles that were manually modified after generation, bypassing the standard process?
18. What's your strategy for keeping role documentation in sync with actual PFCG content?
19. How do you handle a situation where business wants faster role changes than your change process allows?
20. If PFCG performance degrades on a large role catalog, what would you investigate?

## SAP Transactions

PFCG, SU24, SU25, SU21, SU53, ST01, SUIM

## SAP Tables

AGR_1251, AGR_TCODES, AGR_USERS, AGR_DEFINE, AGR_PROF, USR02

## Best Practices

- Always regenerate a role immediately after any authorization change
- Use derived roles for org-level variation instead of duplicating master roles
- Keep SU24 maintained so new transactions inherit accurate defaults
- Avoid assigning users directly in PFCG in favor of a controlled provisioning process
- Document role changes with a clear business justification for audit purposes

## Common Mistakes

- Forgetting to regenerate a role after changing authorization values
- Assigning users directly through PFCG instead of a governed provisioning tool
- Copying roles instead of building from current SU24 defaults, carrying over stale or incorrect values
- Not maintaining derived role org levels consistently across a large role catalog
- Skipping testing after generation because the change "looked simple"

## Interviewer's Hidden Expectations

Interviewers want to hear that you understand the difference between the role definition and the generated profile, because that distinction is where most real-world PFCG confusion happens. They're also listening for whether you treat role changes as something that requires regeneration, testing, and documentation, not just a quick edit.

## What Makes This a 10/10 Answer

An average answer describes PFCG as "where you build roles." A 10/10 answer explains the actual mechanics — how SU24 feeds the authorization tab, why generation matters as a distinct step, and how derived and composite roles behave differently at the profile level. It shows you understand what actually gets checked at runtime, not just the screen you click through.

## Red Flags

- Not knowing the difference between a role and a generated profile
- Saying role changes take effect immediately without mentioning generation or buffer refresh
- Describing composite roles as if they hold their own authorization data
- No mention of SU24 when explaining how authorization values populate
- Suggesting user assignment should happen directly in PFCG as standard practice

## Keywords

PFCG, Profile Generator, menu tab, authorization tab, SU24, generated profile, derived role, composite role, organizational level, user buffer, role generation
