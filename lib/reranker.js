export function rerankKnowledge(

  chunks = [],

  analysis = {},

  reasoningPlan = {}

) {

  const ranked = chunks.map(chunk => {

    let score = chunk.score || 0;

    const text = (chunk.content || "").toLowerCase();

    // ---------------------------------
    // Architecture
    // ---------------------------------

    if (analysis.intent === "architecture") {

      if (/architecture|design|landscape|component/.test(text))
        score += 12;

      if (/integration|runtime|flow/.test(text))
        score += 8;

    }

    // ---------------------------------
    // Workflow
    // ---------------------------------

    if (analysis.intent === "workflow") {

      if (/workflow|approval|msmp|brf/.test(text))
        score += 12;

      if (/provision|request|risk/.test(text))
        score += 8;

    }

    // ---------------------------------
    // Troubleshooting
    // ---------------------------------

    if (analysis.intent === "troubleshooting") {

      if (/su53|st01|st22|slg1|trace/.test(text))
        score += 12;

      if (/root cause|resolution/.test(text))
        score += 8;

    }

    // ---------------------------------
    // Scenario
    // ---------------------------------

    if (analysis.intent === "scenario") {

      if (/implementation|approach|strategy/.test(text))
        score += 10;

    }

    // ---------------------------------
    // Business Objective

    if (
      reasoningPlan.objective &&
      text.includes(
        reasoningPlan.objective
          .split(" ")[0]
          .toLowerCase()
      )
    ) {

      score += 5;

    }

    // ---------------------------------
    // Enterprise Content

    if (
      /enterprise|production|implementation|best practice/.test(text)
    ) {

      score += 5;

    }

    // ---------------------------------
    // SAP Depth

    const sapTerms = [

      "ara",

      "arm",

      "eam",

      "firefighter",

      "msmp",

      "brf",

      "pfcg",

      "su24",

      "ias",

      "ips",

      "iag",

      "cloud connector",

      "snc",

      "sm59"

    ];

    let hits = 0;

    sapTerms.forEach(term => {

      if (text.includes(term))
        hits++;

    });

    score += hits;

    return {

      ...chunk,

      rerankScore: score

    };

  });

  ranked.sort(

    (a, b) =>

      b.rerankScore -

      a.rerankScore

  );

  return ranked;

}