# Sarbanes–Oxley and SAP Security Controls

## Overview

The Sarbanes–Oxley Act of 2002 is a United States statute. Section 404 requires management assessment of internal control over financial reporting (ICFR) and an accompanying auditor attestation for the issuers that the statute covers. Other SOX sections create different obligations, such as officer certification, and must not be collapsed into a single generic “SOX control.” SAP Security and GRC can support IT general controls and access evidence used in an ICFR program. Installing GRC does not make an organization SOX-compliant. Source checked 2026-10-21: 15 U.S.C. § 7262 (SOX Section 404), https://www.law.cornell.edu/uscode/text/15/7262; SAP Access Control and Process Control product documentation for the control and evidence mechanisms.

## Interview Summary

I would prepare SAP Security for a SOX ITGC audit by showing how joiner-mover-leaver, approvals, SoD, privileged access, access reviews, and change evidence operate for in-scope financial systems. I would not claim that GRC installation equals compliance.

## Prepare SAP Security for a SOX ITGC audit

I would start from the in-scope financial processes and the ITGCs the auditors will test: access provisioning and deprovisioning, access approval, segregation of duties, privileged and emergency access, periodic user and role certification, and change management for roles and transports. For Access Control I would show the connector landscape, risk analysis results, mitigated versus open conflicts, access-request history, Firefighter logs with controller review, and completed access reviews. For role and authorization changes I would retain the transport evidence, profile generation and user comparison evidence where the ABAP system uses PFCG, and the business sign-off that the user can complete the intended financial task. Process Control can document and test the related controls when that product is in the control library, but a Process Control process is not the same object as a mitigation control. I would validate readiness with a sample population, evidence completeness, exception logs, and remediation ownership, and I would state that auditors test operating effectiveness over the period, not merely that a workflow exists. Source checked 2026-10-21: 15 U.S.C. § 7262; SAP Access Control and Process Control 12.0 documentation.

## Distinguish design effectiveness from operating effectiveness

I would separate control design from operating evidence. Design effectiveness asks whether the approved control would prevent or detect the risk if it operated as designed. Operating effectiveness asks whether the control actually operated over the audit period for a complete population or a justified sample. For SAP access, design may be the MSMP path, SoD ruleset, and Firefighter procedure. Operating evidence is the request history, risk analysis runs, mitigation reviews, FF log reviews, and certification completion for that period. A configured rule with no completed reviews is not operating evidence. Source checked 2026-10-21: ICFR practice framed against Section 404 management assessment obligations in 15 U.S.C. § 7262; SAP Access Control evidence artifacts.
