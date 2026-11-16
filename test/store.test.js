import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AssetStore, STORAGE_KEY } from '../src/assets/store.js';

const mem = (init = {}) => { const m = { ...init }; return { getItem: (k) => m[k] ?? null, setItem: (k, v) => { m[k] = v; }, m }; };
const input = { name: 'N', type: 'Server', identifier: 'n-1', owner: 'O', environment: 'Staging', criticality: 'Low', status: 'Active' };

test('seeds demo data on first load and persists CRUD', () => {
  const s = mem(); const store = new AssetStore(s);
  assert.ok(store.assets.length > 0);
  const { asset } = store.create(input);
  assert.equal(new AssetStore(s).get(asset.id).name, 'N');
  store.update(asset.id, { ...input, name: 'M' });
  assert.equal(new AssetStore(s).get(asset.id).name, 'M');
  assert.ok(store.remove(asset.id));
  assert.equal(new AssetStore(s).get(asset.id), undefined);
});

test('rejects invalid and duplicate input', () => {
  const store = new AssetStore(mem());
  store.create(input);
  assert.ok(store.create(input).errors.identifier);
  assert.ok(store.create({}).errors.name);
});

test('corrupt storage surfaces an error and an empty list', () => {
  const store = new AssetStore(mem({ [STORAGE_KEY]: '{bad' }));
  assert.ok(store.error);
  assert.deepEqual(store.assets, []);
});

test('write failures are reported, not thrown', () => {
  const s = mem(); const store = new AssetStore(s);
  s.setItem = () => { throw new Error('quota'); };
  assert.match(store.create(input).errors._form, /quota/);
});
