// Pure domain logic for the Remediation status component.

export const REMEDIATION_STATUSES = ['open', 'in_progress', 'resolved', 'overdue'];

const LABELS = { open: 'Open', in_progress: 'In progress', resolved: 'Resolved', overdue: 'Overdue' };

/**
 * @typedef {Object} Finding
 * @property {string} id
 * @property {string} title
 * @property {'open'|'in_progress'|'resolved'} status  Stored workflow status
 * @property {string} dueDate ISO date (YYYY-MM-DD)
 */

export const statusLabel = (status) => LABELS[status] ?? status;

/**
 * Effective remediation status: an unresolved finding past its due date is 'overdue'.
 * @param {Finding} finding
 * @param {string} today ISO date (YYYY-MM-DD)
 */
export function effectiveStatus(finding, today) {
  if (finding.status !== 'resolved' && finding.dueDate < today) return 'overdue';
  return finding.status;
}

/**
 * Count findings per effective status. Always returns every status key.
 * @param {Finding[]} findings
 * @param {string} today ISO date (YYYY-MM-DD)
 * @returns {{open:number,in_progress:number,resolved:number,overdue:number,total:number}}
 */
export function summarizeRemediation(findings, today) {
  const counts = { open: 0, in_progress: 0, resolved: 0, overdue: 0, total: findings.length };
  for (const f of findings) {
    const s = effectiveStatus(f, today);
    if (s in counts) counts[s] += 1;
  }
  return counts;
}
