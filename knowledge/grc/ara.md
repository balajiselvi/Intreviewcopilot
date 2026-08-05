# Access Risk Analysis (ARA)

## Overview

Access Risk Analysis is the GRC component that evaluates segregation of duties conflicts. It runs against a maintained ruleset, checking both existing role assignments and simulated requests before approval, and produces the risk data that drives mitigation decisions and approval routing elsewhere in GRC.

## Interview Summary

ARA compares a user's actual or proposed access against a ruleset defining which combinations of functions create segregation of duties risk. It supports both user-level analysis of existing access and simulation of a new request before it's approved, and its output feeds directly into ARM's approval workflow when a conflict needs risk owner review.

## 30 Second Interview Answer

ARA is the segregation of duties engine in GRC. It compares a user's access, or a proposed request, against a ruleset that defines risky combinations of functions — like someone who can both create a vendor and approve a payment to that vendor. If a conflict is found, that result feeds into the approval workflow, usually requiring a risk owner to review and either approve with a mitigating control or reject the request.

## 60 Second Interview Answer

ARA, Access Risk Analysis, checks whether a user's access — existing or proposed — creates a segregation of duties conflict. It works against a ruleset, which is a maintained set of rules defining risky combinations, classically things like the ability to both create a vendor master record and post a payment to that vendor.

ARA runs in two main modes. User-level analysis looks at existing access across the organization, which is what periodic access reviews and audits typically use. Simulation runs during a new access request in ARM, checking what would happen if the request were approved, before it actually is. That's what lets GRC flag a conflict at the point of request instead of discovering it during the next audit cycle.

The output of a conflict isn't automatically a rejection — it's a data point that usually routes the request to a risk owner, who decides whether to approve with a documented mitigating control or reject the request and adjust scope instead.

## 90 Second Interview Answer

Access Risk Analysis is the segregation of duties engine underneath GRC Access Control. Its core job is comparing a user's access — either what they already have, or what they're requesting — against a ruleset that defines combinations of functions considered risky when held by the same person. The textbook example is a user who can both create a vendor master record and post a payment, which creates the opportunity for fraud that segregation of duties is designed to prevent.

ARA operates in two distinct modes that matter for different purposes. User-level analysis evaluates existing access across the user population, which is the mode used for periodic access reviews, audit preparation, and ongoing compliance monitoring — it answers "who currently has a conflict." Simulation mode runs during the ARM request process itself, evaluating what a user's access would look like if a pending request were approved, before it actually is — it answers "would approving this create a conflict." That distinction matters because it's the difference between catching a risk proactively at the point of request versus discovering it after the fact during an audit.

When ARA identifies a conflict, that's not automatically a rejection — it's a risk signal that typically routes into the approval workflow, most commonly triggering an additional MSMP stage requiring a risk owner to review the specific conflict. The risk owner then makes a documented decision: approve with a mitigating control that compensates for the risk through a different means, like a compensating review process, or reject the request and push back on scope.

The part that determines whether ARA actually catches real risk is ruleset quality. A ruleset built once and never updated will miss new conflicts as business processes evolve, and it'll keep flagging conflicts that no longer reflect how the business actually operates. Ruleset maintenance is a continuous responsibility, not a one-time configuration task, and it's usually the difference between ARA being a genuinely effective control versus generating noise that risk owners start rubber-stamping through.

## Architecture

- Ruleset: the maintained definition of risky function combinations
- Function: a business activity, like "create vendor" or "post payment," that rules are built from
- Risk: a defined combination of two or more functions considered conflicting
- User-level analysis: evaluates existing access across the organization
- Simulation: evaluates a proposed request before approval
- Mitigation: a documented compensating control applied when a conflict can't be avoided

## Runtime Flow

For user-level analysis, ARA evaluates each user's current role assignments against every rule in the ruleset, flagging any combination of functions the user has access to that matches a defined risk. For simulation, ARA takes the requested access from an in-flight ARM request, combines it conceptually with the user's existing access, and evaluates that combined set against the ruleset before the request is approved. Flagged conflicts are attached to the request or the user's risk profile, and in the ARM context, typically trigger an additional approval stage for risk owner review.

## Configuration

- Maintain the ruleset to reflect actual business processes and organizational risk tolerance
- Define functions mapping to the authorization objects and values that represent each business activity
- Configure risk levels or categories to prioritize which conflicts require the most scrutiny
- Integrate simulation into the ARM request flow so conflicts are caught before approval, not after

## Implementation Activities

- Design the ruleset based on the organization's actual business processes and risk appetite
- Map functions to the specific authorization objects and values that represent them
- Run baseline user-level analysis to understand existing conflict exposure before go-live
- Integrate simulation into the access request process

## Migration Activities

- Validate ruleset accuracy against the migrated or upgraded system's authorization objects
- Re-run baseline analysis after a migration to catch any newly introduced conflicts
- Confirm function definitions still map correctly to authorization data in the target system

## Rollout Activities

- Extend the ruleset to cover new business processes introduced by the rollout entity
- Run baseline analysis for the new user population before go-live
- Validate that simulation correctly evaluates requests for the new business unit

## Production Support Activities

- Support risk owners reviewing flagged conflicts during the request process
- Maintain and update the ruleset as business processes change
- Run periodic user-level analysis for ongoing compliance monitoring and audit preparation

## Troubleshooting

