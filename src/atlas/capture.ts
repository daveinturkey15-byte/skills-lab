/**
 * src/atlas/capture.ts — loaders for the two published build outputs the
 * Atlas renders as evidence rather than claim: the WebGPU capture report
 * and the deep-sweep gap analysis.
 *
 * Both files are copied into public/assets/skills-lab/ at publish time and
 * fetched relative to import.meta.env.BASE_URL, exactly like the catalogue.
 * Either file may be absent (fresh clone, no run yet): the loaders resolve
 * null on a 404 so the views can say so instead of rendering an empty grid.
 */

export interface CaptureAdapter {
  hasGpu?: boolean;
  adapter?: boolean;
  vendor: string | null;
  architecture: string | null;
}

export interface CaptureResult {
  index: number;
  sourceId: number | null;
  title: string;
  state: string | null;
  slug: string;
  /** Framing numbers; absent on rows the harness could not measure (ERROR). */
  distinctColours?: number;
  edgeDensity?: number;
  modalToneShare?: number;
  maxLuma?: number;
  /** Verbatim harness verdict, e.g. "DREW SOMETHING" or "UNFRAMED — …". */
  verdict: string;
  readout: string | null;
  consoleErrors: string[];
}

export interface CaptureReport {
  capturedAt: string;
  base: string;
  adapter: CaptureAdapter;
  headless: boolean;
  demoCount: number;
  captured: number;
  drewSomething: number;
  results: CaptureResult[];
}

export type GapKind =
  | 'source-no-skill'
  | 'source-no-demo'
  | 'skill-no-source'
  | 'stale-evidence'
  | 'licence-unverified'
  | 'contradiction'
  | 'skill-missing';

export type GapSeverity = 'high' | 'medium' | 'low';

export interface Gap {
  kind: string;
  severity: GapSeverity;
  sourceId?: number | null;
  skill?: string | null;
  summary: string;
  detail: string;
  /** Checkable basis for the gap; always rendered, never hidden. */
  evidence: string;
}

export interface GapsFile {
  generatedAt: string;
  method: string;
  gaps: Gap[];
}

/** Canonical kind order; used as the tiebreak when severity weights match. */
export const GAP_KINDS: GapKind[] = [
  'source-no-skill',
  'source-no-demo',
  'skill-no-source',
  'stale-evidence',
  'licence-unverified',
  'contradiction',
  'skill-missing',
];

export const GAP_SEVERITIES: GapSeverity[] = ['high', 'medium', 'low'];

/** Severity rank for group ordering; unknown strings weigh nothing. */
export function severityWeight(severity: string): number {
  switch (severity) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 0;
  }
}
async function fetchJsonOrNull(url: string): Promise<unknown | null> {
  const response = await fetch(url, { cache: 'no-store' });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`${url} → HTTP ${response.status}`);
  return (await response.json()) as unknown;
}

export async function loadCaptureReport(baseUrl: string): Promise<CaptureReport | null> {
  const data = await fetchJsonOrNull(`${baseUrl}assets/skills-lab/captures/report.json`);
  if (data === null) return null;
  const report = data as Partial<CaptureReport>;
  if (!Array.isArray(report.results)) throw new Error('captures/report.json has no results array');
  return report as CaptureReport;
}

export async function loadGaps(baseUrl: string): Promise<GapsFile | null> {
  const data = await fetchJsonOrNull(`${baseUrl}assets/skills-lab/gaps.json`);
  if (data === null) return null;
  const file = data as Partial<GapsFile>;
  if (!Array.isArray(file.gaps)) throw new Error('gaps.json has no gaps array');
  return file as GapsFile;
}
