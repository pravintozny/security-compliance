import { initials, normalizeEngineers } from './model.js';

/**
 * Render the engineers assigned to a compliance item (avatar initials, name, role).
 * @param {Object} props
 * @param {import('./model.js').Engineer[]} props.engineers
 * @returns {HTMLElement}
 */
export function AssignedEngineers({ engineers }) {
  const people = normalizeEngineers(engineers);
  const root = document.createElement('section');
  root.className = 'assigned-engineers';
  root.setAttribute('aria-label', 'Assigned engineers');

  if (people.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'assigned-engineers-empty';
    empty.textContent = 'No engineers assigned';
    root.append(empty);
    return root;
  }

  const list = document.createElement('ul');
  for (const person of people) {
    const item = document.createElement('li');
    const avatar = document.createElement('span');
    avatar.className = 'avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = initials(person.name);
    const name = document.createElement('strong');
    name.textContent = person.name;
    item.append(avatar, name);
    if (person.role) {
      const role = document.createElement('span');
      role.className = 'engineer-role';
      role.textContent = person.role;
      item.append(role);
    }
    list.append(item);
  }
  const total = document.createElement('p');
  total.className = 'assigned-engineers-total';
  total.textContent = `${people.length} ${people.length === 1 ? 'engineer' : 'engineers'}`;
  root.append(list, total);
  return root;
}
