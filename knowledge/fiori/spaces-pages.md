# Fiori Spaces and Pages

## Overview

Spaces and pages control launchpad layout. They do not grant backend authorization by themselves. On Public Edition, spaces and pages are assigned from the business role. On Private Edition and newer on-premise releases (S/4HANA 2020+), spaces and pages are maintained in Manage Launchpad Spaces (Fiori app F2786) and Manage Launchpad Pages (Fiori app F2570) and assigned to a PFCG role; classic Groups are the legacy layout path, not the default current design. Launchpad content for catalogs and target mappings is maintained in /UI2/FLPCM_CUST (client) / /UI2/FLPCM_CONF (cross-client) with App Manager /UI2/FLPAM for technical catalogs where the release supports it. Older on-premise releases may still use groups. Source checked 2026-10-21 against knowledge/fiori/fiori-security.md, SAP Learning Managing Spaces and Pages, and SAP Note 3401525 title and public FAQ text; app IDs F2786/F2570 confirmed against SAP Fiori Apps Reference Library naming for Manage Launchpad Spaces / Pages.

## Interview Summary

I would check space and page assignment when the catalog is present but the app is still missing from the expected page.

## Configure Fiori launchpad spaces and pages on S/4HANA

To configure the Fiori launchpad layout on S/4HANA 2020+, I default to Spaces and Pages rather than classic Groups. On Private Edition or on-premise I maintain catalogs and target mappings in /UI2/FLPCM_CUST (client) or /UI2/FLPCM_CONF (cross-client), use /UI2/FLPAM for technical catalogs where the release supports it, then maintain layout in Manage Launchpad Spaces (F2786) and Manage Launchpad Pages (F2570) and assign the space on the PFCG business role. OData V2 services are activated in /IWFND/MAINT_SERVICE; OData V4 uses /IWFND/V4_ADMIN and service-group publishing — I never treat the V2 transaction as universal. Backend runtime still needs S_SERVICE / business-object authorization. On Public Edition I stay in Maintain Business Roles, Manage Launchpad Spaces, and Manage Launchpad Pages without PFCG or /UI2/FLPCM_CUST. I validate by signing on as the assigned user, confirming the app on the intended page, completing the business action, and using Display Authorization Trace or SU53 / Gateway logs only after the app opens and fails.

## Verify space and page assignment for a missing app

I would confirm whether the app is absent from the whole launchpad or only from the expected page. If App Finder or All My Apps shows the app but the page does not, I would inspect the role's space and page content. On Public Edition that work stays in Maintain Business Roles, Manage Launchpad Spaces, and Manage Launchpad Pages. On Private Edition or on-premise I would confirm the PFCG role assignment of the space after the catalog and target mapping are correct. Spaces and pages do not replace runtime authorization. I would validate by signing on as the affected user and confirming the app appears in the intended space for the business task.

## Sources and scope

- knowledge/fiori/fiori-security.md
- SAP Learning, Managing Spaces and Pages; SAP Note 3401525
