# Authorization Sync

## Overview

Authorization Sync pulls actual user-to-role and user-to-authorization assignment data from a target system into GRC, distinct from Repository Sync's role-definition sync. It's what lets ARA's user-level risk analysis reflect who actually has what access right now, not just what roles exist in the abstract.

## Interview Summary

While Repository Sync keeps GRC's copy of role definitions current, Authorization Sync keeps GRC's picture of who is actually assigned what current. User-level segregation of duties analysis, periodic access reviews, and audit reporting all depend on this data being fresh — a user whose access changed yesterday but whose sync hasn't run yet will show outdated access in GRC's view.

## 30 Second Interview Answer

Authorization Sync pulls actual user assignment data — who has which roles and authorizations right now — from the target system into GRC. It's different from Repository Sync, which syncs role definitions themselves. Authorization Sync is what user-level risk analysis and access reviews depend on being accurate, since it's the data source for "who currently has what."

## 60 Second Interview Answer

Authorization Sync and Repository Sync are often confused, but they sync different things. Repository Sync pulls role definitions — what a role contains. Authorization Sync pulls user assignment data — who's actually been assigned which roles and, by extension, which authorizations.

This distinction matters because ARA's user-level analysis, the mode used for periodic access reviews and audit preparation, evaluates against Authorization Sync data, not a live query of the target system. If a user's access changed in PFCG yesterday — a role added or removed directly — and Authorization Sync hasn't run since, GRC's view of that user's access is stale, and any risk analysis run against that stale data won't reflect the real current state.

Like Repository Sync, this runs as a scheduled background job, and the same trade-off applies: too infrequent and GRC's picture of user access drifts from reality, too frequent and it adds unnecessary load for a landscape where access doesn't change that often.

## 90 Second Interview Answer

Authorization Sync is frequently confused with Repository Sync because they sound similar and both run as background sync jobs, but they sync fundamentally different data. Repository Sync pulls role definitions — the menu and authorization content that makes up a role, independent of who's assigned to it. Authorization Sync pulls the assignment layer — specifically which users currently hold which roles and authorizations in the target system.

The practical consequence of this distinction shows up most clearly in user-level risk analysis. When ARA runs analysis in user-level mode — the mode used for periodic access reviews, audit preparation, and general compliance monitoring — it's evaluating against GRC's synced picture of user assignments, not querying the target system live for every single analysis run. If a user's access changed directly in the target system — a role removed by an administrator outside the normal GRC-governed process, for instance — and Authorization Sync hasn't run since that change, GRC's risk analysis is working from outdated assignment data and won't reflect the user's actual current access.

This becomes a real audit concern specifically because it undermines the credibility of periodic access reviews. If a reviewer certifies a user's access based on GRC data that's several sync cycles behind reality, that certification isn't actually validating current access — it's validating a snapshot that may no longer be accurate. Organizations that take this seriously schedule Authorization Sync frequently enough that the gap between reality and GRC's view stays within an acceptable tolerance for their compliance requirements, and they treat sync recency as a data point worth checking before trusting a risk analysis or access review result, not an assumed given.

## Architecture

- Authorization Sync job: the background process pulling user assignment data
- User-role assignment data: which users hold which roles in the target system
- GRC's assignment repository: the local copy Authorization Sync updates
- Distinction from Repository Sync: role definitions versus user assignments
- User-level risk analysis dependency: ARA's audit-facing analysis mode relies on this data

## Runtime Flow

On its configured schedule, Authorization Sync connects through the target system's connector and pulls current user-to-role assignment data, updating GRC's local copy. User-level risk analysis, periodic access reviews, and audit reporting queries then evaluate against this synced data rather than querying the target system directly for each request.

## Configuration

- Schedule Authorization Sync at a frequency appropriate to how often user access actually changes
- Scope which systems and user populations are included in sync
- Monitor sync job success and failure actively
- Coordinate sync timing with periodic access review and audit reporting cycles

## Implementation Activities

- Configure and schedule Authorization Sync for every connected target system
- Validate synced assignment data accuracy against live target system data
- Establish monitoring for sync job execution
- Align sync scheduling with compliance reporting deadlines and review cycles

## Migration Activities

- Re-run Authorization Sync after a target system migration to capture the migrated user population's access accurately
- Validate assignment data reflects the migrated system's actual current state
- Adjust scheduling if migration changes user access change frequency

## Rollout Activities

- Configure Authorization Sync for new target systems introduced by the rollout
- Run an initial full sync before go-live to establish an accurate baseline
- Establish ongoing sync scheduling for the new population

## Production Support Activities

- Monitor sync execution and investigate failures
- Troubleshoot discrepancies between GRC's assignment data and live target system access
- Support urgent manual sync triggers before critical audit or review activities

## Troubleshooting

Common issue: a user's access review shows access they no longer have.
Root cause: Authorization Sync hasn't run since the access was removed.
Resolution: trigger a sync and re-verify the review data before finalizing certification.

