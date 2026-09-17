/**
 * Source 51, D4 — one storminess value driving everything.
 *
 * The transferable object from the sailing source is not any single effect
 * but the weather state machine: a slow storminess value in 0..1 whose every
 * channel — sun colour and intensity, cloud coverage and density, rain rate,
 * sea amplitude and roughness, aerial haze, exposure — chases it with its own
 * time constant. Different lags per channel are what make weather feel
 * physical rather than switched, so states blend and never pop.
 *
 * Water reuses the repository's frozen spectrum (OCEAN_BANDS / sampleOcean),
 * never a second wave model. Exposure is emulated as a multiplier on
 * sky/sun colours because renderer exposure is host-owned and untouched.
 * Channel values are readable live on root.userData['storm-state'] and as
 * eight in-scene meter bars (storminess first, then the seven channels).
 */

import type * as THREE from 'three';

import type {
  DemoContext,
  DemoInstance,
  DemoMetadata,
} from '../../types';
import {
  OCEAN_REFERENCE_AMPLITUDE,
  sampleOcean,
} from '../../../water/ocean-spectrum';
import { coverageField, CLOUD_SEED } from './cloud-field';
import { clamp01, createRng, disposeTree } from './shared';

export const SOURCE_URLS = [
  'https://x.com/zackontopx/status/2100183743436890237',
] as const;

/** Full calm-to-storm-to-calm loop, seconds. Deterministic in mount age. */
export const STORM_PERIOD = 80;

/** Per-channel lag in seconds: the weather feel lives in these numbers. */
export const STORM_TAUS = {
  sun: 6,
  cloud: 18,
  rain: 2.5,
  sea: 10,
  haze: 14,
  exposure: 5,
} as const;

/** Live readout shape stored on root.userData['storm-state'] (mutated, never replaced). */
export interface StormReadout {
  storminess: number;
  sunIntensity: number;
  cloudCover: number;
  cloudDensity: number;
  rainRate: number;
  seaAmplitude: number;
  seaRoughness: number;
  haze: number;
  exposure: number;
}

export const STORM_USERDATA_KEY = 'storm-state';

function chase(current: number, target: number, tau: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-dt / tau));
}

/** Channel targets for a storminess value; every target blends, none switch. */
export function stormTargets(storminess: number): StormReadout {
  const s = clamp01(storminess);
  return {
    storminess: s,
    sunIntensity: 2.4 + (0.45 - 2.4) * s,
    cloudCover: 0.15 + (0.9 - 0.15) * s,
    cloudDensity: 0.5 + (1.6 - 0.5) * s,
    rainRate: s * s,
    seaAmplitude: (0.35 + (2.0 - 0.35) * s) * OCEAN_REFERENCE_AMPLITUDE,
    seaRoughness: 0.12 + (0.6 - 0.12) * s,
    haze: s,
    exposure: 1.15 + (0.85 - 1.15) * s,
  };
}

const SEA_SIZE = 12;
const SEA_SEGMENTS = 26;
const SEA_METRES_PER_UNIT = 3;
const RAIN_COUNT = 500;
const DECK_WIDTH = 96;
const DECK_HEIGHT = 48;
const CALM_SUN: readonly [number, number, number] = [1.0, 0.82, 0.64];
const STORM_SUN: readonly [number, number, number] = [0.5, 0.6, 0.72];
const CALM_SKY_TOP: readonly [number, number, number] = [0.1, 0.16, 0.26];
const CALM_SKY_BOTTOM: readonly [number, number, number] = [0.5, 0.42, 0.34];
const STORM_SKY_TOP: readonly [number, number, number] = [0.05, 0.06, 0.08];
const STORM_SKY_BOTTOM: readonly [number, number, number] = [0.16, 0.17, 0.19];
const DEEP_WATER: readonly [number, number, number] = [0.045, 0.09, 0.12];
const CREST_WATER: readonly [number, number, number] = [0.32, 0.42, 0.45];
const FOAM_WATER: readonly [number, number, number] = [0.72, 0.78, 0.8];

