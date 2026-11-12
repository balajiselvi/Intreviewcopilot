const fs = require("fs");
const path = require("path");

function patch(rel, pairs) {
  const file = path.join("D:/My Projects/InterviewCopilot", rel);
  const original = fs.readFileSync(file, "utf8");
  let next = original;
  for (const [from, to] of pairs) {
    if (!next.includes(from)) {
      throw new Error(`Missing text in ${rel}: ${from.slice(0, 80)}`);
    }
    next = next.replace(from, to);
  }
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, next);
  fs.renameSync(tmp, file);
  console.log("patched", rel);
}

patch("knowledge/project-management/project-lifecycle.md", [[
  "SAP projects progress through five phases, each with distinct objectives and deliverables. **Discover (typically 4-8 weeks):** conduct workshops, interview stakeholders, understand current processes, identify pain points, document requirements (functional, technical, non-functional, constraints). Deliverable: requirements document and executive summary of scope/timeline/cost/risk. Gate: business approves requirements. **Explore (typically 6-12 weeks):** design how SAP will work, perform detailed fit-gap analysis (what does SAP do vs what's required), make customization decisions (build/buy/configure), create blueprint (process flows, configuration specs, custom development scope). Deliverable: blueprint and gap-resolution decisions. Gate: business and technical architects approve design. **Execute (typically 8-16 weeks):** configure SAP (module customization, interfaces, reports), develop custom code if needed, conduct testing (unit testing by developers, integration testing between modules, user acceptance testing with business users). Deliverable: configured system, tested and approved by business. Gate: UAT sign-off. **Deploy (typically 2-4 weeks):** prepare users (training, communications, support structure), execute data migration (load master data and historical transactions), run parallel (both systems operating, validate results match), perform cutover (turn off legacy, turn on SAP). Deliverable: go-live. Gate: cutover successful, system operational. **Post-Go-Live (typically 4-8 weeks stabilization):** hypercare (intensive support day 1-7), adoption monitoring (track usage, identify issues), optimization (performance tuning, refinement of processes). Deliverable: stable system, team transitioned to business-as-usual support. Gate: stabilization complete, system performing within targets.",
  "Use the six SAP Activate phases and the evidence that closes each one. Discover confirms the business case, the scope, and the deployment choice. Prepare completes the plan, the owners, the RAID log, and the initial landscape. Explore confirms the fit-to-standard gaps, the extension decisions, and the authorization scope. Realize configures the approved scope and completes integration and test evidence. Deploy rehearses the cutover, completes the go/no-go review, executes the production cutover, and runs hypercare. Run completes the operational handover. Do not assign a universal week count. A customer gate can be added, but it does not rename Realize to Execute and it does not remove Prepare or Run."
]]);

patch("knowledge/project-management/resource-planning.md", [
  [
    "- As project moves from Explore (design-heavy) to Execute (config-heavy), adjust staffing",
    "- As the project moves from Explore to Realize, adjust staffing from design to configuration and test"
  ],
  [
    "- By phase: who's needed in Discover, Explore, Execute, Deploy, Post-Go-Live",
    "- By phase: who is needed in Discover, Prepare, Explore, Realize, Deploy, and Run"
  ]
]);

