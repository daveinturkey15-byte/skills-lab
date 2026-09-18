import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';

/**
 * Source 1 — mocap to in-game animation: the plant step. Re-staged from
 * `src/lab/demos/group-a/source-01.ts`, keeping its load-bearing maths
 * verbatim: the Y-Bot `RIG` measurements, the `ACTION_SPEC` beats, FK-only
 * `applyFk`, and the `plantFeet` bisection that searches hip height until the
 * support ankle reaches the measured contact height ("No Blender IK, ever").
 * What changed is scale and address: the demo's 1.5x pair becomes two 2.2x
 * figures (~3.4 m) on one shared ground sheet, with plant-target discs under
 * both support feet — because the difference between raw FK (feet skating)
 * and the hip search (feet staying down) only reads when the feet are big.
 *
 * BEFORE (left): raw FK at fixed hip height — the support foot floats and
 * sinks through the beat. AFTER (right): the same spec through the hip-height
 * search, re-solved every frame.
 */

const RIG = {
  hipsHeight: 0.998,
  ankleContact: 0.105,
  thigh: 0.406,
  shin: 0.421,
  foot: 0.157,
  spine: 0.258,
  neckHead: 0.304,
} as const;

const FIGURE_SCALE = 2.2;

type Leg = {
  hip: THREE.Object3D;
  knee: THREE.Object3D;
  ankle: THREE.Object3D;
};

type Figure = {
  root: THREE.Group;
  pelvis: THREE.Object3D;
  legs: [Leg, Leg];
  arms: [{ shoulder: THREE.Object3D }, { shoulder: THREE.Object3D }];
};

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

