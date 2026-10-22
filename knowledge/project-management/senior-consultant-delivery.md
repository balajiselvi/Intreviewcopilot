# Senior consultant delivery for SAP Security and GRC

These are the judgement calls a senior consultant owns on a client engagement. They sit on top of the product procedures for PFCG, Access Control, Fiori, and Process Control. They do not replace those procedures, and they do not invent a client, a date, or a measured outcome.

## Conduct a client security assessment

Start the assessment from the business processes that move money, master data, and sensitive personal data, not from a transaction inventory. Confirm the system scope, the release, and whether each system is ECC, S/4HANA on-premise, Private Edition, or Public Edition before naming an administration tool. Read current role design, SoD results, firefighter or emergency-access logs, and open audit findings, then separate a design defect from a provisioning defect and from a missing control owner. Record each finding with the evidence, the affected process, the owner, and the choice between redesign, a mitigating control, or an accepted residual risk. Validate the assessment by walking one finding back to the source evidence with the control owner before it enters the RAID log or the proposal.

## Explain security risk to a nontechnical stakeholder

Explain a segregation-of-duties conflict as two business duties that one person can complete alone, such as creating a vendor and paying that vendor, and name the loss that pairing can hide. Separate the technical role from the business decision. The security workstream can remove the conflict, reduce it with a narrower role, or keep it under a mitigating control with a named owner, a monitor, evidence, and a review cadence. Present the residual risk and the operating cost of each option, and let the business owner accept or reject the risk in the change record. Do not describe the risk as a list of authorization objects. Confirm the stakeholder can restate the duty pair, the chosen option, and who reviews the evidence.

## Handle disagreement between business and security

Treat the disagreement as a scope and risk decision, not as a contest of opinions. Restate the business outcome the owner needs and the control that the proposed access would break. Offer a least-privilege design that still completes the business task, and name the mitigating control only when the conflict cannot be removed. If the owner rejects the recommendation, record the decision, the residual risk, the owner, and the review date in the RAID log and the change-control record. Escalate to the sponsor when the rejected control is a go-live gate or an audit obligation. Validate the outcome by confirming the approved decision is the access that is built and tested, not the access that was first requested.

## Review a junior consultant role design

Review the role against the job, the organizational values, and the SoD result before looking at field-level detail. Confirm a single role holds the authorization data, a derived role inherits the imparting role menu and varies only the organizational levels, and a composite role is only an assignment package. Reject a design that copies a broad role, calls table AGR_USERS a transaction, or uses SU53 as proof that the business task succeeded. On Public Edition, reject a design that assigns access in PFCG. Require the assigned test user to complete the business transaction or app for the maintained organizational value after profile generation and user comparison. Send the review back with the failed check, the corrected design, and the retest, and use that review as the coaching note for the consultant.

## Recover a security workstream that is behind

Rebuild the critical path before adding people. Identify which security deliverables sit on the go-live path, which are blocked by a functional decision or a connector, and which can move in parallel. Keep the baseline plan and publish a forecast that shows the slip, the dependent milestones, and the recovery action. Do not compress testing, SoD remediation, or cutover rehearsal unless the dependency and the risk are explicit. Escalate the forecast, the options, and the decision needed to the sponsor through the RAID log. Validate recovery by the next quality gate: the roles or workflows on the critical path are built, transported, and passed by the business test, not merely reported as restarted.

## Manage a critical defect before go-live

Classify the defect by whether a user can complete a controlled business task, whether the failure is authorization, workflow, data, or integration, and whether a workaround exists that still leaves an audit trail. Hold the go-live gate when the defect allows an unapproved privileged action or an untested SoD conflict into production. Fix it in development, transport it, and retest it in quality before the production window. If the sponsor accepts a temporary workaround, name the owner, the expiry, the detective control, and the removal date. Validate the decision with a go/no-go record that states the evidence, the residual risk, and who is accountable after cutover.

## Estimate an SAP Security workstream

Estimate from scope, not from a universal duration. Count the systems, the release and edition, the role population, the SoD ruleset work, the workflow paths, the integrations, and the test cycles the sponsor will actually fund. State the assumptions, the dependencies on functional design and Basis, and the quality gates for role build, access-request rehearsal, and cutover. Keep a baseline and a forecast, and change the forecast only when scope, a dependency, or an approved decision changes. Do not quote a fixed month range as an SAP rule. Validate the estimate by tracing one in-scope process from role design through business test and naming the owner for each gate.

## Present a security proposal to a client

Open the proposal with the business problem, the control objective, and the decision the client must make. Describe the target design in the client's landscape: which system enforces access, which product governs requests and SoD, and which team owns emergency access and review. Separate a Public Edition business-role design from a PFCG design, and separate Access Control from Process Control. Include the delivery path through development, quality, user acceptance, and production, plus the RAID items that can move the date. Close on the evidence the client will receive at each quality gate. Validate the proposal by checking that every recommendation has an owner, a dependency, and a test, and that no recommendation depends on an invented metric.

## Mentor consultants and raise practice quality

Coach from a live deliverable, not from a generic lecture. Review one role, one workflow path, or one firefighter log with the consultant and mark the specific evidence that is missing. Require the same standard on the next deliverable: edition named, artifact type named, SoD result recorded, and the business task retested. Capture the repeated defect as a practice check so the next project does not rediscover it. Recognize sound judgement when the consultant escalates a real residual risk instead of hiding it in a broader role. Validate the coaching by the next review: the same defect does not return, and the consultant can explain the control to the business owner.

## Respond to an audit finding after go-live

Read the finding against the control it names, the population it tested, and the period it covers. Separate a role that grants a conflict, a request that bypassed approval, a firefighter session with a weak justification, and a review that was not performed. Contain the access if the finding is still exploitable, then correct the design or the operating control and transport the correction through quality before production. Assign an owner, a due date, and the evidence that will close the finding. Do not close it because a table shows an assignment or because SU53 is empty. Validate closure by repeating the auditor's test on the corrected population and retaining that evidence with the management response.

## Interview questions and follow-up probes

These prompts are preparation themes. They are not a confirmed Deloitte script, and they are not a procedure.

Round one, technical depth. How do you design a single role and prove the user can complete the business task? How do you keep Public Edition Fiori security apart from PFCG? How do you configure and troubleshoot an Access Control connector, an MSMP path, and a BRFplus agent rule? What do you do when risk analysis returns nothing, or when an access request stops at a stage? How do you remediate a critical SoD conflict, and when do you use a mitigating control instead? How do you set up Firefighter access and review the log? How do you move a GRC or role change through quality, user acceptance, and production?

Round two, senior consultant. How do you run a client security assessment? How do you explain a SoD risk to a finance owner? What do you do when the business rejects the control? How do you review a junior consultant's role design? How do you recover a workstream that slips, or stop a critical defect at the go-live gate? How do you estimate the security workstream without inventing a duration? How do you present the solution, coach the team, and answer an audit finding after go-live? Follow-up probes ask what you check first, how you know it worked, what you escalate, and what changes if the sponsor rejects the recommendation.
