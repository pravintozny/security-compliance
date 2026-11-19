import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterIncidents, sortIncidents, label, SEVERITIES, STATUSES } from '../src/incidents/model.js';
import { seedIncidents } from '../src/incidents/seed.js';

test('seed data uses valid severities and statuses', () => {
  for (const i of seedIncidents) {
    assert.ok(SEVERITIES.includes(i.severity), i.id);
    assert.ok(STATUSES.includes(i.status), i.id);
  }
});

test('filterIncidents with no filters returns everything', () => {
  assert.equal(filterIncidents(seedIncidents).length, seedIncidents.length);
});

test('filterIncidents by severity and status', () => {
  const high = filterIncidents(seedIncidents, { severity: 'high' });
  assert.ok(high.length > 0 && high.every((i) => i.severity === 'high'));
  const both = filterIncidents(seedIncidents, { severity: 'high', status: 'open' });
  assert.deepEqual(both.map((i) => i.id), ['INC-1005']);
});

test('filterIncidents returns empty array when nothing matches', () => {
  assert.deepEqual(filterIncidents(seedIncidents, { severity: 'critical', status: 'resolved' }), []);
});

test('sortIncidents orders by severity then newest date, without mutating', () => {
  const copy = [...seedIncidents];
  const sorted = sortIncidents(seedIncidents);
  assert.deepEqual(seedIncidents, copy);
  assert.deepEqual(sorted.map((i) => i.id), ['INC-1001', 'INC-1005', 'INC-1002', 'INC-1003', 'INC-1004']);
});

test('label capitalizes', () => assert.equal(label('open'), 'Open'));
