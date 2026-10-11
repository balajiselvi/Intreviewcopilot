# IAG rulesets and business roles

## Workflow determination rules

Workflow rules and Access Analysis rulesets are not the same object.

Workflow rules live in the Business Rule project IAGWorkflowBusinessRule. RequestTypeRule maps a request type to a workflow path. Pre-delivered copies are requested under component GRC-IAG. Activate the rules and deploy the workflow version. This table does not limit what a requestor can search, and it is not an Access Analysis ruleset.

## Access Analysis rulesets

Access Analysis rulesets define functions, risks, and rules. Standard content is requested from SAP under component GRC-IAG-AA. KBA 3281011 covers custom rulesets on IAG 2.0. The Rule Setup app associates a ruleset with a business function group. The app can load the SAP standard set on request, or take a file in the template that Rule Setup itself provides. Do not describe a generic risk-threshold spreadsheet. There is no screen called Ruleset Management and no action called Upload Ruleset. The exact upload control is the one in Rule Setup for that release.

Hybrid, IAG Bridge: the on-premise GRC ruleset stays the source and is synchronized with the risk-definition sync. KBA 3437714, components GRC-IAG-ACI and GRC-IAG-AA. Do not maintain a second conflicting copy by hand.

## Business roles and role-owner mapping

Business roles are maintained in Role Designer, Business Roles. The role has an Assignment Approver and a Content Approver. KBA 3353626, component GRC-IAG-RD. Those people appear in the list only after their IAS approver group is assigned and SCI User Group Sync Job has run. Content-approver groups are the IAG_RCA groups in IAS.

When Access Request submits that business role, the role-owner stage uses the assignment stored on the role. This is product configuration. Do not answer it with an employer story.

Creating the business role does not by itself start a content-approval workflow. That workflow is a separate, release-dependent activation. Do not claim it runs on every tenant.

## Verification

For a workflow rule, submit the request type and confirm the path. For an analysis ruleset, run Access Analysis or a request simulation and confirm the expected risk. For a business role, confirm the Assignment Approver and Content Approver are populated from the synced IAS groups before anyone requests the role.

## Do not confuse

- GRC ruleset upload in SPRO is the on-premise path.
- PFCG role owners are users on the ABAP target, not Role Designer approvers.
- An IPS group is not a business role.

## Sources

SAP Learning, Setting Up Workflow and Business Rules, and Creating and Maintaining Business Roles. KBA 3281011, KBA 3437714, KBA 3353626. Verified 2026-10-11. Do not recite these titles in the spoken answer.
