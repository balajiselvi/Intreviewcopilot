# SAP BTP Overview

## Overview

SAP Business Technology Platform is SAP's cloud platform underpinning integration, extension, and data services across the SAP portfolio. From a security standpoint, it introduces an entirely different identity and authorization model from on-premise ABAP systems — subaccounts, cloud identity services, role collections, and destination-based connectivity replace PFCG and classic authorization objects.

## Interview Summary

BTP is organized into a hierarchy of global accounts, subaccounts, and spaces or directories, each with its own scoping for services and security configuration. Identity and access is handled through Identity Authentication Service and Identity Provisioning Service rather than SU01 and PFCG, and role collections — not PFCG roles — are the unit of authorization assignment.

## 30 Second Interview Answer

SAP BTP is SAP's cloud platform, and its security model is genuinely different from on-premise ABAP systems. Instead of PFCG roles and SU01 users, BTP uses Identity Authentication Service for authentication, Identity Provisioning Service for user lifecycle, and role collections built from role templates for authorization. The whole thing is organized in a hierarchy — global account, subaccounts, and spaces — each with its own scoping.

## 60 Second Interview Answer

SAP BTP is the cloud platform SAP uses for integration, extension, and data services, and it comes with its own security model that's meaningfully different from classic ABAP-based systems.

The organizational structure is a hierarchy: a global account sits at the top, containing subaccounts, which in turn contain spaces in the Cloud Foundry environment, or directories for further organizational grouping. Each level has its own scoping for which services are available and how security is configured.

Identity and access management runs through Identity Authentication Service, which handles authentication, and Identity Provisioning Service, which handles user and group lifecycle across connected systems. Authorization itself is assigned through role collections — a role collection bundles one or more roles, which are themselves built from role templates that applications define — rather than the PFCG roles and authorization objects that govern on-premise ABAP systems.

## 90 Second Interview Answer

SAP BTP is SAP's cloud platform for integration, extension, and data and analytics services, and understanding its security model requires setting aside on-premise ABAP assumptions almost entirely — this is a genuinely different architecture, not a cloud-flavored version of PFCG.

The organizational hierarchy starts with a global account, which is the top-level commercial and administrative container for an organization's BTP consumption. Below that sit subaccounts, which are the primary unit of technical and security scoping — services get subscribed to at the subaccount level, and most security configuration happens here. Within a subaccount, depending on the runtime environment, you have spaces in Cloud Foundry for further application-level isolation, or directories as an organizational grouping layer above subaccounts for larger, more complex landscapes.

Identity is handled by two distinct services working together. Identity Authentication Service, IAS, is the authentication layer — it's what actually verifies who a user is, supporting standard protocols like SAML and OpenID Connect, and it can federate with an organization's existing corporate identity provider rather than maintaining a separate BTP-specific user store. Identity Provisioning Service, IPS, handles the lifecycle side — provisioning and deprovisioning users and groups across connected systems and applications, keeping identity data synchronized rather than manually maintained in each target.

Authorization is built from role templates, which are defined by the applications and services running on BTP — a given application declares what roles it supports. Those templates get combined into roles, and roles get bundled into role collections, which is the actual object assigned to users or groups. This is architecturally quite different from PFCG's authorization-object-and-field-value model, and interviewers specifically listen for whether candidates understand that difference rather than describing BTP security as if it were just cloud PFCG.

## Architecture

- Global account: top-level commercial and administrative container
- Subaccount: primary technical and security scoping unit
- Spaces (Cloud Foundry) or directories: further organizational and isolation layers
- Identity Authentication Service (IAS): authentication layer, supports SAML/OIDC federation
- Identity Provisioning Service (IPS): user and group lifecycle provisioning across connected systems
- Role template, role, role collection: the authorization hierarchy, assigned to users/groups

## Runtime Flow

A user authenticates through Identity Authentication Service, which may federate to a corporate identity provider rather than maintaining credentials itself. Once authenticated, the user's assigned role collections determine what they can access within the subaccount's applications and services. Identity Provisioning Service handles keeping user and group data synchronized across connected systems, independent of the authentication flow itself, ensuring access reflects current identity data.

## Configuration

- Establish the global account and subaccount hierarchy matching organizational and environment needs
- Configure Identity Authentication Service, including federation with a corporate identity provider if applicable
- Configure Identity Provisioning Service for user and group synchronization to connected systems
- Define role collections combining application-provided role templates appropriate to each job function

## Implementation Activities

- Design the subaccount and space/directory structure for the organization's BTP landscape
- Configure IAS and establish identity federation with the corporate identity provider
- Configure IPS for provisioning to all relevant connected systems
- Build role collections mapped to actual job functions using available role templates

## Migration Activities

- Validate subaccount and identity service configuration transported or replicated correctly across landscape stages
- Re-test IAS federation and IPS provisioning after any identity provider changes
- Confirm role collection assignments carried over accurately during a landscape restructuring

## Rollout Activities

- Extend subaccount structure and role collections to new business units or regions
- Configure IPS provisioning for newly connected systems introduced by the rollout
- Validate identity federation works correctly for the expanded user population

## Production Support Activities

- Investigate authentication issues tracing back to IAS configuration or federation
- Support IPS provisioning failures affecting user access to connected systems
- Maintain role collection assignments as job functions and application roles evolve

## Troubleshooting

