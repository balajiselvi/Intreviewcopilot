# SAP S/4HANA Cloud Private Edition

## What this deployment is

Verified 2026-10-13.

SAP S/4HANA Cloud Private Edition is a single-tenant system. SAP operates the infrastructure. The customer does not manage the servers, the database, or the hyperscaler, and does not run the system as hardware in their own data center. It is not a hyperscaler appliance such as AWS Outposts, Azure Stack, or Google Anthos. Compared with Public Edition, Private Edition keeps a broader extensibility model and a customer-influenced upgrade window. The customer remains responsible for application configuration, business roles, and integrations.

Sources:

- SAP Community, "A simplified approach to choosing between S/4HANA Public Cloud vs S/4HANA Private Cloud," published by SAP: https://community.sap.com/t5/enterprise-resource-planning-blog-posts-by-sap/a-simplified-approach-to-choosing-between-s-4hana-public-cloud-vs-s-4hana/ba-p/14311744
- SAP product page, Private Edition as private-cloud ERP with the extensibility of an on-premise deployment: https://www.sap.com/products/erp/s4hana.html
- SAP Help, Conversion Guide for SAP S/4HANA 2025, moving a system into the SAP S/4HANA private cloud environment: https://help.sap.com/doc/8cec006e962a46049506bc10ed64f557/2025/en-US/CONV_PE2025.pdf

The conversion guide describes two relevant paths. One converts first and then uses a lift-and-shift into an SAP data center or an infrastructure-as-a-service provider. The recommended combined path, DMOVE2S4, converts the system, moves the database to SAP HANA when required, and relocates the system into SAP's private cloud environment or an infrastructure-as-a-service provider. A RISE contract provisions the skeleton system and the migration server. Those statements are from the 2025 conversion guide. They do not describe customer-owned Outposts hardware.

## Configuration

Authorization design can use PFCG and the Fiori launchpad content manager because Private Edition keeps that extensibility. Confirm the actual release and whether spaces or groups are active before naming a transaction. Identity for browser access is still a separate decision: corporate identity provider, SAP Cloud Identity Services, or both. Do not treat the private-cloud operating model as the identity design.

## Troubleshooting

A missing application is a launchpad-content check, not a backend authorization trace. On Private Edition the customer can use PFCG and the launchpad content manager. Confirm the release. /UI2/FLPCM_CUST is the client-specific catalog, space, page, and target-mapping layer. /UI2/FLPCM_CONF is the cross-client layer. The PFCG role must contain the catalog and the space, or the group on a release that still uses the classic homepage. SAP Note 3401525 parameters SPACES and SPACES_ENABLE_USER decide whether spaces are active. Do not start with a cache clear. Program /UI2/INVALIDATE_CLIENT_CACHES, from SE38, applies only after the assignment is correct and the symptom is a stale client cache. If the app opens and a request fails, read /IWFND/ERROR_LOG on the Gateway hub and /IWBEP/ERROR_LOG on the backend, then use the HTTP status and error text. Use /IWFND/MAINT_SERVICE only to confirm the service is registered and activated. Use STAUTHTRACE or SU53 only when that log shows an authorization failure. Do not name an authorization object the trace did not return. A failed conversion or move is a Software Update Manager and migration-server problem, not this authorization sequence.

## Distinction from Public Edition

Private Edition is single-tenant and is operated for one customer. Public Edition is multi-tenant SaaS, and the customer does not choose its infrastructure. Do not answer a Private Edition question with EC2, RDS, Outposts, Azure Stack, or Anthos as the product architecture.
