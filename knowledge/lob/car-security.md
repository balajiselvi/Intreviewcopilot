# SAP Customer Activity Repository Access

## Overview

SAP CAR (Customer Activity Repository) is a retail platform for POS and customer activity data, typically sitting on SAP HANA. Security interviews should treat it as an analytics/operational data platform: who can load POS data, who can run queries, and how personally identifiable or commercially sensitive activity is restricted. It is not Ariba and it is not SAC.

## Interview Summary

CAR access usually combines HANA database privileges, application users, and sometimes BW-style analytical restrictions depending on how reporting is consumed. POS data is high-volume and often personal. Least privilege on DBA-style HANA users and clear separation between POS inbound processing and enterprise reporting are the architectural points.

## 30 Second Interview Answer

I would secure CAR by separating the POS ingestion technical users from reporting users, then applying HANA object and analytic privileges on the activity data. If SAC or BW sits on top, that layer has its own authorization model — CAR HANA access is not the same as a SAC story permission.

## Distinctions

- HANA privileges on CAR tables/views
- Application processing users versus analysts
- Downstream SAC/BW authorization is a separate check
- Retail privacy and PCI-adjacent POS data need explicit controls

## Related Topics

- knowledge/hana/hana-authorization.md
- knowledge/bw/analysis-authorizations.md
- knowledge/sac/sac-security.md
