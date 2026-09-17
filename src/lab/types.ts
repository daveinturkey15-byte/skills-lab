/**
 * src/lab/types.ts — shared contracts for the Skills Lab host.
 *
 * The host owns the gallery/stage/sidebar UI, the single renderer and the frame
 * loop. Demo groups (arriving later under `./demos/group-N/index.ts`) only supply
 * manifest entries plus an optional demo factory each. This file is the frozen
 * factory contract both sides program against.
 */

import type * as THREE from 'three';

/** How a demo relates to its public source. Set only by the demo author. */
export type Adaptation = 'exact' | 'adapted' | 'blocked';

/**
 * Optional control-vs-technique legend for paired demos. Only demo-provided
 * metadata may name the sides; the host never invents left/right meanings.
 */
export interface DemoComparison {
  control: string;
  technique: string;
  /** Which side the control sits on in the demo's default view. */
  controlPosition?: 'left' | 'right';
}

/** Context handed to every demo factory. Fixed deterministic seed. */
export interface DemoContext {
  THREE: typeof import('three');
  seed: number;
}

/** Live demo instance owned by the host until selection change or dispose. */
export interface DemoInstance {
  root: THREE.Group;
  update?: (time: number, dt: number) => void;
  dispose: () => void;
  metadata: DemoMetadata;
}

/** Provenance block every demo must carry (and the host must display). */
export interface DemoMetadata {
  sourceId: number;
  title: string;
  method: string;
  adaptation: Adaptation;
  sources: string[];
  limitation?: string;
  /** Optional paired-scene legend; absent means the host renders none. */
  comparison?: DemoComparison;
}

/** Factory demos expose. Synchronous; the host guards throws. */
export type DemoFactory = (context: DemoContext) => DemoInstance;

/**
 * One row of a group manifest. `createDemo` is optional: a group may register
 * provenance (link saved) before any implementation exists. A missing factory
 * must render as Missing/not delivered, never as a placeholder scene.
 */
export interface DemoManifestEntry {
  sourceId: number;
  title: string;
  method: string;
  adaptation: Adaptation;
  sources: string[];
  limitation?: string;
  createDemo?: DemoFactory;
  comparison?: DemoComparison;
}

/**
 * URL-safe slug derived deterministically from a demo title. Host-side
 * identity only — never demo evidence, never reworded back into metadata.
 * Lowercases, strips diacritics, collapses every non-alphanumeric run to one
 * hyphen and trims edge hyphens; an empty result becomes `demo` so the deep
 * link `#source-<N>/<slug>` always has a non-empty slug to address.
 */
export function slugifyDemoTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug === '' ? 'demo' : slug;
}

/**
 * Disambiguate a slug within one sourceId in manifest order. The first demo
 * keeps the base slug; later collisions gain `-2`, `-3`, and so on, so the
 * identity `sourceId + slug` stays unique without touching demo titles.
 */
export function uniqueDemoSlug(title: string, taken: ReadonlySet<string>): string {
  const base = slugifyDemoTitle(title);
  if (!taken.has(base)) return base;
  let counter = 2;
  while (taken.has(`${base}-${counter}`)) counter += 1;
  return `${base}-${counter}`;
}

/** Shape of a dynamically imported `./demos/group-N/index.ts` module. */
export interface GroupModule {
  manifest?: unknown;
  /**
   * Optional group-honesty flag (shipped by group B): stable source IDs whose
   * primary source was recovered and read in the group's lane but which still
   * carries no honest demo. The host surfaces these rows; it never invents
   * content for them.
   */
  notDeliveredSourceIds?: readonly number[];
}

/**
 * Structural surface of the renderer the host actually drives. The production
 * host passes a real `THREE.WebGPURenderer`; focused CPU tests may pass a stub
 * with the same surface so mount/switch/teardown transitions are exercised
 * without a GPU. This is a test seam only — the default path never changes.
 */
export interface LabRendererLike {
  init(): Promise<unknown>;
  setPixelRatio(ratio: number): void;
  setSize(width: number, height: number, updateStyle?: boolean): void;
  render(scene: THREE.Scene, camera: THREE.Camera): unknown;
  dispose(): void;
  backend?: unknown;
  info?: { render?: { drawCalls?: number; calls?: number; triangles?: number } };
}

/** Optional host wiring overrides. Defaults keep the production behaviour. */
export interface LabHostOptions {
  /**
   * Demo-group module loaders. Defaults to the host's vite glob over
   * demos/group-star/index.ts modules; tests supply fake loaders so manifest
   * validation, mounting and teardown run against actual code.
   */
  groupLoaders?: Record<string, () => Promise<GroupModule>>;
  /** Renderer factory. Defaults to a real WebGPURenderer on the host canvas. */
  createRenderer?: (canvas: HTMLCanvasElement) => LabRendererLike;
  /**
   * Research-record loaders for the consolidated file at
   * src/research/public-research.json (one row per sourceId). Defaults to the
   * host's vite glob; tests inject bounded real-shape fixtures. Absent records
   * keep the research stages open.
   */
  researchLoaders?: Record<string, () => Promise<unknown>>;
  /**
   * Sources-lane catalog loader (public/assets/skills-lab/source-catalog.json).
   * Defaults to a runtime fetch that tolerates 404; tests inject fixtures.
   */
  sourceCatalogLoader?: () => Promise<unknown>;
  /**
   * Per-lane Blender catalog loaders keyed by glob path. Only used when a
   * caller injects them (tests); the standalone host ships no catalog glob
   * because the game-repository catalogues were not copied.
   */
  blenderCatalogLoaders?: Record<string, () => Promise<unknown>>;
  /** GLB loader seam for the Blender gallery; defaults to the installed GLTFLoader. */
  modelLoader?: { loadAsync(url: string): Promise<{ scene: THREE.Object3D }> };
}
