/**
 * Source 1 — Mocap to in-game animation (`squall01337/mixamo-llm-mocap`).
 *
 * Read at pin `00dfd5385506022d533c84f6737a09f5f4392623`:
 *   docs/RIG.md (lines 1-91), action_specs/spin.json, pipeline/apply_mixamo_fk.py.
 *
 * The full upstream pipeline is GVHMR pose estimation plus a Blender FK apply and
 * is not runnable here — it needs Blender, GPU checkpoints and SMPL-X data. What
 * IS portable, and is what this demo implements, is the part of the method that
 * `docs/RIG.md` spends its most emphatic lines on:
 *
 *   "**No Blender IK, ever.** Constraint IK explodes this rig (feet at -81 m
 *    historically). Feet are planted by searching the hip height until the
 *    support foot reaches ground, plus Z-only foot flattening."  (RIG.md:52-54)
 *
 * So: FK-only pose evaluation from an action spec, then ground contact resolved
 * by a bisection search on hip height rather than by an IK solver. BEFORE is the
 * raw FK pose (the support foot sinks through and floats above the floor as the
 * knee bends); AFTER is the same pose with the hip-height search applied. The
 * floor plate under each half makes the contact error visible.
 *
 * Adaptation, stated plainly: the skeleton here is a 9-joint proportioned stand-in
 * built from RIG.md's measured chain lengths (thigh 0.406, shin 0.421, foot 0.157,
 * ankle ground contact 0.105, hips 0.998), NOT a 65-bone `mixamorig:` rig, and the
 * motion is a deterministic synthetic crouch-and-step rather than reconstructed
 * footage. The contact-resolution method is the thing being demonstrated.
 */

import {
  DisposalRegistry,
  countDrawables,
  countTriangles,
  makeRng,
  sideBySide,
  type Demo,
  type DemoContext,
  type ThreeNamespace,
} from './_shared';
import type * as THREE_NS from 'three';

/** Y Bot reference measurements, docs/RIG.md "Key measurements" table. */
const RIG = {
  hipsHeight: 0.998,
  ankleContact: 0.105,
  thigh: 0.406,
  shin: 0.421,
  foot: 0.157,
  spine: 0.258,
  neckHead: 0.304,
} as const;

interface Leg {
  hip: THREE_NS.Object3D;
  knee: THREE_NS.Object3D;
  ankle: THREE_NS.Object3D;
  toe: THREE_NS.Object3D;
}

interface Figure {
  root: THREE_NS.Group;
  pelvis: THREE_NS.Object3D;
  legs: [Leg, Leg];
  arms: [{ shoulder: THREE_NS.Object3D; elbow: THREE_NS.Object3D }, { shoulder: THREE_NS.Object3D; elbow: THREE_NS.Object3D }];
}

