# SAP BW/4HANA Security & Analysis Authorization

## Overview

BW/4HANA security operates on two distinct authorization layers that are frequently conflated in interviews. Standard SAP authorization — the same PFCG-role, authorization-object mechanism used everywhere else in SAP — controls execution-level access: can this user run this query, open this InfoProvider, execute this process chain. The relevant objects are S_RS_COMP and S_RS_COMP1. BW Analysis Authorization is a separate, additional layer specific to BW reporting: it restricts which rows of data a user can see within a query, evaluated against actual characteristic values (for example, authorized for company code 1000 but not 2000). A user can pass every standard PFCG check and still see zero rows because analysis authorization denied it — that gap is the single most commonly tested "do you actually understand this or just the theory" point in a BW security interview.

## Interview Summary

Execute-level authorization (S_RS_COMP/S_RS_COMP1, assigned via PFCG) answers "can this user run this query/InfoProvider at all." Analysis authorization answers "which specific data rows can they see once they run it," maintained in transaction RSECADMIN and evaluated against characteristic values. The two layers connect through authorization object S_RS_AUTH, which is what a PFCG role actually uses to name which analysis authorizations it grants. For an InfoProvider to be evaluated by analysis authorization at all, it must carry the technical characteristics 0TCAIPROV (InfoProvider), 0TCAVALID (validity), and 0TCAACTVT (activity) as authorization-relevant — a common root cause of "login works but query returns no data" is one of these being missing, not a role assignment error.

## 30 Second Interview Answer

BW/4HANA security has two layers: standard PFCG authorization objects like S_RS_COMP control which queries and InfoProviders a user can execute, and BW analysis authorization — maintained in RSECADMIN — separately controls which data rows they can see within that query, based on characteristic values like company code or cost center. The two layers connect through authorization object S_RS_AUTH, which assigns a named analysis authorization to a role. A user can execute the query and still see no data if analysis authorization denies it — that distinction is what interviewers are actually testing.

## 60 Second Interview Answer

There are two authorization layers in BW/4HANA, and conflating them is the most common mistake candidates make. Standard SAP authorization controls execution-level access — can this user run this query, open this InfoProvider — through objects S_RS_COMP and S_RS_COMP1, assigned the normal PFCG way.

Analysis authorization is a separate, additional layer specific to BW reporting. It restricts which rows of data a user can see within a query, evaluated against actual characteristic values. This is maintained in transaction RSECADMIN, and it only works on characteristics explicitly marked authorization-relevant in the InfoObject definition, plus it requires the InfoProvider to carry the technical characteristics 0TCAIPROV, 0TCAVALID, and 0TCAACTVT. The bridge between the two layers is authorization object S_RS_AUTH — a PFCG role includes S_RS_AUTH values naming which analysis authorizations it grants, and those analysis authorizations are what actually get evaluated row-by-row at query runtime.

## 90 Second Interview Answer

BW/4HANA security is genuinely two layers, and the distinction is where a real interviewer's follow-up lands. The first layer is standard execution authorization — S_RS_COMP and S_RS_COMP1, assigned through PFCG exactly like any other SAP authorization object — which determines whether a user can open a query or InfoProvider at all.

The second layer, analysis authorization, is specific to BW and operates independently: it restricts which rows of data within that query a user is allowed to see, evaluated against real characteristic values at runtime — for example, a user might be authorized for company code 1000 and region EMEA but not for company code 2000. This is maintained in RSECADMIN, and it depends on two prerequisites: the characteristic itself must be flagged authorization-relevant on the InfoObject, and the InfoProvider must carry the technical characteristics 0TCAIPROV, 0TCAVALID, and 0TCAACTVT so the authorization framework has something to evaluate against. The two layers are connected through authorization object S_RS_AUTH, which is what a PFCG role actually names as the analysis authorization it grants to the user.

This is exactly why "user can log in but the query returns no data" is a genuinely different diagnostic path than a normal SAP authorization failure. I wouldn't start by checking S_RS_COMP — if the user got as far as attempting to run the query, execution-level authorization already passed. I'd check whether the query returns an authorization-relevant error versus silently returning zero rows (a real authorization denial in BW typically surfaces as an explicit message, not a silent empty result — a silent empty result more often points to a data-load or filter issue upstream). If it is an authorization message, I'd check RSECADMIN for the user's assigned analysis authorizations against the characteristic values actually present in the data, and confirm the InfoProvider genuinely carries the three technical characteristics required for analysis authorization to apply at all.

On CompositeProviders and ADSOs specifically: analysis authorization applies at the point the data is actually reported, so a CompositeProvider combining multiple underlying providers needs the authorization-relevant characteristics present and consistently modeled across all of them, or the combined result can behave inconsistently — authorized against one source, silently filtered against another. That's a design consideration, not just a troubleshooting one: authorization-relevant characteristics need to be planned into the data model from the start, not bolted on after CompositeProviders are already built.

## Architecture

