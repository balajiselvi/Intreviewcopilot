# BW Analysis Authorizations

## Overview

Analysis authorizations restrict BW query data by characteristic values. They are not a substitute for S_RS_COMP execution checks. This file focuses on RSECADMIN design, 0BI_ALL, tracing, and hierarchy behavior. Execution-level objects are covered in bw-security.md.

## Interview Summary

RSECADMIN holds named analysis authorizations. PFCG assigns them through S_RS_AUTH. 0BI_ALL is full data and is an audit finding if used as a convenience default. Queries fail closed when required technical characteristics are missing on the provider. Hierarchy authorizations are a separate design choice from flat value lists.

## 30 Second Interview Answer

I would treat analysis authorization as row-level security on authorized InfoObjects. Maintain the authorization in RSECADMIN, assign it with S_RS_AUTH, and confirm 0TCAIPROV, 0TCAACTVT, and 0TCAVALID are on the provider. I would not give 0BI_ALL to business users to “make the query work.”

## 60 Second Interview Answer

Design starts on InfoObjects: which characteristics are authorization-relevant. Company code, plant, and sales org are typical. Too many relevant characteristics makes every query a support ticket.

RSECADMIN then defines which values, ranges, or hierarchy nodes a role may see, including aggregation and colon authorizations for totals. Generation from queries can accelerate build but still needs review, because generated authorizations copy whatever the developer could see.

Troubleshooting: if execution works and data is empty or an authorization message appears, I trace in RSECADMIN rather than SU53. SU53 will not explain a characteristic miss.

Trade-off: coarse analysis authorizations are maintainable and leak data across org units. Fine-grained ones match retail store or plant structures and explode change volume when org data moves. I would derive them from the same org model used in S/4 derived roles where the business is shared.

## Controls

- No 0BI_ALL in business roles
- Transport analysis authorizations with the same discipline as roles
- Test with representative characteristic values, not only developer IDs
- Keep technical users on explicit provider lists

## Related Topics

- knowledge/bw/bw-security.md
- knowledge/hana/hana-authorization.md
- knowledge/troubleshooting/authorization-errors.md
