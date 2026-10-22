# SAP Joule identity and administration

## Overview

Joule is an SAP business AI assistant. It is not an S/4HANA business role and it is not a GRC access-request workflow. Configure the authorization trust from the Joule SAP BTP subaccount to the Identity Authentication tenant in Security, Trust Configuration. Use that same Identity Authentication tenant and the same Global User ID for every application in the Joule formation. Assign the authorization for SAP-managed Joule Work through the Identity Authentication groups joule_tenant_admin, joule_analytics_admin, and joule_end_user, or through the BTP role collection when that edition uses a role collection. Do not assign an S/4HANA business role or a PFCG role as the Joule authorization.

## 30 Second Interview Answer

Configure the authorization trust from the Joule SAP BTP subaccount to the Identity Authentication tenant in Security, Trust Configuration. Use that same Identity Authentication tenant and the same Global User ID for every application in the Joule formation. Assign the authorization for SAP-managed Joule Work through the Identity Authentication groups joule_tenant_admin, joule_analytics_admin, and joule_end_user, or through the BTP role collection when that edition uses a role collection. Do not assign an S/4HANA business role or a PFCG role as the Joule authorization.

## Joule Work groups

Configure the authorization trust from the Joule SAP BTP subaccount to the Identity Authentication tenant in Security, Trust Configuration. Use that same Identity Authentication tenant and the same Global User ID for every application in the Joule formation. Assign the authorization for SAP-managed Joule Work through the Identity Authentication groups joule_tenant_admin, joule_analytics_admin, and joule_end_user, or through the BTP role collection when that edition uses a role collection. Do not assign an S/4HANA business role or a PFCG role as the Joule authorization. SAP-managed Joule Work is provisioned by SAP. In the Identity Authentication administration console, assign the documented groups. joule_tenant_admin can open Joule Admin Center. joule_analytics_admin can open Joule Analytics Center. joule_end_user is the business-user group. Confirm the edition, because customer-managed Joule and SAP-managed Joule Work do not use the same administration entry point.

## Source

Checked 2026-10-19 against SAP Help, Integrating Joule with SAP Solutions: Joule and integrated products use the same SAP Cloud Identity Services tenant and the same Global User ID. Trust is established in the BTP cockpit under Security, Trust Configuration. https://help.sap.com/doc/de3af3c0f81642dbaa4d36172ed57a72/CLOUD/en-US/79bfc83ab386450c8cd9c7937ce26a3a.pdf

Checked 2026-10-19 against SAP Help, Joule Work, User Management: groups joule_tenant_admin, joule_end_user, and joule_analytics_admin are assigned in SAP Cloud Identity Services. Joule Work features in that guide include Early Adopter Care restrictions. https://help.sap.com/doc/525677ed302148a4b7cc9988321055fb/CLOUD/en-US/dc1706e63f4d443f9da2aeae83a2277e.pdf
