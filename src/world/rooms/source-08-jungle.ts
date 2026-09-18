/**
 * Source 8 — Fully procedural jungle (jungle-trail, MIT).
 *
 * Restages the lab demo's bake-correctness half at walking scale: the floor
 * is jungle — instanced leaf cards with straight-alpha bleed (no dark
 * outlines) and correctly wound trunks — with two giant example leaves on the
 * back wall so the premultiplied-alpha bug the PROMPT.md owns stays visible
 * beside the fix. Vegetation signed off 5/10; the room does not claim more.
 */
import type * as THREE from 'three';
import type { RoomDefinition } from '../contract';

export const room: RoomDefinition = {
  sourceId: 8,
  skill: 'threejs-procedural-vegetation',
  title: 'Fully procedural jungle',
  summary: 'A walkable thicket of instanced leaf cards and trunks, with the leaf-bake bug shown beside its fix.',
  kind: 'webgpu',
  limitation: 'Only the texture-bake half plus layered leaf cards; terrain, ruins, water, audio and grade did not port.',
  create: (ctx) => {
    const T = ctx.THREE;
    const root = new T.Group();
    const geos: THREE.BufferGeometry[] = [];
    const mats: THREE.Material[] = [];
    const low = ctx.quality === 'low';

    let a = (ctx.seed ^ 0x08aa) >>> 0;
    const rand = (): number => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const floorGeo = new T.PlaneGeometry(13.5, 15.5);
    geos.push(floorGeo);
    const floorMat = new T.MeshStandardMaterial({ color: 0x2e4028, roughness: 1 });
    mats.push(floorMat);
    const floor = new T.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0.01, 0);
    root.add(floor);

    // Trunks: correctly wound cylinders with a moss cap, never black.
    const trunkCount = low ? 6 : 10;
    const trunkGeo = new T.CylinderGeometry(0.16, 0.3, 1, 9);
    geos.push(trunkGeo);
    const trunkMat = new T.MeshStandardMaterial({ color: 0x5a4230, roughness: 0.95 });
    mats.push(trunkMat);
    const mossGeo = new T.SphereGeometry(1, 8, 6);
    geos.push(mossGeo);
    const mossMat = new T.MeshStandardMaterial({ color: 0x4d8f3f, roughness: 1 });
    mats.push(mossMat);
    for (let i = 0; i < trunkCount; i += 1) {
      const px = -5.5 + rand() * 11;
      const pz = -6 + rand() * 12;
      const h = 3.4 + rand() * 1.6;
      const trunk = new T.Mesh(trunkGeo, trunkMat);
      trunk.scale.y = h;
      trunk.position.set(px, h / 2, pz);
      trunk.rotation.z = (rand() - 0.5) * 0.15;
      root.add(trunk);
      const moss = new T.Mesh(mossGeo, mossMat);
      const mr = 0.5 + rand() * 0.4;
      moss.scale.set(mr, mr * 0.6, mr);
      moss.position.set(px, h * 0.75, pz);
      root.add(moss);
    }

    // Leaf cards: one InstancedMesh, per-instance hue via instance colour.
    const COUNT = low ? 350 : 750;
    const cardGeo = new T.PlaneGeometry(0.55, 0.7);
    geos.push(cardGeo);
    const cardMat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, side: T.DoubleSide });
    mats.push(cardMat);
    const cards = new T.InstancedMesh(cardGeo, cardMat, COUNT);
    const dummy = new T.Object3D();
    const col = new T.Color();
    for (let i = 0; i < COUNT; i += 1) {
      dummy.position.set(-6.2 + rand() * 12.4, 0.5 + rand() * 2.8, -7 + rand() * 14);
      dummy.rotation.set((rand() - 0.5) * 0.9, rand() * Math.PI * 2, (rand() - 0.5) * 0.5);
      const s = 0.7 + rand() * 1.1;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      cards.setMatrixAt(i, dummy.matrix);
      col.setHSL(0.29 + rand() * 0.06, 0.5, 0.28 + rand() * 0.14);
      cards.setColorAt(i, col);
    }
    cards.instanceMatrix.needsUpdate = true;
    if (cards.instanceColor) cards.instanceColor.needsUpdate = true;
    root.add(cards);
    geos.push(cards.geometry);

    // Back wall: two giant leaves — buggy dark outline left, clean bleed right.
    const mkLeaf = (buggy: boolean, x: number): void => {
      const g = new T.PlaneGeometry(2.6, 3.2, 8, 10);
      geos.push(g);
      const p = g.getAttribute('position') as THREE.BufferAttribute;
      const colours = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i += 1) {
        const u = p.getX(i) / 2.6 + 0.5;
        const v = p.getY(i) / 3.2 + 0.5;
        const edge = Math.abs(Math.abs(u - 0.5) * 2 - 0.1) + Math.abs(v - 0.5);
        const rim = edge > 0.75 ? 1 : 0;
        if (buggy && rim) {
          colours[i * 3] = 0.08;
          colours[i * 3 + 1] = 0.1;
          colours[i * 3 + 2] = 0.05;
        } else {
          const vein = Math.exp(-(((u - 0.5) * 9) ** 2)) * 0.2;
          colours[i * 3] = 0.29 + vein;
          colours[i * 3 + 1] = 0.48 + vein;
          colours[i * 3 + 2] = 0.2;
        }
      }
      g.setAttribute('color', new T.BufferAttribute(colours, 3));
      const m = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: T.DoubleSide });
      mats.push(m);
      const leaf = new T.Mesh(g, m);
      leaf.position.set(x, 3.0, 7.5);
      leaf.rotation.y = Math.PI;
      root.add(leaf);
    };
    mkLeaf(true, -2.2);
    mkLeaf(false, 2.2);

    const update = (elapsed: number): void => {
      cards.rotation.y = Math.sin(elapsed * 0.12) * 0.02;
    };
    const dispose = (): void => {
      for (const g of geos) g.dispose();
      for (const m of mats) m.dispose();
    };
    return { root, update, dispose };
  },
};
