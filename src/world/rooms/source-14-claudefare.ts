import type * as THREE from 'three';
import type { RoomDefinition, RoomInstance, RoomContext } from '../contract';

/**
 * Source 14 — Modern Claudefare viewmodel rubric. Re-staged from
 * `src/lab/demos/group-a/source-14.ts`: the same two viewmodels (receiver,
 * barrel, magazine, stock, forearm, hand, shoulder anchor) with the same
 * material contrast and the same muzzle-flash cadence. What changed is scale
 * and address: the demo's arm's-length pair becomes two 4x viewmodels at eye
 * height on slabs, barrels toward the door, so the rubric's three questions —
 * is the arm connected, does the weapon contrast, does the muzzle light read
 * — answer themselves from the doorway.
 *
 * BEFORE (left): floating weapon, one shared skin material, no local light.
 * AFTER (right): forearm running back to a shoulder anchor, gunmetal against
 * cloth, one muzzle light on a firing cadence.
 */
export const room: RoomDefinition = {
  sourceId: 14,
  skill: 'unmapped',
  title: 'Modern Claudefare viewmodel rubric',
  summary:
    'A first-person viewmodel comparator: offscreen-connected arm, weapon-to-arm material contrast, and one muzzle light.',
  kind: 'webgpu',
  limitation:
    'Comparator only: the fan site publishes no source, technique or reusable licence, so nothing is copied and matching it is not claimed. The rubric is ours; rendered quality is unverified.',
  create(ctx: RoomContext): RoomInstance {
    const T = ctx.THREE;
    const root = new T.Group();
    root.name = 'source-14-room';
    const disposables: Array<{ dispose(): void }> = [];
    const track = <D extends { dispose(): void }>(d: D): D => {
      disposables.push(d);
      return d;
    };

    const S = 4;
    const skin = track(new T.MeshStandardMaterial({ color: 0xb98a6a, roughness: 0.72 }));
    const sleeve = track(new T.MeshStandardMaterial({ color: 0x4a5240, roughness: 0.9 }));
    const gunmetalBad = track(new T.MeshStandardMaterial({ color: 0xb98a6a, roughness: 0.72 }));
    const polymerBad = track(new T.MeshStandardMaterial({ color: 0xb98a6a, roughness: 0.72 }));
    const gunmetal = track(
      new T.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.28, metalness: 0.88 }),
    );
    const polymer = track(new T.MeshStandardMaterial({ color: 0x17181b, roughness: 0.62 }));
    const slabMat = track(new T.MeshStandardMaterial({ color: 0x5a5e68, roughness: 0.9 }));
    const flashMat = track(
      new T.MeshBasicMaterial({ color: 0xffe0a8, transparent: true, opacity: 0 }),
    );

    const receiverGeo = track(new T.BoxGeometry(0.09 * S, 0.1 * S, 0.5 * S));
    const barrelGeo = track(new T.CylinderGeometry(0.018 * S, 0.02 * S, 0.34 * S, 10));
    barrelGeo.rotateX(Math.PI / 2);
    const magGeo = track(new T.BoxGeometry(0.05 * S, 0.18 * S, 0.1 * S));
    const stockGeo = track(new T.BoxGeometry(0.07 * S, 0.09 * S, 0.24 * S));
    const armLongGeo = track(new T.CapsuleGeometry(0.045 * S, 0.62 * S, 4, 10));
    armLongGeo.rotateX(Math.PI / 2);
    const armShortGeo = track(new T.CapsuleGeometry(0.045 * S, 0.2 * S, 4, 10));
    armShortGeo.rotateX(Math.PI / 2);
    const handGeo = track(new T.BoxGeometry(0.06 * S, 0.07 * S, 0.1 * S));
    const shoulderGeo = track(new T.SphereGeometry(0.07 * S, 10, 8));
    const flashGeo = track(new T.SphereGeometry(0.06 * S, 10, 8));
    const slabGeo = track(new T.BoxGeometry(2.6, 0.12, 5.6));

    // Rig height: the weapon sits at eye level so the doorway view looks down
    // the barrel line rather than at the top of a plinth.
    const halfX = 2.9;
    const baseY = 1.55;
    // Forward of centre so the doorway view looks down the barrel line at 4–6 m.
    const baseZ = -0.8;
    function buildViewmodel(connected: boolean): { group: InstanceType<typeof T.Group>; muzzle: InstanceType<typeof T.Object3D> } {
      const group = new T.Group();
      const gun = connected ? gunmetal : gunmetalBad;
      const poly = connected ? polymer : polymerBad;
      const add = (geometry: THREE.BufferGeometry, material: THREE.MeshStandardMaterial, x: number, y: number, z: number): void => {
        const mesh = new T.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        group.add(mesh);
      };
      add(receiverGeo, gun, 0.1 * S, 0.42 * S, -0.1 * S);
      add(barrelGeo, gun, 0.1 * S, 0.44 * S, -0.44 * S);
      add(magGeo, poly, 0.1 * S, 0.31 * S, -0.08 * S);
      add(stockGeo, poly, 0.1 * S, 0.4 * S, 0.24 * S);
      if (connected) {
        add(armLongGeo, sleeve, 0.13 * S, 0.36 * S, 0.32 * S);
        add(shoulderGeo, sleeve, 0.16 * S, 0.34 * S, 0.62 * S);
      } else {
        add(armShortGeo, skin, 0.13 * S, 0.36 * S, 0.1 * S);
      }
      add(handGeo, skin, 0.12 * S, 0.345 * S, 0.02 * S);
      const muzzle = new T.Object3D();
      muzzle.position.set(0.1 * S, 0.44 * S, -0.62 * S);
      group.add(muzzle);
      return { group, muzzle };
    }

    const bad = buildViewmodel(false);
    bad.group.position.set(-halfX, baseY - 0.42 * S, baseZ);
    const good = buildViewmodel(true);
    good.group.position.set(halfX, baseY - 0.42 * S, baseZ);

    // The connected half's local light: the technique, not decoration.
    const muzzleLight = new T.PointLight(0xffd9a8, 0, 6, 2);
    muzzleLight.name = 'local:muzzle-flash';
    good.muzzle.add(muzzleLight);
    const flash = new T.Mesh(flashGeo, flashMat);
    flash.position.set(0.1 * S, 0.44 * S, -0.66 * S);
    good.group.add(flash);

    for (const [half, x] of [[bad, -halfX], [good, halfX]] as const) {
      root.add(half.group);
      const slab = new T.Mesh(slabGeo, slabMat);
      slab.position.set(x, -0.06, baseZ);
      root.add(slab);
    }

    return {
      root,
      update: (time: number) => {
        // Bounded deterministic firing cadence; the flash is why the light exists.
        const phase = time % 1.6;
        const flashOn = phase < 0.06 ? 1 - phase / 0.06 : 0;
        muzzleLight.intensity = flashOn * 60;
        flashMat.opacity = flashOn * 0.95;
        const recoil = flashOn * 0.12;
        good.group.position.z = baseZ + recoil;
        bad.group.position.z = baseZ + recoil;
      },
      dispose: () => {
        for (const d of disposables) d.dispose();
        root.clear();
      },
    };
  },
};
