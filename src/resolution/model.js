// Pure domain logic for the resolution workflow: states, validated transitions, history.

export const STATES = ['open', 'in_progress', 'resolved', 'verified', 'closed'];

/** Allowed transitions. A failed verification sends a finding back to in_progress. */
export const TRANSITIONS = {
  open: ['in_progress', 'closed'],
  in_progress: ['resolved', 'open'],
  resolved: ['verified', 'in_progress'],
  verified: ['closed', 'in_progress'],
  closed: ['open'],
};

/** States that require a non-empty resolution note. */
export const NOTE_REQUIRED = ['resolved', 'verified', 'closed'];

/**
 * @typedef {Object} HistoryEntry
 * @property {string} from
 * @property {string} to
 * @property {string} actor
 * @property {string} note
 * @property {string} at ISO 8601 timestamp
 *
 * @typedef {Object} Finding
 * @property {string} id
 * @property {string} title
 * @property {string} status
 * @property {string} createdAt ISO 8601 timestamp
 * @property {string} updatedAt ISO 8601 timestamp
 * @property {string|null} resolvedAt set when entering resolved, cleared on reopen
 * @property {HistoryEntry[]} history
 */

/** Create a new finding in the open state. */
export function createFinding({ id, title }, now = new Date()) {
  if (!id || !title) throw new Error('id and title are required');
  const at = now.toISOString();
  return { id, title, status: 'open', createdAt: at, updatedAt: at, resolvedAt: null, history: [] };
}

export function canTransition(from, to) {
  return (TRANSITIONS[from] ?? []).includes(to);
}

export function availableTransitions(finding) {
  return [...(TRANSITIONS[finding.status] ?? [])];
}

/**
 * Move a finding to a new state. Returns a new finding (input is not mutated).
 * Throws on unknown/invalid transitions, missing actor, or a missing required note.
 */
export function transition(finding, to, { actor, note = '' } = {}, now = new Date()) {
  if (!STATES.includes(to)) throw new Error(`Unknown state: ${to}`);
  if (!canTransition(finding.status, to)) {
    throw new Error(`Invalid transition: ${finding.status} -> ${to}`);
  }
  if (!actor) throw new Error('actor is required');
  const trimmed = String(note).trim();
  if (NOTE_REQUIRED.includes(to) && !trimmed) {
    throw new Error(`A resolution note is required to move to ${to}`);
  }
  const at = now.toISOString();
  const entering = (s) => to === s;
  return {
    ...finding,
    status: to,
    updatedAt: at,
    resolvedAt: entering('resolved') ? at : entering('open') || entering('in_progress') ? null : finding.resolvedAt,
    history: [...finding.history, { from: finding.status, to, actor, note: trimmed, at }],
  };
}

/** "in_progress" -> "In progress" */
export function label(value) {
  const text = value.replaceAll('_', ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
