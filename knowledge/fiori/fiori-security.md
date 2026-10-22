# Fiori Launchpad and App Authorization

## Overview

Fiori authorization is a front-end visibility model plus a backend execution model. Which tool applies depends on the deployment. On SAP S/4HANA Cloud Public Edition, a missing app starts in Maintain Business Users and Maintain Business Roles: the assigned business role, the business catalog, the IAM Apps active flag, and the assigned launchpad space. SAP Knowledge Base Article 3499342 documents that path. Launchpad Designer, PFCG, and an ABAP trace are not the Public Edition procedure. On Private Edition and on-premise, the PFCG role must contain the catalog and the space, and the catalog must contain the tile and the target mapping. /UI2/FLPCM_CUST is client-specific and /UI2/FLPCM_CONF is cross-client.

## Design Fiori security for an S/4 rollout

Design Fiori security as launchpad visibility plus runtime authorization, and keep the administration path with the deployment. Use Maintain Business Roles to assign business catalogs, spaces, and pages on SAP S/4HANA Cloud Public Edition, then assign that business role in Maintain Business Users. Public Edition does not use PFCG, SU53, or /UI2/FLPCM_CUST. Maintain the catalog and target mapping in /UI2/FLPCM_CUST or /UI2/FLPCM_CONF on Private Edition and on-premise, and assign the catalog and space in the PFCG role. A missing app is a catalog, space, page, or role-assignment problem. An app that opens and then fails is a runtime authorization problem. Inspect Display Authorization Trace on Public Edition only after the app opens and a check fails. Use transaction SU53 on an ABAP system only to read the last failed authorization check, and do not treat that display as proof that access succeeded. Validate the design by having the assigned user complete the intended business task in the app.

## Interview Summary

A business role in S/4HANA is not just a composite of single roles. It must include the catalog or space assignment that exposes apps and the runtime authorization required by the app's services and business logic. The implementation differs between Public Edition and customer-managed ABAP systems; designing only PFCG menus does not cover the launchpad and service layers.

## 30 Second Interview Answer

I would split Fiori security into launchpad visibility and runtime authorization. In Public Edition, business roles, catalogs, spaces, and pages control app availability; in customer-managed ABAP deployments, the corresponding launchpad content and PFCG role apply. Runtime service checks depend on OData version: V2 may use IWSG/IWSV and S_SERVICE defaults; V4 uses G4BA with S_START. CDS DCL and application checks protect business data and actions. I would first identify the failing layer and then use evidence from that layer.

## 60 Second Interview Answer

The launchpad content model depends on edition and release. Public Edition uses business roles with catalogs and spaces/pages. Customer-managed ABAP systems may use groups on older releases or spaces/pages on newer releases; catalog and space assignments are made through the launchpad content tools and PFCG. Confirm the target release instead of saying groups disappeared everywhere.

For an app that opens but fails, identify its OData version and deployment before adding service authorizations: V2 and V4 use different service authorization models, and application-specific checks still apply. Copying a GUI role and expecting the Fiori service and data checks to work is a common conversion defect.

Troubleshooting uses the launchpad content manager and backend traces differently. /IWFND/ERROR_LOG and STAUTHTRACE tell you about failed service calls. They will not explain a missing space assignment.

Trade-off: one fat catalog is easy to assign and terrible to certify. Fine-grained catalogs map better to job functions and SoD but explode maintenance. I would align catalogs to process areas and let business roles assemble them, not the other way around.

## Architecture

- Business catalog: tiles and target mappings
- Space and page: user-facing navigation
- PFCG role: catalog assignment plus OData plus objects
- OData runtime: applicable V2 IWSG/IWSV and S_SERVICE, or V4 G4BA and S_START, plus application checks
- SU24: authorization defaults for applicable ABAP services and transactions; not a universal cloud or V4 configuration step

## Common Defects

- Tile visible, 403 or no data — backend or DCL/CDS access
- No tile — catalog or space not on the user
- App works in GUI, fails in Fiori — service missing from role
- Custom app with no SU24 — empty proposals, manual objects, drift at upgrade

## Deployment model

Verified 2026-10-13. Do not use one transaction for every S/4HANA deployment.

