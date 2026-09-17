/**
 * src/atlas/views/skills.ts — the headline view. One card per skill from
 * buildSkillGraph(), ordered by feeding-source count. The "Combined with"
 * strip is the skills-combined story: picking a sibling narrows that card to
 * the sources both skills share.
 */
import type { SkillNode } from '../catalog';
import { isExternalSkill } from '../catalog';
import { chip, el, RELATION_ORDER, setHash } from './shared';

export interface SkillsCallbacks {
  /** Jump to the Sources view with a row expanded and revealed. */
  onSelectSource(sourceId: number): void;
}

const RELATION_HINT: Record<string, string> = {
  implements: 'a demo or adopted route executes the method',
  informs: 'method extracted as input to the skill',
  compares: 'quality target, not an import',
  candidate: 'plausible mapping, NOT verified',
  blocked: 'skill-relevant but unusable',
};

/** Stacked bar: solid hues per relation; candidate hatched, blocked vermillion. */
function relationBar(counts: SkillNode['counts'], total: number): HTMLDivElement {
  const bar = el('div', 'atlas-bar');
  bar.setAttribute('role', 'img');
  const parts = RELATION_ORDER.filter((r) => counts[r] > 0).map(
    (r) => `${counts[r]} ${r}`,
  );
  bar.setAttribute('aria-label', parts.length > 0 ? parts.join(', ') : 'no mappings');
  for (const relation of RELATION_ORDER) {
    const n = counts[relation];
    if (n === 0) continue;
    const seg = el('div', `atlas-bar-seg rel-${relation}`);
    seg.style.width = `${(n / total) * 100}%`;
    seg.title = `${n} ${relation}`;
    bar.appendChild(seg);
  }
  return bar;
}

function legend(counts: SkillNode['counts']): HTMLUListElement {
  const list = el('ul', 'atlas-counts');
  for (const relation of RELATION_ORDER) {
    if (counts[relation] === 0) continue;
    const item = el('li', undefined, `${counts[relation]} ${relation}`);
    item.title = RELATION_HINT[relation] ?? relation;
    list.appendChild(item);
  }
  return list;
}

function skillCard(
  node: SkillNode,
  callbacks: SkillsCallbacks,
  flashSkill: string | null,
): HTMLElement {
  const card = el('article', 'atlas-card');
  card.id = `skill-card-${node.skill}`;
  card.dataset.skill = node.skill;
  if (flashSkill === node.skill) card.classList.add('flash');

  const title = el('h3', 'atlas-card-title', node.skill);
  title.id = `skill-${node.skill}`;
  if (isExternalSkill(node.skill)) {
    title.appendChild(el('span', 'atlas-external-badge', "someone else's skill pack"));
    title.title = 'External skill pack: other people\u2019s work, not ours.';
  }
  if (node.fullyBlocked) title.appendChild(chip('rel', 'blocked'));
  card.appendChild(title);
  const total = node.entries.length;
  card.appendChild(relationBar(node.counts, total));
  card.appendChild(legend(node.counts));

  // Sources feeding this skill; narrowed to the shared set while a
  // "combined with" sibling is pressed.
  const listTitle = el('p', 'atlas-combined-label');
  const rows = el('ul', 'atlas-source-rows');
  let visible = node.entries;
  card.appendChild(listTitle);
  card.appendChild(rows);

  const renderRows = (shared: number[] | null, sibling: string | null): void => {
    rows.textContent = '';
    visible = shared === null
      ? node.entries
      : node.entries.filter((e) => shared.includes(e.source.sourceId));
    listTitle.textContent = sibling === null
      ? `${total} source${total === 1 ? '' : 's'}:`
      : `${visible.length} shared with ${sibling}:`;
    if (sibling !== null) {
      const clear = el('button', 'atlas-clear-btn', 'clear');
      clear.type = 'button';
      clear.addEventListener('click', () => {
        card.querySelectorAll('.atlas-combined-btn').forEach((b) => {
          (b as HTMLButtonElement).setAttribute('aria-pressed', 'false');
        });
        renderRows(null, null);
      });
      listTitle.appendChild(document.createTextNode(' '));
      listTitle.appendChild(clear);
    }
    for (const entry of visible) {
      const item = el('li');
      const row = el('button', 'atlas-source-row');
      row.type = 'button';
      row.appendChild(el('span', 'atlas-source-id', `#${entry.source.sourceId}`));
      row.appendChild(el('span', 'atlas-source-title', entry.source.title));
      row.appendChild(chip('rel', entry.relation));
      row.appendChild(chip('st', entry.source.status));
      row.title = `Open source #${entry.source.sourceId} in the Sources view`;
      row.addEventListener('click', () => {
        setHash(`#source-${entry.source.sourceId}`);
        callbacks.onSelectSource(entry.source.sourceId);
      });
      item.appendChild(row);
      rows.appendChild(item);
    }
  };
  renderRows(null, null);

  if (node.combinedWith.length > 0) {
    const combined = el('div', 'atlas-combined');
    combined.appendChild(el('p', 'atlas-combined-label', 'Combined with:'));
    const strip = el('ul', 'atlas-combined-list');
    for (const sibling of node.combinedWith) {
      const item = el('li');
      const btn = el('button', 'atlas-combined-btn', `${sibling.skill} (${sibling.shared.length})`);
      btn.type = 'button';
      btn.setAttribute('aria-pressed', 'false');
      btn.title = `Show only the ${sibling.shared.length} source${sibling.shared.length === 1 ? '' : 's'} feeding both skills`;
      btn.addEventListener('click', () => {
        const on = btn.getAttribute('aria-pressed') === 'true';
        card.querySelectorAll('.atlas-combined-btn').forEach((b) => {
          (b as HTMLButtonElement).setAttribute('aria-pressed', 'false');
        });
        if (on) renderRows(null, null);
        else {
          btn.setAttribute('aria-pressed', 'true');
          renderRows(sibling.shared, sibling.skill);
        }
      });
      item.appendChild(btn);
      strip.appendChild(item);
    }
    combined.appendChild(strip);
    card.appendChild(combined);
  }
  return card;
}

export function renderSkills(
  root: HTMLElement,
  nodes: SkillNode[],
  callbacks: SkillsCallbacks,
  flashSkill: string | null,
): void {
  root.textContent = '';

  const legendList = el('ul', 'atlas-legend');
  for (const relation of RELATION_ORDER) {
    const item = el('li');
    const swatch = el('span', `atlas-legend-swatch atlas-bar-seg rel-${relation}`);
    swatch.setAttribute('aria-hidden', 'true');
    item.appendChild(swatch);
    item.appendChild(document.createTextNode(`${relation} — ${RELATION_HINT[relation]}`));
    legendList.appendChild(item);
  }
  root.appendChild(legendList);

  if (nodes.length === 0) {
    root.appendChild(el('p', 'atlas-empty', 'The catalogue names no skill mappings.'));
    return;
  }
  const grid = el('div', 'atlas-skill-grid');
  for (const node of nodes) grid.appendChild(skillCard(node, callbacks, flashSkill));
  root.appendChild(grid);
}
