/**
 * Source 57 — JONSWAP two-scale ocean after north-swell + cuda-webshader (built).
 *
 * Catalogue row 57 names two artifacts: cuda-webshader, a bounded
 * CUDA-C-to-WGSL source translator, and north-swell, an ocean that applies it —
 * JONSWAP-baked amplitudes, depth-dispersed phase march, conjugate-symmetric
 * sum, packed horizontal chop, bilinear two-scale stitch, gradient normals and
 * Jacobian-fold foam, all GPU-resident. Nothing here executes either artifact:
 * no CUDA toolchain, no WGSL compute and no transpiler run exist in this lane.
 *
 * What this exhibit stages is the OCEAN HALF restated for the CPU: two wave
 * scales with JONSWAP-flavoured weights (our own choice of peak and width, not
 * the author's baked table), real deep-water dispersion, and a crest-factor
 * foam that stands in for the Jacobian-fold term. The control panel carries the
 * long swell alone; the technique panel stitches swell, directional chop and
 * foam — the two-scale stitch IS the visible difference. Resolution, target
 * and cost differ from the source by construction.
 */

import type { DemoContext, DemoInstance, DemoMetadata } from '../../types';
import type * as THREE_NS from 'three';
import { disposeTree, panelPair } from './shared';

export const SOURCE_URLS = [
  'https://x.com/samgcoder/status/2099056246523597071',
  'https://github.com/SamG-Coder/north-swell',
  'https://github.com/SamG-Coder/cuda-webshader',
] as const;

/** Patch edge length; the pair touches edge to edge so no stage shows between. */
const PATCH = 3.4;
const SEG = 72;
const GRAVITY = 9.81;

interface Train {
  dx: number;
  dz: number;
  length: number;
  amp: number;
}

/** Long swell: four trains around a 2.6 m peak, JONSWAP-flavoured weights. */
const SWELL: readonly Train[] = [
  { dx: 1, dz: 0.12, length: 3.1, amp: 0.085 },
  { dx: 0.94, dz: -0.34, length: 2.6, amp: 0.11 },
  { dx: 0.86, dz: 0.5, length: 2.1, amp: 0.07 },
  { dx: 0.99, dz: -0.1, length: 1.7, amp: 0.045 },
];

/** Short chop: five cross trains the control panel never sees. */
const CHOP: readonly Train[] = [
  { dx: 0.3, dz: 0.95, length: 0.85, amp: 0.02 },
  { dx: -0.2, dz: 0.98, length: 0.62, amp: 0.015 },
  { dx: 0.66, dz: -0.75, length: 0.5, amp: 0.011 },
  { dx: 0.1, dz: -0.99, length: 0.38, amp: 0.008 },
  { dx: -0.55, dz: 0.83, length: 0.3, amp: 0.006 },
];

/** Deep-water phase speed; the march is dispersive, not frozen. */
function phaseSpeed(length: number): number {
  const k = (2 * Math.PI) / length;
  return Math.sqrt(GRAVITY * k) / k;
}

function trainHeight(train: Train, x: number, z: number, time: number): number {
  const phase = (2 * Math.PI * (x * train.dx + z * train.dz)) / train.length;
  return train.amp * Math.sin(phase + time * phaseSpeed(train.length) * ((2 * Math.PI) / train.length));
}

const MAX_SWELL = SWELL.reduce((sum, train) => sum + train.amp, 0);
const MAX_FULL = MAX_SWELL + CHOP.reduce((sum, train) => sum + train.amp, 0);

function buildPatch(THREE: DemoContext['THREE'], name: string): THREE_NS.Mesh {
  const geometry = new THREE.PlaneGeometry(PATCH, PATCH, SEG, SEG);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.getAttribute('position');
  const colours = new Float32Array(position.count * 3);
  geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.32, metalness: 0.05 }),
  );
  mesh.name = name;
  return mesh;
}

/** Deep teal troughs through slate crests; foam takes over past the fold line. */
const TROUGH: readonly [number, number, number] = [0.03, 0.2, 0.33];
const CREST: readonly [number, number, number] = [0.12, 0.44, 0.55];
const FOAM: readonly [number, number, number] = [0.9, 0.94, 0.95];

function paintVertex(
  colour: THREE_NS.BufferAttribute | THREE_NS.InterleavedBufferAttribute,
  i: number,
  height: number,
  ceiling: number,
  foam: boolean,
): void {
  const t = Math.max(0, Math.min(1, height / ceiling + 0.5));
  let r = TROUGH[0] + (CREST[0] - TROUGH[0]) * t;
  let g = TROUGH[1] + (CREST[1] - TROUGH[1]) * t;
  let b = TROUGH[2] + (CREST[2] - TROUGH[2]) * t;
  if (foam) {
    const fold = Math.max(0, Math.min(1, (height / ceiling - 0.28) / 0.22));
    const eased = fold * fold * (3 - 2 * fold);
    r += (FOAM[0] - r) * eased;
    g += (FOAM[1] - g) * eased;
    b += (FOAM[2] - b) * eased;
  }
  colour.setXYZ(i, r, g, b);
}

export function createDemo(context: DemoContext): DemoInstance {
  const { THREE } = context;
  const root = new THREE.Group();
  root.name = 'source-57-two-scale-ocean';
  const { before, after } = panelPair(THREE, PATCH + 0.12);

  const control = buildPatch(THREE, 'swell-only');
  const technique = buildPatch(THREE, 'two-scale-plus-foam');
  before.add(control);
  after.add(technique);
  root.add(before, after);

  const write = (time: number): void => {
    for (const [mesh, full] of [[control, false], [technique, true]] as const) {
      const position = mesh.geometry.getAttribute('position');
      const colour = mesh.geometry.getAttribute('color');
      for (let i = 0; i < position.count; i += 1) {
        const x = position.getX(i);
        const z = position.getZ(i);
        let height = 0;
        for (const train of SWELL) height += trainHeight(train, x, z, time);
        if (full) {
          for (const train of CHOP) height += trainHeight(train, x, z, time);
        }
        position.setY(i, height);
        paintVertex(colour, i, height, full ? MAX_FULL : MAX_SWELL, full);
      }
      position.needsUpdate = true;
      colour.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    }
  };

  write(0);

  const metadata: DemoMetadata = {
    sourceId: 57,
    title: 'JONSWAP two-scale ocean: swell stitched with chop and foam',
    method:
      'Two wave scales summed per vertex with deep-water dispersion: four long swell '
      + 'trains with JONSWAP-flavoured peak weights, plus five cross chop trains stitched '
      + 'in on the technique panel only, with a crest-factor foam standing in for the '
      + 'Jacobian-fold term. Control shows the swell alone.',
    adaptation: 'adapted',
    sources: [...SOURCE_URLS],
    limitation:
      'CPU restatement, not the source pipeline: no CUDA kernel, no WGSL compute and no '
      + 'transpiler run — spectrum weights are our own choice shaped by the described '
      + 'method, not the author baked table, and three here is 0.185.1 while '
      + 'cuda-webshader pins r186 and refuses WebGL2. The author own notes disclaim '
      + 'native-CUDA-equivalent performance and cross-vendor numerical identity.',
    comparison: {
      control: 'Long swell only, no chop, no foam',
      technique: 'Two-scale stitch: swell + directional chop + crest foam',
      controlPosition: 'left',
    },
  };

  return {
    root,
    update: (time: number) => {
      write(time);
    },
    dispose: () => disposeTree(root),
    metadata,
  };
}

export default createDemo;
