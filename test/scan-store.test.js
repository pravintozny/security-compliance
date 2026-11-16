import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ScanStore, STORAGE_KEY } from '../src/scans/store.js';

const mem = (init = {}) => { const m = { ...init }; return { getItem: (k) => m[k] ?? null, setItem: (k, v) => { m[k] = v; }, m }; };
const input = { name: 'N', type: 'Compliance', target: 'n-1', owner: 'O', schedule: 'Weekly' };

test('seeds demo data and persists CRUD', () => {
  const s = mem(); const store = new ScanStore(s);
  assert.ok(store.scans.length > 0);
  const { scan } = store.create(input);
  assert.equal(scan.status, 'Scheduled');
  assert.equal(new ScanStore(s).get(scan.id).name, 'N');
  store.update(scan.id, { ...input, name: 'M' });
  assert.equal(new ScanStore(s).get(scan.id).name, 'M');
  assert.ok(store.remove(scan.id));
  assert.equal(new ScanStore(s).get(scan.id), undefined);
});

test('rejects invalid and duplicate input', () => {
  const store = new ScanStore(mem());
  store.create(input);
  assert.ok(store.create(input).errors.name);
  assert.ok(store.create({}).errors.target);
});

test('start -> finish records results; invalid transitions are rejected', () => {
  const store = new ScanStore(mem());
  const { scan } = store.create(input);
  assert.ok(store.finish(scan.id, { outcome: 'Completed' }).errors._form);
  assert.ok(store.transition(scan.id, 'Completed').errors._form);
  assert.equal(store.transition(scan.id, 'Running').scan.status, 'Running');
  assert.ok(store.transition(scan.id, 'Running').errors._form);
  assert.ok(store.finish(scan.id, { outcome: 'Completed', critical: '-2' }).errors.critical);
  const r = store.finish(scan.id, { outcome: 'Completed', critical: '2', high: '1' });
  assert.equal(r.scan.status, 'Completed');
  assert.equal(r.scan.findings.critical, 2);
  assert.ok(r.scan.finishedAt);
  const q = store.transition(scan.id, 'Scheduled').scan;
  assert.equal(q.findings.critical, 0);
  assert.equal(q.finishedAt, null);
});

test('failed outcome zeroes findings; cancel works from running', () => {
  const store = new ScanStore(mem());
  const { scan } = store.create(input);
  store.transition(scan.id, 'Running');
  assert.deepEqual(store.finish(scan.id, { outcome: 'Failed', critical: '5' }).scan.findings, { critical: 0, high: 0, medium: 0, low: 0 });
  store.transition(scan.id, 'Scheduled'); store.transition(scan.id, 'Running');
  assert.equal(store.transition(scan.id, 'Cancelled').scan.status, 'Cancelled');
});

test('corrupt storage surfaces an error and an empty list', () => {
  const store = new ScanStore(mem({ [STORAGE_KEY]: '{bad' }));
  assert.ok(store.error);
  assert.deepEqual(store.scans, []);
});

test('write failures are reported, not thrown', () => {
  const s = mem(); const store = new ScanStore(s);
  s.setItem = () => { throw new Error('quota'); };
  assert.match(store.create(input).errors._form, /quota/);
});
