# Emergency Access Management (EAM)

## Overview

Emergency Access Management, commonly called Firefighter, gives users time-limited elevated access for production support or emergency scenarios, with every action taken during that access fully logged for review. It replaces standing broad access with controlled, auditable, temporary access instead.

## Interview Summary

EAM assigns a Firefighter ID with elevated authorization to a user for a defined session. Every transaction executed during that session is logged, and a controller reviews the log afterward. This gives production support teams the access they occasionally need without granting standing SAP_ALL-level access as a permanent role.

## 30 Second Interview Answer

Emergency Access Management, or Firefighter, lets a user temporarily use an elevated-access ID for production support scenarios instead of holding that access permanently. The user checks out the Firefighter ID, works within a time-limited session, and every single transaction they execute during that session gets logged. A controller then reviews the log afterward to confirm the access was used appropriately.

## 60 Second Interview Answer

EAM, or Firefighter, solves the problem of production support occasionally needing broad access without that access becoming a permanent standing role. Instead of assigning elevated authorization directly to a support engineer's own user ID, EAM assigns it to a dedicated Firefighter ID that gets checked out for a time-limited session.

During that session, every action the user takes under the Firefighter ID is logged in detail — transactions executed, data changed, the works. Once the session ends, a designated controller, who is independent of the Firefighter user, reviews the log to confirm the access was used appropriately and matches whatever business justification was given for the emergency access request.

The value is auditability without sacrificing the ability to actually resolve production issues quickly. A production incident doesn't wait for a normal access request cycle, but that urgency doesn't have to mean standing broad access sitting unused and unmonitored the rest of the time.

## 90 Second Interview Answer

Emergency Access Management, universally called Firefighter in practice, addresses a specific tension in access governance: production support genuinely needs broad, sometimes SAP_ALL-adjacent access to resolve urgent issues, but granting that access as a standing role to individual users creates exactly the kind of unmonitored, high-risk exposure that segregation of duties controls exist to prevent.

The mechanism works by decoupling the elevated access from the individual user's own ID. A Firefighter ID is a dedicated technical user carrying the elevated authorization, and support engineers check it out for a time-limited session rather than having that access baked into their own user profile permanently. Checkout typically requires a business justification — a specific incident or ticket reference — and the session has a defined expiration.

The part that makes this a real control rather than just a delayed version of standing access is the logging and review. Every transaction executed under the Firefighter ID during the session is captured in detail, and once the session closes, a controller — someone explicitly independent of the person who used the Firefighter ID — reviews that log against the stated business justification. Did the actions taken during the session actually match what the emergency was supposed to be for? That review is what closes the loop and is exactly the evidence auditors look for when evaluating whether emergency access is a genuine control or a formality.

The failure mode worth knowing is Firefighter access becoming a routine workaround rather than a genuine exception. If the same person is checking out the same Firefighter ID on a near-daily basis, that's a signal the underlying role design is wrong — the access being borrowed through Firefighter should probably be part of a properly scoped standing role instead, with its own design and SoD review, rather than being perpetually routed through an emergency mechanism that was designed for exceptions, not routine work.

## Architecture

- Firefighter ID: the dedicated technical user carrying elevated authorization
- Checkout: the process of a user requesting temporary use of a Firefighter ID
- Session: the time-limited window during which the checkout is active
- Session log: the detailed record of every action taken during the session
- Controller: the independent reviewer who validates session activity against justification

## Runtime Flow

A user requests to check out a Firefighter ID, typically providing a business justification or incident reference. Once approved, either automatically or through a lightweight approval, the user assumes the Firefighter ID's authorization for a defined session window. Every transaction executed during the session is logged in detail. When the session ends, either by timeout or explicit logoff, the session log is generated and routed to the assigned controller for review against the stated justification.

## Configuration

- Define Firefighter IDs and the elevated authorization each one carries
- Assign controllers who are independent of typical Firefighter users
- Configure session timeout and checkout justification requirements
- Set up logging scope to capture sufficiently detailed session activity

## Implementation Activities

- Identify which production support scenarios genuinely require elevated access
- Design Firefighter IDs scoped to the specific elevated access actually needed, not universally broad
- Assign controllers and define the review process and timeline
- Train support teams on the checkout, justification, and review process

## Migration Activities

- Validate Firefighter ID configuration and authorization content survived a system migration
- Confirm session logging continues to function correctly in the target environment
- Re-test the checkout and controller review workflow post-migration

## Rollout Activities

- Establish Firefighter IDs and controller assignments for the new business unit or system
- Train the new support population on the checkout and justification process
- Validate logging and review workflow functions for the expanded scope

## Production Support Activities

- Process Firefighter ID checkouts for genuine emergency or elevated-access scenarios
- Conduct timely controller review of session logs against justification
- Investigate any session activity that doesn't align with the stated justification
- Monitor for patterns suggesting Firefighter is being used as routine access rather than an exception

## Troubleshooting

Common issue: a controller review is significantly delayed or never happens.
Root cause: no enforcement mechanism ensures timely review after a session closes.
Resolution: implement tracking and escalation for overdue controller reviews.

