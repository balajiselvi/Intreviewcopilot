# SAP Fiori Launchpad Access

## Overview

The SAP Fiori launchpad resolves which apps a user can see from role-assigned catalogs, spaces, and pages, then the backend or cloud authorization model decides what those apps may execute. A missing tile and an opened app that fails are different problems. Source checked 2026-10-21 against knowledge/fiori/fiori-security.md.

## Interview Summary

I would separate launchpad visibility from runtime authorization and keep the tool path with the edition.

## Troubleshoot launchpad visibility before runtime authorization

I would ask whether the user cannot see the app or whether the app opens and then fails. For a missing app I would stay on launchpad resolution: Public Edition Maintain Business Users, Maintain Business Roles, and Manage Launchpad Spaces; Private Edition or on-premise PFCG role, catalog, target mapping, and /UI2/FLPCM_CUST or /UI2/FLPCM_CONF. I would use Display Authorization Trace on Public Edition, or SU53 and Gateway logs on an ABAP system, only after the app opens and the evidence points to an authorization or service failure. I would validate by having the affected user find the app and complete the intended business task.

## Sources and scope

- knowledge/fiori/fiori-security.md
- SAP Learning spaces and pages material; KBA 3499342