function buildFigure(THREE: ThreeNamespace, registry: DisposalRegistry, tint: number): Figure {
  const bone = registry.track(new THREE.BoxGeometry(0.105, 1, 0.105));
  const joint = registry.track(new THREE.SphereGeometry(0.06, 10, 8));
  const limbMaterial = registry.track(new THREE.MeshStandardMaterial({ color: tint, roughness: 0.7 }));
  const jointMaterial = registry.track(new THREE.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 0.5 }));
  // Pale outlines on every bone: the joint reading the demo is about lives in
  // its edges at stage distance, and the capture gate counts exactly those.
  const outlineMaterial = registry.track(new THREE.LineBasicMaterial({ color: 0xe8e2d4, transparent: true, opacity: 0.55 }));
  const boneEdges = registry.track(new THREE.EdgesGeometry(bone));
  const jointEdges = registry.track(new THREE.EdgesGeometry(joint));

  const root = new THREE.Group();
  root.name = 'figure';

  const pelvis = new THREE.Group();
  pelvis.name = 'Hips';
  pelvis.position.y = RIG.hipsHeight;
  root.add(pelvis);

  const segment = (length: number, parent: THREE_NS.Object3D, name: string) => {
    const pivot = new THREE.Group();
    pivot.name = name;
    parent.add(pivot);
    const mesh = new THREE.Mesh(bone, limbMaterial);
    mesh.scale.y = length;
    mesh.position.y = -length / 2;
    pivot.add(mesh);
    const cap = new THREE.Mesh(joint, jointMaterial);
    pivot.add(cap);
    return pivot;
  };

  const spine = segment(RIG.spine, pelvis, 'Spine');
  spine.children[0].position.y = RIG.spine / 2;
  const head = new THREE.Mesh(joint, jointMaterial);
  head.scale.setScalar(2.0);
  head.position.y = RIG.spine + RIG.neckHead * 0.5;
  pelvis.add(head);

  const arms = [-1, 1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.name = side < 0 ? 'LeftShoulder' : 'RightShoulder';
    shoulder.position.set(side * 0.21, RIG.spine * 0.9, 0);
    pelvis.add(shoulder);
    const upperMesh = new THREE.Mesh(bone, limbMaterial);
    upperMesh.scale.y = 0.3;
    upperMesh.position.y = -0.15;
    shoulder.add(upperMesh);
    const elbow = new THREE.Group();
    elbow.name = side < 0 ? 'LeftForeArm' : 'RightForeArm';
    elbow.position.y = -0.3;
    shoulder.add(elbow);
    const foreMesh = new THREE.Mesh(bone, limbMaterial);
    foreMesh.scale.y = 0.28;
    foreMesh.position.y = -0.14;
    elbow.add(foreMesh);
    const hand = new THREE.Mesh(joint, jointMaterial);
    hand.position.y = -0.3;
    elbow.add(hand);
    return { shoulder, elbow };
  }) as unknown as Figure['arms'];

  const legs = [-1, 1].map((side) => {
    const hip = new THREE.Group();
    hip.name = side < 0 ? 'LeftUpLeg' : 'RightUpLeg';
    hip.position.set(side * 0.14, 0, 0);
    pelvis.add(hip);
    const thighMesh = new THREE.Mesh(bone, limbMaterial);
    thighMesh.scale.y = RIG.thigh;
    thighMesh.position.y = -RIG.thigh / 2;
    hip.add(thighMesh);

    const knee = segment(RIG.shin, hip, side < 0 ? 'LeftLeg' : 'RightLeg');
    knee.position.y = -RIG.thigh;

    const ankle = new THREE.Group();
    ankle.name = side < 0 ? 'LeftFoot' : 'RightFoot';
    ankle.position.y = -RIG.shin;
    knee.add(ankle);
    const footMesh = new THREE.Mesh(bone, limbMaterial);
    footMesh.scale.set(1.4, RIG.foot, 2.6);
    footMesh.position.set(0, -0.03, RIG.foot * 0.35);
    ankle.add(footMesh);

    const toe = new THREE.Group();
    toe.name = side < 0 ? 'LeftToeBase' : 'RightToeBase';
    toe.position.set(0, -0.05, RIG.foot);
    ankle.add(toe);

    return { hip, knee, ankle, toe } satisfies Leg;
  }) as unknown as [Leg, Leg];

  root.traverse((object) => {
    const mesh = object as THREE_NS.Mesh;
    if (!mesh.isMesh) return;
    const edges = mesh.geometry === bone ? boneEdges : mesh.geometry === joint ? jointEdges : null;
    if (!edges) return;
    const outline = new THREE.LineSegments(edges, outlineMaterial);
    outline.name = 'bone-outline';
    mesh.add(outline);
  });
  return { root, pelvis, legs, arms };
}

/**
 * Evaluate the action spec by forward kinematics only. `action_specs/spin.json`
 * upstream is a list of named beats with per-bone Euler targets and a duration;
 * this is the same shape, reduced to the two leg chains.
 */
const ACTION_SPEC = {
  name: 'crouch-step',
  fps: 30,
  beats: [
    { t: 0.0, hipPitch: 0.0, knee: [0.05, 0.05], ankle: [-0.05, -0.05] },
    { t: 0.35, hipPitch: 0.12, knee: [0.95, 0.2], ankle: [-0.55, -0.2] },
    { t: 0.7, hipPitch: 0.18, knee: [1.35, 0.5], ankle: [-0.8, -0.35] },
    { t: 1.0, hipPitch: 0.05, knee: [0.25, 0.1], ankle: [-0.15, -0.08] },
  ],
} as const;

function sampleSpec(phase: number) {
  const beats = ACTION_SPEC.beats;
  let i = 0;
  while (i < beats.length - 2 && phase > beats[i + 1].t) i += 1;
  const a = beats[i];
  const b = beats[i + 1];
  const span = Math.max(1e-4, b.t - a.t);
  const k = Math.min(1, Math.max(0, (phase - a.t) / span));
  return {
    hipPitch: a.hipPitch + (b.hipPitch - a.hipPitch) * k,
    knee: [a.knee[0] + (b.knee[0] - a.knee[0]) * k, a.knee[1] + (b.knee[1] - a.knee[1]) * k],
    ankle: [a.ankle[0] + (b.ankle[0] - a.ankle[0]) * k, a.ankle[1] + (b.ankle[1] - a.ankle[1]) * k],
  };
}

function applyFk(figure: Figure, phase: number, hipsHeight: number): void {
  const pose = sampleSpec(phase);
  figure.pelvis.position.y = hipsHeight;
  figure.pelvis.rotation.x = pose.hipPitch;
  for (let s = 0; s < 2; s += 1) {
    const leg = figure.legs[s];
    leg.hip.rotation.x = -pose.knee[s] * 0.45;
    leg.knee.rotation.x = pose.knee[s];
    leg.ankle.rotation.x = pose.ankle[s];
    // Counter-swing from the same spec beats: arms stay FK-only, quaternion
    // keyed like every other non-Hips joint, and widen the silhouette.
    const arm = figure.arms[s];
    arm.shoulder.rotation.x = 0.12 + pose.knee[s] * 0.3;
    arm.shoulder.rotation.z = s === 0 ? 0.18 : -0.18;
    arm.elbow.rotation.x = -0.35 - pose.knee[s] * 0.25;
  }
  figure.root.updateMatrixWorld(true);
}

