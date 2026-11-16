import { TYPES, ENVIRONMENTS, CRITICALITIES, STATUSES, queryAssets, metrics, riskScore, riskLevel, toCsv } from './assets/model.js';
import { AssetStore } from './assets/store.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (iso) => new Date(iso).toISOString().slice(0, 10);

let store;
const view = { search: '', type: '', environment: '', criticality: '', status: '', sortBy: 'risk', sortDir: 'desc' };
let editingId = null;

const badge = (label) => `<span class="badge b-${esc(label)}">${esc(label)}</span>`;
const riskBadge = (a) => { const s = riskScore(a); return `<span class="badge b-${riskLevel(s)}" title="Risk score ${s}/100">${s} · ${riskLevel(s)}</span>`; };

function renderMetrics() {
  const m = metrics(store.assets);
  const dl = (o) => `<dl>${Object.entries(o).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('')}</dl>`;
  $('#metrics').innerHTML = `
    <div class="card"><h2>Total assets</h2><div class="n">${m.total}</div><div class="sub">${m.active} not decommissioned</div></div>
    <div class="card"><h2>Critical in production</h2><div class="n">${m.criticalProd}</div></div>
    <div class="card"><h2>High-risk assets</h2><div class="n">${m.highRisk}</div><div class="sub">Risk score ≥ 50 · average ${m.avgRisk}</div></div>
    <div class="card"><h2>By criticality</h2>${dl(m.byCriticality)}</div>
    <div class="card"><h2>By status</h2>${dl(m.byStatus)}</div>`;
}

function renderTable() {
  const rows = queryAssets(store.assets, view);
  $('#count').textContent = `Showing ${rows.length} of ${store.assets.length} assets`;
  const wrap = $('#tablewrap');
  if (store.error && !store.assets.length) {
    wrap.innerHTML = `<div class="empty"><p class="error">${esc(store.error)}</p><button class="btn" id="retry">Retry</button> <button class="btn" id="reset2">Reset demo data</button></div>`;
    $('#retry').onclick = () => { store.load(); render(); };
    $('#reset2').onclick = resetDemo;
    return;
  }
  if (!rows.length) {
    const none = !store.assets.length;
    wrap.innerHTML = `<div class="empty"><p><strong>${none ? 'No assets yet.' : 'No assets match your filters.'}</strong></p>
      <p class="muted">${none ? 'Add your first asset to start tracking risk.' : 'Try clearing filters or changing your search.'}</p></div>`;
    return;
  }
  const th = (key, label) => {
    const on = view.sortBy === key;
    return `<th scope="col" aria-sort="${on ? (view.sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}"><button type="button" data-sort="${key}">${label}${on ? (view.sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</button></th>`;
  };
  wrap.innerHTML = `<table aria-label="Asset inventory"><thead><tr>
    ${th('name', 'Asset')}${th('type', 'Type')}${th('owner', 'Owner')}${th('environment', 'Environment')}${th('criticality', 'Criticality')}${th('status', 'Status')}${th('risk', 'Risk')}${th('updatedAt', 'Updated')}<th scope="col">Actions</th>
    </tr></thead><tbody>${rows.map((a) => `<tr>
      <td><button type="button" class="name" data-view="${esc(a.id)}">${esc(a.name)}</button><div class="sub">${esc(a.identifier)}</div></td>
      <td>${esc(a.type)}</td><td>${esc(a.owner)}</td><td>${esc(a.environment)}</td><td>${badge(a.criticality)}</td><td>${esc(a.status)}</td>
      <td>${riskBadge(a)}</td><td>${fmt(a.updatedAt)}</td>
      <td><button type="button" class="btn" data-edit="${esc(a.id)}" aria-label="Edit ${esc(a.name)}">Edit</button></td></tr>`).join('')}</tbody></table>`;
}

function render() {
  $('#alert').textContent = store.error && store.assets.length ? store.error : '';
  renderMetrics();
  renderTable();
}

const opt = (list, sel, blank) => (blank ? `<option value="">${blank}</option>` : '') + list.map((v) => `<option${v === sel ? ' selected' : ''}>${esc(v)}</option>`).join('');

