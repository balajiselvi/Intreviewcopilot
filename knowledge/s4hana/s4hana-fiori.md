# S/4HANA Fiori Security

## Overview

Fiori security in S/4HANA covers the launchpad-facing layer — catalogs, groups, and spaces and pages in the newer launchpad model — that determines app visibility and access, sitting alongside and depending on the OData services and backend authorization objects those apps actually call. Getting Fiori security right means understanding both layers, not just the launchpad configuration.

## Interview Summary

A Fiori app's security has two layers: the launchpad layer, controlled by catalogs, groups, or spaces and pages, which determines whether a user sees and can launch the app; and the backend layer, controlled by OData service authorization and the same classic authorization objects, which determines whether the app actually functions once opened. Missing either layer breaks the user experience differently — no tile, or a tile that errors when opened.

## 30 Second Interview Answer

Fiori security has two layers you have to get right together. The launchpad layer — catalogs and groups, or spaces and pages in the newer model — controls whether a user sees an app tile at all. The backend layer — OData service authorization plus classic authorization objects — controls whether the app actually works once opened. Missing the launchpad layer means no tile shows up; missing the backend layer means the tile shows up but the app fails or shows an error.

## 60 Second Interview Answer

Fiori security operates on two distinct layers, and understanding both is essential, because they fail differently and get diagnosed differently.

The launchpad layer determines app visibility — in the classic model this is catalogs and groups, where catalogs grant access to a set of apps and groups organize how those apps appear on the launchpad. Newer S/4HANA versions use spaces and pages instead, a more flexible model, but the underlying security concept is the same: this layer controls whether the tile even exists for the user.

The backend layer is what makes the app actually function. Fiori apps are built on OData services, which need their own authorization, in addition to the classic authorization objects the underlying business logic checks — the same AUTHORITY-CHECK mechanism that's always existed. A user can have full launchpad access to an app and still hit an authorization error the moment they try to actually use it, because the backend layer is a separate authorization surface entirely.

Troubleshooting Fiori access issues means figuring out which layer is actually broken — a missing tile points to the launchpad layer, an error after opening a visible tile points to the backend layer, and conflating the two wastes time investigating the wrong configuration.

## 90 Second Interview Answer

Fiori security is genuinely two-layered, and the distinction matters both for design and for troubleshooting. The launchpad layer determines whether a user sees and can launch an app at all. In the classic Fiori launchpad model, this is catalogs, which grant access to a defined set of apps, and groups, which organize how those apps are tiled and arranged for the user. Newer S/4HANA releases have moved toward a spaces and pages model instead — a more flexible, more business-role-aligned way of organizing the launchpad — but conceptually it serves the same purpose: controlling app visibility and launch access.

The backend layer is what actually determines whether the app functions once launched. Fiori apps are built on OData services that expose backend data and functionality to the front-end UI, and these services require their own authorization — a user needs to be authorized to call the specific OData service the app depends on, independent of launchpad visibility. Beyond the OData layer, the underlying business logic still runs the same classic AUTHORITY-CHECK statements against authorization objects that any SAP transaction always has, whether it's being invoked through Fiori or the traditional SAP GUI.

This two-layer structure is exactly why Fiori troubleshooting requires knowing which layer to investigate. If a user reports they can't find an app at all, that's almost always a launchpad-layer issue — missing catalog or group assignment, or in the newer model, missing space or page assignment. If a user reports the tile is there but the app throws an authorization error or behaves incorrectly once opened, that's a backend-layer issue — either the OData service authorization is missing, or the underlying authorization objects the business logic requires aren't in the role. Treating these as the same problem, or investigating the wrong layer first, is a common and avoidable source of wasted troubleshooting time.

Role design for Fiori has to account for both layers deliberately. A role built only with launchpad access and no thought given to the OData and backend authorization requirements will produce exactly the "tile shows up, app fails" experience that erodes user trust in a Fiori rollout even when the underlying security design intent was sound.

## Architecture

- Fiori catalog: grants access to a defined set of apps (classic launchpad model)
- Fiori group: organizes app tiles for the user (classic launchpad model)
- Spaces and pages: the newer, more flexible launchpad organization model
- OData service authorization: the backend service layer Fiori apps depend on
- Classic authorization objects: still checked by the underlying business logic regardless of Fiori

## Runtime Flow

When a user opens their Fiori launchpad, the system determines which app tiles to display based on their catalog and group, or space and page, assignments. Selecting a tile launches the app, which calls its underlying OData services — each service call is authorization-checked independently. As the app's business logic executes, it runs the same AUTHORITY-CHECK statements against classic authorization objects that any SAP transaction would, regardless of whether it's being accessed through Fiori or SAP GUI.

## Configuration

- Assign Fiori catalogs and groups, or spaces and pages, based on actual job function app needs
- Maintain OData service authorization for every app in scope
- Ensure backend authorization objects are included in the role alongside launchpad access
- Test both layers independently when validating a new role

## Implementation Activities

- Design Fiori catalog/group or space/page structure aligned with business role definitions
- Maintain OData service authorization for standard and custom Fiori apps
- Validate backend authorization content is complete for every app granted launchpad access
- Test the full app experience end to end, not just launchpad visibility

## Migration Activities

- Validate Fiori catalog and group, or space and page, configuration transported correctly
- Re-test OData service authorization after a system upgrade or migration
- Confirm custom Fiori apps retained correct backend authorization mapping post-migration

## Rollout Activities

- Extend Fiori launchpad configuration to new business units with appropriate app selection
- Validate OData service availability and authorization for the new user population
- Test the full two-layer experience for the rollout entity before go-live

## Production Support Activities

- Diagnose Fiori issues by first identifying which layer — launchpad or backend — is actually affected
- Maintain OData service authorization as new or custom apps are deployed
- Support troubleshooting for apps that are visible but non-functional