Common issue: the same user is checking out Firefighter access almost daily.
Root cause: the underlying standing role design doesn't cover access the user genuinely needs regularly.
Resolution: evaluate whether that access should be part of a properly designed and reviewed standing role instead of routine Firefighter use.

Common issue: session logs don't clearly show what was actually done during the session.
Root cause: logging scope wasn't configured to capture sufficient detail.
Resolution: review and expand logging configuration to capture meaningful session activity.

## Common Interview Questions

1. What is Emergency Access Management and why is it called Firefighter?
2. How does checkout work for a Firefighter ID?
3. What gets logged during a Firefighter session?
4. Who reviews the session log and why does independence matter?
5. What's the risk of granting elevated access as a standing role instead?
6. How would you design Firefighter IDs for different support scenarios?
7. What's the business justification requirement for checkout?
8. How do you handle Firefighter access during a major production incident?
9. What's the risk of delayed controller review?
10. How would you detect Firefighter access being used as routine access?
11. What's the relationship between EAM and standing role design?
12. How do you scope a Firefighter ID's authorization appropriately?
13. What's your process for training support teams on Firefighter usage?
14. How do you handle Firefighter access across multiple systems?
15. What's the audit value of session logging and controller review?
16. How would you investigate suspicious activity found during a controller review?
17. What's the difference between Firefighter and standard elevated PFCG access?
18. How do you handle session timeout configuration?
19. What's your approach to Firefighter ID governance across a large support organization?
20. How would you measure whether Firefighter access is being used appropriately?

## Tough Follow-up Questions

1. If a controller review finds activity that doesn't match the stated justification, what's your process for escalation and investigation?
2. How would you redesign Firefighter usage patterns for a team that's using it as de facto standing access?
3. What's your process for validating that controller reviews are substantive, not rubber-stamped?
4. How do you handle Firefighter ID scoping for a support team that genuinely needs broad, unpredictable access?
5. What's the risk of Firefighter checkout approval being fully automated with no human gate?
6. How would you measure Firefighter usage trends to identify systemic role design gaps?
7. What's your strategy for Firefighter governance in an organization with 24/7 global support coverage across time zones?
8. How do you handle Firefighter session logging for actions that don't generate standard transaction logs?
9. What's the risk of Firefighter IDs being shared informally between team members?
10. How would you explain to leadership why Firefighter overuse is itself a risk indicator worth investigating?
11. What's your process for periodically re-evaluating whether existing Firefighter ID scopes are still appropriate?
12. How do you handle Firefighter access for non-SAP systems that don't have native EAM integration?
13. What's the risk of controller independence being compromised in a small organization with limited staff?
14. How would you design Firefighter checkout for a scenario requiring extremely fast access during a critical outage?
15. What's your approach to auditing whether Firefighter is actually reducing standing access risk organization-wide?
16. How do you handle disagreement between a controller and a Firefighter user about whether session activity was justified?
17. What's the risk of Firefighter session logs being reviewed but never actually acted upon when issues are found?
18. How would you handle Firefighter governance during a merger with two organizations using different EAM configurations?
19. What's your strategy for training controllers to perform meaningful, not superficial, session reviews?
20. How do you handle the trade-off between granting broad Firefighter scope for flexibility versus narrow scope for tighter control?

## SAP Transactions

GRAC_SPM, NWBC, GRACFFACT

## SAP Tables

GRACFFACT, GRACFFLOG, GRACFFOWNER

## Best Practices

- Scope Firefighter IDs to the specific elevated access actually needed, not maximally broad
- Assign controllers who are genuinely independent of typical Firefighter users
- Enforce timely controller review with tracking and escalation for overdue reviews
- Require meaningful business justification at checkout, not a generic note
- Monitor usage patterns to detect Firefighter access being used as routine standing access

## Common Mistakes

- Letting Firefighter access become de facto permanent access for frequent users
- Not enforcing timely controller review, letting sessions go unreviewed
- Scoping Firefighter IDs too broadly out of convenience
- Treating controller review as a formality instead of genuine oversight
- Not investigating session activity that doesn't match stated justification

## Interviewer's Hidden Expectations

Interviewers want to hear that you understand Firefighter as a genuine control mechanism, not just "temporary SAP_ALL." They're listening for whether you recognize the risk of Firefighter overuse becoming a role design symptom, and whether you understand why controller independence and timely review are what actually make it auditable.

## What Makes This a 10/10 Answer

An average answer describes Firefighter as temporary elevated access with logging. A 10/10 answer explains the checkout-session-review lifecycle in detail, why controller independence matters, and flags Firefighter overuse as a signal pointing back to a role design gap rather than treating it as an isolated access management topic.

## Red Flags

- Describing Firefighter as just "temporary SAP_ALL" with no mention of review
- Not mentioning controller independence as a requirement
- No awareness of the risk of Firefighter becoming routine access
- Treating session logging as sufficient without mentioning actual review
- No connection drawn between Firefighter overuse and role design problems

## Keywords

Emergency Access Management, EAM, Firefighter, Firefighter ID, checkout, session log, controller, review, elevated access

## Related Topics

- grc-overview.md
- firefighter.md
- risk-analysis.md
