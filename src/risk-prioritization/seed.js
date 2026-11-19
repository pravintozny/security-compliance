// Sample risk data (no backend yet).
/** @type {import('./model.js').Risk[]} */
export const seedRisks = [
  { id: 'RSK-001', name: 'Unpatched customer database', severity: 5, likelihood: 4 },
  { id: 'RSK-002', name: 'SSO misconfiguration', severity: 4, likelihood: 3 },
  { id: 'RSK-003', name: 'Leaked CI secrets', severity: 5, likelihood: 2 },
  { id: 'RSK-004', name: 'Outdated wiki plugin', severity: 2, likelihood: 3 },
  { id: 'RSK-005', name: 'Marketing site XSS', severity: 2, likelihood: 1 },
];
