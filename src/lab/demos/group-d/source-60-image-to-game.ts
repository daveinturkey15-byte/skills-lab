/**
 * Source 60 — Tesana hosted AI game maker with Image to Game (comparator).
 *
 * The catalogue row is a comparator: a proprietary hosted product offering
 * image-conditioned whole-game generation as a consumer surface. There is no
 * source, no commit to pin and no licence for the service, and the vendor's
 * "about five minutes" and look-and-feel claims are untested here — so nothing
 * on screen reproduces Tesana output or accepts its claims.
 *
 * What this exhibit does is stage the product CATEGORY with our own assets: a
 * synthetic concept panel (baked here, not supplied anywhere) beside a small
 * diorama whose volumes are derived from that panel's own regions — ridge
 * line as skyline, palette bands as block colours — plus one pacing mover,
 * which is the half no single image can supply. The derivation is
 * hand-placed and labelled as such; it illustrates what "image to game" would
 * have to bridge, not a working bridge.
 */

import type {
  DemoComparison,
  DemoContext,
  DemoInstance,
  DemoMetadata,
} from '../../types';
import { createRng, disposeTree, fbm2 } from './shared';

export const SOURCE_URLS = [
  'https://x.com/tesanaai',
  'https://tesana.ai/',
  'https://tesana.ai/en/blog/introducing-image-to-game',
] as const;

/** Concept-panel bake resolution; construction constants, not claims. */
export const PANEL_WIDTH = 96;
export const PANEL_HEIGHT = 64;

function bakeConceptPanel(seed: number): Uint8Array {
  const data = new Uint8Array(PANEL_WIDTH * PANEL_HEIGHT * 4);
  for (let y = 0; y < PANEL_HEIGHT; y += 1) {
    const v = y / (PANEL_HEIGHT - 1);
    for (let x = 0; x < PANEL_WIDTH; x += 1) {
      const u = x / (PANEL_WIDTH - 1);
      // Sky gradient warming toward a low sun on the right.
      const sun = Math.exp(-(((u - 0.72) ** 2) / 0.02 + ((v - 0.42) ** 2) / 0.05));
      let r = 0.10 + 0.25 * (1 - v) + 0.65 * sun;
      let g = 0.18 + 0.18 * (1 - v) + 0.38 * sun;
      let b = 0.28 + 0.10 * (1 - v) + 0.12 * sun;
      // Ridgeline from shared fbm: the same field the diorama samples.
      const ridge = 0.34 + 0.22 * fbm2(u * 3.1, 7.7, 3, seed);
      if (v > ridge) {
        const rock = 0.75 + 0.25 * fbm2(u * 9.0, v * 9.0, 2, seed + 31);
        r = 0.24 * rock;
        g = 0.29 * rock;
        b = 0.33 * rock;
      }
      if (v > ridge + 0.22) {
        r = 0.30;
        g = 0.36;
        b = 0.26;
      }
      const i = (y * PANEL_WIDTH + x) * 4;
      data[i] = Math.round(Math.min(1, r) * 255);
      data[i + 1] = Math.round(Math.min(1, g) * 255);
      data[i + 2] = Math.round(Math.min(1, b) * 255);
      data[i + 3] = 255;
    }
  }
  return data;
}

