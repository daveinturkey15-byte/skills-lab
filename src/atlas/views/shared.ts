/**
 * src/atlas/views/shared.ts — small DOM and vocabulary helpers shared by
 * every Atlas view. All text goes through textContent: catalogue strings are
 * untrusted content and must never become markup.
 */
import type {
  Adaptation,
  CatalogSource,
  DemoStatus,
  SkillRelation,
  SourceStatus,
} from '../catalog';

export type { Adaptation, CatalogSource, DemoStatus, SkillRelation, SourceStatus };

/** Create an element with an optional class and text in one step. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Relation order for stacked bars and legends: strongest claim first. */
export const RELATION_ORDER: SkillRelation[] = [
  'implements',
  'informs',
  'compares',
  'candidate',
  'blocked',
];

/** A chip that names the value it carries; missing values stay visible. */
export function chip(kind: 'rel' | 'st' | 'ad' | 'demo', value: string | undefined): HTMLSpanElement {
  const node = el('span', `atlas-chip ${kind}-${value ?? 'unknown'}${value ? '' : ' unknown'}`);
  node.textContent = value ?? 'unknown';
  return node;
}

/**
 * Honest demo affordance: only implemented/delivered sources link to the Lab.
 * Absent demos say so plainly; blocked demos name the block without a link.
 */
export function demoAffordance(source: CatalogSource): HTMLElement {
  const status: DemoStatus | undefined = source.demo?.status;
  if (status === 'implemented' || status === 'delivered') {
    const link = el('a', undefined, 'View live demo');
    link.setAttribute('href', `?view=lab#source-${source.sourceId}`);
    return link;
  }
  if (status === 'blocked') {
    const wrap = el('span');
    wrap.appendChild(chip('demo', status));
    wrap.appendChild(document.createTextNode(' — no runnable exhibit; see blocker below.'));
    return wrap;
  }
  const wrap = el('span', 'atlas-no-demo', 'no demo');
  if (status && status !== 'absent') {
    wrap.textContent = `demo: ${status}`;
    wrap.className = '';
    wrap.appendChild(chip('demo', status));
  }
  return wrap;
}

/** Outbound links grouped by kind, label as link text, safe new-tab links. */
export function linkGroups(source: CatalogSource): HTMLElement {
  const wrap = el('div', 'atlas-link-groups');
  const urls = source.urls ?? [];
  if (urls.length === 0) {
    wrap.appendChild(el('span', 'atlas-no-demo', 'no recorded links'));
    return wrap;
  }
  const byKind = new Map<string, typeof urls>();
  for (const u of urls) {
    const list = byKind.get(u.kind) ?? [];
    list.push(u);
    byKind.set(u.kind, list);
  }
  for (const [kind, list] of byKind) {
    const group = el('span');
    group.appendChild(el('span', 'atlas-link-kind', kind));
    list.forEach((u, i) => {
      if (i > 0) group.appendChild(document.createTextNode(' · '));
      const a = el('a', undefined, u.label);
      a.setAttribute('href', u.url);
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      group.appendChild(a);
    });
    wrap.appendChild(group);
  }
  return wrap;
}

/** Update the hash without firing a hashchange-driven view switch loop. */
export function setHash(hash: string): void {
  if (location.hash !== hash) location.hash = hash;
}
