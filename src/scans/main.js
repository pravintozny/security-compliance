import { SCAN_TYPES, SCHEDULES, STATUSES, SEVERITIES, TRANSITIONS, queryScans, metrics, totalFindings, toCsv } from './model.js';
import { ScanStore } from './store.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '—');
const cap = (s) => s[0].toUpperCase() + s.slice(1);

let store;
const view = { search: '', type: '', schedule: '', status: '', sortBy: 'updatedAt', sortDir: 'desc' };
let editingId = null;
let finishingId = null;

const badge = (label) => `<span class="badge b-${esc(label)}">${esc(label)}</span>`;
const findingsCell = (s) => (['Completed'].includes(s.status)
  ? `<div class="findings" title="${totalFindings(s)} findings">${SEVERITIES.map((k) => `<span class="badge b-${k}" aria-label="${s.findings[k]} ${k}">${cap(k[0])}:${s.findings[k]}</span>`).join('')}</div>`
  : '<span class="muted">—</span>');

function renderMetrics() {
  const m = metrics(store.scans);
  const dl = (o) => `<dl>${Object.entries(o).map(([k, v]) => `<dt>${esc(cap(k))}</dt><dd>${v}</dd>`).join('')}</dl>`;
  $('#metrics').innerHTML = `
    <div class="card"><h2>Total scans</h2><div class="n">${m.total}</div><div class="sub">${m.scheduled} scheduled</div></div>
    <div class="card"><h2>Running</h2><div class="n">${m.running}</div></div>
    <div class="card"><h2>Failed</h2><div class="n">${m.failed}</div><div class="sub">${m.successRate === null ? 'No finished scans' : `Success rate ${m.successRate}%`}</div></div>
    <div class="card"><h2>Findings (completed scans)</h2>${dl(m.findings)}</div>
    <div class="card"><h2>By status</h2>${dl(m.byStatus)}</div>`;
}

function actionsFor(s) {
  const b = (attr, label, cls = '') => `<button type="button" class="btn ${cls}" data-${attr}="${esc(s.id)}" aria-label="${label} ${esc(s.name)}">${label}</button>`;
  const next = TRANSITIONS[s.status] ?? [];
  return [
    next.includes('Running') ? b('start', 'Start') : '',
    s.status === 'Running' ? b('finish', 'Record results') : '',
    next.includes('Cancelled') ? b('cancel', 'Cancel') : '',
    next.includes('Scheduled') ? b('requeue', 'Re-queue') : '',
    b('edit', 'Edit'),
  ].join('');
}

function renderTable() {
  const rows = queryScans(store.scans, view);
  $('#count').textContent = `Showing ${rows.length} of ${store.scans.length} scans`;
  const wrap = $('#tablewrap');
  if (store.error && !store.scans.length) {
    wrap.innerHTML = `<div class="empty"><p class="error">${esc(store.error)}</p><button class="btn" id="retry">Retry</button> <button class="btn" id="reset2">Reset demo data</button></div>`;
    $('#retry').onclick = () => { store.load(); render(); };
    $('#reset2').onclick = resetDemo;
    return;
  }
  if (!rows.length) {
    const empty = !store.scans.length;
    wrap.innerHTML = `<div class="empty"><p><strong>${empty ? 'No scans yet.' : 'No scans match your filters.'}</strong></p>
      <p class="muted">${empty ? 'Create your first scan to start tracking findings.' : 'Try clearing filters or changing your search.'}</p></div>`;
    return;
  }
  const th = (key, label) => {
    const on = view.sortBy === key;
    return `<th scope="col" aria-sort="${on ? (view.sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}"><button type="button" data-sort="${key}">${label}${on ? (view.sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</button></th>`;
  };
  wrap.innerHTML = `<table aria-label="Scans"><thead><tr>
    ${th('name', 'Scan')}${th('type', 'Type')}${th('owner', 'Owner')}${th('schedule', 'Schedule')}${th('status', 'Status')}${th('findings', 'Findings')}${th('updatedAt', 'Updated')}<th scope="col">Actions</th>
    </tr></thead><tbody>${rows.map((s) => `<tr>
      <td><button type="button" class="name" data-view="${esc(s.id)}">${esc(s.name)}</button><div class="sub">${esc(s.target)}</div></td>
      <td>${esc(s.type)}</td><td>${esc(s.owner)}</td><td>${esc(s.schedule)}</td><td>${badge(s.status)}</td>
      <td>${findingsCell(s)}</td><td>${fmt(s.updatedAt)}</td><td><div class="actions">${actionsFor(s)}</div></td></tr>`).join('')}</tbody></table>`;
}

