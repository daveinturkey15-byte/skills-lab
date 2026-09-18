/**
 * Source 49 — MotionBricks: critically-damped constraint placement and the
 * rolling motion context. THE NEURAL PLANNER IS NOT RUN.
 *
 * Read the limitation before the title is believed. motion-bricks.cpp is a
 * C++23/GGML native library with no WebAssembly target — `docs/IMPLEMENTATION.md`
 * lists "WebAssembly inference in the browser" under "Explicitly deferred", and
 * a stated deferral is stronger than an inferred absence. Its released model
 * supports only the 34-joint Unitree G1 robot skeleton, and its 183M parameters
 * (~0.73 GB of GGUF) are not present on this machine. It is an OFFLINE clip
 * bakery; `THREE.AnimationMixer` plus our own blend graph stays the runtime.
 * Licence: port Apache-2.0, weights NVIDIA Open Model License (revocable).
 *
 * So this exhibit does NOT generate motion and must never be read as doing so.
 * What it demonstrates is the planner's SCAFFOLD, which is ordinary published
 * control and is the part that would still be ours if the network were bolted
 * in tomorrow:
 *   - target pose constraints are PLACED by a critically-damped spring
 *     (zeta = 1: fastest approach with no overshoot), not snapped or lerped;
 *   - the last N frames of ACTUAL motion are the context for what comes next,
 *     and the produced frames become the next context — a rolling window.
 *
 * BEFORE is the same targets applied by a naive linear snap: it arrives, but it
 * arrives with a corner on it. AFTER is the spring. The difference is visible
 * in the traced path and is assertable as an overshoot number.
 */

import {
  beforeAfterPanels,
  countDraws,
  disposeTree,
  type Demo,
  type DemoContext,
} from './shared';

export type SpringState = { value: number; velocity: number };

/**
 * Critically damped spring step. Exported so a CPU check can assert that it
 * converges and never overshoots, which is the property the technique needs.
 */
export function stepCriticallyDamped(
  state: SpringState,
  target: number,
  halfLife: number,
  dt: number,
): SpringState {
  const omega = 2 * Math.LN2 / Math.max(1e-4, halfLife);
  const displacement = state.value - target;
  const acceleration = -omega * omega * displacement - 2 * omega * state.velocity;
  const velocity = state.velocity + acceleration * dt;
  return { value: state.value + velocity * dt, velocity };
}

/** The rolling context: the newest frames push the oldest out. */
export class MotionContext {
  private readonly frames: number[][] = [];

  constructor(private readonly capacity: number) {}

  push(frame: number[]): void {
    this.frames.push(frame);
    while (this.frames.length > this.capacity) this.frames.shift();
  }

  get length(): number {
    return this.frames.length;
  }

  /** The context the planner would be handed: the last `capacity` frames. */
  snapshot(): number[][] {
    return this.frames.map((frame) => [...frame]);
  }
}

const CONTEXT_FRAMES = 4;
const JOINTS = 5;
const TARGETS = [-0.55, 0.5, -0.3, 0.62, 0.0];
/** Tip-trail window in frames (~2.5 s at 60 Hz: a full target phase and more). */
const TRAIL_MAX = 150;

