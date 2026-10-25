# SAP MDG — Master Data Governance Security Architecture

Spoken architect style: fluent Senior Principal Architect paragraphs — lead with exact T-codes/tables/utilities; never Decision/Mechanism/Governance/Validation headings.

**Product boundaries:** MDG authorization covers change-request (CR) processing, master-data maintenance vs display, and stewardship—on top of underlying ECC/S/4 authorization objects. MDG is **not** IAG and **not** SF RBP. Domains (Customer, Supplier, Material, Financial) have distinct UI/auth models; name the domain.

**Anti-surface rule:** Prefer CR workflow agent auth, USMD* objects, replication security, and create/change/approve SoD over “MDG has governance.”

## Q1: How do you separate master-data display, maintenance, and approval in MDG?

- **Decision:** Three duty classes—display steward, requester/maintainer, and approver/activating steward—must not collapse into one Production composite for sensitive domains.
- **Mechanism:** Assign MDG PFCG roles per domain (Customer/Supplier/Material/Finance) with authorization objects for MDG (USMD* family and related) plus backend master-data objects. Configure CR types so submit ≠ approve for the same user where SoD requires. Use organization/responsibility for agent determination.
- **Governance:** Create/change vs approve is a formal SoD risk in master data. Mitigate only with control owner if design cannot split.
- **Validation:** Maintainer submits CR; cannot approve own CR; approver cannot silently edit without audit; display-only cannot create CR.

## Q2: How do you authorize MDG change-request workflows and agents?

- **Decision:** Workflow agent determination is part of the security design—wrong agent rules are an access-control defect.
- **Mechanism:** Configure BRF+/workflow rules for CR stages; authorize users to process their work items; restrict MDG admin/config roles (`MDGIMG` configuration access) to specialists. Ensure substitute/delegation rules do not bypass SoD.
- **Governance:** Workflow config changes via transport + CAB. Emergency reassignment logged.
- **Validation:** CR routes to expected steward; unauthorized user cannot execute work item; substitution test still blocks toxic self-approval if policy requires.

## Q3: How do you restrict sensitive master-data fields and domains (bank, tax, material cost)?

- **Decision:** Field-level / entity-level restrictions follow data classification—finance and supplier bank data tighter than descriptive text fields.
- **Mechanism:** Use MDG authorizations and underlying ERP objects (e.g., vendor bank fields) together; UI field properties / BPA rules where applicable; separate roles for sensitive entities. Align with GRC critical permissions for master-data TCodes/apps.
- **Governance:** Data owners for bank/tax attributes. Cross-border access follows privacy rules.
- **Validation:** User edits descriptive fields but denied on bank data; attempt logged/traced; display of sensitive fields blocked for non-cleared roles.

## Q4: How do you secure outbound replication and integration users for MDG?

- **Decision:** Replication to S/4, CRM, or non-SAP targets uses technical users with least privilege on target APIs—not steward Dialog users.
- **Mechanism:** Configure Data Replication Framework / SOA / web services with technical identities; authorize only required message types; monitor replication errors (`DRF*` / SXMB/SRT as applicable). Secrets in secure store/PAM.
- **Governance:** Replication failure SLA owned by MDG ops + integration. No shared Dialog credentials in replication destinations.
- **Validation:** Replication succeeds with technical user; Dialog steward credentials absent from destination; unauthorized message type fails.

## Q5: How do you integrate MDG security with GRC/IAG and identity provisioning?

- **Decision:** Joiner provisioning may assign MDG steward roles via IDM/IPS/IAG, but CR approval SoD is enforced in MDG (+ ARA rules for underlying ERP perms).
- **Mechanism:** Map job attributes → MDG role set; run ARA/IAG on MDG+ERP critical objects; Access Request for Production steward elevation. Certify MDG admin and approver populations.
- **Governance:** Standing MDG config admin in business steward jobs banned. Certification includes CR approvers.
- **Validation:** Provisioned steward can act in domain; toxic ERP+MDG combo flagged in analysis; certification revokes unused approvers.

## Q6: How do you design authorization for MDG on S/4 versus side-by-side MDG hub?

- **Decision:** Hub vs embedded changes system boundaries—authorize where CR executes and where active master data lives; replication path becomes critical in hub.
- **Mechanism:** Embedded: MDG+ERP auth in one system. Hub: authorize hub MDG roles and target ERP maintenance/replication separately; harden trusted RFC/services between hub and targets.
- **Governance:** ADR documents topology. Cross-system SoD analysis if steward can also post in ERP.
- **Validation:** Hub steward cannot post unrelated finance docs in target without role; replication auth tested; topology diagram matches runtime.

## Q7: How do you troubleshoot “user cannot process CR / activate master data”?

- **Decision:** Split UI authorization, workflow work-item auth, missing MDG object, and backend lock/replication errors.
- **Mechanism:** `SU53`/`STAUTHTRACE` for auth; check inbox work item ownership; verify CR status; check application logs; confirm role user comparison. Distinguish display of CR vs execute approve.
- **Governance:** Grant minimal missing object; no `SAP_ALL` for MDG defects in Production.
- **Validation:** Trace shows prior miss fixed; user processes CR; control user without role still denied.

## Q8: How do you govern mass change / file upload / consolidation tools in MDG?

- **Decision:** Mass tools are privileged—separate from single-CR steward roles and monitored.
- **Mechanism:** Restrict mass change / import authorizations; require change ticket; run in controlled windows; validate with sample + rollback plan. Log who ran mass jobs.
- **Governance:** Dual control for mass supplier/customer bank updates. DPIA where personal data mass-processed.
- **Validation:** Steward without mass auth fails upload; admin mass run logged; sample records correct post-job.

## Q9: How do you evidence MDG controls for audit (create/change/approve)?

- **Decision:** Auditors need CR history, agent SoD proof, privileged admin roster, and replication integrity—not only role names.
- **Mechanism:** Export CR audit trails; show separate submitter/approver; list MDGIMG admins; provide reconcile of active master vs CR; GRC mitigations if any.
- **Governance:** Retention of CR evidence per policy. Failed SoD tests remediated before audit close.
- **Validation:** Walkthrough CR with two users; admin list certified; unauthorized self-approval blocked.

## Q10: What Principal Architect narrative links MDG to clean-core and enterprise IAM?

- **Decision:** MDG is the governed maintenance plane for master data; S/4 consumes active data; IAM provisions steward identities; GRC/IAG analyzes toxic ERP permissions around master data and payments.
- **Mechanism:** Explain CR lifecycle → activation → replication → consumption in process (P2P/O2C). State topology (hub/embedded). State identity path for stewards.
- **Governance:** Clean-core: prefer MDG governance over uncontrolled local master edits in satellites.
- **Validation:** End-to-end: provision steward → create CR → approve → replicate → process uses new master; toxic path denied.
