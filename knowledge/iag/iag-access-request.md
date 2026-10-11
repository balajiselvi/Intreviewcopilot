# IAG Access Request

## Product scope

SAP Cloud Identity Access Governance, Access Request service, on SAP BTP. Current course material is IAG on the Fiori launchpad, not the IAG 1.1 HCP admin guide. This is not classic GRC Access Request Management and it is not MSMP. It is not IPS user provisioning.

## Configure the workflow

Workflow templates, paths, and stages are delivered with IAG. You do not create a workflow from a blank screen.

Open the IAG launchpad, Administration, Configuration, Business Rule, and choose Launch. Open the project IAGWorkflowBusinessRule. The decision table on RequestTypeRule maps a request type to one of the pre-delivered workflow paths. Add a row when a request type needs a different path. Activate the rules and deploy the workflow version.

Interviewers sometimes call this Maintain Business Rules or a Workflow Rules ruleset. That is this Business Rule project, not a different product and not an MSMP process. There is no IAG screen called Workflow Configuration and no Create New Workflow action.

Pre-delivered business rules can be requested from SAP under component GRC-IAG. That component is for the workflow rules. It is not the Access Analysis ruleset component.

## Workflow template

A workflow template is the stage sequence the request runs. Access Request stages include the manager and the role owner, then provisioning, with notification and escalation on the configured stages. The path actually used is the one RequestTypeRule selected.

Privileged Access uses its own path. The default PAM request-type mapping in the delivered rules is managerrolesecuritypath. Do not describe one template as if it covered both services.

## Authorization policy

In Access Request, the policy limits what a requestor can search and request: which systems, roles, users, or other entities. It is not a PFCG authorization object and not an SU53 trace. Do not invent a PFCG object because the question said authorization.

The configuration app is Authorization Policy. Create a policy set for the policy type, which is Access, Business Role, or Application/System. Add a policy, set the Request Access action, and restrict the objects by attribute. Access attributes are name, application, application type, access type, business process, and business subprocess. Business-role attributes are name, business process, business subprocess, and criticality. Application attributes are application and application type. Assign the policy set from user attributes, then activate the policy. After activation, Access Request search returns only those objects. This is not RequestTypeRule. KBA 3300664 and KBA 3195906, component GRC-IAG-AR, IAG 2.0.

## Search and trigger

Search and trigger are different.

Search is the lookup inside Access Request. The access-request policy filters which systems, roles, and users the requestor can see.

Trigger is what starts work. Submitting the request starts the workflow path. An IAS group change is picked up by the SCI User Group Sync Job. Job Scheduler starts provisioning and privileged-access log sync when those job categories are scheduled. Do not fold these into one ARM or IPS process.

## Who can raise a request

The person must exist in IAS. Map the BTP role collection that exposes Access Request to the IAS user group, and assign that group to the user. Schedule Job Scheduler category SCI User Group Sync Job so IAG sees the group. A manager can be selected only when that person is in the IAS group IAG_WF_MANAGER and the sync has run. Maintaining a manager only on the IAS employee record does not fill the request. KBA 2924629.

Then confirm the user can open Access Request, search within policy, and submit. This is authorization to start a request. It is not creating the user in IPS and not an ARM provisioning workflow.

## Verification

Submit one request type and confirm the path on RequestTypeRule is the path that opens. Submit a different request type and confirm the other path. A user missing the Access Request role collection, or a manager missing IAG_WF_MANAGER after sync, fails the corresponding check.

## Do not confuse

- Classic GRC ARM: MSMP and BRF+ on the GRC ABAP system.
- PFCG: authorization objects on the ABAP target, checked after provisioning.
- IPS: identity provisioning. It does not choose the IAG workflow path.
- IAG 1.1 admin guide: HCP user groups. Do not apply that Neo path to a BTP Cloud Foundry subaccount.

## Sources

SAP Learning, Setting Up Workflow and Business Rules. SAP Help, Configure Business Rules, document fe36875e47dc48a292ec08eff5ebaafa. KBA 2924629. SAP Learning, Synchronize User Group Data. Authorization Policy app: SAP Community, Identity Access Governance - Understanding Authorization Policies, 15 November 2025, plus KBA 3300664 and KBA 3195906 for IAG 2.0. Verified 2026-10-11. Do not recite these titles in the spoken answer.
