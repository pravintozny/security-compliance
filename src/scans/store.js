// Persistence layer. There is NO backend and NO scanner: scans are stored in the browser's localStorage (demo mode).
// Lifecycle changes only record state and user-entered results; no scan is ever actually executed.
import { validateScan, validateResults, canTransition } from './model.js';
import { SEED_SCANS } from './seed.js';

export const STORAGE_KEY = 'sc.scans.v1';
const ZERO = { critical: 0, high: 0, medium: 0, low: 0 };

export class ScanStore {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
    this.scans = [];
    this.error = null;
    this.load();
  }

  load() {
    this.error = null;
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (raw === null) { this.scans = structuredClone(SEED_SCANS); this.#save(); return; }
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) throw new Error('Stored data has an unexpected shape.');
      this.scans = data.filter((s) => s && typeof s.id === 'string' && !validateScan(s).errors.name && typeof s.status === 'string')
        .map((s) => ({ ...s, findings: { ...ZERO, ...(s.findings ?? {}) } }));
    } catch (e) {
      this.scans = [];
      this.error = `Could not load saved scans: ${e.message}`;
    }
  }

  #save() {
    try { this.storage.setItem(STORAGE_KEY, JSON.stringify(this.scans)); this.error = null; return true; }
    catch (e) { this.error = `Could not save changes: ${e.message}`; return false; }
  }

  get(id) { return this.scans.find((s) => s.id === id); }

  /** Returns { scan } or { errors }. */
  create(input) {
    const { value, errors } = validateScan(input, this.scans);
    if (Object.keys(errors).length) return { errors };
    const now = new Date().toISOString();
    const scan = { ...value, id: `scn-${crypto.randomUUID()}`, status: 'Scheduled', findings: { ...ZERO }, startedAt: null, finishedAt: null, createdAt: now, updatedAt: now };
    this.scans.push(scan);
    return this.#save() ? { scan } : { errors: { _form: this.error } };
  }

  update(id, input) {
    const cur = this.get(id);
    if (!cur) return { errors: { _form: 'Scan no longer exists.' } };
    const { value, errors } = validateScan(input, this.scans, id);
    if (Object.keys(errors).length) return { errors };
    Object.assign(cur, value, { updatedAt: new Date().toISOString() });
    return this.#save() ? { scan: cur } : { errors: { _form: this.error } };
  }

  /** Move a scan through its lifecycle (start, cancel, re-queue). Use finish() to record results. */
  transition(id, to) {
    const cur = this.get(id);
    if (!cur) return { errors: { _form: 'Scan no longer exists.' } };
    if (to === 'Completed' || to === 'Failed') return { errors: { _form: 'Use finish() to record results.' } };
    if (!canTransition(cur.status, to)) return { errors: { _form: `Cannot change a ${cur.status} scan to ${to}.` } };
    const now = new Date().toISOString();
    if (to === 'Running') Object.assign(cur, { startedAt: now, finishedAt: null, findings: { ...ZERO } });
    else if (to === 'Cancelled') cur.finishedAt = now;
    else if (to === 'Scheduled') Object.assign(cur, { startedAt: null, finishedAt: null, findings: { ...ZERO } });
    cur.status = to; cur.updatedAt = now;
    return this.#save() ? { scan: cur } : { errors: { _form: this.error } };
  }

  /** Record the outcome of a running scan: { outcome: 'Completed'|'Failed', critical, high, medium, low }. */
  finish(id, input) {
    const cur = this.get(id);
    if (!cur) return { errors: { _form: 'Scan no longer exists.' } };
    if (cur.status !== 'Running') return { errors: { _form: 'Only running scans can be finished.' } };
    const { value, errors } = validateResults(input);
    if (Object.keys(errors).length) return { errors };
    const now = new Date().toISOString();
    Object.assign(cur, { status: value.outcome, findings: value.outcome === 'Failed' ? { ...ZERO } : value.findings, finishedAt: now, updatedAt: now });
    return this.#save() ? { scan: cur } : { errors: { _form: this.error } };
  }

  remove(id) {
    this.scans = this.scans.filter((s) => s.id !== id);
    return this.#save();
  }

  resetDemoData() {
    this.scans = structuredClone(SEED_SCANS);
    return this.#save();
  }
}
