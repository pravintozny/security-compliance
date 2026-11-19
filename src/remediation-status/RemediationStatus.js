import { REMEDIATION_STATUSES, statusLabel, summarizeRemediation } from './model.js';

/**
 * Render a remediation status summary (badge + count per status).
 * @param {Object} props
 * @param {import('./model.js').Finding[]} props.findings
 * @param {string} [props.today] ISO date, defaults to today (UTC)
 * @returns {HTMLElement}
 */
export function RemediationStatus({ findings, today = new Date().toISOString().slice(0, 10) }) {
  const counts = summarizeRemediation(findings, today);
  const root = document.createElement('section');
  root.className = 'remediation-status';
  root.setAttribute('aria-label', 'Remediation status');

  const list = document.createElement('ul');
  for (const status of REMEDIATION_STATUSES) {
    const item = document.createElement('li');
    const badge = document.createElement('span');
    badge.className = `badge badge-remediation-${status}`;
    badge.textContent = statusLabel(status);
    const count = document.createElement('strong');
    count.textContent = String(counts[status]);
    item.append(badge, count);
    list.append(item);
  }
  const total = document.createElement('p');
  total.className = 'remediation-total';
  total.textContent = `${counts.total} findings`;
  root.append(list, total);
  return root;
}
