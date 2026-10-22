# SAP Ariba Security & Procurement Governance Architecture

Spoken architect style: Decision → Mechanism → Governance → Validation.

**Product boundaries:** SAP Ariba realm authorization is **group- and permission-based** (and project/document team access where applicable). It is **not** PFCG, **not** BTP role collections, and **not** IAG Access Analysis unless an Ariba connector/ruleset is explicitly in the landscape. Authentication is typically SAML/OIDC via corporate IdP / IAS; SSO does not grant Ariba groups.

**Anti-surface rule:** Prefer realm groups (e.g., purchasing vs approval), project-team ACL, supplier-side access, and IPS provisioning keys over “Ariba has roles like SAP.”

## Q1: How do you architect Ariba authorization so group permissions and project/document ACLs do not get conflated?

- **Decision:** Treat realm **user groups** as the coarse permission plane (what solutions/actions a user may perform) and **project/document team membership** as the object-level plane (which sourcing project or contract workspace they see).
- **Mechanism:** In Ariba Administrator / User Manager, assign groups appropriate to the solution (Buying, Sourcing, Contracts, Supplier Management). Confirm group description capabilities (e.g., purchasing create vs approval—site-specific). For Sourcing/Contracts, add users to project teams with roles (Owner, Active Team Member, etc.) so document visibility follows team ACL even when the user has the solution group.
- **Governance:** Create-vs-approve SoD must be enforced in group design and workflow—not assumed from S/4 composites. Project owners cannot silently add themselves as sole approver where policy forbids.
- **Validation:** User with Purchasing group but not Approver cannot approve; user with Contracts group but not on Project X cannot open X; team add grants access without changing global groups.

## Q2: How do you separate Ariba Administrator from business procurement personas?

- **Decision:** Ariba Administrator / Customer Administrator capabilities are privileged—isolated from buyer, approver, and sourcing manager day jobs.
- **Mechanism:** Limit Administrator group membership; use delegated admin patterns where available; separate user import, group management, and template administration. Business users get solution groups only. Integration users get API/web services permissions without UI admin.
- **Governance:** Dual control for Administrator membership changes; quarterly privileged access review; break-glass admin with ticket.
- **Validation:** Buyer cannot open Ariba Administrator; admin action audit/history shows named privileged user; integration user fails UI admin navigation.

## Q3: How do you federate identity (IAS / corporate IdP) without mistaking SSO for authorization?

- **Decision:** IdP authenticates the subject into the correct Ariba realm; Ariba groups (or SCIM/IPS assignment) authorize. SAML assertions do not replace group governance unless explicitly mapped and owned.
- **Mechanism:** Configure SAML/OIDC trust to IAS or corporate IdP; align NameID with Ariba unique user key. Provision users via IPS/SCIM or approved user import; assign groups in the same pipeline or via controlled admin process. Disable lingering local passwords for workforce users where SSO is mandatory.
- **Governance:** Orphan local accounts banned; leaver must disable SSO subject and Ariba user in the same SLA window.
- **Validation:** SSO success with zero groups → cannot perform procurement actions; after group assign, action succeeds; wrong-realm user cannot access site.

## Q4: How do you design buyer vs approver vs invoice processor SoD across Ariba and S/4?

- **Decision:** Enforce requester/buyer ≠ approver in Ariba workflows, and re-validate when POs/invoices post to S/4—cross-system SoD is a governance design, not an automatic GRC outcome.
- **Mechanism:** Map personas to disjoint Ariba groups and approval graphs; in S/4, separate PR/PO create vs approve authorizations if documents land there. If IAG/GRC has Ariba connector + ruleset, run cross-system analysis; otherwise maintain manual/compensating control matrix.
- **Governance:** Risk owners for procurement SoD; mitigations time-bound. Do not claim “GRC covers Ariba” without connector evidence.
- **Validation:** Same test user fails approval after create; cross-system report or control matrix shows no standing toxic pair; sample workflow audit trail retained.

## Q5: How do you secure Supplier Management and supplier-facing users differently from buy-side users?

