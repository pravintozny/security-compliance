// Pure domain logic for the Assigned engineers component.

/**
 * @typedef {Object} Engineer
 * @property {string} id
 * @property {string} name
 * @property {string} [role]
 */

/**
 * Initials from a display name (max two letters, upper-cased).
 * @param {string} name
 */
export function initials(name) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/**
 * Sort engineers by name (case-insensitive) without mutating the input,
 * and drop duplicates by id.
 * @param {Engineer[]} engineers
 * @returns {Engineer[]}
 */
export function normalizeEngineers(engineers) {
  const seen = new Set();
  const unique = [];
  for (const e of engineers ?? []) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    unique.push(e);
  }
  return unique.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}
