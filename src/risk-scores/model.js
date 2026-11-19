// Pure domain logic for risk scores: thresholds, severity mapping, sorting.

export const LEVELS = ['critical', 'high', 'medium', 'low'];

/** Minimum score (0-100) for each level, checked from most to least severe. */
export const THRESHOLDS = { critical: 80, high: 60, medium: 30, low: 0 };

/**
 * @typedef {Object} RiskScore
 * @property {string} id
 * @property {string} name
 * @property {number} score 0-100
 */

/** Map a 0-100 score to a severity level. Out-of-range values are clamped. */
export function levelForScore(score) {
  const n = Number.isFinite(score) ? score : 0;
  return LEVELS.find((l) => n >= THRESHOLDS[l]) ?? 'low';
}

/** Sort by score descending, then name. Does not mutate. */
export function sortRiskScores(items) {
  return [...items].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

export function label(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
