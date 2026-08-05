# BRF+

## Overview

BRF+, Business Rule Framework plus, is the rules engine that resolves agent determination inside GRC Access Control workflows. Where MSMP defines the approval stages, BRF+ decides who the actual approver is at each stage by evaluating business rules against the request's data.

## Interview Summary

BRF+ evaluates decision tables and rules against request data — organizational unit, role requested, request type — to resolve the correct approver for an MSMP stage. It's a general-purpose rules engine SAP uses well beyond GRC, but in Access Control it's almost always encountered as the agent determination layer behind the workflow.

## 30 Second Interview Answer

BRF+ is the rules engine that determines who approves at each stage of an MSMP workflow. You build rules, often as decision tables, that take request data like organizational unit or role type as input and return the correct approver. MSMP handles the process structure, BRF+ handles resolving the actual person or role that should approve.

## 60 Second Interview Answer

BRF+ is a general-purpose business rules engine in SAP, but in GRC Access Control it's used almost exclusively for agent determination — deciding who the approver is at a given MSMP stage. You build rules, commonly as decision tables, that evaluate request attributes like organizational unit, company code, or the specific role being requested, and return the agent who should approve.

The reason this is separated from MSMP is flexibility. Approval logic changes far more often than workflow structure — a new manager, a reorganized department, a change in who owns a particular role. Keeping that logic in BRF+ rules means you update a rule, not the workflow itself, when organizational reality shifts.

The common failure mode is a rule that doesn't account for an edge case — a new organizational unit that wasn't in the decision table, for example — which causes agent determination to fail silently. The request doesn't error, it just has no resolvable approver, and from the outside it looks identical to a stuck MSMP stage.

## 90 Second Interview Answer

BRF+ is SAP's general-purpose business rules engine, used broadly across many application areas, but the context it comes up in almost every GRC interview is agent determination — resolving who the actual approver is at a given MSMP workflow stage.

The typical implementation is a decision table: a structured rule where you define input columns, like organizational unit, company code, or the specific role or business process being requested, and an output column that returns the agent — a specific user, a role, or a dynamically resolved position like "the requester's manager." When MSMP reaches a stage that requires agent determination, it calls out to the associated BRF+ rule, passes in the relevant request data, and BRF+ evaluates the decision table to return the approver.

The design reason this is separated from MSMP is that approval logic and workflow structure change at very different rates and for different reasons. Organizational changes — a new department, a role owner change, a company reorganization — happen constantly and should only require updating a BRF+ rule. Workflow structure changes — adding an entirely new approval stage — happen far less often and represent a genuinely different kind of change. Keeping them separate means routine organizational maintenance doesn't require touching the workflow definition at all.

The practical risk with BRF+ rules is incompleteness rather than incorrectness. A decision table built against the current organizational structure will silently fail to resolve an agent the moment a new organizational unit, role, or scenario appears that wasn't accounted for in the table. Because BRF+ doesn't necessarily throw a visible error in that case, from the requester's perspective the request just sits there with no apparent approver, which is functionally identical to an MSMP configuration problem and requires checking both layers to properly diagnose.

## Architecture

- Application: the top-level BRF+ container for a set of related rules
- Decision table: the most common rule type used for agent determination, mapping input conditions to an output agent
- Function: the callable unit MSMP invokes to trigger rule evaluation
- Rule expressions: the logic evaluated against request data
- Result: the resolved agent, or a failure to resolve if no rule condition matches

## Runtime Flow

When an MSMP stage requires agent determination, it calls the linked BRF+ function, passing in relevant request data as input. BRF+ evaluates its configured rules, most commonly a decision table, against that input. If a matching row is found, the associated agent is returned to MSMP, which then routes the approval task to that agent. If no row matches, agent determination fails, and the stage has no resolvable approver — MSMP has no independent fallback unless one was explicitly configured.

## Configuration

- Build BRF+ applications and decision tables mapped to each MSMP stage requiring agent determination
- Define input columns matching the request attributes relevant to approver resolution
- Maintain decision table rows to cover all realistic organizational scenarios
- Test rule evaluation against edge cases, not just the common path

## Implementation Activities

- Design decision tables based on actual organizational approval authority
- Build and test BRF+ rules for every MSMP stage requiring agent determination
- Validate rule coverage against realistic request scenarios, including edge cases
- Document rule logic so future maintainers understand how agents are resolved

## Migration Activities

- Validate BRF+ applications and decision tables transported correctly to the target system
- Re-test agent determination behavior after a GRC version upgrade
- Confirm rule references from MSMP stages still resolve correctly post-migration

## Rollout Activities

- Extend decision tables to cover the new business unit's organizational structure
- Validate agent determination resolves correctly for the new user population
- Coordinate BRF+ rule updates with MSMP stage configuration for the rollout

## Production Support Activities

- Investigate stuck requests by checking BRF+ rule evaluation results
- Update decision tables as organizational structure changes
- Add missing rule coverage when a new scenario causes agent determination to fail

## Troubleshooting

Common issue: a request is stuck with no approver notified.
Root cause: the BRF+ decision table has no matching row for this request's specific combination of attributes.
Resolution: review the rule evaluation, identify the missing scenario, and add the corresponding row to the decision table.

