/**
 * Source 23 — hand-written GLSL combat sim with deforming terrain.
 *
 * Restages the lab demo's comparison at room scale: two snow plates fill the
 * room, and a walker drives the same lissajous path into both. The left plate
 * clears its field every frame; the right plate remembers, so the path
 * accumulates into a tinted groove. Field, brush and banked recovery are
 * restated from the demo; the source's texel-snapped toroidal follow window
 * is not shown because a room floor never follows anyone — stated, not
 * smuggled.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition } from '../contract';

const PLATE_W = 6.2;
const PLATE_D = 12;
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

const SNOW: readonly [number, number, number] = [0.93, 0.95, 0.98];
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
    + 'compression or berm model.',
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
      const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
      disposables.push(material);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(side * 3.35, 0.05, 0.5);
      root.add(mesh);
      plates.push({ mesh, base, field: new DeformationField(resolution, PLATE_D, side > 0) });
    }

    const markerGeometry = new THREE.SphereGeometry(0.35, 16, 12);
    disposables.push(markerGeometry);
    const markerMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f6fd0,
      emissive: 0x0a2a66,
      roughness: 0.4,
    });
    disposables.push(markerMaterial);
    const walkers = [-1, 1].map((side) => {
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(side * 3.35, 0.5, 0.5);
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

    let normalTick = 0;
    return {
      root,
      update: (time: number, dt: number) => {
        // Deterministic lissajous path: a recognisable groove, identical on
        // every visit at equal mount age.
        const x = Math.sin(time * 0.35) * PLATE_W * 0.4;
        const z = Math.sin(time * 0.23 + 1.1) * PLATE_D * 0.42;
        const step = Math.max(0, Math.min(dt, 0.1));
        plates[0].field.clear();
        for (let p = 0; p < plates.length; p += 1) {
          const plate = plates[p];
          plate.field.brush(x, z, 0.9, 9.0 * step);
          plate.field.relax(step);
          applyField(plate);
          const depth = plate.field.sample(x, z);
          walkers[p].position.set((p === 0 ? -3.35 : 3.35) + x, 0.45 - depth, 0.5 + z);
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
