import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAsset, riskScore, riskLevel, queryAssets, metrics, toCsv } from '../src/assets/model.js';
import { SEED_ASSETS } from '../src/assets/seed.js';

const valid = { name: 'X', type: 'Server', identifier: 'x-1', owner: 'Me', environment: 'Production', criticality: 'High', status: 'Active' };

test('validation requires fields and enums', () => {
  const { errors } = validateAsset({ ...valid, name: ' ', type: 'Nope' });
  assert.ok(errors.name && errors.type);
  assert.deepEqual(validateAsset(valid).errors, {});
});

test('identifier uniqueness is case-insensitive and ignores self', () => {
  const ex = [{ id: 'a', identifier: 'X-1' }];
  assert.ok(validateAsset(valid, ex).errors.identifier);
  assert.deepEqual(validateAsset(valid, ex, 'a').errors, {});
});

test('risk scoring', () => {
  assert.equal(riskScore({ ...valid, criticality: 'Critical' }), 100);
  assert.equal(riskScore({ ...valid, status: 'Decommissioned' }), 0);
  assert.ok(riskScore({ ...valid, environment: 'Development' }) < riskScore(valid));
  assert.equal(riskLevel(100), 'Critical');
  assert.equal(riskLevel(10), 'Low');
});

test('query filters, searches and sorts', () => {
  assert.ok(queryAssets(SEED_ASSETS, { environment: 'Staging' }).every((a) => a.environment === 'Staging'));
  assert.equal(queryAssets(SEED_ASSETS, { search: 'PRIYA' }).length, 2);
  const r = queryAssets(SEED_ASSETS, { sortBy: 'risk', sortDir: 'desc' }).map(riskScore);
  assert.deepEqual(r, [...r].sort((a, b) => b - a));
  assert.equal(queryAssets(SEED_ASSETS, { search: 'zzz' }).length, 0);
});

test('metrics exclude decommissioned from live counts', () => {
  const m = metrics(SEED_ASSETS);
  assert.equal(m.total, SEED_ASSETS.length);
  assert.equal(m.active, SEED_ASSETS.length - 1);
  assert.equal(m.criticalProd, 2);
  assert.equal(metrics([]).avgRisk, 0);
});

test('CSV escapes quotes and neutralises formulas', () => {
  const csv = toCsv([{ ...valid, name: '=HYPERLINK("x")', owner: 'a"b', updatedAt: 't' }]);
  assert.match(csv, /"'=HYPERLINK\(""x""\)"/);
  assert.match(csv, /"a""b"/);
});
