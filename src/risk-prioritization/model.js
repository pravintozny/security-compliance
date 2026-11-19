// Pure domain logic for risk prioritization: scoring, buckets, ranking.

export const BUCKETS = ['critical', 'high', 'medium', 'low'];

/** Minimum priority score (1-25) for each bucket, checked most to least severe. */
export const THRESHOLDS = { critical: 20, high: 12, medium: 6, low: 0 };

/**
 * @typedef {Object} Risk
 * @property {string} id
 * @property {string} name
 * @property {number} severity   1-5
 * @property {number} likelihood 1-5
 */

function clamp5(n) {
  return Number.isFinite(n) ? Math.min(5, Math.max(1, Math.round(n))) : 1;
}

/** Priority score = severity x likelihood (each clamped to 1-5), range 1-25. */
export function priorityScore(risk) {
  return clamp5(risk.severity) * clamp5(risk.likelihood);
}

/** Map a priority score to a bucket. */
export function bucketForScore(score) {
  const n = Number.isFinite(score) ? score : 0;
  return BUCKETS.find((b) => n >= THRESHOLDS[b]) ?? 'low';
}

/** Rank risks by priority score desc, then severity desc, then name. Does not mutate. */
export function prioritizeRisks(risks) {
  return risks
    .map((r) => {
      const score = priorityScore(r);
      return { ...r, score, bucket: bucketForScore(score) };
    })
    .sort((a, b) => b.score - a.score || clamp5(b.severity) - clamp5(a.severity) || a.name.localeCompare(b.name))
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

export function label(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
