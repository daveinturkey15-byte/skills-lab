/**
 * Source 27 — Three.js game skill pack (majidmanzarpour), feel-loop extract.
 *
 * Restages the lab demo's extracted method — hitstop freezing the response
 * clock, impact feedback driven by that frozen clock, a cooldown gating the
 * next hit, explicit update order — at human scale: a striker arm on the left
 * hits a target dummy on the right every 1.4 s, with flash, knockback and a
 * cooldown bar on the back wall a visitor can read from the doorway.
 */
import type * as THREE from 'three';
import type { RoomDefinition } from '../contract';

export const room: RoomDefinition = {
  sourceId: 27,
  skill: 'majidmanzarpour/threejs-game-skills',
  title: 'Three.js game skill pack: feel loop',
  summary: 'A striker hits a target on a fixed beat with hitstop freeze, impact flash and a cooldown bar.',
  kind: 'webgpu',
  limitation: 'Feel-loop demonstration only; no scaffold creator, UI designer, QA pipeline or generator skills from the pack.',
  create: (ctx) => {
    const T = ctx.THREE;
    const root = new T.Group();
    const geos: THREE.BufferGeometry[] = [];
    const mats: THREE.Material[] = [];

    const arenaGeo = new T.CircleGeometry(5.2, 40);
    geos.push(arenaGeo);
    const arenaMat = new T.MeshStandardMaterial({ color: 0x274b52, roughness: 0.95 });
    mats.push(arenaMat);
    const arena = new T.Mesh(arenaGeo, arenaMat);
    arena.rotation.x = -Math.PI / 2;
    arena.position.set(0, 0.02, -2.2);
    root.add(arena);

    const railGeo = new T.TorusGeometry(5.2, 0.09, 10, 48);
    geos.push(railGeo);
    const railMat = new T.MeshStandardMaterial({ color: 0xd8a03c, roughness: 0.5, emissive: 0x442200, emissiveIntensity: 0.4 });
    mats.push(railMat);
    const rail = new T.Mesh(railGeo, railMat);
    rail.rotation.x = Math.PI / 2;
    rail.position.set(0, 0.1, -2.2);
    root.add(rail);

    // Striker: pivot post + long arm, swings down onto the target.
    const postGeo = new T.CylinderGeometry(0.35, 0.45, 2.6, 14);
    geos.push(postGeo);
    const postMat = new T.MeshStandardMaterial({ color: 0x5a666e, roughness: 0.7 });
    mats.push(postMat);
    const post = new T.Mesh(postGeo, postMat);
    post.position.set(-3.4, 1.3, -2.2);
    root.add(post);

    const armPivot = new T.Group();
    armPivot.position.set(-3.4, 2.7, -2.2);
    root.add(armPivot);
    const armGeo = new T.BoxGeometry(3.4, 0.35, 0.5);
    geos.push(armGeo);
    const armMat = new T.MeshStandardMaterial({ color: 0xc96a2c, roughness: 0.55 });
    mats.push(armMat);
    const arm = new T.Mesh(armGeo, armMat);
    arm.position.set(1.5, 0, 0);
    armPivot.add(arm);
    const headGeo = new T.BoxGeometry(0.7, 0.9, 0.9);
    geos.push(headGeo);
    const headMat = new T.MeshStandardMaterial({ color: 0xe8e2d2, roughness: 0.5 });
    mats.push(headMat);
    const head = new T.Mesh(headGeo, headMat);
    head.position.set(3.1, -0.2, 0);
    armPivot.add(head);

    // Target dummy: legible from the door, flashes on impact.
    const dummy = new T.Group();
    dummy.position.set(1.6, 0, -2.2);
    root.add(dummy);
    const bodyGeo = new T.CylinderGeometry(0.75, 0.9, 2.2, 18);
    geos.push(bodyGeo);
    const bodyMat = new T.MeshStandardMaterial({ color: 0x2e7f8f, roughness: 0.6, emissive: 0x000000, emissiveIntensity: 1 });
    mats.push(bodyMat);
    const body = new T.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.5;
    dummy.add(body);
    const faceGeo = new T.CylinderGeometry(0.5, 0.5, 0.25, 18);
    geos.push(faceGeo);
    const faceMat = new T.MeshStandardMaterial({ color: 0xe8e2d2, roughness: 0.6 });
    mats.push(faceMat);
    const face = new T.Mesh(faceGeo, faceMat);
    face.position.y = 2.2;
    dummy.add(face);
    const baseGeo = new T.CylinderGeometry(1.0, 1.15, 0.35, 18);
    geos.push(baseGeo);
    const baseMat = new T.MeshStandardMaterial({ color: 0x39434a, roughness: 0.9 });
    mats.push(baseMat);
    const base = new T.Mesh(baseGeo, baseMat);
    base.position.y = 0.18;
    dummy.add(base);

    // Impact flash: pooled plane that pops on each hit, allocation-free per frame.
    const flashGeo = new T.PlaneGeometry(2.2, 2.2);
    geos.push(flashGeo);
    const flashMat = new T.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0, side: T.DoubleSide });
    mats.push(flashMat);
    const flash = new T.Mesh(flashGeo, flashMat);
    flash.position.set(0.2, 1.6, -2.2);
    flash.rotation.y = Math.PI;
    root.add(flash);

    // Cooldown + hitstop bars on the back wall, 8 m wide so they read far away.
    const wallGeo = new T.PlaneGeometry(8.4, 1.5);
    geos.push(wallGeo);
    const wallMat = new T.MeshBasicMaterial({ color: 0x141b1e });
    mats.push(wallMat);
    const wall = new T.Mesh(wallGeo, wallMat);
    wall.position.set(0, 3.4, 7.6);
    wall.rotation.y = Math.PI;
    root.add(wall);
    const coolGeo = new T.PlaneGeometry(7.6, 0.4);
    geos.push(coolGeo);
    const coolMat = new T.MeshBasicMaterial({ color: 0x46c08a });
    mats.push(coolMat);
    const cool = new T.Mesh(coolGeo, coolMat);
    cool.position.set(0, 3.65, 7.55);
    cool.rotation.y = Math.PI;
    root.add(cool);
    const stopGeo = new T.PlaneGeometry(7.6, 0.4);
    geos.push(stopGeo);
    const stopMat = new T.MeshBasicMaterial({ color: 0xe14b4b });
    mats.push(stopMat);
    const stop = new T.Mesh(stopGeo, stopMat);
    stop.position.set(0, 3.1, 7.55);
    stop.rotation.y = Math.PI;
    root.add(stop);

    const HIT = 1.4;
    const STOP = 0.12;
    let clock = 0;
    let shake = 0;
    let hitstopLeft = 0;

    const update = (_elapsed: number, dt: number): void => {
      const step = Math.min(dt, 0.05);
      clock += step;
      if (clock >= HIT) {
        clock -= HIT;
        hitstopLeft = STOP;
        shake = 1;
      }
      // Explicit order: cooldown, hitstop, physics, feedback decay.
      const coolFrac = Math.min(1, clock / HIT);
      cool.scale.x = Math.max(0.001, coolFrac);
      cool.position.x = -3.8 * (1 - coolFrac);
      if (hitstopLeft > 0) {
        hitstopLeft -= step;
        stop.scale.x = 1;
        stop.position.x = 0;
        armPivot.rotation.z = -0.5;
        flashMat.opacity = 0.95;
        return;
      }
      stop.scale.x = 0.001;
      const swing = clock / HIT;
      armPivot.rotation.z = -0.5 + swing * 0.55;
      shake = Math.max(0, shake - step * 5.5);
      const knock = shake * shake;
      dummy.position.x = 1.6 + knock * 0.55;
      dummy.rotation.z = -knock * 0.22;
      bodyMat.emissive.setHex(0xff9a3c);
      bodyMat.emissiveIntensity = knock * 1.6;
      flashMat.opacity = knock * 0.9;
      flash.rotation.z += step * (1 + knock * 9);
    };

    const dispose = (): void => {
      for (const g of geos) g.dispose();
      for (const m of mats) m.dispose();
    };
    return { root, update, dispose };
  },
};
