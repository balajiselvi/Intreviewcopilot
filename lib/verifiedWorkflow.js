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
    task: [
      ["integrate", 4],
      ["integration", 4],
      ["bridge", 5],
      ["access control 12.0", 5],
      ["interact", 4],
      ["synchronize", 4],
      ["risk rules", 5],
      ["configure", 3]
    ],
    spokenAnswer: "Configure IAG Bridge so on-premises SAP GRC Access Control 12.0 and SAP Cloud IAG share risk-rule truth — keep IAG cloud service configuration separate from AC 12.0 MSMP/BRF+ ownership. Maintain IAG connector settings for the Access Control 12.0 backend; schedule provisioning transport / repository synchronization jobs that move risk rules and access data across the bridge; complete IAG service configuration endpoints (Cloud Foundry destination, bridge endpoints, and authentication) before enabling production sync. Agree which stack owns Access Analysis vs Access Request; change-control connector credentials and sync jobs; retain bridge job and AC repository sync evidence. Prove a risk-rule change syncs end-to-end and an approved hybrid request provisions in its target — workflow completion alone is not proof.",
    steps: [
      "Start from the SAP Help IAG Bridge Cloud integration guide for the SAP Access Control 12.0 on-premise, IAG Cloud Foundry, and cloud-application scenario; confirm that it matches the deployed releases and intended governance scope.",
      "Configure IAG connector settings and service configuration endpoints, then schedule provisioning transport / repository synchronization jobs for risk rules and access data.",
      "Keep IAG service configuration in the cloud separate from Access Control backend setup. Maintain backend connectors, repository synchronization, and any MSMP/BRF+ workflow that remains in Access Control on the ABAP system.",
      "Test risk and request flows across the bridge in non-production, trace failures to the cloud service, bridge/integration, backend workflow, or target provisioning layer, and retain evidence from each system."
    ],
    validation: "Verify the documented bridge flow end to end and confirm that an approved request actually provisions in its target; workflow completion alone is not proof of provisioning.",
    boundary: "The bridge does not make IAG configuration and Access Control MSMP configuration the same procedure.",
    contrast: "IAG Bridge Cloud connects SAP Access Control 12.0 on-premise, IAG Cloud Foundry, and supported cloud applications under the documented integration scenario."
  },
  {
    id: "iag-vs-grc-access-control",
    product: "IAG",
    service: "SAP Cloud IAG versus GRC Access Control 12.0",
    intent: "either",
    broadFallback: false,
    sourceFiles: [
      "knowledge/iag/iag-cloud-identity-access-governance-architect-bank.md",
      "knowledge/iag/iag-overview.md"
    ],
    requireAny: ["differ", "difference", "versus", "vs", "compared", "comparison", "differ from"],
    requireAll: ["IAG"],
    task: [
      ["grc", 4],
      ["access control", 4],
      ["iag", 3],
      ["cloud iag", 4],
      ["identity access governance", 3]
    ],
    whenAll: [["iag", "grc", 6], ["iag", "access control", 6]],
    excludeAny: ["configure bridge", "how do you configure", "main steps", "troubleshoot"],
    spokenAnswer:
      "When I compare SAP Cloud IAG with GRC Access Control 12.0, I typically frame it by landscape: IAG for BTP SaaS and hybrid-cloud governance, Access Control 12.0 when the programme needs deep on-premise ABAP MSMP, BRF+, and ARA investment, and IAG Bridge only when both stacks must share request or risk truth — without conceptual metaphors. On the GRC side, GRCFND_A runs ARA rulesets in the ABAP database, routes ARM through MSMP and BRF+ decision tables, and handles Firefighter through SPM tables and sync jobs over the Integration Framework and SM59 RFC. Cloud IAG runs as BTP microservices — Access Analysis, Access Request, Access Certification, Role Design, and PAM — with IAS authenticating into IAG, IPS and connectors synchronizing repositories, and Cloud Connector or REST destinations reaching on-prem; the Bridge links to GRC without making MSMP the IAG native engine. Neither product replaces target enforcement in PFCG, Public Edition business roles, or BTP role collections. On-prem GRC localizes SOX and ITGC evidence around ABAP request trails, Firefighter log review, and ARA mitigations, while IAG scales multi-tenant certification and Access Analysis; in Bridge landscapes I declare a single system of record per process. I prove GRC with SM59 connectivity, ARA simulation, an MSMP/BRF+ ARM path, and Firefighter log review, and I prove IAG with IAS login, green connector sync, Access Analysis on a toxic test user, Access Request with risk simulation, and Bridge end-to-end consistency when hybrid.",
    steps: [
      "SAP GRC Access Control 12.0 is the on-premise/private ABAP governance stack: ARA ruleset in ABAP DB, ARM via MSMP/BRF+, EAM Firefighter via SPM tables, connectors via SM59 / Integration Framework.",
      "SAP Cloud IAG is BTP SaaS microservices (Access Analysis, Access Request, Access Certification, Role Design, PAM) with IAS authentication, IPS/connector sync, Cloud Connector/REST connectivity, and optional IAG Bridge to GRC AC."
    ],
    validation: "Prove each plane with its own artifacts — RFC/MSMP/ARA on GRC; IAS sync/Access Analysis/Access Request on IAG; Bridge consistency when hybrid.",
    boundary: "Do not describe IAG as 'GRC in the cloud' and do not use conceptual metaphors.",
    contrast: "IAG is BTP SaaS governance (Access Analysis/Request/Certification/Role Design/PAM + IAS/IPS + Bridge); GRC Access Control 12.0 is on-prem ABAP governance (ARA/MSMP/BRF+/EAM SPM + SM59 RFC)."
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
    id: "grc-msmp-stuck-troubleshoot",
    product: "GRC",
    service: "MSMP stuck request diagnostics",
    intent: "troubleshoot",
    broadFallback: false,
    sourceFiles: ["knowledge/grc/msmp.md"],
    requireAny: ["stuck", "hang", "no approver", "troubleshoot", "diagnos", "not moving", "pending"],
    task: [
      ["msmp", 5],
      ["stuck", 5],
      ["workflow", 3],
      ["access request", 3],
      ["grac", 2]
    ],
    whenAll: [["msmp", "stuck", 8], ["request", "stuck", 6], ["msmp", "troubleshoot", 7]],
    spokenAnswer:
      "When an MSMP access request is stuck because routing agents fail, I typically start in GRFNMW_CONFIGURE_WD to confirm the generated MSMP version and path mapping before I touch BRF+ agents. From there I run program GRFNMW_DB_CHECK to catch sync gaps between the MSMP runtime and the workflow database, then read GRACFFLOG and SLG1 under object GRAC for initiator or agent failures and check SWIA or SWI1 for the actual work-item state. Only after that evidence is clear do I adjust initiator RULE_RESULT mapping or stage agents — and never hot-fix Production MSMP without a transport and SoD owner awareness. I reproduce the request and prove the path, stage, and approver in Request Status → Instance Status with a clean SLG1 trail.",
    steps: [
      "Open GRFNMW_CONFIGURE_WD, run program GRFNMW_DB_CHECK, then read GRACFFLOG / SLG1 and SWIA/SWI1 for the stuck work item.",
      "Verify GRFNMW_CONFIGURE_WD path mapping and generated MSMP version before changing BRF+ agents."
    ],
    validation: "Instance Status shows the intended path and approver after correction.",
    boundary: "Stuck work items are diagnosed before ruleset redesign.",
    contrast: "For a stuck MSMP request I start with GRFNMW_CONFIGURE_WD, GRFNMW_DB_CHECK, and GRACFFLOG / SLG1."
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
    spokenAnswer:
      "When I configure SuccessFactors authorization, I typically work the RBP triad as three distinct objects. I start in Manage Permission Roles to grant the activity permissions, then move into Manage Permission Groups to define who belongs to that role, and I set Target Population separately so it controls whose data those people can see — a permission group is never the target population. SSO only authenticates; it does not grant RBP. I validate by signing in as a group member and confirming the intended data scope, then proving a user outside the target population cannot see it.",
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
      ["target population", 4],
      ["compensation", 3],
      ["permission role", 4],
      ["permission group", 4]
    ],
    requireAny: ["unavailable", "cannot", "can't", "does not", "doesn't", "granted", "inspect", "troubleshoot"],
    spokenAnswer:
      "Manage Permission Roles, Manage Permission Groups, and Target Populations are what I inspect first when SuccessFactors compensation data is missing for a subsidiary — before touching SSO. I confirm the Permission Role grants the compensation view activities, that the HR administrator is in the linked Permission Group, and that the Target Population includes that subsidiary; group membership alone fails when employees sit outside the target population. SSO authentication success is a separate plane from RBP authorization. After any RBP change I sign out/in, retest the exact subsidiary compensation view, and prove denied persons remain outside the Target Population.",
    steps: [
      "Confirm the permission is present on the assigned Permission Role (what activities) and that the user is a member of the linked Permission Group (who belongs).",
      "Inspect the Target Population (whose data can be seen) separately from the Permission Group; a correct group membership still fails when the person or object is outside the target population.",
      "Check whether the action depends on an additional RBP permission, employee status, or proxy or admin context that the role does not grant.",
      "Have the user sign out and back in after the RBP change, then retest the exact unavailable action rather than a different menu path."
    ],
    validation: "Separate SSO authentication success from RBP authorization; sign-in alone does not prove the permission and target population are correct.",
    boundary: "Do not answer an unavailable-action symptom by redesigning RBP from scratch unless role, group, or target-population evidence is missing.",
    contrast: "Permission Roles define what activities; Permission Groups define who belongs; Target Populations define whose data can be seen."
  },
  {
    id: "btp-role-collection",
    product: "BTP",
    service: "Authorization",
    intent: "implement",
    task: [
      ["role collection", 5],
      ["role template", 3],
      ["xsuaa", 4],
      ["ias", 3]
    ],
    excludeAny: ["does not take effect", "doesn't take effect", "not take effect", "isolate trust", "troubleshoot"],
    spokenAnswer:
      "On BTP I do not reach for PFCG or AGR_USERS — authorization starts in xs-security.json with scopes and role templates, then moves through XSUAA roles into BTP role collections and IAS group mapping. I typically define the scopes and role-templates in xs-security.json so the XSUAA runtime can validate the JWT and enforce those scopes at the app boundary, create a role from each template, place it in a role collection, and trust the subaccount to IAS over SAML 2.0 or OIDC so IAS user groups map to that collection. I keep destination OAuth clients separate from end-user collections and change-control the trust and mappings. After a fresh sign-in I confirm the token claims and issued collections, then retest the denied HTML5 action — destination auth failures are a different plane from missing scopes.",
    steps: [
      "Structure scopes and role templates in xs-security.json for the Cloud Foundry HTML5 app.",
      "Rely on XSUAA runtime token validation for those scopes; create roles from templates and place them in BTP role collections.",
      "Configure IAS / IdP trust on the subaccount and map IAS user groups to the role collection.",
      "The user must sign in again before the new collection applies. A destination's authentication is a separate setting."
    ],
    boundary: "Assigning an IAS group does not replace the role collection assignment.",
    contrast: "BTP authorization is xs-security.json scopes, XSUAA role templates, role collections, then IAS user group mapping."
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
    id: "grc-ac12-ara-msmp-config",
    product: "GRC",
    service: "Access Control 12.0 ARA and MSMP configuration",
    intent: "implement",
    broadFallback: false,
    sourceFiles: ["knowledge/grc/msmp.md", "knowledge/grc/arm.md", "knowledge/grc/grc-overview.md"],
    requireAny: ["msmp", "ara", "brf", "access control", "12.0", "configure", "configuration"],
    task: [
      ["msmp", 5],
      ["ara", 4],
      ["access control", 4],
      ["12.0", 3],
      ["brf+", 4],
      ["brf", 3],
      ["configuration", 2]
    ],
    whenAll: [["access control", "msmp", 7], ["ara", "msmp", 7], ["12.0", "msmp", 6]],
    spokenAnswer:
      "When I configure Access Control 12.0 on GRCFND_A, I typically start in NWBC and keep ARA risk building separate from MSMP and BRF+ request routing. I maintain the ARA ruleset in GRAC_RULE_BUILD so functions, actions, and risks land in GRACFUN, GRACACTTN, GRACRISK, and GRACRISKT, with connectors wired through the Integration Framework and SM59. From there I move into GRFNMW_CONFIGURE or GRFNMW_CONFIGURE_WD to set MSMP paths and stages, bind the BRF+ initiator and agent rules with RULE_RESULT mapping, and generate the MSMP version. If Firefighter is in scope I finish with SPM via /N/GRCPI/GRIA_EAM and the GRACFFUSER, GRACFFOBJECT, and GRACFFLOG tables under change control and SoD owner sign-off. I prove it with an ARA toxic-user simulation, an ARM Instance Status path check, and a GRACFFLOG review when elevated access was used.",
    steps: [
      "Configure Access Control 12.0 connectors, ARA ruleset, and MSMP/BRF+ request routing as distinct configuration objects.",
      "Generate MSMP version and validate with a test access request and ARA simulation."
    ],
    validation: "ARA hit plus MSMP Instance Status prove risk and routing independently.",
    boundary: "IAG cloud workflow rules are not MSMP; do not answer on-prem AC 12.0 with IAG RequestTypeRule.",
    contrast: "Access Control 12.0 uses ARA plus MSMP/BRF+ on ABAP; keep connectors and Firefighter governance in the same landscape design."
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
    id: "bw4-analysis-authorizations",
    product: "BW",
    service: "Analysis Authorizations versus PFCG",
    intent: "either",
    broadFallback: false,
    sourceFiles: ["knowledge/bw/bw-security.md", "knowledge/hana/hana-authorization.md"],
    requireAny: [
      "analysis authorization",
      "analysis authorizations",
      "rsecadmin",
      "bw/4",
      "bw4",
      "regional data",
      "authorization-relevant"
    ],
    task: [
      ["analysis authorization", 6],
      ["analysis authorizations", 6],
      ["bw/4hana", 5],
      ["bw4hana", 5],
      ["rsecadmin", 5],
      ["pfcg", 3],
      ["regional", 3],
      ["query", 2]
    ],
    whenAll: [
      ["bw", "analysis", 8],
      ["bw/4", "authorization", 7],
      ["analysis", "authorization", 7],
      ["pfcg", "bw", 6]
    ],
    spokenAnswer: "Standard ABAP PFCG authorizations control transaction and object access — they do not filter BW/4HANA query result rows. Regional data visibility is governed by Analysis Authorizations on authorization-relevant characteristics. Mark InfoObjects as authorization-relevant; design Analysis Authorizations in RSECADMIN (or equivalent BW/4 tooling) for characteristics such as region/company code; assign those Analysis Authorizations to the reporting user or role; keep S_RS_* PFCG objects for query execution rights separate from the characteristic value filter. Least-privilege characteristic values; change-control Analysis Authorizations independently from PFCG role generation; retain RSECADMIN evidence for audit. User can open the query (PFCG/S_RS_*) but only sees allowed regional values; negative region returns empty or denied — proving Analysis Authorizations, not PFCG alone.",
    steps: [
      "Explain why PFCG alone fails for regional query data: ABAP authorizations do not inject BW characteristic filters.",
      "Configure Analysis Authorizations on authorization-relevant characteristics in RSECADMIN and assign them to the reporting user or role.",
      "Keep standard PFCG / S_RS_* objects for query start rights separate from Analysis Authorization value ranges."
    ],
    validation: "Positive regional rows return; out-of-scope region is denied — Analysis Authorizations, not PFCG alone.",
    boundary: "HANA analytic privileges are a different plane from BW Analysis Authorizations in RSECADMIN.",
    contrast: "PFCG governs ABAP object checks; BW/4HANA Analysis Authorizations govern authorization-relevant characteristics in query results."
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
    excludeAny: ["cannot read", "troubleshoot", "insufficient privilege", "guid", "bw/4", "bw4", "analysis authorization", "rsecadmin"],
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
    id: "sal-purge-sm18-rsaupurg",
    product: "Authorization",
    service: "Security Audit Log purge",
    intent: "implement",
    broadFallback: false,
    sourceFiles: ["knowledge/security/core-sap-security-authorizations-architect-bank.md"],
    requireAny: ["purge", "delete", "reorganize", "sm18", "rsaupurg", "audit log", "security audit"],
    task: [
      ["security audit log", 6],
      ["audit log", 4],
      ["purge", 5],
      ["delete", 3],
      ["sm18", 6],
      ["rsaupurg", 6],
      ["reorganize", 3]
    ],
    whenAll: [["purge", "audit", 8], ["delete", "audit", 7], ["sm18", "audit", 8]],
    spokenAnswer:
      "When management asks to free database space by deleting Security Audit Logs, I treat purge and read as different planes. I configure filters in SM19 or RSAU_CONFIG, then purge only through SM18, RSAUPURG, or RSAU_ADMIN against files older than the approved retention — typically at least three days, longer if SOX or legal requires it — and I never use SM20, SM20N, or RSAU_READ_LOG to delete. Production deletion needs change control and S_ADMI_FCD with AUDA, with analysis roles kept separate from purge rights. I prove deletion with the SM18 or RSAUPURG job evidence and only use SM20 or RSAU_READ_LOG to display what remains.",
    steps: [
      "Use SM18 / RSAUPURG / RSAU_ADMIN for Security Audit Log reorganization and deletion.",
      "Never use SM20 for deletion — SM20/SM20N/RSAU_READ_LOG are read/analyze only.",
      "Enforce retention >= 3 days (or longer per policy) and S_ADMI_FCD AUDA."
    ],
    validation: "Confirm deletion via SM18/RSAUPURG evidence; use SM20 only to read the remaining retention window.",
    boundary: "SM20 never deletes audit logs.",
    contrast: "SAL purge is SM18/RSAUPURG/RSAU_ADMIN; SM20 is read/analyze only."
  },
  {
    id: "su24-pfcg-derived-roles",
    product: "S/4HANA",
    service: "SU24 proposals and PFCG derived roles",
    intent: "implement",
    broadFallback: false,
    sourceFiles: ["knowledge/security/core-sap-security-authorizations-architect-bank.md", "knowledge/security/pfcg.md"],
    requireAny: ["su24", "derived", "pfcg", "proposal", "authorization proposal"],
    task: [
      ["su24", 6],
      ["derived role", 6],
      ["derived roles", 6],
      ["pfcg", 3],
      ["authorization proposal", 5],
      ["proposal", 2]
    ],
    whenAll: [["su24", "derived", 8], ["su24", "pfcg", 7], ["derived", "pfcg", 7]],
    spokenAnswer:
      "For SU24 proposals and PFCG derived roles, I typically maintain check indicators and proposed values in SU24 so they land in USOBT_C and USOBX_C, and I use SU25 step 2b when upgrade defaults change. In PFCG I create the imparting role in AGR_DEFINE, set Derive from Role on the child, keep org levels only on the derived role in AGR_1252, and leave non-org authorizations in AGR_1251. From there I generate profiles into UST12 and run PFUD or PFCG_TIME_DEPENDENCY so AGR_USERS assignments pick up the new profile — never hand-editing AGR_1251 as a SU24 substitute, and always SoD-simulating before Production. After PFUD I have the test user complete the business transaction for that org value; SU53 or STAUTHTRACE only after a failed AUTHORITY-CHECK, with USR02 confirming the user master is active.",
    steps: [
      "Maintain SU24 authorization proposals for the transaction or service.",
      "Create imparting PFCG role; derive child roles and maintain org levels only on derived roles.",
      "Generate profiles and run user comparison before UAT."
    ],
    validation: "Positive business transaction for the derived org value after PFUD; negative org denied.",
    boundary: "SU53 is failure evidence, not proof of successful access.",
    contrast: "SU24 owns proposals; derived PFCG roles inherit non-org data and override org levels."
  },
  {
    id: "fiori-gateway-error-troubleshoot",
    product: "Fiori",
    service: "Fiori Gateway error diagnostics",
    intent: "troubleshoot",
    broadFallback: false,
    sourceFiles: ["knowledge/fiori/fiori-security.md"],
    requireAny: ["error", "fail", "troubleshoot", "diagnos", "cannot", "can't", "unable", "500", "forbidden", "dump"],
    task: [
      ["error log", 5],
      ["gateway", 4],
      ["fiori", 3],
      ["odata", 3],
      ["su53", 4],
      ["stauthtrace", 4]
    ],
    whenAll: [["fiori", "error", 7], ["gateway", "error", 7], ["fiori", "troubleshoot", 7]],
    spokenAnswer:
      "To troubleshoot a Fiori Gateway failure effectively, I start in /IWFND/ERROR_LOG for the failing service, user, and time before redesigning catalogs. From there I confirm activation in /IWFND/MAINT_SERVICE and SICF; if AUTHORITY-CHECK returns RC≠0 I move to SU53 and then STAUTHTRACE or ST01, and I use /IWFND/TRACES when I need payload or performance detail. Remediation follows the evidence — PFCG via AGR_1251 and S_SERVICE, or SU24 proposals into USOBT_C and USOBX_C — while I keep missing-tile catalog defects separate from launched-app authorization failures. I reproduce the call until the error log is clear, STAUTHTRACE shows the expected pass, and the business user completes the app action.",
    steps: [
      "Start in /IWFND/ERROR_LOG, then SU53 / STAUTHTRACE, then /IWFND/TRACES.",
      "Confirm /IWFND/MAINT_SERVICE and SICF before changing PFCG catalogs."
    ],
    validation: "Error log clear and app action succeeds after the evidenced fix.",
    boundary: "A missing tile is not the same defect as a Gateway authorization failure.",
    contrast: "Fiori Gateway troubleshooting starts at /IWFND/ERROR_LOG, then SU53/STAUTHTRACE, then /IWFND/TRACES."
  },
  {
    id: "su25-s4-migration-auth",
    product: "S/4HANA",
    service: "SU25 authorization migration",
    intent: "implement",
    broadFallback: false,
    sourceFiles: ["knowledge/security/core-sap-security-authorizations-architect-bank.md"],
    requireAny: ["su25", "migrat", "upgrade", "conversion", "2b", "proposal"],
    task: [
      ["su25", 6],
      ["su24", 3],
      ["migration", 3],
      ["upgrade", 3],
      ["2b", 4],
      ["usobt_c", 3]
    ],
    whenAll: [["su25", "su24", 7], ["su25", "migrat", 8], ["su25", "upgrade", 7]],
    spokenAnswer:
      "During an S/4 authorization migration I typically work SU25 in order — step 1 to fill the customer tables, 2a and 2b to identify and merge modified SU24 proposals into USOBT_C and USOBX_C, then 2c to transport — before any mass PFCG regeneration. From there I reconcile roles in PFCG against AGR_DEFINE, AGR_1251, and AGR_1252, refresh user buffers with PFCG_TIME_DEPENDENCY or PFUD so AGR_USERS assignments receive the new profiles, and keep SE09 or SE10 as transport evidence. SU25 2b merges stay change-controlled and I never skip SoD simulation in ARA or IAG before Production. I spot-check USOBT_C and USOBX_C against SU24, have test users complete critical transactions after PFUD, and use SU53 only after a failed check.",
    steps: [
      "Execute SU25 steps 1, 2a, 2b, 2c and reconcile SU24 into USOBT_C/USOBX_C.",
      "Regenerate affected PFCG roles and run PFCG_TIME_DEPENDENCY/PFUD."
    ],
    validation: "Post-migration business transactions succeed for gold personas after PFUD.",
    boundary: "SU25 owns upgrade proposal merge; SU53 is not migration proof.",
    contrast: "S/4 auth migration starts with SU25 1/2a/2b/2c and USOBT_C/USOBX_C sync."
  },
  {
    id: "fiori-sso-principal-propagation",
    product: "Fiori",
    service: "Fiori SSO and Principal Propagation",
    intent: "implement",
    broadFallback: false,
    sourceFiles: [
      "knowledge/fiori/fiori-frontend-security-architect-bank.md",
      "knowledge/fiori/fiori-security.md"
    ],
    requireAny: [
      "sso",
      "saml",
      "saml2",
      "oidc",
      "principal propagation",
      "ias",
      "configure",
      "set up",
      "setup",
      "integrate",
      "cloud connector",
      "x.509",
      "authentication failure",
      "certrule"
    ],
    task: [
      ["fiori sso", 6],
      ["principal propagation", 6],
      ["cloud connector", 6],
      ["x.509", 5],
      ["certrule", 5],
      ["saml2", 4],
      ["saml", 3],
      ["oidc", 3],
      ["ias", 3],
      ["fiori", 2],
      ["launchpad", 2]
    ],
    whenAll: [
      ["fiori", "sso", 8],
      ["fiori", "saml", 7],
      ["fiori", "ias", 6],
      ["principal", "propagation", 7],
      ["cloud connector", "fiori", 8],
      ["x.509", "fiori", 7],
      ["certrule", "fiori", 7]
    ],
    spokenAnswer:
      "When I configure Fiori SSO and Principal Propagation, I typically start in /UI2/FLP and /UI2/FLPCM_CUST so Launchpad content and auth settings are under control. From there I establish IdP trust with IAS through SAML2 — or OIDC where that is the design — and load the certificates in STRUST. On a hybrid landscape I enable short-lived X.509 Principal Propagation in SAP Cloud Connector, set RZ10 login/certificate_mapping_rulebased, and maintain CERTRULE so the certificate subject maps cleanly to the ABAP user. I then activate the OData services in /IWFND/MAINT_SERVICE and SICF and harden SM59 trusted destinations — never a hard-coded technical user for interactive apps. SSO only authenticates; backend AUTHORITY-CHECK and PFCG with S_SERVICE still enforce authorization, so I prove the path with a negative user via SU53, STAUTHTRACE, and /IWFND/ERROR_LOG and confirm SY-UNAME from the X.509 mapping.",
    steps: [
      "Open /UI2/FLP and /UI2/FLPCM_CUST, then configure Launchpad authentication with IAS using SAML2 and STRUST.",
      "Enable principal propagation / user mapping to the ABAP backend (CERTRULE, login/certificate_mapping_rulebased); harden SM59 trusted connections.",
      "Keep backend PFCG / S_SERVICE authorization as the enforcement plane after SSO."
    ],
    validation: "Prove SSO identity separately from backend authorization with positive and negative app data calls.",
    boundary: "SSO authenticates; it does not replace backend authorization or PFCG roles.",
    contrast: "Fiori SSO via IAS establishes Launchpad identity; Principal Propagation and backend roles still enforce authorization."
  },
  {
    id: "fiori-app-configure",
    product: "Fiori",
    service: "Fiori app activation and catalog assignment",
    intent: "implement",
    broadFallback: false,
    sourceFiles: ["knowledge/fiori/fiori-security.md"],
    requireAny: ["configure", "set up", "setup", "activate", "how do you"],
    task: [
      ["fiori app", 6],
      ["configure a fiori", 6],
      ["fiori application", 5],
      ["/ui2/flpcm_cust", 5],
      ["catalog", 3],
      ["tile", 2]
    ],
    whenAll: [
      ["fiori", "app", 7],
      ["configure", "fiori", 7],
      ["fiori", "catalog", 6]
    ],
    excludeAny: ["sso", "saml", "principal propagation", "cloud connector", "x.509", "error", "troubleshoot"],
    spokenAnswer:
      "When I configure a Fiori app for Launchpad, I typically start in /UI2/FLPCM_CUST to assign the tile to the business catalog and target mapping, then confirm how it appears from /UI2/FLP. From there I activate the OData service in /IWFND/MAINT_SERVICE and the ICF node in SICF, and I keep authorization in PFCG with S_SERVICE plus the app-specific objects — a catalog alone never grants backend execute rights. To prove it I sign in as the business user so the tile is visible and the app launches, then run a negative path without the PFCG role and keep SU53, STAUTHTRACE, and /IWFND/ERROR_LOG clean on the entitled path.",
    steps: [
      "Assign the app in /UI2/FLPCM_CUST (catalog and target mapping) and confirm Launchpad content in /UI2/FLP.",
      "Activate OData in /IWFND/MAINT_SERVICE and SICF; assign PFCG / S_SERVICE authorization.",
      "Validate tile visibility and app launch for the entitled user; deny path for an unauthorized user."
    ],
    validation: "Entitled user launches the app from /UI2/FLP; unauthorized user cannot.",
    boundary: "A catalog assignment is not a substitute for PFCG authorization.",
    contrast: "Fiori app configuration starts at /UI2/FLPCM_CUST and /IWFND/MAINT_SERVICE; PFCG enforces the backend call."
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
  if (String(workflow?.spokenAnswer || "").trim()) {
    try {
      const { flattenDmgvTemplateToProse } = require("./generationGuard.js");
      return flattenDmgvTemplateToProse(String(workflow.spokenAnswer).trim());
    } catch {
      return String(workflow.spokenAnswer).trim();
    }
  }
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

function isExplicitComparisonWorkflow(workflow) {
  const requireAny = Array.isArray(workflow?.requireAny) ? workflow.requireAny : [];
  return requireAny.some((term) => /\b(?:differ|difference|versus|vs\.?|compared|comparison)\b/i.test(String(term || "")));
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
  // Conceptual product asks ("What is IAG?", "Explain IAG?") must not be answered by an
  // implementation procedure such as iag-general-implementation. Keep how/configure/steps asks on workflows.
  if (!/^\s*(?:please\s+)?(?:what (?:is|are)|explain|describe|define|outline)\b/i.test(q)) return false;
  if (isComparison(q)) return false;
  if (/\b(how|configur|upload|implement|set up|setup|troubleshoot|diagnos|walk me|where do you|what do you check|maintain|main steps|procedure|steps to)\b/i.test(q)) return false;
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

  const products = questionProducts(text);

  // Cross-product "differ from" asks must use an explicit comparison workflow (e.g. IAG vs GRC).
  // Never answer them with a single-product implementation procedure (that produced Cloud Foundry
  // setup prose instead of a technical architecture matrix).
  const comparisonCandidates = comparison
    ? selectedRanked.filter((row) => isExplicitComparisonWorkflow(row.workflow))
    : selectedRanked;
  if (comparison && products.size >= 2 && !comparisonCandidates.length) {
    return null;
  }
  const rankedForAnswer = comparisonCandidates.length ? comparisonCandidates : selectedRanked;

  const best = rankedForAnswer[0];
  const second = rankedForAnswer[1];
  if (comparison && second && second.score >= 2 && distinctSecondConcept(text, best, second)) {
    // Only merge contrasts when both workflows share the named product lane or the
    // question explicitly compares two concepts inside one product family.
    if (best.workflow.product === second.workflow.product && !best.workflow.spokenAnswer) {
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
      // Cross-product close scores: only emit when the leader is an explicit comparison workflow.
      if (comparison && !isExplicitComparisonWorkflow(best.workflow)) return null;
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

  if (comparison && products.size >= 2 && !isExplicitComparisonWorkflow(best.workflow)) {
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
