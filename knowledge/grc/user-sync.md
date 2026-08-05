# User Sync

## Overview

User Sync pulls user master record data — the existence and attributes of users themselves, like name, department, or employment status — from a target system into GRC. It's distinct from Authorization Sync, which pulls what access those users hold; User Sync is about the users as entities, not their access.

## Interview Summary

User Sync populates GRC with basic user master data — who exists, their org attributes, employment status — which ARM's request forms use to identify requesters and target users, and which reporting uses for filtering and organizing access data by department or location. A user who's been terminated but not yet synced as inactive can still appear as an active user in GRC.

## 30 Second Interview Answer

User Sync pulls user master data — the existence of users and their attributes like name, department, or employment status — into GRC. It's different from Authorization Sync, which is about what access a user has; User Sync is about the user as an entity. This is what powers user search in ARM request forms and what lets reporting filter by department or location correctly.

## 60 Second Interview Answer

User Sync populates GRC's picture of who the users actually are — not their access, which is Authorization Sync's job, but their basic identity attributes: name, user ID, department, cost center, employment status, and similar master data pulled from the target system's user records.

This underpins a few things people don't always connect back to sync. ARM's request forms need to let requesters search for and select users, and that search works against synced user master data. Reporting and analytics that segment access by department or location depend on accurate, current user attribute data. And critically, employment status — active versus terminated — matters for compliance, because a terminated employee who hasn't yet synced as inactive in GRC can still show up as a valid, active user in request forms and reports, well after they've actually left.

Like the other sync types, this runs as a scheduled job, and termination status specifically is often the highest-priority data point to keep current, since the compliance and security risk of a stale "active" status on a terminated user is more serious than most other user attribute staleness.

## 90 Second Interview Answer

User Sync is the background job that keeps GRC's picture of user identity itself current — as distinct from Repository Sync, which handles role definitions, and Authorization Sync, which handles what access users hold. User Sync pulls user master record attributes: name, user ID, department or cost center, location, and critically, employment status.

The most visible everyday impact is on ARM's request form usability — when a requester searches for a user to request access for, or a manager searches for their direct reports, that search works against User Sync's synced data. Reporting and access analytics that need to segment by department, location, or organizational unit also depend on this data being accurate and current.

The higher-stakes dependency is employment status. A terminated employee whose termination hasn't yet been reflected through User Sync can still appear as an active, requestable user in GRC — meaning someone could theoretically still submit an access request naming them, or their existing access could still show as belonging to an "active" user in a periodic access review, when in reality they should have been fully deprovisioned already. This is exactly the kind of gap auditors specifically look for, and it's why User Sync frequency, and specifically the timeliness of termination status propagation, deserves more attention than routine attribute fields like department name that change far less consequentially.

The best-designed implementations don't rely purely on a scheduled sync cadence for termination status specifically — they integrate more tightly with HR systems or trigger event-based sync for terminations, precisely because the compliance cost of delay on that particular data point is higher than for User Sync's other attributes.

## Architecture

- User Sync job: the background process pulling user master attribute data
- User master attributes: name, user ID, department, location, employment status
- Distinction from Authorization Sync: user identity versus user access
- Employment status: the highest-priority attribute for compliance purposes
- HR integration: an alternative or supplement to scheduled sync for termination events

## Runtime Flow

On its configured schedule, User Sync connects through the target system's connector and pulls current user master data, updating GRC's local copy of user attributes. ARM request forms, reporting, and access reviews then reference this synced data for user search, filtering, and status display, rather than querying the target system live.

## Configuration

- Schedule User Sync at a frequency appropriate for how often user attributes change
- Prioritize timely propagation of employment status, potentially through event-based or HR-integrated triggers
- Scope which user attributes are synced based on what GRC processes actually need
- Monitor sync job execution actively

## Implementation Activities

- Configure and schedule User Sync for every connected target system
- Evaluate whether termination status needs event-based sync or HR integration beyond routine scheduling
- Validate synced user data accuracy against source system data
- Establish monitoring for sync job execution

## Migration Activities

- Re-run User Sync after a target system or HR system migration
- Validate user master data reflects the migrated system's actual current state
- Reassess termination status propagation timing requirements post-migration

## Rollout Activities

- Configure User Sync for new target systems and user populations introduced by the rollout
- Establish HR integration or event-based termination sync for the new entity if required
- Validate user search and reporting function correctly for the new population

## Production Support Activities

- Monitor sync execution and investigate failures
- Investigate and resolve compliance findings related to stale employment status
- Support urgent manual sync triggers for time-sensitive terminations

## Troubleshooting

Common issue: a terminated employee still appears as active in GRC.
Root cause: User Sync hasn't run since the termination, or termination status isn't being propagated in a timely way.
Resolution: trigger an immediate sync, and evaluate whether termination status needs event-based or HR-integrated sync going forward.

