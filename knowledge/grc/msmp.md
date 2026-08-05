# MSMP Workflow

## Overview

MSMP, Multi-Step Multi-Process, is the workflow engine behind GRC Access Control's approval processes. It defines the stages a request moves through, the fallback and escalation behavior at each stage, and works together with BRF+ to determine who actually approves at each step.

## Interview Summary

MSMP structures the approval process itself — how many stages, what order, what happens if an approver doesn't respond. BRF+ handles the "who" through agent determination rules. Together they turn access requests into a governed, auditable approval flow instead of an ad hoc email chain.

## 30 Second Interview Answer

MSMP is the workflow engine that defines how an access request moves through approval stages in GRC. You configure the process ID, the initiator, how many stages there are, and what happens on timeout or rejection. It doesn't decide who approves — that's BRF+'s job — MSMP is purely the structure and sequencing of the approval process.

## 60 Second Interview Answer

MSMP stands for Multi-Step Multi-Process, and it's the workflow engine underneath GRC Access Control's request approvals. You configure it through process IDs, each representing a specific workflow — a new access request might use a different MSMP process than a termination request.

Within a process, you define stages, and each stage has configuration for things like escalation timing, what happens if an approver doesn't respond within a set period, and whether the stage is mandatory or can be skipped under certain conditions. MSMP handles the sequencing and the process logic — it decides that a request needs manager approval, then role owner approval, then possibly risk owner approval if there's a flagged conflict.

What MSMP explicitly does not do is determine who the approver actually is at each stage. That's BRF+'s responsibility. MSMP defines the "what happens and when," BRF+ defines the "who." Configuring one without understanding the other is a common gap — someone gets the stages right but the agent rules resolve to nobody, and requests silently stall.

## 90 Second Interview Answer

MSMP, Multi-Step Multi-Process, is the workflow engine that governs how access requests move through approval in GRC Access Control. It's configured around process IDs — each request type, new access, a role change, a termination, typically maps to its own MSMP process, since the approval logic genuinely differs between them.

Inside a process, you define a sequence of stages. Each stage carries its own configuration: how long before it escalates if the approver doesn't respond, whether it's a mandatory stage or conditionally skipped, and what the fallback behavior is if no valid approver is found. A typical stage sequence might be manager approval, then role or application owner approval, then a risk owner stage that only activates if the request was flagged with a segregation of duties conflict during risk simulation.

The critical thing to understand about MSMP is the division of responsibility with BRF+. MSMP owns the process structure — the stages, their order, their timing, and their escalation rules. It has no concept of who the actual approver is; that resolution happens entirely through BRF+ agent determination rules, which evaluate the request's data against business rules to identify the correct person or role. This separation is deliberate — it lets you change approval logic, like who counts as a role owner, without touching the workflow structure itself, and vice versa.

The practical failure mode that shows up in production is a well-designed MSMP process where the BRF+ rule for a given stage doesn't resolve to a valid agent — maybe because of missing master data or an edge case the rule didn't account for. The request doesn't error out visibly; it just sits at that stage with no notified approver, and from the requester's side it looks like nothing is happening. That's why MSMP and BRF+ troubleshooting always go together — you can't diagnose a stuck request by looking at the workflow structure alone.

## Architecture

- Process ID: the top-level workflow definition, typically one per request type
- Stage: an individual step in the approval sequence
- Escalation configuration: timeout and fallback behavior per stage
- Initiator: the rule determining what triggers the workflow
- Agent determination link: where MSMP hands off to BRF+ to resolve the actual approver

## Runtime Flow

A request is submitted and matched to the appropriate MSMP process based on its type. MSMP evaluates the first stage, calling out to BRF+ to determine the agent for that stage. Once that agent approves, MSMP advances to the next configured stage, repeating the agent determination call. If a stage times out without a response, the configured escalation behavior triggers, which might notify a backup approver or escalate to a manager. Once every required stage approves, the request is marked approved and handed off to the provisioning framework.

## Configuration

- Define a process ID for each distinct request type requiring different approval logic
- Configure stages in the correct sequence with appropriate escalation timing
- Set mandatory versus conditional stages, such as a risk owner stage that only activates on a flagged conflict
- Link each stage to the correct BRF+ agent determination rule
- Test escalation and timeout behavior, not just the happy path approval flow

## Implementation Activities

- Design the stage sequence for each request type based on business approval requirements
- Configure escalation timing appropriate to the organization's response expectations
- Coordinate MSMP stage design with BRF+ agent rule design, since they have to align
- Test the full workflow including escalation and rejection paths before go-live

## Migration Activities

- Validate MSMP process configuration transported correctly to the target system
- Re-test stage sequencing and escalation behavior after a GRC version upgrade
- Confirm in-flight requests during a migration are handled without data loss

## Rollout Activities

- Extend or replicate MSMP processes for new business units with different approval requirements
- Validate escalation timing is appropriate for the new business unit's working patterns and time zones
- Coordinate with BRF+ rule extension for the new population's approvers

## Production Support Activities

- Investigate stuck requests by checking both stage configuration and BRF+ agent resolution
- Adjust escalation timing based on observed approval response patterns
- Support process changes as approval requirements evolve

## Troubleshooting

