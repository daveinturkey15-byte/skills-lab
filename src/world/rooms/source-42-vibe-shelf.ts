/**
 * Source 42 — The vibe-stack shelf: six MIT Three.js tools by one author.
 *
 * A walk-in index, not an adoption: six plinths in two rows, each with a
 * large simple emblem for one tool (maps, roads, game kit, freed, procedural
 * bank, viz). The seventh tool stays off the shelf — no licence file — and
 * the room says so on its limitation rather than quietly including it.
 */
import type * as THREE from 'three';
import type { RoomDefinition } from '../contract';

export const room: RoomDefinition = {
  sourceId: 42,
  skill: 'threejs-source-prop-ingestion',
  title: 'Vibe-stack shelf: six MIT tools',
  summary: 'Six verified tools on plinths with big emblems; the unlicensed seventh is left off the shelf.',
  kind: 'webgpu',
  limitation: 'Index only, nothing adopted; re-verify each licence file, pin the commit and run the gates before any install.',
  create: (ctx) => {
    const T = ctx.THREE;
    const root = new T.Group();
    const geos: THREE.BufferGeometry[] = [];
    const mats: THREE.Material[] = [];

    const carpetGeo = new T.PlaneGeometry(13, 13);
    geos.push(carpetGeo);
    const carpetMat = new T.MeshStandardMaterial({ color: 0x2c3438, roughness: 1 });
    mats.push(carpetMat);
    const carpet = new T.Mesh(carpetGeo, carpetMat);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(0, 0.02, 0);
    root.add(carpet);

    const names = ['maps', 'roads', 'game kit', 'freed', 'proc bank', 'viz'];
    const cols = [0x2e7f8f, 0xd8a03c, 0x4d8f3f, 0x7a5fc0, 0xc96a2c, 0x46c08a];
    const plinthGeo = new T.BoxGeometry(2.4, 1.0, 2.4);
    geos.push(plinthGeo);
    const plinthMat = new T.MeshStandardMaterial({ color: 0x4a545c, roughness: 0.85 });
    mats.push(plinthMat);
    const bandGeo = new T.BoxGeometry(2.5, 0.25, 2.5);
    geos.push(bandGeo);
    for (let i = 0; i < 6; i += 1) {
      const cx = -4 + (i % 3) * 4;
      const cz = -1.5 + Math.floor(i / 3) * 5;
      const plinth = new T.Mesh(plinthGeo, plinthMat);
      plinth.position.set(cx, 0.5, cz);
      root.add(plinth);
      const bandMat = new T.MeshStandardMaterial({ color: cols[i], roughness: 0.5, emissive: cols[i], emissiveIntensity: 0.25 });
      mats.push(bandMat);
      const band = new T.Mesh(bandGeo, bandMat);
      band.position.set(cx, 1.05, cz);
      root.add(band);

      // One emblem per tool, big and distinct from the door.
      let emblem: THREE.Mesh;
      if (i === 0) {
        const g = new T.PlaneGeometry(1.6, 1.6, 6, 6);
        geos.push(g);
        emblem = new T.Mesh(g, new T.MeshStandardMaterial({ color: cols[i], roughness: 0.7 }));
        mats.push(emblem.material as THREE.Material);
        emblem.rotation.x = -0.4;
      } else if (i === 1) {
        const g = new T.TorusGeometry(0.7, 0.22, 10, 20);
        geos.push(g);
        emblem = new T.Mesh(g, new T.MeshStandardMaterial({ color: cols[i], roughness: 0.6 }));
        mats.push(emblem.material as THREE.Material);
      } else if (i === 2) {
        const g = new T.BoxGeometry(1.2, 1.2, 1.2);
        geos.push(g);
        emblem = new T.Mesh(g, new T.MeshStandardMaterial({ color: cols[i], roughness: 0.6 }));
        mats.push(emblem.material as THREE.Material);
      } else if (i === 3) {
        const g = new T.ConeGeometry(0.8, 1.6, 6);
        geos.push(g);
        emblem = new T.Mesh(g, new T.MeshStandardMaterial({ color: cols[i], roughness: 0.6, flatShading: true }));
        mats.push(emblem.material as THREE.Material);
      } else if (i === 4) {
        const g = new T.IcosahedronGeometry(0.85, 1);
        geos.push(g);
        emblem = new T.Mesh(g, new T.MeshStandardMaterial({ color: cols[i], roughness: 0.6, flatShading: true }));
        mats.push(emblem.material as THREE.Material);
      } else {
        const g = new T.SphereGeometry(0.8, 18, 12);
        geos.push(g);
        emblem = new T.Mesh(g, new T.MeshStandardMaterial({ color: cols[i], roughness: 0.4 }));
        mats.push(emblem.material as THREE.Material);
      }
      emblem.position.set(cx, 2.3, cz);
      emblem.userData.spin = 0.2 + i * 0.06;
      root.add(emblem);
      void names;
    }

    // Empty seventh plinth, laid on its side: the excluded tool.
    const offGeo = new T.BoxGeometry(2.4, 0.5, 2.4);
    geos.push(offGeo);
    const offMat = new T.MeshStandardMaterial({ color: 0x5a2e2e, roughness: 0.9 });
    mats.push(offMat);
    const off = new T.Mesh(offGeo, offMat);
    off.position.set(0, 0.25, 6.2);
    off.rotation.y = 0.3;
    root.add(off);

    const spinners: THREE.Object3D[] = [];
    root.traverse((o) => {
      if ((o as THREE.Mesh).userData.spin) spinners.push(o);
    });
    const update = (elapsed: number): void => {
      for (const s of spinners) s.rotation.y = elapsed * ((s as THREE.Mesh).userData.spin as number);
    };
    const dispose = (): void => {
      for (const g of geos) g.dispose();
      for (const m of mats) m.dispose();
    };
    return { root, update, dispose };
  },
};
