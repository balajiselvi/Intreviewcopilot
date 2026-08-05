# SAP Data Migration Strategy

## Overview

SAP data migration is the process of extracting data from legacy systems and loading it into SAP (greenfield, brownfield, or bluefield projects). Data migration is typically the longest and most complex phase of SAP implementation because: (1) legacy data is often poor quality (duplicates, missing values, incorrect formats), (2) data schema differs significantly (legacy vendor A's schema vs SAP's schema), (3) data volumes are massive (terabytes of 20+ years of transactions), (4) data integrity is mission-critical (financial data must be accurate, auditable). Data migration requires: master data governance (define clean data), ETL tools (extract-transform-load), reconciliation processes (validate legacy vs SAP), and careful cutover execution (final data load, parallel run validation). Poor data migration causes post-go-live chaos: incorrect balances, missing transactions, customer records corrupted. This is why data migration is often the make-or-break factor in SAP projects.

## Interview Summary

Data migration: extracting legacy data, transforming to SAP schema, loading into SAP. Challenges: legacy data quality (duplicates, missing), schema differences (different vendor systems), massive volumes (20+ years of data). Critical success factors: master data governance, data cleansing, ETL tools, reconciliation, validation. Poor migration = post-go-live chaos (incorrect balances, missing data, customer problems).

## 30 Second Interview Answer

Data migration: legacy data → SAP data. Key challenges: (1) Data quality (duplicates, missing values), (2) Schema transformation (legacy vendor A schema → SAP schema), (3) Volume (terabytes of 20-year history). Strategy: master data governance upfront, data cleansing (remove duplicates), ETL tools (automate transformation), reconciliation (validate legacy vs SAP match), pilot migration (test small dataset first).

## 60 Second Interview Answer

Data migration transforms legacy system data into SAP format and loads it. Process: (1) Extract data from legacy system. (2) Transform to SAP schema (map fields, convert formats, cleanse). (3) Load into SAP. (4) Validate (verify data accuracy, reconcile balances).

Challenges: Legacy data quality is often poor (20-year accumulation of errors, duplicates, incomplete records). SAP schema differs from legacy vendor (consolidating multiple vendors = multiple transforms). Volume can be massive (terabytes, can take days to load).

