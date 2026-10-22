# Implement SAP Cloud Identity Access Governance

## Scope and deployment

Confirm the SAP Cloud Identity Access Governance tenant, Cloud Foundry environment, enabled services, connected applications, identity source, and governance objectives before configuring features. SAP's public Help documentation identifies the Cloud Foundry environment and describes Access Analysis, Access Request, Certification Review, Privileged Access Management, and Role Design as distinct services. Select only services required by the target operating model; IAG is not an ABAP add-on installed in ECC or S/4HANA.

Confirm administrator roles and identity-provider trust using the tenant's current Administration and Security Guides. Do not apply an old HCP/Neo setup guide to a Cloud Foundry tenant. Exact entitlements, role-collection names, destinations, and setup screens depend on the tenant and connected applications.

## Implementation sequence

Start with scope and ownership: identify the applications and access types to govern, the source of user and organization data, who owns risk content, which system is authoritative for access requests, and whether an existing SAP Access Control system remains in operation. Record service dependencies, data owners, approvers, provisioning boundaries, and audit-evidence requirements.

Prepare the governance master data required by the selected services, including business processes, risks, and other service-specific reference data. Reconcile identifiers and ownership before importing or synchronizing target data. In hybrid deployments, decide how IAG risk definitions relate to the connected SAP Access Control ruleset; do not assume the bridge removes the need to govern ownership or resolve inconsistent risk definitions.

Connect each target application using the integration procedure for that application and tenant. Validate connectivity, identity mapping, and the user, role, and entitlement data required by the selected IAG service. Run the applicable synchronization or administration jobs and reconcile record counts, errors, and representative identities before using the data for governance decisions.

Configure only the required services. For Access Analysis, validate the ruleset and target coverage, run a baseline, review false positives, and define remediation or mitigation ownership. For Access Request, set the request policy and approval path, including downstream provisioning where required. For Certification Review, define campaign scope, reviewers, decision handling, evidence, and follow-up. For Privileged Access Management, configure the emergency-access lifecycle and its provisioning and review controls. For Role Design, establish role ownership, approval, and maintenance where it is in scope. Their objects and workflows are not interchangeable with classic GRC Access Control MSMP.

Test end to end in a non-production tenant. Exercise representative users, targets, entitlements, risk outcomes, request types, approval paths, campaign decisions, and privileged-access cases only for the services selected. Confirm that governance-workflow completion is distinct from successful target provisioning. Resolve synchronization and rule-validation errors before production rollout; retain run results, approvals, exceptions, and reviewer evidence.

## Build a business role with Role Design

For an IAG role-building request, start with the business purpose, target applications, job function, required entitlements, process ownership, and risk criteria. In the Role Design service, use Role Designer, Business Roles to create or maintain the business role from the available application-access data, then check that the selected access matches the job function and remove unjustified access. The role can carry an Assignment Approver and Content Approver; the approver choices depend on the tenant's IAS group mapping and synchronization being in place. Review the role's risk information where that category is available in the deployed release, and remediate or mitigate identified conflicts under the applicable governance process. Do not imply that creating a role automatically starts content approval: the content-approval workflow is a separate, release-dependent activation. Assign or provision the approved role through the configured target process, then verify effective access and least privilege in each target. Role Design does not replace target-side authorization enforcement.

## SAP Access Control 12.0 bridge boundary

For a hybrid bridge scenario, use the SAP IAG Bridge Cloud integration guide for the documented SAP Access Control 12.0 on-premise, IAG Cloud Foundry, and cloud-application topology. Keep setup in IAG separate from backend SAP Access Control configuration: connectors, repository synchronization, backend authorization, and any on-premise MSMP workflow remain in the connected Access Control system. Do not answer a general IAG configuration question with the backend MSMP/BRF+ procedure. Confirm the bridge guide and supported integration scenario for the deployed release before changing either side.

## Sources and release scope

- SAP Help Portal, SAP Cloud Identity Access Governance, Cloud Foundry documentation and service/admin/integration guide index: https://help.sap.com/crawler/PRODUCTION/SAP_CLOUD_IDENTITY_ACCESS_GOVERNANCE/CLOUDFOUNDRY/en-US
- SAP Help Portal, SAP Cloud Identity Access Governance, latest discovery page: https://help.sap.com/docs/r/product/SAP_CLOUD_IDENTITY_ACCESS_GOVERNANCE/LATEST/en-US?task=discover_task
- SAP Help Portal, IAG Bridge Cloud: SAP AC 12.0 (on-premise), SAP Cloud Identity Access Governance, and Cloud Applications: https://help.sap.com/doc/5c19369f0b924946abc80242ffaa2f27/CLOUDFOUNDRY/en-US/index.html?forSiteMap=true
- SAP Help Portal, Feature Scope Description for SAP Cloud Identity Access Governance (Cloud Foundry): https://help.sap.com/doc/c9e558a81c2a4888a77889bea2c57f77/CLOUDFOUNDRY/en-US/186db62e1b9849bd9cd61121efaf7635.pdf
- SAP Help Portal, What's New for SAP Cloud Identity Access Governance, Cloud Foundry (2505 Role Design Risks category); detailed "Maintaining Business Roles" guide requires SAP ID.
- SAP Support KBAs 3353626 (Role Designer approver groups), 3281011 (IAG 2.0 custom rulesets), and 3437714 (IAG Bridge risk-definition synchronization), as recorded in `knowledge/iag/iag-rules-and-roles.md`.

Sources checked 2026-10-21. The public Help index confirms Cloud Foundry scope and the separate services, master-data setup, Administration Guide, Security Guide, bridge guide, and Role Design service. The 2505 What's New page confirms the Risks category for Role Design. Detailed Role Design and support-guides content requires SAP ID access; confirm exact operations for the tenant's release rather than inferring an approval or deployment lifecycle from the service description.
