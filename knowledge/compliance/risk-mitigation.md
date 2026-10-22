# Risk Mitigation, Compensating Controls, and Remediation

## Overview

In SAP GRC Access Control, a mitigating control is a documented compensating control attached to an accepted access risk. In Process Control, a control is tested for design and operating effectiveness, and a failed test creates an issue with remediation. Do not call a Process Control business process a mitigation control. Source checked 2026-10-21: SAP Access Control mitigation and Process Control 12.0.27 issue remediation guidance already recorded in knowledge/grc/mitigation.md and knowledge/grc/process-control.md.

## Interview Summary

I would remediate an audit finding by naming the root cause, owner, corrective action, retest evidence, and closure, and I would keep Access Control mitigation distinct from Process Control issue management.

## Remediate an access or control audit finding

I would capture the finding, the population or sample that failed, and the risk if the control does not operate. For an Access Control SoD finding I would decide whether to remove access, redesign the role, or accept the risk with a mitigating control that has an owner and a review cadence. For a Process Control failed test I would create the issue, assign remediation, complete the plan, close the issue, and allow the system to route the retest to the original tester. I would retain evidence of the corrective action and the successful retest before claiming closure. Installing a workflow without completed reviews is not remediation. Source checked 2026-10-21: SAP Process Control 12.0.27 remediating evaluation issues; SAP Access Control mitigating controls practice in knowledge/grc/mitigation.md.