Strategy: (1) Master data governance (define what "clean" data looks like). (2) Data cleansing (remove duplicates, fill missing values, standardize formats). (3) ETL tools (automate transformation; don't script manually). (4) Pilot migration (test with subset of data first). (5) Reconciliation (legacy data vs SAP data—must match). (6) Iterative refinement (pilot reveals issues, fix transforms, re-pilot).

Timeline: 2-4 months typical (longer for large/complex data).

## 90 Second Interview Answer

Data migration is moving legacy system data into SAP. It's complex because legacy data is messy, schema is different, volumes are huge, and accuracy is mission-critical (financial data, customer records must be 100% accurate).

**Key Phases:**

1. **Assess & Plan (Weeks 1-2):**
   - Catalog what data exists in legacy system
   - Identify which legacy data moves to SAP (not everything does)
   - Analyze data quality (identify duplicates, missing values, bad formats)
   - Estimate data volume and transformation complexity
   - Plan data migration timeline

2. **Design (Weeks 3-4):**
   - Define target SAP data model (what fields, formats, validation rules)
   - Map legacy fields → SAP fields (transformation rules)
   - Design data cleansing approach (remove duplicates, fill gaps, validate)
   - Select ETL tools (SAP Data Services, SAP Cloud Integration, third-party tools)
   - Plan reconciliation approach (how to validate migrated data)

3. **Build (Weeks 5-8):**
   - Develop ETL scripts/mappings (legacy schema → SAP schema)
   - Implement data cleansing logic (deduplicate, standardize formats)
   - Build validation checks (data quality gates)
   - Set up test environment (isolated SAP system for migration testing)

4. **Pilot Migration (Weeks 9-10):**
   - Extract small subset of legacy data (sample by entity, customer segment, date range)
   - Transform via ETL scripts
   - Load into test SAP environment
   - Validate data (check for errors, missing values, format issues)
   - Reconcile: legacy totals vs SAP totals (must match)
   - Identify and fix data issues
   - Re-run pilot until validation passes

5. **Full Migration Prep (Weeks 11-12):**
   - Refine ETL scripts based on pilot findings
   - Prepare data cleansing for full dataset
   - Plan full migration timeline (how many days to extract, transform, load)
   - Prepare rollback procedure (in case migration fails)
   - Freeze legacy system data (no new entries while migrating)

6. **Go-Live Cutover (Days 1-3):**
   - Final extract from legacy (all data as of cutover date)
   - Final transform and load into SAP
   - Reconciliation (final validation; legacy vs SAP must match)
   - User access to SAP (legacy system shut down or read-only)
   - Parallel run period: both systems live for 1-4 weeks (business validates)

7. **Post-Go-Live (Weeks 13-16):**
   - Ongoing data validation (spot checks, reconciliation)
   - Issue resolution (data discrepancies investigated, corrected)
   - Performance optimization (data model tuning if needed)
   - Legacy system archival or decommissioning

**Data Cleansing (Critical Step):**

- **Deduplication:** Identify duplicate customer/vendor/product records (consolidate into one master record)
- **Format Standardization:** Convert dates/numbers/strings to SAP standard
- **Missing Value Handling:** Fill required fields (use defaults or ask business)
- **Validation Rules:** Apply business rules (GL accounts must be valid, dates must be logical, amounts must be positive)
- **Reconciliation:** Sum of legacy records = sum of migrated records (by entity, by period, by transaction type)

**Challenges & Mitigation:**

- **Challenge:** Data quality so poor that migration takes 2x longer than planned.
  **Mitigation:** Start data assessment early (pilot migration in development phase), allocate extra time budget.

- **Challenge:** ETL tool crashes mid-load (terabytes of data); data in inconsistent state.
  **Mitigation:** Use robust ETL tools, implement restart logic (load can resume from checkpoint), test with full dataset size in test environment.

- **Challenge:** Legacy and SAP don't reconcile; variance of $10M in customer balances.
  **Mitigation:** Detailed reconciliation analysis (by entity, by GL account, by transaction type), identify root cause (data loss, transformation error, timing differences), fix and re-run subset.

- **Challenge:** Mid-migration, business discovers legacy data they want to keep (thought was irrelevant).
  **Mitigation:** Scope migration carefully before starting; have "freeze" on new requirements; keep legacy system read-only archive for reference.

## Architecture

- **Data Sources:** Legacy system(s) (ECC, vendor X, vendor Y)
- **ETL Layer:** Tools for extraction, transformation, validation
- **Staging Area:** Temporary storage for data transformation (not in SAP)
- **Target:** SAP master data tables (customers, vendors, GL accounts, materials, etc.)
- **Reconciliation:** Validation reports comparing legacy vs SAP

## Runtime Flow

1. **Phase 1: Plan & Design (Weeks 1-4)**
   - Analyze legacy data structure and quality
   - Define target SAP data model
   - Create mapping (legacy field → SAP field)
   - Design cleansing and transformation rules
   - Select ETL tools and infrastructure

2. **Phase 2: Build & Test (Weeks 5-8)**
   - Develop ETL scripts/configurations
   - Implement data validation and cleansing
   - Set up test environment
   - Conduct unit testing (individual transformations)
   - Conduct integration testing (full ETL pipeline)

3. **Phase 3: Pilot Migration (Weeks 9-10)**
   - Extract sample data from legacy
   - Execute ETL pipeline
   - Load to test SAP
   - Validate results
   - Reconcile legacy vs SAP balances
   - Debug and fix issues
   - Iterate until successful

4. **Phase 4: Prepare for Full Migration (Weeks 11-12)**
   - Refine ETL based on pilot learnings
   - Prepare full-dataset extract
   - Prepare migration timeline
   - Brief stakeholders on expected downtime
   - Prepare rollback procedure

5. **Phase 5: Final Migration & Go-Live (Days 1-3)**
   - Freeze legacy system (no new data entry)
   - Execute final extract
   - Execute full ETL transformation
   - Load into production SAP
   - Validate data completeness
   - Reconcile final numbers
   - Cut over to SAP (users access SAP, legacy read-only)

6. **Phase 6: Post-Migration (Weeks 13+)**
   - Monitor data quality
   - Ongoing reconciliation (spot checks)
   - Issue resolution
   - Performance tuning
   - Legacy system archival

## Configuration

- **Data Mapping:** Legacy field → SAP field transformations
- **Cleansing Rules:** Deduplication, format standardization, validation
- **Reconciliation Reports:** Comparing legacy vs SAP balances
- **ETL Tool Configuration:** Extraction, transformation, load parameters
- **Validation Criteria:** Data quality gates, acceptable variances

## Implementation Activities

- Comprehensive data assessment (quality, volume, complexity)
- Design data cleansing strategy
- Develop ETL scripts and mappings
- Build data validation and reconciliation framework
- Execute pilot migration (iterative)
- Prepare full migration (final refinement)
- Execute go-live migration
- Post-migration monitoring and issue resolution

## Migration Activities (Specific)

- Extract data from legacy system (via database, API, file export)
- Transform to SAP schema (map fields, convert formats)
- Validate data against business rules
- Cleanse (remove duplicates, fill gaps, standardize)
- Load into test SAP environment (iterate until clean)
- Load into production SAP (final cutover)
- Reconcile (verify legacy totals = SAP totals)

## Rollout Activities

- Phase 1 entity migration (test with first location/subsidiary)
- Monitor and refine based on Phase 1 learnings
- Phase 2, Phase 3 entities migrate (expanding rollout)
- Each phase has full migration/reconciliation cycle

## Production Support Activities

- Post-migration data validation (ongoing)
- Reconciliation reports (daily/weekly for first month)
- Issue identification and resolution
- Data archival and legacy system decommissioning
- Performance monitoring (data volume impact on SAP)

## Troubleshooting

**Common issue:** Data transformation slower than expected; migration window overflows planned time.
Root cause: ETL tool performance insufficient, data volume larger than estimated, or transformation logic inefficient.
Resolution: Optimize ETL (parallelize, improve query performance), increase infrastructure, or extend migration window (additional system downtime).

**Common issue:** Post-go-live, customer discovers missing transaction; legacy data not migrated.
Root cause: Data exclusion rule too aggressive (thought was old/irrelevant), or transformation failed for that record type.
Resolution: Investigate (was it migrated but in different format?), if truly missed, potentially recoverable from legacy system archive. Prevent with comprehensive reconciliation pre-go-live.

**Common issue:** GL account balances in SAP don't match legacy; off by $100K.
Root cause: Rounding differences, timing differences (cutoff date interpretation), or missing transaction type.
Resolution: Reconcile by entity/GL/transaction type to isolate issue, adjust for known differences (rounding, timing), correct discrepancies before user access.

**Common issue:** Duplicate customer records merged incorrectly; one customer has two sets of orders.
Root cause: Deduplication logic too aggressive or not aggressive enough.
Resolution: Manual investigation and correction, update deduplication rules, re-run on affected subset, update master data.

## Common Interview Questions

1. **What's the most common data migration challenge?**
   Data quality. Legacy systems accumulate 20 years of errors, duplicates, missing values. Cleaning takes longer than expected. Start data assessment early.

2. **How do you validate that data migrated correctly?**
   Reconciliation: legacy totals (by entity, GL account, transaction type) should equal SAP totals. Document any expected variances (rounding, timing). Spot checks: manually verify sample records in SAP.

3. **What's a pilot migration, and why is it important?**
   Test migration with subset of data (small customer population, specific period). Reveals data quality issues, transformation errors, tool performance problems. Fix issues before full migration (when too late to fix).

4. **How long does data migration typically take?**
   2-4 months (assessment, design, build, pilot, refinement). Extraction/transformation/load itself can take days-weeks for large volumes. Parallel run adds weeks (both systems live).

5. **What happens if migration fails during go-live cutover?**
   Rollback to legacy system (users access legacy, SAP access blocked). Root cause analysis, fix issues, retry migration in next cutover window (days/weeks later).

## Tough Follow-up Questions

1. **You're extracting 10 years of data from legacy; file is 500GB. Extract takes 8 hours, transform takes 12 hours, load takes 4 hours—total 24+ hours. Cutover window is 8 hours. How do you fit?**
   Options: (1) Parallelize (extract multiple segments simultaneously). (2) Incremental migration (migrate most data before cutover, cutover window only for final delta). (3) Reduce scope (migrate only last 3 years, archive older data separately). Recommend: incremental approach (bulk before cutover, final delta during cutover window).

2. **Pilot migration found 50,000 duplicate customer records. Deduplication rules need rework. You're 2 weeks away from go-live cutover. Can you fix it?**
   Analysis: 50K duplicates is major. Rules can likely be fixed in 1-2 weeks (develop, test, re-pilot). Decision: slip go-live 1-2 weeks to fix properly, or go-live with duplicates (fix post-go-live). Recommend: slip date (wrong customer data is worse than late go-live).

3. **GL account balance reconciliation: legacy = $1B, SAP migrated = $950M. $50M variance. Root cause unknown. Go-live in 3 days.**
   Analysis: $50M is material (must find root cause). Options: (1) Detailed reconciliation by GL account/entity to isolate issue. (2) Spot check high-value transactions (find the missing $50M). (3) If root cause found and fixable: apply correction, validate, proceed. (4) If not fixable in 3 days: slip go-live, investigate post-migration.

4. **Post-migration, customer says "I have an order in legacy that's not in SAP." How do you investigate?**
   Steps: (1) Find order in legacy system. (2) Verify order date is within migration scope (if before migration period, might not have migrated). (3) Check SAP for order (different format? different ID?). (4) Check reconciliation reports (was order filtered out as duplicate or invalid?). (5) If truly missing: recover from legacy, manually load to SAP (or provide data to customer).

## SAP Transactions

- **SE38/SE80** — Custom ABAP for data load routines
- **Transaction AL11** — File paths for data exchange
- **LSMW** (Legacy System Migration Workbench) — SAP's built-in migration tool

## SAP Tables

- **KNA1** (Customer Master) — Primary target for customer migration
- **LFA1** (Vendor Master) — Primary target for vendor migration
- **MARA** (Material Master) — Primary target for product/material migration
- **SKA1** (GL Account Master) — Primary target for chart of accounts

## Best Practices

- Start data assessment early (pilot in dev phase, not in production cutover)
- Use professional ETL tools (don't script manually with SQL)
- Design comprehensive reconciliation upfront (not retrospectively)
- Pilot with diverse data (different entity types, customer segments, date ranges)
- Freeze legacy system before final cutover (no new data interferes)
- Allocate extra time budget (data always takes longer than estimated)
- Keep legacy system as archive (1-2 years, for audit trail and reference)
- Document all transformation rules and exceptions (for future questions)

## Common Mistakes

- Underestimating data cleansing effort (think it's 1 week, actually 4 weeks)
- Inadequate data assessment upfront (surprises during pilot)
- Using manual scripts instead of ETL tools (doesn't scale)
- No pilot (attempt full migration on go-live cutover; if fails, disaster)
- Insufficient reconciliation (not validating accuracy before cutover)
- Rushing cutover (if data not clean, don't go live; slip timeline)

## Interviewer's Hidden Expectations

Strong answers show: (1) **data quality realism** (legacy data is messy, cleansing is hard), (2) **pilot approach** (test before full migration), (3) **reconciliation discipline** (validate accuracy), (4) **tool selection** (ETL tools, not manual scripts), (5) **timeline realism** (2-4 months is normal), (6) **risk mitigation** (rollback plan, archive legacy).

## What Makes This a 10/10 Answer

- Recognition that data quality is biggest challenge
- Pilot migration strategy (test first, iterate)
- Comprehensive reconciliation approach (legacy vs SAP must match)
- ETL tool selection (professional tools, not scripts)
- Timeline realism (data takes longer than code)
- Rollback and contingency planning
- Post-migration support and archival strategy
- Experience example with lesson learned

## Red Flags

- Underestimating timeline ("2 weeks to migrate")
- No mention of data cleansing
- No pilot migration (jump straight to production)
- Inadequate reconciliation strategy
- No rollback plan if migration fails

## Keywords

- Data migration, ETL, extract-transform-load
- Data cleansing, deduplication, validation
- Master data, reconciliation, legacy system
- Pilot migration, full migration, cutover
- Data quality, schema transformation
- Parallel run, data archival

## Related Topics

- [Brownfield Implementation](brownfield.md)
- [Data Governance](../project-management/data-governance.md)
- [Bluefield Implementation](bluefield.md)
