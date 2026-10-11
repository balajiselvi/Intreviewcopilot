# Interview Copilot — current status

One page for explaining the project. Branch `feature/interview-engine-v2`.

## Spoken version

Interview Copilot is a live assistant for a Principal Architect SAP Security and IAM interview. It listens to the interviewer, keeps only a real question, and answers from verified SAP procedure and the candidate’s documented experience.

There are three paths. A rehearsed question, such as “What is privileged access?”, returns the prepared script and does not call a model. A specific how-to, such as uploading an IAG ruleset or explaining an Access Request authorization policy, returns the checked procedure and does not call a model. An open design question goes to the model once. There is no second pass that rewrites the answer.

If the CV does not document the work, the answer says “I would,” rather than inventing an employer story. The last live defect was the model inventing an IAG screen after it had already been given the right notes. That class of question is now answered from the verified procedure.

## What it does

The app is a Next.js interview screen. Azure speech feeds `/api/chat`. The default model is `gpt-4o-mini`.

A turn is admitted, deferred, or ignored. An admitted question then takes one path:

| Path | When | Model calls |
|---|---|---|
| Prepared script | Rehearsed question | 0 |
| Verified procedure | High-confidence how-to | 0 |
| Single generation | Open design or explanation | 1 |

The knowledge base covers IAG, GRC, BTP, S/4HANA, Ariba, SuccessFactors, SAC, Datasphere, BW, IDM, HANA, IAS, and IPS. Product steps stay separate from the candidate’s CV.

## Settled IAG points

Authorization policy is configured in the Authorization Policy app. A policy set of type Access, Business Role, or Application/System holds policies. Each policy uses the Request Access action and attribute filters. After activation, Access Request search returns only those objects. That is not `RequestTypeRule`, which maps a request type to a workflow path. Sources: SAP Community, “Understanding Authorization Policies” (15 November 2025), KBA 3300664, and KBA 3195906 for IAG 2.0.

`SIAG_PAM_LAUNCH_PAD` is the PAM launch transaction only on SAP S/4HANA on-premise and SAP ERP, for SAP_BASIS 750 through 754. It is not the launch path for S/4HANA Public Cloud or a non-ABAP application. Source: SAP Learning, Preparing and Using the Privileged Access Management Service.

An Access Analysis ruleset is Rule Setup, a GRC-IAG-AA delivery, or the hybrid risk-definition sync. There is no Ruleset Management screen in that procedure.

## Evidence

Live `/api/chat` checks after the procedure path: 27 requests, no failures. The ruleset question and the authorization-policy question were each run five times. All ten stayed on the correct procedure with no model call. An open RISE design question still used exactly one generation.

## Not in this page

Local probe output and machine task notes are not part of the product. The knowledge index is rebuilt from the current markdown, including the split between Access Analysis rules and workflow-determination rules.
