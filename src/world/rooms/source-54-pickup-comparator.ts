/**
 * Source 54 — DeepSeek V4.1 Flash authoring a pickup truck in Blender.
 *
 * Comparator staging: the hard part the frames verify — a many-part truck
 * with modelled underbody (exhaust, suspension arms, driveshaft, chassis
 * rails, tyred wheels) — built here from primitives on a turntable, with an
 * outliner wall of part bars behind it. The poster's authorship claim is not
 * verified and the room does not repeat it as fact.
 */
import type * as THREE from 'three';
import type { RoomDefinition } from '../contract';

export const room: RoomDefinition = {
  sourceId: 54,
  skill: 'blender-gauntlet-loop',
  title: 'Pickup truck authored in Blender',
  summary: 'A many-part pickup with modelled underbody on a turntable, outliner bars on the wall behind it.',
  kind: 'webgpu',
  limitation: 'Frames verify a detailed truck scene exists; mechanically accurate and built-by claims are the poster\u2019s, unproven here.',
  create: (ctx) => {
    const T = ctx.THREE;
    const root = new T.Group();
    const geos: THREE.BufferGeometry[] = [];
    const mats: THREE.Material[] = [];

    const floorGeo = new T.CircleGeometry(4.2, 36);
    geos.push(floorGeo);
    // Pale display pad: the truck is dark paint on a dark shell, and from the
    // door it merged into one bin. The pad separates exhibit from shell.
    const floorMat = new T.MeshStandardMaterial({ color: 0x596066, roughness: 1 });
    mats.push(floorMat);
    const floor = new T.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(1.5, 0.02, -1.5);
    root.add(floor);

    const truck = new T.Group();
    truck.position.set(2.5, 1.0, -1.5);
    root.add(truck);
    const paint = new T.MeshStandardMaterial({ color: 0x2e5f8f, roughness: 0.45, metalness: 0.25 });
    mats.push(paint);
    const dark = new T.MeshStandardMaterial({ color: 0x1c2226, roughness: 0.8 });
    mats.push(dark);
    const steel = new T.MeshStandardMaterial({ color: 0x8b9094, roughness: 0.4, metalness: 0.7 });
    mats.push(steel);
    const rubber = new T.MeshStandardMaterial({ color: 0x141414, roughness: 0.95 });
    mats.push(rubber);

    const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number): THREE.Mesh => {
      geos.push(geo);
      const m = new T.Mesh(geo, mat);
      m.position.set(x, y, z);
      truck.add(m);
      return m;
    };
    // Body: cab, bonnet, bed with walls — the easy shell. One shared geo per size.
    const shellGeos = [new T.BoxGeometry(1.9, 0.85, 1.7), new T.BoxGeometry(1.85, 0.7, 1.4), new T.BoxGeometry(1.9, 0.5, 1.5), new T.BoxGeometry(0.12, 0.55, 1.5), new T.BoxGeometry(1.7, 0.55, 1.4)];
    for (const g of shellGeos) geos.push(g);
    add(shellGeos[0], paint, 0, 0.85, 1.15);
    add(shellGeos[1], paint, 0, 0.72, -0.55);
    add(shellGeos[2], paint, 0, 0.55, -2.2);
    add(shellGeos[3], paint, -0.95, 1.0, -2.2);
    add(shellGeos[3], paint, 0.95, 1.0, -2.2);
    // Glasshouse.
    add(shellGeos[4], dark, 0, 1.5, 1.1);
    // Chassis rails, driveshaft, exhaust, suspension arms — the hard underbody.
    const railGeo = new T.BoxGeometry(0.18, 0.22, 4.6);
    geos.push(railGeo);
    add(railGeo, steel, -0.55, 0.05, -0.5);
    add(railGeo, steel, 0.55, 0.05, -0.5);
    const shaftGeo = new T.CylinderGeometry(0.09, 0.09, 3.4, 10);
    geos.push(shaftGeo);
    add(shaftGeo, steel, 0, 0.08, -0.6).rotation.x = Math.PI / 2;
    const exhaustGeo = new T.CylinderGeometry(0.11, 0.11, 3.8, 10);
    geos.push(exhaustGeo);
    add(exhaustGeo, dark, -0.35, -0.02, -0.7).rotation.x = Math.PI / 2;
    const armGeo = new T.BoxGeometry(0.5, 0.12, 0.9);
    geos.push(armGeo);
    for (const [sx, sz] of [[-0.8, 1.3], [0.8, 1.3], [-0.8, -1.9], [0.8, -1.9]] as const) {
      const arm = add(armGeo, steel, sx, 0.12, sz);
      arm.rotation.z = sx > 0 ? -0.2 : 0.2;
    }
    // Wheels with tyres, lifted so the underbody reads.
    const wheelGeo = new T.CylinderGeometry(0.5, 0.5, 0.4, 18);
    geos.push(wheelGeo);
    const hubGeo = new T.CylinderGeometry(0.22, 0.22, 0.42, 12);
    geos.push(hubGeo);
    const wheels: THREE.Mesh[] = [];
    for (const [sx, sz] of [[-1.0, 1.3], [1.0, 1.3], [-1.0, -1.9], [1.0, -1.9]] as const) {
      const w = add(wheelGeo, rubber, sx, 0.1, sz);
      w.rotation.z = Math.PI / 2;
      wheels.push(w);
      const hub = add(hubGeo, steel, sx, 0.1, sz);
      hub.rotation.z = Math.PI / 2;
    }
    // Stands lift the truck a metre so a visitor sees the pipes.
    const standGeo = new T.BoxGeometry(0.3, 1.0, 0.3);
    geos.push(standGeo);
    const standMat = new T.MeshStandardMaterial({ color: 0xd8a03c, roughness: 0.7 });
    mats.push(standMat);
    for (const [sx, sz] of [[-0.9, 0.6], [0.9, 0.6], [-0.9, -1.6], [0.9, -1.6]] as const) {
      const stand = new T.Mesh(standGeo, standMat);
      stand.position.set(sx + 2.5, 0.5, -1.5 + sz);
      root.add(stand);
    }

    // Outliner totem on the left wall of the door half: one bar per part
    // group, long bars for the underbody. It used to hang on the back wall,
    // 11 m from the door, where it contributed nothing on entry; the groups
    // and their order are unchanged, only the address.
    const parts: Array<[number, number]> = [[2.6, 0x2e5f8f], [2.2, 0x2e5f8f], [3.2, 0x8b9094], [2.8, 0x1c2226], [1.8, 0x8b9094], [2.4, 0x141414], [1.4, 0xd8a03c], [2.0, 0x8b9094]];
    const outGeo = new T.BoxGeometry(1, 0.35, 0.2);
    geos.push(outGeo);
    for (let i = 0; i < parts.length; i += 1) {
      const barMat = new T.MeshStandardMaterial({ color: parts[i][1], roughness: 0.65 });
      mats.push(barMat);
      const bar = new T.Mesh(outGeo, barMat);
      bar.scale.x = parts[i][0];
      bar.rotation.y = Math.PI / 2;
      bar.position.set(-4.6, 4.5 - i * 0.5, -2.2);
      root.add(bar);
    }

    const update = (elapsed: number): void => {
      // Swing, not a full spin: the long bed would sweep the room centre.
      truck.rotation.y = 0.6 + Math.sin(elapsed * 0.4) * 0.45;
      for (const w of wheels) w.rotation.y = elapsed * 0.8;
    };
    const dispose = (): void => {
      for (const g of geos) g.dispose();
      for (const m of mats) m.dispose();
    };
    return { root, update, dispose };
  },
};
