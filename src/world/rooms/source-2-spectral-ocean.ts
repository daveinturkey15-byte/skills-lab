/**
 * Room for source 2 — Spectral FFT ocean (JONSWAP + TMA, Tessendorf h0, choppy FFT, Jacobian foam).
 *
 * Re-stages the group-A demo without touching its maths. The pair already read
 * as present, so this is a careful move: the same Gerstner-control versus
 * spectral-technique patches, widened modestly to meet the walls, over a dark
 * basin that marks the exhibit boundary.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';
import { createDemo } from '../../lab/demos/group-a/source-02';

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
  sourceId: 2,
  skill: 'threejs-webgpu-water',
  title: 'Spectral FFT ocean',
  summary: 'Left water is three summed sine waves; right water is a JONSWAP spectrum inverted by FFT, going white where the surface folds.',
  kind: 'webgpu',
  limitation:
    'One CPU cascade at N=32, not three GPU cascades at 512²; foam is a per-frame test with no ' +
    'accumulation, and wave height carries a display gain. No reflection, refraction or buoyancy either side.',
  create(ctx: RoomContext): RoomInstance {
    const { THREE } = ctx;
    const demo = createDemo({ THREE, seed: ctx.seed });

    // Presentation only: widen the pair toward the walls. Spectrum, dispersion
    // relation and foam test are exactly the demo’s.
    const stage = new THREE.Group();
    stage.name = 'source-2-room-stage';
    stage.add(demo.root);
    demo.root.scale.set(1.6, 1.6, 1.6);
    stage.position.set(0, 0.12, -1.0);

    const root = new THREE.Group();
    root.name = 'source-2-spectral-ocean-room';
    root.add(stage);

    // Dark basin under the pair. Staging only.
    const dressing = new THREE.Group();
    dressing.name = 'source-2-room-dressing';
    const basinGeometry = new THREE.PlaneGeometry(13.6, 10);
    basinGeometry.rotateX(-Math.PI / 2);
    const basinMaterial = new THREE.MeshStandardMaterial({ color: 0x14262c, roughness: 1 });
    const basin = new THREE.Mesh(basinGeometry, basinMaterial);
    basin.position.set(0, 0.0, -0.5);
    dressing.add(basin);
    root.add(dressing);

    let tick = 0;
    return {
      root,
      update: (elapsed: number, dt: number): void => {
        // Two N=32 inverse FFTs per frame are dear on the fallback path;
        // half rate there, full rate on WebGPU.
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
