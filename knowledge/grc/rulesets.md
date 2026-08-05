# Rulesets

## Overview

A ruleset is the maintained collection of segregation of duties rules that Access Risk Analysis evaluates against. It's built from functions — business activities mapped to authorization objects — combined into risks that define which function pairings are considered conflicting.

## Interview Summary

A ruleset defines risk. Functions map business activities to the underlying authorization objects and values, and risks combine two or more functions into a defined conflict. Ruleset quality directly determines whether ARA catches real risk or generates noise — it's a living asset that needs continuous maintenance, not a one-time configuration.

## 30 Second Interview Answer

A ruleset is the actual content ARA evaluates against — it's built from functions, which map business activities to specific authorization objects and values, and risks, which define which combinations of functions are considered a conflict. SAP ships a standard ruleset as a starting point, but every organization has to tailor it to their actual business processes, because a generic ruleset either misses real conflicts or flags irrelevant ones.

## 60 Second Interview Answer

A ruleset is made up of two layers. Functions are the base building block — each one maps a business activity, like "create vendor master" or "post payment," to the specific authorization objects and field values that represent doing that activity in the system. Risks combine two or more functions into a defined conflict — the classic example being the vendor creation and payment posting combination, since together they create the opportunity for fraud.

SAP ships a standard, generic ruleset out of the box, and most implementations use it as a starting point rather than the finished product. Customization matters because every organization's actual authorization landscape differs — custom Z-transactions, modified standard transactions, and organization-specific processes all need to be reflected for the ruleset to catch real risk instead of either missing conflicts entirely or generating noise from irrelevant flagged combinations.

Ruleset maintenance is ongoing, not one-time. As business processes evolve, as new transactions get built, and as roles get redesigned, the ruleset needs updates to stay accurate, or ARA's output degrades into something risk owners stop trusting.

## 90 Second Interview Answer

A ruleset is structured in two layers, and understanding both is what separates a superficial answer from a real one. Functions are the foundational layer — each function maps a specific business activity to the authorization objects and field values that represent performing it, so "create vendor master" as a function is really a definition pointing to the specific transaction codes and authorization object values that constitute that activity in the system. Risks are the second layer, built on top of functions — a risk defines a specific combination of two or more functions that, held together by the same person, creates a segregation of duties concern.

SAP ships a standard ruleset covering common, well-known conflicts across finance, procurement, and other core modules, and nearly every implementation uses it as a starting point rather than a finished solution. The reason customization is unavoidable is that the standard ruleset reflects generic SAP functionality, not any specific organization's actual authorization landscape — custom Z-transactions have no standard function mapping at all, and modified standard transactions may not behave the way the generic function definition assumes.

The quality of a ruleset directly determines whether ARA is a meaningful control or theater. A ruleset with gaps — missing functions for custom transactions, missing risks for organization-specific conflicts — means real segregation of duties violations go completely undetected, which is arguably worse than not running the analysis at all, because it creates false confidence. Conversely, a ruleset that's too broad or built against outdated business processes generates excessive noise, flagging combinations that don't represent genuine risk anymore, and that noise is exactly what causes risk owners to stop reviewing conflicts carefully and start approving on autopilot.

This is why ruleset maintenance has to be treated as a continuous operational responsibility tied to change management — every new custom transaction, every significant role redesign, every business process change should trigger a review of whether the ruleset still accurately reflects reality, rather than being revisited only when an audit forces the issue.

## Architecture

- Function: maps a business activity to specific authorization objects and field values
- Risk: defines a conflicting combination of two or more functions
- Standard ruleset: SAP-delivered baseline covering common cross-module conflicts
- Custom ruleset content: organization-specific functions and risks built on top of the standard baseline
- Risk level: classification indicating the severity or priority of a given risk

## Runtime Flow

When ARA runs an analysis, it evaluates a user's access — existing or simulated — against every function definition in the ruleset to determine which functions that access satisfies, then checks whether the resulting set of satisfied functions matches any defined risk's required combination. A match produces a flagged conflict, tagged with the risk's defined level, which then feeds into the broader risk response process.

## Configuration

- Start from the SAP-delivered standard ruleset as a baseline
- Build custom functions for organization-specific and custom Z-transactions
- Define custom risks reflecting organization-specific process conflicts
- Assign appropriate risk levels to prioritize review
- Establish a change management trigger for ongoing ruleset maintenance

## Implementation Activities

- Review the standard ruleset against actual organizational business processes
- Build custom functions mapping custom transactions to their authorization objects
- Define custom risks for organization-specific conflicts not covered by the standard set
- Validate ruleset accuracy through baseline analysis before go-live

## Migration Activities

- Validate function definitions still map correctly to authorization objects after a system migration
- Re-test ruleset accuracy against the migrated system's transaction landscape
- Update functions affected by deprecated or replaced transactions

## Rollout Activities

- Extend the ruleset with functions and risks specific to the new business unit's processes
- Validate custom ruleset content applies correctly to the expanded user population
- Reconcile any regional or entity-specific process variations into the ruleset

## Production Support Activities

- Maintain and update functions and risks as business processes and custom development evolve
- Support risk owners questioning why a specific combination was or wasn't flagged
- Periodically review ruleset accuracy against current organizational reality

