/**
 * Source 23 — hand-written GLSL combat sim with deforming terrain.
 *
 * Restages the lab demo's comparison at room scale: two snow plates face the
 * door as tilted drafting tables, and a walker drives the same lissajous path
 * into both. The left plate clears its field every frame; the right plate
 * remembers, so the path accumulates into a tinted groove. The tilt is pure
 * staging for the doorway sightline — a flat floor foreshortens to a sliver
 * from a 1.6 m eye — while field, brush, banked recovery and path run in the
 * plate's own frame, untouched. The source's texel-snapped toroidal follow
 * window is not shown because a room floor never follows anyone — stated,
 * not smuggled.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition } from '../contract';
const PLATE_W = 6.2;
const PLATE_D = 8;
// The doorway camera stands at local z = -4 (4 m inside the door wall) at
// 1.6 m eye height, and this wing's world shell carries a full-height
// barrier at local z = 0: everything past the room's middle never reaches
// the door (the flat floor read as a sliver because only its near 2 m are
// door-side of the wall). So both plates live entirely in the door half,
// tilted 34° toward the door as drafting tables, bottom edge 2.8 m ahead of
// the camera. Staging only; field, brush, bank and path below run in
// plate-local coordinates and never know about the tilt or the address.
const EXHIBIT_Z = -3.5;
const TILT = 0.6;
const PIVOT_Y = 0.3;
const MAX_DEPTH = 0.5;
const RELAX_STEP = 0.4;
const RELAX_RATE = 0.05;

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

/** Persistent accumulating field with banked recovery. Same state machine. */
class DeformationField {
  private readonly resolution: number;
  private readonly coverage: number;
  private readonly values: Float32Array;
  private readonly remembers: boolean;
  private banked = 0;

  constructor(resolution: number, coverage: number, remembers: boolean) {
    this.resolution = resolution;
    this.coverage = coverage;
    this.remembers = remembers;
    this.values = new Float32Array(resolution * resolution);
  }

  clear(): void {
    this.values.fill(0);
    this.banked = 0;
  }

  brush(x: number, z: number, radius: number, amount: number): void {
    const half = this.coverage / 2;
    const texel = this.coverage / this.resolution;
    const cellRadius = Math.ceil(radius / texel);
    const centre = Math.round(((x + half) / this.coverage) * (this.resolution - 1));
    const centreRow = Math.round(((z + half) / this.coverage) * (this.resolution - 1));
    for (let row = -cellRadius; row <= cellRadius; row += 1) {
      for (let col = -cellRadius; col <= cellRadius; col += 1) {
        const distance = Math.hypot(col * texel, row * texel);
        if (distance > radius) continue;
        const c = centre + col;
        const r = centreRow + row;
        if (c < 0 || r < 0 || c >= this.resolution || r >= this.resolution) continue;
        const falloff = 1 - distance / radius;
        const slot = r * this.resolution + c;
        this.values[slot] = Math.min(MAX_DEPTH, this.values[slot] + amount * falloff);
      }
    }
  }

  relax(dt: number): void {
    if (!this.remembers) return;
    // Recovery is banked and spent in discrete steps: a tiny per-frame decay
    // would round away below one unit in the last place of a small store.
    this.banked += dt;
    if (this.banked < RELAX_STEP) return;
    this.banked = 0;
    for (let i = 0; i < this.values.length; i += 1) {
      this.values[i] = Math.max(0, this.values[i] - RELAX_RATE);
    }
  }

  sample(x: number, z: number): number {
    const half = this.coverage / 2;
    const c = Math.round(((x + half) / this.coverage) * (this.resolution - 1));
    const r = Math.round(((z + half) / this.coverage) * (this.resolution - 1));
    if (c < 0 || r < 0 || c >= this.resolution || r >= this.resolution) return 0;
    return this.values[r * this.resolution + c];
  }
}

