# Risk Analysis Process

## Overview

Running a risk analysis is one thing — acting on the results is where the real work happens. This covers the practical process: interpreting risk levels, deciding between remediation and mitigation, prioritizing which conflicts get fixed first, and reporting results to stakeholders who aren't security specialists. For how the ARA engine itself works, see ara.md.

## Interview Summary

Once ARA produces a list of conflicts, someone has to decide what to do about each one — remediate by changing the role or access, mitigate with a compensating control, or accept the risk with documented justification. Prioritization usually follows risk level, business criticality of the function involved, and how many users are affected.

## 30 Second Interview Answer

Running the analysis is the easy part — deciding what to do with the results is where the judgment is. For every flagged conflict you're choosing between three paths: remediate by actually removing or splitting the access, mitigate with a compensating control if remediation isn't feasible, or in rare cases accept the risk with documented business justification. Prioritization comes down to risk level and how many users and business processes are affected.

## 60 Second Interview Answer

A risk analysis result is just a starting point. For every flagged segregation of duties conflict, there's a decision to make: remediate, mitigate, or in limited cases, accept.

Remediation means actually fixing the access — removing the conflicting function from the role, splitting a role that's too broad, or redesigning the process so the same person doesn't hold both sides of the conflict. It's the strongest response because it eliminates the risk rather than compensating for it, but it's not always feasible immediately, especially in a small team where one person genuinely has to cover multiple functions.

When remediation isn't feasible, mitigation applies a compensating control — typically a review process where someone independent checks the affected transactions periodically. Mitigation has to be a real, executed control, not paperwork; an unmonitored mitigating control is functionally the same as having no control at all.

Prioritization across a large list of conflicts usually follows risk level first, then how business-critical the functions involved are, then how many users are affected by the same systemic issue versus a one-off case.

## 90 Second Interview Answer

Producing a risk analysis result is the mechanical part. The actual work is deciding what to do with every flagged conflict, and that decision generally falls into one of three categories: remediate, mitigate, or — in narrow, well-justified cases — accept.

Remediation is the strongest response because it eliminates the risk rather than compensating for it. That might mean removing the conflicting function from a role, splitting an overly broad role into two, or redesigning the underlying business process so the same person structurally can't hold both sides of a conflict. Remediation is always the preferred outcome, but it's not always immediately achievable — a small finance team, for example, might genuinely need one person covering both vendor creation and payment approval simply due to headcount.

When remediation isn't feasible in the short term, mitigation applies a compensating control instead — most commonly an independent review process where someone who doesn't hold the conflicting access periodically checks the affected transactions for irregularities. The critical detail interviewers listen for here is that a mitigating control only has value if it's actually executed and reviewed on schedule. A documented mitigating control that nobody actually performs is not a real control — it's a finding waiting to happen at the next audit, and auditors are specifically trained to test whether mitigations are operating, not just whether they're documented.

Acceptance is the rarest path, reserved for genuinely low-risk conflicts where the cost of remediation or mitigation clearly outweighs the actual exposure, and it needs explicit sign-off from someone with the authority to accept that risk on the organization's behalf, not a unilateral decision by whoever ran the analysis.

Across a large result set, prioritization typically follows risk level first — high-risk conflicts involving financially sensitive functions get attention before low-risk ones — then the business criticality of the specific process involved, then whether a conflict is a one-off individual case or a systemic pattern affecting many users, since systemic patterns usually point to a role design problem worth fixing at the source rather than remediating user by user.

## Architecture

- Remediation: eliminating the conflict by changing access or process
- Mitigation: applying a compensating control when remediation isn't feasible
- Acceptance: formally sign-off on a low-risk conflict rather than remediating or mitigating
- Prioritization criteria: risk level, business criticality, user population affected
- Reporting: translating analysis results into stakeholder-appropriate communication

## Runtime Flow

Risk analysis results feed into a review process where each conflict is triaged: is this remediable now, does it need a mitigating control, or is it low-risk enough to accept with sign-off. Remediation decisions typically route back into role design or a new access request adjusting scope. Mitigation decisions require documenting the compensating control and assigning an owner responsible for executing it on a defined schedule. All three paths need to be tracked so the next analysis cycle can verify the decision was actually implemented, not just decided.

## Configuration

- Define risk level thresholds that determine escalation and prioritization
- Establish the remediation-versus-mitigation decision criteria for the organization
- Configure mitigating control templates and review schedules
- Set up acceptance sign-off authority and documentation requirements

## Implementation Activities

- Run baseline risk analysis and triage results into remediation, mitigation, or acceptance
- Design mitigating control templates for common conflict scenarios
- Establish the review cadence for mitigating controls
- Build reporting appropriate for both technical and business stakeholders

## Migration Activities

- Re-run risk analysis after migration to confirm previously remediated conflicts didn't reappear
- Validate that mitigating controls carried forward correctly to the new environment
- Reassess whether migration introduced new systemic conflicts requiring fresh triage

## Rollout Activities

- Run baseline risk analysis for the new business unit before go-live
- Apply the organization's existing remediation and mitigation decision framework to new findings
- Establish mitigating control ownership for the new user population

## Production Support Activities

- Support risk owners triaging newly flagged conflicts
- Track mitigating control execution against the defined review schedule
- Report on risk analysis trends over time to compliance stakeholders

## Troubleshooting

