/**
 * Room for source 7 — Code-only procedural scene authoring (measured light budget, emissive-first).
 *
 * Re-stages the group-A demo without touching its maths. The pair already read
 * as present; here the over-lit control versus budgeted night-street technique
 * grows modestly toward the walls over a dark apron, so the comparison survives
 * the walk-in.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';
import { createDemo } from '../../lab/demos/group-a/source-07';

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
  sourceId: 7,
  skill: 'photoreal-procedural-scene-forge',
  title: 'Code-only night street',
  summary: 'Left street lights everything with real lights; right street spends a measured budget and lets emissive windows do the work.',
  kind: 'webgpu',
  limitation:
    'The authoring and light-budget half only: the upstream post chain (bloom, grade, god rays, ' +
    'depth of field) lives with the host, not here, and no display-transform constant is quoted.',
  create(ctx: RoomContext): RoomInstance {
    const { THREE } = ctx;
    const demo = createDemo({ THREE, seed: ctx.seed });

    // Presentation only: widen the street pair toward the walls. The measured
    // budget and every procedural byte are the demo's own. Cycle 1 shifted the
    // pair sideways and hid the budgeted glow behind its own facade (0.38 to
    // 0.32), so this reverts the shift and instead brings the pair toward the
    // door: larger roads, pillar still central but the comparison reads bigger.
    const stage = new THREE.Group();
    stage.name = 'source-7-room-stage';
    stage.add(demo.root);
    demo.root.scale.setScalar(1.5);
    stage.position.set(0, 0.1, -2.2);

    const root = new THREE.Group();
    root.name = 'source-7-night-street-room';
    root.add(stage);

    // Dark apron under the pair. Staging only.
    const dressing = new THREE.Group();
    dressing.name = 'source-7-room-dressing';
    const apronGeometry = new THREE.PlaneGeometry(13.6, 10);
    apronGeometry.rotateX(-Math.PI / 2);
    const apronMaterial = new THREE.MeshStandardMaterial({ color: 0x1c2226, roughness: 1 });
    const apron = new THREE.Mesh(apronGeometry, apronMaterial);
    apron.position.set(0, 0.0, -1.0);
    dressing.add(apron);
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