export function createDemo(context: DemoContext): Demo {
  const { THREE } = context;
  const root = new THREE.Group();
  root.name = 'source-49-constraint-placement-scaffold';
  const { before, after } = beforeAfterPanels(THREE, 2.4);

  // A deliberately schematic articulated chain. It is NOT the G1 skeleton and
  // NOT our 62-joint operator rig; it is five hinges so the placement is legible.
  // Links are chunky and the stage is light grey so the pair reads at the
  // host's fit distance; neither is a scale claim about any robot.
  function buildChain(group: import('three').Group, colour: number) {
    const segments: import('three').Mesh[] = [];
    const geometry = new THREE.BoxGeometry(0.17, 0.5, 0.17);
    geometry.translate(0, 0.25, 0);
    const beadGeometry = new THREE.SphereGeometry(0.115, 12, 8);
    const base = new THREE.Color(colour);
    const light = base.clone().offsetHSL(0, 0.02, 0.14);
    const dark = base.clone().offsetHSL(0, 0.02, -0.1);
    const materials = [
      new THREE.MeshStandardMaterial({ color: light, roughness: 0.55 }),
      new THREE.MeshStandardMaterial({ color: dark, roughness: 0.65 }),
    ];
    const beadMaterial = new THREE.MeshStandardMaterial({ color: base, roughness: 0.45 });
    let parent: import('three').Object3D = group;
    for (let i = 0; i < JOINTS; i += 1) {
      const pivot = new THREE.Group();
      pivot.name = `joint-${i}`;
      pivot.position.y = i === 0 ? 0 : 0.5;
      // Bead marks the joint itself: the constraint placement this exhibit is
      // about happens here, so the joint reads even where links align.
      const bead = new THREE.Mesh(beadGeometry, beadMaterial);
      bead.name = `bead-${i}`;
      pivot.add(bead);
      // Alternate link shades so each hinge boundary carries a visible edge.
      const segment = new THREE.Mesh(geometry, materials[i % 2]);
      segment.name = `segment-${i}`;
      pivot.add(segment);
      parent.add(pivot);
      parent = pivot;
      segments.push(segment);
    }
    return segments;
  }

  buildChain(before, 0xa8766a);
  buildChain(after, 0x6fb894);

  // Shared stage both chains stand on: identical staging for both halves, so
  // only the placement differs. It carries a measurement grid (below) that the
  // tip trails read against. Gives the pair area and a contact read.
  // Motion-measurement grid baked as bytes (no external assets): pale lines
  // over slate. Instrumentation finish only — never planner output.
  const gridBytes = new Uint8Array(64 * 64 * 4);
  for (let gy = 0; gy < 64; gy += 1) {
    for (let gx = 0; gx < 64; gx += 1) {
      const gridLine = gx % 8 === 0 || gy % 8 === 0;
      const gv = gridLine ? 168 : 74;
      const go = (gy * 64 + gx) * 4;
      gridBytes[go] = gv;
      gridBytes[go + 1] = gv + (gridLine ? 6 : 4);
      gridBytes[go + 2] = gv + (gridLine ? 10 : 8);
      gridBytes[go + 3] = 255;
    }
  }
  const gridTexture = new THREE.DataTexture(gridBytes, 64, 64);
  gridTexture.colorSpace = THREE.SRGBColorSpace;
  gridTexture.magFilter = THREE.NearestFilter;
  gridTexture.minFilter = THREE.NearestFilter;
  gridTexture.needsUpdate = true;
  const stageDisc = new THREE.Mesh(
    new THREE.CircleGeometry(2.05, 48),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, map: gridTexture }),
  );
  stageDisc.rotation.x = -Math.PI / 2;
  stageDisc.position.y = 0.002;
  stageDisc.name = 'stage-disc';
  root.add(stageDisc);

  const snapState: number[] = new Array(JOINTS).fill(0);
  const springState: SpringState[] = Array.from({ length: JOINTS }, () => ({
    value: 0,
    velocity: 0,
  }));

  const motionContext = new MotionContext(CONTEXT_FRAMES);
  motionContext.push(new Array(JOINTS).fill(0));

  // Tip trails: the technique's visible record. BEFORE snaps with a corner,
  // AFTER rides the spring; the paths diverge exactly where placement differs.
  // Fixed buffers rewritten in place — no per-frame allocation.
  function makeTrail(group: import('three').Group, colour: number) {
    const history = new Float32Array(TRAIL_MAX * 3);
    const positions = new Float32Array(TRAIL_MAX * 3);
    const attr = new THREE.BufferAttribute(positions, 3);
    const trailGeometry = new THREE.BufferGeometry();
    trailGeometry.setAttribute('position', attr);
    trailGeometry.setDrawRange(0, 0);
    const line = new THREE.Line(
      trailGeometry,
      new THREE.LineBasicMaterial({ color: colour, toneMapped: false }),
    );
    line.name = 'tip-trail';
    line.frustumCulled = false;
    group.add(line);
    return { history, attr, geometry: trailGeometry, count: 0 };
  }
  const beforeTrail = makeTrail(before, 0xd86450);
  const afterTrail = makeTrail(after, 0x59d68c);
  const beforeTip = before.getObjectByName('joint-4');
  const afterTip = after.getObjectByName('joint-4');
  const scratchV = new THREE.Vector3();
  function pushTrail(
    trail: { history: Float32Array; attr: import('three').BufferAttribute; geometry: import('three').BufferGeometry; count: number },
    panel: import('three').Group,
    tip: import('three').Object3D | undefined,
  ) {
    if (!tip) return;
    tip.getWorldPosition(scratchV);
    panel.worldToLocal(scratchV);
    if (trail.count === TRAIL_MAX) {
      trail.history.copyWithin(0, 3);
      trail.count = TRAIL_MAX - 1;
    }
    const to = trail.count * 3;
    trail.history[to] = scratchV.x;
    trail.history[to + 1] = scratchV.y;
    trail.history[to + 2] = scratchV.z;
    trail.count += 1;
    trail.attr.array.set(trail.history.subarray(0, trail.count * 3));
    trail.attr.needsUpdate = true;
    trail.geometry.setDrawRange(0, trail.count);
  }

  let elapsed = 0;
  let peakSnapOvershoot = 0;
  let peakSpringOvershoot = 0;
  let planningWindows = 0;

  return {
    root: (() => {
      root.add(before, after);
      return root;
    })(),
    update: (_time: number, dt: number) => {
      elapsed += dt;
      // A new target constraint every 1.6 s, alternating sign — the "sampled
      // from a short reference style clip" step, stubbed with a fixed table.
      const phase = Math.floor(elapsed / 1.6) % 2 === 0 ? 1 : -1;

      for (let joint = 0; joint < JOINTS; joint += 1) {
        const target = TARGETS[joint] * phase;

        // BEFORE: naive placement. A fixed fraction per frame, which is
        // frame-rate dependent and arrives with a corner.
        const snapped = snapState[joint] + (target - snapState[joint]) * Math.min(1, dt * 14);
        snapState[joint] = snapped;
        peakSnapOvershoot = Math.max(
          peakSnapOvershoot,
          Math.max(0, Math.abs(snapped) - Math.abs(target)),
        );

        // AFTER: critically damped placement.
        springState[joint] = stepCriticallyDamped(springState[joint], target, 0.22, dt);
        peakSpringOvershoot = Math.max(
          peakSpringOvershoot,
          Math.max(0, Math.abs(springState[joint].value) - Math.abs(target)),
        );
      }

      const applyChain = (group: import('three').Group, values: number[]) => {
        let node: import('three').Object3D | undefined = group;
        for (let joint = 0; joint < JOINTS; joint += 1) {
          node = node?.getObjectByName(`joint-${joint}`) ?? undefined;
          if (!node) break;
          node.rotation.z = values[joint];
        }
      };
      applyChain(before, snapState);
      applyChain(after, springState.map((state) => state.value));
      // Trails read world placement, so compose the hierarchy first; the cost
      // is one extra matrix pass over ~30 objects per frame.
      root.updateMatrixWorld(true);
      pushTrail(beforeTrail, before, beforeTip);
      pushTrail(afterTrail, after, afterTip);

      // The rolling context: what was just produced becomes the context for
      // the next window. This is the autoregressive shape of the planner, with
      // the network replaced by the spring.
      motionContext.push(springState.map((state) => state.value));
      planningWindows += 1;
    },
    dispose: () => disposeTree(root, [gridTexture]),
    metadata: {
      sourceId: 49,
      title: 'Critically-damped constraint placement with a rolling motion context',
      method:
        'Target pose constraints are placed by a critically-damped spring (zeta = 1, half-life '
        + 'parameterised) so the chain converges fast without overshoot, while the last four '
        + 'produced frames are retained as the context the next window would be planned from. '
        + 'The before panel applies identical targets with a naive per-frame fraction. The '
        + 'end-joint path of each chain is drawn as a 150-frame tip trail (terracotta = snap '
        + 'with its arrival corner, bright sage = spring) over a baked measurement-grid floor, '
        + 'so the placement difference reads as drawn paths, not prose.',
      adaptation: 'adapted',
      sources: [
        'https://x.com/jichiep/status/2095157236658315288',
        'https://github.com/localai-org/motion-bricks.cpp',
      ],
      limitation:
        'NO MOTION IS GENERATED. The MotionBricks network is not run, not present and cannot run '
        + 'here: it is native C++/GGML with WebAssembly inference EXPLICITLY DEFERRED upstream, '
        + 'its ~0.73 GB of weights are not installed, and it is an offline clip bakery by design. '
        + 'This is the placement-and-context scaffold only, with the network absent — it must '
        + 'never be reported as a measurement of the generator. The chain is five schematic '
        + 'hinges, NOT the 34-joint Unitree G1 skeleton the released model requires and NOT the '
        + 'repository\'s 62-joint operator rig; no retarget is attempted or claimed, and the G1 '
        + 'retarget risk the register records (ankle pitch/roll instead of a toe base, no '
        + 'fingers, 1.32 m stature) is untested. No .mbstyle primitive is present or shipped. Links, beads, trails, grid and stage are presentation scale and finish for stage legibility, not a scale claim about any robot. Trails are drawn from live joint angles each frame (a 150-frame window); the grid is a baked byte texture, not a measurement of anything upstream.',
      localLights: [],
      counters: {
        joints: JOINTS,
        contextFrames: CONTEXT_FRAMES,
        contextHeld: motionContext.length,
        planningWindows,
        trailWindowFrames: TRAIL_MAX,
        peakSnapOvershoot: Math.round(peakSnapOvershoot * 1000) / 1000,
        peakSpringOvershoot: Math.round(peakSpringOvershoot * 1000) / 1000,
        meshes: countDraws(root).meshes,
      },
    },
  };
}

export default createDemo;
