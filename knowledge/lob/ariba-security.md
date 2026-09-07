# SAP Ariba Access and Identity

## Overview

For an IAM/Security architect, SAP Ariba is a cloud procurement platform whose access model is realm-based: users, groups, and permissions live in Ariba, while authentication is typically federated through the enterprise IdP and often IAS. It is not S/4 PFCG and it is not IAG Access Analysis. Interviews test whether you keep those planes separate and how a joiner in HR becomes an Ariba buyer or approver.

## Interview Summary

Ariba authorization is group and permission-based inside the realm. Sourcing, contracts, buying, and supplier management have different permission sets. Identity usually arrives via SSO. Provisioning may be IPS, an Ariba user import, or a corporate IAM feed. SoD for create-versus-approve purchase documents is a governance concern — IAG or GRC only covers Ariba if that connector and ruleset actually exist in the landscape.

## 30 Second Interview Answer

I would not secure Ariba with PFCG. Users authenticate through the enterprise IdP, often via IAS. Inside Ariba, groups and permissions control which realm activities they can perform — creating a purchase requisition is not the same as approving it. Provisioning and SoD have to be designed explicitly; they are not inherited from S/4.

## Architecture Notes

- Authentication: SAML/OIDC federation, commonly IAS as SAP-facing IdP
- Authorization: Ariba groups and permissions in the realm
- Provisioning: IPS or IAM feed if automated; otherwise operational user admin
- Governance: only if IAG/GRC has Ariba in scope — do not assume it

## Related Topics

- knowledge/btp/ias.md
- knowledge/idm/idm-provisioning.md
- knowledge/iag/iag-overview.md
