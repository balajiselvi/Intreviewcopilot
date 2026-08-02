export function buildEvidence(

  chunks = [],

  reasoningPlan = {},

  sapComponents = []

) {

  const evidence = {

    businessEvidence: [],

    technicalEvidence: [],

    implementationEvidence: [],

    architectureEvidence: [],

    troubleshootingEvidence: [],

    workflowEvidence: [],

    componentEvidence: {}

  };

  const unique = new Set();

  function add(target, value) {

    if (!value)
      return;

    const key = value.trim();

    if (unique.has(key))
      return;

    unique.add(key);

    target.push(key);

  }

  for (const chunk of chunks) {

    const content = chunk.content || "";

    const sentences = content

      .split(/(?<=[.!?])\s+/)

      .map(s => s.trim())

      .filter(Boolean);

    for (const sentence of sentences) {

      const lower = sentence.toLowerCase();

      // -----------------------------
      // Business

      if (
        /(business|objective|requirement|risk|governance|compliance|audit|continuity)/i.test(lower)
      ) {

        add(
          evidence.businessEvidence,
          sentence
        );

      }

      // -----------------------------
      // Technical

      if (
        /(authorization|role|pfcg|su24|su25|su01|ara|arm|eam|firefighter|ias|ips|iag|oauth|saml|snc|sm59|connector)/i.test(lower)
      ) {

        add(
          evidence.technicalEvidence,
          sentence
        );

      }

      // -----------------------------
      // Architecture

      if (
        /(architecture|design|integration|landscape|runtime|component|network)/i.test(lower)
      ) {

        add(
          evidence.architectureEvidence,
          sentence
        );

      }

      // -----------------------------
      // Workflow

      if (
        /(workflow|approval|request|provision|risk analysis|msmp|brf)/i.test(lower)
      ) {

        add(
          evidence.workflowEvidence,
          sentence
        );

      }

      // -----------------------------
      // Troubleshooting

      if (
        /(su53|st01|st22|slg1|sm21|sm37|trace|root cause|resolution)/i.test(lower)
      ) {

        add(
          evidence.troubleshootingEvidence,
          sentence
        );

      }

      // -----------------------------
      // Implementation

      if (
        /(implementation|production|best practice|enterprise|deployment|migration|configuration)/i.test(lower)
      ) {

        add(
          evidence.implementationEvidence,
          sentence
        );

      }

    }

  }

  // -----------------------------
  // Component Evidence

  sapComponents.forEach(component => {

    const related = [];

    chunks.forEach(chunk => {

      const content = chunk.content || "";

      if (
        content
          .toLowerCase()
          .includes(component.toLowerCase())
      ) {

        related.push(content);

      }

    });

    evidence.componentEvidence[component] = related;

  });

  // -----------------------------
  // Trim

  Object.keys(evidence).forEach(key => {

    if (Array.isArray(evidence[key])) {

      evidence[key] =
        evidence[key].slice(0, 8);

    }

  });

  return evidence;

}