function render() {
  $('#alert').textContent = store.error && store.scans.length ? store.error : '';
  renderMetrics();
  renderTable();
}

const opt = (list, sel, blank) => (blank ? `<option value="">${blank}</option>` : '') + list.map((v) => `<option${v === sel ? ' selected' : ''}>${esc(v)}</option>`).join('');
const field = (name, label, input, cls = '') => `<label class="${cls}">${label}${input}<span class="error" id="err-${name}"></span></label>`;

function openForm(id = null) {
  editingId = id;
  const s = id ? store.get(id) : { type: SCAN_TYPES[0], schedule: 'On demand' };
  $('#form-title').textContent = id ? `Edit ${s.name}` : 'New scan';
  $('#form-error').textContent = '';
  const txt = (n, v, extra = '') => `<input name="${n}" value="${esc(v)}" ${extra}>`;
  $('#form-fields').innerHTML =
    field('name', 'Name *', txt('name', s.name ?? '', 'required maxlength="80"')) +
    field('type', 'Scan type *', `<select name="type">${opt(SCAN_TYPES, s.type)}</select>`) +
    field('target', 'Target * (hostname, IP, URL, image…)', txt('target', s.target ?? '', 'required maxlength="200"'), 'full') +
    field('owner', 'Owner *', txt('owner', s.owner ?? '', 'required maxlength="80"')) +
    field('schedule', 'Schedule *', `<select name="schedule">${opt(SCHEDULES, s.schedule)}</select>`) +
    field('notes', 'Notes', `<textarea name="notes" rows="3" maxlength="1000">${esc(s.notes ?? '')}</textarea>`, 'full') +
    (id ? `<div class="full"><button type="button" class="btn danger" id="delete">Delete scan</button></div>` : '');
  const del = $('#delete');
  if (del) del.onclick = () => {
    if (confirm(`Delete "${s.name}"? This cannot be undone.`)) { store.remove(id); $('#form-dialog').close(); render(); }
  };
  $('#form-dialog').showModal();
  $('#form-fields input').focus();
}

