import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateScan, validateResults, queryScans, metrics, toCsv, canTransition, totalFindings } from '../src/scans/model.js';
import { SEED_SCANS } from '../src/scans/seed.js';

const ok = { name: 'S', type: 'Vulnerability', target: 't', owner: 'O', schedule: 'Daily' };

test('validateScan accepts valid input and trims', () => {
  const { value, errors } = validateScan({ ...ok, name: '  S  ' });
  assert.deepEqual(errors, {});
  assert.equal(value.name, 'S');
});

test('validateScan rejects missing, overlong, invalid enum and duplicate name', () => {
  const e = validateScan({ ...ok, name: '', target: 'x'.repeat(201), type: 'Bad', schedule: 'Hourly' }).errors;
  assert.ok(e.name && e.target && e.type && e.schedule);
  assert.ok(validateScan(ok, [{ id: 'a', name: 's' }]).errors.name);
  assert.deepEqual(validateScan(ok, [{ id: 'a', name: 's' }], 'a').errors, {});
});

test('validateResults enforces integers >= 0 and outcome', () => {
  assert.deepEqual(validateResults({ outcome: 'Completed', critical: '1', high: '', medium: '2', low: '0' }).value.findings, { critical: 1, high: 0, medium: 2, low: 0 });
  const e = validateResults({ outcome: 'Running', critical: '-1', high: '1.5', medium: 'x' }).errors;
  assert.ok(e.outcome && e.critical && e.high && e.medium);
});

test('lifecycle transitions', () => {
  assert.ok(canTransition('Scheduled', 'Running'));
  assert.ok(!canTransition('Completed', 'Running'));
  assert.ok(canTransition('Failed', 'Scheduled'));
});

test('queryScans filters, searches and sorts', () => {
  assert.ok(queryScans(SEED_SCANS, { status: 'Running' }).every((s) => s.status === 'Running'));
  assert.equal(queryScans(SEED_SCANS, { search: 'PAYMENTS' }).length, 1);
  const byFind = queryScans(SEED_SCANS, { sortBy: 'findings', sortDir: 'desc' });
  assert.equal(byFind[0].id, 'scn-seed-1');
  assert.equal(queryScans(SEED_SCANS, { type: 'Compliance', status: 'Failed' }).length, 0);
});

test('metrics', () => {
  const m = metrics(SEED_SCANS);
  assert.equal(m.total, SEED_SCANS.length);
  assert.equal(m.running, 1);
  assert.equal(m.successRate, 67);
  assert.equal(m.findings.critical, 1);
  assert.equal(metrics([]).successRate, null);
  assert.equal(totalFindings(SEED_SCANS[0]), 26);
});

test('toCsv escapes quotes and neutralises formulas', () => {
  const csv = toCsv([{ ...SEED_SCANS[0], name: '=HYPERLINK("x")', target: 'a,"b"' }]);
  assert.match(csv, /"'=HYPERLINK\(""x""\)"/);
  assert.match(csv, /"a,""b"""/);
  assert.equal(csv.split('\r\n').length, 2);
});
