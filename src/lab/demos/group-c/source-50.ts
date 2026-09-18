/**
 * Source 50 — fable51-worlds: whole-world QA that is MECHANICAL rather than
 * visual — the passability sweep.
 *
 * Licence read as a file at the pin: PhiloLabs/fable51-worlds @
 * 1dcc255adc5600cfec8a7e3e38c896074668dd1e, LICENSE, MIT, "Copyright (c) 2026
 * PhiloLabs". The register's decision is INGEST THE QA HARNESS PATTERN ONLY —
 * no code reuse, no vendoring, no port — because the repository is WebGL /
 * three 0.180 with no TSL and no WebGPU, so nothing in it drops into our
 * renderer. This lane keeps to that: the sweep below is written here.
 *
 * The method: a world with twelve thousand colliders cannot be audited by
 * walking it, but it can be audited by asking every metre of every street
 * whether it is open. Step the corridor centreline at a fixed interval, sweep
 * the full paved width at each station, and ask whether a disc of the player's
 * radius can pass. Collapse runs of blocked stations, and EXIT NON-ZERO when
 * anything is blocked — a gate that reports and passes is not a gate.
 *
 * The runnable artifact is `scripts/technique-lab/group-c/passability-sweep.mjs`,
 * which imports the same `sweepCorridor` used here, so the exhibit and the gate
 * cannot drift apart. BEFORE is the corridor with an obstruction left in it and
 * its blocked stations marked red; AFTER is the cleared corridor, all stations
 * green. The draw-calls-before-milliseconds ordering rule is carried in the
 * counters: geometry counts are reported, wall-clock is not, deliberately.
 */

import {
  CLEARED_OBSTACLES,
  DEFECTIVE_OBSTACLES,
  PLAYER_RADIUS,
  STATION_SPACING,
  sweepCorridor,
  type SweepResult,
  type Obstacle,
} from './passability';
import {
  beforeAfterPanels,
  countDraws,
  disposeTree,
  type Demo,
  type DemoContext,
} from './shared';

export {
  CLEARED_OBSTACLES,
  DEFECTIVE_OBSTACLES,
  PLAYER_RADIUS,
  STATION_SPACING,
  sweepCorridor,
} from './passability';
export type { Obstacle, Station, SweepResult } from './passability';

const LENGTH = 6.2;
const WIDTH = 2.2;

