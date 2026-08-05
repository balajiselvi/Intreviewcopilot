# RISE Data and System Migration

## Overview

RISE migrations differ fundamentally from traditional SAP implementations: instead of starting fresh, organizations migrate from existing on-premise systems (SAP ECC, legacy systems) to cloud-native S/4HANA RISE. This requires careful data extraction, transformation, and validation to ensure business continuity. A RISE migration involves not just moving data but transforming master data structures, consolidating instances, and establishing new cloud-based governance. Understanding migration strategy, data cleansing, legacy system integration, and the parallel-run approach is critical for anyone managing enterprise RISE transformations.

## Interview Summary

RISE migrations involve extracting data from legacy systems, cleansing and transforming it to RISE S/4HANA structures, validating completeness and accuracy, and executing cutover with near-zero downtime. Success depends on early data assessment, clear mapping rules, robust validation, and well-executed parallel run.

## 30 Second Interview Answer

RISE migration moves master and transactional data from existing systems (ECC, legacy) to cloud S/4HANA. The process includes data extraction (legacy system), transformation (mapping to SAP structures), cleansing (fixing data quality issues), loading (batches to target), and validation (reconciliation). Most RISE migrations use a parallel-run approach: run legacy and SAP systems side-by-side for 1–2 pay cycles, validate results match, then finalize cutover.

## 60 Second Interview Answer

A RISE migration is a complex choreography: data is pulled from legacy systems using extract tools (LSMW, XI, custom programs), transformed to conform to RISE-required structures (GL hierarchies, cost center assignments, customer master fields), cleansed (removing duplicates, fixing missing values), and loaded to SAP in controlled batches. During Explore and Execute phases, migration specialists develop detailed mapping specifications, build and test extraction routines, and rehearse cutover scenarios. Parallel run—operating both legacy and RISE for 1–2 cycles—validates that SAP processes produce identical business results. Post-cutover, delta migration captures any transactions missed between final load and go-live. Common challenges: legacy data quality issues (duplicate customers, inconsistent GL mapping), complex consolidation (merging multiple legacy instances), and tight cutover windows.

## 90 Second Interview Answer

RISE migration strategy depends on source system and complexity. For ECC to RISE S/4HANA: data is mostly compatible, but ledger consolidation, depreciation recalculation, and new master data structures must be handled. For non-SAP legacy systems: complete remapping required, custom extraction logic necessary, risk of data loss higher. The migration process spans project phases: Discover identifies what data exists and quality gaps; Explore develops detailed mapping, builds extraction templates, estimates cutover effort; Execute builds and tests migration jobs, conducts parallel run, prepares delta migration scripts. A well-structured migration includes: master data cleansing (deduplication, hierarchy establishment), historical data load (opening balances, prior-year transactions if needed), transactional data at cutover (open orders, invoices, material), and delta migration for any transactions during parallel run. Post-go-live reconciliation (balances, transaction counts) validates completeness. Hidden complexity often comes from data quality—legacy systems that have no referential integrity constraints, inconsistent customer/vendor master management, or accumulated "junk" data over 10+ years. RISE success requires treating data migration as critical path, not an afterthought.

## Architecture

Data migration architecture consists of:

1. **Source Systems** — ECC, legacy systems (Oracle, JDE, etc.), spreadsheets
2. **Extraction Layer** — LSMW, XI/SAP Integration Suite, custom programs to extract data
3. **Staging Area** — Intermediate repository (database, file system) for transformation
4. **Transformation/Cleansing** — Scripts and tools (Data Quality Foundation, custom ETL) to map and clean data
5. **Loading Layer** — Batch input sessions (BAPI), direct database load (with caution), SAP standard load programs
6. **Validation Layer** — Reconciliation reports, record counts, balance verification
7. **Parallel Run** — Both systems operational simultaneously, results compared daily
8. **Cutover Coordination** — Final load, system switch, delta migration, monitoring

