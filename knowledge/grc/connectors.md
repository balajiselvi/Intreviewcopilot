# Connectors

## Overview

Connectors are the integration layer linking GRC to every target system it governs — SAP and non-SAP alike. They're what let ARM actually provision a role after approval, what let ARA pull authorization data for risk analysis, and what determine whether a target system can be governed by GRC at all.

## Interview Summary

A connector is a configured RFC or web-service connection between GRC and a target system. Without a working connector, GRC can request and approve access, but it can't actually provision it, and it can't pull the authorization data needed for accurate risk analysis. Connector health is a foundational, easy-to-overlook operational dependency.

## 30 Second Interview Answer

A connector is the technical link between GRC and a system it governs — typically an RFC connection for SAP systems, or a web-service integration for non-SAP targets. Every piece of GRC functionality that touches a real system depends on it — provisioning after an ARM approval, pulling authorization data for ARA risk analysis, checking Firefighter session activity. If a connector is down, GRC can still approve requests, it just can't act on them.

## 60 Second Interview Answer

A connector is the configured connection between GRC and every system it needs to govern. For SAP target systems, this is typically an RFC connection using a dedicated technical user with the specific authorizations GRC needs to read authorization data and provision roles. For non-SAP systems, it's usually a web-service or API-based integration instead.

Connectors underpin almost everything GRC does with a real system. ARA's risk analysis depends on pulling accurate, current authorization data through the connector. ARM's provisioning step, after a request is approved, depends on the connector to actually push the role assignment to the target. Firefighter session monitoring depends on it to capture activity logs.

The operational risk with connectors is that they're easy to take for granted until they fail. A connector going down doesn't stop requests from being submitted or approved — it just breaks the step after approval, so requests pile up "approved" but not actually provisioned, and that gap isn't always immediately visible unless someone's specifically monitoring connector health.

## 90 Second Interview Answer

A connector is the technical integration between GRC and any system it needs to govern, and it's foundational infrastructure that almost every other GRC capability depends on, even though it rarely gets discussed with the same attention as ARA rulesets or ARM workflows.

For SAP target systems, a connector is typically an RFC connection, authenticated through a dedicated technical user configured with exactly the authorizations GRC needs — enough to read authorization data for risk analysis and to execute role assignments for provisioning, but scoped tightly rather than broadly, since this technical user itself represents a real security surface. For non-SAP systems — cloud applications, custom platforms, anything outside the SAP ecosystem — the integration is usually built through a web-service or API-based connector instead, which means the depth of what GRC can actually govern for that system depends on what the target system's API actually exposes.

The dependency chain matters here. ARA's risk analysis is only as accurate as the authorization data it can pull through the connector — a connector that's misconfigured or has stale caching will produce risk analysis results that don't reflect current reality. ARM's entire value proposition of governed, automated provisioning depends on the connector actually being able to push the approved role assignment through; without it, ARM becomes a request-and-approval tracker with a manual provisioning step bolted on, which defeats much of the point.

The specific operational risk worth flagging is that connector failures are often silent from the requester's point of view. A request can be fully approved through every MSMP stage and still not result in actual access, because the provisioning step failed at the connector level after approval. Unless there's active monitoring of connector health and provisioning success rates, that gap can persist for a while, with the visible symptom being "the access was approved but I still don't have it" tickets rather than an obvious system alert.

## Architecture

- RFC connector: standard connection type for SAP-to-SAP integration
- Web-service connector: integration pattern for non-SAP target systems
- Technical user: the dedicated, scoped account authenticating the connector
- Provisioning dependency: ARM's role assignment step relies on the connector
- Risk analysis dependency: ARA's authorization data pull relies on the connector

## Runtime Flow

When ARA needs authorization data for risk analysis, it queries the target system through the configured connector to pull current role and authorization assignments. When an ARM request completes approval, the provisioning framework uses the connector to execute the actual role assignment in the target system. Connector health is checked as part of these operations — if the connection fails, the dependent operation fails or is queued for retry, depending on configuration.

## Configuration

- Configure RFC connections for each SAP target system with a properly scoped technical user
- Configure web-service integrations for non-SAP target systems based on their available APIs
- Set appropriate authorization scope for the technical user — enough to function, not more
- Establish monitoring for connector availability and provisioning success rates

## Implementation Activities

- Design and configure connectors for every in-scope target system
- Scope technical user authorizations tightly to what GRC actually needs
- Test connector functionality for both risk analysis data pulls and provisioning actions
- Establish connector health monitoring before go-live

## Migration Activities

- Reconfigure or validate connectors after a target system migration or upgrade
- Re-test provisioning and data pull functionality against the migrated system
- Update technical user credentials or authorization if the target system's structure changed

## Rollout Activities

- Configure new connectors for target systems introduced by the rollout
- Validate connector functionality for the new business unit's systems before go-live
- Coordinate technical user setup with the target system's own security team

## Production Support Activities

- Monitor connector health and investigate failures proactively
- Troubleshoot provisioning failures that trace back to connector issues
- Support connector reconfiguration when target system credentials or endpoints change

## Troubleshooting

