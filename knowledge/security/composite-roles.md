# Composite Roles

## Overview

A composite role is a container that references multiple single or derived roles for one-shot provisioning. It doesn't hold its own authorization data — it's purely a shell that assigns all its member roles' generated profiles together when a user is assigned to it.

## Interview Summary

Composite roles exist to simplify provisioning, not to design authorization. When a job function needs five different single roles, you bundle them into one composite role so a user gets all five with a single assignment instead of five separate ones. The composite role itself carries zero authorization objects — all the actual permission logic lives in its member roles.

## 30 Second Interview Answer

A composite role is a container for other roles — it bundles single and derived roles together so a user can be assigned all of them at once. It doesn't hold any authorization data of its own. Rationalizing a bloated catalog by wrapping more singles into new composites usually hides SoD and duplicates; composites are a provisioning shell after the singles are clean, not the cleanup method.

## 60 Second Interview Answer

A composite role is purely a provisioning convenience. It doesn't have its own menu or authorization objects — it references a set of member single or derived roles, and when a user gets assigned to the composite role, they inherit the combined access of every member role at once.

The reason this matters is job functions rarely map to a single role. A finance analyst might need an AP role, an AR role, and a reporting role. Instead of provisioning three separate roles every time someone joins that job function, you bundle them into one composite role and provision once.

The thing people get wrong is assuming composite roles carry authorization logic — they don't. If a user's access looks wrong, you troubleshoot the member roles individually, not the composite role itself. And if a composite role's member list changes, existing users don't automatically pick up the new member — you have to re-provision or re-run the assignment for the composite role change to take effect for them.

## 90 Second Interview Answer

A composite role is a container, not an authorization object holder. It references a set of member single or derived roles, and its entire purpose is provisioning convenience — assign a user to one composite role, and they get the combined menu and authorization data of every member role at once, instead of needing five separate role assignments for one job function.

If you open the authorization tab on a composite role in PFCG, it's empty. There's nothing to maintain there. All the actual permission logic — the authorization objects, the field values, the organizational level restrictions — lives entirely in the member roles. This is the detail people get wrong most often in interviews: they describe composite roles as if they carry their own authorization data, when the whole design point is that they don't.

The practical implication is where you troubleshoot. If a user assigned to a composite role has an authorization problem, you don't investigate the composite role — you investigate which member role is missing the access, because that's where the actual check happens. The composite role is just the assignment mechanism.

The other detail that matters operationally is that composite roles aren't dynamic. If you add a new member role to an existing composite role, users who were already assigned to that composite role don't automatically pick up the new member's access — the composite role assignment has to be reprocessed, which in most GRC-governed environments means running through a new or updated access request. Treating composite role membership changes as a no-op is a common mistake that leads to users missing access they should already have.

## Architecture

- Composite role shell: holds no authorization data, only a list of member roles
- Member roles: single or derived roles that supply the actual menu and authorization content
- User assignment: assigning a user to the composite role assigns all member roles' profiles
- No independent generation: composite roles don't generate their own profile the way single or derived roles do

## Runtime Flow

When a user is assigned to a composite role, the system resolves the composite role's member list and assigns each member role's generated profile to the user individually. At runtime, AUTHORITY-CHECK statements are evaluated against the combined set of authorizations from all member roles — there's no separate "composite role" authorization object being checked, the composite role is invisible to the runtime check entirely.

## Configuration

- Create the composite role and add member single or derived roles to it
- Do not attempt to maintain authorization objects directly on a composite role
- Re-provision existing composite role assignments after adding or removing a member role
- Document which single and derived roles belong to which composite role

## Implementation Activities

- Map job functions to the set of single and derived roles required
- Build composite roles that bundle those roles for one-shot provisioning
- Validate that composite role member lists match actual business role definitions
- Coordinate composite role assignment with the provisioning or GRC access request process

## Migration Activities

- Verify composite role member lists survived the migration or transport intact
- Confirm all member roles still exist and generated correctly after an upgrade
- Re-test provisioning through composite roles in the target environment

## Rollout Activities

- Extend composite roles with new member roles for the rollout entity if job functions expanded
- Validate composite role membership matches the localized business role structure
- Re-provision affected users if composite role membership changed for the rollout

## Production Support Activities

- Investigate access issues by checking member roles individually, not the composite role
- Re-provision users after a composite role's membership changes
- Support mass composite role assignment during onboarding or reorganizations

## Troubleshooting

Common issue: a user assigned to a composite role is missing expected access.
Root cause: one of the member roles wasn't correctly generated, or the composite role's member list doesn't match what was expected.
Resolution: check each member role individually for generation status and authorization content, not the composite role itself.

Common issue: a composite role was updated with a new member role, but existing users don't have the new access.
Root cause: composite role membership changes aren't retroactive — existing assignments don't automatically pick up new members.
Resolution: reprocess the composite role assignment for affected users, typically through a new access request.

