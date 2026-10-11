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
      "Confirm the question is about Access Analysis risk content. That is not the Access Request workflow project and not a GRC MSMP ruleset.",
      "Standard cloud content is requested from SAP under component GRC-IAG-AA. SAP loads the standard set; do not invent an upload of a threshold spreadsheet.",
      "Custom content on IAG 2.0 uses the Rule Setup app. Associate the ruleset with a business function group. Use the template file that Rule Setup itself provides, or ask SAP to load the standard set.",
      "A hybrid IAG Bridge keeps the on-premise ruleset as the source and runs the risk-definition sync.",
      "Verify by running Access Analysis or a request simulation and confirming the expected risk appears."
    ],
    boundary: "There is no IAG screen called Ruleset Management and no Upload Ruleset action in this procedure.",
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
      "Open the IAG Fiori launchpad, then Administration, Configuration, Business Rule, and Launch.",
      "Open project IAGWorkflowBusinessRule and the decision table RequestTypeRule.",
      "Map each request type to a pre-delivered path. Create a custom path only when no delivered path matches, and reuse the delivered stages.",
      "Activate and deploy the rule.",
      "Confirm the approvers exist in the IAS group IAG_WF_MANAGER and that SCI User Group Sync Job has run, otherwise the approver list stays empty."
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
      ["search scope", 4]
    ],
    steps: [
      "An authorization policy in IAG Access Request limits which systems, roles, users, or other entities a requestor can search and request.",
      "Open the Authorization Policy app. Create a policy set for Access, Business Role, or Application/System. Add a policy with the Request Access action and restrict the objects by attribute.",
      "Assign the policy set from user attributes and activate the policy. Access Request search then returns only those objects.",
      "It is not a PFCG authorization object and it is not the approval path. Verify by signing in as the requestor."
    ],
    whenAll: [["requestor", "search", 6]],
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
      ["who can raise", 4],
      ["requestor", 3]
    ],
    whenAll: [["submits", "access request", 5]],
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
  }
];

function mentions(text, term) {
  const q = String(text || "").toLowerCase();
  const t = String(term || "").toLowerCase();
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

function questionProducts(question) {
  const found = new Set();
  if (/\biag\b/i.test(question)) found.add("IAG");
  if (/\bgrc\b/i.test(question)) found.add("GRC");
  if (/\bbtp\b/i.test(question)) found.add("BTP");
  if (/\bs\/?4hana\b|\bs\/4\b/i.test(question)) found.add("S/4HANA");
  if (/successfactors/i.test(question)) found.add("SuccessFactors");
  return found;
}

function scoreWorkflow(question, workflow) {
  const products = questionProducts(question);
  const comparison = /\b(compar|versus|vs\.?|difference|different from)\b/i.test(question);
  if (products.size && !products.has(workflow.product) && !comparison) return 0;
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

  const ranked = WORKFLOWS
    .map((workflow) => ({ workflow, score: scoreWorkflow(text, workflow) }))
    .filter((row) => row.score >= 3)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length && /\biag\b/i.test(text) && /\brules?\b/i.test(text)) {
    return finish({
      id: "iag-rule-distinction",
      workflowId: "iag-rule-distinction",
      answer: "IAG has two different rule objects. Access Analysis risk content is maintained in Rule Setup, or SAP delivers the standard set under component GRC-IAG-AA. A hybrid landscape syncs the on-premise ruleset with the risk-definition sync. Workflow determination is separate: it maps a request type to a path. Which of those do you want?",
      route: "VERIFIED_WORKFLOW"
    });
  }

  if (!ranked.length) return null;
  const best = ranked[0];
  const second = ranked[1];
  const comparison = /\b(compar|versus|vs|difference|different from)\b/i.test(text);

  if (comparison && second && second.score >= 3) {
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
