const fs = require("fs");
const path = require("path");

function replaceUntil(rel, marker, replacement) {
  const file = path.join("D:/My Projects/InterviewCopilot", rel);
  const text = fs.readFileSync(file, "utf8");
  const at = text.indexOf(marker);
  if (at < 0) throw new Error(`marker missing in ${rel}`);
  const head = text.slice(0, text.indexOf("## Overview"));
  const next = head + replacement + "\n" + text.slice(at);
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, next);
  fs.renameSync(tmp, file);
  console.log("updated", rel);
}

replaceUntil("knowledge/project-types/greenfield.md", "## Architecture", `## Overview

A new implementation, also called a greenfield implementation, is a new installation of SAP S/4HANA. Confirm the configuration against the SAP Best Practices content for the chosen edition. Migrate data with the SAP S/4HANA Migration Cockpit. Completed, closed, and partially closed transactional data cannot be migrated on this path. Do not quote a universal duration or a universal cost. Security confirms the authorization scope in Explore, builds and tests roles in Realize, and validates access before the Deploy go/no-go.

## Interview Summary

New implementation means a new system and a redesign. The data path is the Migration Cockpit, not Software Update Manager. Closed transactional history stays behind unless a different, verified transition path is selected.

## 30 Second Interview Answer

Use a new implementation when the target is a fresh SAP S/4HANA system. Confirm the configuration from SAP Best Practices, load selected master and open transactional data with the Migration Cockpit, and complete authorization testing before cutover. Do not promise to migrate closed history, and do not invent an 18-month duration.

## 60 Second Interview Answer

In Discover and Prepare, confirm the business case, the edition, and the landscape. In Explore, confirm fit-to-standard gaps and the authorization scope. In Realize, configure the approved scope, build roles, and complete integration and test evidence. In Deploy, rehearse the cutover, complete the go/no-go review, and run hypercare. In Run, hand the service to operations. The security workstream owns role design, build, test, cutover access checks, and hypercare triage inside those phases.

## 90 Second Interview Answer

Choose a new implementation when the organisation wants new processes and a clean core, not a one-to-one reuse of the old system. The technical method is a new software installation plus data migration. It can be a big-bang or a phased rollout, but that choice comes from the approved plan. Security does not wait until the last test cycle: confirm identity, role ownership, organizational levels, and emergency access while the process scope is still open. After go-live, hypercare handles access defects as production incidents. A redesign waits for change control.

## Source

Checked 2026-10-20. SAP Learning, Describing the Customer Transition Paths to SAP S/4HANA Cloud Private Edition: a new implementation is a new installation, also called greenfield. Data migration uses the SAP S/4HANA Migration Cockpit. Completed, closed, and partially closed transactional data cannot be migrated. https://learning.sap.com/courses/implementing-sap-s-4hana-cloud-private-edition/describing-the-customer-transition-paths-to-sap-s-4hana-cloud-private-edition_b8aa0951-21d6-44d0-b9f5-81cd24b2b8bb

`);

