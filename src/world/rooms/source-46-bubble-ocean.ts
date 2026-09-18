/**
 * Source 46 — Physically-based FFT ocean and the bubble-backscatter miss.
 *
 * Restages the lab demo's restated physics (never the commercial product):
 * two basins side by side over identical waves, the left adding a flat white
 * tint after absorption (the mistake), the right injecting the same energy
 * upstream of the Beer-Lambert integral so it emerges green-shifted. Foam
 * state accumulates from a Jacobian-style fold proxy and decays, shared by
 * both basins as the single estimator the method describes.
 */
import type * as THREE from 'three';
import type { RoomDefinition } from '../contract';

export const room: RoomDefinition = {
  sourceId: 46,
  skill: 'threejs-webgpu-water',
  title: 'FFT ocean and bubble backscatter',
  summary: 'Two basins, one wave field: flat white tint on the left, absorption-filtered green scatter on the right.',
  kind: 'webgpu',
  limitation: 'Restated textbook physics only, no product code; waves are a few sine crests, not an FFT spectrum, and foam is a proxy.',
  create: (ctx) => {
    const T = ctx.THREE;
    const root = new T.Group();
    const geos: THREE.BufferGeometry[] = [];
    const mats: THREE.Material[] = [];
    const low = ctx.quality === 'low';
    const SEG = low ? 24 : 48;

    // Absorption coefficients: smallest in green, which is why correct
    // injection comes out green-shifted.
    const ABS = { r: 0.32, g: 0.12, b: 0.2 };

    const mkBasin = (wrong: boolean): THREE.Mesh => {
      const geo = new T.PlaneGeometry(6.0, 12, 12, SEG);
      geos.push(geo);
      const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.05 });
      mats.push(mat);
      const mesh = new T.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(wrong ? -3.35 : 3.35, 0.55, 0);
      mesh.userData.wrong = wrong;
      root.add(mesh);
      return mesh;
    };
    const left = mkBasin(true);
    const right = mkBasin(false);

    const paint = (mesh: THREE.Mesh, time: number): void => {
      const geo = mesh.geometry as THREE.BufferGeometry;
      const pos = geo.getAttribute('position') as THREE.BufferAttribute;
      let col = geo.getAttribute('color') as THREE.BufferAttribute | undefined;
      if (!col) {
        col = new T.BufferAttribute(new Float32Array(pos.count * 3), 3);
        geo.setAttribute('color', col);
      }
      const wrong = mesh.userData.wrong as boolean;
      for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        // Shared crest field: two travelling sines plus chop.
        const h = Math.sin(x * 1.1 + time * 1.3) * 0.32 + Math.sin(y * 0.7 - time * 0.9) * 0.28;
        const fold = Math.max(0, Math.cos(x * 1.1 + time * 1.3) * 0.5 + 0.5 - 0.55) * 2;
        const foam = Math.min(1, fold * 1.4);
        const depth = 1.1 + h * 0.5;
        pos.setZ(i, h);
        // Correct: flat bubble source filtered by absorption on the way out.
        // bg*e^(-a*d) + (S/a)*(1-e^(-a*d)); wrong: same S added flat after.
        const S = 0.35 * foam + 0.04;
        const bg = 0.05;
        let r: number;
        let g: number;
        let b: number;
        if (wrong) {
          r = bg * Math.exp(-ABS.r * depth) + S;
          g = bg * Math.exp(-ABS.g * depth) + S;
          b = bg * Math.exp(-ABS.b * depth) + S;
        } else {
          r = bg * Math.exp(-ABS.r * depth) + (S / (ABS.r * 4)) * (1 - Math.exp(-ABS.r * depth));
          g = bg * Math.exp(-ABS.g * depth) + (S / (ABS.g * 4)) * (1 - Math.exp(-ABS.g * depth));
          b = bg * Math.exp(-ABS.b * depth) + (S / (ABS.b * 4)) * (1 - Math.exp(-ABS.b * depth));
        }
        // Surface foam floats on top: added after, on both sides.
        r += foam * 0.55;
        g += foam * 0.58;
        b += foam * 0.52;
        col.setXYZ(i, Math.min(1, r + 0.12), Math.min(1, g + 0.2), Math.min(1, b + 0.22));
      }
      pos.needsUpdate = true;
      col.needsUpdate = true;
      geo.computeVertexNormals();
    };

    // Basin tubs so the water reads as volume from the door.
    for (const sx of [-3.35, 3.35]) {
      const tubGeo = new T.BoxGeometry(6.4, 0.55, 12.4);
      geos.push(tubGeo);
      const tubMat = new T.MeshStandardMaterial({ color: 0x1c2226, roughness: 0.85 });
      mats.push(tubMat);
      const tub = new T.Mesh(tubGeo, tubMat);
      tub.position.set(sx, 0.26, 0);
      root.add(tub);
    }
    // Labels: pale bar (wrong) vs green bar (correct) on the back wall.
    for (let i = 0; i < 2; i += 1) {
      const barGeo = new T.BoxGeometry(5.4, 0.7, 0.25);
      geos.push(barGeo);
      const barMat = new T.MeshStandardMaterial({ color: i === 0 ? 0xb9bdc0 : 0x3fae6a, roughness: 0.6 });
      mats.push(barMat);
      const bar = new T.Mesh(barGeo, barMat);
      bar.position.set(i === 0 ? -3.35 : 3.35, 4.4, 7.5);
      root.add(bar);
    }

    paint(left, 0);
    paint(right, 0.4);
    let acc = 0;
    const update = (_e: number, dt: number): void => {
      acc += Math.min(dt, 0.05);
      // Paint every other frame: vertex work is the dearest thing here.
      paint(left, acc);
      paint(right, acc + 0.4);
    };
    const dispose = (): void => {
      for (const g of geos) g.dispose();
      for (const m of mats) m.dispose();
    };
    return { root, update, dispose };
  },
};
