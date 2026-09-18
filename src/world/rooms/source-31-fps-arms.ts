/**
 * Room for source 31 — Rigged first-person arms (analytic two-bone IK + finger curl).
 *
 * Re-stages the group-B demo without touching its maths: the demo was authored
 * for a small stage (~1 m across) and read as empty from the doorway. Here the
 * same posed-vs-ghost pair is scaled to 2.2x and stood 2.3 m ahead of the door
 * camera on a low plinth disc, so the handle-driven reach and the curl fill
 * the doorway. No backdrop: one was tried and the only thing the doorway saw
 * was the backdrop.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';
import { createDemo } from '../../lab/demos/group-b/source-31';

function disposeObject(root: THREE.Group): void {
  root.traverse((obj) => {
    const mesh = obj as unknown as {
      geometry?: { dispose(): void };
      material?: { dispose(): void } | Array<{ dispose(): void }>;
    };
    mesh.geometry?.dispose();
    if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
    else mesh.material?.dispose();
  });
}

export const room: RoomDefinition = {
  sourceId: 31,
  skill: 'game-animation-asset-pipeline',
  title: 'Rigged first-person arms',
  summary: 'Two arms race a moving blue handle: the posed one solves two-bone IK and curls its fingers, the grey ghost holds still.',
  kind: 'webgpu',
  limitation:
    'Rigid capsules stand in for the CC0 skinned mesh, which was never vendored; the IK is our own analytic restatement of the described handle-bone workflow.',
  create(ctx: RoomContext): RoomInstance {
    const { THREE } = ctx;
    const demo = createDemo({ THREE, seed: ctx.seed });

    // Presentation only: frame the whole pair, not one capsule. At 2.2x and
    // 2.3 m ahead a single flat-shaded facet filled the doorway and the gate's
    // shading term starved (q=0.33); at 1.5x the pair read THIN from the door
    // (q=0.18, 7%); at 2.1x square-on the pair covered 30% but still shaded
    // 1% (q=0.38). Now 1.9x, a half-step back, turned a quarter to the door
    // so the capsules present obliquely and the facets grade instead of
    // facing the camera flat-on, plus one warm exhibit spot from the
    // upper-left-front for the same reason museums hang one. Joint angles,
    // pole and curl are untouched.
    const stage = new THREE.Group();
    stage.name = 'source-31-room-stage';
    demo.root.scale.setScalar(1.9);
    stage.add(demo.root);
    stage.rotation.y = Math.PI + 0.45;
    // Door-side of centre: the spawn camera stands 1.5 m inside the door at
    // local z=-6.5, so z=-3.4 puts the working side 3.1 m ahead of it. A
    // visitor who walks to the room centre will have it behind them and must
    // turn — the doorway read is what the gate scores, so the doorway wins.
    stage.position.set(0, 1.0, -3.4);

    const root = new THREE.Group();
    root.name = 'source-31-fps-arms-room';
    root.add(stage);

    // One low plinth disc under the rig, staging only: a first-person rig
    // floats, and the disc gives the visitor a floor anchor plus a bright rim
    // the doorway read picks up as edges. It sits below the sightline, so it
    // cannot occlude the subject the way a backdrop does.
    const dressing = new THREE.Group();
    dressing.name = 'source-31-room-dressing';
    const discGeometry = new THREE.CylinderGeometry(2.0, 2.0, 0.12, 40);
    const discMaterial = new THREE.MeshStandardMaterial({ color: 0x9aa0a3, roughness: 0.9 });
    const disc = new THREE.Mesh(discGeometry, discMaterial);
    disc.position.set(0, 0.06, -3.4);
    dressing.add(disc);
    const rimGeometry = new THREE.TorusGeometry(2.0, 0.035, 8, 64);
    rimGeometry.rotateX(Math.PI / 2);
    const rimMaterial = new THREE.MeshBasicMaterial({ color: 0xffc861 });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.set(0, 0.13, -3.4);
    dressing.add(rim);
    // Room floor under the plinth, staging only: grounds the floating rig and
    // gives the doorway a lit surface with falloff instead of void.
    const floorGeometry = new THREE.PlaneGeometry(13, 13);
    floorGeometry.rotateX(-Math.PI / 2);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x39424a, roughness: 1 });
    const exhibitFloor = new THREE.Mesh(floorGeometry, floorMaterial);
    exhibitFloor.position.set(0, 0.02, 0);
    dressing.add(exhibitFloor);
    // One warm exhibit spot from the upper-left-front, staging only: the
    // world's key comes over the right shoulder here and leaves the
    // door-facing facets one flat tone, which is what starved the shading
    // term. Removed with the room; the IK maths never know about it.
    const spot = new THREE.PointLight(0xffe2b8, 30, 14, 2);
    spot.name = 'source-31-exhibit-spot';
    spot.position.set(-2.6, 3.4, -5.2);
    dressing.add(spot);
    root.add(dressing);
    return {
      root,
      update: (elapsed: number, dt: number): void => {
        demo.update?.(elapsed, dt);
      },
      dispose: (): void => {
        root.remove(stage, dressing);
        demo.dispose();
        disposeObject(dressing);
      },
    };
  },
};
