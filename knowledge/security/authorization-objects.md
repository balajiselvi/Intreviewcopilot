# Authorization Objects

## Overview

An authorization object is the smallest unit of permission in SAP. It groups up to ten authorization fields, and every field can carry one or more values. A user only passes a check on that object if every field required by the check has a matching value in the user's buffer. Authorization objects are grouped into object classes by functional area and are the mechanism every AUTHORITY-CHECK statement in the system relies on.

## Interview Summary

Authorization objects define what can be checked, not what's actually granted — that comes from the values assigned in a role. An object like S_TABU_DIS has fields such as activity and authorization group. A role only grants access if it supplies a value for every field the check requires; missing even one field fails the whole object check, regardless of the others.

## 30 Second Interview Answer

An authorization object is a template for a permission check, made up of a set of fields — up to ten of them. S_TABU_DIS, for example, checks activity and authorization group before letting someone maintain a table. The object itself doesn't grant anything. A role has to supply values for every field the check requires, and if even one field is missing, the whole check fails.

## 60 Second Interview Answer

An authorization object is the building block behind every AUTHORITY-CHECK in the system. It's a template with up to ten fields — things like activity, company code, or authorization group — and the ABAP program decides at runtime which object and which field values it needs before letting an action proceed.

Take S_TABU_DIS as an example. It checks the activity, like display or change, and the authorization group assigned to the table. A role has to carry a value for both fields for the check to pass. If the role only has a value for activity but not authorization group, the whole check fails, not just half of it.

Object classes group related objects by functional area — basis, HR, finance, and so on — which is mostly there to make SU21 maintenance and role design easier to navigate, not something the runtime check cares about.

## 90 Second Interview Answer

An authorization object is the unit SAP uses to define what can be checked, separate from what's actually granted. It's a template of up to ten fields, and the ABAP program decides at runtime exactly which object and which field values it needs before it lets an action continue.

Take S_TABU_DIS as a concrete example — it's the object behind table maintenance access. It has two fields: activity, which distinguishes display from change, and authorization group, which is a tag assigned to the table itself through table TDDAT. A role has to supply values for both fields, and both have to match, or the check fails entirely. That's the part people get wrong — authorization checks are all-or-nothing per object. A partial match on some fields doesn't grant partial access.

Objects are grouped into classes by functional area, mainly to make them easier to find in SU21 and easier to reason about during role design, but that grouping has no bearing on the runtime check itself.

The design work is knowing which objects actually matter for a given business process. Standard SAP transactions come with SU24 default proposals that tell you which objects typically apply, but custom Z-transactions or heavily modified processes often need objects added or field values corrected manually, and that's usually where role design goes wrong — either objects are missing entirely, or field values are left wide open with a full authorization wildcard instead of the actual required values.

## Architecture

- Authorization object: the definition, containing up to ten fields
- Authorization field: an individual data element the check evaluates, like ACTVT or BUKRS
- Object class: a functional grouping of related objects, used for navigation in SU21
- Authorization: an instance of an object with specific field values, assigned inside a role
- Field values: can be single values, ranges, or the full wildcard

## Runtime Flow

The ABAP program hits a protected operation and calls AUTHORITY-CHECK OBJECT with a specific object name and the field values it needs for that operation. The kernel compares every field in that statement against the values in the user's authorization buffer for that object. Every field has to have a matching value — there's no partial pass. If all fields match, the check returns sy-subrc 0 and the program continues. If any field is missing or doesn't match, the check fails and the user sees an authorization error naming the specific object and field.

## Configuration

- Maintain custom or missing authorization objects and fields in SU21
- Assign default proposals per transaction in SU24 so PFCG pulls the right objects automatically
- Set field values inside PFCG when building or maintaining a role
- Avoid full wildcard values on sensitive objects unless there's a documented business reason

## Implementation Activities

- Review which authorization objects apply to each business process in scope
- Create or extend authorization objects for custom Z-transactions using SU21
- Maintain SU24 proposals so future role builds pick up the right defaults automatically
- Validate field values against least privilege requirements before go-live
- Document authorization object usage for audit and role design reference

## Migration Activities

- Compare authorization object versions between source and target systems
- Identify deprecated or renamed objects and update dependent roles
- Re-validate field values against any changed object structure in the target release

## Rollout Activities

- Confirm authorization objects used by the template still apply to the new rollout entity's processes
- Adjust field values like company code or plant for the new org unit
- Re-test authorization checks against localized transactions if the rollout entity has country-specific processes

## Production Support Activities

- Investigate authorization failures by identifying the exact object and field from the error message
- Correct role field values without over-granting access
- Maintain and periodically review SU21 custom object definitions
- Support root cause analysis when a transport changes object behavior unexpectedly

## Troubleshooting

Common issue: user fails a check even though the role looks like it has the right object.
Root cause: one field within the object is missing a value, and object checks are all-or-nothing.
Resolution: run an authorization trace, identify the exact field that's missing, and add the value to the role.

