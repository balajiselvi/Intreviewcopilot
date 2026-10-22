# SAP Analytics Cloud (SAC) Security Architecture

Spoken architect style: Decision → Mechanism → Governance → Validation.

**Product boundaries:** SAC has **application roles/permissions** (what users can do in SAC) and **model data access** (Data Access Control / dimension restrictions). Broader roles can override model DAC—design both explicitly. Live connections to BW/S/4/HANA enforce additional backend authorizations; acquired data relies more on SAC-side controls. IAS/IdP authenticates; SAC teams/roles authorize.

**Anti-surface rule:** Prefer DAC dimension members, role privilege matrices, live vs acquired differences, and backend auth dependency over “SAC has folders.”

## Q1: How do you separate SAC application roles from model-level Data Access Control?

- **Decision:** Application roles define create/share/admin capabilities; DAC restricts which dimension members a user can read/write in a model. Both must be designed—admin-type privileges can bypass intended DAC.
- **Mechanism:** Assign SAC roles (e.g., Viewer, Modeler, Admin equivalents per tenant naming) via Users/Teams. On models, enable Data Access Control for dimensions (e.g., Company Code, Cost Center); maintain read/write member access per user/team. Do not grant expansive admin roles to business analysts who should only see one company code.
- **Governance:** Model owners approve DAC changes; Security reviews any role with user/role administration or wide share rights quarterly.
- **Validation:** User with Viewer + DAC company 1000 sees only 1000 in story; user without DAC members sees empty/denied; Admin role explicitly tested for bypass behavior and limited to named admins.

## Q2: How do you design teams and user provisioning with IAS/IPS?

- **Decision:** Prefer IdP/IAS groups mapped into SAC teams for business cohorts; keep SAC Admin team membership out of open self-service groups.
- **Mechanism:** SAML/OIDC SSO via IAS; map assertion groups to SAC teams where supported; IPS provisions user lifecycle (create/deactivate). On leaver, deactivate SAC user and remove team memberships. Correlation: email/userName aligned with IAS.
- **Governance:** Standing full Admin via SSO group requires CAB. Orphan SAC users reconciled monthly against HR active population.
- **Validation:** New joiner SSO lands in correct team; leaver cannot open tenant; group removal removes story share access as designed.

## Q3: How do you secure live connections to BW, S/4, and HANA differently from acquired data models?

- **Decision:** Live connection security is **backend-authoritative** (BW analysis auth / S/4 auth / HANA analytic privileges) plus SAC object access; acquired models need stronger SAC DAC and import job governance.
- **Mechanism:** Configure live connection with named technical or SSO passthrough per product guidance; ensure backend user has least privilege. For acquired: restrict model import/schedule credentials; apply DAC; limit who can export. Document which stories are live vs acquired in the data product catalog.
- **Governance:** Architecture Decision Record per data product states enforcement layer. “DAC only” rejected for live BW without backend analysis auth.
- **Validation:** Backend deny (BW trace / S/4 SU53 / HANA privilege) removes data even if SAC story is shared; acquired model DAC deny verified independently.

## Q4: How do you distinguish Planning versus Analytics security?

- **Decision:** Planning write-back and version/publish privileges are higher risk than analytics read—separate roles and DAC write flags.
- **Mechanism:** Grant planning model write / publish only to planner teams; analytics consumers get read. Use dimension write DAC where planning is constrained by org. Protect public dimensions and conversion rates as admin-maintained.
- **Governance:** Who can publish forecast versions is a named control; segregation from who administers the planning model structure.
- **Validation:** Analyst cannot publish planning version; planner writes only allowed members; admin-only dimension locked for planner edit.

## Q5: How do you govern story/folder sharing without creating shadow admin rights?

- **Decision:** Sharing is an access path—default to team-based share, least privilege links, and restrict “share with all users.”
- **Mechanism:** Place content in governed folders; assign folder roles to teams; disable promiscuous share where tenant settings allow; educate authors that share grants access independent of original DAC intent for some object types—retest after share.
- **Governance:** Public folder write limited to content admins. Periodic review of widely shared sensitive stories.
- **Validation:** Share-with-team works; random user without team denied; sensitive story not in all-users share list.

## Q6: How do you administer SAC tenant privileges (user admin, connection admin) safely?

- **Decision:** Split tenant administration: user/role admin, connection admin, and content admin—avoid one superuser for daily work.
- **Mechanism:** Named administrators for Users/Roles, Connections, and System monitoring. Use activity logs for admin actions. Technical connection users/secrets stored in secret management; rotate.
- **Governance:** Dual control for adding Administrators; break-glass procedure documented.
- **Validation:** Content admin cannot add system administrators (or attempt fails per role matrix); connection secret rotation reconnects live source; audit log shows admin change.

## Q7: How do you troubleshoot “user opens story but data cells are empty / error”?

- **Decision:** Diagnose layers: SSO/user active → team/role → story share → model DAC → live backend auth → data existence.
- **Mechanism:** Confirm user/team; check role privileges for the story type; inspect DAC member assignments; for live, trace backend (RSECADMIN / STAUTHTRACE / HANA). Distinguish filter defaults from authorization empties.
- **Governance:** Fix with least privilege at the correct layer; ban granting Admin to clear empty cells.
- **Validation:** Layer test matrix documented on ticket; after fix, authorized slice appears; unauthorized member still empty.

## Q8: How do you monitor and audit SAC user activity for compliance?

- **Decision:** Use SAC activity / audit capabilities plus IdP sign-in logs to evidence access to sensitive analytics.
- **Mechanism:** Enable and retain activity logging per tenant policy; export admin and data-access relevant events for SOX/HR analytics reviews; correlate with IAS login traces for privileged users.
- **Governance:** Retention aligns with corporate audit policy. Suspicious mass export investigated as security incident.
- **Validation:** Sample admin action appears in activity log; access review pulls active users with Admin role matching approved list.

## Q9: How do you secure export, API, and Automation / add-on access?

- **Decision:** Export and API access are data-exfiltration paths—permissioned separately from story view.
- **Mechanism:** Restrict export privileges in roles; constrain OAuth clients / API users to least scopes; monitor scheduled publications. For integrations (Embedding, BI clients), use dedicated OAuth apps with rotation.
- **Governance:** PII/finance story export requires data-owner approval. API client ownership recorded in CMDB.
- **Validation:** Viewer without export cannot download; API client with revoked secret fails; publication schedule owned by approved team.

## Q10: What go-live evidence pack do you require for SAC?

- **Decision:** Evidence includes role matrix, team mapping, DAC design for critical models, live-connection backend auth proof, and admin roster—not screenshots of pretty stories alone.
- **Mechanism:** Deliver role→privilege matrix; model DAC tables; connection inventory (live/acquired); SSO config summary; UAT positive/negative scripts; leaver test.
- **Governance:** Deploy quality gate blocked if Admin roster or DAC for material models unsigned.
- **Validation:** Walkthrough: company-code deny; live backend deny; admin separation; IPS leaver disables SAC user.