function sampleSpec(phase: number): { hipPitch: number; knee: [number, number]; ankle: [number, number] } {
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

export const room: RoomDefinition = {
  sourceId: 1,
  skill: 'game-animation-asset-pipeline',
  title: 'Mocap to in-game animation',
  summary:
    'FK-only pose evaluation from an action spec, with ground contact from bisecting hip height instead of an IK solver.',
  kind: 'webgpu',
  limitation:
    'Blender, GVHMR checkpoints, SMPL-X data and Mixamo characters were not run or used; only the plant step on a 9-joint stand-in proportioned from the rig measurements, driven by a synthetic action spec.',
  create(ctx: RoomContext): RoomInstance {
    const T = ctx.THREE;
    const root = new T.Group();
    root.name = 'source-01-room';
    const disposables: Array<{ dispose(): void }> = [];
    const track = <D extends { dispose(): void }>(d: D): D => {
      disposables.push(d);
      return d;
    };

    const boneGeo = track(new T.BoxGeometry(0.105, 1, 0.105));
    const jointGeo = track(new T.SphereGeometry(0.06, 10, 8));

    function buildFigure(tint: number): Figure {
      const limbMat = track(new T.MeshStandardMaterial({ color: tint, roughness: 0.7 }));
      const jointMat = track(new T.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 0.5 }));
      const figureRoot = new T.Group();
      const pelvis = new T.Group();
      pelvis.name = 'Hips';
      pelvis.position.y = RIG.hipsHeight;
      figureRoot.add(pelvis);

      const segment = (length: number, parent: THREE.Object3D, name: string): THREE.Object3D => {
        const pivot = new T.Group();
        pivot.name = name;
        parent.add(pivot);
        const mesh = new T.Mesh(boneGeo, limbMat);
        mesh.scale.y = length;
        mesh.position.y = -length / 2;
        pivot.add(mesh);
        const cap = new T.Mesh(jointGeo, jointMat);
        pivot.add(cap);
        return pivot;
      };

      const spine = segment(RIG.spine, pelvis, 'Spine');
      spine.children[0].position.y = RIG.spine / 2;
      const head = new T.Mesh(jointGeo, jointMat);
      head.scale.setScalar(2.0);
      head.position.y = RIG.spine + RIG.neckHead * 0.5;
      pelvis.add(head);

      const arms = [-1, 1].map((side) => {
        const shoulder = new T.Group();
        shoulder.name = side < 0 ? 'LeftShoulder' : 'RightShoulder';
        shoulder.position.set(side * 0.21, RIG.spine * 0.9, 0);
        pelvis.add(shoulder);
        const mesh = new T.Mesh(boneGeo, limbMat);
        mesh.scale.y = 0.58;
        mesh.position.y = -0.29;
        shoulder.add(mesh);
        return { shoulder };
      }) as unknown as Figure['arms'];

      const legs = [-1, 1].map((side) => {
        const hip = new T.Group();
        hip.name = side < 0 ? 'LeftUpLeg' : 'RightUpLeg';
        hip.position.set(side * 0.14, 0, 0);
        pelvis.add(hip);
        const thighMesh = new T.Mesh(boneGeo, limbMat);
        thighMesh.scale.y = RIG.thigh;
        thighMesh.position.y = -RIG.thigh / 2;
        hip.add(thighMesh);
        const knee = segment(RIG.shin, hip, side < 0 ? 'LeftLeg' : 'RightLeg');
        knee.position.y = -RIG.thigh;
        const ankle = new T.Group();
        ankle.name = side < 0 ? 'LeftFoot' : 'RightFoot';
        ankle.position.y = -RIG.shin;
        knee.add(ankle);
        const footMesh = new T.Mesh(boneGeo, limbMat);
        footMesh.scale.set(1.4, RIG.foot, 2.6);
        footMesh.position.set(0, -0.03, RIG.foot * 0.35);
        ankle.add(footMesh);
        return { hip, knee, ankle };
      }) as unknown as [Leg, Leg];

      return { root: figureRoot, pelvis, legs, arms };
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
        const arm = figure.arms[s];
        arm.shoulder.rotation.x = 0.12 + pose.knee[s] * 0.3;
        arm.shoulder.rotation.z = s === 0 ? 0.18 : -0.18;
      }
    }

    const before = buildFigure(0x9a5a4a);
    const after = buildFigure(0x4a7a9a);
    before.root.scale.setScalar(FIGURE_SCALE);
    after.root.scale.setScalar(FIGURE_SCALE);
    before.root.position.set(-3.0, 0, 1.6);
    after.root.position.set(3.0, 0, 1.6);
    root.add(before.root, after.root);

    // One shared ground sheet so the contact error is readable, not asserted.
    const ground = new T.Mesh(
      track(new T.PlaneGeometry(13, 8)),
      track(new T.MeshStandardMaterial({ color: 0x4c4c48, roughness: 0.95 })),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, 1.6);
    root.add(ground);

    // Plant-target discs under both support feet, per half.
    const discGeo = track(new T.CircleGeometry(0.34 * FIGURE_SCALE, 20));
    discGeo.rotateX(-Math.PI / 2);
    const beforeDiscMat = track(new T.MeshStandardMaterial({ color: 0x6a3535, roughness: 0.9 }));
    const afterDiscMat = track(new T.MeshStandardMaterial({ color: 0x355a3a, roughness: 0.9 }));
    for (const [figure, mat] of [[before, beforeDiscMat], [after, afterDiscMat]] as const) {
      for (const side of [-1, 1]) {
        const disc = new T.Mesh(discGeo, mat);
        disc.position.set(
          figure.root.position.x + side * 0.14 * FIGURE_SCALE,
          0.01,
          figure.root.position.z + 0.08 * FIGURE_SCALE,
        );
        root.add(disc);
      }
    }

    const scratch = new T.Vector3();
    const contactTarget = RIG.ankleContact * FIGURE_SCALE;

    /** The plant rule: bisect hip height until the lower ankle lands. No IK. */
    function plantFeet(figure: Figure, phase: number): void {
      let lo = 0.2;
      let hi = 1.4;
      for (let i = 0; i < 24; i += 1) {
        const hipsHeight = (lo + hi) / 2;
        applyFk(figure, phase, hipsHeight);
        root.updateMatrixWorld(true);
        let lowest = Number.POSITIVE_INFINITY;
        for (const leg of figure.legs) {
          leg.ankle.getWorldPosition(scratch);
          lowest = Math.min(lowest, scratch.y);
        }
        const residual = lowest - contactTarget;
        if (Math.abs(residual) < 1e-4 * FIGURE_SCALE) break;
        if (residual > 0) hi = (lo + hi) / 2;
        else lo = (lo + hi) / 2;
      }
    }

    applyFk(before, 0, RIG.hipsHeight);
    plantFeet(after, 0);

    return {
      root,
      update: (time: number) => {
        const phase = (time * 0.35) % 1;
        applyFk(before, phase, RIG.hipsHeight);
        plantFeet(after, phase);
      },
      dispose: () => {
        for (const d of disposables) d.dispose();
        root.clear();
      },
    };
  },
};