Common issue: a user can't authenticate to a BTP application.
Root cause: IAS federation misconfiguration, or the user doesn't exist in the federated identity provider.
Resolution: verify federation trust configuration and confirm the user exists and is active in the identity provider.

Common issue: a user is provisioned in the identity provider but doesn't have access in a connected application.
Root cause: IPS hasn't synchronized the user, or role collection assignment is missing.
Resolution: verify IPS provisioning job status and confirm role collection assignment.

Common issue: role collection assignment doesn't grant the expected access.
Root cause: the underlying role template or role definition doesn't map to what was assumed.
Resolution: review the application's role template documentation and correct the role collection composition.

## Common Interview Questions

1. What is SAP BTP and how does its security model differ from on-premise ABAP?
2. What's the organizational hierarchy of a BTP landscape?
3. What's the difference between IAS and IPS?
4. What is a role collection and how does it relate to role templates?
5. How does authentication work in BTP compared to SAP GUI login?
6. What's the purpose of a subaccount?
7. How would you troubleshoot a user unable to authenticate to a BTP app?
8. What's the difference between spaces and directories?
9. How does identity federation work with IAS?
10. What's the role of IPS in user lifecycle management?
11. How do you design role collections for a new application?
12. What's the relationship between global accounts and subaccounts?
13. How would you handle BTP security for a multi-region deployment?
14. What's the audit consideration for BTP identity and access management?
15. How do you validate role collection assignments are correct?
16. What's the risk of misconfigured IAS federation?
17. How does BTP security integrate with an organization's broader identity strategy?
18. What's your process for troubleshooting a provisioning failure?
19. How do you handle role template updates from an application vendor?
20. What's the difference between authentication and authorization in the BTP model?

## Tough Follow-up Questions

1. If IAS federation breaks and locks out an entire user population, what's your incident response process?
2. How would you design subaccount structure for an organization with strict data residency requirements across regions?
3. What's your process for auditing role collection assignments across a large, growing BTP landscape?
4. How do you handle BTP security governance when multiple teams provision their own subaccounts independently?
5. What's the risk of role collections becoming as unmanageable as an ungoverned PFCG role catalog?
6. How would you validate IPS provisioning accuracy across dozens of connected systems?
7. What's your strategy for BTP identity strategy alignment with an organization's broader IAM program, not just SAP-specific identity?
8. How do you handle BTP security for applications with role templates that don't map cleanly to actual job functions?
9. What's the risk of subaccount sprawl without clear ownership and governance?
10. How would you explain the BTP security model to a security team experienced only with on-premise ABAP systems?
11. What's your process for validating that a role collection doesn't inadvertently grant broader access than intended?
12. How do you handle BTP security during a merger with two organizations running separate BTP landscapes?
13. What's the risk of relying entirely on IAS/IPS without periodic manual validation of access accuracy?
14. How would you design monitoring for BTP identity and access anomalies?
15. What's your approach to BTP security documentation for audit purposes given its different architecture from ABAP?
16. How do you handle emergency access scenarios within the BTP security model?
17. What's the risk of BTP role template changes from an application update silently altering existing role collection behavior?
18. How would you validate segregation of duties concepts translate meaningfully to the BTP role collection model?
19. What's your strategy for BTP subaccount lifecycle management, including decommissioning?
20. How do you handle BTP security skills gap when a team is experienced in ABAP security but new to cloud identity concepts?

## SAP Transactions

Not applicable in the traditional ABAP sense — BTP administration happens through the BTP cockpit (web-based administration UI) and the Identity Authentication/Provisioning admin consoles, not SAP GUI transactions.

## SAP Tables

Not applicable — BTP identity and role collection data is managed through IAS/IPS and the BTP cockpit, not classic ABAP database tables.

## Best Practices

- Design subaccount and directory structure deliberately, aligned with organizational and environment boundaries
- Federate IAS with the corporate identity provider rather than maintaining separate BTP credentials
- Build role collections around actual job functions, not arbitrary application role bundling
- Monitor IPS provisioning job health proactively
- Periodically audit role collection assignments for accuracy and drift

## Common Mistakes

- Describing BTP security as if it were simply a cloud version of PFCG
- Not federating identity, leading to separate, unmanaged BTP credentials
- Letting subaccounts proliferate without clear ownership or governance
- Not monitoring IPS provisioning job failures proactively
- Building role collections without validating them against actual job function needs

## Interviewer's Hidden Expectations

Interviewers want to hear that you understand BTP security as architecturally distinct from on-premise ABAP security, not just a relabeled version of it. They're listening specifically for correct use of IAS, IPS, and role collection terminology, since conflating them signals surface-level knowledge.

## What Makes This a 10/10 Answer

An average answer says BTP uses cloud identity services instead of PFCG. A 10/10 answer explains the full hierarchy — global account, subaccount, spaces/directories — and precisely distinguishes IAS's authentication role from IPS's provisioning role and role collections' authorization role.

## Red Flags

- Describing BTP security as essentially cloud PFCG
- Confusing IAS and IPS or using the terms interchangeably
- Not knowing what a role collection is
- No mention of the subaccount as the primary security scoping unit
- Treating BTP identity as isolated from the organization's broader identity strategy

## Keywords

SAP BTP, global account, subaccount, IAS, IPS, role collection, role template, identity federation, Cloud Foundry, spaces, directories

## Related Topics

- btp-security.md
- cloud-identity.md
- ias.md
- ips.md