function openForm(id = null) {
  editingId = id;
  const a = id ? store.get(id) : { type: TYPES[0], environment: 'Production', criticality: 'Medium', status: 'Active' };
  $('#form-title').textContent = id ? `Edit ${a.name}` : 'Add asset';
  $('#form-error').textContent = '';
  const f = (name, label, input, cls = '') => `<label class="${cls}">${label}${input}<span class="error" id="err-${name}"></span></label>`;
  const txt = (n, v, extra = '') => `<input name="${n}" value="${esc(v)}" ${extra}>`;
  $('#form-fields').innerHTML =
    f('name', 'Name *', txt('name', a.name ?? '', 'required maxlength="80"')) +
    f('type', 'Type *', `<select name="type">${opt(TYPES, a.type)}</select>`) +
    f('identifier', 'Identifier * (hostname, IP, ARN…)', txt('identifier', a.identifier ?? '', 'required maxlength="200"'), 'full') +
    f('owner', 'Owner *', txt('owner', a.owner ?? '', 'required maxlength="80"')) +
    f('environment', 'Environment *', `<select name="environment">${opt(ENVIRONMENTS, a.environment)}</select>`) +
    f('criticality', 'Criticality *', `<select name="criticality">${opt(CRITICALITIES, a.criticality)}</select>`) +
    f('status', 'Lifecycle status *', `<select name="status">${opt(STATUSES, a.status)}</select>`) +
    f('notes', 'Notes', `<textarea name="notes" rows="3" maxlength="1000">${esc(a.notes ?? '')}</textarea>`, 'full') +
    (id ? `<div class="full"><button type="button" class="btn danger" id="delete">Delete asset</button></div>` : '');
  const del = $('#delete');
  if (del) del.onclick = () => {
    if (confirm(`Delete "${a.name}"? This cannot be undone. Consider setting status to Decommissioned instead.`)) {
      store.remove(id); $('#form-dialog').close(); render();
    }
  };
  $('#form-dialog').showModal();
  $('#form-fields input').focus();
}

function showErrors(errors) {
  for (const el of document.querySelectorAll('#form-fields [name]')) {
    const msg = errors[el.name] ?? '';
    el.toggleAttribute('aria-invalid', !!msg);
    if (msg) { el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', `err-${el.name}`); } else el.removeAttribute('aria-invalid');
    const slot = $(`#err-${el.name}`); if (slot) slot.textContent = msg;
  }
  $('#form-error').textContent = errors._form ?? '';
  const first = document.querySelector('#form-fields [aria-invalid="true"]');
  if (first) first.focus();
}

function openDetail(id) {
  const a = store.get(id); if (!a) return;
  $('#detail').innerHTML = `<h2 id="detail-title">${esc(a.name)}</h2>
    <dl class="dl"><dt>Identifier</dt><dd>${esc(a.identifier)}</dd><dt>Type</dt><dd>${esc(a.type)}</dd><dt>Owner</dt><dd>${esc(a.owner)}</dd>
    <dt>Environment</dt><dd>${esc(a.environment)}</dd><dt>Criticality</dt><dd>${badge(a.criticality)}</dd><dt>Status</dt><dd>${esc(a.status)}</dd>
    <dt>Risk score</dt><dd>${riskBadge(a)} <meter min="0" max="100" value="${riskScore(a)}" aria-label="Risk score"></meter>
      <div class="sub">Derived from criticality and environment exposure; decommissioned assets score 0.</div></dd>
    <dt>Notes</dt><dd>${esc(a.notes) || '<span class="muted">None</span>'}</dd>
    <dt>Created</dt><dd>${fmt(a.createdAt)}</dd><dt>Updated</dt><dd>${fmt(a.updatedAt)}</dd></dl>
    <div class="actions end"><button class="btn" data-close>Close</button><button class="btn primary" id="detail-edit">Edit</button></div>`;
  $('#detail-edit').onclick = () => { $('#detail-dialog').close(); openForm(id); };
  $('#detail-dialog').showModal();
}

function resetDemo() {
  if (!confirm('Replace all assets in this browser with the demo data?')) return;
  store.resetDemoData(); store.load(); render();
}

function init() {
  store = new AssetStore();
  const f = $('#filters');
  f.type.innerHTML = opt(TYPES, '', 'All types');
  f.environment.innerHTML = opt(ENVIRONMENTS, '', 'All environments');
  f.criticality.innerHTML = opt(CRITICALITIES, '', 'All criticalities');
  f.status.innerHTML = opt(STATUSES, '', 'All statuses');
  const sync = () => { for (const k of ['search', 'type', 'environment', 'criticality', 'status']) view[k] = f[k].value; render(); };
  f.addEventListener('input', sync);
  f.addEventListener('reset', () => setTimeout(sync));
  f.addEventListener('submit', (e) => e.preventDefault());

  $('#add').onclick = () => openForm();
  $('#reset').onclick = resetDemo;
  $('#export').onclick = () => {
    const rows = queryAssets(store.assets, view);
    const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'assets.csv' });
    a.click(); URL.revokeObjectURL(url);
  };
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.sort) {
      view.sortDir = view.sortBy === t.dataset.sort && view.sortDir === 'asc' ? 'desc' : 'asc';
      view.sortBy = t.dataset.sort; renderTable();
      document.querySelector(`[data-sort="${view.sortBy}"]`)?.focus();
    } else if (t.dataset.view) openDetail(t.dataset.view);
    else if (t.dataset.edit) openForm(t.dataset.edit);
    else if ('close' in t.dataset) t.closest('dialog').close();
  });
  $('#asset-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const res = editingId ? store.update(editingId, data) : store.create(data);
    if (res.errors) return showErrors(res.errors);
    $('#form-dialog').close(); render();
  });
  render();
}

init();
