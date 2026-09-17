/**
 * src/atlas/views/sources.ts — all 50 sources as a dense, scannable list.
 * Search and filter chips run over the in-memory catalogue: instant, no
 * re-fetch. Expanding a row reveals method, limitations, evidence and the
 * full blocker block when one is present.
 */
import type { CatalogSource } from '../catalog';
import { chip, demoAffordance, el, linkGroups, setHash } from './shared';

export interface SourcesState {
  query: string;
  status: string;
  adaptation: string;
  demo: string;
  expandedId: number | null;
}

export function emptySourcesState(): SourcesState {
  return { query: '', status: '', adaptation: '', demo: '', expandedId: null };
}

function matches(source: CatalogSource, state: SourcesState): boolean {
  if (state.status && source.status !== state.status) return false;
  if (state.adaptation && source.adaptation !== state.adaptation) return false;
  if (state.demo && (source.demo?.status ?? 'unknown') !== state.demo) return false;
  const q = state.query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    source.title,
    source.method ?? '',
    (source.skillMappings ?? []).map((m) => m.skill).join(' '),
    (source.urls ?? []).map((u) => `${u.label} ${u.url}`).join(' '),
  ].join('\n').toLowerCase();
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

function selectFilter(label: string, value: string, options: string[], onChange: (v: string) => void): HTMLSelectElement {
  const select = el('select', 'atlas-select') as HTMLSelectElement;
  select.setAttribute('aria-label', label);
  const any = document.createElement('option');
  any.value = '';
  any.textContent = label;
  select.appendChild(any);
  for (const option of options) {
    const opt = document.createElement('option');
    opt.value = option;
    opt.textContent = option;
    if (option === value) opt.selected = true;
    select.appendChild(opt);
  }
  select.addEventListener('change', () => onChange(select.value));
  return select;
}

function expandedBody(source: CatalogSource): HTMLElement {
  const body = el('div', 'atlas-detail-body');

  body.appendChild(el('h4', undefined, 'Method'));
  body.appendChild(el('p', undefined, source.method ?? 'Not recorded — the method was never extracted for this source.'));

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

  return body;
}

function sourceRow(
  source: CatalogSource,
  state: SourcesState,
  rerender: () => void,
): HTMLLIElement {
  const item = el('li', 'atlas-detail') as HTMLLIElement;
  item.id = `source-${source.sourceId}`;
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
    if (!expanded) setHash(`#source-${source.sourceId}`);
    rerender();
  });
  item.appendChild(head);

  if (expanded) {
    const skills = source.skillMappings ?? [];
    if (skills.length > 0) {
      const skillLine = el('p', 'atlas-statusline');
      skillLine.textContent = `Feeds: ${skills.map((m) => `${m.skill} (${m.relation})`).join(' · ')}`;
      const pre = el('div', 'atlas-detail-body');
      pre.appendChild(skillLine);
      item.appendChild(pre);
    }
    item.appendChild(expandedBody(source));
  }
  return item;
}

export function renderSources(
  root: HTMLElement,
  sources: CatalogSource[],
  state: SourcesState,
): void {
  root.textContent = '';

  const toolbar = el('div', 'atlas-toolbar');
  const search = el('input', 'atlas-search') as HTMLInputElement;
  search.type = 'search';
  search.placeholder = 'Search title, method, skill, URL…';
  search.setAttribute('aria-label', 'Search sources');
  search.value = state.query;
  search.addEventListener('input', () => {
    state.query = search.value;
    rerender();
  });
  toolbar.appendChild(search);
  toolbar.appendChild(selectFilter('All statuses', state.status,
    ['implemented', 'method-extracted', 'comparator', 'blocked', 'alias', 'archive'],
    (v) => { state.status = v; rerender(); }));
  toolbar.appendChild(selectFilter('All adaptations', state.adaptation,
    ['adapted', 'blocked', 'none', 'exact'],
    (v) => { state.adaptation = v; rerender(); }));
  toolbar.appendChild(selectFilter('All demo states', state.demo,
    ['implemented', 'delivered', 'blocked', 'absent'],
    (v) => { state.demo = v; rerender(); }));
  root.appendChild(toolbar);

  const list = el('ul', 'atlas-source-list') as HTMLUListElement;
  root.appendChild(list);

  const count = el('p', 'atlas-statusline');
  root.appendChild(count);

  function rerender(): void {
    // Rebuild the list only, so the toolbar keeps focus while searching.
    list.textContent = '';
    const visible = sources.filter((s) => matches(s, state));
    for (const source of visible) list.appendChild(sourceRow(source, state, rerender));
    if (visible.length === 0) {
      const empty = el('li', 'atlas-empty', 'No sources match these filters.');
      list.appendChild(empty);
    }
    count.textContent = `Showing ${visible.length} of ${sources.length} sources.`;
    if (state.expandedId !== null) {
      const target = list.querySelector(`#source-${CSS.escape(String(state.expandedId))}`);
      if (target && !isInViewport(target as HTMLElement)) {
        (target as HTMLElement).scrollIntoView({ block: 'nearest' });
      }
    }
  }

  rerender();
}

function isInViewport(node: HTMLElement): boolean {
  const rect = node.getBoundingClientRect();
  return rect.top >= 0 && rect.bottom <= window.innerHeight;
}
