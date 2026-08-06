# SAP Analytics Cloud (SAC) Security

## Overview

SAP Analytics Cloud security operates on three layers: role-level security (what a user can do across the system — create models, view dashboards, manage users), folder-level security (managed through teams rather than direct user assignment), and model-level security (row and column-level data access within a specific model). Teams are the operational unit for scaling access — administrators assign roles and folder access to a team once, and every member inherits it, rather than managing permissions user by user.

## Interview Summary

Role-level security is the system-wide "what can this user do" layer. Folder and Team Area access is managed through teams, not direct user-to-folder assignment, which is the mechanism SAC uses to avoid unscalable per-user folder permissions. Within a model, there are two distinct mechanisms for restricting data: Model Data Privacy, which defines access rules as logical expressions (using operators like relational comparisons, BETWEEN, CONTAINS, and IS_CURRENT_USER) that can span multiple models through a role, and Data Access Control on individual dimensions, which adds read/write columns directly into a dimension's master data and assigns users or teams to specific dimension members. Data Access Control inherits down the hierarchy — permissions on a node are inherited by its child elements.

## 30 Second Interview Answer

SAC security has three layers: role-level for system-wide permissions, folder-level managed through teams rather than individual users, and model-level for row/column data restrictions. Within a model, you can restrict data two ways: Model Data Privacy, which uses logical expressions in a role that can span multiple models, or Data Access Control on a dimension, which assigns users or teams directly to dimension members and inherits down to child elements.

## 60 Second Interview Answer

SAC layers security three ways. Role-level security is system-wide — what a user can do, like create models or manage users. Folder-level security controls access to environments and Team Areas, and it's managed through teams rather than assigning users directly to folders, which is how SAC keeps permission management scalable as the user base grows — assign the team once, everyone in it inherits.

Model-level security is where row and column restrictions live, and there are two distinct mechanisms. Model Data Privacy is activated per model and lets you build a role containing logical expressions — relational operators, BETWEEN, CONTAINS, IS_CURRENT_USER — that restrict read and write access, and a single role built this way can span multiple models. Data Access Control works differently: it adds read/write columns directly into a dimension's master data, and you assign users or teams to specific dimension members there. Permissions defined that way are inherited down the hierarchy — a permission on a parent node in the dimension flows to its children automatically.

## 90 Second Interview Answer

SAC's security model has three layers, and interviewers usually want to see that you can distinguish them cleanly rather than treating "SAC security" as one blob. Role-level security is system-wide permissions — what a user is allowed to do across the platform. Folder-level security governs access to environments and Team Areas, and critically, it's administered through teams rather than direct user-to-folder assignment — users aren't meant to be assigned to folders individually, which is the design choice that keeps this manageable at scale.

Model-level security is where the real design decisions happen, and there are two genuinely different mechanisms, not one. Model Data Privacy is activated on a model under Data Access in its settings, and it works by defining roles containing logical expressions — comparison operators, BETWEEN, CONTAINS for pattern matching, and IS_CURRENT_USER for dynamic self-referencing restrictions. Because it's role-based, one Model Data Privacy role can apply across multiple models, and it doesn't require existing master data to define the restriction. Data Access Control, by contrast, works at the dimension level — activating it adds read and write columns into that dimension's master data, and you assign specific users or teams to specific dimension members directly. It's scoped to a single model, requires the master data to already exist, and permissions inherit down the hierarchy: grant access to a parent node and children inherit it automatically.

Which one you choose is a real design decision, not a formality — Model Data Privacy is more flexible and reusable across models when the restriction logic is pattern- or expression-based, while Data Access Control is the natural fit when the restriction genuinely maps to dimension members and you want inheritance to do the work for you. I'd expect a good candidate to be able to explain that trade-off, not just name both mechanisms.

## Architecture

