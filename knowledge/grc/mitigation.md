# Mitigating Controls

## Overview

A mitigating control is a compensating process applied when a segregation of duties conflict can't be remediated by removing access. In GRC it's a formal object — a defined control, assigned to a monitor, linked to specific risks and users — not just an informal agreement that someone will "keep an eye on it."

## Interview Summary

When remediation isn't feasible, a mitigating control compensates for the risk, typically through an independent review of the affected transactions on a defined schedule. GRC tracks mitigating controls as formal objects with an assigned monitor and approval, and the control only has real value if it's actually performed, not just documented.

## 30 Second Interview Answer

A mitigating control is what you apply when you can't remove a segregation of duties conflict by changing access. It's a compensating process, usually an independent review of the affected transactions on a schedule, assigned to someone other than the person with the conflicting access. In GRC it's a formal object with an owner and an approval, not an informal understanding — and it only actually reduces risk if it's performed, not just documented.

## 60 Second Interview Answer

A mitigating control compensates for a segregation of duties conflict that can't be remediated directly. If someone genuinely needs both conflicting functions — often due to team size — you apply a control that catches misuse after the fact instead of preventing it upfront.

In GRC, this is a formal object: you define the control, describe what monitoring activity it involves, assign a monitor who's independent of the conflicting access, and link it to the specific risk and user it's compensating for. The control needs formal approval, typically from the risk owner, before it's considered active.

The detail that separates a real mitigating control from a paperwork exercise is execution. The control has to actually be performed on its defined schedule — the monitor reviewing transaction logs, checking for irregularities, and documenting the review. A mitigating control that's approved and then never actually executed provides zero risk reduction, even though on paper the conflict looks addressed.

## 90 Second Interview Answer

A mitigating control is the formal, compensating response to a segregation of duties conflict that can't be eliminated by remediation. The classic scenario is a small team where headcount genuinely requires the same person to hold both sides of a conflict — someone who both creates vendor records and processes payments, for example, because there's no one else to split the function to.

In GRC, a mitigating control isn't an informal agreement — it's a defined object with several required components: a description of the monitoring activity itself, a designated monitor who is explicitly independent of the conflicting access being compensated for, a link to the specific risk and user or role it applies to, and a formal approval, typically from the risk owner, before the control is considered active and the conflict is treated as addressed.

The component that actually determines whether a mitigating control does anything is execution. The control has to be performed on its defined schedule — commonly the monitor reviewing a report of the transactions the conflicting access could have misused, checking for anything irregular, and formally documenting that the review happened. This is where a lot of mitigating control programs quietly fail: the control gets approved, appears in the system as active, and satisfies the letter of a compliance requirement, but the actual review activity never happens or happens inconsistently. From a risk perspective, that's functionally identical to having no control at all, even though the paperwork says otherwise.

This is also exactly what auditors specifically test for — not whether a mitigating control exists on paper, but whether there's evidence it was actually performed on schedule. An organization with well-designed mitigating controls but no execution discipline will still generate audit findings, because the control's existence was never the point; its operation was.

## Architecture

- Control definition: describes the monitoring activity being performed
- Monitor: the person assigned to execute the control, independent of the conflicting access
- Risk and user link: ties the control to the specific conflict and user or role it compensates for
- Approval: formal sign-off, typically by the risk owner, activating the control
- Execution record: documented evidence the control was actually performed on schedule

## Runtime Flow

When ARA flags a conflict that can't be remediated, a mitigating control is proposed, typically as part of the ARM approval flow when a risk owner reviews the flagged conflict. The risk owner approves the control, formally linking it to the user and risk. From that point, the control's execution is a recurring operational activity — the assigned monitor performs the defined review on schedule and records evidence of that execution. Periodic risk analysis continues to flag the underlying conflict as existing, but with the active, approved mitigating control attached, showing it as a managed risk rather than an unaddressed one.

## Configuration

- Define mitigating control templates for common, recurring conflict scenarios
- Assign monitors who are genuinely independent of the access being compensated for
- Configure the review schedule and required documentation for each control
- Route mitigating control approval through the appropriate risk owner

## Implementation Activities

- Design mitigating control templates based on common conflict patterns identified in baseline analysis
- Assign monitors and establish review schedules for each control
- Build the approval workflow linking risk owner sign-off to control activation
- Establish a tracking mechanism to confirm controls are executed on schedule

## Migration Activities

- Validate mitigating control assignments and approvals carried over correctly after a migration
- Reconfirm monitor assignments are still valid and independent after any organizational change
- Re-link controls to risks and users if the underlying system or role structure changed

## Rollout Activities

- Establish mitigating control templates and monitor assignments for the new business unit
- Validate that monitors assigned in the new entity are genuinely independent of conflicting access
- Extend the execution tracking mechanism to the new population

## Production Support Activities

- Track and follow up on mitigating controls that are overdue for execution
- Support risk owners approving new mitigating controls as conflicts are identified
- Investigate audit findings related to control execution gaps

## Troubleshooting

Common issue: an audit finds a mitigating control that was approved but never executed.
Root cause: no tracking or accountability mechanism ensured the monitor actually performed the review.
Resolution: implement execution tracking with follow-up escalation for overdue reviews, and retroactively assess the exposure during the gap.

