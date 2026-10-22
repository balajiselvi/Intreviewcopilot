# SAP Activate

## Overview

SAP Activate is the implementation framework SAP publishes for SAP Cloud ERP. Use six phases in this order: Discover, Prepare, Explore, Realize, Deploy, and Run. Confirm the configuration sequence Discover, Prepare, Explore, Realize, Deploy, and Run. Do not replace Realize with an Execute phase, and do not drop Prepare or Run. In Discover, confirm the business case, the high-level scope, and the deployment choice before the project is committed. In Prepare, complete the project plan, the governance, the team onboarding, and the initial system provisioning. In Explore, confirm the fit-to-standard gaps, the extension decisions, and the authorization scope before the configuration build. In Realize, configure the solution in iterations, complete integration and test evidence, and confirm the cutover prerequisites. In Deploy, complete the production cutover, the go/no-go review, and hypercare. In Run, complete the operational handover and continue adoption. Security follows the same phases: confirm the authorization scope in Explore, build and test the roles in Realize, and validate access before the Deploy decision. Do not quote a universal duration or a universal percentage of standard processes. Those figures belong to the approved plan for that contract.

## Applicability

This phase sequence is the methodology SAP describes for SAP Cloud ERP, including RISE with SAP engagements that use SAP Activate as the framework. It is not the older ASAP sequence of business blueprint, realization, and final preparation. A customer programme can add its own stage gates, RAID log, and steering committee. Those controls do not rename the Activate phases. Deployment differences still matter: SAP S/4HANA Cloud Public Edition, SAP S/4HANA Cloud Private Edition, and an on-premise system do not share one authorization tool. Name the edition before describing role maintenance.

## Design guidance

Start from the business objective and the constraints: scope, landscape, identity, data, integrations, and the contracted operating model. In Explore, separate a fit-to-standard adoption from an extension. Record the decision, the owner, and the test that will prove it. Keep clean-core choices explicit where the product scope requires them. For security, confirm who authenticates, who provisions, who governs, and which application enforces authorization. Do not design Public Edition access in PFCG, and do not design Private Edition access only in Maintain Business Roles.

## Implementation sequence

1. Discover: confirm the scope, the success criteria, and the deployment assumption.
2. Prepare: confirm the plan, the owners, the RAID log, and the initial landscape.
3. Explore: run the fit-to-standard workshops and confirm the backlog, including authorization scope.
4. Realize: configure, integrate, and complete the test evidence in iterations.
5. Deploy: rehearse the cutover, complete the go/no-go review, execute the cutover, and run hypercare.
6. Run: hand the service to operations and continue improvement.

A slipped workstream is handled inside the phase that owns it. Reconfirm the dependency, the owner, and the decision date. Do not invent a recovery by renaming the phase.

## RISE relationship

RISE with SAP uses SAP Activate as its implementation framework. The service scope is not the same as the methodology. Before assigning a task to SAP or to the customer, read the roles-and-responsibilities document for that edition and contract. In the March 2026 roles-and-responsibilities document for RISE with SAP S/4HANA Cloud, private edition and SAP ERP, private cloud edition, an Excluded Task can be performed only by the customer. That document lists the application security concept, the design of single sign-on, the implementation of single sign-on, and integration of the customer's Active Directory or Google identity provider as Excluded Tasks. Infrastructure security is a different line and is not the same task. The same document limits what is included by system, hyperscaler, and service package. Do not state one RACI for every RISE contract.

## Interview cues

A phase question should name the six phases and the exit evidence for the phase being asked. A delivery question should name the owner, the dependency, the decision, and the validation. A "have you delivered this" question should use the confirmed SAP security and programme-management practice. Do not invent the customer, the date, the team size, or a metric. Do not withhold the phase procedure because a two-page CV omits the word Activate.

## Source

Checked 2026-10-19. SAP, SAP Activate methodology: https://www.sap.com/products/erp/activate-methodology.html — SAP describes Discover, Prepare, Explore, Realize, Deploy, and Run, and states that RISE with SAP Methodology uses SAP Activate as the framework. SAP Learning, Describing the Methodology Structure, and Utilizing the SAP Activate Implementation Methodology, describe the same six phases. Checked 2026-10-19. SAP, RISE with SAP S/4HANA Cloud, private edition and SAP ERP, PCE Roles and Responsibilities, English, v3-2026: https://www.sap.com/docs/download/agreements/product-policy/hec/roles-responsibilities/sap-s4hana-cloud-private-edition-and-sap-erp-tailored-option-roles-and-responsibilities-english-v3-2026.pdf — Excluded Tasks include BASIC_1.2.22 application security concept, BASIC_1.2.25 SSO design, BASIC_1.2.24 SSO implementation, and INFRA_1.9.02 customer identity-provider integration. BASIC_1.2.23 is a separate standard-service line for application and infrastructure security and must not be merged with the customer application-security task.
