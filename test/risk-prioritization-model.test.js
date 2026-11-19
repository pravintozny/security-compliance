import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priorityScore, bucketForScore, prioritizeRisks, label, BUCKETS } from '../src/risk-prioritization/model.js';
import { seedRisks } from '../src/risk-prioritization/seed.js';

test('priorityScore multiplies severity by likelihood and clamps inputs', () => {
  assert.equal(priorityScore({ severity: 5, likelihood: 4 }), 20);
  assert.equal(priorityScore({ severity: 9, likelihood: 9 }), 25);
  assert.equal(priorityScore({ severity: NaN, likelihood: 0 }), 1);
});

test('bucketForScore applies thresholds at the boundaries', () => {
  assert.equal(bucketForScore(25), 'critical');
  assert.equal(bucketForScore(20), 'critical');
  assert.equal(bucketForScore(19), 'high');
  assert.equal(bucketForScore(12), 'high');
  assert.equal(bucketForScore(11), 'medium');
  assert.equal(bucketForScore(6), 'medium');
  assert.equal(bucketForScore(5), 'low');
  assert.equal(bucketForScore(NaN), 'low');
});

test('prioritizeRisks ranks by score without mutating input', () => {
  const input = [...seedRisks].reverse();
  const before = structuredClone(input);
  const out = prioritizeRisks(input);
  assert.deepEqual(input, before);
  assert.deepEqual(out.map((r) => r.id), ['RSK-001', 'RSK-002', 'RSK-003', 'RSK-004', 'RSK-005']);
  assert.deepEqual(out.map((r) => r.rank), [1, 2, 3, 4, 5]);
  assert.deepEqual(out.map((r) => r.bucket), ['critical', 'high', 'medium', 'medium', 'low']);
  for (const r of out) assert.ok(BUCKETS.includes(r.bucket));
});

test('ties break by severity then name', () => {
  const out = prioritizeRisks([
    { id: 'a', name: 'B', severity: 2, likelihood: 3 },
    { id: 'b', name: 'A', severity: 3, likelihood: 2 },
    { id: 'c', name: 'C', severity: 3, likelihood: 2 },
  ]);
  assert.deepEqual(out.map((r) => r.id), ['b', 'c', 'a']);
});

test('empty input and label', () => {
  assert.deepEqual(prioritizeRisks([]), []);
  assert.equal(label('high'), 'High');
});
