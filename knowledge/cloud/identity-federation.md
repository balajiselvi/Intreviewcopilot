# Identity Federation for SAP Landscapes

## Overview

Identity federation links a corporate identity provider to SAP applications so the user authenticates once and SAP applications trust a signed assertion. In current SAP Cloud Identity Services landscapes, Identity Authentication (IAS) is the SAP-facing identity provider or broker. IAS may authenticate locally or forward the browser to a corporate IdP, then issue a new SAML 2.0 or OpenID Connect token to the application. Authorization stays in the target application. IPS provisions the directory entry. IAG or GRC governs access risk. Source checked 2026-10-21: SAP Architecture Center, Authentication with SAP Cloud Identity Services (archived reference architecture, last updated 2025-05-13); SAP Learning journey Introducing SAP Cloud Identity Services, Customizing the Login process.

## Interview Summary

I would design federation as corporate IdP → IAS → SAP application. IAS terminates the authentication flow and issues the application token. The application enforces authorization. I would not claim that federation alone grants PFCG roles, BTP role collections, or Ariba groups.

## Configure corporate IdP federation through IAS

I would treat Identity Authentication as the SAP-facing identity provider or broker for the SAP landscape. I would establish trust between IAS and the corporate IdP using SAML 2.0 or OpenID Connect metadata, then configure conditional authentication so employee traffic is forwarded to that IdP when the application requires it. After the corporate IdP authenticates the user, IAS accepts the incoming token, applies the application configuration, and issues a new SAML or OIDC token to the SAP application. I would keep Identity Directory users available when the landscape needs cross-application correlation, group mapping, or SaaS features that require a persisted identity. I would validate by signing in as a test user from the corporate domain, confirming the redirect chain, MFA policy, and that the application session starts without a second password prompt. I would not treat a successful federation login as proof that the user has the correct business role in the target system.

## Sources and scope

- SAP Architecture Center reference architecture for authentication with SAP Cloud Identity Services, checked 2026-10-21. The page is marked archived and must not be treated as the only current product guide.
- SAP Learning, Introducing SAP Cloud Identity Services: SAML 2.0 federation, OIDC, IdP proxy to a corporate IdP, and conditional authentication.
- SAP Note 3521979 documents deprecation of SAML for user-interactive authentication in BTP accounts; prefer the current OIDC trust path for BTP user login when that note applies.
- Identity plane only. Do not invent button labels for a specific corporate IdP console.
