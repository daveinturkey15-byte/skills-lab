/**
 * Source 56 — Tripo3D smart-mesh game-ready assets (Assassin Mage / Hexen).
 *
 * Comparator staging: a robed mage on a central plinth between two rocks —
 * dense noisy high-poly on the left, clean game-ready low-poly with a lifted
 * wireframe skin on the right — plus poly-count bars on the back wall. The
 * vendor's environment shots were never captured, so the room shows the
 * retopology claim, not their art.
 */
import type * as THREE from 'three';
import type { RoomDefinition } from '../contract';

export const room: RoomDefinition = {
  sourceId: 56,
  skill: 'ai-3d-asset-generation-loop',
  title: 'Smart-mesh game-ready assets',
  summary: 'A robed mage between dense rock and retopoed rock: the smart-mesh poly-count claim you can walk around.',
  kind: 'webgpu',
  limitation: 'Comparator only: quoted media never captured and game-friendly poly claims not benchmarked here.',
  create: (ctx) => {
    const T = ctx.THREE;
    const root = new T.Group();
    const geos: THREE.BufferGeometry[] = [];
    const mats: THREE.Material[] = [];
    const low = ctx.quality === 'low';

    const floorGeo = new T.PlaneGeometry(13, 13);
    geos.push(floorGeo);
    const floorMat = new T.MeshStandardMaterial({ color: 0x33302a, roughness: 1 });
    mats.push(floorMat);
    const floor = new T.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0.02, 0);
    root.add(floor);

    // Central mage: capsule body, cloak cone, head, staff — primitives only.
    const mage = new T.Group();
    mage.position.set(0, 0, -2.2);
    root.add(mage);
    const robeGeo = new T.ConeGeometry(0.85, 2.4, 12);
    geos.push(robeGeo);
    const robeMat = new T.MeshStandardMaterial({ color: 0x3a2e5c, roughness: 0.8 });
    mats.push(robeMat);
    const robe = new T.Mesh(robeGeo, robeMat);
    robe.position.y = 1.9;
    mage.add(robe);
    const torsoGeo = new T.CapsuleGeometry(0.4, 0.8, 4, 10);
    geos.push(torsoGeo);
    const torsoMat = new T.MeshStandardMaterial({ color: 0x241d3d, roughness: 0.8 });
    mats.push(torsoMat);
    const torso = new T.Mesh(torsoGeo, torsoMat);
    torso.position.y = 2.4;
    mage.add(torso);
    const headGeo = new T.SphereGeometry(0.3, 14, 10);
    geos.push(headGeo);
    const headMat = new T.MeshStandardMaterial({ color: 0xd8b89a, roughness: 0.6 });
    mats.push(headMat);
    const head = new T.Mesh(headGeo, headMat);
    head.position.y = 3.25;
    mage.add(head);
    const staffGeo = new T.CylinderGeometry(0.06, 0.06, 3.2, 8);
    geos.push(staffGeo);
    const staffMat = new T.MeshStandardMaterial({ color: 0x6b4a30, roughness: 0.8 });
    mats.push(staffMat);
    const staff = new T.Mesh(staffGeo, staffMat);
    staff.position.set(0.8, 1.9, 0);
    mage.add(staff);
    const orbGeo = new T.SphereGeometry(0.18, 12, 8);
    geos.push(orbGeo);
    const orbMat = new T.MeshStandardMaterial({ color: 0x7a5fc0, emissive: 0x7a5fc0, emissiveIntensity: 1.2 });
    mats.push(orbMat);
    const orb = new T.Mesh(orbGeo, orbMat);
    orb.position.set(0.8, 3.6, 0);
    mage.add(orb);
    const plinthGeo = new T.CylinderGeometry(1.4, 1.6, 0.6, 20);
    geos.push(plinthGeo);
    const plinthMat = new T.MeshStandardMaterial({ color: 0x4a545c, roughness: 0.9 });
    mats.push(plinthMat);
    const plinth = new T.Mesh(plinthGeo, plinthMat);
    plinth.position.set(0, 0.3, -2.2);
    root.add(plinth);

    // Dense rock left, retopoed rock right with wireframe lift.
    const denseGeo = new T.IcosahedronGeometry(1.3, low ? 2 : 3);
    geos.push(denseGeo);
    {
      const p = denseGeo.getAttribute('position') as THREE.BufferAttribute;
      let s = (ctx.seed ^ 0x56ab) >>> 0;
      const rnd = (): number => {
        s = (Math.imul(s ^ (s >>> 15), 1 | s) + 0x6d2b79f5) | 0;
        return (((s ^ (s >>> 14)) >>> 0) % 1000) / 1000 - 0.5;
      };
      for (let i = 0; i < p.count; i += 1) {
        p.setXYZ(i, p.getX(i) + rnd() * 0.3, p.getY(i) + rnd() * 0.3, p.getZ(i) + rnd() * 0.3);
      }
      denseGeo.computeVertexNormals();
    }
    const denseMat = new T.MeshStandardMaterial({ color: 0x7a6a55, roughness: 0.95, flatShading: true });
    mats.push(denseMat);
    const dense = new T.Mesh(denseGeo, denseMat);
    dense.position.set(-4.2, 1.5, -2.2);
    root.add(dense);

    const cleanGeo = new T.IcosahedronGeometry(1.3, 1);
    geos.push(cleanGeo);
    const cleanMat = new T.MeshStandardMaterial({ color: 0x8a7a60, roughness: 0.9, flatShading: true });
    mats.push(cleanMat);
    const clean = new T.Mesh(cleanGeo, cleanMat);
    clean.position.set(4.2, 1.5, -2.2);
    root.add(clean);
    const wireGeo = new T.WireframeGeometry(cleanGeo);
    geos.push(wireGeo);
    const wireMat = new T.LineBasicMaterial({ color: 0x46c08a });
    mats.push(wireMat);
    const wire = new T.LineSegments(wireGeo, wireMat);
    wire.position.copy(clean.position);
    wire.scale.setScalar(1.01);
    root.add(wire);

    // Poly-count bars: tall red (dense) vs short green (retopo).
    const tallGeo = new T.BoxGeometry(1.6, 3.6, 0.3);
    geos.push(tallGeo);
    const tallMat = new T.MeshStandardMaterial({ color: 0xe14b4b, roughness: 0.6 });
    mats.push(tallMat);
    const tall = new T.Mesh(tallGeo, tallMat);
    tall.position.set(-2.2, 3.0, 7.5);
    root.add(tall);
    const shortGeo = new T.BoxGeometry(1.6, 1.2, 0.3);
    geos.push(shortGeo);
    const shortMat = new T.MeshStandardMaterial({ color: 0x46c08a, roughness: 0.6 });
    mats.push(shortMat);
    const short = new T.Mesh(shortGeo, shortMat);
    short.position.set(2.2, 1.8, 7.5);
    root.add(short);

    const update = (elapsed: number): void => {
      mage.rotation.y = elapsed * 0.3;
      dense.rotation.y = elapsed * 0.1;
      clean.rotation.y = elapsed * 0.1;
      wire.rotation.y = elapsed * 0.1;
      orbMat.emissiveIntensity = 1.0 + Math.sin(elapsed * 3) * 0.5;
    };
    const dispose = (): void => {
      for (const g of geos) g.dispose();
      for (const m of mats) m.dispose();
    };
    return { root, update, dispose };
  },
};