- Role-level security: system-wide, what a user can do across the platform
- Folder-level security: environments and Team Areas, administered through teams, not direct user-to-folder assignment
- Model-level security: row/column data restrictions within a specific model, via two mechanisms
- Model Data Privacy: role-based, logical-expression-driven, can span multiple models
- Data Access Control: dimension-based, master-data-driven (read/write columns added to the dimension), scoped to a single model, permissions inherit to child elements

## Configuration

- Model Data Privacy is enabled under a model's Access and Privacy settings, then rules are authored as logical expressions using operators including relational comparisons, BETWEEN, CONTAINS, and IS_CURRENT_USER
- Data Access Control is activated per dimension; once active, read and write columns appear in that dimension's master data where users or teams are assigned to specific members
- Teams are the administrative unit for folder/Team Area access — roles and folder access are assigned to the team, not individually to each user

## Implementation Activities

- Decide Model Data Privacy vs. Data Access Control per model based on whether the restriction is expression-driven and reusable, or naturally tied to existing dimension master data
- Set up teams before scaling user onboarding, so folder and Team Area access is managed centrally rather than per user
- Define IS_CURRENT_USER-based rules where the restriction should dynamically follow the logged-in user rather than requiring static per-user maintenance
- Validate inheritance behavior in Data Access Control hierarchies before go-live, since permissions on parent dimension members cascade to children automatically

## Best Practices

- Use teams for all folder and Team Area access rather than assigning users directly, to keep administration scalable
- Prefer Model Data Privacy when the same restriction logic needs to apply across multiple models
- Prefer Data Access Control when the restriction is naturally a dimension-member-to-user/team mapping and you want to leverage hierarchy inheritance
- Document which mechanism is in use per model, since mixing both without a clear rationale makes access hard to audit

## Common Mistakes

- Assigning users directly to folders instead of managing access through teams
- Treating Model Data Privacy and Data Access Control as interchangeable rather than understanding their different scope and maintenance trade-offs
- Not accounting for inheritance in Data Access Control, leading to unintended access on child dimension members
- Forgetting that Data Access Control requires existing master data, while Model Data Privacy does not

## Interviewer's Hidden Expectations

Interviewers are checking whether the candidate can name the three security layers (role, folder, model) without conflating them, and whether they understand there are two distinct model-level mechanisms with different trade-offs rather than one generic "row-level security" feature. Mentioning IS_CURRENT_USER or the inheritance behavior of Data Access Control is a strong signal of hands-on configuration experience, not just documentation familiarity.

## What Makes This a 10/10 Answer

An average answer says "SAC has role-based and row-level security." A strong answer distinguishes role-level, folder-level (team-administered), and model-level security, then explains both model-level mechanisms — Model Data Privacy and Data Access Control — with a clear point of view on when to use each, including the inheritance behavior that makes Data Access Control operationally different from a flat permission list.

## Red Flags

- Cannot distinguish Model Data Privacy from Data Access Control
- Describes folder access as user-assigned rather than team-administered
- No mention of inheritance behavior in dimension-based Data Access Control
- Treats SAC security as a single flat permission system with no layering

## Keywords

SAP Analytics Cloud, SAC, role-level security, folder-level security, model-level security, teams, Team Area, Model Data Privacy, Data Access Control, IS_CURRENT_USER, row-level security, dimension master data, inheritance

## Sources

Content verified against the following live sources (accessed 2026-08-06); paraphrased and synthesized, not reproduced verbatim:
- [SAP Analytics Cloud authorization concept made simple — Nextlytics](https://www.nextlytics.com/blog/authorization-concept-sap-analytics-cloud)
- [Introduction to Users, Roles, and Teams in SAP Analytics Cloud — Analysis Prime University](https://www.analysisprimeuniversity.com/sac-kb/introduction-to-users-roles-and-teams-in-sap-analytics-cloud/)
- [Understanding SAC Security Levels and Permissions — Analysis Prime University](https://www.analysisprimeuniversity.com/sac-kb/understanding-sac-security-levels-and-permissions/)

Not independently verified against official SAP Help Portal documentation in this pass (third-party sources only) — recommend cross-checking against help.sap.com before treating this as fully authoritative.
