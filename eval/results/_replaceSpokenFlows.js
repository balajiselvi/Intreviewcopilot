const fs = require("fs");

function replaceRange(file, startHeading, endHeading, body) {
  const text = fs.readFileSync(file, "utf8");
  const start = text.indexOf(`## ${startHeading}\n`);
  const end = text.indexOf(`## ${endHeading}\n`, start + 1);
  if (start < 0 || end < 0) throw new Error(`${file} ${startHeading} -> ${endHeading}`);
  const next = `${text.slice(0, start)}${body}\n${text.slice(end)}`;
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, next);
  fs.renameSync(tmp, file);
  console.log("range", file, startHeading);
}

const flow = `## Runtime Flow

Confirm the path before naming a tool. A new implementation is a new installation and uses the SAP S/4HANA Migration Cockpit. A system conversion uses Software Update Manager, or Software Update Manager with the database migration option, for one existing ERP system. Selective data transition uses the verified company-code and time-slice scenario. An upgrade moves the same product to a new base release. An update applies a feature or support package. A lift and shift is a system copy without a functional change. Security confirms scope in Explore, tests roles in Realize, and brings the access evidence to the Deploy go/no-go review. Do not quote a universal duration.
`;

for (const file of [
  "knowledge/project-types/greenfield.md",
  "knowledge/project-types/brownfield.md",
  "knowledge/project-types/bluefield.md"
]) {
  replaceRange(file, "Runtime Flow", "Configuration", flow);
}

replaceRange("knowledge/project-types/upgrade.md", "Overview", "Architecture", `## Overview

An upgrade moves the same SAP product to a new base release, for example SAP S/4HANA 2022 to SAP S/4HANA 2023. An update applies a feature package or support package. Neither term is a system conversion. Moving SAP ERP to SAP S/4HANA is a system conversion and uses Software Update Manager, or Software Update Manager with the database migration option. Confirm the supported source and target before the project commits. Complete custom-code and authorization regression in a sandbox before production. Do not quote a universal duration.

## Interview Summary

Upgrade means a new base release of the same product. Update means a feature or support package. System conversion means SAP ERP to SAP S/4HANA. Keep those paths separate and test authorization behaviour after the technical change.

## 30 Second Interview Answer

Name the source release, the target release, and the path. Use an upgrade for a new base release of the same product and an update for a feature or support package. Use Software Update Manager for a system conversion of one existing ERP system. Complete a sandbox proof and authorization regression before the production window. Do not call an ECC-to-S/4HANA conversion a point upgrade.

## 60 Second Interview Answer

Assessment covers add-ons, custom code, interfaces, roles, and the supported path. The sandbox proves the technical result and the business transactions. The cutover sequence has a go/no-go decision and a rollback position that the platform still supports. After users post business documents, do not claim that a technical rollback remains available. Hypercare triages authorization defects without widening a shared role as an unlogged fix.

## 90 Second Interview Answer

A lift and shift is a system copy without a functional change. It is not an upgrade and it is not a conversion. Security still retests the critical transactions because a platform move can change connectivity, identity, and the emergency-access path. The evidence for go-live is the completed regression, the open-defect decision, and the named owner for hypercare.

## Source

Checked 2026-10-20. SAP Learning, Describing the Customer Transition Paths to SAP S/4HANA Cloud Private Edition. An upgrade is a new base release. An update is a feature or support package. A system conversion is the guided one-to-one path from SAP ERP. https://learning.sap.com/courses/implementing-sap-s-4hana-cloud-private-edition/describing-the-customer-transition-paths-to-sap-s-4hana-cloud-private-edition_b8aa0951-21d6-44d0-b9f5-81cd24b2b8bb
`);

replaceRange("knowledge/project-types/migration.md", "Overview", "Architecture", `## Overview

Data movement depends on the transition path. A new implementation loads selected master data and open transactional data with the SAP S/4HANA Migration Cockpit. Completed, closed, and partially closed transactional data cannot be migrated on that path. A system conversion keeps the data in the same system identity and converts it with Software Update Manager. Selective data transition moves a verified slice, such as selected company codes and a time slice on the documented lean path. Reconcile the selected scope before the go/no-go review. Do not quote a universal duration or a universal data volume.

## Interview Summary

Name the path before naming the tool. Migration Cockpit belongs to a new implementation. Software Update Manager belongs to a system conversion. A selective path needs an explicit company-code and time-slice scope. Reconciliation is the evidence, not a claim that all history arrived.

## 30 Second Interview Answer

For a new implementation, load the approved master and open transactional data with the Migration Cockpit and leave closed history behind. For a system conversion, validate the converted data in the same system after Software Update Manager. For selective data transition, reconcile the company codes and time slice that the contract actually includes.

## 60 Second Interview Answer

Prepare the data owner, the mapping, the cleansing rule, and the reconciliation report before the first rehearsal. A failed reconciliation is a go/no-go issue, not a hypercare cleanup. Security confirms that the organizational values in the migrated data still match the role design. After cutover, hypercare investigates a balance or access defect against that evidence.

## 90 Second Interview Answer

Do not treat every legacy extract as eligible for every target. The new-implementation restriction on closed transactional data is a product rule. A partner tool that claims a wider scope is outside SAP certification unless the selected scenario says otherwise. State that boundary, then describe the rehearsal, the reconciliation owner, and the decision to continue or stop.

## Source

Checked 2026-10-20. SAP Learning, Describing the Customer Transition Paths to SAP S/4HANA Cloud Private Edition. https://learning.sap.com/courses/implementing-sap-s-4hana-cloud-private-edition/describing-the-customer-transition-paths-to-sap-s-4hana-cloud-private-edition_b8aa0951-21d6-44d0-b9f5-81cd24b2b8bb
`);
