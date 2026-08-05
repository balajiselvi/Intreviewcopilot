# User Administration

## Overview

User administration covers creating, maintaining, locking, and deprovisioning user master records in SAP, primarily through SU01 and mass tools like SU10. It's the operational layer that connects role design to actual people — a perfectly designed role means nothing until it's correctly assigned to the right user with the right validity period.

## Interview Summary

User administration is the day-to-day work of managing user master records — creation, role assignment, locking, password resets, and validity date maintenance. SU01 handles individual users, SU10 handles mass changes. The discipline matters because even well-designed roles create risk if assigned to the wrong person or left active after someone leaves.

## 30 Second Interview Answer

User administration is maintaining the user master record itself — creating accounts, assigning roles, setting validity dates, locking or unlocking access, and handling password resets. SU01 is for individual users, SU10 is for mass changes like reorganizations. It sounds basic, but it's the operational layer where role design actually becomes real access, and mistakes here, like forgetting to remove access after someone leaves, are some of the most common audit findings.

## 60 Second Interview Answer

User administration is the operational discipline of managing user master records — the actual SAP user accounts that roles get assigned to. SU01 handles individual user maintenance: creating accounts, assigning roles, setting validity periods, locking and unlocking, and resetting passwords. SU10 handles the same operations at scale for mass changes, which matters during reorganizations or bulk onboarding.

The part that gets underestimated is validity date and lock management. A role can be perfectly designed and still create risk if it's assigned with no end date to someone who's leaving the company in three months, or if a locked account isn't actually locked in every client. Timely deprovisioning — locking or removing access the moment someone changes roles or leaves — is one of the most consistently cited findings in SAP audits, precisely because it's operational discipline, not a design problem.

## 90 Second Interview Answer

User administration is the operational layer connecting role design to real people. SU01 is the transaction for maintaining an individual user master record — creating the account, assigning roles, setting validity start and end dates, locking or unlocking, resetting passwords, and maintaining user group and address data. SU10 does the same set of operations at scale, which is what you use for reorganizations, bulk onboarding, or mass role reassignment.

What makes user administration more than a clerical task is how directly it affects actual risk exposure, independent of how well roles are designed. A role can be scoped perfectly to least privilege, and it still creates real exposure if it's assigned with no validity end date to a contractor whose engagement ends in a month, or if a termination doesn't trigger a timely lock or role removal. Validity dates and lock status are exactly the kind of control that looks trivial until an audit finds a terminated employee's account still active six months later.

The mass side, through SU10, brings its own risk. Bulk changes are efficient, but a mistake in a mass operation — assigning the wrong role template to an entire user group, for example — propagates just as efficiently as the intended change would have. Mass changes deserve the same review discipline as individual ones, arguably more, because the blast radius is larger.

The other operational reality is that user administration usually isn't fully manual in a mature organization — it's wired into a provisioning workflow, often through GRC Access Request Management, so that role assignment goes through an approval chain rather than being a direct SU01 action by an administrator. Understanding where direct SU01 access should be restricted versus where the provisioning workflow should be the only path is itself a security design decision.

## Architecture

- User master record: the core object maintained in SU01, holding roles, validity, lock status, and personal data
- SU01: individual user maintenance transaction
- SU10: mass user maintenance transaction
- Validity period: start and end dates controlling when role assignments are active
- Lock status: system-level and client-level locks controlling login and access
- Provisioning workflow integration: how role assignment is typically routed through approval, not direct SU01 access

## Runtime Flow

When a user logs in, the system checks the user master record for lock status and validity period first, before any authorization checks happen. If the account is locked or outside its validity window, login fails immediately. If login succeeds, the roles assigned in the user master record are what get loaded into the authorization buffer for that session — user administration is the step that determines which roles are even in scope before any AUTHORITY-CHECK evaluates them.

## Configuration

- Maintain user master records through SU01 for individual changes
- Use SU10 for mass changes affecting many users at once
- Set validity end dates on any time-limited access, including contractors and temporary assignments
- Restrict direct SU01 role assignment access in favor of a governed provisioning workflow where applicable

## Implementation Activities

- Define the user creation and onboarding process, including default role assignment
- Set standards for validity date usage on time-limited access
- Integrate user administration with the provisioning or GRC access request workflow
- Establish the deprovisioning process for terminations and role changes

## Migration Activities

- Validate user master records transported or migrated correctly, including role assignments and validity dates
- Reconcile user accounts between source and target systems during a migration
- Confirm lock status and validity periods carried over as expected

## Rollout Activities

- Establish user creation and provisioning process for the new rollout entity's user population
- Localize validity and lock policies if the rollout entity has different compliance requirements
- Coordinate mass user creation through SU10 for the initial rollout population

## Production Support Activities

- Process individual user creation, role assignment, and lock or unlock requests
- Execute mass changes during reorganizations through SU10
- Investigate and resolve login or access issues tied to lock status or validity dates
- Support timely deprovisioning for terminations

## Troubleshooting