export function createDemo(context: DemoContext): DemoInstance {
  const { THREE, seed } = context;
  const root = new THREE.Group();
  root.name = 'source-60-image-to-game-surface';
  const rng = createRng(seed ^ 0x7e5a1);

  const palette = {
    sky: new THREE.Color(0x2b4a63),
    ridge: new THREE.Color(0x3d4a55),
    ground: new THREE.Color(0x4d5c43),
    ember: new THREE.Color(0xd97b2f),
  };

  // BEFORE — the flat input: our synthetic concept panel, nothing more.
  const panelTexture = new THREE.DataTexture(
    bakeConceptPanel(seed),
    PANEL_WIDTH,
    PANEL_HEIGHT,
    THREE.RGBAFormat,
  );
  panelTexture.colorSpace = THREE.SRGBColorSpace;
  panelTexture.magFilter = THREE.LinearFilter;
  panelTexture.minFilter = THREE.LinearFilter;
  panelTexture.needsUpdate = true;
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 1.0),
    new THREE.MeshBasicMaterial({ map: panelTexture }),
  );
  panel.name = 'control:flat-concept-panel';
  panel.position.set(-1.35, 1.0, 0);
  panel.rotation.y = Math.PI / 4;
  root.add(panel);

  // AFTER — the derived diorama: ridge field as skyline blocks, palette bands
  // as block colours, plus the one thing no image supplies: a mover.
  const diorama = new THREE.Group();
  diorama.name = 'technique:derived-diorama';
  diorama.position.set(1.15, 0, 0);
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.18, 1.3),
    new THREE.MeshStandardMaterial({ color: palette.ground, roughness: 0.95 }),
  );
  slab.position.y = 0.09;
  slab.name = 'ground-slab';
  diorama.add(slab);
  const blockColours = [palette.ridge, palette.sky, palette.ridge, palette.ground, palette.sky, palette.ember];
  for (let i = 0; i < 6; i += 1) {
    const u = (i + 0.5) / 6;
    const ridge = 0.34 + 0.22 * fbm2(u * 3.1, 7.7, 3, seed);
    const height = 0.25 + ridge * 1.1 + rng() * 0.1;
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, height, 0.24),
      new THREE.MeshStandardMaterial({
        color: blockColours[i % blockColours.length],
        roughness: 0.8,
        flatShading: true,
      }),
    );
    block.position.set(-0.62 + i * 0.25, 0.18 + height / 2, (rng() - 0.5) * 0.5);
    block.name = `derived-block-${i}`;
    diorama.add(block);
  }
  const mover = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.16, 0.16),
    new THREE.MeshBasicMaterial({ color: palette.ember, toneMapped: false }),
  );
  mover.name = 'mover:the-half-no-image-supplies';
  mover.position.set(0, 0.55, 0.35);
  diorama.add(mover);
  root.add(diorama);

  // The pipeline arrow between them: a diagram element, not a world object.
  const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0x9aa4ad });
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.07, 0.07), arrowMaterial);
  shaft.position.set(-0.3, 1.0, 0.1);
  shaft.rotation.y = Math.PI / 4;
  shaft.name = 'pipeline-arrow-shaft';
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.26, 10), arrowMaterial);
  head.position.set(0.02, 1.0, -0.12);
  head.rotation.set(Math.PI / 2, 0, -Math.PI / 4 - Math.PI / 2);
  head.name = 'pipeline-arrow-head';
  root.add(shaft, head);

  const comparison: DemoComparison = {
    control: 'Single image — flat, no depth, nothing moves',
    technique: 'Image-derived diorama: regions as volumes, ridge as skyline, plus a mover',
    controlPosition: 'left',
  };

  const metadata: DemoMetadata & { counters: Record<string, number> } = {
    sourceId: 60,
    title: 'Image-to-game surface: concept panel beside its derived diorama',
    method:
      'Bake a synthetic concept panel in code, sample its own ridge field and palette '
      + 'bands back out, and raise them as diorama volumes — skyline blocks from the ridge, '
      + 'block colours from the bands — with one pacing mover standing in for the motion '
      + 'half no image contains. The arrow is a diagram of the claim, not a world object.',
    adaptation: 'adapted',
    sources: [...SOURCE_URLS],
    limitation:
      'Comparator-only source: Tesana is a proprietary hosted product with no source, no '
      + 'pin and no licence, so no Tesana input, output or timing is reproduced and the '
      + '"about five minutes" claim is not tested. The concept panel is synthetic input '
      + 'baked by this file, and the derivation is hand-placed from its fields — an '
      + 'illustration of what image-to-game would have to bridge, not a working bridge. '
      + 'No playable loop, no engine export, no prompt surface.',
    comparison,
    counters: {
      panelPixels: PANEL_WIDTH * PANEL_HEIGHT,
      derivedBlocks: 6,
      movers: 1,
    },
  };

  return {
    root,
    update: (time: number) => {
      mover.position.x = Math.sin(time * 0.7) * 0.6;
    },
    dispose: () => disposeTree(root),
    metadata,
  };
}

export default createDemo;
