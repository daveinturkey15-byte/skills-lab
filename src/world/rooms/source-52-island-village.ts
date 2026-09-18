/**
 * Room for source 52 — Island village with NPC schedules (Tripo / Mixamo comparator).
 *
 * Re-stages the group-D demo without touching its maths. The ~9 m island sat
 * at stage scale and read thin from the doorway; here it grows to fill the
 * floor wall to near-wall, so the farm rows, the jetty boat and the moving
 * villagers are visible on entry.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';
import { createDemo } from '../../lab/demos/group-d/source-52-island-schedules';

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
  sourceId: 52,
  skill: 'game-animation-asset-pipeline',
  title: 'Island village schedules',
  summary: 'A stylised isle where named villagers work a schedule — market, log pile, jetty, orchard — around a quest economy.',
  kind: 'webgpu',
  limitation:
    'The Tripo / Mixamo / agent-built pipeline is the poster’s claim, verified by nothing here; ' +
    'this room shows the schedule layer as an original comparator scene, not their assets or rigs.',
  create(ctx: RoomContext): RoomInstance {
    const { THREE } = ctx;
    const demo = createDemo({ THREE, seed: ctx.seed });

    // Presentation only: grow the isle to fill the room floor. Schedules,
    // counters and the roster behind them are untouched.
    const stage = new THREE.Group();
    stage.name = 'source-52-room-stage';
    stage.add(demo.root);
    demo.root.scale.setScalar(1.35);
    stage.position.set(0, 0.02, -1.5);

    const root = new THREE.Group();
    root.name = 'source-52-island-village-room';
    root.add(stage);

    // Dark sea skirt so the isle reads as one exhibit floor. Staging only.
    const dressing = new THREE.Group();
    dressing.name = 'source-52-room-dressing';
    const skirtGeometry = new THREE.PlaneGeometry(13.6, 15.6);
    skirtGeometry.rotateX(-Math.PI / 2);
    const skirtMaterial = new THREE.MeshStandardMaterial({ color: 0x10222a, roughness: 1 });
    const skirt = new THREE.Mesh(skirtGeometry, skirtMaterial);
    skirt.position.set(0, 0.0, 0.5);
    dressing.add(skirt);
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
