/**
 * src/atlas/atlas.ts — the Skills Atlas host. Renders the header, the four
 * view tabs and a fixed-shape skeleton first (no layout shift), then fills
 * the panel once loadCatalog() resolves. Deep links: #source-<id> opens the
 * Sources view on that row; #skill-<name> opens the Skills view on that card.
 */
import type { Catalog } from './catalog';
import type { LadderSort } from './views/ladder';
import type { SourcesState } from './views/sources';
import { buildSkillGraph, loadCatalog } from './catalog';
import { el, setHash } from './views/shared';
import { renderSkills } from './views/skills';
import { emptySourcesState, renderSources } from './views/sources';
import { renderLadder } from './views/ladder';
import { renderAbout } from './views/about';
import { renderEvidence } from './views/evidence';
import { renderGaps } from './views/gaps';

export interface AtlasOptions {
  baseUrl?: string;
}

type AtlasTab = 'skills' | 'sources' | 'ladder' | 'evidence' | 'gaps' | 'about';

const TABS: Array<{ key: AtlasTab; label: string }> = [
  { key: 'skills', label: 'Skills' },
  { key: 'sources', label: 'Sources' },
  { key: 'ladder', label: 'Ladder' },
  { key: 'evidence', label: 'Evidence' },
  { key: 'gaps', label: 'Gaps' },
  { key: 'about', label: 'About' },
];

function skeleton(panel: HTMLElement): void {
  panel.textContent = '';
  panel.setAttribute('aria-busy', 'true');
  const wrap = el('div', 'atlas-skeleton');
  wrap.appendChild(el('div', 'atlas-skeleton-bar'));
  const grid = el('div', 'atlas-skeleton-grid');
  for (let i = 0; i < 6; i += 1) grid.appendChild(el('div', 'atlas-skeleton-card'));
  wrap.appendChild(grid);
  panel.appendChild(wrap);
}

export function mountAtlas(container: HTMLElement, options: AtlasOptions = {}): void {
  const baseUrl = options.baseUrl ?? import.meta.env.BASE_URL ?? '/';
  container.textContent = '';

  const root = el('div', 'atlas-root');
  container.appendChild(root);

  const header = el('header', 'atlas-header');
  header.appendChild(el('p', 'atlas-eyebrow', 'Skills Lab'));
  header.appendChild(el('h1', 'atlas-title', 'Skills Atlas'));
  header.appendChild(el('p', 'atlas-sub',
    'Which techniques this workspace has studied, which are improving, and which skills ' +
    'combine on the same source — stated exactly as far as it goes and no further.'));
  const navrow = el('div', 'atlas-navrow');
  const tabs = el('div', 'atlas-tabs');
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Atlas views');
  const labLink = el('a', 'atlas-lab-link', 'Open the live 3D Lab');
  labLink.setAttribute('href', '?view=lab');
  navrow.appendChild(tabs);
  navrow.appendChild(labLink);
  header.appendChild(navrow);
  root.appendChild(header);

  const panel = el('main', 'atlas-panel');
  panel.setAttribute('role', 'tabpanel');
  panel.id = 'atlas-panel';
  root.appendChild(panel);

  const footer = el('p', 'atlas-footer');
  root.appendChild(footer);

  // View state lives here so tab switches never re-fetch the catalogue.
  let catalog: Catalog | null = null;
  let active: AtlasTab = 'skills';
  let sourcesState: SourcesState = emptySourcesState();
  let ladderSort: LadderSort = 'height';
  let flashSkill: string | null = null;
  const buttons = new Map<AtlasTab, HTMLButtonElement>();

  function render(): void {
    if (!catalog) return;
    panel.setAttribute('aria-busy', 'false');
    for (const [key, button] of buttons) {
      button.setAttribute('aria-selected', String(key === active));
      button.tabIndex = key === active ? 0 : -1;
    }
    if (active === 'skills') {
      renderSkills(panel, buildSkillGraph(catalog.sources), {
        onSelectSource: (sourceId) => {
          sourcesState.expandedId = sourceId;
          setActive('sources');
          reveal(`source-${sourceId}`);
        },
      }, flashSkill);
    } else if (active === 'sources') {
      renderSources(panel, catalog.sources, sourcesState);
    } else if (active === 'ladder') {
      renderLadder(panel, catalog.sources, ladderSort, (sort) => {
        ladderSort = sort;
        render();
      });
    } else if (active === 'evidence') {
      renderEvidence(panel, baseUrl);
    } else if (active === 'gaps') {
      renderGaps(panel, baseUrl);
    } else {
      renderAbout(panel, catalog);
    }
  }

  function setActive(tab: AtlasTab): void {
    active = tab;
    render();
  }

  function reveal(elementId: string): void {
    requestAnimationFrame(() => {
      const target = panel.querySelector(`#${CSS.escape(elementId)}`);
      if (target) {
        target.scrollIntoView({ block: 'center' });
        target.classList.add('flash');
        const focusable = target.querySelector('button');
        if (focusable instanceof HTMLButtonElement) focusable.focus({ preventScroll: true });
      }
    });
  }

  /** Hash deep links work on first load and on back/forward navigation. */
  function applyHash(): void {
    const hash = decodeURIComponent(location.hash);
    let match = hash.match(/^#source-(\d+)$/);
    if (match) {
      sourcesState.expandedId = Number(match[1]);
      if (active !== 'sources') setActive('sources');
      else render();
      reveal(`source-${match[1]}`);
      return;
    }
    match = hash.match(/^#skill-(.+)$/);
    if (match) {
      flashSkill = match[1];
      if (active !== 'skills') setActive('skills');
      else render();
      reveal(`skill-card-${match[1]}`);
    }
  }

  for (const { key, label } of TABS) {
    const button = el('button', 'atlas-tab', label) as HTMLButtonElement;
    button.type = 'button';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(key === active));
    button.setAttribute('aria-controls', 'atlas-panel');
    button.id = `atlas-tab-${key}`;
    button.addEventListener('click', () => setActive(key));
    button.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      const order: AtlasTab[] = ['skills', 'sources', 'ladder', 'evidence', 'gaps', 'about'];
      const at = order.indexOf(active);
      const next = order[(at + (event.key === 'ArrowRight' ? 1 : order.length - 1)) % order.length];
      setActive(next);
      buttons.get(next)?.focus();
    });
    buttons.set(key, button);
    tabs.appendChild(button);
  }

  window.addEventListener('hashchange', applyHash);
  skeleton(panel);

  loadCatalog(baseUrl).then((loaded) => {
    catalog = loaded;
    const skills = buildSkillGraph(loaded.sources).length;
    footer.textContent =
      `${loaded.sources.length} sources · ${skills} skills · ` +
      `updated ${loaded.updatedAt ?? 'unknown'}. Catalogue: assets/skills-lab/source-catalog.json.`;
    applyHash();
    // applyHash renders when a deep link is present; otherwise render now.
    if (!decodeURIComponent(location.hash).match(/^#(source|skill)-/)) render();
  }).catch((error: unknown) => {
    panel.setAttribute('aria-busy', 'false');
    panel.textContent = '';
    const box = el('div', 'atlas-error');
    box.appendChild(el('p', undefined, 'The catalogue could not be loaded — no empty page, no invented content:'));
    const detail = el('p');
    detail.appendChild(el('code', undefined,
      `${baseUrl}assets/skills-lab/source-catalog.json → ${error instanceof Error ? error.message : String(error)}`));
    box.appendChild(detail);
    panel.appendChild(box);
    footer.textContent = 'Catalogue failed to load.';
  });
}
