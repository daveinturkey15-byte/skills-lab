/**
 * The one cloud field behind group D's sky and shadow demos.
 *
 * D1 (the anvil) extrudes this 2D coverage field vertically with a tower and
 * flat-top profile plus 3D detail; D2 (the shadows) projects the same field
 * to the ground through the same wind vector at the same time. The shadow
 * agreeing with the cloud is therefore true by construction — same function,
 * same wind, same clock — and the demos say so rather than claiming an
 * independent light-transport solution. The projection is vertical (a
 * high-sun approximation); a low sun would slant the shadows, which neither
 * demo models.
 *
 * Pure TypeScript, no three.js import, so the Node harness can time the exact
 * bake loop the D1 demo runs at construction.
 */

import {
  clamp01,
  fbm2,
  fbm3,
  linearToSrgb,
  smoothstep,
  worley3,
} from './shared';

/** Fixed identity seed for the whole group: two mounts must look identical. */
export const CLOUD_SEED = 5100;

/** Advection of the field in field units per second (shared by sky + ground). */
export const CLOUD_WIND = { u: 0.01, v: 0.004 } as const;

/** Construction-time raymarch controls; exposed, not live UI (see D1). */
export interface CloudBakeParams {
  /** View-ray march steps through the bounding volume. */
  readonly steps: number;
  /** Light-march steps toward the sun per occupied view sample. */
  readonly lightSteps: number;
  /** Global density multiplier. */
  readonly density: number;
  /** Fraction of the sky the coverage ramp keeps cloudy, 0..1. */
  readonly coverage: number;
  readonly seed: number;
}

export const CLOUD_PARAMS: CloudBakeParams = {
  steps: 32,
  lightSteps: 5,
  density: 1.0,
  coverage: 0.55,
  seed: CLOUD_SEED,
};

/** Low warm sun, already normalised. Points from the cloud toward the sun. */
export const CLOUD_SUN_DIR = (() => {
  const x = -0.42;
  const y = 0.3;
  const z = -0.86;
  const len = Math.sqrt(x * x + y * y + z * z);
  return { x: x / len, y: y / len, z: z / len };
})();

/** Henyey-Greenstein asymmetry: forward-peaked but gentle, hence the rim. */
export const CLOUD_PHASE_G = 0.35;

/** Extinction per unit density per unit length inside the volume. */
export const CLOUD_EXTINCTION = 2.4;
/** Volume the D1 bake marches: x in [-3.4, 3.4], y in [0, 8.2], z in [-2.6, 2.6]. */
export const CLOUD_BOX = {
  x0: -3.4,
  x1: 3.4,
  y0: 0,
  y1: 8.2,
  z0: -2.6,
  z1: 2.6,
} as const;

/**
 * 2D cloud cover in [0,1] — the field D1 extrudes and D2 projects. Four
 * octaves of value noise, advected by the shared wind, ramped so `coverage`
 * reads as sky fraction rather than as an opaque noise threshold.
 */
export function coverageField(
  u: number,
  v: number,
  timeSeconds: number,
  coverage: number,
  seed: number,
): number {
  const n = fbm2(
    u * 0.55 + CLOUD_WIND.u * timeSeconds,
    v * 0.55 + CLOUD_WIND.v * timeSeconds,
    4,
    seed,
  );
  return smoothstep(1 - coverage - 0.24, 1 - coverage + 0.24, n);
}

/**
 * Volumetric density at a point in volume space. A soft-edged column whose
 * radius more than triples into a flat anvil cap; the cap alone gets cellular
 * erosion, which is what keeps its top flat instead of cauliflowered. The
 * column envelope is gated by coverageField, so raising coverage thickens
 * every column rather than just adding new ones.
 */
export function densityAt(
  x: number,
  y: number,
  z: number,
  timeSeconds: number,
  seed: number,
  coverage: number,
  density: number,
): number {
  if (y <= CLOUD_BOX.y0 || y >= CLOUD_BOX.y1) return 0;
  const anvil = smoothstep(4.4, 7.2, y);
  const radius = 1.05 + 2.4 * anvil;
  const radial = Math.sqrt(x * x + z * z * 1.7) / radius;
  const body = 1 - smoothstep(0.55, 1.0, radial);
  if (body <= 0) return 0;
  const baseFade = smoothstep(CLOUD_BOX.y0, 0.9, y);
  const erosion = worley3(x * 0.85, y * 0.85, z * 0.85, seed + 7) * anvil;
  const topCut = 1 - smoothstep(7.4, CLOUD_BOX.y1, y + erosion * 0.9);
  if (topCut <= 0) return 0;
  const detail = fbm3(
    x * 0.5 + CLOUD_WIND.u * timeSeconds,
    y * 0.5,
    z * 0.5 + CLOUD_WIND.v * timeSeconds,
    4,
    seed,
  );
  const cover = coverageField(x * 0.16, z * 0.16, timeSeconds, coverage, seed);
  const shaped = detail * 0.62 + cover * 0.5 - erosion * 0.3;
  const mass = smoothstep(0.32, 0.62, shaped);
  return Math.max(mass * body * baseFade * topCut * density, 0);
}

