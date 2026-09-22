# SAP Threat Detection and SIEM Integration

## Overview

Enterprise SIEMs such as Splunk or Microsoft Sentinel sit on network, OS, and identity telemetry. They have no native view of SAP application-layer attacks: SE16N/SE16 table downloads, unauthorized RFC execution, table or parameter changes, and debug or backdoor use inside the ABAP kernel. Those events live in SAP logs. An SAP-aware Threat Detection layer reads those logs, normalizes them, and forwards alerts into the SOC SIEM.

## Interview Summary

Position SAP Threat Detection between the SAP kernel and the enterprise SIEM. The engine (SAP Enterprise Threat Detection, or a third-party SAP-aware platform such as SecurityBridge or Onapsis) continuously reads Security Audit Log (SM19 configuration, SM20 evaluation; S/4 successors RSAU_CONFIG / RSAU_READ), Read Access Logging, change documents, and Gateway/RFC logs. It normalizes those streams to CEF or Syslog and forwards real-time alerts to Splunk, Sentinel, or the customer's SOC. IAS authenticates users; it is not this telemetry path.

## 30 Second Interview Answer

A network SIEM cannot see SE16N downloads, rogue RFC calls, or table-parameter changes inside SAP. I would sit an SAP Threat Detection layer on Security Audit Log, Read Access Logging, change documents, and Gateway/RFC, then ship CEF or Syslog alerts into the enterprise SIEM for unified incident response.

## 60 Second Interview Answer

Traditional SIEMs are blind at the SAP application layer. To close that gap I position an SAP-aware detection engine — Enterprise Threat Detection, or SecurityBridge / Onapsis where that is the customer's standard — against the kernel logs: SM19/SM20 Security Audit Log, Read Access Logging for sensitive table reads, change documents for configuration and master-data changes, and Gateway/RFC traces for interface abuse. The engine correlates those SAP-specific events, normalizes them to CEF or Syslog, and forwards them into Splunk, Sentinel, or the SOC so incident response stays unified. IAS and Cloud Identity are not this layer; they prove who the user is, they do not reconstruct what the user did inside ABAP.

## 90 Second Interview Answer

The architectural decision is visibility, not another identity product. Network and OS SIEMs never see AUTHORITY-CHECK outcomes, SE16N downloads, RFC destinations, or table-parameter changes. Those live in SAP: Security Audit Log (SM19 to filter and activate events, SM20 to evaluate; RSAU_* on current S/4), Read Access Logging for access to sensitive fields, change documents (CDHDR/CDPOS) for who changed what, and Gateway/RFC logs for interface and trusted-RFC abuse. An SAP Threat Detection engine reads those streams from the kernel, applies SAP-aware correlation (for example a download after a firefighter session, or RFC from an unexpected source), and emits CEF or Syslog into the enterprise SIEM. The SOC still owns incident response; the SAP layer supplies the application-layer signal they otherwise lack. I would not lead with Cloud Identity Services, custom SIEM rule workshops, or a generic logging-and-compliance close.

## Architecture

- Visibility gap: enterprise SIEM has network/OS/IdP telemetry, not SAP application events
- SAP log sources: Security Audit Log (SM19/SM20 or RSAU_CONFIG/RSAU_READ), RAL, change documents, Gateway/RFC, optionally STAD/SM21 for context
- Detection engine: SAP Enterprise Threat Detection or third-party SAP-aware engine (SecurityBridge, Onapsis)
- Handoff: CEF or Syslog (sometimes JSON) into Splunk, Microsoft Sentinel, or equivalent
- Identity plane stays separate: IAS/SSO proves who authenticated; detection proves what they did in the application

## Runtime Flow

A user action in SAP writes to the Security Audit Log and, where configured, RAL and change documents. The Threat Detection engine ingests those records near real time, matches them against SAP-specific patterns, and forwards a normalized alert to the SIEM. The SOC correlates that alert with endpoint or IdP events. Closing the loop is SIEM incident handling, not an SAP identity-provisioning job.

## Configuration

- Activate and filter Security Audit Log in SM19 (or RSAU_CONFIG); confirm evaluation in SM20
- Enable Read Access Logging for the sensitive tables and fields in scope
- Point the detection engine at the SAP system group; do not open inbound firewall for the SIEM — the engine pushes outbound CEF/Syslog
- Map SAP event types to SIEM use cases (data exfiltration, RFC abuse, privileged activity, configuration change)
- Keep firefighter / EAM logs in the same feed when privileged activity is in scope

## Common Interview Questions

1. Why can't Splunk or Sentinel replace SAP Threat Detection?
2. Which SAP logs actually feed a SOC use case?
3. Where do SM19 and SM20 sit versus RAL?
4. How do you position ETD versus SecurityBridge or Onapsis?
5. What is CEF doing in this architecture?
6. Does IAS belong in a SIEM integration design?
