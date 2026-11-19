// Pure domain logic for security incidents: constants, filtering, sorting.

export const SEVERITIES = ['critical', 'high', 'medium', 'low'];
export const STATUSES = ['open', 'investigating', 'contained', 'resolved'];

/**
 * @typedef {Object} Incident
 * @property {string} id
 * @property {string} title
 * @property {'critical'|'high'|'medium'|'low'} severity
 * @property {'open'|'investigating'|'contained'|'resolved'} status
 * @property {string} reportedAt ISO date (YYYY-MM-DD)
 * @property {string} owner
 */

const rank = (s) => SEVERITIES.indexOf(s);

/** Filter by severity and status. An empty/'all' value means no filter. */
export function filterIncidents(incidents, { severity = 'all', status = 'all' } = {}) {
  return incidents.filter(
    (i) => (severity === 'all' || i.severity === severity) && (status === 'all' || i.status === status),
  );
}

/** Sort by severity (most severe first), then newest reported date first. Does not mutate. */
export function sortIncidents(incidents) {
  return [...incidents].sort(
    (a, b) => rank(a.severity) - rank(b.severity) || b.reportedAt.localeCompare(a.reportedAt),
  );
}

export function label(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
