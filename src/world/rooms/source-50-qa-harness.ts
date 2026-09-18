import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';

/**
 * Source 50 — fable51-worlds' mechanical passability sweep. Re-staged from
 * `src/lab/demos/group-c/source-50.ts` and its `passability.ts`: the same
 * `sweepCorridor` (centreline stepped every 1.5 m, widest continuous gap per
 * station, pass iff a 0.34 m disc fits, blocked runs collapsed). What changed
 * is address: the demo's 6.2 m floors become two walk-around corridors, 9 m
 * long and 3.4 m wide, with one player-radius disc per station so the verdict
 * reads from the doorway as a run of green versus a run with red in it.
 *
 * BEFORE (left): the corridor with the crate-pair defect left in — two
 * stations blocked. AFTER (right): the cleared corridor, all stations green.
 * A travelling sweep bar shows the audit walking the corridor.
 */

type Obstacle = { x: number; z: number; radius: number };
type Station = { z: number; clearance: number; passable: boolean };

const PLAYER_RADIUS = 0.34;
const STATION_SPACING = 1.5;
const LENGTH = 9;
const WIDTH = 3.4;

// The defect: a crate pair that together leaves no 0.68 m gap anywhere.
const DEFECTIVE_OBSTACLES: readonly Obstacle[] = [
  { x: -0.6, z: -2.4, radius: 0.63 },
  { x: -0.93, z: 2.1, radius: 1.08 },
  { x: 1.08, z: 2.1, radius: 0.99 },
];
const CLEARED_OBSTACLES: readonly Obstacle[] = [
  { x: -0.6, z: -2.4, radius: 0.63 },
  { x: -1.23, z: 2.1, radius: 0.75 },
];

function sweepCorridor(length: number, width: number, obstacles: readonly Obstacle[]): Station[] {
  const stations: Station[] = [];
  const samples = 41;
  for (let z = -length / 2; z <= length / 2 + 1e-6; z += STATION_SPACING) {
    let best = 0;
    let run = 0;
    for (let sample = 0; sample < samples; sample += 1) {
      const x = -width / 2 + (width * sample) / (samples - 1);
      const blocked = obstacles.some(
        (obstacle) => Math.hypot(x - obstacle.x, z - obstacle.z) < obstacle.radius,
      );
      run = blocked ? 0 : run + 1;
      best = Math.max(best, run);
    }
    const clearance = (best / samples) * width;
    stations.push({ z, clearance, passable: clearance >= PLAYER_RADIUS * 2 });
  }
  return stations;
}

