# SAP Identity Management vs Cloud Identity Services

## Overview

SAP Identity Management (SAP IDM) is the on-premise identity lifecycle product. SAP Cloud Identity services — Identity Authentication (IAS) and Identity Provisioning (IPS) — are the cloud identity stack used with BTP, RISE, and most current hybrid landscapes. Interviewers for a Principal IAM/Security role are usually testing whether you can place the right product in the right layer, not whether you can recite an IDM feature list. Confusing IDM with IPS, or treating IAS as a governance engine, is a common fail.

## Interview Summary

Use SAP IDM when discussing an existing on-premise identity hub that is already in production. Use IAS for authentication, federation, and SSO. Use IPS for joiner/mover/leaver provisioning between sources and targets. Use IAG or GRC Access Control for access risk, requests, certification, and privileged access. The target application — S/4HANA roles, BTP role collections, SAC teams — still owns actual authorization.

## 30 Second Interview Answer

SAP IDM is the classic on-premise identity manager. In current cloud and RISE landscapes the same job is usually split: IAS authenticates, IPS provisions, and IAG or GRC governs access. I would not describe IPS as “the new IDM” without checking what is actually in the landscape. Many enterprises still run IDM, a corporate IdP such as Entra ID, or both, with IAS federating and IPS syncing.

## 60 Second Interview Answer

The architectural question is which system is the identity source, which system authenticates, which system provisions, and which system governs.

SAP IDM can be source, provisioning engine, and workflow in one on-premise stack. Cloud Identity splits that. IAS is the identity provider for SAP cloud applications. IPS reads sources such as SuccessFactors or a corporate directory and writes identities and group or role assignments into targets. IAG or GRC then evaluates whether that access is acceptable.

If a customer already has a mature IDM landscape, replacing it just because they adopted RISE is a program decision, not a product slogan. Coexistence, identity correlation, and a single joiner/mover/leaver trigger matter more than the brand of the provisioning engine.

## Architecture

- On-premise: SAP IDM Identity Center, dispatchers, connectors, approval workflow
- Cloud: IAS (authenticate), IPS (provision), IAG (govern)
- Corporate IdP: often Entra ID, Okta, or similar, federated into IAS
- HR source: often SuccessFactors or SAP HCM — not the same as the target authorization model
- Target authorization: PFCG/business roles, BTP role collections, SAC/Datasphere privileges

## Distinctions Interviewers Test

- Authentication is not authorization
- Provisioning is not SoD policy
- SAP IDM is not IPS
- IAG is not IAS
- SuccessFactors as an HR source does not replace S/4 role design

## Related Topics

- knowledge/idm/idm-architecture.md
- knowledge/idm/idm-provisioning.md
- knowledge/btp/ias.md
- knowledge/btp/ips.md
- knowledge/iag/iag-overview.md
