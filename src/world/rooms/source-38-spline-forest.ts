/**
 * Room for source 38 — Spline-field forest (mask, species, ground cover, floor blend).
 *
 * Re-stages the group-C demo without touching its maths. Two failures made it
 * read as empty from the doorway: the 3 m patches sat low and deep in the
 * room, under the 1.6 m sightline. Here the same pair sits astride the
 * doorway with a declared vertical gain, so the visitor walks into uniform
 * scatter on the left and mask-driven woodland on the right.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';
import { createDemo } from '../../lab/demos/group-c/source-38';

function capInstances(stage: THREE.Group): void {
  stage.traverse((obj) => {
    const rec = obj as unknown as { isInstancedMesh?: unknown; count: number };
    if (rec.isInstancedMesh === true && typeof rec.count === 'number') {
      rec.count = Math.max(1, Math.floor(rec.count / 2));
    }
  });
}

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
  sourceId: 38,
  skill: 'threejs-procedural-vegetation',
  title: 'Spline-field forest',
  summary: 'Left: uniform scatter that sinks and floats. Right: the same plants placed by a spline field with an admissibility mask.',
  kind: 'webgpu',
  limitation:
    'No source code is used and the spline cycles three fixed poses on a timer — there is no ' +
    'interactive tree editor, no LOD streaming and no export. Four species stand in for the claimed thirty-plus. ' +
    'Display only: relief and plant height carry a ×2.2 vertical gain so the canopy breaks the doorway sightline; ' +
    'planting positions, mask and species parameters are unchanged.',
  create(ctx: RoomContext): RoomInstance {
    const { THREE } = ctx;
    const demo = createDemo({ THREE, seed: ctx.seed });

    // Presentation only: the pair sits astride the doorway so the visitor walks
    // into the comparison, with height gained for legibility. The spline, mask
    // windows and species parameters are untouched.
    const stage = new THREE.Group();
    stage.name = 'source-38-room-stage';
    stage.add(demo.root);
    demo.root.scale.set(1.4, 2.2, 1.4);
    stage.position.set(0, 0.02, -2.0);
    if (ctx.quality === 'low') capInstances(stage);

    const root = new THREE.Group();
    root.name = 'source-38-spline-forest-room';
    root.add(stage);

    // Dark earth skirt under the pair so the two terrains read as one exhibit
    // floor instead of floating patches. Staging, not technique.
    const dressing = new THREE.Group();
    dressing.name = 'source-38-room-dressing';
    const skirtGeometry = new THREE.PlaneGeometry(13.6, 9);
    skirtGeometry.rotateX(-Math.PI / 2);
    const skirtMaterial = new THREE.MeshStandardMaterial({ color: 0x202825, roughness: 1 });
    const skirt = new THREE.Mesh(skirtGeometry, skirtMaterial);
    skirt.position.set(0, 0.0, -2.0);
    dressing.add(skirt);
    root.add(dressing);

    return {
      root,
      update: (elapsed: number, dt: number): void => {
        demo.update?.(elapsed, dt);
        // The demo re-derives placement on pose changes, which restores full
        // instance counts; re-apply the low-quality cap after it runs.
        if (ctx.quality === 'low') capInstances(stage);
      },
      dispose: (): void => {
        root.remove(stage, dressing);
        demo.dispose();
        disposeObject(dressing);
      },
    };
  },
};