Key data flows:
- Master Data → GL Accounts, Cost Centers, Customers, Vendors, Materials (loaded early, validated thoroughly)
- Transactional Data → Open Orders, Open Invoices, Inventory Balances (loaded at cutover, reconciled immediately)
- Historical Data → Prior-year balances, archived transactions (optional, often loaded post-go-live)
- Delta Data → Transactions created between final load and cutover switch (loaded after parallel run ends)

## Runtime Flow

1. **Discover Phase**
   - Audit source systems (what data exists, quality assessment, volume estimation)
   - Identify cutover requirements (which data must move, which can be archived)
   - Document current-state data model (GL structure, customer hierarchy, inventory organization)

2. **Explore Phase**
   - Design target-state data model (SAP standard GL hierarchy, cost center assignment, customer master fields)
   - Develop detailed mapping specifications (legacy field → SAP field, transformation rules)
   - Build extraction templates (LSMW transactions, XI mappings, custom programs)
   - Estimate data volumes, cutover timeline, resource requirements

3. **Execute Phase - Build**
   - Develop extraction jobs (extract from legacy system to staging files)
   - Develop transformation programs (map, cleanse, enrich data in staging area)
   - Build loading routines (batch input, BAPI calls, or standard load programs)
   - Establish validation rules (reconciliation checks, data quality gates)

4. **Execute Phase - Test**
   - Test extraction with subset of data (pilot customers, pilot GL accounts)
   - Validate transformation accuracy (sample records compared manually)
   - Test load routines in sandbox with realistic data volume
   - Conduct full data load rehearsal in test environment
   - Run reconciliation (totals, record counts, balances match expected)

5. **Execute Phase - Parallel Run**
   - Load production-ready data to SAP (master + opening balances)
   - Create open transactions in SAP (replicate current state)
   - Run legacy and SAP systems in parallel for 1–2 business cycles (1 pay cycle typical)
   - Capture transactions in both systems, compare results daily
   - Identify and fix any discrepancies (mapping errors, data quality issues)
   - Validate business users can work in SAP (payroll calculates correctly, orders process normally)

6. **Deploy Phase - Cutover**
   - Communicate parallel run results to stakeholders (system ready for cutover)
   - Final cutover window (typically Friday → Monday for financial systems)
   - Final extraction and load (all delta transactions since last load)
   - Data validation (reconciliation, balance verification) before system opening
   - Decommission legacy system (after cutover confirmed successful)

7. **Post-Go-Live**
   - Monitor data for anomalies (unusual balances, missing transactions)
   - Address post-cutover data issues (correction transactions if necessary)
   - Archive source system data per retention policy
   - Close-out data migration project

## Configuration

Data migration configuration includes:

1. **Data Dictionary Mapping**
   - Source field → SAP ABAP data element mapping
   - Legacy value → SAP value conversion (e.g., legacy status codes to SAP status codes)
   - Documented in detailed mapping specification

2. **Master Data Configuration**
   - GL account master (GL account number, company code assignment, balance sheet account type)
   - Cost center master (cost center ID, name, controlling area, profit center assignment)
   - Customer master (sold-to, bill-to, ship-to party organization)
   - Vendor master (purchasing organization assignment)
   - Material master (plant assignment, material type, valuation class)

3. **Consolidation Configuration**
   - If multiple legacy instances merging to one RISE instance: consolidation structure, intercompany elimination
   - Currency conversion rules (if multi-currency migration)
   - Reconciliation requirements (group/company level consolidation)

4. **Extract and Load Parameters**
   - Batch size for data loads (number of records per batch to avoid memory issues)
   - Parallel processing (if LSMW/XI supports, distribute load jobs)
   - Restart points (if load fails, how to resume from last successful batch)
   - Error handling (skip bad records, halt on error, log for manual review)

5. **Validation Rules**
   - Key field completeness (customer name, GL account type, material description)
   - Referential integrity (GL account must exist in GL master, cost center must exist)
   - Balance validation (opening balances sum to expected total)
   - Reconciliation rules (legacy GL balance = SAP GL balance to penny)

