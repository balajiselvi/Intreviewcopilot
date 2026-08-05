# Access Request Management (ARM)

## Overview

Access Request Management is the GRC component that governs how access actually gets provisioned. Instead of an administrator directly assigning roles, a request goes through submission, risk simulation, approval routing via MSMP and BRF+, and then automated provisioning to the target system.

## Interview Summary

ARM turns access provisioning into a governed workflow. A user or manager submits a request, ARA runs a risk simulation against it, MSMP routes it through approval stages using BRF+ for agent determination, and once approved the provisioning framework pushes the role assignment to the target system automatically, with the entire trail logged for audit.

## 30 Second Interview Answer

ARM is the request workflow behind access provisioning in GRC. Someone submits a request for access, it gets simulated against the segregation of duties ruleset, routed through approval stages using MSMP and BRF+ for agent determination, and once approved, the provisioning framework pushes the role assignment to the target system automatically. Nothing gets granted without going through that trail.

## 60 Second Interview Answer

ARM is the provisioning workflow at the center of GRC Access Control. It starts when a request is submitted — new access, a change, or a termination — and the first thing that happens is a risk simulation against the current ruleset to identify segregation of duties conflicts before anyone approves anything.

From there, MSMP handles the approval routing, moving the request through however many stages are configured, and BRF+ determines who the actual approver is at each stage based on rules — role owner, manager, risk owner if there's a flagged conflict, and so on. Once every stage approves, the provisioning framework takes over and pushes the actual role assignment to the target system through the appropriate connector.

The reason this matters over direct PFCG assignment is the audit trail. Every request has a submitter, a risk analysis result, an approval history, and a provisioning outcome, all logged. That's what makes access defensible during a compliance review, not just technically correct.

## 90 Second Interview Answer

ARM is the provisioning workflow that sits at the center of GRC Access Control, and it's built on two other components working together: MSMP for the approval process structure, and BRF+ for the business rules that determine who approves at each stage.

The flow starts with a request — new access, a change to existing access, or a termination request — submitted either by the user, their manager, or through an integration with an HR system. Before anything reaches an approver, a risk simulation runs against the current ARA ruleset, evaluating whether the requested access would create a segregation of duties conflict. That result gets attached to the request so approvers are making an informed decision, not approving blind.

MSMP then routes the request through its configured stages. A typical flow might include the requester's manager, the role or application owner, and — if a conflict was flagged — a risk owner who has to review and either approve with a mitigating control or reject. BRF+ is what actually resolves who the approver is at each stage; it evaluates rules against the request data, like organizational unit or the specific role being requested, to determine the correct agent rather than relying on a hardcoded approver list that breaks the moment someone changes roles.

Once every required stage approves, the provisioning framework executes the actual role assignment, pushing it to the target system through the relevant connector — direct for SAP systems, or through other integration methods for non-SAP targets. The entire history, from submission through risk analysis, approval decisions, and provisioning outcome, is retained as the audit trail. That end-to-end record is the actual point of ARM — it's not faster than direct PFCG assignment, it's defensible.

## Architecture

- Request types: new access, change, termination
- Risk simulation: ARA integration evaluating SoD conflicts before approval
- MSMP workflow: the staged approval process structure
- BRF+ agent determination: rules resolving who approves at each stage
- Provisioning framework: the component that executes the actual role assignment post-approval
- Connectors: the integration layer to target systems

## Runtime Flow

A request is submitted and immediately triggers a risk simulation against the ARA ruleset. The request enters the MSMP workflow, which evaluates its configured stages in sequence. At each stage, BRF+ rules determine the specific approver based on request attributes. If a stage requires mitigation review due to a flagged conflict, that approval can't be bypassed. Once all stages approve, the provisioning framework picks up the request and pushes the role assignment to the target system, logging the outcome back onto the request record.

## Configuration

- Configure request types and the data fields each type requires
- Build MSMP workflows defining the approval stages for each request type
- Configure BRF+ rules for agent determination at each stage
- Integrate ARA risk simulation into the request submission process
- Configure connectors for automated provisioning to target systems

## Implementation Activities

- Design request types and their required approval stages based on business requirements
- Build and test MSMP workflows for each request type
- Configure BRF+ agent determination rules and validate against real organizational data
- Integrate provisioning connectors for all in-scope target systems
- Test the full request lifecycle from submission through provisioning before go-live

## Migration Activities

- Validate MSMP workflow and BRF+ rule behavior after a system or GRC version migration
- Re-test provisioning connector functionality against the migrated target system
- Confirm historical request data and audit trail integrity survived the migration

## Rollout Activities

- Extend MSMP workflows and BRF+ rules to cover new business units or request types
- Onboard new approvers and validate BRF+ agent determination for the expanded population
- Configure new connectors if the rollout introduces new target systems

## Production Support Activities

- Investigate and resolve stuck or misrouted requests
- Troubleshoot provisioning failures between approval and target system assignment
- Support user and approver questions about request status
- Maintain BRF+ rules as organizational structure changes

## Troubleshooting

Common issue: a request is stuck at an approval stage with no approver notified.
Root cause: the BRF+ agent determination rule didn't resolve a valid approver for that stage.
Resolution: review the BRF+ rule execution log, identify the missing or incorrect rule data, and correct it.