Common issue: a request is stuck at a stage indefinitely.
Root cause: the BRF+ agent determination rule for that stage didn't resolve to a valid approver, so no one was ever notified.
Resolution: check the BRF+ rule execution for that stage, identify the missing data or rule gap, and correct it.

Common issue: a stage that should have been skipped is still requiring approval.
Root cause: the conditional logic determining whether the stage is mandatory wasn't configured correctly.
Resolution: review and correct the stage's conditional configuration.

Common issue: escalation isn't triggering when an approver doesn't respond.
Root cause: escalation timing wasn't configured, or the background job responsible for evaluating timeouts isn't running.
Resolution: verify escalation configuration and confirm the relevant background job is scheduled and running.

## Common Interview Questions

1. What does MSMP stand for and what does it do?
2. How does MSMP relate to BRF+?
3. What is a process ID in MSMP?
4. How do you configure a stage in MSMP?
5. What happens when an approver doesn't respond within the configured time?
6. How do you make a stage conditional rather than mandatory?
7. What's the difference between MSMP's role and BRF+'s role?
8. How would you troubleshoot a request stuck at a specific stage?
9. What's the typical stage sequence for a new access request?
10. How do you configure escalation behavior?
11. What happens if a stage has no valid approver?
12. How would you design MSMP for a termination request versus a new access request?
13. What's the initiator in an MSMP process?
14. How do you test an MSMP workflow before go-live?
15. What's the risk of a poorly designed escalation configuration?
16. How does MSMP hand off to the provisioning framework after approval?
17. What's your process for extending MSMP to a new business unit?
18. How do you handle MSMP configuration during a GRC upgrade?
19. What's the relationship between MSMP stages and risk owner approval?
20. How would you redesign an MSMP process that's causing requests to move too slowly?

## Tough Follow-up Questions

1. If requests are consistently stalling at the same stage, how would you diagnose whether it's an MSMP or a BRF+ issue?
2. How would you design MSMP escalation for a global organization spanning multiple time zones?
3. What's the risk of an MSMP process with too few stages versus too many?
4. How do you handle MSMP configuration changes without disrupting requests already in flight?
5. What's your process for validating that a new MSMP process handles every realistic request scenario?
6. How would you explain to a business stakeholder why their request needs three separate approval stages?
7. What's the risk of relying on a single escalation path with no secondary fallback approver?
8. How do you handle MSMP process design for a request type that genuinely needs different logic depending on the request's content?
9. What's your strategy for auditing whether MSMP approvals represent genuine review versus automatic approval?
10. How would you migrate from a legacy manual approval process to a properly designed MSMP workflow?
11. What's the risk of MSMP stage configuration drifting out of sync with actual organizational approval authority?
12. How do you handle a scenario where a stage's conditional logic depends on data that isn't available until a later stage?
13. What's your process for testing escalation and timeout behavior realistically before go-live?
14. How would you redesign MSMP if the current process routinely bypasses risk owner review for flagged conflicts?
15. What's the impact of MSMP process changes on historical request audit trails?
16. How do you handle MSMP configuration for emergency or expedited request scenarios?
17. What's the risk of MSMP processes that were copied from a template without being validated against actual business needs?
18. How would you measure whether MSMP escalation timing is appropriately calibrated?
19. What's your approach to MSMP governance across multiple parallel GRC configuration projects?
20. How do you handle MSMP process versioning when approval requirements change over time?

## SAP Transactions

GRFNMW_DEV_MAP, GRFNMW_CONFIGURE_WORKFLOW, SWDD, SWI1

## SAP Tables

GRFNMWWFCONF, GRFNMWSTAGE, GRFNMWPROCESS

## Best Practices

- Keep the number of stages proportional to actual governance need, not maximum caution
- Configure realistic escalation timing based on actual approver response patterns
- Design MSMP and BRF+ together, never one without the other
- Test escalation and rejection paths, not just the successful approval flow
- Document process ID purpose so future maintainers understand which process handles which request type

## Common Mistakes

- Designing MSMP stages without coordinating with BRF+ agent rule design
- Setting escalation timing too long, causing requests to sit unnoticed
- Making every stage mandatory even when conditional logic would be more appropriate
- Not testing what happens when a BRF+ rule fails to resolve an agent
- Copying an MSMP process as a template without validating it against the new request type's actual needs

## Interviewer's Hidden Expectations

Interviewers want to hear that you understand MSMP and BRF+ as a paired system, not MSMP in isolation. They're listening for whether you can diagnose a stuck request by reasoning about both the workflow structure and the agent determination logic together.

## What Makes This a 10/10 Answer

An average answer says MSMP is the GRC workflow engine. A 10/10 answer explains the precise division of responsibility between MSMP and BRF+, walks through stage configuration and escalation behavior, and describes the specific failure mode of a stage with no resolvable agent — the most common real production issue.

## Red Flags

- Describing MSMP as if it also determines who approves
- Not knowing the difference between MSMP's role and BRF+'s role
- No mention of escalation or timeout behavior
- Treating a stuck request as automatically an MSMP configuration problem without considering BRF+
- No awareness of conditional versus mandatory stages

## Keywords

MSMP, Multi-Step Multi-Process, workflow, process ID, stage, escalation, BRF+, agent determination, approval routing

## Related Topics

- brf-plus.md
- arm.md
- grc-overview.md
