/**
 * Source 17 — environment-art quality bar (Cadle), comparator.
 *
 * Cadle's implementation is NOT DETERMINED: the site is a client-rendered app
 * that served no fetchable content, so this room is explicitly NOT Cadle's
 * scene. It stages the four recorded comparator properties with our own
 * implementation at room scale — dense wind-animated ground cover, layered
 * vegetation silhouettes, a readable distant ridge, and a declared budget —
 * failing bar on the left, meeting bar on the right.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const room: RoomDefinition = {
  sourceId: 17,
  skill: 'unmapped',
  title: 'Environment-art quality bar',
  summary: 'A sparse flat diorama beside a dense wind-blown one with layered trees and a distant ridge.',
  kind: 'webgpu',
  limitation:
    'Method NOT DETERMINED — owner judgement of result only, and this is not Cadle\u2019s scene. Frame-rate stability entirely unverified. MIT grass projects found by search are a different row.',
  create: (ctx: RoomContext): RoomInstance => {
    const { THREE, seed, quality } = ctx;
    const root = new THREE.Group();
    const disposables: { dispose(): void }[] = [];
    const track = <T extends { dispose(): void }>(v: T): T => (disposables.push(v), v);
    const rng = mulberry32(seed * 101 + 17);
    const dense = quality !== 'low';

    // Distant ridge band each half reads against; the right one has depth layers.
    for (const [ox, colour] of [[-3.4, 0x5a6a72], [3.4, 0x3d6b4f]] as const) {
      const ridge = new THREE.Mesh(
        track(new THREE.BoxGeometry(6.2, 2.6, 0.4)),
        track(new THREE.MeshStandardMaterial({ color: colour, roughness: 1 })),
      );
      ridge.position.set(ox, 1.5, 6.8);
      root.add(ridge);
    }
    // Second, paler ridge behind the right half gives the depth separation.
    const farRidge = new THREE.Mesh(
      track(new THREE.BoxGeometry(6.2, 3.4, 0.4)),
      track(new THREE.MeshStandardMaterial({ color: 0x7fa88f, roughness: 1 })),
    );
    farRidge.position.set(3.4, 2.4, 7.4);
    root.add(farRidge);

    interface Canopy { mesh: THREE.InstancedMesh; base: THREE.Matrix4[]; phase: Float32Array }
    const canopies: Canopy[] = [];
    // Scratch matrices hoisted: the sway loop writes in place, never allocates.
    const swayRot = new THREE.Matrix4();
    const composed = new THREE.Matrix4();

    for (const [h, ox] of [-3.4, 3.4].entries()) {
      const good = h === 1;
      // Ground slab: flat grey-green failing, rich green meeting.
      const ground = new THREE.Mesh(
        track(new THREE.BoxGeometry(6.2, 0.3, 12)),
        track(new THREE.MeshStandardMaterial({ color: good ? 0x2f5a26 : 0x4a4f42, roughness: 1 })),
      );
      ground.position.set(ox, -0.15, 0.5);
      root.add(ground);

      // Vegetation silhouettes: one flat layer failing, three depth layers meeting.
      const coneGeo = track(new THREE.ConeGeometry(0.9, 2.6, 8));
      const trunkGeo = track(new THREE.CylinderGeometry(0.12, 0.16, 1.1, 7));
      const leafMat = track(new THREE.MeshStandardMaterial({ color: good ? 0x2e7a3a : 0x5a6a52, roughness: 0.9 }));
      const trunkMat = track(new THREE.MeshStandardMaterial({ color: 0x4a3826, roughness: 1 }));
      const count = good ? 9 : 3;
      const canopy = new THREE.InstancedMesh(coneGeo, leafMat, count);
      const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
      const matrix = new THREE.Matrix4();
      const base: THREE.Matrix4[] = [];
      const phase = new Float32Array(count);
      for (let i = 0; i < count; i += 1) {
        const lx = ox - 2.4 + (i % 3) * 2.4 + (rng() - 0.5);
        const lz = good ? -1 + Math.floor(i / 3) * 3.2 : 2.5;
        const s = good ? 0.8 + rng() * 0.9 : 0.7;
        matrix.makeScale(s, s, s);
        matrix.setPosition(lx, 2.4 * s + 0.8, lz);
        canopy.setMatrixAt(i, matrix);
        base.push(matrix.clone());
        phase[i] = rng() * Math.PI * 2;
        matrix.makeScale(1, 1, 1);
        matrix.setPosition(lx, 0.55, lz);
        trunks.setMatrixAt(i, matrix);
      }
      canopy.instanceMatrix.needsUpdate = true;
      trunks.instanceMatrix.needsUpdate = true;
      root.add(canopy);
      root.add(trunks);
      if (good) canopies.push({ mesh: canopy, base, phase });

      // Ground cover: sparse static tufts failing, dense blades meeting.
      const blades = good ? (dense ? 1500 : 700) : 120;
      const bladeGeo = track(new THREE.PlaneGeometry(0.09, good ? 0.8 : 0.4, 1, 1));
      bladeGeo.translate(0, good ? 0.4 : 0.2, 0);
      const bladeMat = track(new THREE.MeshStandardMaterial({
        color: good ? 0x55a03a : 0x6a7058, roughness: 0.9, side: THREE.DoubleSide,
        emissive: good ? 0x14330c : 0x000000, emissiveIntensity: 0.5,
      }));
      const field = new THREE.InstancedMesh(bladeGeo, bladeMat, blades);
      const q = new THREE.Quaternion();
      const e = new THREE.Euler();
      const p = new THREE.Vector3();
      const sc = new THREE.Vector3();
      for (let i = 0; i < blades; i += 1) {
        p.set(ox - 2.9 + rng() * 5.8, 0, -4.5 + rng() * 10);
        e.set(0, rng() * Math.PI, 0);
        q.setFromEuler(e);
        const s = 0.7 + rng() * 0.7;
        sc.set(s, s, s);
        matrix.compose(p, q, sc);
        field.setMatrixAt(i, matrix);
      }
      field.instanceMatrix.needsUpdate = true;
      root.add(field);
    }

    return {
      root,
      update: (t) => {
        // The meeting half sways its canopies — roots planted, tips travelling.
        for (const canopy of canopies) {
          for (let i = 0; i < canopy.base.length; i += 1) {
            const m = canopy.base[i];
            if (!m) continue;
            swayRot.makeRotationZ(Math.sin(t * 1.1 + canopy.phase[i]!) * 0.06);
            composed.multiplyMatrices(m, swayRot);
            canopy.mesh.setMatrixAt(i, composed);
          }
          canopy.mesh.instanceMatrix.needsUpdate = true;
        }
      },
      dispose: () => { for (const d of disposables) d.dispose(); },
    };
  },
};
