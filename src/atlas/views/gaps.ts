/**
 * src/atlas/views/gaps.ts — the gap inventory. Groups the deep-sweep
 * gaps.json by kind, orders the groups by severity weight, and lets the
 * reader filter by kind and severity. A gap is an inventory row, not an
 * apology: licence-blocked and comparator sources are correct outcomes and
 * read that way here.
 */
import type { Gap } from '../capture';
import { GAP_KINDS, GAP_SEVERITIES, loadGaps, severityWeight } from '../capture';
import { el } from './shared';

const KIND_GLOSS: Record<string, string> = {
  'source-no-skill': 'A studied source that feeds no skill.',
  'source-no-demo': 'A source with no live demo.',
  'skill-no-source': 'A skill no studied source feeds.',
  'stale-evidence': 'Evidence too old to carry the claim it supports.',
  'licence-unverified': 'Reuse terms not yet established.',
  contradiction: 'Two records disagree; at least one is wrong.',
  'skill-missing': 'Work the sweep says should exist and does not.',
};

function kindLabel(kind: string): string {
  return KIND_GLOSS[kind] ?? kind;
}

function gapCard(gap: Gap): HTMLElement {
  const card = el('article', 'atlas-gap');
  card.appendChild(el('p', 'atlas-gap-summary', gap.summary ?? 'Summary not recorded.'));

  const meta = el('p', 'atlas-gap-meta');
  meta.appendChild(el('span', `atlas-chip sev-${gap.severity ?? 'unknown'}`, gap.severity ?? 'unknown'));
  if (gap.sourceId !== undefined && gap.sourceId !== null) {
    meta.appendChild(document.createTextNode(' '));
    const link = el('a', undefined, `#${gap.sourceId}`);
    link.setAttribute('href', `#source-${gap.sourceId}`);
    link.title = `Open source #${gap.sourceId} in the Sources view`;
    meta.appendChild(link);
  }
  if (gap.skill) {
    meta.appendChild(document.createTextNode(' '));
    const link = el('a', undefined, gap.skill);
    link.setAttribute('href', `#skill-${gap.skill}`);
    link.title = `Open skill ${gap.skill} in the Skills view`;
    meta.appendChild(link);
  }
  card.appendChild(meta);

  card.appendChild(el('p', undefined, gap.detail ?? 'Detail not recorded.'));
  // The evidence string is why this file is trustworthy: always visible,
  // never inside an expander.
  card.appendChild(el('p', 'atlas-gap-evidence', `Evidence: ${gap.evidence ?? 'not recorded'}`));
  return card;
}

function kindSelect(current: string, onChange: (value: string) => void): HTMLSelectElement {
  const select = el('select', 'atlas-select') as HTMLSelectElement;
  select.setAttribute('aria-label', 'Filter gaps by kind');
  const any = document.createElement('option');
  any.value = '';
  any.textContent = 'All kinds';
  select.appendChild(any);
  for (const kind of GAP_KINDS) {
    const opt = document.createElement('option');
    opt.value = kind;
    opt.textContent = kind;
    if (kind === current) opt.selected = true;
    select.appendChild(opt);
  }
  select.addEventListener('change', () => onChange(select.value));
  return select;
}

function severitySelect(current: string, onChange: (value: string) => void): HTMLSelectElement {
  const select = el('select', 'atlas-select') as HTMLSelectElement;
  select.setAttribute('aria-label', 'Filter gaps by severity');
  const any = document.createElement('option');
  any.value = '';
  any.textContent = 'All severities';
  select.appendChild(any);
  for (const severity of GAP_SEVERITIES) {
    const opt = document.createElement('option');
    opt.value = severity;
    opt.textContent = severity;
    if (severity === current) opt.selected = true;
    select.appendChild(opt);
  }
  select.addEventListener('change', () => onChange(select.value));
  return select;
}

export function renderGaps(root: HTMLElement, baseUrl: string): void {
  root.textContent = '';
  root.appendChild(el('p', 'atlas-statusline', 'Loading gap inventory…'));

  loadGaps(baseUrl).then((file) => {
    root.textContent = '';
    if (!file) {
      const box = el('div', 'atlas-error');
      box.appendChild(el('p', undefined, 'No gap analysis has been published yet.'));
      box.appendChild(el('p', undefined,
        'gaps.json is a hand-written analysis file from the deep-sweep pass ' +
        '(docs/deep-sweep-2026-09-17.md) — there is no generator command. The inventory ' +
        'appears here once that file ships with the site.'));
      root.appendChild(box);
      return;
    }

    const wrap = el('div', 'atlas-gaps');
    wrap.appendChild(el('p', 'atlas-gap-method',
      `Gap analysis, generated ${file.generatedAt ?? 'unknown'}. ${file.method ?? 'Method not recorded.'}`));

    let kind = '';
    let severity = '';
    const toolbar = el('div', 'atlas-toolbar');
    const status = el('p', 'atlas-statusline');
    const groups = el('div', 'atlas-gap-groups');

    const paint = (): void => {
      groups.textContent = '';
      const visible = file.gaps.filter((gap) =>
        (!kind || gap.kind === kind) && (!severity || gap.severity === severity));
      status.textContent =
        `Showing ${visible.length} of ${file.gaps.length} gaps. ` +
        'Licence-blocked and comparator rows are correct outcomes, not failures.';

      const byKind = new Map<string, Gap[]>();
      for (const gap of visible) {
        const list = byKind.get(gap.kind) ?? [];
        list.push(gap);
        byKind.set(gap.kind, list);
      }
      const ordered = [...byKind.entries()].sort((a, b) => {
        const weightA = a[1].reduce((max, gap) => Math.max(max, severityWeight(gap.severity)), 0);
        const weightB = b[1].reduce((max, gap) => Math.max(max, severityWeight(gap.severity)), 0);
        return weightB - weightA || GAP_KINDS.indexOf(a[0] as (typeof GAP_KINDS)[number])
          - GAP_KINDS.indexOf(b[0] as (typeof GAP_KINDS)[number]);
      });

      if (ordered.length === 0) {
        groups.appendChild(el('p', 'atlas-empty', 'No gaps match these filters.'));
        return;
      }
      for (const [groupKind, list] of ordered) {
        const section = el('section', 'atlas-gap-group');
        section.appendChild(el('h3', undefined, `${groupKind} — ${list.length}`));
        section.appendChild(el('p', 'atlas-gap-gloss', kindLabel(groupKind)));
        for (const gap of list) section.appendChild(gapCard(gap));
        groups.appendChild(section);
      }
    };

    toolbar.appendChild(kindSelect(kind, (value) => { kind = value; paint(); }));
    toolbar.appendChild(severitySelect(severity, (value) => { severity = value; paint(); }));
    wrap.appendChild(toolbar);
    wrap.appendChild(status);
    wrap.appendChild(groups);
    root.appendChild(wrap);
    paint();
  }).catch((error: unknown) => {
    root.textContent = '';
    const box = el('div', 'atlas-error');
    box.appendChild(el('p', undefined, 'The gap analysis could not be loaded:'));
    const detail = el('p');
    detail.appendChild(el('code', undefined, error instanceof Error ? error.message : String(error)));
    box.appendChild(detail);
    root.appendChild(box);
  });
}
