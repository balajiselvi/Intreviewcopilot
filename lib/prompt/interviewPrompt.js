import { buildAnswerStyle } from "./speechOptimizer";

// Length is driven by question complexity, not the (largely inert) client responseLength
// setting — this is also the main latency lever available under a single-pass architecture:
// generation wall-clock time scales with tokens produced, so a tighter, category-aware
// ceiling is what actually gets answers under the ~5-6s target, not prompt wording alone.
const LENGTH_BUDGETS = Object.freeze({
  simple: { words: "40-80", maxTokens: 140 },
  medium: { words: "80-140", maxTokens: 230 },
  // 340 truncated mid-sentence on the enriched Troubleshooting/Authorization templates (the
  // explicit failure taxonomy + AGR_USERS/user-comparison + Fiori-vs-backend distinction) --
  // a live-validation run measured a genuinely complete answer at ~248 words / ~410 tokens,
  // so 340 was cutting it off before it reached its own required closing meta-strategy step.
  architecture: { words: "140-220", maxTokens: 420 }
});

const SIMPLE_CATEGORIES = new Set(["Definition"]);
const ARCHITECTURE_CATEGORIES = new Set(["Architecture", "Migration", "Upgrade", "Role Design", "Security", "Comparison", "RISE"]);

const ASK_SIGNAL = /\b(how|what|why|when|where|explain|describe|walk me through|compare|list|discuss)\b/;

// Real interview questions routinely stack two distinct asks into one prompt regardless of
// SAP module ("How did you configure IAG? explain its architecture" / "What is BRM and how
// do you configure business roles?" / "Explain SoD conflicts and how you resolve them in
// ARA"). Whichever keyword category wins classification, a question demanding two answers
// needs the wider budget or the second half gets truncated mid-sentence -- this is checked
// on the raw question text so it isn't tied to CATEGORY_RULES at all.
function isCompoundQuestion(question = "") {
  const clauses = question
    .split(/[.?!]+|\band\s+(?=how\b|what\b|why\b|when\b|where\b|explain\b|describe\b|walk\b|compare\b|list\b|discuss\b)/i)
    .map((s) => s.trim())
    .filter(Boolean);
  const askClauses = clauses.filter((c) => ASK_SIGNAL.test(c.toLowerCase()));
  return askClauses.length >= 2;
}

