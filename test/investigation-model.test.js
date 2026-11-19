import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortInvestigations, label, formatTimestamp, STATUSES } from '../src/investigations/model.js';
import { seedInvestigations } from '../src/investigations/seed.js';

test('seed data uses valid statuses and timestamps', () => {
  for (const i of seedInvestigations) {
    assert.ok(STATUSES.includes(i.status), i.id);
    assert.ok(!Number.isNaN(Date.parse(i.updatedAt)), i.id);
  }
});

test('sortInvestigations orders newest first without mutating', () => {
  const copy = [...seedInvestigations];
  const sorted = sortInvestigations(seedInvestigations);
  assert.deepEqual(seedInvestigations, copy);
  assert.deepEqual(sorted.map((i) => i.id), ['INV-2004', 'INV-2003', 'INV-2002', 'INV-2001']);
});

test('sortInvestigations handles empty input', () => assert.deepEqual(sortInvestigations([]), []));

test('sortInvestigations breaks ties by createdAt then id', () => {
  const t = '2026-01-01T00:00:00Z';
  const a = { id: 'A', createdAt: t, updatedAt: t };
  const b = { id: 'B', createdAt: t, updatedAt: t };
  assert.deepEqual(sortInvestigations([a, b]).map((i) => i.id), ['B', 'A']);
});

test('label formats statuses', () => assert.equal(label('in_progress'), 'In progress'));

test('formatTimestamp renders UTC and tolerates bad input', () => {
  assert.equal(formatTimestamp('2026-11-02T14:30:00Z'), '2026-11-02 14:30 UTC');
  assert.equal(formatTimestamp('nope'), 'Unknown');
});
