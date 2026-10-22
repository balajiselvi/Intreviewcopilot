# OAuth 2.0 in SAP Cloud and BTP Security

## Overview

OAuth 2.0 is the authorization framework SAP landscapes use for delegated access to APIs and for OpenID Connect login when Identity Authentication or another authorization server issues tokens. An OAuth access token proves that a client may call a protected resource. It does not replace application authorization design. On SAP BTP, role collections and scopes still decide what the authenticated principal may do inside the application. Destinations may use OAuth2 client credentials, principal propagation, or another supported authentication type for the outbound call. Source checked 2026-10-21: SAP Learning, Architecting Security for SAP Business Technology Platform, Authentication Reference Architecture; SAP Learning journey Introducing SAP Cloud Identity Services; SAP Architecture Center authentication reference for OIDC application login.

## Interview Summary

I would separate three layers. Identity Authentication or the corporate IdP authenticates the user. OAuth or OIDC issues the token the application or API client presents. The application or resource server enforces scopes and role collections. I would never say an OAuth client credential alone is a business role.

## Design an OAuth or OIDC trust for an SAP application

I would register the application as an OpenID Connect or OAuth client against Identity Authentication or the BTP authorization server that owns the trust, with the correct redirect URI and required scopes. For interactive users I would prefer the authorization-code flow: the browser is redirected to the authorization endpoint, the user authenticates, the client exchanges the authorization code at the token endpoint, and the application validates the ID token or access token before creating a session. For service-to-service calls I would choose whether the call must propagate the logged-in user or run as a technical client. Principal propagation keeps the business user's identity for the target authorization check. Client credentials authenticate the calling system only and must not be described as the end user. I would validate by completing a user login, inspecting the issued token claims that the application actually consumes, and confirming a protected API rejects a missing or wrong scope. I would not invent grant types the product does not document for that scenario.

## Sources and scope

- SAP Learning, Architecting Security for SAP BTP: OAuth for service-to-service calls; client and resource-server roles.
- SAP Learning, Introducing SAP Cloud Identity Services: OIDC login interoperability.
- SAP Architecture Center authentication reference: OIDC Resource Provider initiated application login through IAS.
- Scope is authentication and token exchange. Target authorization remains XSUAA role collections, PFCG, or the SaaS product model.
