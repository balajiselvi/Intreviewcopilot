# GDPR and SAP Security Design

## Overview

The EU General Data Protection Regulation (Regulation (EU) 2016/679) sets principles and obligations for processing personal data. The seven principles in Article 5 are lawfulness, fairness and transparency; purpose limitation; data minimisation; accuracy; storage limitation; integrity and confidentiality; and accountability. SAP Security and GRC controls can support those principles with least privilege, access reviews, logging, and retention-aligned access design. Technical controls alone do not establish legal compliance. Pseudonymisation is not anonymisation. Not every processing activity requires consent, and not every organisation must appoint a Data Protection Officer. Organisation-specific legal advice stays with privacy counsel. Source checked 2026-10-21: European Commission, Principles of the GDPR, https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/principles-gdpr_en; GDPR legal text https://eur-lex.europa.eu/eli/reg/2016/679/oj.

## Interview Summary

I would map GDPR principles to SAP access design, privileged-access review, logging, and retention-aligned processes, and I would refuse to claim that PFCG or GRC alone makes the organisation GDPR compliant.

## Design SAP Security to support GDPR access control and accountability

I would review the SAP authorization and role configuration that can expose personal data, then assign only the permission needed for a documented purpose. I would maintain joiner-mover-leaver and access-request workflow evidence so every personal-data privilege change is traceable. I would review privileged and Firefighter access that can read or change personal data, use the Security Audit Log or the approved application log as evidence, and confirm retention or deletion configuration against the organisation schedule. I would validate the configuration by confirming who holds the permission, when the workflow approved it, what log evidence exists, and that a leaver no longer holds that privilege. I would not use a clean SU53 as privacy compliance evidence, and I would not invent a jurisdiction-specific notification deadline in the interview answer. Source checked 2026-10-21: European Commission GDPR principles and obligations pages; EUR-Lex Regulation (EU) 2016/679.

## Explain GDPR principles without claiming technology equals compliance

I would explain the Article 5 principles in business language and then show which SAP controls support each one. Purpose limitation and data minimisation drive role design that avoids broad display or extract access. Integrity and confidentiality drive authorization, privileged-access control, and secure interfaces. Accountability requires evidence that those controls operated. I would state that the controller remains responsible for demonstrating compliance, and that SAP configuration is one part of that control environment. Source checked 2026-10-21: European Commission, Principles of the GDPR.