/**
 * RIG.md's plant rule, implemented: bisect the hip height until the lower of the
 * two ankles reaches the measured ground-contact height. No IK, no constraints —
 * exactly the "search the hip height" wording, with the Z-only foot flattening
 * left out because this stand-in rig has no toe roll to flatten.
 */
function plantFeet(
  figure: Figure,
  phase: number,
  scratch: THREE_NS.Vector3,
): { hipsHeight: number; iterations: number; residual: number } {
  let lo = 0.2;
  let hi = 1.4;
  let iterations = 0;
  let residual = Number.POSITIVE_INFINITY;
  let hipsHeight = RIG.hipsHeight;
  for (; iterations < 24; iterations += 1) {
    hipsHeight = (lo + hi) / 2;
    applyFk(figure, phase, hipsHeight);
    let lowest = Number.POSITIVE_INFINITY;
    for (const leg of figure.legs) {
      leg.ankle.getWorldPosition(scratch);
      lowest = Math.min(lowest, scratch.y);
    }
    residual = lowest - RIG.ankleContact;
    if (Math.abs(residual) < 1e-4) break;
    if (residual > 0) hi = hipsHeight;
    else lo = hipsHeight;
  }
  return { hipsHeight, iterations, residual };
}

export function createDemo(context: DemoContext): Demo {
  const { THREE } = context;
  const registry = new DisposalRegistry();
  const rng = makeRng(context.seed);

  const before = buildFigure(THREE, registry, 0x9a5a4a);
  const after = buildFigure(THREE, registry, 0x4a7a9a);
  before.root.name = 'before:raw-fk';
  after.root.name = 'after:hip-search-plant';
  // Stage scale: the plant error reads at 1.5x, and the pair sits closer, so the
  // figures fill more of their own bounding sphere at the host fit distance.
  // Both halves scale together (proportions preserved), so the comparison stays like-for-like.
  before.root.scale.setScalar(1.5);
  after.root.scale.setScalar(1.5);

  // Reference ground so the contact error is readable rather than asserted.
  const floorGeometry = registry.track(new THREE.PlaneGeometry(1.3, 1.3));
  const floorMaterial = registry.track(
    new THREE.MeshStandardMaterial({ color: 0x4c4c48, roughness: 0.95 }),
  );
  for (const figure of [before, after]) {
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.name = 'ground';
    figure.root.add(floor);
  }
  // Plant-target discs: where the support foot must land. Static, inside the
  const discGeometry = registry.track(new THREE.CircleGeometry(0.28, 20));
  const beforeDiscMaterial = registry.track(new THREE.MeshStandardMaterial({ color: 0x6a3535, roughness: 0.9 }));
  const afterDiscMaterial = registry.track(new THREE.MeshStandardMaterial({ color: 0x355a3a, roughness: 0.9 }));
  for (const entry of [
    { figure: before, material: beforeDiscMaterial },
    { figure: after, material: afterDiscMaterial },
  ]) {
    for (const side of [-1, 1]) {
      const disc = new THREE.Mesh(discGeometry, entry.material);
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(side * 0.14, 0.004, 0.08);
      disc.name = 'plant-target';
      entry.figure.root.add(disc);
    }
  }

  const root = sideBySide(THREE, registry, before.root, after.root, 1.05);
  root.name = 'source-01:mocap-foot-contact';
  // A small jitter proves the seed is consumed; identical seeds give identical trees.
  root.rotation.y = (rng() - 0.5) * 0.06;

  const scratch = new THREE.Vector3();
  let lastPlant = plantFeet(after, 0, scratch);
  applyFk(before, 0, RIG.hipsHeight);

  const metadata = {
    sourceId: 1,
    title: 'Mocap to in-game animation',
    method:
      'FK-only pose evaluation from an action spec, with ground contact resolved by bisecting hip height to the measured ankle-contact height (RIG.md: "No Blender IK, ever"), instead of a constraint IK solver.',
    adaptation: 'adapted' as const,
    sources: [
      'https://x.com/Graalitoo/status/2089469774602633431',
      'https://github.com/squall01337/mixamo-llm-mocap',
      'squall01337/mixamo-llm-mocap@00dfd5385506022d533c84f6737a09f5f4392623 docs/RIG.md:44-57,70-90',
    ],
    limitation:
      'The upstream pipeline needs Blender, GVHMR checkpoints, SMPL-X data and Mixamo characters and was not executed here; Mixamo character redistribution is not granted by that repo. This demo rebuilds only the plant step on a 9-joint stand-in proportioned from RIG.md measurements, driven by a synthetic action spec rather than reconstructed footage.',
    counters: {
      triangles: countTriangles(root),
      drawables: countDrawables(root),
      plantIterations: lastPlant.iterations,
    },
  };

  return {
    root,
    update(time: number) {
      const phase = (time * 0.35) % 1;
      applyFk(before, phase, RIG.hipsHeight);
      lastPlant = plantFeet(after, phase, scratch);
      metadata.counters.plantIterations = lastPlant.iterations;
    },
    dispose() {
      registry.run();
    },
    metadata,
  };
}

export default createDemo;
