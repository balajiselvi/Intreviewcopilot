# Fiori Spaces and Pages

## Overview

Spaces and pages control launchpad layout. They do not grant backend authorization by themselves. On Public Edition, spaces and pages are assigned from the business role. On Private Edition and newer on-premise releases, spaces and pages are maintained in Manage Launchpad Spaces and Manage Launchpad Pages and assigned to a PFCG role. Older on-premise releases may still use groups. Source checked 2026-10-21 against knowledge/fiori/fiori-security.md, SAP Learning Managing Spaces and Pages, and SAP Note 3401525 title and public FAQ text.

## Interview Summary

I would check space and page assignment when the catalog is present but the app is still missing from the expected page.

## Verify space and page assignment for a missing app

I would confirm whether the app is absent from the whole launchpad or only from the expected page. If App Finder or All My Apps shows the app but the page does not, I would inspect the role's space and page content. On Public Edition that work stays in Maintain Business Roles, Manage Launchpad Spaces, and Manage Launchpad Pages. On Private Edition or on-premise I would confirm the PFCG role assignment of the space after the catalog and target mapping are correct. Spaces and pages do not replace runtime authorization. I would validate by signing on as the affected user and confirming the app appears in the intended space for the business task.

## Sources and scope

- knowledge/fiori/fiori-security.md
- SAP Learning, Managing Spaces and Pages; SAP Note 3401525