## Implementation Activities

1. **Data Assessment and Cleanup**
   - Extract sample data from source systems to understand quality
   - Identify duplicate records (customers with multiple IDs, vendors with similar names)
   - Identify missing master data (GL accounts without descriptions, materials without price)
   - Estimate cleanup effort (cost and timeline)
   - Prioritize cleanup (critical data for Wave 1, lower-priority data for Wave 2+)

2. **Mapping and Specification Development**
   - Document current-state data model (what exists in legacy system)
   - Define target-state model (what SAP requires)
   - Map each source field to target (legacy status codes to SAP statuses)
   - Define transformation rules (if legacy has 2-character GL, assign to 10-character SAP GL with leading zeros)
   - Get business sign-off on mappings (finance sign-off on GL mappings, supply chain on material mappings)

3. **Extraction Program Development**
   - Use LSMW for standard SAP-to-SAP migrations (ECC to S/4HANA)
   - Use XI/SAP Integration Suite for non-SAP system integration
   - Develop custom programs if standard tools insufficient
   - Test extraction with pilot dataset (first 100 records)
   - Verify data completeness (expected count matches actual count)

4. **Cleansing and Transformation**
   - Develop data quality rules (deduplication logic, null value handling)
   - Build staging tables to hold intermediate data
   - Develop transformation programs (apply mapping rules, data quality checks)
   - Create exception reports (records that fail validation, manual review needed)
   - Coordinate with business users on exception resolution (which duplicate customer to keep, where to assign orphaned GL accounts)

5. **Load Program Development**
   - Use batch input (BAPI_MATERIAL_GENERAL_MODIFY for materials, BAPIE_PO_CREATE for purchase orders)
   - Consider direct database load for initial master data (LSMW, direct SQL) if safe, fallback to BAPI
   - Build error handling (which errors warrant retry, which warrant escalation)
   - Establish performance baseline (how many records per minute can safely load)

6. **Testing and Validation**
   - Unit test: extract 1 material, load to SAP, verify in transaction MM02
   - Integration test: extract GL hierarchy, cost centers, materials together, verify relationships
   - Full data load test: load all production data in test environment, validate totals
   - Reconciliation test: legacy GL balance 1000000 → SAP GL balance should be 1000000
   - Stress test: if expecting 10M records, test with 10M

## Migration Activities

1. **ECC to S/4HANA RISE Migration**
   - Use SAP Data Transfer Workbench or LSMW for data extraction
   - ECC ledger consolidation: RISE uses only new general ledger (GL), so FI legacy ledger data must consolidate
   - Depreciation handling: if PP (Plant & Maintenance) assets depreciated in ECC, recalculate for RISE
   - Profit center reconciliation: RISE requires strict profit center assignments; assign unassigned GL accounts
   - Validation: post-cutover reconciliation (ECC GL balance vs RISE GL balance) must match to penny