replaceUntil("knowledge/project-types/brownfield.md", "## Architecture", `## Overview

A system conversion is a guided one-to-one conversion of an existing SAP ERP system to SAP S/4HANA. Use Software Update Manager, or Software Update Manager with the database migration option, for that software and data-model conversion. Confirm the source release is in the supported path before the project commits. The conversion reuses the existing system, processes, and custom code, subject to simplification. It is not a consolidation of several ERP systems. Do not assume every legacy role, modification, or add-on transfers unchanged. Confirm the authorization scope, remediate what the simplification assessment changes, and complete authorization regression after the conversion.

## Interview Summary

System conversion keeps one existing ERP system and converts it. The tool is Software Update Manager, not the Migration Cockpit. Custom code and roles need an impact assessment. There is no universal 12-to-15-month duration and no universal customization percentage.

## 30 Second Interview Answer

Use a system conversion for a one-to-one move from SAP ERP to SAP S/4HANA. Confirm the supported source release, run the simplification and custom-code assessment, and use Software Update Manager for the conversion. Complete authorization regression on the critical business transactions before go-live. Do not use this path to merge several ERP systems.

## 60 Second Interview Answer

Discovery inventories the source release, add-ons, custom code, interfaces, users, roles, and emergency access. The simplification assessment shows what the target data model and applications change. Role remediation follows that evidence: retire obsolete transactions, adjust organizational values, and retest the business process. The cutover is a technical conversion window with a rehearsed sequence, a go/no-go decision, and a rollback position that the platform and the contract actually support. Do not claim every conversion can be rolled back after users have posted in the new system.

## 90 Second Interview Answer

A conversion is not a new implementation. Historical data and configuration stay in the same system identity, which is why the business-continuity risk is the downtime window and the custom-code result, not a full redesign. Security testing after conversion confirms that the assigned user can complete the maintained business transaction and that unexpected access is absent. Failed checks go to the authorization trace for that edition. Hypercare then triages access defects without widening a shared role as an unlogged fix.

## Source

Checked 2026-10-20. SAP Learning, Describing the Customer Transition Paths to SAP S/4HANA Cloud Private Edition: system conversion is a guided one-to-one conversion, for example SAP ECC to SAP S/4HANA Cloud Private Edition. The technical method is database migration and data conversion with Software Update Manager or Software Update Manager with DMO. It requires a recent source release and does not consolidate several systems. https://learning.sap.com/courses/implementing-sap-s-4hana-cloud-private-edition/describing-the-customer-transition-paths-to-sap-s-4hana-cloud-private-edition_b8aa0951-21d6-44d0-b9f5-81cd24b2b8bb

`);

replaceUntil("knowledge/project-types/bluefield.md", "## Architecture", `## Overview

Selective data transition is the SAP path between a new implementation and a system conversion. It moves selected configuration, master data, and transactional history into SAP S/4HANA. Lean Selective Data Transition, as documented by SAP, applies to SAP ERP Enhancement Package 6 or 7 moving to SAP Cloud ERP Private or on-premise, and can restrict company codes and a time slice. Confirm the target edition and the tool before naming a procedure. SAP does not certify third-party transition services, and issues from non-SAP tools are outside SAP Support. Do not describe this path as a fixed-duration bluefield programme.

## Interview Summary

Selective data transition keeps selected history and can redesign other processes. It is not a one-to-one system conversion and it is not a Migration Cockpit-only new implementation. The supported objects, company codes, and time slice come from the contracted scenario.

## 30 Second Interview Answer

Use selective data transition when the programme must keep selected history or consolidate data while still redesigning part of the process scope. Confirm whether the scenario is SAP Lean Selective Data Transition or a partner-built transition. Complete reconciliation of the selected company codes and the authorization regression before the go/no-go review. Do not promise that every third-party tool is supported by SAP.

## 60 Second Interview Answer

The decision against a new implementation is the need to retain selected history or to phase by company code. The decision against a system conversion is the need to consolidate systems or to leave obsolete data behind. Security maps the retained organizational structure to roles and retests the processes whose data actually moved. Cutover evidence is the reconciliation of the selected scope plus the access smoke test, not a claim that the whole legacy history arrived.

## 90 Second Interview Answer

Treat bluefield as a market label for this selective path, not as a separate SAP phase with its own week count. The SAP-documented lean scenario uses company-code selection and a time slice for SAP ERP Enhancement Package 6 or 7. A different edition, add-on, or partner tool can change the scope. State that limitation, then describe the governance: named data owner, named security owner, rehearsal, go/no-go, and hypercare for the processes in the migrated slice.

## Source

Checked 2026-10-20. SAP Learning, Describing the Customer Transition Paths: selective data transition selectively migrates and transforms configuration, master data, and transactional data. SAP does not certify third-party services, and issues from non-SAP tools are not covered by SAP Support. https://learning.sap.com/courses/implementing-sap-s-4hana-cloud-private-edition/describing-the-customer-transition-paths-to-sap-s-4hana-cloud-private-edition_b8aa0951-21d6-44d0-b9f5-81cd24b2b8bb
Checked 2026-10-20. SAP Support, Lean Selective Data Transition: SAP ERP Enhancement Package 6 or 7 to SAP Cloud ERP Private or on-premise, with company-code and time-slice selection. https://support.sap.com/en/alm/sap-cloud-alm/transformation/btc/transition-paths.html

`);
