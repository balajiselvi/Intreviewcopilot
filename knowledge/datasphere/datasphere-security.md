# SAP Datasphere Access

## Overview

Datasphere authorization is space-centric. It is not SAC folder security and not S/4 PFCG. Interviews test whether you keep those models separate even when a story in SAC is fed by a live Datasphere connection.

## Interview Summary

Users are assigned to spaces with scoped privileges on views, tables, and data access controls. Row-level restrictions belong in Datasphere data access controls or source-system authorizations, depending on how the view is built. SAC then adds its own team and story permissions on top. SSO through IAS does not imply space access.

## 30 Second Interview Answer

I would design Datasphere security around spaces: who is a member, what they can consume or deploy, and which data access controls restrict rows. I would not reuse an S/4 role catalog as the Datasphere model. If SAC is in front, I would treat SAC content permission and Datasphere space permission as two checks that both have to pass.

## Distinctions

- SAC: teams, folders, stories
- Datasphere: spaces, privileges, data access controls
- HANA Cloud underneath: database privileges if consumed directly
- IAS: who logged in

## Related Topics

- knowledge/sac/sac-security.md
- knowledge/hana/hana-authorization.md
- knowledge/btp/ias.md
