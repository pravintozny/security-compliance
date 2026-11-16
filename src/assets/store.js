// Persistence layer. There is NO backend: assets are stored in the browser's localStorage (demo mode).
// The interface is async-free but isolated here so a real API client can replace it later.
import { validateAsset } from './model.js';
import { SEED_ASSETS } from './seed.js';

export const STORAGE_KEY = 'sc.assets.v1';

export class AssetStore {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
    this.assets = [];
    this.error = null;
    this.load();
  }

  load() {
    this.error = null;
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (raw === null) { this.assets = structuredClone(SEED_ASSETS); this.#save(); return; }
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) throw new Error('Stored data has an unexpected shape.');
      this.assets = data.filter((a) => a && typeof a.id === 'string' && !validateAsset(a).errors.name);
    } catch (e) {
      this.assets = [];
      this.error = `Could not load saved assets: ${e.message}`;
    }
  }

  #save() {
    try { this.storage.setItem(STORAGE_KEY, JSON.stringify(this.assets)); this.error = null; return true; }
    catch (e) { this.error = `Could not save changes: ${e.message}`; return false; }
  }

  get(id) { return this.assets.find((a) => a.id === id); }

  /** Returns { asset } or { errors }. */
  create(input) {
    const { value, errors } = validateAsset(input, this.assets);
    if (Object.keys(errors).length) return { errors };
    const now = new Date().toISOString();
    const asset = { ...value, id: `ast-${crypto.randomUUID()}`, createdAt: now, updatedAt: now };
    this.assets.push(asset);
    return this.#save() ? { asset } : { errors: { _form: this.error } };
  }

  update(id, input) {
    const cur = this.get(id);
    if (!cur) return { errors: { _form: 'Asset no longer exists.' } };
    const { value, errors } = validateAsset(input, this.assets, id);
    if (Object.keys(errors).length) return { errors };
    Object.assign(cur, value, { updatedAt: new Date().toISOString() });
    return this.#save() ? { asset: cur } : { errors: { _form: this.error } };
  }

  remove(id) {
    this.assets = this.assets.filter((a) => a.id !== id);
    return this.#save();
  }

  resetDemoData() {
    this.assets = structuredClone(SEED_ASSETS);
    return this.#save();
  }
}
