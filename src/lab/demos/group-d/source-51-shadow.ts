/**
 * Source 51, D2 — cloud shadows that agree with the cloud in the sky.
 *
 * One coverage field (cloud-field.ts) drives both sides of the frame: the
 * overhead deck is that field sampled into an alpha texture, and each ground
 * vertex multiplies its sun term by one minus the same field at its own
 * world position, at the same clock, advected by the same wind. The agreement
 * is structural, not tuned per shot. An unrelated scrolling texture is the
 * named failure mode, and the deck texture is re-sampled every frame precisely
 * so it can never drift out of agreement with the ground.
 *
 * The projection is vertical — a high-sun approximation. A low sun would
 * slant every shadow away from its cloud, which this demo does not model.
 */

import type * as THREE from 'three';

import type {
  DemoComparison,
  DemoContext,
  DemoInstance,
  DemoMetadata,
} from '../../types';
import {
  CLOUD_SEED,
  CLOUD_WIND,
  coverageField,
} from './cloud-field';
import { disposeTree, hash2, paintVerticalGradient } from './shared';

export const SOURCE_URLS = [
  'https://x.com/zackontopx/status/2100183743436890237',
] as const;

/** Demo parameters: construction constants, exported because the host has no dials. */
export const SHADOW_PARAMS = {
  /** Ground panel edge length in world units. */
  panelSize: 9,
  /** Panel mesh resolution; vertex colours carry the shadow. */
  panelSegments: 36,
  /** Field units per world unit in the ground projection. */
  fieldScale: 0.09,
  /** Fraction of the sun the thickest cloud removes. */
  shadowStrength: 0.82,
  /** Ambient floor so shadow cores stay readable, never pure black. */
  ambientFloor: 0.3,
  /** Deck texture resolution, re-sampled every frame. */
  deckWidth: 128,
  deckHeight: 64,
} as const;

/** World rectangle the deck texture covers, in field units at time zero. */
const DECK_U_SPAN = 2.7;
const DECK_V_SPAN = 1.26;

type GroundPanel = {
  group: THREE.Group;
  geometry: THREE.BufferGeometry;
  colours: Float32Array;
  albedo: Float32Array;
  originX: number;
};

function buildGroundPanel(
  THREE: DemoContext['THREE'],
  originX: number,
  withShadow: boolean,
  formMaterial: THREE.Material,
): GroundPanel {
  const group = new THREE.Group();
  group.name = withShadow ? 'shadowed-ground' : 'sun-only-ground';
  const size = SHADOW_PARAMS.panelSize;
  const segs = SHADOW_PARAMS.panelSegments;
  const geometry = new THREE.PlaneGeometry(size, size, segs, segs);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.getAttribute('position');
  const count = position.count;
  const colours = new Float32Array(count * 3);
  const albedo = new Float32Array(count * 3);
  // Muted patchy turf; the hash varies albedo only, never the shadow.
  for (let i = 0; i < count; i += 1) {
    const worldX = position.getX(i) + originX;
    const worldZ = position.getZ(i);
    const patch = hash2(Math.floor(worldX * 2.3), Math.floor(worldZ * 2.3), 77);
    const tone = 0.82 + patch * 0.36;
    albedo[i * 3] = 0.155 * tone;
    albedo[i * 3 + 1] = 0.185 * tone;
    albedo[i * 3 + 2] = 0.145 * tone;
  }
  const colourAttr = new THREE.BufferAttribute(colours, 3);
  geometry.setAttribute('color', colourAttr);
  if (withShadow) colourAttr.setUsage(THREE.DynamicDrawUsage);
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ vertexColors: true }),
  );
  mesh.name = withShadow ? 'technique-soil' : 'control-soil';
  group.add(mesh);

  // A few blocking forms, identical on both panels so the light is the only variable.
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.4), formMaterial);
  box.name = 'blocking-crag';
  box.position.set(-2.2, 0.55, 1.2);
  box.rotation.y = 0.5;
  group.add(box);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.2, 7), formMaterial);
  spire.name = 'blocking-spire';
  spire.position.set(2.0, 1.1, -1.4);
  group.add(spire);
  const boulder = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), formMaterial);
  boulder.name = 'blocking-boulder';
  boulder.position.set(1.8, 0.35, 2.2);
  boulder.rotation.y = 0.9;
  group.add(boulder);

  group.position.x = originX;
  return { group, geometry, colours, albedo, originX };
}

/** Sun factor at a ground point: 1 in the open, floored inside cloud shadow. */
export function sunFactor(worldX: number, worldZ: number, time: number): number {
  const cover = coverageField(
    worldX * SHADOW_PARAMS.fieldScale,
    worldZ * SHADOW_PARAMS.fieldScale,
    time,
    CLOUD_SEED,
    0.55,
  );
  return 1 - SHADOW_PARAMS.shadowStrength * cover;
}