Common issue: ARA isn't flagging a conflict that should exist.
Root cause: the ruleset doesn't have a rule covering that specific combination of functions, or the function definitions don't map to the correct authorization objects.
Resolution: review and update the ruleset and function definitions to accurately reflect the risk.

Common issue: ARA is flagging conflicts that don't reflect actual business risk.
Root cause: the ruleset is outdated or overly broad relative to current business processes.
Resolution: review and refine the ruleset with input from business process owners.

Common issue: simulation during a request doesn't match the result of a subsequent user-level analysis for the same user.
Root cause: simulation and user-level analysis may be evaluating against slightly different data timing or scope.
Resolution: review the analysis scope and timing configuration for consistency between the two modes.

## Common Interview Questions

1. What is Access Risk Analysis and what does it check?
2. What's the difference between user-level analysis and simulation?
3. What is a ruleset made of?
4. What's an example of a segregation of duties conflict?
5. What happens when ARA flags a conflict during a request?
6. How do you maintain the ruleset over time?
7. What's a mitigating control and when is it used?
8. How does ARA integrate with ARM?
9. What's the risk of an outdated ruleset?
10. How would you design a ruleset for a new business process?
11. What's the difference between a function and a risk in ARA?
12. How do you run baseline analysis before a go-live?
13. What's your process for reviewing a flagged conflict as a risk owner?
14. How do you handle ARA for a business process that spans multiple modules?
15. What's the audit value of periodic user-level analysis?
16. How do you validate ruleset accuracy?
17. What's the risk of a ruleset that's too broad?
18. How would you handle ARA during a rollout to a new business unit?
19. What's your approach to prioritizing which conflicts get the most scrutiny?
20. How do you troubleshoot ARA not flagging an expected conflict?

## Tough Follow-up Questions

1. If a ruleset was built five years ago and never updated, how would you approach modernizing it without disrupting current operations?
2. How would you validate that a mitigating control is actually reducing risk rather than just documenting it away?
3. What's your process for balancing ruleset thoroughness against the volume of conflicts it generates for risk owners to review?
4. How do you handle ARA for custom Z-transactions that don't have standard function mappings?
5. What's the risk of risk owners rubber-stamping conflicts because the volume is too high to review meaningfully?
6. How would you design a ruleset for an organization with highly decentralized business processes across regions?
7. What's your strategy for validating ARA results against real fraud risk, not just theoretical conflict combinations?
8. How do you handle a scenario where fixing one segregation of duties conflict creates another?
9. What's the risk of relying entirely on ARA simulation without periodic user-level analysis as a backstop?
10. How would you explain to an auditor why a specific conflict has a mitigating control instead of being eliminated?
11. What's your process for measuring whether ruleset changes actually improved risk coverage?
12. How do you handle ARA governance across a landscape with multiple connected systems and rulesets?
13. What's the risk of function definitions drifting out of sync with actual authorization object usage over time?
14. How would you prioritize ruleset maintenance work when there are limited resources and many potential rule gaps?
15. What's your approach to explaining ARA results to business stakeholders who don't understand SoD concepts?
16. How do you handle ARA when the same conflict appears across many users due to a systemic role design issue?
17. What's your strategy for validating that mitigating controls are actually being executed, not just documented?
18. How would you handle disagreement between a risk owner and a business owner about whether a conflict is acceptable?
19. What's the risk of ARA becoming purely a compliance exercise disconnected from actual fraud prevention?
20. How do you handle ruleset versioning when different business units need different risk tolerances?

## SAP Transactions

NWBC, GRAC_SPM, GRACRULEMNT

## SAP Tables

GRACRULE, GRACFUNCTION, GRACRISK, GRACMITCTRL

## Best Practices

- Keep the ruleset synchronized with actual, current business processes
- Involve business process owners in ruleset design, not just security
- Run simulation during requests to catch conflicts before approval, not just after
- Treat mitigating controls as genuine compensating processes, not paperwork
- Run periodic user-level analysis as an ongoing control, not just before an audit

## Common Mistakes

- Letting the ruleset go stale while business processes evolve
- Building a ruleset so broad that risk owners stop reviewing conflicts meaningfully
- Treating mitigating controls as a way to close a finding rather than actually manage risk
- Only running analysis before an audit instead of continuously
- Designing rulesets without input from the business process owners who understand actual risk

## Interviewer's Hidden Expectations

Interviewers want to hear that you understand ARA as a decision-support tool tied to real business risk, not just a compliance report generator. They're listening for whether you understand the difference between simulation and user-level analysis, and whether you've actually had to make or support a mitigation decision.

## What Makes This a 10/10 Answer

An average answer says ARA checks for segregation of duties conflicts. A 10/10 answer explains the distinction between simulation and user-level analysis, walks through what happens when a conflict is flagged, and connects ruleset quality directly to whether ARA catches real risk or just generates noise.

## Red Flags

- Not knowing the difference between simulation and user-level analysis
- Describing ARA as automatically blocking access rather than flagging risk for review
- No mention of ruleset maintenance as an ongoing responsibility
- Treating mitigating controls as a way to make a finding disappear
- No awareness of the connection between ARA and ARM's approval workflow

## Keywords

Access Risk Analysis, ARA, segregation of duties, SoD, ruleset, function, risk, mitigation, simulation, user-level analysis

## Related Topics

- arm.md
- risk-analysis.md
- mitigation.md
- rulesets.md