Common issue: a custom transaction has no meaningful authorization protection.
Root cause: no authorization object was built or assigned for the custom logic, so the program only checks S_TCODE.
Resolution: build a dedicated authorization object in SU21, code the AUTHORITY-CHECK into the custom program, and maintain SU24 defaults.

Common issue: access is broader than intended after a role change.
Root cause: a field was set to a full wildcard instead of specific values.
Resolution: review and correct the field value in the role, then regenerate the profile.

## Common Interview Questions

1. What is an authorization object made of?
2. How many fields can an authorization object have?
3. What's the difference between an authorization object and an authorization?
4. How does field matching work during a check?
5. What happens if one field in an object doesn't have a value?
6. What is S_TABU_DIS used for?
7. What's the purpose of an object class?
8. How do you create a custom authorization object?
9. What's the relationship between SU21 and SU24?
10. How do you find out which authorization object is blocking a user?
11. What's a field value versus an authorization value?
12. What is the risk of using a full wildcard on a field?
13. How do custom Z-transactions get authorization protection?
14. What's the difference between ACTVT values for display versus change?
15. How would you design authorization checks for a new custom program?
16. What happens at runtime when AUTHORITY-CHECK executes?
17. How do you validate that an authorization object is being used correctly in a role?
18. What's an example of an authorization object tied to table access?
19. How do object classes help with role design?
20. What's the difference between a missing field value and an incorrect field value?

## Tough Follow-up Questions

1. If a check passes for nine fields but fails on the tenth, does the user get partial access?
2. How would you design an authorization object for a process that needs dynamic field values at runtime?
3. What's the risk of reusing an existing authorization object instead of creating a new one for a custom process?
4. How do you decide which fields an authorization object actually needs?
5. If SU24 proposes an object that isn't relevant to a transaction, what do you do?
6. How would you audit every role in the system for full wildcard field values?
7. What happens if an authorization object is deleted but still referenced in existing roles?
8. How do you handle authorization objects that need to check values not stored in a standard table?
9. What's the difference in how S_TCODE and a business object like M_MSEG_WMB get checked?
10. How would you explain to a developer why their custom program needs its own authorization object instead of relying on S_TCODE alone?
11. If two authorization objects seem to overlap in what they control, how do you decide which one to use?
12. What's your process for validating authorization object field values are actually least privilege, not just functional?
13. How do you handle an authorization object whose field values depend on data not known until runtime?
14. What would you check first if a program bypasses an authorization check entirely?
15. How do you identify unused authorization objects that could be cleaned up?
16. If a business process spans multiple modules, how do you decide which authorization objects apply?
17. What's the risk of an authorization object with too many fields for a role builder to maintain accurately?
18. How would you validate that a new authorization object doesn't conflict with existing segregation of duties rules?
19. What's your approach when SU21 shows an object with no clear documentation of its purpose?
20. How do you handle authorization object versioning across a multi-year rollout program?

## SAP Transactions

SU21, SU24, PFCG, SU53, ST01, SUIM

## SAP Tables

TOBJ, TACT, TACTZ, USOBT_C, USOBX_C, AGR_1251, TDDAT

## Best Practices

- Build authorization objects with only the fields the check genuinely needs
- Avoid full wildcard field values unless there's a documented, approved reason
- Keep SU24 proposals current so role builders inherit correct defaults
- Document custom authorization objects so future teams understand their purpose
- Test authorization objects against real transaction flows, not just isolated field values

## Common Mistakes

- Assuming partial field matches grant partial access
- Leaving field values as full wildcards for convenience during testing and forgetting to tighten them
- Reusing an unrelated authorization object instead of building a purpose-built one
- Not maintaining SU24 for custom transactions, forcing manual object additions every time
- Confusing an authorization object with the authorization instance built from it

## Interviewer's Hidden Expectations

Interviewers are checking whether you understand that authorization checks are all-or-nothing per object, since that misconception causes real production issues. They also want to see that you think about field-level design, not just "does the role have the object," because that's where least privilege actually gets enforced or quietly broken.

## What Makes This a 10/10 Answer

An average answer says an authorization object controls access to a transaction. A 10/10 answer explains the field-level mechanics — that every required field must match, that a single missing value fails the whole object, and that field design decisions like wildcards versus specific values directly determine whether a role satisfies least privilege.

## Red Flags

- Saying an authorization object and an authorization are the same thing
- Not knowing that a missing field fails the entire object check
- Recommending wildcard values as a default rather than an exception
- No mention of SU21 when asked how custom objects get created
- Describing authorization objects only in terms of PFCG screens, with no runtime explanation

## Keywords

authorization object, authorization field, ACTVT, object class, SU21, SU24, field value, wildcard, AUTHORITY-CHECK, S_TABU_DIS, authorization group, least privilege
