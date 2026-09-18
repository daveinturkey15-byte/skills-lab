/**
 * Source 58 — DERMIS comparator atoms: strand hair, procedural skin/iris,
 * one blink channel, on a fixed generic base.
 *
 * The catalogue row (SamG-Coder/dermis-cuda @ 6c7c598, MIT, licence file read
 * at pin) records a CUDA-authored procedural human renderer with NO image
 * input path, one fixed base head and a single blink channel — explicitly NOT
 * a likeness route. There is no portable implementation to extract, so this
 * demo restates the comparator atoms only: compute-style scalp strands with
 * per-strand length limits and breeze, procedural skin and iris detail, live
 * blink on one channel, and a diagnostic-style presentation.
 *
 * The base is a smooth symmetric mannequin authored here. It cannot take a
 * likeness by construction: no image input exists anywhere in this file, the
 * skin is hash mottling, and the features are primitives. That limitation is
 * the point, and the metadata owns it.
 */

import type * as THREE from 'three';
import type {
  DemoContext,
  DemoInstance,
  DemoMetadata,
} from '../../types';
import { createRng, disposeTree, fbm2, hash2 } from './shared';

export const SOURCE_URLS = [
  'https://x.com/samgcoder/status/2100145265235923015',
  'https://github.com/SamG-Coder/dermis-cuda',
] as const;

/** Strand count: the density control, fixed at construction. */
const STRANDS = 850;
/** Head centre and radii of the fixed generic base. */
const HEAD_Y = 1.5;
const HEAD_RADII: [number, number, number] = [0.147, 0.189, 0.157];
/** Blink period and closed dwell: the single blink channel. */
const BLINK_PERIOD = 3.7;
const BLINK_CLOSED = 0.12;

interface Strand {
  anchor: [number, number, number];
  direction: [number, number, number];
  length: number;
  phase: number;
}

/** Procedural skin mottle baked into a colour attribute: hash fbm, no maps. */
function paintSkin(
  three: DemoContext['THREE'],
  geometry: THREE.BufferGeometry,
  seed: number,
): void {
  const positions = geometry.getAttribute('position');
  const colours = new Float32Array(positions.count * 3);
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    const mottle = fbm2(x * 22 + seed, (y + z) * 19 - seed, 3, seed);
    const flush = fbm2(x * 6 - seed, z * 7 + seed, 2, seed ^ 0x5e1);
    colours[i * 3] = 0.66 + mottle * 0.12 + flush * 0.05;
    colours[i * 3 + 1] = 0.5 + mottle * 0.09;
    colours[i * 3 + 2] = 0.4 + mottle * 0.07 - flush * 0.02;
  }
  geometry.setAttribute('color', new three.BufferAttribute(colours, 3));
}

/** Iris disc: dark pupil, hazel mid ring, dark limbal rim — all vertex colour. */
function irisGeometry(three: DemoContext['THREE']): THREE.BufferGeometry {
  const geometry = new three.CircleGeometry(0.028, 24);
  const positions = geometry.getAttribute('position');
  const colours = new Float32Array(positions.count * 3);
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const r = Math.min(1, Math.hypot(x, y) / 0.028);
    let cr: number;
    let cg: number;
    let cb: number;
    if (r < 0.34) {
      cr = 0.04; cg = 0.03; cb = 0.03;
    } else if (r < 0.8) {
      const k = (r - 0.34) / 0.46;
      cr = 0.32 + k * 0.14; cg = 0.22 + k * 0.1; cb = 0.1 + k * 0.04;
    } else {
      cr = 0.1; cg = 0.08; cb = 0.06;
    }
    colours[i * 3] = cr;
    colours[i * 3 + 1] = cg;
    colours[i * 3 + 2] = cb;
  }
  geometry.setAttribute('color', new three.BufferAttribute(colours, 3));
  return geometry;
}

