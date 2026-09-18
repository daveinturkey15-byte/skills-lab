/**
 * Source 39 — Engine-native procedural level generation over an MCP bridge.
 *
 * Restages the lab demo's honest artifact — a typed editor-operation log and
 * a strict deterministic replayer — as a walk-in before/after: the left half
 * is the empty editor state, the right half is the scene the same operation
 * log produced, with the log itself standing as colour bars on the back wall.
 * Nothing here claims a live engine bridge exists.
 */
import type * as THREE from 'three';
import type { RoomDefinition } from '../contract';

export const room: RoomDefinition = {
  sourceId: 39,
  skill: 'unmapped',
  title: 'Procedural levels via editor ops',
  summary: 'An operation log replays into terrain, props and triggers: empty editor on the left, built scene on the right.',
  kind: 'webgpu',
  limitation: 'Illustrative replayer only, no live engine bridge; both source demos lean on host asset libraries so this proves nothing about speed.',
  create: (ctx) => {
    const T = ctx.THREE;
    const root = new T.Group();
    const geos: THREE.BufferGeometry[] = [];
    const mats: THREE.Material[] = [];
    const low = ctx.quality === 'low';

    // Seeded scatter so two visits look identical.
    let a = (ctx.seed ^ 0x39ab) >>> 0;
    const rand = (): number => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const gridGeo = new T.PlaneGeometry(6.2, 12);
    geos.push(gridGeo);
    const gridMat = new T.MeshStandardMaterial({ color: 0x222a2e, roughness: 1 });
    mats.push(gridMat);
    const before = new T.Mesh(gridGeo, gridMat);
    before.rotation.x = -Math.PI / 2;
    before.position.set(-3.4, 0.02, 0);
    root.add(before);

    const afterGeo = new T.PlaneGeometry(6.2, 12, 12, 24);
    geos.push(afterGeo);
    {
      const p = afterGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i += 1) {
        const x = p.getX(i);
        const y = p.getY(i);
        p.setZ(i, Math.sin(x * 1.4) * Math.cos(y * 0.9) * 0.18 + Math.sin(x * 3.1 + y * 1.7) * 0.05);
      }
      afterGeo.computeVertexNormals();
    }
    const afterMat = new T.MeshStandardMaterial({ color: 0x3e6b4f, roughness: 0.95 });
    mats.push(afterMat);
    const after = new T.Mesh(afterGeo, afterMat);
    after.rotation.x = -Math.PI / 2;
    after.position.set(3.4, 0.26, 0);
    root.add(after);

    // Divider wall between before and after.
    const divGeo = new T.BoxGeometry(0.25, 3.2, 12);
    geos.push(divGeo);
    const divMat = new T.MeshStandardMaterial({ color: 0xd8d2c2, roughness: 0.8 });
    mats.push(divMat);
    const div = new T.Mesh(divGeo, divMat);
    div.position.set(0, 1.6, 0);
    root.add(div);

    // Props from the log: rocks (grey) and shrubs (green) on the after side.
    const propCount = low ? 14 : 28;
    const rockGeo = new T.IcosahedronGeometry(0.42, 0);
    geos.push(rockGeo);
    const rockMat = new T.MeshStandardMaterial({ color: 0x8b9094, roughness: 0.9, flatShading: true });
    mats.push(rockMat);
    const shrubGeo = new T.IcosahedronGeometry(0.5, 1);
    geos.push(shrubGeo);
    const shrubMat = new T.MeshStandardMaterial({ color: 0x4d8f3f, roughness: 0.9, flatShading: true });
    mats.push(shrubMat);
    const trunkGeo = new T.CylinderGeometry(0.09, 0.13, 0.9, 8);
    geos.push(trunkGeo);
    const trunkMat = new T.MeshStandardMaterial({ color: 0x6b4a30, roughness: 0.95 });
    mats.push(trunkMat);
    const triggers: THREE.Mesh[] = [];
    const ringGeo = new T.TorusGeometry(0.8, 0.07, 8, 28);
    geos.push(ringGeo);
    const ringMat = new T.MeshBasicMaterial({ color: 0xe14b4b });
    mats.push(ringMat);
    const unitBarGeo = new T.BoxGeometry(1.1, 1, 0.2);
    geos.push(unitBarGeo);
    for (let i = 0; i < propCount; i += 1) {
      const px = 1.1 + rand() * 4.6;
      const pz = -5 + rand() * 10;
      if (rand() < 0.45) {
        const rock = new T.Mesh(rockGeo, rockMat);
        rock.position.set(px, 0.3, pz);
        rock.rotation.set(rand() * 3, rand() * 3, 0);
        root.add(rock);
      } else {
        const shrub = new T.Mesh(shrubGeo, shrubMat);
        shrub.position.set(px, 0.75, pz);
        root.add(shrub);
        const trunk = new T.Mesh(trunkGeo, trunkMat);
        trunk.position.set(px, 0.35, pz);
        root.add(trunk);
      }
      if (i % 4 === 0) {
        const ring = new T.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(px, 0.12, pz);
        root.add(ring);
        triggers.push(ring);
      }
    }

    // Operation log as colour bars on the back wall: terrain, scatter, clearing, trigger.
    const logCols = [0x4d8f3f, 0x8b9094, 0xd8d2c2, 0xe14b4b, 0x4d8f3f, 0x8b9094, 0xe14b4b, 0x4d8f3f];
    for (let i = 0; i < logCols.length; i += 1) {
      const h = 0.5 + (i % 3) * 0.35;
      const barMat = new T.MeshStandardMaterial({ color: logCols[i], roughness: 0.7 });
      mats.push(barMat);
      const bar = new T.Mesh(unitBarGeo, barMat);
      bar.scale.y = h;
      bar.position.set(-4.4 + i * 1.25, 4.1, 7.5);
      root.add(bar);
    }

    const update = (elapsed: number): void => {
      const pulse = 0.6 + 0.4 * Math.sin(elapsed * 3);
      for (const t of triggers) t.scale.setScalar(pulse);
    };
    const dispose = (): void => {
      for (const g of geos) g.dispose();
      for (const m of mats) m.dispose();
    };
    return { root, update, dispose };
  },
};
