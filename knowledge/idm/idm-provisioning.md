# Joiner, Mover, Leaver Provisioning

## Overview

Joiner/Mover/Leaver is the identity lifecycle that keeps access aligned with business responsibility. A promotion or division change is a mover event. The interview is testing whether you reason from the business change through mapping, provisioning, removal of obsolete access, and governance — not whether you can name PFCG first.

## Interview Summary

Joiner creates identity and birthright access. Mover changes attributes and must add new access and remove old access. Leaver disables or deletes access on time. IPS can execute those writes. IPS does not decide what a Finance Manager is allowed to post in S/4. That policy lives in role design and, where required, in IAG or GRC rulesets.

## 30 Second Interview Answer

When someone is promoted or changes division, the architectural objective is that their access matches the new responsibility and that stale access does not survive the org change. I would treat it as a mover: HR attribute change, identity correlation, mapping to the new business role set, governance check where risk is in play, provision the new access, deprovision the old access, then validate and keep an audit trail.

## 60 Second Interview Answer

A mover is not “run SU01 and add a role.”

1. HR records the new org, job, location, or company code.
2. The identity record is correlated so you are changing one person, not creating a second user.
3. Attribute-to-access mapping determines which business roles, BTP role collections, or analytics privileges the new job needs.
4. New access is provisioned to the targets that actually enforce it.
5. Obsolete access is removed. This is the step that fails in real programs — joiners are automated, movers keep historical roles.
6. If the new combination is SoD-sensitive, IAG Access Analysis or GRC ARA should evaluate it before or immediately after assignment, depending on the control design.
7. Authentication is unchanged unless the IdP group membership also drives SSO or entitlement.

I would only name Azure AD, SuccessFactors, or SAP IDM if they are in the landscape. The pattern is source → mapping → target → governance, not a fixed vendor chain.

## 90 Second Interview Answer

Joiner: create or enable the account, assign birthright access, register the correlation key, confirm first login path through the IdP and IAS where SAP cloud is in scope.

Mover: the dangerous case. Promotion and division change often keep the old company code, plant, or finance role sitting in the user buffer. Attribute-driven provisioning must be designed as replace or reconcile, not append. Derived roles and org levels are how S/4 usually expresses “same job, new org.” Composite business roles are how a job function is provisioned as a set. If mapping is wrong, IPS will faithfully distribute the wrong set.

Leaver: disable promptly, revoke roles, end firefighter IDs, pull IdP and IAS sessions according to policy, retain audit evidence. A delayed leaver is an access-governance failure even if authentication still works for a day.

Validation is part of the architecture: compare HR active population to SAP user master, find orphans, find users with no HR record, find roles that should have been removed after the last mover window. That is data analysis, not a T-code tour.

Automation versus control: high-volume retail or shared-service movers should be automated with monitored exceptions. High-risk finance or IT admin access should stay on an access-request path with SoD simulation. Mixing those two without a rule is how you get either a ticket swamp or an SoD swamp.

## Joiner Flow

HR hire → identity created in IdP/IAS as designed → IPS or IDM provisions user in targets → birthright roles assigned → optional IAG/GRC check → user can authenticate.

## Mover Flow

HR attribute change → lifecycle event → correlate identity → determine new access set → risk check if required → provision additions → remove obsolete assignments → reconcile → audit.

## Leaver Flow

HR termination → disable identity → deprovision targets → revoke privileged access → certify evidence for audit.

## Common Failures

- Append-only movers
- Duplicate accounts from weak correlation
- IPS success with wrong transformation
- Governance bypassed because “it was automatic”
- Leaver disabled in HR but Firefighter ID still valid

## Related Topics

- knowledge/idm/identity-control-planes.md
- knowledge/idm/idm-architecture.md
- knowledge/btp/ips.md
- knowledge/security/role-data-quality.md
- knowledge/grc/ara.md
- knowledge/iag/iag-access-analysis.md
