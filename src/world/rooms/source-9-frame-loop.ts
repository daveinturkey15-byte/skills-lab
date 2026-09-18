/**
 * Source 9 — frame-loop and visual audit, restated as a live before/after.
 *
 * The skill's core principle: severity follows the render loop. The room makes
 * the same two defects observable at runtime that the static scanner checks
 * for: the BEFORE engine allocates a fresh Vector3 and Color on every update
 * and builds geometries it never disposes, while the AFTER engine hoists
 * scratch objects and registers everything. Leaking allocations drive the red
 * bar tower upward and pile undisposed debris; the green tower stays flat.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';

export const room: RoomDefinition = {
  sourceId: 9,
  skill: 'threejs-frame-loop-audit',
  title: 'Frame-loop audit, live',
  summary: 'Two identical engines run side by side; the leaky one allocates per frame and piles debris while the clean one stays flat.',
  kind: 'webgpu',
  limitation:
    'Static half only and plain-Three aware: React Doctor was not installed or executed, and every rubric row needing rendered evidence stays unverified here.',
  create: (ctx: RoomContext): RoomInstance => {
    const { THREE, quality } = ctx;
    const root = new THREE.Group();
    const disposables: { dispose(): void }[] = [];
    const track = <T extends { dispose(): void }>(v: T): T => (disposables.push(v), v);
    const debrisCap = quality === 'low' ? 14 : 28;

    for (const [ox, colour] of [[-2.8, 0x6b3546], [2.8, 0x2a524b]] as const) {
      const back = new THREE.Mesh(
        track(new THREE.BoxGeometry(5.6, 4.8, 0.3)),
        track(new THREE.MeshStandardMaterial({
          color: colour, roughness: 0.95, emissive: colour, emissiveIntensity: 0.3,
        })),
      );
      back.position.set(ox, 2.4, 3.2);
      root.add(back);
    }

    interface Engine {
      rotor: THREE.Mesh;
      bar: THREE.Mesh;
      barMat: THREE.Material;
      debris: THREE.Mesh[];
      alloc: number;
    }
    const engines: Engine[] = [];

    for (const [h, ox] of [-2.6, 2.6].entries()) {
      const leaky = h === 0;
      const group = new THREE.Group();
      group.position.set(ox, 0, -1.5);
      root.add(group);

      const housing = new THREE.Mesh(
        track(new THREE.BoxGeometry(2.6, 1.4, 2.2)),
        track(new THREE.MeshStandardMaterial({ color: leaky ? 0xb0543e : 0x3fae8f, roughness: 0.6 })),
      );
      housing.position.y = 0.7;
      group.add(housing);

      const rotor = new THREE.Mesh(
        track(new THREE.CylinderGeometry(0.5, 0.5, 2.4, 14)),
        track(new THREE.MeshStandardMaterial({ color: 0x9fb4bd, roughness: 0.35, metalness: 0.7 })),
      );
      rotor.rotation.x = Math.PI / 2;
      rotor.position.y = 1.9;
      group.add(rotor);

      // Allocation bar: red climbs with cumulative per-frame allocation, green flat.
      const barMat = track(new THREE.MeshStandardMaterial({
        color: leaky ? 0xff4d2a : 0x59d68c,
        emissive: leaky ? 0xff4d2a : 0x59d68c,
        emissiveIntensity: 0.9,
        roughness: 0.5,
      }));
      const bar = new THREE.Mesh(track(new THREE.BoxGeometry(0.7, 1, 0.7)), barMat);
      bar.position.set(leaky ? 2.1 : -2.1, 0.5, 0);
      group.add(bar);

      // Debris pile: the undisposed geometries the leaky half can no longer reach.
      const debris: THREE.Mesh[] = [];
      const debrisGeo = track(new THREE.BoxGeometry(0.4, 0.4, 0.4));
      const debrisMat = track(new THREE.MeshStandardMaterial({ color: 0x8a2e1e, roughness: 0.9 }));
      for (let i = 0; i < debrisCap; i += 1) {
        const cube = new THREE.Mesh(debrisGeo, debrisMat);
        const row = Math.floor(i / 7);
        cube.position.set(-1.6 + (i % 7) * 0.55, 0.2 + row * 0.42, 1.9 - row * 0.3);
        cube.rotation.y = (i * 0.7) % Math.PI;
        cube.visible = false;
        group.add(cube);
        debris.push(cube);
      }
      engines.push({ rotor, bar, barMat, debris, alloc: 0 });
    }

    // AFTER scratch objects, hoisted once: the clean half reuses these.
    const scratchV = new THREE.Vector3();
    const scratchC = new THREE.Color();
    let elapsed = 0;

    return {
      root,
      update: (_t, dt) => {
        elapsed += Math.min(dt, 0.05);
        const leaky = engines[0];
        const clean = engines[1];
        if (leaky && clean) {
          // BEFORE: fresh Vector3 + Color every update, plus a built geometry
          // nobody registers. AFTER: hoisted scratch, everything registered.
          const freshV = new THREE.Vector3(Math.sin(elapsed), 0, Math.cos(elapsed));
          const freshC = new THREE.Color(1, 0.3, 0.1);
          void freshC;
          leaky.alloc += 2;
          leaky.rotor.rotation.z += dt * (2 + freshV.x * 0.2);
          scratchV.set(Math.sin(elapsed), 0, Math.cos(elapsed));
          scratchC.setRGB(0.35, 0.84, 0.55);
          clean.rotor.rotation.z += dt * 2;

          // Red bar climbs with the leak; green bar holds at its baseline.
          const leakHeight = Math.min(3.4, 0.4 + leaky.alloc * 0.004);
          leaky.bar.scale.y = leakHeight;
          leaky.bar.position.y = leakHeight / 2;
          const shown = Math.min(debrisCap, Math.floor(leaky.alloc / 12));
          leaky.debris.forEach((cube, i) => { cube.visible = i < shown; });
        }
      },
      dispose: () => { for (const d of disposables) d.dispose(); },
    };
  },
};
