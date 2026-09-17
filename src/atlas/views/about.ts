/**
 * src/atlas/views/about.ts — what this repository is, the honesty contract
 * restated for a first-time reader, the full vocabulary, and the catalogue
 * stamp. adapterNotes is quoted verbatim: it is the intake lane's record.
 */
import type { Catalog } from '../catalog';
import { el } from './shared';

function vocabList(term: string, entries: Array<[string, string]>): HTMLElement {
  const section = el('section');
  section.appendChild(el('h3', undefined, term));
  const list = el('dl');
  for (const [value, meaning] of entries) {
    list.appendChild(el('dt', undefined, value));
    list.appendChild(el('dd', undefined, meaning));
  }
  section.appendChild(list);
  return section;
}

export function renderAbout(root: HTMLElement, catalog: Catalog): void {
  root.textContent = '';
  const wrap = el('div', 'atlas-about');
  root.appendChild(wrap);

  const what = el('section');
  what.appendChild(el('h3', undefined, 'What this repository is'));
  what.appendChild(el('p', undefined,
    'The Skills Lab has two halves. The Lab is a live WebGPU exhibit hall: one runnable ' +
    'Three.js demo per studied technique, each carrying provenance metadata the host UI must ' +
    'display. The Atlas — this page — is a browsable index over the source catalogue: what each ' +
    'studied source is, which skills it feeds, and how far up the adoption ladder it actually got.'));
  what.appendChild(el('p', undefined,
    `This catalogue holds ${catalog.sources.length} sources` +
    (catalog.updatedAt ? `, last updated ${catalog.updatedAt}.` : ' (update stamp not recorded).')));
  wrap.appendChild(what);

  const honesty = el('section');
  honesty.appendChild(el('h3', undefined, 'The honesty contract'));
  honesty.appendChild(el('p', undefined,
    'This repository does not overstate what has been done. A source with no demo renders as ' +
    'absent — never as a placeholder scene, never as "coming soon" styled like a success. ' +
    'A blocked source shows its blocker reason. A candidate skill relation means not verified ' +
    'and is visually distinct from implements. Where a field is missing, the Atlas renders the ' +
    'honest unknown and never invents content.'));
  honesty.appendChild(el('p', undefined,
    'Several sources are blocked on licence grounds, including a paid commercial product whose ' +
    'source we have never touched. That is a real and correct outcome, and this UI states it ' +
    'without embarrassment.'));
  wrap.appendChild(honesty);

  wrap.appendChild(vocabList('Source status', [
    ['implemented', 'A lab demo exists. Pixel validation may still be open.'],
    ['method-extracted', 'Read and restated in our own words; no demo.'],
    ['comparator', 'A quality target, not a technique to import.'],
    ['blocked', 'No honest demo is possible; the blocker block says why.'],
    ['alias', 'A stub pointing at another row.'],
    ['archive', 'Reference only.'],
  ]));
  wrap.appendChild(vocabList('Adaptation', [
    ['adapted', 'Restated for our stack; the demo differs from upstream.'],
    ['exact', 'Carried over as-is.'],
    ['none', 'Nothing was taken from the source.'],
    ['blocked', 'Licence or access bars reuse.'],
  ]));
  wrap.appendChild(vocabList('Demo state', [
    ['implemented', 'A runnable exhibit exists in this repository.'],
    ['delivered', 'Exhibit handed over through the gallery pipeline.'],
    ['blocked', 'No runnable exhibit can honestly be built.'],
    ['absent', 'No exhibit. The Atlas links to no demo for these rows.'],
  ]));
  wrap.appendChild(vocabList('Skill relation', [
    ['implements', 'A demo or adopted route executes the extracted method, with file evidence.'],
    ['informs', 'The method is extracted and named as input to a skill area.'],
    ['compares', 'A comparison against our own library — not an import.'],
    ['candidate', 'A plausible mapping that is NOT verified against the skill body. Re-verify before use.'],
    ['blocked', 'Skill-relevant but currently unusable.'],
  ]));

  const stamp = el('section');
  stamp.appendChild(el('h3', undefined, 'Catalogue stamp'));
  stamp.appendChild(el('p', undefined,
    `Schema ${catalog.schemaVersion !== undefined ? String(catalog.schemaVersion) : 'unrecorded'} · ` +
    `${catalog.sources.length} sources · ` +
    `updated ${catalog.updatedAt ?? 'unknown'}.`));
  if (catalog.adapterNotes) {
    stamp.appendChild(el('h3', undefined, 'Intake notes, verbatim'));
    stamp.appendChild(el('blockquote', 'atlas-adapter-notes', catalog.adapterNotes));
  }
  wrap.appendChild(stamp);
}
