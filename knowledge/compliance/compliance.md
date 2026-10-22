# Compliance Frameworks for SAP Security Interviews

## Overview

SAP Security and GRC interviews often ask how technology supports SOX ICFR, GDPR, ISO/IEC 27001, and related assurance frameworks. The frameworks are not interchangeable. SOX Section 404 addresses internal control over financial reporting for covered issuers. GDPR is an EU personal-data regulation. ISO/IEC 27001:2022 is an ISMS requirements standard. SOC 1 and SOC 2 are assurance reports with different objectives. COBIT is a governance and management framework. NIST CSF is a cybersecurity risk framework. PCI DSS applies when payment-card data is in scope. Source checked 2026-10-21 against the official sources recorded in sox.md, gdpr.md, and iso27001.md.

## Interview Summary

I would name the obligation or framework first, then the business risk, then the SAP control and evidence, and I would never claim one product makes the organisation compliant or certified.

## Choose the right compliance lens for an SAP security question

I would classify the question before answering. If the interviewer asks about financial-statement access risk, I would use SOX ITGC and ICFR language and Access Control evidence. If the question is about personal data, I would use GDPR principles and least-privilege design without inventing legal deadlines. If the question is about an ISMS or certification, I would use ISO/IEC 27001:2022 risk treatment and evidence language and state that certification is separate. For a service organisation report I would distinguish SOC 1 control objectives relevant to financial reporting from SOC 2 trust-services criteria. I would mention PCI DSS only when cardholder data is in scope. I would validate the answer by connecting obligation, risk, SAP control, owner, evidence, and retesting, and by refusing unsupported claims that technology alone equals compliance. Source checked 2026-10-21: knowledge/compliance/sox.md, gdpr.md, iso27001.md and the official references recorded there.
