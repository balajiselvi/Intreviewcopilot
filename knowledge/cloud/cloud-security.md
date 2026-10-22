# SAP Cloud Security Control Planes

## Overview

SAP cloud security is not one product. Authentication, provisioning, governance, and application enforcement are separate planes. Identity Authentication handles sign-in, federation, MFA, and session policy. Identity Provisioning synchronizes identities and assignments with SCIM-style jobs. IAG or GRC Access Control governs access risk, requests, and certifications. The target application enforces the permission. Mixing those planes is a common interview failure. Source checked 2026-10-21 against the repository identity-control-planes knowledge and SAP Cloud Identity Services learning material.

## Interview Summary

I would answer a cloud security question by naming the plane first. Who the user is belongs to IAS or the corporate IdP. How the account is created or removed belongs to IPS or the HR trigger. Whether the access is allowed belongs to IAG or GRC. What the user can execute belongs to the target product.

## Separate authentication, provisioning, governance, and enforcement

I would start by classifying the symptom. A login redirect, MFA challenge, or trust failure is an authentication problem on Identity Authentication or the corporate IdP. A user missing from the target after a joiner or mover event is a provisioning problem on IPS mappings, filters, or target write errors. An SoD conflict, access request, or certification finding is a governance problem on IAG or GRC. An authorized login that still cannot run a business action is an application authorization problem on business roles, role collections, catalogs, or product permissions. I would keep Public Edition business-role tools off classic PFCG troubleshooting, and I would not use SU53 for a pure cloud authentication failure. I would validate the chosen plane with the evidence that plane actually produces, then only cross into another plane when that evidence points there.

## Sources and scope

- SAP Learning, Introducing SAP Cloud Identity Services.
- Repository knowledge: knowledge/idm/identity-control-planes.md, knowledge/btp/ias.md, knowledge/btp/btp-security.md.
- This file is the plane map. Product-specific procedures stay in the owning product files.