- **Decision:** Supplier users are external identities with tightly scoped supplier-side permissions—never reuse buy-side Administrator patterns.
- **Mechanism:** Enable supplier users in the supplier realm/account model; grant only supplier collaboration permissions; authenticate per supplier IdP or Ariba supplier credentials per program design. Separate internal supplier managers (buy-side) from external supplier contacts.
- **Governance:** Supplier admin rights reviewed; data visibility limited to that supplier’s records; GDPR/contractual data processing terms applied.
- **Validation:** Supplier A cannot see Supplier B data; internal buyer without supplier-manager group cannot modify supplier sensitive fields; access review sample completed.

## Q6: How do you provision joiners and revoke leavers for Ariba at enterprise scale?

- **Decision:** HR/EC (or corporate IAM) is source of truth; IPS or IAM feed creates/disables Ariba users and group memberships based on job attributes—not ad-hoc emails to administrators.
- **Mechanism:** IPS target connector / SCIM for Ariba where supported; transformations map jobCode → Ariba groups. Termination: active=false / group removal. Movers: remove old purchasing unit groups, add new. Correlation key stable (employee ID/email).
- **Governance:** Same-day privileged leaver SLA; monthly orphan-account reconcile (Ariba users with no HR active match).
- **Validation:** Joiner test receives expected groups; leaver cannot SSO; reconcile report shows zero critical orphans.

## Q7: How do you govern APIs, integration users, and CIG / Integration Suite connectivity?

- **Decision:** Integration identities are least-privilege technical users for specific interfaces (PO export, invoice, master data)—not shared human Administrator accounts.
- **Mechanism:** Create dedicated integration users; assign only required web services/API permissions; store secrets in enterprise secret store / CyberArk; rotate credentials; monitor interface failures separately from human SSO issues. Document which integration moves PII/pricing.
- **Governance:** No shared integration password in mailboxes; certificate expiry calendar owned by integration + security.
- **Validation:** Integration call succeeds with technical user; same user denied unrelated admin APIs; rotation test updates secret and reconnects.

## Q8: How do you troubleshoot “user signs in but cannot create a requisition / open a workspace”?

- **Decision:** Split diagnosis: wrong realm, missing solution group, missing purchasing unit / commodity entitlement, missing project team, or workflow configuration—not “PFCG role.”
- **Mechanism:** Verify realm and user status; inspect User Groups; confirm solution-specific entitlement (purchasing unit); for documents, check project team; capture exact error. Confirm SSO NameID matches the Ariba user being inspected.
- **Governance:** Emergency group grants expire and require ticket; permanent fix via provisioning mapping.
- **Validation:** After group/team fix, action succeeds; control user without entitlement still fails; ticket includes before/after group list.

## Q9: How do you run access reviews and audit evidence for Ariba?

- **Decision:** Periodic certification covers Administrator groups, approval-capable groups, and supplier-manager roles—plus sample project-owner attestations for sensitive workspaces.
- **Mechanism:** Export user-group membership; certify with business owners; retain SSO/IdP config summary; retain SoD control testing evidence; log privileged admin changes.
- **Governance:** Failed certification → access removal within SLA. Audit requests answered with system extracts, not slide decks alone.
- **Validation:** Review campaign closed with removals evidenced; sample user pulled from extract matches UI groups; Administrator list matches approved roster.

## Q10: How do you position Ariba relative to S/4 procurement security in architecture interviews?

- **Decision:** Ariba authorizes cloud procurement collaboration; S/4 authorizes ERP posting and inventory/finance impact—design both, integrate identities, and test the handoff.
- **Mechanism:** Explain identity path: HR → IPS → IAS SSO → Ariba groups → document → integration → S/4 user/auth for posting. Name where SoD is enforced at each step.
- **Governance:** Architecture Decision Record states system of entry for PR/PO and which system enforces approve. Ambiguity rejected at Explore gate.
- **Validation:** End-to-end test ID completes Ariba action and, if in scope, posts in S/4 with correct auth; toxic path denied in at least one plane with evidence.
