# SAML 2.0 Authentication in SAP Landscapes

## Overview

SAML 2.0 is a federation protocol used when an application acts as a SAML service provider and an identity provider issues a signed assertion after the user authenticates. In SAP Cloud Identity Services, Identity Authentication can act as the identity provider or as a broker that accepts a corporate IdP assertion and issues a new assertion to the SAP application. SAML is authentication and session federation. It is not the place where PFCG roles, BTP role collections, or SoD rules live. Source checked 2026-10-21: SAP Learning journey Introducing SAP Cloud Identity Services; SAP Architecture Center authentication reference; SAP Note 3521979 for BTP interactive-login deprecation of SAML.

## Interview Summary

I would explain SAML as the assertion protocol between the identity provider and the application. For SAP cloud and hybrid landscapes I would put IAS in the middle so applications trust one SAP-facing issuer. I would keep authorization in the target product.

## Troubleshoot a SAML login failure for an SAP application

I would first confirm whether the failure is authentication or authorization. If the user never reaches the application home page, I would inspect the Service Provider or Resource Provider initiated redirect to Identity Authentication, the corporate IdP forwarding rule if configured, the metadata entity IDs, the signing certificate trust, the Assertion Consumer Service URL, and the NameID or subject mapping expected by the application. After IAS issues a new assertion, I would confirm the application accepted the token and created a session. If the user lands in the application but cannot run a business action, I would leave SAML and inspect the target authorization model. For BTP user-interactive login I would check whether the landscape still expects SAML or has moved to OpenID Connect under SAP Note 3521979. I would validate a fixed trust by a successful SP-initiated login for a known test user and by confirming the application session starts without a second password.

## Sources and scope

- SAP Learning, Introducing SAP Cloud Identity Services: SAML 2.0 interoperability and IdP proxy.
- SAP Architecture Center, Authentication with SAP Cloud Identity Services: SP-initiated SAML flow; IdP-initiated SAML is supported but not the recommended default.
- SAP Note 3521979: deprecation of SAML for user-interactive authentication in BTP accounts.
- Do not invent corporate IdP admin screens or claim SAML assigns SAP business roles.
