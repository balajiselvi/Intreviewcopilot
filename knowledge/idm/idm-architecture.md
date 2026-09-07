# Identity Lifecycle Architecture for SAP Landscapes

## Overview

Identity architecture for a Principal SAP IAM role is the design of how a person becomes a user, how their access follows business responsibility, and how that access is removed when the responsibility ends. Products are building blocks. The architecture is the split of responsibilities across HR, identity, provisioning, target authorization, and governance.

## Interview Summary

A defensible landscape separates four concerns. Authentication answers who the user is. Authorization answers what they can do in each application. Provisioning answers how identity and assignments are created, changed, and removed. Governance answers whether the access is appropriate, risky, approved, certified, or privileged. Mixing those four into one product narrative is how answers become a tool catalogue.

## 30 Second Interview Answer

I would start from the business event, not from a product list. A joiner, mover, or leaver changes what the enterprise needs that person to do. HR or the identity source records the new attributes. Provisioning maps those attributes to the access model of each target. Governance checks risk where the landscape requires it. Authentication then lets the right person in. IAS, IPS, IAG, GRC, and PFCG only appear where they actually own one of those steps.

## 60 Second Interview Answer

For a hybrid or RISE landscape I would draw the chain like this.

HR — often SuccessFactors — is the usual system of record for employee status, org assignment, and manager. That is not authorization. It is the event and the attributes.

IAS is typically the SAP-facing identity provider: federation to a corporate IdP, SSO, MFA, session policy. IAS does not decide S/4 business roles.

IPS is the provisioning engine: source connectors, transformations, target connectors, scheduling or event jobs. IPS can assign groups or role collections that it is configured to assign. It does not invent SoD policy.

IAG or GRC Access Control sits on governance: Access Analysis, access request, certification, privileged access. In many designs a mover still needs a risk check or an access request when attribute-driven assignment is not enough.

The target application still enforces access. S/4HANA uses business roles and PFCG. BTP uses role collections and scopes. SAC uses teams and content permissions. Datasphere uses spaces and privileges. If those models are wrong, perfect IPS jobs still provision the wrong thing.

I would not assume Azure AD, Okta, or SAP IDM unless the question or the candidate landscape actually names them. A corporate IdP is common; the name is a design choice.

## 90 Second Interview Answer

The Principal-level design decision is where business authorization policy lives.

If policy is “department plus job code maps to a business role,” IPS transformations can drive a large share of joiner and mover traffic. That is fast and auditable if mappings are owned, tested, and reconciled.

If policy is “access is requested and approved against SoD,” IAG or GRC Access Request is the control plane, and IPS or the GRC provisioning layer executes the approved result. That is slower and better for high-risk access.

Most enterprises need both: birthright access from attributes, and requested access for exceptions, finance-sensitive functions, and firefighter.

Identity correlation is the silent failure point. The same person must be matched across HR, the IdP, IAS, S/4 user master, BTP, and analytics. Employee ID, email, and login name collisions produce duplicate accounts, leftover access after a mover, and failed leavers. Architecture without a correlation key is not an identity architecture.

Trade-off: fully automated movers reduce stale access and ticket volume; they also automate mistakes if HR data is wrong. I would rather put quality gates on HR attributes and a reconciliation report than pretend provisioning can compensate for bad org data.

## Architecture Building Blocks

1. Business event: join, move, leave, contractor start/end, rehire
2. Source of truth: HR and/or corporate directory
3. Identity correlation key
4. Authentication: corporate IdP and/or IAS
5. Provisioning: IPS, SAP IDM, or GRC provisioning — depending on landscape
6. Target authorization models
7. Governance: IAG and/or GRC
8. Reconciliation and audit

## Responsibilities

- HR owns organizational facts, not SAP transaction codes
- IAM owns correlation, authentication policy, and provisioning design
- Application security owns role catalogs and authorization objects
- GRC/IAG owns risk rules, request, certification, PAM
- Operations owns job monitoring, failed provisions, and emergency access during incidents

## Related Topics

- knowledge/idm/idm-provisioning.md
- knowledge/btp/ips.md
- knowledge/btp/ias.md
- knowledge/iag/iag-overview.md
- knowledge/security/role-design.md
