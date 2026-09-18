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
// Staging depth: the far half of this slot is shell wall, so the stage,
// chains, rings and cursor all live door-side of it.
const SZ = -2.2;

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
        color: 0x4a5a64, roughness: 0.9, emissive: 0x4a5a64, emissiveIntensity: 0.45,
      })),
    );
    stage.position.set(0, 0.09, SZ);
    root.add(stage);
    // Range rings on the measurement stage: staging only, they give the flat
    // disc the edge detail a doorway read needs.
    const ringGeo = track(new THREE.RingGeometry(0.97, 1.0, 64));
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = track(new THREE.MeshBasicMaterial({ color: 0x9fd8cb, transparent: true, opacity: 0.5, toneMapped: false }));
    for (const radius of [1.8, 3.2, 4.6]) {
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.scale.setScalar(radius);
      ring.position.set(0, 0.19, SZ);
      root.add(ring);
    }
    // Rolling-window cursor: the window the next plan step would take. It laps
    // the stage continuously so the room never reads as a still.
    const cursor = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.16, 14, 10)),
      track(new THREE.MeshBasicMaterial({ color: 0xffc46b, toneMapped: false })),
    );
    root.add(cursor);

    const linkGeo = track(new THREE.BoxGeometry(0.44, LINK, 0.44));
    linkGeo.translate(0, LINK / 2, 0);
    // Joint beads oversized for doorway legibility: spheres carry the lit
    // relief this room scores on, so they are drawn larger than scale.
    const beadGeo = track(new THREE.SphereGeometry(0.36, 14, 10));

    interface Chain { base: THREE.Group; pivots: THREE.Group[] }
    const buildChain = (ox: number, colour: number): Chain => {
      const base = new THREE.Group();
      base.position.set(ox, 0.18, SZ);
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
    // Label banners flanking the stage: from the doorway nothing says which
    // chain is which, and the trails are 1 px lines at 7 m. The banners carry
    // the snap-vs-spring read as colour fields at the frame edges.
    const bannerGeo = track(new THREE.PlaneGeometry(2.0, 3.4));
    for (const [bx, colour] of [[-4.6, 0xd86450], [4.6, 0x59d68c]] as const) {
      const banner = new THREE.Mesh(
        bannerGeo,
        track(new THREE.MeshBasicMaterial({ color: colour, toneMapped: false, side: THREE.DoubleSide })),
      );
      banner.position.set(bx, 2.0, SZ);
      root.add(banner);
    }

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
        // Staging pace: the target side flips every 1.1 s so a doorway capture
        // always straddles a replan. Spring, targets and trails untouched.
        const phase = Math.floor(elapsed / 1.1) % 2 === 0 ? 1 : -1;
        cursor.position.set(Math.cos(elapsed * 0.5) * 4.6, 0.5, -1.2 + Math.sin(elapsed * 0.5) * 4.6);
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
