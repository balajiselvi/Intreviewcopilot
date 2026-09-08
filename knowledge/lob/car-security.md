# SAP Customer Activity Repository Access

## Overview

SAP CAR (Customer Activity Repository) is a retail platform for POS and customer activity data, typically sitting on SAP HANA. Security interviews should treat it as an analytics/operational data platform: who can load POS data, who can run queries, and how personally identifiable or commercially sensitive activity is restricted. It is not Ariba and it is not SAC.

## Interview Summary

CAR access usually combines HANA database privileges, application users, and sometimes BW-style analytical restrictions depending on how reporting is consumed. POS data is high-volume and often personal. Least privilege on DBA-style HANA users and clear separation between POS inbound processing and enterprise reporting are the architectural points.

## 30 Second Interview Answer

CAR is a retail POS and customer-activity platform on HANA. I would separate technical users that load POS from analysts who query activity, then enforce HANA object privileges and analytic privileges on sensitive customer and basket data. Downstream BW analysis authorizations or SAC teams/folders are additional planes — a SAC story permission does not replace CAR HANA access. Enterprise IAM still authenticates via IdP/IAS and provisions the CAR/HANA user; it does not invent a PFCG catalog for CAR. Privacy and PCI-adjacent POS data need explicit purpose limitation, not generic encryption talk.

## Distinctions

- HANA privileges on CAR tables/views
- Application processing users versus analysts
- Downstream SAC/BW authorization is a separate check
- Retail privacy and PCI-adjacent POS data need explicit controls

## Related Topics

- knowledge/hana/hana-authorization.md
- knowledge/bw/analysis-authorizations.md
- knowledge/sac/sac-security.md
