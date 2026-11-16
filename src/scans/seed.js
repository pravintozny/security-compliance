// Fictional demo data. Not real infrastructure or scan results.
const d = (n) => new Date(Date.UTC(2026, 10, 16) - n * 864e5).toISOString();
const mk = (i, name, type, target, owner, schedule, status, findings, notes, age) => ({
  id: `scn-seed-${i}`, name, type, target, owner, schedule, status, findings, notes,
  startedAt: status === 'Scheduled' ? null : d(age), finishedAt: ['Completed', 'Failed', 'Cancelled'].includes(status) ? d(age) : null,
  createdAt: d(age + 20), updatedAt: d(age),
});
const f = (critical, high, medium, low) => ({ critical, high, medium, low });
const none = f(0, 0, 0, 0);

export const SEED_SCANS = [
  mk(1, 'Payments API weekly vuln scan', 'Vulnerability', 'app:payments-api', 'Priya Nair', 'Weekly', 'Completed', f(1, 4, 9, 12), 'PCI-scoped service.', 2),
  mk(2, 'Customer DB CIS benchmark', 'Compliance', 'db-cust-01.corp.example', 'Marcus Lee', 'Monthly', 'Completed', f(0, 2, 6, 3), 'CIS PostgreSQL benchmark.', 6),
  mk(3, 'Edge firewall config audit', 'Configuration', '10.0.0.1', 'Network Ops', 'Weekly', 'Running', none, '', 0),
  mk(4, 'Storefront DAST', 'Web Application', 'https://shop.example.test', 'Dana Ortiz', 'On demand', 'Scheduled', none, 'Run after release 4.2.', 1),
  mk(5, 'Runner image scan', 'Container Image', 'registry.example.test/ci/runner:latest', 'Dana Ortiz', 'Daily', 'Failed', none, 'Registry credentials expired.', 3),
  mk(6, 'Legacy HR server scan', 'Vulnerability', 'hr-old-02.corp.example', 'Marcus Lee', 'On demand', 'Cancelled', none, 'Asset decommissioned.', 40),
];
