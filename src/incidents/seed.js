// Sample incident data (no backend yet).
/** @type {import('./model.js').Incident[]} */
export const seedIncidents = [
  { id: 'INC-1001', title: 'Credential stuffing against SSO portal', severity: 'critical', status: 'investigating', reportedAt: '2026-11-17', owner: 'A. Rivera' },
  { id: 'INC-1002', title: 'Public S3 bucket exposes build artifacts', severity: 'high', status: 'contained', reportedAt: '2026-11-15', owner: 'J. Chen' },
  { id: 'INC-1003', title: 'Phishing email reported by finance team', severity: 'medium', status: 'open', reportedAt: '2026-11-14', owner: 'S. Patel' },
  { id: 'INC-1004', title: 'Outdated TLS configuration on legacy API', severity: 'low', status: 'resolved', reportedAt: '2026-11-02', owner: 'M. Okafor' },
  { id: 'INC-1005', title: 'Malware detected on contractor laptop', severity: 'high', status: 'open', reportedAt: '2026-11-18', owner: 'J. Chen' },
];
