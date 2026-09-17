/**
 * Shared CPU helpers for technique-lab group D (weather: storm cloud, cloud
 * shadows, colour correction, one-value storminess).
 *
 * Why CPU: this lane has no GPU and no browser, so nothing here can be
 * observed rendering. The exhibits therefore bake the same mathematics a
 * shipping node graph would evaluate per fragment — noise, extinction,
 * grading — into textures and vertex colours at construction time, and each
 * demo's limitation names that substitution. The shipping form of all of it
 * is TSL; no TSL is imported here, so there is no version risk to audit.
 *
 * Nothing is copied from any external project. The hashes, the noise, the
 * cellular detail and the grade below were written for this file; the octave
 * rotation exists for the usual reason (stacked octaves on one axis leave a
 * visible grid) and is called out where it happens.
 */

import type * as THREE from 'three';
import type { DemoContext } from '../../types';

/** Deterministic scalar stream over an integer seed (self-written xorshift). */
export function createRng(seed: number): () => number {
  let state = seed | 0;
  if (state === 0) state = 0x9e3779b9;
  return () => {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return (state >>> 0) / 4294967296;
  };
}

/** Clamp to [0,1]; the lockstep behaviour every ramp in this file shares. */
export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** Smooth Hermite step; guards the degenerate edge order callers never send. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x < edge0 ? 0 : 1;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Deterministic 2D lattice hash to [0,1). Integer arithmetic throughout
 * (Math.imul is 32-bit exact), so large negative lattice coordinates stay
 * stable rather than drifting through float rounding.
 */
