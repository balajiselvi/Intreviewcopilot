# Repository Sync

## Overview

Repository Sync pulls role definitions from a connected target system into GRC's own repository, so ARM's request forms show accurate, current role information and ARA's risk analysis evaluates against roles that actually exist as configured. Without it, GRC's view of "what roles exist" drifts from reality.

## Interview Summary

Repository Sync is a background job that reads role data — menus, descriptions, authorization content — from a target system through its connector and updates GRC's local repository copy. It needs to run regularly, because a role redesigned in PFCG without a corresponding sync means GRC is still working from an outdated picture of that role.

## 30 Second Interview Answer

Repository Sync pulls role information from a target system into GRC's own repository — role names, descriptions, what authorization content each role actually carries. It runs as a background job, and it needs to run regularly, because if a role gets redesigned in PFCG and Repository Sync doesn't run afterward, GRC is still working from the old version of that role when it processes requests or runs risk analysis.

## 60 Second Interview Answer

Repository Sync is the background job that keeps GRC's internal picture of a target system's roles current. It connects through the target system's connector and pulls role data — the menu content, descriptions, and the authorization objects and values each role carries — into GRC's own repository.

This matters because ARM's request forms show users a list of available roles to request, and that list is only as accurate as the last sync. If a new role was built in PFCG but Repository Sync hasn't run since, that role won't show up as requestable in GRC yet. More seriously, ARA's risk analysis evaluates against GRC's repository copy of roles, not the live PFCG data directly — so if a role's authorization content changed and sync hasn't caught up, risk analysis results for that role are working from stale data and could miss a newly introduced conflict or flag a conflict that's already been resolved.

Sync frequency is a real operational decision — too infrequent and GRC drifts from reality, too frequent and it adds unnecessary load, so most implementations schedule it to run at a cadence that matches how often role changes actually happen in that landscape.

## 90 Second Interview Answer

Repository Sync is the mechanism that keeps GRC's internal repository of target system roles aligned with what actually exists in PFCG. It runs as a background job, using the target system's connector to pull role data — menu content, descriptions, and critically, the full authorization object and field value content each role carries — into GRC's own local copy.

The reason this matters goes beyond just having an accurate role picker in the ARM request form, although that's the most visible symptom when sync is stale. The deeper dependency is on ARA. Risk analysis doesn't query the live target system in real time for every evaluation — it works against GRC's repository copy of role authorization content. If a role was redesigned in PFCG — say, a new authorization object added that creates a segregation of duties conflict — and Repository Sync hasn't run since that change, ARA's risk analysis for that role is evaluating against the old, pre-change version. That means a genuinely new risk could go completely undetected until the next sync catches up, which is a meaningfully different and more serious problem than just an outdated dropdown list.

Sync frequency is a real design decision, not a default to leave untouched. Organizations with frequent role design activity — during an active project, for example — often need more frequent sync than a stable, mature landscape where roles change rarely. Scheduling sync too infrequently creates a real risk analysis accuracy gap; scheduling it too aggressively adds unnecessary system load for marginal benefit in a landscape where roles genuinely don't change often.

The operational failure mode worth knowing is that Repository Sync failures are often just as silent as connector failures generally — if a scheduled sync job fails to run or errors out partway through, nothing necessarily alerts anyone, and the repository just continues quietly drifting from reality until someone notices a request form showing a role that no longer exists, or a risk analysis result that doesn't match what's actually configured in the target system.

## Architecture

- Repository Sync job: the background process pulling role data from the target system
- Target system role data: menu content, descriptions, authorization objects and values
- GRC repository: the local copy that ARM and ARA actually work against
- Sync schedule: the configured frequency at which sync runs
- Connector dependency: repository sync relies on the same connector infrastructure as provisioning

## Runtime Flow

On its configured schedule, or when manually triggered, Repository Sync connects to the target system through the configured connector and pulls current role data — menu, description, and authorization content — for all roles in scope. That data updates GRC's local repository. Subsequent ARM request form displays and ARA risk analysis evaluations work against this updated repository data rather than querying the target system directly each time.

## Configuration

- Schedule Repository Sync at a frequency appropriate to the landscape's actual role change velocity
- Scope which roles or role types are included in the sync
- Monitor sync job success and failure, not just assume it's running
- Coordinate sync scheduling with major role design or upgrade activities

## Implementation Activities

- Configure and schedule Repository Sync for every connected target system
- Validate sync accuracy by comparing repository content against live PFCG data
- Establish monitoring for sync job success and failure
- Document the sync schedule and its rationale for future reference

## Migration Activities

- Re-run Repository Sync immediately after a target system migration or upgrade
- Validate synced role data reflects the migrated system's actual current state
- Adjust sync scheduling if the migration changed role change frequency expectations

## Rollout Activities

- Configure Repository Sync for new target systems introduced by the rollout
- Run an initial full sync before go-live to populate the repository accurately
- Establish ongoing sync scheduling for the new system

## Production Support Activities

- Monitor sync job execution and investigate failures
- Troubleshoot discrepancies between GRC's repository and live target system role data
- Support ad hoc manual sync triggers when urgent role changes need to be reflected immediately

## Troubleshooting

