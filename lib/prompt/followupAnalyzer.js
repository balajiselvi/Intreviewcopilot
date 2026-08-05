import appConfig from "../../config/appConfig";

// Template/regex based, no LLM call — a second model call here would reintroduce both
// the latency this pipeline is designed to avoid and the "rewrite until it survives
// follow-ups" pattern explicitly rejected for this app. Keyed by the same category set
// as CATEGORY_TEMPLATES in lib/prompt/interviewPrompt.js.
const FOLLOWUP_TEMPLATES = Object.freeze({
  Architecture: [
    "How would this scale across multiple SAP systems in a group landscape?",
    "What happens to {component} during a system refresh or copy?",
    "How do you handle failover for this component?"
  ],
  Implementation: [
    "What was the cutover strategy for {component}?",
    "How is this validated in a UAT environment before go-live?",
    "What's the rollback plan if {component} configuration fails?"
  ],
  Troubleshooting: [
    "What tools would you use to trace this issue in {component}?",
    "How do you differentiate a config issue from a data issue here?",
    "What's the escalation path if this can't be resolved within SLA?"
  ],
  Comparison: [
    "Which option would you pick for a highly regulated client, and why?",
    "What's the licensing or cost difference between these approaches?"
  ],
  Workflow: [
    "How do you handle escalation when an approver in {component} is unavailable?",
    "What happens if the SoD risk analysis flags a conflict mid-workflow?",
    "How do you version-control changes to the workflow configuration?"
  ],
  Configuration: [
    "What's the exact SPRO path for this configuration?",
    "How do you transport this configuration between systems?"
  ],
  Scenario: [
    "What would you do differently if this were a brownfield migration?",
    "How does this change on S/4HANA Cloud instead of on-prem?"
  ],
  Migration: [
    "How is role and authorization mapping handled during the migration?",
    "What's the fallback plan if the cutover window is missed?"
  ],
  Upgrade: [
    "How are deprecated authorization objects handled during the upgrade?",
    "What's the SPAU/SPDD conflict resolution strategy?"
  ],
  Performance: [
    "What specific ST03N metrics would you check first?",
    "How do you distinguish a database bottleneck from an application one?"
  ],
  Security: [
    "How is key rotation or credential expiry handled for {component}?",
    "What audit evidence would you present for this control?"
  ],
  Authorization: [
    "How are conflicting authorization object field values across roles handled?",
    "What's the process for periodic role recertification?"
  ],
  "Role Design": [
    "How do you handle role explosion in a large organization?",
    "What's the approach to derived vs. composite roles here?"
  ],
  "Production Support": [
    "What's the mean-time-to-resolution target for this type of incident?",
    "How do you prevent firefighter access from becoming a permanent workaround?"
  ],
  General: [
    "Can you walk through a specific example of this in practice?",
    "What's the biggest risk if this is implemented incorrectly?"
  ]
});

function fillTemplate(template, components) {
  if (!template.includes("{component}")) return template;
  return template.replace("{component}", components[0] || "this component");
}

export function analyzeFollowupReadiness({ question = "", answer = "", analysis = {}, sapComponents = [] }) {
  const cfg = appConfig.evaluation || {};
  const thresholds = cfg.thresholds || {};
  const scale = cfg.scale ?? 10;
  const text = (answer || "").toLowerCase();

  const category = analysis.category || "General";
  const templates = FOLLOWUP_TEMPLATES[category] || FOLLOWUP_TEMPLATES.General;
  const cappedComponents = sapComponents.slice(0, 2);

  const followups = templates.slice(0, 5).map(t => fillTemplate(t, cappedComponents));

  const gaps = [];
  cappedComponents.forEach(component => {
    if (!text.includes(String(component).toLowerCase())) {
      gaps.push(`Didn't mention ${component} — expect a follow-up probing it directly.`);
    }
  });

  const penalty = gaps.length * (thresholds.perGapPenalty ?? 0.5);
  const readinessScore = Math.max(0, Math.min(scale, scale - penalty));

  return { followups, gaps, readinessScore };
}
