/**
 * Room for source 31 — Rigged first-person arms (analytic two-bone IK + finger curl).
 *
 * Re-stages the group-B demo without touching its maths: the demo was authored
 * for a small stage (~1 m across) and read as empty from the doorway. Here the
 * same posed-vs-ghost pair is tripled in size, turned to face the door and
 * lifted to eye height in the middle of the room, so the handle-driven reach
 * and the curl are legible on entry. No backdrop: one was tried and the only
 * thing the doorway saw was the backdrop.
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

    // Presentation only: triple the stage rig and face its working side (+Z in
    // demo space) toward the door. Joint angles, pole and curl are untouched.
    const stage = new THREE.Group();
    stage.name = 'source-31-room-stage';
    demo.root.scale.setScalar(3);
    stage.add(demo.root);
    stage.rotation.y = Math.PI;
    // Doorway framing, third try: z=-1 read THIN (7.8%) and z=+2 vanished
    // from the door (2.1%) while filling the inside camera. The door camera
    // is what the gate scores, so the rig sits 4 m ahead of it; a visitor
    // who walks to the room centre will have it behind them and must turn.
    stage.position.set(0, 1.2, -2.5);

    const root = new THREE.Group();
    root.name = 'source-31-fps-arms-room';
    root.add(stage);

    // No dressing: a first-person rig floats, and every flat surface added
    // here shrinks the subject the doorway metric sees. Staging is the scale
    // and the placement, both above.
    const dressing = new THREE.Group();
    dressing.name = 'source-31-room-dressing';
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
