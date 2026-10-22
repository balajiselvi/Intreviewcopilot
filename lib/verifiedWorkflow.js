/**
 * Deterministic delivery for a verified technical procedure.
 *
 * One record set, one scorer, one renderer. A high-margin match answers
 * without a model call. Open questions, experience questions, and close
 * scores fall through to the existing single generation.
 */

const EXPERIENCE_ASK = /\b(have you|did you|your experience|tell me about a time|walk me through a time)\b/i;
const { explicitProductTopics } = require("./interviewContext.js");

const WORKFLOWS = [
  {
    id: "iag-general-implementation",
    product: "IAG",
    service: "SAP Cloud Identity Access Governance implementation",
    broadFallback: true,
    sourceFiles: ["knowledge/iag/iag-implementation.md"],
    task: [
      ["configure", 3],
      ["implement", 3],
      ["set up", 3],
      ["main steps", 4],
      ["implementation", 3],
      ["iag", 2],
      ["identity access governance", 3]
    ],
    steps: [
      "I would start by confirming the tenant's Cloud Foundry environment, enabled IAG services, target applications, identity source, governance requirements, and whether SAP Access Control remains in scope.",
      "Prepare the required master data, including business processes and risks, then connect the target applications and validate identity mapping and synchronized user, role, and entitlement data.",
      "Select services to match the requirement: Access Analysis for risk evaluation, Access Request for governed requests and routing, Certification Review for periodic decisions, Privileged Access Management for emergency access, and Role Design when business-role lifecycle is in scope.",
      "Configure each selected service using the tenant's current Cloud Foundry Administration and service guides. Keep IAS authentication, IAG governance, target authorization, and downstream provisioning as separate responsibilities.",
      "In a hybrid SAP Access Control 12.0 bridge, validate the documented IAG Bridge topology and keep cloud IAG setup separate from backend connectors, synchronization, authorization, and any MSMP/BRF+ workflow that remains in Access Control.",
      "Test representative identities, target data, risk outcomes, request paths, review decisions, privileged-access cases, and downstream provisioning in non-production; retain synchronization results, exceptions, approvals, and audit evidence."
    ],
    validation: "Confirm that each selected service produces the expected governance result and separately verify the resulting access or provisioning on its target.",
    boundary: "IAG service configuration is not the connected SAP Access Control MSMP/BRF+ configuration.",
    contrast: "For IAG, I confirm the Cloud Foundry environment, governance master data, target applications, and required services before configuring only the services needed for that landscape."
  },
  {
    id: "iag-analysis-ruleset",
    product: "IAG",
    service: "Access Analysis",
    intent: "implement",
    sourceFiles: ["knowledge/iag/iag-access-analysis.md"],
    excludeAny: ["troubleshoot", "diagnose", "diagnostic", "failed", "failure", "synchronization error", "why does", "why is"],
    requireAny: ["ruleset", "rule setup", "upload", "download", "update", "configure", "set up", "implement", "standard", "cloud risk", "risk content", "maintain", "access analysis", "risk analysis", "access risk"],
    task: [
      ["analyze access risk", 5],
      ["analyse access risk", 5],
      ["access risk analysis", 5],
      ["risk analysis", 4],
      ["ruleset", 4],
      ["rule setup", 4],
      ["grc-iag-aa", 4],
      ["risk definition", 3],
      ["risk-definition", 3],
      ["access analysis", 3]
    ],
    steps: [
      "For Access Analysis risk rules, open Administration > Rule Setup in the IAG launchpad. This is separate from Access Request workflow business rules and GRC MSMP.",
      "For a bulk update, select the Business Function Group to export, or select ALL for the complete ruleset, and choose Download File. Edit the downloaded ZIP contents using the structure documented in its Readme.txt.",
      "In Rule Setup, browse to the edited rules ZIP, select the Business Function Group, and choose Upload & Process. Wait for Processing Status, then inspect the Processing Log and Validation Log; correct validation errors before publishing the ruleset.",
      "Associate the target system with the applicable business function group, then run Access Analysis and confirm the expected functions and risks. Use the job-management app documented for that tenant's Cloud Foundry release: newer releases expose Manage Jobs, while older guides call it Job Scheduler. Do not assume the older label is universal; this release-dependent job terminology does not change the ruleset upload steps.",
      "For SAP-delivered standard content, request the ruleset through SAP Support under component GRC-IAG-AA. In a hybrid bridge landscape, synchronize on-premise GRC risk definitions with the Risk Definition Sync job; cloud rulesets are requested separately."
    ],
    validation: "After processing, review Processing Status, the Processing Log, and the Validation Log for the uploaded ruleset before relying on the new risk content.",
    boundary: "Do not confuse Access Analysis risk rules with Access Request workflow routing.",
    contrast: "Access Analysis risk content is maintained in Rule Setup or delivered by SAP under GRC-IAG-AA."
  },
  {
    id: "iag-workflow-determination",
    product: "IAG",
    service: "Access Request",
    sourceFiles: ["knowledge/iag/iag-access-request.md"],
    requireAny: ["configure", "configuring", "set up", "setup", "implement", "workflow", "template", "requesttyperule", "business rule"],
    task: [
      ["access request", 4],
      ["requesttyperule", 5],
      ["iagworkflowbusinessrule", 5],
      ["workflow template", 5],
      ["business rule", 4],
      ["request type", 3],
      ["template", 3],
      ["workflow", 2]
    ],
    steps: [
      "IAG Access Request uses SAP Workflow service for approval stages and SAP Business Rules to select the workflow path.",
      "Start with the delivered workflow templates. In Administration, use Template Upload if the templates are not available, then inspect them in Maintain Workflow Template. Customize a template only when the delivered stage sequence does not meet the policy; stages can include Manager, Role owner, and Security, and risk analysis or remediation can be made mandatory when required.",
      "For request-type routing, open Administration, Configuration, Business Rule, then Launch. In project IAGWorkflowBusinessRule, inspect RequestTypeRule and map each request type to its intended workflow path/template.",
      "Activate the business rule and deploy the workflow version.",
      "Test representative request types and verify the selected path, approval stages, required risk/remediation actions, and final request status. Validate downstream provisioning separately after approval; it is not the workflow-routing decision."
    ],
    boundary: "This is not MSMP and not Rule Setup. RequestTypeRule chooses a path. It does not limit what the requestor can search.",
    contrast: "Workflow determination maps a request type to a path in RequestTypeRule."
  },
  {
    id: "iag-certification-review",
    product: "IAG",
    service: "Certification Review",
    sourceFiles: ["knowledge/iag/iag-implementation.md"],
    requireAny: ["configure", "set up", "implement", "campaign", "certification review", "periodic access review", "access reviews", "review campaign"],
    task: [["periodic access review", 5], ["access review", 5], ["certification", 5], ["campaign", 4], ["certification review", 5], ["review campaign", 5]],
    steps: [
      "First define the certification scope from the identities, connected applications, and access types that the review is intended to cover.",
      "Configure the campaign and assign reviewers who are independent and accountable for the access decisions; confirm that the selected users and access records are present in IAG before launch.",
      "Test the reviewer flow in non-production, including certify, revoke, delegate or exception outcomes that the tenant supports, and define how unresolved decisions are escalated.",
      "Launch the campaign, monitor completion and exceptions, retain reviewer decisions and evidence, and route removals or corrections through the configured downstream process. Verify the target access change separately."
    ],
    validation: "Reconcile campaign scope and completion, inspect unresolved decisions and evidence, and independently verify any resulting target-access changes.",
    boundary: "Certification Review is an IAG governance service; it is separate from IAS sign-in controls and SAP Access Control approval routing.",
    contrast: "IAG Certification Review is a scoped access recertification campaign with accountable reviewer decisions and retained evidence."
  },
  {
    id: "iag-role-design",
    product: "IAG",
    service: "Role Design",
    intent: "implement",
    sourceFiles: ["knowledge/iag/iag-rules-and-roles.md", "knowledge/iag/iag-implementation.md"],
    requireAny: ["configure", "set up", "implement", "build", "create", "role designer", "role design", "business role", "how would you"],
    excludeAny: ["public edition", "private edition", "differ", "difference", "versus", "pfcg roles", "maintain business roles"],
    task: [["build roles", 5], ["build role", 5], ["create roles", 5], ["create role", 5], ["role design", 5], ["role designer", 4], ["business role", 3]],
    steps: [
      "Define the business role's purpose, target applications, job function, required access, business-process ownership, and risk criteria before building it.",
      "In Role Designer, Business Roles, create or maintain the role from the available application-access data. Review the included entitlements against the job function and remove access that is not justified.",
      "Where the tenant uses role approvers, maintain the Assignment Approver and Content Approver on the role and confirm the required IAS approver-group mapping and synchronization have populated them; content approval is a separate, release-dependent workflow and role creation alone does not start it.",
      "Review the role's risk information where the tenant release exposes it, then remediate conflicts or use an approved mitigation before the role proceeds through the configured approval process."
    ],
    validation: "After any configured approval, assign or provision through the supported target process and confirm role contents, applicable approvers, risk disposition, and least-privilege effective access with a representative user in each target.",
    boundary: "IAG business-role design does not replace target-side authorization enforcement or classic PFCG role administration.",
    contrast: "I build IAG business roles in Role Designer, Business Roles, and validate the resulting access in the connected target systems."
  },
  {
    id: "iag-access-control-bridge",
    product: "IAG",
    service: "IAG Bridge Cloud",
    sourceFiles: ["knowledge/iag/iag-implementation.md"],
    requireAll: ["IAG", "Access Control"],
    task: [["integrate", 4], ["integration", 4], ["bridge", 5], ["access control 12.0", 5], ["interact", 4]],
    steps: [
      "Start from the SAP Help IAG Bridge Cloud integration guide for the SAP Access Control 12.0 on-premise, IAG Cloud Foundry, and cloud-application scenario; confirm that it matches the deployed releases and intended governance scope.",
      "Agree which system owns each access-governance process and which target applications and access types are in scope, then validate the required connectivity, identities, and synchronized risk or access data described by that bridge scenario.",
      "Keep IAG service configuration in the cloud separate from Access Control backend setup. Maintain backend connectors, repository synchronization, and any MSMP/BRF+ workflow that remains in Access Control on the ABAP system.",
      "Test risk and request flows across the bridge in non-production, trace failures to the cloud service, bridge/integration, backend workflow, or target provisioning layer, and retain evidence from each system."
    ],
    validation: "Verify the documented bridge flow end to end and confirm that an approved request actually provisions in its target; workflow completion alone is not proof of provisioning.",
    boundary: "The bridge does not make IAG configuration and Access Control MSMP configuration the same procedure.",
    contrast: "IAG Bridge Cloud connects SAP Access Control 12.0 on-premise, IAG Cloud Foundry, and supported cloud applications under the documented integration scenario."
  },
  {
    id: "iag-request-policy",
    product: "IAG",
    service: "Access Request",
    task: [
      ["authorization policy", 5],
      ["search scope", 4],
      ["access-search", 4]
    ],
    whenAll: [["requestor", "search", 6], ["policy", "iag", 4], ["requestor", "find", 5]],
    steps: [
      "An authorization policy in IAG Access Request limits which systems, roles, users, or other entities a requestor can search and request.",
      "Open the Authorization Policy app. Create a policy set for Access, Business Role, or Application/System. Add a policy with the Request Access action and restrict the objects by attribute.",
      "Assign the policy set from user attributes and activate the policy. Access Request search then returns only those objects.",
      "It is not a PFCG authorization object and it is not the approval path. Verify by signing in as the requestor."
    ],
    boundary: "The table that maps a request type to an approval path is a different object and is not this policy.",
    contrast: "An authorization policy filters the requestor's search. It does not choose the approval path."
  },
  {
    id: "iag-search-trigger",
    product: "IAG",
    service: "Access Request",
    requireAll: ["search", "trigger"],
    task: [
      ["search", 2],
      ["trigger", 2]
    ],
    steps: [
      "Search is the lookup the requestor uses. An authorization policy filters what that lookup returns.",
      "Trigger is what starts work: submitting the request, the SCI User Group Sync Job, or a Job Scheduler category such as Provisioning.",
      "A search does not provision anything. A trigger does not decide which entities the requestor is allowed to see."
    ],
    boundary: "Do not treat the search screen as the job that creates the user or the role.",
    contrast: "Search is a filtered lookup. Trigger is the submit or the job that starts work."
  },
  {
    id: "iag-pam-setup",
    product: "IAG",
    service: "Privileged Access",
    sourceFiles: ["knowledge/iag/iag-pam.md"],
    task: [
      ["privileged access", 4],
      ["pam id", 4],
      ["maintain privileged access", 5],
      ["pam", 3]
    ],
    steps: [
      "Confirm the target application is connected.",
      "Create the reason code in the Reason Code app.",
      "Create the business role that carries the emergency authorizations in Role Designer.",
      "Open Privileged Access Management, Maintain Privileged Access. Create the PAM ID, assign the business role, the reason codes, and the approver and reviewer. Save and activate. Status stays In Process.",
      "Schedule job category Provisioning and confirm it in Job History. Status becomes Active when the ID exists on the target.",
      "The person logs on to the target with their own user and opens the PAM launchpad. SIAG_PAM_LAUNCH_PAD is the launch transaction only on SAP S/4HANA on-premise and SAP ERP. Do not name it for S/4HANA Public Cloud or a non-ABAP application.",
      "After the session, schedule Privileged Access Log Sync Job and Privileged Access Review Request. The reviewer uses Privileged Access Monitoring Review Inbox."
    ],
    boundary: "The PAM ID is created in IAG and provisioned down. It is not an IPS user and not a firefighter ID created on the target.",
    contrast: "An IAG PAM ID is created in Maintain Privileged Access and pushed down by the Provisioning job."
  },
  {
    id: "grc-firefighter",
    product: "GRC",
    service: "Emergency Access Management",
    intent: "implement",
    task: [
      ["firefighter", 4],
      ["grac_spm", 5],
      ["emergency access", 3]
    ],
    excludeAny: ["cannot launch", "can't launch", "unable to launch", "approved emergency", "what do you validate", "does not launch"],
    steps: [
      "Create the firefighter ID on the target system.",
      "Assign the firefighter role and the owner on that ID.",
      "The user launches with GRAC_SPM or /GRCPI/GRIA_EAM, gives a reason, and works under the firefighter ID.",
      "Repository sync brings the ID and the log up into GRC.",
      "The controller reviews the log in the GRC workflow."
    ],
    boundary: "This ID is not created in IAG Maintain Privileged Access.",
    contrast: "A GRC firefighter ID is created on the target and synchronized up into GRC."
  },
  {
    id: "grc-firefighter-launch-troubleshooting",
    product: "GRC",
    service: "Emergency Access Management launch failure",
    intent: "troubleshoot",
    sourceFiles: ["knowledge/grc/eam.md"],
    task: [
      ["firefighter", 4],
      ["emergency session", 5],
      ["emergency access", 3],
      ["grac_spm", 5]
    ],
    requireAny: ["cannot", "can't", "unable", "does not", "doesn't", "fail", "launch", "validate", "inspect", "troubleshoot"],
    steps: [
      "Confirm the Firefighter assignment and approval are active for that user and Firefighter ID, including validity dates and owner or controller assignment on the ID.",
      "Verify the user is launching with GRAC_SPM or /GRCPI/GRIA_EAM against the intended target connector, and that the Firefighter ID still exists on the target with the expected elevated role.",
      "Inspect reason-code and session prerequisites, then check repository synchronization so GRC and the target agree on the ID, assignment, and log configuration.",
      "Reproduce with a known-good Firefighter user on the same connector to separate a user-specific assignment defect from a connector, sync, or launchpad defect."
    ],
    validation: "A successful launch still requires the later controller log review; do not treat launch success alone as closed emergency-access control evidence.",
    boundary: "Do not answer a launch failure by recreating the Firefighter ID unless the ID is missing or invalid on the target.",
    contrast: "For a Firefighter who cannot launch an approved emergency session, I validate assignment, target ID and role, launch transaction, and repository sync before redesigning EAM."
  },
  {
    id: "grc-msmp-route-mapping-troubleshooting",
    product: "GRC",
    service: "MSMP initiator rule and route mapping",
    intent: "troubleshoot",
    sourceFiles: ["knowledge/grc/msmp.md", "knowledge/grc/brf-plus.md"],
    requireAny: ["wrong path", "route mapping", "rule_result", "initiator rule"],
    task: [
      ["wrong path", 5],
      ["route mapping", 5],
      ["rule_result", 5],
      ["initiator rule", 4],
      ["follows the wrong path", 5]
    ],
    steps: [
      "First distinguish an initiator rule from an agent rule: an initiator rule selects the MSMP path, while an agent rule resolves the approver at a stage. A returned value by itself does not prove that the intended path was selected.",
      "Inspect the BRF+ function and decision-table result for the actual request attributes, then verify that each returned RULE_RESULT is declared and mapped to the intended path in Maintain MSMP Workflows. Check the process initiator and route-mapping configuration as well as the generated MSMP version; do not change the stage's agent rule to correct a path-selection defect.",
      "Reproduce with representative requests for each result and inspect Request Status, Instance Status, the selected path, stage, and audit log. If the path is correct but the approver is wrong or absent, then trace the stage's separate BRF+ agent determination."
    ],
    validation: "Confirm each test request selects the expected MSMP path and reaches the intended stage in Request Status > Instance Status; verify approver resolution separately.",
    boundary: "Path selection belongs to initiator/routing logic; stage approver resolution belongs to agent determination.",
    contrast: "For an MSMP request that takes the wrong path, I trace the initiator result and route mapping before changing stage-agent configuration."
  },
  {
    id: "iag-owners",
    product: "IAG",
    service: "Access Request",
    task: [
      ["workflow manager", 5],
      ["controller", 4],
      ["controllers", 4],
      ["owners", 4],
      ["owner assignment", 4],
      ["employee record", 4],
      ["reviewer", 3],
      ["approver", 3],
      ["who approves", 3]
    ],
    steps: [
      "Owners and controllers in IAG are approvers and reviewers assigned on the object, such as the PAM ID or the business role.",
      "People who must appear as managers or workflow approvers go into the IAS group IAG_WF_MANAGER.",
      "Run SCI User Group Sync Job. Until it runs, those people do not appear in the approver list.",
      "There is no IAG object called contours. If the transcript says contours, treat it as controllers."
    ],
    boundary: "A manager stored only on the IAS employee record is not automatically an IAG workflow approver.",
    contrast: "IAG approvers come from IAG_WF_MANAGER after SCI User Group Sync Job."
  },
  {
    id: "iag-role-owner",
    product: "IAG",
    service: "Role Designer",
    sourceFiles: ["knowledge/iag/iag-rules-and-roles.md"],
    task: [
      ["assignment approver", 5],
      ["content approver", 5],
      ["role owner", 4],
      ["role designer", 3]
    ],
    whenAll: [["business role", "approver", 6], ["role", "approvers", 5]],
    steps: [
      "Open Role Designer and the business role.",
      "Assignment Approver is the person who approves who receives the role.",
      "Content Approver is the person who approves what the role contains. That person comes from the IAS group IAG_RCA after SCI User Group Sync Job.",
      "Saving the business role does not start a content-approval workflow by itself."
    ],
    boundary: "These two fields are not the Access Request path and not a PFCG owner.",
    contrast: "A business role has an Assignment Approver and a Content Approver."
  },
  {
    id: "iag-requestor",
    product: "IAG",
    service: "Access Request",
    task: [
      ["raise an access request", 5],
      ["raise a request", 4],
      ["who can raise", 4]
    ],
    whenAll: [["submits", "access request", 5], ["raise", "access request", 5]],
    steps: [
      "The person needs a user in Identity Authentication.",
      "Map the IAS group to a BTP role collection that exposes the Access Request app. The exact collection name is release-dependent, so do not invent one.",
      "Run SCI User Group Sync Job so IAG sees the group.",
      "The person can then open Access Request and search within the authorization policy."
    ],
    boundary: "Being a manager in the IAS employee record does not by itself grant Access Request.",
    contrast: "A requestor is an IAS user whose group is mapped to the Access Request role collection and synchronized."
  },
  {
    id: "s4-public-cloud-role",
    product: "S/4HANA",
    service: "Public Cloud identity",
    intent: "implement",
    task: [
      ["maintain business roles", 5],
      ["restriction type", 4],
      ["public cloud", 3],
      ["public edition", 3]
    ],
    whenAll: [["public cloud", "business role", 5], ["public edition", "business role", 5]],
    excludeAny: ["differ", "difference", "versus", "vs", "private edition", "iag", "role designer"],
    requireAny: ["maintain", "configure", "set up", "implement", "assign", "restriction"],
    steps: [
      "On S/4HANA Public Cloud, open Maintain Business Roles.",
      "Add the business catalogs the job needs, then set the restriction types.",
      "Assign the business role in Maintain Business Users.",
      "PFCG and SU24 remain the on-premise and private-cloud tools. Do not describe them as the public-cloud procedure."
    ],
    boundary: "A business catalog is not a PFCG role.",
    contrast: "Public Cloud authorizations are business roles and restrictions."
  },
  {
    id: "s4-public-vs-private-roles",
    product: "S/4HANA",
    service: "Public versus Private Edition authorization",
    intent: "either",
    sourceFiles: ["knowledge/s4hana/s4hana-security.md", "knowledge/rise/rise-security.md"],
    requireAny: ["differ", "difference", "versus", "vs", "compared", "comparison"],
    task: [
      ["public edition", 4],
      ["private edition", 4],
      ["business role", 3],
      ["pfcg", 3]
    ],
    whenAll: [["public", "private", 5], ["business role", "pfcg", 5]],
    steps: [
      "On S/4HANA Cloud Public Edition, authorization is designed as business roles with business catalogs and restriction types in Maintain Business Roles, then assigned in Maintain Business Users.",
      "On Private Edition and on-premise, PFCG remains the role-and-authorization design tool, with SU24 proposals and classic authorization objects; launchpad spaces may still be assigned on the PFCG role.",
      "Do not design Public Edition access in PFCG, and do not treat Maintain Business Roles as the Private Edition substitute for PFCG."
    ],
    validation: "Name the edition before describing the admin surface; identity planes (IAS/IPS) remain separate from either authorization tool.",
    boundary: "IAG business-role governance is a separate cloud service; it is not the S/4 Public Edition Maintain Business Roles procedure.",
    contrast: "Public Edition uses business roles and restrictions; Private Edition and on-premise still use PFCG for authorization design."
  },
  {
    id: "sf-rbp",
    product: "SuccessFactors",
    service: "Role-based permissions",
    intent: "implement",
    task: [
      ["role-based permission", 5],
      ["rbp", 3],
      ["manage permission roles", 5],
      ["permission group", 3]
    ],
    whenAll: [["successfactors", "permission", 5]],
    excludeAny: ["remains unavailable", "still unavailable", "cannot", "can't", "does not", "doesn't", "what do you inspect", "troubleshoot"],
    steps: [
      "Open Manage Permission Roles and grant the permissions.",
      "Open Manage Permission Groups and define who the role applies to.",
      "Assign the role to that group.",
      "Set the target population separately. A permission group is not the target population."
    ],
    boundary: "SSO does not grant these permissions.",
    contrast: "SuccessFactors RBP is a permission role, a permission group, and a target population."
  },
  {
    id: "sf-rbp-unavailable-troubleshooting",
    product: "SuccessFactors",
    service: "Role-based permissions troubleshooting",
    intent: "troubleshoot",
    task: [
      ["successfactors", 4],
      ["permission", 3],
      ["rbp", 3],
      ["target population", 4]
    ],
    requireAny: ["unavailable", "cannot", "can't", "does not", "doesn't", "granted", "inspect", "troubleshoot"],
    steps: [
      "Confirm the permission is present on the assigned permission role and that the user is a member of the linked permission group.",
      "Inspect the target population separately from the permission group; a correct group membership still fails when the person or object is outside the target population.",
      "Check whether the action depends on an additional RBP permission, employee status, or proxy or admin context that the role does not grant.",
      "Have the user sign out and back in after the RBP change, then retest the exact unavailable action rather than a different menu path."
    ],
    validation: "Separate SSO authentication success from RBP authorization; sign-in alone does not prove the permission and target population are correct.",
    boundary: "Do not answer an unavailable-action symptom by redesigning RBP from scratch unless role, group, or target-population evidence is missing.",
    contrast: "When a SuccessFactors permission is granted but the action stays unavailable, I inspect role, group membership, and target population before changing SSO."
  },
  {
    id: "btp-role-collection",
    product: "BTP",
    service: "Authorization",
    intent: "implement",
    task: [
      ["role collection", 5],
      ["role template", 3]
    ],
    excludeAny: ["does not take effect", "doesn't take effect", "not take effect", "isolate trust", "troubleshoot"],
    steps: [
      "Start from the role template the application provides.",
      "Create a role from that template, then put the role in a role collection.",
      "Configure trust to the identity provider.",
      "Assign the role collection to the user or to an IAS group.",
      "The user must sign in again before the new collection applies. A destination's authentication is a separate setting."
    ],
    boundary: "Assigning an IAS group does not replace the role collection assignment.",
    contrast: "BTP authorization is role template, role, role collection, trust, then assignment."
  },
  {
    id: "btp-role-collection-mapping-troubleshooting",
    product: "BTP",
    service: "Role collection trust and mapping",
    intent: "troubleshoot",
    sourceFiles: ["knowledge/cloud/identity-federation.md", "knowledge/btp"],
    task: [
      ["role collection", 5],
      ["idp group", 4],
      ["trust", 3]
    ],
    requireAny: ["does not", "doesn't", "not take effect", "isolate", "troubleshoot", "mapping", "mapped"],
    steps: [
      "Confirm the subaccount trust points at the intended identity provider and that the assertion or token still carries the expected group claim after sign-in.",
      "Compare the IdP group name with the role-collection mapping attribute exactly, including case and nested-group behavior the IdP emits.",
      "Verify the role collection contains the application role derived from the required role template, then have the user sign in again so the new collection is issued.",
      "Separate destination authentication failures from authorization mapping; a destination client secret does not grant a missing role collection."
    ],
    validation: "Retest the denied application action after a fresh sign-in and confirm the issued role collections for that user in the BTP cockpit.",
    boundary: "Creating a new role collection is not the first response when trust or group mapping evidence already explains the miss.",
    contrast: "When a BTP role collection mapped to an IdP group does not take effect, I isolate trust, group claim mapping, role-collection contents, and re-login before redesigning roles."
  },
  {
    id: "arm-request-to-provision",
    product: "GRC",
    service: "Access Request Management end-to-end",
    intent: "implement",
    sourceFiles: ["knowledge/grc/arm.md", "knowledge/grc/msmp.md"],
    requireAny: ["from submission", "submission through", "end-to-end", "end to end", "through target provisioning", "access request management"],
    task: [
      ["from submission", 5],
      ["target provisioning", 5],
      ["access request management", 5],
      ["arm", 4],
      ["submission", 3]
    ],
    whenAll: [["submission", "provisioning", 6], ["access request", "target provisioning", 6]],
    excludeAny: [
      "stuck",
      "no approver",
      "troubleshoot",
      "msmp",
      "brf",
      "sod",
      "so d",
      "ruleset",
      "baseline",
      "role analysis",
      "configure an msmp",
      "maintain msmp"
    ],
    steps: [
      "A requester or manager submits the Access Request for create, change, or terminate access; the request type must enforce risk simulation before approval routing.",
      "ARA simulates the requested access against the ruleset so SoD conflicts are visible before approval; risk owners or mitigating controls enter only when the policy requires them.",
      "MSMP routes the request through the configured paths and stages, with BRF+ agent determination selecting approvers for each stage.",
      "After final approval, the provisioning framework assigns the technical roles through the target connector; approval alone is not proof the target received the access."
    ],
    validation: "Confirm Request Status, Instance Status, and provisioning logs, then verify the target assignment. On ABAP targets, reconcile with the user-role assignment evidence rather than stopping at workflow completion.",
    boundary: "ARM is not direct PFCG assignment and is not IAG Access Request RequestTypeRule routing.",
    contrast: "ARM takes an access request from submission through ARA risk simulation, MSMP/BRF+ approval, and connector provisioning with a retained audit trail."
  },
  {
    id: "brm-business-role-lifecycle",
    product: "GRC",
    service: "Business Role Management lifecycle",
    intent: "implement",
    sourceFiles: ["knowledge/grc/brm.md"],
    requireAny: ["brm", "business role", "lifecycle", "governed"],
    task: [
      ["brm", 5],
      ["business role lifecycle", 5],
      ["business role", 3],
      ["technical role", 3]
    ],
    whenAll: [["business role", "lifecycle", 6], ["brm", "design", 5]],
    excludeAny: ["stale", "troubleshoot", "isolate"],
    steps: [
      "Define business roles in business language from agreed job functions, then map each business role to the correct underlying single, derived, or composite technical roles.",
      "Validate the mapping against actual technical role content and SoD expectations before requesters use the business role in ARM.",
      "Govern changes through BRM maintenance so technical role redesigns update the business-role mapping; retire business roles that no longer represent an active job function."
    ],
    validation: "Prove that an ARM request for the business role provisions the intended technical roles and that the business name still matches the access granted.",
    boundary: "BRM mapping is not PFCG role design itself and not IAG Role Designer.",
    contrast: "In BRM I govern business-role definitions and their technical-role mappings so ARM requesters pick job-function names while provisioning still assigns the underlying PFCG roles."
  },
  {
    id: "brm-stale-technical-mapping-troubleshooting",
    product: "GRC",
    service: "Business Role Management mapping drift",
    intent: "troubleshoot",
    sourceFiles: ["knowledge/grc/brm.md"],
    requireAny: ["stale", "mapping", "technical role", "isolate", "approved", "brm"],
    task: [
      ["brm", 5],
      ["business role", 4],
      ["technical role", 4],
      ["stale", 4],
      ["mapping", 3]
    ],
    whenAll: [["business role", "technical role", 5], ["brm", "stale", 6]],
    steps: [
      "Compare the approved business role in BRM with its current technical-role mapping and with the technical roles that actually exist on the target after the change.",
      "Determine ownership: BRM owners maintain the business-to-technical mapping; PFCG or role admins own the technical role content; ARM only consumes the mapping at request time.",
      "If the business role was approved but the technical role is stale or missing, correct the BRM mapping or the transported technical role, then re-test provisioning through that business role.",
      "Do not treat an Access Control certification sync or an IAG Role Designer change as the first explanation for a BRM mapping defect."
    ],
    validation: "Re-request or re-provision via the business role and confirm the target technical assignments match the intended job function.",
    boundary: "A certification Authorization Sync issue is a different symptom from BRM mapping drift after a technical role change.",
    contrast: "When a BRM business-role change is approved but the technical role is stale, I isolate mapping ownership between BRM and the technical role maintainers before redesigning ARM."
  },
  {
    id: "hana-analytic-privilege-design",
    product: "HANA",
    service: "Analytic privilege least-privilege design",
    intent: "implement",
    sourceFiles: ["knowledge/hana/hana-authorization.md"],
    requireAny: ["analytic privilege", "least-privilege", "reporting role", "row-level", "design"],
    task: [
      ["analytic privilege", 5],
      ["hana", 3],
      ["reporting role", 4],
      ["least-privilege", 3]
    ],
    whenAll: [["hana", "analytic", 5], ["hana", "least-privilege", 5]],
    excludeAny: ["cannot read", "troubleshoot", "insufficient privilege", "guid"],
    steps: [
      "Separate object privileges that grant SELECT on the view from analytic privileges that inject the row filter for the reporting role.",
      "Define analytic privileges against the analytic or calculation views the role must read, using the business attributes that bound the intended rows.",
      "Prefer repository or HDI roles for transportable application security; keep catalog roles for ad hoc administration that must not ship with the application.",
      "Assign the least role set that carries those privileges and validate with a representative user that intended rows return and out-of-scope rows do not."
    ],
    validation: "Object privileges alone do not provide row-level security; confirm analytic-privilege filtering with a negative test, not only a successful SELECT.",
    boundary: "HANA analytic privileges are not BW analysis authorizations in RSECADMIN.",
    contrast: "For least-privilege HANA reporting access I combine object privileges with analytic privileges on repository or HDI roles, then prove row filtering with positive and negative tests."
  },
  {
    id: "process-control-test-troubleshooting",
    product: "Process Control",
    service: "Control test evaluation troubleshooting",
    intent: "troubleshoot",
    sourceFiles: ["knowledge/grc/process-control.md"],
    task: [
      ["control test", 5],
      ["automated control", 5],
      ["manual test plan", 5],
      ["process control", 4],
      ["unexpected result", 4]
    ],
    requireAny: ["troubleshoot", "isolate", "unexpected", "failed", "failure", "incorrect", "wrong result"],
    steps: [
      "Identify the control, organization, regulation, tester, and Planner assignment for the unexpected evaluation before changing unrelated Access Control workflow.",
      "For a manual test, reopen Assessments, Manual Test Plans and confirm the plan was Ready or Reserved, the window is current, and Pass or Fail was recorded on the intended activities.",
      "For an automated evaluation, validate the source-system connector and the control data the evaluation depends on, then correct master data or connector evidence and rerun.",
      "If the test fails correctly, open or continue the issue and remediation plan rather than forcing a Pass."
    ],
    validation: "Retest only after the control definition, ownership, and evidence inputs are corrected, and keep issue closure evidence with the retest.",
    boundary: "Do not diagnose a Process Control test with AGR_USERS, AGR_1251, or BW analysis authorizations unless that control monitors those access objects.",
    contrast: "An unexpected Process Control test result is isolated through control master data, Planner assignment, and connector or test evidence, not through Access Control MSMP redesign."
  },
  {
    id: "iag-analysis-sync-troubleshooting",
    product: "IAG",
    service: "Access Analysis and synchronization troubleshooting",
    intent: "troubleshoot",
    sourceFiles: ["knowledge/iag/iag-access-analysis.md", "knowledge/iag/iag-implementation.md"],
    task: [
      ["access analysis", 4],
      ["synchronization", 4],
      ["ruleset", 3],
      ["iag", 2]
    ],
    requireAny: ["troubleshoot", "failed", "failure", "not synchroni", "error", "diagnose"],
    steps: [
      "Separate the symptom: Access Analysis risk evaluation failures belong to IAG governance content and jobs, while identity or entitlement synchronization failures belong to the connector, bridge, or provisioning path that feeds IAG.",
      "For Access Analysis, inspect Rule Setup processing and validation logs, Business Function Group assignment for the target, and the Access Analysis or Manage Jobs result for the affected system before changing request workflow rules.",
      "For synchronization, inspect the relevant IAG or bridge sync job history and, when identity data is the source, the IPS job or SCIM provisioner logs for skipped or failed records; do not treat an Access Request path defect as an analysis ruleset defect.",
      "Reproduce with one known user or role on the affected target, confirm whether risk content or master data is stale, and only then adjust ruleset content or sync configuration."
    ],
    validation: "Confirm the corrected analysis or sync job completes and that a representative access or risk result matches the expected target data.",
    boundary: "Access Analysis rules are not Access Request RequestTypeRule routing, and they are not MSMP.",
    contrast: "For failed IAG access analysis or synchronization, I split analysis-ruleset evidence from sync or provisioning evidence before changing either side."
  },
  {
    id: "rise-hybrid-identity",
    product: "RISE",
    service: "Hybrid identity",
    task: [
      ["hybrid identity", 5]
    ],
    whenAll: [["identity", "rise", 4]],
    steps: [
      "Keep the planes separate. Identity Authentication signs the user in. A corporate identity provider is proxied through it only when that landscape uses one.",
      "Identity Provisioning synchronizes users and groups. It does not decide the target's authorization.",
      "On S/4HANA Cloud Private Edition, PFCG maintains the role and its authorization objects. SU01 assigns that role to the ABAP user. SUIM reports those ABAP users and roles. SUIM does not validate Identity Authentication, Identity Provisioning, or BTP.",
      "On S/4HANA Cloud Public Edition, maintain business roles and restrictions in Maintain Business Roles, and assign business users in Maintain Business Users. Inspect a missing authorization with Display Authorization Trace. Do not design that model in PFCG.",
      "On BTP, the subaccount trusts the identity provider and the user receives a role collection.",
      "Validate each plane in its own tool: the identity-provider sign-in, the provisioning job, the edition's authorization tool, and the BTP role-collection assignment."
    ],
    boundary: "Whether the corporate identity provider is proxied, which provisioning targets exist, and whether GRC or IAG governs requests are properties of the tenant. Do not invent them.",
    contrast: "Hybrid RISE identity is authentication, provisioning, and the authorization tool that belongs to that edition."
  },
  {
    id: "activate-security-workstream",
    product: "Activate",
    service: "SAP security workstream across Explore Realize Deploy",
    intent: "implement",
    sourceFiles: ["knowledge/project-types/security-workstream.md", "knowledge/project-management/sap-activate.md"],
    requireAny: ["security workstream", "explore", "realize", "deploy", "authorization scope"],
    task: [
      ["security workstream", 5],
      ["explore", 3],
      ["realize", 3],
      ["deploy", 3],
      ["authorization scope", 4]
    ],
    whenAll: [["explore", "realize", "deploy", 6], ["security", "activate", 4]],
    steps: [
      "In Explore, lock authorization and identity scope before build: edition-correct enforcement, identity and governance planes in scope, SoD and privileged-access expectations, and the critical processes that must prove access before go-live.",
      "In Realize, build and test iteratively against that baseline: roles or restrictions, provisioning mappings, governed request paths where in scope, logged emergency access, and positive plus negative security test evidence before promotion.",
      "In Deploy, rehearse cutover with identity and authorization dependencies explicit: role readiness, assignment evidence, emergency-access path, critical-process access proof, open security defects, and the go/no-go decision."
    ],
    validation: "Do not quote a universal duration or percentage of standard processes; those belong to the approved plan for that contract.",
    boundary: "Public Edition business roles and Private Edition or on-premise PFCG remain different enforcement tools; do not describe one procedure as universal.",
    contrast: "For the SAP security workstream across Activate Explore, Realize, and Deploy, I plan scope in Explore, build and test in Realize, and prove cutover-ready access in Deploy."
  },
  {
    id: "activate-cutover-dependency-recovery",
    product: "Activate",
    service: "Deploy cutover dependency recovery",
    intent: "troubleshoot",
    sourceFiles: ["knowledge/project-management/sap-activate.md", "knowledge/cutover/cutover-plan.md"],
    requireAny: ["rehearsal", "go-live gate", "dependency", "replan", "fails", "failed"],
    task: [
      ["cutover", 3],
      ["rehearsal", 4],
      ["identity dependencies", 5],
      ["go-live gate", 5],
      ["replan", 4],
      ["go/no-go", 3]
    ],
    steps: [
      "In Deploy, I would stop and assess the failed rehearsal against the cutover entry criteria rather than treat the date as the only success measure.",
      "Trace each identity dependency to its accountable owner, required completion evidence, and downstream role, trust, synchronization, or provisioning test; record the blocker, impact, decision date, and recovery action in the dependency and RAID tracking.",
      "Re-sequence the work only where dependencies permit, then rerun the affected identity and critical-business-role tests, including expected access succeeding and unintended access remaining absent. Escalate schedule or scope changes through project change control and the agreed governance forum.",
      "At the go/no-go gate, proceed only when mandatory security and business cutover criteria have evidence and owners accept residual risks; otherwise agree a controlled replan or the rehearsed rollback path for that deployment."
    ],
    validation: "Record the decision, retest results, accepted risks, cutover evidence, and operational handover owner before closing the gate.",
    boundary: "A technical rollback is deployment- and business-state-dependent; do not promise it after irreversible production activity.",
    contrast: "For an identity-dependent cutover failure, I would replan the Deploy gate around verified dependency closure, retesting, and an explicit go/no-go decision."
  },
  {
    id: "ac-release-boundary",
    product: "GRC",
    service: "Access Control releases",
    task: [
      ["access control", 4],
      ["10.1", 3],
      ["12.0", 3]
    ],
    requireAll: ["access control", "10.1", "12.0"],
    whenAll: [["10.1", "12.0", 4], ["10.1", "12", 3]],
    steps: [
      "The product name is SAP Access Control. The releases named in the SAP Help upgrade guide are 10.0, 10.1, and 12.0. Do not describe a separate product called GRC 12.x.",
      "Access Control 12.0 installs add-on GRCFND_A V1200 on the GRC system and NetWeaver plug-in GRCPINW V1200_750 on the plug-in system. SAP Note 2602131 is the release note for GRCFND_A V1200. The same guide names 10.1 plug-ins GRCPIERP V1100_700 and GRCPINW V1100_710. It does not, in the pages checked, give a separate foundation add-on name for 10.1. Do not invent one.",
      "The upgrade guide for 12.0.32 applies only to an upgrade from 10.0 or 10.1 to 12.0. A 10.1 system on SP24 must go to 12.0 SP05 or higher. Confirm the installed support package before describing an upgrade.",
      "After the upgrade, NWBC is still the Business Client. The guide assigns role SAP_GRC_NWBC in SU01 when users launch NWBC from SAP GUI. There is no portal plug-in for Access Control 12.0, so the 10.1 portal plug-in remains the documented choice.",
      "SAP Fiori apps are optional. The front-end add-on is UIGRAC01, SAP Fiori for SAP AC 1.0. It does not replace MSMP, BRFplus, or the target plug-in.",
      "ARA, ARM, BRM, and EAM stay the four components in 10.1 and 12.0. Do not invent a rename or a feature change the upgrade guide does not state."
    ],
    boundary: "Simplified Access Request customizing is new in the 12.0 guide. Confirm the activity in the target system's IMG before describing its screens.",
    contrast: "Access Control 12.0 is the 12.0 add-on and an upgrade from 10.0 or 10.1, with optional Fiori apps and the same four components."
  },
  {
    id: "fiori-space-by-edition",
    product: "S/4HANA",
    service: "Fiori spaces",
    task: [
      ["space", 4],
      ["public", 2],
      ["private", 2]
    ],
    requireAll: ["space", "public", "private"],
    steps: [
      "On S/4HANA Cloud Public Edition, maintain the space in the Manage Launchpad Spaces and Manage Launchpad Pages apps, then assign that space from the business role in Maintain Business Roles. Maintain Business Roles is an application, not a transaction code. Do not use PFCG or /UI2/FLPCM_CUST on Public Cloud.",
      "On S/4HANA Cloud Private Edition and on-premise, transaction /UI2/FLPCM_CONF maintains cross-client launchpad content. Transaction /UI2/FLPCM_CUST maintains client-specific content and supersedes the cross-client layer. Those are transactions, not tables. Spaces and pages are also maintained in Manage Launchpad Spaces and Manage Launchpad Pages, and the space is added to the PFCG role.",
      "A space controls visibility. It does not grant the authorization to run the app. An unauthorized tile is hidden.",
      "SAP Note 3401525 describes the spaces migration and the Manage Launchpad Settings parameters SPACES and SPACES_ENABLE_USER. The public FAQ text does not say group mode is already gone on every tenant. Confirm the parameter before describing groups.",
      "Validate by signing in as the user. The space shows the intended tile. A tile the user cannot start stays hidden."
    ],
    boundary: "Which groups still exist on an older on-premise release, and the exact page layout, depend on that system. Do not treat one transaction as universal.",
    contrast: "Public Cloud assigns a Fiori space from the business role. Private Edition and on-premise also use /UI2/FLPCM_CONF, /UI2/FLPCM_CUST, and a PFCG role."
  }
];