// Staging values, not technique: mid-grey snow on a plinth lift that keeps the
// full 0.5 m groove range above the shell floor (unlifted plates drowned their
// own memory through y = 0, reading as dark pits of shell floor). Plates are
// unlit below so the vertex-colour groove tint renders exactly as authored.
const SNOW: readonly [number, number, number] = [0.78, 0.8, 0.84];
const PACKED: readonly [number, number, number] = [0.16, 0.26, 0.4];

export const room: RoomDefinition = {
  sourceId: 23,
  skill: 'unmapped',
  title: 'Deforming-terrain combat sim',
  summary:
    'Two snowfields and one walker: the left field forgets every frame while '
    + 'the right remembers, so the same path grooves only one of them.',
  kind: 'webgpu',
  limitation:
    'Independent implementation of the described method; the source is all '
    + 'rights reserved and none of its expression is reproduced. CPU field, '
    + 'not a GPU pass over float targets; the texel-snapped follow window is '
    + 'not shown because a room floor never follows anyone; no snow shading, '
    + 'compression or berm model. The plates are tilted toward the door as '
    + 'staging so the groove reads on entry. The groove is pre-rolled to its '
    + 'steady state so it reads on entry — watch a while to see the true relax rate.',
  create: (ctx: RoomContext) => {
    const { THREE } = ctx;
    const disposables: Array<{ dispose(): void }> = [];
    const root = new THREE.Group();
    const low = ctx.quality === 'low';
    const segX = low ? 20 : 40;
    const segZ = low ? 36 : 72;
    const resolution = low ? 48 : 96;
    const rng = mulberry32(ctx.seed ^ 0x970b);

    interface Plate {
      side: -1 | 1;
      pivot: THREE.Group;
      mesh: THREE.Mesh;
      base: Float32Array;
      field: DeformationField;
    }
    const plates: Plate[] = [];
    for (const side of [-1, 1] as const) {
      const geometry = new THREE.PlaneGeometry(PLATE_W, PLATE_D, segX, segZ);
      geometry.rotateX(-Math.PI / 2);
      disposables.push(geometry);
      const position = geometry.getAttribute('position');
      const base = new Float32Array(position.count);
      // Gentle seeded undulation so the plates read as terrain, not tables.
      for (let i = 0; i < position.count; i += 1) {
        const x = position.getX(i);
        const z = position.getZ(i);
        base[i] = 0.12 * Math.sin(x * 0.9 + side) * Math.cos(z * 0.7) + (rng() - 0.5) * 0.03;
        position.setY(i, base[i]);
      }
      const colours = new Float32Array(position.count * 3);
      for (let i = 0; i < position.count; i += 1) {
        colours[i * 3] = SNOW[0];
        colours[i * 3 + 1] = SNOW[1];
        colours[i * 3 + 2] = SNOW[2];
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
      // Unlit: the groove tint is data, and the world rig (hemisphere 2.2 +
      // key 2.0 + ambient + a point per room) clips any lit snow to white and
      // eats the tint with it. Vertex colour renders exactly as authored.
      const material = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
      disposables.push(material);
      const mesh = new THREE.Mesh(geometry, material);
      // Rigid tilt only: the geometry, field and path stay in plate frame.
      const pivot = new THREE.Group();
      pivot.position.set(side * 3.35, PIVOT_Y, EXHIBIT_Z);
      pivot.rotation.x = -TILT;
      pivot.add(mesh);
      plates.push({ side, pivot, mesh, base, field: new DeformationField(resolution, PLATE_D, side > 0) });
    }

    // Walkers are instruments, not subjects: human-scale blue balls riding the
    // tilted surface so they read against the snow from the door. Placement
    // maps the plate-local path point through the pivot, so the rigid tilt
    // never leaks into field coordinates. Colour and size are staging; the
    // driven path below is the technique's lissajous, unchanged in kind.
    const markerGeometry = new THREE.SphereGeometry(0.7, 16, 12);
    disposables.push(markerGeometry);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x2f7fe0, toneMapped: false });
    disposables.push(markerMaterial);
    const walkers = [-1, 1].map(() => {
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      root.add(marker);
      return marker;
    });

    const applyField = (plate: Plate): void => {
      const position = plate.mesh.geometry.getAttribute('position');
      const colour = plate.mesh.geometry.getAttribute('color');
      for (let i = 0; i < position.count; i += 1) {
        const depth = plate.field.sample(position.getX(i), position.getZ(i));
        position.setY(i, plate.base[i] - depth);
        // Legibility scale only: the square root compresses the state range
        // into visible tint; the stored field is untouched.
        const t = Math.sqrt(Math.max(0, Math.min(1, depth / MAX_DEPTH)));
        colour.setXYZ(
          i,
          SNOW[0] + (PACKED[0] - SNOW[0]) * t,
          SNOW[1] + (PACKED[1] - SNOW[1]) * t,
          SNOW[2] + (PACKED[2] - SNOW[2]) * t,
        );
      }
      position.needsUpdate = true;
      colour.needsUpdate = true;
    };
    // Walker placement through the pivot: the plate-local path point plus the
    // analytic surface height (base undulation minus field depth; the seeded
    // jitter is ±0.015 and safely ignored) mapped to the room by the tilt.
    const HOVER = 0.78;
    const tmp = new THREE.Vector3();
    const placeWalker = (p: number, x: number, z: number): void => {
      const plate = plates[p]!;
      const surf =
        0.12 * Math.sin(x * 0.9 + plate.side) * Math.cos(z * 0.7) - plate.field.sample(x, z);
      plate.pivot.updateWorldMatrix(true, false);
      walkers[p]!.position.copy(plate.pivot.localToWorld(tmp.set(x, surf + HOVER, z)));
    };
    // Deterministic lissajous path, kept tight around the plate centres so
    // walker and groove stay inside the doorway sightline at all times. The
    // first staging used the full plate width and the trail spent itself at
    // the lateral extremes, out of frame: captures showed flat snow. Route
    // is staging; brush, accumulate, bank and relax are untouched.
    const pathAt = (t: number): [number, number] => [
      Math.sin(t * 0.3) * PLATE_W * 0.12,
      Math.sin(t * 0.23 + 1.1) * PLATE_D * 0.15,
    ];
    // Pre-roll the remembering plate to its steady-state trail: the same
    // brush and relax calls as live frames, fixed 1/60 steps over four
    // seconds of path, so every visit opens identically. Without this the
    // first seconds show an unmarked field.
    for (let t = -4; t < 0; t += 1 / 60) {
      const [px, pz] = pathAt(t);
      for (const plate of plates) {
        plate.field.brush(px, pz, 1.4, 9.0 / 60);
        plate.field.relax(1 / 60);
      }
    }
    for (const plate of plates) applyField(plate);
    // Initial walker poses match the path start, so frame zero already reads.
    root.updateMatrixWorld(true);
    for (let p = 0; p < plates.length; p += 1) {
      const [ix, iz] = pathAt(0);
      placeWalker(p, ix, iz);
    }
    let normalTick = 0;
     return {
       root,
       update: (time: number, dt: number) => {
        const [x, z] = pathAt(time);
        const step = Math.max(0, Math.min(dt, 0.1));
        plates[0].field.clear();
        for (let p = 0; p < plates.length; p += 1) {
          const plate = plates[p];
          // Brush wider than the technique needs so the trail reads at 8 m;
          // the state machine (accumulate, bank, relax) is untouched.
          plate.field.brush(x, z, 1.4, 9.0 * step);
          plate.field.relax(step);
          applyField(plate);
          placeWalker(p, x, z);
        }
        normalTick += 1;
        if (normalTick % 2 === 0) {
          for (const plate of plates) plate.mesh.geometry.computeVertexNormals();
        }
      },
      dispose: () => {
        for (const entry of disposables) entry.dispose();
      },
    };
  },
};