Common issue: a terminated employee's account is still active.
Root cause: deprovisioning wasn't triggered or completed as part of the termination process.
Resolution: lock the account immediately, remove role assignments, and review the termination process for the gap.

Common issue: a user can't log in even though their role assignment looks correct.
Root cause: the account is locked or outside its validity period.
Resolution: check lock status and validity dates in SU01 before investigating authorization objects.

Common issue: a mass change through SU10 affected more users than intended.
Root cause: the selection criteria for the mass operation was broader than expected.
Resolution: review and correct the affected user group, revert unintended changes, and tighten selection criteria for future mass operations.

## Common Interview Questions

1. What's the difference between SU01 and SU10?
2. What does the user master record actually contain?
3. Why do validity dates matter for user administration?
4. What's checked first at login — lock status or authorization?
5. How do you handle deprovisioning for a terminated employee?
6. What's the risk of a mass change through SU10?
7. How does user administration connect to a provisioning workflow like GRC ARM?
8. What's the difference between a system lock and a client-specific lock?
9. How would you handle bulk onboarding for a new business unit?
10. What's the audit risk of accounts with no validity end date?
11. How do you restrict direct SU01 access in favor of governed provisioning?
12. What's your process for validating user master data after a migration?
13. How do you handle password reset requests securely?
14. What's the risk of not using validity dates for contractor access?
15. How would you investigate a user who can't log in?
16. What's your approach to periodic user account recertification?
17. How do you handle user administration during a reorganization?
18. What's the relationship between user administration and role assignment?
19. How do you audit for terminated employees with still-active accounts?
20. What's your process for mass locking accounts during an emergency?

## Tough Follow-up Questions

1. If an audit finds dozens of terminated employees with active accounts, how would you investigate and fix the root cause?
2. How would you design a control to catch deprovisioning failures before an audit does?
3. What's your process for validating a mass SU10 change before executing it in production?
4. How do you handle user administration for accounts shared across multiple people, and why is that itself a risk?
5. What's the risk of provisioning workflows being bypassed through direct SU01 access?
6. How would you handle emergency mass account lockout during a security incident?
7. What's your approach to reconciling HR termination data with SAP user master status automatically?
8. How do you handle user administration for service accounts or technical users differently from human users?
9. What's the risk of validity dates being set incorrectly at account creation and never revisited?
10. How would you audit whether SU10 mass changes are being adequately reviewed before execution?
11. What's your strategy for user administration in a landscape with multiple SAP systems needing synchronized account status?
12. How do you handle a user administration request that conflicts with a segregation of duties control?
13. What's the risk of manual user administration processes at scale compared to automated provisioning?
14. How would you design the process to ensure contractor accounts are automatically deactivated at contract end?
15. What's your approach to periodic recertification of user accounts and their role assignments?
16. How do you handle user administration during a system consolidation where duplicate accounts might exist?
17. What's the risk of administrators having broad SU01 access without oversight?
18. How would you investigate whether mass user changes correlate with any unusual access patterns afterward?
19. What's your process for handling user administration exceptions that fall outside standard onboarding or offboarding workflows?
20. How do you balance administrative efficiency against the audit risk of broad user administration access?

## SAP Transactions

SU01, SU10, SU01D, SUIM, SU53

## SAP Tables

USR02, USR21, USR04, AGR_USERS, USH02

## Best Practices

- Always set validity end dates on time-limited or contractor access
- Route role assignment through a governed provisioning workflow rather than direct SU01 access where possible
- Deprovision accounts immediately upon termination, not on a delayed schedule
- Review mass SU10 changes before execution, treating them with the same scrutiny as individual changes
- Periodically recertify user accounts and their role assignments

## Common Mistakes

- Leaving terminated employees' accounts active past their last working day
- Not setting validity end dates on contractor or temporary access
- Executing mass SU10 changes without validating selection criteria first
- Treating user administration as purely clerical instead of a real control point
- Allowing broad, unrestricted direct SU01 access instead of a governed provisioning path

## Interviewer's Hidden Expectations

Interviewers want to hear that you understand user administration as a real control point, not just data entry. They're listening for whether you connect deprovisioning delays and validity date discipline to actual audit risk, since that's the most common real-world failure in this area.

## What Makes This a 10/10 Answer

An average answer describes SU01 and SU10 as tools for creating and changing users. A 10/10 answer explains why validity dates and timely deprovisioning are real controls, how mass changes carry outsized risk, and how user administration should be governed through a provisioning workflow rather than left as unrestricted direct access.

## Red Flags

- Describing user administration as purely clerical with no security implication
- Not mentioning validity dates or deprovisioning risk
- No awareness of the risk profile difference between SU01 and mass SU10 changes
- Suggesting direct SU01 access is fine without any provisioning governance
- Not connecting user administration failures to real audit findings

## Keywords

SU01, SU10, user master record, validity date, deprovisioning, lock status, provisioning workflow, mass user change

## Related Topics

- pfcg.md
- role-design.md
- sap-security.md