## Troubleshooting

Common issue: a user can't find an expected app on their launchpad.
Root cause: missing Fiori catalog/group or space/page assignment — a launchpad-layer issue.
Resolution: verify and correct the launchpad-layer assignment; this is unrelated to backend authorization.

Common issue: an app tile is visible but throws an authorization error when opened.
Root cause: missing OData service authorization or missing backend authorization objects — a backend-layer issue.
Resolution: trace the specific failing authorization object or OData service call and add it to the role.

Common issue: an app worked before an upgrade but now fails.
Root cause: the upgrade changed OData service structure or authorization requirements without a corresponding SU24/role update.
Resolution: review updated app authorization requirements post-upgrade and adjust the role accordingly.

## Common Interview Questions

1. What are the two layers of Fiori security?
2. What's the difference between Fiori catalogs/groups and spaces/pages?
3. What role does OData service authorization play?
4. How would you troubleshoot a missing app tile versus a failing app?
5. Do classic authorization objects still apply to Fiori apps?
6. What's the risk of designing a role with only launchpad access considered?
7. How do you maintain OData authorization for custom Fiori apps?
8. What's the relationship between Fiori security and SU24?
9. How would you validate both layers of a new Fiori role before go-live?
10. What changed in the newer spaces and pages launchpad model?
11. How do you handle Fiori security for a custom-built app?
12. What's your process for diagnosing which layer is causing a Fiori access issue?
13. How does Fiori security differ from classic SAP GUI transaction security?
14. What's the impact of an upgrade on OData service authorization?
15. How would you design Fiori catalogs and groups for a new business role?
16. What's the audit consideration for OData service access?
17. How do you handle Fiori app authorization testing before a rollout?
18. What's the risk of assuming launchpad visibility implies full app functionality?
19. How would you migrate from classic catalogs/groups to spaces and pages?
20. What's your approach to Fiori security governance across a large app catalog?

## Tough Follow-up Questions

1. If hundreds of users report the same "tile visible, app fails" issue after an upgrade, how would you triage and resolve it efficiently?
2. How would you design a systematic testing process covering both Fiori layers for every role before go-live?
3. What's your process for auditing OData service authorization across a large custom app landscape?
4. How do you handle Fiori security for apps that call multiple OData services with different authorization requirements?
5. What's the risk of Fiori catalog and group design becoming disconnected from actual backend authorization over time?
6. How would you validate that a spaces and pages migration didn't silently change actual app access for any user?
7. What's your strategy for Fiori security governance when business teams want faster app rollout than security review allows?
8. How do you handle Fiori authorization for apps built by third-party or non-SAP development teams?
9. What's the risk of OData service authorization being too permissive as a workaround for app functionality issues?
10. How would you explain to a business stakeholder why a visible app tile doesn't guarantee the app actually works for their access level?
11. What's your process for testing Fiori security across both SAP GUI and Fiori access paths during a transition period?
12. How do you handle Fiori security for embedded analytics apps pulling data across multiple authorization domains?
13. What's the risk of Fiori catalog sprawl making role design increasingly difficult to manage?
14. How would you design monitoring to detect OData authorization failures proactively rather than through user reports?
15. What's your approach to documenting the OData service dependencies for each custom Fiori app?
16. How do you handle Fiori security when the same app needs different backend authorization scope for different business units?
17. What's the risk of Fiori security testing only covering the happy path and missing edge-case authorization gaps?
18. How would you validate Fiori security as part of a broader S/4HANA upgrade readiness check?
19. What's your strategy for consolidating Fiori catalogs and groups that have grown fragmented across a large implementation?
20. How do you handle Fiori security incident response when a launchpad-layer misconfiguration exposes apps broadly?

## SAP Transactions

/UI2/FLPD_CUST, /IWFND/MAINT_SERVICE, PFCG, /UI2/FLPCM_CUST

## SAP Tables

AGR_1251, T_LPD_ROLET, /IWFND/C_MED_TADIR

## Best Practices

- Design and validate Fiori catalog/group and backend authorization together, never separately
- Maintain OData service authorization as a first-class part of role design, not an afterthought
- Test the full app experience end to end, not just launchpad visibility
- Diagnose Fiori issues by first identifying which layer is affected
- Keep OData authorization current as apps and upgrades change service requirements

## Common Mistakes

- Designing Fiori roles around launchpad visibility without validating backend authorization
- Not maintaining OData service authorization for custom apps
- Troubleshooting Fiori issues without first determining which layer is actually broken
- Assuming a visible tile means the app is fully authorized to function
- Not re-testing OData authorization after upgrades that change service structure

## Interviewer's Hidden Expectations

Interviewers want to hear that you clearly separate the launchpad and backend layers of Fiori security, since conflating them is the most common practical mistake. They're listening for whether you can diagnose which layer is actually broken from a reported symptom, which is real operational skill.

## What Makes This a 10/10 Answer

An average answer describes Fiori security as catalogs and groups. A 10/10 answer explains the two-layer model precisely — launchpad visibility versus OData and backend authorization — and connects each layer to a specific, distinguishable troubleshooting symptom.

## Red Flags

- Describing Fiori security as only catalogs and groups, with no mention of OData authorization
- Not knowing the difference between a missing tile and a failing app as distinct symptoms
- Treating spaces and pages as functionally identical to catalogs and groups with no distinction
- No mention of classic authorization objects still applying to Fiori apps
- Suggesting launchpad visibility alone guarantees app functionality

## Keywords

Fiori security, Fiori catalog, Fiori group, spaces and pages, OData service authorization, launchpad, backend authorization

## Related Topics

- s4hana-security.md
- s4hana-business-roles.md
- fiori-security.md