function showErrors(root, errBox, errors) {
  for (const el of document.querySelectorAll(`${root} [name]`)) {
    const msg = errors[el.name] ?? '';
    if (msg) { el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', `err-${el.name}`); } else el.removeAttribute('aria-invalid');
    const slot = $(`#err-${el.name}`); if (slot) slot.textContent = msg;
  }
  $(errBox).textContent = errors._form ?? '';
  document.querySelector(`${root} [aria-invalid="true"]`)?.focus();
}

function openResults(id) {
  finishingId = id;
  const s = store.get(id); if (!s) return;
  $('#results-title').textContent = `Record results: ${s.name}`;
  $('#results-error').textContent = '';
  $('#results-fields').innerHTML =
    field('outcome', 'Outcome *', `<select name="outcome">${opt(['Completed', 'Failed'], 'Completed')}</select>`, 'full') +
    SEVERITIES.map((k) => field(k, `${cap(k)} findings`, `<input name="${k}" type="number" min="0" step="1" value="0" inputmode="numeric">`)).join('') +
    `<p class="sub full">Counts are ignored when the outcome is Failed.</p>`;
  $('#results-dialog').showModal();
}

function openDetail(id) {
  const s = store.get(id); if (!s) return;
  const done = s.status === 'Completed';
  $('#detail').innerHTML = `<h2 id="detail-title">${esc(s.name)}</h2>
    <dl class="dl"><dt>Target</dt><dd>${esc(s.target)}</dd><dt>Type</dt><dd>${esc(s.type)}</dd><dt>Owner</dt><dd>${esc(s.owner)}</dd>
    <dt>Schedule</dt><dd>${esc(s.schedule)}</dd><dt>Status</dt><dd>${badge(s.status)}</dd>
    <dt>Findings</dt><dd>${done ? `${totalFindings(s)} total ${findingsCell(s)}` : '<span class="muted">No results recorded</span>'}</dd>
    <dt>Notes</dt><dd>${esc(s.notes) || '<span class="muted">None</span>'}</dd>
    <dt>Started</dt><dd>${fmt(s.startedAt)}</dd><dt>Finished</dt><dd>${fmt(s.finishedAt)}</dd>
    <dt>Created</dt><dd>${fmt(s.createdAt)}</dd><dt>Updated</dt><dd>${fmt(s.updatedAt)}</dd></dl>
    <div class="actions end"><button class="btn" data-close>Close</button><button class="btn primary" id="detail-edit">Edit</button></div>`;
  $('#detail-edit').onclick = () => { $('#detail-dialog').close(); openForm(id); };
  $('#detail-dialog').showModal();
}

function resetDemo() {
  if (!confirm('Replace all scans in this browser with the demo data?')) return;
  store.resetDemoData(); store.load(); render();
}

function change(id, to, confirmMsg) {
  if (confirmMsg && !confirm(confirmMsg)) return;
  const res = store.transition(id, to);
  if (res.errors) $('#alert').textContent = res.errors._form;
  else render();
}

function init() {
  store = new ScanStore();
  const f = $('#filters');
  f.type.innerHTML = opt(SCAN_TYPES, '', 'All types');
  f.schedule.innerHTML = opt(SCHEDULES, '', 'All schedules');
  f.status.innerHTML = opt(STATUSES, '', 'All statuses');
  const sync = () => { for (const k of ['search', 'type', 'schedule', 'status']) view[k] = f[k].value; render(); };
  f.addEventListener('input', sync);
  f.addEventListener('reset', () => setTimeout(sync));
  f.addEventListener('submit', (e) => e.preventDefault());

  $('#add').onclick = () => openForm();
  $('#reset').onclick = resetDemo;
  $('#export').onclick = () => {
    const url = URL.createObjectURL(new Blob([toCsv(queryScans(store.scans, view))], { type: 'text/csv' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'scans.csv' });
    a.click(); URL.revokeObjectURL(url);
  };
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return;
    const d = t.dataset;
    if (d.sort) {
      view.sortDir = view.sortBy === d.sort && view.sortDir === 'asc' ? 'desc' : 'asc';
      view.sortBy = d.sort; renderTable();
      document.querySelector(`[data-sort="${view.sortBy}"]`)?.focus();
    } else if (d.view) openDetail(d.view);
    else if (d.edit) openForm(d.edit);
    else if (d.start) change(d.start, 'Running');
    else if (d.cancel) change(d.cancel, 'Cancelled', 'Cancel this scan?');
    else if (d.requeue) change(d.requeue, 'Scheduled', 'Re-queue this scan? Previous results will be cleared.');
    else if (d.finish) openResults(d.finish);
    else if ('close' in d) t.closest('dialog').close();
  });
  $('#scan-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const res = editingId ? store.update(editingId, data) : store.create(data);
    if (res.errors) return showErrors('#form-fields', '#form-error', res.errors);
    $('#form-dialog').close(); render();
  });
  $('#results-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const res = store.finish(finishingId, Object.fromEntries(new FormData(e.target)));
    if (res.errors) return showErrors('#results-fields', '#results-error', res.errors);
    $('#results-dialog').close(); render();
  });
  render();
}

init();