Common issue: an approved request doesn't result in actual access in the target system.
Root cause: the connector failed during the provisioning step after approval.
Resolution: check connector status and logs, resolve the underlying connectivity or authorization issue, and reprocess provisioning.

Common issue: risk analysis results seem outdated or inaccurate.
Root cause: the connector is pulling stale or cached authorization data instead of current data.
Resolution: verify connector data refresh configuration and connectivity to the target system.

Common issue: a connector that worked before now fails to authenticate.
Root cause: the technical user's credentials expired or its authorizations were changed in the target system.
Resolution: reset credentials or restore the technical user's required authorizations, coordinating with the target system's security team.

## Common Interview Questions

1. What is a connector in the context of GRC?
2. What's the difference between an RFC connector and a web-service connector?
3. Why does the technical user's authorization scope matter?
4. What GRC functions depend on a working connector?
5. What happens to an approved request if the connector fails during provisioning?
6. How do you troubleshoot a connector that's failing to authenticate?
7. What's the risk of a connector with overly broad technical user access?
8. How would you monitor connector health proactively?
9. What's the impact of a connector failure on risk analysis accuracy?
10. How do you configure a connector for a non-SAP target system?
11. What's your process for validating connector functionality before go-live?
12. How do you handle connector reconfiguration after a target system migration?
13. What's the relationship between connectors and ARM provisioning?
14. How would you detect a silent connector failure affecting approved requests?
15. What's your approach to scoping a connector's technical user appropriately?
16. How do you handle connector setup for a system with a limited or unusual API?
17. What's the audit risk of an improperly configured connector?
18. How would you design connector monitoring and alerting?
19. What's your process for coordinating connector credentials with a target system's own security team?
20. How do you handle connectors for a landscape with dozens of target systems?

## Tough Follow-up Questions

1. If approved requests are silently failing to provision, how would you design monitoring to catch that immediately instead of through user complaints?
2. How would you audit technical user authorization scope across every connector in a large landscape?
3. What's your process for validating a connector's authorization data freshness against actual target system state?
4. How do you handle connector security when the technical user itself becomes an attractive target for compromise?
5. What's the risk of connector credentials being stored insecurely or shared across multiple GRC instances?
6. How would you design a connector health dashboard that's actually useful for proactive support?
7. What's your strategy for connector governance when target system owners change credentials without notifying the GRC team?
8. How do you handle connector setup for systems that don't support the level of granular technical user scoping GRC would prefer?
9. What's the risk of provisioning retries after a connector failure creating duplicate or conflicting role assignments?
10. How would you validate connector functionality as part of a broader disaster recovery test?
11. What's your approach to connector documentation so new team members understand the full integration landscape?
12. How do you handle connector performance issues that slow down risk analysis or provisioning at scale?
13. What's the risk of connector configuration drifting between development, QA, and production environments?
14. How would you handle a connector for a target system undergoing its own parallel migration project?
15. What's your strategy for testing connector failover or resilience for business-critical provisioning?
16. How do you handle connector technical user password rotation without disrupting GRC operations?
17. What's the risk of relying on a single connector configuration for multiple GRC processes without understanding the full dependency chain?
18. How would you prioritize connector remediation work when multiple connectors have known issues simultaneously?
19. What's your approach to connector security review as part of a broader GRC security assessment?
20. How do you handle connectors when a target system is being decommissioned but still has active role assignments through GRC?

## SAP Transactions

SM59, SPRO, GRACCONNECTORS

## SAP Tables

GRACCONNECTOR, GRACCONNGRP

## Best Practices

- Scope technical user authorizations tightly to exactly what GRC needs
- Monitor connector health and provisioning success rates proactively, not reactively
- Test both risk analysis data pulls and provisioning actions when validating a connector
- Document the full connector landscape for operational and audit clarity
- Coordinate technical user credential management with target system owners

## Common Mistakes

- Granting the connector's technical user overly broad authorization out of convenience
- Not monitoring connector health, discovering failures only through user complaints
- Assuming an approved request always means successful provisioning without verifying
- Letting connector configuration drift between environments
- Treating connectors as set-and-forget infrastructure with no ongoing maintenance

## Interviewer's Hidden Expectations

Interviewers want to hear that you understand connectors as foundational, easy-to-overlook infrastructure that everything else in GRC depends on. They're listening for whether you've dealt with the specific failure mode of silent provisioning failures after approval, since that's a real, common production issue.

## What Makes This a 10/10 Answer

An average answer describes a connector as "the link between GRC and other systems." A 10/10 answer explains exactly what depends on it — risk analysis accuracy and provisioning success — and flags the specific operational risk of approved-but-not-provisioned requests going unnoticed without active connector monitoring.

## Red Flags

- Describing connectors as a minor technical detail rather than foundational dependency
- Not connecting connector health to both risk analysis accuracy and provisioning success
- No mention of the risk of silent provisioning failures
- Suggesting technical user authorization scope doesn't matter much
- No awareness of connector monitoring as a real operational need

## Keywords

connector, RFC connection, web-service integration, technical user, provisioning, risk analysis data, connector health

## Related Topics

- grc-overview.md
- arm.md
- repository-sync.md
