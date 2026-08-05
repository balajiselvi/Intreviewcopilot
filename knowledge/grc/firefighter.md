# Firefighter (Operational Usage)

## Overview

This covers how Firefighter actually gets used day to day — the GRAC_SPM login flow, ID versus role-based Firefighter, and the practical realities of running a support engagement under it. For the governance model behind it — checkout, controller review, session logging design — see eam.md.

## Interview Summary

A support engineer logs into GRAC_SPM, selects an available Firefighter ID they're assigned to, provides a reason code and justification, and works within that session. There are two flavors — ID-based, where you log in as the Firefighter user, and role-based, where the elevated access gets temporarily added to your own user ID — each with different practical trade-offs.

## 30 Second Interview Answer

Day to day, a support engineer uses Firefighter through GRAC_SPM — you log in, pick from the Firefighter IDs you're assigned to, enter a reason code and justification, and that opens your session. There are two models: ID-based, where you're literally logging in as the Firefighter user, and role-based, where the elevated authorization gets temporarily assigned to your own user ID instead. ID-based is more common because it keeps a clean separation between your normal user and the elevated access.

## 60 Second Interview Answer

Operationally, Firefighter starts at GRAC_SPM. A support engineer sees the Firefighter IDs they're assigned to, selects one relevant to the issue, enters a reason code and a free-text justification tied to the incident, and that launches the session.

There are two implementation models. ID-based Firefighter has the engineer actually log into the target system as the Firefighter user — a distinct user ID from their own — which keeps a completely clean separation between normal activity and elevated activity in the system logs. Role-based Firefighter instead temporarily adds the elevated role to the engineer's own user ID for the session duration. ID-based is more common in practice because the separation makes review cleaner — anything logged under the Firefighter ID is unambiguously session activity, whereas role-based activity is mixed into the engineer's normal user log.

The practical friction point is usually reason code selection and justification quality. A vague justification like "fixing issue" gives the controller nothing to actually review against, and that's a recurring finding in audits — not that Firefighter was misused, but that the documentation trail is too thin to prove it wasn't.

## 90 Second Interview Answer

The operational side of Firefighter starts at GRAC_SPM, the transaction where a support engineer initiates a session. They see a list of Firefighter IDs they've been pre-assigned to — usually scoped by module or system, so a Basis-focused engineer and a finance-focused engineer have access to different Firefighter IDs. They select the relevant one, choose a reason code from a predefined list, and provide a free-text justification, typically referencing a specific incident or ticket number, and that combination launches the session.

There are two distinct implementation models worth knowing the difference between. ID-based Firefighter has the engineer log into the target system as the Firefighter user itself — a completely separate user ID from their own daily-use account. This is the more common pattern because it produces the cleanest audit separation: every action in the system log under that Firefighter ID is unambiguously part of the emergency session, with no need to disentangle it from the engineer's routine activity. Role-based Firefighter instead temporarily grants the elevated authorization to the engineer's own existing user ID for the session window, which is operationally simpler in some ways — no separate login — but makes controller review slightly harder, since the reviewer has to isolate session-specific actions from the engineer's normal activity in the same user's log.

The detail that actually determines whether a Firefighter engagement holds up under audit isn't the mechanics of checkout — it's the quality of the reason code and justification entered at the start. A generic justification gives a controller nothing concrete to validate the subsequent session log against, and that gap — not actual misuse — is what most commonly turns into an audit finding. A well-run Firefighter program trains engineers to write justifications specific enough that a controller reading the session log afterward can clearly connect each logged action back to the stated reason.

## Architecture

- GRAC_SPM: the transaction where Firefighter sessions are initiated
- ID-based Firefighter: login as a dedicated Firefighter user, cleanest audit separation
- Role-based Firefighter: elevated role temporarily added to the engineer's own user ID
- Reason code: predefined categorization for the type of emergency access
- Justification: free-text business reason, ideally tied to a specific incident

## Runtime Flow

An engineer opens GRAC_SPM and selects a Firefighter ID from those they're assigned to. They choose a reason code and enter justification text, which launches the session — either logging them in as the Firefighter user directly, or temporarily elevating their own user ID, depending on which model is configured. All transactions executed during the session are logged against that reason code and justification. When the session ends, the log, reason code, and justification together form the package a controller reviews.

## Configuration

- Assign engineers to the specific Firefighter IDs relevant to their support scope
- Configure the reason code list to reflect actual common emergency scenarios
- Decide between ID-based and role-based Firefighter per system or use case
- Train engineers on writing justifications specific enough to support later review

## Implementation Activities

- Determine which support scenarios need Firefighter and assign IDs accordingly
- Configure reason codes matching real operational categories
- Decide and configure ID-based versus role-based per system
- Train the support team on the checkout process and justification expectations

## Migration Activities

- Validate Firefighter ID assignments and GRAC_SPM access carried over correctly
- Re-test the checkout flow in the migrated or upgraded environment
- Confirm reason code configuration is intact post-migration

## Rollout Activities

- Assign Firefighter IDs to the new support population for the rollout entity
- Localize reason codes if the new business unit has distinct support scenarios
- Train the new team on checkout and justification practices

## Production Support Activities

- Support engineers checking out Firefighter access during live incidents
- Coach engineers on justification quality when reviews reveal thin documentation
- Investigate and resolve GRAC_SPM access issues preventing legitimate checkout

## Troubleshooting

