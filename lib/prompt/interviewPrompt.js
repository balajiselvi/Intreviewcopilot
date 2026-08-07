import { buildAnswerStyle } from "./speechOptimizer";

// Length is driven by question complexity, not the (largely inert) client responseLength
// setting — this is also the main latency lever available under a single-pass architecture:
// generation wall-clock time scales with tokens produced, so a tighter, category-aware
// ceiling is what actually gets answers under the ~5-6s target, not prompt wording alone.
const LENGTH_BUDGETS = Object.freeze({
  simple: { words: "40-80", maxTokens: 140 },
  medium: { words: "80-140", maxTokens: 230 },
  architecture: { words: "140-220", maxTokens: 340 }
});

const SIMPLE_CATEGORIES = new Set(["Definition"]);
const ARCHITECTURE_CATEGORIES = new Set(["Architecture", "Migration", "Upgrade", "Role Design", "Security"]);

function getLengthTier(category) {
  if (SIMPLE_CATEGORIES.has(category)) return "simple";
  if (ARCHITECTURE_CATEGORIES.has(category)) return "architecture";
  return "medium";
}

function getLengthBudget(category) {
  return LENGTH_BUDGETS[getLengthTier(category)];
}

// pages/api/chat.js calls this to size max_tokens/maxOutputTokens per request instead
// of a flat ceiling — keeps buildSapInterviewPrompt's own return type (a string) unchanged.
export function getMaxTokensForCategory(category) {
  return getLengthBudget(category).maxTokens;
}

