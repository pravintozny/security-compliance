import { prioritizeRisks, label } from './model.js';
import { seedRisks } from './seed.js';

const $ = (id) => document.getElementById(id);

function el(tag, props = {}, text) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Render ranked risks into the table; shows the empty state when there are none. */
export function renderRiskPrioritization(risks) {
  const rows = prioritizeRisks(risks);
  const body = $('risk-rows');
  body.replaceChildren();
  $('empty-state').hidden = rows.length > 0;
  $('risk-table').hidden = rows.length === 0;
  $('count').textContent = `${rows.length} risks`;
  for (const r of rows) {
    const pri = el('td');
    pri.append(el('span', { className: `badge badge-priority-${r.bucket}` }, label(r.bucket)));
    const tr = el('tr');
    tr.append(
      el('td', {}, String(r.rank)), el('td', {}, r.id), el('td', {}, r.name),
      el('td', {}, String(r.severity)), el('td', {}, String(r.likelihood)),
      el('td', {}, String(r.score)), pri,
    );
    body.append(tr);
  }
}

renderRiskPrioritization(seedRisks);
