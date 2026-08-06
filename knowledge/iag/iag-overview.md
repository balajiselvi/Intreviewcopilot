# SAP Cloud Identity Access Governance (IAG)

## Overview

SAP Cloud Identity Access Governance is a cloud-native access governance service running on SAP Business Technology Platform (BTP). It provides similar capabilities to on-premise SAP GRC Access Control — access risk analysis, access requests, and access certification — but as a cloud service rather than an ABAP add-on installed on an ECC/S4 system. It is not a drop-in replacement for on-premise GRC Access Control; organizations commonly run both, connected through an integration bridge, especially during a phased move to the cloud.

## Interview Summary

IAG covers the same governance ground as classic GRC Access Control — segregation of duties analysis, access requests, certification — but is delivered as a BTP service and is built to govern a hybrid landscape: on-premise ABAP systems and cloud applications from a single, centralized platform. It integrates with SAP Identity Authentication Service (IAS) for authentication, which is a meaningfully different architecture from on-prem GRC's direct RFC/ABAP connector model.

## 30 Second Interview Answer

SAP Cloud IAG is the cloud-native counterpart to SAP GRC Access Control. It has five core services — Access Analysis, Role Design, Access Request, Access Certification, and Privileged Access Management — running on BTP instead of as an ABAP add-on. It's built for hybrid landscapes, governing both on-premise and cloud applications from one place, and it authenticates through SAP Identity Authentication Service rather than classic ABAP logon.

## 60 Second Interview Answer

SAP Cloud IAG delivers the same governance functions organizations know from GRC Access Control — SoD risk analysis, access requests with embedded risk checks, and periodic access certification — but as a cloud service on SAP BTP rather than an ABAP add-on on the backend system.

It's explicitly positioned for hybrid landscapes: a single platform that governs access to both on-premise SAP systems and cloud applications, which matters as more of the landscape moves to S/4HANA Cloud, BTP extensions, and non-SAP SaaS tools that classic GRC was never designed to reach cleanly.

Authentication runs through SAP Identity Authentication Service, not the ABAP logon model GRC Access Control relies on, so trust and connectivity are set up differently — through IAS trust configuration and BTP destinations rather than RFC connections alone.

Because it doesn't replace on-premise GRC outright, organizations that already have GRC Access Control typically connect the two through an integration bridge so risk analysis and access requests can span both cloud and on-premise systems during the transition period, rather than running two disconnected governance processes.

## 90 Second Interview Answer

SAP Cloud IAG is SAP's cloud-native evolution of access governance, covering the same core ground as GRC Access Control — access risk analysis, access requests, and access certification — but delivered as a BTP service rather than an ABAP add-on on the backend.

The five core services are Access Analysis (continuous, dashboard-driven risk evaluation), Role Design (business-role definition that can span multiple systems), Access Request (self-service requests with embedded SoD risk checks before approval), Access Certification (periodic access review campaigns), and Privileged Access Management (governance for emergency/elevated access, conceptually parallel to EAM/Firefighter in GRC).

The architectural difference that actually matters in an interview is the deployment model: IAG is not something you install on the ECC or S/4HANA system — it's a cloud service that reaches into the landscape. Authentication is IAS-driven rather than classic ABAP logon, and it's explicitly designed to govern a hybrid landscape — on-premise systems and cloud applications — from a single platform, which is the gap classic on-prem GRC has with pure cloud and non-SAP SaaS applications.

SAP is explicit that IAG doesn't replace GRC Access Control outright. In practice, organizations that already run GRC Access Control connect it to IAG through an integration bridge, so risk analysis and access requests can span both environments rather than maintaining two separate governance silos during a cloud transition. I'd treat "when do you retire on-prem GRC versus run both" as a real design decision, not a foregone conclusion — it depends on how much of the landscape has actually moved to cloud.

## Architecture

