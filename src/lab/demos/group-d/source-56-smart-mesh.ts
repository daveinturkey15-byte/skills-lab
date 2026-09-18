/**
 * Source 56 — Tripo3D smart-mesh game-ready assets (comparator).
 *
 * The catalogue row is a comparator: a vendor text/image-to-3D route whose
 * retopology step ("smart mesh") targets game-friendly poly counts, used for
 * an entire game's environment art. There is no repository, no technique
 * write-up and no licence to build from, so nothing here reproduces vendor
 * output — the quoted-post media itself was never in evidence.
 *
 * What this exhibit does is make the CLAIM mechanical with our own geometry:
 * one authored mage tower staged twice, at sculpt density and at a game-ready
 * density, with the triangle counts carried in the counters. The low half
 * wears a wireframe overlay on its three largest masses so the retopology
 * bargain — fewer triangles, edge flow preserved where the silhouette lives —
 * is inspectable rather than asserted. Both towers rotate as one turntable.
 */

import type {
  DemoComparison,
  DemoContext,
  DemoInstance,
  DemoMetadata,
} from '../../types';
import type * as THREE_NS from 'three';
import { disposeTree } from './shared';

export const SOURCE_URLS = [
  'https://x.com/majidmanzarpour/status/2098926447150645605',
] as const;

/** Radial density of the sculpt-density staging. */
export const SCULPT_SEGMENTS = 40;
/** Radial density of the game-ready staging. */
export const GAME_SEGMENTS = 7;

function countTris(root: THREE_NS.Object3D): number {
  let tris = 0;
  root.traverse((obj) => {
    const mesh = obj as THREE_NS.Mesh;
    const geometry = mesh.geometry as THREE_NS.BufferGeometry | undefined;
    if (!geometry) return;
    const position = geometry.getAttribute('position');
    if (!position) return;
    const index = geometry.getIndex();
    tris += index ? index.count / 3 : position.count / 3;
  });
  return Math.round(tris);
}

/**
 * One mage tower from stacked primitives: stepped base, tapered shaft, collar,
 * drum, crenellations, spire, three emissive slit windows — authored here, not
 * copied from anywhere. The Hexen/assassin-mage association is the catalogue's
 * context for the row, not geometry taken from any source.
 */
function buildTower(
  THREE: DemoContext['THREE'],
  radialSegments: number,
  stone: THREE_NS.Material,
  trim: THREE_NS.Material,
  glow: THREE_NS.Material,
): THREE_NS.Group {
  const tower = new THREE.Group();
  const add = (
    geometry: THREE_NS.BufferGeometry,
    material: THREE_NS.Material,
    y: number,
    name: string,
  ): THREE_NS.Mesh => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = y;
    mesh.name = name;
    tower.add(mesh);
    return mesh;
  };
  add(new THREE.CylinderGeometry(0.85, 0.95, 0.18, radialSegments), stone, 0.09, 'stepped-base');
  const shaft = add(
    new THREE.CylinderGeometry(0.55, 0.72, 1.2, radialSegments),
    stone,
    0.78,
    'tapered-shaft',
  );
  add(new THREE.CylinderGeometry(0.78, 0.68, 0.12, radialSegments), trim, 1.44, 'collar');
  const drum = add(
    new THREE.CylinderGeometry(0.5, 0.55, 0.35, radialSegments),
    stone,
    1.67,
    'upper-drum',
  );
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), trim);
    merlon.position.set(Math.cos(angle) * 0.46, 1.92, Math.sin(angle) * 0.46);
    merlon.name = `merlon-${i}`;
    tower.add(merlon);
  }
  const spire = add(
    new THREE.ConeGeometry(0.42, 0.55, radialSegments),
    trim,
    2.26,
    'spire',
  );
  for (let i = 0; i < 3; i += 1) {
    const slit = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.3), glow);
    const angle = (i / 3) * Math.PI * 2 + 0.5;
    slit.position.set(Math.cos(angle) * 0.66, 0.85 + i * 0.12, Math.sin(angle) * 0.66);
    slit.rotation.y = -angle + Math.PI / 2;
    slit.name = `slit-window-${i}`;
    tower.add(slit);
  }
  tower.userData.wireframeMasses = [shaft, drum, spire];
  return tower;
}

export function createDemo(context: DemoContext): DemoInstance {
  const { THREE } = context;
  const root = new THREE.Group();
  root.name = 'source-56-smart-mesh-ladder';

  const stoneHigh = new THREE.MeshStandardMaterial({ color: 0x8a7f74, roughness: 0.85 });
  const trimHigh = new THREE.MeshStandardMaterial({ color: 0x4a3f55, roughness: 0.6 });
  const stoneLow = new THREE.MeshStandardMaterial({ color: 0x8a7f74, roughness: 0.85, flatShading: true });
  const trimLow = new THREE.MeshStandardMaterial({ color: 0x4a3f55, roughness: 0.6, flatShading: true });
  const glow = new THREE.MeshBasicMaterial({ color: 0xffb347, toneMapped: false });
  const wire = new THREE.MeshBasicMaterial({ color: 0x7fd4ff, wireframe: true, toneMapped: false });

  const high = buildTower(THREE, SCULPT_SEGMENTS, stoneHigh, trimHigh, glow);
  high.name = 'control:sculpt-density-tower';
  high.position.set(-1.35, 0, 0);
  const low = buildTower(THREE, GAME_SEGMENTS, stoneLow, trimLow, glow);
  low.name = 'technique:game-ready-density-tower';
  low.position.set(1.35, 0, 0);
  for (const mass of low.userData.wireframeMasses as THREE_NS.Mesh[]) {
    const overlay = new THREE.Mesh(mass.geometry, wire);
    overlay.name = `edge-flow:${mass.name}`;
    mass.add(overlay);
  }
  root.add(high, low);

  const highTris = countTris(high);
  const lowTris = countTris(low);

  const comparison: DemoComparison = {
    control: 'Sculpt density — smooth but unaffordable per frame',
    technique: 'Game-ready density — edge flow kept where the silhouette lives',
    controlPosition: 'left',
  };

  const metadata: DemoMetadata & { counters: Record<string, number> } = {
    sourceId: 56,
    title: 'Smart-mesh ladder: one tower at sculpt density and at game-ready density',
    method:
      'Stage one authored tower twice, at 40-sided and 7-sided radial density, and carry '
      + 'both triangle counts. The low half wears a wireframe overlay on its three largest '
      + 'masses so the retopology bargain — fewer triangles, edge flow preserved where the '
      + 'silhouette lives — is inspectable rather than asserted.',
    adaptation: 'adapted',
    sources: [...SOURCE_URLS],
    limitation:
      'Comparator-only source: no repository, no technique write-up and no licence exist, '
      + 'so nothing here is Tripo3D output and the "game-friendly" counts are our own '
      + 'staging, not the vendor benchmarked. The low tower is a uniform segment reduction, '
      + 'not a real retopology pass — no quad-flow optimisation, no UVs, no LOD chain. '
      + 'The quoted-post environment shots were never in evidence.',
    comparison,
    counters: {
      sculptTriangles: highTris,
      gameReadyTriangles: lowTris,
      reductionFactor: Number((highTris / Math.max(1, lowTris)).toFixed(2)),
      sculptSegments: SCULPT_SEGMENTS,
      gameSegments: GAME_SEGMENTS,
    },
  };

  return {
    root,
    update: (_time: number, dt: number) => {
      high.rotation.y += dt * 0.15;
      low.rotation.y += dt * 0.15;
    },
    dispose: () => disposeTree(root),
    metadata,
  };
}

export default createDemo;
