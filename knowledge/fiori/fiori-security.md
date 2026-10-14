# Fiori Launchpad and App Authorization

## Overview

Fiori authorization is a front-end visibility model plus a backend execution model. Which tool applies depends on the deployment. On SAP S/4HANA Cloud Public Edition, a missing app starts in Maintain Business Users and Maintain Business Roles: the assigned business role, the business catalog, the IAM Apps active flag, and the assigned launchpad space. SAP Knowledge Base Article 3499342 documents that path. Launchpad Designer, PFCG, and an ABAP trace are not the Public Edition procedure. On Private Edition and on-premise, the PFCG role must contain the catalog and the space, and the catalog must contain the tile and the target mapping. /UI2/FLPCM_CUST is client-specific and /UI2/FLPCM_CONF is cross-client.

## Interview Summary

A business role in S/4HANA is not just a composite of single roles. It must include the catalog or space assignment that exposes apps, the OData services those apps call, and the authorization objects the ABAP logic checks. Designing only PFCG menus from SAP GUI transactions produces a launchpad that does not match how users actually work.

## 30 Second Interview Answer

I would split Fiori security into visibility and execution. Spaces, pages, and catalogs decide whether a tile appears. IWSG and IWSV OData authorizations plus SU24 proposals decide whether the service call succeeds. If the tile is missing I start on the launchpad assignment. If the tile opens and fails I start on the service and object layer, not on rearranging pages.

## 60 Second Interview Answer

In current S/4HANA, spaces and pages replace groups as the way business users see apps. Catalogs still hold tiles and target mappings. The PFCG role must be assigned the catalog, and the user must receive the space. Missing either produces “I cannot find the app.”

Target mappings point at OData or WebGUI/WebDynpro. For Fiori Elements and RAP apps, the role needs the OData service group and the backend objects SU24 proposes. Copying a GUI role and expecting Fiori to work is a typical conversion defect.

Troubleshooting uses the launchpad content manager and backend traces differently. /IWFND/ERROR_LOG and STAUTHTRACE tell you about failed service calls. They will not explain a missing space assignment.

Trade-off: one fat catalog is easy to assign and terrible to certify. Fine-grained catalogs map better to job functions and SoD but explode maintenance. I would align catalogs to process areas and let business roles assemble them, not the other way around.

## Architecture

- Business catalog: tiles and target mappings
- Space and page: user-facing navigation
- PFCG role: catalog assignment plus OData plus objects
- Gateway/OData: IWSG, IWSV, service groups
- SU24: default proposals for services and T-codes behind the app

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

## Public Edition troubleshooting: app is missing

First distinguish a tile that is absent from an app that opens and then fails. These Public Edition administration interfaces are Fiori apps, not SAP GUI transactions. For an absent app in SAP S/4HANA Cloud Public Edition, check the user's assigned business role in the Maintain Business Users app. In the Maintain Business Roles app, confirm that the role includes the business catalog containing the app, any applicable restriction values, and the IAM app is active when that catalog uses IAM apps. Confirm the role's space assignment and that the assigned page contains the app and is visible; use the Manage Launchpad Spaces and Manage Launchpad Pages apps, and use IAM Information System to inspect the role-to-user/catalog/app relationships. A missing launchpad entry is not an OData authorization trace case. Do not use PFCG, SU53, STAUTHTRACE, SICF, or Gateway transactions in Public Edition.

If the app opens but a request fails with an authorization error, reproduce the issue and inspect Display Authorization Trace for the affected business user. Correct only the failed authorization or restriction evidence shown there; a missing-tile symptom should not be routed to this trace. If the app or required catalog is not available in the tenant's delivered content, confirm the tenant release and app availability, then escalate with the app ID, user, role, timestamp, and reproduction details instead of attempting backend service activation.

Sources checked 2026-10-14: SAP Help, Maintain Business Roles (2608), IAM Information System (2608), Details View for Spaces (2608), Step by Step: Create a New Space and Page for a Business Role (2608), and IAM Administration Apps Reference Table (2602).

## Related Topics

- knowledge/s4hana/s4hana-fiori.md
- knowledge/s4hana/s4hana-business-roles.md
- knowledge/security/pfcg.md
- knowledge/troubleshooting/authorization-errors.md