Common issue: a request was approved but the role never appeared in the target system.
Root cause: a connector or provisioning framework failure after approval.
Resolution: check connector status and background job logs, then manually reprocess or re-trigger provisioning.

Common issue: a request bypassed risk analysis entirely.
Root cause: the risk simulation step wasn't properly integrated into that request type's configuration.
Resolution: correct the request type configuration to enforce risk simulation before routing to approval.

## Common Interview Questions

1. What is Access Request Management and what problem does it solve?
2. How does MSMP relate to ARM?
3. What's the role of BRF+ in the ARM process?
4. What happens when a risk simulation flags a conflict during a request?
5. What are the typical request types in ARM?
6. How does provisioning actually happen after approval?
7. What's the audit value of the ARM request trail?
8. How do you troubleshoot a stuck access request?
9. What's the difference between ARM and directly assigning roles in PFCG?
10. How does BRF+ determine the correct approver at each stage?
11. What happens if a connector fails during provisioning?
12. How would you design an ARM workflow for a termination request?
13. What's your process for testing an ARM workflow before go-live?
14. How do you handle mitigating controls within the ARM approval flow?
15. What's the relationship between ARM and Business Role Management?
16. How do you validate that provisioning actually completed successfully?
17. What's the risk of an overly complex MSMP workflow with too many stages?
18. How would you handle ARM for a rollout to a new business unit?
19. What's your approach to onboarding new approvers into BRF+ rules?
20. How do you maintain BRF+ rules as the organization's structure changes?

## Tough Follow-up Questions

1. If a request is stuck and the deadline for access is today, what's your process for resolving it without bypassing governance?
2. How would you redesign an ARM workflow that's become too slow due to too many approval stages?
3. What's your process for validating that BRF+ agent determination rules still resolve correctly after an org restructure?
4. How do you handle ARM requests for access that spans multiple target systems with different connector behaviors?
5. What's the risk of BRF+ rules that fall back to a default approver when the intended rule doesn't resolve?
6. How would you audit whether ARM approvals are genuine reviews versus rubber-stamping?
7. What's your strategy for handling provisioning failures that aren't immediately visible to the requester?
8. How do you handle ARM governance when a target system doesn't support automated provisioning at all?
9. What's the risk of ARM request types not covering an edge case, like a lateral role change?
10. How would you explain to a business stakeholder why a request that looks simple still needs multiple approval stages?
11. What's your process for reconciling ARM's provisioning record against what's actually live in a target system?
12. How do you handle a scenario where BRF+ resolves two different valid approvers for the same stage?
13. What's the risk of ARM workflows not adequately handling emergency or time-critical requests?
14. How would you measure whether ARM is meaningfully reducing unauthorized access compared to direct provisioning?
15. What's your approach to ARM configuration testing across dev, QA, and production before a workflow change goes live?
16. How do you handle historical ARM request data during a GRC version upgrade?
17. What's the risk of over-automating agent determination without any manual override capability?
18. How would you design ARM for an organization with highly decentralized approval authority?
19. What's your strategy for training new approvers on how to properly review a flagged SoD conflict?
20. How do you handle ARM when the same access needs different approval paths depending on urgency or context?

## SAP Transactions

NWBC, GRAC_SPM, GRFNMW_DEV_MAP, GRFNMW_CONFIG

## SAP Tables

GRACREQUEST, GRACUSER, GRACROLE, GRFNMWWFCONF

## Best Practices

- Design request types around actual business scenarios, not a one-size-fits-all form
- Keep MSMP workflows as lean as possible while still meeting governance requirements
- Validate BRF+ agent determination rules against real organizational data regularly
- Monitor provisioning success rates, not just approval completion
- Treat the full request history as the audit deliverable it actually is

## Common Mistakes

- Building overly complex MSMP workflows that slow down legitimate requests
- Letting BRF+ rules go stale after organizational changes, causing routing failures
- Assuming approval completion means provisioning succeeded without verifying
- Not testing the full request lifecycle end to end before go-live
- Treating mitigating control approval as a formality instead of a real risk decision

## Interviewer's Hidden Expectations

Interviewers want to hear that you understand ARM as an end-to-end governed process, not just a request form. They're listening for whether you can explain how ARA, MSMP, and BRF+ integrate into the request lifecycle, and whether you've dealt with real provisioning failures, not just the happy path.

## What Makes This a 10/10 Answer

An average answer describes ARM as "the tool for requesting access." A 10/10 answer walks through the full lifecycle — risk simulation, MSMP routing, BRF+ agent determination, and provisioning — and explains why the resulting audit trail is the actual value, not just faster access.

## Red Flags

- Describing ARM as just a request form with no mention of risk simulation
- Not knowing how BRF+ and MSMP relate to ARM
- No mention of provisioning as a distinct step that can fail independently of approval
- Treating ARM as identical to direct PFCG assignment, just slower
- No awareness of the audit trail as ARM's core value

## Keywords

Access Request Management, ARM, MSMP, BRF+, risk simulation, provisioning, connector, approval workflow, agent determination

## Related Topics

- msmp.md
- brf-plus.md
- ara.md
- grc-overview.md