## Troubleshooting

Common issue: a known conflict isn't being flagged by ARA.
Root cause: no function or risk definition in the ruleset covers that specific combination.
Resolution: build the missing function and risk definitions to cover the gap.

Common issue: ARA is flagging combinations that don't represent real risk anymore.
Root cause: the ruleset wasn't updated after a business process change made the flagged combination obsolete or irrelevant.
Resolution: review and retire or adjust the outdated risk definition.

Common issue: a custom transaction has no associated function in the ruleset.
Root cause: ruleset maintenance wasn't included as part of custom development.
Resolution: build the function definition mapping the custom transaction to its authorization objects, then evaluate whether it belongs in any existing or new risk.

## Common Interview Questions

1. What is a ruleset made of?
2. What's the difference between a function and a risk?
3. Does SAP provide a standard ruleset out of the box?
4. Why does the standard ruleset need customization?
5. What's the risk of an outdated ruleset?
6. How do you build a function for a custom transaction?
7. What's a risk level and why does it matter?
8. How would you validate ruleset accuracy?
9. What's the consequence of a ruleset with gaps?
10. What's the consequence of a ruleset that's too broad?
11. How do you maintain a ruleset as the business changes?
12. What's your process for adding a new risk definition?
13. How does ruleset quality affect risk owner trust in ARA?
14. What's the relationship between rulesets and custom development?
15. How would you audit a ruleset for completeness?
16. What's your approach to prioritizing which risks to build first?
17. How do you handle ruleset differences across multiple connected systems?
18. What's the impact of a deprecated transaction on ruleset accuracy?
19. How do you validate a new risk definition doesn't create false positives?
20. What's your process for reviewing the standard ruleset against actual business processes?

## Tough Follow-up Questions

1. If a ruleset has been unmaintained for years, how would you approach a full review and remediation?
2. How would you validate ruleset completeness against actual authorization object usage across the landscape?
3. What's your process for deciding which custom transactions genuinely need function definitions versus which are low-risk enough to skip?
4. How do you handle ruleset governance when multiple teams are building custom development independently?
5. What's the risk of a ruleset built entirely from the standard baseline with no organizational customization?
6. How would you measure whether ruleset quality is actually improving over time?
7. What's your strategy for identifying false positives systematically rather than relying on risk owner complaints?
8. How do you handle ruleset maintenance responsibility when security doesn't own custom development?
9. What's the risk of building overly specific risk definitions that miss variations of the same underlying conflict?
10. How would you validate that a new risk definition doesn't overlap or conflict with an existing one?
11. What's your approach to ruleset consolidation when multiple similar risks have accumulated over time?
12. How do you handle ruleset customization for a highly regulated versus a less regulated business unit within the same organization?
13. What's the risk of ruleset maintenance becoming purely reactive to audit findings instead of proactive?
14. How would you build a business case for investing in dedicated ruleset maintenance resources?
15. What's your process for validating ruleset accuracy without access to complete documentation of custom development?
16. How do you handle a scenario where the business disputes that a flagged risk represents genuine conflict?
17. What's your strategy for training business process owners to help identify ruleset gaps in their area?
18. How would you handle ruleset maintenance during a period of rapid organizational or system change?
19. What's the risk of ruleset content diverging between production and lower environments used for testing?
20. How do you handle rulesets for a landscape with both SAP and non-SAP connected systems?

## SAP Transactions

GRACRULEMNT, NWBC, GRAC_SPM

## SAP Tables

GRACFUNCTION, GRACRISK, GRACACTION, GRACPERM

## Best Practices

- Treat the standard SAP ruleset as a starting point, not a finished configuration
- Build function definitions for every custom transaction as part of development
- Assign risk levels thoughtfully to help prioritize review effort
- Establish a change management trigger tying business process changes to ruleset review
- Periodically validate ruleset accuracy against actual current business processes

## Common Mistakes

- Deploying the standard SAP ruleset without any customization
- Letting the ruleset go stale as business processes and custom development evolve
- Building risk definitions too narrowly, missing variations of the same conflict
- Treating ruleset maintenance as security's sole responsibility, disconnected from development
- Not validating ruleset accuracy before relying on ARA results for compliance reporting

## Interviewer's Hidden Expectations

Interviewers want to hear that you understand rulesets as a living asset requiring continuous maintenance, tied directly to how well ARA actually catches real risk. They're listening for whether you understand the function-and-risk structure specifically, not just "the ruleset defines conflicts" at a surface level.

## What Makes This a 10/10 Answer

An average answer says a ruleset defines segregation of duties conflicts. A 10/10 answer explains the function-and-risk structure precisely, why the standard SAP ruleset needs customization, and connects ruleset quality directly to whether risk owners can trust and act on ARA's output.

## Red Flags

- Not knowing the difference between a function and a risk
- Assuming the standard SAP ruleset is sufficient without customization
- No mention of ongoing maintenance as a requirement
- Treating ruleset gaps and ruleset noise as the same problem with the same fix
- No connection drawn between ruleset quality and risk owner trust

## Keywords

ruleset, function, risk, segregation of duties, standard ruleset, custom ruleset, risk level, ARA

## Related Topics

- ara.md
- risk-analysis.md
- mitigation.md