Common issue: a newly created role doesn't appear as requestable in ARM.
Root cause: Repository Sync hasn't run since the role was created.
Resolution: trigger a manual sync or wait for the next scheduled run, and verify the role then appears.

Common issue: risk analysis doesn't reflect a recent role authorization change.
Root cause: the repository is working from stale data because sync hasn't caught up with the change.
Resolution: trigger a sync and re-run the risk analysis.

Common issue: a scheduled sync job silently stopped running.
Root cause: no monitoring was in place to detect job failure.
Resolution: implement sync job monitoring and alerting, and manually trigger a catch-up sync.

## Common Interview Questions

1. What is Repository Sync and what does it do?
2. What data does Repository Sync pull from the target system?
3. Why does ARA's risk analysis depend on Repository Sync?
4. What happens if a new role isn't showing up in ARM's request form?
5. How do you decide the appropriate sync frequency?
6. What's the risk of a stale repository for risk analysis accuracy?
7. How would you troubleshoot a repository that's out of sync with PFCG?
8. What's the relationship between Repository Sync and connectors?
9. How do you monitor whether sync jobs are running successfully?
10. What's the impact of sync frequency being too infrequent versus too frequent?
11. How would you handle an urgent role change that needs immediate reflection in GRC?
12. What's your process for validating repository accuracy against live data?
13. How do you handle Repository Sync for a newly connected target system?
14. What's the risk of a silently failed sync job?
15. How does Repository Sync relate to the broader GRC integration architecture?
16. What's your approach to scheduling sync during an active role redesign project?
17. How would you detect that risk analysis results are based on stale repository data?
18. What's the operational cost consideration of running sync too frequently?
19. How do you validate Repository Sync completed successfully after a migration?
20. What's your process for auditing repository accuracy periodically?

## Tough Follow-up Questions

1. If risk analysis missed a real conflict because of stale repository data, how would you investigate and communicate the gap?
2. How would you design monitoring to catch Repository Sync failures before they cause a real risk analysis accuracy problem?
3. What's your process for validating repository accuracy at scale across dozens of connected systems?
4. How do you handle sync scheduling trade-offs for a landscape with highly variable role change activity?
5. What's the risk of relying entirely on scheduled sync without any manual trigger capability for urgent changes?
6. How would you audit historical risk analysis results to identify any that were based on stale repository data?
7. What's your strategy for Repository Sync governance across a program with multiple parallel role design projects?
8. How do you handle Repository Sync performance when the target system has an extremely large role catalog?
9. What's the risk of Repository Sync partially completing and leaving the repository in an inconsistent state?
10. How would you explain to an auditor why a risk analysis result was based on data that was several days stale?
11. What's your approach to validating that Repository Sync captured a role change completely and correctly, not just that it ran?
12. How do you handle Repository Sync for target systems with connector reliability issues?
13. What's the risk of sync frequency decisions being made once at implementation and never revisited?
14. How would you design a process to trigger Repository Sync automatically after significant role design changes?
15. What's your strategy for communicating sync-related data freshness limitations to risk owners reviewing analysis results?
16. How do you handle Repository Sync during a period of high-volume role changes, like a major project go-live?
17. What's the risk of Repository Sync being deprioritized as "just infrastructure" rather than a control dependency?
18. How would you validate Repository Sync accuracy as part of a broader GRC health check?
19. What's your approach to Repository Sync for a target system undergoing decommissioning?
20. How do you handle discrepancies discovered between the repository and live data that don't have an obvious root cause?

## SAP Transactions

GRAC_SPM, SM37, SM59

## SAP Tables

GRACROLE, GRACROLEAUTH, GRACCONNECTOR

## Best Practices

- Schedule sync frequency to match actual role change velocity in the landscape
- Monitor sync job success and failure actively, not passively
- Trigger manual sync after significant role design changes rather than waiting for schedule
- Validate repository accuracy periodically against live target system data
- Coordinate sync scheduling with major projects involving heavy role design activity

## Common Mistakes

- Treating Repository Sync as set-and-forget infrastructure with no monitoring
- Scheduling sync too infrequently for the landscape's actual change velocity
- Not triggering a manual sync after urgent or significant role changes
- Assuming risk analysis results are always based on current data without verifying sync recency
- Not investigating discrepancies between repository and live data promptly

## Interviewer's Hidden Expectations

Interviewers want to hear that you understand Repository Sync as a dependency that directly affects risk analysis accuracy, not just a convenience for populating a dropdown list. They're listening for whether you connect stale sync data to real compliance risk, not just a cosmetic inconvenience.

## What Makes This a 10/10 Answer

An average answer says Repository Sync keeps GRC's role data updated. A 10/10 answer explains specifically why ARA's risk analysis accuracy depends on sync recency, and flags the risk of a genuinely new conflict going undetected because the repository hadn't caught up with a role change yet.

## Red Flags

- Describing Repository Sync as only relevant to the ARM request form dropdown
- Not connecting sync staleness to risk analysis accuracy
- No mention of monitoring sync job success and failure
- Suggesting sync frequency doesn't need deliberate design consideration
- No awareness of the silent-failure risk pattern common to background sync jobs

## Keywords

Repository Sync, role data, GRC repository, sync schedule, risk analysis accuracy, connector dependency, background job

## Related Topics

- connectors.md
- ara.md
- authorization-sync.md