export function createDemo(context: DemoContext): DemoInstance {
  const { THREE } = context;
  const root = new THREE.Group();
  root.name = 'source-51-cloud-shadows';

  const formMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.24, 0.23, 0.22),
    roughness: 0.92,
    metalness: 0.0,
  });

  const separation = SHADOW_PARAMS.panelSize + 2;
  const control = buildGroundPanel(THREE, -separation / 2, false, formMaterial);
  const technique = buildGroundPanel(THREE, separation / 2, true, formMaterial);
  control.group.name = 'control';
  technique.group.name = 'technique';
  root.add(control.group, technique.group);

  const paintGround = (panel: GroundPanel, time: number, shadowed: boolean): void => {
    const position = panel.geometry.getAttribute('position');
    for (let i = 0; i < position.count; i += 1) {
      const worldX = position.getX(i) + panel.originX;
      const worldZ = position.getZ(i);
      const sun = shadowed ? sunFactor(worldX, worldZ, time) : 1;
      const light = SHADOW_PARAMS.ambientFloor + 0.85 * sun;
      panel.colours[i * 3] = panel.albedo[i * 3] * light;
      panel.colours[i * 3 + 1] = panel.albedo[i * 3 + 1] * light;
      panel.colours[i * 3 + 2] = panel.albedo[i * 3 + 2] * light;
    }
    panel.geometry.getAttribute('color').needsUpdate = true;
  };
  paintGround(control, 0, false);
  paintGround(technique, 0, true);

  // The deck: the same field, sampled into alpha every frame at the same clock.
  const deckBytes = new Uint8ClampedArray(
    SHADOW_PARAMS.deckWidth * SHADOW_PARAMS.deckHeight * 4,
  );
  const deckData = new Uint8Array(
    deckBytes.buffer,
    deckBytes.byteOffset,
    deckBytes.byteLength,
  );
  const deckTexture = new THREE.DataTexture(
    deckData,
    SHADOW_PARAMS.deckWidth,
    SHADOW_PARAMS.deckHeight,
    THREE.RGBAFormat,
  );
  deckTexture.colorSpace = THREE.SRGBColorSpace;
  deckTexture.minFilter = THREE.LinearFilter;
  deckTexture.magFilter = THREE.LinearFilter;

  const paintDeck = (time: number): void => {
    const w = SHADOW_PARAMS.deckWidth;
    const h = SHADOW_PARAMS.deckHeight;
    for (let j = 0; j < h; j += 1) {
      const v = ((j + 0.5) / h - 0.5) * DECK_V_SPAN;
      for (let i = 0; i < w; i += 1) {
        const u = ((i + 0.5) / w - 0.5) * DECK_U_SPAN;
        const cover = coverageField(u, v, time, CLOUD_SEED, 0.55);
        const k = (j * w + i) * 4;
        deckBytes[k] = 34;
        deckBytes[k + 1] = 39;
        deckBytes[k + 2] = 49;
        deckBytes[k + 3] = Math.round(cover * 0.92 * 255);
      }
    }
    deckTexture.needsUpdate = true;
  };
  paintDeck(0);

  const deck = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 14),
    new THREE.MeshBasicMaterial({
      map: deckTexture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  deck.name = 'cloud-deck';
  deck.rotation.x = Math.PI / 2;
  deck.position.set(0, 7.5, 0);
  root.add(deck);

  const backdropGeometry = new THREE.PlaneGeometry(44, 18);
  paintVerticalGradient(
    THREE,
    backdropGeometry,
    [0.36, 0.3, 0.26],
    [0.07, 0.1, 0.14],
  );
  const backdrop = new THREE.Mesh(
    backdropGeometry,
    new THREE.MeshBasicMaterial({ vertexColors: true }),
  );
  backdrop.name = 'hazy-sky';
  backdrop.position.set(0, 6, -10);
  root.add(backdrop);

  let elapsed = 0;
  const comparison: DemoComparison = {
    control: 'Sun only — flat light, no extinction',
    technique: 'Sun × cloud coverage from the same field as the deck overhead',
    controlPosition: 'left',
  };

  const metadata: DemoMetadata & { counters: Record<string, number> } = {
    sourceId: 51,
    title: 'Cloud shadows that agree with the cloud deck (sun × coverage)',
    method:
      'The overhead deck and the ground shadow sample one coverage field at the '
      + 'same clock with the same wind vector: the deck bakes it into alpha every '
      + 'frame, and each shadowed ground vertex multiplies its sun term by one minus '
      + 'the field at its own world position. The control panel keeps the same albedo '
      + 'and the same blocking forms under flat sun, so the shadow is the only variable.',
    adaptation: 'adapted',
    sources: [...SOURCE_URLS],
    limitation:
      'The projection is vertical (a high-sun approximation); a low sun would slant '
      + 'shadows away from their clouds and nothing here models that. The shadow lives '
      + 'in ground vertex colours only — the blocking forms are lit by the host rig and '
      + 'neither cast nor catch it. Deck and ground re-sample every frame on the CPU '
      + '(see notes for the measured per-frame cost); the shipping form is the same '
      + 'field sampled per fragment in TSL.',
    comparison,
    counters: {
      groundVertices: technique.geometry.getAttribute('position').count,
      deckTexels: SHADOW_PARAMS.deckWidth * SHADOW_PARAMS.deckHeight,
      meshes: 8,
      windU: CLOUD_WIND.u,
      windV: CLOUD_WIND.v,
    },
  };

  return {
    root,
    update: (_time: number, dt: number) => {
      elapsed += dt;
      paintDeck(elapsed);
      paintGround(technique, elapsed, true);
    },
    dispose: () => disposeTree(root),
    metadata,
  };
}

export default createDemo;
