/**
 * Room for source 53 — verdant-forest: seeded woodland with instanced LOD vegetation.
 *
 * Re-stages the group-D demo with one correction and no other maths change.
 * The demo grows a 27 m woodland disc, which is wider than this 14 m room, so
 * as adapted it bled through both walls into the neighbours. Here the same
 * disc is scaled to sit inside the walls, trail corridor and clearing kept,
 * and the visitor walks into the trees instead of into a wall of trunks.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';
import { createDemo } from '../../lab/demos/group-d/source-53-verdant-woodland';

function capInstances(stage: THREE.Group): void {
  stage.traverse((obj) => {
    const rec = obj as unknown as { isInstancedMesh?: unknown; count: number };
    if (rec.isInstancedMesh === true && typeof rec.count === 'number') {
      rec.count = Math.max(1, Math.floor(rec.count / 2));
    }
  });
}

export const room: RoomDefinition = {
  sourceId: 53,
  skill: 'threejs-procedural-vegetation',
  title: 'Verdant woodland',
  summary: 'A seeded woodland disc under one roof: three oak, beech and birch rings thinned along a walking trail, with grass, fern and rock exclusions.',
  kind: 'webgpu',
  limitation:
    'Learn-only restatement — the source ships no licence file, so population structure travelled, ' +
    'never expression. No adaptive resolution here, and the build tooling’s provenance is unestablished.',
  create(ctx: RoomContext): RoomInstance {
    const { THREE } = ctx;
    const demo = createDemo({ THREE, seed: ctx.seed });

    // Presentation only: fit the 27 m disc inside 14 m walls. Rings, corridor
    // rejection, spacing, LOD budgets and the wind rule are untouched.
    const stage = new THREE.Group();
    stage.name = 'source-53-room-stage';
    stage.add(demo.root);
    demo.root.scale.setScalar(0.5);
    stage.position.set(0, 0.02, 0.5);
    if (ctx.quality === 'low') capInstances(stage);

    const root = new THREE.Group();
    root.name = 'source-53-verdant-woodland-room';
    root.add(stage);

    return {
      root,
      update: (elapsed: number, dt: number): void => {
        demo.update?.(elapsed, dt);
        // Distance-budget swaps can restore full counts; re-apply the cap.
        if (ctx.quality === 'low') capInstances(stage);
      },
      dispose: (): void => {
        root.remove(stage);
        demo.dispose();
      },
    };
  },
};