Common issue: user-level risk analysis doesn't reflect a recent direct access change made outside GRC.
Root cause: stale Authorization Sync data.
Resolution: trigger a sync and re-run the analysis; investigate why access was changed outside the governed process.

Common issue: audit reporting numbers don't match what's actually configured in the target system.
Root cause: the report was generated from Authorization Sync data that was stale at the time.
Resolution: verify sync recency before generating compliance reports, and re-sync if needed.

## Common Interview Questions

1. What's the difference between Authorization Sync and Repository Sync?
2. What data does Authorization Sync pull from the target system?
3. Why does user-level risk analysis depend on Authorization Sync?
4. What happens if a user's direct access change isn't reflected yet?
5. How do you decide the appropriate Authorization Sync frequency?
6. What's the audit risk of stale assignment data during a review?
7. How would you troubleshoot a discrepancy between GRC and live access data?
8. What's the relationship between Authorization Sync and periodic access reviews?
9. How do you monitor Authorization Sync job success?
10. What's the impact of direct access changes made outside GRC's governed process?
11. How would you handle Authorization Sync scheduling around audit deadlines?
12. What's your process for validating sync data accuracy?
13. How do you handle Authorization Sync for a newly connected system?
14. What's the risk of a silently failed Authorization Sync job?
15. How does Authorization Sync data feed into compliance reporting?
16. What's your approach to explaining sync recency limitations to auditors?
17. How would you detect that a certification was based on stale data?
18. What's the operational trade-off in Authorization Sync frequency?
19. How do you handle urgent sync needs before a critical review?
20. What's your process for auditing Authorization Sync accuracy periodically?

## Tough Follow-up Questions

1. If an access certification turns out to have been based on stale Authorization Sync data, how would you handle the compliance implications?
2. How would you design monitoring to flag when Authorization Sync data is too stale to trust for an upcoming review?
3. What's your process for reconciling GRC's assignment data against live target system data at scale?
4. How do you handle Authorization Sync for systems where access changes happen extremely frequently?
5. What's the risk of direct, out-of-process access changes undermining the value of Authorization Sync entirely?
6. How would you build a control to detect and flag access changes made outside GRC's governed provisioning process?
7. What's your strategy for balancing Authorization Sync frequency against system performance impact at scale?
8. How do you handle Authorization Sync data freshness requirements that differ between business units with different compliance obligations?
9. What's the risk of treating Authorization Sync as equivalent to real-time data when generating audit evidence?
10. How would you explain to an auditor the acceptable staleness tolerance for Authorization Sync data and why it's defensible?
11. What's your process for validating Authorization Sync captured a complex, multi-role user assignment change completely?
12. How do you handle Authorization Sync governance across a landscape with dozens of connected systems and different sync needs?
13. What's the risk of Authorization Sync jobs competing for system resources during peak business hours?
14. How would you design a pre-review checklist that includes verifying sync recency before certification begins?
15. What's your strategy for historical trending of user access using Authorization Sync data over time?
16. How do you handle Authorization Sync when a target system's user identifiers don't map cleanly to GRC's expectations?
17. What's the risk of Authorization Sync failures going undetected for extended periods in a low-change environment?
18. How would you validate Authorization Sync data quality as part of onboarding a new connected system?
19. What's your approach to communicating Authorization Sync limitations transparently in audit documentation?
20. How do you handle a scenario where Authorization Sync and Repository Sync data become inconsistent with each other?

## SAP Transactions

GRAC_SPM, SM37, SM59

## SAP Tables

GRACUSER, GRACUSERROLE, GRACCONNECTOR

## Best Practices

- Schedule Authorization Sync frequently enough to keep pace with actual access change velocity
- Verify sync recency before relying on data for certification or audit reporting
- Monitor sync job execution actively, not passively
- Investigate direct, out-of-process access changes that Authorization Sync reveals
- Coordinate sync scheduling with compliance reporting and review cycles

## Common Mistakes

- Confusing Authorization Sync with Repository Sync
- Trusting access review data without verifying sync recency first
- Not monitoring for silently failed sync jobs
- Ignoring discrepancies between synced data and live access as noise
- Scheduling sync without considering compliance reporting deadlines

## Interviewer's Hidden Expectations

Interviewers want to hear that you clearly understand the distinction between Authorization Sync and Repository Sync, and that you recognize the direct audit and compliance implications of stale assignment data — not just a technical sync mechanism in isolation.

## What Makes This a 10/10 Answer

An average answer says Authorization Sync updates user access data. A 10/10 answer clearly distinguishes it from Repository Sync, explains why user-level risk analysis and access reviews depend on its recency, and flags the real compliance risk of certifying access based on stale data.

## Red Flags

- Confusing Authorization Sync with Repository Sync
- Not connecting sync staleness to audit and certification risk
- No mention of monitoring sync job execution
- Treating synced data as equivalent to real-time live data
- No awareness of the risk from direct, out-of-process access changes

## Keywords

Authorization Sync, user assignment data, user-level risk analysis, access review, sync schedule, compliance reporting

## Related Topics

- repository-sync.md
- ara.md
- user-sync.md