function mentions(text, term) {
  // SAP administrators and interviewers commonly write this as either "ruleset"
  // or "rule set". Canonicalize the spacing variant before matching workflow tasks.
  const canonical = (value) => String(value || "").toLowerCase().replace(/[_-]+/g, " ").replace(/\brule\s+set\b/g, "ruleset");
  const q = canonical(text);
  const t = canonical(term);
  if (!t) return false;
  let from = 0;
  while (from < q.length) {
    const at = q.indexOf(t, from);
    if (at < 0) return false;
    const beforeOk = at === 0 || !/[a-z0-9]/.test(q[at - 1]);
    const afterAt = at + t.length;
    const rest = q.slice(afterAt);
    const inflection = /^s(?![a-z0-9])/.test(rest) || /^ing(?![a-z0-9])/.test(rest);
    const afterOk = afterAt >= q.length || !/[a-z0-9]/.test(q[afterAt]) || inflection;
    const templatePrefix = t === "workflow" && q.slice(afterAt).startsWith(" template");
    if (beforeOk && afterOk && !templatePrefix) return true;
    from = at + 1;
  }
  return false;
}

function isComparison(question) {
  return /\b(?:compared|comparing|comparison|versus|vs\.?|differ(?:s|ence|ent)?(?:\s+from)?|difference between)\b/i.test(String(question || ""));
}

