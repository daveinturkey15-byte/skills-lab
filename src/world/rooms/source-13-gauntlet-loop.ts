/**
 * Source 13 — Gauntlet loop (five steps plus frozen regressions and budgets).
 *
 * A walk-in harness: builder bench on the left improving a silhouette across
 * rounds, fresh critic booth on the right that never sees builder history,
 * and the frozen regression wall on the back — green bars that may only grow
 * — with round and spend budgets beside it. Builder and critic are pure
 * functions of round number; no model is called.
 */
import type * as THREE from 'three';
import type { RoomDefinition } from '../contract';

export const room: RoomDefinition = {
  sourceId: 13,
  skill: 'visual-gauntlet-loop',
  title: 'Gauntlet loop',
  summary: 'Builder improves round by round on the left, a fresh critic judges on the right, regressions frozen on the wall.',
  kind: 'webgpu',
  limitation: 'Loop mechanics only: builder and critic are pure functions here, and the article prose is marketing, not authority.',
  create: (ctx) => {
    const T = ctx.THREE;
    const root = new T.Group();
    const geos: THREE.BufferGeometry[] = [];
    const mats: THREE.Material[] = [];

    const floorGeo = new T.PlaneGeometry(13, 13);
    geos.push(floorGeo);
    const floorMat = new T.MeshStandardMaterial({ color: 0x2c3438, roughness: 1 });
    mats.push(floorMat);
    const floor = new T.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0.02, 0);
    root.add(floor);

    // Builder bench left: round-0 silhouette (rough) vs accepted round (clean).
    const deskGeo = new T.BoxGeometry(1.8, 0.9, 1.2);
    geos.push(deskGeo);
    const deskMat = new T.MeshStandardMaterial({ color: 0x4a545c, roughness: 0.85 });
    mats.push(deskMat);
    for (const [sx, rough] of [[-3.6, true], [-1.2, false]] as const) {
      const desk = new T.Mesh(deskGeo, deskMat);
      desk.position.set(sx, 0.45, 0.5);
      root.add(desk);
      const figGeo = rough ? new T.IcosahedronGeometry(0.55, 0) : new T.SphereGeometry(0.55, 18, 12);
      geos.push(figGeo);
      const figMat = new T.MeshStandardMaterial({ color: rough ? 0xe14b4b : 0x46c08a, roughness: 0.6, flatShading: rough });
      mats.push(figMat);
      const fig = new T.Mesh(figGeo, figMat);
      fig.position.set(sx, 1.6, 0.5);
      fig.userData.bob = sx;
      root.add(fig);
    }

    // Critic booth right: isolated desk with a red-pen arm and a blind screen.
    const boothGeo = new T.BoxGeometry(2.6, 2.6, 0.3);
    geos.push(boothGeo);
    const boothMat = new T.MeshStandardMaterial({ color: 0x39434a, roughness: 0.9 });
    mats.push(boothMat);
    const booth = new T.Mesh(boothGeo, boothMat);
    booth.position.set(3.8, 1.3, 0.5);
    booth.rotation.y = -Math.PI / 2;
    root.add(booth);
    const screenGeo = new T.PlaneGeometry(1.8, 1.2);
    geos.push(screenGeo);
    const screenMat = new T.MeshBasicMaterial({ color: 0xdfe8e4 });
    mats.push(screenMat);
    const screen = new T.Mesh(screenGeo, screenMat);
    screen.position.set(3.6, 1.7, 0.5);
    screen.rotation.y = -Math.PI / 2;
    root.add(screen);
    const penGeo = new T.BoxGeometry(0.12, 1.4, 0.12);
    geos.push(penGeo);
    const penMat = new T.MeshStandardMaterial({ color: 0xe14b4b, roughness: 0.5 });
    mats.push(penMat);
    const pen = new T.Mesh(penGeo, penMat);
    pen.position.set(3.2, 1.5, 1.6);
    pen.rotation.z = 0.5;
    root.add(pen);

    // Frozen regression wall: six green bars that only grow; budgets beside.
    const bars: THREE.Mesh[] = [];
    const regGeo = new T.BoxGeometry(1.0, 0.4, 0.25);
    geos.push(regGeo);
    const regMat = new T.MeshStandardMaterial({ color: 0x46c08a, roughness: 0.6 });
    mats.push(regMat);
    for (let i = 0; i < 6; i += 1) {
      const bar = new T.Mesh(regGeo, regMat);
      bar.position.set(-4.5 + i * 1.25, 3.6, 7.5);
      root.add(bar);
      bars.push(bar);
    }
    const dialGeo = new T.TorusGeometry(0.55, 0.12, 8, 24, Math.PI * 1.5);
    geos.push(dialGeo);
    for (let i = 0; i < 2; i += 1) {
      const dialMat = new T.MeshStandardMaterial({ color: i ? 0xd8a03c : 0x2e7f8f, roughness: 0.55 });
      mats.push(dialMat);
      const dial = new T.Mesh(dialGeo, dialMat);
      dial.position.set(i ? 4.6 : -4.6, 2.2, 7.5);
      root.add(dial);
    }

    const bobs: THREE.Object3D[] = [];
    root.traverse((o) => {
      if ((o as THREE.Mesh).userData.bob !== undefined) bobs.push(o);
    });
    const update = (elapsed: number): void => {
      for (const b of bobs) b.position.y = 1.6 + Math.sin(elapsed * 2 + (b as THREE.Mesh).userData.bob as number) * 0.12;
      pen.rotation.z = 0.5 + Math.sin(elapsed * 3.2) * 0.25;
      const round = Math.floor(elapsed / 2) % 7;
      for (let i = 0; i < bars.length; i += 1) {
        bars[i].scale.x = i <= round ? 1 : 0.25;
      }
      screenMat.color.setHex(round % 2 ? 0xdfe8e4 : 0xf2d8d8);
    };
    const dispose = (): void => {
      for (const g of geos) g.dispose();
      for (const m of mats) m.dispose();
    };
    return { root, update, dispose };
  },
};
