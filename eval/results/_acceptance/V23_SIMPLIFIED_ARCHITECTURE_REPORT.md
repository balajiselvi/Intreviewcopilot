# V2.3 Simplified Knowledge-Grounded LLM Architecture — Verification Report

Generated: 2026-11-03T11:20:07.836Z
Provider mode: **mock** (MOCK — no paid live calls)

## Architecture

QUESTION → KB RETRIEVAL → LLM GENERATION → VALIDATION → DISPLAY

## PFCG phrase origin (verified)

- Previously observed phrases (`I walk the operational path…`, `plane-appropriate positive check`) originated in `lib/procedureRetention.js` `renderSpokenProcedure` checklist wrap — **not** from KB docs, mocks, or the LLM.
- That wrap has been removed; checklist steps now render as First/Next/Finally prose only.

## Summary

- Cases: 5
- Passed: 5
- Failed: none

## Per-question trace

### pfcg

- **Question:** Explain how do you use PFCG?
- **Folders:** security, s4hana, fiori
- **Retrieved (top):** security/pfcg.md [technical-doc]; security/pfcg.md [technical-doc]; security/pfcg.md [technical-doc]; security/pfcg.md [technical-doc]; security/pfcg.md [technical-doc]
- **Bank chunks in scoped:** none
- **Route:** GENERATION
- **Mock invocations:** 1; live transport: 0
- **Banned wrap phrases:** none
- **Failures:** none
- **Answer preview:** "Use transaction PFCG to create the single role, add the required transactions on the Menu tab, and maintain organizational levels on the Authorizations tab. Generate the authorization profile in PFCG after that authorization data is complete, because the generated profile is what the user buffer checks. Assign the role on the PFCG User tab or in transaction SU01, then run user comparison so the profile enters the user buffer. Review table AGR_USERS for the user assignment and table AGR_1251 for authorization values, and do not treat AGR_USERS as a transaction. Transport the released role change with the Change and Transport System and import it in the target system. Use transaction SU53 only"

### brm

- **Question:** Why do organizations implement BRM?
- **Folders:** grc
- **Retrieved (top):** grc/brm.md [technical-doc]; grc/brm.md [technical-doc]; grc/brm.md [technical-doc]; grc/brm.md [technical-doc]; grc/brm.md [technical-doc]
- **Bank chunks in scoped:** none
- **Route:** GENERATION
- **Mock invocations:** 1; live transport: 0
- **Banned wrap phrases:** none
- **Failures:** none
- **Answer preview:** "In BRM I govern business-role definitions and their technical-role mappings so ARM requesters pick job-function names while provisioning still assigns the underlying PFCG roles. Define business roles in business language from agreed job functions, then map each business role to the correct underlying single, derived, or composite technical roles. Validate the mapping against actual technical role content and SoD expectations before requesters use the business role in ARM. Govern changes through an administration surface not confirmed in supporting knowledge maintenance so technical role redesigns update the business-role mapping; retire business roles that no longer represent an active job f"

### bw

- **Question:** Explain SAP BW analysis authorizations.
- **Folders:** bw, security, s4hana, fiori
- **Retrieved (top):** bw/analysis-authorizations.md [technical-doc]; bw/analysis-authorizations.md [technical-doc]; bw/bw-security.md [technical-doc]; bw/bw-security.md [technical-doc]; bw/bw-security.md [technical-doc]
- **Bank chunks in scoped:** none
- **Route:** GENERATION
- **Mock invocations:** 1; live transport: 0
- **Banned wrap phrases:** none
- **Failures:** none
- **Answer preview:** "In my experience with BW/4HANA, standard ABAP PFCG authorizations only control transaction and object access — they never filter query result rows for regional data. When I set this up, I mark the InfoObjects as authorization-relevant and design Analysis Authorizations in RSECADMIN for characteristics like region or company code, then assign those Analysis Authorizations to the reporting user or role while keeping S_RS_* PFCG objects strictly for query start rights. I always change-control the Analysis Authorizations separately from PFCG generation and retain RSECADMIN evidence. To prove it, the user can open the query but only sees allowed regional values, and an out-of-scope region comes b"

### idm

- **Question:** Explain the SAP IDM identity provisioning lifecycle.
- **Folders:** idm
- **Retrieved (top):** idm/idm-overview.md [technical-doc]; idm/idm-architecture.md [technical-doc]; idm/identity-control-planes.md [technical-doc]; idm/idm-provisioning.md [technical-doc]; idm/idm-overview.md [technical-doc]
- **Bank chunks in scoped:** none
- **Route:** GENERATION
- **Mock invocations:** 1; live transport: 0
- **Banned wrap phrases:** none
- **Failures:** none
- **Answer preview:** "Joiner Flow HR hire → identity created in IdP/IAS as designed → IPS or IDM provisions user in targets → birthright roles assigned → optional IAG/GRC check → user can authenticate. Mover Flow HR attribute change → lifecycle event → correlate identity → determine new access set → risk check if required → provision additions → remove obsolete assignments → reconcile → audit. Leaver Flow HR termination → disable identity → deprovision targets → revoke privileged access → certify evidence for audit."

### zero_kb

- **Question:** Explain how Merkle trees support zero-knowledge proof verification.
- **Folders:** (none)
- **Retrieved (top):** troubleshooting/authorization-errors.md [technical-doc]; compliance/iso27001.md [technical-doc]; bw/analysis-authorizations.md [technical-doc]; grc/brf-plus.md [technical-doc]; btp/btp-principal-propagation-deepdive.md [technical-doc]
- **Bank chunks in scoped:** none
- **Route:** GENERATION
- **Mock invocations:** 1; live transport: 0
- **Banned wrap phrases:** none
- **Failures:** none
- **Answer preview:** "I would answer from established general knowledge for this topic: state the direct concept, explain the mechanism in a logical sequence, and separate well-established facts from version-dependent or uncertain details. I will not invent product capabilities or personal implementation history."

## Changes made

1. Hard-exclude `*-bank.md` / interview Q&A banks from ordinary technical retrieval (no bank fallback).
2. Mock/live: demote ANSWER_BANK; skip VERIFIED_WORKFLOW early return; serve retrieved procedure as LLM evidence backbone.
3. Remove PFCG canned checklist wrap in `renderSpokenProcedure`.
4. Named SAP IDM questions do not open CIS/cloud solely from shared “identity provisioning” wording.
5. Mock zero-KB non-SAP answers avoid SAP-plane principle prose.

No commit, push, stash, reset, or paid live provider calls.