function matchedTerms(question, workflow) {
  return workflow.task.filter(([term]) => mentions(question, term)).map(([term]) => term);
}

function distinctSecondConcept(question, best, second) {
  const primary = matchedTerms(question, best.workflow);
  return matchedTerms(question, second.workflow).some((term) =>
    !primary.some((kept) => kept === term || kept.includes(term) || term.includes(kept))
  );
}

function questionProducts(question) {
  const found = new Set(explicitProductTopics(question));
  if (found.has("S/4")) {
    found.delete("S/4");
    found.add("S/4HANA");
  }
  if (/\b(?:msmp|brf(?:\+|plus)|ara|arm|eam|brm|firefighter|sap access control|grc)\b/i.test(question)) found.add("GRC");
  return found;
}

function scoreWorkflow(question, workflow) {
  const products = questionProducts(question);
  const comparison = isComparison(question);
  // A comparison can match more than one explicitly named product, but it
  // must never open the scorer to workflows from products the question did
  // not name.
  if (products.size && !products.has(workflow.product)) return 0;
  if (Array.isArray(workflow.requireAll) && workflow.requireAll.some((term) => !mentions(question, term))) {
    return 0;
  }
  if (Array.isArray(workflow.requireAny) && !workflow.requireAny.some((term) => mentions(question, term))) {
    return 0;
  }
  if (Array.isArray(workflow.excludeAny) && workflow.excludeAny.some((term) => mentions(question, term))) {
    return 0;
  }
  const GENERIC_ROLE_TERMS = new Set([
    "owners", "owner", "owner assignment", "controller", "controllers",
    "reviewer", "approver", "who approves", "employee record", "role owner"
  ]);
  let score = 0;
  for (const [term, weight] of workflow.task) {
    if (!mentions(question, term)) continue;
    // "process owners" is a delivery noun. It must not select an IAG owner
    // procedure unless the question also names that product.
    if (!products.size && GENERIC_ROLE_TERMS.has(term)) continue;
    score += weight;
  }
  if (Array.isArray(workflow.whenAll)) {
    for (const group of workflow.whenAll) {
      const weight = group[group.length - 1];
      const terms = group.slice(0, -1);
      if (terms.every((term) => mentions(question, term))) score += weight;
    }
  }
  if (score > 0 && mentions(question, workflow.product)) score += 1;
  return score;
}

