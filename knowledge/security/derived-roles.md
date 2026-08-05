# Derived Roles

## Overview

A derived role inherits its menu and non-organizational authorization values from a master role, but lets organizational level fields like company code or plant vary per child role. It's the standard mechanism for reusing one role design across multiple business units without duplicating the whole role.

## Interview Summary

Derived roles solve the problem of needing the same functional access across different org units. You build one master role with the menu and authorization logic, then create derived roles under it that only differ in organizational level values. Change the master, and every derived role inherits the update automatically — you only maintain org levels per child.

## 30 Second Interview Answer

A derived role inherits the menu and authorization objects from a master role, but lets you set different organizational level values, like company code, per derived role. So if the same job function exists across ten company codes, you build one master role and ten thin derived roles instead of ten full copies. Change the master's menu once, and every derived role picks it up automatically.

## 60 Second Interview Answer

A derived role is a child role linked to a master role. It inherits the menu, the authorization objects, and the non-organizational field values from the master — the only thing you maintain separately per derived role is the organizational level fields, like company code, plant, or sales organization.

This matters because most large organizations have the same job function repeated across many business units. Without derived roles you'd copy the master role ten or twenty times, and every time the business process changes, you'd have to update every copy individually. With derived roles, you update the master once, regenerate it, and every derived role inherits the menu and authorization logic automatically. You still have to regenerate each derived role too, but you're not redesigning them.

The trade-off is that derived roles can't diverge from the master's menu. If one business unit genuinely needs a different set of transactions, it doesn't belong as a derived role — that's a sign you need a separate master role instead.

## 90 Second Interview Answer

A derived role is a child role linked to a master role in PFCG. It inherits the menu tab and the authorization objects and field values from the master, with one deliberate exception — the organizational level fields, things like company code, plant, sales organization, or purchasing organization, are maintained separately on each derived role.

The reason this exists is that most large organizations have the same job function repeated across dozens of business units, and those units usually need identical functional access but different org-level scoping. Without derived roles, you'd end up copying the master role once per business unit, and every time the underlying business process changes, someone has to update every single copy by hand. That's how role catalogs balloon into hundreds of near-duplicate roles that are impossible to maintain consistently.

With derived roles, the master role holds the single source of truth for the menu and the functional authorization logic. Update the master, regenerate it, and every derived role picks up the change — you still have to regenerate each derived role individually since PFCG doesn't cascade the profile generation automatically, but you're never redesigning the authorization logic itself in more than one place.

The failure mode worth knowing is when a derived role structure gets forced onto business units that actually need different functionality, not just different org values. If one unit needs an extra transaction the others don't, that's not a derived role problem, that's a sign the role design should split into a separate master role instead. Trying to force it into the derived model usually means someone adds the extra transaction to the shared master and it silently leaks to every other business unit's derived roles too.

## Architecture

- Master role: holds the menu, transactions, and non-organizational authorization values
- Derived role: linked child role, inherits everything except organizational levels
- Organizational level fields: maintained independently per derived role (company code, plant, sales org, etc.)
- Inheritance link: maintained in PFCG's role attributes, tying each derived role to its master

## Runtime Flow

When a master role's menu or authorization data changes and is generated, PFCG flags all linked derived roles as needing regeneration. Each derived role then has to be opened and generated individually — this copies the master's menu and non-organizational authorization values into the derived role's own profile, merged with that derived role's specific organizational level values. The resulting generated profile is what actually gets assigned to users, same as any other role.

## Configuration

- Create the master role first with the full menu and authorization logic
- Create each derived role and link it to the master
- Maintain organizational level values independently on each derived role
- Regenerate the master, then regenerate every linked derived role
- Monitor for derived roles that have drifted from expecting only org-level differences

## Implementation Activities

- Identify job functions that repeat across multiple organizational units
- Design the master role's menu and authorization logic from business requirements
- Build derived roles for each organizational unit needing that job function
- Validate that no derived role has been manually modified outside the org level fields
- Document which derived roles belong to which master for future maintenance

## Migration Activities

- Verify master-derived role links survived the migration or upgrade intact
- Regenerate master roles first, then all linked derived roles, after an SU25 step
- Check for derived roles that lost their link to the master during transport

## Rollout Activities

- Create new derived roles under the existing master for each new rollout entity's organizational values
- Avoid creating a new master role when the only difference is organizational scope
- Validate the derived role's org level restrictions match the new entity's structure

## Production Support Activities

- Investigate access issues by checking whether the problem is in the master or a specific derived role's org values
- Regenerate derived roles that didn't pick up a master role change
- Support mass creation of new derived roles during reorganizations

## Troubleshooting

Common issue: a derived role isn't reflecting a change made to the master role.
Root cause: the derived role wasn't regenerated after the master was updated.
Resolution: regenerate the master first, then regenerate every linked derived role.

Common issue: one business unit has access the others don't, even though they're all supposed to be identical derived roles.
Root cause: someone manually modified a derived role outside its organizational level fields, breaking the inheritance model.
Resolution: compare the derived role's menu against the master, remove the manual deviation, and regenerate.