On SAP S/4HANA Cloud Private Edition and on-premise, launchpad content has two layers. Transaction /UI2/FLPCM_CONF is the cross-client configuration layer. Transaction /UI2/FLPCM_CUST is the client-specific customizing layer, and client-specific changes supersede configuration. Spaces and pages are maintained in the Manage Launchpad Spaces and Manage Launchpad Pages apps, then assigned to a PFCG role. Spaces and pages do not grant authorization. A tile the user is not authorized to start is hidden. Groups can still exist on older on-premise releases. Spaces and pages are the recommended layout in newer on-premise releases, not a universal replacement that deletes groups. Source: SAP Learning, Managing Content on the SAP Fiori Launchpad, Implementing SAP S/4HANA Cloud Private Edition; SAP Learning, Creating SAP Fiori Spaces and Pages.

On SAP S/4HANA Cloud Public Edition, customers do not use /UI2/FLPCM_CUST, PFCG, or Launchpad Designer. Spaces and pages are assigned from the business role in Maintain Business Roles, using Manage Launchpad Spaces and Manage Launchpad Pages. If the catalog is assigned and the app is still missing, KBA 3499342 says to check the IAM Apps tab and whether the application category is a direct application or only a navigation target. SAP Note 3401525 describes the spaces migration and the Manage Launchpad Settings parameters SPACES and SPACES_ENABLE_USER. The note text available here does not say that every new tenant has group mode removed. Confirm the parameter on the tenant. Source checked 2026-10-13: SAP Learning, Managing Spaces and Pages; KBA 3499342; SAP Note 3401525 title and public FAQ text.

If the tile is missing, stay on launchpad resolution for that deployment. Public Edition: Maintain Business Users, Maintain Business Roles, and Manage Launchpad Spaces. Private Edition or on-premise: the PFCG role, the catalog, the target mapping, and /UI2/FLPCM_CUST or /UI2/FLPCM_CONF. Do not start a missing tile in STAUTHTRACE or SU53. If the tile opens and a request fails on an ABAP Gateway system, read /IWFND/ERROR_LOG on the hub and /IWBEP/ERROR_LOG on the backend, and use the HTTP status and error text before any authorization trace. Use /IWFND/MAINT_SERVICE only for registration and activation. On Public Edition, the opened-app check is Display Authorization Trace, not those transactions.

## Troubleshoot a user who cannot access a Fiori app

I would first check whether the user cannot see the app or whether the app opens and then fails, because a missing app and a runtime authorization failure are different problems. I would confirm the deployment before choosing a tool, and I would not treat a Public Edition business role as the same path as an on-premise PFCG role. On Public Edition I would use Maintain Business Users and Maintain Business Roles, and I would use Display Authorization Trace only after the app opens and an authorization check fails. Public Edition does not use PFCG, SU53, or Gateway error logs for that check. On an on-premise or Private Edition system I would check the user's PFCG role, the catalog assignment, and the target mapping before looking at a runtime service error. If the app is visible but the user still fails, I would reproduce the issue and inspect the browser error and the Gateway logs in /IWFND/ERROR_LOG and /IWBEP/ERROR_LOG when that frontend and backend topology applies. I would use SU53 or STAUTHTRACE only when the log shows an authorization failure, because SU53 displays the last failed authorization check and is not proof that access succeeded. I would correct the demonstrated cause and then have the affected user complete the intended business task in the app.

## Troubleshoot Fiori access when the server is on premise

If the server is on premise, I would follow the ABAP Fiori path for the same user and app. I would check the user's PFCG role and whether that role contains the catalog and the target mapping for the app. A missing app is a launchpad content or role-assignment problem, so I would not start with an authorization trace. If the app opens and the user still gets an error, I would reproduce it and inspect the browser error and the Gateway logs in /IWFND/ERROR_LOG and /IWBEP/ERROR_LOG according to the actual frontend and backend topology. I would not assume every system uses a hub. I would use SU53 or STAUTHTRACE only when that log shows an authorization failure, and SU53 shows the last failed check rather than proof of success. I would correct the demonstrated cause and have the affected user complete the intended business task.

## Fiori app missing from the launchpad

