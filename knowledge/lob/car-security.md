# SAP Customer Activity Repository Access

## Overview

SAP Customer Activity Repository application authorization is the SAP NetWeaver Application Server ABAP authorization model. Create the CAR authorization role in PFCG. Use the authorization role /POSDW/ADMINISTRATOR for administration such as deleting data. Use the authorization role /POSDW/SALES_AUDIT for daily POS inbound monitoring. Use the authorization role /POSDW/DPP_SECURITY for private and sensitive subject data. Do not treat CAR as an SAC team permission or an Ariba requisition permission.

## Interview Summary

Create the CAR authorization role in PFCG. Use the authorization role /POSDW/ADMINISTRATOR for administration such as deleting data. Use the authorization role /POSDW/SALES_AUDIT for daily POS inbound monitoring. Use the authorization role /POSDW/DPP_SECURITY for private and sensitive subject data. Copy the standard role into the customer namespace before restricting activities.

## 30 Second Interview Answer

Create the CAR authorization role in PFCG from the standard role that matches the job. Use the authorization role /POSDW/ADMINISTRATOR for administrative tasks such as deleting data. Use the authorization role /POSDW/SALES_AUDIT for daily monitoring of POS inbound data. Use the authorization role /POSDW/DPP_SECURITY only for users who must see subject-specific personal data. Assign the authorization role to the ABAP user. Confirm the user can open the intended POS transaction, such as the POS Workbench. Do not treat a SAC story permission as CAR authorization.

## Distinctions

- Application authorization is PFCG on the CAR ABAP system.
- /POSDW/ADMINISTRATOR, /POSDW/SALES_AUDIT, and /POSDW/DPP_SECURITY are different jobs.
- Personal-data access is a separate role, not a general analyst role.
- A downstream BW or SAC permission does not replace the CAR PFCG role.

## Source

Checked 2026-10-19 against the SAP Customer Activity Repository Administration Guide for release 6.0 and for 5.0 SPS07, section Authorizations and Role and Authorization Concept. https://help.sap.com/doc/6c0e30d3f38b402b8527765dff7c9c9f/6.0.0/en-US/SAP_Customer_Activity_Repository_Administration_Guide.pdf

The guide states that CAR uses SAP NetWeaver Application Server ABAP authorizations and that role maintenance uses transaction PFCG. HANA database privileges under the CAR database are a separate plane and were not re-documented in this pass.
