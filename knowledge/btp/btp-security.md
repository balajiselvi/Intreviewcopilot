# SAP BTP Security

## Overview

Beyond identity and role collections covered in the BTP overview, BTP security includes connectivity security — how BTP applications reach on-premise and other cloud systems — through the Cloud Connector and destination services, plus subaccount-level security configuration like trust settings and API access control.

## Interview Summary

BTP security extends past authentication and authorization into connectivity: the Cloud Connector provides a secure tunnel from BTP to on-premise systems without opening inbound firewall ports, and destinations define how an application actually reaches a target system, including which authentication method to use for that specific connection.

## 30 Second Interview Answer

Beyond identity and role collections, BTP security includes how applications actually connect to other systems. The Cloud Connector creates a secure, outbound-initiated tunnel from your on-premise landscape to BTP, so you don't have to open inbound firewall ports for cloud access. Destinations then define the specific connection details and authentication method an application uses to reach a target system through that tunnel or directly to another cloud service.

## 60 Second Interview Answer

BTP security has a connectivity dimension that's just as important as identity and authorization. The Cloud Connector is the standard mechanism for connecting BTP applications to on-premise systems — it establishes a secure tunnel initiated from the on-premise side outbound to BTP, which means you never have to open an inbound port on your corporate firewall for cloud access. This is a meaningful security design choice, not just a technical convenience.

Destinations are the configuration objects that define how an application actually reaches a specific target — the connection details, and critically, the authentication method to use, whether that's principal propagation, a technical user, OAuth, or another supported method. A misconfigured destination is one of the most common sources of "the app can't reach the backend" issues.

Beyond connectivity, subaccount-level security configuration covers things like trust settings for identity federation and API access controls, all of which need to be deliberately configured rather than left at defaults.

## 90 Second Interview Answer

BTP security extends meaningfully beyond identity and authorization into how applications actually connect to the systems they need data from or need to act on, and this connectivity layer deserves as much attention as the identity model.

The Cloud Connector is the standard component for bridging BTP to an on-premise landscape. Its key security property is that the tunnel is established outbound, initiated from the on-premise side toward BTP — this means an organization never has to open an inbound firewall port to allow cloud access into their network, which is a significant risk reduction compared to older integration patterns that required inbound exposure. The Cloud Connector also lets you scope exactly which on-premise systems and resources are exposed to BTP, rather than exposing the entire internal network.

Destinations are the configuration layer sitting on top of connectivity — they define how a specific application reaches a specific target, including the URL or system identifier and, critically, which authentication method applies to that connection. Principal propagation is a particularly important pattern here: it lets a BTP application pass through the actual end user's identity to the backend system, so authorization checks happen against that real user's access rather than a generic technical user, preserving the audit trail and the principle of least privilege all the way through the connection. Getting destination authentication configuration wrong is one of the most common sources of application connectivity failures, and it's also a place where security shortcuts — like defaulting to a broad technical user instead of principal propagation — quietly erode the security model.

Beyond connectivity specifically, subaccount-level configuration covers trust settings for identity federation, API access controls for the subaccount's management APIs, and other governance settings that need deliberate configuration — none of this comes securely configured by default, and BTP security work involves actively setting these up correctly, not just accepting platform defaults.

## Architecture

- Cloud Connector: secure, outbound-initiated tunnel from on-premise to BTP
- Destination: configuration object defining connection details and authentication method to a target system
- Principal propagation: destination authentication pattern passing the end user's real identity through to the backend
- Subaccount trust configuration: identity federation trust settings
- API access controls: governance over subaccount management API access

## Runtime Flow

When a BTP application needs to reach an on-premise system, it uses a configured destination, which specifies the connection details and authentication method. If the target is on-premise, the request routes through the Cloud Connector's established tunnel. If the destination is configured for principal propagation, the actual authenticated end user's identity is passed through to the backend system, and authorization checks there evaluate against that real user's access rather than a shared technical user.

## Configuration

- Install and configure Cloud Connector, scoping exactly which on-premise resources are exposed
- Define destinations for each application-to-target-system connection, selecting the appropriate authentication method
- Configure principal propagation where end-user-level authorization needs to carry through to the backend
- Set subaccount trust and API access controls deliberately rather than leaving platform defaults

## Implementation Activities

- Install Cloud Connector and scope on-premise system exposure to only what's required
- Design and configure destinations for each application's backend connectivity needs
- Implement principal propagation where end-user authorization fidelity matters
- Configure subaccount trust settings and API access controls as part of initial setup

## Migration Activities

- Validate Cloud Connector and destination configuration transported or replicated correctly across landscape stages
- Re-test connectivity and authentication after any backend system migration or credential change
- Confirm principal propagation continues to function correctly post-migration

## Rollout Activities

- Extend Cloud Connector scope and destination configuration for new on-premise systems introduced by the rollout
- Validate connectivity security for new business units or regions
- Configure trust and API access controls for any new subaccounts created during rollout

## Production Support Activities

- Investigate connectivity failures by checking Cloud Connector tunnel status and destination configuration
- Troubleshoot authentication failures at the destination level
- Maintain and monitor Cloud Connector health proactively

## Troubleshooting

Common issue: a BTP application can't reach an on-premise backend.
Root cause: Cloud Connector tunnel is down, or the specific system isn't exposed in the Cloud Connector's scope.
Resolution: verify Cloud Connector status and confirm the target system is correctly scoped for exposure.

