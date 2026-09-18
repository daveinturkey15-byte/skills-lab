/**
 * src/atlas/views/techniques.ts — the browser-venue sources, as what they are.
 *
 * Same visual language as sources.ts (same helpers, same class names, same
 * expanded sections) over the subset venueFor() routes to `browser`: the
 * full method text, skills with relations, limitations, evidence with pins
 * and dates, the licence finding, the blocker where there is one, and every
 * URL by kind. Search runs over the in-memory list: instant, no re-fetch.
 * This is the authoritative presentation for these sources, not a stub
 * pointing at the world — the Map 3 door still opens and is linked below.
 */
import type { CatalogSource } from '../catalog';
import { venueFor } from '../../world/venue';
import { chip, demoAffordance, el, linkGroups } from './shared';

export interface TechniquesState {
  query: string;
  expandedId: number | null;
}

export function emptyTechniquesState(): TechniquesState {
  return { query: '', expandedId: null };
}

function matches(source: CatalogSource, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    source.title,
    source.method ?? '',
    venueFor(source).reason,
    (source.skillMappings ?? []).map((m) => `${m.skill} ${m.relation}`).join(' '),
    (source.urls ?? []).map((u) => `${u.kind} ${u.label} ${u.url}`).join(' '),
  ].join('\n').toLowerCase();
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

function expandedBody(source: CatalogSource): HTMLElement {
  const body = el('div', 'atlas-detail-body');

  body.appendChild(el('p', 'atlas-statusline', `Venue: browser — ${venueFor(source).reason}.`));

  body.appendChild(el('h4', undefined, 'Method'));
  body.appendChild(el('p', undefined, source.method ?? 'Not recorded — the method was never extracted for this source.'));

  body.appendChild(el('h4', undefined, 'Licence'));
  const licences = (source.urls ?? []).filter((u) => u.kind === 'licence');
  body.appendChild(licences.length === 0
    ? el('p', undefined, 'No licence finding recorded.')
    : el('p', undefined, `Licence terms read: ${licences.map((u) => u.label).join('; ')}. Full URLs under Links below.`));

  const skills = source.skillMappings ?? [];
  body.appendChild(el('h4', undefined, 'Skills'));
  if (skills.length === 0) {
    body.appendChild(el('p', undefined, 'Feeds no skill.'));
  } else {
    const list = el('ul');
    for (const m of skills) list.appendChild(el('li', undefined, `${m.skill} (${m.relation})`));
    body.appendChild(list);
  }

  const limitations = source.limitations ?? [];
  body.appendChild(el('h4', undefined, 'Limitations'));
  if (limitations.length === 0) {
    body.appendChild(el('p', undefined, 'None recorded.'));
  } else {
    const list = el('ul');
    for (const item of limitations) list.appendChild(el('li', undefined, item));
    body.appendChild(list);
  }

  const evidence = source.evidence ?? [];
  body.appendChild(el('h4', undefined, 'Evidence'));
  if (evidence.length === 0) {
    body.appendChild(el('p', undefined, 'No inspection evidence recorded.'));
  } else {
    const list = el('ul');
    for (const item of evidence) {
      const row = el('li');
      const link = el('a', undefined, item.url);
      link.setAttribute('href', item.url);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      row.appendChild(link);
      const meta: string[] = [];
      if (item.inspectedAt) meta.push(`inspected ${item.inspectedAt}`);
      if (item.pin) meta.push(`pin ${item.pin.slice(0, 7)}`);
      if (meta.length > 0) row.appendChild(document.createTextNode(` (${meta.join(' · ')})`));
      if (item.observation) row.appendChild(el('p', undefined, item.observation));
      list.appendChild(row);
    }
    body.appendChild(list);
  }

  const blocker = source.blocker;
  if (blocker && (blocker.reason ?? blocker.unblockAction ?? blocker.test ?? blocker.experiment ?? blocker.resources)) {
    const box = el('div', 'atlas-blocker');
    box.appendChild(el('h4', undefined, 'Blocker'));
    const fields: Array<[string, string | undefined]> = [
      ['Reason', blocker.reason],
      ['Unblock action', blocker.unblockAction],
      ['Test', blocker.test],
      ['Experiment', blocker.experiment],
      ['Resources', blocker.resources],
    ];
    for (const [label, value] of fields) {
      if (!value) continue;
      const p = el('p');
      p.appendChild(el('strong', undefined, `${label}: `));
      p.appendChild(document.createTextNode(value));
      box.appendChild(p);
    }
    body.appendChild(box);
  }

  body.appendChild(el('h4', undefined, 'Links'));
  body.appendChild(linkGroups(source));

  body.appendChild(el('h4', undefined, 'Demo'));
  const demoRow = el('p');
  demoRow.appendChild(demoAffordance(source));
  body.appendChild(demoRow);

  body.appendChild(el('h4', undefined, 'In the world'));
  const door = el('p');
  door.appendChild(document.createTextNode('Authoritative here. Its Map 3 door still opens: '));
  const hub = el('a', undefined, 'open the world hub');
  hub.setAttribute('href', '?view=world');
  door.appendChild(hub);
  door.appendChild(document.createTextNode(' (per-door deep links do not exist; the hub is the honest address).'));
  body.appendChild(door);

  return body;
}