export const room: RoomDefinition = {
  sourceId: 50,
  skill: 'realtime-browser-qa',
  title: 'Mechanical passability sweep',
  summary:
    'A corridor audited every 1.5 m: a station passes only if a player-radius disc fits, with blocked runs collapsed and a non-zero exit.',
  kind: 'webgpu',
  limitation:
    'The sweep runs against an analytic obstacle list, not the built world’s real colliders or a browser — it is the gate’s shape and not yet the gate. Counts are reported before timings deliberately.',
  create(ctx: RoomContext): RoomInstance {
    const T = ctx.THREE;
    const root = new T.Group();
    root.name = 'source-50-room';
    const disposables: Array<{ dispose(): void }> = [];
    const track = <D extends { dispose(): void }>(d: D): D => {
      disposables.push(d);
      return d;
    };

    const corridorX = 3.1;
    const corridorZ = 0.8;

    const curbGeo = track(new T.BoxGeometry(0.14, 0.2, LENGTH));
    const curbMat = track(new T.MeshStandardMaterial({ color: 0x4a4e52, roughness: 0.9 }));
    const obstacleGeo = track(new T.CylinderGeometry(1, 1, 1.1, 14));
    const obstacleMat = track(new T.MeshStandardMaterial({ color: 0x6b5f4e, roughness: 0.88 }));
    const discGeo = track(new T.CircleGeometry(PLAYER_RADIUS, 16));
    discGeo.rotateX(-Math.PI / 2);
    const passMat = track(
      new T.MeshStandardMaterial({ color: 0x000000, emissive: 0x2f8f5b, emissiveIntensity: 0.9, roughness: 0.7 }),
    );
    const blockMat = track(
      new T.MeshStandardMaterial({ color: 0x000000, emissive: 0xc0392b, emissiveIntensity: 1.2, roughness: 0.7 }),
    );
    const sweepGeo = track(new T.BoxGeometry(WIDTH, 0.06, 0.18));
    const sweepMat = track(
      new T.MeshStandardMaterial({ color: 0x000000, emissive: 0xe0c15a, emissiveIntensity: 1.4, roughness: 0.6 }),
    );
    const sweeps: InstanceType<typeof T.Mesh>[] = [];

    function build(
      centreX: number,
      obstacles: readonly Obstacle[],
      stations: Station[],
      padColour: number,
    ): void {
      // Floor carries the same verdict as a wash, so the sweep reads at a glance.
      const floorGeo = track(new T.PlaneGeometry(WIDTH, LENGTH, 1, 24));
      floorGeo.rotateX(-Math.PI / 2);
      const positions = floorGeo.getAttribute('position');
      const wash = new Float32Array(positions.count * 3);
      const base = new T.Color(padColour);
      const pass = new T.Color(0x2f8f5b);
      const block = new T.Color(0xc0392b);
      const mixed = new T.Color();
      for (let v = 0; v < positions.count; v += 1) {
        const vz = positions.getZ(v) + corridorZ;
        let nearest = true;
        let nearestDist = Number.POSITIVE_INFINITY;
        for (const station of stations) {
          const d = Math.abs(station.z + corridorZ - vz);
          if (d < nearestDist) {
            nearestDist = d;
            nearest = station.passable;
          }
        }
        mixed.copy(base).lerp(nearest ? pass : block, 0.38);
        wash[v * 3] = mixed.r;
        wash[v * 3 + 1] = mixed.g;
        wash[v * 3 + 2] = mixed.b;
      }
      floorGeo.setAttribute('color', new T.BufferAttribute(wash, 3));
      const floor = new T.Mesh(
        floorGeo,
        track(new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.96 })),
      );
      floor.position.set(centreX, 0.01, corridorZ);
      root.add(floor);

      for (const side of [-1, 1]) {
        const curb = new T.Mesh(curbGeo, curbMat);
        curb.position.set(centreX + side * (WIDTH / 2 + 0.07), 0.1, corridorZ);
        root.add(curb);
      }
      for (const obstacle of obstacles) {
        const mesh = new T.Mesh(obstacleGeo, obstacleMat);
        mesh.scale.set(obstacle.radius, 1, obstacle.radius);
        mesh.position.set(centreX + obstacle.x, 0.55, corridorZ + obstacle.z);
        root.add(mesh);
      }
      // One disc per station at the player's own radius, coloured by the answer.
      for (const station of stations) {
        const disc = new T.Mesh(discGeo, station.passable ? passMat : blockMat);
        disc.position.set(centreX, 0.03, corridorZ + station.z);
        root.add(disc);
      }
      const sweep = new T.Mesh(sweepGeo, sweepMat);
      sweep.position.set(centreX, 0.06, corridorZ - LENGTH / 2);
      root.add(sweep);
      sweeps.push(sweep);
    }

    build(-corridorX, DEFECTIVE_OBSTACLES, sweepCorridor(LENGTH, WIDTH, DEFECTIVE_OBSTACLES), 0x3a3d40);
    build(corridorX, CLEARED_OBSTACLES, sweepCorridor(LENGTH, WIDTH, CLEARED_OBSTACLES), 0x3a3d40);

    let elapsed = 0;
    return {
      root,
      update: (_t: number, dt: number) => {
        // The audit walking the corridor, both halves together.
        elapsed = (elapsed + dt) % 6;
        const z = corridorZ - LENGTH / 2 + (elapsed / 6) * LENGTH;
        for (const sweep of sweeps) sweep.position.z = z;
      },
      dispose: () => {
        for (const d of disposables) d.dispose();
        root.clear();
      },
    };
  },
};
