# Fiori Catalogs and Target Mappings

## Overview

A Fiori catalog holds the tiles and target mappings that make an app resolvable on the launchpad. Catalog assignment alone does not prove the user can complete the business task. Runtime authorization still depends on the deployment. Source checked 2026-10-21 against knowledge/fiori/fiori-security.md and the SAP Learning / KBA sources recorded there.

## Interview Summary

I would treat a missing app as a catalog, space, page, or role-assignment problem before any authorization trace.

## Check catalog and target mapping for a missing Fiori app

I would confirm the deployment first. On SAP S/4HANA Cloud Public Edition I would use Maintain Business Users and Maintain Business Roles and verify the business catalog and IAM app assignment. Public Edition does not use PFCG or /UI2/FLPCM_CUST for that check. On Private Edition or on-premise I would confirm that the PFCG role contains the catalog and that the catalog contains the tile and target mapping, using /UI2/FLPCM_CUST or /UI2/FLPCM_CONF according to the client versus configuration layer. I would not start SU53 for a missing app. I would validate by searching the launchpad as the affected user and confirming the app appears for the intended business task.

## Sources and scope

- knowledge/fiori/fiori-security.md
- SAP Learning, Managing Content on the SAP Fiori Launchpad; KBA 3499342 for Public Edition missing-app checks
