// Pure domain logic for assets: constants, validation, risk scoring, filtering, sorting, metrics.

export const TYPES = ['Server', 'Workstation', 'Network Device', 'Database', 'Application', 'Cloud Resource', 'Container', 'IoT / OT'];
export const ENVIRONMENTS = ['Production', 'Staging', 'Development', 'DR'];
export const CRITICALITIES = ['Low', 'Medium', 'High', 'Critical'];
export const STATUSES = ['Planned', 'Active', 'Maintenance', 'Decommissioned'];

const CRIT_WEIGHT = { Low: 1, Medium: 2, High: 3, Critical: 4 };
const ENV_FACTOR = { Production: 1, DR: 0.85, Staging: 0.6, Development: 0.4 };

/** Risk score 0-100 derived from criticality and environment exposure. Decommissioned assets carry no risk. */
export function riskScore(a) {
  if (a.status === 'Decommissioned') return 0;
  const base = (CRIT_WEIGHT[a.criticality] ?? 1) / 4;
  const score = base * (ENV_FACTOR[a.environment] ?? 0.5) * 100;
  return Math.round(a.status === 'Maintenance' ? score * 0.9 : score);
}

export function riskLevel(score) {
  if (score >= 75) return 'Critical';
  if (score >= 50) return 'High';
  if (score >= 25) return 'Medium';
  return 'Low';
}

const LIMITS = { name: 80, identifier: 200, owner: 80, notes: 1000 };

/** Validate raw form input. Returns { value, errors } — errors is keyed by field. */
export function validateAsset(input, existing = [], selfId = null) {
  const v = {
    name: String(input.name ?? '').trim(),
    type: input.type,
    identifier: String(input.identifier ?? '').trim(),
    owner: String(input.owner ?? '').trim(),
    environment: input.environment,
    criticality: input.criticality,
    status: input.status,
    notes: String(input.notes ?? '').trim(),
  };
  const errors = {};
  for (const f of ['name', 'identifier', 'owner']) {
    if (!v[f]) errors[f] = 'This field is required.';
    else if (v[f].length > LIMITS[f]) errors[f] = `Must be ${LIMITS[f]} characters or fewer.`;
  }
  if (v.notes.length > LIMITS.notes) errors.notes = `Must be ${LIMITS.notes} characters or fewer.`;
  const enums = { type: TYPES, environment: ENVIRONMENTS, criticality: CRITICALITIES, status: STATUSES };
  for (const [f, list] of Object.entries(enums)) if (!list.includes(v[f])) errors[f] = 'Select a valid option.';
  if (!errors.identifier && existing.some((a) => a.id !== selfId && a.identifier.toLowerCase() === v.identifier.toLowerCase())) {
    errors.identifier = 'An asset with this identifier already exists.';
  }
  return { value: v, errors };
}

export const SORTABLE = ['name', 'type', 'owner', 'environment', 'criticality', 'status', 'risk', 'updatedAt'];

function sortKey(a, key) {
  switch (key) {
    case 'risk': return riskScore(a);
    case 'criticality': return CRIT_WEIGHT[a.criticality] ?? 0;
    case 'environment': return ENVIRONMENTS.indexOf(a.environment);
    case 'status': return STATUSES.indexOf(a.status);
    default: return String(a[key] ?? '').toLowerCase();
  }
}

export function queryAssets(assets, { search = '', type = '', environment = '', criticality = '', status = '', sortBy = 'risk', sortDir = 'desc' } = {}) {
  const q = search.trim().toLowerCase();
  const out = assets.filter((a) =>
    (!type || a.type === type) && (!environment || a.environment === environment) &&
    (!criticality || a.criticality === criticality) && (!status || a.status === status) &&
    (!q || [a.name, a.identifier, a.owner, a.notes].some((s) => s.toLowerCase().includes(q))));
  const dir = sortDir === 'asc' ? 1 : -1;
  const key = SORTABLE.includes(sortBy) ? sortBy : 'name';
  return out.sort((x, y) => {
    const a = sortKey(x, key), b = sortKey(y, key);
    return (a < b ? -1 : a > b ? 1 : x.name.localeCompare(y.name)) * dir;
  });
}

const count = (list, f, values) => Object.fromEntries(values.map((v) => [v, list.filter((a) => f(a) === v).length]));

export function metrics(assets) {
  const live = assets.filter((a) => a.status !== 'Decommissioned');
  const scores = live.map(riskScore);
  return {
    total: assets.length,
    active: live.length,
    criticalProd: live.filter((a) => a.criticality === 'Critical' && a.environment === 'Production').length,
    highRisk: scores.filter((s) => s >= 50).length,
    avgRisk: scores.length ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length) : 0,
    byCriticality: count(live, (a) => a.criticality, CRITICALITIES),
    byEnvironment: count(live, (a) => a.environment, ENVIRONMENTS),
    byStatus: count(assets, (a) => a.status, STATUSES),
  };
}

/** RFC 4180 CSV with spreadsheet-formula neutralisation (CSV injection defence). */
export function toCsv(assets) {
  const cols = ['name', 'type', 'identifier', 'owner', 'environment', 'criticality', 'status', 'risk', 'updatedAt'];
  const cell = (s) => {
    let t = String(s ?? '');
    if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
    return `"${t.replace(/"/g, '""')}"`;
  };
  return [cols.join(','), ...assets.map((a) => cols.map((c) => cell(c === 'risk' ? riskScore(a) : a[c])).join(','))].join('\r\n');
}