When the app is missing, I would check the user's role assignment and the launchpad content before any runtime log. On Public Edition I would use Maintain Business Users and Maintain Business Roles and confirm the catalog, space, and page. On an on-premise system I would check the PFCG role, the catalog, and the target mapping. I would not use SU53 to explain a missing app, because that display is the last failed authorization check after a request has already run. I would validate by searching the launchpad as the affected user and confirming the app is available for the intended business task.

## Fiori app opens and returns an authorization error

When the app opens and then returns an authorization error, I would reproduce the failure as the affected user and read the error text before changing a role. On Public Edition I would use Display Authorization Trace and correct only the failed authorization or restriction evidence. On an on-premise system I would inspect /IWFND/ERROR_LOG and /IWBEP/ERROR_LOG, then use SU53 or STAUTHTRACE only if the log shows an authorization failure. I would correct that demonstrated cause and have the user complete the intended business task. SU53 is not proof that the task succeeded.

## Public Edition troubleshooting: app is missing

First ask the user to search App Finder or All My Apps in SAP S/4HANA Cloud Public Edition 2608. SAP Help says App Finder lists apps available for the user's role, while a launchpad page shows only the subset selected by the administrator. If the app is in App Finder but absent from the expected page, inspect the role's space assignment and page content in Manage Launchpad Spaces and Manage Launchpad Pages. If it is absent from App Finder, use Maintain Business Users to confirm the user's assigned business roles, then Maintain Business Roles and IAM Information System to verify the business catalog or direct IAM app assignment and activation. Check restrictions or scope only if they explain the app's eligibility. KBA 3499342 also covers a navigation-target application with no tile. These are Fiori apps, not transactions. A missing app is not an OData authorization trace case; use Display Authorization Trace only after the app opens and a runtime authorization check fails. Do not use PFCG, SU53, STAUTHTRACE, SICF, or Gateway transactions in Public Edition. Source checked 2026-10-15 against SAP Help Portal, SAP Fiori Launchpad for SAP S/4HANA Cloud Public Edition 2608: App Finder and Spaces and Pages.

If the app opens but a request fails with an authorization error, reproduce the issue and inspect Display Authorization Trace for the affected business user. Correct only the failed authorization or restriction evidence shown there; a missing-tile symptom should not be routed to this trace. If the app or required catalog is not available in the tenant's delivered content, confirm the tenant release and app availability, then escalate with the app ID, user, role, timestamp, and reproduction details instead of attempting backend service activation.

Sources checked 2026-10-14: SAP Help, Maintain Business Roles (2608), IAM Information System (2608), Details View for Spaces (2608), Step by Step: Create a New Space and Page for a Business Role (2608), and IAM Administration Apps Reference Table (2602).

## Custom Fiori app: design, build, secure, and deploy

For a custom SAP Fiori app in S/4HANA Cloud Public Edition 2608, configure the RAP service by defining its CDS model in ADT, exposing it with a service definition and OData service binding, and defining the UI with `@UI` annotations. This on-stack developer-extensibility path requires a three-system landscape; where that prerequisite or use case does not fit, choose a supported key-user or side-by-side BTP extension for the app. Create the Fiori elements app with SAP Business Application Studio and SAP Fiori tools. Use BAS's supported deployment task to deploy the UI to the SAPUI5 ABAP Repository; create the IAM app, launchpad target mapping, and business catalog. Assign the catalog and space in Maintain Business Roles, then assign the business role to the user in Maintain Business Users; protect reads with CDS DCL and enforce business actions with application checks. Validate service binding preview, deployed app launch, role assignment, and user-context access. Do not use PFCG, SEGW, `/IWFND/MAINT_SERVICE`, SU53, or STAUTHTRACE as the Public Edition procedure.

For an ABAP Cloud/RAP service, model the business data in CDS in ABAP Development Tools (ADT), define the service in a service definition, expose it with an OData service binding, and use `@UI` annotations for Fiori elements. Test the service in the service-binding editor and use Fiori elements preview before building the UI. SAP S/4HANA Cloud Public Edition 2608 documents this service-definition/service-binding path; do not assume `@OData.publish: true` or `SEGW` is the right path for a new RAP service. For an existing OData V2 service in a customer-managed Gateway deployment, check registration/activation in `/IWFND/MAINT_SERVICE`; that transaction does not diagnose runtime errors. OData V4 is managed as a service group; use the service binding and Gateway V4 administration tools supported by that release. The V4 authorization check is `S_START` for `G4BA` service-group objects, not the OData V2 `S_SERVICE` rule.