// Category-independent depth signal, same cross-cutting-override shape as isCompoundQuestion
// above. Audit trace confirmed the actual failure: "What is IAS?" classifies primary category
// IAS (weight 4, chat.js CATEGORY_RULES) over "Definition" (weight 2, demoted to secondary),
// so IAS's full 5-step architecture-shaped CATEGORY_TEMPLATES entry governs a bare factual
// question -- live-verified at 108 words drifting into "In an architecture, IAS acts as...".
// Simultaneously lib/interviewerProfiler.js's persona matcher finds no pattern match for this
// phrasing and falls back to its hardcoded default, "architect" (Depth: Very High,
// Architecture First), compounding the problem. This detector never names a product, so it
// generalizes to any current or future category, not just IAS -- matching the exact
// generalization argument already proven by isCompoundQuestion.
const SIMPLE_FACTUAL_PATTERN = /^\s*(what\s+is|what's|define|what\s+does)\b/i;
// Guards against "What is the best way to design/secure/troubleshoot X" and similar phrasing
// that starts like a bare definition ask but is actually a design/scenario question in
// disguise -- these verbs are exactly what the required complex-question test cases use
// ("Design an IAS authentication architecture...", "How would you troubleshoot BTP..."),
// none of which match SIMPLE_FACTUAL_PATTERN's prefix anyway, but this is a cheap second layer.
const SIMPLE_FACTUAL_EXCLUSIONS = /\b(difference|versus|\bvs\b|compare|comparison|relationship between|role of|and how|and why|and when|and what|best way|approach|design|architecture|troubleshoot|secure|implement|configure|integrate)\b/i;

export function isSimpleFactualQuestion(question = "") {
  const trimmed = String(question || "").trim();
  if (!trimmed) return false;
  if (isCompoundQuestion(trimmed)) return false;
  if (!SIMPLE_FACTUAL_PATTERN.test(trimmed)) return false;
  if (SIMPLE_FACTUAL_EXCLUSIONS.test(trimmed)) return false;
  // A genuine bare factual ask is short ("What is IAS?", "What is a RAID log?") -- a real
  // design/scenario question phrased with a "what is" opener runs longer. Defense-in-depth
  // alongside the exclusion list above, not the primary signal.
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  return wordCount <= 8;
}

// A domain-specific keyword category (e.g. "IAG", weight 4) can outscore the generic
// "Architecture" keyword (weight 3) for the SAME question in chat.js's classifier, winning
// primaryCategory even when the question is explicitly asking for architecture depth —
// checking secondaryCategories too means that demoted-but-present "Architecture" still
// gets the wider budget instead of silently truncating a multi-point answer.
// A question naming multiple distinct technical entities in ONE clause ("How would you
// integrate SAP IAS/IPS/IAG with SAP and non-SAP systems in a hybrid or RISE environment?")
// never trips isCompoundQuestion -- that only detects multiple separate ask-clauses, not
// multiple entities within a single "how" clause. But classifyWeightedIntents() already
// tells us how many distinct categories matched: 2+ secondary categories (3+ total) is a
// reliable proxy for "this answer has to cover more than one technical thing," independent
// of which specific categories they are. Confirmed via a live-validation truncation: this
// exact question resolved to secondaryCategories=["IPS","IAG"] (length 2) and got cut off
// mid-sentence on the 230-token medium budget.
const MULTI_ENTITY_SECONDARY_THRESHOLD = 2;

// A separate, narrower structural cue: "first 30/60/90 days" style questions demand covering
// several distinct phases regardless of category (a 30/60/90 plan question classified as
// "General" with zero secondary categories still needs the wider budget, or it runs out of
// room partway through the phases) -- caught via a live-validation truncation on exactly this
// question shape.
const MULTI_PHASE_PATTERN = /\b\d+\s*[/-]\s*\d+\s*[/-]\s*\d+\b/;

const TIER_ORDER = ["simple", "medium", "architecture"];

function widenTier(tier) {
  return TIER_ORDER[Math.min(TIER_ORDER.indexOf(tier) + 1, TIER_ORDER.length - 1)];
}

function getLengthTier(category, secondaryCategories = [], question = "", isDeepenFollowUp = false) {
  let tier;
  // Checked first, ahead of category membership -- a bare factual question about a category
  // that's normally ARCHITECTURE_CATEGORIES (or any other category) must still get the short
  // tier. This is the override; everything below is the category-driven default it overrides.
  if (isSimpleFactualQuestion(question)) tier = "simple";
  else if (SIMPLE_CATEGORIES.has(category)) tier = "simple";
  else if (ARCHITECTURE_CATEGORIES.has(category)) tier = "architecture";
  else if (secondaryCategories.some((c) => ARCHITECTURE_CATEGORIES.has(c))) tier = "architecture";
  else if (isCompoundQuestion(question)) tier = "architecture";
  else if (secondaryCategories.length >= MULTI_ENTITY_SECONDARY_THRESHOLD) tier = "architecture";
  else if (MULTI_PHASE_PATTERN.test(question)) tier = "architecture";
  else tier = "medium";
  // A "go deeper" follow-up explicitly asks for MORE technical specificity than the first pass
  // gave (see DEEPEN MODE below) -- this was never factored into the length tier, so a deepen
  // request on a Definition-category question stayed capped at the 140-token "simple" ceiling
  // and truncated mid-sentence in live testing -- the opposite of what was actually asked for.
  return isDeepenFollowUp ? widenTier(tier) : tier;
}

function getLengthBudget(category, secondaryCategories, question, isDeepenFollowUp) {
  return LENGTH_BUDGETS[getLengthTier(category, secondaryCategories, question, isDeepenFollowUp)];
}

// pages/api/chat.js calls this to size max_tokens/maxOutputTokens per request instead
// of a flat ceiling — keeps buildSapInterviewPrompt's own return type (a string) unchanged.
export function getMaxTokensForCategory(category, secondaryCategories, question, isDeepenFollowUp, reasoningMode) {
  if (reasoningMode === "define") return LENGTH_BUDGETS.simple.maxTokens;
  if (reasoningMode === "relate" || reasoningMode === "compare") return LENGTH_BUDGETS.medium.maxTokens;
  return getLengthBudget(category, secondaryCategories, question, isDeepenFollowUp).maxTokens;
}

const CATEGORY_TEMPLATES = Object.freeze({
  Definition: "Structure: Why This Matters (enterprise context) → Direct Definition → Real Use Case/Problem It Solves → SAP Component Reference → Stop.",
  Architecture: "Structure: Component Topology → Runtime Protocols → Integration Mechanisms → Production Considerations.",
  Implementation: "Structure: Business Requirement → Technical Configuration → Testing Validation → Production Deployment.",
  Troubleshooting: "Structure: Real Problem Pattern → Root Cause Analysis → Step-by-Step Resolution (with T-codes/transactions for an ABAP backend, or the correct cloud-native construct for a cloud product -- see PRODUCT GATE below) → Preventive Monitoring → Next Troubleshooting Steps. PRIORITY: Explicitly call out at least one edge case or unusual scenario where the standard diagnostic sequence breaks down or needs a different path (e.g. composite role conflicts, org-level restrictions, cross-system trust issues, cached buffer vs live authorization checks). Where the symptom could affect more than one person, state early whether this looks like a single-user issue (points to that user's data, role assignment, or mapping) or a multi-user/population-wide issue (points to a connector, job, or system-level cause instead) -- this is real production troubleshooting judgment, not just a tool list. PRODUCT GATE (a live external review caught this failing): identify which product actually owns the failure before naming any tool. An ABAP transaction code (SU53, STAUTHTRACE, ST01, SU24, PFCG, SICF, Gateway logs, SLG1, ST22, SM21) is never the right first tool for a pure BTP/IAS/IPS/IAG cloud-application authorization or provisioning failure -- for BTP reason via Identity Provider → Trust → Role Collection → Scope → Application/Runtime → Logs; for IPS reason via Source → Read → Filter → Transformation → Target → Provisioning Log; for IAG reason via Access Request → Risk Analysis → Provisioning → Certification. This gate also applies within ABAP-family systems, not just cloud vs. on-premise: a BW/4HANA query-access failure is a BW analysis-authorization problem (RSECADMIN-maintained, characteristic-value-based restriction connected to PFCG via authorization object S_RS_AUTH -- a distinct mechanism from standard S_RS_COMP execute-level authorization) even though BW runs on ABAP, and a Datasphere access failure is a space/privilege problem, not BW analysis authorization or classic PFCG objects, even though it may sit alongside BW in the same landscape. DIAGNOSTIC METHODOLOGY (required for any 'how do you diagnose/troubleshoot X' question): 1) Scope the symptom first — state that the exact diagnostic path depends on what the reported symptom actually means and which product owns it, don't assume a single interpretation. 2) State the order you check things IN and WHY that order, not just a flat list — e.g. 'I check X before Y because...'. 3) Name the distinct underlying failure categories as an explicit taxonomy (e.g. configuration vs. authorization vs. provisioning/synchronization vs. connectivity) rather than a single undifferentiated checklist -- for an authorization-error question specifically, that taxonomy is: genuinely missing authorization vs. incorrect field value vs. org-level restriction vs. role-generation/user-comparison-sync gap (a correct role can still fail a user if the user comparison after a role change was never run) vs., for a Fiori/UI5 app on S/4HANA, a frontend/OData/service-layer failure that isn't a backend authorization problem at all. 4) Close with an explicit statement of what the diagnostic approach is trying to isolate before making changes — the meta-strategy, not another tool name-drop (for an authorization fix specifically: validate the change against least-privilege and SoD rather than just granting whatever the trace tool reports as missing). Avoid closing on a formulaic tag phrase like 'which is why I always dig into X' — earn the depth through the structure above instead.",
  Comparison: "Structure: Feature Architecture → Key Technical Differences → Practical Use Case Selection.",
  Workflow: "Structure: Trigger Event → Agent Determination → Approval Path & Fallbacks → SoD Risk Check at Request Time → Runtime Execution.",
  Configuration: "Structure: SPRO Path & T-Codes → Key Configuration Flags → Runtime System Behavior.",
  Scenario: "Structure: End-to-End Runtime Flow → Decision Branches → Real-World Trade-Offs.",
  Migration: "Structure: Transition Strategy → Conversion/Sync Tools → Authorization Transition → Cutover Risk Control.",
  Upgrade: "Structure: SPAU/SPDD Strategy → SU25 Role Impact → Deprecated Objects → Validation Testing.",
  Performance: "Structure: Diagnosis Tools (ST03N/Trace) → Bottleneck Analysis → Tuning Optimization Steps.",
  Security: "Structure: Risk/Compliance Rule → Identity & Access Controls → Encryption/SNC Mechanisms → Audit Evidence.",
  // Enriched with specific table names and the two failure categories a live-validation
  // real-answer comparison found consistently missing from generated answers: user
  // comparison/synchronization after a role change, and the Fiori/OData/service-layer
  // failure mode being distinct from a classic backend authorization problem in S/4HANA.
  Authorization: "Structure: Authorization Objects & Fields → SU24 Proposals → PFCG Role Design & Generation (AGR_1251/AGR_1252 authorization data, AGR_USERS assignment, AGR_TCODES transaction binding) → User Comparison/Synchronization After Role Change → Runtime Checks (SU53/STAUTHTRACE) vs. Frontend/OData/Service-Layer Failure (Fiori-specific, not a backend authorization issue).",
  // Enriched the same way as Authorization/Troubleshooting: bare "Role Taxonomy" invited a
  // capability-tour answer with no PFCG/SU24 mechanics. SU24 sits first because it's the real
  // sequencing dependency -- default authorization proposals shape what PFCG pulls in
  // automatically, so a wrong SU24 proposal means fixing every role built from it individually,
  // not just the one role.
  "Role Design": "Structure: SU24 Authorization Default Values (proposal maintenance shapes what PFCG pulls in automatically) → Role Taxonomy (single vs. composite vs. derived — a derived role inherits menu/auth data from its master, only org-level values like company code or plant differ) → PFCG Role Build (Expert Mode for manual authorization object maintenance, org level values, role generation) → SoD Risk Analysis at Design Time (ARA ruleset check before the role reaches production, not discovered after) → Maintenance Mechanics (SUIM for role/authorization-object reporting, versioning and change history).",
  "Production Support": "Structure: Incident Triage → Emergency Access (EAM/Firefighter) → SLA Resolution → Permanent Fix.",
  Hypercare: "Structure: Post-Go-Live Context (Week 1-2) → Dedicated Team Structure → Incident Management (P1/P2/P3 SLAs, response times) → Knowledge Transfer Plan → Escalation Procedures → Monitoring Tools (ST03/SM21/SU53). PRIORITY: Include a real edge case (a sustained incident, an escalation chain that actually got used) and connect the hypercare model to how support gets handed off long-term.",
  Behavioral: "Structure: Specific Scenario (what happened, business context, edge case complexity) → Your Action (what you actually did, decisions made, trade-off thinking) → Real Outcome (measurable result, business impact, stakeholder satisfaction) → Learning/Reflection (why it worked, what changed, enterprise implications). PRIORITY: Acknowledge genuine nuance (competing interests that were actually in tension) and connect the specific decision to broader strategic reasoning, not a generic lesson.",
  // Enriched with the same real mechanics the Authorization fix surfaced: a mass role
  // deployment during cutover doesn't take effect for existing users without a user
  // comparison run (PFUD), and SU25 governs whether SU24 proposal changes actually reach
  // roles across an upgrade/cutover -- both were missing, leaving only generic checklist
  // language a real cutover architect would never lead with.
  Cutover: "Structure: Pre-Cutover Validation (data reconciliation, testing checklist, SU25 comparison if authorization defaults changed) → Parallel Run Process (timeline, systems in parallel) → Data Migration & Validation (reconciliation procedures) → Mass Role Deployment & User Comparison (PFUD to synchronize all affected users -- a role change with no comparison run doesn't take effect for users already assigned to it) → Rollback Strategy (triggers, transport freeze/go-no-go checkpoints, testing) → Post-Cutover Verification (SUIM authorization reports, monitoring, issue resolution).",
  Transports: "Structure: Change Request & Approval Workflow (approval gates, SAP Change Board) → Testing Strategy (unit → integration → UAT → staging) → Transport Process (SE09/STMS flow, RFC controls) → Rollback Plan (rollback procedures, testing) → Post-Deployment Monitoring (ST03/SM21 checks).",
  Audit: "Structure: Compliance Framework (SOX/GDPR/ISO), Risk Classification → Control Design (RUD testing, SoD rules, role review cycles) → Technical Implementation (REGOBJ for restricted tables, AAMM controls) → Testing & Evidence (control matrix, audit logs, evidence collection) → Remediation & Ongoing Monitoring.",
  // Renamed from "S/4HANA"/"BTP Security" -- those keys never matched, because
  // classifyWeightedIntents() (pages/api/chat.js CATEGORY_RULES) only ever produces the
  // category strings "S/4" and "BTP". Both well-crafted templates were dead code, silently
  // falling through to the generic General template for every S/4 or BTP question.
  "S/4": "Structure: Key Security Changes vs ECC (HANA DB impact, New GL/Universal Journal auth changes, object simplification) → Authorization Architecture (simplified objects, composite/derived roles, master data auth) → Migration Strategy (phasing, role mapping, FI-GL compatibility) → Testing & Validation (SU53 access testing, GRC mock runs) → Post-Migration Monitoring.",
  // "Fiori" and "BW" are classifyWeightedIntents() categories in chat.js with no dedicated
  // template here -- same dead-code class as S/4HANA/BTP/Behavioral etc., silently falling
  // through to General for every Fiori launchpad or BW/4HANA authorization question.
  Fiori: "Structure: Launchpad Content (catalogs, spaces, pages, target mapping resolving a tile to a target) → Business Role & Authorization Assignment → OData/Gateway Service Activation (/IWFND, /IWBEP) → Backend Authorization Check (authorization object, SU53/STAUTHTRACE trace) → Root Cause Isolation (content vs. service vs. backend authorization -- these are three different layers) → Correction & Validation. PRIORITY: identify which layer actually fails before naming a fix -- a missing tile is a launchpad/content problem, a tile that opens but errors on data is usually an OData/service or backend authorization problem, not a launchpad issue.",
  BW: "Structure: Standard PFCG/Object-Level Authorization (S_RS_COMP/S_RS_COMP1 control query/InfoProvider execute access) vs. BW Analysis Authorization (RSECADMIN-maintained, characteristic-value-based row-level restriction -- e.g. authorized for company code 1000 but not 2000 -- connected to PFCG via authorization object S_RS_AUTH; requires the InfoProvider to carry technical characteristics 0TCAIPROV/0TCAVALID/0TCAACTVT, a genuinely separate authorization layer, not the same mechanism as execute-level PFCG objects) → Query & CompositeProvider/ADSO Data-Level Security (row-level restrictions, data masking where required) → Technical User & Process Chain Authorization → Troubleshooting (missing characteristic value vs. missing execute object -- a user can pass S_RS_COMP and still see zero rows if analysis authorization denies it) → Validation. PRIORITY: never treat BW analysis authorization as interchangeable with standard SAP PFCG execute-level authorization -- it's a distinct characteristic-value-based model layered on top of it.",
  // No classifier category or template existed for Datasphere/SAC at all before this. Added
  // a CATEGORY_RULES entry alongside this template (see chat.js) the same way IAG/IAS/IPS
  // were added earlier today.
  // No classifier category or template existed for HANA at all -- a live test confirmed the
  // General fallback answered with generic RBAC/ABAC textbook language instead of HANA's own
  // privilege model, which is a different and more specific mechanism than either.
  HANA: "Structure: Five Privilege Types (System for admin actions; Object/SQL for DDL/DML grants on tables/views/procedures; Analytic for row-level filtering on analytic/calculation views -- a query-time WHERE-clause restriction, this is HANA's actual row-level security mechanism, not attribute-based access control; Package and Application for classic repository development and XS classic apps) → Catalog Roles vs. Repository/Design-Time Roles (catalog roles are runtime, SQL-granted via GRANT/REVOKE, owned by the creating database user with no transport or versioning -- deleting that user revokes every role they granted; repository roles are owned by the technical user _SYS_REPO, transportable, versioned, deployed via the repository or HDI, and the standard for anything shipping with an application) → User & Role Provisioning (HANA Cockpit/Studio, restricted users, HDI container-scoped roles) → Audit Logging & Monitoring (Audit Trail configuration, privilege review) → Least-Privilege Validation. PRIORITY: the catalog-vs-repository role distinction is where a real interviewer's sharper follow-up lands -- never skip it for a surface-level privilege-types list. Never default to generic RBAC/ABAC framing.",
  Datasphere: "Structure: Spaces & Space-Level Access Control (who can access which space) → Roles & Privileges Within a Space (Data Builder/Business Builder object access) → Connections & Remote Table/Replication vs. Virtual Access → Data-Level Security (row/column-level restrictions on views -- distinct from BW analysis authorization) → Integration Security (IAS-based authentication, BTP subaccount trust, downstream consumption by SAC/S4HANA/BW) → Validation. PRIORITY: Datasphere's authorization model is space- and privilege-based, not BW analysis authorization (RSECVAL) or classic PFCG objects -- never default to BW-style value-authorization language here.",
  // SAC previously had no template at all -- a pure SAC question fell to General, and a SAC
  // question phrased with "SAP Analytics Cloud" literally misclassified as Datasphere. Distinct
  // from Datasphere: SAC's own model is team/content-based (stories, models, folders), separate
  // from Datasphere's space/privilege model even though the two commonly integrate.
  SAC: "Structure: Authentication Context (IAS/SSO -- establishes who the user is, separate concern from what follows) → Team & Role Assignment (SAC teams grant access to folders/content, distinct from BTP role collections) → Content-Level Authorization (story, model, and application permissions -- view vs. edit vs. share) → Data-Level Security (connection-level access, and row/column restrictions when the story is backed by a live connection such as Datasphere or BW) → Troubleshooting (distinguish an authentication failure from a content-permission failure -- successful SSO does not imply story access). PRIORITY: never treat SAC authorization as the same mechanism as BTP role collections or IAS scopes -- SAC's own team/content model is a separate layer on top of those.",
  // PMP had no representation anywhere before this -- real project-management knowledge exists
  // (346 chunks) but was only ever reached by accident. Structure follows the reasoning chain a
  // real PM interview actually tests: objective grounds the scenario before jumping to tactics.
  PMP: "Structure: Objective & Business Context (what the project/decision is actually trying to achieve) → Stakeholders (who is involved, what they each want, where the real tension is) → Scope & Constraints (what's fixed, what's negotiable) → Risk (what could go wrong, how it's tracked -- RAID-style, not just named vaguely) → Plan & Execution Approach → Control & Monitoring (how progress and risk are tracked once underway) → Change Management (how scope/timeline changes get evaluated and approved, not just absorbed) → Outcome (what resolving this actually achieves). PRIORITY: name the real tension between two legitimate interests (speed vs. quality, stakeholder authority vs. project timeline) rather than a generic 'communicate and escalate' answer -- a Principal-level PM answer explains the trade-off it's making, not just the process it followed.",
  // REPLACED a Cloud-Connector-centric structure with the actual BTP application authorization
  // chain -- a live external review (real interviewer-caliber critique) caught the old template
  // steering answers toward ABAP tools (SU53/STAUTHTRACE) for a pure BTP app authorization
  // question, because the template itself never mentioned trust/role collections/scopes at all,
  // only hybrid on-premise connectivity. Cloud Connector is now one applicable sub-case (a
  // hybrid call into an on-premise backend), not the entire template.
  BTP: "Structure: Trust Configuration (IAS as the authentication/federation layer, BTP subaccount trust, corporate IdP federation) → User/Group/Attribute Mapping Post-Authentication → Role Collections (role templates/roles grouped into role collections, assigned to users, groups, or attributes) → Scope & Application-Level Authorization Enforcement → Runtime Token Validation & Application/BTP Audit Logs (not SU53/STAUTHTRACE -- this isn't an ABAP authorization check) → Cloud Connector (only when a hybrid call reaches an on-premise backend -- outbound tunnel, principal propagation, NWA/TrustStore).",
  // IAG/IAS/IPS/ARM/ARA/EAM/BRM/SAP IDM are all classifyWeightedIntents() categories with no
  // dedicated template before this -- they fell through to General too. The knowledge base
  // (data/knowledgeIndex.json) has real, accurate content for these products, but it's authored
  // as interview-capsule summaries ("30 Second Interview Answer" style), which sets a natural
  // depth ceiling unless the template explicitly names concrete mechanics to push past it --
  // the same effect the BTP template above already had before its key was even reachable.
  // Migration Decision Framework moved to the FRONT: a live external review caught the old
  // ordering (capabilities first, coexistence buried last) producing a feature-pitch answer
  // ("IAG offers...", "cloud-native solution") for "should I replace GRC with IAG" questions,
  // instead of an architect's "not automatically" judgment call.
  IAG: "Structure: Migration Decision Framework First (existing GRC investment, on-premise footprint, compliance maturity, roadmap -- do not recommend replacing GRC just because of a cloud/RISE move) → Five Core Services (Access Analysis, Role Design, Access Request, Access Certification, Privileged Access Management) → Cloud/BTP Architecture vs. On-Premise ABAP Add-on → IAS-Based Authentication & Trust → Coexistence Model During Transition (GRC continues governing on-premise/legacy systems while IAG governs the target cloud landscape, avoiding duplicate governance processes or a gap in SoD/access certification) → SoD Ruleset & Risk Analysis Mechanics.",
  IAS: "Structure: Identity Provider Role (SAML2/OIDC, corporate IdP federation) → Trust Configuration (BTP subaccount, metadata exchange) → Risk-Based Authentication & MFA Policy → SSO Session/Token Mechanics → Integration With IPS/IAG/Downstream Systems.",
  IPS: "Structure: Source & Target System Connectors (HR system, Active Directory, SAP/non-SAP targets) → Provisioning/Transformation Rules & Attribute Mapping → Job Scheduling & Sync Mechanics → Joiner-Mover-Leaver Event Handling → Error/Reconciliation Monitoring.",
  ARM: "Structure: Access Request Workflow (MSMP routing, BRF+ agent determination) → Risk Analysis at Request Time (embedded ARA check) → Approval Path & SoD Mitigation → Provisioning to Target Systems → Audit Trail & Request History.",
  ARA: "Structure: Ruleset Design (authorization object/transaction/role-level rules) → Risk Analysis Execution (batch vs. simulation) → Violation Triage (real vs. false positive, mitigating control assignment) → Remediation vs. Mitigation Decision → Ongoing Ruleset Maintenance.",
  EAM: "Structure: Firefighter ID Assignment & Ownership → Access Request/Activation Workflow → Session Logging & Review → Reason Code & Business Justification Capture → Periodic Firefighter Log Review/Audit Evidence.",
  BRM: "Structure: Business Role Definition vs. Technical/Derived Roles → Role-to-Technical-Role Mapping → MSMP/BRF+ Governance Over Role Change → Role Assignment via ARM → Role Lifecycle & Versioning.",
  "SAP IDM": "Structure: Identity Store & Provisioning Framework → Connector/Job Configuration → Approval Workflow → Password/Self-Service Policy → Integration With Downstream SAP/Non-SAP Systems.",
  // The DOMAIN_DEPTH_GUIDANCE_MAP "rise" entry was unreachable dead code until chat.js gained
  // an actual "RISE" classifier category (see CATEGORY_RULES comment there) -- this is the
  // structural template that now goes with it, since none existed before either.
  RISE: "Structure: Shared Responsibility Model First (SAP-managed vs. customer-managed vs. shared -- say \"this depends on the customer's RISE operating model and contract\" when responsibility is genuinely ambiguous, don't assume one) → Identity Architecture in RISE (IAS/IPS/BTP for cloud-managed identity; Cloud Connector only for a hybrid call into an on-premise legacy system) → Security Operations & Compliance Ownership (who monitors, who owns GRC/IAG governance, coexistence with legacy on-premise systems) → Migration/Cutover Considerations (phasing, hybrid landscape during transition, post-migration validation) → Business Trade-Off (vendor lock-in vs. managed-service benefit, data residency).",
  Leadership: "Structure: Specific Scenario (real conflict, business context, stakeholder positions) → Your Action (communication strategy, evidence used, trade-off resolution) → Real Outcome (measurable result, stakeholder satisfaction, security maintained) → Learning & Impact (what you learned, how it changed approach).",
  General: "Structure: What the question is actually asking → architectural decision and layer responsibilities → only then the mechanisms that implement it. PRIORITY: do not open with a product or T-code list. Introduce a product only where that layer is required by the question. When identity or access is in play, distinguish authentication, authorization, provisioning, governance, and application enforcement. Mention a trade-off only if the question is a design decision — do not bolt one onto a definition or experience answer."
});

// Question-type structures override product CATEGORY_TEMPLATES. Product templates are correct
// for architecture/implementation of that product; they are wrong for "what is X", "X vs Y",
// and "tell me about your experience with X" — those used to inherit the product's full
// architecture chain (live-confirmed: SAC/Datasphere experience answers became IAS/IPS tours).
const MODE_STRUCTURES = Object.freeze({
  define: "Structure: Direct definition in the first sentence → purpose → one important capability or distinction → where it fits. Stop. Do not add architecture, adjacent products, or a trade-off unless the question names them.",
  relate: "Structure: Direct experience/exposure statement grounded in CANDIDATE BACKGROUND (or honest working-knowledge framing if background is silent) → technical responsibilities actually owned → the named product's own enforcement model → adjacent layers only if the question involves them. Do not recast this as a product overview. Do not close with a generic alignment-to-enterprise-policy sentence.",
  compare: "Structure: Direct distinction first → each side's purpose and responsibility → relationship or coexistence only if relevant → one practical example of when you would use which. Do not blend the two into one capability."
});

// Keyed by topic keywords (matched case-insensitively against category/domain/secondary
// categories), not a flat list appended to every prompt. Previously all 11 of these blocks
// were sent on EVERY request regardless of relevance (~6.6KB of the prompt, roughly a third
// of its total length, dead weight for any single question). Isolated experiment (see git
// log, eval/isolateExperienceActivation.js) proved this kind of prompt bloat, not model
// capacity, was the actual cause of inconsistent instruction-following: the same model, same
// background, same question hit 5/5 in a ~4.8KB minimal prompt vs ~1/7 in the ~20KB full one.
const DOMAIN_DEPTH_GUIDANCE_MAP = Object.freeze([
  { keywords: ["btp"], text: `For BTP Security questions:
- Separate authentication from authorization explicitly: IAS/trust establishes who the user is; role collections and scopes determine what they're allowed to do -- never reach for ABAP tools (SU53, STAUTHTRACE) here, this isn't a backend authorization check
- Detail the real chain: Identity Provider/Trust Configuration → User/Group/Attribute mapping → Role Template → Role → Role Collection → Scope → Application-level enforcement → Runtime/token validation
- For troubleshooting, use BTP audit logs and application runtime logs, not SU53/ST01
- Cloud Connector (outbound tunnel, principal propagation, NWA/TrustStore) only applies when the scenario genuinely calls an on-premise backend from BTP -- don't lead with it for a pure cloud-app authorization question
- Address specific threat vectors: misconfigured trust, over-scoped role collections, token/credential theft` },
  { keywords: ["audit"], text: `For Audit (SOX/Compliance) questions:
- Detail control design methodology: identify financial risks → design controls → test → evidence
- Reference REGOBJ for restricted tables (GLT0, BKPF, VBRK, etc.)
- Mention AAMM (Advanced Audit Management) control testing procedures
- Include specific testing approach: design testing, operating effectiveness testing, evidence collection
- Discuss remediation and ongoing monitoring cycles (monthly/quarterly/annual reviews)` },
  { keywords: ["s/4", "s4hana", "s/4hana"], text: `For S/4HANA Migration questions:
- Explain specific ECC→S/4HANA security changes: HANA DB, New GL, Universal Journal authorization impact
- Detail authorization object simplifications and new role architecture
- Discuss role migration strategy: role mapping tool, composite roles, derived roles, role review cycles
- Address FI-GL compatibility mode and master data authorization changes
- Include testing validation: SU53 access logs, GRC mock runs, parallel testing approach` },
  { keywords: ["leadership"], text: `For Leadership/Influence questions:
- Ground in specific stakeholder conflict (security vs business need, compliance vs speed)
- Detail communication strategy: data-driven arguments, specific examples, risk quantification
- Show trade-off resolution: how you balanced competing interests, who agreed to what
- Describe measurable outcomes: control strengthened, stakeholder satisfied, audit findings prevented` },
  { keywords: ["grc"], text: `For GRC (Access Risk Management) questions:
- Detail ARA rule evaluation: risk classification criteria, condition evaluation logic
- Explain ARM control design: how controls map to ARA risks, remediation assignment
- Reference specific rule types: authorization object rules, role rules, transaction rules
- Include certification/recertification cycles and evidence collection procedures
- Add SOD rule configuration and monitoring examples` },
  { keywords: ["idm", "identity management", "identity provisioning"], text: `For IDM (Identity Provisioning) questions:
- Describe provisioning framework: IPS-driven, SAP IDM integration, 3rd-party tools (Okta, SailPoint)
- Detail attribute mapping: authoritative source → SAP attributes → role assignments
- Explain provisioning workflows: request → approval → execution → certification
- Include deprovisioning and access removal procedures
- Add error handling and exception management approaches` },
  { keywords: ["cloud identity", "ias", "ips"], text: `For Cloud Identity (IAS/IPS) questions:
- Explain authentication flows: SAML 2.0, OAuth 2.0, OpenID Connect protocols
- Detail IPS provisioning: real-time sync, batch provisioning, multi-system integration
- Describe federation scenarios: hybrid identity, B2B access, conditional authentication
- Reference certificate management and trust configuration
- Add multitenancy isolation and API security considerations` },
  { keywords: ["project management", "risk"], text: `For Project Management (Risk) questions:
- Detail risk identification: workshops, document review, interviews
- Quantify severity levels with specific metrics and thresholds
- Explain risk ownership, mitigation strategies, monitoring approach
- Include risk register maintenance and steering committee reporting
- Add specific SAP implementation risks (data volume, performance, authorization complexity)` },
  { keywords: ["rise"], text: `For RISE (Cloud) questions:
- PRIORITY: Show understanding of tradeoffs (cloud vendor lock-in vs managed services, flexibility vs compliance)
- Acknowledge edge cases: hybrid strategies, legacy on-prem integration, data residency constraints
- Explain RISE security model differences: cloud-managed vs on-premise responsibility
- Connect the decision to the broader cloud transformation strategy where it genuinely applies, not as a bolted-on line
- If stakeholder resistance to cloud adoption is part of the answer, ground it in a specific concern they'd actually raise (cost, control, compliance) and how you'd address it -- not a generic "I've counseled skeptical stakeholders" claim
- Detail IAS-driven authentication and simplified role management
- Include data residency and compliance considerations in context of business needs` },
  { keywords: ["fiori"], text: `For Fiori (Launchpad) questions:
- Detail Fiori authentication: cloud Fiori (IAS), on-premise Fiori (SAML/basic)
- Explain tile-level security: role-based visibility, semantic object mapping
- Reference CSP (Content Security Policy), CORS, and X-Frame-Options
- Include query/report security at launchpad level
- Add performance and caching security implications` },
  // Narrowed from ["bw","analytics"] to just ["analytics"] -- with "bw" as a trigger, this
  // fired ALONGSIDE CATEGORY_TEMPLATES.BW's own dedicated analysis-authorization-vs-PFCG structure
  // for every plain BW question, competing rather than complementing (confirmed in a live
  // test: the answer blended both, reading less crisp than the other single-template product
  // fixes). Its genuinely useful specifics (RSEC_DS/RSEC_INFOPROV object names) were folded
  // into CATEGORY_TEMPLATES.BW directly instead. "analytics" alone still catches SAC/general
  // reporting-security questions that aren't really about BW's own authorization model.
  { keywords: ["analytics"], text: `For Analytics/Reporting Data Security questions:
- Detail data classification: public, confidential, restricted, personal data
- Describe row-level security (RLS) and data masking approaches
- Include encryption at rest and in transit considerations
- Add compliance requirements (GDPR, data residency) impact on analytics security` }
]);

function getDomainDepthGuidance(category, domain, secondaryCategories) {
  const haystack = [category, domain, ...(secondaryCategories || [])].filter(Boolean).join(" ").toLowerCase();
  if (!haystack) return "";
  const match = DOMAIN_DEPTH_GUIDANCE_MAP.find(entry => entry.keywords.some(kw => haystack.includes(kw)));
  if (!match) return "";
  // Same "explicit recipe, silent on background" shape that made REASONING TEMPLATE suppress
  // real-experience grounding on its own (see the comment above the REASONING TEMPLATE section
  // in buildSapInterviewPrompt) -- this bullet list is a second structural recipe with the same
  // defect, so it gets the same one-clause fix rather than being trimmed for size.
  //
  // A second clause ("these bullets are areas to prioritize, not an exhaustive limit...") was
  // tried and REVERTED after eval/results/LEVERAGING_BENCHMARK_2026-08-07.md's enriched-
  // background experiment on GRC: a genuine decision-and-rationale sentence added to CANDIDATE
  // BACKGROUND (rejecting a global MSMP workflow for localized per-country routing, overriding
  // default SU24 proposals) was confirmed present verbatim in the actual prompt sent to the
  // model (via DEBUG_DUMP_PROMPT -- ruling out retrieval/truncation; candidateResume is never
  // chunked or vector-retrieved) but surfaced in 0 of 10 generated answers both before AND
  // after adding that clause -- a clean null result, not just "unconfirmed." The topic-
  // filtering hypothesis behind that clause is disproven for GRC specifically; the true
  // mechanism is still unresolved and needs a different hypothesis, not a bigger version of
  // the same fix. See the benchmark doc for the full negative result.
  return `DOMAIN-SPECIFIC TECHNICAL DEPTH:\n\n${match.text}\nIf CANDIDATE BACKGROUND above covers this domain, ground at least one bullet above in its real scope or numbers rather than answering all of them generically.`;
}

function formatSection(title, content) {
  if (!content) return "";
  if (Array.isArray(content)) {
    const lines = content.filter(Boolean);
    if (!lines.length) return "";
    return `================ ${title} ================\n${lines.map(line => `• ${line}`).join("\n")}`;
  }
  const trimmed = String(content).trim();
  if (!trimmed) return "";
  return `================ ${title} ================\n${trimmed}`;
}

export function buildSapInterviewPrompt({
  question = "",
  analysis = {},
  reasoningContract = {},
  technicalReasoning = {},
  interviewer = {},
  blueprint = {},
  evidence = {},
  sapComponents = [],
  knowledgeContext = "",
  engineeringJudgmentContext = "",
  model = "",
  customInstructions = "",
  candidateResume = "",
  jobDescription = "",
  company = ""
}) {
  const category = analysis.category || "General";
  const reasoningMode = reasoningContract.reasoningMode || "";
  // Pass secondaryCategories/question through so this in-prompt target matches the same
  // widened tier the API layer's maxTokens ceiling already uses (pages/api/chat.js) -- before
  // this fix, a compound/secondary-category question got a bigger token ceiling but was still
  // TOLD to aim for the narrower word count, which is exactly the kind of conflicting signal
  // that keeps a model stopping early despite having room left.
  const budget = (reasoningMode === "define")
    ? LENGTH_BUDGETS.simple
    : (reasoningMode === "relate" || reasoningMode === "compare")
      ? LENGTH_BUDGETS.medium
      : getLengthBudget(category, analysis.secondaryCategories, question, analysis.isDeepenFollowUp || false);
  const questionIsCompound = isCompoundQuestion(question);
  const questionIsSimpleFactual = isSimpleFactualQuestion(question);
  const answerStyle = buildAnswerStyle ? buildAnswerStyle(question, analysis) : "";
  const domainDepthGuidance = (reasoningMode === "define" || reasoningMode === "relate" || reasoningMode === "compare")
    ? ""
    : getDomainDepthGuidance(category, analysis.domain, analysis.secondaryCategories);
  const categoryTemplate =
    MODE_STRUCTURES[reasoningMode] ||
    CATEGORY_TEMPLATES[category] ||
    CATEGORY_TEMPLATES.General;
  const isFollowUp = analysis.isFollowUp || false;
  const isDeepenFollowUp = analysis.isDeepenFollowUp || false;
  const isRecoverySignal = analysis.isRecoverySignal || false;
  // Day-9: analysis.contextSource ("current" | "inherited" | "current-people" | "none") comes
  // from chat.js's context-resolution step -- "current"/"inherited"/"current-people" all mean
  // real evidence was actually found (either the current turn's own, or a genuine prior-turn
  // technical domain filling a gap); only "none" means no evidence exists anywhere.
  //
  // A word-count floor was tried here first and live-confirmed wrong: "Okay, that makes
  // sense." is 4 words and inherited a prior turn's domain (contextSource="inherited"), so it
  // cleared the >=4 threshold and got a full ~190-word re-explanation instead of a short
  // continuation. The actual distinction needed is semantic, not length-based -- does the
  // current turn contain a genuine ask, or is it a content-free acknowledgment. Reuses
  // ASK_SIGNAL as-is (already defined above, already the exact signal isCompoundQuestion uses
  // for "does this clause represent a real ask") rather than adding any new phrase list; "?"
  // is a structural punctuation check, not a keyword. "Okay, that makes sense." / "Got it." /
  // "Understood." / "Okay, continue." / "That makes sense, thanks." all correctly match
  // neither. A genuine follow-up question almost always contains one or the other regardless
  // of its length ("What would you check first?", "Can you explain the trade-off?").
  const hasSubstantiveAsk = question.includes("?") || ASK_SIGNAL.test(question.toLowerCase());
  const hasResolvedContext =
    Boolean(analysis.contextSource) &&
    analysis.contextSource !== "none" &&
    hasSubstantiveAsk;

  const promptSections = [];

  // 0. Candidate Background & Context -- pushed FIRST, before ROLE & RULES, so the model's
  // reasoning process has your real experience available before it starts reasoning, not
  // appended afterward as decoration. This was previously section 4 (after the entire
  // reasoning sequence), which meant the model committed to "how do I answer this" before it
  // had even seen what real experience existed to reason from -- an ordering defect, not a
  // wording-strength one. "Candidate Background is not evidence to append after an answer.
  // It is experience to reason from before the answer is generated."
  const backgroundContext = [];
  if (candidateResume) {
    backgroundContext.push(`CANDIDATE BACKGROUND (ground truth for anything phrased as personal experience): ${candidateResume}`);
  } else {
    backgroundContext.push("CANDIDATE BACKGROUND: Not provided. Do not phrase any part of the answer as personal experience — knowledge-framing only.");
  }
  if (jobDescription) backgroundContext.push(`Job Description: ${jobDescription}`);
  if (company) backgroundContext.push(`Target Company: ${company}`);
  backgroundContext.push(
    `Rule: Ownership language ("I did X", "my project", "our client") is only allowed when X is explicitly present in CANDIDATE BACKGROUND above. Otherwise use knowledge-framing. Never invent specifics not present in CANDIDATE BACKGROUND.`
  );

  // Special handling for behavioral/soft-skills questions
  if (category === "Behavioral" || analysis.isBehavioral) {
    const hasRealBackground = Boolean(candidateResume);
    backgroundContext.push(
      hasRealBackground
        ? `BEHAVIORAL QUESTION DIRECTIVE — STRICT REQUIREMENT:
This is a behavioral/competency question. CANDIDATE BACKGROUND above contains real experience -- use it.

1. SCENARIO (Real situation, from CANDIDATE BACKGROUND only): "I remember when...", "On a project I managed...", "I once had to..." — the actual challenge, business context, and why it mattered.
2. YOUR ACTION (What you actually did): specific decision, approach, or technique, in "I" language, grounded in CANDIDATE BACKGROUND.
3. OUTCOME (Real result, from CANDIDATE BACKGROUND if stated; otherwise describe the general kind of outcome that approach produces without inventing a specific number).
4. REFLECTION: why this approach worked, what you learned.

Do not invent a specific incident, employer, client, or metric that isn't in CANDIDATE BACKGROUND, even to fill a gap in the story. If a detail isn't there, generalize honestly rather than inventing it.

BANNED PATTERNS: Do NOT use "A common approach is...", "Best practice shows...", "Organizations typically...", or other generic framing. This is a personal story, not a textbook answer.`
        : `BEHAVIORAL QUESTION DIRECTIVE — NO CANDIDATE BACKGROUND PROVIDED:
This is a behavioral/competency question, but no real background was supplied for this competency. Do NOT invent a specific incident, employer, client, project, or metric — a real candidate cannot defend a fabricated story under interviewer follow-up, and this tool must never put a false story in their mouth.

Instead, answer with confident first-person METHODOLOGY framing: "When I approach a situation like this, my method is..." / "The way I'd handle this is..." — describe real professional judgment and a concrete approach (what you'd check first, the decision criteria, the sequence of steps) without claiming it already happened to you.

BANNED PATTERNS: Do NOT use "A common approach is...", "Best practice shows...", "Organizations typically..." (too generic/textbook) AND do NOT fabricate "I remember when..." with invented specifics. The methodology framing above is the correct middle ground — confident and first-person, but honest about not citing a specific unverified incident.`
    );
  }

  promptSections.push(formatSection("CANDIDATE BACKGROUND & CONTEXT", backgroundContext.join("\n")));

  // Engineering Memory Platform (docs/EXPERIENCE_ACQUISITION_ENGINE_DESIGN.md section 9) --
  // placed immediately adjacent to CANDIDATE BACKGROUND since both are candidate-sourced ground
  // truth (section 5.5). Additive only: engineeringJudgmentContext is empty until real Judgment
  // Records exist, in which case this section renders nothing (formatSection returns "" for
  // empty content), so this has zero effect on the currently-frozen Experience Activation
  // mechanism above and below it.
  promptSections.push(formatSection("ENGINEERING MEMORY", engineeringJudgmentContext));

  // 1. Core Role & Persona
  const questionShapeRule = (reasoningMode === "define" || reasoningMode === "relate" || reasoningMode === "compare")
    ? `QUESTION SHAPE: Answer the question that was asked. Open with the direct answer in the first sentence — definition starts with what it is, comparison starts with the distinction, experience starts with actual exposure from CANDIDATE BACKGROUND or honest working-knowledge framing. Do not use a 3-5 decision-point outline. Do not open with "At a high level". Do not end with a generic trade-off or "align with enterprise security policies" closer.`
    : `MANDATORY STRUCTURE (the person using this is under live interview pressure -- optimize for what they can actually say, not what reads well): (1) One short, confident ANCHOR SENTENCE first -- never the direct content yet, just a commitment to an angle, phrased fresh each time, never a stock opener. (2) Immediately after, NAME 3-5 POINTS AS DECISIONS OR OPEN QUESTIONS before expanding any of them -- phrased as real decisions specific to THIS question's content, never a bare component list. If CANDIDATE BACKGROUND covers this scenario, at least one of those 3-5 points must be the real experience itself (its actual scope or numbers), not a purely abstract decision category. (3) Expand each named point in order, spoken-conversation language, so a speaker who loses their place can resume at the next point without the previous one's exact wording.`;

  const followUpRule = isRecoverySignal
    ? `RECOVERY MODE: The user just signaled they lost their train of thought mid-interview (said something like "I'm blank" or "wait, sorry") -- this is NOT a question and NOT a request to re-explain the topic. Do NOT produce a full answer or re-teach the material.
DEFAULT TO ONE SENTENCE. Try to compress into a single bridge sentence naming: the stage/point they were on, what's already been covered (in a few words), and what's next -- e.g. "You're at the workflow validation stage -- you've already covered BRF+ routing, so continue with provisioning, testing, and production deployment." Only use a second sentence if the prior answer genuinely covered enough distinct points that naming them needs more than one sentence to be accurate -- never pad for length. This is Layer 1 of recovery: the minimum needed for them to keep talking. If they're still stuck, they'll say "wait" or "still blank" again, or ask you to go deeper on the reminder itself -- that natural next turn is where more detail belongs, not this one.
Tone: reassuring, like a colleague quietly reminding you where you were, not a teacher restarting a lecture. Do NOT apologize on their behalf or comment on the pause itself -- just orient them and stop.`
    : isDeepenFollowUp
    ? `DEEPEN MODE: The interviewer is explicitly asking you to go deeper or more technical than your last answer -- treat this as a request for the layer beneath what you already said, not a request to continue or repeat it. Do NOT restate the previous answer in different words. Add concrete TECHNICAL implementation detail you didn't give before: exact configuration steps, specific field values or transaction sequences, an edge case, or a trade-off you skipped.
CRITICAL -- GRAMMATICAL TENSE MATTERS HERE: if CANDIDATE BACKGROUND does NOT explicitly document you having done this specific thing, you MUST phrase the deeper explanation as conditional methodology, not definite past-tense personal history. Use "my approach would be to...", "the way I'd handle that is...", "what I'd check first is..." -- NOT "I configured...", "I implemented...", "I set up..." (definite past tense implies a specific real incident you'd have to defend under follow-up, even without naming a client or metric). Going deeper on real technical mechanism, in conditional voice, is always available even when going deeper on personal experience is not.`
    : isFollowUp
    ? "FOLLOW-UP MODE: Continue seamlessly from the previous context. Do NOT redefine concepts, restart explanations, or repeat background information."
    : "DIRECT MODE: Answer immediately without rephrasing or repeating the question.";

  // Generation order + banned-pattern lists implement the interview-answer redesign directly
  // in the single generation pass (no second LLM call, no rewrite stage — see
  // pages/api/chat.js and lib/prompt/README.md for how that's enforced in code). The
  // "quality check" is folded in as silent self-verification within this same response,
  // not a separate call.
  //
  // A "MANDATORY -- REJECTED ALTERNATIVE" paragraph was tried and REVERTED here: isolating
  // the existing buried "what's at least one realistic alternative" instruction as its own
  // mandatory step took real-alternative-rejection from 0/10 to 10/10 in a minimal isolated
  // test harness (eval/testAlternativeGenerationHypothesis.js), but verifying against the
  // TRUE full production prompt (eval/retestGrcAfterAltGenFix.js) found the effect did NOT
  // survive at full size -- 0/10 rejection language, leverage statistically unchanged from
  // the 10% pre-fix baseline. Same "prompt competition dilutes an isolated clause" pattern
  // already seen multiple times this session. See eval/results/LEVERAGING_BENCHMARK_2026-08-07.md
  // for the full Phase 1-5 cycle and the untested next hypothesis (promote the instruction to
  // its own top-level prompt section, like CANDIDATE BACKGROUND or DETERMINISTIC CONSTRAINTS,
  // rather than nesting it inside the already-dense ROLE & RULES block).
  promptSections.push(
    formatSection(
      "ROLE & RULES",
      `You are speaking live in an SAP Security technical interview. Default target length for this question: ${budget.words} words -- this is a compression PREFERENCE, not a hard cap. Priority order: (1) fully answer every substantive part of what was asked, (2) stay accurate to CANDIDATE BACKGROUND, (3) sound natural and senior-level, (4) be concise, (5) land near the target word count only once (1)-(4) are satisfied. Never stop mid-thought or skip part of the question just to land near the target -- if the question genuinely needs more words to be answered completely, use more; if it's simple and 4-5 sentences fully answer it, stop there.${questionIsCompound ? " THIS QUESTION CONTAINS MULTIPLE DISTINCT ASKS -- identify every substantive ask before answering and address each one, not just the first part, as one coherent answer rather than disconnected mini-answers." : ""}

BEFORE YOU ANSWER, reason through this once, silently -- not a persona to perform, the actual thinking that produces the answer. Every recommendation must survive scrutiny months later by the people who operate, audit, and support it.
FIRST, before anything else: does CANDIDATE BACKGROUND above contain genuine experience directly relevant to this question -- even if the question is phrased hypothetically ("how would you...")? A real architect doesn't classify questions as hypothetical vs. practical; they ask "have I actually lived through something that answers this?" If CANDIDATE BACKGROUND shows you have, the methodology below must be explained THROUGH that real experience -- anchor it in the real scope, numbers, and technologies CANDIDATE BACKGROUND actually states, the way a confident candidate naturally would ("the approach I'd take is actually the same one I've been using on an 11-country rollout..."). If CANDIDATE BACKGROUND doesn't cover this specific point, reason generically from real technical knowledge instead -- do not force background in where it doesn't genuinely fit; only use it when it truly strengthens the explanation, not to repeat your resume.
THEN work through: What problem is actually being solved (ignore SAP terminology at first)? What constraint shapes it (audit, performance, security, business, ops, scale, effort)? What's at least one realistic alternative? Why this approach over that alternative -- the engineering reason, not the product capability? What responsibility does this decision create once it's in production (monitoring, lifecycle, audit evidence, support, transport)? What could go wrong (failure modes, scaling, audit findings, adoption, support burden)? Could you defend this to another architect, an auditor, an ops lead? If the honest answer is "I'm just describing a feature," reason further before writing -- that reasoning is what produces the trade-off and the rejected alternative in your answer, not a checklist appended afterward.
SIMULATE BEFORE YOU NAME A CONSTRAINT: when the question implies multiple instances of something (countries, systems, stakeholders, teams, time periods), do not answer at the category level ("regulatory requirements differ," "stakeholders had concerns"). Silently instantiate two or three concrete, real examples first, using genuine general knowledge you actually have -- e.g. for multi-country: which specific countries, what actually differs there (a works-council co-determination requirement, a stricter SOX-style control, a different statutory reporting rule) -- for a stakeholder conflict: what would they specifically argue, what would you specifically concede, what's the specific state you'd land on. This is drawing out real general knowledge you already have with more precision, not inventing personal experience -- do not attach it to a fabricated project, employer, or incident; state it as general professional knowledge. Only after that concrete instance exists in your reasoning should you write the sentence -- if you catch yourself writing a category label ("regulatory requirements," "stakeholder concerns") with no instance behind it, stop and instantiate one first.
Decision, not feature: "I don't start by asking which authentication mechanism I can use. I start with the identity boundary -- if the customer already has Entra ID as the enterprise IdP, a separate credential store creates lifecycle inconsistency, so I'd federate IAS instead. The trade-off is more federation setup complexity, but governance gets easier across multiple apps." NOT: "IAS centralizes authentication, TLS encrypts traffic, monitoring reduces risk" -- same facts, no decision, no one accountable for it. Do not expose the reasoning questions themselves in the answer -- only the answer they produce.

${questionShapeRule}
Never open with "From an enterprise perspective," "Technically," "Generally," "Basically," "At a high level," "It requires a multi-layered approach," "SAP GRC is...", or by defining a term unless asked to. Never close with a generic line like "this improves compliance," "this enhances governance," "align with enterprise security policies," or "that's the architectural pattern" unless it states something genuinely new.

Mention specific SAP components as part of the decision, not as the subject of the sentence. For experience questions, ground in CANDIDATE BACKGROUND if it covers this, otherwise answer as methodology, not a fabricated story. Seed a natural follow-up or edge case only where it genuinely fits this specific answer -- don't force either.

${domainDepthGuidance}

SPECIAL HANDLING FOR BEHAVIORAL QUESTIONS:
If this is a behavioral/competency question (asking "tell me about a time...", "walk me through an experience...", "how did you handle..."):
- IF CANDIDATE BACKGROUND (below) contains a real situation matching this competency: MUST construct the answer as a specific personal story with 1) Real scenario, 2) Your action, 3) Outcome, 4) Learning/reflection, using "I remember when...", "On a project I managed...", or similar personal framing, grounded ONLY in what CANDIDATE BACKGROUND actually states.
- IF CANDIDATE BACKGROUND does not cover this specific competency, or is absent: do NOT invent a specific incident, employer, client, project, or metric to fill the gap -- that is fabrication a real candidate cannot defend under follow-up. Instead answer with confident first-person METHODOLOGY framing: "When I approach a situation like this, my method is..." / "My way of handling this is..." -- describing your real professional judgment and approach in first person, without a fabricated specific story. This still avoids weak "I'm familiar with..." framing and still sounds like an experienced architect, without inventing a story you'd have to defend as real.
- A methodology answer should still be concrete and specific about the APPROACH (steps, decision criteria, what you'd check first) even when it can't cite a specific past incident.

RULES:
- ${followUpRule}
- MANDATORY: if CANDIDATE BACKGROUND above contains real experience matching this question, the answer MUST include at least one specific number or scope from it (country count, user count, system count, entity count) -- this is not optional decoration, it's what makes the answer credible instead of generic. If CANDIDATE BACKGROUND does not cover this question, skip this rule rather than forcing an irrelevant number in.
- Never invent SAP objects, transactions, functionality, projects, clients, ownership, or specific incidents/metrics not present in CANDIDATE BACKGROUND below -- but DO use real numbers and scope that ARE present in CANDIDATE BACKGROUND; citing them is not fabrication, it's the whole point. This applies to behavioral questions too -- see SPECIAL HANDLING above for how to answer confidently without fabricating a story.
- GLOBAL TENSE DISCIPLINE -- this applies to every category, not only Behavioral or deepen-follow-up questions (a live test caught this failing on a plain S/4 architecture question with no CANDIDATE BACKGROUND supplied, which invented "during a previous project involving multiple countries..."): if CANDIDATE BACKGROUND does not explicitly document a specific past engagement matching this question, do NOT phrase any part of the answer as definite past-tense personal history -- no "during a previous project...", "in my last role...", "on a rollout I led...", "I implemented this for a client...", "when I did this before...". Use conditional/methodology framing instead: "the way I would structure this is...", "I would approach this by...", "my method here would be...". First-person confidence about your APPROACH is always fine; first-person claims about a SPECIFIC PAST INCIDENT are fabrication unless CANDIDATE BACKGROUND actually documents it.
- If CANDIDATE BACKGROUND marks a topic as undocumented, unconfirmed, or "not yet captured" (real but shallow evidence), never open with "My experience with X involves..." or otherwise narrate specific outcomes/numbers for it as if personally observed -- that's exactly the confident-and-specific-with-nothing-behind-it framing a real interviewer's follow-up would expose. Use hedged general-practitioner phrasing instead ("I've worked with X in a general sense, and conceptually..." / "From what I've used of X..."), and stay at the level of sound methodology, not a specific claimed result.
- Assume the interviewer already understands SAP — do not teach or define terms they didn't ask about.
- Explain execution flow and architectural thinking, not feature lists or textbook definitions.
- Average sentence length 10-15 words. Never exceed 18.
- Name a specific SAP component, transaction, or product only when the question, the Components list in this prompt, or supporting knowledge actually requires it. Do not introduce an identity provider, HR system, or governance product that is not established by the question, CANDIDATE BACKGROUND, or retrieved evidence.
- PRODUCT-CORRECT TOOLING (a live external review caught this failing): never apply ABAP-specific tools (SU53, STAUTHTRACE, ST01, SU24, PFCG, SICF, Gateway/IWFND/IWBEP logs, SLG1, ST22, SM21) to a cloud product (BTP, IAS, IPS, IAG) question unless the scenario genuinely traces through to an ABAP backend behind it. For a pure cloud/BTP authorization question, reason via Identity Provider → Trust → Role Collection → Scope → Application/Runtime → Logs instead. Keep these layers distinct in every domain: authentication = who the user is; authorization = what they are allowed to do; provisioning = how identity/access is created, changed, or removed; governance = whether they should have it and whether it creates risk; application enforcement = how the target product actually checks the permission. Never treat IAS as provisioning, IPS as authentication, IAG as an IdP, or Datasphere as SAC content authorization.
- Do not state one specific architecture or configuration as the only possible one (e.g. "IAS is configured as the primary identity provider") when it genuinely depends on the customer's setup — name it as the common/typical pattern instead, unless CANDIDATE BACKGROUND confirms that exact configuration.
- If unsure of the exact name of a transaction code, table, authorization object, API, IPS transformation property, IAG feature, or BTP service, do not invent one to sound more experienced -- say "I'd verify the exact technical object against the customer's release before giving the exact name" or "that depends on the customer's implementation and release" instead.
- Never open with "That's a great question," "That's an interesting question," or any acknowledgment of the question itself — answer it directly.
- Remove these patterns entirely, anywhere in the answer: "from an enterprise perspective", "technically", "in terms of implementation", "best practices include", "overall", "essentially", "generally", "needless to say", "the architectural pattern", "it is important to note", "moving forward", "as such", "i'm familiar with", "a common approach is", "best practice shows", "organizations typically", "seamless", "seamlessly", "that's a great question", "that's an interesting question".
- Absolutely no markdown formatting, headings, bullet points, preamble, or AI phrases.

`
    )
  );

  // 1.5 Minimal Reasoning Contract (lib/reasoningPlanner.js buildReasoningContract) -- concrete,
  // checkable content targets, not discourse-structure instructions. The Day-2 controlled
  // experiment (see git log) found that asking the model to insert one specific fact/sentence
  // ("name one edge case", "state a trade-off") is followed reliably regardless of prompt
  // position, while abstract structural asks ("be strategic", "open with an anchor sentence")
  // are not, even when isolated and elevated to their own top-level section. This section
  // complements CATEGORY_TEMPLATES (which supplies WHAT SAP-specific mechanics to cover) with
  // HOW to structure the response -- it does not repeat ROLE & RULES or the category template,
  // and every element is phrased as a single concrete instruction, never an abstract one.
  // Skipped for recovery mode (already has its own strict one-sentence directive that a second
  // multi-item list would conflict with). For plain (non-deepen) follow-ups, skipped ONLY when
  // context resolution found no real evidence (hasResolvedContext === false) -- a genuinely
  // content-free continuation ("okay", "tell me more") still gets no structure, but a
  // substantive follow-up phrased with "how"/"what about"/"and" no longer loses the reasoning
  // contract's structure just because of its opening words. Previously EVERY plain follow-up
  // was suppressed regardless of content, discovered as a demonstrated conflict during Day-9
  // context-resolution work: a genuinely new diagnostic question like "What about when an
  // access request gets approved but never provisions the role?" was getting zero reasoning
  // structure purely because it opened with "What about."
  if (
    reasoningContract.requiredElements?.length &&
    !isRecoverySignal &&
    !(isFollowUp && !isDeepenFollowUp && !hasResolvedContext)
  ) {
    promptSections.push(
      formatSection(
        "REQUIRED ANSWER ELEMENTS",
        `Your answer must address each of the following, in substance (not necessarily as separate labeled sentences):\n${reasoningContract.requiredElements
          .map((e) => `- ${e}`)
          .join("\n")}`
      )
    );
  }

  // 2. Category Adaptive Reasoning Structure
  // The trailing grounding clause below is load-bearing, not decoration -- controlled ablation
  // (eval/ablationMatrix5.js, eval/ablationMatrix6.js) found this ~90-byte section, ALONE,
  // added to an otherwise-working prompt, drops real-background-number usage from 5/5 to 0/5 --
  // a bigger effect than several sections 2-3x its size. The category template gives the model
  // an explicit competing "how do I structure this" recipe (e.g. "Component Topology -> Runtime
  // Protocols -> ...") that never mentions CANDIDATE BACKGROUND, and the model follows the
  // explicit recipe over the separate, softer grounding instruction earlier in the prompt.
  // Adding one clause that ties the structure back to background, tested in the same harness,
  // restored 5/5 without changing the structural guidance itself.
  const secondaryCats = analysis.secondaryCategories?.length ? ` | Secondary: ${analysis.secondaryCategories.join(", ")}` : "";
  promptSections.push(
    formatSection(
      "REASONING TEMPLATE",
      `Category: ${category}${secondaryCats}\n${categoryTemplate}\nIf CANDIDATE BACKGROUND above covers this scenario, at least one step in this structure must be grounded in its real scope or numbers, not left generic.`
    )
  );

  // 3. Interviewer & Style Guidance
  // For a bare factual question, lib/interviewerProfiler.js's persona matcher very often finds
  // no keyword-pattern match (this phrasing style rarely contains the trigger words for any of
  // its 6 archetypes) and falls back to its hardcoded default, "architect" -- injecting
  // "Depth: Very High | Expectation: Architecture First approach" for a question that should
  // get a 30-second definition. Rather than reading (and trusting) that persona output here,
  // a simple factual question gets a neutral, explicit instruction instead -- deliberately not
  // touching interviewerProfiler.js itself (its matching logic is a separate, later concern).
  if (questionIsSimpleFactual) {
    promptSections.push(
      formatSection(
        "INTERVIEWER CONTEXT",
        "This is a direct factual/definitional question. Answer concisely and directly -- do not treat it as an architecture, design, or scenario question regardless of any other signal in this prompt."
      )
    );
  } else if (interviewer.interviewer || interviewer.expectation || answerStyle) {
    const styleDetails = [
      interviewer.interviewer ? `Role: ${interviewer.interviewer}` : "",
      interviewer.expectation ? `Expectation: ${interviewer.expectation}` : "",
      interviewer.technicalDepth ? `Depth: ${interviewer.technicalDepth}` : "",
      answerStyle ? `Style: ${answerStyle}` : ""
    ].filter(Boolean).join(" | ");

    promptSections.push(formatSection("INTERVIEWER CONTEXT", styleDetails));
  }

  // 5. Technical Reasoning & Components
  // architectureDecision, implementationDecision, tradeOffs, and finalRecommendation are
  // deliberately NOT injected here -- lib/technicalReasoner.js derives them from a switch
  // statement keyed only on coarse intent (Architecture/Troubleshooting/Workflow/etc.), so
  // every question of the same intent got the exact same generic sentence fed into the
  // prompt as if it were specific reasoning (e.g. every single Troubleshooting question,
  // regardless of domain, got the identical "Immediate Hotfix vs Complete Root Cause"
  // trade-off). That's the same class of debt as the checklist-style prompt fragments this
  // was audited against: generic, templated content presented as if it were genuine
  // per-question reasoning, directly undermining the Decision Accountability model above.
  // businessObjective/Risk/governanceConsideration (DOMAIN_REASONING, keyed by actual SAP
  // domain) is kept -- genuinely domain-differentiated background, not generic filler.
  // implementationSequence (INTENT_SEQUENCES) is NOT injected -- same intent-only-keyed flaw
  // as the four fields above, AND it duplicates the REASONING TEMPLATE section below (which
  // is CATEGORY_TEMPLATES, individually refined per category throughout this session) with a
  // second, generic, never-refined structural source for the same thing. One structural
  // source (REASONING TEMPLATE) is enough; a competing generic one undermines it.
  const reasoningLines = [];
  if (reasoningMode !== "define" && reasoningMode !== "relate") {
    if (sapComponents.length > 0) reasoningLines.push(`Components: ${sapComponents.join(", ")}`);
    if (technicalReasoning.businessObjective) reasoningLines.push(`Objective: ${technicalReasoning.businessObjective}`);
    if (technicalReasoning.governanceConsideration) reasoningLines.push(`Boundary: ${technicalReasoning.governanceConsideration}`);
  }

  if (reasoningLines.length > 0) {
    // Same defect class as REASONING TEMPLATE/MANDATORY STRUCTURE/DOMAIN-SPECIFIC DEPTH -- a
    // component list is itself a silent competing recipe ("here are the relevant tools") that
    // never mentions CANDIDATE BACKGROUND, inviting an abstract capability tour instead of real
    // usage. Tie it back explicitly rather than leaving it a standalone list.
    reasoningLines.push("Where CANDIDATE BACKGROUND above shows one of these components was actually used, reference the real scope it was used at -- not just its capability in the abstract.");
    promptSections.push(formatSection("TECHNICAL REASONING", reasoningLines.join("\n")));
  }

  // 6. Answer Structure Blueprint & Evidence
  if (blueprint.body && Array.isArray(blueprint.body) && blueprint.body.length > 0) {
    const flowItems = blueprint.body
      .map(item => (typeof item === "string" ? item : item.section || item.title || ""))
      .filter(Boolean);
    if (flowItems.length > 0) {
      promptSections.push(formatSection("ANSWER BLUEPRINT", flowItems.join(" → ")));
    }
  }

  const evidenceItems = [
    ...(evidence.businessEvidence || []),
    ...(evidence.technicalEvidence || []),
    ...(evidence.architectureEvidence || []),
    ...(evidence.implementationEvidence || [])
  ]
    .map(e => (typeof e === "string" ? e : e?.content))
    .filter(Boolean)
    .slice(0, 5);

  if (evidenceItems.length > 0) {
    promptSections.push(formatSection("ENTERPRISE EVIDENCE", evidenceItems));
  }

  // 7. Grounded Knowledge Context
  if (knowledgeContext && knowledgeContext.trim()) {
    promptSections.push(
      formatSection(
        "SUPPORTING KNOWLEDGE",
        `Synthesize the following context as supporting evidence.
- Prefer retrieved evidence over general memory when present.
- If resume details conflict with retrieved context, preserve resume accuracy.
- Never quote chunks verbatim or expose metadata.
- Illustrative examples in this context are instructional methodology, not the candidate's personal history.
- Use this context to ground the actual engineering decision in real detail -- not to perform depth for its own sake.

${knowledgeContext.trim()}`
      )
    );
  }

  // 8. Deterministic Output Constraints
  promptSections.push(
    formatSection(
      "DETERMINISTIC CONSTRAINTS",
      `Perform internal validation before outputting:
1. Ensure answer directly addresses the prompt.
2. Confirm no hallucinated SAP objects or unrelated modules exist.
3. Validate natural spoken English tone and correct technical depth.
4. Confirm the answer names an exact, product-correct technical artifact rather than a vague reference: an SPRO path/T-code/config node for an on-premise ABAP system, or the correct cloud construct (trust configuration, role collection, scope, provisioning job) for BTP/IAS/IPS/IAG — never the wrong product's tooling.
5. Confirm any ownership language ("I did X") is supported by CANDIDATE BACKGROUND — otherwise rephrase as knowledge.
6. Custom Instructions: ${customInstructions || "None"}`
    )
  );

  // 9. Input Question & Final Output
  promptSections.push(formatSection("QUESTION", question));

  promptSections.push(
    formatSection(
      "FINAL OUTPUT",
      "Return ONLY the spoken interview response. Begin speaking immediately."
    )
  );

  return promptSections.filter(Boolean).join("\n\n");
}
