# S/4HANA Security

## Overview

Design SAP S/4HANA Cloud Public Edition access in Maintain Business Roles, assign that business role in Maintain Business Users, and verify it by having the assigned user perform the intended app while Display Authorization Trace records successful, failed, or filtered checks. Private Edition and on-premise role design stays in PFCG. PFCG, SU24, SUIM, AGR_USERS, and a BTP role collection are not the Public Edition design.

## Interview Summary

Design SAP S/4HANA Cloud Public Edition access in Maintain Business Roles, assign that business role in Maintain Business Users, and verify it by having the assigned user perform the intended app while Display Authorization Trace records successful, failed, or filtered checks. A filtered check means the business role is not assigned or the restriction value is missing. Private Edition and on-premise success is the assigned user completing the business transaction in the PFCG role.

## 30 Second Interview Answer

Design SAP S/4HANA Cloud Public Edition access in Maintain Business Roles, assign that business role in Maintain Business Users, and verify it by having the assigned user perform the intended app while Display Authorization Trace records successful, failed, or filtered checks. Create the role from an SAP business-role template, assign the business catalogs, and maintain the restriction values the function requires. Activate the trace for that business user and the apps, let the user execute them, then deactivate the trace. A filtered check means the user is not assigned the business role for that restriction type, or the required value is not maintained. A trace status does not replace the user completing the business action.

## 60 Second Interview Answer

Design SAP S/4HANA Cloud Public Edition access in Maintain Business Roles, assign that business role in Maintain Business Users, and verify it by having the assigned user perform the intended app while Display Authorization Trace records successful, failed, or filtered checks. SAP S/4HANA Cloud Public Edition 2608 uses Maintain Business Users to assign business roles and Maintain Business Roles to create roles, maintain authorization restrictions, and start from SAP business-role templates. Activate the trace, have the user execute the app, deactivate the trace, and review successful, failed, and filtered checks. Review the trace promptly because the system deletes it after a time, and a selection returns at most 10,000 data sets. SAP S/4HANA Cloud Private Edition and an on-premise system keep role maintenance in PFCG and assignment on the ABAP user master. On those systems, success is the assigned user completing the business transaction. SU53 or STAUTHTRACE is evidence only after an authorization check fails.

## 90 Second Interview Answer

Design SAP S/4HANA Cloud Public Edition security in Maintain Business Roles from an SAP template, and assign its business catalogs and restrictions. Assign that business role in Maintain Business Users so the user can open the app. Verify access by having the assigned user perform the intended app. Activate Display Authorization Trace for that business user, let the user execute the app, and deactivate the trace. Read each check as successful, failed, or filtered, and treat a filtered check as a missing business role or an unmaintained restriction value. Confirm the business function only when that user completes the app. Private Edition and on-premise role design stays in PFCG, and SU53 is evidence only after an authorization check fails.

## Architecture

The security architecture of SAP S/4HANA Cloud follows the edition. In Public Edition, design access in Maintain Business Roles with business catalogs and restrictions, assign the business role in Maintain Business Users, and record the checks in Display Authorization Trace. In Private Edition and on-premise, maintain the role in PFCG and assign it on the ABAP user master, then have that user complete the business transaction. An identity provider or a provisioning job does not replace that edition's authorization tool. Do not use a BTP role collection as an S/4HANA Cloud business role.

## Runtime Flow

On Public Edition the business user signs in to the tenant, opens the app granted by the assigned business role, and the application checks the restrictions maintained on that role. Display Authorization Trace records those checks as successful, failed, or filtered. On Private Edition and on-premise, the PFCG profile supplies the authorization values, and a failed check is inspected only after the business transaction fails.

## Configuration

In SAP S/4HANA Cloud Public Edition, create the business role in Maintain Business Roles from a template, assign the business catalogs, and maintain the restrictions. Assign that role in Maintain Business Users. Have the assigned user perform the intended app. Activate Display Authorization Trace for that user, let the user execute the app, deactivate the trace, and correct a failed or filtered check in the business role. Confirm the business function only when that user completes it. On Private Edition or on-premise, maintain the role in PFCG and assign it on the ABAP user master. Have that assigned user complete the business transaction in the PFCG role. Read SU53 or STAUTHTRACE only after an authorization check fails.

## Source

Checked 2026-10-17 against the SAP S/4HANA Cloud Public Edition 2608 Feature Scope Description, Identity and Access Management: Maintain Business Users assigns business roles, Maintain Business Roles creates roles and authorization restrictions from SAP templates, and Display Authorization Trace analyzes missing or insufficient authorizations for a business user. https://help.sap.com/doc/7c9e0bbbd1664c2581b2038a1c7ae4b3/2608.500/en-US/FSD_CE2608.pdf