Common issue: a rule resolves to the wrong approver.
Root cause: decision table rows weren't updated after an organizational change, like a role owner reassignment.
Resolution: update the relevant decision table rows to reflect current organizational reality.

Common issue: agent determination works in QA but fails in production.
Root cause: decision table data differs between environments, often because production organizational data wasn't reflected in the QA test data.
Resolution: validate and align decision table content across environments, or test against production-representative data.

## Common Interview Questions

1. What is BRF+ and what's its role in GRC?
2. How does BRF+ relate to MSMP?
3. What is a decision table in BRF+?
4. What happens if a BRF+ rule doesn't match any row?
5. Why is agent determination logic kept separate from workflow structure?
6. How do you troubleshoot a request with no resolved approver?
7. What input data does a typical agent determination rule use?
8. How would you design a BRF+ rule for a new organizational unit?
9. What's the risk of incomplete decision table coverage?
10. How does BRF+ get invoked by MSMP?
11. What's the difference between BRF+ used in GRC versus other SAP applications?
12. How do you validate BRF+ rules before go-live?
13. What's your process for updating rules after an org restructure?
14. How do you handle BRF+ rule differences between environments?
15. What happens when two rule conditions could both apply to the same request?
16. How would you design agent determination for a dynamic approver like "requester's manager"?
17. What's the audit consideration for BRF+ rule changes?
18. How do you test edge cases in a decision table?
19. What's the relationship between BRF+ applications and functions?
20. How would you handle BRF+ rule design for a complex multi-dimensional approval hierarchy?

## Tough Follow-up Questions

1. If a BRF+ rule silently fails to resolve an agent, how would you design monitoring to catch that before a user reports it?
2. How would you redesign a decision table that's grown too large and complex to maintain reliably?
3. What's your process for validating that a BRF+ rule change doesn't break agent determination for unrelated request types?
4. How do you handle BRF+ rules that need to resolve dynamically based on data not available until request submission?
5. What's the risk of BRF+ rules referencing organizational data that itself isn't well governed?
6. How would you explain to a non-technical stakeholder why a "simple" approver change requires careful rule testing?
7. What's your strategy for auditing BRF+ decision tables for stale or conflicting rows?
8. How do you handle BRF+ rule design when the same request type needs different logic in different regions?
9. What's the risk of a decision table with overlapping conditions that could match multiple rows?
10. How would you migrate agent determination logic from an old hardcoded approver list to a proper BRF+ decision table?
11. What's your process for testing BRF+ rules against production-representative data without using actual production data?
12. How do you handle BRF+ rule versioning when approval logic needs to change for a specific time period only?
13. What's the risk of BRF+ becoming a black box that only the original rule author understands?
14. How would you design BRF+ rules to gracefully degrade to a fallback approver instead of failing silently?
15. What's your approach to documenting BRF+ rule logic for audit and knowledge transfer purposes?
16. How do you handle BRF+ performance when decision tables grow very large with thousands of rows?
17. What's the risk of BRF+ rules that depend on data synchronized from an external system with sync delays?
18. How would you validate BRF+ rule correctness as part of a broader MSMP workflow test?
19. What's your strategy for consolidating duplicate or near-duplicate BRF+ rules across multiple request types?
20. How do you handle BRF+ rule governance when multiple teams are building rules independently?

## SAP Transactions

BRF+, BRFPLUS, GRFNMW_DEV_MAP

## SAP Tables

Not table-driven in the traditional sense — BRF+ objects (applications, functions, rules, decision tables) are stored in BRF+'s own repository, accessed through the BRF+ workbench rather than direct table maintenance.

## Best Practices

- Build decision tables with input columns that map directly to real organizational attributes
- Cover edge cases explicitly rather than assuming a default fallback will handle them
- Test rule evaluation against production-representative scenarios before go-live
- Document rule logic so agent determination isn't a black box to future maintainers
- Review and update decision tables proactively after organizational changes, not reactively after tickets

## Common Mistakes

- Building decision tables that only cover the common case, missing edge scenarios
- Letting decision tables go stale after organizational restructuring
- Assuming a rule that works in QA will behave identically in production without validating data differences
- Treating BRF+ as a black box nobody documents or fully understands
- Not testing what happens when no rule condition matches

## Interviewer's Hidden Expectations

Interviewers want to hear that you understand BRF+ as the "who" behind MSMP's "what and when," and that you've dealt with the specific failure mode of incomplete rule coverage causing silent stuck requests. That combination signals real troubleshooting experience, not just configuration familiarity.

## What Makes This a 10/10 Answer

An average answer says BRF+ determines approvers using rules. A 10/10 answer explains decision table mechanics, why this logic is deliberately separated from MSMP's workflow structure, and the specific silent-failure risk of incomplete rule coverage — the most common real production issue with BRF+.

## Red Flags

- Describing BRF+ as part of MSMP rather than a separate, integrated engine
- Not knowing what a decision table is
- No mention of the risk of rules not matching any condition
- Treating BRF+ as GRC-specific rather than a general-purpose rules engine
- No awareness that agent determination failures look identical to MSMP configuration problems from the outside

## Keywords

BRF+, Business Rule Framework, decision table, agent determination, rule, application, function, MSMP integration

## Related Topics

- msmp.md
- arm.md
- grc-overview.md
