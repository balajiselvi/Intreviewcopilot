# SAP Security workstream across the implementation

## Overview

Confirm the security workstream across the implementation lifecycle before design closes. Use the security workstream configuration as the role baseline during build. Complete the security workstream authorization test before the production window. The phases remain Discover, Prepare, Explore, Realize, Deploy, and Run.

## Plan the security workstream across Explore, Realize, and Deploy

For an SAP Activate security workstream question that names Explore, Realize, and Deploy, answer the security deliverables in those phases rather than restating the entire Activate brochure.

In Explore, lock the authorization and identity scope before build: which edition owns enforcement (Public Edition business roles versus Private Edition or on-premise PFCG), which identity planes are in scope (IAS sign-in, IPS or IDM provisioning, IAG or Access Control governance), SoD and privileged-access expectations, and the critical business processes that must prove access before go-live. Record fit-to-standard versus extension decisions that change catalogs, OData services, or restriction types.

In Realize, build and test iteratively: role and restriction design against the agreed baseline, connector and provisioning mappings, MSMP/BRF+ or IAG request paths where governance is in scope, Firefighter or PAM for logged emergency access, and integration/security test evidence for joiner-mover-leaver, SoD simulation, and negative access cases. Transport or promote only after the security quality gate for that iteration.

In Deploy, rehearse cutover with identity and authorization dependencies called out: generated or transported roles, user comparison or business-user assignment, approved assignment matrix, emergency-access path, critical-process access evidence, open security defects, and the go/no-go decision. Hypercare then classifies access failures as defect, design change, or new scope without widening shared roles without a transported fix and retest.

Do not answer a security-workstream planning question with only Discover/Prepare/Run marketing text, and do not invent a universal week count or percentage of standard processes.

## Cutover and hypercare

Before cutover, confirm generated roles, user comparison, the approved assignment matrix, and a logged emergency-access path. A go/no-go review needs the critical-process access evidence, the open-defect list, and the rollback position that the platform actually supports. After users post business documents in the converted system, a technical rollback may no longer be available. Hypercare then classifies an access failure as a defect, a design change, or new scope. A process blocker can use logged emergency access. A shared role is not widened without a transported fix and a retest.

## Source

Checked 2026-10-20. Phase names follow SAP Activate: Discover, Prepare, Explore, Realize, Deploy, and Run. https://www.sap.com/products/erp/activate-methodology.html
Transition tools follow SAP Learning, Describing the Customer Transition Paths to SAP S/4HANA Cloud Private Edition, checked 2026-10-20.
Checked 2026-10-22. Security-phase emphasis aligns with the Activate overview in `knowledge/project-management/sap-activate.md` (authorization scope in Explore, build/test in Realize, access validation before Deploy) without inventing contract-specific RACI.