/** Henyey-Greenstein phase for cos(view, sun); the silver-rim term. */
export function henyeyGreenstein(cosTheta: number, g: number): number {
  const g2 = g * g;
  const denom = Math.pow(1 + g2 - 2 * g * cosTheta, 1.5);
  return (1 - g2) / (4 * Math.PI * Math.max(denom, 1e-4));
}

/**
 * Orthographic bake of the volume at construction time: front-to-back
 * compositing with Beer-Lambert extinction along the view ray, a short light
 * march toward the sun at each occupied sample (cheap analytic stand-in for
 * full shadow mapping), and the HG phase on the sun source term. Returns
 * display-referred sRGB bytes with a straight alpha, ready for a DataTexture.
 */
export function bakeCloud(
  width: number,
  height: number,
  params: CloudBakeParams,
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  const sun = CLOUD_SUN_DIR;
  // View rays run along +Z; the sun sits behind the cloud, so the phase term
  // is evaluated for forward scattering through thin edges — the rim.
  const cosViewSun = -sun.z;
  const phase = henyeyGreenstein(cosViewSun, CLOUD_PHASE_G);
  const sunColour = { r: 1.25, g: 0.52, b: 0.26 };
  const ambient = { r: 0.1, g: 0.12, b: 0.16 };
  const depth = CLOUD_BOX.z1 - CLOUD_BOX.z0;
  const dt = depth / params.steps;
  const lightDist = 3.4;
  const lightDt = lightDist / params.lightSteps;
  for (let j = 0; j < height; j += 1) {
    const y = CLOUD_BOX.y0
      + ((j + 0.5) / height) * (CLOUD_BOX.y1 - CLOUD_BOX.y0);
    for (let i = 0; i < width; i += 1) {
      const x = CLOUD_BOX.x0
        + ((i + 0.5) / width) * (CLOUD_BOX.x1 - CLOUD_BOX.x0);
      let transmittance = 1;
      let lr = 0;
      let lg = 0;
      let lb = 0;
      for (let s = 0; s < params.steps; s += 1) {
        const z = CLOUD_BOX.z0 + ((s + 0.5) / params.steps) * depth;
        const rho = densityAt(
          x,
          y,
          z,
          0,
          params.seed,
          params.coverage,
          params.density,
        );
        if (rho < 0.004) continue;
        let lightIntegral = 0;
        for (let l = 0; l < params.lightSteps; l += 1) {
          const lt = (l + 0.5) * lightDt;
          lightIntegral += densityAt(
            x + sun.x * lt,
            y + sun.y * lt,
            z + sun.z * lt,
            0,
            params.seed,
            params.coverage,
            params.density,
          ) * lightDt;
        }
        const sunTransmittance = Math.exp(-CLOUD_EXTINCTION * lightIntegral);
        const absorb = 1 - Math.exp(-CLOUD_EXTINCTION * rho * dt);
        const srcR = sunColour.r * phase * sunTransmittance * 4 + ambient.r;
        const srcG = sunColour.g * phase * sunTransmittance * 4 + ambient.g;
        const srcB = sunColour.b * phase * sunTransmittance * 4 + ambient.b;
        lr += transmittance * absorb * srcR;
        lg += transmittance * absorb * srcG;
        lb += transmittance * absorb * srcB;
        transmittance *= 1 - absorb;
        if (transmittance < 0.02) break;
      }
      const k = (j * width + i) * 4;
      data[k] = Math.round(linearToSrgb(lr) * 255);
      data[k + 1] = Math.round(linearToSrgb(lg) * 255);
      data[k + 2] = Math.round(linearToSrgb(lb) * 255);
      data[k + 3] = Math.round(clamp01(1 - transmittance) * 255);
    }
  }
  return data;
}
