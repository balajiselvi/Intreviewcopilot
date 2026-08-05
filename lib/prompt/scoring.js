import appConfig from "../../config/appConfig";

// Pure weighting arithmetic only — no detection logic lives here, so scoring weights
// can be retuned in config/appConfig.js's `evaluation.weights` without touching
// evaluation.js or followupAnalyzer.js.
export function computeWeightedScore(categoryScores = {}) {
  const cfg = appConfig.evaluation || {};
  const weights = cfg.weights || {};
  const scale = cfg.scale ?? 10;

  const breakdown = Object.keys(weights).map(category => {
    const score = categoryScores[category] ?? scale;
    const weight = weights[category];
    return { category, score, weight, contribution: score * weight };
  });

  const overallScore = breakdown.reduce((sum, row) => sum + row.contribution, 0);

  return {
    overallScore: Math.round(overallScore * 100) / 100,
    breakdown
  };
}
