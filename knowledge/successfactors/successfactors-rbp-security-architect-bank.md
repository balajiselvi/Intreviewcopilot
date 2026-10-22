# SAP SuccessFactors RBP Security Architecture

Spoken architect style: Decision → Mechanism → Governance → Validation.

**Product boundaries:** SuccessFactors Role-Based Permissions (RBP)—permission roles, permission groups, and target populations. This is **not** SAP PFCG, **not** BTP role collections, and **not** SAC roles. Employee Central (EC) data security, MDF permissions, and module permissions (Recruiting, Onboarding, Compensation, Performance) are distinct grant lists—name the module before listing permissions. HR-driven provisioning to S/4/BTP via IPS is a separate control plane from in-suite RBP.

**Anti-surface rule:** Prefer target-population mechanics, RBP admin separation, MDF/field-level controls, and IPS correlation keys over “SF has roles like SAP.”

## Q1: How do you architect SuccessFactors RBP so permission roles, groups, and target populations stay correctly separated?

- **Decision:** Treat three objects as mandatory and distinct: (1) permission role = what actions/fields, (2) permission group = who receives the role, (3) target population = whose employee data those people may act on.
- **Mechanism:** Admin Center → Manage Permission Roles: create role; grant module permissions (e.g., Employee Central → Employee Data → Edit/View field-level). Manage Permission Groups: dynamic rules on user attributes (Department, Division, Location, Job Code, Custom fields). Assign role to group; set Target Population (Everyone / Other groups / Dynamic). Never equate “HR Business Partner group” with “target = Everyone” unless that is an explicit global HR admin design.
- **Governance:** Global Admin roles with target Everyone require dual approval and quarterly review. SoD: person who edits compensation worksheets must not unilaterally approve their own population where policy forbids.
- **Validation:** Test user in group A with target = Org Unit X can open employee in X and receives “no permission” / empty search for employee in Org Unit Y; RBP Troubleshooting / Check Tool confirms role + group + target binding.

## Q2: How do you separate SuccessFactors administrators so suite admins cannot silently grant themselves Sensitive HR access?

- **Decision:** Split proxy/admin capabilities: RBP administrators, EC administrators, Integration/API admins, and business HR roles—no single “SF_ALL” persona in Production.
- **Mechanism:** Restrict Manage Role-Based Permission Access and Manage Permission Roles to a small IAM/HRIS admin group. Separate Manage User, Reset Password, and Proxy Management. Disable standing Proxy for Production admins except break-glass with ticket. For API: provision dedicated OAuth2 / OData API users with Integration Center / API login permissions only—not full EC UI admin.
- **Governance:** Changes to RBP admin group membership require Change Request + HRIS + Security approval. Proxy sessions logged and reviewed for privileged IDs.
- **Validation:** Non-admin cannot open Manage Permission Roles; API user authenticates to OData but cannot access Admin Center UI; audit/change history shows who modified permission roles.

## Q3: How do you secure Employee Central field-level and effective-dated data for HRBP versus employee self-service?

- **Decision:** Field-level RBP and view/edit distinctions implement least privilege on EC elements (Personal Information, Job Information, Compensation Information, National ID)—not job-code alone.
- **Mechanism:** In permission role, under Employee Data, set View/Edit per HRIS element and field. Use target population so HRBP only sees assigned orgs. Employee Self-Service roles grant Edit only on ESS-allowed fields; block National ID / bank details where policy requires specialist roles. Respect country-specific fields and GDPR-sensitive blocks via separate roles per region where needed.
- **Governance:** Sensitive fields (bank, national ID, disability, compensation) have named data owners; exports via Integration Center require DPIA/approval.
- **Validation:** ESS user edits phone but cannot edit salary; HRBP edits Job Info in target org only; attempt cross-org search fails; field-level deny evidenced in UI and RBP check.

## Q4: How do you design joiner–mover–leaver so SF employment events revoke suite access and trigger downstream SAP deprovisioning?

- **Decision:** Employment status and job attributes in EC are the system of record for lifecycle; RBP dynamic groups react to attributes, while IPS (or corporate IAM) provisions/deprovisions IAS, S/4, BTP, and Ariba.
- **Mechanism:** Map Event Reasons / employeeStatus (Active, Terminated, Leave) into IPS source filters and transformations. On termination: remove SF dynamic group membership automatically; IPS job deactivates IAS user and removes S/4 roles / BTP role collections. Movers: department/jobCode change updates SF target eligibility and IPS delta updates derived access. Correlation: `userId` / `personIdExternal` / email must be stable keys in IPS transformations.
- **Governance:** Same-day leaver SLA for privileged SF and downstream SAP access; no manual-only leaver process for Production. HR tickets cannot leave terminated users Active “for reporting.”
- **Validation:** Terminate test employee → SF login blocked / group empty → IPS job log shows target updates → IAS inactive and S/4 user locked/validity ended; mover changes org → target population access follows within IPS schedule.

