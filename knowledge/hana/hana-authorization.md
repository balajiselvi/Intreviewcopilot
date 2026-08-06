# SAP HANA Database Authorization

## Overview

SAP HANA authorization is built from five privilege types — system, object (SQL), analytic, package, and application — assigned through roles. Roles themselves come in two flavors with very different lifecycle characteristics: catalog roles, which are runtime SQL objects with no transport or versioning, and repository (design-time) roles, which are transportable, versioned development artifacts deployed through the HANA repository or HDI. The distinction between catalog and repository roles is one of the most commonly tested "do you actually know this or just the theory" points in a HANA security interview.

## Interview Summary

SQL/object privileges control access to database objects like tables and views, at the object level. Analytic privileges add row-level filtering on top of that — they restrict which rows of an analytic view a user can see, evaluated as a filter on the query's WHERE clause, which is the mechanism that makes them fundamentally different from object privileges. System privileges cover administrative actions. Package and application privileges are relevant mainly to classic repository development and XS classic applications respectively. On the role side: catalog roles are quick, SQL-granted, non-transportable, and tied to the database user who created them — if that user is deleted, the roles they granted are revoked. Repository/design-time roles are owned by the technical user _SYS_REPO, transportable between systems, and the recommended approach for anything that needs to ship with an application.

## 30 Second Interview Answer

HANA authorization has five privilege types: system privileges for admin tasks, object privileges for SQL-level access to tables and views, analytic privileges for row-level filtering on analytic views, and package and application privileges for repository development and XS classic apps. Roles come as catalog roles — quick, SQL-granted, not transportable — or repository roles, which are design-time, versioned, and transportable, which is why repository roles are the recommended approach for anything shipping with an application.

## 60 Second Interview Answer

HANA authorization is built from five privilege types. System privileges cover administrative activity like backup, audit, and catalog operations. Object privileges — sometimes called SQL privileges — are DDL/DML permissions like SELECT, INSERT, and CREATE, applied at the object level: table, view, or procedure. Analytic privileges are different in kind, not just degree — they filter rows within an analytic or calculation view, effectively adding a WHERE-clause restriction based on specific values, which is how HANA does row-level security. Package privileges and application privileges are narrower — they matter for classic repository development and XS classic applications specifically.

On the role side, the distinction that actually matters day to day is catalog roles versus repository roles. Catalog roles are runtime objects granted directly with SQL GRANT/REVOKE, owned by whichever database user created them, with no version management and no transport support — if that owning user gets deleted, every role they granted goes with them. Repository roles are design-time objects owned by the technical user _SYS_REPO, deployed through the repository or HDI, and transportable between systems, which is why they're the standard for anything meant to be part of a shipped application's security concept rather than an ad hoc grant.

## 90 Second Interview Answer

HANA's authorization model is five privilege types layered under a role. System privileges are administrative — audit admin, backup admin, catalog read, that category. Object privileges, also called SQL privileges, are the DDL/DML grants — SELECT, INSERT, UPDATE, CREATE — applied at the object level against tables, views, and procedures. That's object-level control, not row-level.

Analytic privileges are the mechanism that adds row-level control on top: they restrict which records of an analytic or calculation view a user can retrieve, evaluated as a filter condition during query execution — conceptually a WHERE-clause restriction the privilege injects based on specific attribute values. That's the answer to "how do you do row-level security in HANA," and it's a common follow-up after object privileges come up. Package privileges cover access to packages in the classic repository — relevant to design-time development of things like analytic views. Application privileges authorize access to XS classic applications and are typically granted to roles rather than individual users.

The role-type distinction is where I'd expect a sharper follow-up. Catalog roles are runtime SQL objects — quick to create with GRANT/REVOKE, owned by the creating database user, no transport, no version history. If that owning user is later deleted, every role they granted is revoked along with them, which is a real operational risk if catalog roles get used for anything that needs to persist. Repository roles are design-time artifacts, owned by the technical user _SYS_REPO rather than an individual, deployable and transportable between systems, and versioned — which is why they're the recommended approach when a role needs to ship as part of an application's security concept, or move cleanly between dev, test, and production. In an HDI-container-based landscape, roles are scoped to the container's schema once deployed, so the design-time-versus-runtime distinction carries through into how container-based development teams manage their own role content independently of the wider system's catalog roles.

## Architecture