export function createDemo(context: DemoContext): Demo {
  const { THREE } = context;
  const root = new THREE.Group();
  root.name = 'source-50-mechanical-passability-sweep';
  const { before, after } = beforeAfterPanels(THREE, 3.0);

  const defective = sweepCorridor(LENGTH, WIDTH, DEFECTIVE_OBSTACLES);
  const cleared = sweepCorridor(LENGTH, WIDTH, CLEARED_OBSTACLES);

  // One floor per panel: the sweep's answer is washed into its vertex colours,
  // and the two panels disagree, so the geometry cannot be shared.
  const floorMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96 });
  const obstacleGeometry = new THREE.CylinderGeometry(1, 1, 0.75, 14);
  const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0x6b5f4e, roughness: 0.88 });
  const stationGeometry = new THREE.CircleGeometry(PLAYER_RADIUS, 16);
  stationGeometry.rotateX(-Math.PI / 2);
  const curbGeometry = new THREE.BoxGeometry(0.1, 0.14, LENGTH);
  const curbMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4e52, roughness: 0.9 });

  function build(
    group: import('three').Group,
    obstacles: readonly Obstacle[],
    result: SweepResult,
  ): void {
    const floorGeometry = new THREE.PlaneGeometry(WIDTH, LENGTH, 1, 24);
    floorGeometry.rotateX(-Math.PI / 2);
    const floorPositions = floorGeometry.getAttribute('position');
    const wash = new Float32Array(floorPositions.count * 3);
    const baseWash = new THREE.Color(0x3a3d40);
    const passWash = new THREE.Color(0x2f8f5b);
    const blockWash = new THREE.Color(0xc0392b);
    const mixed = new THREE.Color();
    for (let v = 0; v < floorPositions.count; v += 1) {
      const vz = floorPositions.getZ(v);
      let nearestPassable = true;
      let nearestDist = Number.POSITIVE_INFINITY;
      for (const station of result.stations) {
        const d = Math.abs(station.z - vz);
        if (d < nearestDist) {
          nearestDist = d;
          nearestPassable = station.passable;
        }
      }
      mixed.copy(baseWash).lerp(nearestPassable ? passWash : blockWash, 0.38);
      wash[v * 3] = mixed.r;
      wash[v * 3 + 1] = mixed.g;
      wash[v * 3 + 2] = mixed.b;
    }
    floorGeometry.setAttribute('color', new THREE.BufferAttribute(wash, 3));
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.name = 'floor-answer-wash';
    group.add(floor);
    for (const side of [-1, 1]) {
      const curb = new THREE.Mesh(curbGeometry, curbMaterial);
      curb.position.set(side * (WIDTH / 2 + 0.05), 0.07, 0);
      curb.name = 'edging';
      group.add(curb);
    }
    for (const obstacle of obstacles) {
      const mesh = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
      mesh.scale.set(obstacle.radius, 1, obstacle.radius);
      mesh.position.set(obstacle.x, 0.375, obstacle.z);
      mesh.name = 'collider';
      group.add(mesh);
    }
    // One disc per station, at the player's own radius, coloured by the answer.
    const passableMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0x2f8f5b,
      emissiveIntensity: 0.9,
      roughness: 0.7,
    });
    const blockedMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0xc0392b,
      emissiveIntensity: 1.2,
      roughness: 0.7,
    });
    for (const station of result.stations) {
      const disc = new THREE.Mesh(
        stationGeometry,
        station.passable ? passableMaterial : blockedMaterial,
      );
      disc.position.set(0, 0.02, station.z);
      disc.name = station.passable ? 'station-passable' : 'station-blocked';
      group.add(disc);
    }
  }

  build(before, DEFECTIVE_OBSTACLES, defective);
  build(after, CLEARED_OBSTACLES, cleared);
  root.add(before, after);
  const draws = countDraws(root);

  return {
    root,
    dispose: () => disposeTree(root),
    metadata: {
      sourceId: 50,
      title: 'Mechanical passability sweep: every 1.5 m, can a 0.34 m disc pass?',
      method:
        'The corridor centreline is stepped every 1.5 m; each station samples the full paved '
        + 'width, finds the widest continuous gap, and passes only if a disc of the player radius '
        + 'fits. Runs of blocked stations are collapsed into regions, and the companion script '
        + 'exits non-zero when any station is blocked. Counts are reported before timings, '
        + 'deliberately, because headless wall-clock on a shared machine drifts run to run. The '
        + 'floor carries the same verdict as a wash, so the sweep reads at a glance.',
      adaptation: 'adapted',
      sources: [
        'https://github.com/PhiloLabs/fable51-worlds',
        'https://raw.githubusercontent.com/PhiloLabs/fable51-worlds/1dcc255adc5600cfec8a7e3e38c896074668dd1e/kyoto-higashiyama/tools/passability.mjs',
      ],
      limitation:
        'Written from the described method; no code is ported from the MIT source, whose harness '
        + 'is WebGL/three 0.180 and drives a real page under Playwright. THIS SWEEP DOES NOT DRIVE '
        + 'A BROWSER: it runs against an analytic obstacle list, not against the built world\'s '
        + 'actual colliders, so it is the gate\'s shape and not yet the gate. The second probe the '
        + 'register pairs with it (a traversal walkthrough that distinguishes world defects from '
        + 'naive steering) is absent, as are the perf harness\'s real draw-call/triangle readings '
        + 'and the HMR-survival retry. No cel/ink art direction is adopted — the register places '
        + 'that against the owner\'s direction.',
      localLights: [],
      counters: {
        stationSpacingCm: STATION_SPACING * 100,
        playerRadiusCm: PLAYER_RADIUS * 100,
        stations: defective.stations.length,
        blockedBefore: defective.blocked,
        blockedAfter: cleared.blocked,
        blockedRunsBefore: defective.blockedRuns.length,
        meshes: draws.meshes,
        triangles: draws.triangles,
      },
    },
  };
}

export default createDemo;
