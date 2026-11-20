/**
 * <customer-report> web component (dependency-free).
 *
 * Renders a security compliance report for a customer: summary counts and a
 * table of control checks. All values are rendered as text (never HTML).
 *
 * Usage:
 *   const el = document.createElement('customer-report');
 *   el.data = {
 *     customer: 'Acme Corp',
 *     generatedAt: '2026-11-20',
 *     controls: [{ id: 'AC-1', name: 'Access policy', status: 'pass', notes: '' }],
 *   };
 *   document.body.append(el);
 *
 * Valid statuses: 'pass' | 'fail' | 'warning' | 'n/a'
 */
export const STATUSES = ['pass', 'fail', 'warning', 'n/a'];

export function summarize(controls = []) {
  const counts = { total: controls.length, pass: 0, fail: 0, warning: 0, 'n/a': 0 };
  for (const c of controls) {
    if (STATUSES.includes(c.status)) counts[c.status] += 1;
  }
  const scored = counts.pass + counts.fail + counts.warning;
  counts.score = scored ? Math.round((counts.pass / scored) * 100) : null;
  return counts;
}

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'className') node.className = v;
    else node.setAttribute(k, v);
  }
  for (const child of [].concat(children)) {
    node.append(child instanceof Node ? child : document.createTextNode(String(child ?? '')));
  }
  return node;
}

const STYLE = `
  :host { display: block; font-family: system-ui, sans-serif; color: #1a1a1a; }
  h2 { margin: 0 0 4px; }
  .meta { color: #666; font-size: 0.85em; margin-bottom: 12px; }
  .summary { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
  .tile { border: 1px solid #ddd; border-radius: 6px; padding: 8px 14px; min-width: 70px; }
  .tile b { display: block; font-size: 1.4em; }
  table { border-collapse: collapse; width: 100%; }
  th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #eee; }
  .badge { padding: 2px 8px; border-radius: 10px; font-size: 0.8em; font-weight: 600; }
  .pass { background: #d7f5dd; color: #14602a; }
  .fail { background: #fbd9d9; color: #8a1212; }
  .warning { background: #fdefc6; color: #7a5600; }
  .n-a { background: #e6e6e6; color: #444; }
  .empty { color: #666; font-style: italic; }
`;

export class CustomerReport extends HTMLElement {
  #data = { customer: '', generatedAt: '', controls: [] };

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  get data() { return this.#data; }
  set data(value) {
    this.#data = { customer: '', generatedAt: '', controls: [], ...(value || {}) };
    this.render();
  }

  connectedCallback() { this.render(); }

  render() {
    const { customer, generatedAt, controls } = this.#data;
    const s = summarize(controls);
    const root = this.shadowRoot;
    root.replaceChildren(el('style', {}, STYLE));

    root.append(
      el('h2', {}, `Security Compliance Report${customer ? ` – ${customer}` : ''}`),
      el('div', { className: 'meta' }, generatedAt ? `Generated ${generatedAt}` : ''),
    );

    const tiles = [
      ['Score', s.score === null ? '—' : `${s.score}%`],
      ['Pass', s.pass], ['Fail', s.fail], ['Warning', s.warning], ['N/A', s['n/a']],
    ];
    root.append(el('div', { className: 'summary', role: 'group', 'aria-label': 'Summary' },
      tiles.map(([label, value]) => el('div', { className: 'tile' }, [el('b', {}, value), label]))));

    if (!controls.length) {
      root.append(el('p', { className: 'empty' }, 'No controls to report.'));
      return;
    }

    const rows = controls.map((c) => {
      const status = STATUSES.includes(c.status) ? c.status : 'n/a';
      return el('tr', {}, [
        el('td', {}, c.id),
        el('td', {}, c.name),
        el('td', {}, el('span', { className: `badge ${status.replace('/', '-')}` }, status)),
        el('td', {}, c.notes || ''),
      ]);
    });
    root.append(el('table', {}, [
      el('thead', {}, el('tr', {}, ['ID', 'Control', 'Status', 'Notes'].map((h) => el('th', { scope: 'col' }, h)))),
      el('tbody', {}, rows),
    ]));
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('customer-report')) {
  customElements.define('customer-report', CustomerReport);
}
