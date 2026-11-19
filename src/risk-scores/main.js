import { levelForScore, sortRiskScores, label } from './model.js';
import { seedRiskScores } from './seed.js';

const $ = (id) => document.getElementById(id);

function el(tag, props = {}, text) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Render risk scores into the table; shows the empty state when there are none. */
export function renderRiskScores(items) {
  const rows = sortRiskScores(items);
  const body = $('risk-rows');
  body.replaceChildren();
  $('empty-state').hidden = rows.length > 0;
  $('risk-table').hidden = rows.length === 0;
  $('count').textContent = `${rows.length} items`;
  for (const r of rows) {
    const level = levelForScore(r.score);
    const lvl = el('td');
    lvl.append(el('span', { className: `badge badge-severity-${level}` }, label(level)));
    const tr = el('tr');
    tr.append(el('td', {}, r.id), el('td', {}, r.name), el('td', {}, String(r.score)), lvl);
    body.append(tr);
  }
}

renderRiskScores(seedRiskScores);