Common issue: someone tried to add an authorization object directly to a composite role.
Root cause: a misunderstanding that composite roles can hold their own authorization data.
Resolution: move the authorization requirement into the appropriate member role instead.

## Common Interview Questions

1. What is a composite role and what's its purpose?
2. Does a composite role hold its own authorization data?
3. How is a composite role different from a derived role?
4. What happens when a user is assigned to a composite role?
5. How do you troubleshoot access issues for a user assigned to a composite role?
6. What happens to existing users when a composite role's membership changes?
7. Why would you use a composite role instead of assigning multiple single roles directly?
8. Can you add authorization objects directly to a composite role?
9. How do composite roles fit into a provisioning workflow?
10. What's the risk of not documenting composite role membership?
11. How do you validate a composite role's member list is correct?
12. What happens to a composite role if one of its member roles is deleted?
13. How would you design composite roles for a job function that spans multiple modules?
14. What's the relationship between composite roles and GRC access requests?
15. How do you handle composite role changes during a rollout?
16. What's the difference between provisioning through a composite role versus individual roles?
17. How do you audit which single roles belong to which composite roles?
18. What's the impact of a composite role having too many member roles?
19. How would you migrate users from individual role assignments to a composite role structure?
20. What's your process for testing a composite role before it goes into production provisioning?

## Tough Follow-up Questions

1. If a composite role has fifty member roles, what does that tell you about the role design, and what would you do about it?
2. How would you detect composite roles whose member lists have drifted from the actual job function they represent?
3. What's the risk of composite roles in a segregation of duties analysis if the member roles individually look clean?
4. How do you handle a composite role that different departments want to customize slightly differently?
5. What's your process for retroactively applying a composite role membership change to already-provisioned users at scale?
6. How would you explain to a business stakeholder why removing a role from a composite role doesn't immediately reduce access for provisioned users?
7. If two composite roles have overlapping member roles, how would you evaluate whether that's a role design problem?
8. What's the impact of composite role structure on emergency access provisioning during an incident?
9. How do you handle composite roles when the underlying member roles are being consolidated or redesigned?
10. What's your strategy for auditing composite role assignments against actual job functions over time?
11. How would you design a composite role catalog for an organization where job functions change frequently?
12. What's the risk of relying entirely on composite roles for provisioning without validating member role correctness first?
13. How do you handle a composite role member role that itself is a derived role with organizational level dependencies?
14. What would you check first if a composite role assignment silently failed to grant all expected member roles?
15. How do you decide when a set of frequently co-assigned single roles should become a formal composite role?
16. What's your approach to versioning or change control for composite role membership?
17. How would you handle composite roles during a merger where two organizations have different composite role structures?
18. What's the risk of composite roles becoming a workaround for poor underlying single role design?
19. How do you validate that removing a member role from a composite role doesn't break other composite roles referencing it?
20. What's your process for reconciling composite role definitions against actual GRC business role catalogs?

## SAP Transactions

PFCG, SU01, SU10, SUIM

## SAP Tables

AGR_AGRS, AGR_1251, AGR_DEFINE, AGR_USERS

## Best Practices

- Never attempt to maintain authorization objects directly on a composite role
- Keep composite role member lists documented and mapped to actual job functions
- Reprocess existing user assignments after changing composite role membership
- Use composite roles primarily as a provisioning convenience, not a design substitute for good single role structure
- Periodically audit composite roles for member roles that no longer belong

## Common Mistakes

- Believing composite roles carry their own authorization logic
- Assuming existing users automatically get new access when a composite role's membership changes
- Troubleshooting the composite role itself instead of its member roles
- Letting composite role member lists grow unchecked without periodic review
- Using composite roles to paper over inconsistent single role design instead of fixing the underlying roles

## Interviewer's Hidden Expectations

Interviewers want to hear that you clearly understand composite roles hold no authorization data of their own — that single fact, stated confidently, signals real hands-on PFCG experience. They're also listening for whether you know the non-retroactive nature of membership changes, since that's a common source of real production tickets.

## What Makes This a 10/10 Answer

An average answer says a composite role bundles multiple roles together. A 10/10 answer explicitly states that composite roles carry zero authorization data of their own, explains where troubleshooting actually has to happen, and flags the non-retroactive nature of membership changes as an operational risk.

## Red Flags

- Saying composite roles have their own authorization tab content
- Not knowing that membership changes aren't retroactive for existing assignments
- Troubleshooting a composite role directly instead of its member roles
- Confusing composite roles with derived roles
- No mention of provisioning convenience as the actual purpose

## Keywords

composite role, member role, provisioning, single role, derived role, PFCG, role assignment, GRC access request

## Related Topics

- pfcg.md
- derived-roles.md
- role-design.md