export function hash2(x: number, y: number, seed: number): number {
  let h = seed | 0;
  h = Math.imul(h ^ (x | 0), 374761393);
  h = Math.imul(h ^ (y | 0), 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Deterministic 3D lattice hash to [0,1); same contract as hash2. */
export function hash3(x: number, y: number, z: number, seed: number): number {
  let h = seed | 0;
  h = Math.imul(h ^ (x | 0), 374761393);
  h = Math.imul(h ^ (y | 0), 668265263);
  h = Math.imul(h ^ (z | 0), 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Quintic smootherstep; the crease-free interpolant both noises share. */
function smoother(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** 2D value noise on the integer lattice, smoothly interpolated. */
export function valueNoise2(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const u = smoother(x - xi);
  const v = smoother(y - yi);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** 3D value noise; trilinear blend of the eight surrounding lattice values. */
export function valueNoise3(x: number, y: number, z: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const u = smoother(x - xi);
  const v = smoother(y - yi);
  const w = smoother(z - zi);
  const c000 = hash3(xi, yi, zi, seed);
  const c100 = hash3(xi + 1, yi, zi, seed);
  const c010 = hash3(xi, yi + 1, zi, seed);
  const c110 = hash3(xi + 1, yi + 1, zi, seed);
  const c001 = hash3(xi, yi, zi + 1, seed);
  const c101 = hash3(xi + 1, yi, zi + 1, seed);
  const c011 = hash3(xi, yi + 1, zi + 1, seed);
  const c111 = hash3(xi + 1, yi + 1, zi + 1, seed);
  const x00 = c000 + (c100 - c000) * u;
  const x10 = c010 + (c110 - c010) * u;
  const x01 = c001 + (c101 - c001) * u;
  const x11 = c011 + (c111 - c011) * u;
  const y0 = x00 + (x10 - x00) * v;
  const y1 = x01 + (x11 - x01) * v;
  return y0 + (y1 - y0) * w;
}

/**
 * Fractal sum of valueNoise2. Each octave rotates the domain ~37 degrees and
 * re-offsets it, which scatters the axial structure that stacked same-axis
 * octaves would otherwise leave visible.
 */
export function fbm2(x: number, y: number, octaves: number, seed: number): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let px = x;
  let py = y;
  for (let o = 0; o < octaves; o += 1) {
    sum += amp * valueNoise2(px, py, seed + o * 101);
    norm += amp;
    const rx = 0.8 * px - 0.6 * py;
    const ry = 0.6 * px + 0.8 * py;
    px = rx * 2.03 + 11.3;
    py = ry * 2.03 + 7.7;
    amp *= 0.5;
  }
  return norm > 0 ? sum / norm : 0;
}

/** Fractal sum of valueNoise3; same rotation rationale as fbm2. */
export function fbm3(
  x: number,
  y: number,
  z: number,
  octaves: number,
  seed: number,
): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let px = x;
  let py = y;
  let pz = z;
  for (let o = 0; o < octaves; o += 1) {
    sum += amp * valueNoise3(px, py, pz, seed + o * 131);
    norm += amp;
    // Rotate the XY domain each octave; Z gets a prime offset instead, which
    // is cheaper than a full 3D rotation and breaks the stacking just as well.
    const rx = 0.8 * px - 0.6 * py;
    const ry = 0.6 * px + 0.8 * py;
    px = rx * 2.02 + 5.1;
    py = ry * 2.02 + 9.4;
    pz = pz * 2.02 + 3.7;
    amp *= 0.5;
  }
  return norm > 0 ? sum / norm : 0;
}

/**
 * Single-octave cellular (Worley-style) detail: inverted F1 distance, 1 at
 * feature points falling to 0 mid-cell. Used only as erosion/detail layered
 * over a value-noise base, never as the base itself — one octave of cells
 * reads as cobbles, not cloud.
 */
export function worley3(x: number, y: number, z: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  let nearest = 8;
  for (let dz = -1; dz <= 1; dz += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const cx = xi + dx;
        const cy = yi + dy;
        const cz = zi + dz;
        const px = cx + hash3(cx, cy, cz, seed);
        const py = cy + hash3(cx, cy, cz, seed + 17);
        const pz = cz + hash3(cx, cy, cz, seed + 43);
        const ddx = px - x;
        const ddy = py - y;
        const ddz = pz - z;
        const d2 = ddx * ddx + ddy * ddy + ddz * ddz;
        if (d2 < nearest) nearest = d2;
      }
    }
  }
  return clamp01(1 - Math.sqrt(nearest));
}

/** Exact sRGB decode of one channel (the threshold is the standard one). */
export function srgbToLinear(c: number): number {
  const x = clamp01(c);
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

/**
 * Exact sRGB encode of one channel. The top is clamped: values above 1 are
 * display-referred white, which is what an ungraded highlight does too.
 */
export function linearToSrgb(c: number): number {
  const x = Math.max(c, 0);
  const s = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  return Math.min(s, 1);
}

/** Lift/gamma/gain + saturation + contrast, evaluated in linear space. */
export interface GradeParams {
  /** Per-channel floor lift; shadows move, peak white holds. */
  readonly lift: readonly [number, number, number];
  /** Display-style gamma (>1 opens the mid-tones). Applied as 1/gamma. */
  readonly gamma: number;
  /** Per-channel multiplier after the gamma stage. */
  readonly gain: readonly [number, number, number];
  /** 1 is neutral; Rec.709 luma is the desaturated anchor. */
  readonly saturation: number;
  /** 1 is neutral, pivoted below white so highlights roll rather than clip. */
  readonly contrast: number;
  readonly contrastPivot: number;
}

const LUMA_R = 0.2126;
const LUMA_G = 0.7152;
const LUMA_B = 0.0722;

/**
 * One graded linear pixel. The floor is clamped at zero; the top is left
 * unclamped so an HDR chip stays HDR here and clips only at display time.
 */
export function applyGrade(
  r: number,
  g: number,
  b: number,
  p: GradeParams,
): [number, number, number] {
  let cr = r + p.lift[0] * (1 - r);
  let cg = g + p.lift[1] * (1 - g);
  let cb = b + p.lift[2] * (1 - b);
  const inv = 1 / p.gamma;
  cr = Math.pow(Math.max(cr, 0), inv);
  cg = Math.pow(Math.max(cg, 0), inv);
  cb = Math.pow(Math.max(cb, 0), inv);
  cr *= p.gain[0];
  cg *= p.gain[1];
  cb *= p.gain[2];
  const luma = LUMA_R * cr + LUMA_G * cg + LUMA_B * cb;
  cr = luma + (cr - luma) * p.saturation;
  cg = luma + (cg - luma) * p.saturation;
  cb = luma + (cb - luma) * p.saturation;
  cr = p.contrastPivot + (cr - p.contrastPivot) * p.contrast;
  cg = p.contrastPivot + (cg - p.contrastPivot) * p.contrast;
  cb = p.contrastPivot + (cb - p.contrastPivot) * p.contrast;
  return [Math.max(cr, 0), Math.max(cg, 0), Math.max(cb, 0)];
}

/** Rec.709 luminance of a linear pixel; the Node harness asserts through it. */
export function lumaOf(r: number, g: number, b: number): number {
  return LUMA_R * r + LUMA_G * g + LUMA_B * b;
}

/**
 * Two side-by-side stage groups, control left and technique right, so a
 * before/after is one inspectable object. The demo fills them; nothing here
 * imports another group's modules.
 */
export function panelPair(
  three: DemoContext['THREE'],
  separation: number,
): { before: THREE.Group; after: THREE.Group } {
  const before = new three.Group();
  const after = new three.Group();
  before.name = 'control';
  after.name = 'technique';
  before.position.x = -separation / 2;
  after.position.x = separation / 2;
  return { before, after };
}

/**
 * Paint a vertical two-stop gradient into a `color` attribute, bottom to top
 * by local Y. Colours are linear working values; the material path converts.
 */
export function paintVerticalGradient(
  three: DemoContext['THREE'],
  geometry: THREE.BufferGeometry,
  bottom: readonly [number, number, number],
  top: readonly [number, number, number],
): void {
  const position = geometry.getAttribute('position');
  const count = position.count;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < count; i += 1) {
    const y = position.getY(i);
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const span = maxY > minY ? maxY - minY : 1;
  const colours = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const t = (position.getY(i) - minY) / span;
    colours[i * 3] = bottom[0] + (top[0] - bottom[0]) * t;
    colours[i * 3 + 1] = bottom[1] + (top[1] - bottom[1]) * t;
    colours[i * 3 + 2] = bottom[2] + (top[2] - bottom[2]) * t;
  }
  geometry.setAttribute('color', new three.BufferAttribute(colours, 3));
}

interface Disposable {
  dispose(): void;
}

/** Narrowing guard so disposeTree never asserts a shape it has not checked. */
function isDisposable(value: unknown): value is Disposable {
  return (
    typeof value === 'object'
    && value !== null
    && 'dispose' in value
    && typeof value.dispose === 'function'
  );
}

/**
 * Dispose every geometry, material and material map under `root` exactly
 * once, plus any demo-owned lights (they carry isLight and a dispose, unlike
 * meshes). The `seen` set is dynamic membership over object identities, and
 * double dispose would be harmless anyway — three's dispose is idempotent.
 */
export function disposeTree(root: THREE.Object3D): void {
  const seen = new Set<unknown>();
  const release = (target: unknown): void => {
    if (isDisposable(target) && !seen.has(target)) {
      seen.add(target);
      target.dispose();
    }
  };
  root.traverse((obj) => {
    if ('geometry' in obj) release(obj.geometry);
    if ('material' in obj) {
      const material: unknown = obj.material;
      if (Array.isArray(material)) {
        for (const entry of material) {
          release(entry);
          if (entry && typeof entry === 'object' && 'map' in entry) {
            release(entry.map);
          }
        }
      } else {
        release(material);
        if (material && typeof material === 'object' && 'map' in material) {
          release(material.map);
        }
      }
    }
    if ('isLight' in obj && obj.isLight === true) release(obj);
  });
}