- Execution-level authorization: S_RS_COMP (query/component execute), S_RS_COMP1 (additional component-level check) — standard PFCG-assigned objects
- Analysis authorization: characteristic-value-based row-level restriction, maintained in RSECADMIN, evaluated at query runtime — a genuinely separate mechanism from execution-level objects
- Bridge object: S_RS_AUTH — the authorization object a PFCG role uses to name which analysis authorizations it grants
- Required technical characteristics for any authorization-relevant InfoProvider: 0TCAIPROV (InfoProvider), 0TCAVALID (validity period), 0TCAACTVT (activity)
- CompositeProviders/ADSOs: authorization-relevant characteristics must be present and consistently modeled across all combined sources, or filtering behaves inconsistently across the combined result

## Configuration

- Mark a characteristic as authorization-relevant on the InfoObject before it can be used in an analysis authorization
- Build analysis authorizations in RSECADMIN, defining the specific characteristic-value combinations (or value ranges/hierarchy nodes) a given authorization grants
- Ensure every InfoProvider that needs analysis authorization carries 0TCAIPROV, 0TCAVALID, and 0TCAACTVT as authorization-relevant characteristics
- Assign the analysis authorization to users or roles; connect it into the standard PFCG role via authorization object S_RS_AUTH so provisioning stays consistent with how the rest of SAP security is managed
- For CompositeProviders, verify the authorization-relevant characteristics are modeled consistently across every underlying source before go-live, not discovered during UAT

## Implementation Activities

- Design the authorization-relevant characteristic model early — retrofitting analysis authorization onto an already-built CompositeProvider landscape is significantly more disruptive than planning it during data-model design
- Decide the granularity of analysis authorizations (by company code, by region, by cost center hierarchy node) based on the actual org structure being protected, not a default template
- Plan the S_RS_AUTH-to-analysis-authorization mapping as part of the standard role design process, not as a separate BW-only workstream disconnected from PFCG role governance
- Test with representative users at each authorization tier, not just an admin/full-access test user, since analysis authorization gaps only surface when a genuinely restricted user runs the query

## Best Practices

- Keep execution-level authorization (S_RS_COMP) and analysis authorization (RSECADMIN) documented as two separate, explicit layers in the security concept — do not let them get described as "just authorization" in design documentation
- Build authorization-relevant characteristics into the data model at InfoProvider design time, not after the fact
- Validate CompositeProvider authorization behavior explicitly whenever a new underlying source is added, since inconsistent characteristic modeling across sources is a common silent-failure point
- Treat "login works but query returns no data" as its own diagnostic path, distinct from a standard SAP authorization failure — start by confirming whether execution-level authorization already passed before investigating analysis authorization

## Common Mistakes

- Troubleshooting a "no data returned" issue by checking S_RS_COMP/PFCG role assignment first, when the user already successfully executed the query and the real gap is in RSECADMIN-maintained analysis authorization
- Treating analysis authorization as optional or an edge case, rather than the primary row-level control mechanism BW actually relies on
- Building a CompositeProvider without verifying authorization-relevant characteristics are present and consistent across every combined source
- Describing BW security as "the same as normal SAP authorization" in an interview answer, missing the two-layer distinction entirely

## Interviewer's Hidden Expectations

Interviewers are usually checking whether a candidate can actually separate execution-level authorization from analysis authorization, and specifically whether they know the mechanism (characteristic-value evaluation against InfoProvider-level technical characteristics) rather than just naming "RSECADMIN" as a keyword. The "login works but query returns no data" scenario is a strong signal question — it separates candidates who understand that a user can legitimately pass every PFCG check and still see no data, from candidates who only know BW security has "some kind of authorization."

## What Makes This a 10/10 Answer

An average answer says "BW has PFCG roles and analysis authorization." A strong answer explains why the two layers exist as separate mechanisms — execution access versus row-level data restriction — and can walk through the actual diagnostic consequence: a user reporting they can run a query but see no data almost certainly already passed execution-level authorization, so the investigation correctly starts in RSECADMIN and the InfoProvider's authorization-relevant characteristics, not in PFCG.

## Red Flags

- Cannot distinguish execution-level authorization (S_RS_COMP) from analysis authorization (RSECADMIN)
- Treats "login works but query returns no data" the same as a standard SAP authorization troubleshooting scenario
- No mention of the technical characteristics (0TCAIPROV/0TCAVALID/0TCAACTVT) an InfoProvider needs for analysis authorization to apply
- Cannot explain why a CompositeProvider needs consistent authorization-relevant characteristics across its underlying sources

## Keywords

BW/4HANA security, BW analysis authorization, RSECADMIN, S_RS_AUTH, S_RS_COMP, S_RS_COMP1, 0TCAIPROV, 0TCAVALID, 0TCAACTVT, characteristic-value authorization, CompositeProvider authorization, ADSO, PFCG vs analysis authorization, InfoObject authorization-relevant, BW troubleshooting, query returns no data

## Notes on sourcing

Authored from established, well-documented SAP BW/4HANA authorization mechanics (RSECADMIN, S_RS_AUTH, S_RS_COMP/S_RS_COMP1, the 0TCAIPROV/0TCAVALID/0TCAACTVT technical characteristics) rather than fabricated or uncertain artifact names -- unlike some other files in this knowledge base, this one was not cross-checked against live external sources at authoring time, so treat any single technical claim here as worth a quick verification against current SAP documentation before treating it as unconditionally authoritative in a real interview.