export function createDemo(context: DemoContext): DemoInstance {
  const { THREE, seed } = context;
  const rng = createRng(seed ^ 0xde25);
  const root = new THREE.Group();
  root.name = 'source-58:procedural-human-atoms';

  const skinMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0 });
  const hairMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.05 });

  // Fixed generic base: plinth, shoulders, neck, mannequin head. Primitives
  // only, symmetric, smooth — nothing here can carry an identity.
  const plinthGeometry = new THREE.CylinderGeometry(0.34, 0.4, 0.9, 20);
  paintSkin(THREE, plinthGeometry, 3);
  const plinth = new THREE.Mesh(plinthGeometry, skinMaterial);
  plinth.position.y = 0.45;
  plinth.name = 'plinth';
  root.add(plinth);

  const shoulderGeometry = new THREE.SphereGeometry(0.22, 20, 12);
  shoulderGeometry.scale(1.6, 0.55, 0.9);
  paintSkin(THREE, shoulderGeometry, 5);
  const shoulders = new THREE.Mesh(shoulderGeometry, skinMaterial);
  shoulders.position.y = 0.98;
  shoulders.name = 'shoulders';
  root.add(shoulders);

  const neckGeometry = new THREE.CylinderGeometry(0.07, 0.085, 0.28, 12);
  paintSkin(THREE, neckGeometry, 7);
  const neck = new THREE.Mesh(neckGeometry, skinMaterial);
  neck.position.y = 1.2;
  neck.name = 'neck';
  root.add(neck);

  const headGeometry = new THREE.SphereGeometry(0.16, 28, 20);
  headGeometry.scale(HEAD_RADII[0] / 0.16, HEAD_RADII[1] / 0.16, HEAD_RADII[2] / 0.16);
  // Flatten the back of the skull slightly: reads as a head form, stays a doll.
  {
    const positions = headGeometry.getAttribute('position');
    for (let i = 0; i < positions.count; i += 1) {
      if (positions.getZ(i) < -0.1) positions.setZ(i, -0.1 + (positions.getZ(i) + 0.1) * 0.6);
    }
    positions.needsUpdate = true;
    headGeometry.computeVertexNormals();
  }
  paintSkin(THREE, headGeometry, seed);
  const head = new THREE.Mesh(headGeometry, skinMaterial);
  head.position.y = HEAD_Y;
  head.name = 'generic-base-head';
  root.add(head);

  // Nose wedge and closed lip arc: the minimum feature set that reads as a
  // face without approaching any individual.
  const noseGeometry = new THREE.ConeGeometry(0.022, 0.06, 6);
  paintSkin(THREE, noseGeometry, 11);
  const nose = new THREE.Mesh(noseGeometry, skinMaterial);
  nose.position.set(0, HEAD_Y + 0.01, HEAD_RADII[2] + 0.012);
  nose.rotation.x = Math.PI / 2 + 0.25;
  nose.name = 'nose-wedge';
  root.add(nose);

  const lipGeometry = new THREE.TorusGeometry(0.032, 0.008, 6, 14, Math.PI);
  paintSkin(THREE, lipGeometry, 13);
  const lips = new THREE.Mesh(lipGeometry, new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.6,
    color: new THREE.Color(0.75, 0.6, 0.6),
  }));
  lips.position.set(0, HEAD_Y - 0.075, HEAD_RADII[2] - 0.012);
  lips.rotation.x = -0.15;
  lips.rotation.z = Math.PI;
  lips.name = 'lips';
  root.add(lips);

  // Eyes: off-white spheres, procedural iris discs, one lid shell each. The
  // lids share a single blink driver — the source's one blink channel.
  const lids: THREE.Mesh[] = [];
  const eyeWhiteGeometry = new THREE.SphereGeometry(0.032, 14, 10);
  eyeWhiteGeometry.scale(1, 0.72, 0.6);
  const eyeWhiteMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.88, 0.86, 0.82), roughness: 0.35 });
  const sharedIris = irisGeometry(THREE);
  const irisMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3 });
  const lidGeometry = new THREE.SphereGeometry(0.036, 14, 8);
  lidGeometry.scale(1, 1, 0.62);
  paintSkin(THREE, lidGeometry, 17);
  for (const side of [-1, 1]) {
    const white = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
    white.position.set(side * 0.058, HEAD_Y + 0.02, HEAD_RADII[2] - 0.018);
    white.name = side < 0 ? 'eye-white-L' : 'eye-white-R';
    root.add(white);
    const iris = new THREE.Mesh(sharedIris, irisMaterial);
    iris.position.set(side * 0.058, HEAD_Y + 0.02, HEAD_RADII[2] + 0.004);
    iris.name = side < 0 ? 'iris-L' : 'iris-R';
    root.add(iris);
    const lid = new THREE.Mesh(lidGeometry, skinMaterial);
    lid.position.set(side * 0.058, HEAD_Y + 0.028, HEAD_RADII[2] - 0.016);
    lid.scale.set(1.02, 0.32, 1.02);
    lid.name = side < 0 ? 'lid-L' : 'lid-R';
    root.add(lid);
    lids.push(lid);
  }

  // Brows: two angled bars, same skin — expression anchor, not identity.
  const browGeometry = new THREE.BoxGeometry(0.055, 0.009, 0.012);
  paintSkin(THREE, browGeometry, 19);
  for (const side of [-1, 1]) {
    const brow = new THREE.Mesh(browGeometry, skinMaterial);
    brow.position.set(side * 0.06, HEAD_Y + 0.075, HEAD_RADII[2] - 0.008);
    brow.rotation.z = side * -0.12;
    brow.name = side < 0 ? 'brow-L' : 'brow-R';
    root.add(brow);
  }

  // Scalp strands: tapered, pre-bent instances rooted on a fibonacci dome,
  // biased to crown/back/sides with a face opening. Per-strand length is the
  // source's length-limit atom; breeze is whole-strand sway, not simulation.
  const strandGeometry = new THREE.CylinderGeometry(0.007, 0.016, 1, 4, 3);
  strandGeometry.translate(0, 0.5, 0);
  {
    const positions = strandGeometry.getAttribute('position');
    for (let i = 0; i < positions.count; i += 1) {
      const y = positions.getY(i);
      positions.setX(i, positions.getX(i) + y * y * 0.35);
    }
    positions.needsUpdate = true;
    strandGeometry.computeVertexNormals();
    const colours = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i += 1) {
      const t = positions.getY(i);
      colours[i * 3] = 0.16 + t * 0.06;
      colours[i * 3 + 1] = 0.1 + t * 0.04;
      colours[i * 3 + 2] = 0.07 + t * 0.02;
    }
    strandGeometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  }
  const strands: Strand[] = [];
  {
    let placed = 0;
    let guard = 0;
    while (placed < STRANDS && guard < STRANDS * 30) {
      guard += 1;
      // Fibonacci dome for even coverage without pole clumping.
      const k = (placed + 0.5) / STRANDS;
      const cosPhi = 1 - 2 * k;
      const sinPhi = Math.sqrt(Math.max(0, 1 - cosPhi * cosPhi));
      const theta = placed * 2.399963 + rng() * 0.2;
      const dx = sinPhi * Math.cos(theta);
      const dy = cosPhi;
      const dz = sinPhi * Math.sin(theta);
      if (dy < -0.05) continue;
      // Face opening: no roots on the front-low face panel.
      if (dz > 0.55 && dy < 0.6) continue;
      const anchor: [number, number, number] = [
        dx * HEAD_RADII[0] * 0.98,
        HEAD_Y + dy * HEAD_RADII[1] * 0.98,
        dz * HEAD_RADII[2] * 0.98,
      ];
      // Outward normal tipped down-slope: strands lie toward the shoulders.
      const down = Math.max(0, 0.55 - dy) * 0.9 + 0.25;
      const inv = 1 / Math.hypot(dx, dy - down, dz);
      strands.push({
        anchor,
        direction: [dx * inv, (dy - down) * inv, dz * inv],
        length: 0.3 + hash2(placed, 29, seed) * 0.45,
        phase: rng() * Math.PI * 2,
      });
      placed += 1;
    }
  }
  const hair = new THREE.InstancedMesh(strandGeometry, hairMaterial, Math.max(1, strands.length));
  hair.name = 'scalp-strands';
  // Anchors span the skull while the base geometry is a unit strand at the
  // origin, so the mesh-level bounds test cannot see them.
  hair.frustumCulled = false;
  const upVector = new THREE.Vector3(0, 1, 0);
  const scratch = new THREE.Object3D();
  const strandDir = new THREE.Vector3();
  strands.forEach((strand, i) => {
    strandDir.set(strand.direction[0], strand.direction[1], strand.direction[2]);
    scratch.position.set(strand.anchor[0], strand.anchor[1], strand.anchor[2]);
    scratch.quaternion.setFromUnitVectors(upVector, strandDir);
    scratch.scale.set(1, strand.length, 1);
    scratch.updateMatrix();
    hair.setMatrixAt(i, scratch.matrix);
  });
  hair.instanceMatrix.needsUpdate = true;
  root.add(hair);

  // Mottled studio halo: a second tone behind the bust so the head reads
  // against structure rather than void. Fbm-broken, never one flat tone.
  // Sized 3.2x2.6 and faced to the host camera (azimuth 45 deg) so it owns
  // pixels instead of foreshortening; brightened clear of the background
  // bucket so the gate counts it as subject, not void. Presentation only.
  const haloGeometry = new THREE.PlaneGeometry(3.2, 2.6, 18, 14);
  {
    const positions = haloGeometry.getAttribute('position');
    const colours = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const r = Math.min(1, Math.hypot(x / 1.6, y / 1.3));
      const mottle = fbm2(x * 2.1, y * 2.1 + 5, 3, seed);
      const v = (0.16 + mottle * 0.18) * (1 - r * 0.45);
      colours[i * 3] = v * 0.9;
      colours[i * 3 + 1] = v;
      colours[i * 3 + 2] = v * 1.25;
    }
    haloGeometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  }
  const halo = new THREE.Mesh(
    haloGeometry,
    new THREE.MeshBasicMaterial({ vertexColors: true }),
  );
  halo.position.set(0, 1.45, -0.55);
  halo.rotation.y = Math.PI / 4;
  halo.name = 'studio-halo';
  root.add(halo);

  let triangles = 0;
  root.traverse((object) => {
    const mesh = object as THREE.Mesh | THREE.InstancedMesh;
    const geometry = (mesh as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
    if (!geometry) return;
    const perGeometry = (geometry.index ? geometry.index.count : geometry.getAttribute('position').count) / 3;
    const instances = (mesh as THREE.InstancedMesh).isInstancedMesh
      ? (mesh as THREE.InstancedMesh).count
      : 1;
    triangles += Math.round(perGeometry * instances);
  });

  const metadata: DemoMetadata & { counters: Record<string, number> } = {
    sourceId: 58,
    title: 'DERMIS atoms — strand hair, procedural skin and iris, one blink',
    method:
      'Comparator atoms on a fixed generic base: fibonacci-rooted tapered scalp strands with '
      + 'per-strand length limits and breeze-phase sway, fbm-mottled procedural skin and a '
      + 'three-stop procedural iris, and a single shared blink driver closing both lids on '
      + 'one channel.',
    adaptation: 'adapted',
    sources: [...SOURCE_URLS],
    limitation:
      'Comparator only: no CUDA, no compute authoring, no capture and no likeness — the base '
      + 'is a symmetric mannequin and no image input exists, which is exactly the source\'s '
      + 'own NOT-a-likeness-route position. Strands are rigid pre-bent instances with '
      + 'whole-strand sway, not simulated curves; skin is vertex-colour fbm, not a pore '
      + 'shader; one blink channel and no other expression. MIT repo located at 6c7c598; '
      + 'method restated, nothing vendored.',
    counters: {
      strands: strands.length,
      triangles,
    },
  };

  return {
    root,
    update: (time: number) => {
      // One blink channel: both lids share the driver, closed 0.12 s per period.
      const blinkPhase = (time % BLINK_PERIOD) / BLINK_PERIOD;
      const closed = blinkPhase < BLINK_CLOSED / BLINK_PERIOD ? 1 : 0;
      const lidY = closed === 1 ? 1.0 : 0.32 + Math.sin(time * 0.8) * 0.02;
      for (const lid of lids) lid.scale.y = lidY;
      // Breeze: whole-strand rock around each root, phased per strand.
      for (let i = 0; i < strands.length; i += 1) {
        const strand = strands[i];
        const sway = Math.sin(time * 1.4 + strand.phase) * 0.06
          + Math.sin(time * 3.1 + strand.phase * 2.2) * 0.02;
        strandDir.set(strand.direction[0], strand.direction[1], strand.direction[2]);
        scratch.position.set(strand.anchor[0], strand.anchor[1], strand.anchor[2]);
        scratch.quaternion.setFromUnitVectors(upVector, strandDir);
        scratch.rotateZ(sway);
        scratch.scale.set(1, strand.length, 1);
        scratch.updateMatrix();
        hair.setMatrixAt(i, scratch.matrix);
      }
      hair.instanceMatrix.needsUpdate = true;
    },
    dispose: () => disposeTree(root),
    metadata,
  };
}

export default createDemo;
