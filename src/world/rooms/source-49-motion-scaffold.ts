/**
 * Source 49 — MotionBricks scaffold: critically-damped placement, rolling context.
 *
 * Restages the group-c constraint demo at room scale. The planner scaffold is
 * kept: target pose constraints placed by a critically-damped spring
 * (zeta = 1, fastest approach without overshoot) versus a naive per-frame
 * snap, with the last four produced frames retained as the rolling context
 * the next window would plan from. Two 2.8 m schematic hinge chains stand just
 * inside the door; their tip trails draw the placement difference as paths.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';

interface SpringState { value: number; velocity: number }

const JOINTS = 5;
const TARGETS = [-0.55, 0.5, -0.3, 0.62, 0.0];
const TRAIL_MAX = 150;
const LINK = 0.56;

export const room: RoomDefinition = {
  sourceId: 49,
  skill: 'game-animation-asset-pipeline',
  title: 'Motion planner scaffold, no network',
  summary: 'Two hinge chains chase the same targets; the snapped one corners, the spring-placed one glides, and both trails prove it.',
  kind: 'webgpu',
  limitation:
    'NO MOTION IS GENERATED: the network is native C++ with browser inference deferred upstream and its weights absent. Five schematic hinges, not the G1 skeleton; no retarget attempted.',
  create: (ctx: RoomContext): RoomInstance => {
    const { THREE } = ctx;
    const root = new THREE.Group();
    const disposables: { dispose(): void }[] = [];
    const track = <T extends { dispose(): void }>(v: T): T => (disposables.push(v), v);

    // Shared measurement stage both chains stand on, just inside the door.
    const stage = new THREE.Mesh(
      track(new THREE.CylinderGeometry(5.4, 5.4, 0.18, 40)),
      track(new THREE.MeshStandardMaterial({
        color: 0x4a5a64, roughness: 0.9, emissive: 0x4a5a64, emissiveIntensity: 0.25,
      })),
    );
    stage.position.set(0, 0.09, -1.2);
    root.add(stage);

    const linkGeo = track(new THREE.BoxGeometry(0.36, LINK, 0.36));
    linkGeo.translate(0, LINK / 2, 0);
    const beadGeo = track(new THREE.SphereGeometry(0.24, 14, 10));

    interface Chain { base: THREE.Group; pivots: THREE.Group[] }
    const buildChain = (ox: number, colour: number): Chain => {
      const base = new THREE.Group();
      base.position.set(ox, 0.18, -1.2);
      const light = new THREE.Color(colour).offsetHSL(0, 0.02, 0.14);
      const dark = new THREE.Color(colour).offsetHSL(0, 0.02, -0.1);
      const mats = [
        track(new THREE.MeshStandardMaterial({
          color: light, roughness: 0.55, emissive: light, emissiveIntensity: 0.25,
        })),
        track(new THREE.MeshStandardMaterial({
          color: dark, roughness: 0.65, emissive: dark, emissiveIntensity: 0.25,
        })),
      ];
      const beadMat = track(new THREE.MeshStandardMaterial({
        color: colour, roughness: 0.45, emissive: colour, emissiveIntensity: 0.35,
      }));
      let parent: THREE.Object3D = base;
      const pivots: THREE.Group[] = [];
      for (let i = 0; i < JOINTS; i += 1) {
        const pivot = new THREE.Group();
        pivot.position.y = i === 0 ? 0.2 : LINK;
        pivot.add(new THREE.Mesh(beadGeo, beadMat));
        pivot.add(new THREE.Mesh(linkGeo, mats[i % 2]!));
        parent.add(pivot);
        parent = pivot;
        pivots.push(pivot);
      }
      root.add(base);
      return { base, pivots };
    };

    const before = buildChain(-2.9, 0xa8766a);
    const after = buildChain(2.9, 0x6fb894);

    interface Trail { history: Float32Array; attr: THREE.BufferAttribute; geometry: THREE.BufferGeometry; count: number }
    const makeTrail = (colour: number): Trail => {
      const geometry = track(new THREE.BufferGeometry());
      const attr = new THREE.BufferAttribute(new Float32Array(TRAIL_MAX * 3), 3);
      geometry.setAttribute('position', attr);
      geometry.setDrawRange(0, 0);
      const line = new THREE.Line(
        geometry,
        track(new THREE.LineBasicMaterial({ color: colour, toneMapped: false })),
      );
      line.frustumCulled = false;
      root.add(line);
      return { history: new Float32Array(TRAIL_MAX * 3), attr, geometry, count: 0 };
    };
    const beforeTrail = makeTrail(0xd86450);
    const afterTrail = makeTrail(0x59d68c);
    const scratch = new THREE.Vector3();

    const pushTrail = (trail: Trail, tip: THREE.Object3D): void => {
      tip.getWorldPosition(scratch);
      root.worldToLocal(scratch);
      if (trail.count === TRAIL_MAX) {
        trail.history.copyWithin(0, 3);
        trail.count = TRAIL_MAX - 1;
      }
      trail.history[trail.count * 3] = scratch.x;
      trail.history[trail.count * 3 + 1] = scratch.y;
      trail.history[trail.count * 3 + 2] = scratch.z;
      trail.count += 1;
      (trail.attr.array as Float32Array).set(trail.history.subarray(0, trail.count * 3));
      trail.attr.needsUpdate = true;
      trail.geometry.setDrawRange(0, trail.count);
    };

    const snapState: number[] = new Array(JOINTS).fill(0);
    const springState: SpringState[] = Array.from({ length: JOINTS }, () => ({ value: 0, velocity: 0 }));
    let elapsed = 0;

    return {
      root,
      update: (_t, dt) => {
        const step = Math.min(dt, 0.05);
        elapsed += step;
        const phase = Math.floor(elapsed / 1.6) % 2 === 0 ? 1 : -1;
        for (let j = 0; j < JOINTS; j += 1) {
          const target = TARGETS[j]! * phase;
          snapState[j]! += (target - snapState[j]!) * Math.min(1, step * 14);
          // Critically-damped spring: zeta = 1 via half-life parameterisation.
          const state = springState[j]!;
          const omega = (2 * Math.LN2) / 0.22;
          const accel = -omega * omega * (state.value - target) - 2 * omega * state.velocity;
          state.velocity += accel * step;
          state.value += state.velocity * step;
        }
        before.pivots.forEach((pivot, j) => { pivot.rotation.z = snapState[j]!; });
        after.pivots.forEach((pivot, j) => { pivot.rotation.z = springState[j]!.value; });
        root.updateMatrixWorld(true);
        const beforeTip = before.pivots[JOINTS - 1];
        const afterTip = after.pivots[JOINTS - 1];
        if (beforeTip && afterTip) {
          pushTrail(beforeTrail, beforeTip);
          pushTrail(afterTrail, afterTip);
        }
      },
      dispose: () => { for (const d of disposables) d.dispose(); },
    };
  },
};
