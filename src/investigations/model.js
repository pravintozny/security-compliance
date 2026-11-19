// Pure domain logic for investigation history: constants, sorting, formatting.

export const STATUSES = ['open', 'in_progress', 'closed', 'escalated'];

/**
 * @typedef {Object} Investigation
 * @property {string} id
 * @property {string} title
 * @property {'open'|'in_progress'|'closed'|'escalated'} status
 * @property {string} createdAt ISO 8601 timestamp
 * @property {string} updatedAt ISO 8601 timestamp
 * @property {string} actor
 * @property {string} summary
 */

/** Sort newest first by last activity (updatedAt, then createdAt, then id). Does not mutate. */
export function sortInvestigations(items) {
  return [...items].sort(
    (a, b) =>
      Date.parse(b.updatedAt) - Date.parse(a.updatedAt) ||
      Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
      b.id.localeCompare(a.id),
  );
}

/** "in_progress" -> "In progress" */
export function label(value) {
  const text = value.replaceAll('_', ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Deterministic UTC display, e.g. "2026-11-02 14:30 UTC". Returns "Unknown" for invalid input. */
export function formatTimestamp(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
}
