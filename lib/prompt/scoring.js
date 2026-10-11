import appConfig from "../../config/appConfig";

// Pure weighting arithmetic only — no detection logic lives here, so scoring weights
// can be retuned in config/appConfig.js's `evaluation.weights` without touching
// evaluation.js or followupAnalyzer.js.
export function computeWeightedScore(categoryScores = {}) {
  const cfg = appConfig.evaluation || {};
  const weights = cfg.weights || {};
  const entries = Object.entries(weights).filter(([category, weight]) =>
    Number.isFinite(weight) && weight > 0 && Number.isFinite(categoryScores[category])
  );
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (!totalWeight) return { overallScore: null, breakdown: [] };
  const breakdown = entries.map(([category, configuredWeight]) => {
    const score = categoryScores[category];
    const weight = configuredWeight / totalWeight;
    return { category, score, weight, contribution: score * weight };
  });

  const overallScore = breakdown.reduce((sum, row) => sum + row.contribution, 0);

  return {
    overallScore: Math.round(overallScore * 100) / 100,
    breakdown
  };
}