- Deployment: cloud service on SAP BTP, not an ABAP add-on on the backend system
- Authentication: SAP Identity Authentication Service (IAS), not classic ABAP logon
- Five core services: Access Analysis, Role Design, Access Request, Access Certification, Privileged Access Management
- Coexistence model: connects to on-premise GRC Access Control via an integration bridge rather than replacing it outright
- Scope: governs both on-premise SAP systems and cloud/non-SAP applications from one platform

## Configuration

- Master data setup (business processes, risks, rule content) has to be configured before Access Analysis and Access Request produce meaningful results — this is conceptually similar to ruleset/BRF+ setup in on-prem GRC, but configured through the IAG service itself rather than SPRO
- IAS trust configuration underlies authentication into IAG
- Connectivity from IAG to on-premise systems for risk analysis and provisioning is established through BTP-based connectivity, distinct from the direct RFC destinations used by on-prem GRC Access Control

## Implementation Activities

- Assess whether the target state is IAG-only, GRC-only, or a bridged hybrid model, based on how much of the landscape is cloud versus on-premise
- Configure master data (business processes, risk definitions) before enabling access analysis
- Set up IAS trust and BTP connectivity for the systems in scope
- Migrate or re-author SoD ruleset content appropriate to the cloud service rather than assuming a 1:1 lift-and-shift from on-prem GRC rulesets
- Plan a coexistence period with clear ownership of which platform is the system of record for access requests during transition

## Best Practices

- Don't assume IAG is a like-for-like replacement for GRC Access Control — validate coverage against your actual on-premise and cloud footprint first
- Treat the bridge/coexistence period as a real project phase with its own governance, not an afterthought
- Align risk rule content between IAG and any remaining on-prem GRC instance so the same access doesn't get evaluated inconsistently depending on which platform processed the request

## Common Mistakes

- Assuming IAG can simply replace on-prem GRC Access Control on day one without a coexistence plan
- Underestimating the master data and rule-content setup effort, treating it as a lighter-weight version of GRC configuration
- Not accounting for the different authentication model (IAS-driven) when planning connectivity and testing

## Interviewer's Hidden Expectations

Interviewers asking about IAG are usually checking whether the candidate understands it's a cloud-native governance service with a different deployment and authentication model from classic GRC — not just "GRC but newer." They're also listening for whether the candidate treats the on-prem-to-cloud transition as a real architectural decision with a coexistence period, rather than assuming an instant cutover.

## What Makes This a 10/10 Answer

An average answer says IAG is "the cloud version of GRC." A strong answer explains the actual architectural shift — BTP-hosted service, IAS-driven authentication, five core services — and correctly frames the relationship to on-prem GRC as coexistence via an integration bridge rather than outright replacement, with a clear point of view on when each makes sense.

## Red Flags

- Describing IAG purely as "GRC in the cloud" with no architectural distinction
- Assuming a hard cutover from on-prem GRC to IAG is the norm
- No mention of IAS as the authentication mechanism
- Confusing IAG with SAP Cloud Identity Services generally (IAS/IPS), which are a different, adjacent product area

## Keywords

SAP Cloud Identity Access Governance, IAG, Access Analysis, Role Design, Access Request, Access Certification, Privileged Access Management, IAG Bridge, SAP BTP, IAS, hybrid landscape, GRC Access Control coexistence

## Sources

Content verified against the following live sources (accessed 2026-08-06); paraphrased and synthesized, not reproduced verbatim:
- [SAP Cloud Identity Access Governance (IAG) — SAPinsider](https://sapinsider.org/sap-cloud-identity-access-governance-iag/)
- [Understanding SAP Cloud Identity Access Governance Solutions — SecurityBridge](https://securitybridge.com/blog/sap-cloud-identity-access-governance-iag-an-introduction/)

Not independently verified against official SAP Help Portal documentation in this pass — recommend cross-checking against help.sap.com before treating configuration specifics (transaction codes, exact SPRO-equivalent paths) as authoritative, since the sources above are third-party summaries.
