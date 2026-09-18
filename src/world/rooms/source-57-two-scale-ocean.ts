/**
 * Room for source 57 — JONSWAP two-scale ocean (swell stitched with chop and foam).
 *
 * Re-stages the group-D demo without touching its maths. The 3.4 m patches lay
 * flat and small, which is why the doorway saw nothing. Here the same
 * swell-vs-two-scale pair becomes the room floor at nearly wall to wall, with
 * a display gain on height only, so the chop and crest foam read from entry.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';
import { createDemo } from '../../lab/demos/group-d/source-57-two-scale-ocean';

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
  sourceId: 57,
  skill: 'threejs-webgpu-water',
  title: 'Two-scale ocean stitch',
  summary: 'Left water is long swell alone; right water stitches directional chop and crest foam over the same swell.',
  kind: 'webgpu',
  limitation:
    'CPU restatement, not the source pipeline: no CUDA kernel, no WGSL compute and no ' +
    'transpiler runs here, and wave height carries a display gain so the relief reads indoors. ' +
    'No reflection, refraction or buoyancy either side.',
  create(ctx: RoomContext): RoomInstance {
    const { THREE } = ctx;
    const demo = createDemo({ THREE, seed: ctx.seed });

    // Presentation only: lay the pair down as the floor, widened to the walls
    // with height gained for legibility. Trains, dispersion and foam rule stay
    // exactly as the demo computes them.
    const stage = new THREE.Group();
    stage.name = 'source-57-room-stage';
    stage.add(demo.root);
    demo.root.scale.set(1.7, 2.5, 1.7);
    stage.position.set(0, 0.15, -1.5);

    const root = new THREE.Group();
    root.name = 'source-57-two-scale-ocean-room';
    root.add(stage);

    // Dark basin rim so the water reads as a contained exhibit. Staging only.
    const dressing = new THREE.Group();
    dressing.name = 'source-57-room-dressing';
    const rimGeometry = new THREE.PlaneGeometry(13.6, 15.6);
    rimGeometry.rotateX(-Math.PI / 2);
    const rimMaterial = new THREE.MeshStandardMaterial({ color: 0x14262c, roughness: 1 });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.set(0, 0.02, 0);
    dressing.add(rim);
    root.add(dressing);

    let tick = 0;
    return {
      root,
      update: (elapsed: number, dt: number): void => {
        // The per-frame CPU vertex march is the dearest update in this lane;
        // on the WebGL fallback it runs at half rate rather than dragging the
        // whole wing with it.
        tick += 1;
        if (ctx.quality === 'low' && tick % 2 === 0) return;
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
