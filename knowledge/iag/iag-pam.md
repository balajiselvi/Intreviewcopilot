# IAG Privileged Access Management

## Product scope

IAG Privileged Access Management on the IAG Fiori launchpad. The PAM ID is created in IAG and provisioned down to the target. It is not classic GRC Emergency Access Management and not an IPS user.

## Setup sequence

1. The target application is already connected.
2. Create the reason code in the Reason Code app.
3. Create the business role that carries the emergency authorizations in Role Designer, Business Roles.
4. Open Privileged Access Management, Maintain Privileged Access. Create the PAM ID, assign that business role, the reason codes, and the approver and reviewer. Save and activate. Status stays In Process until provisioning finishes.
5. Open Administration, Job Scheduler. Schedule job category Provisioning. Confirm it in Job History. Status becomes Active when the ID exists on the target.
6. The person logs on to the target with their own user and starts the session from the PAM launchpad. SIAG_PAM_LAUNCH_PAD is that launch transaction only on SAP S/4HANA on-premise and SAP ERP, for SAP_BASIS 750 through 754. Do not name it for S/4HANA Public Cloud or for a non-ABAP application. There is no IAG object called a Network Access Node.
7. After the session, schedule Privileged Access Log Sync Job, then Privileged Access Review Request. The reviewer works the item in Privileged Access Monitoring Review Inbox. The delivered review path uses the role-owner and security stages.

## PAM ID versus a GRC firefighter ID

An IAG PAM ID is created in Maintain Privileged Access and the Provisioning job pushes it to the target. A classic GRC firefighter ID is created on the target and synchronized up into GRC EAM. Do not call the PAM ID an IAS user or an IPS-created user. IAS authenticates the person. IPS may sync identity elsewhere. Neither one is this lifecycle.

A PAM request still uses Access Request. The delivered request-type mapping is managerrolesecuritypath. The approver list shows people in the IAS group IAG_WF_MANAGER after SCI User Group Sync Job.

## Owners and controllers

Approvers and reviewers are assigned on the PAM ID. People who must appear as managers or workflow approvers have to be in IAG_WF_MANAGER in IAS, then synchronized. There is no IAG object called contours. If the transcript says contours, that word is not a product object.

## Verification

Job History shows the Provisioning job completed and the PAM ID is Active. A launch produces a session. After Privileged Access Log Sync Job and Privileged Access Review Request, the reviewer sees the item in the review inbox.

## Do not confuse

- GRC EAM: firefighter IDs maintained on the target, GRAC_EAM, repository sync up into GRC.
- IPS: creating a user and assigning a role collection is not creating a PAM ID.

## Sources

SAP Learning, Setting Up Privileged Access Management Service, Using Privileged Access Management Service, and Preparing the Setup of Privileged Access Management Service. Sessions launch only on SAP S/4HANA on-premise and SAP ERP. Note 2913548 for SAP_BASIS 750-754. KBA 2924629 for IAG_WF_MANAGER. Verified 2026-10-11. Do not recite these titles in the spoken answer.
