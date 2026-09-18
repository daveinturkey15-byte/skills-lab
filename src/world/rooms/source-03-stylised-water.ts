/**
 * Source 3 — Stylised water composition (no repository, comparator only).
 *
 * Restages the lab demo's register comparator list as a walk-in split floor:
 * flat single-colour water on the left (the failure mode), depth-ramped water
 * with shore foam, caustic read and a moving wake on the right, over the same
 * beach bathymetry with a sandbar. A small boat hull sits on the after side.
 */
import type * as THREE from 'three';
import type { RoomDefinition } from '../contract';

export const room: RoomDefinition = {
  sourceId: 3,
  skill: 'threejs-webgpu-water',
  title: 'Stylised water composition',
  summary: 'One beach, two waters: flat colour on the left, depth ramp with foam and wake on the right.',
  kind: 'webgpu',
  limitation: 'Comparator only: attractive reference imagery proves no implementation, and this demo does not match any target.',
  create: (ctx) => {
    const T = ctx.THREE;
    const root = new T.Group();
    const geos: THREE.BufferGeometry[] = [];
    const mats: THREE.Material[] = [];
    const low = ctx.quality === 'low';
    const SEG = low ? 20 : 40;

    const depthAt = (x: number, z: number): number => {
      const shelf = (z + 6) / 12;
      const bar = Math.exp(-(((z - 1.5) / 1.8) ** 2)) * 0.35;
      return Math.min(1, Math.max(0, shelf - bar * 0.7 + Math.sin(x * 0.8) * 0.04));
    };

    const mkPanel = (left: boolean): THREE.Mesh => {
      const geo = new T.PlaneGeometry(6.2, 12, 10, SEG);
      geos.push(geo);
      const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.4 });
      mats.push(mat);
      const mesh = new T.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(left ? -3.35 : 3.35, 0.5, 0);
      mesh.userData.left = left;
      root.add(mesh);
      return mesh;
    };
    const before = mkPanel(true);
    const after = mkPanel(false);

    const paint = (mesh: THREE.Mesh, time: number): void => {
      const geo = mesh.geometry as THREE.BufferGeometry;
      const pos = geo.getAttribute('position') as THREE.BufferAttribute;
      let col = geo.getAttribute('color') as THREE.BufferAttribute | undefined;
      if (!col) {
        col = new T.BufferAttribute(new Float32Array(pos.count * 3), 3);
        geo.setAttribute('color', col);
      }
      const left = mesh.userData.left as boolean;
      const cx = mesh.position.x;
      for (let i = 0; i < pos.count; i += 1) {
        const lx = pos.getX(i);
        const ly = pos.getY(i);
        const wx = cx + lx;
        const wz = ly;
        const d = depthAt(wx, wz);
        pos.setZ(i, Math.sin(lx * 1.2 + time * 1.4) * 0.05 + Math.sin(ly * 0.9 - time) * 0.04);
        if (left) {
          col.setXYZ(i, 0.16, 0.42, 0.55);
        } else {
          // Shallow-to-deep ramp, foam band at the shoreline, caustic shimmer, wake ring.
          const shallow: [number, number, number] = [0.35, 0.75, 0.72];
          const deep: [number, number, number] = [0.04, 0.23, 0.42];
          let r = shallow[0] + (deep[0] - shallow[0]) * d;
          let g = shallow[1] + (deep[1] - shallow[1]) * d;
          let b = shallow[2] + (deep[2] - shallow[2]) * d;
          const foamBand = Math.max(0, 1 - Math.abs(d - 0.18) * 9);
          const caustic = Math.max(0, Math.sin(lx * 4 + time * 2) * Math.sin(ly * 3.4 - time * 1.6)) * (1 - d) * 0.25;
          const wake = Math.max(0, 1 - Math.hypot(lx - 1.2, ly - 1.0 + ((time * 0.6) % 6)) * 1.4) * 0.5;
          const foam = Math.min(1, foamBand + wake);
          r = r + foam * 0.6 + caustic;
          g = g + foam * 0.62 + caustic;
          b = b + foam * 0.6 + caustic * 0.8;
          col.setXYZ(i, Math.min(1, r), Math.min(1, g), Math.min(1, b));
        }
      }
      pos.needsUpdate = true;
      col.needsUpdate = true;
      geo.computeVertexNormals();
    };

    // Sand bed under both panels so shallows read through the colour.
    for (const sx of [-3.35, 3.35]) {
      const bedGeo = new T.PlaneGeometry(6.2, 12);
      geos.push(bedGeo);
      const bedMat = new T.MeshStandardMaterial({ color: 0xb09a6a, roughness: 1 });
      mats.push(bedMat);
      const bed = new T.Mesh(bedGeo, bedMat);
      bed.rotation.x = -Math.PI / 2;
      bed.position.set(sx, 0.18, 0);
      root.add(bed);
    }

    // Small boat hull on the after side, the wake's owner.
    const hullGeo = new T.BoxGeometry(1.0, 0.5, 2.4);
    geos.push(hullGeo);
    const hullMat = new T.MeshStandardMaterial({ color: 0x6b4a30, roughness: 0.8 });
    mats.push(hullMat);
    const hull = new T.Mesh(hullGeo, hullMat);
    hull.position.set(4.4, 0.85, 0.5);
    root.add(hull);
    const mastGeo = new T.CylinderGeometry(0.05, 0.05, 1.8, 8);
    geos.push(mastGeo);
    const mastMat = new T.MeshStandardMaterial({ color: 0x4a3826, roughness: 0.85 });
    mats.push(mastMat);
    const mast = new T.Mesh(mastGeo, mastMat);
    mast.position.set(4.4, 1.9, 0.5);
    root.add(mast);

    paint(before, 0);
    paint(after, 0);
    let acc = 0;
    const update = (_e: number, dt: number): void => {
      acc += Math.min(dt, 0.05);
      paint(after, acc);
      hull.position.y = 0.85 + Math.sin(acc * 1.6) * 0.06;
      hull.rotation.z = Math.sin(acc * 1.3) * 0.05;
    };
    const dispose = (): void => {
      for (const g of geos) g.dispose();
      for (const m of mats) m.dispose();
    };
    return { root, update, dispose };
  },
};
