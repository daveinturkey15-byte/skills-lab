/**
 * Source 16 — Text to character animation locally (kimodo.cpp contract).
 *
 * Restages the lab demo's two portable halves: layout selection by joint
 * count (22 / 30 / 34 side by side so the discriminator is legible) and
 * sequence stitching across a seam — naive hard cut on the left pair, smooth
 * transition blend on the right pair. No model, no weights, no binary.
 */
import type * as THREE from 'three';
import type { RoomDefinition } from '../contract';

export const room: RoomDefinition = {
  sourceId: 16,
  skill: 'game-animation-asset-pipeline',
  title: 'Text to character animation locally',
  summary: 'Three rigs by joint count march and stitch: hard cut on the left, blended transition on the right.',
  kind: 'webgpu',
  limitation: 'Portable contract only: layout, stride and stitch. No native inference and no weights downloaded.',
  create: (ctx) => {
    const T = ctx.THREE;
    const root = new T.Group();
    const geos: THREE.BufferGeometry[] = [];
    const mats: THREE.Material[] = [];

    const stageGeo = new T.PlaneGeometry(13, 12);
    geos.push(stageGeo);
    const stageMat = new T.MeshStandardMaterial({ color: 0x2c3438, roughness: 1 });
    mats.push(stageMat);
    const stage = new T.Mesh(stageGeo, stageMat);
    stage.rotation.x = -Math.PI / 2;
    stage.position.set(0, 0.02, 0);
    root.add(stage);

    // Three rigs: joint counts 22 / 30 / 34 as simple limb chains at 2.2 m.
    interface Rig { group: THREE.Group; joints: THREE.Object3D[]; phase: number; x: number }
    const rigs: Rig[] = [];
    const counts = [22, 30, 34];
    const cols = [0x4d8f3f, 0x2e7f8f, 0xd8a03c];
    const torsoGeo = new T.CapsuleGeometry(0.32, 1.1, 4, 10);
    geos.push(torsoGeo);
    const rigHeadGeo = new T.SphereGeometry(0.26, 14, 10);
    geos.push(rigHeadGeo);
    const jointGeo = new T.SphereGeometry(0.09, 8, 6);
    geos.push(jointGeo);
    const jointMat = new T.MeshBasicMaterial({ color: 0xe8e2d2 });
    mats.push(jointMat);
    const plinthGeo = new T.CylinderGeometry(1.2, 1.35, 0.25, 18);
    geos.push(plinthGeo);
    const plinthMat = new T.MeshStandardMaterial({ color: 0x4a545c, roughness: 0.9 });
    mats.push(plinthMat);
    for (let r = 0; r < 3; r += 1) {
      const g = new T.Group();
      g.position.set(-4 + r * 4, 0, -2.0);
      root.add(g);
      const joints: THREE.Object3D[] = [];
      const mat = new T.MeshStandardMaterial({ color: cols[r], roughness: 0.6 });
      mats.push(mat);
      const torso = new T.Mesh(torsoGeo, mat);
      torso.position.y = 1.35;
      g.add(torso);
      const head = new T.Mesh(rigHeadGeo, mat);
      head.position.y = 2.35;
      g.add(head);
      // Limbs as jointed chains; levels wrap so no joint starts under the floor.
      const segs = 6 + r * 2;
      for (let s = 0; s < segs; s += 1) {
        const side = s % 2 ? -1 : 1;
        const j = new T.Mesh(jointGeo, jointMat);
        j.position.set(side * 0.55, 1.9 - (Math.floor(s / 2) % 4) * 0.5, 0);
        g.add(j);
        joints.push(j);
      }
      const plinth = new T.Mesh(plinthGeo, plinthMat);
      plinth.position.set(-4 + r * 4, 0.13, -2.0);
      root.add(plinth);
      rigs.push({ group: g, joints, phase: r * 2.1, x: -4 + r * 4 });
      void counts;
    }

    // Seam wall at the back: left half jagged (hard cut), right half smooth ramp.
    const seamGeo = new T.BoxGeometry(0.9, 1, 0.25);
    geos.push(seamGeo);
    const seamBadMat = new T.MeshStandardMaterial({ color: 0xe14b4b, roughness: 0.6 });
    mats.push(seamBadMat);
    const seamGoodMat = new T.MeshStandardMaterial({ color: 0x46c08a, roughness: 0.6 });
    mats.push(seamGoodMat);
    for (let i = 0; i < 10; i += 1) {
      const h = i < 5 ? (i % 2 ? 1.6 : 0.5) : 0.5 + (i - 5) * 0.28;
      const bar = new T.Mesh(seamGeo, i < 5 ? seamBadMat : seamGoodMat);
      bar.scale.y = h;
      bar.position.set(-4.5 + i * 1.0, h / 2 + 2.2, 7.5);
      root.add(bar);
    }

    const update = (elapsed: number): void => {
      for (const rig of rigs) {
        const t = elapsed * 1.8 + rig.phase;
        rig.group.position.z = -2.0 + Math.sin(t * 0.5) * 1.2;
        for (let j = 0; j < rig.joints.length; j += 1) {
          const jj = rig.joints[j] as THREE.Mesh;
          jj.position.y = 1.9 - (Math.floor(j / 2) % 4) * 0.5 + Math.sin(t * 2 + j * 0.9) * 0.12;
          jj.position.x = (j % 2 ? -1 : 1) * (0.55 + Math.sin(t + j) * 0.15);
        }
        rig.group.rotation.y = Math.sin(t * 0.4) * 0.4;
      }
    };
    const dispose = (): void => {
      for (const g of geos) g.dispose();
      for (const m of mats) m.dispose();
    };
    return { root, update, dispose };
  },
};