patch("knowledge/rise/rise-project.md", [
  [
    "5. **Partner Organization** — Implementation partner (Deloitte, Accenture, SAP Consulting) providing methodology and experts",
    "5. **Partner Organization** — The contracted implementation partner, when the customer engages one. The firm is a contract fact, not a required method."
  ],
  [
    "- Conduct performance testing during Execute phase with production-like data volumes",
    "- Conduct performance testing during Realize with production-like data volumes"
  ],
  [
    "RISE is a cloud-centric, pre-configured implementation model that leverages industry-specific best practices to reduce timeline and customization. Traditional implementations could take 2–3 years with significant custom development; RISE targets 6–12 months with 70–80% adoption of SAP standard processes, reducing cost and risk.",
    "RISE with SAP is a contracted service and operating model. Deliver it with SAP Activate: Discover, Prepare, Explore, Realize, Deploy, and Run. Do not quote a universal duration or a universal standard-process percentage."
  ],
  [
    "Discover (gap analysis, team formation), Explore (process design, configuration planning), Execute (build, testing), Deploy (go-live preparation, cutover), and Post-Go-Live (hypercare, optimization).",
    "Discover, Prepare, Explore, Realize, Deploy, and Run. Do not replace Realize with Execute, and do not drop Prepare or Run."
  ],
  [
    "RISE methodology is SAP's proven best-practice approach (similar to SAP Activate). It includes predefined roles, templates, and checklists that eliminate design rework. Industry-specific RISE packages provide 70% pre-built configuration, reducing customization effort.",
    "The implementation framework is SAP Activate. A service package does not by itself prove a percentage of prebuilt configuration. Confirm the contracted scope."
  ],
  [
    "Waves are phased go-lives (Wave 1: core financials, Wave 2: operations, Wave 3+: advanced features). Typically 4–8 weeks apart, waves spread risk and allow organizational learning between go-lives.",
    "A wave is a release decision in the approved plan. Do not assign a universal wave content list or a universal gap between waves."
  ],
  [
    "Hypercare is 1–2 weeks of intensive post-go-live support with partner consultants on-site. Focuses on immediate issue resolution, user support, data validation, and knowledge transfer to internal operations team.",
    "Hypercare is the intensive support period after production cutover. Its length and staffing come from the approved Deploy plan. Do not invent a one-to-two-week duration."
  ],
  [
    "Discover: 4–6 weeks, Explore: 8–10 weeks, Execute: 20–24 weeks, Deploy: 2–4 weeks (includes cutover + hypercare). Total project duration: typically 6–12 months from kickoff to stable operations.",
    "There is no universal week count. Confirm the duration in the approved plan for that contract and landscape."
  ],
  [
    "3. **What if key partner consultants leave the project during critical Execute phase?**",
    "3. **What if key partner consultants leave during Realize?**"
  ],
  [
    "- **Data migration as afterthought:** Postponing data migration planning until Execute phase causes rework. Plan data migration in Discover, execute pilots during Explore.",
    "- **Data migration as afterthought:** Plan data migration in Discover and Prepare, and rehearse it before Deploy. Do not leave the first rehearsal until Realize is nearly closed."
  ],
  [
    "- **Realistic timeline expectations:** RISE timelines are tight (6–12 months). A candidate who acknowledges this and discusses trade-off decisions shows maturity.",
    "- **Realistic timeline expectations:** Use the approved plan. Do not quote a universal 6-to-12-month duration."
  ],
  [
    "- Can articulate RISE phasing (Discover, Explore, Execute, Deploy) and Wave approach with specifics",
    "- Can articulate SAP Activate: Discover, Prepare, Explore, Realize, Deploy, and Run"
  ],
  [
    "- **Executive sponsorship is non-negotiable:** Project without strong C-level sponsor is 3x more likely to fail. Invest in sponsor engagement, ensure they remove obstacles.",
    "- **Executive sponsorship is non-negotiable:** Name the sponsor, the decisions that sponsor owns, and the escalation path. Do not invent a failure multiple."
  ]
]);

patch("knowledge/rise/rise-security.md", [[
  "SAP operates the infrastructure and the privileged access of SAP administrators. The customer owns business-user identity, authentication choices, application authorization, and audit evidence for business users. Source: SAP Community, Securing RISE with SAP S/4HANA Cloud, private edition, customer data center option.",
  "SAP operates the infrastructure and the privileged access of SAP administrators. The customer owns business-user identity, authentication choices, application authorization, and audit evidence for business users. Source: SAP Community, Securing RISE with SAP S/4HANA Cloud, private edition, customer data center option. Checked 2026-10-19 against SAP, RISE with SAP S/4HANA Cloud, private edition and SAP ERP, PCE Roles and Responsibilities, English v3-2026: the application security concept, single sign-on design, single sign-on implementation, and customer Active Directory or Google identity-provider integration are Excluded Tasks, which the customer performs. The application-and-infrastructure security line is a separate standard service and is not the same task. Confirm the line item for the contracted edition before assigning the work."
]]);

patch("knowledge/project-types/implementation.md", [[
  "Implementation methodology is the structured framework for SAP projects: ASAP-like phases (blueprint → dev → testing → go-live → support), governance (steering committee), stage gates (formal approvals), risk management, change management, quality gates. Discipline prevents scope creep and timeline slippage. Examples: Accelerated SAP (ASAP), Activate (SAP's modern methodology for cloud projects).",
  "For a current SAP Cloud ERP or RISE delivery, use SAP Activate: Discover, Prepare, Explore, Realize, Deploy, and Run. ASAP is an older framework and is not this phase sequence. Confirm the configuration, the authorization scope, and the cutover evidence in the phase that owns them. Do not rename Realize to Execute."
]]);
