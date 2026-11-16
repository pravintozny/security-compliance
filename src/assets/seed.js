// Fictional demo data. Not real infrastructure.
const d = (n) => new Date(Date.UTC(2026, 10, 16) - n * 864e5).toISOString();
const mk = (i, name, type, identifier, owner, environment, criticality, status, notes, age) =>
  ({ id: `ast-seed-${i}`, name, type, identifier, owner, environment, criticality, status, notes, createdAt: d(age + 30), updatedAt: d(age) });

export const SEED_ASSETS = [
  mk(1, 'Payments API', 'Application', 'app:payments-api', 'Priya Nair', 'Production', 'Critical', 'Active', 'PCI-scoped service.', 2),
  mk(2, 'Primary Customer DB', 'Database', 'db-cust-01.corp.example', 'Marcus Lee', 'Production', 'Critical', 'Active', 'Contains PII.', 5),
  mk(3, 'Edge Firewall A', 'Network Device', '10.0.0.1', 'Network Ops', 'Production', 'High', 'Active', '', 9),
  mk(4, 'Build Runner Pool', 'Container', 'k8s:ci/runners', 'Dana Ortiz', 'Development', 'Medium', 'Active', '', 12),
  mk(5, 'Staging Web Cluster', 'Server', 'stg-web-01.corp.example', 'Priya Nair', 'Staging', 'Medium', 'Maintenance', 'Patching window Friday.', 1),
  mk(6, 'Analytics Bucket', 'Cloud Resource', 'arn:aws:s3:::example-analytics', 'Data Platform', 'Production', 'High', 'Active', '', 20),
  mk(7, 'Exec Laptop 114', 'Workstation', 'LT-0114', 'IT Support', 'Production', 'Medium', 'Active', '', 30),
  mk(8, 'Legacy HR Server', 'Server', 'hr-old-02.corp.example', 'Marcus Lee', 'Production', 'High', 'Decommissioned', 'Retired Q3.', 45),
  mk(9, 'Plant PLC Gateway', 'IoT / OT', '192.168.50.12', 'Facilities', 'DR', 'High', 'Planned', 'Awaiting install.', 3),
];
