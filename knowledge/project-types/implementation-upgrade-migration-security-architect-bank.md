# SAP Implementation, Upgrade & Migration — Security Architecture

Spoken architect style: Decision → Mechanism → Governance → Validation.

**Product boundaries:** Greenfield, brownfield, and selective/bluefield transformations change security work differently. ECC→S/4, GRC 10→12, IDM modernization, and IAG adoption are distinct workstreams. Always name approach and edition.

**Anti-surface rule:** Prefer SU25 deltas, ruleset migration, cutover auth checks, and risk reassessment over “migrate the roles.”

## Q1: How do you choose security strategy for greenfield vs brownfield vs selective transformation?

- **Decision:** Greenfield = design clean roles from process matrix; brownfield = remediate + SU25/simplification; selective = dual maintenance with clear cutover scope.
- **Mechanism:** Approach ADR; inventory custom TCodes; Fiori adoption plan; SoD baseline. Tooling: PFCG vs Public business roles by edition.
- **Governance:** Approach change mid-program = CAB. Do not “lift and shift” toxic ECC composites silently.
- **Validation:** ADR signed; sample role path matches approach; toxic ECC pattern absent in target design.

## Q2: How do you execute ECC to S/4HANA security migration?

- **Decision:** Treat simplification items, obsolete TCodes, Fiori successors, and SU25 as a sequenced remediation program with persona testing.
- **Mechanism:** Simplification analysis; SU25 2a/2b/2c; rebuild menus/catalogs; update GRC/IAG functions; remediate SoD; regression UAT. Coordinate with code remediation for auth checks in custom.
- **Governance:** Critical process without successor mapping blocks Deploy. Business signs persona tests.
- **Validation:** Successor apps work; obsolete TCodes removed; simulation improved; traces clean.

## Q3: How do you plan GRC Access Control 10.x to 12.0 upgrade security impacts?

- **Decision:** Upgrade preserves connectors/rulesets/MSMP but requires regression of workflows, jobs, and UI; treat as controlled technical + functional test program.
- **Mechanism:** Sandbox upgrade; transport strategy; verify MSMP paths, BRF+, Firefighter logs, provisioning; adjust for 12.0 changes; performance test analysis jobs.
- **Governance:** Freeze ruleset changes during cutover window. Dual run if risk demands.
- **Validation:** Request E2E; Firefighter log review; analysis job completes; no open P1 workflow defects.

## Q4: How do you adopt SAP IAG during a transformation without dual-governance chaos?

- **Decision:** Decide standalone IAG vs Bridge; freeze SoR for requests/analysis; migrate campaigns and connectors deliberately.
- **Mechanism:** Tenant setup; connector onboard; ruleset alignment; UX training; parallel for one cycle; cutover SoR. Decommission conflicting manual paths.
- **Governance:** ADR for Bridge. Approver enablement before go-live.
- **Validation:** Request path unique; analysis consistent; certification calendar live; old bypass removed.

## Q5: How do you modernize SAP IDM during S/4 or RISE programs?

- **Decision:** Remap IDM jobs to IPS transforms + IAG/SailPoint workflows; parallel critical targets; decommission with evidence.
- **Mechanism:** Inventory jobs/scripts; classify replace/retain; parallel run diffs; cutover; disable IDM jobs. Keep break-glass.
- **Governance:** Exit criteria = SLA parity on JML. Data retention for IDM store.
- **Validation:** Diff report zero critical; leaver on new path; IDM disabled; audit notified of SoR.

## Q6: How do you integrate SuccessFactors/Ariba identity during ERP transformation?

- **Decision:** HR and procurement cloud identity join the same IAS/IPS hub; product authz remains RBP/groups—ERP roles do not replace them.
- **Mechanism:** IPS sources/targets; SSO apps; group/role maps; SoD across Ariba+S/4 if in scope. Test movers.
- **Governance:** Correlation keys stable across program. Leaver SLA unified.
- **Validation:** Joiner gets SF+S/4+Ariba as designed; SSO; cross-system SoD test.

## Q7: How do you secure custom code, interfaces, and technical users in migration?

- **Decision:** Custom entry points get SU24/service design; interfaces get new technical users; secrets vaulted—migration is when to kill shared Dialog interface users.
- **Mechanism:** Custom auth review; destination rebuild; PAM onboard; CPI redeploy credentials; remove obsolete RFC trusts.
- **Governance:** No go-live with known shared Dialog interface passwords. Clean-core exceptions logged.
- **Validation:** Custom deny/allow tests; destination user type; rotation; obsolete trust gone.

## Q8: How do you regression-test and reassess risk after migration waves?

- **Decision:** Each wave has auth regression + SoD reassessment; cumulative risk dashboard to Deploy.
- **Mechanism:** Regression pack; ARA/IAG runs; defect CAPA; update matrices. Include negative org tests.
- **Governance:** Wave exit criteria include security metrics. Risk acceptance only with expiry.
- **Validation:** Pack pass %; risk trend; open critical list for steering.

## Q9: How do you run cutover, rollback, go-live, and hypercare for security migrations?

- **Decision:** Security-specific cutover steps and rollback of role/ruleset transports; hypercare prioritizes auth and provisioning failures.
- **Mechanism:** Runbook; freeze; import; compare; smoke; break-glass; monitoring. Rollback drill. Daily auth KPI.
- **Governance:** Security signature on go/no-go. Project privilege time-boxed.
- **Validation:** Rehearsal; smoke; rollback evidence; hypercare exit KT.

## Q10: How do you capture lessons learned without fabricating delivery claims?

- **Decision:** Lessons are control and process improvements (what failed in test/gates)—not invented customer metrics.
- **Mechanism:** PIR: defects by root cause plane; gate misses; RACI gaps; ruleset false positives; action backlog.
- **Governance:** Actions owned with dates. Share to next Activate Run improvements.
- **Validation:** PIR document; backlog items linked; no unverifiable ROI claims in interview answers.