## Q5: How do you apply MDF (Metadata Framework) permissions without opening object definitions to the wrong personas?

- **Decision:** MDF object permissions are a separate grant surface from EC HRIS element permissions—configure Create/View/Correct/Import per object definition and secure sensitive custom objects.
- **Mechanism:** Admin Center → Configure Object Definitions + Manage Permission Roles → Miscellaneous Permissions / MDF foundation objects. Grant only required actions (View vs Correct vs Import). Secure Position, custom MDF objects, and workflow-related objects individually. Restrict Configure Business Rules / Configure Object Definitions to HRIS engineering roles.
- **Governance:** Production object-definition changes follow transport/refresh governance for the SF instance strategy; no ad-hoc field adds without data dictionary update.
- **Validation:** Business user can View Position but cannot Correct; admin without MDF grant cannot open Configure Object Definitions; import job fails for unauthorized user.

## Q6: How do you secure Recruiting, Onboarding, and Compensation modules as separate RBP domains?

- **Decision:** Module permission sets are independent—Recruiting operator access does not imply EC Job Info edit or Compensation worksheet admin.
- **Mechanism:** Grant Recruiting permissions (requisition create, offer approval) only to Recruiting roles with appropriate target (e.g., brand/location). Onboarding: separate onboarding participant vs admin. Compensation: worksheet planning vs executive review vs admin configuration (Compensation Admin). Avoid stacking all Talent modules into one “HR Power User” role.
- **Governance:** Offer approval vs requisition create treated as SoD-sensitive where policy requires dual control. Compensation data access limited to comp cycle participants.
- **Validation:** Recruiter cannot open Compensation worksheets; Comp planner cannot create requisitions; Onboarding admin actions audited; cross-module negative tests documented.

## Q7: How do you integrate SuccessFactors with IAS/IPS and keep authentication separate from authorization?

- **Decision:** IAS (or corporate IdP via IAS) authenticates; SF RBP authorizes; IPS synchronizes identities—never assume SSO group assertion alone replaces RBP target populations.
- **Mechanism:** Trust SF as application in IAS; SAML/OIDC SSO. IPS source = SF (or HR) with transformations to IAS/S/4/BTP targets. Optional: map IdP groups for initial admin bootstrap only. API integrations use OAuth client credentials / certificate with least SF permissions.
- **Governance:** Break-glass local SF admin password controlled; SSO enforced for workforce users. Certificate/secret rotation owned by IAM.
- **Validation:** SSO login succeeds but user without RBP sees Admin Center denied; IPS provisioning log correlation ID matches personIdExternal; revoked IdP user cannot SSO.

## Q8: How do you troubleshoot “user can log in but cannot see an employee / field / tile”?

- **Decision:** Diagnose as RBP binding failure (role/group/target), module permission miss, or target population miss—not as “SAP role missing.”
- **Mechanism:** Confirm SSO subject matches SF userId. Use RBP Troubleshooting / User Role search: list granted permission roles and groups. Verify target population rules against the viewed employee’s Job Info. Check field-level View flags and MDF grants. For tiles/home page: check role-based home page / deep link permissions separately from EC field grants.
- **Governance:** Production RBP “grant Everyone target” quick-fixes banned; temporary grants expire and are ticketed.
- **Validation:** After correcting target population, user sees employee; control user outside population still denied; screenshot of RBP check attached to ticket.

## Q9: How do you govern People Analytics / reporting access to sensitive HR datasets?

- **Decision:** Analytical access is constrained by SF permission and report/schema security—reporting roles are not a bypass of EC field-level RBP intent.
- **Mechanism:** Restrict report stories / canvas / table reports via RBP report permissions; limit PII-bearing domains to analytics roles with need-to-know target. Where Identity Auth feeds SAC or BW, apply SAC DAC / BW analysis authorizations in addition—SF grant alone is insufficient for those platforms.
- **Governance:** HR analytics extracts require data-owner approval; bulk export monitored.
- **Validation:** Analyst without comp permission cannot open compensation report; SAC live connection user still restricted by SAC model DAC; attempt to export restricted domain fails.

## Q10: What Production evidence pack do you require for SuccessFactors RBP go-live or audit?

- **Decision:** Auditors need proof of admin separation, sensitive-field controls, leaver timeliness, and change history—not a PDF of all permission role names alone.
- **Mechanism:** Export permission role matrices (role → permissions → groups → targets); privileged admin membership lists; sample positive/negative test evidence; IPS job logs for JML; SSO/IAS trust config summary; change tickets for RBP modifications.
- **Governance:** Quarterly access certification for SF admin and sensitive HR roles; residual risks documented with owners.
- **Validation:** Walkthrough: terminate user → access gone in SF + downstream; HRBP cross-org deny; admin SoD membership report clean; ticket artifacts match instance change history.
