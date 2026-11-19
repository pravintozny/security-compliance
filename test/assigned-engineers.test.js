import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initials, normalizeEngineers } from '../src/assigned-engineers/model.js';

test('initials uses first and last name', () => {
  assert.equal(initials('ada lovelace'), 'AL');
  assert.equal(initials('Grace Brewster Hopper'), 'GH');
  assert.equal(initials('Linus'), 'L');
});

test('initials falls back for empty names', () => {
  assert.equal(initials('  '), '?');
  assert.equal(initials(undefined), '?');
});

test('normalizeEngineers sorts by name and dedupes by id without mutating', () => {
  const input = [
    { id: '2', name: 'bob' },
    { id: '1', name: 'Alice' },
    { id: '2', name: 'bob again' },
  ];
  const out = normalizeEngineers(input);
  assert.deepEqual(out.map((e) => e.id), ['1', '2']);
  assert.equal(input.length, 3);
});

test('normalizeEngineers handles empty input', () => {
  assert.deepEqual(normalizeEngineers([]), []);
  assert.deepEqual(normalizeEngineers(undefined), []);
});
