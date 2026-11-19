import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levelForScore, sortRiskScores, label, LEVELS } from '../src/risk-scores/model.js';
import { seedRiskScores } from '../src/risk-scores/seed.js';

test('seed scores are within 0-100', () => {
  for (const r of seedRiskScores) assert.ok(r.score >= 0 && r.score <= 100, r.id);
});

test('levelForScore applies thresholds at the boundaries', () => {
  assert.equal(levelForScore(100), 'critical');
  assert.equal(levelForScore(80), 'critical');
  assert.equal(levelForScore(79), 'high');
  assert.equal(levelForScore(60), 'high');
  assert.equal(levelForScore(59), 'medium');
  assert.equal(levelForScore(30), 'medium');
  assert.equal(levelForScore(29), 'low');
  assert.equal(levelForScore(0), 'low');
});

test('levelForScore handles invalid and out-of-range values', () => {
  assert.equal(levelForScore(NaN), 'low');
  assert.equal(levelForScore(-5), 'low');
  assert.equal(levelForScore(150), 'critical');
});

test('every seed score maps to a known level', () => {
  for (const r of seedRiskScores) assert.ok(LEVELS.includes(levelForScore(r.score)), r.id);
});

test('sortRiskScores orders by score descending without mutating', () => {
  const copy = [...seedRiskScores].reverse();
  const before = [...copy];
  const sorted = sortRiskScores(copy);
  assert.deepEqual(copy, before);
  assert.deepEqual(sorted.map((r) => r.id), ['AST-001', 'AST-002', 'AST-003', 'AST-004', 'AST-005']);
});

test('sortRiskScores returns empty array for empty input', () => assert.deepEqual(sortRiskScores([]), []));

test('label capitalizes', () => assert.equal(label('high'), 'High'));