SAP Learning, Creating an Authorization Trace, in Managing User Identity and Access in SAP S/4HANA Cloud Public Edition: Activate Trace for the business user and apps, the user executes the apps, Deactivate Trace, then read successful, failed, or filtered. A filtered check means the user is not assigned the business role for that restriction type or the required value is not maintained. Traces are deleted after a time, and a selection returns at most 10,000 data sets. https://learning.sap.com/courses/managing-user-identity-and-access-in-sap-s-4hana-cloud-public-edition/creating-an-authorization-trace_c872d7fa-4a8e-4635-ba4f-df2f86f5f0d7

Private Edition role maintenance in PFCG is the procedure recorded on 2026-10-13 from SAP Learning, Assigning Permissions to Users. This pass did not re-open that lesson.

## Implementation Activities

These activities apply to Private Edition and on-premise role design. They are not the SAP S/4HANA Cloud Public Edition procedure. Maintain the role in PFCG and assign it on the ABAP user master. Have the assigned user complete the business transaction in the PFCG role. Read SU53 or STAUTHTRACE only after an authorization check fails. Re-baseline segregation of duties when a target transaction differs from its ECC equivalent.

## Migration Activities

- Compare ECC role authorization content against equivalent S/4HANA business roles during a conversion
- Identify transactions that were consolidated or simplified and reassess their authorization impact
- Re-run segregation of duties analysis against the S/4HANA target rather than assuming ECC results carry over

## Rollout Activities

- Extend S/4HANA business role templates to new business units with Fiori-appropriate catalog and group assignments
- Validate localized Fiori app availability matches the rollout entity's actual business processes
- Re-test segregation of duties for the expanded S/4HANA user population

## Production Support Activities

- Investigate Fiori app access issues distinguishing catalog/group problems from backend authorization problems
- Maintain SU24 data for custom S/4HANA Fiori apps
- Support ongoing segregation of duties monitoring as the S/4HANA landscape evolves

## Troubleshooting: Public Edition app is missing

Inspect App Finder or All My Apps for the user's role in SAP S/4HANA Cloud Public Edition 2608 before treating the app as missing. SAP Help says App Finder lists apps available for the user's role, while a launchpad page shows only the subset selected by the administrator. If the app is in App Finder but absent from the expected page, inspect the user's space assignment and page content in Manage Launchpad Spaces and Manage Launchpad Pages. If it is absent from App Finder, use Maintain Business Users to confirm assigned business roles, then Maintain Business Roles and IAM Information System to verify the business catalog or direct IAM app assignment and activation. Check the user's restrictions or scope only when they explain app eligibility. KBA 3499342 covers a navigation-target application with no tile. These are Fiori apps, not transactions. A missing app is not an OData authorization trace case. Source checked 2026-10-15 against SAP Help Portal, SAP Fiori Launchpad for SAP S/4HANA Cloud Public Edition 2608: App Finder and Spaces and Pages.

## Troubleshooting: Fiori app opens but a request fails

On Public Edition, reproduce the failure and inspect Display Authorization Trace for the business user; use only the failed entry and the associated business-role restriction as authorization evidence. On an on-premise or Private Edition ABAP Gateway deployment, read /IWFND/ERROR_LOG on the hub and /IWBEP/ERROR_LOG on the backend. Use the HTTP status and message to distinguish an authorization check from an inactive, unknown, or runtime service failure. Only then use SU53 or STAUTHTRACE for an authorization failure. Do not mix these deployment paths or name an authorization object that the trace did not show.

## Troubleshooting: S/4HANA SoD risk is missed

If a segregation-of-duties conflict was not detected after an ECC-to-S/4HANA change, check whether the S/4HANA transaction or app consolidated functionality differently from its ECC equivalent. Re-evaluate the ruleset function definitions against the target transaction behavior rather than assuming the ECC ruleset still covers the process.

## Troubleshooting: Private Edition or on-premise app is missing

Inspect the user's PFCG role for the relevant catalog and target mapping, then confirm the applicable space/page or classic group configuration for that release. Use /UI2/FLPCM_CUST or /UI2/FLPCM_CONF only where those transactions are available. Do not apply Public Edition IAM app checks to this deployment.

## Common Interview Questions

1. Does the authorization check mechanism differ between ECC and S/4HANA?
2. What's the role of Fiori catalogs and groups in S/4HANA security?
3. How do you design a business role for S/4HANA?
4. Why can't ECC segregation of duties rulesets be directly reused for S/4HANA?
5. What's the relationship between Fiori launchpad access and backend authorization?
6. How would you troubleshoot a Fiori tile visible but the app failing?
7. What changed in the S/4HANA data model that affects security?
8. How do you handle SU24 maintenance for custom Fiori apps?
9. What's the universal journal and why does it matter for security?
10. How would you migrate ECC roles to S/4HANA business roles?
11. What's the difference between a Fiori catalog and a Fiori group?
12. How do you validate segregation of duties for consolidated S/4HANA transactions?
13. What's your approach to re-baselining SoD analysis during an S/4HANA conversion?
14. How do you handle authorization for apps spanning multiple functional areas?
15. What's the risk of assuming ECC and S/4HANA authorization objects map one-to-one?
16. How would you design roles for a greenfield S/4HANA implementation?
17. What's your process for validating Fiori app authorization before go-live?
18. How do you handle S/4HANA security for a brownfield conversion from ECC?
19. What's the impact of simplified transactions on authorization object design?
20. How do you troubleshoot inconsistent access between two users with the same S/4HANA role?