export function createDemo(context: DemoContext): DemoInstance {
  const { THREE } = context;
  const root = new THREE.Group();
  root.name = 'source-51-storminess';

  const readout: StormReadout = stormTargets(0);
  root.userData[STORM_USERDATA_KEY] = readout;

  // Sea: the frozen spectrum, driven in amplitude and roughness.
  const seaGeometry = new THREE.PlaneGeometry(SEA_SIZE, SEA_SIZE, SEA_SEGMENTS, SEA_SEGMENTS);
  seaGeometry.rotateX(-Math.PI / 2);
  const seaPosition = seaGeometry.getAttribute('position');
  const seaCount = seaPosition.count;
  const seaRestX = new Float32Array(seaCount);
  const seaRestZ = new Float32Array(seaCount);
  for (let i = 0; i < seaCount; i += 1) {
    seaRestX[i] = seaPosition.getX(i);
    seaRestZ[i] = seaPosition.getZ(i);
  }
  const seaColours = new Float32Array(seaCount * 3);
  const seaColourAttr = new THREE.BufferAttribute(seaColours, 3);
  seaGeometry.setAttribute('color', seaColourAttr);
  seaColourAttr.setUsage(THREE.DynamicDrawUsage);
  const seaMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.12,
    metalness: 0.0,
  });
  const sea = new THREE.Mesh(seaGeometry, seaMaterial);
  sea.name = 'storm-sea';
  sea.frustumCulled = false;
  root.add(sea);

  // Cloud deck: the shared coverage field, re-sampled at the driven coverage.
  const deckBytes = new Uint8ClampedArray(DECK_WIDTH * DECK_HEIGHT * 4);
  const deckData = new Uint8Array(deckBytes.buffer, deckBytes.byteOffset, deckBytes.byteLength);
  const deckTexture = new THREE.DataTexture(
    deckData,
    DECK_WIDTH,
    DECK_HEIGHT,
    THREE.RGBAFormat,
  );
  deckTexture.colorSpace = THREE.SRGBColorSpace;
  deckTexture.minFilter = THREE.LinearFilter;
  deckTexture.magFilter = THREE.LinearFilter;
  const deckMaterial = new THREE.MeshBasicMaterial({
    map: deckTexture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    opacity: 0.3,
  });
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(22, 11), deckMaterial);
  deck.name = 'storm-deck';
  deck.rotation.x = Math.PI / 2;
  deck.position.set(0, 6.5, -2);
  root.add(deck);

  // Sky backdrop, repainted only when haze has visibly moved.
  const skyGeometry = new THREE.PlaneGeometry(30, 14, 1, 6);
  const skyPosition = skyGeometry.getAttribute('position');
  const skyColours = new Float32Array(skyPosition.count * 3);
  const skyColourAttr = new THREE.BufferAttribute(skyColours, 3);
  skyGeometry.setAttribute('color', skyColourAttr);
  skyColourAttr.setUsage(THREE.DynamicDrawUsage);
  const sky = new THREE.Mesh(
    skyGeometry,
    new THREE.MeshBasicMaterial({ vertexColors: true }),
  );
  sky.name = 'storm-sky';
  sky.position.set(0, 5, -9);
  root.add(sky);
  let paintedHaze = -1;

  const paintSky = (haze: number, exposure: number): void => {
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < skyPosition.count; i += 1) {
      const y = skyPosition.getY(i);
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const span = maxY > minY ? maxY - minY : 1;
    for (let i = 0; i < skyPosition.count; i += 1) {
      const t = (skyPosition.getY(i) - minY) / span;
      for (let c = 0; c < 3; c += 1) {
        const calm = CALM_SKY_BOTTOM[c] + (CALM_SKY_TOP[c] - CALM_SKY_BOTTOM[c]) * t;
        const storm = STORM_SKY_TOP[c] + (STORM_SKY_BOTTOM[c] - STORM_SKY_TOP[c]) * t;
        skyColours[i * 3 + c] = (calm + (storm - calm) * haze) * exposure;
      }
    }
    skyColourAttr.needsUpdate = true;
    paintedHaze = haze;
  };

  // The demo's own sun; the host rig stays untouched beside it.
  const sun = new THREE.DirectionalLight(new THREE.Color(1, 1, 1), 2.4);
  sun.name = 'storm-sun';
  sun.position.set(-5, 3.5, -2);
  root.add(sun);
  const sunCalm = new THREE.Color(CALM_SUN[0], CALM_SUN[1], CALM_SUN[2]);
  const sunStorm = new THREE.Color(STORM_SUN[0], STORM_SUN[1], STORM_SUN[2]);

  // Rain: preallocated drops, fall speed per drop, count gated by the channel.
  const rng = createRng(context.seed);
  const rainPositions = new Float32Array(RAIN_COUNT * 3);
  const rainSpeed = new Float32Array(RAIN_COUNT);
  for (let i = 0; i < RAIN_COUNT; i += 1) {
    rainPositions[i * 3] = (rng() - 0.5) * 14;
    rainPositions[i * 3 + 1] = rng() * 9;
    rainPositions[i * 3 + 2] = (rng() - 0.5) * 10;
    rainSpeed[i] = 6 + rng() * 4;
  }
  const rainGeometry = new THREE.BufferGeometry();
  const rainPositionAttr = new THREE.BufferAttribute(rainPositions, 3);
  rainGeometry.setAttribute('position', rainPositionAttr);
  rainPositionAttr.setUsage(THREE.DynamicDrawUsage);
  const rain = new THREE.Points(
    rainGeometry,
    new THREE.PointsMaterial({
      color: new THREE.Color(0.62, 0.7, 0.78),
      size: 0.06,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    }),
  );
  rain.name = 'storm-rain';
  rain.frustumCulled = false;
  root.add(rain);

  // Eight meter bars: storminess, then the seven driven channels.
  const meterGeometry = new THREE.BoxGeometry(0.18, 1, 0.18);
  meterGeometry.translate(0, 0.5, 0);
  const meterMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.35, 0.75, 0.85),
  });
  const meterRail = new THREE.Mesh(
    new THREE.PlaneGeometry(8.6, 1.7),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.03, 0.035, 0.045) }),
  );
  meterRail.name = 'meter-rail';
  meterRail.position.set(0, 0.6, 5.5);
  root.add(meterRail);
  const meters: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i += 1) {
    const bar = new THREE.Mesh(meterGeometry, meterMaterial);
    bar.name = `meter-${i}`;
    bar.position.set(-3.5 + i, 0.05, 5.5);
    bar.scale.y = 0.03;
    root.add(bar);
    meters.push(bar);
  }

  let age = 0;

  const metadata: DemoMetadata & { counters: Record<string, number> } = {
    sourceId: 51,
    title: 'One storminess value driving sun, cloud, rain, sea and exposure',
    method:
      'Storminess loops calm-storm-calm over 80 seconds; sun colour and intensity, '
      + 'cloud coverage and density, rain rate, sea amplitude and roughness, haze and '
      + 'an exposure emulation each chase it with their own time constant (2.5 to 18 '
      + 'seconds), so channels lag differently and states blend. Water is the '
      + "repository's frozen spectrum via sampleOcean, never a second wave model. "
      + "Eight meter bars and root.userData['storm-state'] show the value and every channel.",
    adaptation: 'adapted',
    sources: [...SOURCE_URLS],
    limitation:
      'True renderer exposure is host-owned and untouched — the exposure channel is '
      + 'an emulated multiplier on sky colours, stated as such. Sea normals are '
      + 'recomputed per frame on the CPU; foam is a height-threshold tint, not the '
      + 'breaking-detection field of the water demo. Storminess runs on mount age, so '
      + 'two mounts match only at equal age. The shipping form of every channel is the '
      + 'same targets table evaluated in TSL.',
    counters: {
      seaVertices: seaCount,
      rainDrops: RAIN_COUNT,
      deckTexels: DECK_WIDTH * DECK_HEIGHT,
      meters: meters.length,
      stormPeriodSeconds: STORM_PERIOD,
    },
  };

  return {
    root,
    update: (_time: number, dt: number) => {
      age += dt;
      const storminess = 0.5 - 0.5 * Math.cos((2 * Math.PI * age) / STORM_PERIOD);
      const targets = stormTargets(storminess);
      readout.storminess = storminess;
      readout.sunIntensity = chase(readout.sunIntensity, targets.sunIntensity, STORM_TAUS.sun, dt);
      readout.cloudCover = chase(readout.cloudCover, targets.cloudCover, STORM_TAUS.cloud, dt);
      readout.cloudDensity = chase(readout.cloudDensity, targets.cloudDensity, STORM_TAUS.cloud, dt);
      readout.rainRate = chase(readout.rainRate, targets.rainRate, STORM_TAUS.rain, dt);
      readout.seaAmplitude = chase(readout.seaAmplitude, targets.seaAmplitude, STORM_TAUS.sea, dt);
      readout.seaRoughness = chase(readout.seaRoughness, targets.seaRoughness, STORM_TAUS.sea, dt);
      readout.haze = chase(readout.haze, targets.haze, STORM_TAUS.haze, dt);
      readout.exposure = chase(readout.exposure, targets.exposure, STORM_TAUS.exposure, dt);

      sun.intensity = readout.sunIntensity;
      sun.color.copy(sunCalm).lerp(sunStorm, readout.haze);
      seaMaterial.roughness = readout.seaRoughness;

      // Sea surface from the frozen spectrum at the driven amplitude.
      const amp = readout.seaAmplitude;
      for (let i = 0; i < seaCount; i += 1) {
        const wx = seaRestX[i] * SEA_METRES_PER_UNIT;
        const wz = seaRestZ[i] * SEA_METRES_PER_UNIT;
        const sample = sampleOcean(wx, wz, age, amp);
        seaPosition.setY(i, sample.height / SEA_METRES_PER_UNIT);
        const hNorm = clamp01(0.5 + sample.height / (2 * amp + 1e-4));
        const foam = hNorm > 0.72 ? (hNorm - 0.72) / 0.28 : 0;
        const baseR = DEEP_WATER[0] + (CREST_WATER[0] - DEEP_WATER[0]) * hNorm;
        const baseG = DEEP_WATER[1] + (CREST_WATER[1] - DEEP_WATER[1]) * hNorm;
        const baseB = DEEP_WATER[2] + (CREST_WATER[2] - DEEP_WATER[2]) * hNorm;
        seaColours[i * 3] = baseR + (FOAM_WATER[0] - baseR) * foam;
        seaColours[i * 3 + 1] = baseG + (FOAM_WATER[1] - baseG) * foam;
        seaColours[i * 3 + 2] = baseB + (FOAM_WATER[2] - baseB) * foam;
      }
      seaPosition.needsUpdate = true;
      seaColourAttr.needsUpdate = true;
      seaGeometry.computeVertexNormals();

      // Deck follows the driven coverage at the same clock as everything else.
      for (let j = 0; j < DECK_HEIGHT; j += 1) {
        const v = ((j + 0.5) / DECK_HEIGHT - 0.5) * 1.0;
        for (let i = 0; i < DECK_WIDTH; i += 1) {
          const u = ((i + 0.5) / DECK_WIDTH - 0.5) * 2.0;
          const cover = coverageField(u, v, age, CLOUD_SEED, readout.cloudCover);
          const k = (j * DECK_WIDTH + i) * 4;
          const shade = 0.16 + 0.1 * (1 - cover);
          deckBytes[k] = Math.round(shade * 255);
          deckBytes[k + 1] = Math.round(shade * 1.12 * 255);
          deckBytes[k + 2] = Math.round(shade * 1.3 * 255);
          deckBytes[k + 3] = Math.round(clamp01(cover * readout.cloudDensity) * 0.94 * 255);
        }
      }
      deckTexture.needsUpdate = true;
      deckMaterial.opacity = 0.2 + 0.7 * readout.cloudCover;

      if (Math.abs(readout.haze - paintedHaze) > 0.005 || paintedHaze < 0) {
        paintSky(readout.haze, readout.exposure);
      }

      // Rain falls harder and shows more drops as the channel rises.
      const active = Math.floor(RAIN_COUNT * readout.rainRate);
      const fall = dt * (0.5 + readout.rainRate);
      for (let i = 0; i < RAIN_COUNT; i += 1) {
        let y = rainPositions[i * 3 + 1] - rainSpeed[i] * fall;
        if (y < 0) y += 9;
        rainPositions[i * 3 + 1] = y;
      }
      rainPositionAttr.needsUpdate = true;
      rainGeometry.setDrawRange(0, active);

      const levels = [
        readout.storminess,
        readout.sunIntensity / 2.4,
        readout.cloudCover,
        (readout.cloudDensity - 0.5) / 1.1,
        readout.rainRate,
        readout.seaAmplitude / (2.0 * OCEAN_REFERENCE_AMPLITUDE),
        readout.haze,
        (readout.exposure - 0.85) / 0.3,
      ];
      for (let i = 0; i < meters.length; i += 1) {
        meters[i].scale.y = Math.max(clamp01(levels[i]), 0.03);
      }
    },
    dispose: () => disposeTree(root),
    metadata,
  };
}

export default createDemo;
