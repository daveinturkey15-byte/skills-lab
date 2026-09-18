/**
 * src/atlas/views/evidence.ts — the capture gallery. One card per captured
 * demo: the screenshot, the source id and title, the verdict verbatim, and
 * the framing numbers. Failing verdicts are the most useful rows on the
 * page, so they are visually distinct and never summarised away.
 */
import type { CaptureReport, CaptureResult } from '../capture';
import { loadCaptureReport } from '../capture';
import { el } from './shared';

function share(value: number | undefined, digits: number): string {
  if (value === undefined || Number.isNaN(value)) return 'unknown';
  return `${(value * 100).toFixed(digits)}%`;
}

function amount(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return 'unknown';
  return String(value);
}

/** Provenance first: a screenshot with no capture context is not evidence. */
function provenance(report: CaptureReport): HTMLElement {
  const list = el('dl', 'atlas-provenance');
  const rows: Array<[string, string]> = [
    ['Captured', report.capturedAt ?? 'unknown'],
    [
      'Adapter',
      `${report.adapter?.vendor ?? 'unknown'} / ${report.adapter?.architecture ?? 'unknown'}`,
    ],
    ['Headless', report.headless === undefined ? 'unknown' : String(report.headless)],
    ['Base URL', report.base ?? 'unknown'],
  ];
  for (const [term, value] of rows) {
    list.appendChild(el('dt', undefined, term));
    list.appendChild(el('dd', undefined, value));
  }
  return list;
}

function evidenceCard(baseUrl: string, result: CaptureResult): HTMLElement {
  const passing = result.verdict === 'DREW SOMETHING';
  const card = el('article', `atlas-evidence-card${passing ? '' : ' is-fail'}`);

  const shot = document.createElement('img');
  shot.className = 'atlas-evidence-shot';
  shot.src = `${baseUrl}assets/skills-lab/captures/${result.slug}.png`;
  shot.alt = `Captured frame for ${result.title}`;
  shot.loading = 'lazy';
  card.appendChild(shot);

  const head = el('h3', 'atlas-evidence-title');
  if (result.sourceId !== null && result.sourceId !== undefined) {
    const link = el('a', undefined, `#${result.sourceId}`);
    link.setAttribute('href', `#source-${result.sourceId}`);
    link.title = `Open source #${result.sourceId} in the Sources view`;
    head.appendChild(link);
    head.appendChild(document.createTextNode(` · ${result.title}`));
  } else {
    head.textContent = `${result.title} (unmatched demo — no source id recorded)`;
  }
  card.appendChild(head);

  card.appendChild(el('p', `atlas-evidence-verdict${passing ? '' : ' is-fail'}`, result.verdict));

  const numbers = el('ul', 'atlas-evidence-numbers');
  const entries: Array<[string, string]> = [
    ['modal tone', share(result.modalToneShare, 0)],
    ['edge density', share(result.edgeDensity, 2)],
    ['distinct colours', amount(result.distinctColours)],
    ['max luma', result.maxLuma === undefined ? 'unknown' : result.maxLuma.toFixed(1)],
  ];
  for (const [label, value] of entries) {
    const row = el('li');
    row.appendChild(el('strong', undefined, `${label}: `));
    row.appendChild(document.createTextNode(value));
    numbers.appendChild(row);
  }
  card.appendChild(numbers);
  return card;
}

export function renderEvidence(root: HTMLElement, baseUrl: string): void {
  root.textContent = '';
  root.appendChild(el('p', 'atlas-statusline', 'Loading capture evidence…'));

  loadCaptureReport(baseUrl).then((report) => {
    root.textContent = '';
    if (!report) {
      const box = el('div', 'atlas-error');
      box.appendChild(el('p', undefined, 'No capture run has been published.'));
      box.appendChild(el('p', undefined,
        'Run node qa/capture.mjs against a local server, then npm run qa:publish, then rebuild — ' +
        'the gallery appears here once captures/report.json ships with the site.'));
      root.appendChild(box);
      return;
    }

    root.appendChild(provenance(report));
    root.appendChild(el('p', 'atlas-meaning',
      'A passing verdict means that a subject occupies and structures the frame — ' +
      'not that the technique is correct.'));
    root.appendChild(el('p', 'atlas-statusline',
      `${report.results.length} captured demos · ${report.drewSomething ?? 'unknown'} drew something.`));

    const grid = el('div', 'atlas-evidence-grid');
    for (const result of report.results) grid.appendChild(evidenceCard(baseUrl, result));
    root.appendChild(grid);
  }).catch((error: unknown) => {
    root.textContent = '';
    const box = el('div', 'atlas-error');
    box.appendChild(el('p', undefined, 'The capture report could not be loaded:'));
    box.appendChild(el('p'));
    box.lastChild?.appendChild(el('code', undefined, error instanceof Error ? error.message : String(error)));
    root.appendChild(box);
  });
}
