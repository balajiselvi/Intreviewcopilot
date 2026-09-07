# IAG Access Analysis and SoD

## Overview

IAG Access Analysis is the cloud SoD and access-risk engine. It is a governance service. It is not IAS authentication and not IPS provisioning. For a Principal IAG interview, the design questions are ruleset fitness, hybrid coexistence with GRC ARA, false-positive handling, and what happens on a mover or access request.

## Interview Summary

Access Analysis evaluates users and roles against a ruleset of conflicting functions. Results drive mitigation, remediation, or request blocking. On-premise GRC ARA uses the same idea on ABAP connectors. In a RISE or hybrid program you decide whether IAG, GRC, or both are the system of record for risk, and you keep function definitions aligned or you will explain two different risk numbers to audit.

## 30 Second Interview Answer

IAG Access Analysis tells you whether proposed or existing access violates the SoD ruleset. I would use it to simulate before assigning a business role, and to monitor residual risk after go-live. I would not call IAS or IPS “IAG components.” They feed identity into the landscape; Access Analysis judges the access.

## 60 Second Interview Answer

Ruleset quality is the product. Functions group actions. Risks pair incompatible functions. Permissions bind those actions to transactions, Fiori apps, or cloud entitlements at the right granularity. A ruleset copied from ECC without Fiori and cloud apps will under-report. A ruleset that treats every display transaction as a posting risk will over-report and train the business to ignore it.

Hybrid: if GRC ARA still governs ECC and IAG governs cloud, I would map ownership by system, not run two uncoordinated campaigns on the same S/4 client. The bridge exists so analysis can span; it does not remove the need for one accountable risk definition.

Remediation versus mitigation: remove access when the job does not need both sides. Mitigate when the business genuinely needs a conflict, with a control owner, monitoring, and expiry. Firefighter is for break-glass, not for standing SoD.

Joule for IAG, where licensed, is an assistant on top of this model. It does not replace ruleset design or Access Analysis. I would describe it as a way to query and navigate governance content, and I would verify the customer’s actual IAG edition before claiming features.

## Implementation Sequence

1. Confirm which systems IAG will analyze
2. Load or redesign functions for S/4, Fiori, and in-scope cloud apps
3. Connect targets and identity source
4. Baseline analysis and false-positive cleanup
5. Embed simulation in Access Request
6. Define mitigation workflow and certification use of the same risk content

## Related Topics

- knowledge/iag/iag-overview.md
- knowledge/grc/ara.md
- knowledge/grc/rulesets.md
- knowledge/grc/mitigation.md