function techniqueRow(
  source: CatalogSource,
  state: TechniquesState,
  rerender: () => void,
): HTMLLIElement {
  const item = el('li', 'atlas-detail') as HTMLLIElement;
  item.id = `technique-${source.sourceId}`;
  const expanded = state.expandedId === source.sourceId;
  if (expanded) item.classList.add('flash');

  const head = el('button', 'atlas-detail-head') as HTMLButtonElement;
  head.type = 'button';
  head.setAttribute('aria-expanded', String(expanded));
  head.appendChild(el('span', 'atlas-source-id', `#${source.sourceId}`));
  head.appendChild(el('span', 'atlas-detail-title', source.title));
  const chips = el('span', 'atlas-detail-chips');
  chips.appendChild(chip('st', source.status));
  chips.appendChild(chip('ad', source.adaptation));
  chips.appendChild(chip('demo', source.demo?.status));
  head.appendChild(chips);
  head.addEventListener('click', () => {
    state.expandedId = expanded ? null : source.sourceId;
    rerender();
  });
  item.appendChild(head);

  if (expanded) item.appendChild(expandedBody(source));
  return item;
}

export function renderTechniques(
  root: HTMLElement,
  sources: CatalogSource[],
  state: TechniquesState,
): void {
  root.textContent = '';

  const intro = el('p', 'atlas-statusline',
    'Sources whose technique is a document — a format, comparison, decision, licence finding, ' +
    'process or catalogue — presented as what they are. Authoritative here; each Map 3 door still opens.');
  root.appendChild(intro);

  const toolbar = el('div', 'atlas-toolbar');
  const search = el('input', 'atlas-search') as HTMLInputElement;
  search.type = 'search';
  search.placeholder = 'Search title, method, skill, URL…';
  search.setAttribute('aria-label', 'Search browser-venue sources');
  search.value = state.query;
  search.addEventListener('input', () => {
    state.query = search.value;
    rerender();
  });
  toolbar.appendChild(search);
  root.appendChild(toolbar);

  const list = el('ul', 'atlas-source-list') as HTMLUListElement;
  root.appendChild(list);

  const count = el('p', 'atlas-statusline');
  root.appendChild(count);

  const browser = sources.filter((s) => venueFor(s).venue === 'browser');

  function rerender(): void {
    // Rebuild the list only, so the toolbar keeps focus while searching.
    list.textContent = '';
    const visible = browser.filter((s) => matches(s, state.query));
    for (const source of visible) list.appendChild(techniqueRow(source, state, rerender));
    if (visible.length === 0) {
      const empty = el('li', 'atlas-empty', 'No browser-venue sources match this search.');
      list.appendChild(empty);
    }
    count.textContent = `Showing ${visible.length} of ${browser.length} browser-venue sources (${sources.length} total).`;
  }

  rerender();
}