2. **Non-SAP to RISE Migration**
   - No standard LSMW templates; custom extraction and mapping required
   - Higher risk of data quality issues (legacy system may lack SAP-level data constraints)
   - Complex mapping (legacy status codes, hierarchies don't align to SAP)
   - Longer parallel run needed (business users less familiar with SAP processes, need validation)
   - Consider data enrichment (add new fields required by SAP, fill from external reference data)

3. **Multi-Instance Consolidation**
   - If migrating from multiple legacy instances to single RISE instance: consolidate GL hierarchies, cost centers
   - Handle intercompany transactions (eliminate intra-company sales, purchases if consolidating into one entity)
   - Assign company codes and controlling areas (if legacy had independent cost accounting, establish RISE allocation keys)

4. **Historical Data Strategy**
   - Decide: load all history or only current-year data?
   - Loading all history increases cutover complexity and load time; often defer to Wave 2
   - Loading current-year only: establish opening balances, load current-year transactions, compress/archive prior years
   - If regulatory/audit requirement for history: load full history, set Go-Live Cut-Off date to separate active from historical

5. **Parallel Run Execution**
   - Duration: typically 1 pay cycle (monthly for most companies, weekly for high-volume retailers)
   - Process: run same transactions in legacy and RISE, compare results
   - Daily reconciliation: AR aging, AP aging, GL balances must match
   - Issue resolution: if discrepancy found (e.g., RISE calculated tax differently), fix mapping and re-test
   - Sign-off: finance leader certifies results match, approves cutover

## Rollout Activities

1. **Regional Migration**
   - If rolling out across multiple regions: pilot one region first, document learnings, optimize for subsequent regions
   - Pilot region should be representative (not too complex, not too simple)
   - Use pilot success to build confidence for other regions

2. **Phased Data Activation**
   - Wave 1: load core financials (GL, cost centers, suppliers, customers needed for finance close)
   - Wave 2: load materials, production data, supply chain
   - Wave 3+: load analytics, archived data, non-core reference data
   - Allows parallel run to focus on Wave 1 first, reduces cutover complexity

3. **Cutover Logistics**
   - Cutover window typically Friday 6pm → Monday 6am (allows 48+ hours without business impact)
   - Coordinate with operations team (data center availability, backup/restore windows)
   - Notify users: legacy system will be unavailable Friday; data available in RISE Monday morning

## Production Support Activities

1. **Post-Cutover Data Validation** (First week)
   - Reconcile GL balances (SAP GL balance = expected from legacy)
   - Reconcile transaction counts (orders, invoices loaded matches expected count)
   - Validate customer balances (AR aging in RISE = AR aging in legacy)
   - Identify and log any discrepancies for correction

2. **Data Correction** (First 2 weeks)
   - Address identified discrepancies (correction transactions, adjusting entries if needed)
   - Monitor for data anomalies (unusual GL posting, incorrect cost center assignments)
   - Support user questions about data accuracy (user notices their customer balance differs slightly)

3. **Data Archival**
   - Archive legacy system data per retention policy (often 7 years for financial data)
   - Decommission legacy system (after full backup taken, archival complete)
   - Preserve read-only access to legacy system if auditors require historical access

4. **Future Data Migrations**
   - Plan Wave 2 data loads (materials, BOM, production history)
   - Plan analytics data loading (aggregate data from SAP to BW/4HANA or embedded analytics)
   - Support new system integrations (third-party systems → RISE via APIs/XI)

## Troubleshooting

### Issue 1: Legacy Data Quality Prevents Load
**Symptoms:** Data load fails on referential integrity (e.g., GL account not found), validation errors block 5% of records, manual intervention needed for each error.

**Root Cause:** Legacy system lacks referential integrity constraints; accumulated bad data over years. GL account postings to non-existent GL codes, customer orders to deleted customers, materials to deleted plants.

**Resolution:**
- Before full load, audit source data and identify bad records (GL postings to invalid accounts)
- Create default GL accounts or cost centers for orphaned records (assign all orphaned to "Other" GL account)
- For customer orders: either drop orders from deleted customers (if old, not needed) or reassign to existing customer
- Build validation report listing all exceptions; business owner reviews and decides how to handle
- Load data in stages: first load clean records, then load exceptions with corrections

---

### Issue 2: Parallel Run Shows Discrepancies
**Symptoms:** Legacy GL balance 100,000; SAP GL balance 99,500. Difference not explained. Business not confident proceeding to cutover.

**Root Cause:** Mapping error (GL posting mapped to wrong account), timing difference (transaction in legacy during parallel run period, not in SAP), data quality issue (duplicate record loaded twice in SAP).

**Resolution:**
- Reconciliation detail: identify specific transactions causing difference
- Trace high-value transactions (check if large invoice mapped correctly)
- Validate mapping (GL account 4100010 in legacy correctly maps to 410000 in SAP)
- Check for timing differences (transactions posted in legacy but not yet in SAP)
- Identify any duplicate loads (full load run twice?)
- Extend parallel run period by 1–2 weeks to allow more transactions and identify pattern
- If systematic error found (all tax amounts calculated 5% wrong), fix mapping and reload

---

### Issue 3: Cutover Delayed Due to Data Issues
**Symptoms:** Parallel run shows issues; customer master has 500 duplicate records; GL hierarchy incomplete. Go-live window approaching. Business pressure to proceed; data not ready.

**Root Cause:** Data cleanup underestimated. Duplicate removal took longer than planned. GL hierarchy consolidation more complex than expected.

**Resolution:**
- Prioritize: which data issues block go-live, which can be fixed post-go-live? (Customer duplicates must be resolved; GL hierarchy can be completed Wave 2)
- For critical data: extend cutover window (2–3 days) to complete cleanup
- For non-critical: document post-go-live work plan (Wave 2 includes GL hierarchy completion, customer deduplication refinement)
- Escalate to steering committee: communicate data issues, recommended delay vs proceeding with known issues
- If proceeding with known issues: document workarounds (users will manually handle duplicate customer scenarios, GL costing will use temporary assignments)

---

### Issue 4: High Volume Data Causes Cutover Delays
**Symptoms:** Data load expected to take 4 hours; actually takes 12 hours. Parallel run ends; cutover window closing; system startup delayed.

**Root Cause:** Data volumes underestimated. Performance tuning inadequate (database parameters not optimized). Batch size too large (memory issues causing restarts).

**Resolution:**
- Stress test during Execute phase (load expected volume, identify bottlenecks)
- Parallelize load jobs (load GL accounts on Job 1, customers on Job 2, materials on Job 3 concurrently)
- Tune database (increase buffer pools, sort areas for batch input)
- Reduce batch size if memory-constrained (load 10,000 records per batch instead of 50,000)
- Establish restart points (if load fails at 50% complete, resume from failure point, not beginning)
- Have contingency: if cutover load takes too long, consider re-running legacy system for 1 more day, rescheduling cutover

---

### Issue 5: Post-Cutover Reconciliation Failures
**Symptoms:** After cutover, AR aging in RISE doesn't match legacy. Differences found: 200 invoices in legacy not in RISE, 50 RISE invoices not in legacy.

**Root Cause:** Delta migration logic missed transactions. Cutover happened Friday; transactions posted Friday afternoon (during cutover window) captured in legacy but missed in RISE delta load.

**Resolution:**
- Conduct detailed reconciliation (invoice-by-invoice for discrepancies)
- Identify transactions created during cutover window (those are most likely missed)
- Re-run delta load (if logic was incomplete, run again to capture missed invoices)
- Manual correction: for any missed transactions not captured in delta load, create correction entries in SAP
- Document root cause (cutover delta load didn't capture transactions between final load timestamp and actual go-live switch)
- Plan improvement for next wave (extend delta load capture window, establish clear cutover synchronization point)

## Common Interview Questions

1. **What is the purpose of parallel run in a RISE migration?**
   Parallel run validates that RISE produces identical business results to the legacy system. Both systems operate simultaneously for 1–2 cycles; daily reconciliation ensures accuracy, and business users confirm they can work in RISE before committing to cutover.

2. **How do you handle duplicate records during RISE migration?**
   Audit source data to identify duplicates (customers with multiple IDs, vendors with similar names). Establish deduplication rules (keep highest ID, most recent, or business-selected master). Load unique records; document mapping of deleted duplicates so users can search either ID if needed.

3. **What is delta migration and why is it critical?**
   Delta migration captures transactions created after the final data load but before system cutover. During cutover, transactions may post to legacy system; delta load brings those to RISE. Without delta, unmatched transactions remain in legacy, preventing clean system decommission.

4. **What tables do you validate post-cutover in a RISE migration?**
   GL balances (BKPF/BSEG summary), AR aging (BSAD), AP aging (BSAK), material master (MARA), customer master (KNA1), open orders (VBAK/VBAP), open invoices (VBRK/VBRP), inventory balances (MARD).

5. **How do you approach GL account mapping from legacy to RISE?**
   Identify legacy GL structure (chart of accounts), map to RISE GL hierarchy (if consolidating, establish parent GL structure). Document mapping (legacy 1000 = RISE 100-00, legacy 2000 = RISE 200-00), validate all GL postings post-migration map correctly.

6. **What is referential integrity in data migration and why does it matter?**
   Referential integrity ensures data consistency (GL postings only to valid GL accounts, customer orders only to valid customers). Legacy systems may violate this; RISE enforces it. Pre-cutover, audit and correct any violations.

7. **How would you migrate from a non-SAP system to RISE S/4HANA?**
   More complex than ECC→RISE. Custom extraction (legacy system doesn't have SAP standard data dictionary). Detailed mapping required (legacy status codes, hierarchies, organizational structures). Longer parallel run needed; higher risk of data quality issues.

8. **What is a master data cutoff in RISE migration?**
   The cutoff is the final point in time when legacy system stops accepting transactions (e.g., Friday 6pm). All transactions up to cutoff are migrated. Transactions after cutoff go directly to RISE. Cutoff establishes clear ownership (everything before goes to legacy, everything after to RISE).

9. **How do you validate data completeness after a RISE data load?**
   Compare record counts (legacy has 5,000 customers; SAP loaded 4,850 customers—identify missing 150). Compare GL balances (total revenue by GL account). Compare open order counts. Exception reports identify missing or incorrect records.

10. **What is the difference between a full load and a delta load in RISE migration?**
    Full load is the primary load (all master data + opening balances). Delta load captures transactions created after full load but before cutover. Delta ensures nothing is missed during parallel run.

11. **How would you handle a GL consolidation during RISE migration?**
    If migrating from multiple legacy instances to single RISE, consolidate GL hierarchies. Establish parent GL accounts (1000 level), child GL accounts (1100, 1200, etc.). Assign legacy GL to RISE GL; eliminate intercompany transactions if consolidating.

12. **What is the role of LSMW in RISE data migration?**
    LSMW (Legacy System Migration Workbench) is SAP standard tool for data extraction and load. Defines mapping (source field → SAP data element), builds batch input sessions, loads data to SAP. Efficient for SAP-to-SAP migrations (ECC → S/4HANA).

13. **How do you address data quality issues before cutover?**
    Audit source data early (Discover phase). Identify duplicates, missing values, invalid references. Coordinate with business on cleanup (which duplicate customer to keep). Prioritize: fix critical data (customer master) before load, defer non-critical data cleanup to post-go-live.

14. **What is reconciliation in data migration and give an example.**
    Reconciliation validates source and target match. Example: legacy AP aging shows $5M owed to vendors; SAP AP aging should also show $5M. If not, identify discrepancy (missing invoice, incorrect amount, wrong vendor assigned).

15. **How would you handle a multi-currency data migration to RISE?**
    Establish currency conversion rules (if legacy stored amounts in AUD, define AUD→USD conversion rate at cutoff). Apply conversion at load time. Validate post-load (original legacy amount × rate = SAP amount). Handle rounding (SAP may round differently than legacy).

## Tough Follow-up Questions

1. **If parallel run reveals a systematic data quality issue that requires rework, but cutover window is approaching, how would you handle it?**
   Assess severity: if data quality issue causes business impact (incorrect customer balance, wrong GL account assignment), don't proceed—rework required. Escalate to steering committee with recommendation: extend go-live by 1–2 weeks, or proceed with known issues (customer must approve workaround). Don't cut corners on data quality.

2. **What would you do if post-cutover reconciliation shows 5% of transactions missing in RISE?**
   First, determine if missing transactions are critical (are they in legacy? where did they go?). If logic error in delta load, re-run delta extraction. If transactions created during cutover window missed, use cutoff log to identify and manually load. If systematic error (specific transaction type always missed), understand pattern and correct before next wave.

3. **How would you handle a situation where a legacy system fails during parallel run, preventing daily reconciliation?**
   Legacy system failure during parallel run is high-risk—can't validate RISE accuracy. Restore legacy from backup immediately. Use redundancy (another legacy system instance, if available). If legacy can't be restored quickly, extend parallel run period after system restoration. Document all transactions during outage; reconcile carefully after restoration.

4. **If customer master data migration completed, but halfway through execution, customer master structure changes (new field requirements), how would you handle it?**
   Assess impact: if new field required for RISE functionality, must redesign migration. If optional field, can handle post-go-live (load current data, add field values in Wave 2). Submit formal change request to steering committee (cost, timeline impact). Prioritize: proceed with current plan or redesign?

5. **What if delta migration captures transactions that legacy system couldn't handle (e.g., amount exceeds legacy validation limit)?**
   Transactions that exceed legacy limits won't be in legacy comparison; those are "new" RISE transactions. Document them separately. In reconciliation, exclude transactions created during cutover window from comparison (they won't be in legacy). Post-cutover reconciliation focuses on opening balances and transactions before cutover window.

6. **How would you handle a situation where mapping rules are ambiguous for a large portion of data?**
   Don't proceed with ambiguous mapping. Business owner must decide (e.g., "if legacy GL account is ambiguous, assign to GL 9999 Other, then assign post-go-live"). Document decision. If ambiguity affects >10% of data, extend Execute phase to clarify mappings—rushing through causes post-cutover issues.

7. **If RISE data load performance is much worse than tested (expected 4 hours, actually 12), and cutover window doesn't allow extra time, what options exist?**
   Option 1: Parallelize load (run multiple jobs simultaneously on different processes). Option 2: Defer non-critical data to Wave 2 (reduce load scope). Option 3: Extend cutover window (add extra 8 hours). Option 4: Load data pre-cutover in smaller batches (load Friday morning, validate, cutover Friday evening). Escalate to steering committee with options and impacts.

8. **What if reconciliation after parallel run shows RISE is calculating costs/prices differently than legacy?**
   Identify the difference (is it rounding? is it a pricing method difference?). If SAP is calculating based on different logic than legacy, validate whether SAP calculation is correct (SAP usually calculates correctly; legacy may have bugs). If business requirement is to match legacy exactly, adjust SAP configuration (costing method, rounding rules). If SAP is correct, accept small difference and communicate change to users.

## SAP Transactions

- LSMW: Legacy System Migration Workbench
- SE01: Transport Organizer (data transport)
- SM30: Table Maintenance (direct table edit if necessary)
- SM35: Batch Input Sessions (monitor and run batch input)
- FBL5N: Customer line items (validate AR)
- FBL1N: Vendor line items (validate AP)
- MB51: Material document list (validate inventory)
- MIRO: Purchase Invoice (verify invoice loads)
- VF01: Create Billing Document (test invoice creation)
- VA01: Create Sales Order (test order creation)
- FB01: Post General Ledger entry (test GL posting)
- S_ALR_87010315: General Ledger reconciliation report
- OAAD: Opening balance reconciliation
- BKPF: Display GLE header (reconcile GL balances)

## SAP Tables

- BKPF: General Ledger header (GL postings)
- BSEG: General Ledger line items (GL line detail)
- BSAD: Customer line items (AR cleared)
- BSAK: Vendor line items (AP cleared)
- BSID: Customer line items (AR open)
- BSIK: Vendor line items (AP open)
- VBAK: Sales order header (open orders)
- VBAP: Sales order line items (order line detail)
- EKKO: Purchase order header (open POs)
- EKPO: Purchase order line items (PO line detail)
- MARA: Material master (product master)
- KNA1: Customer master (sold-to customer)
- LFA1: Vendor master (supplier master)
- MARD: Material warehouse stock (inventory balances)

## Best Practices

- **Audit source data early:** Don't wait until Execute phase to discover data quality issues. Assess in Discover; plan cleanup in Explore.
- **Establish clear mapping:** Document all transformation rules before building code. Business review and sign-off on mappings prevents rework.
- **Test with production-like volume:** If expecting 10M records, test load with 10M, not 100. Performance issues surface only at scale.
- **Parallel run is non-negotiable:** Don't skip parallel run to save timeline. It's the only validation before cutover.
- **Reconcile to penny:** Accounting data must match exactly. Rounding differences, missing transactions, or systematic errors found during parallel run—fix before cutover.
- **Plan delta migration from day one:** Identify which transactions will be created during cutover window; plan extraction and loading before cutover begins.
- **Communicate data risks early:** If data quality poor, tell stakeholders in Discover, not in Cutover week. Gives time to plan mitigation.
- **Backup and restore test:** Before go-live, test backup/restore of production data. Ensures you can recover if critical data loads fail.

## Common Mistakes

- **Underestimating data quality effort:** "Our legacy data is fine" often means "we haven't looked closely." Expect 20–30% of execution effort on data cleanup.
- **Skipping reconciliation detail:** "Totals match, we're good" misses systematic issues. Reconcile at transaction level, not just summary totals.
- **Loading all historical data:** Unnecessary historical data (5 years of invoices for closed customers) increases cutover complexity. Load current-year and opening balances only.
- **Inadequate parallel run:** 1-week parallel run isn't enough for complex migrations. Run 2–3 cycles to build confidence.
- **No delta migration planning:** Transactions created during cutover window lost if delta plan missing. Delta is critical.
- **Treating data migration as IT task:** Data quality decisions are business decisions. Involve finance, supply chain leads early and often.
- **Inadequate testing:** "We'll handle issues post-go-live" leads to reconciliation chaos post-cutover. Test thoroughly Execute phase.

## Interviewer's Hidden Expectations

- **Appreciate complexity:** Data migration isn't a technical checkbox; it's business-critical. Show you understand business impact of bad data.
- **Reconciliation discipline:** A candidate who discusses reconciliation strategies shows attention to accuracy.
- **Parallel run strategy:** Understand why parallel run matters and how to design it (duration, scope, what to validate).
- **Risk awareness:** Data quality risks, cutover delays, reconciliation failures—show you know the pitfalls.
- **Vendor/partner management:** Can you work with partner on data migration (partner does extraction, you validate)?
- **Communication:** Data migration issues often create post-go-live chaos. Show you'd communicate risks early and often.

## What Makes This a 10/10 Answer

- Candidate explains data migration is critical path and business risk, not just IT plumbing
- Discusses parallel run, reconciliation strategy, and delta migration as core components
- Mentions data quality assessment during Discover phase
- Addresses non-SAP system integration challenges
- Explains GL consolidation, GL account mapping with specifics
- Discusses cutover window planning and delta capture
- Shares real example from complex migration (multi-instance consolidation, legacy system challenges)
- Shows understanding of post-cutover validation and reconciliation

## Red Flags

- Treats data migration as simple ETL ("just extract and load")
- No mention of reconciliation or data validation
- Hasn't participated in actual data migration but claims expertise
- No awareness of parallel run or its importance
- Assumes legacy data quality is fine without assessment
- No concern for cutover timing and delta migration
- Can't articulate mapping strategy for non-SAP system migration
- Doesn't understand reference integrity or why it matters

## Keywords

- LSMW (Legacy System Migration Workbench)
- Parallel run / Parallel operations
- Delta migration
- Reconciliation / Reconcile
- Data cleansing / Data quality
- Master data
- Referential integrity
- Mapping specification
- Cutoff date
- GL consolidation
- Batch input
- Extraction / Transform / Load (ETL)

## Related Topics

- [RISE Project Management](./rise-project.md)
- [RISE Cutover and Go-Live](./rise-cutover.md)
- [Data Quality Framework](../project-types/data-migration.md)
- [SAP Testing Strategy](../project-types/testing.md)
- [Financial Close Process](../project-management/financial-close.md)
