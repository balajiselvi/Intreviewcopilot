# IPS and IDM Provisioning Failures

## Overview

Provisioning troubleshooting is job, mapping, and correlation — not SU53. Failed joiners and movers usually sit in IPS job logs, transformation conditions, or target API errors.

## Interview Summary

Isolate: is the user missing in the source, filtered by the transformation, failing at the target, or succeeding in IPS but mapped to the wrong role. Those four look identical to the business (“I did not get access”).

## 30 Second Interview Answer

I would open the provisioning job log first. Confirm the source record was read, whether a filter dropped the user, whether the target returned an error, and whether the target user already existed under a different UID. Then I would fix mapping or correlation, not add a manual role that the next job will overwrite or duplicate.

## Common Causes

- Inactive HR flag still true
- Email or employee ID changed, correlation miss
- Target role collection or business role renamed
- API authorization of the technical user
- Partial success: IAS user created, S/4 assignment failed

## Related Topics

- knowledge/idm/idm-provisioning.md
- knowledge/btp/ips.md