Common issue: the same conflicts keep reappearing analysis cycle after cycle.
Root cause: conflicts are being mitigated instead of remediated when remediation was actually feasible, or role design changes aren't sticking.
Resolution: reassess whether remediation is genuinely infeasible, and if not, prioritize fixing the underlying access instead of repeatedly mitigating.

Common issue: an audit finds a mitigating control that was documented but never actually performed.
Root cause: no enforcement or tracking mechanism ensured the control was executed on schedule.
Resolution: implement tracking for mitigating control execution and hold owners accountable to the review schedule.

Common issue: risk owners are overwhelmed by the volume of flagged conflicts and start approving without real review.
Root cause: prioritization criteria aren't filtering effectively, or the ruleset is generating too much noise.
Resolution: refine prioritization criteria and ruleset accuracy to surface genuinely high-risk conflicts first.

## Common Interview Questions

1. What are the three main responses to a flagged segregation of duties conflict?
2. What's the difference between remediation and mitigation?
3. When would you accept a risk instead of remediating or mitigating it?
4. What makes a mitigating control effective versus just documentation?
5. How do you prioritize which conflicts to address first?
6. What's the risk of mitigating a conflict that could have been remediated?
7. How do you handle risk analysis reporting for non-technical stakeholders?
8. What's your process for tracking whether a mitigating control is actually executed?
9. How do you decide when a conflict represents a systemic issue versus a one-off?
10. What's the audit risk of an unmonitored mitigating control?
11. How would you triage a large batch of newly flagged conflicts?
12. What's the role of business process owners in remediation decisions?
13. How do you handle acceptance sign-off for a low-risk conflict?
14. What's your approach to measuring whether remediation efforts are actually working?
15. How do you handle risk analysis results that recur across every analysis cycle?
16. What's the difference between a one-off conflict and a systemic role design issue?
17. How would you design a mitigating control for a small team that can't fully segregate duties?
18. What's your process for re-validating that a remediated conflict stays fixed?
19. How do you communicate risk analysis trends to leadership?
20. What's the risk of prioritizing purely by risk level without considering business impact?

## Tough Follow-up Questions

1. If leadership pushes back on remediation because it disrupts a team's workflow, how do you balance business needs against risk?
2. How would you design a program to systematically reduce a large backlog of accepted risks?
3. What's your process for validating that a mitigating control is actually catching issues, not just being performed as a formality?
4. How do you handle risk analysis prioritization when every stakeholder believes their conflicts are the highest priority?
5. What's the risk of an organization defaulting to mitigation for everything because remediation is politically harder?
6. How would you measure the actual effectiveness of a mitigating control program over time?
7. What's your strategy for identifying systemic role design issues hidden within a large volume of individual conflicts?
8. How do you handle a scenario where the same person needs to hold conflicting access due to genuine organizational constraints?
9. What's the risk of acceptance decisions being made without proper authority or documentation?
10. How would you build a business case for investing in remediation versus continuing to mitigate?
11. What's your process for auditing whether previously accepted risks are still acceptable as the organization changes?
12. How do you handle disagreement between a risk owner and an auditor about whether a mitigating control is sufficient?
13. What's the risk of treating every conflict with the same triage process regardless of actual business impact?
14. How would you design risk analysis reporting that resonates with a board-level audience?
15. What's your approach to root-causing why certain conflict patterns keep recurring across multiple analysis cycles?
16. How do you handle risk analysis for a business process that's genuinely unique and doesn't fit standard remediation patterns?
17. What's the risk of relying on manual mitigating controls in an environment with high staff turnover?
18. How would you transition an organization from a mitigation-heavy posture to a remediation-first culture?
19. What's your strategy for validating remediation decisions didn't introduce new conflicts elsewhere?
20. How do you handle risk analysis governance when different business units have different risk tolerances?

## SAP Transactions

NWBC, GRAC_SPM, GRACMITCTRL

## SAP Tables

GRACRISK, GRACMITCTRL, GRACRULE

## Best Practices

- Default to remediation whenever it's genuinely feasible, reserving mitigation for real constraints
- Track and enforce mitigating control execution, not just documentation
- Prioritize by risk level, business criticality, and systemic pattern, not just volume
- Report results in language stakeholders outside security can actually act on
- Periodically reassess accepted risks as the organization changes

## Common Mistakes

- Defaulting to mitigation because it's politically easier than remediation
- Documenting mitigating controls that are never actually executed
- Treating every conflict with identical urgency regardless of business impact
- Not identifying when a batch of individual conflicts actually points to one systemic role design issue
- Letting accepted risks go unreviewed indefinitely

## Interviewer's Hidden Expectations

Interviewers want to hear that you understand risk analysis results as the start of a decision process, not the end of one. They're listening for whether you can articulate the real trade-offs between remediation and mitigation, and whether you understand that an unenforced mitigating control is effectively no control at all.

## What Makes This a 10/10 Answer

An average answer says you review flagged conflicts and decide what to do. A 10/10 answer explains the specific decision framework — remediate, mitigate, or accept — with the trade-offs of each, and flags the real-world risk of mitigating controls that exist on paper but aren't actually executed.

## Red Flags

- Treating mitigation as equivalent to remediation rather than a fallback
- No mention of tracking whether mitigating controls are actually performed
- Suggesting every conflict should be handled the same way regardless of risk level
- No awareness of acceptance as requiring formal authority and sign-off
- Not recognizing when individual conflicts point to a systemic role design problem

## Keywords

risk analysis, remediation, mitigation, acceptance, risk level, prioritization, mitigating control, systemic conflict

## Related Topics

- ara.md
- mitigation.md
- rulesets.md
