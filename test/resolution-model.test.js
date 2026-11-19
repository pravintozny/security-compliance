import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFinding, transition, canTransition, availableTransitions, label, STATES, TRANSITIONS } from '../src/resolution/model.js';

const t = (n) => new Date(Date.UTC(2026, 10, 1, 0, n));
const f0 = () => createFinding({ id: 'F-1', title: 'Outdated TLS config' }, t(0));

test('transition table only references known states', () => {
  for (const [from, tos] of Object.entries(TRANSITIONS)) {
    assert.ok(STATES.includes(from));
    for (const to of tos) assert.ok(STATES.includes(to));
  }
});

test('createFinding starts open and validates input', () => {
  const f = f0();
  assert.equal(f.status, 'open');
  assert.equal(f.createdAt, '2026-11-01T00:00:00.000Z');
  assert.deepEqual(f.history, []);
  assert.throws(() => createFinding({ id: 'x' }), /required/);
});

test('happy path open -> in_progress -> resolved -> verified -> closed', () => {
  let f = f0();
  f = transition(f, 'in_progress', { actor: 'a' }, t(1));
  f = transition(f, 'resolved', { actor: 'a', note: 'Disabled TLS 1.0' }, t(2));
  assert.equal(f.resolvedAt, t(2).toISOString());
  f = transition(f, 'verified', { actor: 'b', note: 'Rescan clean' }, t(3));
  f = transition(f, 'closed', { actor: 'b', note: 'Done' }, t(4));
  assert.equal(f.status, 'closed');
  assert.equal(f.updatedAt, t(4).toISOString());
  assert.deepEqual(f.history.map((h) => h.to), ['in_progress', 'resolved', 'verified', 'closed']);
  assert.equal(f.history[1].from, 'in_progress');
});

test('invalid transitions are rejected', () => {
  assert.throws(() => transition(f0(), 'verified', { actor: 'a', note: 'n' }), /Invalid transition: open -> verified/);
  assert.throws(() => transition(f0(), 'bogus', { actor: 'a' }), /Unknown state/);
  assert.equal(canTransition('closed', 'resolved'), false);
});

test('actor and resolution notes are required where applicable', () => {
  const ip = transition(f0(), 'in_progress', { actor: 'a' }, t(1));
  assert.throws(() => transition(ip, 'resolved', { actor: 'a', note: '   ' }), /note is required/);
  assert.throws(() => transition(ip, 'resolved', { note: 'x' }), /actor is required/);
});

test('failed verification reopens work and clears resolvedAt; input not mutated', () => {
  let f = transition(f0(), 'in_progress', { actor: 'a' }, t(1));
  f = transition(f, 'resolved', { actor: 'a', note: 'fix' }, t(2));
  const before = structuredClone(f);
  const back = transition(f, 'in_progress', { actor: 'b', note: 'still vulnerable' }, t(3));
  assert.deepEqual(f, before);
  assert.equal(back.resolvedAt, null);
  assert.equal(back.history.length, 3);
});

test('availableTransitions returns a copy; label formats', () => {
  const f = f0();
  availableTransitions(f).push('x');
  assert.deepEqual(availableTransitions(f), ['in_progress', 'closed']);
  assert.equal(label('in_progress'), 'In progress');
});
