/**
 * src/atlas/catalog.ts — the data layer for the Skills Atlas.
 *
 * Reads the frozen source catalogue (public/assets/skills-lab/source-catalog.json)
 * and derives the two views the catalogue does not store directly:
 *
 *   - the ADOPTION LADDER, five rungs from "we saved a link" to "a skill carries
 *     it", computed only from evidence the catalogue actually holds; and
 *   - the SKILL GRAPH, which skills a source feeds and which skills therefore
 *     co-occur on the same source.
 *
 * Nothing here upgrades a source's standing. A rung is lit because a field is
 * populated, never because a rung below it was lit.
 */

export type SourceStatus =
  | 'implemented'
  | 'method-extracted'
  | 'comparator'
  | 'blocked'
  | 'alias'
  | 'archive';

export type Adaptation = 'adapted' | 'blocked' | 'none' | 'exact';

export type SkillRelation = 'implements' | 'informs' | 'compares' | 'candidate' | 'blocked';

export type DemoStatus = 'implemented' | 'delivered' | 'blocked' | 'absent';

export interface CatalogUrl {
  kind: string;
  label: string;
  url: string;
}

export interface CatalogEvidence {
  url: string;
  inspectedAt?: string;
  observation?: string;
  pin?: string;
}

export interface CatalogSkillMapping {
  skill: string;
  relation: SkillRelation;
  sourceReference?: string;
}

export interface CatalogBlocker {
  reason?: string;
  unblockAction?: string;
  test?: string;
  experiment?: string;
  resources?: string;
}

export interface CatalogSource {
  sourceId: number;
  title: string;
  status: SourceStatus;
  adaptation: Adaptation;
  method?: string;
  urls?: CatalogUrl[];
  evidence?: CatalogEvidence[];
  limitations?: string[];
  skillMappings?: CatalogSkillMapping[];
  demo?: { status: DemoStatus; entrypoint?: string };
  blocker?: CatalogBlocker | null;
}

export interface Catalog {
  schemaVersion?: number | string;
  updatedAt?: string;
  adapterNotes?: string;
  sources: CatalogSource[];
}

/* ------------------------------------------------------------------ ladder */

export const RUNGS = [
  { key: 'linked', label: 'Link saved', hint: 'A source URL is recorded.' },
  { key: 'inspected', label: 'Source inspected', hint: 'Someone opened it and wrote down what they saw.' },
  { key: 'extracted', label: 'Technique extracted', hint: 'The method is stated in our own words.' },
  { key: 'demonstrated', label: 'Demo built', hint: 'A runnable exhibit exists in this repo.' },
  { key: 'carried', label: 'A skill carries it', hint: 'It is written into a skill other agents load.' },
] as const;

export type RungKey = (typeof RUNGS)[number]['key'];

/** Which rungs this source has actually reached, from stored fields only. */
export function ladderOf(source: CatalogSource): Record<RungKey, boolean> {
  const demo = source.demo?.status;
  const carried = (source.skillMappings ?? []).some(
    (m) => m.relation === 'implements' || m.relation === 'informs',
  );
  return {
    linked: (source.urls ?? []).length > 0,
    inspected: (source.evidence ?? []).length > 0,
    extracted: Boolean(source.method && source.method.trim().length > 0),
    demonstrated: demo === 'implemented' || demo === 'delivered',
    carried,
  };
}

/** How far up the ladder a source got, counting lit rungs (not the highest). */
export function ladderHeight(source: CatalogSource): number {
  const l = ladderOf(source);
  return RUNGS.reduce((n, r) => n + (l[r.key] ? 1 : 0), 0);
}

/* ------------------------------------------------------------- skill graph */

export interface SkillNode {
  skill: string;
  /** Sources feeding this skill, with the relation each one carries. */
  entries: Array<{ source: CatalogSource; relation: SkillRelation; sourceReference?: string }>;
  counts: Record<SkillRelation, number>;
  /** Other skills that share at least one source with this one. */
  combinedWith: Array<{ skill: string; shared: number[] }>;
  /** True when every mapping into this skill is blocked. */
  fullyBlocked: boolean;
}

const EMPTY_COUNTS = (): Record<SkillRelation, number> => ({
  implements: 0,
  informs: 0,
  compares: 0,
  candidate: 0,
  blocked: 0,
});

export function buildSkillGraph(sources: CatalogSource[]): SkillNode[] {
  const nodes = new Map<string, SkillNode>();

  for (const source of sources) {
    for (const mapping of source.skillMappings ?? []) {
      let node = nodes.get(mapping.skill);
      if (!node) {
        node = {
          skill: mapping.skill,
          entries: [],
          counts: EMPTY_COUNTS(),
          combinedWith: [],
          fullyBlocked: false,
        };
        nodes.set(mapping.skill, node);
      }
      node.entries.push({ source, relation: mapping.relation, sourceReference: mapping.sourceReference });
      node.counts[mapping.relation] += 1;
    }
  }

  // Co-occurrence: two skills are "combined" when the same source feeds both.
  for (const source of sources) {
    const skills = [...new Set((source.skillMappings ?? []).map((m) => m.skill))];
    for (const a of skills) {
      for (const b of skills) {
        if (a === b) continue;
        const node = nodes.get(a);
        if (!node) continue;
        const existing = node.combinedWith.find((c) => c.skill === b);
        if (existing) existing.shared.push(source.sourceId);
        else node.combinedWith.push({ skill: b, shared: [source.sourceId] });
      }
    }
  }

  for (const node of nodes.values()) {
    node.entries.sort((x, y) => x.source.sourceId - y.source.sourceId);
    node.combinedWith.sort((x, y) => y.shared.length - x.shared.length || x.skill.localeCompare(y.skill));
    node.fullyBlocked = node.entries.length > 0 && node.entries.every((e) => e.relation === 'blocked');
  }

  return [...nodes.values()].sort(
    (a, b) => b.entries.length - a.entries.length || a.skill.localeCompare(b.skill),
  );
}

/**
 * A skill name that is not one of ours. The catalogue records three external
 * skill packs as mapping targets; they are other people's work and must not be
 * shown as though this workspace owned them.
 */
export function isExternalSkill(skill: string): boolean {
  return skill.includes('/');
}

/* ------------------------------------------------------------------- load */

export async function loadCatalog(baseUrl: string): Promise<Catalog> {
  const response = await fetch(`${baseUrl}assets/skills-lab/source-catalog.json`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`source-catalog.json → HTTP ${response.status}`);
  const data = (await response.json()) as Catalog;
  if (!Array.isArray(data.sources)) throw new Error('source-catalog.json has no sources array');
  return data;
}
