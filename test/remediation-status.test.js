import { test } from 'node:test';
import assert from 'node:assert/strict';
import { effectiveStatus, summarizeRemediation, statusLabel } from '../src/remediation-status/model.js';

const today = '2026-06-15';
const findings = [
  { id: 'F-1', title: 'a', status: 'open', dueDate: '2026-07-01' },
  { id: 'F-2', title: 'b', status: 'open', dueDate: '2026-06-01' },
  { id: 'F-3', title: 'c', status: 'in_progress', dueDate: '2026-06-10' },
  { id: 'F-4', title: 'd', status: 'in_progress', dueDate: '2026-06-30' },
  { id: 'F-5', title: 'e', status: 'resolved', dueDate: '2026-01-01' },
];

test('unresolved past-due findings are overdue; resolved never is', () => {
  assert.equal(effectiveStatus(findings[1], today), 'overdue');
  assert.equal(effectiveStatus(findings[4], today), 'resolved');
  assert.equal(effectiveStatus({ ...findings[0], dueDate: today }, today), 'open');
});

test('summarizeRemediation counts each effective status', () => {
  assert.deepEqual(summarizeRemediation(findings, today), {
    open: 1, in_progress: 1, resolved: 1, overdue: 2, total: 5,
  });
});

test('summarizeRemediation handles empty input', () => {
  assert.deepEqual(summarizeRemediation([], today), { open: 0, in_progress: 0, resolved: 0, overdue: 0, total: 0 });
});

test('statusLabel', () => assert.equal(statusLabel('in_progress'), 'In progress'));