function normalizeSentenceKey(text = "") {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function renderWorkflow(workflow) {
  const steps = workflow.steps || [];
  const lastIndex = steps.length - 1;
  const validationIndex = lastIndex >= 0 && /\b(test|verify|validate|confirm|inspect|review|reconcile|check)\b/i.test(steps[lastIndex])
    ? lastIndex
    : -1;
  const direct = workflow.contrast || `${workflow.product} ${workflow.service}.`;
  const mechanism = steps.filter((_, index) => index !== validationIndex);
  const validationParts = [workflow.validation || (validationIndex >= 0 ? steps[validationIndex] : ""), workflow.boundary]
    .filter(Boolean);
  const parts = [direct, ...mechanism, ...validationParts].filter(Boolean);
  const seen = new Set();
  return parts.filter((part) => {
    const key = normalizeSentenceKey(part);
    if (!key || seen.has(key)) return false;
    // Drop near-duplicates such as validation repeating the final mechanism step.
    for (const kept of seen) {
      if (key.length > 40 && kept.length > 40 && (key.includes(kept) || kept.includes(key))) return false;
    }
    seen.add(key);
    return true;
  }).join(" ");
}

function isTroubleshootingAsk(question) {
  const q = String(question || "");
  return /\b(?:troubleshoot|diagnos\w*|triage|isolate|fails?\b|failed|failure|stuck|stale|no approver|not synchroni[sz]ing|synchroni[sz]ation error|does not take effect|doesn't take effect|not take effect|remains unavailable|still unavailable|cannot launch|can't launch|unable to launch|what do you (?:validate|inspect|check|verify)|how do you (?:isolate|replan|recover))\b/i.test(q)
    || /\b(?:cannot|can't|unable to|does not|doesn't)\b.{0,80}\b(?:launch|open|see|access|take effect|provision|approver|sync|synchroni)/i.test(q)
    || (/\b(?:granted|approved)\b/i.test(q) && /\b(?:unavailable|cannot|can't|does not|doesn't|fail|stale)/i.test(q));
}

function workflowIntent(workflow) {
  const declared = String(workflow?.intent || "").toLowerCase();
  if (declared === "troubleshoot" || declared === "implement" || declared === "either") return declared;
  if (/troubleshooting|recovery|failure|launch failure/i.test(String(workflow?.service || ""))) return "troubleshoot";
  return "implement";
}

function isBareDefinition(question) {
  const q = String(question || "");
  if (!/^\s*what (?:is|are)\b/i.test(q)) return false;
  if (isComparison(q)) return false;
  if (/\b(how|configur|upload|implement|set up|setup|troubleshoot|diagnos|walk me|where do you|what do you check|maintain)\b/i.test(q)) return false;
  const namesSpecificTask = WORKFLOWS.some((workflow) =>
    (workflow.task || []).some(([term, weight]) => weight >= 4 && mentions(q, term))
  );
  return !namesSpecificTask;
}

function selectVerifiedWorkflow(question) {
  const text = String(question || "").trim();
  const experienceAsk = EXPERIENCE_ASK.test(text);
  if (!text || isBareDefinition(text)) return null;
  const finish = (result) => (result ? { ...result, experienceAsk } : null);

  const comparison = isComparison(text);
  const troubleshootingAsk = isTroubleshootingAsk(text);
  const ranked = WORKFLOWS
    .map((workflow) => ({ workflow, score: scoreWorkflow(text, workflow) }))
    .filter((row) => !(row.workflow.broadFallback && troubleshootingAsk))
    .filter((row) => {
      const intent = workflowIntent(row.workflow);
      if (troubleshootingAsk) return intent === "troubleshoot" || intent === "either";
      // Implementation and design asks must not be answered by a recovery workflow
      // merely because the product keywords overlap.
      if (intent === "troubleshoot" && !troubleshootingAsk) return false;
      return true;
    })
    .filter((row) => row.score >= (comparison ? 2 : 3))
    .sort((a, b) => b.score - a.score);

  const taskSpecific = ranked.filter((row) => !row.workflow.broadFallback);
  const selectedRanked = taskSpecific.length ? taskSpecific : ranked;

  const namesIagRuleBoundary = /\biag\b/i.test(text) && /\brules?\b/i.test(text)
    || /\baccess analysis\b[\s\S]*\bworkflow[- ]determination\b|\bworkflow[- ]determination\b[\s\S]*\baccess analysis\b/i.test(text);
  if (!selectedRanked.length && namesIagRuleBoundary) {
    return finish({
      id: "iag-rule-distinction",
      workflowId: "iag-rule-distinction",
      answer: "IAG Access Analysis risk rules and Access Request workflow rules are separate objects. Maintain SoD risk content in Administration, Rule Setup, and upload a custom rules ZIP with Upload and Process. Standard cloud content is requested from SAP under component GRC-IAG-AA. Access Request workflow determination uses RequestTypeRule to map a request type to an approval path. Review the Rule Setup processing and validation logs after upload. Do not use the Access Request workflow rule to maintain Access Analysis risks.",
      route: "VERIFIED_WORKFLOW"
    });
  }

  if (!selectedRanked.length) return null;
  const best = selectedRanked[0];
  const second = selectedRanked[1];
  if (comparison && second && second.score >= 2 && distinctSecondConcept(text, best, second)) {
    // Only merge contrasts when both workflows share the named product lane or the
    // question explicitly compares two concepts inside one product family.
    if (best.workflow.product === second.workflow.product) {
      return finish({
        id: `${best.workflow.id}+${second.workflow.id}`,
        workflowId: best.workflow.id,
        answer: `${best.workflow.contrast} ${second.workflow.contrast}`,
        route: "VERIFIED_WORKFLOW"
      });
    }
  }

  // Close scores from different products must not concatenate contrasts (that produced
  // IAG Role Designer text on an S/4 Public-vs-Private question). Prefer the clear
  // leader; if the margin is tiny inside the same product, fall through to retrieval.
  if (second && best.score - second.score < 2) {
    if (best.workflow.product !== second.workflow.product) {
      return finish({
        id: best.workflow.id,
        workflowId: best.workflow.id,
        product: best.workflow.product,
        task: best.workflow.service,
        sourceFiles: best.workflow.sourceFiles || [],
        answer: renderWorkflow(best.workflow),
        route: "VERIFIED_WORKFLOW"
      });
    }
    return null;
  }

  return finish({
    id: best.workflow.id,
    workflowId: best.workflow.id,
    product: best.workflow.product,
    task: best.workflow.service,
    sourceFiles: best.workflow.sourceFiles || [],
    answer: renderWorkflow(best.workflow),
    route: "VERIFIED_WORKFLOW"
  });
}

module.exports = {
  WORKFLOWS,
  selectVerifiedWorkflow,
  isTroubleshootingAsk,
  workflowIntent
};