const CATEGORY_TEMPLATES = Object.freeze({
  Definition: "Structure: Why This Matters (enterprise context) → Direct Definition → Real Use Case/Problem It Solves → SAP Component Reference → Stop.",
  Architecture: "Structure: Component Topology → Runtime Protocols → Integration Mechanisms → Production Considerations.",
  Implementation: "Structure: Business Requirement → Technical Configuration → Testing Validation → Production Deployment.",
  Troubleshooting: "Structure: Real Problem Pattern → Root Cause Analysis → Step-by-Step Resolution (with T-codes/transactions) → Preventive Monitoring → Next Troubleshooting Steps. PRIORITY: Explicitly call out at least one edge case or unusual scenario where the standard diagnostic sequence breaks down or needs a different path (e.g. composite role conflicts, org-level restrictions, cross-system trust issues, cached buffer vs live authorization checks). DIAGNOSTIC METHODOLOGY (required for any 'how do you diagnose/troubleshoot X' question): 1) Scope the symptom first — state that the exact diagnostic path depends on what the reported symptom actually means, don't assume a single interpretation. 2) State the order you check things IN and WHY that order, not just a flat list — e.g. 'I check X before Y because...'. 3) Name the distinct underlying failure categories as an explicit taxonomy (e.g. configuration vs. authorization vs. provisioning/synchronization vs. connectivity) rather than a single undifferentiated checklist. 4) Close with an explicit statement of what the diagnostic approach is trying to isolate before making changes — the meta-strategy, not another tool name-drop. Avoid closing on a formulaic tag phrase like 'which is why I always dig into X' — earn the depth through the structure above instead.",
  Comparison: "Structure: Feature Architecture → Key Technical Differences → Practical Use Case Selection.",
  Workflow: "Structure: Trigger Event → Agent Determination → Approval Path & Fallbacks → SoD Risk Check at Request Time → Runtime Execution.",
  Configuration: "Structure: SPRO Path & T-Codes → Key Configuration Flags → Runtime System Behavior.",
  Scenario: "Structure: End-to-End Runtime Flow → Decision Branches → Real-World Trade-Offs.",
  Migration: "Structure: Transition Strategy → Conversion/Sync Tools → Authorization Transition → Cutover Risk Control.",
  Upgrade: "Structure: SPAU/SPDD Strategy → SU25 Role Impact → Deprecated Objects → Validation Testing.",
  Performance: "Structure: Diagnosis Tools (ST03N/Trace) → Bottleneck Analysis → Tuning Optimization Steps.",
  Security: "Structure: Risk/Compliance Rule → Identity & Access Controls → Encryption/SNC Mechanisms → Audit Evidence.",
  Authorization: "Structure: Authorization Objects & Fields → SU24 Proposals → PFCG Role Design → Runtime Checks.",
  "Role Design": "Structure: Role Taxonomy → Org Level Strategy → SOD Risk Analysis → Maintenance Mechanics.",
  "Production Support": "Structure: Incident Triage → Emergency Access (EAM/Firefighter) → SLA Resolution → Permanent Fix.",
  Hypercare: "Structure: Post-Go-Live Context (Week 1-2) → Dedicated Team Structure → Incident Management (P1/P2/P3 SLAs, response times) → Knowledge Transfer Plan → Escalation Procedures → Monitoring Tools (ST03/SM21/SU53). PRIORITY: Include a real edge case (a sustained incident, an escalation chain that actually got used) and connect the hypercare model to how support gets handed off long-term.",
  Behavioral: "Structure: Specific Scenario (what happened, business context, edge case complexity) → Your Action (what you actually did, decisions made, trade-off thinking) → Real Outcome (measurable result, business impact, stakeholder satisfaction) → Learning/Reflection (why it worked, what changed, enterprise implications). PRIORITY: Acknowledge genuine nuance (competing interests that were actually in tension) and connect the specific decision to broader strategic reasoning, not a generic lesson.",
  Cutover: "Structure: Pre-Cutover Validation (data reconciliation, testing checklist) → Parallel Run Process (timeline, systems in parallel) → Data Migration & Validation (reconciliation procedures) → Rollback Strategy (triggers, procedures, testing) → Post-Cutover Verification (monitoring, issue resolution).",
  Transports: "Structure: Change Request & Approval Workflow (approval gates, SAP Change Board) → Testing Strategy (unit → integration → UAT → staging) → Transport Process (SE09/STMS flow, RFC controls) → Rollback Plan (rollback procedures, testing) → Post-Deployment Monitoring (ST03/SM21 checks).",
  Audit: "Structure: Compliance Framework (SOX/GDPR/ISO), Risk Classification → Control Design (RUD testing, SoD rules, role review cycles) → Technical Implementation (REGOBJ for restricted tables, AAMM controls) → Testing & Evidence (control matrix, audit logs, evidence collection) → Remediation & Ongoing Monitoring.",
  "S/4HANA": "Structure: Key Security Changes vs ECC (HANA DB impact, New GL/Universal Journal auth changes, object simplification) → Authorization Architecture (simplified objects, composite/derived roles, master data auth) → Migration Strategy (phasing, role mapping, FI-GL compatibility) → Testing & Validation (SU53 access testing, GRC mock runs) → Post-Migration Monitoring.",
  "BTP Security": "Structure: Cloud Connector Architecture (outbound tunnel, SSL/TLS encryption, certificate management) → Security Implications (scoping, principal propagation flow, subaccount trust) → Authentication Methods (basic auth, SAML, OAuth scenarios) → NWA Configuration (TrustStore, monitoring, troubleshooting) → Integration with On-Premise GRC.",
  Leadership: "Structure: Specific Scenario (real conflict, business context, stakeholder positions) → Your Action (communication strategy, evidence used, trade-off resolution) → Real Outcome (measurable result, stakeholder satisfaction, security maintained) → Learning & Impact (what you learned, how it changed approach).",
  General: "Structure: Direct Technical Core → Runtime Mechanism → Explicit Trade-off or Rejected Alternative (name what you didn't choose and why, not just what you recommend) → Enterprise Best Practice. PRIORITY: this is the fallback template for any question without a dedicated one below -- it must not read as a features list. State at least one real tension (cost vs security, speed vs auditability, simplicity vs flexibility) grounded in the specific question, not a generic trade-off that could apply to anything."
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
- Detail certificate/SSL/TLS encryption mechanisms and lifecycle management
- Explain principal propagation flow: user identity → Cloud Connector → destination → backend
- Reference NWA (NetWeaver Administrator) for monitoring, TrustStore configuration
- Discuss authentication methods: basic auth (legacy), SAML, OAuth, mTLS scenarios
- Address specific threat vectors: MITM attacks, credential theft, unauthorized scoping` },
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
  { keywords: ["bw", "analytics"], text: `For BW/Analytics (Data Security) questions:
- Detail data classification: public, confidential, restricted, personal data
- Explain query authorization: authorization objects (RSEC_DS, RSEC_INFOPROV), variable auth
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
  technicalReasoning = {},
  interviewer = {},
  blueprint = {},
  evidence = {},
  sapComponents = [],
  knowledgeContext = "",
  model = "",
  customInstructions = "",
  candidateResume = "",
  jobDescription = "",
  company = ""
}) {
  const category = analysis.category || "General";
  const budget = getLengthBudget(category);
  const answerStyle = buildAnswerStyle ? buildAnswerStyle(question, analysis) : "";
  const domainDepthGuidance = getDomainDepthGuidance(category, analysis.domain, analysis.secondaryCategories);
  const categoryTemplate = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES.General;
  const isFollowUp = analysis.isFollowUp || false;
  const isDeepenFollowUp = analysis.isDeepenFollowUp || false;
  const isRecoverySignal = analysis.isRecoverySignal || false;

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

  // 1. Core Role & Persona
  // A recovery signal ("I'm blank", "wait, sorry") carries no topic content -- the speaker lost
  // their thread under live pressure. The wrong response is a full re-explanation (that's what
  // caused the blank in the first place, or makes the next one more likely). The right response
  // is short: name the topic, name where they'd gotten to, name what's next, then stop and let
  // them keep talking.
  // A "deepen" follow-up ("can you go deeper", "walk me through what you actually did") is a
  // request for MORE technical specificity, not a request to continue the narrative. Giving it
  // the same "don't repeat yourself" instruction as a plain continuation left the model with no
  // signal to actually increase depth -- it would just paraphrase or move on instead.
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
      `You are speaking live in an SAP Security technical interview. Target length for this question: ${budget.words} words.

BEFORE YOU ANSWER, reason through this once, silently -- not a persona to perform, the actual thinking that produces the answer. Every recommendation must survive scrutiny months later by the people who operate, audit, and support it.
FIRST, before anything else: does CANDIDATE BACKGROUND above contain genuine experience directly relevant to this question -- even if the question is phrased hypothetically ("how would you...")? A real architect doesn't classify questions as hypothetical vs. practical; they ask "have I actually lived through something that answers this?" If CANDIDATE BACKGROUND shows you have, the methodology below must be explained THROUGH that real experience -- anchor it in the real scope, numbers, and technologies CANDIDATE BACKGROUND actually states, the way a confident candidate naturally would ("the approach I'd take is actually the same one I've been using on an 11-country rollout..."). If CANDIDATE BACKGROUND doesn't cover this specific point, reason generically from real technical knowledge instead -- do not force background in where it doesn't genuinely fit; only use it when it truly strengthens the explanation, not to repeat your resume.
THEN work through: What problem is actually being solved (ignore SAP terminology at first)? What constraint shapes it (audit, performance, security, business, ops, scale, effort)? What's at least one realistic alternative? Why this approach over that alternative -- the engineering reason, not the product capability? What responsibility does this decision create once it's in production (monitoring, lifecycle, audit evidence, support, transport)? What could go wrong (failure modes, scaling, audit findings, adoption, support burden)? Could you defend this to another architect, an auditor, an ops lead? If the honest answer is "I'm just describing a feature," reason further before writing -- that reasoning is what produces the trade-off and the rejected alternative in your answer, not a checklist appended afterward.
SIMULATE BEFORE YOU NAME A CONSTRAINT: when the question implies multiple instances of something (countries, systems, stakeholders, teams, time periods), do not answer at the category level ("regulatory requirements differ," "stakeholders had concerns"). Silently instantiate two or three concrete, real examples first, using genuine general knowledge you actually have -- e.g. for multi-country: which specific countries, what actually differs there (a works-council co-determination requirement, a stricter SOX-style control, a different statutory reporting rule) -- for a stakeholder conflict: what would they specifically argue, what would you specifically concede, what's the specific state you'd land on. This is drawing out real general knowledge you already have with more precision, not inventing personal experience -- do not attach it to a fabricated project, employer, or incident; state it as general professional knowledge. Only after that concrete instance exists in your reasoning should you write the sentence -- if you catch yourself writing a category label ("regulatory requirements," "stakeholder concerns") with no instance behind it, stop and instantiate one first.
Decision, not feature: "I don't start by asking which authentication mechanism I can use. I start with the identity boundary -- if the customer already has Entra ID as the enterprise IdP, a separate credential store creates lifecycle inconsistency, so I'd federate IAS instead. The trade-off is more federation setup complexity, but governance gets easier across multiple apps." NOT: "IAS centralizes authentication, TLS encrypts traffic, monitoring reduces risk" -- same facts, no decision, no one accountable for it. Do not expose the reasoning questions themselves in the answer -- only the answer they produce.

MANDATORY STRUCTURE (the person using this is under live interview pressure -- optimize for what they can actually say, not what reads well): (1) One short, confident ANCHOR SENTENCE first -- never the direct content yet, just a commitment to an angle, phrased fresh each time, never a stock opener. (2) Immediately after, NAME 3-5 POINTS AS DECISIONS OR OPEN QUESTIONS before expanding any of them -- phrased as real decisions specific to THIS question's content, never a bare component list. If CANDIDATE BACKGROUND covers this scenario, at least one of those 3-5 points must be the real experience itself (its actual scope or numbers), not a purely abstract decision category. (3) Expand each named point in order, spoken-conversation language, so a speaker who loses their place can resume at the next point without the previous one's exact wording.
Never open with "From an enterprise perspective," "Technically," "Generally," "Basically," "It requires a multi-layered approach," "SAP GRC is...", or by defining a term unless asked to. Never close with a generic line like "this improves compliance," "this enhances governance," or "that's the architectural pattern" unless it states something genuinely new.

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
- Assume the interviewer already understands SAP — do not teach or define terms they didn't ask about.
- Explain execution flow and architectural thinking, not feature lists or textbook definitions.
- Average sentence length 10-15 words. Never exceed 18.
- MUST reference at least one specific SAP component (T-code, transaction, module, or tool) unless the question is purely conceptual.
- Remove these patterns entirely, anywhere in the answer: "from an enterprise perspective", "technically", "in terms of implementation", "best practices include", "overall", "essentially", "generally", "needless to say", "the architectural pattern", "it is important to note", "moving forward", "as such", "i'm familiar with", "a common approach is", "best practice shows", "organizations typically".
- Absolutely no markdown formatting, headings, bullet points, preamble, or AI phrases.

`
    )
  );

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
  if (interviewer.interviewer || interviewer.expectation || answerStyle) {
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
  if (sapComponents.length > 0) reasoningLines.push(`Components: ${sapComponents.join(", ")}`);
  if (technicalReasoning.businessObjective) reasoningLines.push(`Objective: ${technicalReasoning.businessObjective}`);

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
4. Confirm the answer names an exact SPRO path, T-code, or config node rather than a vague reference.
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
