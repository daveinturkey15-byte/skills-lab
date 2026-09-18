/**
 * Room for source 36 — Highpoly to lowpoly remesh with a baked normal transfer (Blender free lane).
 *
 * Re-stages the group-C demo without touching its maths. The three turntables
 * were small and clustered at the origin; here each stands at adult eye height
 * on its own plinth, spread across the room, so the silhouette change on the
 * left and the shading change on the right read from the doorway.
 *
 * The paid hosted baker this stands beside was never used or purchased; the
 * launcher below opens the free Blender lane that produced these meshes, and
 * the wall card says so.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';
import { createDemo } from '../../lab/demos/group-c/source-36';

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
  sourceId: 36,
  skill: 'atomic-acres-production-asset-governance',
  title: 'Remesh and bake turntables',
  summary: 'Three turntables: sculpt-dense highpoly, reduced mesh on its own normals, and the same mesh wearing the baked normals.',
  kind: 'webgpu',
  launcher: {
    label: 'Open the Blender remesh and bake lane',
    script: 'scripts/launchers/blender-remesh-bake.cmd',
    note: 'Blender 5.1 with Rigify, local. The turntables show the resulting LODs; the launcher is how they were produced.',
  },
  limitation:
    'The paid hosted baker was not used, bought or copied — this is the register’s free Blender ' +
    'alternative, normal transfer only, with an 82 percent reduction, not the advertised 99. Display ' +
    'finish is a presentation gloss and the transfer itself is unchanged.',
  create(ctx: RoomContext): RoomInstance {
    const { THREE } = ctx;
    const demo = createDemo({ THREE, seed: ctx.seed });

    // Presentation only: lift the three stations to eye height and spread them
    // across the room. The demo owns its pivots; each pivot is one station, in
    // order highpoly / own-normals / baked-normals. Positions below are in
    // demo-local units, so they are multiplied by the display scale on the
    // way out: local ±3.6 lands at world ±4.3, local y 2.1 lands at 2.5 with
    // the ~2.5 m meshes bottoming out on the plinth tops.
    const stage = new THREE.Group();
    stage.name = 'source-36-room-stage';
    stage.add(demo.root);
    demo.root.scale.setScalar(1.2);
    const stations = [...demo.root.children];
    const spreadLocal: readonly number[] = [-3.6, 0, 3.6];
    stations.forEach((pivot, i) => {
      pivot.position.x = spreadLocal[Math.min(i, spreadLocal.length - 1)] ?? 0;
      pivot.position.y = 2.1;
    });
    stage.position.set(0, 0, -2.0);

    const root = new THREE.Group();
    root.name = 'source-36-mesh-baker-room';
    root.add(stage);

    // One plinth per turntable at the stations' world positions. Staging only.
    const dressing = new THREE.Group();
    dressing.name = 'source-36-room-dressing';
    for (const localX of spreadLocal) {
      const plinthGeometry = new THREE.BoxGeometry(3.0, 1.35, 3.0);
      const plinthMaterial = new THREE.MeshStandardMaterial({ color: 0x232c31, roughness: 0.9 });
      const plinth = new THREE.Mesh(plinthGeometry, plinthMaterial);
      plinth.position.set(localX * 1.2, 0.675, -2.0);
      dressing.add(plinth);
    }
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