Common issue: a request reaches the backend but fails with an authorization error tied to a generic technical user instead of the actual end user.
Root cause: the destination isn't configured for principal propagation, so end-user identity isn't passed through.
Resolution: reconfigure the destination for principal propagation if end-user-level authorization is required.

Common issue: a destination that worked before now fails to authenticate.
Root cause: credentials or trust configuration for that destination's authentication method expired or changed.
Resolution: update destination credentials or trust configuration to match the current backend authentication setup.

## Common Interview Questions

1. What is the Cloud Connector and why does its outbound-initiated design matter for security?
2. What is a destination and what does it configure?
3. What is principal propagation and why is it significant?
4. How would you troubleshoot a BTP application unable to reach an on-premise system?
5. What's the risk of using a technical user instead of principal propagation?
6. How do you scope Cloud Connector exposure appropriately?
7. What's the relationship between destinations and authentication methods?
8. How would you configure subaccount trust settings?
9. What's the audit consideration for BTP connectivity security?
10. How do you handle destination configuration for multiple target systems?
11. What's the risk of Cloud Connector misconfiguration exposing more than intended?
12. How would you validate destination authentication is correctly configured?
13. What's your process for troubleshooting an authorization error after successful connectivity?
14. How do you handle Cloud Connector high availability for critical integrations?
15. What's the difference between principal propagation and a shared technical user?
16. How would you design connectivity security for a new BTP integration project?
17. What's your approach to API access control governance at the subaccount level?
18. How do you handle destination credential rotation?
19. What's the risk of not using principal propagation for sensitive backend operations?
20. How would you audit Cloud Connector scope across a large landscape?

## Tough Follow-up Questions

1. If a Cloud Connector misconfiguration exposed more on-premise systems than intended, how would you investigate and remediate the exposure?
2. How would you design a review process to catch destinations using overly broad technical user authentication instead of principal propagation?
3. What's your process for auditing Cloud Connector scope across a large, multi-team BTP landscape?
4. How do you handle connectivity security for third-party or non-SAP backend systems integrated through BTP?
5. What's the risk of Cloud Connector becoming a single point of failure for critical integrations?
6. How would you validate that principal propagation is actually preserving least privilege, not just technically functioning?
7. What's your strategy for destination credential management at scale across many applications and target systems?
8. How do you handle Cloud Connector security when multiple business units share the same connector instance?
9. What's the risk of trust configuration changes at the subaccount level breaking existing federated authentication silently?
10. How would you explain to a network security team why Cloud Connector's outbound design is more secure than traditional inbound firewall exceptions?
11. What's your process for testing destination failover or resilience for business-critical connectivity?
12. How do you handle connectivity security governance when application teams configure their own destinations without central review?
13. What's the risk of destination authentication methods being chosen for convenience rather than security appropriateness?
14. How would you design monitoring for Cloud Connector and destination health proactively?
15. What's your approach to documenting the full connectivity landscape for audit and incident response purposes?
16. How do you handle Cloud Connector scope changes without disrupting existing integrations during the transition?
17. What's the risk of principal propagation failing silently and falling back to a less secure authentication method?
18. How would you validate connectivity security as part of a broader BTP security assessment?
19. What's your strategy for connectivity security during a Cloud Connector version upgrade?
20. How do you handle destination and Cloud Connector configuration consistency across development, QA, and production landscapes?

## SAP Transactions

Not applicable in the ABAP sense — Cloud Connector has its own administration UI, and destinations are configured through the BTP cockpit, not SAP GUI transactions.

## SAP Tables

Not applicable — Cloud Connector and destination configuration is managed through their respective administration interfaces, not classic ABAP tables.

## Best Practices

- Scope Cloud Connector exposure to exactly what's needed, never broader for convenience
- Prefer principal propagation over shared technical users whenever end-user authorization fidelity matters
- Review destination authentication method choices deliberately, not as an afterthought
- Monitor Cloud Connector and destination health proactively
- Document the full connectivity landscape for audit and troubleshooting purposes

## Common Mistakes

- Scoping Cloud Connector exposure too broadly out of convenience
- Defaulting to shared technical user authentication instead of principal propagation
- Not monitoring Cloud Connector tunnel health, discovering failures through user complaints
- Letting destination configuration proliferate without central review or governance
- Not documenting connectivity architecture, making troubleshooting and audits harder

## Interviewer's Hidden Expectations

Interviewers want to hear that you understand the Cloud Connector's outbound-tunnel design as a deliberate security choice, not just a technical detail, and that you can explain principal propagation's value for preserving least privilege through cloud-to-on-premise connections.

## What Makes This a 10/10 Answer

An average answer says the Cloud Connector links BTP to on-premise systems. A 10/10 answer explains why the outbound-initiated design matters for security, what a destination actually configures, and specifically why principal propagation is preferable to a shared technical user for preserving end-user-level authorization.

## Red Flags

- Not knowing what principal propagation is or why it matters
- Describing Cloud Connector connectivity without mentioning its outbound-initiated security property
- Confusing destinations with the Cloud Connector itself
- Suggesting a shared technical user is just as good as principal propagation
- No mention of subaccount trust or API access control as part of BTP security

## Keywords

Cloud Connector, destination, principal propagation, subaccount trust, API access control, outbound tunnel, technical user

## Related Topics

- btp-overview.md
- cloud-connector.md
- cloud-identity.md
