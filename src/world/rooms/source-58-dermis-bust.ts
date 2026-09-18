/**
 * Source 58 — DERMIS procedural human renderer (explicitly NOT a likeness route).
 *
 * Restages the lab demo's comparator atoms at human scale: a fixed generic
 * mannequin head with hash-mottled skin, hazel iris discs, one blink channel
 * and compute-style scalp strands with length limits and breeze. No image
 * input exists anywhere in this file, which is the point the catalogue owns.
 */
import type * as THREE from 'three';
import type { RoomDefinition } from '../contract';

export const room: RoomDefinition = {
  sourceId: 58,
  skill: 'game-animation-asset-pipeline',
  title: 'DERMIS procedural bust, not a likeness',
  summary: 'A generic mannequin head with strand hair, procedural skin and a single blink; it cannot take a likeness.',
  kind: 'webgpu',
  limitation: 'Not a face-capture or likeness route: one fixed base head, one blink channel, no image input anywhere.',
  create: (ctx) => {
    const T = ctx.THREE;
    const root = new T.Group();
    const geos: THREE.BufferGeometry[] = [];
    const mats: THREE.Material[] = [];
    const low = ctx.quality === 'low';

    let a = (ctx.seed ^ 0x58de) >>> 0;
    const rand = (): number => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const plinthGeo = new T.CylinderGeometry(1.3, 1.5, 1.0, 20);
    geos.push(plinthGeo);
    const plinthMat = new T.MeshStandardMaterial({ color: 0x3a444b, roughness: 0.85 });
    mats.push(plinthMat);
    const plinth = new T.Mesh(plinthGeo, plinthMat);
    plinth.position.set(0, 0.5, -2.2);
    root.add(plinth);
    const rimGeo = new T.TorusGeometry(1.42, 0.07, 8, 28);
    geos.push(rimGeo);
    const rimMat = new T.MeshBasicMaterial({ color: 0xd8a03c });
    mats.push(rimMat);
    const rim = new T.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 1.02, -2.2);
    root.add(rim);

    // Generic head: scaled sphere with vertex-colour mottle, symmetric primitives only.
    const headGeo = new T.SphereGeometry(0.85, low ? 20 : 32, low ? 14 : 22);
    geos.push(headGeo);
    {
      const p = headGeo.getAttribute('position') as THREE.BufferAttribute;
      const colours = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i += 1) {
        const x = p.getX(i);
        const y = p.getY(i);
        const z = p.getZ(i);
        const mottle = Math.sin(x * 31 + ctx.seed) * Math.sin(y * 27 - z * 23) * 0.5 + 0.5;
        colours[i * 3] = 0.72 + mottle * 0.1;
        colours[i * 3 + 1] = 0.55 + mottle * 0.07;
        colours[i * 3 + 2] = 0.45 + mottle * 0.05;
      }
      headGeo.setAttribute('color', new T.BufferAttribute(colours, 3));
    }
    const headMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 });
    mats.push(headMat);
    const head = new T.Mesh(headGeo, headMat);
    head.scale.set(0.86, 1.1, 0.92);
    head.position.set(0, 2.6, -2.2);
    root.add(head);
    // Shoulders close the float gap: a tapered bust block in plain skin tone.
    const bustGeo = new T.CylinderGeometry(0.55, 1.05, 1.1, 18);
    geos.push(bustGeo);
    const bustMat = new T.MeshStandardMaterial({ color: 0xb98a68, roughness: 0.6 });
    mats.push(bustMat);
    const bust = new T.Mesh(bustGeo, bustMat);
    bust.position.set(0, 1.35, -2.2);
    root.add(bust);

    // Iris discs: dark pupil, hazel ring, dark rim — vertex colour, no maps.
    for (const sx of [-0.3, 0.3]) {
      const irisGeo = new T.CircleGeometry(0.17, 20);
      geos.push(irisGeo);
      const p = irisGeo.getAttribute('position') as THREE.BufferAttribute;
      const colours = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i += 1) {
        const r = Math.min(1, Math.hypot(p.getX(i), p.getY(i)) / 0.17);
        let cr = 0.05;
        let cg = 0.04;
        let cb = 0.03;
        if (r >= 0.34 && r < 0.8) { cr = 0.45; cg = 0.3; cb = 0.12; }
        else if (r >= 0.8) { cr = 0.1; cg = 0.08; cb = 0.06; }
        colours[i * 3] = cr;
        colours[i * 3 + 1] = cg;
        colours[i * 3 + 2] = cb;
      }
      irisGeo.setAttribute('color', new T.BufferAttribute(colours, 3));
      const irisMat = new T.MeshBasicMaterial({ vertexColors: true });
      mats.push(irisMat);
      const iris = new T.Mesh(irisGeo, irisMat);
      iris.position.set(sx, 2.65, -1.4);
      iris.rotation.y = Math.PI;
      root.add(iris);
      const lidGeo = new T.BoxGeometry(0.34, 0.06, 0.06);
      geos.push(lidGeo);
      const lidMat = new T.MeshStandardMaterial({ color: 0x6b4a3a, roughness: 0.7 });
      mats.push(lidMat);
      const lid = new T.Mesh(lidGeo, lidMat);
      lid.position.set(sx, 2.82, -1.4);
      lid.userData.lid = true;
      root.add(lid);
    }

    // Scalp strands: line segments with per-strand length cap and breeze phase.
    const STRANDS = low ? 300 : 620;
    const strandGeo = new T.BufferGeometry();
    geos.push(strandGeo);
    const sPos = new Float32Array(STRANDS * 2 * 3);
    const anchors: number[][] = [];
    for (let i = 0; i < STRANDS; i += 1) {
      const th = rand() * Math.PI * 2;
      const ph = rand() * 1.1;
      const ax = Math.sin(ph) * Math.cos(th) * 0.72;
      const ay = 2.75 + Math.cos(ph) * 0.9 + 0.35;
      const az = -2.2 + Math.sin(ph) * Math.sin(th) * 0.68 - 0.1;
      // Crop the fringe short so the procedural face reads; back strands run long.
      const front = az > -2.15 ? 0.45 : 1.15;
      const len = (0.35 + rand() * 0.55) * front;
      anchors.push([ax, ay, az, len, rand() * Math.PI * 2]);
    }
    strandGeo.setAttribute('position', new T.BufferAttribute(sPos, 3));
    const strandMat = new T.LineBasicMaterial({ color: 0x2b1d12 });
    mats.push(strandMat);
    const strands = new T.LineSegments(strandGeo, strandMat);
    root.add(strands);
    // Presentation wings: the chaptered live-demo boards flank the door view.
    const wingGeo = new T.PlaneGeometry(3.2, 3.0);
    geos.push(wingGeo);
    const wingMat = new T.MeshStandardMaterial({ color: 0x14342e, roughness: 0.85 });
    mats.push(wingMat);
    const chipGeo = new T.PlaneGeometry(2.4, 0.4);
    geos.push(chipGeo);
    const chipCols = [0x3fae6a, 0xd8a03c, 0x2e7f8f];
    const chipMats = chipCols.map((c) => new T.MeshBasicMaterial({ color: c }));
    for (const m of chipMats) mats.push(m);
    for (const sx of [-2.8, 2.8]) {
      const wing = new T.Mesh(wingGeo, wingMat);
      wing.position.set(sx, 2.4, -1.2);
      wing.rotation.y = Math.atan2(-sx, -2.8);
      root.add(wing);
      for (let c = 0; c < 3; c += 1) {
        const chip = new T.Mesh(chipGeo, chipMats[c]);
        chip.position.set(0, 0.7 - c * 0.7, 0.03);
        wing.add(chip);
      }
    }

    // Diagnostic bars on the back wall: chapters of the live-demo presentation.
    for (let i = 0; i < 6; i += 1) {
      const barGeo = new T.BoxGeometry(1.5, 0.35, 0.2);
      geos.push(barGeo);
      const barMat = new T.MeshStandardMaterial({ color: i % 2 ? 0x3fae6a : 0x2e7f8f, roughness: 0.6 });
      mats.push(barMat);
      const bar = new T.Mesh(barGeo, barMat);
      bar.position.set(-4 + i * 1.6, 4.3, 7.5);
      root.add(bar);
    }

    const lids: THREE.Mesh[] = [];
    root.traverse((o) => {
      if ((o as THREE.Mesh).userData.lid) lids.push(o as THREE.Mesh);
    });

    const update = (elapsed: number): void => {
      const pos = strandGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < STRANDS; i += 1) {
        const [ax, ay, az, len, phase] = anchors[i];
        const sway = Math.sin(elapsed * 1.6 + phase) * 0.12;
        pos.setXYZ(i * 2, ax, ay, az);
        pos.setXYZ(i * 2 + 1, ax + sway, ay - len, az + Math.cos(elapsed * 1.2 + phase) * 0.08);
      }
      pos.needsUpdate = true;
      // Single blink channel: 3.7 s period, brief close.
      const t = elapsed % 3.7;
      const shut = t < 0.12 ? Math.sin((t / 0.12) * Math.PI) : 0;
      for (const lid of lids) lid.position.y = 2.82 - shut * 0.14;
      head.rotation.y = Math.sin(elapsed * 0.25) * 0.3;
    };
    const dispose = (): void => {
      for (const g of geos) g.dispose();
      for (const m of mats) m.dispose();
    };
    return { root, update, dispose };
  },
};