Common issue: a new organizational unit needs slightly different functionality, not just different org values.
Root cause: the business process genuinely diverges, but the team forced it into the derived role model anyway.
Resolution: split off a separate master role for that business unit instead of continuing to patch the shared master.

## Common Interview Questions

1. What is a derived role and how does it differ from a single role?
2. What gets inherited from the master role, and what doesn't?
3. Why would you use derived roles instead of copying a role?
4. What happens when you change the master role's menu?
5. How do organizational levels work in a derived role?
6. What's the risk of manually modifying a derived role?
7. How do you decide when a business unit needs a new master role instead of a derived role?
8. What's the regeneration process for master and derived roles?
9. How do derived roles help with role catalog maintainability?
10. Can a derived role have a different menu than its master?
11. How do you troubleshoot a derived role that isn't reflecting master changes?
12. What's the relationship between derived roles and composite roles?
13. How would you design roles for a company with fifty company codes needing the same access?
14. What happens to derived roles during a rollout to a new country?
15. How do you validate derived role org level values are correct?
16. What's the impact of an SU25 upgrade on derived roles?
17. How do you handle a derived role that was accidentally unlinked from its master?
18. What's the naming convention you'd use for master and derived roles?
19. How do you audit whether derived roles have drifted from their master?
20. What's the maintenance cost difference between derived roles and duplicated single roles?

## Tough Follow-up Questions

1. If a master role's menu grows over time, how do you prevent unwanted functionality from silently reaching every derived role?
2. How would you migrate a set of duplicated single roles into a proper master-derived structure without disrupting production access?
3. What's your process for detecting derived roles that have been manually modified outside org level fields?
4. If two business units need almost the same access but with one transaction different, how do you decide the structure?
5. How do you handle derived roles when organizational level values need to change for an already-live business unit?
6. What's the risk of a master role becoming too broad because it has to satisfy every derived role's edge case?
7. How would you audit an entire role catalog to identify roles that should be converted to derived roles?
8. What happens if a derived role references organizational level values that no longer exist in the org structure?
9. How do you handle regeneration at scale when a master role change affects hundreds of derived roles?
10. What's your strategy for testing a master role change before it propagates to every derived role?
11. How would you explain the trade-off between derived role reuse and the flexibility of independent single roles?
12. If a derived role needs a mitigating control for a segregation of duties conflict, does that apply at the master or the derived level?
13. What's the impact of deleting a master role that still has active derived roles linked to it?
14. How do you handle a scenario where the master role itself needs org-level restrictions in addition to its derived roles?
15. What would you check first if users under one derived role report different behavior than users under a sibling derived role?
16. How do you manage version control or change tracking across a master and its dozens of derived roles?
17. What's your approach to consolidating multiple master roles that have drifted into duplicating each other?
18. How would you design derived roles for a matrix organization where org levels don't map cleanly to business units?
19. What's the risk of relying on derived roles alone without also tracking segregation of duties at the composite role level?
20. How do you handle emergency changes to a derived role during an incident without breaking the master-derived relationship?

## SAP Transactions

PFCG, SU01, SU10, SUIM, PFUD

## SAP Tables

AGR_DEFINE, AGR_AGRS, AGR_1251, AGR_TCODES

## Best Practices

- Use derived roles whenever the same job function repeats across organizational units
- Never manually modify a derived role's menu — changes belong on the master
- Regenerate the master role before regenerating its derived roles
- Document the master-derived relationship so future teams understand the hierarchy
- Split off a new master role when functionality, not just org scope, genuinely diverges

## Common Mistakes

- Manually adding a transaction to one derived role instead of fixing the master
- Forgetting to regenerate derived roles after a master role change
- Forcing a derived role structure onto business units that need genuinely different functionality
- Losing track of which derived roles belong to which master in a large catalog
- Not validating organizational level values after a reorganization changes company codes or plants

## Interviewer's Hidden Expectations

Interviewers want to hear that you understand derived roles as a maintainability strategy, not just a PFCG feature. They're listening for whether you know exactly what does and doesn't inherit, and whether you can recognize when a derived role structure is the wrong fit for a business requirement.

## What Makes This a 10/10 Answer

An average answer says a derived role inherits from a master role. A 10/10 answer explains precisely what inherits and what doesn't, why that split exists, the regeneration mechanics required to propagate changes, and the judgment call for when a business unit's needs have outgrown the derived role model.

## Red Flags

- Saying a derived role can have its own different menu
- Not knowing that org level values are the one thing that doesn't inherit
- Forgetting that derived roles still need individual regeneration after the master changes
- No mention of the risk of manual modification breaking inheritance
- Treating derived roles as functionally identical to composite roles

## Keywords

derived role, master role, organizational level, PFCG, inheritance, company code, plant, role generation, regeneration

## Related Topics

- pfcg.md
- composite-roles.md
- role-design.md
