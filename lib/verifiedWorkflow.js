/**
 * Deterministic delivery for a verified technical procedure.
 *
 * One record set, one scorer, one renderer. A high-margin match answers
 * without a model call. Open questions, experience questions, and close
 * scores fall through to the existing single generation.
 */

const EXPERIENCE_ASK = /\b(have you|did you|your experience|tell me about a time|walk me through a time)\b/i;

const WORKFLOWS = [
  {
    id: "iag-analysis-ruleset",
    product: "IAG",
    service: "Access Analysis",
    task: [
      ["ruleset", 4],
      ["rule setup", 4],
      ["grc-iag-aa", 4],
      ["risk definition", 3],
      ["risk-definition", 3],
      ["access analysis", 3]
    ],
    steps: [
      "Assuming you mean Access Analysis risk rules, open Administration > Rule Setup in the IAG launchpad. This is separate from Access Request workflow business rules and GRC MSMP.",
      "For a bulk update, select the Business Function Group to export, or select ALL for the complete ruleset, and choose Download File. Edit the downloaded ZIP contents using the structure documented in its Readme.txt.",
      "In Rule Setup, browse to the edited rules ZIP, select the Business Function Group, and choose Upload & Process. Wait for Processing Status, then inspect the Processing Log and Validation Log; correct validation errors before publishing the ruleset.",
      "Associate the target system with the applicable business function group, then run Access Analysis and confirm the expected functions and risks. Use the job-management app documented for that tenant's Cloud Foundry release: newer releases expose Manage Jobs, while older guides call it Job Scheduler. Do not assume the older label is universal; this release-dependent job terminology does not change the ruleset upload steps.",
      "For SAP-delivered standard content, request the ruleset through SAP Support under component GRC-IAG-AA. In a hybrid bridge landscape, synchronize on-premise GRC risk definitions with the Risk Definition Sync job; cloud rulesets are requested separately."
    ],
    boundary: "Do not confuse Access Analysis risk rules with Access Request workflow routing.",
    contrast: "Access Analysis risk content is maintained in Rule Setup or delivered by SAP under GRC-IAG-AA."
  },
  {
    id: "iag-workflow-determination",
    product: "IAG",
    service: "Access Request",
    task: [
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
    task: [
      ["firefighter", 4],
      ["grac_spm", 5],
      ["emergency access", 3]
    ],
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
    task: [
      ["assignment approver", 5],
      ["content approver", 5],
      ["role owner", 4],
      ["role designer", 3]
    ],
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
    task: [
      ["maintain business roles", 5],
      ["restriction type", 4],
      ["public cloud", 2]
    ],
    whenAll: [["public cloud", "business role", 5]],
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
    id: "sf-rbp",
    product: "SuccessFactors",
    service: "Role-based permissions",
    task: [
      ["role-based permission", 5],
      ["rbp", 3],
      ["manage permission roles", 5],
      ["permission group", 3]
    ],
    whenAll: [["successfactors", "permission", 5]],
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
    id: "btp-role-collection",
    product: "BTP",
    service: "Authorization",
    task: [
      ["role collection", 5],
      ["role template", 3]
    ],
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
  const canonical = (value) => String(value || "").toLowerCase().replace(/\brule[\s-]+set\b/g, "ruleset");
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
  return /\b(?:compared|comparing|comparison|versus|vs\.?|difference|different from)\b/i.test(String(question || ""));
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
  const q = String(question || "");
  const found = new Set();
  if (/\biag\b/i.test(q)) found.add("IAG");
  // SAP Access Control is the GRC product. These product-specific terms must
  // establish the same boundary as the acronym, or a generic IAG procedure
  // can win on shared words such as "request", "approver", or "workflow".
  if (/\bgrc\b|\baccess control\b|\bmsmp\b|\bbrf(?:\+|plus)\b/i.test(q)) found.add("GRC");
  if (/\bbtp\b/i.test(q)) found.add("BTP");
  if (/\bs\/?4hana\b|\bs\/4\b/i.test(q)) found.add("S/4HANA");
  if (/successfactors/i.test(q)) found.add("SuccessFactors");
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
  let score = 0;
  for (const [term, weight] of workflow.task) {
    if (mentions(question, term)) score += weight;
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

function renderWorkflow(workflow) {
  const lines = [`${workflow.product} ${workflow.service}.`, ""];
  workflow.steps.forEach((step, index) => {
    lines.push(`${index + 1}. ${step}`);
  });
  if (workflow.boundary) lines.push("", workflow.boundary);
  return lines.join("\n");
}

function selectVerifiedWorkflow(question) {
  const text = String(question || "").trim();
  const experienceAsk = EXPERIENCE_ASK.test(text);
  if (!text) return null;
  const finish = (result) => (result ? { ...result, experienceAsk } : null);

  const comparison = isComparison(text);
  const ranked = WORKFLOWS
    .map((workflow) => ({ workflow, score: scoreWorkflow(text, workflow) }))
    .filter((row) => row.score >= (comparison ? 2 : 3))
    .sort((a, b) => b.score - a.score);

  if (!ranked.length && /\biag\b/i.test(text) && /\brules?\b/i.test(text)) {
    return finish({
      id: "iag-rule-distinction",
      workflowId: "iag-rule-distinction",
      answer: "In IAG, Access Analysis rules are SoD risk content maintained in Administration > Rule Setup; upload a custom rules ZIP with Upload & Process and review its processing and validation logs. Standard cloud content is requested from SAP under component GRC-IAG-AA. Access Request workflow rules are separate: RequestTypeRule maps a request type to an approval path.",
      route: "VERIFIED_WORKFLOW"
    });
  }

  if (!ranked.length) return null;
  const best = ranked[0];
  const second = ranked[1];
  if (comparison && second && second.score >= 2 && distinctSecondConcept(text, best, second)) {
    return finish({
      id: `${best.workflow.id}+${second.workflow.id}`,
      workflowId: best.workflow.id,
      answer: `${best.workflow.contrast} ${second.workflow.contrast}`,
      route: "VERIFIED_WORKFLOW"
    });
  }

  if (second && best.score - second.score < 2) {
    return finish({
      id: `${best.workflow.id}|${second.workflow.id}`,
      workflowId: best.workflow.id,
      answer: `${best.workflow.contrast} ${second.workflow.contrast}`,
      route: "VERIFIED_WORKFLOW"
    });
  }

  return finish({
    id: best.workflow.id,
    workflowId: best.workflow.id,
    answer: renderWorkflow(best.workflow),
    route: "VERIFIED_WORKFLOW"
  });
}

module.exports = {
  WORKFLOWS,
  selectVerifiedWorkflow
};
