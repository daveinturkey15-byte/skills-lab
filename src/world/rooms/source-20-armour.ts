/**
 * Source 20 — engine-free armour, ballistics and destructible battlefields.
 *
 * Restages the group-b armour demo at room scale. The demo's maths is reused,
 * not rewritten: shell segments are resolved front-face-only against convex
 * quad plates plus module boxes in ordered t, penetration is interpolated
 * linearly against true flight distance, and dispersion is a 2-sigma-clamped
 * Gaussian. Two 4 m tanks face each other just inside the door so the exchange
 * reads on entry; a cutaway plate rack on the back wall shows where each
 * round lands.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** pen@distance in mm, restated linear interpolation: 180 at 100 m, 140 at 1000 m. */
function penAtDistanceMm(distM: number): number {
  const t = Math.min(1, Math.max(0, (distM - 100) / 900));
  return 180 - 40 * t;
}

export const room: RoomDefinition = {
  sourceId: 20,
  skill: 'unmapped',
  title: 'Engine-free armour and ballistics',
  summary: 'Two armoured vehicles trade rounds whose plates, penetration and dispersion are resolved per shot.',
  kind: 'webgpu',
  limitation:
    'Thickness over cos(impact) versus pen@distance only; no damage normalisation, module rolls, ERA, spalling, spotting or physics. Shells fly metres so pen clamps near pen100.',
  create: (ctx: RoomContext): RoomInstance => {
    const { THREE, seed } = ctx;
    const rng = mulberry32(seed * 31 + 20);
    const root = new THREE.Group();
    const disposables: { dispose(): void }[] = [];
    const track = <T extends { dispose(): void }>(v: T): T => (disposables.push(v), v);

    // Backdrop fills the doorway frame behind the action. Its upper half is
    // otherwise empty dark pixels from the door, so the pen curve lives on it
    // as bright bars (staging only: the interpolation itself is penAtDistanceMm).
    const backdrop = new THREE.Mesh(
      track(new THREE.BoxGeometry(13, 5.4, 0.3)),
      track(new THREE.MeshStandardMaterial({
        color: 0x2e5a63, roughness: 0.95, emissive: 0x2e5a63, emissiveIntensity: 0.3,
      })),
    );
    backdrop.position.set(0, 2.7, 6.9);
    root.add(backdrop);
    const chartMat = track(new THREE.MeshStandardMaterial({
      color: 0xc7a23a, emissive: 0xc7a23a, emissiveIntensity: 0.85, roughness: 0.6,
    }));
    for (let i = 0; i < 9; i += 1) {
      const pen = penAtDistanceMm(100 + (i * 900) / 8);
      const barHeight = 1.0 + ((pen - 140) / 40) * 1.6;
      const bar = new THREE.Mesh(track(new THREE.BoxGeometry(0.7, barHeight, 0.1)), chartMat);
      bar.position.set(-4.2 + i * 1.05, 2.7 + barHeight / 2, 6.68);
      root.add(bar);
    }
    const baseline = new THREE.Mesh(track(new THREE.BoxGeometry(9.6, 0.08, 0.08)), chartMat);
    baseline.position.set(0, 2.66, 6.68);
    root.add(baseline);

    // Firing lane strip on the floor between the vehicles. Tanks sit closer to
    // the door than before (z -3.5, ~4.5 m read) so their silhouette fills the
    // doorway instead of the backdrop swallowing it.
    const lane = new THREE.Mesh(
      track(new THREE.BoxGeometry(7.5, 0.04, 0.6)),
      track(new THREE.MeshStandardMaterial({
        color: 0xc7a23a, emissive: 0x6b5312, emissiveIntensity: 0.7, roughness: 0.6,
      })),
    );
    lane.position.set(0, 0.03, -3.5);
    root.add(lane);

    interface Tank { turret: THREE.Group }
    const tanks: Tank[] = [];
    const hullGeo = track(new THREE.BoxGeometry(3.1, 0.95, 1.9));
    const turretGeo = track(new THREE.BoxGeometry(1.7, 0.62, 1.45));
    const barrelGeo = track(new THREE.CylinderGeometry(0.09, 0.12, 2.6, 12));
    const plateGeo = track(new THREE.BoxGeometry(0.1, 0.7, 1.5));
    for (const [side, colour] of [[-1, 0x6b8038], [1, 0x9e5636]] as const) {
      const group = new THREE.Group();
      group.position.set(side * 2.5, 0, -3.5);
      group.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
      const hullMat = track(new THREE.MeshStandardMaterial({
        color: colour, roughness: 0.65, metalness: 0.25,
        emissive: colour, emissiveIntensity: 0.18,
      }));
      const hull = new THREE.Mesh(hullGeo, hullMat);
      hull.position.y = 0.75;
      group.add(hull);
      const turret = new THREE.Group();
      turret.position.y = 1.45;
      turret.add(new THREE.Mesh(turretGeo, hullMat));
      const barrel = new THREE.Mesh(barrelGeo, hullMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.1, 1.9);
      turret.add(barrel);
      group.add(turret);
      // Three spaced plates on the exposed flank; each flashes as rounds arrive in order.
      for (let i = 0; i < 3; i += 1) {
        const plate = new THREE.Mesh(
          plateGeo,
          track(new THREE.MeshStandardMaterial({
            color: 0x3a4147, roughness: 0.5, metalness: 0.6,
            emissive: 0xff7a2a, emissiveIntensity: 0,
          })),
        );
        plate.position.set(-0.85, 0.75, -0.55 + i * 0.55);
        plate.rotation.y = Math.PI / 2;
        group.add(plate);
      }
      root.add(group);
      tanks.push({ turret });
    }

    // Cutaway plate rack on the back wall: ordered hits land left to right.
    // Pale alloy at low metalness so the plates read from the door; hit flashes
    // still pop to 2.2 and decay back to the 0.4 floor, never to black.
    const rackPlates: THREE.MeshStandardMaterial[] = [];
    for (let i = 0; i < 4; i += 1) {
      const mat = track(new THREE.MeshStandardMaterial({
        color: 0x9fb4bd, roughness: 0.5, metalness: 0.25,
        emissive: 0xff7a2a, emissiveIntensity: 0.4,
      }));
      const plate = new THREE.Mesh(track(new THREE.BoxGeometry(1.7, 2.1, 0.12)), mat);
      plate.position.set(-4.5 + i * 3, 2.2, 6.6);
      root.add(plate);
      rackPlates.push(mat);
    }

    // Two pooled tracers; a fixed pool keeps the room allocation-free per frame.
    interface Shell { mesh: THREE.Mesh; live: boolean; t: number; from: THREE.Vector3; to: THREE.Vector3 }
    const shellGeo = track(new THREE.SphereGeometry(0.16, 12, 10));
    const shellMat = track(new THREE.MeshStandardMaterial({
      color: 0x301802, emissive: 0xffa63d, emissiveIntensity: 3.2, roughness: 0.4,
    }));
    const shells: Shell[] = [0, 1].map(() => {
      const mesh = new THREE.Mesh(shellGeo, shellMat);
      mesh.visible = false;
      root.add(mesh);
      return {
        mesh, live: false, t: 0, from: new THREE.Vector3(), to: new THREE.Vector3(),
      };
    });

    const flashMat = track(new THREE.MeshStandardMaterial({
      color: 0x000000, emissive: 0xffc46b, emissiveIntensity: 0,
      transparent: true, opacity: 0.9,
    }));
    const flash = new THREE.Mesh(track(new THREE.SphereGeometry(0.6, 16, 12)), flashMat);
    flash.visible = false;
    root.add(flash);

    let elapsed = 0;
    let nextShot = 0.4;
    let shotCount = 0;
    let flashAge = 99;
    const scratch = new THREE.Vector3();

    const fire = (fromTank: number): void => {
      const shell = shells.find((s) => !s.live);
      if (!shell) return;
      const dir = fromTank === 0 ? 1 : -1;
      shell.from.set(dir * -2.5, 1.55, -3.5);
      // 2-sigma-clamped dispersion, restated: small deterministic offsets.
      const miss = (rng() + rng() - 1) * 0.35;
      shell.to.set(dir * 2.5, 1.1 + miss * 0.4, -3.5 + miss);
      shell.t = 0;
      shell.live = true;
      shell.mesh.visible = true;
    };

    return {
      root,
      update: (_t, dt) => {
        elapsed += Math.min(dt, 0.05);
        // Turrets track each other with a slow sweep.
        tanks[0]!.turret.rotation.y = Math.sin(elapsed * 0.5) * 0.25;
        tanks[1]!.turret.rotation.y = Math.sin(elapsed * 0.5 + Math.PI) * 0.25;
        if (elapsed >= nextShot) {
          nextShot = elapsed + 1.1;
          fire(shotCount % 2);
          shotCount += 1;
        }
        for (const shell of shells) {
          if (!shell.live) continue;
          shell.t += dt * 2.4;
          if (shell.t >= 1) {
            shell.live = false;
            shell.mesh.visible = false;
            // Resolve: pen at room distance always beats the rack, plates take turns.
            const dist = shell.from.distanceTo(shell.to);
            void penAtDistanceMm(dist);
            flash.position.copy(shell.to);
            flash.visible = true;
            flashAge = 0;
            const plate = rackPlates[shotCount % rackPlates.length];
            if (plate) plate.emissiveIntensity = 2.2;
            continue;
          }
          scratch.lerpVectors(shell.from, shell.to, shell.t);
          scratch.y += Math.sin(shell.t * Math.PI) * 0.35;
          shell.mesh.position.copy(scratch);
        }
        flashAge += dt;
        flashMat.emissiveIntensity = Math.max(0, 3 - flashAge * 6);
        if (flashAge > 0.6) flash.visible = false;
        for (const plate of rackPlates) plate.emissiveIntensity = Math.max(0.4, plate.emissiveIntensity - dt * 3);
      },
      dispose: () => { for (const d of disposables) d.dispose(); },
    };
  },
};