## Tough Follow-up Questions

1. If a brownfield conversion carries over ECC roles unchanged, what specific S/4HANA risks would you check for before go-live?
2. How would you validate that a consolidated S/4HANA transaction doesn't create a new segregation of duties conflict that didn't exist in ECC?
3. What's your process for mapping Fiori catalog and group design to actual job functions rather than copying a standard template?
4. How do you handle authorization design for a custom Fiori app built on the S/4HANA platform?
5. What's the risk of Fiori launchpad personalization creating a false sense of restricted access?
6. How would you audit an S/4HANA role catalog for leftover ECC-era assumptions that no longer apply?
7. What's your strategy for validating SoD ruleset accuracy specifically for the universal journal's merged FI/CO functionality?
8. How do you handle S/4HANA security for a hybrid landscape running both ECC and S/4HANA in parallel during migration?
9. What's the risk of over-relying on Fiori catalog restrictions without validating backend authorization independently?
10. How would you explain to an auditor why S/4HANA requires a fresh SoD baseline rather than reusing ECC's?
11. What's your process for testing S/4HANA role design against both Fiori and classic SAP GUI access paths, if both are still in use?
12. How do you handle authorization object simplification when a custom Z-transaction was built against an old ECC authorization model?
13. What's the risk of S/4HANA business role design being driven purely by Fiori app availability rather than actual business need?
14. How would you validate performance impact of authorization checks in S/4HANA's in-memory architecture compared to ECC?
15. What's your strategy for role design consistency across a multi-system S/4HANA landscape with different implementation timelines?
16. How do you handle S/4HANA security governance when business teams want faster Fiori app rollout than security review allows?
17. What's the risk of authorization gaps specifically at the boundary between Fiori app access and backend OData service authorization?
18. How would you design a validation process to catch S/4HANA-specific SoD conflicts before they reach production?
19. What's your approach to documenting the ECC-to-S/4HANA authorization mapping for future audit reference?
20. How do you handle S/4HANA security for embedded analytics apps that pull data across traditionally separate authorization domains?

## SAP Transactions

PFCG, SU24, SU25, /UI2/FLPD_CUST, /IWFND/MAINT_SERVICE

## SAP Tables

AGR_1251, AGR_TCODES, USOBT_C, USOBX_C

## Best Practices

Design SAP S/4HANA Cloud Public Edition security in Maintain Business Roles from an SAP template, and assign its business catalogs and restrictions. Assign that business role in Maintain Business Users so the user can open the app. Verify access by having the assigned user perform the intended app. Activate Display Authorization Trace for that business user, let the user execute the app, and deactivate the trace. Read each check as successful, failed, or filtered, and treat a filtered check as a missing business role or an unmaintained restriction value. Confirm the business function only when that user completes the app. On Private Edition or on-premise, maintain the role in PFCG and assign it on the ABAP user master. Have that assigned user complete the business transaction in the PFCG role. Read SU53 or STAUTHTRACE only after an authorization check fails. Do not use SU24, AGR_USERS, or a BTP role collection as the Public Edition design.

## Common Mistakes

- Assuming ECC segregation of duties rulesets carry over unchanged to S/4HANA
- Designing roles around Fiori catalog access without validating backend authorization needs
- Not maintaining SU24 for custom S/4HANA Fiori apps
- Treating a visible Fiori tile as proof the underlying access is correctly configured
- Copying ECC roles directly into S/4HANA without reassessing consolidated transaction impact

## Interviewer's Hidden Expectations

Interviewers want to hear that you understand S/4HANA security as an evolution of the same authorization mechanics, not a completely different system — while also clearly articulating what specifically changed and why that requires fresh SoD analysis rather than reused ECC assumptions.

## What Makes This a 10/10 Answer

An average answer says S/4HANA security uses Fiori and PFCG. A 10/10 answer explains that the runtime mechanism is unchanged from ECC, precisely what changed — Fiori catalog and group design, transaction consolidation — and why that specifically breaks the assumption that ECC SoD rulesets can be reused as-is.

## Red Flags

- Describing S/4HANA authorization as a fundamentally different mechanism from ECC
- Not distinguishing Fiori launchpad access from backend authorization objects
- Assuming ECC segregation of duties analysis transfers directly without re-evaluation
- No mention of SU24 maintenance for custom Fiori apps
- Not knowing what the universal journal is or why it matters for security

## Keywords

S/4HANA security, Fiori catalog, Fiori group, business role, universal journal, brownfield, greenfield, segregation of duties re-baseline

## Related Topics

- s4hana-fiori.md
- s4hana-business-roles.md
- s4hana-migration.md
