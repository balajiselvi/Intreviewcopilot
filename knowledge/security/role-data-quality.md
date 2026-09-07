# Role and User Dataset Quality

## Overview

This role uses data analysis as a governance skill, not as a generic Excel interview. Before recommending role remediation you validate the extract. Large user-role assignment files contain duplicates, naming drift, orphaned users, unused roles, and SoD noise. A Principal Architect challenges the dataset before challenging the business.

## Interview Summary

Approach is source validation, then quality checks, then analysis, then prioritized action with owners. Excel, SQL, SAP SUIM, GRC ARA, or a combination can be used. Do not claim a personal tool stack unless candidate background names it. The reasoning is the same: you cannot rationalize access on unreconciled data.

## 30 Second Interview Answer

If I received 50,000 user-role assignments, I would not start by deleting roles. I would confirm the extract source, date, and completeness, then look for duplicate rows, inconsistent role names, inactive users, unused roles, extreme cardinality, and SoD collisions. Only after the data is trustworthy would I recommend remediation sequenced by risk and business ownership.

## 60 Second Interview Answer

First, source validation. Who produced the file, from which system, as-of which date, including or excluding expired roles, technical users, and reference users. Two teams’ extracts that disagree are a reconciliation problem, not a role-design problem.

Second, structural checks. Duplicate user-role rows. The same role under two names. Users with no valid HR or IdP record. Roles assigned to nobody. Roles assigned to thousands of users. Users with dozens of overlapping composites.

Third, independent checks. Count distinct users and roles. Compare to SUIM or user master totals. Sample high-risk finance and IT admin assignments against SoD rules. Challenge the assumption that “everyone in this team needs this role” by looking at actual last-logon and transaction usage if usage data exists.

Fourth, decision. Remediate in waves: toxic SoD and unused high-privilege first, naming and duplicates next, birthright redesign last. Every wave needs a business owner and an evidence file, because audit will ask how you knew.

## 90 Second Interview Answer

I would treat this as a data-quality workstream sitting in front of role rationalization.

Completeness: are all production clients in the extract. Are composite and single roles both present, or did someone flatten only AGR_USERS and lose the single-role explosion.

Duplicates: exact duplicate assignments, and near-duplicate roles that differ by suffix, org, or copy-paste naming. Near-duplicates are how catalogs bloat.

Orphans: assignments to locked, expired, or non-existent users. Roles with no owner.

Inconsistent naming: without a convention you cannot tell derived versus master, or FI versus a local copy.

Cardinality: one user with a huge composite stack is a different issue than one role on 20,000 users. The first is privilege concentration. The second may be birthright or a broken default.

SoD: run or reuse Access Risk Analysis on the cleansed set, not on the dirty set. Dirty data creates false violations and hides real ones.

Excel is enough for first-pass profiling: remove duplicates, pivot user versus role counts, COUNTIF for naming patterns, filters for locked users, VLOOKUP or XLOOKUP to HR active flags. SQL or GRC reporting scales better at 50,000-plus rows. I would pick the tool that matches volume and repeatability, and I would keep an audit trail of filters applied so the analysis is reproducible.

I would not tell the business “this role is redundant” until I can show evidence: overlapping menus or objects, unused for a defined period, and an owner who can accept the risk of removal.

## Checks Before Recommending Remediation

- Extract reconciliation against system counts
- Inactive user and inactive role flags
- Duplicate and near-duplicate roles
- Composite explosion versus assigned singles
- SoD on cleansed data
- Usage or last-logon if available
- Named business owner per role family
- Exception list for known mitigations

## Prioritization

1. Privileged and Firefighter-adjacent access
2. Open SoD with no mitigation
3. Unused high-privilege
4. Duplicate roles
5. Naming and catalog hygiene
6. Birthright redesign

## Related Topics

- knowledge/security/role-design.md
- knowledge/grc/ara.md
- knowledge/idm/idm-provisioning.md
- knowledge/audit/access-review.md
