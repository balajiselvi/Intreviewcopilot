# SAP S/4HANA Cloud Public Edition

## What this deployment is

Verified 2026-10-13.

SAP S/4HANA Cloud Public Edition, including a RISE with SAP public-cloud subscription, is a multi-tenant software-as-a-service application operated by SAP. SAP operates the infrastructure. The customer does not manage it, does not choose the hyperscaler, does not own the virtual machines, and does not operate the database or the operating system. SAP schedules the upgrades. Extensibility uses the released public-edition model. Classic modification of SAP code is not available.

Sources:

- SAP Community, "A simplified approach to choosing between S/4HANA Public Cloud vs S/4HANA Private Cloud," published by SAP: https://community.sap.com/t5/enterprise-resource-planning-blog-posts-by-sap/a-simplified-approach-to-choosing-between-s-4hana-public-cloud-vs-s-4hana/ba-p/14311744
- SAP product page, SAP S/4HANA Cloud Public Edition as ready-to-run cloud ERP: https://www.sap.com/products/erp/s4hana.html

Source freshness is the page as read on 2026-10-13. Applicability is the current Public Edition commercial model described there. It is not a statement about a named customer tenant or a named support package.

## Configuration

Browser authorization is a business role and its business catalogs in the public-edition launchpad. The on-premise transactions PFCG, `/UI2/FLPCM_CUST`, and `/UI2/FLPCM_CONF` are not the public-edition configuration path. Identity for the launchpad is the tenant's SAP Cloud Identity Services setup when IAS is the identity provider. Confirm that setup before describing federation or MFA.

## Troubleshooting

For a user who cannot see an application in SAP S/4HANA Cloud Public Edition 2608, first search App Finder or All My Apps. SAP Help says App Finder lists apps available for the user's role, while a launchpad page shows only the subset selected by the administrator. If the app is in App Finder but absent from the expected page, inspect the user's space assignment and page content in Manage Launchpad Spaces and Manage Launchpad Pages. If it is absent from App Finder, use Maintain Business Users to confirm assigned business roles, then Maintain Business Roles and IAM Information System to verify the business catalog or direct IAM app assignment and activation. Check restrictions or scope only if they explain app eligibility. KBA 3499342 covers a navigation-target application with no tile. These are Fiori apps, not SAP GUI transactions. A missing app is not an OData trace case; use Display Authorization Trace only after the app opens and a runtime authorization check fails. Do not use STAUTHTRACE, SU53, /IWFND/ERROR_LOG, or SM59 in Public Edition. Source checked 2026-10-15 against SAP Help Portal, SAP Fiori Launchpad for SAP S/4HANA Cloud Public Edition 2608: App Finder and Spaces and Pages.

## Distinction from Private Edition

Public Edition is shared multi-tenant SaaS. Private Edition is a single-tenant system that SAP operates, with a different upgrade and extensibility model. Do not describe Public Edition as customer virtual machines on Amazon EC2, Amazon RDS, Azure SQL, Google Cloud SQL, or any other customer-managed infrastructure.
