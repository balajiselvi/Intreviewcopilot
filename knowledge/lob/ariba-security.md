# SAP Ariba Access and Identity

## Overview

For an IAM/Security architect, SAP Ariba is a cloud procurement platform whose access model is realm-based: users, groups, and permissions live in Ariba, while authentication is typically federated through the enterprise IdP and often IAS. It is not S/4 PFCG and it is not IAG Access Analysis. Interviews test whether you keep those planes separate and how a joiner in HR becomes an Ariba buyer or approver.

## Interview Summary

Ariba authorization is group and permission-based inside the realm. Sourcing, contracts, buying, and supplier management have different permission sets. Identity usually arrives via SSO. Provisioning may be IPS, an Ariba user import, or a corporate IAM feed. SoD for create-versus-approve purchase documents is a governance concern — IAG or GRC only covers Ariba if that connector and ruleset actually exist in the landscape.

## 30 Second Interview Answer

Ariba is realm-based. Authentication is usually SAML/OIDC through the corporate IdP, often with IAS as the SAP-facing IdP. Authorization is Ariba groups and permissions inside the realm — buyer versus approver versus sourcing versus contracts. That is not PFCG and it is not a BTP role collection. IPS or an IAM feed may create the user; IAG/GRC SoD only applies if that connector and ruleset exist. Create-versus-approve on purchasing documents is the classic procurement control, and it must be designed in Ariba (and in S/4 if POs post there), not assumed from an S/4 composite.

## Procedure

1. Name the Ariba solution first. Buying, sourcing, contracts, and supplier management do not share one group catalog.
2. The person must already exist in that realm, loaded by the realm's user administration or by the IPS or IAM feed that is actually in scope.
3. Assign the group that holds the permission. That group is the authorization. It is not a PFCG role and not a BTP role collection.
4. SSO only proves identity. It does not add the group.
5. Sign in as that user and confirm the allowed task works and the separated task, such as create versus approve, does not.

### Troubleshooting: a user can sign in but cannot perform a procurement action

Separate sign-in, missing solution/action, and an error after starting the action; SSO authenticates the user but does not grant an Ariba permission. In SAP Ariba Procurement, verify that the user exists in the correct realm and inspect the profile's User Groups view or Ariba Administrator > User Manager. Confirm the group is for the relevant solution and permits this action. The version 2605 Group Descriptions table lists Purchasing User / PUR001 for Create requisitions; that does not prove approval rights or every site's purchasing-unit and custom-group rules. If the group is missing, fix its assignment through the approved realm or identity-provisioning path and retest. If it is present, capture the solution, action, document, time, and exact error, then inspect the corresponding realm or workflow configuration.

Sources checked 2026-10-14: SAP Help, *SAP Ariba Procurement Solutions Group Descriptions*, version 2605 (Purchasing User / PUR001); SAP Help, *Managing Your User Information*, version 2605 (profile group memberships and applicable solutions). A group description identifies allowed actions, not the site's full workflow configuration.

## Architecture Notes

- Authentication: SAML/OIDC federation, commonly IAS as SAP-facing IdP (not Ariba-as-IdP)
- Authorization: realm groups and permissions (buying, invoicing, contracting, sourcing, supplier)
- Procurement SoD: requester versus approver versus invoice processor — in Ariba and in S/4 if documents post there
- Provisioning: IPS/SCIM or IAM feed; correlation key must match HR person ID
- Governance: IAG/GRC only if the Ariba connector and ruleset are in scope — never assume

## Related Topics

- knowledge/btp/ias.md
- knowledge/idm/idm-provisioning.md
- knowledge/iag/iag-overview.md
