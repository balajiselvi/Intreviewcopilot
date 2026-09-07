# Fiori Launchpad and App Authorization

## Overview

Fiori authorization is a front-end visibility model plus a backend execution model. Catalogs, spaces, and pages control what the user sees. OData service authorizations and classic objects control what the app can do. This file is the launchpad and service layer; backend role mechanics still sit in PFCG and SU24.

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

## Related Topics

- knowledge/s4hana/s4hana-fiori.md
- knowledge/s4hana/s4hana-business-roles.md
- knowledge/security/pfcg.md
- knowledge/troubleshooting/authorization-errors.md
