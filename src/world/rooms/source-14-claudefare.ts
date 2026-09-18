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
    // Exhibit legend boards, staging only: a comparator that does not say
    // which half is which forces the visitor to read the wall card first, and
    // the doorway read (detail 5%, hues 3) wants text edges and two status
    // hues. Canvas boards like the door plates; nothing of the rubric changes.
    const legendBoard = (title: string, sub: string, chip: string): THREE.Mesh => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 256;
      const paint = canvas.getContext('2d')!;
      paint.fillStyle = '#10141a';
      paint.fillRect(0, 0, 1024, 256);
      paint.fillStyle = chip;
      paint.fillRect(0, 0, 1024, 64);
      paint.fillStyle = '#10141a';
      paint.font = 'bold 40px system-ui, sans-serif';
      paint.textAlign = 'center';
      paint.textBaseline = 'middle';
      paint.fillText(title, 512, 34);
      paint.fillStyle = '#cfe3de';
      paint.font = '38px system-ui, sans-serif';
      paint.fillText(sub, 512, 150);
      const texture = track(new T.CanvasTexture(canvas));
      texture.colorSpace = T.SRGBColorSpace;
      const geometry = track(new T.PlaneGeometry(3.4, 0.85));
      const material = track(new T.MeshBasicMaterial({ map: texture, toneMapped: false }));
      const board = new T.Mesh(geometry, material);
      board.rotation.y = Math.PI;
      return board;
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
    // Fourth touch (declared): halves pulled from ±2.9 to ±1.9 so the pair
    // fills the centre of the door frame instead of leaking out of its edges
    // (coverage 26% is the room's headroom), and the labels hung over the
    // guns at gun depth — upright, door-side of the through-room wall.
    const halfX = 1.9;
    const baseY = 1.55;
    // Forward of centre so the doorway view looks down the barrel line at 4 m.
    const baseZ = -2.2;
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
    // Labels hung over the guns at gun depth: upright, facing the door. They
    // name the halves so the comparator reads without the wall card, and
    // their chips carry the hues the doorway metric was missing. Door-side
    // of the through-room wall at local z=0, like everything else in here.
    const beforeBoard = legendBoard('BEFORE', 'floating gun · one skin · no light', '#c0392b');
    beforeBoard.position.set(-halfX, 2.55, baseZ);
    root.add(beforeBoard);
    const afterBoard = legendBoard('AFTER', 'connected arm · contrast · muzzle light', '#2ecc71');
    afterBoard.position.set(halfX, 2.55, baseZ);
    root.add(afterBoard);

    return {
      root,
      update: (time: number) => {
        // Three-round burst every two seconds. The demo's single 60 ms blink
        // every 1.6 s almost never lands inside a walk-in glance, so the
        // rubric's third question — does the muzzle light read — never got
        // answered; a burst keeps the same firing idea and stays visible.
        const phase = time % 2.0;
        const pulse = (start: number): number => {
          const p = phase - start;
          return p >= 0 && p < 0.12 ? 1 - p / 0.12 : 0;
        };
        const flashOn = Math.max(pulse(0), pulse(0.3), pulse(0.6));
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