Common issue: a requester can't find a user in the ARM request form search.
Root cause: User Sync hasn't captured that user yet, often because they're newly created in the target system.
Resolution: trigger a sync or verify the new user was included in sync scope.

Common issue: reporting shows incorrect department or location groupings.
Root cause: stale user attribute data from an outdated sync.
Resolution: trigger a sync and validate attribute accuracy against the source system.

## Common Interview Questions

1. What is User Sync and how does it differ from Authorization Sync?
2. What user attributes does User Sync typically pull?
3. Why does employment status matter more than other User Sync attributes?
4. What happens if a terminated employee's status isn't synced timely?
5. How does User Sync support ARM's request form user search?
6. What's the audit risk of stale employment status?
7. How would you design termination status propagation beyond routine scheduled sync?
8. What's the relationship between User Sync and HR system integration?
9. How do you troubleshoot a user not appearing in request form search?
10. What's your process for validating User Sync data accuracy?
11. How do you decide the appropriate User Sync frequency?
12. What's the risk of relying purely on scheduled sync for termination events?
13. How does User Sync data feed into access review and reporting?
14. What's your approach to monitoring User Sync job execution?
15. How would you handle User Sync for a newly connected target system?
16. What's the compliance implication of a stale "active" status on a terminated user?
17. How do you coordinate User Sync with a broader deprovisioning process?
18. What's your process for auditing User Sync accuracy periodically?
19. How would you handle User Sync during a migration involving both SAP and HR system changes?
20. What's the difference in urgency between syncing employment status versus department attributes?

## Tough Follow-up Questions

1. If an audit finds terminated employees still showing as active due to sync delay, how would you address both the immediate finding and the systemic gap?
2. How would you design event-based termination sync integrated directly with HR systems rather than relying on scheduled batch sync?
3. What's your process for validating that User Sync captures employment status changes completely, not just eventually?
4. How do you handle User Sync for organizations without a clean, authoritative HR system feed?
5. What's the risk of User Sync attribute data conflicting with data from a separate HR integration?
6. How would you measure the actual gap between real-world termination and GRC reflecting that termination?
7. What's your strategy for prioritizing which user attributes need near-real-time sync versus routine batch sync?
8. How do you handle User Sync governance across a multi-system landscape with different HR sources per region?
9. What's the risk of User Sync being deprioritized as a low-importance technical detail rather than a compliance-critical process?
10. How would you build a control specifically to detect and alert on terminated-but-still-active user discrepancies?
11. What's your process for validating User Sync data quality as part of onboarding a new connected system?
12. How do you handle User Sync for contractors or temporary workers with different lifecycle patterns than employees?
13. What's the risk of User Sync frequency decisions being made once and never revisited as the organization scales?
14. How would you explain to an auditor the specific mechanism and timing guarantees behind termination status propagation?
15. What's your strategy for testing User Sync and termination propagation as part of a broader deprovisioning process audit?
16. How do you handle User Sync when the target system's user ID scheme doesn't map cleanly to GRC's expectations?
17. What's the risk of User Sync failures being masked by generally low user attribute change volume, making them hard to notice?
18. How would you design a reconciliation process comparing GRC's user data against an authoritative HR source periodically?
19. What's your approach to User Sync during a merger where two organizations have different user identity schemes?
20. How do you handle User Sync data retention and privacy considerations for terminated user records?

## SAP Transactions

GRAC_SPM, SM37, SU01

## SAP Tables

GRACUSER, USR02, USR21

## Best Practices

- Prioritize timely, ideally event-based, sync for employment status specifically
- Integrate with HR systems directly for termination events where feasible
- Monitor sync job execution and investigate failures promptly
- Validate user data accuracy periodically against the source system
- Coordinate User Sync timing with the broader deprovisioning process

## Common Mistakes

- Treating all user attributes as equally low-priority for sync timing
- Relying purely on scheduled batch sync for time-sensitive termination events
- Not monitoring for stale employment status as a compliance risk
- Confusing User Sync with Authorization Sync
- Not integrating User Sync with the organization's actual HR termination process

## Interviewer's Hidden Expectations

Interviewers want to hear that you understand employment status as the highest-stakes User Sync data point, and that you connect sync timing directly to real deprovisioning and audit risk, not just a generic data freshness concern.

## What Makes This a 10/10 Answer

An average answer says User Sync updates user data in GRC. A 10/10 answer distinguishes it clearly from Authorization Sync, explains why employment status deserves special handling, and connects sync delay directly to the real compliance risk of terminated employees appearing active.

## Red Flags

- Confusing User Sync with Authorization Sync
- Not flagging employment status as a priority data point
- No mention of the risk of terminated employees appearing active
- Treating all User Sync attributes as equally important
- No awareness of HR integration as an alternative to scheduled batch sync

## Keywords

User Sync, user master data, employment status, termination, HR integration, Authorization Sync distinction

## Related Topics

- authorization-sync.md
- repository-sync.md
- user-administration.md
