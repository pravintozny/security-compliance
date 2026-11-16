// Pure domain logic for scans: constants, validation, state transitions, filtering, sorting, metrics, CSV.

export const SCAN_TYPES = ['Vulnerability', 'Compliance', 'Configuration', 'Web Application', 'Container Image'];
export const SCHEDULES = ['On demand', 'Daily', 'Weekly', 'Monthly'];
export const STATUSES = ['Scheduled', 'Running', 'Completed', 'Failed', 'Cancelled'];
export const SEVERITIES = ['critical', 'high', 'medium', 'low'];

/** Allowed lifecycle transitions. Completed/Failed/Cancelled scans can be re-queued as Scheduled. */
export const TRANSITIONS = {
  Scheduled: ['Running', 'Cancelled'],
  Running: ['Completed', 'Failed', 'Cancelled'],
  Completed: ['Scheduled'],
  Failed: ['Scheduled'],
  Cancelled: ['Scheduled'],
};
export const canTransition = (from, to) => (TRANSITIONS[from] ?? []).includes(to);

const LIMITS = { name: 80, target: 200, owner: 80, notes: 1000, maxFindings: 1_000_000 };

/** Validate raw form input for create/edit (configuration only; status & findings change via transitions). */
export function validateScan(input, existing = [], selfId = null) {
  const v = {
    name: String(input.name ?? '').trim(),
    type: input.type,
    target: String(input.target ?? '').trim(),
    owner: String(input.owner ?? '').trim(),
    schedule: input.schedule,
    notes: String(input.notes ?? '').trim(),
  };
  const errors = {};
  for (const f of ['name', 'target', 'owner']) {
    if (!v[f]) errors[f] = 'This field is required.';
    else if (v[f].length > LIMITS[f]) errors[f] = `Must be ${LIMITS[f]} characters or fewer.`;
  }
  if (v.notes.length > LIMITS.notes) errors.notes = `Must be ${LIMITS.notes} characters or fewer.`;
  if (!SCAN_TYPES.includes(v.type)) errors.type = 'Select a valid option.';
  if (!SCHEDULES.includes(v.schedule)) errors.schedule = 'Select a valid option.';
  if (!errors.name && existing.some((s) => s.id !== selfId && s.name.toLowerCase() === v.name.toLowerCase())) {
    errors.name = 'A scan with this name already exists.';
  }
  return { value: v, errors };
}

/** Validate recorded results when finishing a scan. */
export function validateResults(input) {
  const errors = {};
  const findings = {};
  for (const k of SEVERITIES) {
    const raw = String(input[k] ?? '').trim();
    const n = raw === '' ? 0 : Number(raw);
    if (!Number.isInteger(n) || n < 0 || n > LIMITS.maxFindings) errors[k] = `Enter a whole number from 0 to ${LIMITS.maxFindings}.`;
    else findings[k] = n;
  }
  if (!['Completed', 'Failed'].includes(input.outcome)) errors.outcome = 'Select Completed or Failed.';
  return { value: { outcome: input.outcome, findings }, errors };
}

export const totalFindings = (s) => SEVERITIES.reduce((n, k) => n + (s.findings?.[k] ?? 0), 0);

/** Weighted finding score used for the "findings" sort. */
export const findingsWeight = (s) => (s.findings?.critical ?? 0) * 1000 + (s.findings?.high ?? 0) * 100 + (s.findings?.medium ?? 0) * 10 + (s.findings?.low ?? 0);

export const SORTABLE = ['name', 'type', 'target', 'owner', 'schedule', 'status', 'findings', 'updatedAt'];

function sortKey(s, key) {
  switch (key) {
    case 'findings': return findingsWeight(s);
    case 'status': return STATUSES.indexOf(s.status);
    case 'schedule': return SCHEDULES.indexOf(s.schedule);
    default: return String(s[key] ?? '').toLowerCase();
  }
}

export function queryScans(scans, { search = '', type = '', schedule = '', status = '', sortBy = 'updatedAt', sortDir = 'desc' } = {}) {
  const q = search.trim().toLowerCase();
  const out = scans.filter((s) =>
    (!type || s.type === type) && (!schedule || s.schedule === schedule) && (!status || s.status === status) &&
    (!q || [s.name, s.target, s.owner, s.notes].some((x) => String(x ?? '').toLowerCase().includes(q))));
  const dir = sortDir === 'asc' ? 1 : -1;
  const key = SORTABLE.includes(sortBy) ? sortBy : 'name';
  return out.sort((x, y) => {
    const a = sortKey(x, key), b = sortKey(y, key);
    return (a < b ? -1 : a > b ? 1 : x.name.localeCompare(y.name)) * dir;
  });
}

export function metrics(scans) {
  const done = scans.filter((s) => s.status === 'Completed');
  const sum = (k) => done.reduce((n, s) => n + (s.findings?.[k] ?? 0), 0);
  const finished = scans.filter((s) => s.status === 'Completed' || s.status === 'Failed');
  return {
    total: scans.length,
    running: scans.filter((s) => s.status === 'Running').length,
    scheduled: scans.filter((s) => s.status === 'Scheduled').length,
    failed: scans.filter((s) => s.status === 'Failed').length,
    successRate: finished.length ? Math.round((done.length / finished.length) * 100) : null,
    findings: Object.fromEntries(SEVERITIES.map((k) => [k, sum(k)])),
    byStatus: Object.fromEntries(STATUSES.map((st) => [st, scans.filter((s) => s.status === st).length])),
  };
}

/** RFC 4180 CSV with spreadsheet-formula neutralisation (CSV injection defence). */
export function toCsv(scans) {
  const cols = ['name', 'type', 'target', 'owner', 'schedule', 'status', ...SEVERITIES, 'startedAt', 'finishedAt', 'updatedAt'];
  const cell = (s) => {
    let t = String(s ?? '');
    if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
    return `"${t.replace(/"/g, '""')}"`;
  };
  const val = (s, c) => (SEVERITIES.includes(c) ? s.findings?.[c] ?? '' : s[c]);
  return [cols.join(','), ...scans.map((s) => cols.map((c) => cell(val(s, c))).join(','))].join('\r\n');
}
