/**
 * Room for source 12 — Closed-loop asset generation with browser self-verification.
 *
 * Re-stages the group-A demo without touching its maths. The acceptance rig
 * was tabletop-small; here the accepted-versus-rejected candidate pair stands
 * at floor scale, wide enough that the loop’s verdict — one kept, one refused
 * against declared criteria — reads from the doorway.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';
import { createDemo } from '../../lab/demos/group-a/source-12';

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
  sourceId: 12,
  skill: 'ai-3d-asset-generation-loop',
  title: 'Asset acceptance loop',
  summary: 'Two generated candidates against one declared checklist: the accepted asset stands whole, the rejected one is marked for why it failed.',
  kind: 'webgpu',
  limitation:
    'CPU criteria only: the paid image APIs were never invoked and the browser visual-verification ' +
    'half is missing, so the loop closes on inspectable rules, not on pixels.',
  create(ctx: RoomContext): RoomInstance {
    const { THREE } = ctx;
    const demo = createDemo({ THREE, seed: ctx.seed });

    // Presentation only: raise the rig to floor-exhibit scale. Criteria,
    // verdicts and the rejection record are the demo’s own.
    const stage = new THREE.Group();
    stage.name = 'source-12-room-stage';
    stage.add(demo.root);
    demo.root.scale.setScalar(2.5);
    stage.position.set(0, 0.1, -1.0);

    const root = new THREE.Group();
    root.name = 'source-12-closed-loop-room';
    root.add(stage);

    // Dark apron under the rig. Staging only.
    const dressing = new THREE.Group();
    dressing.name = 'source-12-room-dressing';
    const apronGeometry = new THREE.PlaneGeometry(13.6, 9);
    apronGeometry.rotateX(-Math.PI / 2);
    const apronMaterial = new THREE.MeshStandardMaterial({ color: 0x1e2422, roughness: 1 });
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