Common issue: the assigned monitor isn't actually independent of the conflicting access.
Root cause: the monitor assignment wasn't validated against the access it's meant to be compensating for.
Resolution: reassign the control to a genuinely independent monitor and reapprove.

Common issue: the same conflict has multiple overlapping mitigating controls from different projects.
Root cause: lack of coordination in mitigating control design across teams or time.
Resolution: consolidate into a single, clearly owned control and retire the redundant ones.

## Common Interview Questions

1. What is a mitigating control and when is it used?
2. What components make up a mitigating control in GRC?
3. Why does the monitor need to be independent of the conflicting access?
4. What happens if a mitigating control is approved but never executed?
5. How do you track whether a mitigating control was actually performed?
6. What's the difference between a mitigating control and remediation?
7. Who typically approves a mitigating control?
8. What's the audit risk of an unmonitored mitigating control?
9. How would you design a mitigating control for a small team with limited headcount?
10. What's your process for reviewing whether existing mitigating controls are still appropriate?
11. How do you handle a scenario where the assigned monitor leaves the organization?
12. What's the relationship between mitigating controls and risk owners?
13. How would you build execution tracking for mitigating controls?
14. What's the risk of too many mitigating controls instead of fixing root causes?
15. How do you handle mitigating control design for a systemic conflict affecting many users?
16. What's your approach to auditing mitigating control effectiveness?
17. How do you decide the appropriate review frequency for a control?
18. What's the risk of a mitigating control template that's too generic?
19. How would you handle overlapping mitigating controls from different projects?
20. What's your process for retiring a mitigating control once a conflict is remediated?

## Tough Follow-up Questions

1. If an audit finds dozens of unexecuted mitigating controls, how would you triage and remediate the finding?
2. How would you design an automated mechanism to detect mitigating controls that are overdue for execution?
3. What's your process for validating that a mitigating control's monitor is genuinely independent, not just nominally assigned?
4. How do you handle mitigating controls for conflicts that span multiple systems with different access models?
5. What's the risk of relying on a mitigating control indefinitely instead of pursuing remediation as team size grows?
6. How would you measure whether a mitigating control program is actually reducing fraud risk, not just satisfying compliance?
7. What's your strategy for consolidating mitigating controls that have proliferated across an organization without central oversight?
8. How do you handle a scenario where the person meant to review a mitigating control's evidence doesn't have the expertise to spot irregularities?
9. What's the risk of mitigating control review evidence being falsified or performed superficially?
10. How would you design mitigating controls for a fully automated business process with no natural human review point?
11. What's your process for reassessing mitigating controls after a significant organizational restructuring?
12. How do you handle disagreement between an auditor and a risk owner about whether a mitigating control is sufficient?
13. What's the risk of mitigating control fatigue, where monitors have too many controls to meaningfully review any of them?
14. How would you build a business case for reducing reliance on mitigating controls through remediation investment?
15. What's your approach to mitigating control design when the conflicting functions cross organizational boundaries?
16. How do you handle mitigating controls that were designed for a business process that has since changed significantly?
17. What's the risk of treating mitigating control approval as the end of the risk management process rather than the start of ongoing execution?
18. How would you validate that mitigating control execution evidence actually demonstrates a meaningful review occurred?
19. What's your strategy for training new monitors on how to perform an effective mitigating control review?
20. How do you handle mitigating controls in a merger scenario where two organizations have incompatible control frameworks?

## SAP Transactions

NWBC, GRACMITCTRL, GRAC_SPM

## SAP Tables

GRACMITCTRL, GRACMITASSGN, GRACRISK

## Best Practices

- Assign monitors who are genuinely independent of the conflicting access
- Track and enforce execution, not just approval and documentation
- Design mitigating controls specific enough to be meaningful, not generic boilerplate
- Periodically reassess whether remediation has become feasible instead of indefinitely relying on mitigation
- Consolidate overlapping mitigating controls rather than letting them proliferate

## Common Mistakes

- Approving a mitigating control and never verifying it's actually executed
- Assigning a monitor who isn't truly independent of the access being compensated for
- Treating mitigating controls as a permanent solution instead of a bridge to remediation
- Letting mitigating controls accumulate without periodic review or consolidation
- Designing controls too generically to catch actual irregularities

## Interviewer's Hidden Expectations

Interviewers want to hear that you understand execution, not approval, is what makes a mitigating control real. They're listening for whether you've dealt with the practical challenge of tracking control execution and whether you understand why auditors specifically test for evidence of performance, not just documentation.

## What Makes This a 10/10 Answer

An average answer describes a mitigating control as a compensating review process. A 10/10 answer explains the formal components GRC requires, why monitor independence matters, and states clearly that an unexecuted mitigating control provides zero actual risk reduction regardless of its approval status.

## Red Flags

- Describing a mitigating control as sufficient just because it's documented and approved
- Not mentioning the need for the monitor to be independent of the conflicting access
- No awareness of execution tracking as a real operational challenge
- Treating mitigating controls as a permanent substitute for remediation
- No mention of what auditors actually test for regarding mitigating controls

## Keywords

mitigating control, monitor, risk owner, execution, compensating control, segregation of duties, remediation, audit evidence

## Related Topics

- ara.md
- risk-analysis.md
- rulesets.md
