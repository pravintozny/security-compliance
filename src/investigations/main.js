import { sortInvestigations, label, formatTimestamp } from './model.js';
import { seedInvestigations } from './seed.js';

function el(tag, props = {}, text) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  if (text !== undefined) node.textContent = text;
  return node;
}

export function render(items, list, empty) {
  list.replaceChildren();
  empty.hidden = items.length > 0;
  list.hidden = items.length === 0;
  for (const i of sortInvestigations(items)) {
    const li = el('li', { className: 'entry' });
    const head = el('div', { className: 'entry-head' });
    head.append(
      el('span', { className: 'entry-id' }, i.id),
      el('strong', {}, i.title),
      el('span', { className: `badge badge-status-${i.status}` }, label(i.status)),
    );
    const time = el('time', { dateTime: i.updatedAt }, formatTimestamp(i.updatedAt));
    const meta = el('p', { className: 'entry-meta' });
    meta.append(time, ` · ${i.actor} · started ${formatTimestamp(i.createdAt)}`);
    li.append(head, meta, el('p', { className: 'entry-summary' }, i.summary));
    list.append(li);
  }
}

render(seedInvestigations, document.getElementById('investigation-list'), document.getElementById('empty-state'));