- System privileges: administrative actions (backup, audit, catalog access)
- Object (SQL) privileges: DDL/DML grants on database objects — table/view/procedure level
- Analytic privileges: row-level filtering on analytic/calculation views, evaluated as a query-time filter
- Package privileges: access to classic repository packages for design-time development
- Application privileges: access to HANA XS classic applications, typically role-assigned
- Catalog roles: runtime SQL objects, owned by the creating user, no transport, no versioning
- Repository (design-time) roles: owned by _SYS_REPO, transportable, versioned, deployed via repository or HDI
- HDI container roles: design-time roles scoped to a container's schema once deployed, part of the container-based development model

## Configuration

- Catalog roles are created and granted directly with SQL: CREATE ROLE, GRANT, REVOKE
- Repository roles are authored as design-time artifacts and activated/deployed through the repository (classic) or HDI (container-based development), not granted directly by an individual user
- Analytic privileges are defined against a specific analytic or calculation view and reference the attribute values used to filter rows
- HDI container role deployment is scoped to that container's schema, keeping application-owned role content independent from the broader system catalog

## Implementation Activities

- Decide catalog vs. repository roles per use case: ad hoc/administrative access can use catalog roles, but anything tied to an application's security concept or requiring transport should be a repository/HDI role
- Model row-level restrictions with analytic privileges rather than trying to achieve equivalent control with object privileges alone
- Plan role transport as part of the application lifecycle when using repository or HDI roles, since that's the mechanism that makes them move between systems
- Document which technical user owns which catalog roles, given the deletion-cascades-revocation risk

## Best Practices

- Prefer repository/HDI roles over catalog roles for anything that needs to persist independent of a single database user's lifecycle
- Use analytic privileges for row-level security rather than trying to fake it with multiple narrowly-scoped object privileges
- Keep package and application privileges scoped to what design-time development or XS classic apps actually require, not broadly granted
- Treat HDI container role content as owned by the application team shipping that container, not the central Basis team

## Common Mistakes

- Using catalog roles for access that needs to survive the creating user's departure or deletion
- Assuming object privileges alone can deliver row-level security without analytic privileges
- Not planning for role transport when repository/HDI roles are the right choice, leading to manual re-creation across environments
- Confusing catalog roles (runtime, SQL-granted) with repository roles (design-time, _SYS_REPO-owned) when describing how a specific role was actually built

## Interviewer's Hidden Expectations

Interviewers are usually checking whether the candidate actually understands the object-privilege-versus-analytic-privilege distinction (object-level vs. row-level control) rather than reciting "there are privileges in HANA." The catalog-role-versus-repository-role distinction is a strong signal question — it separates people who've only used the SQL console from people who've worked with HANA content that actually ships and transports as part of an application.

## What Makes This a 10/10 Answer

An average answer lists the five privilege types. A strong answer explains why analytic privileges exist as a category — because object privileges can't do row-level filtering — and correctly explains the operational consequence of catalog roles being tied to their creating user's lifecycle, which is exactly the kind of production detail that separates real hands-on experience from studied theory.

## Red Flags

- Cannot explain the difference between object privileges and analytic privileges
- Describes all HANA roles as if they're interchangeable, with no catalog-vs-repository distinction
- Unaware that catalog roles have no transport support
- No mention of row-level security when directly asked how HANA restricts data access below the object level

## Keywords

SAP HANA, system privileges, object privileges, SQL privileges, analytic privileges, package privileges, application privileges, catalog role, repository role, design-time role, _SYS_REPO, HDI container, row-level security, HANA authorization

## Sources

Content verified against the following live sources (accessed 2026-08-06); paraphrased and synthesized, not reproduced verbatim:
- [SAP HANA DB Authorization concept — SAP Community](https://community.sap.com/t5/technology-blog-posts-by-members/sap-hana-db-authorization-concept/ba-p/13579353)
- [SAP HANA Privileges – Basics — SAP Authorization Universe](https://sap-authorization-universe.com/2023/01/30/sap-hana-privileges-basics/)
- [Catalog Roles and Repository Roles Compared — SAP Help Portal](https://help.sap.com/docs/SAP_HANA_ONE/102d9916bf77407ea3942fef93a47da8/3360ac839b844171837dce4f7c5f1481.html) (official documentation)
- [SAP HDI Containers — SAP Help Portal](https://help.sap.com/docs/SAP_HANA_PLATFORM/3823b0f33420468ba5f1cf7f59bd6bd9/e28abca91a004683845805efc2bf967c.html) (official documentation)