Common issue: an engineer can't see the Firefighter ID they expect to use.
Root cause: they haven't been assigned to that Firefighter ID in the owner configuration.
Resolution: verify and correct the Firefighter ID owner assignment.

Common issue: a controller review flags a session for thin documentation, not misuse.
Root cause: the justification entered at checkout was too vague to validate against the session log.
Resolution: coach the engineer on justification quality, and consider tightening reason code and justification requirements.

Common issue: role-based Firefighter session activity is hard to distinguish from the engineer's normal work.
Root cause: role-based Firefighter mixes elevated and normal activity in the same user's log.
Resolution: consider switching to ID-based Firefighter for that system if audit separation is a priority.

## Common Interview Questions

1. How does a support engineer actually check out Firefighter access?
2. What's the difference between ID-based and role-based Firefighter?
3. What is a reason code and why does it matter?
4. Why does justification quality matter for audit purposes?
5. What transaction is used to initiate a Firefighter session?
6. Which Firefighter model produces cleaner audit separation, and why?
7. How are engineers assigned to specific Firefighter IDs?
8. What's the risk of a vague justification at checkout?
9. How would you train a support team on proper Firefighter usage?
10. What's the operational trade-off between ID-based and role-based Firefighter?
11. How do you handle Firefighter ID assignment for a multi-module support team?
12. What happens to session activity logging under each model?
13. How would you improve justification quality across a support organization?
14. What's your process for troubleshooting a missing Firefighter ID assignment?
15. How do reason codes get configured to reflect real scenarios?
16. What's the audit risk difference between the two Firefighter models?
17. How would you onboard a new support engineer to Firefighter usage?
18. What's your approach to choosing ID-based versus role-based for a new system?
19. How do you handle Firefighter checkout during a high-pressure incident?
20. What's the relationship between reason codes and controller review efficiency?

## Tough Follow-up Questions

1. If controller reviews consistently find thin justifications across the organization, how would you fix the pattern rather than individual instances?
2. How would you decide whether to standardize on ID-based Firefighter across an entire landscape versus allowing role-based for some systems?
3. What's your process for auditing whether reason codes still reflect actual operational scenarios?
4. How do you handle Firefighter usage training for a support team with high turnover?
5. What's the risk of engineers reusing the same generic justification text repeatedly?
6. How would you redesign the checkout process to make quality justification faster to enter under incident pressure?
7. What's your strategy for measuring justification quality objectively, not just spot-checking?
8. How do you handle Firefighter ID assignment governance as support team membership changes frequently?
9. What's the risk of role-based Firefighter in a system with weak underlying user activity logging?
10. How would you handle a scenario where an engineer legitimately needs to use two different Firefighter IDs for the same incident?
11. What's your process for validating that reason code selection actually matches session activity after the fact?
12. How do you handle Firefighter operational training differently for junior versus senior support engineers?
13. What's the risk of Firefighter ID sprawl, where too many narrowly-scoped IDs become hard to manage?
14. How would you design the checkout experience to reduce friction without sacrificing justification quality?
15. What's your approach to auditing whether engineers are checking out the most narrowly appropriate Firefighter ID versus a broader one out of convenience?
16. How do you handle Firefighter usage patterns that suggest an engineer is avoiding proper justification by keeping entries vague on purpose?
17. What's the risk of GRAC_SPM access itself being too broadly granted, undermining the control before checkout even happens?
18. How would you handle a merger scenario where two organizations have different ID-based versus role-based standards?
19. What's your strategy for post-incident review sessions that improve future justification quality?
20. How do you handle Firefighter operational metrics reporting to leadership without exposing sensitive incident details?

## SAP Transactions

GRAC_SPM, GRACFFACT, GRFNMW_DEV_MAP

## SAP Tables

GRACFFACT, GRACFFLOG, GRACFFOWNER, GRACFFROLE

## Best Practices

- Prefer ID-based Firefighter where audit separation is a priority
- Train engineers on writing specific, incident-tied justifications, not generic notes
- Assign Firefighter IDs scoped to actual support responsibilities, not universally broad
- Keep reason codes aligned with real, current operational scenarios
- Review justification quality as a metric, not just session log content

## Common Mistakes

- Accepting vague, generic justifications as sufficient at checkout
- Over-assigning engineers to Firefighter IDs beyond their actual scope
- Using role-based Firefighter where audit separation genuinely matters more
- Letting reason codes go stale relative to actual operational reality
- Treating checkout as a formality rather than the first half of a real control

## Interviewer's Hidden Expectations

Interviewers want to hear that you've actually operated within a Firefighter process, not just read about it — the ID-based versus role-based distinction and the justification quality issue are the kind of practical details that come from real usage, not documentation.

## What Makes This a 10/10 Answer

An average answer says you log into GRAC_SPM and select a Firefighter ID. A 10/10 answer explains the ID-based versus role-based trade-off, why justification quality is the actual determinant of whether an engagement survives audit, and connects operational practice back to the governance model it supports.

## Red Flags

- Not knowing the difference between ID-based and role-based Firefighter
- Treating justification as a formality with no connection to audit outcomes
- No mention of GRAC_SPM as the actual entry point
- Describing Firefighter usage without any awareness of controller review downstream
- Confusing this operational topic entirely with the governance topic in eam.md

## Keywords

Firefighter, GRAC_SPM, ID-based, role-based, reason code, justification, checkout, session

## Related Topics

- eam.md
- grc-overview.md