Build or adapt the SAPUI5/Fiori elements UI with SAP Business Application Studio and SAP Fiori tools, using the system destination and service selected for the project. Choose a deployment supported by the target architecture: the SAPUI5 ABAP Repository for an ABAP-hosted app, or the HTML5 Application Repository on SAP BTP Cloud Foundry for a side-by-side app. BAS generates the deployment configuration and `npm run deploy` uses the configured deployment task; do not prescribe `SE80` or direct BSP editing as the standard current workflow. For S/4HANA Public Edition extensibility, follow the tenant's released ABAP Cloud and deployment path rather than assuming private-system administration access.

Keep launchpad visibility separate from runtime authorization. In Public Edition, publish the supported IAM app and business catalog, assign the catalog and space/page through the business role, and assign that role to the business user. In Private Edition/on-premise, maintain the app descriptor/target mapping and business catalog in the launchpad content tools, then assign the catalog/space and authorizations through PFCG. The exact runtime service authorization depends on OData version and deployment: V2 uses the applicable `IWSG`/`IWSV` and `S_SERVICE` service defaults; V4 uses service-group object `G4BA` with `S_START`. CDS DCL filters authorized read data; write operations and business actions also need their application-specific authorization checks. Name a specific business authorization object only when the service implementation or trace confirms it.

Validate each boundary independently: service binding preview and metadata/response; app preview and deployed app launch; target mapping/launchpad content; assigned business role; then a user-context test for both permitted and denied data/actions. For a Public Edition authorization failure use Display Authorization Trace. For ABAP Gateway use the matching hub/backend error log first and trace the authorization check only when the log indicates that layer. `/IWFND/MAINT_SERVICE`, SICF, `/IWFND/V4_ADMIN`, PFCG, and ABAP traces apply only to the relevant customer-managed ABAP deployment and release. A missing tile, a failed OData request, and an unauthorized business operation are distinct failure points.

Sources checked 2026-10-15: [SAP Help, defining an OData service for S/4HANA Cloud Public Edition 2608](https://help.sap.com/docs/ABAP_Cloud/abap-rap/defining-odata-service?locale=en-US&state=PRODUCTION&version=s4hana_cloud); [SAP Help, developer extensibility for S/4HANA Cloud Public Edition 2608](https://help.sap.com/docs/SAP_S4HANA_CLOUD/6aa39f1ac05441e5a23f484f31e477e7/7ea7276c89a644d9867bf0f8627aed67.html?version=LATEST); [SAP Help, side-by-side extensibility for S/4HANA Cloud Public Edition 2608](https://help.sap.com/docs/SAP_S4HANA_CLOUD/2bba750d1e124e1ea2a039bb1cd9b6c5/2a17a3e1525f4f46a9c5156bd2d3bc87.html?locale=en-US); [SAP Help, SAP Fiori tools and Fiori elements in Business Application Studio](https://help.sap.com/docs/bas/developing-sap-fiori-app-in-sap-business-application-studio/developing-sap-fiori-applications-with-sap-fiori-tools-f09752ebcf63473e9194ea29ca232e56); [SAP Help, deploying an application from Business Application Studio](https://help.sap.com/docs/bas/developing-sap-fiori-app-in-sap-business-application-studio/deploying-application); [SAP Help, OData V4 security enhancements](https://help.sap.com/docs/r/68bf513362174d54b58cddec28794093/202310.latest/en-US/c6dd838722ce4b8d9cc4a0741d93d864.html); [SAP Help, CDS access control](https://help.sap.com/docs/abap-cloud/abap-data-models/cds-authorization-concept).

## Related Topics

- knowledge/s4hana/s4hana-fiori.md
- knowledge/s4hana/s4hana-business-roles.md
- knowledge/security/pfcg.md
- knowledge/troubleshooting/authorization-errors.md
