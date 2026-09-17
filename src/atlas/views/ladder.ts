/**
 * src/atlas/views/ladder.ts — the "improving" view. All 50 sources as a
 * five-column rung matrix from RUNGS/ladderOf(). Stalled sources must look
 * stalled: lit rungs are filled, unlit rungs are empty outlines, no smoothing.
 */
import type { CatalogSource } from '../catalog';
import { ladderHeight, ladderOf, RUNGS } from '../catalog';
import { el } from './shared';

export type LadderSort = 'height' | 'id' | 'status';

export function renderLadder(
  root: HTMLElement,
  sources: CatalogSource[],
  sort: LadderSort,
  onSortChange: (sort: LadderSort) => void,
): void {
  root.textContent = '';

  // Summary strip: how many sources reached each rung.
  const reached = RUNGS.map((rung) => ({
    rung,
    count: sources.filter((s) => ladderOf(s)[rung.key]).length,
  }));
  const strip = el('ul', 'atlas-summary-strip');
  for (const { rung, count } of reached) {
    const cell = el('li', 'atlas-summary-cell');
    cell.title = rung.hint;
    cell.appendChild(el('span', 'atlas-summary-count', String(count)));
    cell.appendChild(el('span', 'atlas-summary-label', rung.label));
    strip.appendChild(cell);
  }
  root.appendChild(strip);

  const controls = el('div', 'atlas-ladder-controls');
  controls.appendChild(el('span', undefined, 'Sort:'));
  const select = el('select', 'atlas-select') as HTMLSelectElement;
  const options: Array<[LadderSort, string]> = [
    ['height', 'Ladder height, descending'],
    ['id', 'Source id'],
    ['status', 'Status'],
  ];
  for (const [value, label] of options) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    if (value === sort) opt.selected = true;
    select.appendChild(opt);
  }
  select.setAttribute('aria-label', 'Sort ladder rows');
  select.addEventListener('change', () => onSortChange(select.value as LadderSort));
  controls.appendChild(select);
  root.appendChild(controls);

  const ordered = [...sources];
  if (sort === 'height') {
    ordered.sort((a, b) => ladderHeight(b) - ladderHeight(a) || a.sourceId - b.sourceId);
  } else if (sort === 'id') {
    ordered.sort((a, b) => a.sourceId - b.sourceId);
  } else {
    ordered.sort((a, b) => a.status.localeCompare(b.status) || a.sourceId - b.sourceId);
  }

  const list = el('ul', 'atlas-ladder') as HTMLUListElement;
  const head = el('li', 'atlas-ladder-head') as HTMLLIElement;
  head.setAttribute('aria-hidden', 'true');
  head.appendChild(el('span', undefined, 'Source'));
  for (const rung of RUNGS) head.appendChild(el('span', undefined, rung.label));
  list.appendChild(head);

  for (const source of ordered) {
    const row = el('li', 'atlas-ladder-row') as HTMLLIElement;
    const name = el('span', 'atlas-ladder-source');
    name.appendChild(el('span', 'atlas-source-id', `#${source.sourceId}`));
    name.appendChild(document.createTextNode(source.title));
    name.title = `#${source.sourceId} · ${source.title} · ${source.status} · height ${ladderHeight(source)}/5`;
    row.appendChild(name);
    const lit = ladderOf(source);
    for (const rung of RUNGS) {
      const dot = el('span', `atlas-rung${lit[rung.key] ? ' lit' : ''}`);
      dot.title = `${rung.label}: ${lit[rung.key] ? 'reached' : 'not reached'} — ${rung.hint}`;
      row.appendChild(dot);
    }
    list.appendChild(row);
  }
  root.appendChild(list);
}
