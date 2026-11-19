import { SEVERITIES, STATUSES, filterIncidents, sortIncidents, label } from './model.js';
import { seedIncidents } from './seed.js';

const state = { severity: 'all', status: 'all' };
const $ = (id) => document.getElementById(id);

function el(tag, props = {}, text) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  if (text !== undefined) node.textContent = text;
  return node;
}

const badge = (kind, value) => el('span', { className: `badge badge-${kind}-${value}` }, label(value));

function fillSelect(select, values, name) {
  select.append(el('option', { value: 'all' }, `All ${name}`));
  for (const v of values) select.append(el('option', { value: v }, label(v)));
}

function render() {
  const rows = sortIncidents(filterIncidents(seedIncidents, state));
  const body = $('incident-rows');
  body.replaceChildren();
  $('empty-state').hidden = rows.length > 0;
  $('incident-table').hidden = rows.length === 0;
  $('count').textContent = `${rows.length} of ${seedIncidents.length} incidents`;
  for (const i of rows) {
    const tr = el('tr');
    const sev = el('td'); sev.append(badge('severity', i.severity));
    const st = el('td'); st.append(badge('status', i.status));
    tr.append(el('td', {}, i.id), el('td', {}, i.title), sev, st, el('td', {}, i.reportedAt), el('td', {}, i.owner));
    body.append(tr);
  }
}

fillSelect($('filter-severity'), SEVERITIES, 'severities');
fillSelect($('filter-status'), STATUSES, 'statuses');
$('filter-severity').addEventListener('change', (e) => { state.severity = e.target.value; render(); });
$('filter-status').addEventListener('change', (e) => { state.status = e.target.value; render(); });
$('clear-filters').addEventListener('click', () => {
  state.severity = state.status = 'all';
  $('filter-severity').value = $('filter-status').value = 'all';
  render();
});
render();
